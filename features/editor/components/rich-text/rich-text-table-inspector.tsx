"use client";

import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Grid2x2,
  X,
} from "lucide-react";

import { ColorPickerControl } from "@/components/ui/color-picker-control";

import {
  RICH_TEXT_BORDER_PRESETS,
  type RichTextTableBorderPreset,
  type RtpTableCellStyleAttrs,
  type RtpTableRowStyleAttrs,
  type RtpTableStyleAttrs,
} from "./rich-text-table-model";

export type RichTextTableInspectorTab = "selection" | "structure" | "style" | "dimensions";

export interface RichTextTableInspectorProps {
  isActive: boolean;
  tableAttrs: RtpTableStyleAttrs | null;
  cellAttrs: RtpTableCellStyleAttrs | null;
  rowAttrs: RtpTableRowStyleAttrs | null;
  columnWidth: number | null;
  activeTab: RichTextTableInspectorTab;
  capabilities: {
    addRowBefore: boolean;
    addRowAfter: boolean;
    deleteRow: boolean;
    addColumnBefore: boolean;
    addColumnAfter: boolean;
    deleteColumn: boolean;
    mergeCells: boolean;
    splitCell: boolean;
    deleteTable: boolean;
  };
  onTabChange: (tab: RichTextTableInspectorTab) => void;
  onClose: () => void;
  onSelectTable: () => void;
  onSelectRow: () => void;
  onSelectColumn: () => void;
  onAddRowBefore: () => void;
  onAddRowAfter: () => void;
  onDeleteRow: () => void;
  onAddColumnBefore: () => void;
  onAddColumnAfter: () => void;
  onDeleteColumn: () => void;
  onMergeCells: () => void;
  onSplitCell: () => void;
  onDeleteTable: () => void;
  onToggleHeaderRow: () => void;
  onToggleHeaderColumn: () => void;
  onToggleStriped: () => void;
  onFirstColumnToggle: () => void;
  onBorderPresetChange: (preset: RichTextTableBorderPreset) => void;
  onBorderColorChange: (color: string) => void;
  onCellBackgroundChange: (color: string | null) => void;
  onCellTextAlignChange: (value: string | null) => void;
  onHeaderBackgroundChange: (color: string | null) => void;
  onHeaderTextColorChange: (color: string) => void;
  onFirstColumnBackgroundChange: (color: string | null) => void;
  onFirstColumnTextColorChange: (color: string) => void;
  onStripedEvenColorChange: (color: string | null) => void;
  onStripedOddColorChange: (color: string | null) => void;
  onBorderWidthChange: (value: string) => void;
  onTableWidthChange: (value: string) => void;
  onColumnWidthChange: (value: string) => void;
  onRowHeightChange: (value: string) => void;
  onCellPaddingChange: (value: string) => void;
  onVerticalAlignChange: (value: string | null) => void;
}

export function RichTextTableInspector({
  isActive,
  tableAttrs,
  cellAttrs,
  rowAttrs,
  columnWidth,
  onClose,
  onAddRowAfter,
  onAddColumnAfter,
  onToggleHeaderRow,
  onToggleHeaderColumn,
  onToggleStriped,
  onFirstColumnToggle,
  onBorderPresetChange,
  onBorderColorChange,
  onCellBackgroundChange,
  onCellTextAlignChange,
  onHeaderBackgroundChange,
  onHeaderTextColorChange,
  onFirstColumnBackgroundChange,
  onFirstColumnTextColorChange,
  onStripedEvenColorChange,
  onStripedOddColorChange,
  onBorderWidthChange,
  onTableWidthChange,
  onColumnWidthChange,
  onRowHeightChange,
  onCellPaddingChange,
  onVerticalAlignChange,
}: RichTextTableInspectorProps) {
  const borderPreset = tableAttrs?.borderPreset ?? (tableAttrs?.bordered ? "all" : "none");
  const borderColor = normalizeColor(tableAttrs?.borderColor ?? "#d1d5db");
  const cellBackground = normalizeColor(cellAttrs?.backgroundColor ?? "#ffffff");
  const headerBackground = normalizeColor(tableAttrs?.headerBackgroundColor ?? "#dbeafe");
  const headerTextColor = normalizeColor(tableAttrs?.headerTextColor ?? "#111827");
  const firstColumnBackground = normalizeColor(tableAttrs?.firstColumnBackgroundColor ?? "#f1f5f9");
  const firstColumnTextColor = normalizeColor(tableAttrs?.firstColumnTextColor ?? "#0f172a");
  const stripedEvenColor = normalizeColor(tableAttrs?.stripedEvenColor ?? "#f3f6fb");
  const stripedOddColor = normalizeColor(tableAttrs?.stripedOddColor ?? "#ffffff");

  return (
    <aside className="ef-rtp-table-inspector ef-rtp-table-design-panel" aria-label="Panneau tableau">
      <div className="ef-rtp-table-design-header">
        <div>
          <span>Gestion des tableaux</span>
          <strong>Styles, bordures, couleurs & mise en forme</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Masquer le panneau tableau">
          <X size={14} aria-hidden />
        </button>
      </div>

      <DesignSection number={1} title="Grilles & bordures">
        <div className="ef-rtp-design-border-grid">
          <div>
            <span className="ef-rtp-design-label">Appliquer aux</span>
            <div className="ef-rtp-design-border-buttons">
              {RICH_TEXT_BORDER_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={borderPreset === preset.value ? "is-active" : ""}
                  disabled={!isActive}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onBorderPresetChange(preset.value)}
                  title={preset.description}
                >
                  <Grid2x2 size={18} aria-hidden />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ef-rtp-design-inline-fields">
          <PlainTextField label="Épaisseur" value={pixelTextValue(tableAttrs?.borderWidth ?? "1px")} onChange={onBorderWidthChange} disabled={!isActive} suffix="px" />
          <DesignColorSelect label="Couleur" value={borderColor} disabled={!isActive} onChange={(color) => color && onBorderColorChange(color)} />
        </div>
      </DesignSection>

      <DesignSection number={2} title="Couleurs">
        <div className="ef-rtp-design-tabs" aria-label="Couleurs tableau">
          <button type="button" className="is-active">Fond</button>
          <button type="button">Texte</button>
        </div>
        <div className="ef-rtp-design-inline-fields">
          <DesignColorSelect label="Fond cellule" value={cellBackground} disabled={!isActive} allowNone onChange={onCellBackgroundChange} />
          <DesignColorSelect label="Fond tableau" value={stripedOddColor} disabled={!isActive} allowNone onChange={onStripedOddColorChange} />
        </div>
        <DesignColorSelect label="Couleur du texte" value={headerTextColor} disabled={!isActive} onChange={(color) => color && onHeaderTextColorChange(color)} />
      </DesignSection>

      <DesignSection number={3} title="Alignements">
        <span className="ef-rtp-design-label">Horizontal</span>
        <div className="ef-rtp-design-icon-row">
          <DesignIconButton label="Gauche" active={cellAttrs?.textAlign === "left"} disabled={!isActive} onClick={() => onCellTextAlignChange("left")} icon={<AlignLeft size={19} />} />
          <DesignIconButton label="Centre" active={cellAttrs?.textAlign === "center"} disabled={!isActive} onClick={() => onCellTextAlignChange("center")} icon={<AlignCenter size={19} />} />
          <DesignIconButton label="Droite" active={cellAttrs?.textAlign === "right"} disabled={!isActive} onClick={() => onCellTextAlignChange("right")} icon={<AlignRight size={19} />} />
        </div>
        <span className="ef-rtp-design-label">Vertical</span>
        <div className="ef-rtp-design-icon-row">
          <DesignTextButton label="Haut" active={(cellAttrs?.verticalAlign ?? null) === "top"} disabled={!isActive} onClick={() => onVerticalAlignChange("top")} />
          <DesignTextButton label="Milieu" active={(cellAttrs?.verticalAlign ?? null) === "middle"} disabled={!isActive} onClick={() => onVerticalAlignChange("middle")} />
          <DesignTextButton label="Bas" active={(cellAttrs?.verticalAlign ?? null) === "bottom"} disabled={!isActive} onClick={() => onVerticalAlignChange("bottom")} />
        </div>
        <PlainTextField label="Padding cellule" value={pixelTextValue(cellAttrs?.cellPadding)} onChange={onCellPaddingChange} disabled={!isActive} placeholder="8" suffix="px" />
      </DesignSection>

      <DesignSection number={4} title="Style d’en-tête">
        <DesignSwitch label="Première ligne = en-tête" checked={true} disabled={!isActive} onClick={onToggleHeaderRow} />
        <DesignColorSelect label="Fond" value={headerBackground} disabled={!isActive} allowNone onChange={onHeaderBackgroundChange} />
        <DesignColorSelect label="Texte" value={headerTextColor} disabled={!isActive} onChange={(color) => color && onHeaderTextColorChange(color)} />
        <PlainTextField label="Bordure inférieure" value={pixelTextValue(tableAttrs?.borderWidth ?? "2px")} onChange={onBorderWidthChange} disabled={!isActive} suffix="px" />
      </DesignSection>

      <DesignSection number={5} title="Style 1ère colonne">
        <DesignSwitch label="Première colonne" checked={!!tableAttrs?.firstColumn} disabled={!isActive} onClick={onFirstColumnToggle} />
        <DesignColorSelect label="Fond" value={firstColumnBackground} disabled={!isActive} allowNone onChange={onFirstColumnBackgroundChange} />
        <DesignColorSelect label="Texte" value={firstColumnTextColor} disabled={!isActive} onChange={(color) => color && onFirstColumnTextColorChange(color)} />
        <div className="ef-rtp-design-icon-row">
          <DesignIconButton label="Gauche" disabled={!isActive} onClick={() => onCellTextAlignChange("left")} icon={<AlignLeft size={18} />} />
          <DesignIconButton label="Centre" disabled={!isActive} onClick={() => onCellTextAlignChange("center")} icon={<AlignCenter size={18} />} />
          <DesignIconButton label="Droite" disabled={!isActive} onClick={() => onCellTextAlignChange("right")} icon={<AlignRight size={18} />} />
        </div>
      </DesignSection>

      <DesignSection number={6} title="Lignes alternées">
        <DesignSwitch label="Lignes alternées" checked={!!tableAttrs?.striped} disabled={!isActive} onClick={onToggleStriped} />
        <DesignColorSelect label="Couleur ligne paire" value={stripedEvenColor} disabled={!isActive} allowNone onChange={onStripedEvenColorChange} />
        <DesignColorSelect label="Couleur ligne impaire" value={stripedOddColor} disabled={!isActive} allowNone onChange={onStripedOddColorChange} />
        <div className="ef-rtp-design-intensity"><span>Intensité</span><i /><strong>60 %</strong></div>
      </DesignSection>

      <DesignSection number={7} title="Styles de tableau">
        <p className="ef-rtp-design-help">Appliquez un style complet en un clic.</p>
        <div className="ef-rtp-design-style-grid">
          {[
            { label: "Minimal", color: "#ffffff", border: "#e5e7eb" },
            { label: "Corporate", color: "#dbeafe", border: "#2563eb" },
            { label: "Grille claire", color: "#f8fafc", border: "#d1d5db" },
            { label: "Accent bleu", color: "#2563eb", border: "#2563eb" },
            { label: "Premium", color: "#0f172a", border: "#334155" },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={!isActive}
              className={preset.label === "Corporate" ? "is-active" : ""}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onBorderPresetChange("all");
                onBorderColorChange(preset.border);
                onCellBackgroundChange(preset.color === "#2563eb" || preset.color === "#0f172a" ? "#ffffff" : preset.color);
                if (preset.label === "Corporate") onHeaderBackgroundChange("#dbeafe");
              }}
            >
              <i aria-hidden style={{ backgroundColor: preset.label === "Premium" ? "#0f172a" : preset.label === "Accent bleu" ? "#2563eb" : preset.color }} />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </DesignSection>

      <DesignSection number={8} title="Mesures">
        <div className="ef-rtp-design-inline-fields">
          <PlainTextField label="Largeur tableau" value={pixelTextValue(tableAttrs?.tableWidth)} onChange={onTableWidthChange} disabled={!isActive} placeholder="Auto" suffix="px" />
          <PlainTextField label="Largeur colonne" value={pixelTextValue(columnWidth)} onChange={onColumnWidthChange} disabled={!isActive} placeholder="Auto" suffix="px" />
          <PlainTextField label="Hauteur ligne" value={pixelTextValue(rowAttrs?.rowHeight)} onChange={onRowHeightChange} disabled={!isActive} placeholder="Auto" suffix="px" />
        </div>
      </DesignSection>
    </aside>
  );
}

function InspectorTab({
  label,
  value,
  activeTab,
  onTabChange,
}: {
  label: string;
  value: RichTextTableInspectorTab;
  activeTab: RichTextTableInspectorTab;
  onTabChange: (tab: RichTextTableInspectorTab) => void;
}) {
  return (
    <button type="button" className={activeTab === value ? "is-active" : ""} onClick={() => onTabChange(value)}>
      {label}
    </button>
  );
}

function DesignSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="ef-rtp-design-section">
      <div className="ef-rtp-design-section-title">
        <span>{number}</span>
        <strong>{title}</strong>
      </div>
      {children}
    </section>
  );
}

function DesignSwitch({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={["ef-rtp-design-switch", checked ? "is-on" : ""].filter(Boolean).join(" ")}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span aria-hidden />
      {label}
    </button>
  );
}

function DesignIconButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={["ef-rtp-design-icon-button", active ? "is-active" : ""].filter(Boolean).join(" ")}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DesignTextButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={["ef-rtp-design-text-button", active ? "is-active" : ""].filter(Boolean).join(" ")}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function DesignColorSelect({
  label,
  value,
  disabled,
  allowNone,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  allowNone?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <ColorPickerControl
      label={label}
      value={value}
      disabled={disabled}
      allowTransparent={allowNone}
      onChange={onChange}
    />
  );
}

function InspectorSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="ef-rtp-table-inspector-section">
      <div className="ef-rtp-table-inspector-section-title">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </div>
      {children}
    </section>
  );
}

function InspectorAction({
  label,
  icon,
  active,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={["ef-rtp-table-inspector-action", active ? "is-active" : "", danger ? "is-danger" : ""].filter(Boolean).join(" ")}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function PlainTextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="ef-rtp-plain-field">
      <span>{label}</span>
      <span className="ef-rtp-plain-field-input">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  );
}

function normalizeColor(value: string): string {
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : "#ffffff";
}

function pixelTextValue(value: string | number | null | undefined): string {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "";
  return value.replace(/px$/i, "").trim();
}
