import type { CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import {
  resolveElementLayerIdentity,
  resolveLayerSelectionId,
  resolveStableLayerNumber,
  resolveWorkspaceLayerFallback,
} from "@/features/editor/selectors/editor-layer-model";

export { resolveElementLayerIdentity, resolveStableLayerNumber };

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
  const fallbackLayer = resolveWorkspaceLayerFallback(activePage.id, workspaceLayers, activeWorkspaceLayerIdByPageId?.[activePage.id] ?? null);
  const records = new Map<string, EditorLayerView>();
  const shouldSeedFallbackLayer = workspaceLayers.length === 0 && (pageElements.length === 0 || pageElements.some((element) => !element.props?.layerId));

  if (shouldSeedFallbackLayer) {
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
      objectCount: 0,
      source: "fallback",
    });
  }

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
    const layerIdentity = resolveElementLayerIdentity(element, fallbackLayer);
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
      visible: layerIdentity.visible,
      locked: layerIdentity.locked,
      active: false,
      selected: false,
      objectCount: 1,
      source: "derived",
    });
  });

  if (records.size === 0) {
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

  const rows = [...records.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id, "fr"));
  const resolvedActiveLayerId = resolveLayerSelectionId(rows, activeWorkspaceLayerIdByPageId?.[activePage.id] ?? null, fallbackLayer.id);
  const resolvedSelectedLayerId = resolveLayerSelectionId(rows, selectedWorkspaceLayerIdByPageId?.[activePage.id] ?? null, fallbackLayer.id);

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
    deriveEditorLayersView(template, workspaceLayersByPageId, page.id, activeWorkspaceLayerIdByPageId, selectedWorkspaceLayerIdByPageId).map((layer) => {
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
      [layer.id, layer.name, layer.pageName, String(layer.pageIndex), String(layer.number), String(layer.order), layer.visible ? "visible" : "hidden", layer.locked ? "locked" : "unlocked", String(layer.objectCount)].some((value) =>
        value.toLowerCase().includes(query),
      );
    const matchesPage = !filters.page || filters.page === "all" || String(layer.pageIndex) === filters.page;
    const matchesVisibility = !filters.visibility || filters.visibility === "all" || (filters.visibility === "visible" ? layer.visible : !layer.visible);
    const matchesLock = !filters.lock || filters.lock === "all" || (filters.lock === "locked" ? layer.locked : !layer.locked);
    return matchesText && matchesPage && matchesVisibility && matchesLock;
  });
}

function resolveEditorPage(template: TemplateSchema, activePageId?: string | null) {
  return template.pages.find((page) => page.id === activePageId) ?? template.pages[0] ?? null;
}
