import type { RenderNode, RenderNodeProps } from "@/features/editor/schema/render-tree";

export type KonvaShapeRenderProps =
  | {
      shape: "circle";
      circle: {
        x: number;
        y: number;
        radius: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
      };
    }
  | {
      shape: "rect";
      rect: {
        x: number;
        y: number;
        width: number;
        height: number;
        cornerRadius: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        dash?: number[];
        opacity: number;
      };
    };

export function getKonvaShapeProps(node: RenderNode): KonvaShapeRenderProps {
  const { frame, props } = node;
  const fill = propString(props, "fill") ?? "#ffffff";
  const stroke = propString(props, "stroke") ?? "transparent";
  const strokeWidth = propNumber(props, "strokeWidth") ?? 1;
  const opacity = propNumber(props, "opacity") ?? 1;
  const shape = propString(props, "shape");

  if (shape === "circle") {
    return {
      shape: "circle",
      circle: {
        x: frame.x + frame.width / 2,
        y: frame.y + frame.height / 2,
        radius: Math.min(frame.width, frame.height) / 2,
        fill,
        stroke,
        strokeWidth,
        opacity,
      },
    };
  }

  return {
    shape: "rect",
    rect: {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      cornerRadius: propNumber(props, "cornerRadius") ?? 0,
      fill,
      stroke,
      strokeWidth,
      dash: propNumberArray(props, "dash"),
      opacity,
    },
  };
}

export function getKonvaTextProps(node: RenderNode) {
  const { frame, props } = node;

  return {
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    text: propString(props, "text") ?? "",
    fill: propString(props, "color") ?? "#111827",
    fontFamily: propString(props, "fontFamily") ?? "Inter",
    fontSize: propNumber(props, "fontSize") ?? 12,
    fontStyle: propString(props, "fontStyle") ?? "normal",
    fontVariant: "normal",
    fontWeight: propFontWeight(props),
    letterSpacing: propNumber(props, "letterSpacing") ?? 0,
    lineHeight: propNumber(props, "lineHeight") ?? 1.2,
    align: propTextAlign(props),
    verticalAlign: "top",
  };
}

export function isSelectableNode(node: RenderNode): boolean {
  return node.props.selectable === true;
}

function propString(props: RenderNodeProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

function propNumber(props: RenderNodeProps, key: string): number | undefined {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
}

function propNumberArray(props: RenderNodeProps, key: string): number[] | undefined {
  const value = props[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined;
}

function propTextAlign(props: RenderNodeProps): "left" | "center" | "right" {
  const value = propString(props, "textAlign");
  return value === "center" || value === "right" ? value : "left";
}

function propFontWeight(props: RenderNodeProps): string {
  const value = props.fontWeight;
  return typeof value === "number" || typeof value === "string" ? String(value) : "normal";
}
