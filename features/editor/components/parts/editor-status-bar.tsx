"use client";

import { useEditorStore } from "@/features/editor/stores/editor-store";

export function EditorStatusBar() {
  const zoom = useEditorStore((state) => state.viewport.zoom);

  return (
    <footer className="ef-status-bar">
      <span>Document page 1 / 3</span>
      <span className="ef-text-center">Template Schema - Binding Engine - Layout Engine - Canonical Render Tree - Renderers</span>
      <span className="ef-text-right">Zoom {Math.round(zoom * 100)}% - Marges affichees - Magnetisme actif</span>
    </footer>
  );
}
