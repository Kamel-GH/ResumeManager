import type { CanvasToolId } from "@/features/editor/schema/canvas-insertion";
import type { CanonicalRenderTree, RenderNode, RenderNodeProps } from "@/features/editor/schema/render-tree";

export type SelectionActionBarPlacement = {
  left: number;
  top: number;
  placement: "top" | "bottom";
};

export type ProjectedKonvaGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
};

export type SelectionOrderCapabilities = {
  bringToFront: boolean;
  bringForward: boolean;
  sendBackward: boolean;
  sendToBack: boolean;
};

export type KonvaShapeRenderProps =
  | {
      shape: "circle";
      circle: {
        x: number;
        y: number;
        radius: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        dash?: number[];
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "ellipse";
      ellipse: {
        x: number;
        y: number;
        radiusX: number;
        radiusY: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        dash?: number[];
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "line";
      line: {
        x: number;
        y: number;
        points: number[];
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        tension?: number;
        dash?: number[];
        pointerAtBeginning?: boolean;
        pointerAtEnding?: boolean;
        pointerLength?: number;
        pointerWidth?: number;
        fill?: string;
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "rect";
      rect: {
        x: number;
        y: number;
        width: number;
        height: number;
        cornerRadius: number;
        fill: string;
        stroke: string;
        strokeWidth: number;
        dash?: number[];
        opacity: number;
        rotation: number;
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "polygon";
      polygon: {
        x: number;
        y: number;
        points: number[];
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        closed: true;
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "polyline";
      polyline: {
        x: number;
        y: number;
        points: number[];
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "curve";
      curve: {
        x: number;
        y: number;
        points: number[];
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        tension: number;
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    }
  | {
      shape: "arc";
      arc: {
        x: number;
        y: number;
        radiusX: number;
        radiusY: number;
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        arcType: "open" | "pie";
        arcSweep: 1 | -1;
        fill: string;
        stroke: string;
        strokeWidth: number;
        opacity: number;
        rotation: number;
        scaleX?: number;
        scaleY?: number;
        offsetX?: number;
        offsetY?: number;
      };
    };

export type KonvaImageRenderProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  opacity: number;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
};

export function resolveSelectionActionBarPlacement(
  bounds: { x: number; y: number; width: number; height: number },
  workspaceWidth: number,
  workspaceHeight: number,
): SelectionActionBarPlacement {
  const barWidth = 246;
  const barHeight = 38;
  const gap = 12;
  const viewportPadding = 8;
  const rotationHandleSafeZone = 58;
  const paddedWidth = Math.max(workspaceWidth - viewportPadding * 2, barWidth);
  const paddedHeight = Math.max(workspaceHeight - viewportPadding * 2, barHeight);
  const left = clampNumber(bounds.x + bounds.width / 2 - barWidth / 2, viewportPadding, paddedWidth - barWidth + viewportPadding);
  const aboveTop = bounds.y - rotationHandleSafeZone - barHeight - gap;
  const belowTop = bounds.y + bounds.height + gap;
  const canPlaceAbove = aboveTop >= viewportPadding;
  const canPlaceBelow = belowTop + barHeight <= paddedHeight + viewportPadding;

  if (canPlaceAbove) {
    return {
      left,
      top: aboveTop,
      placement: "bottom",
    };
  }

  return {
    left,
    top: canPlaceBelow ? belowTop : clampNumber(belowTop, viewportPadding, paddedHeight - barHeight + viewportPadding),
    placement: "top",
  };
}

export function resolveDragSelectionIds(input: {
  anchorId: string;
  anchorPageId: string;
  selectedElementIds: string[];
  renderNodeById: Map<string, { node: RenderNode; pageId: string }>;
}) {
  const selectedIds = new Set(input.selectedElementIds);
  if (!selectedIds.has(input.anchorId) || input.selectedElementIds.length <= 1) {
    return [input.anchorId];
  }

  const draggableSelectionIds = input.selectedElementIds.filter((selectionId) => {
    const entry = input.renderNodeById.get(selectionId);
    return Boolean(entry && entry.pageId === input.anchorPageId && isSelectableNode(entry.node));
  });

  return draggableSelectionIds.length > 0 ? draggableSelectionIds : [input.anchorId];
}

function resolveOriginFlipTransform(frame: { x: number; y: number; width: number; height: number }, props: RenderNodeProps) {
  const flipX = propBoolean(props, "flipX");
  const flipY = propBoolean(props, "flipY");

  if (!flipX && !flipY) {
    return {};
  }

  return {
    x: frame.x + (flipX ? frame.width : 0),
    y: frame.y + (flipY ? frame.height : 0),
    scaleX: flipX ? -1 : 1,
    scaleY: flipY ? -1 : 1,
  };
}

function resolveCenterFlipTransform(props: RenderNodeProps) {
  const flipX = propBoolean(props, "flipX");
  const flipY = propBoolean(props, "flipY");

  if (!flipX && !flipY) {
    return {};
  }

  return {
    scaleX: flipX ? -1 : 1,
    scaleY: flipY ? -1 : 1,
  };
}

export function getKonvaShapeProps(node: RenderNode): KonvaShapeRenderProps {
  const { frame, props } = node;
  const shape = propString(props, "shape");
  const strokeOnlyShape = shape === "line" || shape === "polyline" || shape === "curve" || (shape === "arc" && propString(props, "arcType") !== "pie");
  const fill = propString(props, "fill") ?? (strokeOnlyShape ? "transparent" : "#ffffff");
  const stroke = propString(props, "stroke") ?? (strokeOnlyShape ? "#0f172a" : "transparent");
  const strokeWidth = propNumber(props, "strokeWidth") ?? (strokeOnlyShape ? 2 : 1);
  const opacity = propNumber(props, "opacity") ?? 1;
  const rotation = node.rotation ?? 0;
  const originFlip = resolveOriginFlipTransform(frame, props);
  const centerFlip = resolveCenterFlipTransform(props);

  if (shape === "circle") {
    return {
      shape: "circle",
      circle: {
        x: frame.x + frame.width / 2,
        y: frame.y + frame.height / 2,
        radius: Math.min(frame.width, frame.height) / 2,
        fill,
        stroke,
        strokeWidth,
        opacity,
        rotation,
        dash: propNumberArray(props, "dash"),
        ...centerFlip,
      },
    };
  }

  if (shape === "ellipse") {
    return {
      shape: "ellipse",
      ellipse: {
        x: frame.x + frame.width / 2,
        y: frame.y + frame.height / 2,
        radiusX: Math.max(frame.width / 2, 1),
        radiusY: Math.max(frame.height / 2, 1),
        fill,
        stroke,
        strokeWidth,
        opacity,
        rotation,
        dash: propNumberArray(props, "dash"),
        ...centerFlip,
      },
    };
  }

  if (shape === "line") {
    const points = propNumberArray(props, "points") ?? [0, 0, Math.max(frame.width, 1), Math.max(frame.height, 1)];
    return {
      shape: "line",
      line: {
        x: frame.x,
        y: frame.y,
        points,
        stroke,
        strokeWidth,
        opacity,
        rotation,
        dash: propNumberArray(props, "dash"),
        pointerAtBeginning: propBoolean(props, "pointerAtBeginning"),
        pointerAtEnding: propBoolean(props, "pointerAtEnding") || propBoolean(props, "arrow"),
        pointerLength: propNumber(props, "pointerLength") ?? 8,
        pointerWidth: propNumber(props, "pointerWidth") ?? 8,
        fill,
        ...originFlip,
      },
    };
  }

  if (shape === "polygon" || shape === "polyline" || shape === "curve") {
    const points = propNumberArray(props, "points") ?? [0, 0, Math.max(frame.width, 1), Math.max(frame.height, 1)];
    return shape === "polygon"
      ? {
          shape: "polygon",
          polygon: {
            x: frame.x,
            y: frame.y,
            points,
            fill,
            stroke,
            strokeWidth,
            opacity,
            rotation,
            closed: true,
            ...originFlip,
          },
        }
      : shape === "curve"
        ? {
            shape: "curve",
            curve: {
              x: frame.x,
              y: frame.y,
              points,
              fill: "transparent",
              stroke,
              strokeWidth,
              opacity,
              rotation,
              tension: propNumber(props, "tension") ?? 0.5,
              ...originFlip,
            },
          }
        : {
            shape: "polyline",
            polyline: {
              x: frame.x,
              y: frame.y,
              points,
              fill: "transparent",
              stroke,
              strokeWidth,
              opacity,
              rotation,
              ...originFlip,
            },
          };
  }

  if (shape === "arc") {
    return {
      shape: "arc",
      arc: {
        x: frame.x,
        y: frame.y,
        radiusX: Math.max(frame.width / 2, 1),
        radiusY: Math.max(frame.height / 2, 1),
        innerRadius: propNumber(props, "innerRadius") ?? 0,
        outerRadius: propNumber(props, "outerRadius") ?? Math.max(Math.min(frame.width, frame.height) / 2, 1),
        startAngle: propNumber(props, "startAngle") ?? 0,
        endAngle: propNumber(props, "endAngle") ?? 180,
        arcType: propString(props, "arcType") === "pie" ? "pie" : "open",
        arcSweep: propNumber(props, "arcSweep") === -1 ? -1 : 1,
        fill,
        stroke,
        strokeWidth,
        opacity,
        rotation,
        ...originFlip,
      },
    };
  }

  return {
    shape: "rect",
    rect: {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      cornerRadius: propNumber(props, "cornerRadius") ?? 0,
      fill,
      stroke,
      strokeWidth,
      dash: propNumberArray(props, "dash"),
      opacity,
      rotation,
      ...originFlip,
    },
  };
}

export function getKonvaTextProps(node: RenderNode) {
  const { frame, props } = node;
  const flip = resolveOriginFlipTransform(frame, props);

  return {
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    text: propString(props, "text") ?? "",
    fill: propString(props, "color") ?? "#111827",
    fontFamily: propString(props, "fontFamily") ?? "Inter",
    fontSize: propNumber(props, "fontSize") ?? 12,
    fontStyle: propString(props, "fontStyle") ?? "normal",
    fontVariant: "normal",
    fontWeight: propFontWeight(props),
    letterSpacing: propNumber(props, "letterSpacing") ?? 0,
    lineHeight: propNumber(props, "lineHeight") ?? 1.2,
    align: propTextAlign(props),
    verticalAlign: "top",
    rotation: node.rotation ?? 0,
    ...flip,
  };
}

export function getKonvaImageProps(node: RenderNode): KonvaImageRenderProps {
  const { frame, props } = node;
  const flip = resolveOriginFlipTransform(frame, props);

  return {
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    src: normalizeRenderableImageSource(propString(props, "src") ?? propString(props, "svg") ?? ""),
    opacity: propNumber(props, "opacity") ?? 1,
    rotation: node.rotation ?? 0,
    ...flip,
  };
}

export function isSelectableNode(node: RenderNode): boolean {
  return node.visible && !node.locked && node.props.selectable !== false;
}

export function isSelectionBoxTool(toolId: CanvasToolId) {
  return toolId === "pointer" || toolId === "selection";
}

export function isTransformableNode(node: RenderNode): boolean {
  if (!isSelectableNode(node)) {
    return false;
  }

  if (node.type === "text" || node.type === "rich-text" || node.type === "image" || node.type === "table" || node.type === "list") {
    return true;
  }

  if (node.type !== "shape") {
    return false;
  }

  const shape = propString(node.props, "shape");
  return shape === "rect" || shape === "circle" || shape === "ellipse" || shape === "line" || shape === "arc" || shape === "polygon" || shape === "polyline" || shape === "curve";
}

export function resolveCanonicalFrameFromProjectedGeometry(renderNode: RenderNode, projected: ProjectedKonvaGeometry) {
  const baseFrame = renderNode.frame;
  const rawWidth = Math.abs(projected.width);
  const rawHeight = Math.abs(projected.height);
  const width = Math.max(1, Math.abs((rawWidth > 1 ? rawWidth : baseFrame.width) * projected.scaleX));
  const height = Math.max(1, Math.abs((rawHeight > 1 ? rawHeight : baseFrame.height) * projected.scaleY));
  const anchorMode = resolveRenderNodeAnchorMode(renderNode);
  const flipX = propBoolean(renderNode.props, "flipX");
  const flipY = propBoolean(renderNode.props, "flipY");

  return {
    x: anchorMode === "center" ? projected.x - width / 2 : projected.x - (flipX ? width : 0),
    y: anchorMode === "center" ? projected.y - height / 2 : projected.y - (flipY ? height : 0),
    width: width > 1 ? width : baseFrame.width,
    height: height > 1 ? height : baseFrame.height,
  };
}

export function shouldShowFrameOutline(nodeId: string, draggingElementIds: string[]) {
  return !draggingElementIds.includes(nodeId);
}

export function resolveSelectionOrderCapabilities(renderTree: CanonicalRenderTree, selectedEditableIds: string[]): SelectionOrderCapabilities {
  const selectedSet = new Set(selectedEditableIds);
  const capabilities: SelectionOrderCapabilities = {
    bringToFront: false,
    bringForward: false,
    sendBackward: false,
    sendToBack: false,
  };

  renderTree.pages.forEach((page) => {
    const groups = groupRenderNodesByOrderContext(page.children);

    groups.forEach((group) => {
      const ordered = group.nodes.filter((node) => node.visible).sort(compareRenderNodesForObjectOrder);
      if (ordered.length === 0) {
        return;
      }

      splitRenderNodesByLockedAnchors(ordered).forEach((segment) => {
        const selectedIndices = segment.reduce<number[]>((indices, node, index) => {
          if (selectedSet.has(node.id) && !node.locked) {
            indices.push(index);
          }

          return indices;
        }, []);

        if (selectedIndices.length === 0) {
          return;
        }

        const hasStationaryAfterSelected = selectedIndices.some((selectedIndex) => segment.slice(selectedIndex + 1).some((node) => !selectedSet.has(node.id)));
        const hasStationaryBeforeSelected = selectedIndices.some((selectedIndex) => segment.slice(0, selectedIndex).some((node) => !selectedSet.has(node.id)));

        capabilities.bringToFront ||= hasStationaryAfterSelected;
        capabilities.bringForward ||= hasStationaryAfterSelected;
        capabilities.sendToBack ||= hasStationaryBeforeSelected;
        capabilities.sendBackward ||= hasStationaryBeforeSelected;
      });
    });
  });

  return capabilities;
}

function groupRenderNodesByOrderContext(nodes: RenderNode[]) {
  const groups = new Map<string, { key: string; nodes: RenderNode[] }>();

  nodes.forEach((node) => {
    const key = resolveRenderNodeOrderGroupKey(node);
    const group = groups.get(key);
    if (group) {
      group.nodes.push(node);
      return;
    }

    groups.set(key, {
      key,
      nodes: [node],
    });
  });

  return [...groups.values()];
}

function resolveRenderNodeOrderGroupKey(node: RenderNode) {
  const layerId = propString(node.props, "layerId") ?? propString(node.props, "layerName") ?? "default";
  const parentId =
    propString(node.props, "parentId") ??
    propString(node.props, "groupId") ??
    propString(node.props, "frameId") ??
    propString(node.props, "containerId") ??
    propString(node.props, "sectionId") ??
    "root";

  return `${node.pageId}::${layerId}::${parentId}`;
}

function compareRenderNodesForObjectOrder(a: RenderNode, b: RenderNode) {
  const zDelta = a.zIndex - b.zIndex;
  if (zDelta !== 0) {
    return zDelta;
  }

  return a.id.localeCompare(b.id, "fr");
}

function splitRenderNodesByLockedAnchors(nodes: RenderNode[]) {
  const segments: RenderNode[][] = [];
  let segmentStart = 0;

  nodes.forEach((node, index) => {
    if (!node.locked) {
      return;
    }

    if (index > segmentStart) {
      segments.push(nodes.slice(segmentStart, index));
    }

    segmentStart = index + 1;
  });

  if (segmentStart < nodes.length) {
    segments.push(nodes.slice(segmentStart));
  }

  return segments;
}

function resolveRenderNodeAnchorMode(renderNode: RenderNode): "center" | "origin" {
  if (renderNode.type !== "shape") {
    return "origin";
  }

  const shape = propString(renderNode.props, "shape");
  return shape === "circle" || shape === "ellipse" ? "center" : "origin";
}

function propString(props: RenderNodeProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

function propNumber(props: RenderNodeProps, key: string): number | undefined {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
}

function propNumberArray(props: RenderNodeProps, key: string): number[] | undefined {
  const value = props[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined;
}

function propBoolean(props: RenderNodeProps, key: string): boolean {
  return props[key] === true;
}

function propTextAlign(props: RenderNodeProps): "left" | "center" | "right" {
  const value = propString(props, "textAlign");
  return value === "center" || value === "right" ? value : "left";
}

function propFontWeight(props: RenderNodeProps): string {
  const value = props.fontWeight;
  return typeof value === "number" || typeof value === "string" ? String(value) : "normal";
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRenderableImageSource(source: string): string {
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
