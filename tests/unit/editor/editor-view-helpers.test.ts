import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TemplateElement, TemplateSchema } from "@/features/editor/schema/template-schema";
import type { EditorStoreState } from "@/features/editor/stores/editor-store";

const localStorageMock = createLocalStorageMock();
vi.stubGlobal("localStorage", localStorageMock);

const { deriveEditorLayersView, deriveEditorObjectsView, deriveEditorPagesView } = await import(
  "@/features/editor/selectors"
);

const { useEditorStore } = await import("@/features/editor/stores/editor-store");

describe("editor view helpers", () => {
  beforeEach(() => {
    useEditorStore.setState(createTestStoreState());
  });

  afterEach(() => {
    useEditorStore.setState(createTestStoreState());
    localStorageMock.clear();
  });

  it("derives real pages from the template and marks the active page", () => {
    const template = useEditorStore.getState().workingTemplate;
    const pages = deriveEditorPagesView(template, "page-2");

    expect(pages).toHaveLength(2);
    expect(pages[0]).toMatchObject({
      id: "page-1",
      active: false,
      elementCount: 2,
    });
    expect(pages[1]).toMatchObject({
      id: "page-2",
      active: true,
      elementCount: 1,
    });
  });

  it("falls back to the first page when the active page id is missing", () => {
    const template = useEditorStore.getState().workingTemplate;
    const pages = deriveEditorPagesView(template, "missing-page");

    expect(pages[0]?.active).toBe(true);
    expect(pages[1]?.active).toBe(false);
  });

  it("returns no pages for an empty template", () => {
    const emptyTemplate: TemplateSchema = {
      id: "t",
      name: "Empty",
      version: 1,
      pages: [],
      elements: [],
    };
    expect(deriveEditorPagesView(emptyTemplate, "page-1")).toEqual([]);
  });

  it("derives real layers for the active page from workspace layers and counts objects", () => {
    const state = useEditorStore.getState();
    const layers = deriveEditorLayersView(
      state.workingTemplate,
      state.workspaceLayersByPageId,
      "page-1",
      state.activeWorkspaceLayerIdByPageId,
    );

    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({
      id: "page-1:layer-1",
      active: true,
      objectCount: 2,
      pageId: "page-1",
    });
  });

  it("derives layers from element metadata when workspace layers are missing", () => {
    const template: TemplateSchema = {
      ...useEditorStore.getState().workingTemplate,
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
            layerId: "layer-a",
            layerName: "Calque A",
            layerOrder: 4,
            layerVisible: true,
            layerLocked: false,
          },
        },
        {
          id: "shape-2",
          pageId: "page-1",
          type: "shape",
          frame: { x: 60, y: 10, width: 40, height: 40 },
          rotation: 0,
          zIndex: 2,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            layerId: "layer-b",
            layerName: "Calque B",
            layerOrder: 2,
            layerVisible: true,
            layerLocked: false,
          },
        },
      ] as TemplateElement[],
    };

    const layers = deriveEditorLayersView(template, {}, "page-1", {});

    expect(layers.map((layer) => layer.id)).toEqual(["layer-b", "layer-a"]);
    expect(layers[0]).toMatchObject({
      name: "Calque B",
      objectCount: 1,
      source: "derived",
    });
    expect(layers[1]).toMatchObject({
      name: "Calque A",
      objectCount: 1,
      source: "derived",
    });
  });

  it("falls back to the first workspace layer when the active and selected ids are unknown", () => {
    const state = useEditorStore.getState();
    const template = {
      ...state.workingTemplate,
      elements: [],
    } as TemplateSchema;
    const layers = deriveEditorLayersView(
      template,
      {
        "page-1": [
          {
            id: "layer-a",
            pageId: "page-1",
            name: "Layer A",
            order: 1,
            visible: true,
            locked: false,
          },
          {
            id: "layer-b",
            pageId: "page-1",
            name: "Layer B",
            order: 2,
            visible: true,
            locked: false,
          },
        ],
      },
      "page-1",
      { "page-1": "missing-active" },
      { "page-1": "missing-selected" },
    );

    expect(layers).toHaveLength(2);
    expect(layers[0]).toMatchObject({
      id: "layer-a",
      active: true,
      selected: true,
      source: "workspace",
    });
    expect(layers[1]).toMatchObject({
      id: "layer-b",
      active: false,
      selected: false,
    });
  });

  it("creates a fallback layer row for an empty page with no layer metadata", () => {
    const template: TemplateSchema = {
      id: "template-empty-layers",
      name: "Empty layers template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      elements: [],
    };

    const layers = deriveEditorLayersView(template, {}, "page-1");

    expect(layers).toHaveLength(1);
    expect(layers[0]).toMatchObject({
      id: "page-1:layer-1",
      active: true,
      selected: true,
      objectCount: 0,
      source: "fallback",
    });
  });

  it("returns the real objects of the active page and marks selected ones", () => {
    const state = useEditorStore.getState();
    const objects = deriveEditorObjectsView(state.workingTemplate, ["text-1"], "page-1");

    expect(objects).toHaveLength(2);
    expect(objects[0]).toMatchObject({
      id: "shape-1",
      selected: false,
      pageId: "page-1",
    });
    expect(objects[1]).toMatchObject({
      id: "text-1",
      selected: true,
      layerName: "Contenu",
    });
  });

  it("derives a stable default layer for objects when the page has no explicit layer metadata", () => {
    const template: TemplateSchema = {
      id: "template-objects",
      name: "Template Objects",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      elements: [
        {
          id: "headline",
          pageId: "page-1",
          type: "text",
          frame: { x: 12, y: 16, width: 120, height: 28 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            text: "Headline",
          },
        } as TemplateElement,
      ],
    };

    const objects = deriveEditorObjectsView(template, [], "page-1");

    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({
      id: "headline",
      layerId: "page-1:layer-1",
      layerName: "Contenu",
      layerNumber: 1,
      name: "Headline",
    });
  });

  it("uses object labels and grouping metadata consistently", () => {
    const template: TemplateSchema = {
      ...useEditorStore.getState().workingTemplate,
      elements: [
        {
          ...useEditorStore.getState().workingTemplate.elements[0],
          id: "grouped-text",
          props: {
            ...useEditorStore.getState().workingTemplate.elements[0]?.props,
            label: "Professional summary",
            groupId: "group-1",
            grouped: true,
          },
        } as TemplateElement,
      ],
    };

    const objects = deriveEditorObjectsView(template, [], "page-1");

    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({
      id: "grouped-text",
      name: "Professional summary",
      grouped: true,
      groupId: "group-1",
    });
  });

  it("returns only the active page objects", () => {
    const state = useEditorStore.getState();
    const objects = deriveEditorObjectsView(state.workingTemplate, [], "page-2");

    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({
      id: "page-2-text",
      pageId: "page-2",
    });
  });

  it("orders object rows with the same layer and z-order precedence as the render tree", () => {
    const state = useEditorStore.getState();
    const template: TemplateSchema = {
      ...state.workingTemplate,
      elements: [
        {
          ...state.workingTemplate.elements[0],
          id: "layer-b-back",
          zIndex: 1,
          props: {
            ...state.workingTemplate.elements[0]?.props,
            layerId: "layer-b",
            layerName: "Layer B",
            layerOrder: 2,
          },
        } as TemplateElement,
        {
          ...state.workingTemplate.elements[1],
          id: "layer-a-front",
          zIndex: 10,
          props: {
            ...state.workingTemplate.elements[1]?.props,
            layerId: "layer-a",
            layerName: "Layer A",
            layerOrder: 1,
          },
        } as TemplateElement,
      ],
    };

    const objects = deriveEditorObjectsView(template, [], "page-1");

    expect(objects.map((object) => object.id)).toEqual(["layer-a-front", "layer-b-back"]);
  });

  it("updates the active workspace layer for a page through the store", () => {
    useEditorStore.getState().setActiveWorkspaceLayerIdForPage({
      pageId: "page-1",
      layerId: "custom-layer",
    });

    expect(useEditorStore.getState().activeWorkspaceLayerIdByPageId["page-1"]).toBe("custom-layer");
  });
});

function createTestStoreState(): Partial<EditorStoreState> {
  return {
    activePageId: "page-1",
    activeCanvasTool: "pointer" as const,
    dragTraceContext: null,
    canvasClipboard: null,
    selectedElementIds: ["text-1"],
    selectionProjection: null,
    operationLogs: [],
    workingTemplate: {
      id: "template-views",
      name: "Template Views",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        {
          id: "page-2",
          name: "Inside",
          width: 420,
          height: 320,
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
            layerId: "page-1:layer-1",
            layerName: "Contenu",
            layerOrder: 1,
            layerVisible: true,
            layerLocked: false,
          },
        },
        {
          id: "text-1",
          pageId: "page-1",
          type: "text",
          frame: { x: 70, y: 12, width: 80, height: 24 },
          rotation: 0,
          zIndex: 2,
          locked: false,
          visible: true,
          props: {
            text: "Cover title",
            layerId: "page-1:layer-1",
            layerName: "Contenu",
            layerOrder: 1,
            layerVisible: true,
            layerLocked: false,
          },
        },
        {
          id: "page-2-text",
          pageId: "page-2",
          type: "text",
          frame: { x: 20, y: 20, width: 90, height: 24 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            text: "Inside text",
            layerId: "page-2:layer-1",
            layerName: "Contenu",
            layerOrder: 1,
            layerVisible: true,
            layerLocked: false,
          },
        },
      ] as TemplateElement[],
    } as TemplateSchema,
    defaultFillColor: "#d9b86f",
    defaultStrokeColor: "#0f172a",
    workspaceLayersByPageId: {
      "page-1": [
        {
          id: "page-1:layer-1",
          pageId: "page-1",
          name: "Contenu",
          order: 1,
          visible: true,
          locked: false,
        },
      ],
      "page-2": [
        {
          id: "page-2:layer-1",
          pageId: "page-2",
          name: "Contenu",
          order: 1,
          visible: true,
          locked: false,
        },
      ],
    },
    activeWorkspaceLayerIdByPageId: {
      "page-1": "page-1:layer-1",
      "page-2": "page-2:layer-1",
    },
    workspaceSettings: {
      measurementUnit: "px",
      gridEnabled: false,
      gridSize: 16,
      rulerMode: "page",
      workspaceMode: "fit-space",
      autoCenterOnLoad: true,
      rulersVisible: true,
      marginsVisible: true,
      guidesVisible: true,
      snapEnabled: true,
      snapToGrid: true,
      snapToMargins: true,
      snapToPageBounds: true,
      snapTolerance: 8,
      pageGap: 32,
      pagePadding: 64,
      rulerMajorStep: 100,
      rulerMinorStep: 10,
      rulerFineStep: 2,
    },
    openPanels: {
      pages: true,
      layers: true,
      assets: true,
      data: true,
      inspector: true,
    },
    panelPreferences: {
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
    },
    viewport: {
      zoom: 0.85,
      panX: 0,
      panY: 0,
    },
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
