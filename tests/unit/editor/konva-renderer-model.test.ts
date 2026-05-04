import { describe, expect, it } from "vitest";

import {
  getKonvaImageProps,
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
  isSelectionBoxTool,
  isTransformableNode,
  resolveCanonicalFrameFromProjectedGeometry,
  resolveDragSelectionIds,
  resolveSelectionOrderCapabilities,
  resolveSelectionActionBarPlacement,
  shouldShowFrameOutline,
} from "@/features/editor/renderers/konva-renderer";
import type { RenderNode } from "@/features/editor/schema/render-tree";

describe("konva renderer model", () => {
  it("projects text render nodes to Konva text props without changing geometry", () => {
    const node: RenderNode = {
      id: "name",
      type: "text",
      pageId: "page-1",
      frame: { x: 20, y: 30, width: 240, height: 48 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        text: "[Prénom] [Nom]",
        color: "#0d1b2a",
        fontFamily: "Georgia",
        fontSize: 45,
        fontWeight: "bold",
        lineHeight: 1.1,
        textAlign: "center",
        selectable: true,
      },
    };

    expect(getKonvaTextProps(node)).toMatchObject({
      x: 20,
      y: 30,
      width: 240,
      height: 48,
      text: "[Prénom] [Nom]",
      fill: "#0d1b2a",
      fontFamily: "Georgia",
      fontSize: 45,
      fontWeight: "bold",
      lineHeight: 1.1,
      align: "center",
      rotation: 0,
    });
    expect(isSelectableNode(node)).toBe(true);
  });

  it("projects rectangular and circular shape nodes to Konva shape props", () => {
    const rectNode: RenderNode = {
      id: "badge",
      type: "shape",
      pageId: "page-1",
      frame: { x: 10, y: 12, width: 80, height: 24 },
      rotation: 0,
      zIndex: 2,
      visible: true,
      locked: false,
      props: {
        shape: "rect",
        fill: "#fff6df",
        stroke: "#8b5cf6",
        strokeWidth: 2,
        cornerRadius: 3,
        dash: [4, 3],
      },
    };
    const circleNode: RenderNode = {
      id: "photo",
      type: "shape",
      pageId: "page-1",
      frame: { x: 44, y: 38, width: 112, height: 112 },
      rotation: 0,
      zIndex: 3,
      visible: true,
      locked: false,
      props: {
        shape: "circle",
        fill: "#d8d2c8",
      },
    };

    expect(getKonvaShapeProps(rectNode)).toEqual({
      shape: "rect",
      rect: {
        x: 10,
        y: 12,
        width: 80,
        height: 24,
        cornerRadius: 3,
        fill: "#fff6df",
        stroke: "#8b5cf6",
        strokeWidth: 2,
        dash: [4, 3],
        opacity: 1,
        rotation: 0,
      },
    });
    expect(getKonvaShapeProps(circleNode)).toEqual({
      shape: "circle",
      circle: {
        x: 100,
        y: 94,
        radius: 56,
        fill: "#d8d2c8",
        stroke: "transparent",
        strokeWidth: 1,
        opacity: 1,
        rotation: 0,
      },
    });
  });

  it("projects line nodes using stored point coordinates", () => {
    const lineNode: RenderNode = {
      id: "line",
      type: "shape",
      pageId: "page-1",
      frame: { x: 40, y: 60, width: 160, height: 80 },
      rotation: 0,
      zIndex: 3,
      visible: true,
      locked: false,
      props: {
        shape: "line",
        points: [20, 20, 140, 60],
        arrow: false,
        stroke: "#0f172a",
        strokeWidth: 2,
      },
    };

    expect(getKonvaShapeProps(lineNode)).toEqual({
      shape: "line",
      line: {
        x: 40,
        y: 60,
        points: [20, 20, 140, 60],
        stroke: "#0f172a",
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
        dash: undefined,
        pointerAtBeginning: false,
        pointerAtEnding: false,
        pointerLength: 8,
        pointerWidth: 8,
        fill: "transparent",
      },
    });
  });

  it("projects polyline nodes using stored point coordinates", () => {
    const polylineNode: RenderNode = {
      id: "polyline",
      type: "shape",
      pageId: "page-1",
      frame: { x: 24, y: 32, width: 180, height: 120 },
      rotation: 0,
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        shape: "polyline",
        points: [8, 16, 60, 40, 136, 56],
        stroke: "#0f172a",
        strokeWidth: 2,
      },
    };

    expect(getKonvaShapeProps(polylineNode)).toEqual({
      shape: "polyline",
      polyline: {
        x: 24,
        y: 32,
        points: [8, 16, 60, 40, 136, 56],
        fill: "transparent",
        stroke: "#0f172a",
        strokeWidth: 2,
        opacity: 1,
        rotation: 0,
      },
    });
  });

  it("keeps table nodes transformable for rotation and geometry reconciliation", () => {
    const tableNode: RenderNode = {
      id: "table",
      type: "table",
      pageId: "page-1",
      frame: { x: 40, y: 64, width: 320, height: 180 },
      rotation: 12,
      zIndex: 4,
      visible: true,
      locked: false,
      props: {
        rows: 3,
        columns: 3,
        headerRow: true,
        selectable: true,
      },
    };

    expect(isTransformableNode(tableNode)).toBe(true);
  });

  it("treats visible unlocked render nodes as selectable unless explicitly disabled", () => {
    const baseNode: RenderNode = {
      id: "free-text",
      type: "text",
      pageId: "page-1",
      frame: { x: 20, y: 30, width: 160, height: 32 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        text: "Editable",
      },
    };

    expect(isSelectableNode(baseNode)).toBe(true);
    expect(isSelectableNode({ ...baseNode, props: { ...baseNode.props, selectable: false } })).toBe(false);
    expect(isSelectableNode({ ...baseNode, locked: true })).toBe(false);
  });

  it("uses the same box-selection behavior for pointer and selection tools", () => {
    expect(isSelectionBoxTool("pointer")).toBe(true);
    expect(isSelectionBoxTool("selection")).toBe(true);
    expect(isSelectionBoxTool("hand")).toBe(false);
  });

  it("keeps polygon and polyline nodes transformable", () => {
    const polygonNode: RenderNode = {
      id: "polygon",
      type: "shape",
      pageId: "page-1",
      frame: { x: 20, y: 30, width: 120, height: 90 },
      rotation: 0,
      zIndex: 5,
      visible: true,
      locked: false,
      props: {
        shape: "polygon",
        points: [0, 0, 120, 10, 80, 90],
        selectable: true,
      },
    };
    const polylineNode: RenderNode = {
      id: "polyline",
      type: "shape",
      pageId: "page-1",
      frame: { x: 24, y: 32, width: 180, height: 120 },
      rotation: 0,
      zIndex: 5,
      visible: true,
      locked: false,
      props: {
        shape: "polyline",
        points: [0, 0, 60, 40, 136, 56],
        selectable: true,
      },
    };

    expect(isTransformableNode(polygonNode)).toBe(true);
    expect(isTransformableNode(polylineNode)).toBe(true);
  });

  it("keeps list nodes transformable for preset blocks", () => {
    const listNode: RenderNode = {
      id: "preset-block",
      type: "list",
      pageId: "page-1",
      frame: { x: 32, y: 48, width: 260, height: 180 },
      rotation: 0,
      zIndex: 5,
      visible: true,
      locked: false,
      props: {
        label: "Expérience senior",
        mappedPath: "candidate.experiences",
        sampleItemsCount: 3,
        repeatable: true,
        selectable: true,
      },
    };

    expect(isTransformableNode(listNode)).toBe(true);
  });

  it("normalizes svg-backed image sources for Konva loading", () => {
    const imageNode: RenderNode = {
      id: "icon",
      type: "image",
      pageId: "page-1",
      frame: { x: 12, y: 18, width: 40, height: 40 },
      rotation: 0,
      zIndex: 6,
      visible: true,
      locked: false,
      props: {
        src: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" fill=\"#fff\"/></svg>",
        selectable: true,
      },
    };

    expect(getKonvaImageProps(imageNode).src).toContain("data:image/svg+xml");
  });

  it("hides frame outlines for nodes that are actively dragged", () => {
    expect(shouldShowFrameOutline("node-a", [])).toBe(true);
    expect(shouldShowFrameOutline("node-a", ["node-b"])).toBe(true);
    expect(shouldShowFrameOutline("node-a", ["node-a"])).toBe(false);
  });

  it("keeps the contextual toolbar outside the rotation handle safety zone when there is room above", () => {
    const placement = resolveSelectionActionBarPlacement({ x: 200, y: 160, width: 80, height: 40 }, 500, 400);

    expect(placement.placement).toBe("bottom");
    expect(placement.top + 38).toBeLessThanOrEqual(160 - 58);
  });

  it("places the contextual toolbar below the selection near the top viewport edge", () => {
    const placement = resolveSelectionActionBarPlacement({ x: 12, y: 32, width: 80, height: 40 }, 500, 400);

    expect(placement.placement).toBe("top");
    expect(placement.top).toBeGreaterThan(32 + 40);
    expect(placement.left).toBeGreaterThanOrEqual(8);
  });

  it("resolves multi-drag selection from selectable nodes on the anchor page", () => {
    const baseNode: RenderNode = {
      id: "shape-1",
      type: "shape",
      pageId: "page-1",
      frame: { x: 10, y: 10, width: 40, height: 40 },
      rotation: 0,
      zIndex: 1,
      locked: false,
      visible: true,
      props: {
        shape: "rect",
      },
    };
    const renderNodeById = new Map<string, { node: RenderNode; pageId: string }>([
      ["shape-1", { node: baseNode, pageId: "page-1" }],
      ["shape-2", { node: { ...baseNode, id: "shape-2", props: { shape: "rect" } }, pageId: "page-1" }],
      ["locked", { node: { ...baseNode, id: "locked", locked: true }, pageId: "page-1" }],
      ["other-page", { node: { ...baseNode, id: "other-page", pageId: "page-2" }, pageId: "page-2" }],
    ]);

    expect(
      resolveDragSelectionIds({
        anchorId: "shape-1",
        anchorPageId: "page-1",
        selectedElementIds: ["shape-1", "shape-2", "locked", "other-page"],
        renderNodeById,
      }),
    ).toEqual(["shape-1", "shape-2"]);
  });

  it("projects flip flags into Konva transforms without moving the visual frame", () => {
    const flippedRect: RenderNode = {
      id: "flipped-rect",
      type: "shape",
      pageId: "page-1",
      frame: { x: 20, y: 30, width: 80, height: 40 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        shape: "rect",
        flipX: true,
        flipY: true,
        selectable: true,
      },
    };

    const flippedText: RenderNode = {
      id: "flipped-text",
      type: "text",
      pageId: "page-1",
      frame: { x: 15, y: 25, width: 100, height: 30 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        text: "Texte",
        flipX: true,
        selectable: true,
      },
    };

    const flippedImage: RenderNode = {
      id: "flipped-image",
      type: "image",
      pageId: "page-1",
      frame: { x: 40, y: 70, width: 120, height: 90 },
      rotation: 8,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        src: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"/>",
        flipY: true,
        selectable: true,
      },
    };

    const flippedArc: RenderNode = {
      id: "flipped-arc",
      type: "shape",
      pageId: "page-1",
      frame: { x: 100, y: 120, width: 140, height: 80 },
      rotation: 12,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        shape: "arc",
        flipX: true,
        flipY: true,
        selectable: true,
      },
    };

    expect(getKonvaShapeProps(flippedRect)).toMatchObject({
      shape: "rect",
      rect: {
        x: 100,
        y: 70,
        width: 80,
        height: 40,
        scaleX: -1,
        scaleY: -1,
      },
    });
    const flippedRectProps = getKonvaShapeProps(flippedRect);
    expect(flippedRectProps.shape).toBe("rect");
    if (flippedRectProps.shape === "rect") {
      expect(flippedRectProps.rect).not.toHaveProperty("offsetX");
      expect(flippedRectProps.rect).not.toHaveProperty("offsetY");
    }

    expect(getKonvaTextProps(flippedText)).toMatchObject({
      x: 115,
      y: 25,
      width: 100,
      height: 30,
      scaleX: -1,
      scaleY: 1,
    });
    expect(getKonvaTextProps(flippedText)).not.toHaveProperty("offsetX");
    expect(getKonvaTextProps(flippedText)).not.toHaveProperty("offsetY");

    expect(getKonvaImageProps(flippedImage)).toMatchObject({
      x: 40,
      y: 160,
      width: 120,
      height: 90,
      rotation: 8,
      scaleX: 1,
      scaleY: -1,
    });
    expect(getKonvaImageProps(flippedImage)).not.toHaveProperty("offsetX");
    expect(getKonvaImageProps(flippedImage)).not.toHaveProperty("offsetY");

    const arcProps = getKonvaShapeProps(flippedArc);
    expect(arcProps).toMatchObject({
      shape: "arc",
      arc: {
        x: 240,
        y: 200,
        scaleX: -1,
        scaleY: -1,
        rotation: 12,
      },
    });
    expect(arcProps.shape).toBe("arc");
    if (arcProps.shape === "arc") {
      expect(arcProps.arc).not.toHaveProperty("offsetX");
      expect(arcProps.arc).not.toHaveProperty("offsetY");
    }
  });

  it("resolves canonical drag frames from flipped Konva projections", () => {
    const flippedArrow: RenderNode = {
      id: "arrow",
      type: "shape",
      pageId: "page-1",
      frame: { x: 20, y: 30, width: 80, height: 40 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        shape: "rect",
        presetKind: "arrow-filled",
        flipX: true,
        selectable: true,
      },
    };

    expect(
      resolveCanonicalFrameFromProjectedGeometry(flippedArrow, {
        x: 150,
        y: 55,
        width: 80,
        height: 40,
        scaleX: -1,
        scaleY: 1,
      }),
    ).toEqual({ x: 70, y: 55, width: 80, height: 40 });

    const flippedBubble: RenderNode = {
      ...flippedArrow,
      id: "bubble",
      frame: { x: 40, y: 60, width: 120, height: 90 },
      props: {
        shape: "rect",
        presetKind: "bubble",
        flipX: true,
        flipY: true,
        selectable: true,
      },
    };

    expect(
      resolveCanonicalFrameFromProjectedGeometry(flippedBubble, {
        x: 190,
        y: 180,
        width: 120,
        height: 90,
        scaleX: -1,
        scaleY: -1,
      }),
    ).toEqual({ x: 70, y: 90, width: 120, height: 90 });
  });

  it("resolves canonical drag frames for flipped text, image and arc nodes", () => {
    const textNode: RenderNode = {
      id: "text",
      type: "text",
      pageId: "page-1",
      frame: { x: 12, y: 24, width: 160, height: 32 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        text: "Texte",
        flipY: true,
        selectable: true,
      },
    };
    const imageNode: RenderNode = {
      id: "image",
      type: "image",
      pageId: "page-1",
      frame: { x: 30, y: 48, width: 110, height: 70 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        src: "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\"/>",
        flipX: true,
        selectable: true,
      },
    };
    const arcNode: RenderNode = {
      id: "arc",
      type: "shape",
      pageId: "page-1",
      frame: { x: 52, y: 64, width: 100, height: 80 },
      rotation: 0,
      zIndex: 1,
      visible: true,
      locked: false,
      props: {
        shape: "arc",
        flipX: true,
        flipY: true,
        selectable: true,
      },
    };

    expect(resolveCanonicalFrameFromProjectedGeometry(textNode, { x: 22, y: 96, width: 160, height: 32, scaleX: 1, scaleY: -1 })).toEqual({
      x: 22,
      y: 64,
      width: 160,
      height: 32,
    });
    expect(resolveCanonicalFrameFromProjectedGeometry(imageNode, { x: 170, y: 58, width: 110, height: 70, scaleX: -1, scaleY: 1 })).toEqual({
      x: 60,
      y: 58,
      width: 110,
      height: 70,
    });
    expect(resolveCanonicalFrameFromProjectedGeometry(arcNode, { x: 180, y: 174, width: 100, height: 80, scaleX: -1, scaleY: -1 })).toEqual({
      x: 80,
      y: 94,
      width: 100,
      height: 80,
    });
  });

  it("does not expose forward actions when a locked object blocks the selected node", () => {
    expect(
      resolveSelectionOrderCapabilities({
        id: "tree",
        templateId: "template",
        pages: [
          {
            id: "page-1",
            name: "Page 1",
            width: 400,
            height: 300,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            orientation: "landscape",
            children: [
              createOrderRenderNode("back", 1),
              createOrderRenderNode("selected", 2),
              createOrderRenderNode("locked-front", 3, { locked: true }),
            ],
          },
        ],
      }, ["selected"]),
    ).toEqual({
      bringToFront: false,
      bringForward: false,
      sendBackward: true,
      sendToBack: true,
    });
  });
});

function createOrderRenderNode(id: string, zIndex: number, options?: { locked?: boolean; layerId?: string; layerOrder?: number }): RenderNode {
  return {
    id,
    type: "shape",
    pageId: "page-1",
    frame: { x: zIndex * 10, y: 10, width: 20, height: 20 },
    rotation: 0,
    zIndex,
    visible: true,
    locked: options?.locked ?? false,
    props: {
      shape: "rect",
      selectable: true,
      layerId: options?.layerId ?? "layer-a",
      layerOrder: options?.layerOrder ?? 1,
    },
  };
}
