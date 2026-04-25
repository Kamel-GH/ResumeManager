"use client";

import { ChevronDown, ChevronRight, Diamond, Eye, Folder, Image, Minus, Search, SlidersHorizontal, Type } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type LayerRow = {
  label: string;
  icon: LucideIcon;
  depth: 0 | 1 | 2;
  selected?: boolean;
  expanded?: boolean;
  collapsed?: boolean;
  visible?: boolean;
};

const layerRows: LayerRow[] = [
  { label: "Header", icon: Folder, depth: 0, expanded: true, visible: true },
  { label: "Nom & Prénom", icon: Type, depth: 1, selected: true, visible: true },
  { label: "Poste", icon: Type, depth: 1, visible: true },
  { label: "Accroche", icon: Type, depth: 1, visible: true },
  { label: "Sidebar", icon: Folder, depth: 0, expanded: true, visible: true },
  { label: "Photo Profil", icon: Image, depth: 1, visible: true },
  { label: "Contact", icon: Folder, depth: 1, collapsed: true, visible: true },
  { label: "Compétences", icon: Folder, depth: 1, collapsed: true, visible: true },
  { label: "Titre", icon: Type, depth: 2 },
  { label: "Barres", icon: SlidersHorizontal, depth: 2 },
  { label: "Langues", icon: Folder, depth: 1, collapsed: true, visible: true },
  { label: "Contenu", icon: Folder, depth: 0, expanded: true, visible: true },
  { label: "Expérience List", icon: Diamond, depth: 1, visible: true },
  { label: "Item", icon: Folder, depth: 1, visible: true },
  { label: "Période", icon: Type, depth: 2 },
  { label: "Poste", icon: Type, depth: 2 },
  { label: "Entreprise", icon: Type, depth: 2 },
  { label: "Description", icon: Type, depth: 2 },
  { label: "Formation", icon: Folder, depth: 0, visible: true },
  { label: "Footer", icon: Folder, depth: 0, expanded: true, visible: true },
  { label: "Ligne", icon: Minus, depth: 1 },
  { label: "Icônes réseaux", icon: Diamond, depth: 1 },
];

export function LayersPanel() {
  return (
    <aside className="ef-layers">
      <div className="ef-layers-head">
        <h2 className="ef-layers-title">Calques</h2>
        <ChevronDown size={12} aria-hidden="true" />
      </div>

      <label className="ef-layer-search">
        <Search size={13} aria-hidden="true" />
        Rechercher un calque...
      </label>

      <div className="ef-layer-list">
        {layerRows.map((row, index) => (
          <LayerItem key={`${row.label}-${index}`} row={row} />
        ))}
      </div>
    </aside>
  );
}

function LayerItem({ row }: { row: LayerRow }) {
  const Icon = row.icon;
  const Chevron = row.expanded ? ChevronDown : row.collapsed ? ChevronRight : null;

  return (
    <button
      className={[
        "ef-layer-row",
        `ef-layer-depth-${row.depth}`,
        row.selected ? "is-selected" : "",
      ].join(" ")}
      title={row.label}
    >
      <span className="ef-layer-visibility">{row.visible ? <Eye size={13} aria-hidden="true" /> : null}</span>
      <span className="ef-layer-icon">{Chevron ? <Chevron size={11} aria-hidden="true" /> : <Icon size={13} aria-hidden="true" />}</span>
      <span className="ef-layer-label">
        {Chevron ? <Icon size={13} aria-hidden="true" /> : null}
        <span className="ef-truncate">{row.label}</span>
      </span>
    </button>
  );
}
