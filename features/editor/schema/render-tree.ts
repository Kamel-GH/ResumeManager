import type { Rect, RenderTreeId, TemplateElementId, TemplatePageId } from "@/features/editor/types";

export type CanonicalRenderTree = {
  id: RenderTreeId;
  templateId: string;
  pages: RenderPageNode[];
};

export type RenderPageNode = {
  id: TemplatePageId;
  width: number;
  height: number;
  children: RenderNode[];
};

export type RenderNodeType = "text" | "rich-text" | "image" | "shape" | "table" | "list" | "group";

export type RenderNode = {
  id: TemplateElementId;
  type: RenderNodeType;
  frame: Rect;
  zIndex: number;
  visible: boolean;
  props: RenderNodeProps;
};

export type RenderNodeProps = Record<string, string | number | boolean | null | number[] | RenderNodeProps[]>;
