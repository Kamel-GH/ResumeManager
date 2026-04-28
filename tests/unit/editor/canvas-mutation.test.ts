import { describe, expect, it } from "vitest";

import { applyCanvasObjectGeometry } from "@/features/editor/schema/canvas-mutation";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

describe("canvas mutation", () => {
  it("persists scaled points when polygon and polyline geometry is committed", () => {
    const template: TemplateSchema = {
      id: "template-1",
      name: "Template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 800,
          height: 600,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      elements: [
        {
          id: "polygon-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 40, y: 50, width: 120, height: 80 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            shape: "polygon",
            points: [0, 0, 120, 0, 60, 80],
            selectable: true,
          },
        },
        {
          id: "polyline-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 60, y: 80, width: 150, height: 90 },
          rotation: 0,
          zIndex: 2,
          locked: false,
          visible: true,
          props: {
            shape: "polyline",
            points: [0, 0, 50, 30, 150, 90],
            selectable: true,
          },
        },
      ],
    };

    const next = applyCanvasObjectGeometry(template, [
      {
        id: "polygon-1",
        frame: { x: 40, y: 50, width: 240, height: 160 },
        rotation: 12,
        points: [0, 0, 240, 0, 120, 160],
      },
      {
        id: "polyline-1",
        frame: { x: 60, y: 80, width: 300, height: 180 },
        rotation: 8,
        points: [0, 0, 100, 60, 300, 180],
      },
    ]);

    expect(next.elements.find((element) => element.id === "polygon-1")?.props?.points).toEqual([0, 0, 240, 0, 120, 160]);
    expect(next.elements.find((element) => element.id === "polyline-1")?.props?.points).toEqual([0, 0, 100, 60, 300, 180]);
  });
});
