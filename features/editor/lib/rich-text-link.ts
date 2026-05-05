"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeRichTextLinkHref(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return trimmed;
  }

  const candidate = SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

export function resolveRichTextLinkHref(editor: Editor | null): string {
  if (!editor) {
    return "";
  }

  const href = editor.getAttributes("link").href;
  return typeof href === "string" ? href.trim() : "";
}

export function applyRichTextLinkHref(editor: Editor | null, value: string): boolean {
  if (!editor) {
    return false;
  }

  const normalized = normalizeRichTextLinkHref(value);
  if (!normalized) {
    editor.chain().focus().unsetLink().run();
    return true;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
  return true;
}

export function useRichTextLinkEditor(editor: Editor | null) {
  const currentHref = resolveRichTextLinkHref(editor);
  const [href, setHref] = useState(currentHref);

  useEffect(() => {
    setHref(currentHref);
  }, [currentHref]);

  const apply = useCallback(() => {
    const normalized = normalizeRichTextLinkHref(href);
    if (!editor) {
      return false;
    }

    if (!normalized) {
      editor.chain().focus().unsetLink().run();
      setHref("");
      return true;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    setHref(normalized);
    return true;
  }, [editor, href]);

  const clear = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
    setHref("");
  }, [editor]);

  return {
    href,
    setHref,
    currentHref,
    apply,
    clear,
    hasLink: currentHref.length > 0,
  };
}
