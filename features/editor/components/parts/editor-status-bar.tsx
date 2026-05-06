"use client";

import { useEditorStore } from "@/features/editor/stores/editor-store";

export function EditorStatusBar() {
  const zoom = useEditorStore((state) => state.viewport.zoom);
  const activePageId = useEditorStore((state) => state.activePageId);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const workspaceSettings = useEditorStore((state) => state.workspaceSettings);
  const activePageIndex = workingTemplate.pages.findIndex((page) => page.id === activePageId);

  return (
    <footer className="ef-status-bar">
      <span>Page {activePageIndex >= 0 ? activePageIndex + 1 : 1} / {workingTemplate.pages.length}</span>
      <span className="ef-text-center">Template Schema - Binding Engine - Layout Engine - Canonical Render Tree - Renderers</span>
      <span className="ef-text-right">
        Zoom {Math.round(zoom * 100)}% - Unité {workspaceSettings.measurementUnit} - {workspaceSettings.marginsVisible ? "Marges affichées" : "Marges masquées"} - {workspaceSettings.snapEnabled ? "Magnétisme actif" : "Magnétisme inactif"}
      </span>
    </footer>
  );
}
