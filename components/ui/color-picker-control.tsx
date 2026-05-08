"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Pipette, Plus, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const RECENT_STORAGE_KEY = "resume-manager.color-picker.recent";
const FAVORITE_STORAGE_KEY = "resume-manager.color-picker.favorites";
const DEFAULT_FAVORITE_COLORS = ["#2563eb", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6b7280", "#111827"];
const DEFAULT_RECENT_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe", "#eff6ff", "#ffffff"];

export type ColorPickerControlProps = {
  label: string;
  value: string | null;
  disabled?: boolean;
  allowTransparent?: boolean;
  themeColors?: string[];
  recentColors?: string[];
  onChange: (value: string | null) => void;
  onPreview?: (value: string | null) => void;
};

export type ColorPickerPanelProps = ColorPickerControlProps & {
  resetLabel?: string;
  onReset?: () => void;
  onClose?: () => void;
  onPickingChange?: (picking: boolean) => void;
  onDraftChange?: (value: string | null) => void;
};

type ParsedColor = {
  hex: string;
  alpha: number;
  transparent: boolean;
  label?: string;
  raw?: string;
};

export function ColorPickerControl({
  label,
  value,
  disabled,
  allowTransparent,
  onChange,
  onPreview,
  themeColors,
  recentColors,
}: ColorPickerControlProps) {
  const [open, setOpen] = useState(false);
  const [eyeDropperActive, setEyeDropperActive] = useState(false);
  const draftValueRef = useRef<string | null>(value);
  const parsed = parseColorValue(value);

  useEffect(() => {
    draftValueRef.current = value;
  }, [value]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onChange(draftValueRef.current);
    }
    setOpen(nextOpen);
  };

  return (
    <div className="app-color-control">
      <span className="app-color-control-label">{label}</span>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button type="button" className="app-color-trigger" disabled={disabled} onMouseDown={(event) => event.preventDefault()} aria-label={label} title={label}>
            <span className="app-color-trigger-swatch" data-transparent={parsed.transparent ? "true" : undefined} style={resolveColorStyle(parsed)} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="app-color-popover"
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (eyeDropperActive) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (eyeDropperActive) event.preventDefault();
          }}
        >
          <ColorPickerPanel
            label={label}
            value={value}
            disabled={disabled}
            allowTransparent={allowTransparent}
            themeColors={themeColors}
            recentColors={recentColors}
            onChange={onChange}
            onPreview={onPreview}
            onClose={() => setOpen(false)}
            onPickingChange={setEyeDropperActive}
            onDraftChange={(nextValue) => {
              draftValueRef.current = nextValue;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ColorPickerPanel({
  value,
  disabled,
  allowTransparent,
  recentColors = [],
  resetLabel,
  onReset,
  onClose,
  onPickingChange,
  onDraftChange,
  onChange,
  onPreview,
}: ColorPickerPanelProps) {
  const [storedRecent, setStoredRecent] = useStoredColors(RECENT_STORAGE_KEY, []);
  const [favoriteColors, setFavoriteColors] = useStoredColors(FAVORITE_STORAGE_KEY, DEFAULT_FAVORITE_COLORS);
  const parsed = parseColorValue(value);
  const mergedRecent = useMemo(() => uniqueColors([...recentColors, ...storedRecent, ...DEFAULT_RECENT_COLORS]), [recentColors, storedRecent]);
  const [visualColor, setVisualColor] = useState(() => ({ hex: parsed.hex, alpha: parsed.alpha, transparent: parsed.transparent }));
  const displayColor = visualColor;
  const isFavorite = favoriteColors.some((color) => normalizeHex(color) === displayColor.hex);
  const hsv = hexToHsv(displayColor.hex);
  const hueColor = hsvToHex(hsv.h, 100, 100);
  const [hexDraft, setHexDraft] = useState(displayColor.hex.slice(1).toUpperCase());

  useEffect(() => {
    setHexDraft(parsed.hex.slice(1).toUpperCase());
    setVisualColor({ hex: parsed.hex, alpha: parsed.alpha, transparent: parsed.transparent });
  }, [parsed.alpha, parsed.hex, parsed.transparent]);

  const applyVisualColor = (nextColor: { hex: string; alpha: number; transparent?: boolean }) => {
    setVisualColor({ hex: nextColor.hex, alpha: nextColor.alpha, transparent: nextColor.transparent ?? nextColor.alpha <= 0 });
    setHexDraft(nextColor.hex.slice(1).toUpperCase());
    onDraftChange?.(serializeColor({ hex: nextColor.hex, alpha: nextColor.alpha, transparent: nextColor.transparent ?? nextColor.alpha <= 0 }));
  };

  const commitParsedColor = (nextColor: { hex: string; alpha: number; transparent?: boolean }, options?: { remember?: boolean }) => {
    applyVisualColor(nextColor);
    commitColor(serializeColor({ hex: nextColor.hex, alpha: nextColor.alpha, transparent: nextColor.transparent ?? nextColor.alpha <= 0 }), options);
  };

  const commitColor = (nextColor: string | null, options?: { remember?: boolean }) => {
    if (disabled) return;
    if (nextColor === null) {
      onDraftChange?.(null);
      onChange(null);
      return;
    }

    if (isTokenColorValue(nextColor) || isGradientColorValue(nextColor)) {
      onChange(nextColor);
      return;
    }

    const nextParsed = parseColorValue(nextColor, displayColor.alpha);
    applyVisualColor({ hex: nextParsed.hex, alpha: nextParsed.alpha, transparent: nextParsed.transparent });
    const serialized = serializeColor(nextParsed);
    onDraftChange?.(serialized);
    onChange(serialized);

    if (options?.remember !== false) {
      setStoredRecent((current) => uniqueColors([nextParsed.hex, ...current]).slice(0, 12));
    }
  };

  const previewColor = (nextColor: string | null) => {
    if (nextColor === null) {
      onPreview?.(null);
      return;
    }
    onPreview?.(serializeColor(parseColorValue(nextColor, displayColor.alpha)));
  };

  const updateHex = (hex: string) => {
    const draft = hex.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase();
    setHexDraft(draft);
    if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(draft)) return;
    const normalized = normalizeHex(draft);
    commitParsedColor({ hex: normalized, alpha: displayColor.alpha, transparent: false }, { remember: false });
  };

  const updateAlpha = (alpha: number) => {
    commitParsedColor({ hex: displayColor.hex, alpha, transparent: alpha <= 0 }, { remember: false });
  };

  const updateHue = (hue: number) => {
    commitParsedColor({ hex: hsvToHex(hue, hsv.s, hsv.v), alpha: displayColor.alpha, transparent: false }, { remember: false });
  };

  const updateSaturationValue = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clampNumber((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clampNumber((event.clientY - rect.top) / rect.height, 0, 1);
    commitParsedColor({ hex: hsvToHex(hsv.h, x * 100, (1 - y) * 100), alpha: displayColor.alpha, transparent: false }, { remember: false });
  };

  const startSaturationDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSaturationValue(event);
  };

  const toggleFavorite = () => {
    if (disabled || displayColor.transparent) return;
    setFavoriteColors((current) => {
      const exists = current.some((color) => normalizeHex(color) === displayColor.hex);
      if (exists) {
        return current.filter((color) => normalizeHex(color) !== displayColor.hex);
      }
      return uniqueColors([displayColor.hex, ...current]).slice(0, 12);
    });
  };

  const pickFromEyeDropper = async () => {
    const EyeDropperCtor = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper : undefined;
    if (!EyeDropperCtor) return;
    onPickingChange?.(true);
    try {
      const result = await new EyeDropperCtor().open();
      commitColor(result.sRGBHex);
    } finally {
      onPickingChange?.(false);
    }
  };

  return (
    <div className="app-color-picker" onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
      <div className="app-color-picker-header">
        <span>Color</span>
        <button type="button" className="app-color-close-button" onClick={onClose} aria-label="Fermer la palette couleur" title="Fermer">
          <X size={14} aria-hidden />
        </button>
      </div>

      <section className="app-color-picker-body">
        <div
          className="app-color-saturation"
          style={{ "--app-picker-hue": hueColor } as CSSProperties}
          onPointerDown={startSaturationDrag}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSaturationValue(event);
          }}
          role="slider"
          aria-label="Saturation et luminosité"
          aria-valuetext={displayColor.hex}
          tabIndex={0}
        >
          <span className="app-color-saturation-handle" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} aria-hidden />
        </div>

        <div className="app-color-slider-row">
          <button type="button" className="app-color-eyedropper-button" disabled={disabled} onClick={pickFromEyeDropper} aria-label="Pipette" title="Pipette">
            <Pipette size={14} aria-hidden />
          </button>
          <div className="app-color-slider-stack">
            <input
              className="app-color-hue-slider"
              type="range"
              min={0}
              max={360}
              step={1}
              value={Math.round(hsv.h)}
              disabled={disabled}
              onInput={(event) => updateHue(Number(event.currentTarget.value))}
              onChange={(event) => updateHue(Number(event.target.value))}
              aria-label="Teinte"
            />
            <input
              className="app-color-alpha-slider"
              style={{ "--app-picker-alpha-color": displayColor.hex } as CSSProperties}
              type="range"
              min={0}
              max={100}
              step={1}
              value={displayColor.alpha}
              disabled={disabled}
              onInput={(event) => updateAlpha(Number(event.currentTarget.value))}
              onChange={(event) => updateAlpha(Number(event.target.value))}
              aria-label="Transparence"
            />
          </div>
          <span className="app-color-current-preview" data-transparent={displayColor.transparent ? "true" : undefined} style={resolveColorStyle({ hex: displayColor.hex, alpha: displayColor.alpha, transparent: displayColor.transparent })} aria-hidden />
        </div>

        <label className="app-color-hex-row">
          <span>#</span>
          <input className="app-color-hex-input" value={hexDraft} disabled={disabled} onChange={(event) => updateHex(event.target.value)} onBlur={() => setHexDraft(displayColor.hex.slice(1).toUpperCase())} aria-label="Couleur HEX" />
          <strong>{displayColor.alpha}%</strong>
        </label>
      </section>

      <section className="app-color-swatches">
        <div className="app-color-swatch-heading">
          <span>Favorites</span>
          <button type="button" disabled={disabled || displayColor.transparent} onClick={toggleFavorite} aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"} title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
            <Plus size={13} aria-hidden />
          </button>
        </div>
        <ColorSwatchGrid title="Favorites" colors={favoriteColors.slice(0, 8)} currentHex={displayColor.hex} disabled={disabled} onPreview={previewColor} onApply={commitColor} />
        <span className="app-color-swatch-title">Recents</span>
        <ColorSwatchGrid title="Recents" colors={mergedRecent.slice(0, 8)} currentHex={displayColor.hex} disabled={disabled} onPreview={previewColor} onApply={commitColor} />
        <div className="app-color-aux-actions">
          {allowTransparent ? (
            <button type="button" disabled={disabled} onClick={() => commitColor(null, { remember: false })}>
              Transparent / No color
            </button>
          ) : null}
          {onReset ? (
            <button type="button" disabled={disabled} onClick={onReset}>
              {resetLabel ?? "Par défaut"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ColorSwatchGrid({
  title,
  colors,
  currentHex,
  disabled,
  onPreview,
  onApply,
}: {
  title: string;
  colors: string[];
  currentHex: string;
  disabled?: boolean;
  onPreview: (value: string | null) => void;
  onApply: (value: string) => void;
}) {
  return (
    <div className="app-color-swatch-grid">
      {colors.map((color) => (
        <ColorSwatch key={`${title}-${color}`} color={color} active={normalizeHex(color) === currentHex} disabled={disabled} label={`${title} ${color}`} onPreview={onPreview} onApply={onApply} />
      ))}
    </div>
  );
}

function ColorSwatch({
  color,
  active,
  disabled,
  label,
  onPreview,
  onApply,
}: {
  color: string;
  active: boolean;
  disabled?: boolean;
  label: string;
  onPreview: (value: string | null) => void;
  onApply: (value: string) => void;
}) {
  return (
    <button
      type="button"
      className={active ? "is-active" : ""}
      style={{ backgroundColor: color }}
      disabled={disabled}
      onMouseEnter={() => onPreview(color)}
      onMouseLeave={() => onPreview(null)}
      onClick={() => onApply(color)}
      aria-label={label}
    />
  );
}

function useStoredColors(key: string, fallback: string[]) {
  const [colors, setColors] = useState<string[]>(() => readStoredColors(key, fallback));

  const updateColors = (next: string[] | ((current: string[]) => string[])) => {
    setColors((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      const normalized = uniqueColors(resolved);
      try {
        window.localStorage.setItem(key, JSON.stringify(normalized));
      } catch {
        // Storage can be unavailable in private contexts; the in-memory state remains valid.
      }
      return normalized;
    });
  };

  return [colors, updateColors] as const;
}

function readStoredColors(key: string, fallback: string[]) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? uniqueColors(parsed) : fallback;
  } catch {
    return fallback;
  }
}

function parseColorValue(value: string | null | undefined, fallbackAlpha = 100): ParsedColor {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.toLowerCase() === "transparent") {
    return { hex: "#ffffff", alpha: 0, transparent: true };
  }

  if (isTokenColorValue(trimmed)) {
    return { hex: resolveTokenPreviewColor(trimmed), alpha: fallbackAlpha, transparent: false, label: trimmed, raw: trimmed };
  }

  if (isGradientColorValue(trimmed)) {
    return { hex: resolveGradientPreviewColor(trimmed), alpha: fallbackAlpha, transparent: false, label: "Gradient", raw: trimmed };
  }

  const rgba = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
  if (rgba) {
    const red = clampNumber(Number(rgba[1]), 0, 255);
    const green = clampNumber(Number(rgba[2]), 0, 255);
    const blue = clampNumber(Number(rgba[3]), 0, 255);
    const alphaRaw = rgba[4] === undefined ? 1 : clampNumber(Number(rgba[4]), 0, 1);
    const alpha = Math.round(alphaRaw * 100);
    return { hex: rgbToHex(red, green, blue), alpha, transparent: alpha <= 0 };
  }

  const hex = normalizeHex(trimmed);
  return { hex, alpha: fallbackAlpha, transparent: fallbackAlpha <= 0 };
}

function serializeColor(color: ParsedColor) {
  if (color.raw && (isTokenColorValue(color.raw) || isGradientColorValue(color.raw))) return color.raw;
  if (color.transparent || color.alpha <= 0) return null;
  if (color.alpha >= 100) return color.hex;
  const { r, g, b } = hexToRgb(color.hex);
  return `rgba(${r}, ${g}, ${b}, ${Number((color.alpha / 100).toFixed(2))})`;
}

function normalizeHex(value: string) {
  const trimmed = value.trim();
  const raw = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split("").map((char) => `${char}${char}`).join("")}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw}`.toLowerCase();
  }
  return "#ffffff";
}

function resolveColorStyle(color: ParsedColor) {
  if (color.raw && isGradientColorValue(color.raw)) {
    return { backgroundImage: color.raw };
  }

  if (color.transparent || color.alpha <= 0) {
    return {
      backgroundImage:
        "linear-gradient(45deg, rgba(148, 163, 184, 0.38) 25%, transparent 25%, transparent 50%, rgba(148, 163, 184, 0.38) 50%, rgba(148, 163, 184, 0.38) 75%, transparent 75%, transparent)",
      backgroundSize: "8px 8px",
      backgroundColor: "#ffffff",
    };
  }

  return { backgroundColor: serializeColor(color) ?? color.hex };
}

function uniqueColors(colors: string[]) {
  return Array.from(new Set(colors.map(normalizeHex).filter((color) => color !== "#ffffff" || colors.some((source) => normalizeHex(source) === "#ffffff"))));
}

function isTokenColorValue(value: string) {
  return /^\{\{theme\.[a-z0-9_.-]+}}$/i.test(value.trim());
}

function isGradientColorValue(value: string) {
  return /^linear-gradient\(/i.test(value.trim());
}

function resolveTokenPreviewColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "{{theme.primary}}") return "#2563eb";
  if (normalized === "{{theme.text}}") return "#111827";
  if (normalized === "{{theme.border}}") return "#e5e7eb";
  if (normalized === "{{theme.surface}}") return "#ffffff";
  return "#2563eb";
}

function resolveGradientPreviewColor(value: string) {
  return normalizeHex(value.match(/#[0-9a-f]{3,6}/i)?.[0] ?? "#2563eb");
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function hexToHsv(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
  }

  if (hue < 0) hue += 360;

  return {
    h: hue,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function hsvToHex(hue: number, saturation: number, value: number) {
  const h = ((hue % 360) + 360) % 360;
  const s = clampNumber(saturation, 0, 100) / 100;
  const v = clampNumber(value, 0, 100) / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (h < 60) [red, green, blue] = [c, x, 0];
  else if (h < 120) [red, green, blue] = [x, c, 0];
  else if (h < 180) [red, green, blue] = [0, c, x];
  else if (h < 240) [red, green, blue] = [0, x, c];
  else if (h < 300) [red, green, blue] = [x, 0, c];
  else [red, green, blue] = [c, 0, x];

  return rgbToHex((red + m) * 255, (green + m) * 255, (blue + m) * 255);
}
