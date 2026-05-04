import { describe, expect, it } from "vitest";

import {
  buildDeleteOperationLogs,
  buildGeometryOperationLogs,
  buildInsertOperationLog,
  buildStyleOperationLogs,
  buildTraceOperationLog,
  formatOperationAction,
  formatOperationSnapshot,
  formatOperationSnapshotOrDeleted,
} from "@/features/editor/schema/editor-operation-log";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

describe("editor operation log", () => {
  it("classifies a pure rotation as a rotation and keeps frame snapshots readable", () => {
    const beforeTemplate: TemplateSchema = {
      id: "template-1",
      name: "Template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 800,
          height: 600,
          margin: { top: 40, right: 40, bottom: 40, left: 40 },
        },
      ],
      elements: [
        {
          id: "image-1",
          pageId: "page-1",
          type: "image",
          frame: { x: 120, y: 80, width: 200, height: 120 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            src: "data:image/png;base64,AAA",
            selectable: true,
          },
        },
      ],
    };

    const afterTemplate: TemplateSchema = {
      ...beforeTemplate,
      elements: [
        {
          ...beforeTemplate.elements[0],
          rotation: 90,
        },
      ],
    };

    const [entry] = buildGeometryOperationLogs({
      beforeTemplate,
      afterTemplate,
      pageId: "page-1",
      patches: [
        {
          id: "image-1",
          frame: { x: 120, y: 80, width: 200, height: 120 },
          rotation: 90,
        },
      ],
      timestamp: 1_700_000_000_000,
    });

    expect(entry?.action).toBe("rotate");
    expect(formatOperationAction(entry?.action ?? "transform")).toBe("Rotation");
    expect(formatOperationSnapshot(entry?.after ?? { id: "x", pageId: "page-1", frame: { x: 0, y: 0, width: 0, height: 0 }, rotation: 0 })).toBe("x=120, y=80, w=200, h=120, rot=90");
  });

  it("builds an insert log with a null before snapshot", () => {
    const log = buildInsertOperationLog({
      pageId: "page-1",
      element: {
        id: "shape-1",
        pageId: "page-1",
        type: "shape",
        frame: { x: 10, y: 20, width: 30, height: 40 },
        rotation: 0,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          shape: "rect",
          selectable: true,
        },
      },
      timestamp: 1_700_000_000_001,
    });

    expect(log.action).toBe("insert");
    expect(log.before).toBeNull();
    expect(log.after).not.toBeNull();
    expect(log.after?.frame).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });

  it("builds a delete log with a deleted after snapshot", () => {
    const beforeTemplate: TemplateSchema = {
      id: "template-1",
      name: "Template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 800,
          height: 600,
          margin: { top: 40, right: 40, bottom: 40, left: 40 },
        },
      ],
      elements: [
        {
          id: "shape-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 10, y: 20, width: 30, height: 40 },
          rotation: 5,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
          },
        },
      ],
    };

    const afterTemplate: TemplateSchema = {
      ...beforeTemplate,
      elements: [],
    };

    const [log] = buildDeleteOperationLogs({
      beforeTemplate,
      afterTemplate,
      elementIds: ["shape-1"],
      timestamp: 1_700_000_000_002,
    });

    expect(log?.action).toBe("delete");
    expect(log?.before?.frame).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    expect(formatOperationSnapshotOrDeleted(log?.after ?? null)).toBe("Supprimé");
  });

  it("builds a drag trace log with structured details", () => {
    const log = buildTraceOperationLog({
      action: "dragstart",
      pageId: "page-1",
      elementId: "preset:experience_senior",
      details: [
        { label: "Phase", value: "dragstart" },
        { label: "Type", value: "preset" },
        { label: "Label", value: "Expérience senior" },
      ],
      timestamp: 1_700_000_000_003,
    });

    expect(log.action).toBe("dragstart");
    expect(formatOperationAction(log.action)).toBe("Début drag");
    expect(log.before).toBeNull();
    expect(log.after).toBeNull();
    expect(log.details).toEqual([
      { label: "Phase", value: "dragstart" },
      { label: "Type", value: "preset" },
      { label: "Label", value: "Expérience senior" },
    ]);
  });

  it("builds a style log with changed style details", () => {
    const beforeTemplate: TemplateSchema = {
      id: "template-1",
      name: "Template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 800,
          height: 600,
          margin: { top: 40, right: 40, bottom: 40, left: 40 },
        },
      ],
      elements: [
        {
          id: "shape-1",
          pageId: "page-1",
          type: "shape",
          frame: { x: 10, y: 20, width: 30, height: 40 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          props: {
            shape: "rect",
            selectable: true,
          },
          style: {
            fill: "#ffffff",
            stroke: "#cbd5e1",
            strokeWidth: 1,
            opacity: 1,
          },
        },
      ],
    };

    const afterTemplate: TemplateSchema = {
      ...beforeTemplate,
      elements: [
        {
          ...beforeTemplate.elements[0],
          style: {
            fill: "#ff0000",
            stroke: "#111111",
            strokeWidth: 3,
            opacity: 0.5,
          },
        },
      ],
    };

    const [log] = buildStyleOperationLogs({
      beforeTemplate,
      afterTemplate,
      patches: [
        {
          id: "shape-1",
          style: {
            fill: "#ff0000",
            stroke: "#111111",
            strokeWidth: 3,
            opacity: 0.5,
          },
        },
      ],
      timestamp: 1_700_000_000_004,
    });

    expect(log?.action).toBe("style");
    expect(formatOperationAction(log?.action ?? "transform")).toBe("Style");
    expect(log?.details).toEqual([
      { label: "Fond", value: "#ffffff → #ff0000" },
      { label: "Contour", value: "#cbd5e1 → #111111" },
      { label: "Trait", value: "1 → 3" },
      { label: "Opacité", value: "1 → 0.5" },
    ]);
  });
});
