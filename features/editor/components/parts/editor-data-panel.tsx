"use client";

import { Search, Settings2 } from "lucide-react";

import { useEditorStore } from "@/features/editor/stores/editor-store";

export function EditorDataPanel({
  activeSubTab = "variables",
}: {
  activeSubTab?: "variables" | "presets";
}) {
  const filter = useEditorStore((state) => state.panelPreferences.filters[activeSubTab] ?? "");
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);

  return (
    <div className="ef-data-panel ef-left-panel-body">
      <div className="ef-left-panel-toolbar">
        <span />
        <button className="ef-square-button ef-icon-28" type="button" title="Paramètres" aria-label="Paramètres">
          <Settings2 size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="ef-search-row">
        <label className="ef-search-box">
          <span className="ms" aria-hidden="true">
            <Search size={18} />
          </span>
          <input
            type="search"
            value={filter}
            placeholder={activeSubTab === "variables" ? "Filtrer variables..." : "Filtrer presets..."}
            aria-label="Filtrer"
            onChange={(event) => setPanelFilter(activeSubTab, event.target.value)}
          />
        </label>
      </div>

      <div className="ef-left-panel-scroll">
        <div className="ef-no-result" style={{ minHeight: 132, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
          <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>Données</strong>
          <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Section non branchée dans ce lot.</span>
        </div>
      </div>
    </div>
  );
}
