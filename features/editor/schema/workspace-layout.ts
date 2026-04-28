import type { PageMargin } from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";

export type EditorWorkspaceSettings = {
  gridEnabled: boolean;
  gridSize: number;
  rulersVisible: boolean;
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
};

export const defaultWorkspaceSettings: EditorWorkspaceSettings = {
  gridEnabled: true,
  gridSize: 20,
  rulersVisible: true,
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
  label?: string;
  position: number;
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

export function snapWorkspacePoint(point: WorkspacePoint, page: WorkspacePageLayout, settings: EditorWorkspaceSettings): WorkspacePoint {
  if (!settings.snapEnabled) {
    return point;
  }

  let nextPoint = { ...point };

  if (settings.snapToGrid && settings.gridEnabled && settings.gridSize > 0) {
    nextPoint = {
      x: Math.round(nextPoint.x / settings.gridSize) * settings.gridSize,
      y: Math.round(nextPoint.y / settings.gridSize) * settings.gridSize,
    };
  }

  if (settings.snapToMargins && settings.marginsVisible) {
    const marginRects = [
      { axis: "x" as const, value: page.margin.left },
      { axis: "x" as const, value: page.width - page.margin.right },
      { axis: "y" as const, value: page.margin.top },
      { axis: "y" as const, value: page.height - page.margin.bottom },
    ];

    for (const margin of marginRects) {
      if (margin.axis === "x" && Math.abs(nextPoint.x - margin.value) <= settings.snapTolerance) {
        nextPoint = { ...nextPoint, x: margin.value };
      }
      if (margin.axis === "y" && Math.abs(nextPoint.y - margin.value) <= settings.snapTolerance) {
        nextPoint = { ...nextPoint, y: margin.value };
      }
    }
  }

  if (settings.snapToPageBounds) {
    nextPoint = {
      x: clamp(nextPoint.x, 0, page.width),
      y: clamp(nextPoint.y, 0, page.height),
    };
  }

  return nextPoint;
}

export function snapWorkspaceFrame(frame: Rect, page: WorkspacePageLayout, settings: EditorWorkspaceSettings): Rect {
  if (!settings.snapEnabled) {
    return clampFrameToPage(frame, page);
  }

  const snappedStart = snapWorkspacePoint({ x: frame.x, y: frame.y }, page, settings);
  const snappedEnd = snapWorkspacePoint({ x: frame.x + frame.width, y: frame.y + frame.height }, page, settings);
  const nextFrame = normalizeFrame(snappedStart, snappedEnd);

  return clampFrameToPage(nextFrame, page);
}

export function buildRulerTicks(lengthPx: number, majorStep: number, minorStep: number): RulerTick[] {
  const ticks: RulerTick[] = [];
  const step = Math.max(1, minorStep);

  for (let position = 0; position <= lengthPx; position += step) {
    const isMajor = position % Math.max(1, majorStep) === 0 || position === lengthPx;
    ticks.push({
      isMajor,
      label: isMajor ? String(position) : undefined,
      position,
    });
  }

  const lastTick = ticks[ticks.length - 1];
  if (!lastTick || lastTick.position !== lengthPx) {
    ticks.push({ isMajor: true, label: String(lengthPx), position: lengthPx });
  }

  return ticks;
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
