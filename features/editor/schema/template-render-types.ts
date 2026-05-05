import type { BoundDocument } from "@/features/editor/schema/document-types";
import type { CanonicalRenderTree } from "@/features/editor/schema/render-tree";
import type { BindingData } from "@/features/editor/schema/editor-model-types";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

export type RenderPipelineInput = {
  template: TemplateSchema;
  data: BindingData | Record<string, unknown>;
};

export type RenderPipelineResult = {
  boundDocument: BoundDocument;
  renderTree: CanonicalRenderTree;
};

export type RendererTarget = "konva" | "html" | "pdf" | "image" | "pptx";
