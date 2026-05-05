"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

type SortDir = "asc" | "desc" | null;

export function IconGlyph({
  icon: Icon,
  size = 18,
}: {
  icon: LucideIcon;
  size?: number;
}) {
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}

export function NoResult() {
  return <div className="ef-empty-state">Aucun résultat.</div>;
}

export function SearchBox({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="ef-search-box">
      <Search size={14} aria-hidden="true" />
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  title,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button className="ef-action-button" type="button" title={title ?? label} aria-label={title ?? label} onClick={onClick} disabled={disabled}>
      <IconGlyph icon={icon} size={14} />
    </button>
  );
}

export function SortHeader({
  label,
  dir,
  onClick,
  align,
}: {
  label: string;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "center" | "right";
}) {
  const icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      className={["ef-sort-header", align ? `align-${align}` : ""].join(" ")}
      onClick={onClick}
      title={`Trier par ${label}`}
    >
      <span>{label}</span>
      <IconGlyph icon={icon} size={13} />
    </button>
  );
}

export const smallMutedText: CSSProperties = {
  color: "rgba(148, 163, 184, 0.86)",
  fontSize: 11,
};

export type ColorSet = {
  bg: string;
  fg: string;
  border: string;
};

export function Badge({
  value,
  colorSet,
  width,
}: {
  value: string;
  colorSet: ColorSet;
  width?: number;
}) {
  return (
    <span
      className="ef-type-badge"
      style={{
        background: colorSet.bg,
        color: colorSet.fg,
        borderColor: colorSet.border,
        minWidth: width,
      }}
      title={value}
    >
      {value}
    </span>
  );
}

export function UnavailablePanel({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="ef-entity-card-stack">
      <div
        className="ef-no-result"
        style={{
          minHeight: 132,
          flexDirection: "column",
          gap: 6,
          padding: 16,
          textAlign: "center",
        }}
      >
        <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>{title}</strong>
        <span style={smallMutedText}>Section non branchée dans ce lot.</span>
        {subtitle ? <span style={smallMutedText}>{subtitle}</span> : null}
      </div>
    </div>
  );
}
