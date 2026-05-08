import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreApi } from "zustand";
import type { JSONContent } from "@tiptap/core";

import { modernResumeTemplate } from "@/features/editor/templates/modern-resume-template";
import type { PageMargin } from "@/features/editor/schema/template-schema";
import {
  createCanvasInsertionElement,
  type CanvasCreationEnvelope,
  type CanvasDropEnvelope,
  type CanvasToolEnvelope,
  type CanvasToolId,
  type CanvasWorkspaceLayer,
} from "@/features/editor/schema/canvas-insertion";
import {
  DEFAULT_CANVAS_FILL_COLOR,
  DEFAULT_CANVAS_STROKE_COLOR,
  applyCanvasObjectGeometry,
  applyCanvasObjectStyle,
  alignTemplateCanvasElements,
  deleteTemplateCanvasElements,
  duplicateTemplateCanvasElements,
  duplicateTemplateCanvasElementsFromElements,
  flipTemplateCanvasElements,
  reorderTemplateCanvasElements,
  type CanvasObjectAlignmentAction,
  type CanvasObjectGeometryPatch,
  type CanvasObjectOrderAction,
  type CanvasObjectFlipAxis,
  type CanvasObjectStylePatch,
} from "@/features/editor/schema/canvas-mutation";
import {
  buildDeleteOperationLogs,
  type EditorOperationLogEntry,
  buildGeometryOperationLogs,
  buildInsertOperationLog,
  buildStyleOperationLogs,
} from "@/features/editor/schema/editor-operation-log";
import { parseRichTextHtmlToJson, serializeRichTextJsonToHtml, type RichTextVariableDisplayMode } from "@/features/editor/lib/rich-text-variable";
import { convertMeasurementValue } from "@/features/editor/lib/measurement";
import { defaultWorkspaceSettings, type EditorWorkspaceSettings } from "@/features/editor/schema/workspace-layout";
import type { TemplateElementProps } from "@/features/editor/schema/template-schema";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import type { TemplateElement, TemplateElementType } from "@/features/editor/schema/template-schema";
import type { KonvaSelectionProjection } from "@/features/editor/schema/selection-projection";
import type { ImageEditingState } from "@/features/editor/components/image-editing/image-editor-types";
import { clampEditorViewportZoom, resolveStableLayerNumber } from "@/features/editor/stores/editor-store-helpers";

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

export const EDITOR_VIEWPORT_MIN_ZOOM = 0.25;
export const EDITOR_VIEWPORT_MAX_ZOOM = 4;

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
  canvasClipboard: {
    elements: TemplateElement[];
  } | null;
  selectedElementIds: string[];
  selectionProjection: KonvaSelectionProjection | null;
  operationLogs: EditorOperationLogEntry[];
  workingTemplate: TemplateSchema;
  defaultFillColor: string;
  defaultStrokeColor: string;
  workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]>;
  activeWorkspaceLayerIdByPageId: Record<string, string | null>;
  selectedWorkspaceLayerIdByPageId: Record<string, string | null>;
  workspaceSettings: EditorWorkspaceSettings;
  openPanels: Record<EditorPanelId, boolean>;
  panelPreferences: EditorPanelPreferences;
  viewport: EditorViewportState;
  setActivePageId: (pageId: string) => void;
  addTemplatePage: () => { added: true; pageId: string } | { added: false; reason: string };
  setActiveWorkspaceLayerIdForPage: (input: { pageId: string; layerId: string | null }) => void;
  setSelectedWorkspaceLayerIdForPage: (input: { pageId: string; layerId: string | null }) => void;
  addWorkspaceLayerForPage: (input: { pageId: string }) => { added: true; layerId: string } | { added: false; reason: string };
  renameWorkspaceLayerForPage: (input: { pageId: string; layerId: string; name: string }) => { renamed: true; layerId: string } | { renamed: false; reason: string };
  deleteWorkspaceLayerForPage: (input: { pageId: string; layerId: string }) => { deleted: true; layerId: string } | { deleted: false; reason: string };
  deleteWorkspaceLayersForPage: (input: { pageId: string; layerIds: string[] }) => { deleted: true; layerIds: string[]; skippedIds: string[] } | { deleted: false; reason: string; skippedIds?: string[] };
  mergeWorkspaceLayersForPage: (input: { pageId: string; layerIds: string[] }) => { merged: true; targetLayerId: string; removedLayerIds: string[] } | { merged: false; reason: string };
  setWorkspaceLayerVisibility: (input: { pageId: string; layerId: string; visible: boolean }) => { updated: true; layerId: string } | { updated: false; reason: string };
  setWorkspaceLayerLocked: (input: { pageId: string; layerId: string; locked: boolean }) => { updated: true; layerId: string } | { updated: false; reason: string };
  reorderWorkspaceLayerForPage: (input: {
    pageId: string;
    layerId: string;
    targetLayerId: string;
    position: "before" | "after";
  }) => { reordered: true; layerId: string } | { reordered: false; reason: string };
  moveWorkspaceLayerForPage: (input: { pageId: string; layerId: string; direction: "up" | "down" }) => { reordered: true; layerId: string } | { reordered: false; reason: string };
  moveWorkspaceLayersForPage: (input: { pageId: string; layerIds: string[]; direction: "up" | "down" }) => { reordered: true; layerIds: string[] } | { reordered: false; reason: string };
  setActiveCanvasTool: (toolId: CanvasToolId) => void;
  setDefaultFillColor: (color: string) => void;
  setDefaultStrokeColor: (color: string) => void;
  setDragTraceContext: (context: EditorStoreState["dragTraceContext"]) => void;
  clearDragTraceContext: () => void;
  copyCanvasElements: (input: { elementIds: string[] }) => { copied: true; ids: string[] } | { copied: false; reason: string };
  pasteCanvasElements: () => { pasted: true; ids: string[] } | { pasted: false; reason: string };
  setSelectedElementIds: (elementIds: string[]) => void;
  setSelectionProjection: (projection: KonvaSelectionProjection | null) => void;
  appendOperationLogs: (entries: EditorOperationLogEntry[]) => void;
  clearOperationLogs: () => void;
  undoStack: TemplateSchema[];
  redoStack: TemplateSchema[];
  undo: () => { undone: true } | { undone: false; reason: string };
  redo: () => { redone: true } | { redone: false; reason: string };
  insertCanvasDropPayload: (input: { pageId: string; point: { x: number; y: number }; source: CanvasDropEnvelope }) => { inserted: true; elementId: string; pageId: string; layerId: string } | { inserted: false; reason: string; sourceType: string };
  insertCanvasToolPayload: (input: { pageId: string; frame: { x: number; y: number; width: number; height: number }; source: CanvasToolEnvelope }) => { inserted: true; elementId: string; pageId: string; layerId: string } | { inserted: false; reason: string; sourceType: string };
  commitCanvasObjectGeometry: (input: { pageId: string; patches: CanvasObjectGeometryPatch[] }) => { committed: true; ids: string[] } | { committed: false; reason: string };
  commitCanvasObjectStyle: (input: { patches: CanvasObjectStylePatch[] }) => { committed: true; ids: string[] } | { committed: false; reason: string };
  duplicateCanvasElements: (input: { elementIds: string[] }) => { duplicated: true; ids: string[] } | { duplicated: false; reason: string };
  reorderCanvasElements: (input: { elementIds: string[]; action: CanvasObjectOrderAction }) => { reordered: true; ids: string[] } | { reordered: false; reason: string };
  alignCanvasElements: (input: { elementIds: string[]; alignment: CanvasObjectAlignmentAction }) => { aligned: true; ids: string[] } | { aligned: false; reason: string };
  flipCanvasElements: (input: { elementIds: string[]; axis: CanvasObjectFlipAxis }) => { flipped: true; ids: string[] } | { flipped: false; reason: string };
  deleteCanvasElements: (input: { elementIds: string[] }) => { deleted: true; ids: string[] } | { deleted: false; reason: string };
  updateRichTextElementContent: (input: {
    elementId: string;
    html?: string;
    json?: JSONContent;
    displayMode?: RichTextVariableDisplayMode;
  }) => { updated: true; elementId: string } | { updated: false; reason: string };
  updateRichTextContainerProps: (input: {
    elementId: string;
    props: Partial<TemplateElementProps>;
  }) => { updated: true; elementId: string } | { updated: false; reason: string };
  updateImageElementEditing: (input: { elementId: string; imageEditing: ImageEditingState }) => { updated: true; elementId: string } | { updated: false; reason: string };
  updatePageMargin: (input: { pageId: string; margin: Partial<PageMargin> }) => { updated: true; pageId: string } | { updated: false; reason: string };
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
  editingRichTextElementId: string | null;
  editingImageElementId: string | null;
  setEditingRichTextElementId: (id: string | null) => void;
  setEditingImageElementId: (id: string | null) => void;
};

const defaultPanelPreferences: EditorPanelPreferences = {
  leftCollapsed: false,
  rightCollapsed: false,
  activeLeftTab: "pages",
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
  const selectedWorkspaceLayerIdByPageId: Record<string, string | null> = {};

  template.pages.forEach((page) => {
    const layer = createDefaultWorkspaceLayer(page.id, 1);
    workspaceLayersByPageId[page.id] = [layer];
    activeWorkspaceLayerIdByPageId[page.id] = layer.id;
    selectedWorkspaceLayerIdByPageId[page.id] = layer.id;
  });

  return { workspaceLayersByPageId, activeWorkspaceLayerIdByPageId, selectedWorkspaceLayerIdByPageId };
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

function normalizeLegacyWorkspaceSettings(settings: EditorWorkspaceSettings): EditorWorkspaceSettings {
  const unit = settings.measurementUnit ?? "px";
  if (unit === "px") {
    return settings;
  }

  const convert = (value: number) => roundMeasurementValue(convertMeasurementValue(value, unit, "px"));

  return {
    ...settings,
    measurementUnit: unit,
    gridSize: convert(settings.gridSize),
    snapTolerance: convert(settings.snapTolerance),
    pageGap: convert(settings.pageGap),
    pagePadding: convert(settings.pagePadding),
    rulerMajorStep: convert(settings.rulerMajorStep),
    rulerMinorStep: convert(settings.rulerMinorStep),
    rulerFineStep: convert(settings.rulerFineStep),
  };
}

function isSuspiciousWorkspaceSettings(settings: EditorWorkspaceSettings) {
  return [
    settings.gridSize,
    settings.snapTolerance,
    settings.pageGap,
    settings.pagePadding,
    settings.rulerMajorStep,
    settings.rulerMinorStep,
    settings.rulerFineStep,
  ].some((value) => Number.isFinite(value) && value > 10000);
}

export function normalizePersistedEditorStoreState(
  persistedState: Partial<EditorStoreState> | undefined,
  version?: number,
): Partial<EditorStoreState> | undefined {
  if (!persistedState) {
    return persistedState;
  }

  const { viewport: _viewport, ...persistedWithoutViewport } = persistedState;
  let normalizedWorkspaceSettings = persistedWithoutViewport.workspaceSettings;

  if (normalizedWorkspaceSettings && version !== undefined && version < 4) {
    normalizedWorkspaceSettings = normalizeLegacyWorkspaceSettings(normalizedWorkspaceSettings);
  }

  if (normalizedWorkspaceSettings && isSuspiciousWorkspaceSettings(normalizedWorkspaceSettings)) {
    normalizedWorkspaceSettings = {
      ...normalizedWorkspaceSettings,
      gridSize: defaultWorkspaceSettings.gridSize,
      snapTolerance: defaultWorkspaceSettings.snapTolerance,
      pageGap: defaultWorkspaceSettings.pageGap,
      pagePadding: defaultWorkspaceSettings.pagePadding,
      rulerMajorStep: defaultWorkspaceSettings.rulerMajorStep,
      rulerMinorStep: defaultWorkspaceSettings.rulerMinorStep,
      rulerFineStep: defaultWorkspaceSettings.rulerFineStep,
    };
  }

  if (!normalizedWorkspaceSettings) {
    return persistedWithoutViewport;
  }

  return {
    ...persistedWithoutViewport,
    workspaceSettings:
      version !== undefined && version < 6
        ? {
            ...normalizedWorkspaceSettings,
            workspaceMode: "fit-space",
          }
        : normalizedWorkspaceSettings,
  };
}

function roundMeasurementValue(value: number) {
  return Math.round(value * 100) / 100;
}

export const useEditorStore = create<EditorStoreState>()(
  persist(
    (set) => ({
      activePageId: "page-1",
      activeCanvasTool: "pointer",
      dragTraceContext: null,
      canvasClipboard: null,
      selectedElementIds: [],
      selectionProjection: null,
      operationLogs: [],
      undoStack: [],
      redoStack: [],
      editingRichTextElementId: null,
      editingImageElementId: null,
      workingTemplate: structuredClone(modernResumeTemplate),
      defaultFillColor: DEFAULT_CANVAS_FILL_COLOR,
      defaultStrokeColor: DEFAULT_CANVAS_STROKE_COLOR,
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
      setActivePageId: (pageId) =>
        set((state) => ({
          activePageId: pageId,
          selectedElementIds: state.selectedElementIds.filter((elementId) => state.workingTemplate.elements.some((element) => element.id === elementId && element.pageId === pageId)),
          selectionProjection: null,
        })),
      addTemplatePage: () => {
        let outcome: { added: true; pageId: string } | { added: false; reason: string } = {
          added: false,
          reason: "creation_page_refusee",
        };

        set((state) => {
          const sourcePage = state.workingTemplate.pages.find((page) => page.id === state.activePageId) ?? state.workingTemplate.pages[0];
          if (!sourcePage) {
            return state;
          }

          const pageNumber = resolveNextTemplatePageNumber(state.workingTemplate.pages);
          const pageId = resolveNextTemplatePageId(state.workingTemplate.pages, pageNumber);
          const nextPage = {
            id: pageId,
            name: `Page ${pageNumber}`,
            width: sourcePage.width,
            height: sourcePage.height,
            margin: { ...sourcePage.margin },
          };
          const defaultLayer = createDefaultWorkspaceLayer(pageId, 1);

          outcome = {
            added: true,
            pageId,
          };

          return {
            activePageId: pageId,
            selectedElementIds: [],
            selectionProjection: null,
            workingTemplate: {
              ...state.workingTemplate,
              pages: [...state.workingTemplate.pages, nextPage],
            },
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: [defaultLayer],
            },
            activeWorkspaceLayerIdByPageId: {
              ...state.activeWorkspaceLayerIdByPageId,
              [pageId]: defaultLayer.id,
            },
            selectedWorkspaceLayerIdByPageId: {
              ...state.selectedWorkspaceLayerIdByPageId,
              [pageId]: defaultLayer.id,
            },
          };
        });

        return outcome;
      },
      setActiveWorkspaceLayerIdForPage: ({ pageId, layerId }) =>
        set((state) => ({
          activeWorkspaceLayerIdByPageId: {
            ...state.activeWorkspaceLayerIdByPageId,
            [pageId]: layerId,
          },
        })),
      setSelectedWorkspaceLayerIdForPage: ({ pageId, layerId }) =>
        set((state) => ({
          selectedWorkspaceLayerIdByPageId: {
            ...state.selectedWorkspaceLayerIdByPageId,
            [pageId]: layerId,
          },
        })),
      addWorkspaceLayerForPage: ({ pageId }) => {
        let outcome: { added: true; layerId: string } | { added: false; reason: string } = {
          added: false,
          reason: "page_introuvable",
        };

        set((state) => {
          if (!state.workingTemplate.pages.some((page) => page.id === pageId)) {
            return state;
          }

          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])];
          const order = currentLayers.reduce((max, layer) => Math.max(max, layer.order), 0) + 1;
          const layer: CanvasWorkspaceLayer = {
            id: resolveNextWorkspaceLayerId(pageId, currentLayers),
            pageId,
            name: `Calque ${order}`,
            order,
            visible: true,
            locked: false,
          };

          outcome = {
            added: true,
            layerId: layer.id,
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: [...currentLayers, layer],
            },
            activeWorkspaceLayerIdByPageId: {
              ...state.activeWorkspaceLayerIdByPageId,
              [pageId]: layer.id,
            },
            selectedWorkspaceLayerIdByPageId: {
              ...state.selectedWorkspaceLayerIdByPageId,
              [pageId]: layer.id,
            },
          };
        });

        return outcome;
      },
      renameWorkspaceLayerForPage: ({ pageId, layerId, name }) => {
        const nextName = name.trim();
        let outcome: { renamed: true; layerId: string } | { renamed: false; reason: string } = {
          renamed: false,
          reason: "nom_invalide",
        };

        if (!nextName) {
          return outcome;
        }

        set((state) => {
          const currentLayers = state.workspaceLayersByPageId[pageId] ?? [];
          if (!currentLayers.some((layer) => layer.id === layerId)) {
            outcome = {
              renamed: false,
              reason: "calque_introuvable",
            };
            return state;
          }

          outcome = {
            renamed: true,
            layerId,
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: currentLayers.map((layer) => (layer.id === layerId ? { ...layer, name: nextName } : layer)),
            },
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element): TemplateElement => {
                if (element.pageId !== pageId || readElementPropString(element, "layerId") !== layerId) {
                  return element;
                }

                return {
                  ...element,
                  props: {
                    ...element.props,
                    layerName: nextName,
                  },
                };
              }),
            },
          };
        });

        return outcome;
      },
      deleteWorkspaceLayerForPage: ({ pageId, layerId }) => {
        let outcome: { deleted: true; layerId: string } | { deleted: false; reason: string } = {
          deleted: false,
          reason: "calque_introuvable",
        };

        set((state) => {
          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"));
          const target = currentLayers.find((layer) => layer.id === layerId);
          if (!target) {
            return state;
          }

          if (currentLayers.length <= 1) {
            outcome = {
              deleted: false,
              reason: "dernier_calque",
            };
            return state;
          }

          const hasObjects = state.workingTemplate.elements.some((element) => element.pageId === pageId && readElementPropString(element, "layerId") === layerId);
          if (hasObjects) {
            outcome = {
              deleted: false,
              reason: "calque_non_vide",
            };
            return state;
          }

          const nextLayers = currentLayers
            .filter((layer) => layer.id !== layerId)
            .map((layer, index) => ({
              ...layer,
              order: index + 1,
            }));
          const fallbackLayerId = nextLayers[0]?.id ?? null;

          outcome = {
            deleted: true,
            layerId,
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: nextLayers,
            },
            activeWorkspaceLayerIdByPageId: {
              ...state.activeWorkspaceLayerIdByPageId,
              [pageId]: state.activeWorkspaceLayerIdByPageId[pageId] === layerId ? fallbackLayerId : state.activeWorkspaceLayerIdByPageId[pageId] ?? fallbackLayerId,
            },
            selectedWorkspaceLayerIdByPageId: {
              ...state.selectedWorkspaceLayerIdByPageId,
              [pageId]: state.selectedWorkspaceLayerIdByPageId[pageId] === layerId ? fallbackLayerId : state.selectedWorkspaceLayerIdByPageId[pageId] ?? fallbackLayerId,
            },
          };
        });

        return outcome;
      },
      deleteWorkspaceLayersForPage: ({ pageId, layerIds }) => {
        let outcome:
          | { deleted: true; layerIds: string[]; skippedIds: string[] }
          | { deleted: false; reason: string; skippedIds?: string[] } = {
          deleted: false,
          reason: "aucun_calque",
        };

        set((state) => {
          const requestedIds = Array.from(new Set(layerIds)).filter(Boolean);
          if (requestedIds.length === 0) {
            return state;
          }

          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"));
          const existingIds = new Set(currentLayers.map((layer) => layer.id));
          const idsWithObjects = new Set(
            state.workingTemplate.elements
              .filter((element) => element.pageId === pageId)
              .map((element) => readElementPropString(element, "layerId"))
              .filter((id): id is string => Boolean(id)),
          );
          const skippedIds = requestedIds.filter((id) => !existingIds.has(id) || idsWithObjects.has(id));
          const deletableCandidates = requestedIds.filter((id) => existingIds.has(id) && !idsWithObjects.has(id));
          const maxDeletableCount = Math.max(currentLayers.length - 1, 0);
          const deletableIds = deletableCandidates.slice(0, maxDeletableCount);
          const protectedLastLayerIds = deletableCandidates.slice(maxDeletableCount);

          if (currentLayers.length <= 1) {
            outcome = {
              deleted: false,
              reason: "dernier_calque",
              skippedIds: requestedIds,
            };
            return state;
          }

          if (deletableIds.length === 0) {
            outcome = {
              deleted: false,
              reason: "aucun_calque_supprimable",
              skippedIds,
            };
            return state;
          }

          const deletedIdSet = new Set(deletableIds);
          const nextLayers = currentLayers
            .filter((layer) => !deletedIdSet.has(layer.id))
            .map((layer, index) => ({
              ...layer,
              order: index + 1,
            }));
          const fallbackLayerId = nextLayers[0]?.id ?? null;

          outcome = {
            deleted: true,
            layerIds: deletableIds,
            skippedIds: [...skippedIds, ...protectedLastLayerIds],
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: nextLayers,
            },
            activeWorkspaceLayerIdByPageId: {
              ...state.activeWorkspaceLayerIdByPageId,
              [pageId]: deletedIdSet.has(state.activeWorkspaceLayerIdByPageId[pageId] ?? "") ? fallbackLayerId : state.activeWorkspaceLayerIdByPageId[pageId] ?? fallbackLayerId,
            },
            selectedWorkspaceLayerIdByPageId: {
              ...state.selectedWorkspaceLayerIdByPageId,
              [pageId]: deletedIdSet.has(state.selectedWorkspaceLayerIdByPageId[pageId] ?? "") ? fallbackLayerId : state.selectedWorkspaceLayerIdByPageId[pageId] ?? fallbackLayerId,
            },
          };
        });

        return outcome;
      },
      mergeWorkspaceLayersForPage: ({ pageId, layerIds }) => {
        let outcome: { merged: true; targetLayerId: string; removedLayerIds: string[] } | { merged: false; reason: string } = {
          merged: false,
          reason: "selection_insuffisante",
        };

        set((state) => {
          const requestedIds = Array.from(new Set(layerIds)).filter(Boolean);
          if (requestedIds.length < 2) {
            return state;
          }

          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"));
          const selectedLayers = currentLayers.filter((layer) => requestedIds.includes(layer.id));
          if (selectedLayers.length < 2) {
            return state;
          }

          const activeLayerId = state.activeWorkspaceLayerIdByPageId[pageId] ?? null;
          const targetLayer = selectedLayers.find((layer) => layer.id === activeLayerId) ?? selectedLayers[0];
          if (!targetLayer) {
            outcome = {
              merged: false,
              reason: "calque_cible_introuvable",
            };
            return state;
          }

          const sourceIds = selectedLayers.map((layer) => layer.id).filter((id) => id !== targetLayer.id);
          const sourceIdSet = new Set(sourceIds);
          const nextLayers = currentLayers
            .filter((layer) => !sourceIdSet.has(layer.id))
            .map((layer, index) => ({
              ...layer,
              order: index + 1,
            }));
          const targetOrder = nextLayers.find((layer) => layer.id === targetLayer.id)?.order ?? targetLayer.order;

          outcome = {
            merged: true,
            targetLayerId: targetLayer.id,
            removedLayerIds: sourceIds,
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: nextLayers,
            },
            activeWorkspaceLayerIdByPageId: {
              ...state.activeWorkspaceLayerIdByPageId,
              [pageId]: targetLayer.id,
            },
            selectedWorkspaceLayerIdByPageId: {
              ...state.selectedWorkspaceLayerIdByPageId,
              [pageId]: targetLayer.id,
            },
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element): TemplateElement => {
                if (element.pageId !== pageId) {
                  return element;
                }

                const elementLayerId = readElementPropString(element, "layerId");
                if (!elementLayerId || !sourceIdSet.has(elementLayerId)) {
                  return element;
                }

                return {
                  ...element,
                  props: {
                    ...element.props,
                    layerId: targetLayer.id,
                    layerName: targetLayer.name,
                    layerOrder: targetOrder,
                    layerVisible: targetLayer.visible,
                    layerLocked: targetLayer.locked,
                  },
                };
              }),
            },
          };
        });

        return outcome;
      },
      setWorkspaceLayerVisibility: ({ pageId, layerId, visible }) => updateWorkspaceLayerState(set, { pageId, layerId, patch: { visible } }),
      setWorkspaceLayerLocked: ({ pageId, layerId, locked }) => updateWorkspaceLayerState(set, { pageId, layerId, patch: { locked } }),
      reorderWorkspaceLayerForPage: ({ pageId, layerId, targetLayerId, position }) => {
        let outcome: { reordered: true; layerId: string } | { reordered: false; reason: string } = {
          reordered: false,
          reason: "calque_introuvable",
        };

        set((state) => {
          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"));
          const fromIndex = currentLayers.findIndex((layer) => layer.id === layerId);
          const targetIndex = currentLayers.findIndex((layer) => layer.id === targetLayerId);

          if (fromIndex < 0 || targetIndex < 0) {
            return state;
          }

          if (layerId === targetLayerId) {
            outcome = {
              reordered: false,
              reason: "aucun_changement",
            };
            return state;
          }

          const [movedLayer] = currentLayers.splice(fromIndex, 1);
          if (!movedLayer) {
            return state;
          }

          const adjustedTargetIndex = currentLayers.findIndex((layer) => layer.id === targetLayerId);
          const insertIndex = position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
          currentLayers.splice(insertIndex, 0, movedLayer);

          const nextLayers = currentLayers.map((layer, index) => ({
            ...layer,
            order: index + 1,
          }));

          const layerOrderById = new Map(nextLayers.map((layer) => [layer.id, layer.order] as const));
          const layerNameById = new Map(nextLayers.map((layer) => [layer.id, layer.name] as const));

          outcome = {
            reordered: true,
            layerId,
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: nextLayers,
            },
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element): TemplateElement => {
                if (element.pageId !== pageId) {
                  return element;
                }

                const elementLayerId = readElementPropString(element, "layerId");
                if (!elementLayerId || !layerOrderById.has(elementLayerId)) {
                  return element;
                }
                const layerOrder = layerOrderById.get(elementLayerId);
                if (layerOrder === undefined) {
                  return element;
                }

                return {
                  ...element,
                  props: {
                    ...element.props,
                    layerOrder,
                    ...(layerNameById.has(elementLayerId) ? { layerName: layerNameById.get(elementLayerId) ?? "" } : {}),
                  },
                };
              }),
            },
          };
        });

        return outcome;
      },
      moveWorkspaceLayerForPage: ({ pageId, layerId, direction }) => {
        let outcome: { reordered: true; layerId: string } | { reordered: false; reason: string } = {
          reordered: false,
          reason: "calque_introuvable",
        };

        set((state) => {
          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"));
          const fromIndex = currentLayers.findIndex((layer) => layer.id === layerId);
          if (fromIndex < 0) {
            return state;
          }

          const targetIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
          const targetLayer = currentLayers[targetIndex];
          if (!targetLayer) {
            outcome = {
              reordered: false,
              reason: "aucun_changement",
            };
            return state;
          }

          const [movedLayer] = currentLayers.splice(fromIndex, 1);
          if (!movedLayer) {
            return state;
          }

          currentLayers.splice(targetIndex, 0, movedLayer);
          const nextLayers = currentLayers.map((layer, index) => ({
            ...layer,
            order: index + 1,
          }));
          const layerOrderById = new Map(nextLayers.map((layer) => [layer.id, layer.order] as const));

          outcome = {
            reordered: true,
            layerId,
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: nextLayers,
            },
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element): TemplateElement => {
                if (element.pageId !== pageId) {
                  return element;
                }
                const elementLayerId = readElementPropString(element, "layerId");
                const layerOrder = elementLayerId ? layerOrderById.get(elementLayerId) : undefined;
                if (layerOrder === undefined) {
                  return element;
                }

                return {
                  ...element,
                  props: {
                    ...element.props,
                    layerOrder,
                  },
                };
              }),
            },
          };
        });

        return outcome;
      },
      moveWorkspaceLayersForPage: ({ pageId, layerIds, direction }) => {
        let outcome: { reordered: true; layerIds: string[] } | { reordered: false; reason: string } = {
          reordered: false,
          reason: "calque_introuvable",
        };

        set((state) => {
          const selectedIds = new Set(layerIds.filter(Boolean));
          if (selectedIds.size === 0) {
            return state;
          }

          const currentLayers = [...(state.workspaceLayersByPageId[pageId] ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"));
          if (![...selectedIds].every((id) => currentLayers.some((layer) => layer.id === id))) {
            return state;
          }

          const nextLayers = [...currentLayers];
          if (direction === "up") {
            for (let index = 1; index < nextLayers.length; index += 1) {
              const layer = nextLayers[index];
              const previous = nextLayers[index - 1];
              if (layer && previous && selectedIds.has(layer.id) && !selectedIds.has(previous.id)) {
                nextLayers[index - 1] = layer;
                nextLayers[index] = previous;
              }
            }
          } else {
            for (let index = nextLayers.length - 2; index >= 0; index -= 1) {
              const layer = nextLayers[index];
              const next = nextLayers[index + 1];
              if (layer && next && selectedIds.has(layer.id) && !selectedIds.has(next.id)) {
                nextLayers[index + 1] = layer;
                nextLayers[index] = next;
              }
            }
          }

          const changed = nextLayers.some((layer, index) => layer.id !== currentLayers[index]?.id);
          if (!changed) {
            outcome = {
              reordered: false,
              reason: "aucun_changement",
            };
            return state;
          }

          const reorderedLayers = nextLayers.map((layer, index) => ({
            ...layer,
            order: index + 1,
          }));
          const layerOrderById = new Map(reorderedLayers.map((layer) => [layer.id, layer.order] as const));

          outcome = {
            reordered: true,
            layerIds: [...selectedIds],
          };

          return {
            workspaceLayersByPageId: {
              ...state.workspaceLayersByPageId,
              [pageId]: reorderedLayers,
            },
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element): TemplateElement => {
                if (element.pageId !== pageId) {
                  return element;
                }

                const elementLayerId = readElementPropString(element, "layerId");
                const layerOrder = elementLayerId ? layerOrderById.get(elementLayerId) : undefined;
                if (layerOrder === undefined) {
                  return element;
                }

                return {
                  ...element,
                  props: {
                    ...element.props,
                    layerOrder,
                  },
                };
              }),
            },
          };
        });

        return outcome;
      },
      setActiveCanvasTool: (toolId) => set({ activeCanvasTool: toolId }),
      setDefaultFillColor: (defaultFillColor) => set({ defaultFillColor }),
      setDefaultStrokeColor: (defaultStrokeColor) => set({ defaultStrokeColor }),
      setDragTraceContext: (context) => set({ dragTraceContext: context }),
      clearDragTraceContext: () => set({ dragTraceContext: null }),
      copyCanvasElements: ({ elementIds }) => {
        let outcome: { copied: true; ids: string[] } | { copied: false; reason: string } = {
          copied: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const snapshot = state.workingTemplate.elements.filter((element) => elementIds.includes(element.id) && !element.locked);
          if (snapshot.length === 0) {
            outcome = {
              copied: false,
              reason: "aucun_objet_copie",
            };
            return state;
          }

          const ids = snapshot.map((element) => element.id);
          outcome = {
            copied: true,
            ids,
          };

          return {
            canvasClipboard: {
              elements: structuredClone(snapshot),
            },
          };
        });

        return outcome;
      },
      pasteCanvasElements: () => {
        let outcome: { pasted: true; ids: string[] } | { pasted: false; reason: string } = {
          pasted: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const clipboard = state.canvasClipboard;
          if (!clipboard || clipboard.elements.length === 0) {
            outcome = {
              pasted: false,
              reason: "presse_papier_vide",
            };
            return state;
          }

          const targetPage = state.workingTemplate.pages.find((page) => page.id === state.activePageId) ?? state.workingTemplate.pages[0] ?? null;
          if (!targetPage) {
            outcome = {
              pasted: false,
              reason: "page_introuvable",
            };
            return state;
          }

          const targetLayer =
            (state.workspaceLayersByPageId[targetPage.id] ?? []).find((layer) => layer.id === state.activeWorkspaceLayerIdByPageId[targetPage.id]) ??
            (state.workspaceLayersByPageId[targetPage.id] ?? [])[0] ??
            null;
          const template = structuredClone(state.workingTemplate);
          const offset = { x: 12, y: 12 };
          const nextResult = duplicateTemplateCanvasElementsFromElements(template, clipboard.elements, offset);
          if (nextResult.duplicatedIds.length === 0) {
            outcome = {
              pasted: false,
              reason: "aucun_objet_colle",
            };
            return state;
          }

          nextResult.duplicatedElements.forEach((element) => {
            element.pageId = targetPage.id;
            element.frame = clampFrameToPage(element.frame, targetPage.width, targetPage.height);

            if (!targetLayer) {
              return;
            }

            element.props = element.props ? structuredClone(element.props) : {};
            element.props.layerId = targetLayer.id;
            element.props.layerName = targetLayer.name;
            element.props.layerOrder = targetLayer.order;
            element.props.layerVisible = targetLayer.visible;
            element.props.layerLocked = targetLayer.locked;
          });

          outcome = {
            pasted: true,
            ids: nextResult.duplicatedIds,
          };

          const logs = nextResult.duplicatedElements.map((element) => buildInsertOperationLog({ element, pageId: element.pageId }));

          return {
            workingTemplate: nextResult.template,
            selectedElementIds: nextResult.duplicatedIds,
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      setSelectedElementIds: (elementIds) => set({ selectedElementIds: elementIds }),
      setSelectionProjection: (projection) => set({ selectionProjection: projection }),
      appendOperationLogs: (entries) =>
        set((state) => ({
          operationLogs: appendOperationLogs(state.operationLogs, entries),
        })),
      clearOperationLogs: () => set({ operationLogs: [] }),
      undo: () => {
        let outcome: { undone: true } | { undone: false; reason: string } = {
          undone: false,
          reason: "aucune_action_a_annuler",
        };

        set((state) => {
          if (state.undoStack.length === 0) {
            return state;
          }

          const previous = state.undoStack[state.undoStack.length - 1]!;
          outcome = { undone: true };

          return {
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, structuredClone(state.workingTemplate)],
            workingTemplate: previous,
            selectedElementIds: [],
            selectionProjection: null,
          };
        });

        return outcome;
      },
      redo: () => {
        let outcome: { redone: true } | { redone: false; reason: string } = {
          redone: false,
          reason: "aucune_action_a_retablir",
        };

        set((state) => {
          if (state.redoStack.length === 0) {
            return state;
          }

          const next = state.redoStack[state.redoStack.length - 1]!;
          outcome = { redone: true };

          return {
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, structuredClone(state.workingTemplate)],
            workingTemplate: next,
            selectedElementIds: [],
            selectionProjection: null,
          };
        });

        return outcome;
      },
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
          const beforeById = new Map(beforeTemplate.elements.map((element) => [element.id, element] as const));
          const afterById = new Map(nextTemplate.elements.map((element) => [element.id, element] as const));
          const appliedPatches = patches.filter((patch) => {
            const beforeElement = beforeById.get(patch.id);
            const afterElement = afterById.get(patch.id);
            return Boolean(beforeElement && afterElement && hasCanvasGeometryChanged(beforeElement, afterElement, patch));
          });
          const appliedIds = appliedPatches.map((patch) => patch.id);

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
            patches: appliedPatches,
          });

          return {
            workingTemplate: nextTemplate,
            activePageId: pageId,
            selectedElementIds: appliedIds,
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      commitCanvasObjectStyle: ({ patches }) => {
        let outcome: { committed: true; ids: string[] } | { committed: false; reason: string } = {
          committed: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const beforeTemplate = structuredClone(state.workingTemplate);
          const nextTemplate = applyCanvasObjectStyle(structuredClone(state.workingTemplate), patches);
          const logs = buildStyleOperationLogs({
            beforeTemplate,
            afterTemplate: nextTemplate,
            patches,
          });
          const appliedIds = logs.map((entry) => entry.elementId);

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

          return {
            workingTemplate: nextTemplate,
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      duplicateCanvasElements: ({ elementIds }) => {
        let outcome: { duplicated: true; ids: string[] } | { duplicated: false; reason: string } = {
          duplicated: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const beforeTemplate = structuredClone(state.workingTemplate);
          const result = duplicateTemplateCanvasElements(beforeTemplate, { elementIds });

          if (result.duplicatedIds.length === 0) {
            outcome = {
              duplicated: false,
              reason: "aucun_objet_duplique",
            };
            return state;
          }

          const logs = result.duplicatedElements.map((element) => buildInsertOperationLog({ element, pageId: element.pageId }));

          outcome = {
            duplicated: true,
            ids: result.duplicatedIds,
          };

          return {
            workingTemplate: result.template,
            selectedElementIds: result.duplicatedIds,
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      reorderCanvasElements: ({ elementIds, action }) => {
        let outcome: { reordered: true; ids: string[] } | { reordered: false; reason: string } = {
          reordered: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const result = reorderTemplateCanvasElements(structuredClone(state.workingTemplate), { elementIds, action });
          if (result.changedIds.length === 0) {
            outcome = {
              reordered: false,
              reason: "aucun_objet_reordonne",
            };
            return state;
          }

          outcome = {
            reordered: true,
            ids: result.changedIds,
          };

          return {
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            workingTemplate: result.template,
            selectedElementIds: state.selectedElementIds.filter((id) => result.template.elements.some((element) => element.id === id)),
          };
        });

        return outcome;
      },
      alignCanvasElements: ({ elementIds, alignment }) => {
        let outcome: { aligned: true; ids: string[] } | { aligned: false; reason: string } = {
          aligned: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const beforeTemplate = structuredClone(state.workingTemplate);
          const result = alignTemplateCanvasElements(beforeTemplate, { elementIds, alignment });

          if (result.changedIds.length === 0) {
            outcome = {
              aligned: false,
              reason: "aucun_objet_aligne",
            };
            return state;
          }

          const beforeById = new Map(beforeTemplate.elements.map((element) => [element.id, element] as const));
          const afterById = new Map(result.template.elements.map((element) => [element.id, element] as const));
          const patchesByPageId = new Map<string, CanvasObjectGeometryPatch[]>();

          result.patches.forEach((patch) => {
            const beforeElement = beforeById.get(patch.id);
            const afterElement = afterById.get(patch.id);
            if (!beforeElement || !afterElement) {
              return;
            }

            const pagePatches = patchesByPageId.get(afterElement.pageId);
            if (pagePatches) {
              pagePatches.push(patch);
              return;
            }

            patchesByPageId.set(afterElement.pageId, [patch]);
          });

          const logs = [...patchesByPageId.entries()].flatMap(([pageId, patchesForPage]) =>
            buildGeometryOperationLogs({
              beforeTemplate,
              afterTemplate: result.template,
              pageId,
              patches: patchesForPage,
            }),
          );

          outcome = {
            aligned: true,
            ids: result.changedIds,
          };

          return {
            workingTemplate: result.template,
            selectedElementIds: state.selectedElementIds.filter((id) => result.template.elements.some((element) => element.id === id)),
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      flipCanvasElements: ({ elementIds, axis }) => {
        let outcome: { flipped: true; ids: string[] } | { flipped: false; reason: string } = {
          flipped: false,
          reason: "aucune_modification",
        };

        set((state) => {
          const result = flipTemplateCanvasElements(structuredClone(state.workingTemplate), { elementIds, axis });
          if (result.changedIds.length === 0) {
            outcome = {
              flipped: false,
              reason: "aucun_objet_retourne",
            };
            return state;
          }

          outcome = {
            flipped: true,
            ids: result.changedIds,
          };

          return {
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            workingTemplate: result.template,
            selectedElementIds: state.selectedElementIds.filter((id) => result.template.elements.some((element) => element.id === id)),
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
          const result = deleteTemplateCanvasElements(beforeTemplate, { elementIds });
          if (result.deletedIds.length === 0) {
            outcome = {
              deleted: false,
              reason: "aucun_objet_supprime",
            };
            return state;
          }

          const logs = buildDeleteOperationLogs({
            beforeTemplate,
            afterTemplate: result.template,
            elementIds: result.deletedIds,
          });

          outcome = {
            deleted: true,
            ids: result.deletedIds,
          };

          return {
            workingTemplate: result.template,
            selectedElementIds: state.selectedElementIds.filter((id) => !result.deletedIds.includes(id)),
            selectionProjection: null,
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, logs),
          };
        });

        return outcome;
      },
      updateRichTextElementContent: ({ elementId, html, json, displayMode }) => {
        let outcome: { updated: true; elementId: string } | { updated: false; reason: string } = {
          updated: false,
          reason: "bloc_introuvable",
        };

        set((state) => {
          const target = state.workingTemplate.elements.find((element) => element.id === elementId);
          if (!target) {
            return state;
          }

          if (target.type !== "rich-text") {
            outcome = {
              updated: false,
              reason: "type_non_rich_text",
            };
            return state;
          }

          if (target.locked) {
            outcome = {
              updated: false,
              reason: "bloc_verrouille",
            };
            return state;
          }

          outcome = {
            updated: true,
            elementId,
          };

          const nextDisplayMode = displayMode ?? (readElementPropString(target, "richTextDisplayMode") as RichTextVariableDisplayMode | undefined) ?? "label";
          const nextJson = json ?? (html ? parseRichTextHtmlToJson(html) : null) ?? parseRichTextHtmlToJson("<p></p>");
          const nextHtml = html ?? serializeRichTextJsonToHtml(nextJson, { displayMode: nextDisplayMode });

          return {
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element) =>
                element.id === elementId
                  ? {
                      ...element,
                      props: {
                        ...element.props,
                        html: nextHtml,
                        richTextJson: nextJson,
                        richTextDisplayMode: nextDisplayMode,
                        text: stripRichTextHtml(nextHtml),
                      },
                    }
                  : element,
              ),
            },
            selectedElementIds: state.selectedElementIds,
            selectionProjection: null,
          };
        });

        return outcome;
      },
      updateRichTextContainerProps: ({ elementId, props }) => {
        let outcome: { updated: true; elementId: string } | { updated: false; reason: string } = {
          updated: false,
          reason: "bloc_introuvable",
        };

        set((state) => {
          const target = state.workingTemplate.elements.find((element) => element.id === elementId);
          if (!target) return state;

          if (target.type !== "rich-text") {
            outcome = { updated: false, reason: "type_non_rich_text" };
            return state;
          }

          if (target.locked) {
            outcome = { updated: false, reason: "bloc_verrouille" };
            return state;
          }

          outcome = { updated: true, elementId };

          return {
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            workingTemplate: {
              ...state.workingTemplate,
              elements: state.workingTemplate.elements.map((element) =>
                element.id === elementId
                  ? { ...element, props: { ...(element.props ?? {}), ...props } }
                  : element,
              ),
            },
            selectedElementIds: state.selectedElementIds,
            selectionProjection: null,
          };
        });

        return outcome;
      },
      updateImageElementEditing: ({ elementId, imageEditing }) => {
        let outcome: { updated: true; elementId: string } | { updated: false; reason: string } = {
          updated: false,
          reason: "bloc_introuvable",
        };

        set((state) => {
          const target = state.workingTemplate.elements.find((element) => element.id === elementId);
          if (!target) {
            return state;
          }

          if (target.type !== "image") {
            outcome = {
              updated: false,
              reason: "type_non_image",
            };
            return state;
          }

          if (target.locked) {
            outcome = {
              updated: false,
              reason: "bloc_verrouille",
            };
            return state;
          }

          const nextTemplate: TemplateSchema = {
            ...state.workingTemplate,
            elements: state.workingTemplate.elements.map((element) =>
              element.id === elementId
                ? {
                    ...element,
                    props: {
                      ...element.props,
                      imageEditing,
                    },
                  }
                : element,
            ),
          };
          const afterElement = nextTemplate.elements.find((element) => element.id === elementId);
          if (!afterElement) {
            return state;
          }

          outcome = {
            updated: true,
            elementId,
          };

          const timestamp = Date.now();
          const log: EditorOperationLogEntry = {
            id: `style:${elementId}:${timestamp}`,
            timestamp,
            action: "style",
            pageId: target.pageId,
            elementId,
            before: {
              id: target.id,
              pageId: target.pageId,
              frame: target.frame,
              rotation: target.rotation ?? 0,
            },
            after: {
              id: afterElement.id,
              pageId: afterElement.pageId,
              frame: afterElement.frame,
              rotation: afterElement.rotation ?? 0,
            },
            details: [{ label: "Image", value: "Édition non destructive" }],
          };

          return {
            workingTemplate: nextTemplate,
            selectedElementIds: state.selectedElementIds.includes(elementId) ? state.selectedElementIds : [elementId],
            selectionProjection: null,
            undoStack: pushUndoCheckpoint(state),
            redoStack: [],
            operationLogs: appendOperationLogs(state.operationLogs, [log]),
          };
        });

        return outcome;
      },
      updatePageMargin: ({ pageId, margin }) => {
        let outcome: { updated: true; pageId: string } | { updated: false; reason: string } = {
          updated: false,
          reason: "page_introuvable",
        };

        set((state) => {
          const pageExists = state.workingTemplate.pages.some((page) => page.id === pageId);
          if (!pageExists) {
            return state;
          }

          outcome = {
            updated: true,
            pageId,
          };

          return {
            workingTemplate: {
              ...state.workingTemplate,
              pages: state.workingTemplate.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      margin: {
                        ...page.margin,
                        ...margin,
                      },
                    }
                  : page,
              ),
            },
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
            zoom: clampEditorViewportZoom(zoom),
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
      setEditingRichTextElementId: (id) => set({ editingRichTextElementId: id }),
      setEditingImageElementId: (id) => set({ editingImageElementId: id }),
    }),
    {
      name: "resume-manager-editor-panels-v2",
      version: 6,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        return normalizePersistedEditorStoreState(persistedState as Partial<EditorStoreState> | undefined, version);
      },
      partialize: (state) => ({
        panelPreferences: state.panelPreferences,
        workspaceSettings: state.workspaceSettings,
        defaultFillColor: state.defaultFillColor,
        defaultStrokeColor: state.defaultStrokeColor,
      }),
      merge: (persistedState, currentState) => {
        const persisted = normalizePersistedEditorStoreState(persistedState as Partial<EditorStoreState> | undefined);

        return {
          ...currentState,
          ...persisted,
          workspaceSettings: {
            ...defaultWorkspaceSettings,
            ...(persisted?.workspaceSettings ?? {}),
          },
        };
      },
    },
  ),
);

function resolveNextWorkspaceLayerId(pageId: string, layers: CanvasWorkspaceLayer[]) {
  const existing = new Set(layers.map((layer) => layer.id));
  let index = layers.length + 1;
  let id = `${pageId}:layer-${index}`;
  while (existing.has(id)) {
    index += 1;
    id = `${pageId}:layer-${index}`;
  }
  return id;
}

function resolveNextTemplatePageNumber(pages: TemplateSchema["pages"]) {
  const existingNumbers = pages
    .map((page) => /(?:^|\D)(\d+)$/.exec(page.id)?.[1] ?? /(?:^|\D)(\d+)$/.exec(page.name)?.[1])
    .map((value) => (value ? Number.parseInt(value, 10) : Number.NaN))
    .filter(Number.isFinite);
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : pages.length;
  return maxNumber + 1;
}

function resolveNextTemplatePageId(pages: TemplateSchema["pages"], startNumber: number) {
  const existingIds = new Set(pages.map((page) => page.id));
  let pageNumber = startNumber;
  let pageId = `page-${pageNumber}`;
  while (existingIds.has(pageId)) {
    pageNumber += 1;
    pageId = `page-${pageNumber}`;
  }

  return pageId;
}

function updateWorkspaceLayerState(
  set: StoreApi<EditorStoreState>["setState"],
  input: { pageId: string; layerId: string; patch: Partial<Pick<CanvasWorkspaceLayer, "visible" | "locked">> },
) {
  let outcome: { updated: true; layerId: string } | { updated: false; reason: string } = {
    updated: false,
    reason: "calque_introuvable",
  };

  set((state) => {
    const currentLayers = state.workspaceLayersByPageId[input.pageId] ?? [];
    const target = currentLayers.find((layer) => layer.id === input.layerId);
    if (!target) {
      return state;
    }

    const nextLayers = currentLayers.map((layer) => (layer.id === input.layerId ? { ...layer, ...input.patch } : layer));
    const nextTemplate: TemplateSchema = {
      ...state.workingTemplate,
      elements: state.workingTemplate.elements.map((element): TemplateElement => {
        if (element.pageId !== input.pageId || element.props?.layerId !== input.layerId) {
          return element;
        }

        return {
          ...element,
          props: {
            ...element.props,
            ...(input.patch.visible !== undefined ? { layerVisible: input.patch.visible } : {}),
            ...(input.patch.locked !== undefined ? { layerLocked: input.patch.locked } : {}),
          },
        };
      }),
    };

    outcome = {
      updated: true,
      layerId: input.layerId,
    };

    return {
      workingTemplate: nextTemplate,
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        [input.pageId]: nextLayers,
      },
    };
  });

  return outcome;
}

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

    const elementId = `el-${crypto.randomUUID()}`;
    const insertion = createCanvasInsertionElement({
      source: input.source,
      context: {
        elementId,
        pageId: targetPage.id,
        point: input.point,
        frame: input.frame,
        layer: activeLayer,
        styleDefaults: {
          fill: state.defaultFillColor,
          stroke: state.defaultStrokeColor,
        },
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
      undoStack: pushUndoCheckpoint(state),
      redoStack: [],
      operationLogs: appendOperationLogs(state.operationLogs, logs),
    };
  });

  return outcome;
}

function resolveEditorPage(template: TemplateSchema, activePageId?: string | null) {
  return template.pages.find((page) => page.id === activePageId) ?? template.pages[0] ?? null;
}

function resolveSingleLayerIdForPage(template: TemplateSchema, pageId: string) {
  const pageElements = template.elements.filter((element) => element.pageId === pageId);
  if (pageElements.length === 0) {
    return null;
  }

  const explicitLayerIds = new Set(
    pageElements
      .map((element) => readElementPropString(element, "layerId") ?? readElementPropString(element, "layerName"))
      .filter((value): value is string => Boolean(value)),
  );

  if (explicitLayerIds.size === 1) {
    return explicitLayerIds.values().next().value ?? null;
  }

  const pageLayers = pageElements.length > 0 ? [createDefaultWorkspaceLayer(pageId, 1)] : [];
  return pageLayers.length === 1 ? pageLayers[0].id : null;
}

function resolveElementLayerIdentity(
  element: TemplateElement,
  fallbackLayerId: string | null,
): { key: string; name: string; order: number | null; visible: boolean | null; locked: boolean | null } | null {
  const layerId = readElementPropString(element, "layerId");
  const layerName = readElementPropString(element, "layerName");
  const resolvedKey = layerId ?? layerName ?? fallbackLayerId;
  if (!resolvedKey) {
    return null;
  }

  return {
    key: resolvedKey,
    name: layerName ?? layerId ?? "Contenu",
    order: readElementPropNumber(element, "layerOrder"),
    visible: readElementPropBoolean(element, "layerVisible"),
    locked: readElementPropBoolean(element, "layerLocked"),
  };
}

function resolveElementLabel(element: TemplateElement) {
  const explicitLabel = readElementPropString(element, "label") ?? readElementPropString(element, "name") ?? readElementPropString(element, "text") ?? readElementPropString(element, "alt");
  if (explicitLabel) {
    return explicitLabel;
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
      return element.id;
  }
}

function readElementPropString(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function stripRichTextHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function readElementPropBoolean(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "boolean" ? value : null;
}

function readElementPropNumber(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasCanvasGeometryChanged(before: TemplateElement, after: TemplateElement, patch: CanvasObjectGeometryPatch) {
  return (
    !areFramesEqual(before.frame, after.frame) ||
    !areNumbersEqual(before.rotation ?? 0, after.rotation ?? 0) ||
    !areOptionalNumberArraysEqual(readElementNumberArray(before, "points"), patch.points ? readElementNumberArray(after, "points") : readElementNumberArray(before, "points"))
  );
}

function areFramesEqual(a: TemplateElement["frame"], b: TemplateElement["frame"]) {
  return areNumbersEqual(a.x, b.x) && areNumbersEqual(a.y, b.y) && areNumbersEqual(a.width, b.width) && areNumbersEqual(a.height, b.height);
}

function areNumbersEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

function readElementNumberArray(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : null;
}

function areOptionalNumberArraysEqual(a: number[] | null, b: number[] | null) {
  if (!a && !b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => areNumbersEqual(value, b[index] ?? Number.NaN));
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

function pushUndoCheckpoint(state: Pick<EditorStoreState, "undoStack" | "workingTemplate">): TemplateSchema[] {
  const next = [...state.undoStack, structuredClone(state.workingTemplate)];
  const limit = 50;
  return next.length > limit ? next.slice(next.length - limit) : next;
}
