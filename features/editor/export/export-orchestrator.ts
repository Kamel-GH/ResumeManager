import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";
import type { RendererTarget } from "@/features/editor/schema/template-render-types";

export type ExportFormat = Extract<RendererTarget, "html" | "pdf" | "image" | "pptx">;

export type ExportRequest = {
  renderTree: CanonicalRenderTree;
  format: ExportFormat;
};

export type ExportResult = {
  format: ExportFormat;
  status: "queued";
  renderTreeId: string;
};

export function queueExport(request: ExportRequest): ExportResult {
  return {
    format: request.format,
    status: "queued",
    renderTreeId: request.renderTree.id,
  };
}
