import type {
  CanvasObjectGeometryPatch,
  CanvasObjectStylePatch,
} from "@/features/editor/schema/canvas-mutation";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";

export type EditorOperationAction =
  | "insert"
  | "move"
  | "resize"
  | "rotate"
  | "style"
  | "delete"
  | "transform"
  | "dragstart"
  | "dragenter"
  | "dragover"
  | "dragleave"
  | "drop"
  | "dragend"
  | "drop-reject";

export type EditorOperationDetail = {
  label: string;
  value: string;
};

export type EditorOperationSnapshot = {
  id: string;
  pageId: string;
  frame: Rect;
  rotation: number;
};

export type EditorOperationLogEntry = {
  id: string;
  timestamp: number;
  action: EditorOperationAction;
  pageId: string;
  elementId: string;
  before: EditorOperationSnapshot | null;
  after: EditorOperationSnapshot | null;
  details?: EditorOperationDetail[];
};

const EPSILON = 0.0001;

export function buildInsertOperationLog(input: {
  element: TemplateSchema["elements"][number];
  pageId: string;
  timestamp?: number;
}): EditorOperationLogEntry {
  const after = snapshotElement(input.element, input.pageId);
  return {
    id: createOperationLogId("insert", after.id, input.timestamp ?? Date.now()),
    timestamp: input.timestamp ?? Date.now(),
    action: "insert",
    pageId: input.pageId,
    elementId: after.id,
    before: null,
    after,
  };
}

export function buildStyleOperationLogs(input: {
  beforeTemplate: TemplateSchema;
  afterTemplate: TemplateSchema;
  patches: CanvasObjectStylePatch[];
  timestamp?: number;
}): EditorOperationLogEntry[] {
  const timestamp = input.timestamp ?? Date.now();
  const beforeById = new Map(
    input.beforeTemplate.elements.map((element) => [element.id, element] as const),
  );
  const afterById = new Map(
    input.afterTemplate.elements.map((element) => [element.id, element] as const),
  );

  const entries: Array<EditorOperationLogEntry | null> = input.patches.map((patch) => {
    const beforeElement = beforeById.get(patch.id);
    const afterElement = afterById.get(patch.id);
    if (!beforeElement || !afterElement) {
      return null;
    }

    const pageId = beforeElement.pageId ?? afterElement.pageId;
    const before = snapshotElement(beforeElement, pageId);
    const after = snapshotElement(afterElement, pageId);
    const details = buildStyleDetails(beforeElement.style ?? {}, afterElement.style ?? {});
    if (details.length === 0) {
      return null;
    }

    return {
      id: createOperationLogId("style", patch.id, timestamp),
      timestamp,
      action: "style",
      pageId,
      elementId: patch.id,
      before,
      after,
      details,
    } satisfies EditorOperationLogEntry;
  });

  return entries.filter((entry): entry is EditorOperationLogEntry => entry !== null);
}

export function buildTraceOperationLog(input: {
  action: Extract<
    EditorOperationAction,
    "dragstart" | "dragenter" | "dragover" | "dragleave" | "drop" | "dragend" | "drop-reject"
  >;
  pageId: string;
  elementId: string;
  details: EditorOperationDetail[];
  timestamp?: number;
}): EditorOperationLogEntry {
  const timestamp = input.timestamp ?? Date.now();
  return {
    id: createOperationLogId(input.action, input.elementId, timestamp),
    timestamp,
    action: input.action,
    pageId: input.pageId,
    elementId: input.elementId,
    before: null,
    after: null,
    details: input.details,
  };
}

export function buildGeometryOperationLogs(input: {
  beforeTemplate: TemplateSchema;
  afterTemplate: TemplateSchema;
  pageId: string;
  patches: CanvasObjectGeometryPatch[];
  timestamp?: number;
}): EditorOperationLogEntry[] {
  const timestamp = input.timestamp ?? Date.now();
  const beforeById = new Map(
    input.beforeTemplate.elements.map((element) => [element.id, element] as const),
  );
  const afterById = new Map(
    input.afterTemplate.elements.map((element) => [element.id, element] as const),
  );

  const entries: Array<EditorOperationLogEntry | null> = input.patches.map((patch) => {
    const beforeElement = beforeById.get(patch.id);
    const afterElement = afterById.get(patch.id);
    if (!beforeElement || !afterElement) {
      return null;
    }

    const before = snapshotElement(beforeElement, input.pageId);
    const after = snapshotElement(afterElement, input.pageId);

    return {
      id: createOperationLogId(classifyOperationAction(before, after), patch.id, timestamp),
      timestamp,
      action: classifyOperationAction(before, after),
      pageId: input.pageId,
      elementId: patch.id,
      before,
      after,
    } satisfies EditorOperationLogEntry;
  });

  return entries.filter((entry): entry is EditorOperationLogEntry => entry !== null);
}

export function formatOperationAction(action: EditorOperationAction) {
  switch (action) {
    case "insert":
      return "Insertion";
    case "move":
      return "Déplacement";
    case "resize":
      return "Redimensionnement";
    case "rotate":
      return "Rotation";
    case "style":
      return "Style";
    case "delete":
      return "Suppression";
    case "transform":
      return "Transformation";
    case "dragstart":
      return "Début drag";
    case "dragenter":
      return "Entrée drag";
    case "dragover":
      return "Survol drag";
    case "dragleave":
      return "Sortie drag";
    case "drop":
      return "Drop";
    case "dragend":
      return "Fin drag";
    case "drop-reject":
      return "Drop rejeté";
  }
}

export function formatOperationSnapshot(snapshot: EditorOperationSnapshot) {
  return `x=${formatNumber(snapshot.frame.x)}, y=${formatNumber(snapshot.frame.y)}, w=${formatNumber(snapshot.frame.width)}, h=${formatNumber(snapshot.frame.height)}, rot=${formatNumber(snapshot.rotation)}`;
}

export function formatOperationSnapshotOrDeleted(snapshot: EditorOperationSnapshot | null) {
  return snapshot ? formatOperationSnapshot(snapshot) : "Supprimé";
}

function snapshotElement(
  element: TemplateSchema["elements"][number],
  pageId: string,
): EditorOperationSnapshot {
  return {
    id: element.id,
    pageId,
    frame: {
      x: element.frame.x,
      y: element.frame.y,
      width: element.frame.width,
      height: element.frame.height,
    },
    rotation: element.rotation ?? 0,
  };
}

export function buildDeleteOperationLogs(input: {
  beforeTemplate: TemplateSchema;
  afterTemplate: TemplateSchema;
  elementIds: string[];
  timestamp?: number;
}): EditorOperationLogEntry[] {
  const timestamp = input.timestamp ?? Date.now();
  const beforeById = new Map(
    input.beforeTemplate.elements.map((element) => [element.id, element] as const),
  );
  const afterById = new Map(
    input.afterTemplate.elements.map((element) => [element.id, element] as const),
  );
  const entries: EditorOperationLogEntry[] = [];

  for (const elementId of input.elementIds) {
    const beforeElement = beforeById.get(elementId);
    if (!beforeElement) {
      continue;
    }

    const afterElement = afterById.get(elementId) ?? null;
    const before = snapshotElement(beforeElement, beforeElement.pageId);
    const after = afterElement ? snapshotElement(afterElement, afterElement.pageId) : null;

    entries.push({
      id: createOperationLogId("delete", elementId, timestamp),
      timestamp,
      action: "delete",
      pageId: before.pageId,
      elementId,
      before,
      after,
    });
  }

  return entries;
}

function classifyOperationAction(
  before: EditorOperationSnapshot,
  after: EditorOperationSnapshot,
): EditorOperationAction {
  const frameChanged = !areRectsEqual(before.frame, after.frame);
  const rotationChanged = !isApproximatelyEqual(before.rotation, after.rotation);

  if (!frameChanged && rotationChanged) {
    return "rotate";
  }

  if (frameChanged && !rotationChanged) {
    const moved =
      !isApproximatelyEqual(before.frame.x, after.frame.x) ||
      !isApproximatelyEqual(before.frame.y, after.frame.y);
    const resized =
      !isApproximatelyEqual(before.frame.width, after.frame.width) ||
      !isApproximatelyEqual(before.frame.height, after.frame.height);

    if (moved && !resized) {
      return "move";
    }

    if (!moved && resized) {
      return "resize";
    }
  }

  return frameChanged || rotationChanged ? "transform" : "move";
}

function areRectsEqual(a: Rect, b: Rect) {
  return (
    isApproximatelyEqual(a.x, b.x) &&
    isApproximatelyEqual(a.y, b.y) &&
    isApproximatelyEqual(a.width, b.width) &&
    isApproximatelyEqual(a.height, b.height)
  );
}

function isApproximatelyEqual(a: number, b: number) {
  return Math.abs(a - b) < EPSILON;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function createOperationLogId(action: string, elementId: string, timestamp: number) {
  return `op:${action}:${elementId}:${timestamp}`;
}

function buildStyleDetails(
  beforeStyle: Record<string, unknown>,
  afterStyle: Record<string, unknown>,
): EditorOperationDetail[] {
  const fields: Array<{
    key: string;
    label: string;
    format?: (value: unknown) => string;
  }> = [
    { key: "fill", label: "Fond" },
    { key: "stroke", label: "Contour" },
    { key: "strokeWidth", label: "Trait", format: formatStyleNumber },
    { key: "opacity", label: "Opacité", format: formatStyleOpacity },
    { key: "dash", label: "Tiret", format: formatStyleDash },
  ];

  return fields
    .map((field) => {
      const before = beforeStyle[field.key];
      const after = afterStyle[field.key];
      if (areStyleValuesEqual(before, after)) {
        return null;
      }

      return {
        label: field.label,
        value: `${formatStyleValue(before, field.format)} → ${formatStyleValue(after, field.format)}`,
      };
    })
    .filter((entry): entry is EditorOperationDetail => entry !== null);
}

function areStyleValuesEqual(before: unknown, after: unknown) {
  if (Array.isArray(before) && Array.isArray(after)) {
    return areNumberArraysEqual(before, after);
  }

  return before === after;
}

function formatStyleValue(value: unknown, format?: (value: unknown) => string) {
  if (format) {
    return format(value);
  }

  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => (typeof item === "number" ? formatNumber(item) : String(item))).join(", ")}]`;
  }

  return String(value);
}

function formatStyleNumber(value: unknown) {
  return typeof value === "number" ? formatNumber(value) : "—";
}

function formatStyleOpacity(value: unknown) {
  return typeof value === "number" ? formatDecimal(value) : "—";
}

function formatStyleDash(value: unknown) {
  return Array.isArray(value)
    ? `[${value.map((item) => (typeof item === "number" ? formatNumber(item) : String(item))).join(", ")}]`
    : "—";
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : Number.parseFloat(value.toFixed(2)).toString();
}

function areNumberArraysEqual(a: unknown[] | undefined, b: unknown[] | undefined) {
  if (a === b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}
