import type { BoundDocument } from "@/features/editor/schema/document-types";
import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";

export function buildCanonicalRenderTree(boundDocument: BoundDocument): CanonicalRenderTree {
  return {
    id: `${boundDocument.template.id}:render-tree`,
    templateId: boundDocument.template.id,
    pages: boundDocument.template.pages.map((page) => ({
      id: page.id,
      width: page.width,
      height: page.height,
      children: boundDocument.template.elements
        .filter((element) => element.pageId === page.id && element.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => ({
          id: element.id,
          type: element.type,
          frame: element.frame,
          zIndex: element.zIndex,
          visible: element.visible,
          props: {
            ...(element.props ?? {}),
            ...(element.style ?? {}),
            bindingId: element.bindingId ?? null,
          },
        })),
    })),
  };
}
