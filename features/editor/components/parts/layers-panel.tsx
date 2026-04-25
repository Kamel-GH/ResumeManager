"use client";

import { Eye, EyeOff, Lock, LockOpen, Search, Settings } from "lucide-react";

import { layers } from "@/src/data/editorMockData";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function LayersPanel({ embedded = false }: { embedded?: boolean }) {
  const filter = useEditorStore((state) => state.panelPreferences.filters.layers ?? "");
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);
  const rows = layers.filter((layer) => {
    if (!filter.trim()) return true;
    const query = filter.toLowerCase();
    return [layer.name, String(layer.page), String(layer.number)].some((value) => value.toLowerCase().includes(query));
  });

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
        <button className="ef-filter-select" type="button">LISTE</button>
      </div>

      <div className="ef-layer-table">
        <div className="ef-layer-table-row ef-list-head">
          <span>N°</span>
          <span>Nom</span>
          <span>Pg</span>
          <span>Œil</span>
          <span>Ver.</span>
        </div>
        {rows.map((layer) => (
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
