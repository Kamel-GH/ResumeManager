"use client";

import { useLayoutEffect, useMemo } from "react";

import { resolveBindings } from "@/features/editor/binding/binding-engine";
import { buildCanonicalRenderTree } from "@/features/editor/layout-engine/layout-engine";
import type { CanvasToolDraft } from "@/features/editor/schema/canvas-insertion";
import type { EditorWorkspaceSettings, WorkspaceLayout, WorkspaceViewport } from "@/features/editor/schema/workspace-layout";
import { SvgRenderer } from "@/features/editor/renderers/svg-renderer/svg-renderer";
import { KonvaCanvasRenderer } from "@/features/editor/renderers/konva-renderer";
import { projectKonvaSelection } from "@/features/editor/schema/selection-projection";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function EditorRenderTreePreview({
  draftCanvasCreation,
  workspaceLayout,
  viewport,
  workspaceSettings,
}: {
  draftCanvasCreation?: CanvasToolDraft | null;
  workspaceLayout: WorkspaceLayout;
  viewport: WorkspaceViewport;
  workspaceSettings: EditorWorkspaceSettings;
}) {
  const activePageId = useEditorStore((state) => state.activePageId);
  const activeCanvasTool = useEditorStore((state) => state.activeCanvasTool);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const setSelectionProjection = useEditorStore((state) => state.setSelectionProjection);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const renderTree = useMemo(() => buildCanonicalRenderTree(resolveBindings({ template: workingTemplate, data: {} })), [workingTemplate]);
  const useKonvaWorkspace = true;
  const selectionProjection = useMemo(() => projectKonvaSelection(renderTree, activePageId, selectedElementIds), [activePageId, renderTree, selectedElementIds]);
  const handleSelectElement = useMemo(
    () => (elementIds: string[], options?: { additive?: boolean }) => {
      if (options?.additive) {
        const nextSelection = new Set(selectedElementIds);
        elementIds.forEach((elementId) => {
          if (nextSelection.has(elementId)) {
            nextSelection.delete(elementId);
            return;
          }

          nextSelection.add(elementId);
        });

        setSelectedElementIds([...nextSelection]);
        return;
      }

      setSelectedElementIds(elementIds);
    },
    [selectedElementIds, setSelectedElementIds],
  );

  useLayoutEffect(() => {
    setSelectionProjection(selectionProjection);
  }, [selectionProjection, setSelectionProjection]);

  if (!useKonvaWorkspace) {
    return <SvgRenderer renderTree={renderTree} selectedElementIds={selectedElementIds} onSelectElement={handleSelectElement} />;
  }

  return (
    <KonvaCanvasRenderer
      renderTree={renderTree}
      workspaceLayout={workspaceLayout}
      viewport={viewport}
      workspaceSettings={workspaceSettings}
      activePageId={activePageId}
      selectedElementIds={selectedElementIds}
      activeCanvasTool={activeCanvasTool}
      draftCanvasCreation={draftCanvasCreation ?? null}
      onSelectElement={handleSelectElement}
    />
  );
}
