"use client";

import {
  generateHTML,
  generateJSON,
  type JSONContent,
  mergeAttributes,
  Node,
  nodeInputRule,
  nodePasteRule,
} from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  resolveVariableDisplayKind,
  resolveVariableDisplayLabel,
  resolveVariableMappedPath,
  resolveVariableValue,
  type VariableDisplayKind,
} from "@/features/data-mapping/lib/variable-display";
import type { MappingVariable } from "@/features/data-mapping/types";

export type RichTextVariableDisplayMode = "label" | "technical" | "value";

export type RichTextVariableNodeAttrs = {
  id: string;
  key: string;
  label: string;
  fallback: string;
  source: string;
  bold?: boolean | null;
  italic?: boolean | null;
  underline?: boolean | null;
  strike?: boolean | null;
  color?: string | null;
  fontSize?: string | null;
  fontFamily?: string | null;
};

export type RichTextVariableRegistryEntry = RichTextVariableNodeAttrs & {
  sampleValue: string;
  sourceColumn: string | null;
  type: VariableDisplayKind;
  enabled: boolean;
};

export type RichTextVariableRegistry = {
  entries: RichTextVariableRegistryEntry[];
  byKey: Map<string, RichTextVariableRegistryEntry>;
  byLabel: Map<string, RichTextVariableRegistryEntry>;
  byToken: Map<string, RichTextVariableRegistryEntry>;
};

export type RichTextVariableSource = {
  label?: unknown;
  token?: unknown;
  mappedPath?: unknown;
  key?: unknown;
  sourceColumn?: unknown;
  sampleValue?: unknown;
};

export type RichTextVariableExtensionOptions = {
  displayMode?: RichTextVariableDisplayMode;
  dataset?: unknown;
  registry?: RichTextVariableRegistry;
};

const VARIABLE_NODE_NAME = "variable";
const VARIABLE_TOKEN_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g;
const VARIABLE_LABEL_REGEX = /\[\s*([^\]]+?)\s*\]/g;

const EMPTY_VARIABLE_REGISTRY: RichTextVariableRegistry = {
  entries: [],
  byKey: new Map(),
  byLabel: new Map(),
  byToken: new Map(),
};

export function createRichTextVariableRegistry(
  variables: MappingVariable[],
): RichTextVariableRegistry {
  const entries = variables
    .filter((variable) => variable.enabled)
    .map((variable) => {
      const mappedPath = resolveVariableMappedPath(variable);
      const label = normalizeBracketedLabel(resolveVariableDisplayLabel(variable));
      const fallback = label || normalizeVariableKey(mappedPath) || "Variable";
      const source = resolveRichTextVariableSource(mappedPath, variable.sourceColumn ?? null);
      return {
        id: mappedPath,
        key: mappedPath,
        label,
        fallback,
        source,
        sampleValue: variable.sampleValue || label || mappedPath,
        sourceColumn: variable.sourceColumn ?? null,
        type: resolveVariableDisplayKind(variable),
        enabled: variable.enabled,
      } satisfies RichTextVariableRegistryEntry;
    });

  return {
    entries,
    byKey: new Map(entries.map((entry) => [normalizeRegistryKey(entry.key), entry] as const)),
    byLabel: new Map(entries.map((entry) => [normalizeRegistryKey(entry.label), entry] as const)),
    byToken: new Map(
      entries.flatMap((entry) => [
        [`{{${normalizeRegistryKey(entry.key)}}}`, entry] as const,
        [`[${normalizeRegistryKey(entry.label)}]`, entry] as const,
      ]),
    ),
  };
}

export function buildRichTextVariableNodeAttrsFromSource(
  source: RichTextVariableSource,
  registry?: RichTextVariableRegistry | null,
): RichTextVariableNodeAttrs | null {
  const mappedPath = normalizeVariableKey(
    asString(source.mappedPath) ?? asString(source.key) ?? "",
  );
  const token = asString(source.token) ?? "";
  const labelCandidate = normalizeBracketedLabel(asString(source.label) ?? token);
  const registryEntry = resolveRichTextVariableRegistryEntry(source, registry);

  if (registryEntry) {
    return {
      id: registryEntry.id,
      key: registryEntry.key,
      label: registryEntry.label,
      fallback: registryEntry.fallback,
      source: registryEntry.source,
    };
  }

  const canonicalKey = mappedPath || normalizeVariableKey(stripVariableBrackets(token));
  if (!canonicalKey) {
    return null;
  }

  const fallback = labelCandidate || canonicalKey;
  return {
    id: canonicalKey,
    key: canonicalKey,
    label: fallback,
    fallback,
    source: resolveRichTextVariableSource(canonicalKey, asString(source.sourceColumn) ?? null),
  };
}

export function resolveRichTextVariableValue(
  attrs: Pick<RichTextVariableNodeAttrs, "key" | "fallback" | "label">,
  mode: RichTextVariableDisplayMode,
  dataset?: unknown,
) {
  const safeKey = attrs.key?.trim() || "variable";
  const safeFallback = attrs.fallback?.trim() || attrs.label?.trim() || safeKey;
  const safeLabel =
    normalizeBracketedLabel(attrs.label || safeFallback || safeKey) || safeFallback || safeKey;

  if (mode === "technical") {
    return `{{${safeKey}}}`;
  }

  if (mode === "value") {
    const resolvedValue = resolveVariableValue(safeKey, dataset, safeFallback);
    return resolvedValue || safeFallback || safeLabel || `{{${safeKey}}}`;
  }

  return safeLabel ? `[${safeLabel}]` : `[${safeFallback}]`;
}

export function normalizeRichTextVariableHtml(
  html: string,
  registry?: RichTextVariableRegistry | null,
) {
  const baseHtml = html.trim().length > 0 ? html : "<p></p>";
  const resolvedRegistry = registry ?? EMPTY_VARIABLE_REGISTRY;

  if (typeof DOMParser === "undefined" || typeof document === "undefined") {
    return replaceVariableTokensInHtmlFallback(baseHtml, resolvedRegistry);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(baseHtml, "text/html");
  normalizeRichTextHtmlNodes(doc.body, resolvedRegistry);
  return doc.body.innerHTML.trim().length > 0 ? doc.body.innerHTML : baseHtml;
}

export function normalizeRichTextJsonWithVariables(
  content: JSONContent,
  registry?: RichTextVariableRegistry | null,
): JSONContent {
  if (!content || typeof content !== "object") {
    return content;
  }

  const resolvedRegistry = registry ?? EMPTY_VARIABLE_REGISTRY;
  const nextContent = Array.isArray(content.content)
    ? content.content.flatMap((child) => normalizeRichTextJsonNode(child, resolvedRegistry))
    : undefined;

  return {
    ...content,
    content: nextContent,
  };
}

export function parseRichTextHtmlToJson(
  html: string,
  registry?: RichTextVariableRegistry | null,
): JSONContent {
  const normalizedHtml = normalizeRichTextVariableHtml(html, registry);
  if (typeof DOMParser === "undefined" || typeof document === "undefined") {
    return fallbackParseRichTextHtmlToJson(normalizedHtml, registry ?? EMPTY_VARIABLE_REGISTRY);
  }

  const json = generateJSON(
    normalizedHtml,
    buildRichTextBaseExtensions("label", registry ?? EMPTY_VARIABLE_REGISTRY),
  );
  return normalizeRichTextJsonWithVariables(json, registry);
}

export function serializeRichTextJsonToHtml(
  content: JSONContent,
  options?: {
    displayMode?: RichTextVariableDisplayMode;
    registry?: RichTextVariableRegistry | null;
    dataset?: unknown;
  },
): string {
  const displayMode = options?.displayMode ?? "label";
  const registry = options?.registry ?? EMPTY_VARIABLE_REGISTRY;
  const normalized = normalizeRichTextJsonWithVariables(content, registry);
  if (typeof document === "undefined" || typeof window === "undefined") {
    return fallbackSerializeRichTextJsonToHtml(normalized, {
      displayMode,
      registry,
      dataset: options?.dataset,
    });
  }

  return generateHTML(
    normalized,
    buildRichTextBaseExtensions(displayMode, registry, options?.dataset),
  );
}

export function createRichTextBaseExtensions(
  displayMode: RichTextVariableDisplayMode = "label",
  registry: RichTextVariableRegistry = EMPTY_VARIABLE_REGISTRY,
  dataset?: unknown,
) {
  return buildRichTextBaseExtensions(displayMode, registry, dataset);
}

export function createRichTextVariableNodeViewHtml(
  attrs: RichTextVariableNodeAttrs,
  displayMode: RichTextVariableDisplayMode = "label",
  dataset?: unknown,
) {
  return {
    "data-variable": "true",
    "data-variable-id": attrs.id,
    "data-variable-key": attrs.key,
    "data-variable-label": attrs.label,
    "data-variable-fallback": attrs.fallback,
    "data-variable-source": attrs.source,
    "data-variable-display-mode": displayMode,
    class: ["ef-rich-text-variable-node", `is-${displayMode}`].join(" "),
    "data-type": "variable",
    text: resolveRichTextVariableValue(attrs, displayMode, dataset),
  };
}

export function buildRichTextVariableSpanMarkup(
  attrs: RichTextVariableNodeAttrs,
  displayMode: RichTextVariableDisplayMode = "label",
  dataset?: unknown,
) {
  const text = escapeHtml(resolveRichTextVariableValue(attrs, displayMode, dataset));
  const inlineStyle = buildVariableInlineStyle(attrs);
  const styleAttr = inlineStyle ? ` style="${escapeHtml(inlineStyle)}"` : "";
  const dataVAttrs = [
    attrs.bold ? ' data-v-bold="true"' : "",
    attrs.italic ? ' data-v-italic="true"' : "",
    attrs.underline ? ' data-v-underline="true"' : "",
    attrs.strike ? ' data-v-strike="true"' : "",
    attrs.color ? ` data-v-color="${escapeHtml(attrs.color)}"` : "",
    attrs.fontSize ? ` data-v-font-size="${escapeHtml(attrs.fontSize)}"` : "",
    attrs.fontFamily ? ` data-v-font-family="${escapeHtml(attrs.fontFamily)}"` : "",
  ].join("");
  return `<span data-variable="true" data-variable-id="${escapeHtml(attrs.id)}" data-variable-key="${escapeHtml(attrs.key)}" data-variable-label="${escapeHtml(attrs.label)}" data-variable-fallback="${escapeHtml(attrs.fallback)}" data-variable-source="${escapeHtml(attrs.source)}" data-variable-display-mode="${displayMode}"${dataVAttrs}${styleAttr} class="ef-rich-text-variable-node is-${displayMode}">${text}</span>`;
}

export function resolveRichTextVariableNodeAttrsFromPayload(
  payload: RichTextVariableSource,
  registry?: RichTextVariableRegistry | null,
): RichTextVariableNodeAttrs | null {
  return buildRichTextVariableNodeAttrsFromSource(payload, registry);
}

export const RichTextVariableNode = Node.create({
  name: VARIABLE_NODE_NAME,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      displayMode: "label" as RichTextVariableDisplayMode,
      dataset: undefined,
      registry: EMPTY_VARIABLE_REGISTRY,
    };
  },

  addAttributes() {
    return {
      id: { default: null },
      key: { default: null },
      label: { default: null },
      fallback: { default: null },
      source: { default: null },
      bold: {
        default: null,
        parseHTML: (el) => (el.getAttribute("data-v-bold") === "true" ? true : null),
      },
      italic: {
        default: null,
        parseHTML: (el) => (el.getAttribute("data-v-italic") === "true" ? true : null),
      },
      underline: {
        default: null,
        parseHTML: (el) => (el.getAttribute("data-v-underline") === "true" ? true : null),
      },
      strike: {
        default: null,
        parseHTML: (el) => (el.getAttribute("data-v-strike") === "true" ? true : null),
      },
      color: { default: null, parseHTML: (el) => el.getAttribute("data-v-color") || null },
      fontSize: { default: null, parseHTML: (el) => el.getAttribute("data-v-font-size") || null },
      fontFamily: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-v-font-family") || null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable="true"]',
      },
    ];
  },

  renderHTML({ node }) {
    const attrs = node.attrs as Record<string, unknown>;
    const normalizedAttrs: RichTextVariableNodeAttrs = {
      id: asString(attrs.id) ?? asString(attrs.key) ?? "",
      key: asString(attrs.key) ?? asString(attrs.id) ?? "",
      label: normalizeBracketedLabel(asString(attrs.label) ?? ""),
      fallback: normalizeBracketedLabel(asString(attrs.fallback) ?? asString(attrs.label) ?? ""),
      source: asString(attrs.source) ?? "",
      bold: typeof attrs.bold === "boolean" ? attrs.bold : null,
      italic: typeof attrs.italic === "boolean" ? attrs.italic : null,
      underline: typeof attrs.underline === "boolean" ? attrs.underline : null,
      strike: typeof attrs.strike === "boolean" ? attrs.strike : null,
      color: typeof attrs.color === "string" ? attrs.color : null,
      fontSize: typeof attrs.fontSize === "string" ? attrs.fontSize : null,
      fontFamily: typeof attrs.fontFamily === "string" ? attrs.fontFamily : null,
    };
    const displayMode = this.options.displayMode ?? "label";
    const inlineStyle = buildVariableInlineStyle(normalizedAttrs);

    return [
      "span",
      mergeAttributes({
        "data-variable": "true",
        "data-variable-id": normalizedAttrs.id,
        "data-variable-key": normalizedAttrs.key,
        "data-variable-label": normalizedAttrs.label,
        "data-variable-fallback": normalizedAttrs.fallback,
        "data-variable-source": normalizedAttrs.source,
        "data-variable-display-mode": displayMode,
        class: `ef-rich-text-variable-node is-${displayMode}`,
        ...(inlineStyle ? { style: inlineStyle } : {}),
        ...(normalizedAttrs.bold ? { "data-v-bold": "true" } : {}),
        ...(normalizedAttrs.italic ? { "data-v-italic": "true" } : {}),
        ...(normalizedAttrs.underline ? { "data-v-underline": "true" } : {}),
        ...(normalizedAttrs.strike ? { "data-v-strike": "true" } : {}),
        ...(normalizedAttrs.color ? { "data-v-color": normalizedAttrs.color } : {}),
        ...(normalizedAttrs.fontSize ? { "data-v-font-size": normalizedAttrs.fontSize } : {}),
        ...(normalizedAttrs.fontFamily ? { "data-v-font-family": normalizedAttrs.fontFamily } : {}),
      }),
      resolveRichTextVariableValue(normalizedAttrs, displayMode, this.options.dataset),
    ];
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: new RegExp(VARIABLE_TOKEN_REGEX.source),
        type: this.type,
        getAttributes: (match) => {
          const token = String(match[1] ?? "");
          const attrs = buildRichTextVariableNodeAttrsFromSource(
            { token: `{{${token}}}` },
            this.options.registry,
          );
          return attrs ?? undefined;
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: new RegExp(VARIABLE_TOKEN_REGEX.source),
        type: this.type,
        getAttributes: (match) => {
          const token = String(match[1] ?? "");
          const attrs = buildRichTextVariableNodeAttrsFromSource(
            { token: `{{${token}}}` },
            this.options.registry,
          );
          return attrs ?? undefined;
        },
      }),
      nodePasteRule({
        find: new RegExp(VARIABLE_LABEL_REGEX.source),
        type: this.type,
        getAttributes: (match) => {
          const label = String(match[1] ?? "");
          const attrs = buildRichTextVariableNodeAttrsFromSource(
            { label: `[${label}]`, token: `[${label}]` },
            this.options.registry,
          );
          return attrs ?? undefined;
        },
      }),
    ];
  },
});

function buildRichTextBaseExtensions(
  displayMode: RichTextVariableDisplayMode,
  registry: RichTextVariableRegistry,
  dataset?: unknown,
) {
  return [
    StarterKit,
    Underline,
    TextStyleKit.configure({
      backgroundColor: {
        types: ["textStyle"],
      },
      color: {
        types: ["textStyle"],
      },
      fontFamily: {
        types: ["textStyle"],
      },
      fontSize: {
        types: ["textStyle"],
      },
      lineHeight: {
        types: ["textStyle"],
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    RichTextVariableNode.configure({
      displayMode,
      registry,
      dataset,
    }),
  ];
}

function normalizeRichTextJsonNode(
  node: JSONContent,
  registry: RichTextVariableRegistry,
): JSONContent[] {
  if (node.type === "text" && typeof node.text === "string") {
    return splitVariableTextNode(node, registry);
  }

  const nextContent = Array.isArray(node.content)
    ? node.content.flatMap((child) => normalizeRichTextJsonNode(child, registry))
    : undefined;

  return [
    {
      ...node,
      content: nextContent,
    },
  ];
}

function splitVariableTextNode(
  node: JSONContent,
  registry: RichTextVariableRegistry,
): JSONContent[] {
  const text = typeof node.text === "string" ? node.text : "";
  if (!text) {
    return [node];
  }

  const marks = Array.isArray(node.marks) ? node.marks : undefined;
  const result: JSONContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const combinedRegex = new RegExp(
    `${VARIABLE_TOKEN_REGEX.source}|${VARIABLE_LABEL_REGEX.source}`,
    "g",
  );

  while ((match = combinedRegex.exec(text))) {
    const matchIndex = match.index;
    const matchedText = match[0];

    if (matchIndex > lastIndex) {
      const beforeText = text.slice(lastIndex, matchIndex);
      if (beforeText.trim().length > 0) {
        result.push({
          type: "text",
          text: beforeText,
          marks,
        });
      }
    }

    const attrs = matchedText.startsWith("{{")
      ? buildRichTextVariableNodeAttrsFromSource({ token: matchedText }, registry)
      : buildRichTextVariableNodeAttrsFromSource(
          { label: matchedText, token: matchedText },
          registry,
        );

    if (attrs) {
      result.push({
        type: VARIABLE_NODE_NAME,
        attrs,
        marks,
      });
    } else {
      result.push({
        type: "text",
        text: matchedText,
        marks,
      });
    }

    lastIndex = matchIndex + matchedText.length;
  }

  if (lastIndex < text.length) {
    const tailText = text.slice(lastIndex);
    if (tailText.trim().length > 0) {
      result.push({
        type: "text",
        text: tailText,
        marks,
      });
    }
  }

  return result.length > 0 ? result : [node];
}

function normalizeRichTextHtmlNodes(root: HTMLElement, registry: RichTextVariableRegistry) {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, 4);

  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current instanceof Text) {
      textNodes.push(current);
    }
  }

  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue ?? "";
    const fragments = buildRichTextVariableFragments(text, registry);
    if (!fragments) {
      return;
    }

    const fragment = document.createDocumentFragment();
    fragments.forEach((fragmentNode) => {
      fragment.append(fragmentNode);
    });
    textNode.parentNode?.replaceChild(fragment, textNode);
  });
}

function buildRichTextVariableFragments(text: string, registry: RichTextVariableRegistry) {
  if (!text.trim().length) {
    return null;
  }

  const combinedRegex = new RegExp(
    `${VARIABLE_TOKEN_REGEX.source}|${VARIABLE_LABEL_REGEX.source}`,
    "g",
  );
  const fragments: (Text | HTMLElement)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text))) {
    const matchedText = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      fragments.push(document.createTextNode(text.slice(lastIndex, matchIndex)));
    }

    const attrs = matchedText.startsWith("{{")
      ? buildRichTextVariableNodeAttrsFromSource({ token: matchedText }, registry)
      : buildRichTextVariableNodeAttrsFromSource(
          { label: matchedText, token: matchedText },
          registry,
        );

    if (attrs) {
      fragments.push(buildRichTextVariableSpanElement(attrs));
    } else {
      fragments.push(document.createTextNode(matchedText));
    }

    lastIndex = matchIndex + matchedText.length;
  }

  if (lastIndex < text.length) {
    fragments.push(document.createTextNode(text.slice(lastIndex)));
  }

  return fragments.length > 0 ? fragments : null;
}

function buildRichTextVariableSpanElement(attrs: RichTextVariableNodeAttrs) {
  const span = document.createElement("span");
  span.setAttribute("data-variable", "true");
  span.setAttribute("data-variable-id", attrs.id);
  span.setAttribute("data-variable-key", attrs.key);
  span.setAttribute("data-variable-label", attrs.label);
  span.setAttribute("data-variable-fallback", attrs.fallback);
  span.setAttribute("data-variable-source", attrs.source);
  span.setAttribute("data-variable-display-mode", "label");
  if (attrs.bold) span.setAttribute("data-v-bold", "true");
  if (attrs.italic) span.setAttribute("data-v-italic", "true");
  if (attrs.underline) span.setAttribute("data-v-underline", "true");
  if (attrs.strike) span.setAttribute("data-v-strike", "true");
  if (attrs.color) span.setAttribute("data-v-color", attrs.color);
  if (attrs.fontSize) span.setAttribute("data-v-font-size", attrs.fontSize);
  if (attrs.fontFamily) span.setAttribute("data-v-font-family", attrs.fontFamily);
  const inlineStyle = buildVariableInlineStyle(attrs);
  if (inlineStyle) span.setAttribute("style", inlineStyle);
  span.className = "ef-rich-text-variable-node is-label";
  span.textContent = resolveRichTextVariableValue(attrs, "label");
  return span;
}

function buildVariableInlineStyle(attrs: RichTextVariableNodeAttrs): string {
  const styles: string[] = [];
  if (attrs.bold) styles.push("font-weight: bold");
  if (attrs.italic) styles.push("font-style: italic");
  const decorations: string[] = [];
  if (attrs.underline) decorations.push("underline");
  if (attrs.strike) decorations.push("line-through");
  if (decorations.length) styles.push(`text-decoration: ${decorations.join(" ")}`);
  if (attrs.color) styles.push(`color: ${attrs.color}`);
  if (attrs.fontSize) styles.push(`font-size: ${attrs.fontSize}`);
  if (attrs.fontFamily) styles.push(`font-family: ${attrs.fontFamily}`);
  return styles.join("; ");
}

function replaceVariableTokensInHtmlFallback(html: string, registry: RichTextVariableRegistry) {
  if (!html.trim().length) {
    return html;
  }

  return html
    .replace(new RegExp(VARIABLE_TOKEN_REGEX.source, "g"), (match, token) => {
      const attrs = buildRichTextVariableNodeAttrsFromSource({ token: `{{${token}}}` }, registry);
      return attrs ? buildRichTextVariableSpanMarkup(attrs, "label") : match;
    })
    .replace(new RegExp(VARIABLE_LABEL_REGEX.source, "g"), (match, label) => {
      const attrs = buildRichTextVariableNodeAttrsFromSource(
        { label: `[${label}]`, token: `[${label}]` },
        registry,
      );
      return attrs ? buildRichTextVariableSpanMarkup(attrs, "label") : match;
    });
}

function resolveRichTextVariableRegistryEntry(
  source: RichTextVariableSource,
  registry?: RichTextVariableRegistry | null,
) {
  if (!registry) {
    return null;
  }

  const token = asString(source.token) ?? "";
  const mappedPath = normalizeVariableKey(asString(source.mappedPath) ?? "");
  const key = normalizeRegistryKey(mappedPath || asString(source.key) || "");
  const label = normalizeRegistryKey(asString(source.label) ?? "");

  if (key && registry.byKey.has(key)) {
    return registry.byKey.get(key) ?? null;
  }

  if (token.startsWith("{{")) {
    const tokenKey = normalizeRegistryKey(stripVariableBrackets(token));
    if (tokenKey && registry.byKey.has(tokenKey)) {
      return registry.byKey.get(tokenKey) ?? null;
    }
  }

  if (label && registry.byLabel.has(label)) {
    return registry.byLabel.get(label) ?? null;
  }

  return null;
}

function resolveRichTextVariableSource(key: string, sourceColumn: string | null) {
  const normalizedKey = normalizeVariableKey(key);
  if (normalizedKey.includes(".")) {
    return normalizedKey.split(".")[0] ?? "variable";
  }

  if (sourceColumn) {
    return normalizeVariableKey(sourceColumn) || "variable";
  }

  return normalizedKey || "variable";
}

function normalizeRegistryKey(value: string) {
  return value.trim().toLowerCase();
}

function normalizeVariableKey(value: string) {
  return stripVariableBrackets(value).trim();
}

function normalizeBracketedLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/^\[|\]$/g, "");
}

function stripVariableBrackets(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("{{") && normalized.endsWith("}}")) {
    return normalized.slice(2, -2).trim();
  }

  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

type FallbackMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type FallbackFrame = {
  kind: "root" | "block" | "mark" | "variable";
  tagName?: string;
  attrs?: Record<string, string>;
  nodeType?: string;
  nodeAttrs?: Record<string, unknown>;
  content: JSONContent[];
  marks: FallbackMark[];
};

function fallbackParseRichTextHtmlToJson(
  html: string,
  registry: RichTextVariableRegistry,
): JSONContent {
  const root: FallbackFrame = {
    kind: "root",
    content: [],
    marks: [],
  };

  const stack: FallbackFrame[] = [root];
  const tokenRegex = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*?>|[^<]+/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html))) {
    const token = match[0];
    if (!token) {
      continue;
    }

    if (token.startsWith("<!--")) {
      continue;
    }

    if (token.startsWith("</")) {
      const tagName = token.slice(2, -1).trim().toLowerCase();
      closeFallbackFrame(stack, tagName);
      continue;
    }

    if (token.startsWith("<")) {
      const parsedTag = parseFallbackTag(token);
      if (!parsedTag) {
        continue;
      }

      if (parsedTag.tagName === "br") {
        appendFallbackNode(stack[stack.length - 1], {
          type: "hardBreak",
        });
        continue;
      }

      if (parsedTag.tagName === "span" && parsedTag.attrs["data-variable"] === "true") {
        stack.push({
          kind: "variable",
          tagName: parsedTag.tagName,
          attrs: parsedTag.attrs,
          nodeType: VARIABLE_NODE_NAME,
          nodeAttrs: fallbackVariableAttrsFromTag(parsedTag.attrs, registry) ?? undefined,
          content: [],
          marks: [...stack[stack.length - 1].marks],
        });
        continue;
      }

      const mark = resolveFallbackMarkFromTag(parsedTag);
      if (mark) {
        stack.push({
          kind: "mark",
          tagName: parsedTag.tagName,
          attrs: parsedTag.attrs,
          content: [],
          marks: [...stack[stack.length - 1].marks, mark],
        });
        continue;
      }

      const block = resolveFallbackBlockFromTag(parsedTag);
      if (block) {
        stack.push({
          kind: "block",
          tagName: parsedTag.tagName,
          attrs: parsedTag.attrs,
          nodeType: block.type,
          nodeAttrs: block.attrs,
          content: [],
          marks: [...stack[stack.length - 1].marks],
        });
      }

      continue;
    }

    const text = decodeHtmlEntities(token);
    if (!text.length) {
      continue;
    }

    const current = stack[stack.length - 1];
    if (current.kind === "variable") {
      continue;
    }

    appendFallbackNode(current, {
      type: "text",
      text,
      marks: current.marks.length > 0 ? current.marks.map((mark) => ({ ...mark })) : undefined,
    });
  }

  while (stack.length > 1) {
    closeFallbackFrame(stack, stack[stack.length - 1].tagName ?? "");
  }

  return {
    type: "doc",
    content: root.content,
  };
}

function closeFallbackFrame(stack: FallbackFrame[], tagName: string) {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    const frame = stack[index];
    if ((frame.tagName ?? "").toLowerCase() !== tagName) {
      continue;
    }

    stack.splice(index);
    const parent = stack[stack.length - 1];

    if (frame.kind === "variable") {
      const attrs = frame.nodeAttrs ?? null;
      if (attrs) {
        appendFallbackNode(parent, {
          type: VARIABLE_NODE_NAME,
          attrs,
          marks: frame.marks.length > 0 ? frame.marks.map((mark) => ({ ...mark })) : undefined,
        });
      }
      return;
    }

    if (frame.kind === "mark") {
      frame.content.forEach((child) => appendFallbackNode(parent, child));
      return;
    }

    if (frame.kind === "block") {
      appendFallbackNode(parent, {
        type: frame.nodeType ?? "paragraph",
        attrs: frame.nodeAttrs,
        content: frame.content.length > 0 ? frame.content : undefined,
        marks: frame.marks.length > 0 ? frame.marks.map((mark) => ({ ...mark })) : undefined,
      });
      return;
    }
  }
}

function appendFallbackNode(frame: FallbackFrame, node: JSONContent) {
  frame.content.push(node);
}

function parseFallbackTag(token: string) {
  const selfClosing = /\/>$/.test(token);
  const match = /^<\/?([a-zA-Z0-9]+)([^>]*)\/?\s*>$/.exec(token);
  if (!match) {
    return null;
  }

  const tagName = match[1]?.toLowerCase() ?? "";
  const attrs = parseFallbackAttributes(match[2] ?? "");
  return {
    tagName,
    attrs,
    selfClosing,
  };
}

function parseFallbackAttributes(raw: string) {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9:-]+)(?:="([^"]*)")?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(raw))) {
    const key = match[1]?.toLowerCase();
    if (!key) {
      continue;
    }

    attrs[key] = decodeHtmlEntities(match[2] ?? "");
  }

  return attrs;
}

function resolveFallbackMarkFromTag(tag: { tagName: string; attrs: Record<string, string> }) {
  switch (tag.tagName) {
    case "strong":
    case "b":
      return { type: "bold" } satisfies FallbackMark;
    case "em":
    case "i":
      return { type: "italic" } satisfies FallbackMark;
    case "u":
      return { type: "underline" } satisfies FallbackMark;
    case "s":
    case "strike":
    case "del":
      return { type: "strike" } satisfies FallbackMark;
    case "code":
      return { type: "code" } satisfies FallbackMark;
    case "a":
      return { type: "link", attrs: { href: tag.attrs.href ?? "" } } satisfies FallbackMark;
    case "span": {
      const style = parseFallbackInlineStyle(tag.attrs.style ?? "");
      if (Object.keys(style).length === 0) {
        return null;
      }
      return { type: "textStyle", attrs: style } satisfies FallbackMark;
    }
    default:
      return null;
  }
}

function resolveFallbackBlockFromTag(tag: { tagName: string; attrs: Record<string, string> }) {
  if (tag.tagName === "p" || tag.tagName === "div") {
    return { type: "paragraph" };
  }

  if (tag.tagName === "blockquote") {
    return { type: "blockquote" };
  }

  if (/^h[1-6]$/.test(tag.tagName)) {
    return { type: "heading", attrs: { level: Number(tag.tagName.slice(1)) } };
  }

  if (tag.tagName === "ul") {
    return { type: "bulletList" };
  }

  if (tag.tagName === "ol") {
    return { type: "orderedList" };
  }

  if (tag.tagName === "li") {
    return { type: "listItem" };
  }

  if (tag.tagName === "table") {
    return { type: "table" };
  }

  if (tag.tagName === "tr") {
    return { type: "tableRow" };
  }

  if (tag.tagName === "th") {
    return { type: "tableHeader" };
  }

  if (tag.tagName === "td") {
    return { type: "tableCell" };
  }

  if (tag.tagName === "thead" || tag.tagName === "tbody") {
    return null;
  }

  return null;
}

function fallbackVariableAttrsFromTag(
  attrs: Record<string, string>,
  registry: RichTextVariableRegistry,
) {
  const styleAttrs = {
    bold: attrs["data-v-bold"] === "true" ? true : null,
    italic: attrs["data-v-italic"] === "true" ? true : null,
    underline: attrs["data-v-underline"] === "true" ? true : null,
    strike: attrs["data-v-strike"] === "true" ? true : null,
    color: attrs["data-v-color"] || null,
    fontSize: attrs["data-v-font-size"] || null,
    fontFamily: attrs["data-v-font-family"] || null,
  };

  const registryEntry =
    (attrs["data-variable-key"] &&
      registry.byKey.get(
        normalizeRegistryKey(stripVariableBrackets(attrs["data-variable-key"])),
      )) ??
    (attrs["data-variable-label"] &&
      registry.byLabel.get(
        normalizeRegistryKey(stripVariableBrackets(attrs["data-variable-label"])),
      )) ??
    null;

  if (registryEntry) {
    return {
      id: registryEntry.id,
      key: registryEntry.key,
      label: registryEntry.label,
      fallback: registryEntry.fallback,
      source: registryEntry.source,
      ...styleAttrs,
    };
  }

  const key = stripVariableBrackets(attrs["data-variable-key"] ?? attrs["data-variable-id"] ?? "");
  if (!key) {
    return null;
  }

  const label = stripVariableBrackets(attrs["data-variable-label"] ?? key);
  return {
    id: attrs["data-variable-id"] ?? key,
    key,
    label: label || key,
    fallback: (attrs["data-variable-fallback"] ?? label) || key,
    source: attrs["data-variable-source"] ?? resolveRichTextVariableSource(key, null),
    ...styleAttrs,
  };
}

function parseFallbackInlineStyle(style: string) {
  const result: Record<string, string> = {};
  style
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [key, value] = entry.split(":");
      if (!key || !value) {
        return;
      }

      const normalizedKey = key.trim().toLowerCase();
      const normalizedValue = value.trim();
      if (normalizedKey === "color") {
        result.color = normalizedValue;
      } else if (normalizedKey === "background-color") {
        result.backgroundColor = normalizedValue;
      } else if (normalizedKey === "font-family") {
        result.fontFamily = normalizedValue;
      } else if (normalizedKey === "font-size") {
        result.fontSize = normalizedValue;
      } else if (normalizedKey === "line-height") {
        result.lineHeight = normalizedValue;
      }
    });

  return result;
}

function fallbackSerializeRichTextJsonToHtml(
  content: JSONContent,
  options: {
    displayMode: RichTextVariableDisplayMode;
    registry: RichTextVariableRegistry;
    dataset?: unknown;
  },
): string {
  return serializeFallbackNode(content, options);
}

function serializeFallbackNode(
  node: JSONContent,
  options: {
    displayMode: RichTextVariableDisplayMode;
    registry: RichTextVariableRegistry;
    dataset?: unknown;
  },
): string {
  if (node.type === "doc") {
    return serializeFallbackFragment(node.content ?? [], options);
  }

  if (node.type === VARIABLE_NODE_NAME) {
    const attrs = normalizeFallbackVariableNodeAttrs(node.attrs);
    const markup = buildRichTextVariableSpanMarkup(attrs, options.displayMode, options.dataset);
    return wrapFallbackMarks(markup, node.marks);
  }

  if (node.type === "text") {
    const text = escapeHtml(typeof node.text === "string" ? node.text : "");
    return wrapFallbackMarks(text, node.marks);
  }

  if (node.type === "hardBreak") {
    return "<br />";
  }

  const children = serializeFallbackFragment(node.content ?? [], options);

  switch (node.type) {
    case "paragraph":
      return `<p>${children}</p>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "heading": {
      const level =
        typeof node.attrs?.level === "number" ? Math.min(6, Math.max(1, node.attrs.level)) : 1;
      return `<h${level}>${children}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "table":
      return `<table>${children}</table>`;
    case "tableRow":
      return `<tr>${children}</tr>`;
    case "tableHeader":
      return `<th>${children}</th>`;
    case "tableCell":
      return `<td>${children}</td>`;
    default:
      return children;
  }
}

function serializeFallbackFragment(
  content: JSONContent[],
  options: {
    displayMode: RichTextVariableDisplayMode;
    registry: RichTextVariableRegistry;
    dataset?: unknown;
  },
) {
  return content.map((child) => serializeFallbackNode(child, options)).join("");
}

function wrapFallbackMarks(html: string, marks?: JSONContent["marks"]) {
  if (!Array.isArray(marks) || marks.length === 0) {
    return html;
  }

  return marks
    .slice()
    .reverse()
    .reduce((acc, mark) => {
      if (!mark || typeof mark.type !== "string") {
        return acc;
      }

      switch (mark.type) {
        case "bold":
          return `<strong>${acc}</strong>`;
        case "italic":
          return `<em>${acc}</em>`;
        case "underline":
          return `<u>${acc}</u>`;
        case "strike":
          return `<s>${acc}</s>`;
        case "code":
          return `<code>${acc}</code>`;
        case "link": {
          const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
          return `<a href="${escapeHtml(href)}">${acc}</a>`;
        }
        case "textStyle": {
          const style = serializeFallbackTextStyle(mark.attrs);
          return style ? `<span style="${escapeHtml(style)}">${acc}</span>` : acc;
        }
        default:
          return acc;
      }
    }, html);
}

function serializeFallbackTextStyle(attrs: unknown) {
  if (!attrs || typeof attrs !== "object") {
    return "";
  }

  const record = attrs as Record<string, unknown>;
  const styles: string[] = [];
  const color = typeof record.color === "string" ? record.color : null;
  const backgroundColor =
    typeof record.backgroundColor === "string" ? record.backgroundColor : null;
  const fontFamily = typeof record.fontFamily === "string" ? record.fontFamily : null;
  const fontSize = typeof record.fontSize === "string" ? record.fontSize : null;
  const lineHeight = typeof record.lineHeight === "string" ? record.lineHeight : null;

  if (color) {
    styles.push(`color: ${color}`);
  }
  if (backgroundColor) {
    styles.push(`background-color: ${backgroundColor}`);
  }
  if (fontFamily) {
    styles.push(`font-family: ${fontFamily}`);
  }
  if (fontSize) {
    styles.push(`font-size: ${fontSize}`);
  }
  if (lineHeight) {
    styles.push(`line-height: ${lineHeight}`);
  }

  return styles.join("; ");
}

function normalizeFallbackVariableNodeAttrs(attrs: unknown): RichTextVariableNodeAttrs {
  const record = attrs && typeof attrs === "object" ? (attrs as Record<string, unknown>) : {};
  const id =
    typeof record.id === "string" ? record.id : typeof record.key === "string" ? record.key : "";
  const key = typeof record.key === "string" ? record.key : id;
  const label = normalizeBracketedLabel(typeof record.label === "string" ? record.label : key);
  const fallback = normalizeBracketedLabel(
    typeof record.fallback === "string" ? record.fallback : label || key,
  );
  const source =
    typeof record.source === "string" ? record.source : resolveRichTextVariableSource(key, null);

  return {
    id,
    key,
    label,
    fallback,
    source,
    bold: record.bold === true ? true : null,
    italic: record.italic === true ? true : null,
    underline: record.underline === true ? true : null,
    strike: record.strike === true ? true : null,
    color: typeof record.color === "string" ? record.color : null,
    fontSize: typeof record.fontSize === "string" ? record.fontSize : null,
    fontFamily: typeof record.fontFamily === "string" ? record.fontFamily : null,
  };
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
