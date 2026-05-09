import type { CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";
import type { TemplateElement, TemplateSchema } from "@/features/editor/schema/template-schema";

export type EditorLayerView = {
  id: string;
  pageId: string;
  pageName: string;
  pageIndex: number;
  number: number;
  name: string;
  order: number;
  visible: boolean;
  locked: boolean;
  active: boolean;
  selected: boolean;
  objectCount: number;
  source: "workspace" | "derived" | "fallback";
};

export type EditorLayerViewFilters = {
  text?: string;
  page?: string;
  visibility?: "all" | "visible" | "hidden";
  lock?: "all" | "locked" | "unlocked";
};

type ElementLayerIdentity = {
  key: string;
  name: string;
  order: number | null;
  visible?: boolean;
  locked?: boolean;
};

export function deriveEditorLayersView(
  template: TemplateSchema,
  workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]>,
  activePageId?: string | null,
  activeWorkspaceLayerIdByPageId?: Record<string, string | null>,
  selectedWorkspaceLayerIdByPageId?: Record<string, string | null>,
): EditorLayerView[] {
  const activePage = resolveEditorPage(template, activePageId);
  if (!activePage) {
    return [];
  }

  const pageIndex = template.pages.findIndex((page) => page.id === activePage.id) + 1;
  const pageElements = template.elements.filter((element) => element.pageId === activePage.id);
  const workspaceLayers = [...(workspaceLayersByPageId[activePage.id] ?? [])];
  const fallbackLayerId = workspaceLayers.length === 1 ? (workspaceLayers[0]?.id ?? null) : null;
  const records = new Map<string, EditorLayerView>();

  workspaceLayers.forEach((layer) => {
    records.set(layer.id, {
      id: layer.id,
      pageId: activePage.id,
      pageName: activePage.name,
      pageIndex,
      number: resolveStableLayerNumber(layer.id, layer.order),
      name: layer.name,
      order: layer.order,
      visible: layer.visible,
      locked: layer.locked,
      active: false,
      selected: false,
      objectCount: 0,
      source: "workspace",
    });
  });

  pageElements.forEach((element, index) => {
    const layerIdentity = resolveElementLayerIdentity(element, fallbackLayerId);
    if (!layerIdentity) {
      return;
    }

    const existing = records.get(layerIdentity.key);
    if (existing) {
      records.set(layerIdentity.key, {
        ...existing,
        objectCount: existing.objectCount + 1,
      });
      return;
    }

    records.set(layerIdentity.key, {
      id: layerIdentity.key,
      pageId: activePage.id,
      pageName: activePage.name,
      pageIndex,
      number: resolveStableLayerNumber(layerIdentity.key, layerIdentity.order ?? index + 1),
      name: layerIdentity.name,
      order: layerIdentity.order ?? index + 1,
      visible: layerIdentity.visible ?? true,
      locked: layerIdentity.locked ?? false,
      active: false,
      selected: false,
      objectCount: 1,
      source: "derived",
    });
  });

  if (records.size === 0) {
    const fallbackLayer = createDefaultWorkspaceLayer(activePage.id, 1);
    records.set(fallbackLayer.id, {
      id: fallbackLayer.id,
      pageId: activePage.id,
      pageName: activePage.name,
      pageIndex,
      number: resolveStableLayerNumber(fallbackLayer.id, fallbackLayer.order),
      name: fallbackLayer.name,
      order: fallbackLayer.order,
      visible: fallbackLayer.visible,
      locked: fallbackLayer.locked,
      active: false,
      selected: false,
      objectCount: pageElements.length,
      source: "fallback",
    });
  }

  const rows = [...records.values()].sort(
    (a, b) =>
      a.order - b.order || a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id, "fr"),
  );
  const resolvedActiveLayerId = resolveActiveLayerId(
    activePage.id,
    rows,
    activeWorkspaceLayerIdByPageId,
  );
  const resolvedSelectedLayerId = resolveActiveLayerId(
    activePage.id,
    rows,
    selectedWorkspaceLayerIdByPageId,
  );

  return rows.map((row) => ({
    ...row,
    active: row.id === resolvedActiveLayerId,
    selected: row.id === resolvedSelectedLayerId,
  }));
}

export function deriveEditorDocumentLayersView(
  template: TemplateSchema,
  workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]>,
  activePageId?: string | null,
  activeWorkspaceLayerIdByPageId?: Record<string, string | null>,
  selectedWorkspaceLayerIdByPageId?: Record<string, string | null>,
): EditorLayerView[] {
  const pageCount = Math.max(template.pages.length, 1);

  return template.pages.flatMap((page, pageIndex) =>
    deriveEditorLayersView(
      template,
      workspaceLayersByPageId,
      page.id,
      activeWorkspaceLayerIdByPageId,
      selectedWorkspaceLayerIdByPageId,
    ).map((layer) => {
      const localNumber = resolveStableLayerNumber(layer.id, layer.order);
      return {
        ...layer,
        number: pageIndex + 1 + (localNumber - 1) * pageCount,
        active: page.id === activePageId && layer.active,
        selected: page.id === activePageId && layer.selected,
      };
    }),
  );
}

export function filterEditorLayersView(layers: EditorLayerView[], filters: EditorLayerViewFilters) {
  const query = filters.text?.trim().toLowerCase() ?? "";

  return layers.filter((layer) => {
    const matchesText =
      !query ||
      [
        layer.id,
        layer.name,
        layer.pageName,
        String(layer.pageIndex),
        String(layer.number),
        String(layer.order),
        layer.visible ? "visible" : "hidden",
        layer.locked ? "locked" : "unlocked",
        String(layer.objectCount),
      ].some((value) => value.toLowerCase().includes(query));
    const matchesPage =
      !filters.page || filters.page === "all" || String(layer.pageIndex) === filters.page;
    const matchesVisibility =
      !filters.visibility ||
      filters.visibility === "all" ||
      (filters.visibility === "visible" ? layer.visible : !layer.visible);
    const matchesLock =
      !filters.lock ||
      filters.lock === "all" ||
      (filters.lock === "locked" ? layer.locked : !layer.locked);
    return matchesText && matchesPage && matchesVisibility && matchesLock;
  });
}

export function resolveElementLayerIdentity(
  element: TemplateElement,
  fallbackLayerId: string | null,
): ElementLayerIdentity | null {
  const layerId = readElementPropString(element, "layerId") ?? fallbackLayerId;
  const layerName = readElementPropString(element, "layerName") ?? "Contenu";
  const layerOrder = readElementPropNumber(element, "layerOrder");
  const layerVisible = readElementPropBoolean(element, "layerVisible");
  const layerLocked = readElementPropBoolean(element, "layerLocked");

  if (!layerId) {
    return null;
  }

  return {
    key: layerId,
    name: layerName,
    order: layerOrder,
    visible: layerVisible ?? undefined,
    locked: layerLocked ?? undefined,
  };
}

export function resolveStableLayerNumber(layerId: string, fallbackOrder: number) {
  const match = layerId.match(/layer-(\d+)$/);
  if (!match) {
    return fallbackOrder;
  }

  const value = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallbackOrder;
}

function createDefaultWorkspaceLayer(pageId: string, order: number): CanvasWorkspaceLayer {
  return {
    id: `${pageId}:layer-${order}`,
    pageId,
    name: order === 1 ? "Contenu" : `Calque ${order}`,
    order,
    visible: true,
    locked: false,
  };
}

function resolveEditorPage(template: TemplateSchema, activePageId?: string | null) {
  return template.pages.find((page) => page.id === activePageId) ?? template.pages[0] ?? null;
}

function resolveActiveLayerId(
  pageId: string,
  rows: EditorLayerView[],
  layerIdsByPageId?: Record<string, string | null>,
) {
  const preferredLayerId = layerIdsByPageId?.[pageId] ?? null;
  if (preferredLayerId && rows.some((row) => row.id === preferredLayerId)) {
    return preferredLayerId;
  }

  return rows[0]?.id ?? null;
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
