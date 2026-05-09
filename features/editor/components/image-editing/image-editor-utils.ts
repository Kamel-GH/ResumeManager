import type { CSSProperties } from "react";

import type { RenderNodeProps } from "@/features/editor/schema/render-tree";

import type {
  ImageEditingState,
  ImageFilterPreset,
  ImageMaskBorder,
  ImageMaskBorderStyle,
  ImageMaskBounds,
  ImageMaskResizeHandle,
  ImageMaskType,
} from "./image-editor-types";

export const defaultImageEditingState: ImageEditingState = {
  crop: {
    ratio: "free",
    zoom: 1,
    x: 0,
    y: 0,
    rotation: 0,
  },
  mask: {
    type: "rectangle",
    radius: 0,
    bounds: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },
    border: {
      width: 0,
      color: "#f5a623",
      style: "solid",
      shadow: 0,
    },
  },
  filter: "none",
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    temperature: 0,
    hue: 0,
    blur: 0,
    sharpness: 0,
    opacity: 1,
    shadow: 0,
    vignette: 0,
    grain: 0,
  },
  transform: {
    flipX: false,
    flipY: false,
    rotation: 0,
  },
};

export function normalizeImageEditingState(value: unknown): ImageEditingState {
  if (!isRecord(value)) {
    return structuredClone(defaultImageEditingState);
  }

  const crop = isRecord(value.crop) ? value.crop : {};
  const mask = isRecord(value.mask) ? value.mask : {};
  const adjustments = isRecord(value.adjustments) ? value.adjustments : {};
  const transform = isRecord(value.transform) ? value.transform : {};

  return {
    crop: {
      ratio: toCropRatio(crop.ratio),
      zoom: clamp(toNumber(crop.zoom, defaultImageEditingState.crop.zoom), 0.25, 5),
      x: clamp(toNumber(crop.x, defaultImageEditingState.crop.x), -1, 1),
      y: clamp(toNumber(crop.y, defaultImageEditingState.crop.y), -1, 1),
      rotation: normalizeRotation(toNumber(crop.rotation, defaultImageEditingState.crop.rotation)),
    },
    mask: {
      type: toMaskType(mask.type),
      radius: clamp(toNumber(mask.radius, defaultImageEditingState.mask.radius), 0, 80),
      bounds: normalizeImageMaskBounds(mask.bounds),
      border: normalizeImageMaskBorder(mask.border),
    },
    filter: toFilterPreset(value.filter),
    adjustments: {
      brightness: clamp(toNumber(adjustments.brightness, 0), -1, 1),
      contrast: clamp(toNumber(adjustments.contrast, 0), -1, 1),
      saturation: clamp(toNumber(adjustments.saturation, 0), -1, 1),
      exposure: clamp(toNumber(adjustments.exposure, 0), -1, 1),
      temperature: clamp(toNumber(adjustments.temperature, 0), -1, 1),
      hue: clamp(toNumber(adjustments.hue, 0), -180, 180),
      blur: clamp(toNumber(adjustments.blur, 0), 0, 20),
      sharpness: clamp(toNumber(adjustments.sharpness, 0), 0, 1),
      opacity: clamp(toNumber(adjustments.opacity, 1), 0, 1),
      shadow: clamp(toNumber(adjustments.shadow, 0), 0, 1),
      vignette: clamp(toNumber(adjustments.vignette, 0), 0, 1),
      grain: clamp(toNumber(adjustments.grain, 0), 0, 1),
    },
    transform: {
      flipX: transform.flipX === true,
      flipY: transform.flipY === true,
      rotation: normalizeRotation(toNumber(transform.rotation, 0)),
    },
  };
}

export function resolveImageEditingFromProps(props: RenderNodeProps): ImageEditingState {
  return normalizeImageEditingState(props.imageEditing);
}

export function resolveImagePreviewSource(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("<svg")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  if (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return trimmed;
  }

  return "";
}

export function buildImageCssFilter(editing: ImageEditingState): string {
  const preset = getFilterPresetValues(editing.filter);
  const brightness =
    1 + editing.adjustments.brightness + editing.adjustments.exposure * 0.35 + preset.brightness;
  const contrast = 1 + editing.adjustments.contrast + preset.contrast;
  const saturation = Math.max(0, 1 + editing.adjustments.saturation + preset.saturation);
  const sepia = preset.sepia;
  const grayscale = preset.grayscale;
  const hue = editing.adjustments.hue + preset.hue + editing.adjustments.temperature * 18;
  const blur = editing.adjustments.blur;

  return [
    `brightness(${Math.max(0, brightness).toFixed(3)})`,
    `contrast(${Math.max(0, contrast).toFixed(3)})`,
    `saturate(${saturation.toFixed(3)})`,
    `sepia(${sepia.toFixed(3)})`,
    `grayscale(${grayscale.toFixed(3)})`,
    `hue-rotate(${hue.toFixed(1)}deg)`,
    blur > 0 ? `blur(${blur.toFixed(1)}px)` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildImagePreviewStyle(editing: ImageEditingState): CSSProperties {
  const layout = buildImagePreviewFrameStyle(editing);

  return {
    ...layout,
    opacity: editing.adjustments.opacity,
    filter: buildImageCssFilter(editing),
  };
}

export function resolveImagePreviewSvgGeometry(
  editing: ImageEditingState,
  frameWidth = 100,
  frameHeight = 100,
) {
  const safeFrameWidth = Math.max(frameWidth, 1);
  const safeFrameHeight = Math.max(frameHeight, 1);
  const zoom = Math.max(0.25, editing.crop.zoom);
  const width = safeFrameWidth * zoom;
  const height = safeFrameHeight * zoom;

  return {
    x: safeFrameWidth / 2 + editing.crop.x * (safeFrameWidth / 2) - width / 2,
    y: safeFrameHeight / 2 + editing.crop.y * (safeFrameHeight / 2) - height / 2,
    width,
    height,
    rotation: editing.crop.rotation + editing.transform.rotation,
    flipX: editing.transform.flipX,
    flipY: editing.transform.flipY,
  };
}

export function buildImagePreviewFrameStyle(editing: ImageEditingState): CSSProperties {
  const zoom = Math.max(0.25, editing.crop.zoom);

  return {
    position: "absolute",
    left: `${(50 + editing.crop.x * 50 - zoom * 50).toFixed(4)}%`,
    top: `${(50 + editing.crop.y * 50 - zoom * 50).toFixed(4)}%`,
    width: `${(zoom * 100).toFixed(4)}%`,
    height: `${(zoom * 100).toFixed(4)}%`,
    transform: `scale(${editing.transform.flipX ? -1 : 1}, ${editing.transform.flipY ? -1 : 1}) rotate(${editing.crop.rotation + editing.transform.rotation}deg)`,
    transformOrigin: "center center",
  };
}

export function buildImagePreviewTransform(editing: ImageEditingState): string {
  return [
    `scale(${editing.transform.flipX ? -1 : 1}, ${editing.transform.flipY ? -1 : 1})`,
    `rotate(${editing.crop.rotation + editing.transform.rotation}deg)`,
  ].join(" ");
}

export function moveImageCrop(
  crop: ImageEditingState["crop"],
  deltaX: number,
  deltaY: number,
  frameWidth: number,
  frameHeight: number,
) {
  const nextX = crop.x + deltaX / Math.max(frameWidth / 2, 1);
  const nextY = crop.y + deltaY / Math.max(frameHeight / 2, 1);

  return {
    ...crop,
    x: clamp(nextX, -1, 1),
    y: clamp(nextY, -1, 1),
  };
}

export function scaleImageCropZoom(
  startZoom: number,
  startDistance: number,
  currentDistance: number,
) {
  if (startDistance <= 0.001) {
    return clamp(startZoom, 0.25, 5);
  }

  return clamp(startZoom * (currentDistance / startDistance), 0.25, 5);
}

export function buildMaskPreviewStyle(editing: ImageEditingState): CSSProperties {
  const radius = editing.mask.type === "rounded-rect" ? `${editing.mask.radius}px` : "0";
  const bounds = normalizeImageMaskBounds(editing.mask.bounds);
  const clipPath = buildImageMaskClipPath(bounds, editing.mask.type, radius);

  return {
    borderRadius: radius,
    clipPath,
    WebkitClipPath: clipPath,
  };
}

export function buildImageMaskPathData(
  frame: { x: number; y: number; width: number; height: number },
  maskType: ImageMaskType,
  radius: number,
) {
  const left = frame.x;
  const top = frame.y;
  const right = frame.x + frame.width;
  const bottom = frame.y + frame.height;
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;
  const roundedRadius = Math.min(radius, frame.width / 2, frame.height / 2);

  switch (maskType) {
    case "rounded-rect":
      return [
        `M ${left + roundedRadius} ${top}`,
        `H ${right - roundedRadius}`,
        `Q ${right} ${top} ${right} ${top + roundedRadius}`,
        `V ${bottom - roundedRadius}`,
        `Q ${right} ${bottom} ${right - roundedRadius} ${bottom}`,
        `H ${left + roundedRadius}`,
        `Q ${left} ${bottom} ${left} ${bottom - roundedRadius}`,
        `V ${top + roundedRadius}`,
        `Q ${left} ${top} ${left + roundedRadius} ${top}`,
        "Z",
      ].join(" ");
    case "circle": {
      const size = Math.min(frame.width, frame.height);
      const circleRadius = size / 2;
      return [
        `M ${centerX + circleRadius} ${centerY}`,
        `A ${circleRadius} ${circleRadius} 0 1 0 ${centerX - circleRadius} ${centerY}`,
        `A ${circleRadius} ${circleRadius} 0 1 0 ${centerX + circleRadius} ${centerY}`,
        "Z",
      ].join(" ");
    }
    case "ellipse": {
      const rx = frame.width / 2;
      const ry = frame.height / 2;
      return [
        `M ${centerX + rx} ${centerY}`,
        `A ${rx} ${ry} 0 1 0 ${centerX - rx} ${centerY}`,
        `A ${rx} ${ry} 0 1 0 ${centerX + rx} ${centerY}`,
        "Z",
      ].join(" ");
    }
    case "diamond":
      return [
        `M ${centerX} ${top}`,
        `L ${right} ${centerY}`,
        `L ${centerX} ${bottom}`,
        `L ${left} ${centerY}`,
        "Z",
      ].join(" ");
    case "star":
      return buildPolygonPathData(frame, [
        [0.5, 0],
        [0.61, 0.35],
        [0.98, 0.35],
        [0.68, 0.56],
        [0.79, 0.91],
        [0.5, 0.7],
        [0.21, 0.91],
        [0.32, 0.56],
        [0.02, 0.35],
        [0.39, 0.35],
      ]);
    case "blob":
      return buildPolygonPathData(frame, [
        [0.44, 0.03],
        [0.75, 0.1],
        [0.98, 0.38],
        [0.89, 0.72],
        [0.61, 0.96],
        [0.26, 0.88],
        [0.04, 0.58],
        [0.12, 0.23],
      ]);
    case "rectangle":
    default:
      return `M ${left} ${top} H ${right} V ${bottom} H ${left} Z`;
  }
}

export function resolveImageMaskBorderPresentation(border: ImageMaskBorder): {
  dash: number[];
  lineCap: "round" | "butt";
  lineJoin: "round";
} {
  const dash = buildImageMaskBorderDashArray(border.style);
  const lineCap =
    border.style === "dashed-round" ||
    border.style === "long-dashed-round" ||
    border.style === "dotted"
      ? "round"
      : "butt";
  return {
    dash,
    lineCap,
    lineJoin: "round" as const,
  };
}

export function hasImageMaskBorderChanges(border: ImageMaskBorder) {
  return (
    border.width > 0 ||
    border.color !== defaultImageEditingState.mask.border.color ||
    border.style !== defaultImageEditingState.mask.border.style ||
    Math.abs(border.shadow - defaultImageEditingState.mask.border.shadow) > 0.001
  );
}

export function resolveImageMaskFrame(mask: ImageMaskBounds, width: number, height: number) {
  const bounds = normalizeImageMaskBounds(mask);
  return {
    x: bounds.x * width,
    y: bounds.y * height,
    width: bounds.width * width,
    height: bounds.height * height,
  };
}

export function normalizeImageMaskBounds(value: unknown): ImageMaskBounds {
  if (!isRecord(value)) {
    return structuredClone(defaultImageEditingState.mask.bounds);
  }

  const width = clamp(toNumber(value.width, defaultImageEditingState.mask.bounds.width), 0.05, 1);
  const height = clamp(
    toNumber(value.height, defaultImageEditingState.mask.bounds.height),
    0.05,
    1,
  );
  const x = clamp(toNumber(value.x, defaultImageEditingState.mask.bounds.x), 0, 1 - width);
  const y = clamp(toNumber(value.y, defaultImageEditingState.mask.bounds.y), 0, 1 - height);

  return {
    x,
    y,
    width,
    height,
  };
}

export function normalizeImageMaskBorder(value: unknown): ImageMaskBorder {
  if (!isRecord(value)) {
    return structuredClone(defaultImageEditingState.mask.border);
  }

  return {
    width: clamp(toNumber(value.width, defaultImageEditingState.mask.border.width), 0, 24),
    color: normalizeBorderColor(value.color),
    style: toMaskBorderStyle(value.style),
    shadow: clamp(toNumber(value.shadow, defaultImageEditingState.mask.border.shadow), 0, 1),
  };
}

export function moveImageMaskBounds(bounds: ImageMaskBounds, deltaX: number, deltaY: number) {
  return normalizeImageMaskBounds({
    ...bounds,
    x: bounds.x + deltaX,
    y: bounds.y + deltaY,
  });
}

export function resizeImageMaskBounds(
  bounds: ImageMaskBounds,
  handle: ImageMaskResizeHandle,
  deltaX: number,
  deltaY: number,
  maskType: ImageMaskType,
) {
  const minSize = 0.05;
  const resized = (() => {
    switch (handle) {
      case "top-left": {
        const width = Math.max(minSize, bounds.width - deltaX);
        const height = Math.max(minSize, bounds.height - deltaY);
        if (maskType === "circle") {
          const size = Math.max(minSize, width, height);
          return {
            x: bounds.x + bounds.width - size,
            y: bounds.y + bounds.height - size,
            width: size,
            height: size,
          };
        }
        return {
          x: bounds.x + bounds.width - width,
          y: bounds.y + bounds.height - height,
          width,
          height,
        };
      }
      case "top-right": {
        const width = Math.max(minSize, bounds.width + deltaX);
        const height = Math.max(minSize, bounds.height - deltaY);
        if (maskType === "circle") {
          const size = Math.max(minSize, width, height);
          return {
            x: bounds.x,
            y: bounds.y + bounds.height - size,
            width: size,
            height: size,
          };
        }
        return {
          x: bounds.x,
          y: bounds.y + bounds.height - height,
          width,
          height,
        };
      }
      case "bottom-left": {
        const width = Math.max(minSize, bounds.width - deltaX);
        const height = Math.max(minSize, bounds.height + deltaY);
        if (maskType === "circle") {
          const size = Math.max(minSize, width, height);
          return {
            x: bounds.x + bounds.width - size,
            y: bounds.y,
            width: size,
            height: size,
          };
        }
        return {
          x: bounds.x + bounds.width - width,
          y: bounds.y,
          width,
          height,
        };
      }
      case "bottom-right":
      default: {
        const width = Math.max(minSize, bounds.width + deltaX);
        const height = Math.max(minSize, bounds.height + deltaY);
        if (maskType === "circle") {
          const size = Math.max(minSize, width, height);
          return {
            x: bounds.x,
            y: bounds.y,
            width: size,
            height: size,
          };
        }
        return {
          x: bounds.x,
          y: bounds.y,
          width,
          height,
        };
      }
    }
  })();

  return normalizeImageMaskBounds(resized);
}

export function buildImageMaskClipPath(
  bounds: ImageMaskBounds,
  maskType: ImageMaskType,
  radius: string,
) {
  const left = toPercent(bounds.x);
  const top = toPercent(bounds.y);
  const right = toPercent(Math.max(0, 1 - bounds.x - bounds.width));
  const bottom = toPercent(Math.max(0, 1 - bounds.y - bounds.height));
  const centerX = toPercent(bounds.x + bounds.width / 2);
  const centerY = toPercent(bounds.y + bounds.height / 2);
  const halfWidth = toPercent(bounds.width / 2);
  const halfHeight = toPercent(bounds.height / 2);

  switch (maskType) {
    case "rounded-rect":
      return `inset(${top} ${right} ${bottom} ${left} round ${radius})`;
    case "circle":
      return `circle(${toPercent(Math.min(bounds.width / 2, bounds.height / 2))} at ${centerX} ${centerY})`;
    case "ellipse":
      return `ellipse(${halfWidth} ${halfHeight} at ${centerX} ${centerY})`;
    case "diamond":
      return buildMaskPolygonClipPath(bounds, [
        [0.5, 0],
        [1, 0.5],
        [0.5, 1],
        [0, 0.5],
      ]);
    case "star":
      return buildMaskPolygonClipPath(bounds, [
        [0.5, 0],
        [0.61, 0.35],
        [0.98, 0.35],
        [0.68, 0.56],
        [0.79, 0.91],
        [0.5, 0.7],
        [0.21, 0.91],
        [0.32, 0.56],
        [0.02, 0.35],
        [0.39, 0.35],
      ]);
    case "blob":
      return buildMaskPolygonClipPath(bounds, [
        [0.44, 0.03],
        [0.75, 0.1],
        [0.98, 0.38],
        [0.89, 0.72],
        [0.61, 0.96],
        [0.26, 0.88],
        [0.04, 0.58],
        [0.12, 0.23],
      ]);
    case "rectangle":
    default:
      return `inset(${top} ${right} ${bottom} ${left})`;
  }
}

export function getFilterPresetValues(filter: ImageFilterPreset) {
  switch (filter) {
    case "grayscale":
      return { brightness: 0, contrast: 0.02, saturation: -1, sepia: 0, grayscale: 1, hue: 0 };
    case "sepia":
      return {
        brightness: 0.02,
        contrast: 0.04,
        saturation: -0.12,
        sepia: 0.75,
        grayscale: 0,
        hue: 0,
      };
    case "vintage":
      return {
        brightness: 0.05,
        contrast: -0.06,
        saturation: -0.18,
        sepia: 0.35,
        grayscale: 0,
        hue: -8,
      };
    case "cool":
      return { brightness: 0, contrast: 0.04, saturation: 0.05, sepia: 0, grayscale: 0, hue: 16 };
    case "warm":
      return {
        brightness: 0.03,
        contrast: 0.02,
        saturation: 0.08,
        sepia: 0.18,
        grayscale: 0,
        hue: -12,
      };
    case "high-contrast":
      return { brightness: 0, contrast: 0.35, saturation: 0.12, sepia: 0, grayscale: 0, hue: 0 };
    case "soft":
      return {
        brightness: 0.07,
        contrast: -0.18,
        saturation: -0.08,
        sepia: 0.04,
        grayscale: 0,
        hue: 0,
      };
    case "bright":
      return { brightness: 0.22, contrast: 0.05, saturation: 0.04, sepia: 0, grayscale: 0, hue: 0 };
    case "dark":
      return {
        brightness: -0.22,
        contrast: 0.08,
        saturation: -0.04,
        sepia: 0,
        grayscale: 0,
        hue: 0,
      };
    case "none":
    default:
      return { brightness: 0, contrast: 0, saturation: 0, sepia: 0, grayscale: 0, hue: 0 };
  }
}

function buildPolygonPathData(
  frame: { x: number; y: number; width: number; height: number },
  points: Array<[number, number]>,
) {
  const [firstPoint, ...remainingPoints] = points;
  const x0 = frame.x + frame.width * firstPoint[0];
  const y0 = frame.y + frame.height * firstPoint[1];
  return [
    `M ${x0} ${y0}`,
    ...remainingPoints.map(
      ([x, y]) => `L ${frame.x + frame.width * x} ${frame.y + frame.height * y}`,
    ),
    "Z",
  ].join(" ");
}

function buildImageMaskBorderDashArray(style: ImageMaskBorderStyle) {
  switch (style) {
    case "dashed":
      return [10, 6];
    case "dashed-round":
      return [10, 6];
    case "long-dashed":
      return [18, 10];
    case "long-dashed-round":
      return [18, 10];
    case "dotted":
      return [1, 8];
    case "solid":
    default:
      return [];
  }
}

function toMaskBorderStyle(value: unknown): ImageMaskBorderStyle {
  return value === "dashed" ||
    value === "dashed-round" ||
    value === "long-dashed" ||
    value === "long-dashed-round" ||
    value === "dotted"
    ? value
    : "solid";
}

function normalizeBorderColor(value: unknown) {
  if (typeof value !== "string") {
    return defaultImageEditingState.mask.border.color;
  }

  const trimmed = value.trim();
  return /^#[0-9a-f]{3,8}$/i.test(trimmed) ? trimmed : defaultImageEditingState.mask.border.color;
}

function toCropRatio(value: unknown): ImageEditingState["crop"]["ratio"] {
  return value === "1:1" ||
    value === "4:3" ||
    value === "3:4" ||
    value === "16:9" ||
    value === "9:16" ||
    value === "block"
    ? value
    : "free";
}

function toMaskType(value: unknown): ImageMaskType {
  return value === "rounded-rect" ||
    value === "circle" ||
    value === "ellipse" ||
    value === "diamond" ||
    value === "star" ||
    value === "blob"
    ? value
    : "rectangle";
}

function toFilterPreset(value: unknown): ImageFilterPreset {
  return value === "grayscale" ||
    value === "sepia" ||
    value === "vintage" ||
    value === "cool" ||
    value === "warm" ||
    value === "high-contrast" ||
    value === "soft" ||
    value === "bright" ||
    value === "dark"
    ? value
    : "none";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRotation(value: number) {
  const normalized = value % 360;
  return normalized < -180 ? normalized + 360 : normalized > 180 ? normalized - 360 : normalized;
}

function buildMaskPolygonClipPath(bounds: ImageMaskBounds, points: Array<[number, number]>) {
  return `polygon(${points
    .map(
      ([x, y]) =>
        `${((bounds.x + bounds.width * x) * 100).toFixed(4)}% ${((bounds.y + bounds.height * y) * 100).toFixed(4)}%`,
    )
    .join(", ")})`;
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(4)}%`;
}
