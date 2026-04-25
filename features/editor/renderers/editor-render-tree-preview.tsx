"use client";

import { useMemo } from "react";

import { resolveBindings } from "@/features/editor/binding/binding-engine";
import { buildCanonicalRenderTree } from "@/features/editor/layout-engine/layout-engine";
import { SvgRenderer } from "@/features/editor/renderers/svg-renderer";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { modernResumeTemplate } from "@/features/editor/templates/modern-resume-template";

export function EditorRenderTreePreview() {
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const renderTree = useMemo(() => buildCanonicalRenderTree(resolveBindings({ template: modernResumeTemplate, data: {} })), []);

  return <SvgRenderer renderTree={renderTree} selectedElementIds={selectedElementIds} onSelectElement={setSelectedElementIds} />;
}
