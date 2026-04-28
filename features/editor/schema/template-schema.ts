import type { Rect, TemplateElementId, TemplateId, TemplatePageId } from "@/features/editor/types";

export type TemplateSchema = {
  id: TemplateId;
  name: string;
  version: number;
  pages: TemplatePage[];
  elements: TemplateElement[];
};

export type TemplatePage = {
  id: TemplatePageId;
  name: string;
  width: number;
  height: number;
  margin: PageMargin;
};

export type PageMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TemplateElementType = "text" | "rich-text" | "image" | "shape" | "table" | "list";

export type TemplateElement = {
  id: TemplateElementId;
  pageId: TemplatePageId;
  type: TemplateElementType;
  frame: Rect;
  rotation?: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  bindingId?: string;
  style?: TemplateElementStyle;
  props?: TemplateElementProps;
};

export type TemplateElementStyle = {
  fill?: string;
  stroke?: string;
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number | string;
  fontStyle?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  strokeWidth?: number;
  cornerRadius?: number;
  dash?: number[];
};

export type TemplateElementProps = Record<string, string | number | boolean | null | number[]>;
