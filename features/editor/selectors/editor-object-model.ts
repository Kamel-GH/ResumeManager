import type { TemplateElement, TemplateSchema } from "@/features/editor/schema/template-schema";

export type EditorObjectLayerIdentity = {
  key: string;
  name: string;
  order: number | null;
  visible: boolean | null;
  locked: boolean | null;
};

export type EditorObjectGrouping = {
  grouped: boolean | null;
  groupId: string | null;
};

export function resolveEditorObjectFallbackLayerId(template: TemplateSchema, pageId: string) {
  const pageElements = template.elements.filter((element) => element.pageId === pageId);
  if (pageElements.length === 0) {
    return null;
  }

  const explicitLayerKeys = new Set(
    pageElements
      .map((element) => readElementPropString(element, "layerId") ?? readElementPropString(element, "layerName"))
      .filter((value): value is string => Boolean(value)),
  );

  if (explicitLayerKeys.size === 1) {
    return explicitLayerKeys.values().next().value ?? null;
  }

  return `${pageId}:layer-1`;
}

export function resolveEditorObjectLayerIdentity(element: TemplateElement, fallbackLayerId: string | null): EditorObjectLayerIdentity | null {
  const layerId = readElementPropString(element, "layerId") ?? readElementPropString(element, "layerName") ?? fallbackLayerId;
  if (!layerId) {
    return null;
  }

  return {
    key: layerId,
    name: readElementPropString(element, "layerName") ?? readElementPropString(element, "layerId") ?? "Contenu",
    order: readElementPropNumber(element, "layerOrder"),
    visible: readElementPropBoolean(element, "layerVisible"),
    locked: readElementPropBoolean(element, "layerLocked"),
  };
}

export function resolveEditorObjectGrouping(element: TemplateElement): EditorObjectGrouping {
  const groupId = readElementPropString(element, "groupId");
  return {
    grouped: readElementPropBoolean(element, "grouped") ?? (groupId ? true : null),
    groupId,
  };
}

export function resolveEditorObjectLabel(element: TemplateElement) {
  const explicitName = readElementPropString(element, "label") ?? readElementPropString(element, "name") ?? readElementPropString(element, "title");
  if (explicitName) {
    return explicitName;
  }

  const textualContent = readElementPropString(element, "text") ?? readElementPropString(element, "html");
  if (textualContent) {
    const clean = stripRichTextHtml(textualContent);
    if (clean) {
      return clean.length > 36 ? `${clean.slice(0, 33)}…` : clean;
    }
  }

  const altText = readElementPropString(element, "alt");
  if (altText) {
    return altText;
  }

  switch (element.type) {
    case "text":
      return "Texte";
    case "rich-text":
      return "Rich text";
    case "image":
      return "Image";
    case "shape":
      return readElementPropString(element, "shape") ?? "Forme";
    case "table":
      return "Tableau";
    case "list":
      return "Liste";
    default:
      return `${element.type} ${element.id}`;
  }
}

function readElementPropString(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readElementPropNumber(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readElementPropBoolean(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "boolean" ? value : null;
}

function stripRichTextHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
