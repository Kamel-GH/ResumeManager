"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties, type DragEvent } from "react";

import {
  emojis,
  icons,
  images,
  layers,
  objects,
  pages,
  presets,
  shapes,
  textBlocks,
  variables,
  type EditorIconMock,
  type EditorObjectMock,
  type EditorLayerMock,
  type EditorPresetMock,
  type EditorVariableMock,
} from "@/src/data/editorMockData";
import { useEditorStore, type EditorLeftPanelTab, type EditorLeftSubTab } from "@/features/editor/stores/editor-store";

type ColorSet = { bg: string; fg: string; border: string };
type SortDir = "asc" | "desc" | null;
type ActionIcon = "settings" | "upload" | "add" | "edit" | "delete" | "merge" | "reorder" | "duplicate" | "move";
type MaterialIconName =
  | "database"
  | "data_object"
  | "bookmark"
  | "photo_library"
  | "image"
  | "category"
  | "star"
  | "sentiment_satisfied"
  | "text_fields"
  | "layers"
  | "description"
  | "grid_view"
  | "view_list"
  | "settings"
  | "upload"
  | "filter_list"
  | "arrow_upward"
  | "arrow_downward"
  | "unfold_more"
  | "visibility"
  | "visibility_off"
  | "lock"
  | "lock_open"
  | "add"
  | "edit"
  | "delete"
  | "merge"
  | "swap_vert"
  | "content_copy"
  | "drive_file_move"
  | "drag_indicator"
  | "chevron_right"
  | "expand_more"
  | "schema"
  | "radio_button_unchecked";

let activeDragPreviewCleanup: (() => void) | null = null;

function MaterialIcon({
  name,
  size = 18,
  filled = false,
}: {
  name: MaterialIconName;
  size?: number;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`ms${filled ? " filled" : ""}`}
      style={{ fontSize: `${size}px` }}
    >
      {name}
    </span>
  );
}

const VAR_TYPE_COLORS: Record<EditorVariableMock["type"], ColorSet> = {
  TEXTE: { bg: "#1e3a5f", fg: "#7fb8ff", border: "#2c5183" },
  IMAGE: { bg: "#3d1e5f", fg: "#c7a3ff", border: "#5a2c83" },
  LISTE: { bg: "#1e4a2e", fg: "#7fd99a", border: "#2c6640" },
  TABLE: { bg: "#4a3416", fg: "#ffc880", border: "#66481f" },
};

const PRESET_TYPE_COLORS: Record<EditorPresetMock["type"], ColorSet> = {
  EXPERIENCES: { bg: "#4a3416", fg: "#ffc880", border: "#66481f" },
  FORMATIONS: { bg: "#1e3a5f", fg: "#7fb8ff", border: "#2c5183" },
  LANGUES: { bg: "#3d1e5f", fg: "#c7a3ff", border: "#5a2c83" },
  COMPETENCES: { bg: "#1e4a2e", fg: "#7fd99a", border: "#2c6640" },
  INTERETS: { bg: "#5f1e3a", fg: "#ff9ac4", border: "#832c58" },
};

const OBJECT_TYPE_COLORS: Record<EditorObjectMock["type"], ColorSet> = {
  text: { bg: "#eaf0f8", fg: "#334155", border: "#cfd8e3" },
  image: { bg: "#e8efff", fg: "#3454a6", border: "#c8d7ff" },
  shape: { bg: "#f0ebff", fg: "#6c4cff", border: "#d9d0ff" },
  chart: { bg: "#ecfaf4", fg: "#1f8a5b", border: "#c6ecd9" },
  variable: { bg: "#fff4e5", fg: "#d87a00", border: "#f7d6a6" },
  preset: { bg: "#fcecff", fg: "#b12c80", border: "#f1c0e0" },
  group: { bg: "#eef2f7", fg: "#475569", border: "#d6dee8" },
};

const PRIMARY_TABS: Array<{
  id: EditorLeftPanelTab;
  icon: MaterialIconName;
  tooltip: string;
  subTabs: Array<{ id: EditorLeftSubTab; icon: MaterialIconName; tooltip: string }> | null;
}> = [
  {
    id: "data",
    icon: "database",
    tooltip: "Données",
    subTabs: [
      { id: "variables", icon: "data_object", tooltip: "Variables" },
      { id: "presets", icon: "bookmark", tooltip: "Presets" },
    ],
  },
  {
    id: "libraries",
    icon: "photo_library",
    tooltip: "Bibliothèques",
    subTabs: [
      { id: "images", icon: "image", tooltip: "Images" },
      { id: "charts-shapes", icon: "category", tooltip: "Graphiques / Shapes" },
      { id: "icons", icon: "star", tooltip: "Icônes" },
      { id: "emoji", icon: "sentiment_satisfied", tooltip: "Emoji" },
      { id: "text-blocks", icon: "text_fields", tooltip: "Blocs textes" },
    ],
  },
  { id: "layers", icon: "layers", tooltip: "Calques", subTabs: null },
  { id: "objects", icon: "category", tooltip: "Objets", subTabs: null },
  { id: "pages", icon: "description", tooltip: "Pages", subTabs: null },
];

const STATE_CONFIG: Record<
  string,
  {
    showView: boolean;
    rightActions: ActionIcon[];
    filter:
      | { placeholder: string; typeOptions?: string[]; typeLabel?: string; typeOptions2?: string[]; typeLabel2?: string }
      | null;
    panel: "variables" | "presets" | "images" | "shapes" | "icons" | "emoji" | "text-blocks" | "layers" | "objects" | "pages";
    footer: ActionIcon[] | null;
  }
> = {
  "data/variables": {
    showView: false,
    rightActions: ["settings"],
    filter: { placeholder: "Filtrer variables…", typeOptions: ["TEXTE", "IMAGE", "LISTE", "TABLE"], typeLabel: "Type" },
    panel: "variables",
    footer: null,
  },
  "data/presets": {
    showView: false,
    rightActions: ["settings"],
    filter: {
      placeholder: "Filtrer presets…",
      typeOptions: ["EXPERIENCES", "FORMATIONS", "LANGUES", "COMPETENCES", "INTERETS"],
      typeLabel: "Type",
    },
    panel: "presets",
    footer: null,
  },
  "libraries/images": {
    showView: true,
    rightActions: ["upload", "settings"],
    filter: { placeholder: "Filtrer images…", typeOptions: uniqueSorted(images.map((item) => item.category)), typeLabel: "Cat." },
    panel: "images",
    footer: null,
  },
  "libraries/charts-shapes": {
    showView: true,
    rightActions: ["upload", "settings"],
    filter: { placeholder: "Filtrer shapes…", typeOptions: uniqueSorted(shapes.map((item) => item.category)), typeLabel: "Cat." },
    panel: "shapes",
    footer: null,
  },
  "libraries/icons": {
    showView: true,
    rightActions: ["upload", "settings"],
    filter: {
      placeholder: "Filtrer icônes…",
      typeOptions: uniqueSorted(icons.map((item) => item.category)),
      typeLabel: "Cat.",
      typeOptions2: ["mono", "color"],
      typeLabel2: "Mode",
    },
    panel: "icons",
    footer: null,
  },
  "libraries/emoji": {
    showView: false,
    rightActions: ["upload", "settings"],
    filter: { placeholder: "Filtrer emoji…", typeOptions: uniqueSorted(emojis.map((item) => item.category)), typeLabel: "Cat." },
    panel: "emoji",
    footer: null,
  },
  "libraries/text-blocks": {
    showView: true,
    rightActions: ["settings"],
    filter: { placeholder: "Filtrer blocs…", typeOptions: uniqueSorted(textBlocks.map((item) => item.category)), typeLabel: "Cat." },
    panel: "text-blocks",
    footer: null,
  },
  layers: {
    showView: false,
    rightActions: ["settings"],
    filter: {
      placeholder: "Filtrer calques…",
      typeOptions: uniqueSorted(layers.map((layer) => String(layer.page))),
      typeLabel: "PAGE",
      typeOptions2: ["all", "visible", "hidden", "locked", "unlocked", "active"],
      typeLabel2: "Statut",
    },
    panel: "layers",
    footer: ["add", "edit", "delete", "merge", "reorder"],
  },
  objects: {
    showView: false,
    rightActions: ["settings"],
    filter: {
      placeholder: "Filtrer objets…",
      typeOptions: uniqueSorted(objects.map((item) => item.type)),
      typeLabel: "Type",
      typeOptions2: uniqueSorted(pages.map((page) => String(page.number))),
      typeLabel2: "Pg",
    },
    panel: "objects",
    footer: ["duplicate", "move", "delete"],
  },
  pages: {
    showView: false,
    rightActions: ["settings"],
    filter: { placeholder: "Filtrer pages…" },
    panel: "pages",
    footer: ["edit", "duplicate", "delete", "move"],
  },
};

export function EditorLeftPanel() {
  const activeTab = useEditorStore((state) => state.panelPreferences.activeLeftTab);
  const activeSubTabs = useEditorStore((state) => state.panelPreferences.activeSubTabs);
  const assetViewMode = useEditorStore((state) => state.panelPreferences.assetViewMode);
  const setActiveLeftTab = useEditorStore((state) => state.setActiveLeftTab);
  const setActiveSubTab = useEditorStore((state) => state.setActiveSubTab);
  const setAssetViewMode = useEditorStore((state) => state.setAssetViewMode);
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);
  const panelFilters = useEditorStore((state) => state.panelPreferences.filters);
  const [typeFilters, setTypeFilters] = useState<Record<string, string>>({});
  const [layersViewMode, setLayersViewMode] = useState<"list" | "tree">("tree");

  const tab = PRIMARY_TABS.find((item) => item.id === activeTab) ?? PRIMARY_TABS[0];
  const activeSubTab = activeSubTabs[activeTab] ?? tab.subTabs?.[0]?.id;
  const stateKey = tab.subTabs && activeSubTab ? `${activeTab}/${activeSubTab}` : activeTab;
  const config = STATE_CONFIG[stateKey] ?? STATE_CONFIG["libraries/images"];
  const panelFilterKey = tab.subTabs && activeSubTab ? activeSubTab : activeTab;

  function updateTypeFilter(key: string, value: string) {
    setTypeFilters((current) => ({ ...current, [key]: value }));
  }

  function switchTab(nextTab: EditorLeftPanelTab) {
    const next = PRIMARY_TABS.find((item) => item.id === nextTab);
    const nextSubTab = next?.subTabs?.[0]?.id;
    setActiveLeftTab(nextTab);
    if (nextSubTab) {
      setActiveSubTab(nextTab, nextSubTab);
    }
    setTypeFilters({});
  }

  return (
    <aside className="ef-left-panel-v2" aria-label="Volet gauche">
      <PrimaryRail activeTab={activeTab} onTabChange={switchTab} />
      {tab.subTabs ? <SubTabRail subTabs={tab.subTabs} activeSubTab={activeSubTab} onSubTabChange={(value) => value && setActiveSubTab(activeTab, value)} /> : null}

      {config.panel === "layers" ? (
        <LayersControlHeader
          filter={panelFilters[panelFilterKey] ?? ""}
          onFilterChange={(value) => setPanelFilter(panelFilterKey, value)}
          typeFilter={typeFilters[stateKey] ?? ""}
          onTypeFilterChange={(value) => updateTypeFilter(stateKey, value)}
          typeFilter2={typeFilters[`${stateKey}-secondary`] ?? ""}
          onTypeFilterChange2={(value) => updateTypeFilter(`${stateKey}-secondary`, value)}
          mode={layersViewMode}
          onModeChange={setLayersViewMode}
          filterConfig={config.filter}
        />
      ) : (
        <ControlHeader
          showView={config.showView}
          viewMode={assetViewMode}
          onViewModeChange={setAssetViewMode}
          rightActions={config.rightActions}
          filter={panelFilters[panelFilterKey] ?? ""}
          onFilterChange={(value) => setPanelFilter(panelFilterKey, value)}
          filterConfig={config.filter}
          typeFilter={typeFilters[stateKey] ?? ""}
          onTypeFilterChange={(value) => updateTypeFilter(stateKey, value)}
          typeFilter2={typeFilters[`${stateKey}-secondary`] ?? ""}
          onTypeFilterChange2={(value) => updateTypeFilter(`${stateKey}-secondary`, value)}
        />
      )}

      <div className="ef-left-panel-scroll">
        {config.panel === "variables" ? <VariablesPanel filter={panelFilters[panelFilterKey] ?? ""} typeFilter={typeFilters[stateKey] ?? ""} /> : null}
        {config.panel === "presets" ? <PresetsPanel filter={panelFilters[panelFilterKey] ?? ""} typeFilter={typeFilters[stateKey] ?? ""} /> : null}
        {config.panel === "images" ? <ImagesPanel viewMode={assetViewMode} filter={panelFilters.images ?? ""} typeFilter={typeFilters[stateKey] ?? ""} /> : null}
        {config.panel === "shapes" ? <ShapesPanel viewMode={assetViewMode} filter={panelFilters["charts-shapes"] ?? ""} typeFilter={typeFilters[stateKey] ?? ""} /> : null}
        {config.panel === "icons" ? <IconsPanel viewMode={assetViewMode} filter={panelFilters.icons ?? ""} typeFilter={typeFilters[stateKey] ?? ""} typeFilter2={typeFilters[`${stateKey}-secondary`] ?? ""} /> : null}
        {config.panel === "emoji" ? <EmojiPanel filter={panelFilters.emoji ?? ""} /> : null}
        {config.panel === "text-blocks" ? <TextBlocksPanel viewMode={assetViewMode} filter={panelFilters["text-blocks"] ?? ""} typeFilter={typeFilters[stateKey] ?? ""} /> : null}
        {config.panel === "layers" ? (
          <LayersPanel
            mode={layersViewMode}
            filter={panelFilters.layers ?? ""}
            pageFilter={typeFilters[stateKey] ?? ""}
            stateFilter={typeFilters[`${stateKey}-secondary`] ?? ""}
          />
        ) : null}
        {config.panel === "objects" ? <ObjectsPanel filter={panelFilters.objects ?? ""} typeFilter={typeFilters[stateKey] ?? ""} pageFilter={typeFilters[`${stateKey}-secondary`] ?? ""} /> : null}
        {config.panel === "pages" ? <PagesPanel filter={panelFilters.pages ?? ""} /> : null}
      </div>

      {config.footer ? <FooterActions actions={config.footer} /> : null}
    </aside>
  );
}

function PrimaryRail({
  activeTab,
  onTabChange,
}: {
  activeTab: EditorLeftPanelTab;
  onTabChange: (tab: EditorLeftPanelTab) => void;
}) {
  return (
    <div className="ef-left-tabs" role="tablist" aria-label="Modules éditeur">
      {PRIMARY_TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.tooltip}
            title={tab.tooltip}
            className={["ef-left-tab", active ? "is-active" : ""].join(" ")}
            onClick={() => onTabChange(tab.id)}
          >
            <MaterialIcon name={tab.icon} size={20} filled={active} />
          </button>
        );
      })}
    </div>
  );
}

function SubTabRail({
  subTabs,
  activeSubTab,
  onSubTabChange,
}: {
  subTabs: NonNullable<(typeof PRIMARY_TABS)[number]["subTabs"]>;
  activeSubTab?: EditorLeftSubTab;
  onSubTabChange: (subTab?: EditorLeftSubTab) => void;
}) {
  return (
    <div className="ef-left-subtabs" role="tablist" aria-label="Sous-sections">
      {subTabs.map((item) => {
        const active = item.id === activeSubTab;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item.tooltip}
            title={item.tooltip}
            className={["ef-left-subtab", active ? "is-active" : ""].join(" ")}
            onClick={() => onSubTabChange(item.id)}
          >
            <MaterialIcon name={item.icon} size={18} filled={active} />
          </button>
        );
      })}
    </div>
  );
}

function ControlHeader({
  showView,
  viewMode,
  onViewModeChange,
  rightActions,
  filter,
  onFilterChange,
  filterConfig,
  typeFilter,
  onTypeFilterChange,
  typeFilter2,
  onTypeFilterChange2,
}: {
  showView: boolean;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  rightActions: ActionIcon[];
  filter: string;
  onFilterChange: (value: string) => void;
  filterConfig:
    | { placeholder: string; typeOptions?: string[]; typeLabel?: string; typeOptions2?: string[]; typeLabel2?: string }
    | null;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  typeFilter2: string;
  onTypeFilterChange2: (value: string) => void;
}) {
  return (
    <div className="ef-control-header">
      <div className="ef-control-row">
        <div className="ef-control-left">
          {showView ? (
            <div className="ef-view-toggle" role="group" aria-label="Mode d’affichage">
              <button type="button" className={viewMode === "grid" ? "is-active" : ""} title="Grille" aria-label="Grille" onClick={() => onViewModeChange("grid")}>
                <MaterialIcon name="grid_view" size={14} filled={viewMode === "grid"} />
              </button>
              <button type="button" className={viewMode === "list" ? "is-active" : ""} title="Liste" aria-label="Liste" onClick={() => onViewModeChange("list")}>
                <MaterialIcon name="view_list" size={14} filled={viewMode === "list"} />
              </button>
            </div>
          ) : (
            <span className="ef-control-left-spacer" aria-hidden="true" />
          )}
        </div>
        <div className="ef-control-actions">
          {rightActions.map((action) => (
            <IconAction key={action} action={action} />
          ))}
        </div>
      </div>

      <div
        className={[
          "ef-control-filter",
          filterConfig?.typeOptions2 ? "has-two" : filterConfig?.typeOptions ? "has-one" : "has-none",
        ].join(" ")}
      >
        <label className="ef-search-box">
          <MaterialIcon name="filter_list" size={18} />
          <input type="search" value={filter} placeholder={filterConfig?.placeholder ?? "Filtrer…"} aria-label={filterConfig?.placeholder ?? "Filtrer"} onChange={(event) => onFilterChange(event.target.value)} />
        </label>
        {filterConfig?.typeOptions ? (
          <select className="ef-filter-select" value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value)}>
            <option value="">{filterConfig.typeLabel ?? "TYPE"}</option>
            {filterConfig.typeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : null}
        {filterConfig?.typeOptions2 ? (
          <select className="ef-filter-select" value={typeFilter2} onChange={(event) => onTypeFilterChange2(event.target.value)}>
            <option value="">{filterConfig.typeLabel2 ?? "TYPE"}</option>
            {filterConfig.typeOptions2.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

function LayersControlHeader({
  mode,
  onModeChange,
  filter,
  onFilterChange,
  filterConfig,
  typeFilter,
  onTypeFilterChange,
  typeFilter2,
  onTypeFilterChange2,
}: {
  mode: "list" | "tree";
  onModeChange: (mode: "list" | "tree") => void;
  filter: string;
  onFilterChange: (value: string) => void;
  filterConfig:
    | { placeholder: string; typeOptions?: string[]; typeLabel?: string; typeOptions2?: string[]; typeLabel2?: string }
    | null;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  typeFilter2: string;
  onTypeFilterChange2: (value: string) => void;
}) {
  return (
    <div className="ef-control-header ef-control-header--layers">
      <div className="ef-control-row">
        <div className="ef-control-left">
          <div className="ef-view-toggle ef-layer-view-toggle" role="group" aria-label="Mode d’affichage">
            <button type="button" className={mode === "list" ? "is-active" : ""} title="Liste" aria-label="Liste" onClick={() => onModeChange("list")}>
              <MaterialIcon name="view_list" size={14} filled={mode === "list"} />
            </button>
            <button type="button" className={mode === "tree" ? "is-active" : ""} title="Hiérarchie" aria-label="Hiérarchie" onClick={() => onModeChange("tree")}>
              <MaterialIcon name="schema" size={14} filled={mode === "tree"} />
            </button>
          </div>
        </div>
        <div className="ef-control-actions">
          <IconAction action="settings" />
        </div>
      </div>

      <div className="ef-control-filter has-two">
        <label className="ef-search-box">
          <MaterialIcon name="filter_list" size={18} />
          <input type="search" value={filter} placeholder={filterConfig?.placeholder ?? "Filtrer…"} aria-label={filterConfig?.placeholder ?? "Filtrer"} onChange={(event) => onFilterChange(event.target.value)} />
        </label>
        {filterConfig?.typeOptions ? (
          <select className="ef-filter-select" value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value)}>
            <option value="">{filterConfig.typeLabel ?? "TYPE"}</option>
            {filterConfig.typeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : null}
        {filterConfig?.typeOptions2 ? (
          <select className="ef-filter-select" value={typeFilter2} onChange={(event) => onTypeFilterChange2(event.target.value)}>
            <option value="">{filterConfig.typeLabel2 ?? "TYPE"}</option>
            {filterConfig.typeOptions2.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

function IconAction({ action }: { action: ActionIcon }) {
  return (
    <button className="ef-square-button ef-icon-28" type="button" title={actionLabels[action]} aria-label={actionLabels[action]}>
      <MaterialIcon name={actionIconName[action]} size={18} />
    </button>
  );
}

function FooterActions({ actions }: { actions: ActionIcon[] }) {
  return (
    <div className="ef-left-panel-footer">
      {actions.map((action) => (
        <button key={action} className="ef-footer-icon-action" type="button" title={actionLabels[action]} aria-label={actionLabels[action]}>
          <MaterialIcon name={footerActionIconName[action]} size={18} />
        </button>
      ))}
    </div>
  );
}

function VariablesPanel({ filter, typeFilter }: { filter: string; typeFilter: string }) {
  const rows = useMemo(
    () =>
      variables.filter(
        (item) =>
          matchesFilter(item, filter, [item.label, item.token, item.type, item.mappedPath, item.sampleValue]) &&
          (!typeFilter || item.type === typeFilter),
      ),
    [filter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "label");

  return (
    <div className="ef-entity-card-stack">
      <div className="ef-data-sort-head">
        <SortHeader label="VARIABLE" dir={dirOf("label")} onClick={() => toggle("label")} />
        <SortHeader label="TYPE" dir={dirOf("type")} onClick={() => toggle("type")} width={78} align="center" />
      </div>
      <div className="ef-entity-card-list ef-entity-card-list-variables">
        {sorted.map((item) => (
          <button key={item.id} className="ef-entity-card ef-variable-card" type="button" draggable onDragStart={(event) => setDragPayload(event, "variable", item)} title={`${item.token} → ${item.mappedPath}`}>
            <span className="ef-entity-card-token">{item.token}</span>
            <span className="ef-entity-card-type">
              <Badge value={item.type} colorSet={VAR_TYPE_COLORS[item.type]} width={55} />
            </span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function PresetsPanel({ filter, typeFilter }: { filter: string; typeFilter: string }) {
  const rows = useMemo(
    () =>
      presets.filter(
        (item) =>
          matchesFilter(item, filter, [item.label, item.token, item.type, item.mappedPath, item.description]) &&
          (!typeFilter || item.type === typeFilter),
      ),
    [filter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "token");

  return (
    <div className="ef-entity-card-stack">
      <div className="ef-data-sort-head">
        <SortHeader label="PRESET" dir={dirOf("token")} onClick={() => toggle("token")} />
        <SortHeader label="TYPE" dir={dirOf("type")} onClick={() => toggle("type")} width={78} align="center" />
      </div>
      <div className="ef-entity-card-list ef-entity-card-list-presets">
        {sorted.map((item) => (
          <button key={item.id} className="ef-entity-card ef-preset-card" type="button" draggable onDragStart={(event) => setDragPayload(event, "preset", item, "data/presets")} onDragEnd={(event) => handleDragEnd(event, "preset", item, "data/presets")} title={`${item.token} - ${item.description}`}>
            <span className="ef-entity-card-token">{`{${item.token.replace(/[{}]/g, "")}}`}</span>
            <span className="ef-entity-card-type">
              <Badge value={item.type} colorSet={PRESET_TYPE_COLORS[item.type]} width={84} />
            </span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function ImagesPanel({
  viewMode,
  filter,
  typeFilter,
}: {
  viewMode: "grid" | "list";
  filter: string;
  typeFilter: string;
}) {
  const rows = useMemo(
    () => images.filter((item) => matchesFilter(item, filter, [item.name, item.category, ...item.tags]) && (!typeFilter || item.category === typeFilter)),
    [filter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "name");

  if (viewMode === "list") {
    return (
      <div className="ef-list-table">
        <div className="ef-list-head-row is-image">
          <SortHeader label="NOM" dir={dirOf("name")} onClick={() => toggle("name")} />
          <SortHeader label="CAT." dir={dirOf("category")} onClick={() => toggle("category")} width={74} align="center" />
          <SortHeader label="TAILLE" dir={dirOf("width")} onClick={() => toggle("width")} width={82} align="center" />
        </div>
        {sorted.map((item) => (
          <button key={item.id} className="ef-list-row is-image" type="button" draggable onDragStart={(event) => setDragPayload(event, "image", item, "libraries/images")} onDragEnd={(event) => handleDragEnd(event, "image", item, "libraries/images")}>
            <Image src={item.src} alt="" width={32} height={32} unoptimized className="object-cover" draggable={false} />
            <strong>{item.name}</strong>
            <span>{item.category}</span>
            <span>{item.width}×{item.height}</span>
          </button>
        ))}
        {rows.length === 0 ? <NoResult /> : null}
      </div>
    );
  }

  return (
    <div className="ef-asset-grid ef-asset-grid-2">
      {sorted.map((item) => (
        <button key={item.id} className="ef-asset-card is-image" type="button" title={item.name} draggable onDragStart={(event) => setDragPayload(event, "image", item, "libraries/images")} onDragEnd={(event) => handleDragEnd(event, "image", item, "libraries/images")}>
          <Image src={item.src} alt={item.name} width={120} height={120} unoptimized className="object-cover" draggable={false} />
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function ShapesPanel({
  viewMode,
  filter,
  typeFilter,
}: {
  viewMode: "grid" | "list";
  filter: string;
  typeFilter: string;
}) {
  const rows = useMemo(
    () => shapes.filter((item) => matchesFilter(item, filter, [item.name, item.category, item.type, ...item.tags]) && (!typeFilter || item.category === typeFilter)),
    [filter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "name");

  if (viewMode === "list") {
    return (
      <div className="ef-list-table">
        <div className="ef-list-head-row is-text-block">
          <SortHeader label="SHAPE" dir={dirOf("name")} onClick={() => toggle("name")} />
          <SortHeader label="CAT." dir={dirOf("category")} onClick={() => toggle("category")} width={72} align="center" />
        </div>
        {sorted.map((item) => (
          <button key={item.id} className="ef-list-row is-text-block" type="button" draggable onDragStart={(event) => setDragPayload(event, "shape", item)}>
            <span className="ef-mini-preview">
              <Image src={svgToDataUri(item.svg)} alt="" width={18} height={18} unoptimized />
            </span>
            <strong>{item.name}</strong>
            <span>{item.category}</span>
          </button>
        ))}
        {rows.length === 0 ? <NoResult /> : null}
      </div>
    );
  }

  return (
    <div className="ef-asset-grid ef-asset-grid-3">
      {sorted.map((item) => (
        <button key={item.id} className="ef-asset-card is-shape" type="button" title={item.name} draggable onDragStart={(event) => setDragPayload(event, "shape", item)}>
          <Image src={svgToDataUri(item.svg)} alt={item.name} width={90} height={90} unoptimized />
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function IconsPanel({
  viewMode,
  filter,
  typeFilter,
  typeFilter2,
}: {
  viewMode: "grid" | "list";
  filter: string;
  typeFilter: string;
  typeFilter2: string;
}) {
  const rows = useMemo(
    () =>
      icons.filter(
        (item) =>
          matchesFilter(item, filter, [item.name, item.category, item.variant, ...(item.tags ?? [])]) &&
          (!typeFilter || item.category === typeFilter) &&
          (!typeFilter2 || item.variant === typeFilter2),
      ),
    [filter, typeFilter, typeFilter2],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "name");

  if (viewMode === "list") {
    return (
      <div className="ef-list-table">
        <div className="ef-list-head-row is-icon">
          <SortHeader label="ICÔNE" dir={dirOf("name")} onClick={() => toggle("name")} />
          <SortHeader label="CAT." dir={dirOf("category")} onClick={() => toggle("category")} width={80} align="center" />
          <SortHeader label="FORMAT" dir={dirOf("variant")} onClick={() => toggle("variant")} width={52} align="center" />
        </div>
        {sorted.map((item) => (
          <button key={item.id} className="ef-list-row is-icon" type="button" draggable onDragStart={(event) => setDragPayload(event, "icon", item)}>
            <span className="ef-list-preview">{renderIconPreview(item)}</span>
            <strong>{item.name}</strong>
            <span>{item.category}</span>
            <Badge value={item.variant === "mono" ? "SVG" : "PNG"} colorSet={item.variant === "mono" ? VAR_TYPE_COLORS.TEXTE : VAR_TYPE_COLORS.IMAGE} width={40} />
          </button>
        ))}
        {rows.length === 0 ? <NoResult /> : null}
      </div>
    );
  }

  return (
    <div className="ef-asset-grid ef-asset-grid-4">
      {sorted.map((item) => (
        <button key={item.id} className="ef-asset-card is-icon" type="button" title={item.name} draggable onDragStart={(event) => setDragPayload(event, "icon", item)}>
          {renderIconPreview(item)}
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function EmojiPanel({ filter }: { filter: string }) {
  const rows = useMemo(
    () => emojis.filter((item) => matchesFilter(item, filter, [item.emoji, item.name, item.category, ...item.tags])),
    [filter],
  );

  return (
    <div className="ef-emoji-grid">
      {rows.map((item) => (
        <button key={item.id} className="ef-emoji-card" type="button" title={item.name} draggable onDragStart={(event) => setDragPayload(event, "emoji", item)}>
          {item.emoji}
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function TextBlocksPanel({
  viewMode,
  filter,
  typeFilter,
}: {
  viewMode: "grid" | "list";
  filter: string;
  typeFilter: string;
}) {
  const rows = useMemo(
    () =>
      textBlocks.filter(
        (item) => matchesFilter(item, filter, [item.name, item.category, item.preview, item.html, ...item.tags]) && (!typeFilter || item.category === typeFilter),
      ),
    [filter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "name");

  if (viewMode === "list") {
    return (
      <div className="ef-list-table">
        <div className="ef-list-head-row is-text-block">
          <SortHeader label="NOM DU BLOC" dir={dirOf("name")} onClick={() => toggle("name")} />
          <SortHeader label="CAT." dir={dirOf("category")} onClick={() => toggle("category")} width={96} align="center" />
        </div>
        {sorted.map((item) => (
          <button key={item.id} className="ef-list-row is-text-block" type="button" draggable onDragStart={(event) => setDragPayload(event, "text-block", item)}>
            <span className="ef-mini-preview" dangerouslySetInnerHTML={{ __html: item.preview }} />
            <strong>{item.name}</strong>
            <span>{item.category}</span>
          </button>
        ))}
        {rows.length === 0 ? <NoResult /> : null}
      </div>
    );
  }

  return (
    <div className="ef-text-block-grid">
      {sorted.map((item) => (
        <button key={item.id} className="ef-text-block-card" type="button" draggable onDragStart={(event) => setDragPayload(event, "text-block", item)}>
          <span dangerouslySetInnerHTML={{ __html: item.preview }} />
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function LayersPanel({
  mode,
  filter,
  pageFilter,
  stateFilter,
}: {
  mode: "list" | "tree";
  filter: string;
  pageFilter: string;
  stateFilter: string;
}) {
  const rows = useMemo(
    () =>
      layers.filter((item) => {
        const matchesQuery = matchesFilter(item, filter, [item.name, String(item.number), String(item.page), item.visible ? "visible" : "hidden", item.locked ? "locked" : "unlocked"]);
        const matchesPage = !pageFilter || String(item.page) === pageFilter;
        const matchesState =
          !stateFilter ||
          stateFilter === "all" ||
          (stateFilter === "active" && item.active) ||
          (stateFilter === "visible" && item.visible) ||
          (stateFilter === "hidden" && !item.visible) ||
          (stateFilter === "locked" && item.locked) ||
          (stateFilter === "unlocked" && !item.locked);
        return matchesQuery && matchesPage && matchesState;
      }),
    [filter, pageFilter, stateFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "number");
  const pageGroups = useMemo(() => groupLayersByPage(sorted), [sorted]);
  const [expandedPages, setExpandedPages] = useState<Record<number, boolean>>({});
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});

  return (
    <div className="ef-layers-shell">
      {mode === "list" ? (
        <div className="ef-layer-table">
          <div className="ef-layer-head">
            <SortHeader label="N°" dir={dirOf("number")} onClick={() => toggle("number")} width={34} />
            <SortHeader label="Nom" dir={dirOf("name")} onClick={() => toggle("name")} />
            <SortHeader label="Pg" dir={dirOf("page")} onClick={() => toggle("page")} width={30} align="center" />
            <SortHeader label="V" dir={null} onClick={() => undefined} width={26} align="center" />
            <SortHeader label="L" dir={null} onClick={() => undefined} width={26} align="center" />
          </div>
          {sorted.map((item) => (
            <button
              key={item.id}
              className={["ef-layer-table-row", item.active ? "is-active-layer" : ""].join(" ")}
              type="button"
              draggable
              onDragStart={(event) => setDragPayload(event, "layer", item)}
              title={item.name}
            >
              <span className="ef-layer-handle">
                <MaterialIcon name="drag_indicator" size={12} />
              </span>
              <span>{item.number}</span>
              <strong>{item.name}</strong>
              <span>{item.page}</span>
              <span>{item.visible ? <MaterialIcon name="visibility" size={18} filled /> : <MaterialIcon name="visibility_off" size={18} />}</span>
              <span>{item.locked ? <MaterialIcon name="lock" size={18} filled /> : <MaterialIcon name="lock_open" size={18} />}</span>
            </button>
          ))}
          {rows.length === 0 ? <NoResult /> : null}
        </div>
      ) : (
        <div className="ef-layer-tree">
          {pageGroups.map((group) => {
            const isExpanded = expandedPages[group.page.number] ?? true;
            return (
              <div key={group.page.id} className="ef-layer-tree-page">
                <button
                  type="button"
                  className="ef-layer-tree-page-row"
                  onClick={() => setExpandedPages((current) => ({ ...current, [group.page.number]: !isExpanded }))}
                  title={group.page.name}
                >
                  <span className="ef-layer-tree-toggle">
                    <MaterialIcon name={isExpanded ? "expand_more" : "chevron_right"} size={16} />
                  </span>
                  <span className="ef-layer-tree-page-icon">
                    <MaterialIcon name="description" size={15} />
                  </span>
                  <strong>
                    <span className="ef-layer-tree-page-prefix">P{group.page.number}</span> {group.page.name}
                  </strong>
                  <span className="ef-layer-tree-page-count">{group.layers.length}</span>
                </button>

                {isExpanded ? (
                  <div className="ef-layer-tree-page-body">
                    {group.layers.map((item) => {
                      const isLayerExpanded = expandedLayers[item.id] ?? item.active;
                      const childRows = item.objectIds
                        .map((objectId) => objects.find((entry) => entry.id === objectId))
                        .filter((entry): entry is NonNullable<(typeof objects)[number]> => Boolean(entry));
                      return (
                        <div key={item.id} className="ef-layer-tree-layer">
                          <button
                            type="button"
                            className={["ef-layer-tree-layer-row", item.active ? "is-active-layer" : ""].join(" ")}
                            onClick={() => setExpandedLayers((current) => ({ ...current, [item.id]: !isLayerExpanded }))}
                            draggable
                            onDragStart={(event) => setDragPayload(event, "layer", item)}
                            title={item.name}
                          >
                            <span className="ef-layer-tree-toggle">
                              <MaterialIcon name={isLayerExpanded ? "expand_more" : "chevron_right"} size={16} />
                            </span>
                            <span className="ef-layer-tree-layer-icon">
                              <MaterialIcon name="layers" size={15} filled={item.active} />
                            </span>
                            <strong>
                              <span className="ef-layer-tree-layer-prefix">C{item.number}</span> {item.name}
                            </strong>
                            <span className="ef-layer-tree-layer-count">{childRows.length || item.objectIds.length}</span>
                            <span className="ef-layer-tree-visibility">{item.visible ? <MaterialIcon name="visibility" size={18} filled /> : <MaterialIcon name="visibility_off" size={18} />}</span>
                            <span className="ef-layer-tree-lock">{item.locked ? <MaterialIcon name="lock" size={18} filled /> : <MaterialIcon name="lock_open" size={18} />}</span>
                          </button>

                          {isLayerExpanded && childRows.length > 0 ? (
                            <div className="ef-layer-tree-children">
                              {childRows.map((object) => (
                                <button
                                  key={object.id}
                                  type="button"
                                  className="ef-layer-tree-child-row"
                                  draggable
                                  onDragStart={(event) => setDragPayload(event, "object", object)}
                                  title={object.name}
                                >
                                  <span className="ef-layer-tree-child-dot">
                                    <MaterialIcon name="radio_button_unchecked" size={14} />
                                  </span>
                                  <strong>{treeObjectLabel(object)}</strong>
                                  <span className="ef-layer-tree-child-type">{treeObjectTypeLabel(object)}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
          {rows.length === 0 ? <NoResult /> : null}
        </div>
      )}
    </div>
  );
}

function ObjectsPanel({
  filter,
  typeFilter,
  pageFilter,
}: {
  filter: string;
  typeFilter: string;
  pageFilter: string;
}) {
  const rows = useMemo(
    () =>
      objects.filter((item) => {
        const matchesQuery = matchesFilter(item, filter, [item.id, item.name, item.type, String(item.page), String(item.layerNumber)]);
        const matchesType = !typeFilter || item.type === typeFilter;
        const matchesPage = !pageFilter || String(item.page) === pageFilter;
        return matchesQuery && matchesType && matchesPage;
      }),
    [filter, pageFilter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "id");

  return (
    <div className="ef-object-table">
      <div className="ef-object-head">
        <SortHeader label="ID" dir={dirOf("id")} onClick={() => toggle("id")} width={58} />
        <SortHeader label="Type" dir={dirOf("type")} onClick={() => toggle("type")} width={66} />
        <SortHeader label="Nom" dir={dirOf("name")} onClick={() => toggle("name")} />
        <SortHeader label="Pg" dir={dirOf("page")} onClick={() => toggle("page")} width={28} align="center" />
        <SortHeader label="Calq." dir={dirOf("layerNumber")} onClick={() => toggle("layerNumber")} width={40} align="center" />
        <SortHeader label="Œil" dir={null} onClick={() => undefined} width={28} align="center" />
        <SortHeader label="Ver." dir={null} onClick={() => undefined} width={28} align="center" />
      </div>
      {sorted.map((item) => (
        <button key={item.id} className="ef-object-row" type="button" draggable onDragStart={(event) => setDragPayload(event, "object", item)}>
          <span>{item.id.replace("object-", "")}</span>
          <Badge value={item.type} colorSet={OBJECT_TYPE_COLORS[item.type]} width={56} />
          <strong>{item.name}</strong>
          <span>{item.page}</span>
          <span>{item.layerNumber}</span>
          <span>{item.visible ? <MaterialIcon name="visibility" size={18} filled /> : <MaterialIcon name="visibility_off" size={18} />}</span>
          <span>{item.locked ? <MaterialIcon name="lock" size={18} filled /> : <MaterialIcon name="lock_open" size={18} />}</span>
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function PagesPanel({ filter }: { filter: string }) {
  const rows = useMemo(
    () => pages.filter((item) => matchesFilter(item, filter, [item.name, item.orientation, String(item.number), `${item.width}x${item.height}`])),
    [filter],
  );
  const sorted = [...rows].sort((a, b) => a.number - b.number);

  return (
    <div className="ef-page-list">
      {sorted.map((page) => (
        <button key={page.id} className={["ef-page-card", page.active ? "is-active" : ""].join(" ")} type="button" draggable onDragStart={(event) => setDragPayload(event, "page", page)} title={page.name}>
          <span className="ef-page-preview">
            <Image src={page.previewSvg} alt="" width={170} height={120} unoptimized />
          </span>
          <span className="ef-page-meta">
            <span className="ef-page-number">{page.number}</span>
            <strong>{page.name}</strong>
          </span>
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function Badge({
  value,
  colorSet,
  width = 56,
}: {
  value: string;
  colorSet: ColorSet;
  width?: number;
}) {
  return (
    <span
      className="sidebar-badge"
      style={{
        "--badge-bg": colorSet.bg,
        "--badge-fg": colorSet.fg,
        "--badge-border": colorSet.border,
        "--badge-width": `${width}px`,
      } as CSSProperties}
    >
      {value}
    </span>
  );
}

function SortHeader({
  label,
  dir,
  onClick,
  width,
  align = "left",
}: {
  label: string;
  dir: SortDir;
  onClick: () => void;
  width?: number;
  align?: "left" | "center" | "right";
}) {
  const icon = dir === "asc" ? "arrow_upward" : dir === "desc" ? "arrow_downward" : "unfold_more";
  return (
    <button
      type="button"
      className={["sidebar-sort-header", dir ? "is-sorted" : "", align === "center" ? "sidebar-sort-header--center" : "", align === "right" ? "sidebar-sort-header--right" : ""].join(" ")}
      style={width ? ({ "--sort-width": `${width}px` } as CSSProperties) : undefined}
      onClick={onClick}
    >
      <span>{label}</span>
      <MaterialIcon name={icon} size={11} />
    </button>
  );
}

function NoResult() {
  return <div className="ef-no-result">Aucun résultat</div>;
}

function groupLayersByPage(rows: EditorLayerMock[]) {
  return pages
    .map((page) => ({
      page,
      layers: rows.filter((layer) => layer.page === page.number).sort((a, b) => a.number - b.number),
    }))
    .filter((group) => group.layers.length > 0);
}

function treeObjectLabel(item: EditorObjectMock) {
  return item.name;
}

function treeObjectTypeLabel(item: EditorObjectMock) {
  if (item.name.startsWith("Icone-")) {
    return "ICONE";
  }
  switch (item.type) {
    case "text":
      return "TEXTE";
    case "image":
      return "IMAGE";
    case "shape":
      return "FORME";
    case "chart":
      return "GRAPHE";
    case "variable":
      return "VARIABLE";
    case "preset":
      return "PRESET";
    case "group":
      return "GROUPE";
  }
}

function matchesFilter(item: { id?: string }, filter: string, values: string[]): boolean {
  if (!filter.trim()) return true;
  const query = filter.trim().toLowerCase();
  return [item.id ?? "", ...values].some((value) => value.toLowerCase().includes(query));
}

function useSort<T extends Record<string, unknown>>(rows: T[], initialKey: keyof T & string) {
  const [sort, setSort] = useState<{ key: keyof T & string; dir: SortDir }>({ key: initialKey, dir: "asc" });

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (!sort.dir) return copy;
    copy.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === "number" && typeof vb === "number") {
        if (va < vb) return sort.dir === "asc" ? -1 : 1;
        if (va > vb) return sort.dir === "asc" ? 1 : -1;
        return 0;
      }
      const sa = String(va ?? "").toLowerCase();
      const sb = String(vb ?? "").toLowerCase();
      if (sa < sb) return sort.dir === "asc" ? -1 : 1;
      if (sa > sb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sort]);

  const toggle = (key: keyof T & string) =>
    setSort((state) => (state.key === key ? { key, dir: state.dir === "asc" ? "desc" : state.dir === "desc" ? null : "asc" } : { key, dir: "asc" }));

  const dirOf = (key: keyof T & string) => (sort.key === key ? sort.dir : null);

  return { sorted, toggle, dirOf };
}

function setDragPayload(event: DragEvent<HTMLElement>, type: string, payload: unknown, sourcePanel?: string) {
  applyDragPreview(event, type, payload);
  event.dataTransfer.setData("application/x-resume-editor-item", JSON.stringify({ type, payload, sourcePanel }));
  event.dataTransfer.effectAllowed = "copy";
  useEditorStore.getState().setDragTraceContext({
    sessionId: crypto.randomUUID(),
    type,
    sourcePanel,
    payload,
  });
}

function handleDragEnd(event: DragEvent<HTMLElement>, type: string, payload: unknown, sourcePanel?: string) {
  void event;
  void type;
  void payload;
  void sourcePanel;
  clearActiveDragPreview();
  useEditorStore.getState().clearDragTraceContext();
}

function clearActiveDragPreview() {
  activeDragPreviewCleanup?.();
  activeDragPreviewCleanup = null;
}

function applyDragPreview(event: DragEvent<HTMLElement>, type: string, payload: unknown) {
  clearActiveDragPreview();
  const dragImage = document.createElement("div");
  dragImage.style.position = "fixed";
  dragImage.style.top = "0";
  dragImage.style.left = "0";
  dragImage.style.pointerEvents = "none";
  dragImage.style.display = "flex";
  dragImage.style.minWidth = "96px";
  dragImage.style.minHeight = "96px";
  dragImage.style.alignItems = "center";
  dragImage.style.justifyContent = "center";
  dragImage.style.padding = "10px";
  dragImage.style.margin = "0";
  dragImage.style.border = "1px solid rgba(15, 23, 42, 0.14)";
  dragImage.style.borderRadius = "12px";
  dragImage.style.background = "#ffffff";
  dragImage.style.boxShadow = "0 10px 26px rgba(15, 23, 42, 0.18)";
  dragImage.style.transform = "none";
  dragImage.style.color = "#0f172a";
  dragImage.style.fontFamily = "Inter, ui-sans-serif, system-ui, sans-serif";
  dragImage.style.fontSize = "12px";
  dragImage.style.lineHeight = "1.2";
  dragImage.appendChild(buildDragPreviewContent(type, payload));
  document.body.appendChild(dragImage);

  const rect = dragImage.getBoundingClientRect();
  event.dataTransfer.setDragImage(dragImage, Math.max(1, rect.width / 2), Math.max(1, rect.height / 2));
  activeDragPreviewCleanup = () => {
    dragImage.remove();
  };
}

function buildDragPreviewContent(type: string, payload: unknown) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.gap = "6px";
  container.style.minWidth = "72px";

  const visual = buildDragPreviewVisual(type, payload);
  container.appendChild(visual);

  const label = document.createElement("div");
  label.style.maxWidth = "150px";
  label.style.overflow = "hidden";
  label.style.textOverflow = "ellipsis";
  label.style.whiteSpace = "nowrap";
  label.style.fontWeight = "600";
  label.textContent = buildDragPreviewLabel(type, payload);
  container.appendChild(label);

  return container;
}

function buildDragPreviewVisual(type: string, payload: unknown) {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const imageSrc = typeof record?.src === "string" ? record.src : typeof record?.svg === "string" ? svgToDataUri(record.svg) : null;

  if ((type === "image" || type === "shape") && imageSrc) {
    return buildPreviewImage(imageSrc, 84, 84, 10);
  }

  if (type === "icon") {
    if (typeof record?.svg === "string") {
      return buildPreviewImage(svgToDataUri(record.svg), 84, 84, 10);
    }
    const icon = document.createElement("div");
    icon.style.width = "72px";
    icon.style.height = "72px";
    icon.style.borderRadius = "16px";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.style.background = "#eef2ff";
    icon.style.color = "#1e3a8a";
    icon.style.fontSize = "28px";
    icon.style.fontWeight = "700";
    icon.textContent = typeof record?.name === "string" ? record.name.slice(0, 2).toUpperCase() : "IC";
    return icon;
  }

  if (type === "emoji" && typeof record?.emoji === "string") {
    const emoji = document.createElement("div");
    emoji.style.width = "72px";
    emoji.style.height = "72px";
    emoji.style.display = "flex";
    emoji.style.alignItems = "center";
    emoji.style.justifyContent = "center";
    emoji.style.fontSize = "40px";
    emoji.textContent = record.emoji;
    return emoji;
  }

  const fallback = document.createElement("div");
  fallback.style.width = "72px";
  fallback.style.height = "72px";
  fallback.style.borderRadius = "14px";
  fallback.style.display = "flex";
  fallback.style.alignItems = "center";
  fallback.style.justifyContent = "center";
  fallback.style.background = "#e2e8f0";
  fallback.style.color = "#0f172a";
  fallback.style.fontSize = "13px";
  fallback.style.fontWeight = "700";
  fallback.textContent = buildDragPreviewLabel(type, payload).slice(0, 10) || type;
  return fallback;
}

function buildPreviewImage(src: string, width: number, height: number, radius: number) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.width = width;
  img.height = height;
  img.draggable = false;
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;
  img.style.objectFit = "cover";
  img.style.borderRadius = `${radius}px`;
  img.style.display = "block";
  img.style.background = "#ffffff";
  img.style.boxShadow = "0 0 0 1px rgba(15, 23, 42, 0.12) inset";
  return img;
}

function buildDragPreviewLabel(type: string, payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return type;
  }

  const record = payload as Record<string, unknown>;
  return (
    (typeof record.label === "string" && record.label) ||
    (typeof record.name === "string" && record.name) ||
    (typeof record.token === "string" && record.token) ||
    (typeof record.id === "string" && record.id) ||
    type
  );
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
}

function renderIconPreview(item: EditorIconMock) {
  if (item.svg) {
    return <Image src={svgToDataUri(item.svg)} alt={item.name} width={40} height={40} unoptimized />;
  }
  if (item.iconName) {
    return <MaterialIcon name={item.iconName as MaterialIconName} size={20} />;
  }
  return <span className="ef-mono-icon">{item.name.slice(0, 2).toUpperCase()}</span>;
}

const actionIconName: Record<ActionIcon, MaterialIconName> = {
  settings: "settings",
  upload: "upload",
  add: "add",
  edit: "edit",
  delete: "delete",
  merge: "merge",
  reorder: "swap_vert",
  duplicate: "content_copy",
  move: "drive_file_move",
};

const footerActionIconName: Record<ActionIcon, MaterialIconName> = {
  settings: "settings",
  upload: "upload",
  add: "add",
  edit: "edit",
  delete: "delete",
  merge: "merge",
  reorder: "swap_vert",
  duplicate: "content_copy",
  move: "drive_file_move",
};

const actionLabels: Record<ActionIcon, string> = {
  settings: "Paramètres",
  upload: "Importer",
  add: "Ajouter",
  edit: "Modifier",
  delete: "Supprimer",
  merge: "Fusionner",
  reorder: "Réordonner",
  duplicate: "Dupliquer",
  move: "Déplacer",
};
