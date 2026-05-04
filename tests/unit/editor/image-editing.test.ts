import { describe, expect, it } from "vitest";

import {
  buildImageCssFilter,
  buildImageMaskPathData,
  buildImagePreviewStyle,
  buildImagePreviewFrameStyle,
  buildMaskPreviewStyle,
  moveImageCrop,
  moveImageMaskBounds,
  hasImageMaskBorderChanges,
  normalizeImageEditingState,
  resolveImageMaskBorderPresentation,
  resolveImageMaskFrame,
  resolveImagePreviewSvgGeometry,
  scaleImageCropZoom,
  resizeImageMaskBounds,
} from "@/features/editor/components/image-editing/image-editor-utils";

describe("image editing helpers", () => {
  it("normalizes image editing parameters and keeps crop values bounded", () => {
    const editing = normalizeImageEditingState({
      crop: { ratio: "16:9", zoom: 20, x: 4, y: -4, rotation: 270 },
      mask: { type: "circle", radius: 200, bounds: { x: -0.2, y: 0.2, width: 2, height: 0.1 } },
      filter: "warm",
      adjustments: { opacity: 2, brightness: 4 },
      transform: { flipX: true, flipY: false, rotation: -270 },
    });

    expect(editing.crop.ratio).toBe("16:9");
    expect(editing.crop.zoom).toBe(5);
    expect(editing.crop.x).toBe(1);
    expect(editing.crop.y).toBe(-1);
    expect(editing.crop.rotation).toBe(-90);
    expect(editing.mask.type).toBe("circle");
    expect(editing.mask.radius).toBe(80);
    expect(editing.mask.bounds).toEqual({
      x: 0,
      y: 0.2,
      width: 1,
      height: 0.1,
    });
    expect(editing.mask.border).toEqual({
      width: 0,
      color: "#f5a623",
      style: "solid",
      shadow: 0,
    });
    expect(editing.adjustments.opacity).toBe(1);
    expect(editing.adjustments.brightness).toBe(1);
    expect(editing.transform.flipX).toBe(true);
    expect(editing.transform.rotation).toBe(90);
  });

  it("normalizes mask border controls and maps dash styles consistently", () => {
    const editing = normalizeImageEditingState({
      mask: {
        border: {
          width: 42,
          color: "  #123456  ",
          style: "long-dashed-round",
          shadow: 4,
        },
      },
    });

    expect(editing.mask.border).toEqual({
      width: 24,
      color: "#123456",
      style: "long-dashed-round",
      shadow: 1,
    });

    expect(resolveImageMaskBorderPresentation(editing.mask.border)).toEqual({
      dash: [18, 10],
      lineCap: "round",
      lineJoin: "round",
    });
    expect(hasImageMaskBorderChanges(editing.mask.border)).toBe(true);
  });

  it("builds a visual filter string from preset and manual adjustments", () => {
    const editing = normalizeImageEditingState({
      filter: "grayscale",
      adjustments: { brightness: 0.2, contrast: 0.1, blur: 2 },
    });

    expect(buildImageCssFilter(editing)).toContain("grayscale(1.000)");
    expect(buildImageCssFilter(editing)).toContain("brightness(");
    expect(buildImageCssFilter(editing)).toContain("blur(2.0px)");
  });

  it("builds a preview frame style that matches the canvas geometry", () => {
    const editing = normalizeImageEditingState({
      crop: {
        x: 0.5,
        y: -0.25,
        zoom: 1,
      },
    });

    expect(buildImagePreviewFrameStyle(editing)).toMatchObject({
      position: "absolute",
      left: "25.0000%",
      top: "-12.5000%",
      width: "100.0000%",
      height: "100.0000%",
      transform: "scale(1, 1) rotate(0deg)",
    });
    expect(buildImagePreviewStyle(editing)).toMatchObject({
      left: "25.0000%",
      top: "-12.5000%",
      width: "100.0000%",
      height: "100.0000%",
      transform: "scale(1, 1) rotate(0deg)",
    });
  });

  it("builds preview SVG geometry with the same crop layout as the canvas", () => {
    const editing = normalizeImageEditingState({
      crop: {
        zoom: 1.25,
        x: 0.2,
        y: -0.1,
        rotation: 15,
      },
      transform: {
        flipX: true,
        flipY: false,
        rotation: -15,
      },
    });

    expect(resolveImagePreviewSvgGeometry(editing)).toEqual({
      x: -2.5,
      y: -17.5,
      width: 125,
      height: 125,
      rotation: 0,
      flipX: true,
      flipY: false,
    });
  });

  it("builds preview SVG geometry against the actual block frame ratio", () => {
    const editing = normalizeImageEditingState({
      crop: {
        zoom: 1.25,
        x: 0.2,
        y: -0.1,
        rotation: 15,
      },
      transform: {
        flipX: true,
        flipY: false,
        rotation: -15,
      },
    });

    expect(resolveImagePreviewSvgGeometry(editing, 400, 300)).toEqual({
      x: -10,
      y: -52.5,
      width: 500,
      height: 375,
      rotation: 0,
      flipX: true,
      flipY: false,
    });
  });

  it("builds a mask clip path from the manual bounds", () => {
    const editing = normalizeImageEditingState({
      mask: {
        type: "rounded-rect",
        radius: 12,
        bounds: {
          x: 0.1,
          y: 0.15,
          width: 0.5,
          height: 0.4,
        },
      },
    });

    const previewStyle = buildMaskPreviewStyle(editing);

    expect(previewStyle.clipPath).toContain("10.0000%");
    expect(previewStyle.clipPath).toContain("15.0000%");
    expect(previewStyle.clipPath).toContain("40.0000%");
    expect(previewStyle.clipPath).toContain("45.0000%");
    expect(previewStyle.clipPath).toContain("round 12px");
  });

  it("builds a reusable mask contour path from the same geometry", () => {
    const frame = resolveImageMaskFrame(
      {
        x: 0.1,
        y: 0.2,
        width: 0.5,
        height: 0.4,
      },
      100,
      100,
    );

    expect(buildImageMaskPathData(frame, "diamond", 0)).toContain("M 35 20");
    expect(buildImageMaskPathData(frame, "rounded-rect", 8)).toContain("Q 60 20");
  });

  it("moves and resizes mask bounds directly without leaving the frame", () => {
    const moved = moveImageMaskBounds(
      {
        x: 0.1,
        y: 0.2,
        width: 0.4,
        height: 0.3,
      },
      0.2,
      0.1,
    );
    expect(moved.x).toBeCloseTo(0.3, 6);
    expect(moved.y).toBeCloseTo(0.3, 6);
    expect(moved.width).toBeCloseTo(0.4, 6);
    expect(moved.height).toBeCloseTo(0.3, 6);

    const resizedCircle = resizeImageMaskBounds(
      {
        x: 0.2,
        y: 0.2,
        width: 0.3,
        height: 0.4,
      },
      "top-left",
      -0.1,
      -0.05,
      "circle",
    );

    expect(resizedCircle.width).toBe(resizedCircle.height);
    expect(resizedCircle.x).toBeLessThanOrEqual(0.2);
    expect(resizedCircle.y).toBeLessThanOrEqual(0.2);
  });

  it("moves and rescales crop values manually", () => {
    const moved = moveImageCrop(
      {
        ratio: "free",
        zoom: 1,
        x: 0,
        y: 0,
        rotation: 0,
      },
      115,
      -57.5,
      460,
      460,
    );

    expect(moved.x).toBeCloseTo(0.5, 6);
    expect(moved.y).toBeCloseTo(-0.25, 6);

    expect(scaleImageCropZoom(1, 100, 180)).toBeCloseTo(1.8, 6);
    expect(scaleImageCropZoom(1, 100, 0)).toBeCloseTo(0.25, 6);
  });
});
