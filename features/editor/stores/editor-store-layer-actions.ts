import type { StoreApi } from "zustand";

import { createCanvasInsertionElement, type CanvasCreationEnvelope, type CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";
import { applyCanvasLayerProps, createDefaultWorkspaceLayer } from "@/features/editor/schema/canvas-layer-object-model";
import { clampFrameToPage, appendOperationLogs, pushUndoCheckpoint } from "@/features/editor/stores/editor-store-helpers";
import type { EditorOperationLogEntry } from "@/features/editor/schema/editor-operation-log";
import { buildInsertOperationLog } from "@/features/editor/schema/editor-operation-log";
import type { TemplateSchema, TemplateElement } from "@/features/editor/schema/template-schema";

type LayerMutationState = {
  workingTemplate: TemplateSchema;
  workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]>;
};

type InsertCanvasState = {
  workingTemplate: TemplateSchema;
  workspaceLayersByPageId: Record<string, CanvasWorkspaceLayer[]>;
  activeWorkspaceLayerIdByPageId: Record<string, string | null>;
  activePageId: string;
  defaultFillColor: string;
  defaultStrokeColor: string;
  operationLogs: EditorOperationLogEntry[];
  undoStack: TemplateSchema[];
};

export { createDefaultWorkspaceLayer } from "@/features/editor/schema/canvas-layer-object-model";

export function createInitialWorkspaceLayers(template: TemplateSchema) {
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

export function updateWorkspaceLayerState(
  set: StoreApi<LayerMutationState>["setState"],
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
    const nextLayer = nextLayers.find((layer) => layer.id === input.layerId) ?? target;
    const nextTemplate: TemplateSchema = {
      ...state.workingTemplate,
      elements: state.workingTemplate.elements.map((element): TemplateElement => {
        if (element.pageId !== input.pageId || element.props?.layerId !== input.layerId) {
          return element;
        }

        return {
          ...element,
          props: applyCanvasLayerProps(element.props, nextLayer),
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

export function insertCanvasSource(
  set: StoreApi<InsertCanvasState>["setState"],
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
