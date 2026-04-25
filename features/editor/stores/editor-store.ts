import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  selectedElementIds: string[];
  openPanels: Record<EditorPanelId, boolean>;
  panelPreferences: EditorPanelPreferences;
  viewport: EditorViewportState;
  setActivePageId: (pageId: string) => void;
  setSelectedElementIds: (elementIds: string[]) => void;
  setZoom: (zoom: number) => void;
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

export const useEditorStore = create<EditorStoreState>()(
  persist(
    (set) => ({
      activePageId: "page-1",
      selectedElementIds: [],
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
      setSelectedElementIds: (elementIds) => set({ selectedElementIds: elementIds }),
      setZoom: (zoom) =>
        set((state) => ({
          viewport: {
            ...state.viewport,
            zoom,
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
      }),
    },
  ),
);
