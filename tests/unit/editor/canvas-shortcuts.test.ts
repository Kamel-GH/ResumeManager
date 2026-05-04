import { describe, expect, it } from "vitest";

import { isCanvasShortcutEditableTarget, resolveCanvasShortcutAction } from "@/features/editor/components/parts/canvas-shortcuts";

describe("canvas shortcuts", () => {
  it("resolves copy and paste shortcuts from common modifier keys", () => {
    expect(resolveCanvasShortcutAction({ key: "c", metaKey: true, ctrlKey: false, altKey: false })).toBe("copy");
    expect(resolveCanvasShortcutAction({ key: "C", metaKey: false, ctrlKey: true, altKey: false })).toBe("copy");
    expect(resolveCanvasShortcutAction({ key: "v", metaKey: true, ctrlKey: false, altKey: false })).toBe("paste");
    expect(resolveCanvasShortcutAction({ key: "x", metaKey: true, ctrlKey: false, altKey: false })).toBeNull();
    expect(resolveCanvasShortcutAction({ key: "v", metaKey: false, ctrlKey: false, altKey: false })).toBeNull();
  });

  it("ignores shortcut targets that should keep native text editing behavior", () => {
    const input = {
      closest: (selector: string) => (selector.includes("input") ? {} : null),
    };
    const textarea = {
      closest: (selector: string) => (selector.includes("textarea") ? {} : null),
    };
    const contentEditable = {
      isContentEditable: true,
    };
    const button = {
      closest: () => null,
    };

    expect(isCanvasShortcutEditableTarget(input)).toBe(true);
    expect(isCanvasShortcutEditableTarget(textarea)).toBe(true);
    expect(isCanvasShortcutEditableTarget(contentEditable)).toBe(true);
    expect(isCanvasShortcutEditableTarget(button)).toBe(false);
    expect(isCanvasShortcutEditableTarget(null)).toBe(false);
  });
});
