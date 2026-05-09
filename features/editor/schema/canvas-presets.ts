import type { CanvasToolEnvelope } from "@/features/editor/schema/canvas-insertion";
import type { TemplateElementProps } from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";

export type CanvasPresetIconElement =
  | {
      type: "path";
      d: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: "round" | "butt" | "square";
      strokeLinejoin?: "round" | "miter" | "bevel";
    }
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    };

export type CanvasPresetIcon = {
  viewBox: string;
  elements: CanvasPresetIconElement[];
};

export type CanvasPresetBase = {
  id: string;
  label: string;
  icon: CanvasPresetIcon;
  canonicalType: string;
  defaultFrame: {
    width: number;
    height: number;
  };
  defaultProps: TemplateElementProps;
};

export type CanvasShapePreset = CanvasPresetBase & {
  kind: "shape";
  shapeKind: string;
};

export type CanvasArcPreset = CanvasPresetBase & {
  kind: "arc";
};

const shapeIconViewBox = "0 0 64 64";
const arcIconViewBox = "0 0 64 64";

export const CANVAS_SHAPE_PRESETS = [
  defineShapePreset("shape-star", "Étoile", "star", 72, 72, [
    {
      type: "path",
      d: "m32 8 6.7 13.6 15 1.1-11.5 9.8 3.6 14.9L32 39.3 18.2 47.4l3.6-14.9L10.3 22.7l15-1.1Z",
      strokeLinejoin: "round",
    },
  ]),
  defineShapePreset("shape-triangle", "Triangle", "triangle", 72, 72, [
    { type: "path", d: "M32 8 58 56H6Z", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-diamond", "Losange", "diamond", 72, 72, [
    { type: "path", d: "m32 8 24 24-24 24-24-24Z", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-pentagon", "Pentagone", "pentagon", 72, 72, [
    { type: "path", d: "m32 8 22 16.2-8.4 25.8H18.4L10 24.2Z", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-hexagon", "Hexagone", "hexagon", 72, 72, [
    { type: "path", d: "M20 8h24l16 24-16 24H20L4 32Z", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-bubble", "Bulle", "bubble", 92, 72, [
    {
      type: "path",
      d: "M14 12h26a12 12 0 0 1 12 12v10a12 12 0 0 1-12 12H24l-8 8v-8h-2A12 12 0 0 1 2 34V24A12 12 0 0 1 14 12Z",
      strokeLinejoin: "round",
    },
    { type: "path", d: "M14 27h24M14 33h16", strokeLinecap: "round" },
  ]),
  defineShapePreset("shape-badge", "Badge", "badge", 96, 56, [
    { type: "path", d: "M18 10h28l8 8v28H10V18Z", strokeLinejoin: "round" },
    { type: "path", d: "M18 10v12h12", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-heart", "Cœur", "heart", 72, 72, [
    {
      type: "path",
      d: "M32 52 15 34c-5-5-6.5-12.5-3.1-18.2 4.1-7 13.7-8.3 20.1-2.7 6.4-5.6 16-4.3 20.1 2.7C55.5 21.5 54 29 49 34Z",
      strokeLinejoin: "round",
    },
  ]),
  defineShapePreset("shape-arrow-filled", "Flèche pleine", "arrow-filled", 112, 56, [
    { type: "path", d: "M6 26h34V14l18 18-18 18V38H6Z", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-chevron", "Chevron", "chevron", 72, 72, [
    { type: "path", d: "M20 10 46 32 20 54 14 46 30 32 14 18Z", strokeLinejoin: "round" },
  ]),
  defineShapePreset("shape-rounded-deco", "Arrondi décoratif", "rounded-deco", 96, 64, [
    { type: "rect", x: 8, y: 12, width: 48, height: 40, rx: 14 },
  ]),
] as const satisfies readonly CanvasShapePreset[];

export const CANVAS_ARC_PRESETS = [
  defineArcPreset(
    "arc-open",
    "Arc simple",
    "shape:arc/open",
    96,
    72,
    {
      arcType: "open",
      startAngle: 210,
      endAngle: 330,
      arcSweep: 1,
      strokeWidth: 4,
    },
    [{ type: "path", d: "M14 44A24 24 0 0 1 50 20", strokeLinecap: "round" }],
  ),
  defineArcPreset(
    "arc-semicircle",
    "Demi-cercle",
    "shape:arc/semicircle",
    96,
    56,
    {
      arcType: "open",
      startAngle: 180,
      endAngle: 360,
      arcSweep: 1,
      strokeWidth: 4,
    },
    [{ type: "path", d: "M10 44A22 22 0 0 1 54 44", strokeLinecap: "round" }],
  ),
  defineArcPreset(
    "arc-quarter",
    "Quart de cercle",
    "shape:arc/quarter",
    72,
    72,
    {
      arcType: "open",
      startAngle: 270,
      endAngle: 360,
      arcSweep: 1,
      strokeWidth: 4,
    },
    [{ type: "path", d: "M16 48A32 32 0 0 1 48 16", strokeLinecap: "round" }],
  ),
  defineArcPreset(
    "arc-pie",
    "Secteur",
    "shape:arc/pie",
    80,
    80,
    {
      arcType: "pie",
      startAngle: 300,
      endAngle: 45,
      arcSweep: 1,
      strokeWidth: 2,
    },
    [
      {
        type: "path",
        d: "M32 32 49 17A24 24 0 0 1 56 32 24 24 0 0 1 48.9 49Z",
        strokeLinejoin: "round",
      },
    ],
  ),
  defineArcPreset(
    "arc-partial-ring",
    "Anneau partiel",
    "shape:arc/partial-ring",
    96,
    72,
    {
      arcType: "open",
      startAngle: 205,
      endAngle: 25,
      arcSweep: 1,
      strokeWidth: 10,
    },
    [{ type: "path", d: "M12 43A24 24 0 0 1 52 43", strokeLinecap: "round", strokeWidth: 7 }],
  ),
  defineArcPreset(
    "arc-thick",
    "Arc épais",
    "shape:arc/thick",
    96,
    72,
    {
      arcType: "open",
      startAngle: 190,
      endAngle: 335,
      arcSweep: 1,
      strokeWidth: 8,
    },
    [{ type: "path", d: "M12 46A25 25 0 0 1 54 26", strokeLinecap: "round", strokeWidth: 6 }],
  ),
  defineArcPreset(
    "arc-arrow",
    "Arc fléché",
    "shape:arc/arrow",
    96,
    72,
    {
      arcType: "open",
      startAngle: 205,
      endAngle: 330,
      arcSweep: 1,
      strokeWidth: 4,
    },
    [
      { type: "path", d: "M13 44A25 25 0 0 1 48 20", strokeLinecap: "round" },
      { type: "path", d: "m45 13 8 4-3 8", strokeLinejoin: "round" },
    ],
  ),
  defineArcPreset(
    "arc-decorative",
    "Arc décoratif",
    "shape:arc/decorative",
    104,
    64,
    {
      arcType: "open",
      startAngle: 200,
      endAngle: 340,
      arcSweep: 1,
      strokeWidth: 3,
      dash: [8, 5],
    },
    [{ type: "path", d: "M11 43A27 27 0 0 1 53 21", strokeLinecap: "round" }],
  ),
] as const satisfies readonly CanvasArcPreset[];

export function createCanvasShapePresetPayload(preset: CanvasShapePreset) {
  return {
    name: preset.label,
    label: preset.label,
    width: preset.defaultFrame.width,
    height: preset.defaultFrame.height,
    ...preset.defaultProps,
  };
}

export function createCanvasArcPresetToolPayload(
  preset: CanvasArcPreset,
  frame: Rect,
): CanvasToolEnvelope["payload"] {
  return {
    toolId: "arc",
    frame,
    name: preset.label,
    ...preset.defaultProps,
  };
}

function defineShapePreset(
  id: string,
  label: string,
  shapeKind: string,
  width: number,
  height: number,
  elements: CanvasPresetIconElement[],
): CanvasShapePreset {
  const icon = { viewBox: shapeIconViewBox, elements };

  return {
    id,
    label,
    kind: "shape",
    shapeKind,
    icon,
    canonicalType: `shape:svg/${shapeKind}`,
    defaultFrame: { width, height },
    defaultProps: {
      type: id,
      presetId: id,
      presetKind: shapeKind,
      strokeWidth: 2,
      svg: iconToSvg(icon),
    },
  };
}

function defineArcPreset(
  id: string,
  label: string,
  canonicalType: string,
  width: number,
  height: number,
  props: TemplateElementProps,
  elements: CanvasPresetIconElement[],
): CanvasArcPreset {
  return {
    id,
    label,
    kind: "arc",
    icon: { viewBox: arcIconViewBox, elements },
    canonicalType,
    defaultFrame: { width, height },
    defaultProps: {
      toolId: "arc",
      presetId: id,
      ...props,
    },
  };
}

function iconToSvg(icon: CanvasPresetIcon) {
  const elements = icon.elements.map((element) => {
    if (element.type === "rect") {
      return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}"${element.rx !== undefined ? ` rx="${element.rx}"` : ""} fill="${element.fill ?? "none"}" stroke="${element.stroke ?? "#111827"}" stroke-width="${element.strokeWidth ?? 4}"/>`;
    }

    return `<path d="${element.d}" fill="${element.fill ?? "none"}" stroke="${element.stroke ?? "#111827"}" stroke-width="${element.strokeWidth ?? 4}" stroke-linecap="${element.strokeLinecap ?? "round"}" stroke-linejoin="${element.strokeLinejoin ?? "round"}"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}">${elements.join("")}</svg>`;
}
