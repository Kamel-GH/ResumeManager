import { describe, expect, it } from "vitest";

import {
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
} from "@/features/editor/renderers/konva-renderer";
import type { RenderNode } from "@/features/editor/schema/render-tree";

describe("konva renderer model", () => {
  it("projects text render nodes to Konva text props without changing geometry", () => {
    const node: RenderNode = {
      id: "name",
      type: "text",
      frame: { x: 20, y: 30, width: 240, height: 48 },
      zIndex: 1,
      visible: true,
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
    });
    expect(isSelectableNode(node)).toBe(true);
  });

  it("projects rectangular and circular shape nodes to Konva shape props", () => {
    const rectNode: RenderNode = {
      id: "badge",
      type: "shape",
      frame: { x: 10, y: 12, width: 80, height: 24 },
      zIndex: 2,
      visible: true,
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
      frame: { x: 44, y: 38, width: 112, height: 112 },
      zIndex: 3,
      visible: true,
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
      },
    });
  });
});
