"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { CanvasViewport } from "@/features/editor/components/parts/canvas-viewport";
import { EditorLeftPanel } from "@/features/editor/components/parts/editor-left-panel";
import { EditorSidebar } from "@/features/editor/components/parts/editor-sidebar";
import { EditorTopbar } from "@/features/editor/components/parts/editor-topbar";
import { InspectorPanel } from "@/features/editor/components/parts/inspector-panel";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function EditorShell() {
  const leftCollapsed = useEditorStore((state) => state.panelPreferences.leftCollapsed);
  const rightCollapsed = useEditorStore((state) => state.panelPreferences.rightCollapsed);
  const setLeftCollapsed = useEditorStore((state) => state.setLeftCollapsed);
  const setRightCollapsed = useEditorStore((state) => state.setRightCollapsed);

  return (
    <section className="editor-fidelity ef-shell">
      <EditorTopbar />

      <div
        className={[
          "ef-main",
          "ef-main-v2",
          leftCollapsed ? "is-left-collapsed" : "",
          rightCollapsed ? "is-right-collapsed" : "",
        ].join(" ")}
      >
        <EditorSidebar />

        {leftCollapsed ? (
          <button className="ef-panel-affordance ef-panel-affordance-left" type="button" onClick={() => setLeftCollapsed(false)} aria-label="Rouvrir le volet gauche">
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ) : (
          <div className="ef-left-area">
            <button className="ef-panel-collapse-button is-left" type="button" onClick={() => setLeftCollapsed(true)} aria-label="Replier le volet gauche">
              <ChevronLeft size={13} aria-hidden="true" />
            </button>
            <EditorLeftPanel />
          </div>
        )}

        <CanvasViewport />

        {rightCollapsed ? (
          <button className="ef-panel-affordance ef-panel-affordance-right" type="button" onClick={() => setRightCollapsed(false)} aria-label="Rouvrir le volet droit">
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
        ) : (
          <div className="ef-right-area">
            <button className="ef-panel-collapse-button is-right" type="button" onClick={() => setRightCollapsed(true)} aria-label="Replier le volet droit">
              <ChevronRight size={13} aria-hidden="true" />
            </button>
            <InspectorPanel />
          </div>
        )}
      </div>
    </section>
  );
}
