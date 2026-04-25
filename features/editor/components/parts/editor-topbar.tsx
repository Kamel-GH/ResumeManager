"use client";

import {
  Bell,
  ChevronDown,
  CircleHelp,
  Columns3,
  Grid2X2,
  Minus,
  Monitor,
  PanelTop,
  Plus,
  Redo2,
  Search,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { documentActions } from "@/features/editor/components/editor-mock-data";
import { useEditorStore } from "@/features/editor/stores/editor-store";

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;

export function EditorTopbar() {
  const zoom = useEditorStore((state) => state.viewport.zoom);

  return (
    <header className="ef-topbar">
      <div className="ef-brand">
        <span className="ef-brand-logo" />
        <p className="ef-brand-title">Studio Templates</p>
      </div>

      <div className="ef-topbar-main">
        {documentActions.map((action) => (
          <ActionButton key={action.label} label={action.label} icon={action.icon} />
        ))}

        <div className="ef-topbar-tools">
          <IconButton label="Annuler" icon={Undo2} />
          <IconButton label="Rétablir" icon={Redo2} muted />
        </div>

        <ZoomControl value={`${Math.round(zoom * 100)}%`} />

        <div className="ef-topbar-tools">
          <IconButton label="Grille" icon={Grid2X2} />
          <IconButton label="Guides" icon={PanelTop} />
          <IconButton label="Colonnes" icon={Columns3} />
          <button className="ef-topbar-dropdown" title="Options affichage">
            <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
          <IconButton label="Desktop" icon={Monitor} active />
          <IconButton label="Tablet" icon={Tablet} />
          <IconButton label="Mobile" icon={Smartphone} />
        </div>
      </div>

      <div className="ef-topbar-actions">
        <label className="ef-topbar-search">
          <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span className="ef-truncate">Rechercher (⌘K)</span>
          <ChevronDown className="ml-auto" size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </label>

        <button className="ef-share-button">
          <span>Partager / Publier</span>
          <span className="h-5 w-px bg-white/20" />
          <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>

        <IconButton label="Aide" icon={CircleHelp} />
        <IconButton label="Notifications" icon={Bell} />
      </div>
    </header>
  );
}

type ButtonProps = {
  label: string;
  icon: LucideIcon;
};

function ActionButton({ label, icon: Icon }: ButtonProps) {
  return (
    <button className="ef-topbar-button" title={label}>
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span className="ef-truncate">{label}</span>
    </button>
  );
}

function IconButton({ label, icon: Icon, active, muted }: ButtonProps & { active?: boolean; muted?: boolean }) {
  return (
    <button className={["ef-topbar-icon-button", active ? "is-active" : "", muted ? "is-muted" : ""].join(" ")} title={label}>
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
    </button>
  );
}

function ZoomControl({ value }: { value: string }) {
  return (
    <div className="ef-zoom-control">
      <button className="flex items-center justify-center" title="Zoom moins">
        <Minus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      <span className="ef-zoom-value">{value}</span>
      <button className="flex items-center justify-center" title="Zoom plus">
        <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
    </div>
  );
}
