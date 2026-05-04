"use client";

export type CanvasShortcutAction = "copy" | "paste" | "undo" | "redo";

export function isCanvasShortcutEditableTarget(target: unknown) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const element = target as {
    isContentEditable?: boolean;
    closest?: (selector: string) => unknown;
  };

  if (element.isContentEditable) {
    return true;
  }

  if (typeof element.closest === "function") {
    return Boolean(element.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
  }

  return false;
}

export function resolveCanvasShortcutAction(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey"> & { shiftKey?: boolean }): CanvasShortcutAction | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) {
    return null;
  }

  switch (event.key.toLowerCase()) {
    case "c":
      return "copy";
    case "v":
      return "paste";
    case "z":
      return event.shiftKey ? "redo" : "undo";
    case "y":
      return "redo";
    default:
      return null;
  }
}
