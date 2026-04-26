"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Eye, EyeOff, Lock, LockOpen, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";

import { layers } from "@/src/data/editorMockData";
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
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);
  const rows = layers.filter((layer) => {
    if (!filter.trim() && !pageFilter && !stateFilter) return true;
    const query = filter.toLowerCase();
    const matchesQuery = [layer.name, String(layer.page), String(layer.number), layer.active ? "active" : "inactive", layer.visible ? "visible" : "hidden", layer.locked ? "locked" : "unlocked"].some((value) => value.toLowerCase().includes(query));
    const matchesPage = !pageFilter || String(layer.page) === pageFilter;
    const matchesState =
      !stateFilter ||
      stateFilter === "all" ||
      (stateFilter === "active" && layer.active) ||
      (stateFilter === "visible" && layer.visible) ||
      (stateFilter === "hidden" && !layer.visible) ||
      (stateFilter === "locked" && layer.locked) ||
      (stateFilter === "unlocked" && !layer.locked);
    return matchesQuery && matchesPage && matchesState;
  });
  const { sorted, toggle, dirOf } = useSortableRows(rows, "number");

  return (
    <aside className={["ef-layers", embedded ? "is-embedded" : ""].join(" ")}>
      <div className="ef-left-panel-toolbar">
        <span />
        <button className="ef-square-button ef-icon-28" type="button" title="Paramètres" aria-label="Paramètres">
          <Settings size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="ef-search-line">
        <label className="ef-search-box ef-left-search">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={filter} placeholder="Filtrer calques..." aria-label="Filtrer calques" onChange={(event) => setPanelFilter("layers", event.target.value)} />
        </label>
        <select className="ef-filter-select" value={pageFilter} onChange={(event) => onPageFilterChange?.(event.target.value)}>
          <option value="">Pg</option>
          {Array.from(new Set(layers.map((layer) => String(layer.page)))).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select className="ef-filter-select" value={stateFilter} onChange={(event) => onStateFilterChange?.(event.target.value)}>
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
          <SortHeaderButton label="N°" dir={dirOf("number")} onClick={() => toggle("number")} width={34} align="center" />
          <SortHeaderButton label="Nom" dir={dirOf("name")} onClick={() => toggle("name")} />
          <SortHeaderButton label="Pg" dir={dirOf("page")} onClick={() => toggle("page")} width={34} align="center" />
          <SortHeaderButton label="Œil" dir={null} onClick={() => undefined} width={30} align="center" />
          <SortHeaderButton label="Ver." dir={null} onClick={() => undefined} width={30} align="center" />
        </div>
        {sorted.map((layer) => (
          <button
            key={layer.id}
            className={["ef-layer-table-row", layer.active ? "is-active-layer" : ""].join(" ")}
            type="button"
            title={layer.active ? `${layer.name} - calque actif` : layer.name}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-resume-editor-item", JSON.stringify({ type: "layer", payload: layer }));
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            <span>{layer.number}</span>
            <strong>{layer.name}</strong>
            <span>{layer.page}</span>
            <span>{layer.visible ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}</span>
            <span>{layer.locked ? <Lock size={18} aria-hidden="true" /> : <LockOpen size={18} aria-hidden="true" />}</span>
          </button>
        ))}
        {rows.length === 0 ? <div className="ef-no-result">Aucun résultat</div> : null}
      </div>

      <div className="ef-left-panel-footer">
        {["Ajouter", "Modifier", "Supprimer", "Fusionner", "Réordonner"].map((action) => (
          <button key={action} className="ef-footer-icon-action" type="button" title={action} aria-label={action}>
            {action.slice(0, 1)}
          </button>
        ))}
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
  const icon = dir === "asc" ? <ArrowUp size={11} aria-hidden="true" /> : dir === "desc" ? <ArrowDown size={11} aria-hidden="true" /> : <ArrowUpDown size={11} aria-hidden="true" />;
  return (
    <button
      type="button"
      className={[
        "ef-sort-header",
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

function useSortableRows<T extends Record<string, unknown>>(rows: T[], initialKey: keyof T & string) {
  const [sort, setSort] = useState<{ key: keyof T & string; dir: "asc" | "desc" | null }>({ key: initialKey, dir: "asc" });

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
