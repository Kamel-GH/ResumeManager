"use client";

import { useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { resolveBindings } from "@/features/editor/binding/binding-engine";
import { buildCanonicalRenderTree } from "@/features/editor/layout-engine/layout-engine";
import type { CanvasToolDraft } from "@/features/editor/schema/canvas-insertion";
import type { EditorWorkspaceSettings, WorkspaceLayout, WorkspaceViewport } from "@/features/editor/schema/workspace-layout";
import { SvgRenderer } from "@/features/editor/renderers/svg-renderer/svg-renderer";
import { KonvaCanvasRenderer } from "@/features/editor/renderers/konva-renderer";
import { projectKonvaSelection } from "@/features/editor/schema/selection-projection";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import type { BindingData } from "@/features/editor/schema/editor-model-types";

const EMPTY_PREVIEW_DATA: BindingData = {};
const PREVIEW_RENDERER_PARAM = "renderer";
const PREVIEW_RENDERER_SVG = "svg";

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
  const searchParams = useSearchParams();
  const previewData: BindingData = useVariablesStore((state) => state.source?.rows[0] ?? EMPTY_PREVIEW_DATA);
  const setSelectionProjection = useEditorStore((state) => state.setSelectionProjection);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const renderTree = useMemo(() => buildCanonicalRenderTree(resolveBindings({ template: workingTemplate, data: previewData })), [previewData, workingTemplate]);
  const previewRenderer = searchParams.get(PREVIEW_RENDERER_PARAM);
  const useKonvaWorkspace = previewRenderer ? previewRenderer !== PREVIEW_RENDERER_SVG : process.env.NEXT_PUBLIC_EDITOR_RENDERER !== "svg";
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
