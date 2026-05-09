import type {
  CanonicalRenderTree,
  RenderNode,
  RenderNodeProps,
  RenderPageNode,
} from "@/features/editor/schema/render-tree";
import type { Rect } from "@/features/editor/types";

export type KonvaSelectionType =
  | "none"
  | "page"
  | "text"
  | "richText"
  | "image"
  | "shape"
  | "group"
  | "variable"
  | "dynamicPreset"
  | "userFacingLayer"
  | "table"
  | "list";

export type KonvaSelectionProjection = {
  selectionIds: string[];
  selectionCount: number;
  isMultiSelection: boolean;
  selectionType: KonvaSelectionType;
  selectionTypeLabel: string;
  selectionLabel: string;
  page: KonvaSelectionPage | null;
  object: KonvaSelectionObject | null;
  userFacingLayer: KonvaSelectionLayer | null;
};

export type KonvaSelectionPage = {
  id: string;
  name: string;
  width: number;
  height: number;
};

export type KonvaSelectionObject = {
  id: string;
  type: KonvaSelectionType;
  frame: Rect;
  rotation: number;
  pageId: string;
  visible: boolean;
  locked: boolean;
};

export type KonvaSelectionLayer = {
  id: string;
  name: string;
  pageId: string;
  order: number | null;
  visible: boolean | null;
  locked: boolean | null;
};

export function projectKonvaSelection(
  renderTree: CanonicalRenderTree,
  activePageId: string,
  selectedElementIds: string[],
): KonvaSelectionProjection {
  const pageById = new Map(renderTree.pages.map((page) => [page.id, page]));
  const activePage = pageById.get(activePageId) ?? renderTree.pages[0] ?? null;
  const selectedCount = selectedElementIds.length;
  const selectedId = selectedElementIds[0] ?? null;

  if (!selectedId) {
    return buildPageProjection(activePage, selectedElementIds);
  }

  if (selectedCount > 1) {
    const selectedNodes = selectedElementIds
      .map((elementId) => {
        const page =
          renderTree.pages.find((candidatePage) =>
            candidatePage.children.some((node) => node.id === elementId),
          ) ?? null;
        const node = page?.children.find((candidateNode) => candidateNode.id === elementId) ?? null;
        return page && node ? { page, node } : null;
      })
      .filter((entry): entry is { page: RenderPageNode; node: RenderNode } => entry !== null);

    const firstPage = selectedNodes[0]?.page ?? activePage;
    const allOnSamePage =
      selectedNodes.length === selectedCount &&
      selectedNodes.every((entry) => entry.page.id === firstPage?.id);

    if (firstPage && allOnSamePage) {
      return {
        selectionIds: selectedElementIds,
        selectionCount: selectedCount,
        isMultiSelection: true,
        selectionType: "group",
        selectionTypeLabel: "Sélection multiple",
        selectionLabel: `${selectedCount} éléments sélectionnés`,
        page: {
          id: firstPage.id,
          name: firstPage.name,
          width: firstPage.width,
          height: firstPage.height,
        },
        object: null,
        userFacingLayer: null,
      };
    }
  }

  const selectedPage = pageById.get(selectedId);
  if (selectedPage) {
    return buildPageProjection(selectedPage, selectedElementIds);
  }

  const pageWithSelectedNode =
    renderTree.pages.find((page) => page.children.some((node) => node.id === selectedId)) ??
    activePage;
  const selectedNode =
    pageWithSelectedNode?.children.find((node) => node.id === selectedId) ?? null;

  if (!selectedNode || !pageWithSelectedNode) {
    return buildPageProjection(activePage, selectedElementIds);
  }

  const selectionType = resolveSelectionType(selectedNode);
  const userFacingLayer = resolveUserFacingLayer(selectedNode, pageWithSelectedNode.id);
  const selectionLabel = resolveSelectionLabel(selectedNode, selectionType, userFacingLayer);

  return {
    selectionIds: selectedElementIds,
    selectionCount: selectedElementIds.length,
    isMultiSelection: false,
    selectionType,
    selectionTypeLabel: labelForSelectionType(selectionType),
    selectionLabel,
    page: {
      id: pageWithSelectedNode.id,
      name: pageWithSelectedNode.name,
      width: pageWithSelectedNode.width,
      height: pageWithSelectedNode.height,
    },
    object: {
      id: selectedNode.id,
      type: selectionType,
      frame: selectedNode.frame,
      rotation: selectedNode.rotation,
      pageId: pageWithSelectedNode.id,
      visible: selectedNode.visible,
      locked: selectedNode.locked,
    },
    userFacingLayer,
  };
}

function buildPageProjection(
  page: RenderPageNode | null,
  selectedElementIds: string[],
): KonvaSelectionProjection {
  if (!page) {
    return {
      selectionIds: selectedElementIds,
      selectionCount: 0,
      isMultiSelection: false,
      selectionType: "none",
      selectionTypeLabel: "Aucune sélection",
      selectionLabel: "Aucune page active",
      page: null,
      object: null,
      userFacingLayer: null,
    };
  }

  return {
    selectionIds: selectedElementIds,
    selectionCount: selectedElementIds.length,
    isMultiSelection: false,
    selectionType: "page",
    selectionTypeLabel: "Page",
    selectionLabel: page.name,
    page: {
      id: page.id,
      name: page.name,
      width: page.width,
      height: page.height,
    },
    object: null,
    userFacingLayer: null,
  };
}

function resolveSelectionType(node: RenderNode): KonvaSelectionType {
  const hint =
    propString(node.props, "selectionType") ??
    propString(node.props, "entityType") ??
    propString(node.props, "kind");
  if (isSelectionType(hint)) {
    return hint;
  }

  switch (node.type) {
    case "text":
      return "text";
    case "rich-text":
      return "richText";
    case "image":
      return "image";
    case "shape":
      return "shape";
    case "group":
      return "group";
    case "table":
      return "table";
    case "list":
      return "list";
    default:
      return "group";
  }
}

function resolveUserFacingLayer(node: RenderNode, pageId: string): KonvaSelectionLayer | null {
  const layerId = propString(node.props, "layerId");
  const layerName = propString(node.props, "layerName");
  if (!layerId && !layerName) {
    return null;
  }

  return {
    id: layerId ?? layerName ?? `${pageId}:layer`,
    name: layerName ?? layerId ?? "Calque utilisateur",
    pageId,
    order: propNumber(node.props, "layerOrder") ?? null,
    visible: propBooleanOrNull(node.props, "layerVisible"),
    locked: propBooleanOrNull(node.props, "layerLocked"),
  };
}

function resolveSelectionLabel(
  node: RenderNode,
  type: KonvaSelectionType,
  userFacingLayer: KonvaSelectionLayer | null,
): string {
  const explicitLabel = propString(node.props, "label") ?? propString(node.props, "name");
  const fallbackLabel = propString(node.props, "text") ?? node.id;
  const baseLabel = explicitLabel ?? fallbackLabel;

  if (userFacingLayer) {
    return `${labelForSelectionType(type)} · ${baseLabel} · ${userFacingLayer.name}`;
  }

  return `${labelForSelectionType(type)} · ${baseLabel}`;
}

function labelForSelectionType(type: KonvaSelectionType): string {
  switch (type) {
    case "page":
      return "Page";
    case "text":
      return "Texte";
    case "richText":
      return "Rich text";
    case "image":
      return "Image";
    case "shape":
      return "Forme";
    case "group":
      return "Groupe";
    case "variable":
      return "Variable";
    case "dynamicPreset":
      return "Preset dynamique";
    case "userFacingLayer":
      return "Calque utilisateur";
    case "table":
      return "Tableau";
    case "list":
      return "Liste";
    case "none":
    default:
      return "Aucune sélection";
  }
}

function isSelectionType(value: string | undefined): value is KonvaSelectionType {
  return (
    value === "none" ||
    value === "page" ||
    value === "text" ||
    value === "richText" ||
    value === "image" ||
    value === "shape" ||
    value === "group" ||
    value === "variable" ||
    value === "dynamicPreset" ||
    value === "userFacingLayer" ||
    value === "table" ||
    value === "list"
  );
}

function propString(props: RenderNodeProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

function propNumber(props: RenderNodeProps, key: string): number | undefined {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
}

function propBooleanOrNull(props: RenderNodeProps, key: string): boolean | null {
  const value = props[key];
  return typeof value === "boolean" ? value : null;
}
