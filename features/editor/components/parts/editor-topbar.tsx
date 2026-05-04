"use client";

import {
  Bell,
  ChevronDown,
  CircleHelp,
  Columns3,
  Grid2X2,
  FilePlus2,
  FolderOpen,
  Save,
  Upload,
  Eye,
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

import { useEditorStore } from "@/features/editor/stores/editor-store";

const DOCUMENT_ACTIONS = [
  { label: "Nouveau", icon: FilePlus2 },
  { label: "Ouvrir", icon: FolderOpen },
  { label: "Enregistrer", icon: Save },
  { label: "Exporter", icon: Upload, primary: true },
  { label: "Aperçu", icon: Eye },
] as const;

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;

export function EditorTopbar() {
  const zoom = useEditorStore((state) => state.viewport.zoom);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.undoStack.length > 0);
  const canRedo = useEditorStore((state) => state.redoStack.length > 0);

  return (
    <header className="ef-topbar">
      <div className="ef-brand">
        <span className="ef-brand-logo" />
        <p className="ef-brand-title">Studio Templates</p>
      </div>

      <div className="ef-topbar-module">
        <div className="ef-topbar-main">
          {DOCUMENT_ACTIONS.map((action) => (
            <ActionButton key={action.label} label={action.label} icon={action.icon} />
          ))}

          <div className="ef-topbar-tools">
            <IconButton label="Annuler (⌘Z)" icon={Undo2} onClick={undo} disabled={!canUndo} />
            <IconButton label="Rétablir (⌘⇧Z)" icon={Redo2} onClick={redo} disabled={!canRedo} muted={!canRedo} />
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

function IconButton({ label, icon: Icon, active, muted, disabled, onClick }: ButtonProps & { active?: boolean; muted?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      className={["ef-topbar-icon-button", active ? "is-active" : "", muted ? "is-muted" : "", disabled ? "is-disabled" : ""].join(" ")}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
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
