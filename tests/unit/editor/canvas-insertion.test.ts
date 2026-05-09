import { describe, expect, it } from "vitest";

import type { CanvasInsertionContext } from "@/features/editor/schema/canvas-insertion";
import {
  createCanvasInsertionElement,
  isArcToolId,
  resolveArcGeometryDraft,
} from "@/features/editor/schema/canvas-insertion";

function createInsertionContext(
  overrides: Partial<CanvasInsertionContext> = {},
): CanvasInsertionContext {
  return {
    elementId: "element-01",
    pageId: "page-1",
    point: { x: 120, y: 180 },
    layer: {
      id: "layer-1",
      pageId: "page-1",
      name: "Content",
      order: 1,
      visible: true,
      locked: false,
    },
    ...overrides,
  };
}

describe("canvas insertion", () => {
  it("inserts a preset drop as a canonical list block", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "preset",
        payload: {
          id: "preset-01",
          label: "Expérience senior",
          token: "{experience_senior}",
          type: "EXPERIENCES",
          mappedPath: "candidate.experiences",
          repeatable: true,
          sampleItemsCount: 3,
          description: "Poste, entreprise, période et réalisations senior.",
        },
      },
      context: {
        elementId: "element-01",
        pageId: "page-1",
        point: { x: 120, y: 180 },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("list");
    expect(result.element.bindingId).toBe("candidate.experiences");
    expect(result.element.props).toMatchObject({
      selectionType: "list",
      entityType: "preset",
      kind: "preset",
      repeatable: true,
      sampleItemsCount: 3,
      presetType: "EXPERIENCES",
      token: "{experience_senior}",
      mappedPath: "candidate.experiences",
      label: "Expérience senior",
      name: "Expérience senior",
    });
  });

  it("keeps svg-backed shapes renderable in the canonical model", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "shape",
        payload: {
          id: "shape-01",
          name: "Badge premium",
          type: "badge",
          fillMode: "color",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#fff"/></svg>',
        },
      },
      context: {
        elementId: "element-02",
        pageId: "page-1",
        point: { x: 120, y: 180 },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("shape");
    expect(result.element.props).toMatchObject({
      selectionType: "shape",
      entityType: "shape",
      kind: "shape",
      shape: "rect",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#fff"/></svg>',
      label: "Badge premium",
      name: "Badge premium",
    });
  });

  it("normalizes svg-backed icons into a loadable source", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "icon",
        payload: {
          id: "icon-01",
          name: "LinkedIn",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fff"/></svg>',
        },
      },
      context: {
        elementId: "element-03",
        pageId: "page-1",
        point: { x: 220, y: 260 },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("image");
    expect(result.element.props).toMatchObject({
      selectionType: "image",
      entityType: "icon",
      kind: "icon",
      label: "LinkedIn",
      name: "LinkedIn",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fff"/></svg>',
    });
    expect(result.element.props?.src).toContain("data:image/svg+xml");
  });

  it("rejects unsupported insertion sources and invalid canvas-tool payloads", () => {
    const unsupported = createCanvasInsertionElement({
      source: {
        type: "page",
        payload: { id: "page-1" },
      },
      context: createInsertionContext(),
    });
    const missingImageSource = createCanvasInsertionElement({
      source: {
        type: "image",
        payload: {
          name: "Logo",
        },
      },
      context: createInsertionContext({ elementId: "element-image" }),
    });
    const insufficientPolygonPoints = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: {
          toolId: "polygon",
          frame: { x: 60, y: 60, width: 80, height: 80 },
          points: [0, 0, 80, 80],
        },
      },
      context: createInsertionContext({ elementId: "element-polygon" }),
    });

    expect(unsupported).toEqual({
      inserted: false,
      reason: "type_non_supporte",
      sourceType: "page",
    });
    expect(missingImageSource).toEqual({
      inserted: false,
      reason: "source_image_manquante",
      sourceType: "image",
    });
    expect(insufficientPolygonPoints).toEqual({
      inserted: false,
      reason: "points_insuffisants",
      sourceType: "canvas-tool",
    });
  });

  it("normalizes text block html into the canonical rich text model", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "text-block",
        payload: {
          name: "Présentation",
          html: "<p>Bonjour <strong>monde</strong></p>",
        },
      },
      context: createInsertionContext({ elementId: "element-text-block" }),
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("rich-text");
    expect(result.element.props).toMatchObject({
      text: "Bonjour monde",
      html: "<p>Bonjour <strong>monde</strong></p>",
      label: "Présentation",
      name: "Présentation",
    });
    expect(result.element.props?.richTextJson).toBeDefined();
  });

  it("inserts arrow tools as canonical line blocks without forcing arrowheads", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: {
          toolId: "arrows",
          frame: { x: 40, y: 60, width: 160, height: 80 },
          anchor: { x: 60, y: 80 },
          points: [20, 20, 140, 60],
          arrow: false,
        },
      },
      context: {
        elementId: "element-04",
        pageId: "page-1",
        point: { x: 120, y: 100 },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("shape");
    expect(result.element.props).toMatchObject({
      selectionType: "shape",
      entityType: "canvas-tool",
      kind: "arrows",
      shape: "line",
      arrow: false,
      points: [20, 20, 140, 60],
      label: "Ligne",
      name: "Ligne",
    });
  });

  it("inserts pie tools as closed sector blocks", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: {
          toolId: "pie",
          frame: { x: 60, y: 60, width: 80, height: 80 },
          anchor: { x: 100, y: 100 },
          points: [100, 100, 140, 100, 100, 140],
          arcType: "pie",
          arcSweep: 1,
          startAngle: 0,
          endAngle: 90,
          outerRadius: 40,
        },
      },
      context: {
        elementId: "element-pie",
        pageId: "page-1",
        point: { x: 100, y: 100 },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("shape");
    expect(result.element.frame).toMatchObject({ x: 60, y: 60, width: 80, height: 80 });
    expect(result.element.props).toMatchObject({
      selectionType: "shape",
      entityType: "canvas-tool",
      kind: "pie",
      shape: "arc",
      arcType: "pie",
      arcSweep: 1,
      startAngle: 0,
      endAngle: 90,
      label: "Camembert",
      name: "Camembert",
    });
  });

  it("applies insertion style defaults to newly created palette objects", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: {
          toolId: "rectangle",
          frame: { x: 40, y: 60, width: 120, height: 80 },
        },
      },
      context: {
        elementId: "element-defaults",
        pageId: "page-1",
        point: { x: 100, y: 100 },
        styleDefaults: {
          fill: "#112233",
          stroke: "#445566",
          strokeWidth: 3,
        },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.style).toMatchObject({
      fill: "#112233",
      stroke: "#445566",
      strokeWidth: 3,
    });
  });

  it("applies insertion style defaults to table containers", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: {
          toolId: "table",
          frame: { x: 80, y: 90, width: 220, height: 140 },
          rows: 3,
          columns: 4,
        },
      },
      context: {
        elementId: "element-table-defaults",
        pageId: "page-1",
        point: { x: 100, y: 100 },
        styleDefaults: {
          fill: "#fef3c7",
          stroke: "#92400e",
          strokeWidth: 2,
        },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.style).toMatchObject({
      fill: "#fef3c7",
      stroke: "#92400e",
      strokeWidth: 2,
    });
  });

  it("resolves center-based arc and pie geometry from three clicks", () => {
    const arcGeometry = resolveArcGeometryDraft(
      "arc",
      [
        { x: 100, y: 100 },
        { x: 140, y: 100 },
        { x: 100, y: 140 },
      ],
      null,
      { x: 100, y: 140 },
    );
    const pieGeometry = resolveArcGeometryDraft(
      "pie",
      [
        { x: 100, y: 100 },
        { x: 140, y: 100 },
        { x: 100, y: 140 },
      ],
      null,
      { x: 100, y: 140 },
    );

    expect(isArcToolId("arc")).toBe(true);
    expect(isArcToolId("pie")).toBe(true);
    expect(arcGeometry).toMatchObject({
      frame: { x: 60, y: 60, width: 80, height: 80 },
      startAngle: 0,
      endAngle: 90,
      sweep: 1,
      arcType: "open",
    });
    expect(pieGeometry).toMatchObject({
      frame: { x: 60, y: 60, width: 80, height: 80 },
      startAngle: 0,
      endAngle: 90,
      sweep: 1,
      arcType: "pie",
    });
  });

  it("resolves 2-point and 3-point arc geometry from three clicks", () => {
    const geometry2 = resolveArcGeometryDraft(
      "arc2point",
      [
        { x: 140, y: 100 },
        { x: 100, y: 140 },
        { x: 60, y: 100 },
      ],
      null,
      { x: 60, y: 100 },
    );
    const geometry3 = resolveArcGeometryDraft(
      "arc3point",
      [
        { x: 140, y: 100 },
        { x: 100, y: 140 },
        { x: 60, y: 100 },
      ],
      null,
      { x: 60, y: 100 },
    );

    expect(geometry2).toMatchObject({
      frame: { x: 60, y: 60, width: 80, height: 80 },
      startAngle: 0,
      endAngle: 180,
      sweep: 1,
      arcType: "open",
    });
    expect(geometry3).toMatchObject({
      frame: { x: 60, y: 60, width: 80, height: 80 },
      startAngle: 0,
      endAngle: 180,
      sweep: 1,
      arcType: "open",
    });
  });

  it("inserts segments tools as canonical polyline blocks", () => {
    const result = createCanvasInsertionElement({
      source: {
        type: "canvas-tool",
        payload: {
          toolId: "segments",
          frame: { x: 24, y: 32, width: 180, height: 120 },
          anchor: { x: 32, y: 48 },
          points: [32, 48, 84, 72, 160, 88],
        },
      },
      context: {
        elementId: "element-05",
        pageId: "page-1",
        point: { x: 132, y: 92 },
        layer: {
          id: "layer-1",
          pageId: "page-1",
          name: "Content",
          order: 1,
          visible: true,
          locked: false,
        },
      },
    });

    expect(result.inserted).toBe(true);
    if (!result.inserted) {
      return;
    }

    expect(result.element.type).toBe("shape");
    expect(result.element.props).toMatchObject({
      selectionType: "shape",
      entityType: "canvas-tool",
      kind: "segments",
      shape: "polyline",
      points: [0, 0, 52, 24, 128, 40],
      label: "Polyligne",
      name: "Polyligne",
    });
  });
});
