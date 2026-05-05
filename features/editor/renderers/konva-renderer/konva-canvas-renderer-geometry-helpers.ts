import Konva from "konva";
import type { CSSProperties } from "react";
import type { JSONContent } from "@tiptap/core";

import type { ImageEditingState } from "@/features/editor/components/image-editing/image-editor-types";
import { getFilterPresetValues, hasImageMaskBorderChanges, resolveImageMaskFrame } from "@/features/editor/components/image-editing/image-editor-utils";
import { serializeRichTextJsonToHtml, type RichTextVariableDisplayMode } from "@/features/editor/lib/rich-text-variable";
import type { RenderNode } from "@/features/editor/schema/render-tree";
import type { WorkspacePageLayout, WorkspaceViewport } from "@/features/editor/schema/workspace-layout";
import { convertClientPointToWorkspacePoint } from "@/features/editor/schema/workspace-layout";
import { isSelectableNode, resolveCanonicalFrameFromProjectedGeometry } from "@/features/editor/renderers/konva-renderer/konva-renderer-model";

export const ALL_TRANSFORM_ANCHORS = ["top-left", "top-center", "top-right", "middle-right", "middle-left", "bottom-left", "bottom-center", "bottom-right"] as const;

export function getNextSelectionIds(input: {
  currentSelection: string[];
  renderNodeById: Map<string, { node: RenderNode; pageId: string }>;
  elementIds: string[];
  additive: boolean;
}) {
  if (!input.additive) {
    return input.elementIds;
  }

  const currentPageId = input.currentSelection
    .map((id) => input.renderNodeById.get(id)?.pageId)
    .find((pageId): pageId is string => Boolean(pageId));

  const targetPageIds = new Set(
    input.elementIds.map((id) => input.renderNodeById.get(id)?.pageId).filter((pageId): pageId is string => Boolean(pageId)),
  );

  if (currentPageId && targetPageIds.size > 0 && (!targetPageIds.has(currentPageId) || targetPageIds.size > 1)) {
    return input.elementIds;
  }

  const nextSelection = new Set(input.currentSelection);
  input.elementIds.forEach((elementId) => {
    if (nextSelection.has(elementId)) {
      nextSelection.delete(elementId);
      return;
    }

    nextSelection.add(elementId);
  });

  return [...nextSelection];
}

export function isAdditiveSelectionEvent(event: MouseEvent | PointerEvent | TouchEvent) {
  return "shiftKey" in event && (event.shiftKey || ("metaKey" in event && event.metaKey) || ("ctrlKey" in event && event.ctrlKey));
}

export function isSelectableEventTarget(target: Konva.Node) {
  return target.getAttr("selectable") === true;
}

export function isTransformableKonvaNode(node: Konva.Node) {
  return node.getAttr("selectable") === true && node.isVisible() && node.getAttr("locked") !== true;
}

export function allowsProportionalResize(node: RenderNode | null) {
  if (!node) {
    return false;
  }

  if (node.type === "image" || node.type === "rich-text" || node.type === "text") {
    return true;
  }

  if (node.type !== "shape") {
    return false;
  }

  const shape = propString(node.props, "shape");
  return shape === "rect" || shape === "circle" || shape === "ellipse" || shape === "line" || shape === "polygon" || shape === "polyline" || shape === "curve";
}

export function groupNodesByUserLayer(nodes: RenderNode[]) {
  const groups = new Map<string, { id: string; order: number; nodes: RenderNode[] }>();

  nodes.forEach((node) => {
    const descriptor = resolveNodeLayerDescriptor(node);
    const groupId = descriptor.id;
    const group = groups.get(groupId);

    if (group) {
      group.nodes.push(node);
      group.order = Math.min(group.order, descriptor.order);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      order: descriptor.order,
      nodes: [node],
    });
  });

  return [...groups.values()].sort((a, b) => a.order - b.order);
}

export function resolveNodeLayerDescriptor(node: RenderNode) {
  const layerId = propString(node.props, "layerId") ?? propString(node.props, "layerName");
  const layerName = propString(node.props, "layerName") ?? layerId ?? "default";
  const layerOrder = propNumber(node.props, "layerOrder") ?? node.zIndex;

  return {
    id: layerId ?? `layer:${layerName}`,
    name: layerName,
    order: layerOrder,
  };
}

export function resolveCommittedFrame(
  renderNode: RenderNode,
  konvaNode: Konva.Node,
  override?: Partial<{ x: number; y: number }>,
) {
  const baseFrame = renderNode.frame;
  return resolveCanonicalFrameFromProjectedGeometry(renderNode, {
    x: override?.x ?? konvaNode.x(),
    y: override?.y ?? konvaNode.y(),
    width: konvaNode.width() || baseFrame.width,
    height: konvaNode.height() || baseFrame.height,
    scaleX: konvaNode.scaleX(),
    scaleY: konvaNode.scaleY(),
  });
}

export function resolveScaledShapePoints(renderNode: RenderNode, nextFrame: { x: number; y: number; width: number; height: number }) {
  if (renderNode.type !== "shape") {
    return null;
  }

  const shape = propString(renderNode.props, "shape");
  if (shape !== "line" && shape !== "polygon" && shape !== "polyline" && shape !== "curve") {
    return null;
  }

  const sourcePoints = propNumberArray(renderNode.props, "points");
  const points = sourcePoints && sourcePoints.length >= 4 ? sourcePoints : [0, 0, renderNode.frame.width, renderNode.frame.height];
  const scaleX = renderNode.frame.width > 0 ? nextFrame.width / renderNode.frame.width : 1;
  const scaleY = renderNode.frame.height > 0 ? nextFrame.height / renderNode.frame.height : 1;

  return points.map((value, index) => (index % 2 === 0 ? value * scaleX : value * scaleY));
}

export function getRenderNodeAnchorMode(renderNode: RenderNode): "center" | "origin" {
  if (renderNode.type !== "shape") {
    return "origin";
  }

  const shape = propString(renderNode.props, "shape");
  return shape === "circle" || shape === "ellipse" ? "center" : "origin";
}

export function getRenderNodeTransformAnchorPoint(
  renderNode: RenderNode,
  anchorMode: "center" | "origin",
) {
  return anchorMode === "center"
    ? {
        x: renderNode.frame.x + renderNode.frame.width / 2,
        y: renderNode.frame.y + renderNode.frame.height / 2,
      }
    : {
        x: renderNode.frame.x,
        y: renderNode.frame.y,
      };
}

export function getElementIdsWithinSelectionRect(input: {
  selectionRect: { x: number; y: number; width: number; height: number };
  pageLayout: WorkspacePageLayout;
  renderTree: { pages: Array<{ id: string; children: RenderNode[] }> };
}) {
  const page = input.renderTree.pages.find((candidatePage) => candidatePage.id === input.pageLayout.id);
  if (!page) {
    return [];
  }

  return page.children
    .filter((node) => isSelectableNode(node) && !node.locked)
    .filter((node) => rectIntersects(input.selectionRect, translateFrameToWorkspace(node.frame, input.pageLayout)))
    .map((node) => node.id);
}

export function translateFrameToWorkspace(frame: { x: number; y: number; width: number; height: number }, pageLayout: WorkspacePageLayout) {
  return {
    x: pageLayout.x + frame.x,
    y: pageLayout.y + frame.y,
    width: frame.width,
    height: frame.height,
  };
}

export function getWorkspaceSelectionBounds(node: RenderNode, pageLayout: WorkspacePageLayout) {
  const rotation = normalizeAngle(node.rotation ?? 0);
  if (Math.abs(rotation) < 0.001) {
    return translateFrameToWorkspace(node.frame, pageLayout);
  }

  const anchorMode = getRenderNodeAnchorMode(node);
  const anchorPoint = getRenderNodeTransformAnchorPoint(node, anchorMode);
  const corners = [
    { x: node.frame.x, y: node.frame.y },
    { x: node.frame.x + node.frame.width, y: node.frame.y },
    { x: node.frame.x + node.frame.width, y: node.frame.y + node.frame.height },
    { x: node.frame.x, y: node.frame.y + node.frame.height },
  ];

  const rotatedCorners = corners.map((corner) => rotatePointAroundPoint(corner, anchorPoint, rotation));
  const minX = Math.min(...rotatedCorners.map((point) => point.x));
  const minY = Math.min(...rotatedCorners.map((point) => point.y));
  const maxX = Math.max(...rotatedCorners.map((point) => point.x));
  const maxY = Math.max(...rotatedCorners.map((point) => point.y));
  const bounds = {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };

  return translateFrameToWorkspace(bounds, pageLayout);
}

export function normalizeAngle(angle: number) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function rectIntersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function normalizeRect(frame: { x: number; y: number; width: number; height: number }) {
  return {
    x: Math.min(frame.x, frame.x + frame.width),
    y: Math.min(frame.y, frame.y + frame.height),
    width: Math.max(Math.abs(frame.width), 1),
    height: Math.max(Math.abs(frame.height), 1),
  };
}

export function isApproximatelyScale(value: number, expected: number) {
  return Math.abs(value - expected) < 0.0001;
}

export function isCanonicalProjectedScale(renderNode: RenderNode, konvaNode: Konva.Node) {
  const expectedScaleX = propBoolean(renderNode.props, "flipX") ? -1 : 1;
  const expectedScaleY = propBoolean(renderNode.props, "flipY") ? -1 : 1;
  return isApproximatelyScale(konvaNode.scaleX(), expectedScaleX) && isApproximatelyScale(konvaNode.scaleY(), expectedScaleY);
}

export function rotatePointAroundPoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  rotationDegrees: number,
) {
  const radians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const offsetX = point.x - center.x;
  const offsetY = point.y - center.y;
  return {
    x: center.x + offsetX * cos - offsetY * sin,
    y: center.y + offsetX * sin + offsetY * cos,
  };
}

export function makeFrameFromPoints(start: { x: number; y: number }, current: { x: number; y: number }) {
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    width: Math.max(Math.abs(current.x - start.x), 1),
    height: Math.max(Math.abs(current.y - start.y), 1),
  };
}

export function distanceBetweenPoints(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function resolveKonvaWorkspacePointer(
  event: Konva.KonvaEventObject<PointerEvent>,
  viewport: WorkspaceViewport,
) {
  const stage = event.target.getStage();
  const rect = stage?.container().getBoundingClientRect();
  if (!rect) {
    return null;
  }

  return convertClientPointToWorkspacePoint({ x: event.evt.clientX, y: event.evt.clientY }, rect, viewport);
}

export function propString(props: RenderNode["props"], key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

export function propNumberArray(props: RenderNode["props"], key: string): number[] | undefined {
  const value = props[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined;
}

export function propNumber(props: RenderNode["props"], key: string): number | undefined {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
}

export function propBoolean(props: RenderNode["props"], key: string): boolean {
  return props[key] === true;
}

export function buildRichTextCanvasBlockStyle(node: RenderNode, pageLayout: WorkspacePageLayout, viewport: WorkspaceViewport): CSSProperties {
  const flipX = propBoolean(node.props, "flipX");
  const flipY = propBoolean(node.props, "flipY");
  const x = (pageLayout.x + node.frame.x + (flipX ? node.frame.width : 0)) * viewport.zoom + viewport.panX;
  const y = (pageLayout.y + node.frame.y + (flipY ? node.frame.height : 0)) * viewport.zoom + viewport.panY;
  const transforms = [`scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`];
  const rotation = node.rotation ?? 0;
  if (Math.abs(rotation) > 0.001) {
    transforms.push(`rotate(${rotation}deg)`);
  }

  return {
    left: x,
    top: y,
    width: Math.max(node.frame.width * viewport.zoom, 1),
    height: Math.max(node.frame.height * viewport.zoom, 1),
    opacity: propNumber(node.props, "opacity") ?? 1,
    transform: transforms.join(" "),
    transformOrigin: "top left",
  };
}

export function buildRichTextContentStyle(node: RenderNode): CSSProperties {
  const padding = propNumber(node.props, "padding") ?? 8;
  return {
    color: propString(node.props, "color") ?? "#111827",
    fontFamily: propString(node.props, "fontFamily") ?? "Inter, system-ui, sans-serif",
    fontSize: propNumber(node.props, "fontSize") ?? 12,
    fontStyle: propString(node.props, "fontStyle") ?? "normal",
    fontWeight: propString(node.props, "fontWeight") ?? propNumber(node.props, "fontWeight") ?? 400,
    letterSpacing: propNumber(node.props, "letterSpacing") ?? 0,
    lineHeight: propNumber(node.props, "lineHeight") ?? 1.2,
    paddingTop: propNumber(node.props, "paddingTop") ?? padding,
    paddingRight: propNumber(node.props, "paddingRight") ?? padding,
    paddingBottom: propNumber(node.props, "paddingBottom") ?? padding,
    paddingLeft: propNumber(node.props, "paddingLeft") ?? padding,
    textAlign: resolveRichTextAlign(node.props),
  };
}

export function resolveRichTextAlign(props: RenderNode["props"]): CSSProperties["textAlign"] {
  const align = propString(props, "textAlign") ?? propString(props, "align");
  return align === "center" || align === "right" || align === "justify" ? align : "left";
}

export function getRenderableSvgSource(node: RenderNode) {
  const svg = propString(node.props, "svg");
  const src = propString(node.props, "src");
  return normalizeRenderableImageSource(svg ?? src ?? "");
}

export function normalizeRenderableImageSource(source: string) {
  const trimmed = source.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("<svg")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export function resolveRichTextCanvasHtml(node: RenderNode, dataset: unknown) {
  const displayMode = (propString(node.props, "richTextDisplayMode") as RichTextVariableDisplayMode | undefined) ?? "label";
  const rawJson = node.props?.richTextJson;
  if (rawJson && typeof rawJson === "object") {
    return serializeRichTextJsonToHtml(rawJson as JSONContent, { displayMode, dataset });
  }

  return propString(node.props, "html") ?? "";
}

export function hasImageEditingChanges(editing: ImageEditingState) {
  const maskBounds = editing.mask.bounds;
  return (
    editing.crop.ratio !== "free" ||
    Math.abs(editing.crop.zoom - 1) > 0.001 ||
    Math.abs(editing.crop.x) > 0.001 ||
    Math.abs(editing.crop.y) > 0.001 ||
    Math.abs(editing.crop.rotation) > 0.001 ||
    editing.mask.type !== "rectangle" ||
    editing.mask.radius > 0 ||
    Math.abs(maskBounds.x) > 0.001 ||
    Math.abs(maskBounds.y) > 0.001 ||
    Math.abs(maskBounds.width - 1) > 0.001 ||
    Math.abs(maskBounds.height - 1) > 0.001 ||
    hasImageMaskBorderChanges(editing.mask.border) ||
    editing.filter !== "none" ||
    Object.entries(editing.adjustments).some(([key, value]) => (key === "opacity" ? Math.abs(value - 1) > 0.001 : Math.abs(value) > 0.001)) ||
    editing.transform.flipX ||
    editing.transform.flipY ||
    Math.abs(editing.transform.rotation) > 0.001
  );
}

export function resolveEditedImageTransform(node: RenderNode, editing: ImageEditingState) {
  const zoom = Math.max(0.25, editing.crop.zoom);
  const width = node.frame.width * zoom;
  const height = node.frame.height * zoom;

  return {
    x: node.frame.width / 2 + editing.crop.x * node.frame.width * 0.5,
    y: node.frame.height / 2 + editing.crop.y * node.frame.height * 0.5,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: editing.crop.rotation + editing.transform.rotation,
    scaleX: editing.transform.flipX ? -1 : 1,
    scaleY: editing.transform.flipY ? -1 : 1,
  };
}

export function resolveKonvaImageFilters(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  const filters: Array<(imageData: ImageData) => void> = [];
  const konvaFilters = Konva.Filters as Record<string, (imageData: ImageData) => void>;

  if (preset.grayscale > 0.5 && konvaFilters.Grayscale) {
    filters.push(konvaFilters.Grayscale);
  }

  if (preset.sepia > 0.01 && konvaFilters.Sepia) {
    filters.push(konvaFilters.Sepia);
  }

  if (Math.abs(resolveKonvaBrightness(editing)) > 0.001 && konvaFilters.Brighten) {
    filters.push(konvaFilters.Brighten);
  }

  if (Math.abs(resolveKonvaContrast(editing)) > 0.001 && konvaFilters.Contrast) {
    filters.push(konvaFilters.Contrast);
  }

  if ((Math.abs(resolveKonvaSaturation(editing)) > 0.001 || Math.abs(editing.adjustments.hue) > 0.001 || Math.abs(editing.adjustments.temperature) > 0.001) && konvaFilters.HSL) {
    filters.push(konvaFilters.HSL);
  }

  if (editing.adjustments.blur > 0.001 && konvaFilters.Blur) {
    filters.push(konvaFilters.Blur);
  }

  if (editing.adjustments.grain > 0.001 && konvaFilters.Noise) {
    filters.push(konvaFilters.Noise);
  }

  return filters;
}

export function resolveKonvaBrightness(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  return clampNumber(editing.adjustments.brightness + editing.adjustments.exposure * 0.35 + preset.brightness, -1, 1);
}

export function resolveKonvaContrast(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  return clampNumber((editing.adjustments.contrast + preset.contrast) * 100, -100, 100);
}

export function resolveKonvaSaturation(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  return clampNumber((editing.adjustments.saturation + preset.saturation) * 2, -2, 2);
}

export function applyImageMaskClip(context: Konva.Context, width: number, height: number, editing: ImageEditingState) {
  const maskFrame = resolveImageMaskFrame(editing.mask.bounds, width, height);
  const radius = Math.min(editing.mask.radius, maskFrame.width / 2, maskFrame.height / 2);
  context.beginPath();

  switch (editing.mask.type) {
    case "rounded-rect":
      drawRoundedRectClip(context, maskFrame.x, maskFrame.y, maskFrame.width, maskFrame.height, radius);
      return;
    case "circle": {
      const size = Math.min(maskFrame.width, maskFrame.height);
      context.arc(maskFrame.x + maskFrame.width / 2, maskFrame.y + maskFrame.height / 2, size / 2, 0, Math.PI * 2, false);
      return;
    }
    case "ellipse":
      context.save();
      context.translate(maskFrame.x + maskFrame.width / 2, maskFrame.y + maskFrame.height / 2);
      context.scale(maskFrame.width / 2, maskFrame.height / 2);
      context.arc(0, 0, 1, 0, Math.PI * 2, false);
      context.restore();
      return;
    case "diamond":
      drawPolygonClip(context, [
        [maskFrame.x + maskFrame.width / 2, maskFrame.y],
        [maskFrame.x + maskFrame.width, maskFrame.y + maskFrame.height / 2],
        [maskFrame.x + maskFrame.width / 2, maskFrame.y + maskFrame.height],
        [maskFrame.x, maskFrame.y + maskFrame.height / 2],
      ]);
      return;
    case "star":
      drawStarClip(context, maskFrame.x, maskFrame.y, maskFrame.width, maskFrame.height);
      return;
    case "blob":
      drawPolygonClip(context, [
        [maskFrame.x + maskFrame.width * 0.44, maskFrame.y + maskFrame.height * 0.03],
        [maskFrame.x + maskFrame.width * 0.75, maskFrame.y + maskFrame.height * 0.1],
        [maskFrame.x + maskFrame.width * 0.98, maskFrame.y + maskFrame.height * 0.38],
        [maskFrame.x + maskFrame.width * 0.89, maskFrame.y + maskFrame.height * 0.72],
        [maskFrame.x + maskFrame.width * 0.61, maskFrame.y + maskFrame.height * 0.96],
        [maskFrame.x + maskFrame.width * 0.26, maskFrame.y + maskFrame.height * 0.88],
        [maskFrame.x + maskFrame.width * 0.04, maskFrame.y + maskFrame.height * 0.58],
        [maskFrame.x + maskFrame.width * 0.12, maskFrame.y + maskFrame.height * 0.23],
      ]);
      return;
    case "rectangle":
    default:
      context.rect(maskFrame.x, maskFrame.y, maskFrame.width, maskFrame.height);
      context.closePath();
  }
}

export function drawRoundedRectClip(context: Konva.Context, x: number, y: number, width: number, height: number, radius: number) {
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

export function drawPolygonClip(context: Konva.Context, points: Array<[number, number]>) {
  const [firstPoint, ...remainingPoints] = points;
  context.moveTo(firstPoint[0], firstPoint[1]);
  remainingPoints.forEach((point) => context.lineTo(point[0], point[1]));
  context.closePath();
}

export function drawStarClip(context: Konva.Context, x: number, y: number, width: number, height: number) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const outer = Math.min(width, height) / 2;
  const inner = outer * 0.46;
  const points: Array<[number, number]> = [];

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? outer : inner;
    points.push([centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius]);
  }

  drawPolygonClip(context, points);
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
