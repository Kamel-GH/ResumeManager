import { describe, expect, it } from "vitest";

import {
  alignTemplateCanvasElements,
  applyCanvasObjectGeometry,
  applyCanvasObjectStyle,
  deleteTemplateCanvasElements,
  duplicateTemplateCanvasElements,
  flipTemplateCanvasElements,
  reorderTemplateCanvasElements,
} from "@/features/editor/schema/canvas-mutation";
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

  it("returns the original template when no geometry or style patch is provided", () => {
    const template = createOrderTemplate();

    expect(applyCanvasObjectGeometry(template, [])).toBe(template);
    expect(applyCanvasObjectStyle(template, [])).toBe(template);
  });

  it("keeps locked elements untouched when geometry and style patches target them directly", () => {
    const template = createOrderTemplate();
    const locked = template.elements.find((element) => element.id === "page-1-a-locked");

    const nextGeometry = applyCanvasObjectGeometry(template, [
      {
        id: "page-1-a-locked",
        frame: { x: 280, y: 120, width: 140, height: 60 },
        rotation: 45,
      },
    ]);
    const nextStyle = applyCanvasObjectStyle(template, [
      {
        id: "page-1-a-locked",
        style: {
          fill: "#111111",
          stroke: "#222222",
          strokeWidth: 4,
          opacity: 0.25,
        },
      },
    ]);

    expect(nextGeometry.elements.find((element) => element.id === "page-1-a-locked")).toEqual(locked);
    expect(nextStyle.elements.find((element) => element.id === "page-1-a-locked")).toEqual(locked);
  });

  it("applies canonical styles only to supported canvas objects", () => {
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
          id: "shape-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 40, y: 50, width: 120, height: 80 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
          },
        },
        {
          id: "image-1",
          pageId: "page-1",
          type: "image",
          frame: { x: 160, y: 50, width: 120, height: 80 },
          rotation: 0,
          zIndex: 2,
          locked: false,
          visible: true,
          props: {
            src: "data:image/png;base64,AAA",
            selectable: true,
          },
        },
      ],
    };

    const next = applyCanvasObjectStyle(template, [
      {
        id: "shape-1",
        style: {
          fill: "#ff0000",
          stroke: "#000000",
          strokeWidth: 3,
          opacity: 0.5,
        },
      },
      {
        id: "image-1",
        style: {
          fill: "#00ff00",
          stroke: "#111111",
          strokeWidth: 4,
          opacity: 0.25,
        },
      },
    ]);

    expect(next.elements.find((element) => element.id === "shape-1")?.style).toMatchObject({
      fill: "#ff0000",
      stroke: "#000000",
      strokeWidth: 3,
      opacity: 0.5,
    });
    expect(next.elements.find((element) => element.id === "image-1")?.style).toMatchObject({
      opacity: 0.25,
    });
    expect(next.elements.find((element) => element.id === "image-1")?.style?.fill).toBeUndefined();
  });

  it("applies a style patch to multiple compatible objects and skips incompatible ones", () => {
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
          id: "shape-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 40, y: 50, width: 120, height: 80 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
          },
        },
        {
          id: "shape-2",
          pageId: "page-1",
          type: "shape",
          frame: { x: 160, y: 50, width: 120, height: 80 },
          rotation: 0,
          zIndex: 2,
          locked: false,
          visible: true,
          props: {
            shape: "ellipse",
            selectable: true,
          },
        },
        {
          id: "image-1",
          pageId: "page-1",
          type: "image",
          frame: { x: 280, y: 50, width: 120, height: 80 },
          rotation: 0,
          zIndex: 3,
          locked: false,
          visible: true,
          props: {
            src: "data:image/png;base64,AAA",
            selectable: true,
          },
        },
      ],
    };

    const next = applyCanvasObjectStyle(template, [
      {
        id: "shape-1",
        style: {
          fill: "#ffeecc",
          stroke: "#334155",
          strokeWidth: 2,
          opacity: 0.9,
        },
      },
      {
        id: "shape-2",
        style: {
          fill: "#ffeecc",
          stroke: "#334155",
          strokeWidth: 2,
          opacity: 0.9,
        },
      },
      {
        id: "image-1",
        style: {
          fill: "#111111",
          stroke: "#222222",
          strokeWidth: 8,
          opacity: 0.4,
        },
      },
    ]);

    expect(next.elements.find((element) => element.id === "shape-1")?.style).toMatchObject({
      fill: "#ffeecc",
      stroke: "#334155",
      strokeWidth: 2,
      opacity: 0.9,
    });
    expect(next.elements.find((element) => element.id === "shape-2")?.style).toMatchObject({
      fill: "#ffeecc",
      stroke: "#334155",
      strokeWidth: 2,
      opacity: 0.9,
    });
    expect(next.elements.find((element) => element.id === "image-1")?.style).toMatchObject({
      opacity: 0.4,
    });
    expect(next.elements.find((element) => element.id === "image-1")?.style?.stroke).toBeUndefined();
  });

  it("reorders objects within their parent layer without crossing layers", () => {
    const template = createOrderTemplate();

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-2"],
      action: "bring-forward",
    });

    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-1", "page-1-a-3", "page-1-a-2", "page-1-a-locked"]);
    expect(sortedLayerIds(next.template, "page-1", "layer-b")).toEqual(["page-1-b-1", "page-1-b-2"]);
    expect(next.template.elements.find((element) => element.id === "page-1-a-2")?.props?.layerOrder).toBe(1);
    expect(next.template.elements.find((element) => element.id === "page-1-b-1")?.props?.layerOrder).toBe(2);
    expect(next.changedIds).toContain("page-1-a-2");
  });

  it("brings selected objects to the front within a single parent layer", () => {
    const template = createOrderTemplate();

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1"],
      action: "bring-to-front",
    });

    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-2", "page-1-a-3", "page-1-a-1", "page-1-a-locked"]);
  });

  it("sends selected objects to the back within a single parent layer", () => {
    const template = createOrderTemplate();

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-3"],
      action: "send-to-back",
    });

    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-3", "page-1-a-1", "page-1-a-2", "page-1-a-locked"]);
  });

  it("reorders selected objects independently per layer and preserves their relative order", () => {
    const template = createOrderTemplate();

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-2", "page-1-b-1"],
      action: "bring-to-front",
    });

    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-1", "page-1-a-3", "page-1-a-2", "page-1-a-locked"]);
    expect(sortedLayerIds(next.template, "page-1", "layer-b")).toEqual(["page-1-b-2", "page-1-b-1"]);
  });

  it("reorders selected objects independently per page", () => {
    const template = createOrderTemplate();

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1", "page-2-c-1"],
      action: "bring-to-front",
    });

    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-2", "page-1-a-3", "page-1-a-1", "page-1-a-locked"]);
    expect(sortedLayerIds(next.template, "page-2", "layer-a")).toEqual(["page-2-c-2", "page-2-c-1"]);
  });

  it("keeps locked objects fixed and no-ops at the boundary", () => {
    const template = createOrderTemplate();

    const lockedNoop = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-locked"],
      action: "bring-forward",
    });

    const boundaryNoop = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-3"],
      action: "bring-forward",
    });

    expect(sortedLayerIds(lockedNoop.template, "page-1", "layer-a")).toEqual(["page-1-a-1", "page-1-a-2", "page-1-a-3", "page-1-a-locked"]);
    expect(sortedLayerIds(boundaryNoop.template, "page-1", "layer-a")).toEqual(["page-1-a-1", "page-1-a-2", "page-1-a-3", "page-1-a-locked"]);
  });

  it("keeps object ordering inside the direct logical parent when parent props exist", () => {
    const baseTemplate = createOrderTemplate();
    const template: TemplateSchema = {
      ...baseTemplate,
      elements: baseTemplate.elements.map((element) => {
        if (element.id === "page-1-a-1" || element.id === "page-1-a-2") {
          return {
            ...element,
            props: {
              ...element.props,
              groupId: "group-1",
            },
          };
        }

        if (element.id === "page-1-a-3") {
          return {
            ...element,
            props: {
              ...element.props,
              groupId: "group-2",
            },
          };
        }

        return element;
      }),
    };

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-2"],
      action: "bring-forward",
    });

    expect(next.changedIds).toEqual([]);
    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-1", "page-1-a-2", "page-1-a-3", "page-1-a-locked"]);
    expect(next.template.elements.find((element) => element.id === "page-1-a-2")?.props?.groupId).toBe("group-1");
  });

  it("preserves selected relative order for step moves in both directions", () => {
    const template = createOrderTemplate();

    const forward = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1", "page-1-a-2"],
      action: "bring-forward",
    });
    const backward = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-2", "page-1-a-3"],
      action: "send-backward",
    });

    expect(sortedLayerIds(forward.template, "page-1", "layer-a")).toEqual(["page-1-a-3", "page-1-a-1", "page-1-a-2", "page-1-a-locked"]);
    expect(sortedLayerIds(backward.template, "page-1", "layer-a")).toEqual(["page-1-a-2", "page-1-a-3", "page-1-a-1", "page-1-a-locked"]);
  });

  it("reorders only within movable segments when a locked object splits the layer", () => {
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
          id: "page-1-a-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 10, y: 10, width: 100, height: 40 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
            layerId: "layer-a",
            layerName: "Layer A",
            layerOrder: 1,
          },
        },
        {
          id: "page-1-a-2",
          pageId: "page-1",
          type: "shape",
          frame: { x: 120, y: 10, width: 100, height: 40 },
          rotation: 0,
          zIndex: 2,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
            layerId: "layer-a",
            layerName: "Layer A",
            layerOrder: 1,
          },
        },
        {
          id: "page-1-a-locked",
          pageId: "page-1",
          type: "shape",
          frame: { x: 230, y: 10, width: 100, height: 40 },
          rotation: 0,
          zIndex: 3,
          locked: true,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
            layerId: "layer-a",
            layerName: "Layer A",
            layerOrder: 1,
          },
        },
        {
          id: "page-1-a-3",
          pageId: "page-1",
          type: "shape",
          frame: { x: 340, y: 10, width: 100, height: 40 },
          rotation: 0,
          zIndex: 4,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
            layerId: "layer-a",
            layerName: "Layer A",
            layerOrder: 1,
          },
        },
      ],
    };

    const next = reorderTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1"],
      action: "bring-to-front",
    });

    expect(sortedLayerIds(next.template, "page-1", "layer-a")).toEqual(["page-1-a-2", "page-1-a-1", "page-1-a-locked", "page-1-a-3"]);
  });

  it("aligns three selected objects to the left edge", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-left",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.x).toBe(40);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.x).toBe(40);
    expect(next.template.elements.find((element) => element.id === "page-1-box-3")?.frame.x).toBe(40);
  });

  it("keeps identity, page, layer and layer order during alignment", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-left",
    });
    const aligned = next.template.elements.find((element) => element.id === "page-1-box-2");

    expect(aligned?.id).toBe("page-1-box-2");
    expect(aligned?.pageId).toBe("page-1");
    expect(aligned?.props?.layerId).toBe("layer-a");
    expect(aligned?.props?.layerName).toBe("Layer A");
    expect(aligned?.props?.layerOrder).toBe(1);
    expect(next.changedIds).toEqual(["page-1-box-2", "page-1-box-3"]);
  });

  it("aligns three selected objects to the horizontal center", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-center-horizontal",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.x).toBe(120);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.x).toBe(120);
    expect(next.template.elements.find((element) => element.id === "page-1-box-3")?.frame.x).toBe(120);
  });

  it("aligns three selected objects to the right edge", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-right",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.x).toBe(200);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.x).toBe(200);
    expect(next.template.elements.find((element) => element.id === "page-1-box-3")?.frame.x).toBe(200);
  });

  it("aligns three selected objects to the top edge", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-top",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.y).toBe(20);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.y).toBe(20);
    expect(next.template.elements.find((element) => element.id === "page-1-box-3")?.frame.y).toBe(20);
  });

  it("aligns three selected objects to the vertical center", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-center-vertical",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.y).toBe(60);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.y).toBe(60);
    expect(next.template.elements.find((element) => element.id === "page-1-box-3")?.frame.y).toBe(60);
  });

  it("aligns three selected objects to the bottom edge", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3"],
      alignment: "align-bottom",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.y).toBe(100);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.y).toBe(100);
    expect(next.template.elements.find((element) => element.id === "page-1-box-3")?.frame.y).toBe(100);
  });

  it("ignores locked objects during alignment", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-box-3", "page-1-box-locked"],
      alignment: "align-left",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-locked")?.frame.x).toBe(280);
    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.x).toBe(40);
  });

  it("keeps single-object alignment as a clean no-op", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-2"],
      alignment: "align-left",
    });

    expect(next.changedIds).toEqual([]);
    expect(next.template).toBe(template);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame).toEqual({ x: 120, y: 60, width: 40, height: 40 });
  });

  it("aligns objects from multiple layers on the same page in the shared page coordinate space", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-1-layer-b-box"],
      alignment: "align-right",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-1")?.frame.x).toBe(260);
    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.x).toBe(260);
    expect(next.template.elements.find((element) => element.id === "page-1-layer-b-box")?.frame.x).toBe(240);
    expect(next.template.elements.find((element) => element.id === "page-1-layer-b-box")?.props?.layerId).toBe("layer-b");
    expect(next.template.elements.find((element) => element.id === "page-1-layer-b-box")?.props?.layerOrder).toBe(2);
  });

  it("applies multi-page alignment independently per page and ignores pages with a single selected object", () => {
    const template = createAlignTemplate();

    const next = alignTemplateCanvasElements(template, {
      elementIds: ["page-1-box-1", "page-1-box-2", "page-2-box-1", "page-2-box-2", "page-3-box-1"],
      alignment: "align-left",
    });

    expect(next.template.elements.find((element) => element.id === "page-1-box-2")?.frame.x).toBe(40);
    expect(next.template.elements.find((element) => element.id === "page-2-box-2")?.frame.x).toBe(50);
    expect(next.template.elements.find((element) => element.id === "page-3-box-1")?.frame.x).toBe(140);
  });

  it("flips objects canonically without changing identity, page, layer or parent", () => {
    const template = createOrderTemplate();

    const flippedX = flipTemplateCanvasElements(template, {
      elementIds: ["page-1-a-2", "page-1-a-locked"],
      axis: "horizontal",
    });

    const horizontal = flippedX.template.elements.find((element) => element.id === "page-1-a-2");
    expect(horizontal?.props?.flipX).toBe(true);
    expect(horizontal?.id).toBe("page-1-a-2");
    expect(horizontal?.pageId).toBe("page-1");
    expect(horizontal?.props?.layerId).toBe("layer-a");
    expect(horizontal?.props?.layerName).toBe("Layer A");
    expect(horizontal?.frame).toEqual({ x: 120, y: 10, width: 100, height: 40 });
    expect(flippedX.template.elements.find((element) => element.id === "page-1-a-locked")?.props?.flipX).toBeUndefined();

    const flippedBack = flipTemplateCanvasElements(flippedX.template, {
      elementIds: ["page-1-a-2"],
      axis: "horizontal",
    });

    expect(flippedBack.template.elements.find((element) => element.id === "page-1-a-2")?.props?.flipX).toBe(false);

    const flippedY = flipTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1"],
      axis: "vertical",
    });

    expect(flippedY.template.elements.find((element) => element.id === "page-1-a-1")?.props?.flipY).toBe(true);
  });

  it("supports independent horizontal and vertical flip flags", () => {
    const template = createOrderTemplate();

    const flippedX = flipTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1"],
      axis: "horizontal",
    });
    const flippedBoth = flipTemplateCanvasElements(flippedX.template, {
      elementIds: ["page-1-a-1"],
      axis: "vertical",
    });

    const element = flippedBoth.template.elements.find((candidate) => candidate.id === "page-1-a-1");
    expect(element?.props?.flipX).toBe(true);
    expect(element?.props?.flipY).toBe(true);
    expect(element?.id).toBe("page-1-a-1");
    expect(element?.pageId).toBe("page-1");
    expect(element?.props?.layerId).toBe("layer-a");
  });

  it("duplicates objects within the same page and layer", () => {
    const template = createOrderTemplate();

    const next = duplicateTemplateCanvasElements(template, {
      elementIds: ["page-1-a-2", "page-2-c-1"],
    });

    expect(next.duplicatedIds).toHaveLength(2);
    expect(new Set(next.duplicatedIds).size).toBe(2);

    const duplicateA = next.duplicatedElements.find((element) => element.pageId === "page-1");
    const duplicateB = next.duplicatedElements.find((element) => element.pageId === "page-2");

    expect(duplicateA?.props?.layerId).toBe("layer-a");
    expect(duplicateB?.props?.layerId).toBe("layer-a");
    expect(duplicateA?.id).not.toBe("page-1-a-2");
    expect(duplicateB?.id).not.toBe("page-2-c-1");
    expect(duplicateA?.frame.x).toBe(132);
    expect(duplicateA?.frame.y).toBe(22);
  });

  it("deletes only unlocked selected objects", () => {
    const template = createOrderTemplate();

    const next = deleteTemplateCanvasElements(template, {
      elementIds: ["page-1-a-1", "page-1-a-locked"],
    });

    expect(next.deletedIds).toEqual(["page-1-a-1"]);
    expect(next.template.elements.some((element) => element.id === "page-1-a-1")).toBe(false);
    expect(next.template.elements.some((element) => element.id === "page-1-a-locked")).toBe(true);
  });
});

function createOrderTemplate(): TemplateSchema {
  return {
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
      {
        id: "page-2",
        name: "Page 2",
        width: 800,
        height: 600,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
    ],
    elements: [
      {
        id: "page-1-a-1",
        pageId: "page-1",
        type: "shape",
        frame: { x: 10, y: 10, width: 100, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-a-2",
        pageId: "page-1",
        type: "shape",
        frame: { x: 120, y: 10, width: 100, height: 40 },
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-a-3",
        pageId: "page-1",
        type: "shape",
        frame: { x: 230, y: 10, width: 100, height: 40 },
        rotation: 0,
        zIndex: 3,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-a-locked",
        pageId: "page-1",
        type: "shape",
        frame: { x: 340, y: 10, width: 100, height: 40 },
        rotation: 0,
        zIndex: 4,
        locked: true,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-b-1",
        pageId: "page-1",
        type: "shape",
        frame: { x: 10, y: 80, width: 100, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-b",
          layerName: "Layer B",
          layerOrder: 2,
        },
      },
      {
        id: "page-1-b-2",
        pageId: "page-1",
        type: "shape",
        frame: { x: 120, y: 80, width: 100, height: 40 },
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-b",
          layerName: "Layer B",
          layerOrder: 2,
        },
      },
      {
        id: "page-2-c-1",
        pageId: "page-2",
        type: "shape",
        frame: { x: 10, y: 10, width: 100, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-2-c-2",
        pageId: "page-2",
        type: "shape",
        frame: { x: 120, y: 10, width: 100, height: 40 },
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
    ],
  };
}

function createAlignTemplate(): TemplateSchema {
  return {
    id: "template-align",
    name: "Template align",
    version: 1,
    pages: [
      {
        id: "page-1",
        name: "Page 1",
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      {
        id: "page-2",
        name: "Page 2",
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      {
        id: "page-3",
        name: "Page 3",
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
    ],
    elements: [
      {
        id: "page-1-box-1",
        pageId: "page-1",
        type: "shape",
        frame: { x: 40, y: 20, width: 40, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-box-2",
        pageId: "page-1",
        type: "shape",
        frame: { x: 120, y: 60, width: 40, height: 40 },
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-box-3",
        pageId: "page-1",
        type: "shape",
        frame: { x: 200, y: 100, width: 40, height: 40 },
        rotation: 0,
        zIndex: 3,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-box-locked",
        pageId: "page-1",
        type: "shape",
        frame: { x: 280, y: 100, width: 40, height: 40 },
        rotation: 0,
        zIndex: 4,
        locked: true,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-1-layer-b-box",
        pageId: "page-1",
        type: "shape",
        frame: { x: 240, y: 140, width: 60, height: 50 },
        rotation: 0,
        zIndex: 5,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-b",
          layerName: "Layer B",
          layerOrder: 2,
        },
      },
      {
        id: "page-2-box-1",
        pageId: "page-2",
        type: "shape",
        frame: { x: 50, y: 200, width: 40, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-2-box-2",
        pageId: "page-2",
        type: "shape",
        frame: { x: 160, y: 220, width: 40, height: 40 },
        rotation: 0,
        zIndex: 2,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
      {
        id: "page-3-box-1",
        pageId: "page-3",
        type: "shape",
        frame: { x: 140, y: 160, width: 40, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
          layerId: "layer-a",
          layerName: "Layer A",
          layerOrder: 1,
        },
      },
    ],
  };
}

function sortedLayerIds(template: TemplateSchema, pageId: string, layerId: string) {
  return template.elements
    .filter((element) => element.pageId === pageId && element.props?.layerId === layerId)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((element) => element.id);
}
