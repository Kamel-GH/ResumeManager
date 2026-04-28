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
        rotation: number;
      };
    }
  | {
      shape: "ellipse";
      ellipse: {
        x: number;
        y: number;
        radiusX: number;
        radiusY: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
      };
    }
  | {
      shape: "line";
      line: {
        x: number;
        y: number;
        points: number[];
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        tension?: number;
        dash?: number[];
        pointerAtBeginning?: boolean;
        pointerAtEnding?: boolean;
        pointerLength?: number;
        pointerWidth?: number;
        fill?: string;
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
        rotation: number;
      };
    }
  | {
      shape: "polygon";
      polygon: {
        x: number;
        y: number;
        points: number[];
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        closed: true;
      };
    }
  | {
      shape: "polyline";
      polyline: {
        x: number;
        y: number;
        points: number[];
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
      };
    }
  | {
      shape: "curve";
      curve: {
        x: number;
        y: number;
        points: number[];
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        tension: number;
      };
    }
  | {
      shape: "arc";
      arc: {
        x: number;
        y: number;
        radiusX: number;
        radiusY: number;
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        arcType: "open" | "pie";
        arcSweep: 1 | -1;
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
      };
    };

export type KonvaImageRenderProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  opacity: number;
  rotation: number;
};

export function getKonvaShapeProps(node: RenderNode): KonvaShapeRenderProps {
  const { frame, props } = node;
  const fill = propString(props, "fill") ?? "#ffffff";
  const stroke = propString(props, "stroke") ?? "transparent";
  const strokeWidth = propNumber(props, "strokeWidth") ?? 1;
  const opacity = propNumber(props, "opacity") ?? 1;
  const shape = propString(props, "shape");
  const rotation = node.rotation ?? 0;

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
        rotation,
      },
    };
  }

  if (shape === "ellipse") {
    return {
      shape: "ellipse",
      ellipse: {
        x: frame.x + frame.width / 2,
        y: frame.y + frame.height / 2,
        radiusX: Math.max(frame.width / 2, 1),
        radiusY: Math.max(frame.height / 2, 1),
        fill,
        stroke,
        strokeWidth,
        opacity,
        rotation,
      },
    };
  }

  if (shape === "line") {
    const points = propNumberArray(props, "points") ?? [0, 0, Math.max(frame.width, 1), Math.max(frame.height, 1)];
    return {
      shape: "line",
      line: {
        x: frame.x,
        y: frame.y,
        points,
        stroke,
        strokeWidth,
        opacity,
        rotation,
        dash: propNumberArray(props, "dash"),
        pointerAtBeginning: propBoolean(props, "pointerAtBeginning"),
        pointerAtEnding: propBoolean(props, "pointerAtEnding") || propBoolean(props, "arrow"),
        pointerLength: propNumber(props, "pointerLength") ?? 8,
        pointerWidth: propNumber(props, "pointerWidth") ?? 8,
        fill,
      },
    };
  }

  if (shape === "polygon" || shape === "polyline" || shape === "curve") {
    const points = propNumberArray(props, "points") ?? [0, 0, Math.max(frame.width, 1), Math.max(frame.height, 1)];
    return shape === "polygon"
      ? {
          shape: "polygon",
          polygon: {
            x: frame.x,
            y: frame.y,
            points,
            fill,
            stroke,
            strokeWidth,
            opacity,
            rotation,
            closed: true,
          },
        }
      : shape === "curve"
        ? {
            shape: "curve",
            curve: {
              x: frame.x,
              y: frame.y,
              points,
              fill: "transparent",
              stroke,
              strokeWidth,
              opacity,
              rotation,
              tension: propNumber(props, "tension") ?? 0.5,
            },
          }
        : {
            shape: "polyline",
            polyline: {
              x: frame.x,
              y: frame.y,
              points,
              fill: "transparent",
              stroke,
              strokeWidth,
              opacity,
              rotation,
            },
          };
  }

  if (shape === "arc") {
    return {
      shape: "arc",
      arc: {
        x: frame.x + frame.width / 2,
        y: frame.y + frame.height / 2,
        radiusX: Math.max(frame.width / 2, 1),
        radiusY: Math.max(frame.height / 2, 1),
        innerRadius: propNumber(props, "innerRadius") ?? 0,
        outerRadius: propNumber(props, "outerRadius") ?? Math.max(Math.min(frame.width, frame.height) / 2, 1),
        startAngle: propNumber(props, "startAngle") ?? 0,
        endAngle: propNumber(props, "endAngle") ?? 180,
        arcType: propString(props, "arcType") === "pie" ? "pie" : "open",
        arcSweep: propNumber(props, "arcSweep") === -1 ? -1 : 1,
        fill,
        stroke,
        strokeWidth,
        opacity,
        rotation,
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
      rotation,
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
    rotation: node.rotation ?? 0,
  };
}

export function getKonvaImageProps(node: RenderNode): KonvaImageRenderProps {
  const { frame, props } = node;

  return {
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    src: normalizeRenderableImageSource(propString(props, "src") ?? propString(props, "svg") ?? ""),
    opacity: propNumber(props, "opacity") ?? 1,
    rotation: node.rotation ?? 0,
  };
}

export function isSelectableNode(node: RenderNode): boolean {
  return node.visible && !node.locked && node.props.selectable === true;
}

export function isTransformableNode(node: RenderNode): boolean {
  if (!isSelectableNode(node)) {
    return false;
  }

  if (node.type === "text" || node.type === "rich-text" || node.type === "image" || node.type === "table" || node.type === "list") {
    return true;
  }

  if (node.type !== "shape") {
    return false;
  }

  const shape = propString(node.props, "shape");
  return shape === "rect" || shape === "circle" || shape === "ellipse" || shape === "line" || shape === "arc" || shape === "polygon" || shape === "polyline" || shape === "curve";
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

function propBoolean(props: RenderNodeProps, key: string): boolean {
  return props[key] === true;
}

function propTextAlign(props: RenderNodeProps): "left" | "center" | "right" {
  const value = propString(props, "textAlign");
  return value === "center" || value === "right" ? value : "left";
}

function propFontWeight(props: RenderNodeProps): string {
  const value = props.fontWeight;
  return typeof value === "number" || typeof value === "string" ? String(value) : "normal";
}

function normalizeRenderableImageSource(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("<svg")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
