"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";

import { presets, variables } from "@/src/data/editorMockData";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import type { EditorPresetMock, EditorVariableMock } from "@/src/data/editorMockData";

export function EditorDataPanel({
  activeSubTab = "variables",
  typeFilter = "",
  onTypeFilterChange,
}: {
  activeSubTab?: "variables" | "presets";
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
}) {
  const filter = useEditorStore((state) => state.panelPreferences.filters[activeSubTab] ?? "");
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);
  const handleTypeChange = onTypeFilterChange ?? (() => undefined);

  return (
    <div className="ef-data-panel ef-left-panel-body">
      <div className="ef-left-panel-toolbar">
        <span />
        <button className="ef-square-button ef-icon-28" type="button" title="Paramètres" aria-label="Paramètres">
          <Settings size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="ef-search-row">
        <label className="ef-search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={filter}
            placeholder={activeSubTab === "variables" ? "Filtrer variables..." : "Filtrer presets..."}
            aria-label="Filtrer"
            onChange={(event) => setPanelFilter(activeSubTab, event.target.value)}
          />
        </label>
        <select className="ef-filter-select" value={typeFilter} onChange={(event) => handleTypeChange(event.target.value)}>
          <option value="">TYPE</option>
          {(activeSubTab === "variables" ? ["TEXTE", "IMAGE", "LISTE", "TABLE"] : ["EXPERIENCES", "FORMATIONS", "LANGUES", "COMPETENCES", "INTERETS"]).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="ef-left-panel-scroll">
        {activeSubTab === "variables" ? <VariablesList filter={filter} typeFilter={typeFilter} /> : <PresetList filter={filter} typeFilter={typeFilter} />}
      </div>
    </div>
  );
}

function VariablesList({ filter, typeFilter }: { filter: string; typeFilter: string }) {
  const rows = variables.filter((variable) => matchesFilter(variable, filter, [variable.label, variable.token, variable.type, variable.mappedPath]) && (!typeFilter || variable.type === typeFilter));
  const { sorted, toggle, dirOf } = useSortableRows(rows, "label");

  return (
    <div className="ef-entity-card-stack">
      <div className="ef-data-sort-head">
        <SortHeaderButton label="VARIABLE" dir={dirOf("label")} onClick={() => toggle("label")} />
        <SortHeaderButton label="TYPE" dir={dirOf("type")} onClick={() => toggle("type")} width={78} align="center" />
      </div>
      <div className="ef-entity-card-list ef-entity-card-list-variables">
        {sorted.map((variable) => (
        <button
          key={variable.id}
          className="ef-entity-card ef-variable-card"
          title={`${variable.token} → ${variable.mappedPath}`}
          draggable
          onDragStart={(event) => setDragPayload(event, "variable", variable)}
          >
            <span className="ef-entity-card-token">{variable.token}</span>
            <span className="ef-entity-card-type">
              <Badge value={variable.type} kind="variable" />
            </span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function PresetList({ filter, typeFilter }: { filter: string; typeFilter: string }) {
  const rows = presets.filter((preset) => matchesFilter(preset, filter, [preset.label, preset.token, preset.type, preset.mappedPath, preset.description]) && (!typeFilter || preset.type === typeFilter));
  const { sorted, toggle, dirOf } = useSortableRows(rows, "token");

  return (
    <div className="ef-entity-card-stack">
      <div className="ef-data-sort-head">
        <SortHeaderButton label="PRESET" dir={dirOf("token")} onClick={() => toggle("token")} />
        <SortHeaderButton label="TYPE" dir={dirOf("type")} onClick={() => toggle("type")} width={78} align="center" />
      </div>
      <div className="ef-entity-card-list ef-entity-card-list-presets">
        {sorted.map((preset) => (
        <button
          key={preset.id}
          className="ef-entity-card ef-preset-card"
          type="button"
          title={`${preset.token} - ${preset.description}`}
          draggable
          onDragStart={(event) => setDragPayload(event, "preset", preset)}
          >
            <span className="ef-entity-card-token">{preset.token}</span>
            <span className="ef-entity-card-type">
              <Badge value={preset.type} kind="preset" />
            </span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function Badge({ value, kind }: { value: EditorVariableMock["type"] | EditorPresetMock["type"]; kind: "variable" | "preset" }) {
  return <span className={["ef-real-badge", kind === "variable" ? "ef-variable-type-badge" : "ef-preset-type-badge", `is-${value.toLowerCase()}`].join(" ")}>{value}</span>;
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

function NoResult() {
  return <div className="ef-no-result">Aucun résultat</div>;
}

function matchesFilter(item: { id: string }, filter: string, values: string[]): boolean {
  if (!filter.trim()) {
    return true;
  }

  const query = filter.trim().toLowerCase();
  return [item.id, ...values].some((value) => value.toLowerCase().includes(query));
}

function setDragPayload(event: React.DragEvent<HTMLElement>, type: string, payload: unknown) {
  event.dataTransfer.setData("application/x-resume-editor-item", JSON.stringify({ type, payload }));
  event.dataTransfer.effectAllowed = "copy";
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
