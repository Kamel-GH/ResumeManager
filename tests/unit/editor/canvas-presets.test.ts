import { describe, expect, it } from "vitest";

import { createCanvasInsertionElement } from "@/features/editor/schema/canvas-insertion";
import {
  CANVAS_ARC_PRESETS,
  CANVAS_SHAPE_PRESETS,
  createCanvasArcPresetToolPayload,
  createCanvasShapePresetPayload,
} from "@/features/editor/schema/canvas-presets";

const forbiddenPaletteToolTypes = new Set([
  "rectangle",
  "rect",
  "ellipse",
  "circle",
  "line",
  "text",
  "image",
  "table",
]);

describe("canvas presets", () => {
  it("defines reliable shape presets with unique ids, labels, icons and canonical payloads", () => {
    const ids = new Set<string>();

    CANVAS_SHAPE_PRESETS.forEach((preset) => {
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
      expect(preset.label).not.toHaveLength(0);
      expect(preset.icon.elements.length).toBeGreaterThan(0);
      expect(preset.defaultFrame.width).toBeGreaterThan(0);
      expect(preset.defaultFrame.height).toBeGreaterThan(0);
      expect(preset.defaultProps.presetId).toBe(preset.id);
      expect(preset.defaultProps.type).toBe(preset.id);
      expect(forbiddenPaletteToolTypes.has(String(preset.defaultProps.type))).toBe(false);
    });
  });

  it("defines reliable arc presets with unique ids, labels, icons and distinct canonical props", () => {
    const ids = new Set<string>();
    const serializedProps = new Set<string>();

    CANVAS_ARC_PRESETS.forEach((preset) => {
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
      expect(preset.label).not.toHaveLength(0);
      expect(preset.icon.elements.length).toBeGreaterThan(0);
      expect(preset.defaultFrame.width).toBeGreaterThan(0);
      expect(preset.defaultFrame.height).toBeGreaterThan(0);
      expect(preset.defaultProps.presetId).toBe(preset.id);
      expect(preset.defaultProps.toolId).toBe("arc");

      const signature = JSON.stringify(preset.defaultProps);
      expect(serializedProps.has(signature)).toBe(false);
      serializedProps.add(signature);
    });
  });

  it.each([
    ["shape-star", "star"],
    ["shape-hexagon", "hexagon"],
    ["shape-bubble", "bubble"],
  ])("inserts %s as a selectable canonical svg shape", (presetId, expectedKind) => {
    const preset = CANVAS_SHAPE_PRESETS.find((candidate) => candidate.id === presetId);
    expect(preset).toBeDefined();
    if (!preset) {
      return;
    }

    const result = createCanvasInsertionElement({
      source: {
        type: "shape",
        payload: createCanvasShapePresetPayload(preset),
      },
      context: createInsertionContext(),
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("shape");
    expect(result.element.frame).toMatchObject(preset.defaultFrame);
    expect(result.element.style).toMatchObject({
      fill: "#d9b86f",
      stroke: "#0f172a",
      strokeWidth: 2,
      opacity: 1,
    });
    expect(result.element.props).toMatchObject({
      selectable: true,
      selectionType: "shape",
      entityType: "shape",
      kind: "shape",
      presetId,
      presetKind: expectedKind,
      svg: expect.stringContaining("<svg"),
      label: preset.label,
      name: preset.label,
    });
  });

  it.each([
    ["arc-open", "open"],
    ["arc-pie", "pie"],
    ["arc-semicircle", "open"],
  ])("inserts %s as the expected canonical arc", (presetId, expectedArcType) => {
    const preset = CANVAS_ARC_PRESETS.find((candidate) => candidate.id === presetId);
    expect(preset).toBeDefined();
    if (!preset) {
      return;
    }

    const frame = {
      x: 40,
      y: 60,
      width: preset.defaultFrame.width,
      height: preset.defaultFrame.height,
    };
    const result = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: createCanvasArcPresetToolPayload(preset, frame),
      },
      context: createInsertionContext({ frame }),
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("shape");
    expect(result.element.frame).toEqual(frame);
    expect(result.element.props).toMatchObject({
      selectable: true,
      selectionType: "shape",
      entityType: "canvas-tool",
      kind: "arc",
      shape: "arc",
      arcType: expectedArcType,
      presetId,
      label: preset.label,
      name: preset.label,
    });
  });
});

function createInsertionContext(overrides?: {
  frame?: { x: number; y: number; width: number; height: number };
}) {
  return {
    elementId: "element-preset",
    pageId: "page-1",
    point: { x: 120, y: 140 },
    frame: overrides?.frame,
    layer: {
      id: "layer-1",
      pageId: "page-1",
      name: "Content",
      order: 1,
      visible: true,
      locked: false,
    },
  };
}
