"use client";

import { Panel, Separator, Group } from "react-resizable-panels";

import { CanvasViewport } from "@/features/editor/components/parts/canvas-viewport";
import { EditorDataPanel } from "@/features/editor/components/parts/editor-data-panel";
import { EditorSidebar } from "@/features/editor/components/parts/editor-sidebar";
import { EditorTopbar } from "@/features/editor/components/parts/editor-topbar";
import { InspectorPanel } from "@/features/editor/components/parts/inspector-panel";
import { LayersPanel } from "@/features/editor/components/parts/layers-panel";

export function EditorShell() {
  return (
    <section className="editor-fidelity ef-shell">
      <EditorTopbar />

      <div className="ef-main">
        <Group orientation="horizontal" className="h-full min-w-0">
          <Panel id="editor-left" defaultSize="415px" minSize="390px" maxSize="460px">
            <div className="ef-left-area">
              <EditorSidebar />
              <EditorDataPanel />
            </div>
          </Panel>

          <Separator className="ef-resize-separator" />

          <Panel id="editor-canvas" defaultSize="50%" minSize="720px">
            <CanvasViewport />
          </Panel>

          <Separator className="ef-resize-separator" />

          <Panel id="editor-right" defaultSize="470px" minSize="450px" maxSize="540px">
            <div className="ef-right-area">
              <InspectorPanel />
              <LayersPanel />
            </div>
          </Panel>
        </Group>
      </div>

    </section>
  );
}
