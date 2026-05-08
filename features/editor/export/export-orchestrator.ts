import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";
import type { RendererTarget } from "@/features/editor/schema/template-render-types";

export type ExportFormat = Extract<RendererTarget, "html" | "pdf" | "image" | "pptx">;

export type ExportRequest = {
  renderTree: CanonicalRenderTree;
  format: ExportFormat;
};

export type ExportResult = {
  format: ExportFormat;
  queueId: string;
  status: "queued";
  renderTreeId: string;
  queuedAt: string;
};

export function queueExport(request: ExportRequest): ExportResult {
  const queuedAt = new Date().toISOString();

  return {
    format: request.format,
    queueId: `${request.renderTree.id}:${request.format}`,
    status: "queued",
    renderTreeId: request.renderTree.id,
    queuedAt,
  };
}
