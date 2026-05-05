import type { StoreApi } from "zustand";

import type { CanvasWorkspaceLayer } from "@/features/editor/schema/canvas-insertion";
import type { CanvasObjectGeometryPatch } from "@/features/editor/schema/canvas-mutation";
import type { EditorOperationLogEntry } from "@/features/editor/schema/editor-operation-log";
import type { EditorWorkspaceSettings } from "@/features/editor/schema/workspace-layout";
import type { TemplateSchema, TemplateElement } from "@/features/editor/schema/template-schema";

export {
  readElementPropBoolean,
  readElementPropNumber,
  readElementPropString,
  resolveElementLabel,
  resolveElementLayerIdentity,
  resolveSingleLayerIdForPage,
  resolveStableLayerNumber,
} from "@/features/editor/schema/canvas-layer-object-model";

export function resolveNextWorkspaceLayerId(pageId: string, layers: CanvasWorkspaceLayer[]) {
  const existing = new Set(layers.map((layer) => layer.id));
  let index = layers.length + 1;
  let id = `${pageId}:layer-${index}`;
  while (existing.has(id)) {
    index += 1;
    id = `${pageId}:layer-${index}`;
  }
  return id;
}

export function resolveNextTemplatePageNumber(pages: TemplateSchema["pages"]) {
  const existingNumbers = pages
    .map((page) => /(?:^|\D)(\d+)$/.exec(page.id)?.[1] ?? /(?:^|\D)(\d+)$/.exec(page.name)?.[1])
    .map((value) => (value ? Number.parseInt(value, 10) : Number.NaN))
    .filter(Number.isFinite);
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : pages.length;
  return maxNumber + 1;
}

export function resolveNextTemplatePageId(pages: TemplateSchema["pages"], startNumber: number) {
  const existingIds = new Set(pages.map((page) => page.id));
  let pageNumber = startNumber;
  let pageId = `page-${pageNumber}`;
  while (existingIds.has(pageId)) {
    pageNumber += 1;
    pageId = `page-${pageNumber}`;
  }

  return pageId;
}

export function stripRichTextHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function hasCanvasGeometryChanged(before: TemplateElement, after: TemplateElement, patch: CanvasObjectGeometryPatch) {
  return (
    !areFramesEqual(before.frame, after.frame) ||
    !areNumbersEqual(before.rotation ?? 0, after.rotation ?? 0) ||
    !areOptionalNumberArraysEqual(readElementNumberArray(before, "points"), patch.points ? readElementNumberArray(after, "points") : readElementNumberArray(before, "points"))
  );
}

export function areFramesEqual(a: TemplateElement["frame"], b: TemplateElement["frame"]) {
  return areNumbersEqual(a.x, b.x) && areNumbersEqual(a.y, b.y) && areNumbersEqual(a.width, b.width) && areNumbersEqual(a.height, b.height);
}

export function areNumbersEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

export function readElementNumberArray(element: TemplateElement, key: string) {
  const value = element.props?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : null;
}

export function areOptionalNumberArraysEqual(a: number[] | null, b: number[] | null) {
  if (!a && !b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => areNumbersEqual(value, b[index] ?? Number.NaN));
}

export function clampFrameToPage(frame: TemplateSchema["elements"][number]["frame"], pageWidth: number, pageHeight: number) {
  const width = Math.min(frame.width, pageWidth);
  const height = Math.min(frame.height, pageHeight);
  return {
    x: clampNumber(frame.x, 0, Math.max(0, pageWidth - width)),
    y: clampNumber(frame.y, 0, Math.max(0, pageHeight - height)),
    width,
    height,
  };
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function clampEditorViewportZoom(zoom: number) {
  if (!Number.isFinite(zoom)) {
    return 1;
  }

  return Math.min(4, Math.max(0.25, zoom));
}

export function appendOperationLogs(existing: EditorOperationLogEntry[], next: EditorOperationLogEntry[]) {
  if (next.length === 0) {
    return existing;
  }

  const merged = [...existing, ...next];
  const limit = 150;
  return merged.length > limit ? merged.slice(merged.length - limit) : merged;
}

export function pushUndoCheckpoint(state: Pick<EditorStoreUndoCheckpointState, "undoStack" | "workingTemplate">): TemplateSchema[] {
  const next = [...state.undoStack, structuredClone(state.workingTemplate)];
  const limit = 50;
  return next.length > limit ? next.slice(next.length - limit) : next;
}

type EditorStoreUndoCheckpointState = {
  undoStack: TemplateSchema[];
  workingTemplate: TemplateSchema;
};
