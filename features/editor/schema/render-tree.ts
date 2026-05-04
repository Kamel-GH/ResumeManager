import type { Rect, RenderTreeId, TemplateElementId, TemplatePageId } from "@/features/editor/types";
import type { PageMargin } from "@/features/editor/schema/template-schema";

export type CanonicalRenderTree = {
  id: RenderTreeId;
  templateId: string;
  pages: RenderPageNode[];
};

export type RenderPageNode = {
  id: TemplatePageId;
  name: string;
  width: number;
  height: number;
  margin: PageMargin;
  orientation: "portrait" | "landscape" | "square";
  children: RenderNode[];
};

export type RenderNodeType = "text" | "rich-text" | "image" | "shape" | "table" | "list" | "group";

export type RenderNode = {
  id: TemplateElementId;
  type: RenderNodeType;
  pageId: TemplatePageId;
  frame: Rect;
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  props: RenderNodeProps;
};

export type RenderNodeProps = Record<string, unknown>;
