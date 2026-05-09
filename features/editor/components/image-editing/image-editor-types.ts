export type ImageCropRatio = "free" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "block";

export type ImageMaskType =
  | "rectangle"
  | "rounded-rect"
  | "circle"
  | "ellipse"
  | "diamond"
  | "star"
  | "blob";
export type ImageMaskBorderStyle =
  | "solid"
  | "dashed"
  | "dashed-round"
  | "long-dashed"
  | "long-dashed-round"
  | "dotted";

export type ImageMaskBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageMaskResizeHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type ImageMaskBorder = {
  width: number;
  color: string;
  style: ImageMaskBorderStyle;
  shadow: number;
};

export type ImageFilterPreset =
  | "none"
  | "grayscale"
  | "sepia"
  | "vintage"
  | "cool"
  | "warm"
  | "high-contrast"
  | "soft"
  | "bright"
  | "dark";

export type ImageEditingState = {
  crop: {
    ratio: ImageCropRatio;
    zoom: number;
    x: number;
    y: number;
    rotation: number;
  };
  mask: {
    type: ImageMaskType;
    radius: number;
    bounds: ImageMaskBounds;
    border: ImageMaskBorder;
  };
  filter: ImageFilterPreset;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    temperature: number;
    hue: number;
    blur: number;
    sharpness: number;
    opacity: number;
    shadow: number;
    vignette: number;
    grain: number;
  };
  transform: {
    flipX: boolean;
    flipY: boolean;
    rotation: number;
  };
};

export type ImageEditorTab = "crop" | "mask" | "filters" | "adjustments" | "effects" | "transform";
