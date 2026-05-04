"use client";

import { X } from "lucide-react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";

export type EditorColorPopoverProps = {
  title: string;
  value: string;
  defaultValue: string;
  mixed: boolean;
  showReset?: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
  onClose: () => void;
};

export function EditorColorPopoverContent({
  title,
  value,
  defaultValue,
  mixed,
  showReset = true,
  onChange,
  onReset,
  onClose,
}: EditorColorPopoverProps) {
  const pickerValue = normalizeHexColorForPicker(value, defaultValue);
  const displayValue = mixed ? "Mixte" : formatEditorColorValue(value);

  return (
    <div className="ef-palette-color-panel">
      <div className="ef-palette-color-header">
        <div className="ef-palette-color-header-left">
          <span className="ef-palette-color-chip" style={resolveEditorColorChipStyle(value, mixed)} aria-hidden="true" />
          <div className="ef-palette-color-title">
            <span>{title}</span>
            <span className="ef-palette-color-value">{displayValue}</span>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="ef-palette-color-close" onClick={onClose} aria-label="Fermer" title="Fermer">
          <X size={12} aria-hidden="true" />
        </Button>
      </div>

      <div className="ef-palette-color-preview" style={resolveEditorColorChipStyle(value, mixed)} aria-hidden="true" />

      <HexColorPicker color={pickerValue} onChange={onChange} className="ef-palette-color-picker" />

      <div className="ef-palette-color-input-row">
        <HexColorInput color={pickerValue} onChange={onChange} prefixed className="ef-palette-color-input" />
        {showReset ? (
          <Button type="button" variant="outline" size="sm" className="ef-palette-color-reset" onClick={onReset}>
            Par défaut
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function normalizeHexColorForPicker(value: string, fallback: string) {
  const normalized = normalizeEditorColorValue(value, fallback);
  return /^#[0-9a-f]{3,8}$/i.test(normalized) ? normalized : fallback;
}

export function normalizeEditorColorValue(value: string, fallback = "#ffffff") {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(trimmed) || /^#[0-9a-f]{6}$/i.test(trimmed) || /^#[0-9a-f]{8}$/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.toLowerCase() === "transparent") {
    return "transparent";
  }

  return fallback;
}

export function formatEditorColorValue(value: string) {
  return normalizeEditorColorValue(value) === "transparent" ? "Aucun" : value;
}

export function resolveEditorColorChipStyle(value: string, mixed: boolean) {
  if (mixed) {
    return {
      backgroundImage:
        "linear-gradient(45deg, rgba(148, 163, 184, 0.35) 25%, transparent 25%, transparent 50%, rgba(148, 163, 184, 0.35) 50%, rgba(148, 163, 184, 0.35) 75%, transparent 75%, transparent)",
      backgroundSize: "8px 8px",
      backgroundColor: normalizeEditorColorValue(value),
    };
  }

  const normalized = normalizeEditorColorValue(value);
  if (normalized === "transparent") {
    return {
      backgroundImage:
        "linear-gradient(45deg, rgba(148, 163, 184, 0.35) 25%, transparent 25%, transparent 50%, rgba(148, 163, 184, 0.35) 50%, rgba(148, 163, 184, 0.35) 75%, transparent 75%, transparent)",
      backgroundSize: "8px 8px",
      backgroundColor: "#ffffff",
    };
  }

  return {
    backgroundColor: normalized,
  };
}

export function resolveEditorColorButtonStyle(value: string, mixed: boolean): CSSProperties {
  if (mixed) {
    return {
      ["--palette-color"]: value,
    } as CSSProperties;
  }

  const normalized = normalizeEditorColorValue(value);
  if (normalized === "transparent") {
    return {
      ["--palette-color"]: "#ffffff",
      ["--palette-mixed"]: 1,
    } as CSSProperties;
  }

  return {
    ["--palette-color"]: normalized,
  } as CSSProperties;
}
