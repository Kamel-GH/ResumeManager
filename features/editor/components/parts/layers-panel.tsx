"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Search,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { deriveEditorLayersView, deriveEditorPagesView } from "@/features/editor/selectors";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function LayersPanel({
  embedded = false,
  pageFilter = "",
  stateFilter = "",
  onPageFilterChange,
  onStateFilterChange,
}: {
  embedded?: boolean;
  pageFilter?: string;
  stateFilter?: string;
  onPageFilterChange?: (value: string) => void;
  onStateFilterChange?: (value: string) => void;
}) {
  const filter = useEditorStore((state) => state.panelPreferences.filters.layers ?? "");
  const activePageId = useEditorStore((state) => state.activePageId);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const workspaceLayersByPageId = useEditorStore((state) => state.workspaceLayersByPageId);
  const activeWorkspaceLayerIdByPageId = useEditorStore(
    (state) => state.activeWorkspaceLayerIdByPageId,
  );
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);
  const setActiveWorkspaceLayerIdForPage = useEditorStore(
    (state) => state.setActiveWorkspaceLayerIdForPage,
  );
  const pages = useMemo(
    () => deriveEditorPagesView(workingTemplate, activePageId),
    [activePageId, workingTemplate],
  );
  const layers = useMemo(
    () =>
      deriveEditorLayersView(
        workingTemplate,
        workspaceLayersByPageId,
        activePageId,
        activeWorkspaceLayerIdByPageId,
      ),
    [activePageId, activeWorkspaceLayerIdByPageId, workingTemplate, workspaceLayersByPageId],
  );
  const [sortKey, setSortKey] = useState<"order" | "name" | "objectCount">("order");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>("asc");

  const activePageNumber = pages.find((page) => page.active)?.index ?? pages[0]?.index ?? 1;
  const rows = useMemo(
    () =>
      layers.filter((layer) => {
        const matchesQuery = matchesFilter(layer, filter, [
          layer.name,
          String(layer.order),
          layer.visible ? "visible" : "hidden",
          layer.locked ? "locked" : "unlocked",
          String(layer.objectCount),
        ]);
        const matchesPage = !pageFilter || pageFilter === String(activePageNumber);
        const matchesState =
          !stateFilter ||
          stateFilter === "all" ||
          (stateFilter === "active" && layer.active) ||
          (stateFilter === "visible" && layer.visible) ||
          (stateFilter === "hidden" && !layer.visible) ||
          (stateFilter === "locked" && layer.locked) ||
          (stateFilter === "unlocked" && !layer.locked);
        return matchesQuery && matchesPage && matchesState;
      }),
    [activePageNumber, filter, layers, pageFilter, stateFilter],
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (!sortDir) {
      return copy;
    }

    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") {
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      }
      const sa = String(va ?? "").toLowerCase();
      const sb = String(vb ?? "").toLowerCase();
      if (sa < sb) return sortDir === "asc" ? -1 : 1;
      if (sa > sb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortDir, sortKey]);

  function toggleSort(nextKey: "order" | "name" | "objectCount") {
    setSortKey((current) => {
      if (current !== nextKey) {
        setSortDir("asc");
        return nextKey;
      }
      setSortDir((currentDir) =>
        currentDir === "asc" ? "desc" : currentDir === "desc" ? null : "asc",
      );
      return current;
    });
  }

  function handleLayerSelect(layerId: string) {
    setActiveWorkspaceLayerIdForPage({ pageId: activePageId, layerId });
  }

  return (
    <aside className={["ef-layers", embedded ? "is-embedded" : ""].join(" ")}>
      <div className="ef-left-panel-toolbar">
        <span />
        <button
          className="ef-square-button ef-icon-28"
          type="button"
          title="Paramètres"
          aria-label="Paramètres"
        >
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="ef-search-line">
        <label className="ef-search-box ef-left-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={filter}
            placeholder="Filtrer calques..."
            aria-label="Filtrer calques"
            onChange={(event) => setPanelFilter("layers", event.target.value)}
          />
        </label>
        <select
          className="ef-filter-select"
          value={pageFilter}
          onChange={(event) => onPageFilterChange?.(event.target.value)}
        >
          <option value="">Pg</option>
          {pages.map((page) => (
            <option key={page.id} value={String(page.index)}>
              {page.index}
            </option>
          ))}
        </select>
        <select
          className="ef-filter-select"
          value={stateFilter}
          onChange={(event) => onStateFilterChange?.(event.target.value)}
        >
          <option value="">STATUT</option>
          {["all", "active", "visible", "hidden", "locked", "unlocked"].map((value) => (
            <option key={value} value={value}>
              {value.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="ef-layer-table">
        <div className="ef-layer-head">
          <SortHeaderButton
            label="N°"
            dir={sortDir && sortKey === "order" ? sortDir : null}
            onClick={() => toggleSort("order")}
            width={34}
            align="center"
          />
          <SortHeaderButton
            label="Nom"
            dir={sortDir && sortKey === "name" ? sortDir : null}
            onClick={() => toggleSort("name")}
          />
          <SortHeaderButton
            label="Obj."
            dir={sortDir && sortKey === "objectCount" ? sortDir : null}
            onClick={() => toggleSort("objectCount")}
            width={34}
            align="center"
          />
          <SortHeaderButton
            label="V"
            dir={null}
            onClick={() => undefined}
            width={26}
            align="center"
          />
          <SortHeaderButton
            label="L"
            dir={null}
            onClick={() => undefined}
            width={26}
            align="center"
          />
        </div>
        {sorted.map((layer) => (
          <button
            key={layer.id}
            className={["ef-layer-table-row", layer.active ? "is-active-layer" : ""].join(" ")}
            type="button"
            title={layer.name}
            onClick={() => handleLayerSelect(layer.id)}
          >
            <span>{layer.order}</span>
            <strong>{layer.name}</strong>
            <span>{layer.objectCount}</span>
            <span>
              {layer.visible ? (
                <Eye size={18} aria-hidden="true" />
              ) : (
                <EyeOff size={18} aria-hidden="true" />
              )}
            </span>
            <span>
              {layer.locked ? (
                <Lock size={18} aria-hidden="true" />
              ) : (
                <LockOpen size={18} aria-hidden="true" />
              )}
            </span>
          </button>
        ))}
        {rows.length === 0 ? <div className="ef-no-result">Aucun résultat</div> : null}
      </div>
    </aside>
  );
}

function SortHeaderButton({
  label,
  dir,
  onClick,
  width,
  align = "left",
}: {
  label: string;
  dir: "asc" | "desc" | null;
  onClick: () => void;
  width?: number;
  align?: "left" | "center" | "right";
}) {
  const icon =
    dir === "asc" ? (
      <ArrowUp size={11} aria-hidden="true" />
    ) : dir === "desc" ? (
      <ArrowDown size={11} aria-hidden="true" />
    ) : (
      <ArrowUpDown size={11} aria-hidden="true" />
    );
  return (
    <button
      type="button"
      className={[
        "sidebar-sort-header",
        align === "center" ? "is-center" : "",
        align === "right" ? "is-right" : "",
      ].join(" ")}
      style={width ? { width } : undefined}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="ef-sort-header-icon">{icon}</span>
    </button>
  );
}

function matchesFilter(item: { id?: string }, filter: string, values: string[]): boolean {
  if (!filter.trim()) {
    return true;
  }

  const query = filter.trim().toLowerCase();
  return [item.id ?? "", ...values].some((value) => value.toLowerCase().includes(query));
}
