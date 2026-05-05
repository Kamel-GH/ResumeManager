"use client";

import {
  ChevronDown,
  ChevronRight,
  Circle,
  Database,
  Eye,
  EyeOff,
  FileText,
  Layers3,
  LibraryBig,
  Lock,
  LockOpen,
  Merge,
  Pencil,
  Plus,
  Settings2,
  Shapes,
  Trash2,
  List,
} from "lucide-react";
import { useMemo, useState, type DragEvent, type MouseEvent } from "react";

import type { CanvasCreationEnvelope } from "@/features/editor/schema/canvas-insertion";
import { VariablesCompactPanel } from "@/features/data-mapping/components/variables-compact-panel";
import {
  EditorLeftPanelPrimaryRail,
  EditorLeftPanelSubTabRail,
  type LeftPanelPrimaryTab,
} from "@/features/editor/components/parts/editor-left-panel-rails";
import { EditorLeftPagesPanel } from "@/features/editor/components/parts/editor-left-panel-pages";
import {
  ActionButton,
  Badge,
  IconGlyph,
  NoResult,
  SearchBox,
  SortHeader,
  UnavailablePanel,
} from "@/features/editor/components/parts/editor-left-panel-common";
import {
  deriveEditorDocumentLayersView,
  deriveEditorObjectsView,
  deriveEditorPagesView,
  filterEditorLayersView,
  filterEditorObjectsView,
  type EditorLayerView,
  type EditorObjectView,
} from "@/features/editor/selectors";
import {
  useEditorStore,
  type EditorLeftPanelTab,
} from "@/features/editor/stores/editor-store";


const PRIMARY_TABS: LeftPanelPrimaryTab[] = [
  {
    id: "data",
    label: "Données",
    icon: Database,
    subTabs: [
      { id: "variables", label: "Variables", icon: Database },
      { id: "presets", label: "Presets", icon: LibraryBig },
    ],
  },
  {
    id: "libraries",
    label: "Bibliothèques",
    icon: LibraryBig,
    subTabs: [
      { id: "images", label: "Images", icon: FileText },
      { id: "charts-shapes", label: "Graphiques / Shapes", icon: Shapes },
      { id: "icons", label: "Icônes", icon: Circle },
      { id: "emoji", label: "Emoji", icon: Circle },
      { id: "text-blocks", label: "Blocs textes", icon: FileText },
    ],
  },
  { id: "layers", label: "Calques", icon: Layers3, subTabs: null },
  { id: "objects", label: "Objets", icon: Shapes, subTabs: null },
  { id: "pages", label: "Pages", icon: FileText, subTabs: null },
];

const REAL_TABS = new Set<EditorLeftPanelTab>(["pages", "layers", "objects"]);

export function EditorLeftPanel() {
  const activeTab = useEditorStore((state) => state.panelPreferences.activeLeftTab);
  const activeSubTabs = useEditorStore((state) => state.panelPreferences.activeSubTabs);
  const panelFilters = useEditorStore((state) => state.panelPreferences.filters);
  const setActiveLeftTab = useEditorStore((state) => state.setActiveLeftTab);
  const setActiveSubTab = useEditorStore((state) => state.setActiveSubTab);
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);
  const activePageId = useEditorStore((state) => state.activePageId);
  const activeWorkspaceLayerIdByPageId = useEditorStore((state) => state.activeWorkspaceLayerIdByPageId);
  const selectedWorkspaceLayerIdByPageId = useEditorStore((state) => state.selectedWorkspaceLayerIdByPageId);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);
  const setActiveWorkspaceLayerIdForPage = useEditorStore((state) => state.setActiveWorkspaceLayerIdForPage);
  const setSelectedWorkspaceLayerIdForPage = useEditorStore((state) => state.setSelectedWorkspaceLayerIdForPage);
  const addWorkspaceLayerForPage = useEditorStore((state) => state.addWorkspaceLayerForPage);
  const renameWorkspaceLayerForPage = useEditorStore((state) => state.renameWorkspaceLayerForPage);
  const deleteWorkspaceLayersForPage = useEditorStore((state) => state.deleteWorkspaceLayersForPage);
  const mergeWorkspaceLayersForPage = useEditorStore((state) => state.mergeWorkspaceLayersForPage);
  const reorderWorkspaceLayerForPage = useEditorStore((state) => state.reorderWorkspaceLayerForPage);
  const moveWorkspaceLayersForPage = useEditorStore((state) => state.moveWorkspaceLayersForPage);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const setDragTraceContext = useEditorStore((state) => state.setDragTraceContext);
  const clearDragTraceContext = useEditorStore((state) => state.clearDragTraceContext);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const workspaceLayersByPageId = useEditorStore((state) => state.workspaceLayersByPageId);

  const tab = PRIMARY_TABS.find((item) => item.id === activeTab) ?? PRIMARY_TABS[0];
  const activeSubTab = activeSubTabs[activeTab] ?? tab.subTabs?.[0]?.id;
  const activePageViews = useMemo(() => deriveEditorPagesView(workingTemplate, activePageId), [activePageId, workingTemplate]);
  const layerViews = useMemo(
    () => deriveEditorDocumentLayersView(workingTemplate, workspaceLayersByPageId, activePageId, activeWorkspaceLayerIdByPageId, selectedWorkspaceLayerIdByPageId),
    [activePageId, activeWorkspaceLayerIdByPageId, selectedWorkspaceLayerIdByPageId, workingTemplate, workspaceLayersByPageId],
  );
  const objectViews = useMemo(() => workingTemplate.pages.flatMap((page) => deriveEditorObjectsView(workingTemplate, selectedElementIds, page.id)), [selectedElementIds, workingTemplate]);
  const [layersViewMode, setLayersViewMode] = useState<"list" | "tree">("tree");
  const [layerPageFilter, setLayerPageFilter] = useState("all");
  const [layerVisibilityFilter, setLayerVisibilityFilter] = useState("all");
  const [layerLockFilter, setLayerLockFilter] = useState("all");
  const [objectTypeFilter, setObjectTypeFilter] = useState("all");
  const [objectLayerFilter, setObjectLayerFilter] = useState("all");
  const [objectPageFilter, setObjectPageFilter] = useState("all");
  const objectTypeOptions = useMemo(() => uniqueSorted(objectViews.map((object) => object.type)), [objectViews]);
  const objectLayerOptions = useMemo(
    () =>
      uniqueBy(
        objectViews
          .filter((object) => object.layerId)
          .map((object) => ({
            id: object.layerId ?? "",
            label: object.layerNumber ? `Cq ${object.layerNumber}` : object.layerName,
          })),
        (item) => item.id,
      ),
    [objectViews],
  );

  function switchTab(nextTab: EditorLeftPanelTab) {
    const next = PRIMARY_TABS.find((item) => item.id === nextTab);
    const nextSubTab = next?.subTabs?.[0]?.id;
    setActiveLeftTab(nextTab);
    if (nextSubTab) {
      setActiveSubTab(nextTab, nextSubTab);
    }
  }

  function handlePageSelect(pageId: string) {
    setActivePageId(pageId);
  }

  function handleLayerSelect(layer: EditorLayerView) {
    setSelectedWorkspaceLayerIdForPage({
      pageId: layer.pageId,
      layerId: layer.id,
    });
  }

  function handleLayerActivate(layer: EditorLayerView) {
    setActiveWorkspaceLayerIdForPage({
      pageId: layer.pageId,
      layerId: layer.id,
    });
    setSelectedWorkspaceLayerIdForPage({
      pageId: layer.pageId,
      layerId: layer.id,
    });
  }

  function handleAddLayer() {
    const result = addWorkspaceLayerForPage({ pageId: activePageId });
    return result.added ? result.layerId : null;
  }

  function handleRenameLayer(layer: EditorLayerView) {
    const name = window.prompt("Nom du calque", layer.name);
    if (name === null) {
      return;
    }

    renameWorkspaceLayerForPage({ pageId: layer.pageId, layerId: layer.id, name });
  }

  function handleDeleteLayers(layers: EditorLayerView[]) {
    groupLayersByPage(layers).forEach((layerIds, pageId) => {
      deleteWorkspaceLayersForPage({ pageId, layerIds });
    });
  }

  function handleMergeLayers(layers: EditorLayerView[]) {
    const pageGroups = groupLayersByPage(layers);
    if (pageGroups.size !== 1) {
      return;
    }

    const [entry] = [...pageGroups.entries()];
    if (!entry) {
      return;
    }

    const [pageId, layerIds] = entry;
    mergeWorkspaceLayersForPage({ pageId, layerIds });
  }

  function handleMoveLayers(layers: EditorLayerView[], direction: "up" | "down") {
    groupLayersByPage(layers).forEach((layerIds, pageId) => {
      moveWorkspaceLayersForPage({ pageId, layerIds, direction });
    });
  }


  function handleObjectSelect(object: EditorObjectView) {
    setActivePageId(object.pageId);
    setSelectedElementIds([object.id]);
  }

  return (
    <aside className="ef-left-panel-v2" aria-label="Volet gauche">
      <EditorLeftPanelPrimaryRail
        tabs={PRIMARY_TABS}
        activeTab={activeTab}
        onTabChange={switchTab}
        renderIcon={(icon, size) => <IconGlyph icon={icon} size={size} />}
      />
      {tab.subTabs ? (
        <EditorLeftPanelSubTabRail
          subTabs={tab.subTabs}
          activeSubTab={activeSubTab}
          onSubTabChange={(value) => value && setActiveSubTab(activeTab, value)}
          renderIcon={(icon, size) => <IconGlyph icon={icon} size={size} />}
        />
      ) : null}

      {REAL_TABS.has(activeTab) ? (
        <div className="ef-control-header">
          <div className="ef-control-row">
            <div className="ef-control-left">
              {activeTab === "layers" ? (
                <div className="ef-view-toggle ef-layer-view-toggle" role="group" aria-label="Mode d’affichage">
                  <button type="button" className={layersViewMode === "list" ? "is-active" : ""} title="Liste" aria-label="Liste" onClick={() => setLayersViewMode("list")}>
                    <IconGlyph icon={List} size={14} />
                  </button>
                  <button type="button" className={layersViewMode === "tree" ? "is-active" : ""} title="Hiérarchie" aria-label="Hiérarchie" onClick={() => setLayersViewMode("tree")}>
                    <IconGlyph icon={Layers3} size={14} />
                  </button>
                </div>
              ) : (
                <span className="ef-control-left-spacer" aria-hidden="true" />
              )}
            </div>
            <div className="ef-control-actions">
              <ActionButton label="Paramètres" icon={Settings2} />
            </div>
          </div>

          <div className="ef-control-filter has-none">
            <SearchBox
              value={panelFilters[activeTab] ?? ""}
              placeholder={activeTab === "pages" ? "Filtrer pages…" : activeTab === "layers" ? "Filtrer calques…" : "Filtrer objets…"}
              onChange={(value) => setPanelFilter(activeTab, value)}
            />
            {activeTab === "layers" ? (
              <div className="ef-layer-filter-selects" aria-label="Filtres calques">
                <select aria-label="Filtrer par page" value={layerPageFilter} onChange={(event) => setLayerPageFilter(event.target.value)}>
                  <option value="all">Pg</option>
                  {activePageViews.map((page) => (
                    <option key={page.id} value={String(page.index)}>
                      {page.index}
                    </option>
                  ))}
                </select>
                <select aria-label="Filtrer visibilité" value={layerVisibilityFilter} onChange={(event) => setLayerVisibilityFilter(event.target.value)}>
                  <option value="all">Aff.</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Masqué</option>
                </select>
                <select aria-label="Filtrer verrouillage" value={layerLockFilter} onChange={(event) => setLayerLockFilter(event.target.value)}>
                  <option value="all">Ver.</option>
                  <option value="locked">Verrouillé</option>
                  <option value="unlocked">Déverrouillé</option>
                </select>
              </div>
            ) : null}
            {activeTab === "objects" ? (
              <div className="ef-object-filter-selects" aria-label="Filtres objets">
                <select aria-label="Filtrer par type" value={objectTypeFilter} onChange={(event) => setObjectTypeFilter(event.target.value)}>
                  <option value="all">Type</option>
                  {objectTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select aria-label="Filtrer par calque" value={objectLayerFilter} onChange={(event) => setObjectLayerFilter(event.target.value)}>
                  <option value="all">Cq</option>
                  {objectLayerOptions.map((layer) => (
                    <option key={layer.id} value={layer.id}>
                      {layer.label}
                    </option>
                  ))}
                </select>
                <select aria-label="Filtrer par page" value={objectPageFilter} onChange={(event) => setObjectPageFilter(event.target.value)}>
                  <option value="all">Pg</option>
                  {activePageViews.map((page) => (
                    <option key={page.id} value={String(page.index)}>
                      {page.index}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={["ef-left-panel-scroll", activeTab === "layers" ? "is-layers-panel" : "", activeTab === "objects" ? "is-objects-panel" : ""].join(" ")}>
        {activeTab === "pages" ? (
          <EditorLeftPagesPanel pages={activePageViews} filter={panelFilters.pages ?? ""} onSelectPage={handlePageSelect} />
        ) : null}
        {activeTab === "layers" ? (
          <LayersPanel
            layers={layerViews}
            objects={objectViews}
            filter={panelFilters.layers ?? ""}
            pageFilter={layerPageFilter}
            visibilityFilter={layerVisibilityFilter}
            lockFilter={layerLockFilter}
            mode={layersViewMode}
            onAddLayer={handleAddLayer}
            onActivateLayer={handleLayerActivate}
            onDeleteLayers={handleDeleteLayers}
            onMergeLayers={handleMergeLayers}
            onMoveLayers={handleMoveLayers}
            onRenameLayer={handleRenameLayer}
            onReorderLayer={(input) => reorderWorkspaceLayerForPage(input)}
            onSelectObject={handleObjectSelect}
            onSelectLayer={handleLayerSelect}
          />
        ) : null}
        {activeTab === "objects" ? (
          <ObjectsPanel
            objects={objectViews}
            filter={panelFilters.objects ?? ""}
            layerFilter={objectLayerFilter}
            pageFilter={objectPageFilter}
            typeFilter={objectTypeFilter}
            onSelectObject={handleObjectSelect}
          />
        ) : null}
        {activeTab === "data" ? (
          activeSubTab === "variables" ? (
            <VariablesCompactPanel onDragContext={setDragTraceContext} onDragEnd={clearDragTraceContext} />
          ) : (
            <UnavailablePanel title={tab.label} subtitle={activeSubTab ? PRIMARY_TABS.find((item) => item.id === activeTab)?.subTabs?.find((item) => item.id === activeSubTab)?.label : undefined} />
          )
        ) : null}
        {activeTab === "libraries" ? (
          <LibraryPanel
            subTab={activeSubTab ?? "images"}
            filter={panelFilters.libraries ?? ""}
            onDragContext={setDragTraceContext}
            onDragEnd={clearDragTraceContext}
          />
        ) : null}
      </div>
    </aside>
  );
}

function LayersPanel({
  layers,
  objects,
  filter,
  pageFilter,
  visibilityFilter,
  lockFilter,
  mode,
  onAddLayer,
  onActivateLayer,
  onDeleteLayers,
  onMergeLayers,
  onMoveLayers,
  onRenameLayer,
  onReorderLayer,
  onSelectObject,
  onSelectLayer,
}: {
  layers: EditorLayerView[];
  objects: EditorObjectView[];
  filter: string;
  pageFilter: string;
  visibilityFilter: string;
  lockFilter: string;
  mode: "list" | "tree";
  onAddLayer: () => string | null;
  onActivateLayer: (layer: EditorLayerView) => void;
  onDeleteLayers: (layers: EditorLayerView[]) => void;
  onMergeLayers: (layers: EditorLayerView[]) => void;
  onMoveLayers: (layers: EditorLayerView[], direction: "up" | "down") => void;
  onRenameLayer: (layer: EditorLayerView) => void;
  onReorderLayer: (input: { pageId: string; layerId: string; targetLayerId: string; position: "before" | "after" }) => void;
  onSelectObject: (object: EditorObjectView) => void;
  onSelectLayer: (layer: EditorLayerView) => void;
}) {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [collapsedPageIds, setCollapsedPageIds] = useState<Set<string>>(() => new Set());
  const [collapsedLayerIds, setCollapsedLayerIds] = useState<Set<string>>(() => new Set());
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set());
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [lastSelectedLayerId, setLastSelectedLayerId] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      filterEditorLayersView(layers, {
        text: filter,
        page: pageFilter,
        visibility: visibilityFilter === "visible" || visibilityFilter === "hidden" ? visibilityFilter : "all",
        lock: lockFilter === "locked" || lockFilter === "unlocked" ? lockFilter : "all",
      }).map((layer) => ({
          ...layer,
          grouped: false,
        })),
    [filter, layers, lockFilter, pageFilter, visibilityFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "order");
  const selectedLayers = sorted.filter((layer) => selectedLayerIds.includes(layer.id));
  const primarySelectedLayer = selectedLayers[0] ?? null;
  const selectedPageIds = new Set(selectedLayers.map((layer) => layer.pageId));
  const selectedSamePage = selectedPageIds.size <= 1;
  const selectedPageLayers = primarySelectedLayer ? sorted.filter((layer) => layer.pageId === primarySelectedLayer.pageId).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr")) : [];
  const selectedLayerIdSet = new Set(selectedLayers.map((layer) => layer.id));
  const layerCountByPageId = sorted.reduce<Map<string, number>>((counts, layer) => {
    counts.set(layer.pageId, (counts.get(layer.pageId) ?? 0) + 1);
    return counts;
  }, new Map());
  const canDeleteSelectedLayers = selectedLayers.some((layer) => layer.objectCount === 0 && (layerCountByPageId.get(layer.pageId) ?? 0) > 1);
  const canMergeSelectedLayers = selectedLayers.length >= 2 && selectedSamePage;
  const canMoveSelectedLayerUp = selectedLayers.length > 0 && selectedSamePage && selectedPageLayers.some((layer, index) => selectedLayerIdSet.has(layer.id) && index > 0 && !selectedLayerIdSet.has(selectedPageLayers[index - 1]?.id ?? ""));
  const canMoveSelectedLayerDown = selectedLayers.length > 0 && selectedSamePage && selectedPageLayers.some((layer, index) => selectedLayerIdSet.has(layer.id) && index < selectedPageLayers.length - 1 && !selectedLayerIdSet.has(selectedPageLayers[index + 1]?.id ?? ""));
  const objectsByLayerId = useMemo(() => {
    const groups = new Map<string, EditorObjectView[]>();
    objects.forEach((object) => {
      if (!object.layerId) {
        return;
      }

      const layerObjects = groups.get(object.layerId);
      if (layerObjects) {
        layerObjects.push(object);
        return;
      }

      groups.set(object.layerId, [object]);
    });

    return groups;
  }, [objects]);
  const pageGroups = useMemo(() => {
    const groups = new Map<string, { pageId: string; pageName: string; pageIndex: number; layers: typeof sorted }>();
    sorted.forEach((layer) => {
      const current = groups.get(layer.pageId);
      if (current) {
        current.layers.push(layer);
        return;
      }

      groups.set(layer.pageId, {
        pageId: layer.pageId,
        pageName: layer.pageName,
        pageIndex: layer.pageIndex,
        layers: [layer],
      });
    });

    return [...groups.values()].sort((a, b) => a.pageIndex - b.pageIndex);
  }, [sorted]);

  function toggleCollapsed(setter: (value: Set<string>) => void, current: Set<string>, id: string) {
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setter(next);
  }

  function handleLayerDrop(event: DragEvent<HTMLElement>, targetLayer: EditorLayerView) {
    event.preventDefault();
    const layerId = event.dataTransfer.getData("application/x-resume-editor-layer") || draggedLayerId;
    setDraggedLayerId(null);
    if (!layerId || layerId === targetLayer.id) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
    onReorderLayer({
      pageId: targetLayer.pageId,
      layerId,
      targetLayerId: targetLayer.id,
      position,
    });
  }

  function handleLayerClick(event: MouseEvent, layer: EditorLayerView) {
    onSelectLayer(layer);
    setLastSelectedLayerId(layer.id);

    if (event.shiftKey && lastSelectedLayerId) {
      const start = sorted.findIndex((item) => item.id === lastSelectedLayerId);
      const end = sorted.findIndex((item) => item.id === layer.id);
      if (start >= 0 && end >= 0) {
        const [from, to] = start < end ? [start, end] : [end, start];
        setSelectedLayerIds(sorted.slice(from, to + 1).map((item) => item.id));
        return;
      }
    }

    if (event.metaKey || event.ctrlKey) {
      setSelectedLayerIds((current) => (current.includes(layer.id) ? current.filter((id) => id !== layer.id) : [...current, layer.id]));
      return;
    }

    setSelectedLayerIds([layer.id]);
  }

  function handleAddLayerClick() {
    const layerId = onAddLayer();
    if (!layerId) {
      return;
    }

    setSelectedLayerIds([layerId]);
    setLastSelectedLayerId(layerId);
  }

  return (
    <div className="ef-layers-shell">
      <div className="ef-layers-list-scroll">
        {mode === "list" ? (
          <div className="ef-layer-table">
          <div className="ef-layer-head">
            <SortHeader label="N°" dir={dirOf("number")} onClick={() => toggle("number")} align="center" />
            <SortHeader label="O" dir={dirOf("order")} onClick={() => toggle("order")} align="center" />
            <SortHeader label="Nom" dir={dirOf("name")} onClick={() => toggle("name")} />
            <SortHeader label="Pg" dir={dirOf("pageIndex")} onClick={() => toggle("pageIndex")} align="center" />
            <SortHeader label="A" dir={dirOf("visible")} onClick={() => toggle("visible")} align="center" />
            <SortHeader label="V" dir={dirOf("locked")} onClick={() => toggle("locked")} align="center" />
          </div>
          {sorted.map((layer) => (
            <button
              key={layer.id}
              className={["ef-layer-table-row", selectedLayerIds.includes(layer.id) ? "is-selected-layer" : "", layer.active ? "is-active-layer" : "", draggedLayerId === layer.id ? "is-dragging" : ""].join(" ")}
              type="button"
              draggable
              data-layer-id={layer.id}
              data-page-id={layer.pageId}
              data-object-count={layer.objectCount}
              onClick={(event) => handleLayerClick(event, layer)}
              onDoubleClick={() => onActivateLayer(layer)}
              onDragStart={(event) => {
                setDraggedLayerId(layer.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/x-resume-editor-layer", layer.id);
              }}
              onDragOver={(event) => {
                if (draggedLayerId && draggedLayerId !== layer.id) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => handleLayerDrop(event, layer)}
              onDragEnd={() => setDraggedLayerId(null)}
              title={layer.name}
            >
              <span>{layer.number}</span>
              <span>{layer.order}</span>
              <strong>{layer.name}</strong>
              <span>{layer.pageIndex}</span>
              <span>{layer.visible ? <IconGlyph icon={Eye} size={16} /> : <IconGlyph icon={EyeOff} size={16} />}</span>
              <span>{layer.locked ? <IconGlyph icon={Lock} size={16} /> : <IconGlyph icon={LockOpen} size={16} />}</span>
            </button>
          ))}
          {rows.length === 0 ? <NoResult /> : null}
          </div>
        ) : (
          <div className="ef-layer-tree">
            {pageGroups.map((pageGroup) => {
              const pageCollapsed = collapsedPageIds.has(pageGroup.pageId);
              return (
                <div key={pageGroup.pageId} className="ef-layer-tree-page">
                  <button type="button" className="ef-layer-tree-page-row" title={pageGroup.pageName} onClick={() => toggleCollapsed(setCollapsedPageIds, collapsedPageIds, pageGroup.pageId)}>
                    <span className="ef-layer-tree-toggle">
                      <IconGlyph icon={pageCollapsed ? ChevronRight : ChevronDown} size={16} />
                    </span>
                    <span className="ef-layer-tree-page-icon">
                      <IconGlyph icon={FileText} size={15} />
                    </span>
                    <strong>
                      <span className="ef-layer-tree-page-prefix">Page {pageGroup.pageIndex}</span>
                      <span>{pageGroup.pageName}</span>
                    </strong>
                    <span className="ef-layer-tree-page-count">{pageGroup.layers.length}</span>
                  </button>
                  {pageCollapsed ? null : (
                    <div className="ef-layer-tree-page-body">
                      {pageGroup.layers.map((layer) => {
                        const layerCollapsed = collapsedLayerIds.has(layer.id);
                        const layerObjects = objectsByLayerId.get(layer.id) ?? [];
                        const groupedObjects = groupObjectsForLayer(layerObjects);
                        return (
                <div key={layer.id} className="ef-layer-tree-layer">
                  <button
                    type="button"
                              className={["ef-layer-tree-layer-row", selectedLayerIds.includes(layer.id) ? "is-selected-layer" : "", layer.active ? "is-active-layer" : "", draggedLayerId === layer.id ? "is-dragging" : ""].join(" ")}
                    draggable
                    onClick={(event) => handleLayerClick(event, layer)}
                              onDoubleClick={() => onActivateLayer(layer)}
                    onDragStart={(event) => {
                      setDraggedLayerId(layer.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("application/x-resume-editor-layer", layer.id);
                    }}
                    onDragOver={(event) => {
                      if (draggedLayerId && draggedLayerId !== layer.id) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDrop={(event) => handleLayerDrop(event, layer)}
                    onDragEnd={() => setDraggedLayerId(null)}
                    title={layer.name}
                  >
                              <span className="ef-layer-tree-toggle" onClick={(event) => {
                                event.stopPropagation();
                                toggleCollapsed(setCollapsedLayerIds, collapsedLayerIds, layer.id);
                              }}>
                                <IconGlyph icon={layerCollapsed ? ChevronRight : ChevronDown} size={14} />
                              </span>
                    <span>{layer.number}</span>
                    <span>{layer.order}</span>
                    <span>{layer.pageIndex}</span>
                    <span>{layer.objectCount}</span>
                    <span className="ef-layer-tree-visibility">{layer.visible ? <IconGlyph icon={Eye} size={16} /> : <IconGlyph icon={EyeOff} size={16} />}</span>
                    <span className="ef-layer-tree-lock">{layer.locked ? <IconGlyph icon={Lock} size={16} /> : <IconGlyph icon={LockOpen} size={16} />}</span>
                    <span>{layer.grouped ? "Oui" : "—"}</span>
                    <strong>{layer.name}</strong>
                  </button>
                            {layerCollapsed ? null : (
                              <LayerObjectTree
                                collapsedGroupIds={collapsedGroupIds}
                                groups={groupedObjects}
                                layer={layer}
                                onSelectObject={onSelectObject}
                                setCollapsedGroupIds={setCollapsedGroupIds}
                              />
                            )}
                </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          {rows.length === 0 ? <NoResult /> : null}
          </div>
        )}
      </div>
      <div className="ef-layers-toolbar" role="group" aria-label="Gestion des calques">
        <ActionButton label="Ajouter" icon={Plus} onClick={handleAddLayerClick} />
        <ActionButton label="Modifier" icon={Pencil} disabled={!primarySelectedLayer || selectedLayers.length !== 1} onClick={() => primarySelectedLayer && selectedLayers.length === 1 && onRenameLayer(primarySelectedLayer)} />
        <ActionButton label="Supprimer" icon={Trash2} disabled={!canDeleteSelectedLayers} onClick={() => onDeleteLayers(selectedLayers)} />
        <ActionButton label="Fusionner" icon={Merge} disabled={!canMergeSelectedLayers} onClick={() => onMergeLayers(selectedLayers)} />
        <ActionButton label="Réordonner vers le haut" icon={ArrowUp} disabled={!canMoveSelectedLayerUp} onClick={() => onMoveLayers(selectedLayers, "up")} />
        <ActionButton label="Réordonner vers le bas" icon={ArrowDown} disabled={!canMoveSelectedLayerDown} onClick={() => onMoveLayers(selectedLayers, "down")} />
      </div>
    </div>
  );
}

type LayerObjectGroup = {
  id: string;
  label: string;
  objects: EditorObjectView[];
};

function groupObjectsForLayer(objects: EditorObjectView[]) {
  const groups = new Map<string, LayerObjectGroup>();
  const direct: EditorObjectView[] = [];

  objects.forEach((object) => {
    if (!object.groupId) {
      direct.push(object);
      return;
    }

    const group = groups.get(object.groupId);
    if (group) {
      group.objects.push(object);
      return;
    }

    groups.set(object.groupId, {
      id: object.groupId,
      label: object.groupId,
      objects: [object],
    });
  });

  return {
    direct,
    groups: [...groups.values()],
  };
}

function LayerObjectTree({
  collapsedGroupIds,
  groups,
  onSelectObject,
  setCollapsedGroupIds,
}: {
  collapsedGroupIds: Set<string>;
  groups: ReturnType<typeof groupObjectsForLayer>;
  layer: EditorLayerView;
  onSelectObject: (object: EditorObjectView) => void;
  setCollapsedGroupIds: (value: Set<string>) => void;
}) {
  function toggleGroup(groupId: string) {
    const next = new Set(collapsedGroupIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setCollapsedGroupIds(next);
  }

  const hasObjects = groups.direct.length > 0 || groups.groups.length > 0;

  return (
    <div className="ef-layer-tree-objects" role="list">
      {groups.groups.map((group) => {
        const collapsed = collapsedGroupIds.has(group.id);
        return (
          <div key={group.id} className="ef-layer-tree-group">
            <button type="button" className="ef-layer-tree-group-row" onClick={() => toggleGroup(group.id)} title={group.label}>
              <span className="ef-layer-tree-object-branch" aria-hidden="true">
                {collapsed ? "▸" : "▾"}
              </span>
              <strong>{group.label}</strong>
              <span>{group.objects.length}</span>
              <span>groupé</span>
            </button>
            {collapsed
              ? null
              : group.objects.map((object) => <LayerTreeObjectRow key={object.id} object={object} onSelectObject={onSelectObject} />)}
          </div>
        );
      })}
      {groups.direct.map((object) => (
        <LayerTreeObjectRow key={object.id} object={object} onSelectObject={onSelectObject} />
      ))}
      {hasObjects ? null : <div className="ef-layer-tree-empty-object">Aucun objet</div>}
    </div>
  );
}

function LayerTreeObjectRow({
  object,
  onSelectObject,
}: {
  object: EditorObjectView;
  onSelectObject: (object: EditorObjectView) => void;
}) {
  return (
    <button type="button" className={["ef-layer-tree-object-row", object.selected ? "is-selected-object" : ""].join(" ")} title={object.name} onClick={() => onSelectObject(object)}>
      <span className="ef-layer-tree-object-branch" aria-hidden="true">
        ├
      </span>
      <strong>{object.name || object.type}</strong>
      <span title={object.visible ? "Visible" : "Masqué"} aria-label={object.visible ? "Visible" : "Masqué"}>
        {object.visible ? <IconGlyph icon={Eye} size={18} /> : <IconGlyph icon={EyeOff} size={18} />}
      </span>
      <span title={object.locked ? "Verrouillé" : "Déverrouillé"} aria-label={object.locked ? "Verrouillé" : "Déverrouillé"}>
        {object.locked ? <IconGlyph icon={Lock} size={18} /> : <IconGlyph icon={LockOpen} size={18} />}
      </span>
      <span>{readObjectGroupedState(object)}</span>
    </button>
  );
}

function ObjectsPanel({
  objects,
  filter,
  layerFilter,
  onSelectObject,
  pageFilter,
  typeFilter,
}: {
  objects: EditorObjectView[];
  filter: string;
  layerFilter: string;
  onSelectObject: (object: EditorObjectView) => void;
  pageFilter: string;
  typeFilter: string;
}) {
  const rows = useMemo(
    () =>
      filterEditorObjectsView(objects, {
        text: filter,
        type: typeFilter,
        layer: layerFilter,
        page: pageFilter,
      }),
    [filter, layerFilter, objects, pageFilter, typeFilter],
  );
  const { sorted, toggle, dirOf } = useSort(rows, "name");

  return (
    <div className="ef-objects-shell">
      <div className="ef-object-head" role="rowgroup" aria-label="Colonnes objets">
        <SortHeader label="Type" dir={dirOf("type")} onClick={() => toggle("type")} width={58} />
        <SortHeader label="Nom" dir={dirOf("name")} onClick={() => toggle("name")} />
        <SortHeader label="Pg" dir={dirOf("pageIndex")} onClick={() => toggle("pageIndex")} width={28} align="center" />
        <SortHeader label="Cq" dir={dirOf("layerNumber")} onClick={() => toggle("layerNumber")} width={34} align="center" />
        <SortHeader label="A" dir={null} onClick={() => undefined} width={28} align="center" />
        <SortHeader label="V" dir={null} onClick={() => undefined} width={28} align="center" />
      </div>
      <div className="ef-object-list-scroll">
        {sorted.map((object) => (
          <button key={object.id} className={["ef-object-row", object.selected ? "is-active" : ""].join(" ")} type="button" onClick={() => onSelectObject(object)} title={object.name}>
            <Badge value={object.type} colorSet={OBJECT_TYPE_COLORS[object.type] ?? DEFAULT_OBJECT_TYPE_COLOR} width={44} />
            <strong>{object.name}</strong>
            <span>{object.pageIndex}</span>
            <span>{object.layerNumber ?? "—"}</span>
            <span>{object.visible ? <IconGlyph icon={Eye} size={16} /> : <IconGlyph icon={EyeOff} size={16} />}</span>
            <span>{object.locked ? <IconGlyph icon={Lock} size={16} /> : <IconGlyph icon={LockOpen} size={16} />}</span>
          </button>
        ))}
        {rows.length === 0 ? <NoResult /> : null}
      </div>
    </div>
  );
}

function readObjectGroupedState(object: EditorObjectView) {
  if (object.grouped === true) {
    return "groupé";
  }

  if (object.grouped === false) {
    return "non groupé";
  }

  return "—";
}

function groupLayersByPage(layers: EditorLayerView[]) {
  const groups = new Map<string, string[]>();
  layers.forEach((layer) => {
    const layerIds = groups.get(layer.pageId);
    if (layerIds) {
      layerIds.push(layer.id);
      return;
    }

    groups.set(layer.pageId, [layer.id]);
  });
  return groups;
}

function LibraryPanel({
  subTab,
  filter,
  onDragContext,
  onDragEnd,
}: {
  subTab: EditorLeftSubTab;
  filter: string;
  onDragContext: (context: { sessionId: string; type: string; sourcePanel?: string; payload: unknown }) => void;
  onDragEnd: () => void;
}) {
  const items = useMemo(() => buildLibraryItems(subTab), [subTab]);
  const rows = useMemo(
    () => items.filter((item) => matchesFilter(item, filter, [item.label, item.description ?? "", item.kind, item.token ?? "", item.mappedPath ?? ""])),
    [filter, items],
  );

  if (rows.length === 0) {
    return <NoResult />;
  }

  if (subTab === "emoji") {
    return (
      <div className="ef-emoji-grid">
        {rows.map((item) => (
          <DraggableLibraryItem key={item.id} item={item} onDragContext={onDragContext} onDragEnd={onDragEnd} />
        ))}
      </div>
    );
  }

  if (subTab === "text-blocks" || subTab === "variables" || subTab === "presets") {
    return (
      <div className="ef-text-block-grid">
        {rows.map((item) => (
          <DraggableLibraryItem key={item.id} item={item} onDragContext={onDragContext} onDragEnd={onDragEnd} />
        ))}
      </div>
    );
  }

  return (
    <div className={["ef-asset-grid", subTab === "icons" ? "ef-asset-grid-4" : "ef-asset-grid-3"].join(" ")}>
      {rows.map((item) => (
        <DraggableLibraryItem key={item.id} item={item} onDragContext={onDragContext} onDragEnd={onDragEnd} />
      ))}
    </div>
  );
}

type LibraryItem = {
  id: string;
  label: string;
  description?: string;
  kind: string;
  token?: string;
  mappedPath?: string;
  glyph?: string;
  preview: string;
  envelope: CanvasCreationEnvelope;
};

function DraggableLibraryItem({
  item,
  onDragContext,
  onDragEnd,
}: {
  item: LibraryItem;
  onDragContext: (context: { sessionId: string; type: string; sourcePanel?: string; payload: unknown }) => void;
  onDragEnd: () => void;
}) {
  const context = createLibraryDragContext(item);

  return (
    <button
      className={resolveLibraryCardClass(item)}
      type="button"
      draggable={true}
      title={item.description ? `${item.label} · ${item.description}` : item.label}
      aria-label={item.label}
      onDragStart={(event) => {
        onDragContext(context);
        applyLibraryDragPayload(event, context);
      }}
      onDragEnd={() => {
        queueMicrotask(() => {
          onDragEnd();
        });
      }}
    >
      <LibraryPreview item={item} />
    </button>
  );
}

function LibraryPreview({ item }: { item: LibraryItem }) {
  if (item.kind === "emoji") {
    return <span aria-hidden="true">{item.glyph ?? "🙂"}</span>;
  }

  if (item.kind === "text-block" || item.kind === "variable" || item.kind === "preset" || item.kind === "dynamic-preset") {
    return (
      <span>
        {item.label}
        {item.description ? <small>{item.description}</small> : null}
      </span>
    );
  }

  if (item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.preview} alt="" aria-hidden="true" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.preview} alt="" aria-hidden="true" />
  );
}

function resolveLibraryCardClass(item: LibraryItem) {
  if (item.kind === "emoji") {
    return "ef-emoji-card";
  }

  if (item.kind === "text-block" || item.kind === "variable" || item.kind === "preset" || item.kind === "dynamic-preset") {
    return "ef-text-block-card";
  }

  return `ef-asset-card ${item.kind === "image" ? "is-image" : item.kind === "icon" ? "is-icon" : "is-shape"}`;
}

function createLibraryDragContext(item: LibraryItem) {
  return {
    sessionId: `library-drag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: item.envelope.type,
    sourcePanel: "libraries",
    payload: item.envelope.payload,
  };
}

function applyLibraryDragPayload(
  event: DragEvent<HTMLButtonElement>,
  context: { sessionId: string; type: string; sourcePanel?: string; payload: unknown },
) {
  const payload = JSON.stringify({
    type: context.type,
    payload: context.payload,
    sourcePanel: context.sourcePanel,
  });

  event.dataTransfer.setData("application/x-resume-editor-item", payload);
  event.dataTransfer.setData("text/plain", context.type);
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setDragImage(createTransparentDragImage(), 0, 0);
}

function createTransparentDragImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  context?.clearRect(0, 0, 1, 1);
  return canvas;
}

function buildLibraryItems(subTab: EditorLeftSubTab): LibraryItem[] {
  switch (subTab) {
    case "variables":
      return [
        libraryItem("variable-first-name", "[Prénom]", "Champ texte", "variable", createTextTokenPayload("[Prénom]", "candidate.firstName"), "#334155"),
        libraryItem("variable-last-name", "[Nom]", "Champ texte", "variable", createTextTokenPayload("[Nom]", "candidate.lastName"), "#334155"),
        libraryItem("variable-email", "[Email]", "Champ texte", "variable", createTextTokenPayload("[Email]", "candidate.email"), "#334155"),
        libraryItem("variable-phone", "[Téléphone]", "Champ texte", "variable", createTextTokenPayload("[Téléphone]", "candidate.phone"), "#334155"),
      ];
    case "presets":
      return [
        libraryItem("preset-experiences", "{EXPERIENCES}", "Bloc répété", "preset", createPresetPayload("Expériences", "EXPERIENCES", "candidate.experiences", 3), "#6c5cff"),
        libraryItem("preset-formations", "{FORMATIONS}", "Bloc répété", "preset", createPresetPayload("Formations", "FORMATIONS", "candidate.education", 2), "#6c5cff"),
        libraryItem("preset-langues", "{LANGUES}", "Bloc répété", "preset", createPresetPayload("Langues", "LANGUES", "candidate.languages", 3), "#6c5cff"),
        libraryItem("preset-competences", "{COMPETENCES}", "Bloc répété", "preset", createPresetPayload("Compétences", "COMPETENCES", "candidate.skills", 4), "#6c5cff"),
      ];
    case "images":
      return [
        libraryItem("image-placeholder", "Image", "Actif image", "image", createImagePayload("Image", createLibraryPreviewSvg("Image", "#2563eb")), "#2563eb"),
        libraryItem("image-portrait", "Portrait", "Actif image", "image", createImagePayload("Portrait", createLibraryPreviewSvg("Portrait", "#2563eb")), "#2563eb"),
        libraryItem("image-logo", "Logo", "Actif image", "image", createImagePayload("Logo", createLibraryPreviewSvg("Logo", "#2563eb")), "#2563eb"),
      ];
    case "icons":
      return [
        libraryItem("icon-mail", "Mail", "Icône", "icon", createIconPayload("Mail", createLibraryPreviewSvg("Mail", "#7c3aed")), "#7c3aed"),
        libraryItem("icon-phone", "Phone", "Icône", "icon", createIconPayload("Phone", createLibraryPreviewSvg("Phone", "#7c3aed")), "#7c3aed"),
        libraryItem("icon-link", "Link", "Icône", "icon", createIconPayload("Link", createLibraryPreviewSvg("Link", "#7c3aed")), "#7c3aed"),
      ];
    case "emoji":
      return [
        libraryItem("emoji-spark", "✨", "Emoji", "emoji", createEmojiPayload("✨", "Spark"), "#ef4444"),
        libraryItem("emoji-idea", "💡", "Emoji", "emoji", createEmojiPayload("💡", "Idea"), "#ef4444"),
        libraryItem("emoji-graduation", "🎓", "Emoji", "emoji", createEmojiPayload("🎓", "Graduate"), "#ef4444"),
        libraryItem("emoji-pin", "📍", "Emoji", "emoji", createEmojiPayload("📍", "Pin"), "#ef4444"),
      ];
    case "text-blocks":
      return [
        libraryItem("text-contact", "Contact", "Bloc texte", "text-block", createTextBlockPayload("Contact", "Coordonnées et liens"), "#0f172a"),
        libraryItem("text-experience", "Expérience", "Bloc texte", "text-block", createTextBlockPayload("Expérience", "Postes et missions"), "#0f172a"),
        libraryItem("text-education", "Formation", "Bloc texte", "text-block", createTextBlockPayload("Formation", "Diplômes et écoles"), "#0f172a"),
        libraryItem("text-skills", "Compétences", "Bloc texte", "text-block", createTextBlockPayload("Compétences", "Niveaux et outils"), "#0f172a"),
      ];
    case "charts-shapes":
    default:
      return [
        libraryItem("shape-rect", "Rectangle", "Forme", "shape", createShapePayload("Rectangle", "rect", createLibraryPreviewSvg("Rectangle", "#0f172a")), "#0f172a"),
        libraryItem("shape-circle", "Cercle", "Forme", "shape", createShapePayload("Cercle", "circle", createLibraryPreviewSvg("Cercle", "#0f172a")), "#0f172a"),
        libraryItem("shape-line", "Ligne", "Forme", "shape", createShapePayload("Ligne", "line", createLibraryPreviewSvg("Ligne", "#0f172a")), "#0f172a"),
        libraryItem("shape-arc", "Arc", "Forme", "shape", createShapePayload("Arc", "arc", createLibraryPreviewSvg("Arc", "#0f172a")), "#0f172a"),
      ];
  }
}

function libraryItem(id: string, label: string, description: string, kind: LibraryItem["kind"], payload: Record<string, unknown>, accent: string): LibraryItem {
  const envelope: CanvasCreationEnvelope = (() => {
    switch (kind) {
      case "variable":
        return { type: "variable", payload };
      case "preset":
        return { type: "preset", payload };
      case "image":
        return { type: "image", payload };
      case "icon":
        return { type: "icon", payload };
      case "emoji":
        return { type: "emoji", payload };
      case "text-block":
        return { type: "text-block", payload };
      default:
        return { type: "shape", payload };
    }
  })();

  return {
    id,
    label,
    description,
    kind,
    glyph: kind === "emoji" ? label : undefined,
    preview: createLibraryPreviewSvg(label, accent),
    envelope,
    ...("token" in payload && typeof payload.token === "string" ? { token: payload.token } : {}),
    ...("mappedPath" in payload && typeof payload.mappedPath === "string" ? { mappedPath: payload.mappedPath } : {}),
  };
}

function createTextTokenPayload(label: string, token: string) {
  return {
    label,
    token,
    sampleValue: label.replaceAll("[", "").replaceAll("]", ""),
    type: "TEXTE",
  };
}

function createPresetPayload(label: string, presetType: string, mappedPath: string, sampleItemsCount: number) {
  return {
    label,
    token: `{${presetType}}`,
    type: presetType,
    mappedPath,
    repeatable: true,
    sampleItemsCount,
    description: label,
  };
}

function createTextBlockPayload(name: string, description: string) {
  return {
    name,
    label: name,
    preview: `<p><strong>${name}</strong><br/>${description}</p>`,
    html: `<p><strong>${name}</strong><br/>${description}</p>`,
  };
}

function createImagePayload(name: string, svg: string) {
  return {
    name,
    src: svg,
    alt: name,
  };
}

function createIconPayload(name: string, svg: string) {
  return {
    name,
    svg,
  };
}

function createEmojiPayload(emoji: string, name: string) {
  return {
    emoji,
    name,
  };
}

function createShapePayload(label: string, type: string, svg: string) {
  return {
    label,
    name: label,
    type,
    svg,
  };
}

function createLibraryPreviewSvg(label: string, accent: string) {
  const safeLabel = label.replace(/[<>&"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">
      <rect x="8" y="8" width="104" height="74" rx="14" fill="white" stroke="${accent}" stroke-width="3" opacity="0.95"/>
      <text x="60" y="50" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" fill="${accent}">${safeLabel}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function matchesFilter(item: { id?: string }, filter: string, values: string[]): boolean {
  if (!filter.trim()) {
    return true;
  }

  const query = filter.trim().toLowerCase();
  return [item.id ?? "", ...values].some((value) => value.toLowerCase().includes(query));
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
}

function uniqueBy<T>(values: T[], keyOf: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = keyOf(value);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function useSort<T extends Record<string, unknown>>(rows: T[], initialKey: keyof T & string) {
  const [sort, setSort] = useState<{ key: keyof T & string; dir: SortDir }>({ key: initialKey, dir: "asc" });

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (!sort.dir) {
      return copy;
    }

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

const DEFAULT_OBJECT_TYPE_COLOR = { bg: "rgba(71, 85, 105, 0.22)", fg: "#b8c2cf", border: "rgba(148, 163, 184, 0.26)" };

const OBJECT_TYPE_COLORS: Partial<Record<EditorObjectView["type"], { bg: string; fg: string; border: string }>> = {
  text: { bg: "rgba(59, 130, 246, 0.14)", fg: "#a9bddb", border: "rgba(96, 165, 250, 0.24)" },
  "rich-text": { bg: "rgba(59, 130, 246, 0.14)", fg: "#a9bddb", border: "rgba(96, 165, 250, 0.24)" },
  image: { bg: "rgba(99, 102, 241, 0.14)", fg: "#b9baf0", border: "rgba(129, 140, 248, 0.24)" },
  shape: { bg: "rgba(168, 85, 247, 0.12)", fg: "#c7b5de", border: "rgba(192, 132, 252, 0.22)" },
  table: { bg: "rgba(34, 197, 94, 0.12)", fg: "#a9d1b9", border: "rgba(74, 222, 128, 0.22)" },
  list: { bg: "rgba(245, 158, 11, 0.12)", fg: "#d5b98c", border: "rgba(251, 191, 36, 0.22)" },
};
