import { create } from "zustand";

export type EditorPanelId = "pages" | "layers" | "assets" | "data" | "inspector";

export type EditorViewportState = {
  zoom: number;
  panX: number;
  panY: number;
};

export type EditorStoreState = {
  activePageId: string;
  selectedElementIds: string[];
  openPanels: Record<EditorPanelId, boolean>;
  viewport: EditorViewportState;
  setActivePageId: (pageId: string) => void;
  setSelectedElementIds: (elementIds: string[]) => void;
  setZoom: (zoom: number) => void;
};

export const useEditorStore = create<EditorStoreState>((set) => ({
  activePageId: "page-1",
  selectedElementIds: [],
  openPanels: {
    pages: true,
    layers: true,
    assets: true,
    data: true,
    inspector: true,
  },
  viewport: {
    zoom: 0.85,
    panX: 0,
    panY: 0,
  },
  setActivePageId: (pageId) => set({ activePageId: pageId }),
  setSelectedElementIds: (elementIds) => set({ selectedElementIds: elementIds }),
  setZoom: (zoom) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom,
      },
    })),
}));
