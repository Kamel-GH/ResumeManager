"use client";

import { GripVertical, Search, Settings } from "lucide-react";

import { presets, variables } from "@/src/data/editorMockData";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import type { EditorPresetMock, EditorVariableMock } from "@/src/data/editorMockData";

export function EditorDataPanel({ activeSubTab = "variables" }: { activeSubTab?: "variables" | "presets" }) {
  const filter = useEditorStore((state) => state.panelPreferences.filters[activeSubTab] ?? "");
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);

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
        <button className="ef-filter-select" type="button">TYPE</button>
      </div>

      <div className="ef-left-panel-scroll">
        {activeSubTab === "variables" ? <VariablesList filter={filter} /> : <PresetList filter={filter} />}
      </div>
    </div>
  );
}

function VariablesList({ filter }: { filter: string }) {
  const rows = variables.filter((variable) => matchesFilter(variable, filter, [variable.label, variable.token, variable.type, variable.mappedPath]));

  return (
    <div className="ef-data-table">
      <div className="ef-data-table-row ef-data-table-head">
        <span />
        <span>Variable</span>
        <span>Type</span>
      </div>
      {rows.map((variable) => (
        <div
          key={variable.id}
          className="ef-data-table-row"
          title={`${variable.token} → ${variable.mappedPath}`}
          draggable
          onDragStart={(event) => setDragPayload(event, "variable", variable)}
        >
          <GripVertical size={12} className="ef-muted-icon" aria-hidden="true" />
          <span className="ef-token">{variable.token}</span>
          <Badge value={variable.type} />
        </div>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function PresetList({ filter }: { filter: string }) {
  const rows = presets.filter((preset) => matchesFilter(preset, filter, [preset.label, preset.token, preset.type, preset.mappedPath, preset.description]));

  return (
    <div className="ef-preset-list">
      <div className="ef-preset-list-head">PRESET ↑</div>
      {rows.map((preset) => (
        <button
          key={preset.id}
          className="ef-preset-list-row"
          type="button"
          title={`${preset.token} - ${preset.description}`}
          draggable
          onDragStart={(event) => setDragPayload(event, "preset", preset)}
        >
          <span className="ef-token">{preset.token}</span>
          <Badge value={preset.type} />
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function Badge({ value }: { value: EditorVariableMock["type"] | EditorPresetMock["type"] }) {
  return <span className={`ef-real-badge is-${value.toLowerCase()}`}>{value}</span>;
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
