import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";

export type CanvasObjectGeometryPatch = {
  id: string;
  frame: Rect;
  rotation: number;
  points?: number[];
};

export function applyCanvasObjectGeometry(template: TemplateSchema, patches: CanvasObjectGeometryPatch[]) {
  if (patches.length === 0) {
    return template;
  }

  const patchById = new Map(patches.map((patch) => [patch.id, patch] as const));

  return {
    ...template,
    elements: template.elements.map((element) => {
      const patch = patchById.get(element.id);
      if (!patch || element.locked) {
        return element;
      }

      return {
        ...element,
        frame: {
          x: patch.frame.x,
          y: patch.frame.y,
          width: patch.frame.width,
          height: patch.frame.height,
        },
        rotation: patch.rotation,
        props:
          patch.points && element.props
            ? {
                ...element.props,
                points: patch.points,
              }
            : element.props,
      };
    }),
  };
}
