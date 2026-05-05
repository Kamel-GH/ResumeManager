"use client";

import { useMemo } from "react";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useEditorStore } from "@/features/editor/stores/editor-store";

const ICON_SIZE = 20;
const ICON_STROKE = 1.8;
const PREVIEW_RENDERER_PARAM = "renderer";
const PREVIEW_RENDERER_SVG = "svg";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function EditorTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const zoom = useEditorStore((state) => state.viewport.zoom);
  const workspaceSettings = useEditorStore((state) => state.workspaceSettings);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const resetWorkingTemplate = useEditorStore((state) => state.resetWorkingTemplate);
  const setWorkspaceSettings = useEditorStore((state) => state.setWorkspaceSettings);
  const setZoom = useEditorStore((state) => state.setZoom);
  const canUndo = useEditorStore((state) => state.undoStack.length > 0);
  const canRedo = useEditorStore((state) => state.redoStack.length > 0);
  const previewRenderer = searchParams.get(PREVIEW_RENDERER_PARAM);
  const isSvgPreview = previewRenderer === PREVIEW_RENDERER_SVG;
  const deviceMode = useMemo(() => resolveDeviceMode(zoom), [zoom]);

  const updatePreviewRenderer = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (isSvgPreview) {
      nextParams.delete(PREVIEW_RENDERER_PARAM);
    } else {
      nextParams.set(PREVIEW_RENDERER_PARAM, PREVIEW_RENDERER_SVG);
    }

    const queryString = nextParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <header className="ef-topbar">
      <div className="ef-brand">
        <span className="ef-brand-logo" />
        <p className="ef-brand-title">Studio Templates</p>
      </div>

      <div className="ef-topbar-module">
        <div className="ef-topbar-main">
          <ActionButton label="Nouveau" icon={FilePlus2} onClick={resetWorkingTemplate} />
          <ActionButton label="Ouvrir" icon={FolderOpen} disabled title="Ouverture de document non branchée" />
          <ActionButton label="Enregistrer" icon={Save} disabled title="Sauvegarde automatique active" />
          <ActionButton label="Exporter" icon={Upload} disabled title="Orchestrateur d’export à brancher" primary />
          <ActionButton label="Aperçu" icon={Eye} onClick={updatePreviewRenderer} active={isSvgPreview} title={isSvgPreview ? "Revenir au rendu Konva" : "Basculer en aperçu SVG"} />

          <div className="ef-topbar-tools">
            <IconButton label="Annuler (⌘Z)" icon={Undo2} onClick={undo} disabled={!canUndo} />
            <IconButton label="Rétablir (⌘⇧Z)" icon={Redo2} onClick={redo} disabled={!canRedo} muted={!canRedo} />
          </div>

          <ZoomControl
            value={`${Math.round(zoom * 100)}%`}
            onZoomOut={() => setZoom(zoom - 0.1)}
            onZoomIn={() => setZoom(zoom + 0.1)}
          />

          <div className="ef-topbar-tools">
            <IconButton label="Grille" icon={Grid2X2} onClick={() => setWorkspaceSettings({ gridEnabled: !workspaceSettings.gridEnabled })} active={workspaceSettings.gridEnabled} />
            <IconButton label="Guides" icon={PanelTop} onClick={() => setWorkspaceSettings({ guidesVisible: !workspaceSettings.guidesVisible })} active={workspaceSettings.guidesVisible} />
            <IconButton label="Colonnes" icon={Columns3} onClick={() => setWorkspaceSettings({ marginsVisible: !workspaceSettings.marginsVisible })} active={workspaceSettings.marginsVisible} />
            <button className="ef-topbar-dropdown" type="button" title="Options d’affichage non branchées" aria-label="Options d’affichage non branchées" disabled>
              <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
            <IconButton label="Desktop" icon={Monitor} onClick={() => setZoom(1)} active={deviceMode === "desktop"} />
            <IconButton label="Tablet" icon={Tablet} onClick={() => setZoom(0.82)} active={deviceMode === "tablet"} />
            <IconButton label="Mobile" icon={Smartphone} onClick={() => setZoom(0.58)} active={deviceMode === "mobile"} />
          </div>
        </div>

        <div className="ef-topbar-actions">
          <button className="ef-topbar-search" type="button" disabled title="Recherche globale non branchée" aria-label="Recherche globale non branchée">
            <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
            <span className="ef-truncate">Rechercher (⌘K)</span>
            <ChevronDown className="ml-auto" size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>

          <button className="ef-share-button" type="button" disabled title="Partage / publication non branché" aria-label="Partage / publication non branché">
            <span>Partager / Publier</span>
            <span className="h-5 w-px bg-white/20" />
            <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>

          <IconButton label="Aide" icon={CircleHelp} disabled title="Aide non branchée" />
          <IconButton label="Notifications" icon={Bell} disabled title="Notifications non branchées" />
        </div>
      </div>
    </header>
  );
}

type ButtonProps = {
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
};

function ActionButton({ label, icon: Icon, primary, active, disabled, title, onClick }: ButtonProps) {
  return (
    <button
      className={cn("ef-topbar-button", primary ? "is-primary" : "", active ? "is-active" : "")}
      title={title ?? label}
      type="button"
      aria-label={title ?? label}
      aria-pressed={typeof active === "boolean" ? active : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <span className="ef-truncate">{label}</span>
    </button>
  );
}

function IconButton({ label, icon: Icon, active, muted, disabled, onClick, title }: ButtonProps & { active?: boolean; muted?: boolean }) {
  return (
    <button
      className={cn("ef-topbar-icon-button", active ? "is-active" : "", muted ? "is-muted" : "", disabled ? "is-disabled" : "")}
      title={title ?? label}
      type="button"
      aria-label={title ?? label}
      aria-pressed={typeof active === "boolean" ? active : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
    </button>
  );
}

function ZoomControl({ value, onZoomOut, onZoomIn }: { value: string; onZoomOut: () => void; onZoomIn: () => void }) {
  return (
    <div className="ef-zoom-control">
      <button className="flex items-center justify-center" type="button" title="Zoom moins" aria-label="Zoom moins" onClick={onZoomOut}>
        <Minus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      <span className="ef-zoom-value">{value}</span>
      <button className="flex items-center justify-center" type="button" title="Zoom plus" aria-label="Zoom plus" onClick={onZoomIn}>
        <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
    </div>
  );
}

function resolveDeviceMode(zoom: number) {
  if (Math.abs(zoom - 1) <= 0.03) {
    return "desktop";
  }

  if (Math.abs(zoom - 0.82) <= 0.03) {
    return "tablet";
  }

  return "mobile";
}
