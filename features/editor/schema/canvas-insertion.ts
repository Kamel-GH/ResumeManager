import type { TemplateElement, TemplateElementStyle, TemplateElementType } from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";
import {
  DEFAULT_CANVAS_FILL_COLOR,
  DEFAULT_CANVAS_STROKE_COLOR,
  DEFAULT_CANVAS_STROKE_WIDTH,
} from "@/features/editor/schema/canvas-mutation";
import { parseRichTextHtmlToJson } from "@/features/editor/lib/rich-text-variable";

export type CanvasDropEnvelope = {
  type: string;
  payload: unknown;
};

export type CanvasToolId =
  | "pointer"
  | "selection"
  | "hand"
  | "eraser"
  | "import"
  | "arrows"
  | "curves"
  | "freehand"
  | "segments"
  | "polygon"
  | "rectangle"
  | "circle"
  | "arc"
  | "pie"
  | "arc2point"
  | "arc3point"
  | "richtext"
  | "table"
  | "more";

export type CanvasToolEnvelope = {
  type: "canvas-tool";
  payload: {
    toolId: CanvasToolId;
    frame: Rect;
    anchor?: { x: number; y: number };
    points?: number[];
    arrow?: boolean;
    arcType?: "open" | "pie";
    arcSweep?: 1 | -1;
    src?: string;
    name?: string;
    alt?: string;
    text?: string;
    html?: string;
    rows?: number;
    columns?: number;
    headerRow?: boolean;
    width?: number;
    height?: number;
    startAngle?: number;
    endAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
  };
};

export type CanvasToolDraft = {
  toolId: CanvasToolId;
  pageId: string;
  start: { x: number; y: number };
  current: { x: number; y: number };
  frame: Rect;
  points?: { x: number; y: number }[];
};

export type CanvasCreationEnvelope = CanvasDropEnvelope | CanvasToolEnvelope;

export type CanvasWorkspaceLayer = {
  id: string;
  pageId: string;
  name: string;
  order: number;
  visible: boolean;
  locked: boolean;
};

export type CanvasInsertionContext = {
  elementId: string;
  pageId: string;
  point: { x: number; y: number };
  layer: CanvasWorkspaceLayer;
  frame?: Rect;
  styleDefaults?: TemplateElementStyle;
};

export type CanvasInsertionResult =
  | {
      inserted: true;
      element: TemplateElement;
      layer: CanvasWorkspaceLayer;
    }
  | {
      inserted: false;
      reason: string;
      sourceType: string;
    };

const DEFAULT_TEXT_STYLE: TemplateElementStyle = {
  fontFamily: "Inter",
  fontSize: 14,
  color: "#0f172a",
  lineHeight: 1.25,
};

type CanvasShapeKind = "circle" | "ellipse" | "line" | "rect" | "polygon" | "polyline" | "curve" | "arc";

export function createCanvasInsertionElement(input: {
  source: CanvasCreationEnvelope;
  context: CanvasInsertionContext;
}): CanvasInsertionResult {
  const sourceType = input.source.type;
  const rawPayload = asRecord(input.source.payload);

  if (!rawPayload) {
    return unsupported(sourceType, "payload_invalide");
  }

  if (sourceType === "layer" || sourceType === "object" || sourceType === "page") {
    return unsupported(sourceType, "type_non_supporte");
  }

  const selectionType = resolveSelectionType(sourceType);
  if (!selectionType) {
    return unsupported(sourceType, "type_non_supporte");
  }

  const { context } = input;
  const pageId = context.pageId;
  const layer = context.layer;
  const frame = buildFrame(sourceType, rawPayload, context.point, context.frame);

  if (sourceType === "canvas-tool") {
    return createCanvasToolInsertionElement(
      input as { source: CanvasToolEnvelope; context: CanvasInsertionContext },
      rawPayload,
      frame,
    );
  }

  if (sourceType === "image" || sourceType === "icon") {
    const svg = asString(rawPayload.svg);
    const src = normalizeRenderableSvgSource(asString(rawPayload.src) ?? svg);
    if (!src) {
      return unsupported(sourceType, "source_image_manquante");
    }

    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "image",
        style: sourceType === "icon" ? { opacity: 1 } : undefined,
        props: {
          selectable: true,
          selectionType,
          entityType: sourceType,
          kind: sourceType,
          label: asString(rawPayload.name) ?? asString(rawPayload.label) ?? sourceType,
          name: asString(rawPayload.name) ?? asString(rawPayload.label) ?? sourceType,
          src,
          ...(svg ? { svg } : {}),
          alt: asString(rawPayload.name) ?? asString(rawPayload.label) ?? sourceType,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (sourceType === "shape") {
    const shape = resolveShapeKind(rawPayload);
    const normalizedPoints = normalizePoints(asNumberArray(rawPayload.points), frame);
    const svg = asString(rawPayload.svg);
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "shape",
        style: {
          ...resolveShapeStyle(rawPayload, shape, input.context.styleDefaults),
          ...(shape === "line" || shape === "polyline" || shape === "curve" || shape === "arc" ? {} : {}),
        },
        props: {
          selectable: true,
          selectionType,
          entityType: sourceType,
          kind: sourceType,
          shape,
          ...(svg ? { svg } : {}),
          ...(normalizedPoints ? { points: normalizedPoints } : {}),
          ...(asString(rawPayload.presetId) ? { presetId: asString(rawPayload.presetId) } : {}),
          ...(asString(rawPayload.presetKind) ? { presetKind: asString(rawPayload.presetKind) } : {}),
          label: asString(rawPayload.name) ?? asString(rawPayload.label) ?? sourceType,
          name: asString(rawPayload.name) ?? asString(rawPayload.label) ?? sourceType,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (sourceType === "emoji") {
    const emoji = asString(rawPayload.emoji) ?? "🙂";
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "text",
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 30,
          lineHeight: 1,
        },
        props: {
          selectable: true,
          selectionType,
          entityType: sourceType,
          kind: sourceType,
          text: emoji,
          label: asString(rawPayload.name) ?? emoji,
          name: asString(rawPayload.name) ?? emoji,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (sourceType === "text-block") {
    const text = resolveTextBlockText(rawPayload);
    const html = asString(rawPayload.html) ?? asString(rawPayload.preview) ?? text;
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "rich-text",
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 13,
          lineHeight: 1.35,
          ...resolveContainerStyleDefaults(input.context.styleDefaults),
        },
        props: {
          selectable: true,
          selectionType,
          entityType: sourceType,
          kind: sourceType,
          text,
          html,
          richTextJson: parseRichTextHtmlToJson(html),
          richTextDisplayMode: "label",
          label: asString(rawPayload.name) ?? text,
          name: asString(rawPayload.name) ?? text,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (sourceType === "preset" || sourceType === "dynamic-preset") {
    const presetType = asString(rawPayload.type) ?? "CUSTOM";
    const mappedPath = asString(rawPayload.mappedPath) ?? asString(rawPayload.token) ?? presetType;
    const token = asString(rawPayload.token) ?? asString(rawPayload.label) ?? mappedPath;
    const sampleItemsCount = clampNumber(Math.round(asNumber(rawPayload.sampleItemsCount) ?? 3), 1, 12);

    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "list",
        style: {
          fill: input.context.styleDefaults?.fill ?? "rgba(255, 255, 255, 0.96)",
          stroke: input.context.styleDefaults?.stroke ?? "#cbd5e1",
          strokeWidth: input.context.styleDefaults?.strokeWidth ?? 1,
          cornerRadius: 4,
          opacity: 1,
        },
        props: {
          selectable: true,
          selectionType: "list",
          entityType: sourceType,
          kind: sourceType,
          repeatable: asBoolean(rawPayload.repeatable) ?? true,
          sampleItemsCount,
          presetType,
          token,
          mappedPath,
          description: asString(rawPayload.description) ?? "",
          label: asString(rawPayload.label) ?? token,
          name: asString(rawPayload.label) ?? token,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
        bindingId: mappedPath,
      }),
    };
  }

  if (sourceType === "variable") {
    const token = asString(rawPayload.token) ?? asString(rawPayload.label) ?? "[Variable]";
    const sampleValue = asString(rawPayload.sampleValue) ?? token;
    const type = asString(rawPayload.type) ?? "TEXTE";

    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "text",
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: type === "IMAGE" ? 12 : 14,
        },
        props: {
          selectable: true,
          selectionType,
          entityType: sourceType,
          kind: sourceType,
          text: token,
          sampleValue,
          variableType: type,
          bindingId: token,
          label: asString(rawPayload.label) ?? token,
          name: asString(rawPayload.label) ?? token,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  return unsupported(sourceType, "type_non_supporte");
}

function createCanvasToolInsertionElement(
  input: { source: CanvasToolEnvelope; context: CanvasInsertionContext },
  payload: Record<string, unknown>,
  frame: Rect,
): CanvasInsertionResult {
  const { toolId } = input.source.payload;
  const layer = input.context.layer;
  const pageId = input.context.pageId;

  if (toolId === "rectangle") {
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "shape",
        style: resolveShapeStyle(payload, "rect", input.context.styleDefaults),
        props: {
          selectable: true,
          selectionType: "shape",
          entityType: "canvas-tool",
          kind: toolId,
          shape: "rect",
          label: "Rectangle",
          name: "Rectangle",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "circle") {
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "shape",
        style: resolveShapeStyle(payload, "ellipse", input.context.styleDefaults),
        props: {
          selectable: true,
          selectionType: "shape",
          entityType: "canvas-tool",
          kind: toolId,
          shape: "ellipse",
          label: "Ellipse",
          name: "Ellipse",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "arc" || toolId === "pie" || toolId === "arc2point" || toolId === "arc3point") {
    const arcGeometry = resolveArcGeometryDraft(
      toolId as ArcToolId,
      flatPointsToPointList(asNumberArray(payload.points)),
      asPoint(payload.anchor),
      asPoint(payload.current),
    );

    const fallbackFrame = frame;
    const resolvedFrame = arcGeometry?.frame ?? fallbackFrame;
    const arcType = asString(payload.arcType) === "pie" || toolId === "pie" ? "pie" : "open";
    const startAngle = asNumber(payload.startAngle) ?? arcGeometry?.startAngle;
    const endAngle = asNumber(payload.endAngle) ?? arcGeometry?.endAngle;
    const arcSweep = (asNumber(payload.arcSweep) as 1 | -1 | undefined) ?? arcGeometry?.sweep ?? 1;
    const outerRadius = asNumber(payload.outerRadius) ?? arcGeometry?.radius ?? Math.max(Math.min(resolvedFrame.width, resolvedFrame.height) / 2, 1);
    const label =
      asString(payload.name) ??
      asString(payload.label) ??
      (toolId === "pie" ? "Camembert" : toolId === "arc2point" ? "Arc 2 points" : toolId === "arc3point" ? "Arc 3 points" : "Arc");

    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame: resolvedFrame,
        type: "shape",
        style: arcType === "pie" ? resolvePieShapeStyle(payload, input.context.styleDefaults) : resolveShapeStyle(payload, "arc", input.context.styleDefaults),
        props: {
          selectable: true,
          selectionType: "shape",
          entityType: "canvas-tool",
          kind: toolId,
          shape: "arc",
          arcType,
          arcSweep,
          startAngle: startAngle ?? 0,
          endAngle: endAngle ?? 180,
          innerRadius: asNumber(payload.innerRadius) ?? 0,
          outerRadius,
          ...(asString(payload.presetId) ? { presetId: asString(payload.presetId) } : {}),
          label,
          name: label,
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "polygon" || toolId === "freehand" || toolId === "curves") {
    const points = normalizePoints(asNumberArray(payload.points), frame);
    if (!points || points.length < (toolId === "polygon" ? 6 : 4)) {
      return unsupported("canvas-tool", "points_insuffisants");
    }

    const shape = toolId === "polygon" ? "polygon" : toolId === "curves" ? "curve" : "polyline";
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "shape",
        style: resolveShapeStyle(payload, shape, input.context.styleDefaults),
        props: {
          selectable: true,
          selectionType: "shape",
          entityType: "canvas-tool",
          kind: toolId,
          shape,
          ...(points ? { points } : {}),
          ...(shape === "polygon" ? { closed: true } : {}),
          ...(shape === "curve" ? { tension: 0.5 } : {}),
          label: shape === "polygon" ? "Polygone" : shape === "curve" ? "Courbe" : "Polyline",
          name: shape === "polygon" ? "Polygone" : shape === "curve" ? "Courbe" : "Polyline",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "arrows") {
    const points = asNumberArray(payload.points) ?? [0, 0, Math.max(frame.width, 1), Math.max(frame.height, 1)];
    const arrow = asBoolean(payload.arrow) ?? false;
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "shape",
        style: resolveShapeStyle(payload, "line", input.context.styleDefaults),
        props: {
          selectable: true,
          selectionType: "shape",
          entityType: "canvas-tool",
          kind: toolId,
          shape: "line",
          arrow,
          points,
          label: "Ligne",
          name: "Ligne",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "segments") {
    const points = normalizePoints(asNumberArray(payload.points), frame);
    if (!points || points.length < 4) {
      return unsupported("canvas-tool", "points_insuffisants");
    }

    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "shape",
        style: resolveShapeStyle(payload, "polyline", input.context.styleDefaults),
        props: {
          selectable: true,
          selectionType: "shape",
          entityType: "canvas-tool",
          kind: toolId,
          shape: "polyline",
          points,
          label: "Polyligne",
          name: "Polyligne",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "richtext") {
    const html = asString(payload.html) ?? "<p>Double-cliquez pour éditer</p>";
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "rich-text",
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 14,
          lineHeight: 1.3,
          fill: "rgba(255, 255, 255, 0.02)",
          stroke: "#cbd5e1",
          strokeWidth: 1,
          opacity: 1,
        },
        props: {
          selectable: true,
          selectionType: "richText",
          entityType: "canvas-tool",
          kind: toolId,
          text: asString(payload.text) ?? "Double-cliquez pour éditer",
          html,
          richTextJson: parseRichTextHtmlToJson(html),
          richTextDisplayMode: "label",
          label: "Zone rich text",
          name: "Zone rich text",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "table") {
    const rows = Math.max(2, Math.round(asNumber(payload.rows) ?? 3));
    const columns = Math.max(2, Math.round(asNumber(payload.columns) ?? 3));
    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "table",
        style: {
          fill: input.context.styleDefaults?.fill ?? "#ffffff",
          stroke: input.context.styleDefaults?.stroke ?? "#cbd5e1",
          strokeWidth: input.context.styleDefaults?.strokeWidth ?? 1,
          opacity: 1,
        },
        props: {
          selectable: true,
          selectionType: "table",
          entityType: "canvas-tool",
          kind: toolId,
          rows,
          columns,
          headerRow: asBoolean(payload.headerRow) ?? true,
          label: "Tableau",
          name: "Tableau",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  if (toolId === "import") {
    const src = asString(payload.src) ?? asString(payload.preview) ?? asString(payload.dataUrl);
    if (!src) {
      return unsupported("canvas-tool", "source_image_manquante");
    }

    return {
      inserted: true,
      layer,
      element: makeElement({
        id: input.context.elementId,
        pageId,
        frame,
        type: "image",
        props: {
          selectable: true,
          selectionType: "image",
          entityType: "canvas-tool",
          kind: toolId,
          src,
          alt: asString(payload.alt) ?? asString(payload.name) ?? "Image",
          label: asString(payload.name) ?? "Image",
          name: asString(payload.name) ?? "Image",
          layerId: layer.id,
          layerName: layer.name,
          layerOrder: layer.order,
          layerVisible: layer.visible,
          layerLocked: layer.locked,
        },
      }),
    };
  }

  return unsupported("canvas-tool", "outil_non_supporte");
}

function buildFrame(sourceType: string, payload: Record<string, unknown>, point: { x: number; y: number }, frame?: Rect) {
  if (frame) {
    return frame;
  }

  const rawPoints = asNumberArray(payload.points);
  if (rawPoints && rawPoints.length >= 4) {
    return boundsFromFlatPoints(rawPoints);
  }

  const width = resolveWidth(sourceType, payload);
  const height = resolveHeight(sourceType, payload, width);
  return {
    x: Math.max(0, point.x - width / 2),
    y: Math.max(0, point.y - height / 2),
    width,
    height,
  };
}

function resolveWidth(sourceType: string, payload: Record<string, unknown>): number {
  if (sourceType === "image") {
    return clampNumber(asNumber(payload.width) ?? 180, 80, 320);
  }

  if (sourceType === "preset" || sourceType === "dynamic-preset") {
    const labelLength = (asString(payload.label) ?? asString(payload.token) ?? "Preset").length;
    return clampNumber(labelLength * 7 + 180, 220, 360);
  }

  if (sourceType === "icon") {
    return 28;
  }

  if (sourceType === "emoji") {
    return 34;
  }

  if (sourceType === "text-block") {
    return clampNumber((asString(payload.name)?.length ?? 0) * 10 + 120, 160, 260);
  }

  if (sourceType === "variable") {
    return clampNumber((asString(payload.token)?.length ?? 0) * 8 + 120, 150, 240);
  }

  if (sourceType === "shape") {
    const explicitWidth = asNumber(payload.width);
    if (explicitWidth) {
      return clampNumber(explicitWidth, 8, 360);
    }

    const shapeType = asString(payload.type)?.toLowerCase() ?? "";
    if (shapeType.includes("circle") || shapeType.includes("oval")) {
      return shapeType.includes("oval") ? 72 : 56;
    }

    if (shapeType.includes("star") || shapeType.includes("triangle") || shapeType.includes("diamond") || shapeType.includes("pentagon") || shapeType.includes("hexagon") || shapeType.includes("bubble") || shapeType.includes("badge") || shapeType.includes("rounded") || shapeType.includes("heart")) {
      return 72;
    }

    if (shapeType.includes("line") || shapeType.includes("separator") || shapeType.includes("arrow")) {
      return 140;
    }

    if (shapeType.includes("polygon") || shapeType.includes("curve") || shapeType.includes("polyline") || shapeType.includes("arc")) {
      return 120;
    }
  }

  return 120;
}

function resolveHeight(sourceType: string, payload: Record<string, unknown>, width: number): number {
  if (sourceType === "image") {
    const originalWidth = asNumber(payload.width) ?? width;
    const originalHeight = asNumber(payload.height) ?? width;
    const ratio = originalHeight / Math.max(originalWidth, 1);
    return clampNumber(Math.round(width * ratio), 80, 320);
  }

  if (sourceType === "preset" || sourceType === "dynamic-preset") {
    const sampleItemsCount = clampNumber(Math.round(asNumber(payload.sampleItemsCount) ?? 3), 1, 12);
    return clampNumber(sampleItemsCount * 28 + 52, 96, 320);
  }

  if (sourceType === "icon") {
    return 28;
  }

  if (sourceType === "emoji") {
    return 34;
  }

  if (sourceType === "text-block") {
    return 72;
  }

  if (sourceType === "variable") {
    return 36;
  }

  if (sourceType === "shape") {
    const explicitHeight = asNumber(payload.height);
    if (explicitHeight) {
      return clampNumber(explicitHeight, 8, 360);
    }

    const shapeType = asString(payload.type)?.toLowerCase() ?? "";
    if (shapeType.includes("circle") || shapeType.includes("oval")) {
      return shapeType.includes("oval") ? 48 : 56;
    }

    if (shapeType.includes("star") || shapeType.includes("triangle") || shapeType.includes("diamond") || shapeType.includes("pentagon") || shapeType.includes("hexagon") || shapeType.includes("bubble") || shapeType.includes("badge") || shapeType.includes("rounded") || shapeType.includes("heart")) {
      return 72;
    }

    if (shapeType.includes("line") || shapeType.includes("separator") || shapeType.includes("arrow")) {
      return 16;
    }

    if (shapeType.includes("polygon") || shapeType.includes("curve") || shapeType.includes("polyline") || shapeType.includes("arc")) {
      return 80;
    }
  }

  return 80;
}

function resolveShapeKind(payload: Record<string, unknown>): CanvasShapeKind {
  const type = asString(payload.type)?.toLowerCase() ?? "";
  if (type.includes("circle") || type.includes("oval")) {
    return type.includes("oval") ? "ellipse" : "circle";
  }

  if (type.includes("line") || type.includes("separator") || type.includes("arrow")) {
    return "line";
  }

  if (type.includes("polygon")) {
    return "polygon";
  }

  if (type.includes("polyline") || type.includes("curve")) {
    return type.includes("curve") ? "curve" : "polyline";
  }

  if (type.includes("arc")) {
    return "arc";
  }

  return "rect";
}

function resolveShapeStyle(payload: Record<string, unknown>, shape: CanvasShapeKind, styleDefaults?: TemplateElementStyle): TemplateElementStyle {
  const fillMode = asString(payload.fillMode)?.toLowerCase() ?? "color";
  const accent = fillMode === "mono" ? "#e5e7eb" : fillMode === "transparent" ? "transparent" : styleDefaults?.fill ?? DEFAULT_CANVAS_FILL_COLOR;
  const stroke = styleDefaults?.stroke ?? DEFAULT_CANVAS_STROKE_COLOR;
  const defaultStrokeWidth = asNumber(payload.strokeWidth) ?? styleDefaults?.strokeWidth ?? (shape === "rect" ? 1 : DEFAULT_CANVAS_STROKE_WIDTH);

  if (shape === "line" || shape === "polyline" || shape === "curve" || shape === "arc") {
    const dash = asNumberArray(payload.dash);
    return {
      fill: "transparent",
      stroke,
      strokeWidth: defaultStrokeWidth,
      opacity: 1,
      ...(dash ? { dash } : {}),
    };
  }

  if (shape === "polygon") {
    const dash = asNumberArray(payload.dash);
    return {
      fill: accent,
      stroke,
      strokeWidth: defaultStrokeWidth,
      opacity: 1,
      ...(dash ? { dash } : {}),
    };
  }

  return shape === "circle" || shape === "ellipse"
    ? {
        fill: accent,
        stroke,
        strokeWidth: defaultStrokeWidth,
        opacity: 1,
      }
    : {
        fill: accent,
        stroke,
        strokeWidth: defaultStrokeWidth,
        cornerRadius: clampNumber(asNumber(payload.cornerRadius) ?? 8, 0, 999),
        opacity: 1,
      };
}

function resolvePieShapeStyle(payload: Record<string, unknown>, styleDefaults?: TemplateElementStyle): TemplateElementStyle {
  const fillMode = asString(payload.fillMode)?.toLowerCase() ?? "color";
  const fill = fillMode === "transparent" ? "transparent" : fillMode === "mono" ? "#e5e7eb" : styleDefaults?.fill ?? DEFAULT_CANVAS_FILL_COLOR;

  return {
    fill,
    stroke: styleDefaults?.stroke ?? DEFAULT_CANVAS_STROKE_COLOR,
    strokeWidth: styleDefaults?.strokeWidth ?? DEFAULT_CANVAS_STROKE_WIDTH,
    opacity: 1,
  };
}

function resolveContainerStyleDefaults(styleDefaults?: TemplateElementStyle): TemplateElementStyle {
  if (!styleDefaults) {
    return {};
  }

  return {
    fill: styleDefaults.fill,
    stroke: styleDefaults.stroke,
    strokeWidth: styleDefaults.strokeWidth,
    opacity: styleDefaults.opacity,
  };
}

function resolveTextBlockText(payload: Record<string, unknown>): string {
  const preview = asString(payload.preview) ?? "";
  const html = asString(payload.html) ?? "";
  const fallback = asString(payload.name) ?? "Bloc texte";
  const text = preview || stripHtml(html) || fallback;
  return text.replaceAll("<br>", "\n");
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeRenderableSvgSource(source: string | undefined): string | undefined {
  if (!source) {
    return undefined;
  }

  const trimmed = source.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("<svg")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

function makeElement(input: {
  id: string;
  pageId: string;
  frame: TemplateElement["frame"];
  type: TemplateElementType;
  props: TemplateElement["props"];
  style?: TemplateElementStyle;
  bindingId?: string;
}): TemplateElement {
  const props = input.props ?? {};

  return {
    id: input.id,
    pageId: input.pageId,
    type: input.type,
    frame: input.frame,
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    bindingId: input.bindingId ?? asString(props.bindingId),
    props,
    style: input.style,
  };
}

function resolveSelectionType(sourceType: string): string | null {
  switch (sourceType) {
    case "preset":
    case "dynamic-preset":
      return "list";
    case "variable":
      return "variable";
    case "image":
      return "image";
    case "shape":
      return "shape";
    case "icon":
      return "image";
    case "emoji":
      return "text";
    case "text-block":
      return "richText";
    case "canvas-tool":
      return "shape";
    default:
      return null;
  }
}

function unsupported(sourceType: string, reason: string): CanvasInsertionResult {
  return {
    inserted: false,
    reason,
    sourceType,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asNumberArray(value: unknown): number[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined;
}

function normalizePoints(points: number[] | undefined, frame: Rect): number[] | undefined {
  if (!points || points.length < 4) {
    return points;
  }

  const normalized: number[] = [];
  for (let index = 0; index < points.length; index += 2) {
    const x = points[index];
    const y = points[index + 1];
    if (typeof x !== "number" || typeof y !== "number") {
      continue;
    }

    normalized.push(x - frame.x, y - frame.y);
  }

  return normalized.length >= 4 ? normalized : points;
}

function boundsFromFlatPoints(points: number[]): Rect {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index < points.length; index += 2) {
    const x = points[index];
    const y = points[index + 1];
    if (typeof x !== "number" || typeof y !== "number") {
      continue;
    }
    xs.push(x);
    ys.push(y);
  }

  if (xs.length === 0 || ys.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type ArcToolId = "arc" | "pie" | "arc2point" | "arc3point";

export type ArcGeometry = {
  frame: Rect;
  center: { x: number; y: number };
  radius: number;
  startAngle: number;
  endAngle: number;
  sweep: 1 | -1;
  arcType: "open" | "pie";
};

export function isArcToolId(toolId: CanvasToolId): toolId is ArcToolId {
  return toolId === "arc" || toolId === "pie" || toolId === "arc2point" || toolId === "arc3point";
}

export function resolveArcGeometryDraft(
  toolId: ArcToolId,
  points: Array<{ x: number; y: number }> | undefined,
  anchor?: { x: number; y: number } | null,
  current?: { x: number; y: number } | null,
): ArcGeometry | null {
  const clickPoints = (points ?? []).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const arcType = toolId === "pie" ? "pie" : "open";

  if (toolId === "arc" || toolId === "pie") {
    const center = clickPoints[0] ?? anchor ?? current ?? null;
    if (clickPoints.length < 2) {
      return null;
    }

    const startPoint = clickPoints[1] ?? current ?? null;
    const endPoint = clickPoints[2] ?? current ?? null;
    if (!center || !startPoint || !endPoint) {
      return null;
    }

    const radius = Math.max(distance(center, startPoint), 1);
    const startAngle = angleDegrees(center, startPoint);
    const endAngle = startAngle + shortestSignedAngleDelta(startAngle, angleDegrees(center, endPoint));
    return {
      frame: squareFrameFromCenter(center, radius),
      center,
      radius,
      startAngle,
      endAngle,
      sweep: endAngle >= startAngle ? 1 : -1,
      arcType,
    };
  }

  const p1 = clickPoints[0] ?? anchor ?? null;
  const p2 = clickPoints[1] ?? current ?? null;
  const p3 = clickPoints[2] ?? current ?? null;
  if (!p1 || !p2 || !p3) {
    return null;
  }

  const center = circumcenter(p1, p2, p3);
  if (!center) {
    return null;
  }

  const radius = Math.max(distance(center, p1), 1);
  const startAngle = angleDegrees(center, p1);
  const midAngle = angleDegrees(center, p2);
  const endAngleRaw = angleDegrees(center, p3);
  const forwardDelta = positiveAngleDelta(startAngle, endAngleRaw);
  const midDelta = positiveAngleDelta(startAngle, midAngle);
  const reverseDelta = -positiveAngleDelta(endAngleRaw, startAngle);
  const delta = midDelta <= forwardDelta + 0.01 ? forwardDelta : reverseDelta;
  const endAngle = startAngle + delta;

  return {
    frame: squareFrameFromCenter(center, radius),
    center,
    radius,
    startAngle,
    endAngle,
    sweep: endAngle >= startAngle ? 1 : -1,
    arcType,
  };
}

function squareFrameFromCenter(center: { x: number; y: number }, radius: number): Rect {
  return {
    x: center.x - radius,
    y: center.y - radius,
    width: radius * 2,
    height: radius * 2,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angleDegrees(center: { x: number; y: number }, point: { x: number; y: number }) {
  const radians = Math.atan2(point.y - center.y, point.x - center.x);
  return normalizeAngleDegrees((radians * 180) / Math.PI);
}

function normalizeAngleDegrees(angle: number) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function positiveAngleDelta(from: number, to: number) {
  return normalizeAngleDegrees(to - from);
}

function shortestSignedAngleDelta(from: number, to: number) {
  const positive = positiveAngleDelta(from, to);
  return positive > 180 ? positive - 360 : positive;
}

function circumcenter(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) {
    return null;
  }

  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const x = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const y = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

function asPoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const x = asNumber(record.x);
  const y = asNumber(record.y);
  if (typeof x !== "number" || typeof y !== "number") {
    return null;
  }

  return { x, y };
}

function flatPointsToPointList(value: number[] | undefined): Array<{ x: number; y: number }> | undefined {
  if (!value) {
    return undefined;
  }

  const points: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < value.length; index += 2) {
    const x = value[index];
    const y = value[index + 1];
    if (typeof x === "number" && typeof y === "number") {
      points.push({ x, y });
    }
  }

  return points.length > 0 ? points : undefined;
}
