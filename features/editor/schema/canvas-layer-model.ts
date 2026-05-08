import type { TemplateElement, TemplateElementProps, TemplateSchema } from "@/features/editor/schema/template-schema";
import type { CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";

export type CanvasLayerMetadata = Pick<TemplateElementProps, "layerId" | "layerName" | "layerOrder" | "layerVisible" | "layerLocked">;

export type CanvasLayerIdentity = {
  key: string;
  name: string;
  order: number | null;
  visible?: boolean;
  locked?: boolean;
};

export type CanvasElementOrderGroup = {
  pageId: string;
  layerKey: string;
  parentKey: string;
  layerOrder: number;
  elements: TemplateElement[];
};

export function createCanvasLayerMetadata(layer: CanvasWorkspaceLayer): CanvasLayerMetadata {
  return {
    layerId: layer.id,
    layerName: layer.name,
    layerOrder: layer.order,
    layerVisible: layer.visible,
    layerLocked: layer.locked,
  };
}

export function resolveCanvasElementLayerIdentity(element: TemplateElement, fallbackLayerId: string | null = null): CanvasLayerIdentity | null {
  const layerId = readElementPropString(element, "layerId") ?? fallbackLayerId ?? readElementPropString(element, "layerName");
  if (!layerId) {
    return null;
  }

  return {
    key: layerId,
    name: readElementPropString(element, "layerName") ?? "Contenu",
    order: readElementPropNumber(element, "layerOrder"),
    visible: readElementPropBoolean(element, "layerVisible") ?? undefined,
    locked: readElementPropBoolean(element, "layerLocked") ?? undefined,
  };
}

export function resolveCanvasElementLayerKey(element: TemplateElement, fallbackLayerId: string | null = null) {
  return resolveCanvasElementLayerIdentity(element, fallbackLayerId)?.key ?? "default";
}

export function resolveCanvasElementLayerOrder(element: TemplateElement) {
  return readElementPropNumber(element, "layerOrder") ?? 0;
}

export function resolveCanvasElementParentKey(element: TemplateElement) {
  const parentId = readElementPropString(element, "parentId");
  const groupId = readElementPropString(element, "groupId");
  const frameId = readElementPropString(element, "frameId");
  const containerId = readElementPropString(element, "containerId");
  const sectionId = readElementPropString(element, "sectionId");

  return parentId ?? groupId ?? frameId ?? containerId ?? sectionId ?? "root";
}

export function compareCanvasElementsByPresentationOrder(template: TemplateSchema) {
  const pageOrder = new Map(template.pages.map((page, index) => [page.id, index] as const));
  const sourceIndex = new Map(template.elements.map((element, index) => [element.id, index] as const));

  return (a: TemplateElement, b: TemplateElement) => {
    const pageDelta = (pageOrder.get(a.pageId) ?? 0) - (pageOrder.get(b.pageId) ?? 0);
    if (pageDelta !== 0) {
      return pageDelta;
    }

    const layerDelta = resolveCanvasElementLayerOrder(a) - resolveCanvasElementLayerOrder(b);
    if (layerDelta !== 0) {
      return layerDelta;
    }

    const zDelta = a.zIndex - b.zIndex;
    if (zDelta !== 0) {
      return zDelta;
    }

    return (sourceIndex.get(a.id) ?? 0) - (sourceIndex.get(b.id) ?? 0);
  };
}

export function groupCanvasElementsByPageAndLayer(template: TemplateSchema) {
  const pageOrder = new Map(template.pages.map((page, index) => [page.id, index] as const));
  const groups = new Map<string, CanvasElementOrderGroup>();

  template.elements.forEach((element) => {
    const layerKey = resolveCanvasElementLayerKey(element);
    const parentKey = resolveCanvasElementParentKey(element);
    const groupKey = `${element.pageId}::${layerKey}::${parentKey}`;
    const group = groups.get(groupKey);
    if (group) {
      group.elements.push(element);
      return;
    }

    groups.set(groupKey, {
      pageId: element.pageId,
      layerKey,
      parentKey,
      layerOrder: resolveCanvasElementLayerOrder(element),
      elements: [element],
    });
  });

  return [...groups.values()].sort((a, b) => {
    const pageDelta = (pageOrder.get(a.pageId) ?? 0) - (pageOrder.get(b.pageId) ?? 0);
    if (pageDelta !== 0) {
      return pageDelta;
    }

    const layerDelta = a.layerOrder - b.layerOrder;
    if (layerDelta !== 0) {
      return layerDelta;
    }

    return a.layerKey.localeCompare(b.layerKey) || a.parentKey.localeCompare(b.parentKey);
  });
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
