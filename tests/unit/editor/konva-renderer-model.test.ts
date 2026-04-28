import { describe, expect, it } from "vitest";

import {
  getKonvaImageProps,
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
  isTransformableNode,
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
        fill: "#ffffff",
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
});
