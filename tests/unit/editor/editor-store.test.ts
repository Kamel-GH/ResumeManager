import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";
import { CANVAS_ARC_PRESETS, CANVAS_SHAPE_PRESETS, createCanvasArcPresetToolPayload, createCanvasShapePresetPayload } from "@/features/editor/schema/canvas-presets";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import type { EditorStoreState } from "@/features/editor/stores/editor-store";

const localStorageMock = createLocalStorageMock();
vi.stubGlobal("localStorage", localStorageMock);

const {
  deriveEditorDocumentLayersView,
  deriveEditorLayersView,
  deriveEditorObjectsView,
  filterEditorLayersView,
  filterEditorObjectsView,
} = await import("@/features/editor/selectors");

const {
  EDITOR_VIEWPORT_MAX_ZOOM,
  EDITOR_VIEWPORT_MIN_ZOOM,
  useEditorStore,
} = await import("@/features/editor/stores/editor-store");
const baselineState = useEditorStore.getState();

describe("editor store clipboard", () => {
  beforeEach(() => {
    useEditorStore.setState(createTestStoreState());
  });

  afterEach(() => {
    useEditorStore.setState(baselineState);
    localStorageMock.clear();
  });

  it("copies selected elements and pastes them as new canonical ids", () => {
    const copyResult = useEditorStore.getState().copyCanvasElements({
      elementIds: ["shape-1", "shape-2"],
    });

    expect(copyResult.copied).toBe(true);
    if (!copyResult.copied) {
      return;
    }

    const pasteResult = useEditorStore.getState().pasteCanvasElements();

    expect(pasteResult.pasted).toBe(true);
    if (!pasteResult.pasted) {
      return;
    }

    const state = useEditorStore.getState();
    expect(state.canvasClipboard?.elements).toHaveLength(2);
    expect(state.selectedElementIds).toEqual(pasteResult.ids);
    expect(new Set(pasteResult.ids).size).toBe(2);
    expect(pasteResult.ids).not.toContain("shape-1");
    expect(pasteResult.ids).not.toContain("shape-2");

    const pastedElements = state.workingTemplate.elements.filter((element) => pasteResult.ids.includes(element.id));
    expect(pastedElements).toHaveLength(2);
    expect(pastedElements[0]?.pageId).toBe("page-1");
    expect(pastedElements[0]?.frame.x).toBe(22);
    expect(pastedElements[0]?.frame.y).toBe(22);
  });

  it("copies without mutating the template or changing the selection", () => {
    const beforeState = useEditorStore.getState();
    const beforeTemplate = structuredClone(beforeState.workingTemplate);
    const beforeSelection = [...beforeState.selectedElementIds];

    const copyResult = useEditorStore.getState().copyCanvasElements({
      elementIds: ["shape-1"],
    });

    expect(copyResult.copied).toBe(true);
    expect(useEditorStore.getState().workingTemplate).toEqual(beforeTemplate);
    expect(useEditorStore.getState().selectedElementIds).toEqual(beforeSelection);
    expect(useEditorStore.getState().canvasClipboard?.elements.map((element) => element.id)).toEqual(["shape-1"]);
  });

  it("pastes into the active page and active layer when they still exist", () => {
    useEditorStore.setState((state) => ({
      activePageId: "page-2",
      workingTemplate: {
        ...state.workingTemplate,
        pages: [
          ...state.workingTemplate.pages,
          {
            id: "page-2",
            name: "Page 2",
            width: 400,
            height: 300,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
          },
        ],
      },
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-2": [
          {
            id: "layer-2",
            pageId: "page-2",
            name: "Layer 2",
            order: 1,
            visible: true,
            locked: false,
          },
        ],
      },
      activeWorkspaceLayerIdByPageId: {
        ...state.activeWorkspaceLayerIdByPageId,
        "page-2": "layer-2",
      },
    }));

    useEditorStore.getState().copyCanvasElements({
      elementIds: ["shape-1"],
    });
    const pasteResult = useEditorStore.getState().pasteCanvasElements();

    expect(pasteResult.pasted).toBe(true);
    if (!pasteResult.pasted) {
      return;
    }

    const pasted = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === pasteResult.ids[0]);
    expect(pasted?.pageId).toBe("page-2");
    expect(pasted?.props?.layerId).toBe("layer-2");
    expect(pasted?.props?.layerName).toBe("Layer 2");
  });

  it("keeps paste as a clean no-op when the clipboard is empty", () => {
    const beforeTemplate = structuredClone(useEditorStore.getState().workingTemplate);

    const pasteResult = useEditorStore.getState().pasteCanvasElements();

    expect(pasteResult.pasted).toBe(false);
    expect(useEditorStore.getState().workingTemplate).toEqual(beforeTemplate);
  });

  it("filters selection to the target page when the active page changes", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        pages: [
          ...state.workingTemplate.pages,
          {
            id: "page-2",
            name: "Page 2",
            width: 400,
            height: 300,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
          },
        ],
        elements: [
          ...state.workingTemplate.elements,
          {
            id: "page-2-shape",
            pageId: "page-2",
            type: "shape",
            frame: { x: 20, y: 20, width: 40, height: 40 },
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: { shape: "rect", selectable: true, layerId: "layer-2", layerName: "Layer 2", layerOrder: 1 },
          },
        ],
      },
      selectedElementIds: ["shape-1", "page-2-shape"],
    }));

    useEditorStore.getState().setActivePageId("page-2");

    expect(useEditorStore.getState().activePageId).toBe("page-2");
    expect(useEditorStore.getState().selectedElementIds).toEqual(["page-2-shape"]);
  });

  it("adds a real layer for the active page and can toggle its visible and locked state", () => {
    const addResult = useEditorStore.getState().addWorkspaceLayerForPage({ pageId: "page-1" });

    expect(addResult.added).toBe(true);
    if (!addResult.added) {
      return;
    }

    let state = useEditorStore.getState();
    expect(state.activeWorkspaceLayerIdByPageId["page-1"]).toBe(addResult.layerId);
    expect(state.workspaceLayersByPageId["page-1"]?.some((layer) => layer.id === addResult.layerId)).toBe(true);

    const visibilityResult = useEditorStore.getState().setWorkspaceLayerVisibility({ pageId: "page-1", layerId: addResult.layerId, visible: false });
    expect(visibilityResult.updated).toBe(true);
    state = useEditorStore.getState();
    expect(state.workspaceLayersByPageId["page-1"]?.find((layer) => layer.id === addResult.layerId)?.visible).toBe(false);

    const lockResult = useEditorStore.getState().setWorkspaceLayerLocked({ pageId: "page-1", layerId: addResult.layerId, locked: true });
    expect(lockResult.updated).toBe(true);
    state = useEditorStore.getState();
    expect(state.workspaceLayersByPageId["page-1"]?.find((layer) => layer.id === addResult.layerId)?.locked).toBe(true);
  });

  it("assigns distinct stable layer numbers that do not depend on layer order", () => {
    const firstAdd = useEditorStore.getState().addWorkspaceLayerForPage({ pageId: "page-1" });
    const secondAdd = useEditorStore.getState().addWorkspaceLayerForPage({ pageId: "page-1" });
    expect(firstAdd.added).toBe(true);
    expect(secondAdd.added).toBe(true);

    if (!firstAdd.added || !secondAdd.added) {
      return;
    }

    const beforeMoveState = useEditorStore.getState();
    const beforeMoveViews = deriveEditorLayersView(
      beforeMoveState.workingTemplate,
      beforeMoveState.workspaceLayersByPageId,
      "page-1",
      beforeMoveState.activeWorkspaceLayerIdByPageId,
      beforeMoveState.selectedWorkspaceLayerIdByPageId,
    );
    expect(beforeMoveViews.map((layer) => layer.number)).toEqual([1, 2, 3]);

    const moved = useEditorStore.getState().reorderWorkspaceLayerForPage({
      pageId: "page-1",
      layerId: secondAdd.layerId,
      targetLayerId: "layer-1",
      position: "before",
    });
    expect(moved.reordered).toBe(true);

    const afterMoveState = useEditorStore.getState();
    const afterMoveViews = deriveEditorLayersView(
      afterMoveState.workingTemplate,
      afterMoveState.workspaceLayersByPageId,
      "page-1",
      afterMoveState.activeWorkspaceLayerIdByPageId,
      afterMoveState.selectedWorkspaceLayerIdByPageId,
    );
    expect(afterMoveViews.map((layer) => ({ id: layer.id, number: layer.number, order: layer.order }))).toEqual([
      { id: secondAdd.layerId, number: 3, order: 1 },
      { id: "layer-1", number: 1, order: 2 },
      { id: firstAdd.layerId, number: 2, order: 3 },
    ]);
  });

  it("derives document layer rows with only the active page layer marked active", () => {
    useEditorStore.setState((state) => ({
      activePageId: "page-2",
      workingTemplate: {
        ...state.workingTemplate,
        pages: [
          ...state.workingTemplate.pages,
          { id: "page-2", name: "Page 2", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
          { id: "page-3", name: "Page 3", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
        ],
        elements: state.workingTemplate.elements.map((element) => ({
          ...element,
          props: {
            ...element.props,
            layerId: "page-1:layer-1",
            layerName: "Contenu",
            layerOrder: 1,
          },
        })),
      },
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [{ id: "page-1:layer-1", pageId: "page-1", name: "Contenu", order: 1, visible: true, locked: false }],
        "page-2": [{ id: "page-2:layer-1", pageId: "page-2", name: "Contenu", order: 1, visible: true, locked: false }],
        "page-3": [{ id: "page-3:layer-1", pageId: "page-3", name: "Contenu", order: 1, visible: true, locked: false }],
      },
      activeWorkspaceLayerIdByPageId: {
        ...state.activeWorkspaceLayerIdByPageId,
        "page-1": "page-1:layer-1",
        "page-2": "page-2:layer-1",
        "page-3": "page-3:layer-1",
      },
    }));

    const state = useEditorStore.getState();
    const documentLayers = deriveEditorDocumentLayersView(state.workingTemplate, state.workspaceLayersByPageId, state.activePageId, state.activeWorkspaceLayerIdByPageId, state.selectedWorkspaceLayerIdByPageId);

    expect(documentLayers.map((layer) => ({ id: layer.id, number: layer.number, order: layer.order, active: layer.active }))).toEqual([
      { id: "page-1:layer-1", number: 1, order: 1, active: false },
      { id: "page-2:layer-1", number: 2, order: 1, active: true },
      { id: "page-3:layer-1", number: 3, order: 1, active: false },
    ]);
    expect(documentLayers.filter((layer) => layer.active)).toHaveLength(1);
  });

  it("reorders layers within the active page without changing ids or moving objects between layers", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: true, locked: false },
          { id: "layer-3", pageId: "page-1", name: "Layer 3", order: 3, visible: true, locked: false },
        ],
      },
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => {
          if (element.id === "shape-1") {
            return {
              ...element,
              props: {
                ...element.props,
                layerId: "layer-1",
                layerName: "Layer 1",
                layerOrder: 1,
              },
            };
          }

          if (element.id === "shape-2") {
            return {
              ...element,
              props: {
                ...element.props,
                layerId: "layer-2",
                layerName: "Layer 2",
                layerOrder: 2,
              },
            };
          }

          return element;
        }),
      },
    }));

    const beforeElements = structuredClone(useEditorStore.getState().workingTemplate.elements);
    const result = useEditorStore.getState().reorderWorkspaceLayerForPage({
      pageId: "page-1",
      layerId: "layer-3",
      targetLayerId: "layer-1",
      position: "before",
    });

    expect(result.reordered).toBe(true);

    const state = useEditorStore.getState();
    expect(state.workspaceLayersByPageId["page-1"]?.map((layer) => ({ id: layer.id, order: layer.order }))).toEqual([
      { id: "layer-3", order: 1 },
      { id: "layer-1", order: 2 },
      { id: "layer-2", order: 3 },
    ]);

    expect(state.workingTemplate.elements.map((element) => element.id)).toEqual(beforeElements.map((element) => element.id));
    expect(state.workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.layerId).toBe("layer-1");
    expect(state.workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.layerOrder).toBe(2);
    expect(state.workingTemplate.elements.find((element) => element.id === "shape-2")?.props?.layerId).toBe("layer-2");
    expect(state.workingTemplate.elements.find((element) => element.id === "shape-2")?.props?.layerOrder).toBe(3);

    const layerViews = deriveEditorLayersView(state.workingTemplate, state.workspaceLayersByPageId, "page-1", state.activeWorkspaceLayerIdByPageId);
    expect(layerViews.map((layer) => ({ id: layer.id, number: layer.number, order: layer.order }))).toEqual([
      { id: "layer-3", number: 3, order: 1 },
      { id: "layer-1", number: 1, order: 2 },
      { id: "layer-2", number: 2, order: 3 },
    ]);
  });

  it("derives active layer state and real objects for the layer hierarchy", () => {
    useEditorStore.setState((state) => ({
      activeWorkspaceLayerIdByPageId: {
        ...state.activeWorkspaceLayerIdByPageId,
        "page-1": "layer-1",
      },
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) =>
          element.id === "shape-1"
            ? {
                ...element,
                props: {
                  ...element.props,
                  groupId: "group-1",
                },
              }
            : element,
        ),
      },
    }));

    const state = useEditorStore.getState();
    const layerViews = deriveEditorLayersView(state.workingTemplate, state.workspaceLayersByPageId, "page-1", state.activeWorkspaceLayerIdByPageId);
    const objectViews = deriveEditorObjectsView(state.workingTemplate, state.selectedElementIds, "page-1");

    expect(layerViews.find((layer) => layer.id === "layer-1")?.active).toBe(true);
    expect(objectViews.filter((object) => object.layerId === "layer-1").map((object) => object.id)).toEqual(["shape-1", "shape-2"]);
    expect(objectViews.find((object) => object.id === "shape-1")?.grouped).toBe(true);
  });

  it("derives object rows with stable layer numbers and selected state from selectedElementIds", () => {
    useEditorStore.setState((state) => ({
      selectedElementIds: ["shape-1", "shape-2"],
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: true, locked: false },
          { id: "layer-3", pageId: "page-1", name: "Layer 3", order: 3, visible: true, locked: false },
        ],
      },
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => ({
          ...element,
          props: {
            ...element.props,
            layerId: element.id === "shape-1" ? "layer-2" : "layer-3",
            layerName: element.id === "shape-1" ? "Layer 2" : "Layer 3",
            layerOrder: 1,
          },
        })),
      },
    }));

    const state = useEditorStore.getState();
    const objectViews = deriveEditorObjectsView(state.workingTemplate, state.selectedElementIds, "page-1");
    expect(objectViews.map((object) => ({ id: object.id, layerNumber: object.layerNumber, selected: object.selected }))).toEqual([
      { id: "shape-1", layerNumber: 2, selected: true },
      { id: "shape-2", layerNumber: 3, selected: true },
    ]);
  });

  it("keeps selected layer and active layer as distinct states", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: true, locked: false },
        ],
      },
      activeWorkspaceLayerIdByPageId: {
        ...state.activeWorkspaceLayerIdByPageId,
        "page-1": "layer-1",
      },
      selectedWorkspaceLayerIdByPageId: {
        ...state.selectedWorkspaceLayerIdByPageId,
        "page-1": "layer-2",
      },
    }));

    const state = useEditorStore.getState();
    const layerViews = deriveEditorLayersView(state.workingTemplate, state.workspaceLayersByPageId, "page-1", state.activeWorkspaceLayerIdByPageId, state.selectedWorkspaceLayerIdByPageId);

    expect(layerViews.find((layer) => layer.id === "layer-1")?.active).toBe(true);
    expect(layerViews.find((layer) => layer.id === "layer-1")?.selected).toBe(false);
    expect(layerViews.find((layer) => layer.id === "layer-2")?.active).toBe(false);
    expect(layerViews.find((layer) => layer.id === "layer-2")?.selected).toBe(true);
  });

  it("renames an existing selected layer without changing id or order", () => {
    const result = useEditorStore.getState().renameWorkspaceLayerForPage({
      pageId: "page-1",
      layerId: "layer-1",
      name: "Identité",
    });

    expect(result.renamed).toBe(true);
    const layer = useEditorStore.getState().workspaceLayersByPageId["page-1"]?.find((item) => item.id === "layer-1");
    expect(layer).toMatchObject({ id: "layer-1", name: "Identité", order: 1 });
    expect(useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.layerName).toBe("Identité");
  });

  it("deletes only empty non-last layers and leaves object layers intact", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-empty", pageId: "page-1", name: "Empty", order: 2, visible: true, locked: false },
        ],
      },
      selectedWorkspaceLayerIdByPageId: {
        ...state.selectedWorkspaceLayerIdByPageId,
        "page-1": "layer-empty",
      },
    }));

    const blocked = useEditorStore.getState().deleteWorkspaceLayerForPage({ pageId: "page-1", layerId: "layer-1" });
    expect(blocked.deleted).toBe(false);

    const deleted = useEditorStore.getState().deleteWorkspaceLayerForPage({ pageId: "page-1", layerId: "layer-empty" });
    expect(deleted.deleted).toBe(true);
    expect(useEditorStore.getState().workspaceLayersByPageId["page-1"]?.map((layer) => layer.id)).toEqual(["layer-1"]);
    expect(useEditorStore.getState().workingTemplate.elements.every((element) => element.props?.layerId === "layer-1")).toBe(true);
  });

  it("moves the selected layer up and down by changing only layerOrder", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: true, locked: false },
          { id: "layer-3", pageId: "page-1", name: "Layer 3", order: 3, visible: true, locked: false },
        ],
      },
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => ({
          ...element,
          props: {
            ...element.props,
            layerId: element.id === "shape-1" ? "layer-2" : "layer-1",
            layerName: element.id === "shape-1" ? "Layer 2" : "Layer 1",
            layerOrder: element.id === "shape-1" ? 2 : 1,
          },
        })),
      },
    }));

    const result = useEditorStore.getState().moveWorkspaceLayerForPage({ pageId: "page-1", layerId: "layer-2", direction: "up" });
    expect(result.reordered).toBe(true);

    const state = useEditorStore.getState();
    expect(state.workspaceLayersByPageId["page-1"]?.map((layer) => ({ id: layer.id, number: Number(layer.id.replace("layer-", "")), order: layer.order }))).toEqual([
      { id: "layer-2", number: 2, order: 1 },
      { id: "layer-1", number: 1, order: 2 },
      { id: "layer-3", number: 3, order: 3 },
    ]);
    expect(state.workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.layerId).toBe("layer-2");
    expect(state.workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.layerOrder).toBe(1);
  });

  it("deletes multiple selected empty layers while keeping non-empty layers", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-empty-2", pageId: "page-1", name: "Empty 2", order: 2, visible: true, locked: false },
          { id: "layer-empty-3", pageId: "page-1", name: "Empty 3", order: 3, visible: true, locked: false },
        ],
      },
      activeWorkspaceLayerIdByPageId: {
        ...state.activeWorkspaceLayerIdByPageId,
        "page-1": "layer-empty-2",
      },
    }));

    const result = useEditorStore.getState().deleteWorkspaceLayersForPage({
      pageId: "page-1",
      layerIds: ["layer-1", "layer-empty-2", "layer-empty-3"],
    });

    expect(result.deleted).toBe(true);
    if (!result.deleted) {
      return;
    }
    expect(result.layerIds).toEqual(["layer-empty-2", "layer-empty-3"]);
    expect(result.skippedIds).toEqual(["layer-1"]);
    expect(useEditorStore.getState().workspaceLayersByPageId["page-1"]?.map((layer) => layer.id)).toEqual(["layer-1"]);
    expect(useEditorStore.getState().activeWorkspaceLayerIdByPageId["page-1"]).toBe("layer-1");
  });

  it("merges selected layers into the active selected layer without duplicating objects", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: false, locked: true },
        ],
      },
      activeWorkspaceLayerIdByPageId: {
        ...state.activeWorkspaceLayerIdByPageId,
        "page-1": "layer-2",
      },
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => ({
          ...element,
          props: {
            ...element.props,
            layerId: element.id === "shape-1" ? "layer-1" : "layer-2",
            layerName: element.id === "shape-1" ? "Layer 1" : "Layer 2",
            layerOrder: element.id === "shape-1" ? 1 : 2,
          },
        })),
      },
    }));

    const beforeFrames = useEditorStore.getState().workingTemplate.elements.map((element) => ({ id: element.id, frame: element.frame, zIndex: element.zIndex }));
    const result = useEditorStore.getState().mergeWorkspaceLayersForPage({
      pageId: "page-1",
      layerIds: ["layer-1", "layer-2"],
    });

    expect(result.merged).toBe(true);
    if (!result.merged) {
      return;
    }
    expect(result.targetLayerId).toBe("layer-2");
    expect(result.removedLayerIds).toEqual(["layer-1"]);
    const state = useEditorStore.getState();
    expect(state.workspaceLayersByPageId["page-1"]?.map((layer) => layer.id)).toEqual(["layer-2"]);
    expect(deriveEditorLayersView(state.workingTemplate, state.workspaceLayersByPageId, "page-1", state.activeWorkspaceLayerIdByPageId).map((layer) => ({ id: layer.id, number: layer.number }))).toEqual([{ id: "layer-2", number: 2 }]);
    expect(state.workingTemplate.elements).toHaveLength(2);
    expect(state.workingTemplate.elements.map((element) => ({ id: element.id, frame: element.frame, zIndex: element.zIndex }))).toEqual(beforeFrames);
    expect(state.workingTemplate.elements.every((element) => element.props?.layerId === "layer-2")).toBe(true);
  });

  it("moves multiple selected layers while preserving their relative order and stable numbers", () => {
    useEditorStore.setState((state) => ({
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: true, locked: false },
          { id: "layer-3", pageId: "page-1", name: "Layer 3", order: 3, visible: true, locked: false },
          { id: "layer-4", pageId: "page-1", name: "Layer 4", order: 4, visible: true, locked: false },
        ],
      },
    }));

    const result = useEditorStore.getState().moveWorkspaceLayersForPage({
      pageId: "page-1",
      layerIds: ["layer-2", "layer-3"],
      direction: "down",
    });

    expect(result.reordered).toBe(true);
    const state = useEditorStore.getState();
    expect(state.workspaceLayersByPageId["page-1"]?.map((layer) => ({ id: layer.id, order: layer.order }))).toEqual([
      { id: "layer-1", order: 1 },
      { id: "layer-4", order: 2 },
      { id: "layer-2", order: 3 },
      { id: "layer-3", order: 4 },
    ]);
    const layerViews = deriveEditorLayersView(state.workingTemplate, state.workspaceLayersByPageId, "page-1", state.activeWorkspaceLayerIdByPageId, state.selectedWorkspaceLayerIdByPageId);
    expect(layerViews.map((layer) => ({ id: layer.id, number: layer.number }))).toEqual([
      { id: "layer-1", number: 1 },
      { id: "layer-4", number: 4 },
      { id: "layer-2", number: 2 },
      { id: "layer-3", number: 3 },
    ]);
  });

  it("filters layer views by page, visibility and lock state without mutating source rows", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        pages: [
          ...state.workingTemplate.pages,
          {
            id: "page-2",
            name: "Page 2",
            width: 400,
            height: 300,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
          },
        ],
      },
      workspaceLayersByPageId: {
        ...state.workspaceLayersByPageId,
        "page-1": [
          { id: "layer-1", pageId: "page-1", name: "Layer 1", order: 1, visible: true, locked: false },
          { id: "layer-2", pageId: "page-1", name: "Layer 2", order: 2, visible: false, locked: true },
        ],
        "page-2": [{ id: "page-2:layer-1", pageId: "page-2", name: "Layer P2", order: 1, visible: true, locked: false }],
      },
    }));

    const state = useEditorStore.getState();
    const pageOneLayers = deriveEditorLayersView(state.workingTemplate, state.workspaceLayersByPageId, "page-1", state.activeWorkspaceLayerIdByPageId);
    const filtered = filterEditorLayersView(pageOneLayers, {
      page: "1",
      visibility: "hidden",
      lock: "locked",
    });

    expect(filtered.map((layer) => layer.id)).toEqual(["layer-2"]);
    expect(pageOneLayers).toHaveLength(2);
    expect(useEditorStore.getState().workspaceLayersByPageId["page-1"]).toHaveLength(2);
  });

  it("filters object views by type, layer and page without mutating source rows", () => {
    useEditorStore.setState((state) => ({
      selectedElementIds: ["shape-2"],
      workingTemplate: {
        ...state.workingTemplate,
        pages: [
          ...state.workingTemplate.pages,
          {
            id: "page-2",
            name: "Page 2",
            width: 400,
            height: 300,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
          },
        ],
        elements: [
          ...state.workingTemplate.elements.map((element) => ({
            ...element,
            props: {
              ...element.props,
              layerId: element.id === "shape-1" ? "layer-1" : "layer-2",
              layerName: element.id === "shape-1" ? "Layer 1" : "Layer 2",
              layerOrder: element.id === "shape-1" ? 1 : 2,
            },
          })),
          {
            id: "text-page-2",
            pageId: "page-2",
            type: "text",
            frame: { x: 10, y: 10, width: 80, height: 24 },
            rotation: 0,
            zIndex: 1,
            locked: false,
            visible: true,
            props: { text: "Page 2", layerId: "page-2:layer-1", layerName: "Layer P2", layerOrder: 1 },
          },
        ],
      },
    }));

    const state = useEditorStore.getState();
    const objectViews = state.workingTemplate.pages.flatMap((page) => deriveEditorObjectsView(state.workingTemplate, state.selectedElementIds, page.id));
    const filteredByType = filterEditorObjectsView(objectViews, { type: "text" });
    const filteredByLayer = filterEditorObjectsView(objectViews, { layer: "layer-2" });
    const filteredByPage = filterEditorObjectsView(objectViews, { page: "2" });

    expect(filteredByType.map((object) => object.id)).toEqual(["text-page-2"]);
    expect(filteredByLayer.map((object) => ({ id: object.id, selected: object.selected }))).toEqual([{ id: "shape-2", selected: true }]);
    expect(filteredByPage.map((object) => object.id)).toEqual(["text-page-2"]);
    expect(objectViews).toHaveLength(3);
    expect(useEditorStore.getState().workingTemplate.elements).toHaveLength(3);
  });

  it("duplicates multiple selected objects with new ids, offset, same page and same layer", () => {
    const duplicateResult = useEditorStore.getState().duplicateCanvasElements({
      elementIds: ["shape-1", "shape-2"],
    });

    expect(duplicateResult.duplicated).toBe(true);
    if (!duplicateResult.duplicated) {
      return;
    }

    const state = useEditorStore.getState();
    const duplicated = state.workingTemplate.elements.filter((element) => duplicateResult.ids.includes(element.id));

    expect(duplicated).toHaveLength(2);
    expect(state.selectedElementIds).toEqual(duplicateResult.ids);
    expect(new Set(duplicateResult.ids).size).toBe(2);
    expect(duplicateResult.ids).not.toContain("shape-1");
    expect(duplicated[0]).toMatchObject({
      pageId: "page-1",
      frame: { x: 22, y: 22, width: 40, height: 40 },
      props: expect.objectContaining({ layerId: "layer-1" }),
    });
    expect(duplicated[1]).toMatchObject({
      pageId: "page-1",
      frame: { x: 82, y: 22, width: 40, height: 40 },
      props: expect.objectContaining({ layerId: "layer-1" }),
    });
  });

  it("deletes only selected editable objects and updates selection", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => (element.id === "shape-2" ? { ...element, locked: true } : element)),
      },
      selectedElementIds: ["shape-1", "shape-2"],
    }));

    const deleteResult = useEditorStore.getState().deleteCanvasElements({
      elementIds: ["shape-1", "shape-2"],
    });

    expect(deleteResult.deleted).toBe(true);
    if (!deleteResult.deleted) {
      return;
    }

    const state = useEditorStore.getState();
    expect(deleteResult.ids).toEqual(["shape-1"]);
    expect(state.workingTemplate.elements.map((element) => element.id)).toEqual(["shape-2"]);
    expect(state.selectedElementIds).toEqual(["shape-2"]);
  });

  it("reorders selected objects through the canonical store path while preserving selection and layer parent", () => {
    useEditorStore.setState({ selectedElementIds: ["shape-1"] });

    const result = useEditorStore.getState().reorderCanvasElements({
      elementIds: ["shape-1"],
      action: "bring-to-front",
    });

    expect(result.reordered).toBe(true);
    const state = useEditorStore.getState();
    const shape1 = state.workingTemplate.elements.find((element) => element.id === "shape-1");
    const shape2 = state.workingTemplate.elements.find((element) => element.id === "shape-2");

    expect(state.selectedElementIds).toEqual(["shape-1"]);
    expect(shape1?.zIndex).toBe(2);
    expect(shape2?.zIndex).toBe(1);
    expect(shape1?.pageId).toBe("page-1");
    expect(shape1?.props?.layerId).toBe("layer-1");
    expect(shape1?.props?.layerOrder).toBe(1);
  });

  it("keeps impossible reorder actions as clean no-ops without changing selection", () => {
    useEditorStore.setState({ selectedElementIds: ["shape-2"] });
    const beforeTemplate = structuredClone(useEditorStore.getState().workingTemplate);

    const result = useEditorStore.getState().reorderCanvasElements({
      elementIds: ["shape-2"],
      action: "bring-forward",
    });

    expect(result.reordered).toBe(false);
    expect(useEditorStore.getState().workingTemplate).toEqual(beforeTemplate);
    expect(useEditorStore.getState().selectedElementIds).toEqual(["shape-2"]);
  });

  it("flips selected objects through the canonical store path while preserving selection and parents", () => {
    useEditorStore.setState({ selectedElementIds: ["shape-1"] });

    const horizontalResult = useEditorStore.getState().flipCanvasElements({
      elementIds: ["shape-1"],
      axis: "horizontal",
    });

    expect(horizontalResult.flipped).toBe(true);
    const flippedHorizontal = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1");
    expect(flippedHorizontal?.props?.flipX).toBe(true);
    expect(flippedHorizontal?.id).toBe("shape-1");
    expect(flippedHorizontal?.pageId).toBe("page-1");
    expect(flippedHorizontal?.props?.layerId).toBe("layer-1");
    expect(useEditorStore.getState().selectedElementIds).toEqual(["shape-1"]);

    const verticalResult = useEditorStore.getState().flipCanvasElements({
      elementIds: ["shape-1"],
      axis: "vertical",
    });

    expect(verticalResult.flipped).toBe(true);
    const flippedBoth = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1");
    expect(flippedBoth?.props?.flipX).toBe(true);
    expect(flippedBoth?.props?.flipY).toBe(true);

    const flippedBack = useEditorStore.getState().flipCanvasElements({
      elementIds: ["shape-1"],
      axis: "horizontal",
    });

    expect(flippedBack.flipped).toBe(true);
    expect(useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.flipX).toBe(false);
  });

  it("keeps flip as a no-op for locked selected objects", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => (element.id === "shape-1" ? { ...element, locked: true } : element)),
      },
      selectedElementIds: ["shape-1"],
    }));

    const result = useEditorStore.getState().flipCanvasElements({
      elementIds: ["shape-1"],
      axis: "horizontal",
    });

    expect(result.flipped).toBe(false);
    expect(useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.flipX).toBeUndefined();
    expect(useEditorStore.getState().selectedElementIds).toEqual(["shape-1"]);
  });

  it("keeps canonical flip flags after a drag geometry commit", () => {
    useEditorStore.setState({ selectedElementIds: ["shape-1"] });
    const flipResult = useEditorStore.getState().flipCanvasElements({
      elementIds: ["shape-1"],
      axis: "horizontal",
    });
    expect(flipResult.flipped).toBe(true);

    const commitResult = useEditorStore.getState().commitCanvasObjectGeometry({
      pageId: "page-1",
      patches: [
        {
          id: "shape-1",
          frame: { x: 96, y: 84, width: 40, height: 40 },
          rotation: 0,
        },
      ],
    });

    expect(commitResult.committed).toBe(true);
    const element = useEditorStore.getState().workingTemplate.elements.find((candidate) => candidate.id === "shape-1");
    expect(element?.frame).toEqual({ x: 96, y: 84, width: 40, height: 40 });
    expect(element?.props?.flipX).toBe(true);
    expect(element?.id).toBe("shape-1");
    expect(element?.pageId).toBe("page-1");
    expect(element?.props?.layerId).toBe("layer-1");
    expect(useEditorStore.getState().selectedElementIds).toEqual(["shape-1"]);
  });

  it.each([
    ["align-left", [{ x: 10, y: 10 }, { x: 10, y: 70 }, { x: 10, y: 130 }]],
    ["align-center-horizontal", [{ x: 70, y: 10 }, { x: 70, y: 70 }, { x: 70, y: 130 }]],
    ["align-right", [{ x: 130, y: 10 }, { x: 130, y: 70 }, { x: 130, y: 130 }]],
    ["align-top", [{ x: 10, y: 10 }, { x: 70, y: 10 }, { x: 130, y: 10 }]],
    ["align-center-vertical", [{ x: 10, y: 70 }, { x: 70, y: 70 }, { x: 130, y: 70 }]],
    ["align-bottom", [{ x: 10, y: 130 }, { x: 70, y: 130 }, { x: 130, y: 130 }]],
  ] as const)("aligns selected objects through the store with %s", (alignment, expectedPositions) => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: [
          {
            ...state.workingTemplate.elements[0],
            id: "align-1",
            frame: { x: 10, y: 10, width: 40, height: 40 },
          },
          {
            ...state.workingTemplate.elements[1],
            id: "align-2",
            frame: { x: 70, y: 70, width: 40, height: 40 },
          },
          {
            ...state.workingTemplate.elements[1],
            id: "align-3",
            zIndex: 3,
            frame: { x: 130, y: 130, width: 40, height: 40 },
          },
        ],
      },
      selectedElementIds: ["align-1", "align-2", "align-3"],
    }));

    const result = useEditorStore.getState().alignCanvasElements({
      elementIds: ["align-1", "align-2", "align-3"],
      alignment,
    });

    expect(result.aligned).toBe(true);
    const state = useEditorStore.getState();
    expect(state.selectedElementIds).toEqual(["align-1", "align-2", "align-3"]);
    ["align-1", "align-2", "align-3"].forEach((id, index) => {
      const element = state.workingTemplate.elements.find((candidate) => candidate.id === id);
      expect(element?.frame.x).toBe(expectedPositions[index].x);
      expect(element?.frame.y).toBe(expectedPositions[index].y);
      expect(element?.pageId).toBe("page-1");
      expect(element?.props?.layerId).toBe("layer-1");
      expect(element?.props?.layerOrder).toBe(1);
    });
  });

  it("keeps single-object store alignment as a no-op without changing selection", () => {
    useEditorStore.setState({ selectedElementIds: ["shape-1"] });
    const beforeTemplate = structuredClone(useEditorStore.getState().workingTemplate);

    const result = useEditorStore.getState().alignCanvasElements({
      elementIds: ["shape-1"],
      alignment: "align-left",
    });

    expect(result.aligned).toBe(false);
    expect(useEditorStore.getState().workingTemplate).toEqual(beforeTemplate);
    expect(useEditorStore.getState().selectedElementIds).toEqual(["shape-1"]);
  });

  it("creates a single canonical object on drop and selects it", () => {
    const result = useEditorStore.getState().insertCanvasDropPayload({
      pageId: "page-1",
      point: { x: 180, y: 120 },
      source: {
        type: "text-block",
        payload: {
          name: "Contact",
          label: "Contact",
          preview: "<p>Contact</p>",
          html: "<p>Contact</p>",
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    const state = useEditorStore.getState();
    const inserted = state.workingTemplate.elements.find((element) => element.id === result.elementId);

    expect(state.selectedElementIds).toEqual([result.elementId]);
    expect(inserted).toBeDefined();
    expect(inserted?.pageId).toBe("page-1");
    expect(inserted?.frame.x).not.toBe(0);
    expect(inserted?.frame.y).not.toBe(0);
  });

  it("inserts shape presets through the canonical store path and selects the created object", () => {
    const starPreset = CANVAS_SHAPE_PRESETS.find((preset) => preset.id === "shape-star");
    expect(starPreset).toBeDefined();
    if (!starPreset) {
      return;
    }

    const beforeCount = useEditorStore.getState().workingTemplate.elements.length;
    const result = useEditorStore.getState().insertCanvasDropPayload({
      pageId: "page-1",
      point: { x: 120, y: 140 },
      source: {
        type: "shape",
        payload: createCanvasShapePresetPayload(starPreset),
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    const state = useEditorStore.getState();
    const inserted = state.workingTemplate.elements.find((element) => element.id === result.elementId);
    expect(state.workingTemplate.elements).toHaveLength(beforeCount + 1);
    expect(state.selectedElementIds).toEqual([result.elementId]);
    expect(inserted?.props).toMatchObject({
      presetId: "shape-star",
      presetKind: "star",
      svg: expect.stringContaining("<svg"),
    });
  });

  it("inserts arc presets through the canonical store path and selects the created object", () => {
    const arcPreset = CANVAS_ARC_PRESETS.find((preset) => preset.id === "arc-pie");
    expect(arcPreset).toBeDefined();
    if (!arcPreset) {
      return;
    }

    const frame = { x: 90, y: 100, width: arcPreset.defaultFrame.width, height: arcPreset.defaultFrame.height };
    const beforeCount = useEditorStore.getState().workingTemplate.elements.length;
    const result = useEditorStore.getState().insertCanvasToolPayload({
      pageId: "page-1",
      frame,
      source: {
        type: "canvas-tool",
        payload: createCanvasArcPresetToolPayload(arcPreset, frame),
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    const state = useEditorStore.getState();
    const inserted = state.workingTemplate.elements.find((element) => element.id === result.elementId);
    expect(state.workingTemplate.elements).toHaveLength(beforeCount + 1);
    expect(state.selectedElementIds).toEqual([result.elementId]);
    expect(inserted?.props).toMatchObject({
      presetId: "arc-pie",
      shape: "arc",
      arcType: "pie",
      label: "Secteur",
    });
  });

  it("keeps library dragstart as transient context without creating canvas objects", () => {
    const beforeCount = useEditorStore.getState().workingTemplate.elements.length;

    useEditorStore.getState().setDragTraceContext({
      sessionId: "test-drag",
      type: "image",
      sourcePanel: "libraries",
      payload: {
        name: "Image",
        src: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"/>",
      },
    });

    expect(useEditorStore.getState().workingTemplate.elements).toHaveLength(beforeCount);
    expect(useEditorStore.getState().dragTraceContext?.sessionId).toBe("test-drag");

    useEditorStore.getState().clearDragTraceContext();

    expect(useEditorStore.getState().workingTemplate.elements).toHaveLength(beforeCount);
    expect(useEditorStore.getState().dragTraceContext).toBeNull();
  });

  it("stores non destructive image editing parameters without changing the image container", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: [
          ...state.workingTemplate.elements,
          {
            id: "image-1",
            pageId: "page-1",
            type: "image",
            frame: { x: 20, y: 30, width: 120, height: 90 },
            rotation: 12,
            zIndex: 3,
            locked: false,
            visible: true,
            props: {
              src: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"/>",
              layerId: "layer-1",
              layerName: "Layer 1",
              layerOrder: 1,
            },
          },
        ],
      },
      selectedElementIds: ["image-1"],
    }));

    const before = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "image-1");
    const result = useEditorStore.getState().updateImageElementEditing({
      elementId: "image-1",
      imageEditing: {
        crop: { ratio: "1:1", zoom: 1.4, x: 0.2, y: -0.1, rotation: 8 },
        mask: { type: "circle", radius: 0, bounds: { x: 0.1, y: 0.15, width: 0.75, height: 0.6 } },
        filter: "grayscale",
        adjustments: {
          brightness: 0.15,
          contrast: 0.2,
          saturation: -0.1,
          exposure: 0,
          temperature: 0,
          hue: 0,
          blur: 0,
          sharpness: 0,
          opacity: 0.85,
          shadow: 0,
          vignette: 0,
          grain: 0,
        },
        transform: { flipX: true, flipY: false, rotation: 90 },
      },
    });

    expect(result.updated).toBe(true);
    const after = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "image-1");
    expect(after?.props?.imageEditing).toMatchObject({
      crop: { ratio: "1:1", zoom: 1.4 },
      mask: { type: "circle", bounds: { x: 0.1, y: 0.15, width: 0.75, height: 0.6 } },
      filter: "grayscale",
      transform: { flipX: true, rotation: 90 },
    });
    expect(after?.id).toBe(before?.id);
    expect(after?.pageId).toBe(before?.pageId);
    expect(after?.frame).toEqual(before?.frame);
    expect(after?.rotation).toBe(before?.rotation);
    expect(after?.zIndex).toBe(before?.zIndex);
    expect(after?.props?.src).toBe(before?.props?.src);
    expect(useEditorStore.getState().selectedElementIds).toEqual(["image-1"]);
  });

  it("commits canvas drag geometry at drag end while preserving selection and layer parent", () => {
    const before = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1");
    expect(before).toBeDefined();
    if (!before) {
      return;
    }

    const result = useEditorStore.getState().commitCanvasObjectGeometry({
      pageId: "page-1",
      patches: [
        {
          id: "shape-1",
          frame: { x: 120, y: 90, width: before.frame.width, height: before.frame.height },
          rotation: before.rotation ?? 0,
        },
      ],
    });

    expect(result.committed).toBe(true);
    const state = useEditorStore.getState();
    const after = state.workingTemplate.elements.find((element) => element.id === "shape-1");

    expect(state.workingTemplate.elements).toHaveLength(2);
    expect(state.selectedElementIds).toEqual(["shape-1"]);
    expect(after?.frame).toEqual({ x: 120, y: 90, width: before.frame.width, height: before.frame.height });
    expect(after?.pageId).toBe(before.pageId);
    expect(after?.props?.layerId).toBe(before.props?.layerId);
  });

  it("does not move locked objects through drag geometry commits", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: state.workingTemplate.elements.map((element) => (element.id === "shape-1" ? { ...element, locked: true } : element)),
      },
      selectedElementIds: ["shape-1"],
    }));

    const before = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1");
    expect(before).toBeDefined();
    if (!before) {
      return;
    }

    const result = useEditorStore.getState().commitCanvasObjectGeometry({
      pageId: "page-1",
      patches: [
        {
          id: "shape-1",
          frame: { x: 180, y: 140, width: before.frame.width, height: before.frame.height },
          rotation: before.rotation ?? 0,
        },
      ],
    });

    expect(result.committed).toBe(false);
    const after = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1");
    expect(after?.frame).toEqual(before.frame);
    expect(useEditorStore.getState().selectedElementIds).toEqual(["shape-1"]);
  });

  it("toggles ruler mode without changing visibility, grid or snap settings", () => {
    const before = useEditorStore.getState().workspaceSettings;

    useEditorStore.getState().setWorkspaceSettings({ rulerMode: "global" });
    let settings = useEditorStore.getState().workspaceSettings;

    expect(settings.rulerMode).toBe("global");
    expect(settings.rulersVisible).toBe(before.rulersVisible);
    expect(settings.gridEnabled).toBe(before.gridEnabled);
    expect(settings.snapEnabled).toBe(before.snapEnabled);

    useEditorStore.getState().setWorkspaceSettings({ rulerMode: "page" });
    settings = useEditorStore.getState().workspaceSettings;

    expect(settings.rulerMode).toBe("page");
    expect(settings.rulersVisible).toBe(before.rulersVisible);
    expect(settings.gridEnabled).toBe(before.gridEnabled);
    expect(settings.snapEnabled).toBe(before.snapEnabled);
  });

  it("clamps zoom updates and keeps pan limited to viewport state", () => {
    const beforeTemplate = structuredClone(useEditorStore.getState().workingTemplate);

    useEditorStore.getState().setZoom(10);
    expect(useEditorStore.getState().viewport.zoom).toBe(EDITOR_VIEWPORT_MAX_ZOOM);

    useEditorStore.getState().setZoom(0.05);
    expect(useEditorStore.getState().viewport.zoom).toBe(EDITOR_VIEWPORT_MIN_ZOOM);

    useEditorStore.getState().setZoom(1);
    useEditorStore.getState().setViewportPan({ panX: 42, panY: -18 });

    expect(useEditorStore.getState().viewport).toEqual({ zoom: 1, panX: 42, panY: -18 });
    expect(useEditorStore.getState().workingTemplate).toEqual(beforeTemplate);
  });

  it("toggles placement helpers independently from template data", () => {
    const beforeTemplate = structuredClone(useEditorStore.getState().workingTemplate);

    useEditorStore.getState().setWorkspaceSettings({
      gridEnabled: false,
      rulersVisible: false,
      snapEnabled: false,
    });

    expect(useEditorStore.getState().workspaceSettings.gridEnabled).toBe(false);
    expect(useEditorStore.getState().workspaceSettings.rulersVisible).toBe(false);
    expect(useEditorStore.getState().workspaceSettings.snapEnabled).toBe(false);
    expect(useEditorStore.getState().workingTemplate).toEqual(beforeTemplate);
  });

  it("adds a real page with a default layer and activates it", () => {
    const before = useEditorStore.getState();
    const beforePageCount = before.workingTemplate.pages.length;

    const result = useEditorStore.getState().addTemplatePage();

    expect(result.added).toBe(true);
    if (!result.added) {
      return;
    }

    const state = useEditorStore.getState();
    const addedPage = state.workingTemplate.pages.find((page) => page.id === result.pageId);
    expect(state.workingTemplate.pages).toHaveLength(beforePageCount + 1);
    expect(addedPage).toMatchObject({
      id: result.pageId,
      name: "Page 2",
      width: before.workingTemplate.pages[0]?.width,
      height: before.workingTemplate.pages[0]?.height,
      margin: before.workingTemplate.pages[0]?.margin,
    });
    expect(state.activePageId).toBe(result.pageId);
    expect(state.selectedElementIds).toEqual([]);
    expect(state.selectionProjection).toBeNull();
    expect(state.workspaceLayersByPageId[result.pageId]).toEqual([
      {
        id: `${result.pageId}:layer-1`,
        pageId: result.pageId,
        name: "Contenu",
        order: 1,
        visible: true,
        locked: false,
      },
    ]);
    expect(state.activeWorkspaceLayerIdByPageId[result.pageId]).toBe(`${result.pageId}:layer-1`);
  });

  it("updates only rich text content while preserving the block container", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: [
          ...state.workingTemplate.elements,
          {
            id: "rich-1",
            pageId: "page-1",
            type: "rich-text",
            frame: { x: 24, y: 32, width: 180, height: 90 },
            rotation: 8,
            zIndex: 5,
            locked: false,
            visible: true,
            props: {
              html: "<p>Avant</p>",
              text: "Avant",
              layerId: "layer-1",
              layerName: "Layer 1",
              layerOrder: 1,
            },
          },
        ],
      },
      selectedElementIds: ["rich-1"],
    }));

    const before = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "rich-1");
    const result = useEditorStore.getState().updateRichTextElementContent({
      elementId: "rich-1",
      html: "<p>Après <strong>édition</strong></p>",
    });

    expect(result.updated).toBe(true);
    const after = useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "rich-1");
    expect(after).toMatchObject({
      id: before?.id,
      pageId: before?.pageId,
      type: before?.type,
      frame: before?.frame,
      rotation: before?.rotation,
      zIndex: before?.zIndex,
      locked: before?.locked,
      visible: before?.visible,
    });
    expect(after?.props).toMatchObject({
      html: "<p>Après <strong>édition</strong></p>",
      text: "Après édition",
      layerId: "layer-1",
      layerName: "Layer 1",
      layerOrder: 1,
    });
    expect(useEditorStore.getState().selectedElementIds).toEqual(["rich-1"]);
  });

  it("rejects rich text content updates for locked or non rich text blocks", () => {
    useEditorStore.setState((state) => ({
      workingTemplate: {
        ...state.workingTemplate,
        elements: [
          ...state.workingTemplate.elements,
          {
            id: "rich-locked",
            pageId: "page-1",
            type: "rich-text",
            frame: { x: 24, y: 32, width: 180, height: 90 },
            zIndex: 5,
            locked: true,
            visible: true,
            props: {
              html: "<p>Verrouillé</p>",
              text: "Verrouillé",
            },
          },
        ],
      },
    }));

    const locked = useEditorStore.getState().updateRichTextElementContent({
      elementId: "rich-locked",
      html: "<p>Refusé</p>",
    });
    const shape = useEditorStore.getState().updateRichTextElementContent({
      elementId: "shape-1",
      html: "<p>Refusé</p>",
    });

    expect(locked).toEqual({ updated: false, reason: "bloc_verrouille" });
    expect(shape).toEqual({ updated: false, reason: "type_non_rich_text" });
    expect(useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "rich-locked")?.props?.html).toBe("<p>Verrouillé</p>");
    expect(useEditorStore.getState().workingTemplate.elements.find((element) => element.id === "shape-1")?.props?.html).toBeUndefined();
  });
});

function createTestStoreState(): Partial<EditorStoreState> {
  const template: TemplateSchema = {
    id: "template-store",
    name: "Template Store",
    version: 1,
    pages: [
      {
        id: "page-1",
        name: "Page 1",
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
    ],
    elements: [
      {
        id: "shape-1",
        pageId: "page-1",
        type: "shape",
        frame: { x: 10, y: 10, width: 40, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-1",
          layerName: "Layer 1",
          layerOrder: 1,
          layerVisible: true,
          layerLocked: false,
        },
      },
      {
        id: "shape-2",
        pageId: "page-1",
        type: "shape",
        frame: { x: 70, y: 10, width: 40, height: 40 },
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-1",
          layerName: "Layer 1",
          layerOrder: 1,
          layerVisible: true,
          layerLocked: false,
        },
      },
    ],
  };

  const layer: CanvasWorkspaceLayer = {
    id: "layer-1",
    pageId: "page-1",
    name: "Layer 1",
    order: 1,
    visible: true,
    locked: false,
  };

  return {
    activePageId: "page-1",
    activeCanvasTool: "pointer" as EditorStoreState["activeCanvasTool"],
    dragTraceContext: null,
    canvasClipboard: null,
    selectedElementIds: ["shape-1", "shape-2"],
    selectionProjection: null,
    operationLogs: [],
    workingTemplate: template,
    defaultFillColor: "#d9b86f",
    defaultStrokeColor: "#0f172a",
    workspaceLayersByPageId: {
      "page-1": [layer],
    },
    activeWorkspaceLayerIdByPageId: {
      "page-1": "layer-1",
    },
    workspaceSettings: baselineState.workspaceSettings,
    openPanels: baselineState.openPanels,
    panelPreferences: baselineState.panelPreferences,
    viewport: baselineState.viewport,
  };
}

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}
