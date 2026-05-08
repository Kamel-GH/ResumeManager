import type { Rect } from "@/features/editor/types";

import type { EditorWorkspaceSettings, WorkspacePageLayout, WorkspaceSnapGuide, WorkspaceSnapResolution } from "@/features/editor/schema/workspace-layout";

type WorkspaceSnapAnchor = "start" | "center" | "end";
type WorkspaceSnapTargetKind = "grid" | "margin" | "bounds" | "page" | "object" | "dimension" | "container";
type WorkspaceResizeAxis = "x" | "y";
type WorkspaceResizeAnchor = "start" | "end";

export type WorkspaceSnapSource = {
  id: string;
  frame: Rect;
  label?: string;
  groupKey?: string;
  parentId?: string | null;
};

type WorkspaceSnapTarget = {
  axis: "x" | "y";
  anchor: WorkspaceSnapAnchor;
  kind: WorkspaceSnapTargetKind;
  label: string;
  position: number;
  priority: number;
  sourceId?: string;
};

export type WorkspaceResizeSnapResolution = {
  frame: Rect;
  guides: WorkspaceSnapGuide[];
};

export function resolveWorkspaceAlignmentSnapResolution(
  frame: Rect,
  page: WorkspacePageLayout,
  settings: EditorWorkspaceSettings,
  sources: WorkspaceSnapSource[] = [],
  activeAnchor?: string | null,
  screenScale = 1,
  activeGroupKey?: string | null,
): WorkspaceSnapResolution {
  const startFrame = normalizeFrame(frame);
  const targets = buildWorkspaceSnapTargets(page, settings, sources);
  const anchorPreferences = resolveActiveAnchorPreferences(activeAnchor);
  const tolerance = settings.snapTolerance / Math.max(screenScale, 0.0001);
  const xResolution = resolveAxisSnap("x", startFrame, targets.filter((target) => target.axis === "x"), tolerance, page, anchorPreferences?.x);
  const yResolution = resolveAxisSnap("y", startFrame, targets.filter((target) => target.axis === "y"), tolerance, page, anchorPreferences?.y);
  const equalSpacingXResolution = resolveEqualSpacingSnapResolution("x", startFrame, page, sources, tolerance, activeGroupKey);
  const equalSpacingYResolution = resolveEqualSpacingSnapResolution("y", startFrame, page, sources, tolerance, activeGroupKey);
  const bestXResolution = pickBestResolution(xResolution, equalSpacingXResolution);
  const bestYResolution = pickBestResolution(yResolution, equalSpacingYResolution);
  const nextFrame = {
    ...startFrame,
    x: bestXResolution?.frame.x ?? startFrame.x,
    y: bestYResolution?.frame.y ?? startFrame.y,
  };
  const guides = [...(bestXResolution?.guides ?? []), ...(bestYResolution?.guides ?? [])];

  return {
    point: { x: nextFrame.x, y: nextFrame.y },
    guides,
  };
}

export function resolveWorkspaceResizeSnapResolution(
  oldFrame: Rect,
  frame: Rect,
  page: WorkspacePageLayout,
  settings: EditorWorkspaceSettings,
  sources: WorkspaceSnapSource[] = [],
  activeAnchor?: string | null,
  screenScale = 1,
  activeGroupKey?: string | null,
): WorkspaceResizeSnapResolution {
  const startFrame = normalizeFrame(frame);
  const tolerance = settings.snapTolerance / Math.max(screenScale, 0.0001);
  const resizeAnchors = resolveActiveResizeAnchors(activeAnchor);
  const widthResolution = resizeAnchors.x
    ? resolveEqualDimensionSnapResolution("x", oldFrame, startFrame, page, sources, tolerance, activeGroupKey, resizeAnchors.x)
    : null;
  const heightResolution = resizeAnchors.y
    ? resolveEqualDimensionSnapResolution("y", oldFrame, startFrame, page, sources, tolerance, activeGroupKey, resizeAnchors.y)
    : null;

  const nextFrame = {
    ...startFrame,
    x: widthResolution?.frame.x ?? startFrame.x,
    y: heightResolution?.frame.y ?? startFrame.y,
    width: widthResolution?.frame.width ?? startFrame.width,
    height: heightResolution?.frame.height ?? startFrame.height,
  };

  return {
    frame: nextFrame,
    guides: [...(widthResolution?.guides ?? []), ...(heightResolution?.guides ?? [])],
  };
}

function resolveEqualDimensionSnapResolution(
  axis: WorkspaceResizeAxis,
  oldFrame: Rect,
  frame: Rect,
  page: WorkspacePageLayout,
  sources: WorkspaceSnapSource[],
  tolerance: number,
  activeGroupKey: string | null | undefined,
  activeResizeAnchor: WorkspaceResizeAnchor,
) {
  const relevantSources = sources
    .filter((source) => (activeGroupKey ? source.groupKey === activeGroupKey : true))
    .map((source) => ({
      source,
      frame: normalizeFrame(source.frame),
    }))
    .filter(({ frame: sourceFrame }) => sourceFrame.width > 0 && sourceFrame.height > 0);

  if (relevantSources.length === 0) {
    return null;
  }

  const currentSize = axis === "x" ? frame.width : frame.height;
  let best: {
    frame: Rect;
    guides: WorkspaceSnapGuide[];
    distance: number;
    priority: number;
  } | null = null;

  for (const { frame: sourceFrame } of relevantSources) {
    const targetSize = axis === "x" ? sourceFrame.width : sourceFrame.height;
    const distance = Math.abs(currentSize - targetSize);
    if (distance > tolerance) {
      continue;
    }

    const nextFrame =
      axis === "x"
        ? activeResizeAnchor === "start"
          ? {
              ...frame,
              x: oldFrame.x + oldFrame.width - targetSize,
              width: targetSize,
            }
          : {
              ...frame,
              width: targetSize,
            }
        : activeResizeAnchor === "start"
          ? {
              ...frame,
              y: oldFrame.y + oldFrame.height - targetSize,
              height: targetSize,
            }
          : {
              ...frame,
              height: targetSize,
            };

    const guide: WorkspaceSnapGuide = {
      axis,
      kind: "dimension",
      position: axis === "x" ? (activeResizeAnchor === "start" ? nextFrame.x : nextFrame.x + nextFrame.width) : activeResizeAnchor === "start" ? nextFrame.y : nextFrame.y + nextFrame.height,
      start: 0,
      end: axis === "x" ? page.height : page.width,
      label: axis === "x" ? "Largeur identique" : "Hauteur identique",
      priority: 92,
    };

    const priority = 92;
    const isBetter =
      !best ||
      distance < best.distance - 0.001 ||
      (Math.abs(distance - best.distance) <= 0.001 && priority > best.priority);

    if (isBetter) {
      best = {
        frame: nextFrame,
        guides: [guide],
        distance,
        priority,
      };
    }
  }

  return best;
}

function resolveActiveResizeAnchors(activeAnchor?: string | null): { x: WorkspaceResizeAnchor | null; y: WorkspaceResizeAnchor | null } {
  if (!activeAnchor) {
    return { x: null, y: null };
  }

  return {
    x: activeAnchor.includes("left") ? "start" : activeAnchor.includes("right") ? "end" : null,
    y: activeAnchor.includes("top") ? "start" : activeAnchor.includes("bottom") ? "end" : null,
  };
}

function buildWorkspaceSnapTargets(page: WorkspacePageLayout, settings: EditorWorkspaceSettings, sources: WorkspaceSnapSource[]): WorkspaceSnapTarget[] {
  const targets: WorkspaceSnapTarget[] = [];
  const gridSize = settings.gridEnabled && settings.gridSize > 0 ? settings.gridSize : 0;
  const sourceById = new Map(sources.map((source) => [source.id, source] as const));
  const addedContainerTargets = new Set<string>();

  if (settings.snapEnabled && settings.snapToGrid && gridSize > 0) {
    for (let position = 0; position <= page.width; position += gridSize) {
      targets.push(
        {
          axis: "x",
          anchor: "start",
          kind: "grid",
          label: "Grille",
          position,
          priority: 10,
        },
        {
          axis: "x",
          anchor: "center",
          kind: "grid",
          label: "Grille",
          position,
          priority: 10,
        },
        {
          axis: "x",
          anchor: "end",
          kind: "grid",
          label: "Grille",
          position,
          priority: 10,
        },
      );
    }

    for (let position = 0; position <= page.height; position += gridSize) {
      targets.push(
        {
          axis: "y",
          anchor: "start",
          kind: "grid",
          label: "Grille",
          position,
          priority: 10,
        },
        {
          axis: "y",
          anchor: "center",
          kind: "grid",
          label: "Grille",
          position,
          priority: 10,
        },
        {
          axis: "y",
          anchor: "end",
          kind: "grid",
          label: "Grille",
          position,
          priority: 10,
        },
      );
    }
  }

  if (settings.snapEnabled && settings.snapToPageBounds) {
    targets.push(
      { axis: "x", anchor: "start", kind: "bounds", label: "Bord page", position: 0, priority: 60 },
      { axis: "x", anchor: "end", kind: "bounds", label: "Bord page", position: page.width, priority: 60 },
      { axis: "x", anchor: "center", kind: "page", label: "Centre page", position: page.width / 2, priority: 55 },
      { axis: "y", anchor: "start", kind: "bounds", label: "Bord page", position: 0, priority: 60 },
      { axis: "y", anchor: "end", kind: "bounds", label: "Bord page", position: page.height, priority: 60 },
      { axis: "y", anchor: "center", kind: "page", label: "Centre page", position: page.height / 2, priority: 55 },
    );
  }

  if (settings.snapEnabled && settings.snapToMargins) {
    targets.push(
      { axis: "x", anchor: "start", kind: "margin", label: "Marge gauche", position: page.margin.left, priority: 80 },
      { axis: "x", anchor: "end", kind: "margin", label: "Marge droite", position: page.width - page.margin.right, priority: 80 },
      { axis: "x", anchor: "center", kind: "margin", label: "Centre utile", position: page.margin.left + Math.max(0, page.width - page.margin.left - page.margin.right) / 2, priority: 75 },
      { axis: "y", anchor: "start", kind: "margin", label: "Marge haute", position: page.margin.top, priority: 80 },
      { axis: "y", anchor: "end", kind: "margin", label: "Marge basse", position: page.height - page.margin.bottom, priority: 80 },
      { axis: "y", anchor: "center", kind: "margin", label: "Centre utile", position: page.margin.top + Math.max(0, page.height - page.margin.top - page.margin.bottom) / 2, priority: 75 },
    );
  }

  for (const source of sources) {
    const frame = normalizeFrame(source.frame);
    if (frame.width <= 0 || frame.height <= 0) {
      continue;
    }

    targets.push(
      { axis: "x", anchor: "start", kind: "object", label: source.label ? `${source.label} gauche` : "Objet", position: frame.x, priority: 90, sourceId: source.id },
      { axis: "x", anchor: "center", kind: "object", label: source.label ? `${source.label} centre` : "Objet", position: frame.x + frame.width / 2, priority: 95, sourceId: source.id },
      { axis: "x", anchor: "end", kind: "object", label: source.label ? `${source.label} droite` : "Objet", position: frame.x + frame.width, priority: 90, sourceId: source.id },
      { axis: "y", anchor: "start", kind: "object", label: source.label ? `${source.label} haut` : "Objet", position: frame.y, priority: 90, sourceId: source.id },
      { axis: "y", anchor: "center", kind: "object", label: source.label ? `${source.label} centre` : "Objet", position: frame.y + frame.height / 2, priority: 95, sourceId: source.id },
      { axis: "y", anchor: "end", kind: "object", label: source.label ? `${source.label} bas` : "Objet", position: frame.y + frame.height, priority: 90, sourceId: source.id },
    );

    if (source.parentId && source.parentId !== source.id && sourceById.has(source.parentId)) {
      const parentSource = sourceById.get(source.parentId);
      if (parentSource) {
        const parentFrame = normalizeFrame(parentSource.frame);
        if (parentFrame.width > 0 && parentFrame.height > 0) {
          const containerKey = parentSource.id;
          if (!addedContainerTargets.has(containerKey)) {
            addedContainerTargets.add(containerKey);
            targets.push(
              { axis: "x", anchor: "start", kind: "container", label: parentSource.label ? `${parentSource.label} conteneur gauche` : "Conteneur", position: parentFrame.x, priority: 97, sourceId: parentSource.id },
              { axis: "x", anchor: "center", kind: "container", label: parentSource.label ? `${parentSource.label} conteneur centre` : "Conteneur", position: parentFrame.x + parentFrame.width / 2, priority: 97, sourceId: parentSource.id },
              { axis: "x", anchor: "end", kind: "container", label: parentSource.label ? `${parentSource.label} conteneur droite` : "Conteneur", position: parentFrame.x + parentFrame.width, priority: 97, sourceId: parentSource.id },
              { axis: "y", anchor: "start", kind: "container", label: parentSource.label ? `${parentSource.label} conteneur haut` : "Conteneur", position: parentFrame.y, priority: 97, sourceId: parentSource.id },
              { axis: "y", anchor: "center", kind: "container", label: parentSource.label ? `${parentSource.label} conteneur centre` : "Conteneur", position: parentFrame.y + parentFrame.height / 2, priority: 97, sourceId: parentSource.id },
              { axis: "y", anchor: "end", kind: "container", label: parentSource.label ? `${parentSource.label} conteneur bas` : "Conteneur", position: parentFrame.y + parentFrame.height, priority: 97, sourceId: parentSource.id },
            );
          }
        }
      }
    }
  }

  return targets;
}

function resolveAxisSnap(
  axis: "x" | "y",
  frame: Rect,
  targets: WorkspaceSnapTarget[],
  tolerance: number,
  page: WorkspacePageLayout,
  allowedAnchors?: Set<WorkspaceSnapAnchor>,
) {
  const anchorValues = {
    x: [
      { anchor: "start" as const, value: frame.x },
      { anchor: "center" as const, value: frame.x + frame.width / 2 },
      { anchor: "end" as const, value: frame.x + frame.width },
    ],
    y: [
      { anchor: "start" as const, value: frame.y },
      { anchor: "center" as const, value: frame.y + frame.height / 2 },
      { anchor: "end" as const, value: frame.y + frame.height },
    ],
  };

  let best: {
    frame: Rect;
    guides: WorkspaceSnapGuide[];
    distance: number;
    priority: number;
  } | null = null;

  for (const target of targets) {
    if (allowedAnchors && !allowedAnchors.has(target.anchor)) {
      continue;
    }

    const anchorValue = anchorValues[axis].find((entry) => entry.anchor === target.anchor);
    if (!anchorValue) {
      continue;
    }

    const distance = Math.abs(anchorValue.value - target.position);
    if (distance > tolerance) {
      continue;
    }

    const nextFrame = axis === "x" ? { ...frame, x: adjustAxisPosition(frame.width, target.anchor, target.position) } : { ...frame, y: adjustAxisPosition(frame.height, target.anchor, target.position) };

    const guide: WorkspaceSnapGuide = {
      axis,
      kind: target.kind,
      position: target.position,
      start: 0,
      end: axis === "x" ? page.height : page.width,
      label: target.label,
      priority: target.priority,
    };

    const isBetter =
      !best ||
      distance < best.distance - 0.001 ||
      (Math.abs(distance - best.distance) <= 0.001 && target.priority > best.priority);

    if (isBetter) {
      best = {
        frame: nextFrame,
        guides: [guide],
        distance,
        priority: target.priority,
      };
    }
  }

  return best;
}

function resolveEqualSpacingSnapResolution(
  axis: "x" | "y",
  frame: Rect,
  page: WorkspacePageLayout,
  sources: WorkspaceSnapSource[],
  tolerance: number,
  activeGroupKey?: string | null,
) {
  if (!activeGroupKey) {
    return null;
  }

  const relevantSources = sources
    .filter((source) => source.groupKey === activeGroupKey)
    .map((source) => ({
      source,
      frame: normalizeFrame(source.frame),
    }))
    .filter(({ frame: sourceFrame }) => sourceFrame.width > 0 && sourceFrame.height > 0);

  if (relevantSources.length < 2) {
    return null;
  }

  const overlaps = axis === "x" ? hasVerticalOverlap : hasHorizontalOverlap;
  const sorted = [...relevantSources].sort((left, right) => (axis === "x" ? left.frame.x - right.frame.x : left.frame.y - right.frame.y));

  let best: {
    frame: Rect;
    guides: WorkspaceSnapGuide[];
    distance: number;
    priority: number;
  } | null = null;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const left = sorted[index];
    const right = sorted[index + 1];

    if (!overlaps(frame, left.frame) || !overlaps(frame, right.frame)) {
      continue;
    }

    if (axis === "x" && left.frame.x + left.frame.width > right.frame.x) {
      continue;
    }

    if (axis === "y" && left.frame.y + left.frame.height > right.frame.y) {
      continue;
    }

    const targetPosition =
      axis === "x"
        ? (left.frame.x + left.frame.width + right.frame.x - frame.width) / 2
        : (left.frame.y + left.frame.height + right.frame.y - frame.height) / 2;

    const currentPosition = axis === "x" ? frame.x : frame.y;
    const distance = Math.abs(currentPosition - targetPosition);
    if (distance > tolerance) {
      continue;
    }

    const nextFrame = axis === "x" ? { ...frame, x: targetPosition } : { ...frame, y: targetPosition };
    const guide: WorkspaceSnapGuide = {
      axis,
      kind: "spacing",
      position: targetPosition,
      start: 0,
      end: axis === "x" ? page.height : page.width,
      label: "Espacement égal",
      priority: 86,
    };

    const priority = 86;
    const isBetter =
      !best ||
      distance < best.distance - 0.001 ||
      (Math.abs(distance - best.distance) <= 0.001 && priority > best.priority);

    if (isBetter) {
      best = {
        frame: nextFrame,
        guides: [guide],
        distance,
        priority,
      };
    }
  }

  return best;
}

function pickBestResolution<T extends { frame: Rect; guides: WorkspaceSnapGuide[]; distance: number; priority: number } | null>(
  left: T,
  right: T,
) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  if (right.distance < left.distance - 0.001) {
    return right;
  }

  if (left.distance < right.distance - 0.001) {
    return left;
  }

  return right.priority > left.priority ? right : left;
}

function resolveActiveAnchorPreferences(activeAnchor?: string | null) {
  if (!activeAnchor) {
    return null;
  }

  const xAnchors = new Set<WorkspaceSnapAnchor>();
  const yAnchors = new Set<WorkspaceSnapAnchor>();

  if (activeAnchor.includes("left")) {
    xAnchors.add("start");
  }
  if (activeAnchor.includes("center")) {
    xAnchors.add("center");
  }
  if (activeAnchor.includes("right")) {
    xAnchors.add("end");
  }

  if (activeAnchor.includes("top")) {
    yAnchors.add("start");
  }
  if (activeAnchor.includes("middle")) {
    yAnchors.add("center");
  }
  if (activeAnchor.includes("bottom")) {
    yAnchors.add("end");
  }

  if (xAnchors.size === 0 && yAnchors.size === 0) {
    return null;
  }

  return {
    x: xAnchors.size > 0 ? xAnchors : undefined,
    y: yAnchors.size > 0 ? yAnchors : undefined,
  };
}

function adjustAxisPosition(size: number, anchor: WorkspaceSnapAnchor, value: number) {
  if (anchor === "center") {
    return value - size / 2;
  }

  if (anchor === "end") {
    return value - size;
  }

  return value;
}

function normalizeFrame(frame: Rect): Rect {
  return {
    x: frame.x,
    y: frame.y,
    width: Math.max(1, frame.width),
    height: Math.max(1, frame.height),
  };
}

function hasVerticalOverlap(frameA: Rect, frameB: Rect) {
  return frameA.y < frameB.y + frameB.height && frameA.y + frameA.height > frameB.y;
}

function hasHorizontalOverlap(frameA: Rect, frameB: Rect) {
  return frameA.x < frameB.x + frameB.width && frameA.x + frameA.width > frameB.x;
}
