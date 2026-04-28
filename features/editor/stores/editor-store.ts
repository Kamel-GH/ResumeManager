import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreApi } from "zustand";

import { modernResumeTemplate } from "@/features/editor/templates/modern-resume-template";
import {
  createCanvasInsertionElement,
  type CanvasCreationEnvelope,
  type CanvasDropEnvelope,
  type CanvasToolEnvelope,
  type CanvasToolId,
  type CanvasWorkspaceLayer,
} from "@/features/editor/schema/canvas-insertion";
import { applyCanvasObjectGeometry, type CanvasObjectGeometryPatch } from "@/features/editor/schema/canvas-mutation";
import {
  buildDeleteOperationLogs,
  type EditorOperationLogEntry,
  buildGeometryOperationLogs,
  buildInsertOperationLog,
} from "@/features/editor/schema/editor-operation-log";
import { defaultWorkspaceSettings, type EditorWorkspaceSettings } from "@/features/editor/schema/workspace-layout";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import type { KonvaSelectionProjection } from "@/features/editor/schema/selection-projection";

export type EditorPanelId = "pages" | "layers" | "assets" | "data" | "inspector";
export type EditorLeftPanelTab = "data" | "libraries" | "layers" | "objects" | "pages";
export type EditorLeftSubTab = "variables" | "presets" | "images" | "text-blocks" | "charts-shapes" | "icons" | "emoji";
export type EditorPanelDisplayMode = "icon-only" | "icon-label" | "label-only";
export type EditorAssetViewMode = "grid" | "list";

export type EditorViewportState = {
  zoom: number;
  panX: number;
  panY: number;
};

export type EditorPanelPreferences = {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  activeLeftTab: EditorLeftPanelTab;
  activeSubTabs: Partial<Record<EditorLeftPanelTab, EditorLeftSubTab>>;
  displayMode: EditorPanelDisplayMode;
  assetViewMode: EditorAssetViewMode;
  filters: Partial<Record<EditorLeftPanelTab | EditorLeftSubTab, string>>;
};

export type EditorStoreState = {
  activePageId: string;
  activeCanvasTool: CanvasToolId;
  dragTraceContext: {
    sessionId: string;
    type: string;
    sourcePanel?: string;
    payload: unknown;
  } | null;
  selectedElementIds: string[];
  selectionProjection: KonvaSelectionProjection | null;
  operationLogs: EditorOperationLogEntry[];
  workingTemplate: TemplateSchema;
  workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]>;
  activeWorkspaceLayerIdByPageId: Record<string, string | null>;
  workspaceSettings: EditorWorkspaceSettings;
  openPanels: Record<EditorPanelId, boolean>;
  panelPreferences: EditorPanelPreferences;
  viewport: EditorViewportState;
  setActivePageId: (pageId: string) => void;
  setActiveCanvasTool: (toolId: CanvasToolId) => void;
  setDragTraceContext: (context: EditorStoreState["dragTraceContext"]) => void;
  clearDragTraceContext: () => void;
  setSelectedElementIds: (elementIds: string[]) => void;
  setSelectionProjection: (projection: KonvaSelectionProjection | null) => void;
  appendOperationLogs: (entries: EditorOperationLogEntry[]) => void;
  clearOperationLogs: () => void;
  insertCanvasDropPayload: (input: { pageId: string; point: { x: number; y: number }; source: CanvasDropEnvelope }) => { inserted: true; elementId: string; pageId: string; layerId: string } | { inserted: false; reason: string; sourceType: string };
  insertCanvasToolPayload: (input: { pageId: string; frame: { x: number; y: number; width: number; height: number }; source: CanvasToolEnvelope }) => { inserted: true; elementId: string; pageId: string; layerId: string } | { inserted: false; reason: string; sourceType: string };
  commitCanvasObjectGeometry: (input: { pageId: string; patches: CanvasObjectGeometryPatch[] }) => { committed: true; ids: string[] } | { committed: false; reason: string };
  deleteCanvasElements: (input: { elementIds: string[] }) => { deleted: true; ids: string[] } | { deleted: false; reason: string };
  setWorkspaceSettings: (patch: Partial<EditorWorkspaceSettings>) => void;
  setZoom: (zoom: number) => void;
  setViewportPan: (input: { panX: number; panY: number }) => void;
  setActiveLeftTab: (tab: EditorLeftPanelTab) => void;
  setActiveSubTab: (tab: EditorLeftPanelTab, subTab: EditorLeftSubTab) => void;
  setLeftCollapsed: (collapsed: boolean) => void;
  setRightCollapsed: (collapsed: boolean) => void;
  setPanelDisplayMode: (mode: EditorPanelDisplayMode) => void;
  setAssetViewMode: (mode: EditorAssetViewMode) => void;
  setPanelFilter: (key: EditorLeftPanelTab | EditorLeftSubTab, value: string) => void;
};

const defaultPanelPreferences: EditorPanelPreferences = {
  leftCollapsed: false,
  rightCollapsed: false,
  activeLeftTab: "data",
  activeSubTabs: {
    data: "variables",
    libraries: "images",
  },
  displayMode: "icon-label",
  assetViewMode: "grid",
  filters: {},
};

function createInitialWorkspaceLayers(template: TemplateSchema) {
  const workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]> = {};
  const activeWorkspaceLayerIdByPageId: Record<string, string | null> = {};

  template.pages.forEach((page) => {
    const layer = createDefaultWorkspaceLayer(page.id, 1);
    workspaceLayersByPageId[page.id] = [layer];
    activeWorkspaceLayerIdByPageId[page.id] = layer.id;
  });

  return { workspaceLayersByPageId, activeWorkspaceLayerIdByPageId };
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

export const useEditorStore = create<EditorStoreState>()(
  persist(
    (set) => ({
      activePageId: "page-1",
      activeCanvasTool: "pointer",
      dragTraceContext: null,
      selectedElementIds: [],
      selectionProjection: null,
      operationLogs: [],
      workingTemplate: structuredClone(modernResumeTemplate),
      ...createInitialWorkspaceLayers(modernResumeTemplate),
      workspaceSettings: structuredClone(defaultWorkspaceSettings),
      openPanels: {
        pages: true,
        layers: true,
        assets: true,
        data: true,
        inspector: true,
      },
      panelPreferences: defaultPanelPreferences,
      viewport: {
        zoom: 0.85,
        panX: 0,
        panY: 0,
      },
      setActivePageId: (pageId) => set({ activePageId: pageId }),
      setActiveCanvasTool: (toolId) => set({ activeCanvasTool: toolId }),
      setDragTraceContext: (context) => set({ dragTraceContext: context }),
      clearDragTraceContext: () => set({ dragTraceContext: null }),
      setSelectedElementIds: (elementIds) => set({ selectedElementIds: elementIds }),
      setSelectionProjection: (projection) => set({ selectionProjection: projection }),
      appendOperationLogs: (entries) =>
        set((state) => ({
          operationLogs: appendOperationLogs(state.operationLogs, entries),
        })),
      clearOperationLogs: () => set({ operationLogs: [] }),
      insertCanvasDropPayload: ({ pageId, point, source }) => {
        return insertCanvasSource(set, {
          pageId,
          source,
          point,
        });
      },
      insertCanvasToolPayload: ({ pageId, frame, source }) => {
        return insertCanvasSource(set, {
          pageId,
          source,
          point: {
            x: frame.x + frame.width / 2,
            y: frame.y + frame.height / 2,
          },
          frame,
        });
      },
      commitCanvasObjectGeometry: ({ pageId, patches }) => {
        let outcome: { committed: true; ids: string[] } | { committed: false; reason: string } = {
          committed: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const beforeTemplate = structuredClone(state.workingTemplate);
          const nextTemplate = applyCanvasObjectGeometry(structuredClone(state.workingTemplate), patches);
          const appliedIds = patches
            .map((patch) => patch.id)
            .filter((id) => nextTemplate.elements.some((element) => element.id === id));

          if (appliedIds.length === 0) {
            outcome = {
              committed: false,
              reason: "aucun_objet_modifie",
            };
            return state;
          }

          outcome = {
            committed: true,
            ids: appliedIds,
          };

          const logs = buildGeometryOperationLogs({
            beforeTemplate,
            afterTemplate: nextTemplate,
            pageId,
            patches,
          });

          return {
            workingTemplate: nextTemplate,
            activePageId: pageId,
            selectedElementIds: appliedIds,
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      deleteCanvasElements: ({ elementIds }) => {
        let outcome: { deleted: true; ids: string[] } | { deleted: false; reason: string } = {
          deleted: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const beforeTemplate = structuredClone(state.workingTemplate);
          const idsToDelete = Array.from(new Set(elementIds)).filter(Boolean);
          if (idsToDelete.length === 0) {
            outcome = {
              deleted: false,
              reason: "aucun_objet_a_supprimer",
            };
            return state;
          }

          const remainingElements = beforeTemplate.elements.filter((element) => !idsToDelete.includes(element.id));
          const deletedIds = beforeTemplate.elements
            .filter((element) => idsToDelete.includes(element.id))
            .map((element) => element.id);

          if (deletedIds.length === 0) {
            outcome = {
              deleted: false,
              reason: "aucun_objet_supprime",
            };
            return state;
          }

          const nextTemplate = {
            ...beforeTemplate,
            elements: remainingElements,
          };
          const logs = buildDeleteOperationLogs({
            beforeTemplate,
            afterTemplate: nextTemplate,
            elementIds: deletedIds,
          });

          outcome = {
            deleted: true,
            ids: deletedIds,
          };

          return {
            workingTemplate: nextTemplate,
            selectedElementIds: [],
            selectionProjection: null,
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      setWorkspaceSettings: (patch) =>
        set((state) => ({
          workspaceSettings: {
            ...state.workspaceSettings,
            ...patch,
          },
        })),
      setZoom: (zoom) =>
        set((state) => ({
          viewport: {
            ...state.viewport,
            zoom,
          },
        })),
      setViewportPan: ({ panX, panY }) =>
        set((state) => ({
          viewport: {
            ...state.viewport,
            panX,
            panY,
          },
        })),
      setActiveLeftTab: (tab) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            activeLeftTab: tab,
            leftCollapsed: false,
          },
        })),
      setActiveSubTab: (tab, subTab) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            activeSubTabs: {
              ...state.panelPreferences.activeSubTabs,
              [tab]: subTab,
            },
          },
        })),
      setLeftCollapsed: (collapsed) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            leftCollapsed: collapsed,
          },
        })),
      setRightCollapsed: (collapsed) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            rightCollapsed: collapsed,
          },
        })),
      setPanelDisplayMode: (mode) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            displayMode: mode,
          },
        })),
      setAssetViewMode: (mode) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            assetViewMode: mode,
          },
        })),
      setPanelFilter: (key, value) =>
        set((state) => ({
          panelPreferences: {
            ...state.panelPreferences,
            filters: {
              ...state.panelPreferences.filters,
              [key]: value,
            },
          },
        })),
    }),
    {
      name: "resume-manager-editor-panels-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        panelPreferences: state.panelPreferences,
        viewport: state.viewport,
        workspaceSettings: state.workspaceSettings,
      }),
    },
  ),
);

function insertCanvasSource(
  set: StoreApi<EditorStoreState>["setState"],
  input: { pageId: string; point: { x: number; y: number }; source: CanvasCreationEnvelope; frame?: { x: number; y: number; width: number; height: number } },
) {
  let outcome: { inserted: true; elementId: string; pageId: string; layerId: string } | { inserted: false; reason: string; sourceType: string } = {
    inserted: false,
    reason: "unresolved",
    sourceType: input.source.type,
  };

  set((state) => {
    const template = structuredClone(state.workingTemplate);
    const pages = template.pages;
    const targetPage = pages.find((page) => page.id === input.pageId) ?? pages[0] ?? null;

    if (!targetPage) {
      outcome = {
        inserted: false,
        reason: "page_introuvable",
        sourceType: input.source.type,
      };
      return state;
    }

    const layersByPageId = { ...state.workspaceLayersByPageId };
    const activeLayerByPageId = { ...state.activeWorkspaceLayerIdByPageId };
    const pageLayers = [...(layersByPageId[targetPage.id] ?? [])];
    const existingActiveLayer =
      pageLayers.find((layer) => !layer.locked && layer.visible && layer.id === activeLayerByPageId[targetPage.id]) ??
      pageLayers.find((layer) => !layer.locked && layer.visible) ??
      null;
    const activeLayer = existingActiveLayer ?? createDefaultWorkspaceLayer(targetPage.id, pageLayers.length + 1);
    const createdLayer = existingActiveLayer === null;

    const elementId = `canvas-object-${String(template.elements.length + 1).padStart(4, "0")}`;
    const insertion = createCanvasInsertionElement({
      source: input.source,
      context: {
        elementId,
        pageId: targetPage.id,
        point: input.point,
        frame: input.frame,
        layer: activeLayer,
      },
    });

    if (!insertion.inserted) {
      outcome = {
        inserted: false,
        reason: insertion.reason,
        sourceType: insertion.sourceType,
      };
      return {
        workspaceLayersByPageId: layersByPageId,
        activeWorkspaceLayerIdByPageId: activeLayerByPageId,
      };
    }

    const nextZIndex = template.elements.reduce((max, element) => Math.max(max, element.zIndex), 0) + 1;
    insertion.element.zIndex = nextZIndex;
    insertion.element.frame = clampFrameToPage(insertion.element.frame, targetPage.width, targetPage.height);
    template.elements.push(insertion.element);
    if (createdLayer) {
      pageLayers.push(activeLayer);
    }
    layersByPageId[targetPage.id] = pageLayers;
    activeLayerByPageId[targetPage.id] = activeLayer.id;

    outcome = {
      inserted: true,
      elementId: insertion.element.id,
      pageId: targetPage.id,
      layerId: activeLayer.id,
    };

    const logs = [buildInsertOperationLog({ element: insertion.element, pageId: targetPage.id })];

    return {
      workingTemplate: template,
      selectedElementIds: [insertion.element.id],
      activePageId: targetPage.id,
      workspaceLayersByPageId: layersByPageId,
      activeWorkspaceLayerIdByPageId: activeLayerByPageId,
      operationLogs: appendOperationLogs(state.operationLogs, logs),
    };
  });

  return outcome;
}
function clampFrameToPage(frame: TemplateSchema["elements"][number]["frame"], pageWidth: number, pageHeight: number) {
  const width = Math.min(frame.width, pageWidth);
  const height = Math.min(frame.height, pageHeight);
  return {
    x: clampNumber(frame.x, 0, Math.max(0, pageWidth - width)),
    y: clampNumber(frame.y, 0, Math.max(0, pageHeight - height)),
    width,
    height,
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function appendOperationLogs(existing: EditorOperationLogEntry[], next: EditorOperationLogEntry[]) {
  if (next.length === 0) {
    return existing;
  }

  const merged = [...existing, ...next];
  const limit = 150;
  return merged.length > limit ? merged.slice(merged.length - limit) : merged;
}
