"use client";

import type { CSSProperties } from "react";

export function normalizeEditorColorValue(value: string, fallback = "#ffffff") {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed) || /^#[0-9a-f]{6}$/i.test(trimmed) || /^#[0-9a-f]{8}$/i.test(trimmed)) {
    return trimmed;
  }

  if (/^rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[0-9.]+)?\)$/i.test(trimmed)) {
    return trimmed;
  }

  if (/^linear-gradient\(/i.test(trimmed)) {
    return trimmed;
  }

  if (/^\{\{theme\.[a-z0-9_.-]+}}$/i.test(trimmed)) {
    return resolveEditorThemeTokenColor(trimmed);
  }

  if (trimmed.toLowerCase() === "transparent") {
    return "transparent";
  }

  return fallback;
}

export function resolveEditorColorButtonStyle(value: string, mixed: boolean): CSSProperties {
  if (mixed) {
    return {
      ["--palette-color"]: value,
    } as CSSProperties;
  }

  const normalized = normalizeEditorColorValue(value);
  if (/^linear-gradient\(/i.test(value.trim())) {
    return {
      ["--palette-color"]: "#ffffff",
      ["--palette-bg"]: value.trim(),
    } as CSSProperties;
  }

  if (normalized === "transparent") {
    return {
      ["--palette-color"]: "#ffffff",
      ["--palette-mixed"]: 1,
    } as CSSProperties;
  }

  return {
    ["--palette-color"]: normalized,
    ["--palette-bg"]: normalized,
  } as CSSProperties;
}

export function resolveEditorThemeTokenColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "{{theme.primary}}") return "#2563eb";
  if (normalized === "{{theme.text}}") return "#111827";
  if (normalized === "{{theme.border}}") return "#e5e7eb";
  if (normalized === "{{theme.surface}}") return "#ffffff";
  return "#2563eb";
}
