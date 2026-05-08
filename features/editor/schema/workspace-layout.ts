import type { PageMargin } from "@/features/editor/schema/template-schema";
import { formatMeasurementValue, type MeasurementUnit } from "@/features/editor/lib/measurement";
import type { Rect } from "@/features/editor/types";

export type { MeasurementUnit } from "@/features/editor/lib/measurement";

export type EditorWorkspaceSettings = {
  measurementUnit: MeasurementUnit;
  gridEnabled: boolean;
  gridSize: number;
  rulersVisible: boolean;
  rulerMode: RulerMode;
  workspaceMode: WorkspaceMode;
  autoCenterOnLoad: boolean;
  marginsVisible: boolean;
  guidesVisible: boolean;
  snapEnabled: boolean;
  snapToGrid: boolean;
  snapToMargins: boolean;
  snapToPageBounds: boolean;
  snapTolerance: number;
  pageGap: number;
  pagePadding: number;
  rulerMajorStep: number;
  rulerMinorStep: number;
  rulerFineStep: number;
};

export type RulerMode = "global" | "page";
export type WorkspaceMode = "fit-space" | "fit-width" | "free";

export const defaultWorkspaceSettings: EditorWorkspaceSettings = {
  measurementUnit: "px",
  gridEnabled: true,
  gridSize: 20,
  rulersVisible: true,
  rulerMode: "page",
  workspaceMode: "fit-space",
  autoCenterOnLoad: true,
  marginsVisible: true,
  guidesVisible: true,
  snapEnabled: true,
  snapToGrid: true,
  snapToMargins: true,
  snapToPageBounds: true,
  snapTolerance: 8,
  pageGap: 56,
  pagePadding: 56,
  rulerMajorStep: 100,
  rulerMinorStep: 20,
  rulerFineStep: 10,
};

export type WorkspacePageSource = {
  id: string;
  name: string;
  width: number;
  height: number;
  margin: PageMargin;
};

export type WorkspacePageLayout = WorkspacePageSource & {
  x: number;
  y: number;
  orientation: "portrait" | "landscape" | "square";
};

export type WorkspaceLayout = {
  width: number;
  height: number;
  pages: WorkspacePageLayout[];
};

export type WorkspaceContentBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorkspacePoint = {
  x: number;
  y: number;
};

export type WorkspaceViewport = {
  zoom: number;
  panX: number;
  panY: number;
};

export type RulerTick = {
  isMajor: boolean;
  isMinor: boolean;
  label?: string;
  position: number;
  workspacePosition: number;
};

export type WorkspaceRulerTicks = {
  mode: RulerMode;
  origin: WorkspacePoint;
  horizontal: RulerTick[];
  vertical: RulerTick[];
};

export type WorkspaceSnapGuideKind = "grid" | "margin" | "bounds" | "page" | "object" | "spacing" | "dimension" | "container";

export type WorkspaceSnapGuide = {
  axis: "x" | "y";
  kind: WorkspaceSnapGuideKind;
  position: number;
  start: number;
  end: number;
  label?: string;
  priority?: number;
};

export type WorkspaceSnapResolution = {
  point: WorkspacePoint;
  guides: WorkspaceSnapGuide[];
};

export type WorkspaceVisualAids = {
  rulersVisible: boolean;
  gridVisible: boolean;
  marginsVisible: boolean;
  guidesVisible: boolean;
  snapEnabled: boolean;
  snapToGrid: boolean;
  snapToMargins: boolean;
  snapToPageBounds: boolean;
  marginGuidesVisible: boolean;
};

export function buildWorkspaceLayout(pages: WorkspacePageSource[], settings: Pick<EditorWorkspaceSettings, "pageGap" | "pagePadding">): WorkspaceLayout {
  const maxWidth = pages.reduce((max, page) => Math.max(max, page.width), 0);
  const pageLayouts: WorkspacePageLayout[] = [];
  let cursorY = settings.pagePadding;

  pages.forEach((page) => {
    const x = settings.pagePadding + Math.max(0, (maxWidth - page.width) / 2);
    pageLayouts.push({
      ...page,
      x,
      y: cursorY,
      orientation: derivePageOrientation(page.width, page.height),
    });
    cursorY += page.height + settings.pageGap;
  });

  const width = maxWidth + settings.pagePadding * 2;
  const height = pageLayouts.length > 0 ? cursorY - settings.pageGap + settings.pagePadding : settings.pagePadding * 2;

  return {
    width,
    height,
    pages: pageLayouts,
  };
}

export function buildActiveWorkspaceLayout(pages: WorkspacePageSource[], activePageId: string | null | undefined, settings: Pick<EditorWorkspaceSettings, "pageGap" | "pagePadding">): WorkspaceLayout {
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  return buildWorkspaceLayout(activePage ? [activePage] : [], settings);
}

export function resolveWorkspaceContentBounds(layout: WorkspaceLayout): WorkspaceContentBounds | null {
  if (layout.pages.length === 0) {
    return null;
  }

  const left = layout.pages.reduce((min, page) => Math.min(min, page.x), Number.POSITIVE_INFINITY);
  const top = layout.pages.reduce((min, page) => Math.min(min, page.y), Number.POSITIVE_INFINITY);
  const right = layout.pages.reduce((max, page) => Math.max(max, page.x + page.width), Number.NEGATIVE_INFINITY);
  const bottom = layout.pages.reduce((max, page) => Math.max(max, page.y + page.height), Number.NEGATIVE_INFINITY);

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function resolveEffectiveRulerMode(settings: Pick<EditorWorkspaceSettings, "rulerMode">): RulerMode {
  return settings.rulerMode;
}

export function resolveEffectiveWorkspaceMode(mode: WorkspaceMode | "document" | string | null | undefined): WorkspaceMode {
  switch (mode) {
    case "fit-space":
    case "fit-width":
    case "free":
      return mode;
    case "document":
      return "free";
    default:
      return "fit-space";
  }
}

export function resolveWorkspaceVisualAids(
  settings: Pick<
    EditorWorkspaceSettings,
    "rulersVisible" | "gridEnabled" | "marginsVisible" | "guidesVisible" | "snapEnabled" | "snapToGrid" | "snapToMargins" | "snapToPageBounds"
  >,
): WorkspaceVisualAids {
  return {
    rulersVisible: settings.rulersVisible,
    gridVisible: settings.gridEnabled,
    marginsVisible: settings.marginsVisible,
    guidesVisible: settings.guidesVisible,
    snapEnabled: settings.snapEnabled,
    snapToGrid: settings.snapEnabled && settings.snapToGrid,
    snapToMargins: settings.snapEnabled && settings.snapToMargins,
    snapToPageBounds: settings.snapEnabled && settings.snapToPageBounds,
    marginGuidesVisible: settings.guidesVisible && settings.marginsVisible,
  };
}

export function derivePageOrientation(width: number, height: number): "portrait" | "landscape" | "square" {
  if (Math.abs(width - height) <= 1) {
    return "square";
  }

  return width > height ? "landscape" : "portrait";
}

export function findWorkspacePageAtPoint(layout: WorkspaceLayout, point: WorkspacePoint, fallbackPageId?: string | null): WorkspacePageLayout | null {
  const hit = layout.pages.find((page) => point.x >= page.x && point.x <= page.x + page.width && point.y >= page.y && point.y <= page.y + page.height);
  if (hit) {
    return hit;
  }

  if (fallbackPageId) {
    return layout.pages.find((page) => page.id === fallbackPageId) ?? layout.pages[0] ?? null;
  }

  return layout.pages[0] ?? null;
}

export function findWorkspacePageAtPointStrict(layout: WorkspaceLayout, point: WorkspacePoint): WorkspacePageLayout | null {
  return layout.pages.find((page) => point.x >= page.x && point.x <= page.x + page.width && point.y >= page.y && point.y <= page.y + page.height) ?? null;
}

export function convertClientPointToWorkspacePoint(
  clientPoint: WorkspacePoint,
  containerRect: Pick<DOMRect, "left" | "top">,
  viewport: WorkspaceViewport,
): WorkspacePoint {
  return {
    x: (clientPoint.x - containerRect.left - viewport.panX) / Math.max(viewport.zoom, 0.0001),
    y: (clientPoint.y - containerRect.top - viewport.panY) / Math.max(viewport.zoom, 0.0001),
  };
}

export function convertWorkspacePointToPagePoint(point: WorkspacePoint, page: WorkspacePageLayout): WorkspacePoint {
  return {
    x: point.x - page.x,
    y: point.y - page.y,
  };
}

export function snapWorkspacePoint(point: WorkspacePoint, page: WorkspacePageLayout, settings: EditorWorkspaceSettings, screenScale = 1): WorkspacePoint {
  return resolveWorkspaceSnapResolution(point, page, settings, screenScale).point;
}

export function snapWorkspaceFrame(frame: Rect, page: WorkspacePageLayout, settings: EditorWorkspaceSettings, screenScale = 1): Rect {
  if (!resolveWorkspaceVisualAids(settings).snapEnabled) {
    return clampFrameToPage(frame, page);
  }

  const snappedStart = snapWorkspacePoint({ x: frame.x, y: frame.y }, page, settings, screenScale);
  const snappedEnd = snapWorkspacePoint({ x: frame.x + frame.width, y: frame.y + frame.height }, page, settings, screenScale);
  const nextFrame = normalizeFrame(snappedStart, snappedEnd);

  return clampFrameToPage(nextFrame, page);
}

export function resolveWorkspaceSnapResolution(point: WorkspacePoint, page: WorkspacePageLayout, settings: EditorWorkspaceSettings, screenScale = 1): WorkspaceSnapResolution {
  const visualAids = resolveWorkspaceVisualAids(settings);
  if (!visualAids.snapEnabled) {
    return { point, guides: [] };
  }

  let nextPoint = { ...point };
  const guides: WorkspaceSnapGuide[] = [];
  const screenScaleFactor = Math.max(screenScale, 0.0001);
  const snapTolerance = settings.snapTolerance / screenScaleFactor;

  const pushGuide = (guide: WorkspaceSnapGuide) => {
    const exists = guides.some((current) => current.axis === guide.axis && current.kind === guide.kind && Math.abs(current.position - guide.position) <= 0.001);
    if (!exists) {
      guides.push(guide);
    }
  };

  if (visualAids.snapToGrid && settings.gridSize > 0) {
    const snappedX = Math.round(nextPoint.x / settings.gridSize) * settings.gridSize;
    const snappedY = Math.round(nextPoint.y / settings.gridSize) * settings.gridSize;
    if (Math.abs(snappedX - nextPoint.x) > 0.001) {
      pushGuide({ axis: "x", kind: "grid", position: snappedX, start: 0, end: page.height, priority: 10 });
    }
    if (Math.abs(snappedY - nextPoint.y) > 0.001) {
      pushGuide({ axis: "y", kind: "grid", position: snappedY, start: 0, end: page.width, priority: 10 });
    }
    nextPoint = { x: snappedX, y: snappedY };
  }

  if (visualAids.snapToMargins) {
    const marginTargets = [
      { axis: "x" as const, value: page.margin.left, kind: "margin" as const },
      { axis: "x" as const, value: page.width - page.margin.right, kind: "margin" as const },
      { axis: "y" as const, value: page.margin.top, kind: "margin" as const },
      { axis: "y" as const, value: page.height - page.margin.bottom, kind: "margin" as const },
    ];

    for (const target of marginTargets) {
      if (target.axis === "x" && Math.abs(nextPoint.x - target.value) <= snapTolerance) {
        pushGuide({ axis: "x", kind: target.kind, position: target.value, start: 0, end: page.height, priority: 80 });
        nextPoint = { ...nextPoint, x: target.value };
      }
      if (target.axis === "y" && Math.abs(nextPoint.y - target.value) <= snapTolerance) {
        pushGuide({ axis: "y", kind: target.kind, position: target.value, start: 0, end: page.width, priority: 80 });
        nextPoint = { ...nextPoint, y: target.value };
      }
    }
  }

  if (visualAids.snapToPageBounds) {
    const clampedX = clamp(nextPoint.x, 0, page.width);
    const clampedY = clamp(nextPoint.y, 0, page.height);
    if (Math.abs(clampedX - nextPoint.x) > 0.001) {
      pushGuide({ axis: "x", kind: "bounds", position: clampedX, start: 0, end: page.height, priority: 60 });
    }
    if (Math.abs(clampedY - nextPoint.y) > 0.001) {
      pushGuide({ axis: "y", kind: "bounds", position: clampedY, start: 0, end: page.width, priority: 60 });
    }
    nextPoint = { x: clampedX, y: clampedY };
  }

  return { point: nextPoint, guides };
}

export function buildRulerTicks(
  lengthPx: number,
  majorStep: number,
  minorStep: number,
  fineStep: number,
  measurementUnit: MeasurementUnit,
  workspaceOffset = 0,
): RulerTick[] {
  const ticks: RulerTick[] = [];
  const positions = new Map<string, number>();
  const epsilon = 0.0001;
  const baseStep = [majorStep, minorStep, fineStep].filter((step) => Number.isFinite(step) && step > 0).reduce((min, step) => Math.min(min, step), Number.POSITIVE_INFINITY);
  const step = Number.isFinite(baseStep) ? Math.max(baseStep, epsilon) : 1;

  const addPosition = (position: number) => {
    const normalized = roundPosition(position);
    const key = normalized.toFixed(4);
    positions.set(key, normalized);
  };

  for (let position = 0; position <= lengthPx + epsilon; position += step) {
    addPosition(position);
  }

  if (lengthPx > 0) {
    addPosition(lengthPx);
  }

  if (majorStep > 0) {
    for (let position = 0; position <= lengthPx + epsilon; position += majorStep) {
      addPosition(position);
    }
  }

  if (minorStep > 0) {
    for (let position = 0; position <= lengthPx + epsilon; position += minorStep) {
      addPosition(position);
    }
  }

  const sortedPositions = Array.from(positions.values()).sort((left, right) => left - right);

  for (const position of sortedPositions) {
    const isMajor = isCloseToMultiple(position, majorStep);
    const isMinor = !isMajor && isCloseToMultiple(position, minorStep);
    ticks.push({
      isMajor,
      isMinor,
      label: isMajor ? formatMeasurementValue(position, measurementUnit, 0) : undefined,
      position,
      workspacePosition: workspaceOffset + position,
    });
  }

  return ticks;
}

export function resolveRulerOrigin(layout: WorkspaceLayout, activePageId: string | null | undefined, mode: RulerMode): WorkspacePoint {
  if (mode === "global") {
    return { x: 0, y: 0 };
  }

  const activePage = resolveWorkspaceRulerPage(layout, activePageId);
  return activePage ? { x: activePage.x, y: activePage.y } : { x: 0, y: 0 };
}

export function resolveWorkspaceRulerTicks(
  layout: WorkspaceLayout,
  activePageId: string | null | undefined,
  input: {
    mode: RulerMode;
    majorStep: number;
    minorStep: number;
    fineStep: number;
    measurementUnit: MeasurementUnit;
  },
): WorkspaceRulerTicks {
  if (input.mode === "global") {
    return {
      mode: "global",
      origin: { x: 0, y: 0 },
      horizontal: buildRulerTicks(layout.width, input.majorStep, input.minorStep, input.fineStep, input.measurementUnit),
      vertical: buildRulerTicks(layout.height, input.majorStep, input.minorStep, input.fineStep, input.measurementUnit),
    };
  }

  const activePage = resolveWorkspaceRulerPage(layout, activePageId);
  if (!activePage) {
    return {
      mode: "page",
      origin: { x: 0, y: 0 },
      horizontal: [],
      vertical: [],
    };
  }

  return {
    mode: "page",
    origin: { x: activePage.x, y: activePage.y },
    horizontal: buildRulerTicks(activePage.width, input.majorStep, input.minorStep, input.fineStep, input.measurementUnit, activePage.x),
    vertical: buildRulerTicks(activePage.height, input.majorStep, input.minorStep, input.fineStep, input.measurementUnit, activePage.y),
  };
}

export function projectRulerTickToViewportPosition(tick: RulerTick, viewport: WorkspaceViewport, axis: "x" | "y") {
  return tick.workspacePosition * viewport.zoom + (axis === "x" ? viewport.panX : viewport.panY);
}

export function projectWorkspacePositionToViewport(position: number, viewport: WorkspaceViewport, axis: "x" | "y") {
  return position * viewport.zoom + (axis === "x" ? viewport.panX : viewport.panY);
}

export function resolveWorkspaceViewportPreset(
  layout: WorkspaceLayout,
  viewportSize: { width: number; height: number },
  input: {
    mode: WorkspaceMode | "document" | string | null | undefined;
    autoCenterOnLoad: boolean;
    currentViewport: WorkspaceViewport;
    minZoom?: number;
    maxZoom?: number;
  },
): WorkspaceViewport | null {
  const mode = resolveEffectiveWorkspaceMode(input.mode);
  const width = Math.max(0, viewportSize.width);
  const height = Math.max(0, viewportSize.height);

  if (layout.width <= 0 || layout.height <= 0 || width <= 0 || height <= 0) {
    return null;
  }

  const contentBounds = resolveWorkspaceContentBounds(layout);
  if (!contentBounds || contentBounds.width <= 0 || contentBounds.height <= 0) {
    return null;
  }

  const minZoom = input.minZoom ?? 0.25;
  const maxZoom = input.maxZoom ?? 4;
  const fitWidthZoom = width / contentBounds.width;
  const fitHeightZoom = height / contentBounds.height;
  const openingZoomBias = input.autoCenterOnLoad ? 0.92 : 1;
  let zoom = input.currentViewport.zoom;

  if (mode === "fit-space") {
    zoom = Math.min(fitWidthZoom, fitHeightZoom) * openingZoomBias;
  } else if (mode === "fit-width") {
    zoom = fitWidthZoom;
  } else if (!input.autoCenterOnLoad) {
    return null;
  }

  const resolvedZoom = clamp(zoom, minZoom, maxZoom);
  return {
    zoom: resolvedZoom,
    panX: (width - contentBounds.width * resolvedZoom) / 2 - contentBounds.x * resolvedZoom,
    panY: (height - contentBounds.height * resolvedZoom) / 2 - contentBounds.y * resolvedZoom,
  };
}

function resolveWorkspaceRulerPage(layout: WorkspaceLayout, activePageId: string | null | undefined): WorkspacePageLayout | null {
  return layout.pages.find((page) => page.id === activePageId) ?? layout.pages[0] ?? null;
}

function clampFrameToPage(frame: Rect, page: WorkspacePageLayout): Rect {
  const width = Math.min(frame.width, page.width);
  const height = Math.min(frame.height, page.height);
  return {
    x: clamp(frame.x, 0, Math.max(0, page.width - width)),
    y: clamp(frame.y, 0, Math.max(0, page.height - height)),
    width,
    height,
  };
}

function normalizeFrame(start: WorkspacePoint, end: WorkspacePoint): Rect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.max(Math.abs(end.x - start.x), 1);
  const height = Math.max(Math.abs(end.y - start.y), 1);
  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundPosition(value: number) {
  return Math.round(value * 10000) / 10000;
}

function isCloseToMultiple(value: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) {
    return false;
  }

  const multiple = Math.round(value / step);
  return Math.abs(value - multiple * step) <= Math.max(0.0001, step / 1000);
}
