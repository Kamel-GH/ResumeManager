import type { BoundDocument } from "@/features/editor/schema/document-types";
import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";
import { derivePageOrientation } from "@/features/editor/schema/workspace-layout";

export function buildCanonicalRenderTree(boundDocument: BoundDocument): CanonicalRenderTree {
  return {
    id: `${boundDocument.template.id}:render-tree`,
    templateId: boundDocument.template.id,
    pages: boundDocument.template.pages.map((page) => ({
      id: page.id,
      name: page.name,
      width: page.width,
      height: page.height,
      margin: page.margin,
      orientation: derivePageOrientation(page.width, page.height),
      children: boundDocument.template.elements
        .filter((element) => element.pageId === page.id && element.visible)
        .sort((a, b) => {
          const layerOrderA = typeof a.props?.layerOrder === "number" ? a.props.layerOrder : 0;
          const layerOrderB = typeof b.props?.layerOrder === "number" ? b.props.layerOrder : 0;
          if (layerOrderA !== layerOrderB) {
            return layerOrderA - layerOrderB;
          }

          return a.zIndex - b.zIndex;
        })
        .map((element) => ({
          id: element.id,
          type: element.type,
          pageId: page.id,
          frame: element.frame,
          rotation: element.rotation ?? 0,
          zIndex: element.zIndex,
          visible: element.visible,
          locked: element.locked,
          props: {
            ...(element.props ?? {}),
            ...(element.style ?? {}),
            bindingId: element.bindingId ?? null,
          },
        })),
    })),
  };
}
