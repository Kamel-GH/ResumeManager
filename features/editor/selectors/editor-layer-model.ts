import type { CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";
import type { TemplateElement, TemplateElementProps, TemplateSchema } from "@/features/editor/schema/template-schema";

export type LayerIdentity = {
  key: string;
  name: string;
  order: number | null;
  visible: boolean;
  locked: boolean;
};

export type CanvasLayerProps = {
  layerId: string;
  layerName: string;
  layerOrder: number;
  layerVisible: boolean;
  layerLocked: boolean;
};

export type CanvasElementOrderGroup = {
  pageId: string;
  pageIndex: number;
  layerKey: string;
  parentKey: string;
  layerOrder: number;
  elements: TemplateElement[];
};

export function createDefaultWorkspaceLayer(pageId: string, order: number): CanvasWorkspaceLayer {
  return {
    id: `${pageId}:layer-${order}`,
    pageId,
    name: order === 1 ? "Contenu" : `Calque ${order}`,
    order,
    visible: true,
    locked: false,
  };
}

export function resolveWorkspaceLayerFallback(
  pageId: string,
  workspaceLayers: CanvasWorkspaceLayer[],
  preferredLayerId?: string | null,
): CanvasWorkspaceLayer {
  const preferredLayer = preferredLayerId ? workspaceLayers.find((layer) => layer.id === preferredLayerId) ?? null : null;
  if (preferredLayer) {
    return preferredLayer;
  }

  return workspaceLayers[0] ?? createDefaultWorkspaceLayer(pageId, 1);
}

export function resolveElementLayerIdentity(element: TemplateElement, fallbackLayer: CanvasWorkspaceLayer | string | null): LayerIdentity | null {
  const fallbackLayerId = typeof fallbackLayer === "string" ? fallbackLayer : fallbackLayer?.id ?? null;
  const fallbackLayerName = typeof fallbackLayer === "string" ? null : fallbackLayer?.name ?? null;
  const fallbackLayerOrder = typeof fallbackLayer === "string" ? null : fallbackLayer?.order ?? null;
  const fallbackLayerVisible = typeof fallbackLayer === "string" ? null : fallbackLayer?.visible ?? null;
  const fallbackLayerLocked = typeof fallbackLayer === "string" ? null : fallbackLayer?.locked ?? null;
  const layerId = readElementPropString(element, "layerId");
  const resolvedKey = layerId ?? fallbackLayerId ?? null;

  if (!resolvedKey) {
    return null;
  }

  return {
    key: resolvedKey,
    name: readElementPropString(element, "layerName") ?? fallbackLayerName ?? "Contenu",
    order: readElementPropNumber(element, "layerOrder") ?? fallbackLayerOrder ?? null,
    visible: readElementPropBoolean(element, "layerVisible") ?? fallbackLayerVisible ?? true,
    locked: readElementPropBoolean(element, "layerLocked") ?? fallbackLayerLocked ?? false,
  };
}

export function resolveSingleLayerIdForPage(template: TemplateSchema, pageId: string) {
  const pageElements = template.elements.filter((element) => element.pageId === pageId);
  if (pageElements.length === 0) {
    return `${pageId}:layer-1`;
  }

  const layerKeys = new Set(
    pageElements
      .map((element) => readElementPropString(element, "layerId") ?? readElementPropString(element, "layerName"))
      .filter((value): value is string => Boolean(value)),
  );

  if (layerKeys.size === 1) {
    return layerKeys.values().next().value ?? null;
  }

  if (layerKeys.size === 0) {
    return `${pageId}:layer-1`;
  }

  return null;
}

export function resolveElementLabel(element: TemplateElement) {
  const explicitLabel =
    readElementPropString(element, "label") ??
    readElementPropString(element, "name") ??
    readElementPropString(element, "title") ??
    readElementPropString(element, "alt");
  if (explicitLabel) {
    return explicitLabel;
  }

  const text = readElementPropString(element, "text") ?? readElementPropString(element, "html");
  if (text) {
    const clean = stripHtml(text);
    if (clean) {
      return clean.length > 36 ? `${clean.slice(0, 33)}…` : clean;
    }
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

export function buildCanvasLayerProps(layer: CanvasWorkspaceLayer) {
  return {
    layerId: layer.id,
    layerName: layer.name,
    layerOrder: layer.order,
    layerVisible: layer.visible,
    layerLocked: layer.locked,
  } satisfies CanvasLayerProps;
}

export function applyCanvasLayerProps(props: TemplateElementProps | undefined, layer: CanvasWorkspaceLayer): TemplateElementProps {
  return {
    ...(props ?? {}),
    ...buildCanvasLayerProps(layer),
  };
}

export function resolveCanvasElementLayerKey(element: TemplateElement) {
  return readElementPropString(element, "layerId") ?? readElementPropString(element, "layerName") ?? "default";
}

export function resolveCanvasElementParentKey(element: TemplateElement) {
  return (
    readElementPropString(element, "parentId") ??
    readElementPropString(element, "groupId") ??
    readElementPropString(element, "frameId") ??
    readElementPropString(element, "containerId") ??
    readElementPropString(element, "sectionId") ??
    "root"
  );
}

export function resolveCanvasElementLayerOrder(element: TemplateElement) {
  return readElementPropNumber(element, "layerOrder") ?? 0;
}

export function resolveLayerSelectionId<T extends { id: string }>(
  rows: T[],
  preferredLayerId?: string | null,
  fallbackLayerId?: string | null,
) {
  const preferredLayer = preferredLayerId ? rows.find((row) => row.id === preferredLayerId) ?? null : null;
  if (preferredLayer) {
    return preferredLayer.id;
  }

  const fallbackLayer = fallbackLayerId ? rows.find((row) => row.id === fallbackLayerId) ?? null : null;
  if (fallbackLayer) {
    return fallbackLayer.id;
  }

  return rows[0]?.id ?? null;
}

export function resolveStableLayerNumber(layerId: string, fallbackOrder: number) {
  const match = /(?:^|:)(?:layer|calque)[^\d]*(\d+)$/i.exec(layerId);
  if (!match) {
    return fallbackOrder;
  }

  const number = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(number) && number > 0 ? number : fallbackOrder;
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

    const parentDelta = resolveCanvasElementParentKey(a).localeCompare(resolveCanvasElementParentKey(b), "fr");
    if (parentDelta !== 0) {
      return parentDelta;
    }

    const zDelta = a.zIndex - b.zIndex;
    if (zDelta !== 0) {
      return zDelta;
    }

    const sourceDelta = (sourceIndex.get(a.id) ?? 0) - (sourceIndex.get(b.id) ?? 0);
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return a.id.localeCompare(b.id, "fr");
  };
}

export function groupTemplateElementsByPageAndLayer(template: TemplateSchema) {
  const groups = new Map<string, CanvasElementOrderGroup>();
  const pageOrder = new Map(template.pages.map((page, index) => [page.id, index] as const));

  template.elements.forEach((element) => {
    const layerKey = resolveCanvasElementLayerKey(element);
    const parentKey = resolveCanvasElementParentKey(element);
    const groupKey = `${element.pageId}::${layerKey}::${parentKey}`;
    const group = groups.get(groupKey);
    if (group) {
      group.elements.push(element);
      group.layerOrder = Math.min(group.layerOrder, resolveCanvasElementLayerOrder(element));
      return;
    }

    groups.set(groupKey, {
      pageId: element.pageId,
      pageIndex: pageOrder.get(element.pageId) ?? 0,
      layerKey,
      parentKey,
      layerOrder: resolveCanvasElementLayerOrder(element),
      elements: [element],
    });
  });

  return [...groups.values()].sort((a, b) => {
    const pageDelta = a.pageIndex - b.pageIndex;
    if (pageDelta !== 0) {
      return pageDelta;
    }

    const layerDelta = a.layerOrder - b.layerOrder;
    if (layerDelta !== 0) {
      return layerDelta;
    }

    return a.layerKey.localeCompare(b.layerKey, "fr") || a.parentKey.localeCompare(b.parentKey, "fr");
  });
}

export function readElementPropString(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function readElementPropNumber(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readElementPropBoolean(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "boolean" ? value : null;
}

function stripHtml(text: string) {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
