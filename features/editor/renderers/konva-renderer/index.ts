import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";

export { KonvaCanvasRenderer } from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer";
export {
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
} from "@/features/editor/renderers/konva-renderer/konva-renderer-model";

export type KonvaRendererInput = {
  renderTree: CanonicalRenderTree;
};

export function prepareKonvaRenderModel(input: KonvaRendererInput): CanonicalRenderTree {
  return input.renderTree;
}

export function assertKonvaRendererReady(): true {
  return true;
}
