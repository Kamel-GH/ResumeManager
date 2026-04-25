import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";

export { KonvaCanvasRenderer } from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer";

export type KonvaRendererInput = {
  renderTree: CanonicalRenderTree;
};

export function prepareKonvaRenderModel(input: KonvaRendererInput): CanonicalRenderTree {
  return input.renderTree;
}

export function assertKonvaRendererReady(): never {
  throw new Error("Konva renderer is reserved for the interactive editor integration. Use svg-renderer for the current render-tree projection.");
}
