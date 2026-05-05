import { describe, expect, it, vi } from "vitest";

import { applyRichTextLinkHref, normalizeRichTextLinkHref, resolveRichTextLinkHref } from "@/features/editor/lib/rich-text-link";

function createEditorMock(href: string | undefined = undefined) {
  const run = vi.fn();
  const command = {
    focus: vi.fn(() => command),
    extendMarkRange: vi.fn(() => command),
    setLink: vi.fn(() => command),
    unsetLink: vi.fn(() => command),
    run,
  };
  const editor = {
    getAttributes: vi.fn(() => ({ href })),
    chain: vi.fn(() => command),
  };

  return { editor, command, run };
}

describe("rich text link helpers", () => {
  it("normalizes safe link values and rejects unsafe or empty inputs", () => {
    expect(normalizeRichTextLinkHref("  example.com  ")).toBe("https://example.com");
    expect(normalizeRichTextLinkHref("/resume")).toBe("/resume");
    expect(normalizeRichTextLinkHref("#contact")).toBe("#contact");
    expect(normalizeRichTextLinkHref("mailto:hello@example.com")).toBe("mailto:hello@example.com");
    expect(normalizeRichTextLinkHref("javascript:alert(1)")).toBeNull();
    expect(normalizeRichTextLinkHref("   ")).toBeNull();
  });

  it("resolves the current href safely and trims it", () => {
    expect(resolveRichTextLinkHref(null)).toBe("");
    expect(resolveRichTextLinkHref({ getAttributes: vi.fn(() => ({ href: "  https://example.com  " })) } as never)).toBe("https://example.com");
  });

  it("applies a normalized link and clears the mark when the value is empty", () => {
    const withLink = createEditorMock("https://existing.example");
    const applied = applyRichTextLinkHref(withLink.editor as never, "example.org");

    expect(applied).toBe(true);
    expect(withLink.command.extendMarkRange).toHaveBeenCalledWith("link");
    expect(withLink.command.setLink).toHaveBeenCalledWith({ href: "https://example.org" });
    expect(withLink.command.unsetLink).not.toHaveBeenCalled();
    expect(withLink.command.run).toHaveBeenCalledTimes(1);

    const withoutLink = createEditorMock("https://existing.example");
    applyRichTextLinkHref(withoutLink.editor as never, "   ");

    expect(withoutLink.command.unsetLink).toHaveBeenCalledTimes(1);
    expect(withoutLink.command.setLink).not.toHaveBeenCalled();
    expect(withoutLink.command.run).toHaveBeenCalledTimes(1);
  });

  it("unsets the link when the value is unsafe and returns false without an editor", () => {
    const withLink = createEditorMock("https://existing.example");
    const applied = applyRichTextLinkHref(withLink.editor as never, "javascript:alert(1)");

    expect(applied).toBe(true);
    expect(withLink.command.unsetLink).toHaveBeenCalledTimes(1);
    expect(withLink.command.setLink).not.toHaveBeenCalled();
    expect(withLink.command.run).toHaveBeenCalledTimes(1);

    expect(applyRichTextLinkHref(null, "example.org")).toBe(false);
  });
});
