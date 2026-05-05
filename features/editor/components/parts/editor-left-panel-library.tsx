"use client";

import type { DragEvent } from "react";

import type { CanvasCreationEnvelope, CanvasDropEnvelope } from "@/features/editor/schema/canvas-insertion";
import type { EditorLeftSubTab } from "@/features/editor/stores/editor-store";
import { matchesFilter } from "@/features/editor/components/parts/editor-left-panel-utils";

export function EditorLeftLibraryPanel({
  subTab,
  filter,
  onDragContext,
  onDragEnd,
}: {
  subTab: EditorLeftSubTab;
  filter: string;
  onDragContext: (context: CanvasCreationEnvelope | null) => void;
  onDragEnd: () => void;
}) {
  const items = buildLibraryItems(subTab);
  const rows = items.filter((item) => matchesFilter(item, filter, [item.label, item.description, item.kind]));

  return (
    <div className="ef-library-grid">
      {rows.map((item) => (
        <DraggableLibraryItem key={item.id} item={item} onDragContext={onDragContext} onDragEnd={onDragEnd} />
      ))}
      {rows.length === 0 ? <div className="ef-no-result">Aucun résultat</div> : null}
    </div>
  );
}

type LibraryItem = {
  id: string;
  label: string;
  description: string;
  kind: "image" | "shape" | "icon" | "emoji" | "text" | "preset" | "chart";
  payload: Record<string, unknown>;
};

function DraggableLibraryItem({
  item,
  onDragContext,
  onDragEnd,
}: {
  item: LibraryItem;
  onDragContext: (context: CanvasCreationEnvelope | null) => void;
  onDragEnd: () => void;
}) {
  function handleDragStart(event: DragEvent<HTMLButtonElement>) {
    const context = createLibraryDragContext(item);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/json", JSON.stringify(context));
    event.dataTransfer.setData("application/x-resume-editor-create", JSON.stringify(context));
    onDragContext(context);
  }

  return (
    <button type="button" className={["ef-library-card", `is-${item.kind}`].join(" ")} draggable onDragStart={handleDragStart} onDragEnd={onDragEnd} title={item.description}>
      <span className="ef-library-preview ef-library-preview-fallback" aria-hidden="true">
        {item.label.slice(0, 2).toUpperCase()}
      </span>
      <span className="ef-library-card-meta">
        <strong>{item.label}</strong>
        <span>{item.description}</span>
      </span>
    </button>
  );
}

function createLibraryDragContext(item: LibraryItem): CanvasCreationEnvelope {
  return {
    type: item.kind,
    payload: {
      source: "left-panel-library",
      kind: item.kind,
      label: item.label,
      ...item.payload,
    },
  } satisfies CanvasDropEnvelope;
}

function buildLibraryItems(subTab: EditorLeftSubTab): LibraryItem[] {
  switch (subTab) {
    case "presets":
      return [
        libraryItem("preset-profile", "Profil", "Bloc profil candidat", "preset"),
        libraryItem("preset-experience", "Expériences", "Liste d'expériences", "preset"),
        libraryItem("preset-skills", "Compétences", "Liste de compétences", "preset"),
      ];
    case "charts-shapes":
      return [
        libraryItem("shape-rect", "Rectangle", "Forme rectangle", "shape"),
        libraryItem("shape-circle", "Cercle", "Forme cercle", "shape"),
        libraryItem("chart-bars", "Barres", "Graphique en barres", "chart"),
      ];
    case "icons":
      return [
        libraryItem("icon-mail", "Mail", "Icône mail", "icon"),
        libraryItem("icon-phone", "Téléphone", "Icône téléphone", "icon"),
        libraryItem("icon-location", "Adresse", "Icône localisation", "icon"),
      ];
    case "emoji":
      return [
        libraryItem("emoji-star", "Étoile", "Emoji étoile", "emoji", { emoji: "⭐" }),
        libraryItem("emoji-check", "Validation", "Emoji validation", "emoji", { emoji: "✅" }),
        libraryItem("emoji-fire", "Impact", "Emoji impact", "emoji", { emoji: "🔥" }),
      ];
    case "text-blocks":
      return [
        libraryItem("text-title", "Titre", "Bloc titre", "text"),
        libraryItem("text-paragraph", "Paragraphe", "Bloc paragraphe", "text"),
        libraryItem("text-token-name", "Nom", "Variable nom candidat", "text", { token: "{{candidate.name}}" }),
      ];
    case "images":
    default:
      return [
        libraryItem("image-placeholder", "Image", "Image libre", "image"),
        libraryItem("image-avatar", "Avatar", "Portrait candidat", "image"),
        libraryItem("image-logo", "Logo", "Logo entreprise", "image"),
      ];
  }
}

function libraryItem(id: string, label: string, description: string, kind: LibraryItem["kind"], payload: Record<string, unknown> = {}): LibraryItem {
  return {
    id,
    label,
    description,
    kind,
    payload: {
      label,
      name: label,
      ...payload,
    },
  };
}
