"use client";

import { buildRichTextVariableNodeAttrsFromSource, buildRichTextVariableSpanMarkup, type RichTextVariableRegistry, type RichTextVariableSource } from "@/features/editor/lib/rich-text-variable";

const BLOCK_TAGS = new Set(["P", "DIV", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6"]);
const RICH_TEXT_PLACEHOLDER = "Double-cliquez pour éditer";

export type RichTextInsertionRange = {
  from: number;
  to: number;
};

export type RichTextEditorInsertionTarget = {
  state: {
    selection: RichTextInsertionRange;
    doc: {
      content: {
        size: number;
      };
    };
    schema: {
      nodes: Record<string, {
        create: (attrs: Record<string, unknown>) => unknown;
      }>;
    };
  };
  commands: {
    focus: () => void;
    insertContentAt: (position: RichTextInsertionRange, content: { type: string; attrs: Record<string, unknown> }) => void;
  };
};

export function insertVariableTokenIntoRichTextEditor(
  editor: RichTextEditorInsertionTarget,
  source: RichTextVariableSource,
  selection: RichTextInsertionRange | null | undefined,
  registry?: RichTextVariableRegistry | null,
) {
  const attrs = buildRichTextVariableNodeAttrsFromSource(source, registry);
  if (!attrs) {
    return { inserted: false as const, reason: "empty-token" as const };
  }

  const targetSelection = normalizeRichTextInsertionRange(selection ?? editor.state.selection, editor.state.doc.content.size);
  editor.commands.insertContentAt(targetSelection, {
    type: "variable",
    attrs,
  });
  editor.commands.focus();

  return {
    inserted: true as const,
    range: targetSelection,
    attrs,
  };
}

export function insertVariableTokenIntoRichTextHtml(html: string, source: RichTextVariableSource) {
  const attrs = buildRichTextVariableNodeAttrsFromSource(source);
  if (!attrs) {
    return html;
  }

  const baseHtml = html.trim().length > 0 ? html : "<p></p>";
  const variableHtml = buildRichTextVariableSpanMarkup(attrs);

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(baseHtml, "text/html");
    if (doc.body.textContent?.trim() === RICH_TEXT_PLACEHOLDER) {
      doc.body.innerHTML = `<p>${variableHtml}</p>`;
      return doc.body.innerHTML;
    }

    const blockElements = Array.from(doc.body.children);
    const lastBlock = [...blockElements].reverse().find((element) => BLOCK_TAGS.has(element.tagName));

    if (lastBlock) {
      const separator = lastBlock.textContent?.trim().length ? " " : "";
      lastBlock.insertAdjacentHTML("beforeend", `${separator}${variableHtml}`);
      return doc.body.innerHTML;
    }

    const paragraph = doc.createElement("p");
    paragraph.insertAdjacentHTML("beforeend", variableHtml);
    doc.body.appendChild(paragraph);
    return doc.body.innerHTML;
  }

  return appendTokenWithoutDomParser(baseHtml, variableHtml);
}

function appendTokenWithoutDomParser(html: string, tokenHtml: string) {
  const paragraphTail = /<\/p>\s*$/i;
  const emptyParagraphTail = /<p>\s*<\/p>\s*$/i;
  const placeholderParagraph = /<p>\s*Double-cliquez pour éditer\s*<\/p>\s*$/i;

  if (!html.trim().length) {
    return `<p>${tokenHtml}</p>`;
  }

  if (placeholderParagraph.test(html)) {
    return html.replace(placeholderParagraph, `<p>${tokenHtml}</p>`);
  }

  if (emptyParagraphTail.test(html)) {
    return html.replace(emptyParagraphTail, `<p>${tokenHtml}</p>`);
  }

  if (paragraphTail.test(html)) {
    return html.replace(paragraphTail, ` ${tokenHtml}</p>`);
  }

  return `${html}<p>${tokenHtml}</p>`;
}

function normalizeRichTextInsertionRange(range: RichTextInsertionRange, docSize: number): RichTextInsertionRange {
  const start = clampRichTextInsertionPosition(range.from, docSize);
  const end = clampRichTextInsertionPosition(range.to, docSize);
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}

function clampRichTextInsertionPosition(position: number, docSize: number) {
  if (!Number.isFinite(position)) {
    return 0;
  }

  return Math.max(0, Math.min(position, docSize));
}
