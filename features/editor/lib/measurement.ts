export type MeasurementUnit = "px" | "mm" | "cm" | "pt" | "in";

export type MeasurementPoint = {
  x: number;
  y: number;
};

export type MeasurementViewport = {
  zoom: number;
  panX: number;
  panY: number;
};

export type MeasurementPageLayout = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MeasurementLayout = {
  width: number;
  height: number;
  pages: MeasurementPageLayout[];
};

export type MeasurementRulerMode = "global" | "page";

export type MeasurementRulerTick = {
  isMajor: boolean;
  grade: "major" | "minor" | "fine";
  label?: string;
  position: number;
  workspacePosition: number;
};

export type MeasurementRulerTicks = {
  mode: MeasurementRulerMode;
  origin: MeasurementPoint;
  horizontal: MeasurementRulerTick[];
  vertical: MeasurementRulerTick[];
};

export const DEFAULT_MEASUREMENT_UNIT: MeasurementUnit = "px";
export const MEASUREMENT_UNITS: MeasurementUnit[] = ["px", "mm", "cm", "pt", "in"];

const PX_PER_IN = 96;
const MM_PER_IN = 25.4;
const PT_PER_IN = 72;

export function normalizeMeasurementUnit(unit?: string | null): MeasurementUnit {
  return unit && isMeasurementUnit(unit) ? unit : DEFAULT_MEASUREMENT_UNIT;
}

export function isMeasurementUnit(unit: string): unit is MeasurementUnit {
  return MEASUREMENT_UNITS.includes(unit as MeasurementUnit);
}

export function measurementUnitToPxFactor(unit: MeasurementUnit): number {
  switch (unit) {
    case "px":
      return 1;
    case "mm":
      return PX_PER_IN / MM_PER_IN;
    case "cm":
      return PX_PER_IN / (MM_PER_IN / 10);
    case "pt":
      return PX_PER_IN / PT_PER_IN;
    case "in":
      return PX_PER_IN;
  }
}

export function convertMeasurementValue(value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit) {
  return convertPxToMeasurement(convertMeasurementToPx(value, fromUnit), toUnit);
}

export function convertPxToMeasurement(pxValue: number, unit: MeasurementUnit) {
  return pxValue / measurementUnitToPxFactor(unit);
}

export function convertMeasurementToPx(value: number, unit: MeasurementUnit) {
  return value * measurementUnitToPxFactor(unit);
}

export function resolveMeasurementFractionDigits(unit: MeasurementUnit, zoom = 1) {
  if (unit === "px") {
    return zoom >= 2 ? 1 : 0;
  }

  if (unit === "pt") {
    return zoom >= 2 ? 1 : 0;
  }

  if (unit === "mm") {
    return zoom >= 2 ? 2 : 1;
  }

  if (unit === "cm") {
    return zoom >= 2 ? 2 : 1;
  }

  return zoom >= 2 ? 2 : 1;
}

export function formatMeasurementNumber(valuePx: number, unit: MeasurementUnit, options?: { maximumFractionDigits?: number }) {
  const value = convertPxToMeasurement(valuePx, unit);
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: false,
    maximumFractionDigits: options?.maximumFractionDigits ?? resolveMeasurementFractionDigits(unit),
  }).format(value);
}

export function formatMeasurementValue(valuePx: number, unit: MeasurementUnit, options?: { maximumFractionDigits?: number }) {
  return `${formatMeasurementNumber(valuePx, unit, options)} ${unit}`;
}

export function convertClientPointToWorkspacePoint(
  clientPoint: MeasurementPoint,
  containerRect: Pick<DOMRect, "left" | "top">,
  viewport: MeasurementViewport,
): MeasurementPoint {
  return {
    x: (clientPoint.x - containerRect.left - viewport.panX) / Math.max(viewport.zoom, 0.0001),
    y: (clientPoint.y - containerRect.top - viewport.panY) / Math.max(viewport.zoom, 0.0001),
  };
}

export function convertWorkspacePointToPagePoint(point: MeasurementPoint, page: MeasurementPageLayout): MeasurementPoint {
  return {
    x: point.x - page.x,
    y: point.y - page.y,
  };
}

export function buildRulerTicks(
  lengthPx: number,
  majorStep: number,
  minorStep: number,
  workspaceOffset = 0,
  measurementUnit: MeasurementUnit = "px",
  zoom = 1,
  fineStep = 0,
): MeasurementRulerTick[] {
  const ticks: MeasurementRulerTick[] = [];
  const majorStepPx = Math.max(1, majorStep);
  const minorStepPx = Math.max(1, minorStep);
  const fineStepPx = fineStep > 0 ? Math.max(1, fineStep) : 0;
  const activeStepPx = zoom >= 1.75 && fineStepPx > 0 ? Math.min(minorStepPx, fineStepPx) : minorStepPx;
  const tolerance = Math.max(0.001, Math.min(activeStepPx, majorStepPx) * 0.01);
  const totalSteps = Math.max(1, Math.ceil(lengthPx / activeStepPx));

  for (let index = 0; index <= totalSteps; index += 1) {
    const normalizedPosition = clampMeasurement(index * activeStepPx, lengthPx);
    const isMajor = index === 0 || isCloseToMultiple(normalizedPosition, majorStepPx, tolerance);
    const isFine = !isMajor && zoom >= 1.75 && fineStepPx > 0 && isCloseToMultiple(normalizedPosition, fineStepPx, tolerance);
    ticks.push({
      isMajor,
      grade: isMajor ? "major" : isFine ? "fine" : "minor",
      label: isMajor ? formatRulerTickLabel(normalizedPosition, measurementUnit) : undefined,
      position: normalizedPosition,
      workspacePosition: workspaceOffset + normalizedPosition,
    });
  }

  return ticks;
}

export function resolveRulerOrigin(layout: MeasurementLayout, activePageId: string | null | undefined, mode: MeasurementRulerMode): MeasurementPoint {
  if (mode === "global") {
    return { x: 0, y: 0 };
  }

  const activePage = resolveWorkspaceRulerPage(layout, activePageId);
  return activePage ? { x: activePage.x, y: activePage.y } : { x: 0, y: 0 };
}

export function resolveWorkspaceRulerTicks(
  layout: MeasurementLayout,
  activePageId: string | null | undefined,
  input: {
    mode: MeasurementRulerMode;
    majorStep: number;
    minorStep: number;
    measurementUnit?: MeasurementUnit;
    zoom?: number;
    fineStep?: number;
  },
): MeasurementRulerTicks {
  const measurementUnit = input.measurementUnit ?? DEFAULT_MEASUREMENT_UNIT;
  const zoom = input.zoom ?? 1;
  const fineStep = input.fineStep ?? 0;

  if (input.mode === "global") {
    return {
      mode: "global",
      origin: { x: 0, y: 0 },
      horizontal: buildRulerTicks(layout.width, input.majorStep, input.minorStep, 0, measurementUnit, zoom, fineStep),
      vertical: buildRulerTicks(layout.height, input.majorStep, input.minorStep, 0, measurementUnit, zoom, fineStep),
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
    horizontal: buildRulerTicks(activePage.width, input.majorStep, input.minorStep, activePage.x, measurementUnit, zoom, fineStep),
    vertical: buildRulerTicks(activePage.height, input.majorStep, input.minorStep, activePage.y, measurementUnit, zoom, fineStep),
  };
}

export function projectRulerTickToViewportPosition(tick: MeasurementRulerTick, viewport: MeasurementViewport, axis: "x" | "y") {
  return tick.workspacePosition * viewport.zoom + (axis === "x" ? viewport.panX : viewport.panY);
}

function clampMeasurement(value: number, max: number) {
  if (value < 0) {
    return 0;
  }

  if (value > max) {
    return max;
  }

  return Number.isFinite(value) ? Number.parseFloat(value.toFixed(3)) : 0;
}

function resolveWorkspaceRulerPage(layout: MeasurementLayout, activePageId: string | null | undefined): MeasurementPageLayout | null {
  return layout.pages.find((page) => page.id === activePageId) ?? layout.pages[0] ?? null;
}

function isCloseToMultiple(value: number, step: number, tolerance: number) {
  if (step <= 0) {
    return false;
  }

  const nearest = Math.round(value / step) * step;
  return Math.abs(value - nearest) <= tolerance;
}

function formatRulerTickLabel(valuePx: number, unit: MeasurementUnit) {
  const value = Math.round(convertPxToMeasurement(valuePx, unit));
  return `${value}`;
}
