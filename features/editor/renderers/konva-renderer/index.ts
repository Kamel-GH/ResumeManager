import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";

export { KonvaCanvasRenderer } from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer";
export {
  getKonvaImageProps,
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
  isSelectionBoxTool,
  isTransformableNode,
  resolveCanonicalFrameFromProjectedGeometry,
  resolveDragSelectionIds,
  resolveSelectionActionBarPlacement,
  resolveSelectionOrderCapabilities,
  shouldShowFrameOutline,
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
