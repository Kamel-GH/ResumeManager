"use client";

import { useLayoutEffect, useMemo } from "react";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import { resolveBindings } from "@/features/editor/binding/binding-engine";
import { buildCanonicalRenderTree } from "@/features/editor/layout-engine/layout-engine";
import { KonvaCanvasRenderer } from "@/features/editor/renderers/konva-renderer";
import { SvgRenderer } from "@/features/editor/renderers/svg-renderer/svg-renderer";
import type { CanvasToolDraft } from "@/features/editor/schema/canvas-insertion";
import type { BindingData } from "@/features/editor/schema/editor-model-types";
import { projectKonvaSelection } from "@/features/editor/schema/selection-projection";
import type {
  EditorWorkspaceSettings,
  WorkspaceLayout,
  WorkspaceViewport,
} from "@/features/editor/schema/workspace-layout";
import { useEditorStore } from "@/features/editor/stores/editor-store";

const EMPTY_PREVIEW_DATA: BindingData = {};

export function EditorRenderTreePreview({
  draftCanvasCreation,
  canvasSize,
  isSpacePanActive = false,
  workspaceLayout,
  viewport,
  workspaceSettings,
}: {
  draftCanvasCreation?: CanvasToolDraft | null;
  canvasSize?: { width: number; height: number };
  isSpacePanActive?: boolean;
  workspaceLayout: WorkspaceLayout;
  viewport: WorkspaceViewport;
  workspaceSettings: EditorWorkspaceSettings;
}) {
  const activePageId = useEditorStore((state) => state.activePageId);
  const activeCanvasTool = useEditorStore((state) => state.activeCanvasTool);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const previewData: BindingData = useVariablesStore(
    (state) => state.source?.rows[0] ?? EMPTY_PREVIEW_DATA,
  );
  const setSelectionProjection = useEditorStore((state) => state.setSelectionProjection);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const renderTree = useMemo(
    () =>
      buildCanonicalRenderTree(resolveBindings({ template: workingTemplate, data: previewData })),
    [previewData, workingTemplate],
  );
  const useKonvaWorkspace = process.env.NEXT_PUBLIC_EDITOR_RENDERER !== "svg";
  const selectionProjection = useMemo(
    () => projectKonvaSelection(renderTree, activePageId, selectedElementIds),
    [activePageId, renderTree, selectedElementIds],
  );
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
    return (
      <SvgRenderer
        renderTree={renderTree}
        selectedElementIds={selectedElementIds}
        onSelectElement={handleSelectElement}
      />
    );
  }

  return (
    <KonvaCanvasRenderer
      renderTree={renderTree}
      canvasSize={canvasSize}
      workspaceLayout={workspaceLayout}
      viewport={viewport}
      workspaceSettings={workspaceSettings}
      activePageId={activePageId}
      selectedElementIds={selectedElementIds}
      activeCanvasTool={activeCanvasTool}
      isSpacePanActive={isSpacePanActive}
      draftCanvasCreation={draftCanvasCreation ?? null}
      onSelectElement={handleSelectElement}
    />
  );
}
