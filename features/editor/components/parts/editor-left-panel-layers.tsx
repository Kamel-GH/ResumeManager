"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LockOpen,
  Merge,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type DragEvent, type MouseEvent } from "react";

import {
  groupObjectsForLayer,
  readObjectGroupedState,
  useSort,
} from "@/features/editor/components/parts/editor-left-panel-utils";
import {
  ActionButton,
  IconGlyph,
  NoResult,
  SortHeader,
} from "@/features/editor/components/parts/editor-left-panel-common";
import {
  filterEditorLayersView,
  type EditorLayerView,
  type EditorObjectView,
} from "@/features/editor/selectors";

export function EditorLeftLayersPanel({
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
  const selectedPageLayers = primarySelectedLayer
    ? sorted
        .filter((layer) => layer.pageId === primarySelectedLayer.pageId)
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id, "fr"))
    : [];
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
    onReorderLayer({ pageId: targetLayer.pageId, layerId, targetLayerId: targetLayer.id, position });
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
                              <span
                                className="ef-layer-tree-toggle"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleCollapsed(setCollapsedLayerIds, collapsedLayerIds, layer.id);
                                }}
                              >
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

function LayerObjectTree({
  collapsedGroupIds,
  groups,
  onSelectObject,
  setCollapsedGroupIds,
}: {
  collapsedGroupIds: Set<string>;
  groups: ReturnType<typeof groupObjectsForLayer>;
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
            {collapsed ? null : group.objects.map((object) => <LayerTreeObjectRow key={object.id} object={object} onSelectObject={onSelectObject} />)}
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
