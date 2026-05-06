"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  convertMeasurementToPx,
  convertPxToMeasurement,
  MEASUREMENT_UNITS,
  formatMeasurementNumber,
  normalizeMeasurementUnit,
  type MeasurementUnit,
} from "@/features/editor/lib/measurement";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import type { PageMargin } from "@/features/editor/schema/template-schema";

type WorkspaceSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type WorkspaceNumericKey =
  | "gridSize"
  | "rulerMajorStep"
  | "rulerMinorStep"
  | "rulerFineStep"
  | "snapTolerance"
  | "pageGap"
  | "pagePadding";

type WorkspaceToggleKey = "rulersVisible" | "gridEnabled" | "marginsVisible" | "guidesVisible" | "snapEnabled" | "snapToGrid" | "snapToMargins" | "snapToPageBounds";

const numericKeys: WorkspaceNumericKey[] = ["gridSize", "rulerMajorStep", "rulerMinorStep", "rulerFineStep", "snapTolerance", "pageGap", "pagePadding"];

export function WorkspaceSettingsDialog({ open, onOpenChange }: WorkspaceSettingsDialogProps) {
  const activePage = useEditorStore((state) => state.workingTemplate.pages.find((page) => page.id === state.activePageId) ?? null);
  const workspaceSettings = useEditorStore((state) => state.workspaceSettings);
  const setWorkspaceSettings = useEditorStore((state) => state.setWorkspaceSettings);
  const setTemplatePageMargin = useEditorStore((state) => state.setTemplatePageMargin);

  const measurementUnit = normalizeMeasurementUnit(workspaceSettings.measurementUnit);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onOpenChange, open]);

  const numericValues = useMemo(
    () =>
      numericKeys.reduce<Record<WorkspaceNumericKey, number>>((acc, key) => {
        acc[key] = convertPxToMeasurement(workspaceSettings[key], measurementUnit);
        return acc;
      }, {} as Record<WorkspaceNumericKey, number>),
    [measurementUnit, workspaceSettings],
  );

  const pageMarginValues = useMemo(
    () =>
      ({
        top: convertPxToMeasurement(activePage?.margin.top ?? 0, measurementUnit),
        right: convertPxToMeasurement(activePage?.margin.right ?? 0, measurementUnit),
        bottom: convertPxToMeasurement(activePage?.margin.bottom ?? 0, measurementUnit),
        left: convertPxToMeasurement(activePage?.margin.left ?? 0, measurementUnit),
      }) satisfies Record<keyof PageMargin, number>,
    [activePage?.margin.bottom, activePage?.margin.left, activePage?.margin.right, activePage?.margin.top, measurementUnit],
  );

  if (!open) {
    return null;
  }

  const updateNumericSetting = (key: WorkspaceNumericKey, value: number) => {
    setWorkspaceSettings({
      [key]: convertMeasurementToPx(value, measurementUnit),
    } as Partial<typeof workspaceSettings>);
  };

  const updateToggleSetting = (key: WorkspaceToggleKey, value: boolean) => {
    setWorkspaceSettings({ [key]: value } as Partial<typeof workspaceSettings>);
  };

  const updatePageMargin = (key: keyof PageMargin, value: number) => {
    if (!activePage) {
      return;
    }

    setTemplatePageMargin({
      pageId: activePage.id,
      margin: {
        [key]: convertMeasurementToPx(value, measurementUnit),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[1px]" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onOpenChange(false)}>
      <section
        className="flex h-[calc(100vh-3rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Réglages de mesure et d’affichage"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Canvas / Template</p>
            <h2 className="text-lg font-semibold text-slate-900">Réglages de mesure et d’affichage</h2>
            <p className="text-sm text-slate-500">Le moteur interne reste en px. L’unité choisie sert à afficher et saisir les valeurs.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Fermer les réglages">
            <X size={16} aria-hidden="true" />
          </Button>
        </header>

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <SectionTitle title="Mesure" description="Les valeurs sont converties depuis/vers le modèle interne." />
            <SelectField
              label="Unité d’affichage"
              value={measurementUnit}
              options={MEASUREMENT_UNITS}
              onChange={(value) => setWorkspaceSettings({ measurementUnit: normalizeMeasurementUnit(value) })}
            />
            <DecimalField
              label="Pas principal de la règle"
              value={numericValues.rulerMajorStep}
              unit={measurementUnit}
              onChange={(value) => updateNumericSetting("rulerMajorStep", value)}
            />
            <DecimalField
              label="Pas secondaire"
              value={numericValues.rulerMinorStep}
              unit={measurementUnit}
              onChange={(value) => updateNumericSetting("rulerMinorStep", value)}
            />
            <DecimalField
              label="Pas fine"
              value={numericValues.rulerFineStep}
              unit={measurementUnit}
              onChange={(value) => updateNumericSetting("rulerFineStep", value)}
            />
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
              Graduation fine automatique au zoom élevé. Valeur affichée selon {measurementUnit}.
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <SectionTitle title="Règle et aides" description="Contrôle de la visibilité et du comportement du canvas." />
            <ToggleField label="Règle visible" checked={workspaceSettings.rulersVisible} onChange={(value) => updateToggleSetting("rulersVisible", value)} />
            <SelectField
              label="Mode de règle"
              value={workspaceSettings.rulerMode}
              options={["page", "global"]}
              onChange={(value) => setWorkspaceSettings({ rulerMode: value === "global" ? "global" : "page" })}
            />
            <ToggleField label="Marges visuelles" checked={workspaceSettings.marginsVisible} onChange={(value) => updateToggleSetting("marginsVisible", value)} />
            <ToggleField label="Guides intelligents" checked={workspaceSettings.guidesVisible} onChange={(value) => updateToggleSetting("guidesVisible", value)} />
            <ToggleField label="Magnétisme" checked={workspaceSettings.snapEnabled} onChange={(value) => updateToggleSetting("snapEnabled", value)} />
            <ToggleField label="Snap sur la grille" checked={workspaceSettings.snapToGrid} onChange={(value) => updateToggleSetting("snapToGrid", value)} />
            <ToggleField label="Snap sur les marges" checked={workspaceSettings.snapToMargins} onChange={(value) => updateToggleSetting("snapToMargins", value)} />
            <ToggleField label="Snap sur les bords de page" checked={workspaceSettings.snapToPageBounds} onChange={(value) => updateToggleSetting("snapToPageBounds", value)} />
            <DecimalField
              label="Pas du snap"
              value={numericValues.snapTolerance}
              unit={measurementUnit}
              onChange={(value) => updateNumericSetting("snapTolerance", value)}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2 xl:col-span-3">
            <SectionTitle title="Marges de page" description="Définit la zone utile de la page active et les repères d’alignement." />
            {activePage ? (
              <>
                <p className="text-[11px] text-slate-500">
                  Page active: <span className="font-medium text-slate-700">{activePage.name}</span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DecimalField label="Marge gauche" value={pageMarginValues.left} unit={measurementUnit} onChange={(value) => updatePageMargin("left", value)} />
                  <DecimalField label="Marge droite" value={pageMarginValues.right} unit={measurementUnit} onChange={(value) => updatePageMargin("right", value)} />
                  <DecimalField label="Marge haute" value={pageMarginValues.top} unit={measurementUnit} onChange={(value) => updatePageMargin("top", value)} />
                  <DecimalField label="Marge basse" value={pageMarginValues.bottom} unit={measurementUnit} onChange={(value) => updatePageMargin("bottom", value)} />
                </div>
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                  Les marges sont stockées en px en interne et converties selon l’unité d’affichage.
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                Aucune page active disponible pour modifier les marges.
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2 xl:col-span-3">
            <SectionTitle title="Structure de page" description="Ajuste les espacements et la grille de composition." />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DecimalField label="Grille" value={numericValues.gridSize} unit={measurementUnit} onChange={(value) => updateNumericSetting("gridSize", value)} />
              <DecimalField label="Espacement entre pages" value={numericValues.pageGap} unit={measurementUnit} onChange={(value) => updateNumericSetting("pageGap", value)} />
              <DecimalField label="Padding de page" value={numericValues.pagePadding} unit={measurementUnit} onChange={(value) => updateNumericSetting("pagePadding", value)} />
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                Affichage courant: {formatMeasurementNumber(convertMeasurementToPx(numericValues.pagePadding, measurementUnit), measurementUnit, { maximumFractionDigits: 2 })} {measurementUnit}.
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </footer>
      </section>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-[11px] leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DecimalField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: MeasurementUnit;
  onChange: (value: number) => void;
}) {
  const [inputValue, setInputValue] = useState(() => formatDecimalInputValue(value, unit));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatDecimalInputValue(value, unit));
    }
  }, [isEditing, unit, value]);

  return (
    <label className="grid gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          type="text"
          inputMode="decimal"
          value={inputValue}
          pattern="[0-9]*[.,]?[0-9]{0,2}"
          onFocus={() => setIsEditing(true)}
          onBlur={() => {
            setIsEditing(false);
            setInputValue(formatDecimalInputValue(value, unit));
          }}
          onChange={(event) => {
            const nextValue = sanitizeDecimalInput(event.target.value);
            setInputValue(nextValue);

            const parsed = parseDecimalInput(nextValue);
            if (parsed === null) {
              return;
            }

            onChange(roundToTwoDecimals(parsed));
          }}
        />
        <span className="min-w-10 rounded-md bg-slate-100 px-2 py-1 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">{unit}</span>
      </div>
    </label>
  );
}

function formatDecimalInputValue(value: number, unit: MeasurementUnit) {
  const formatted = formatMeasurementNumber(convertMeasurementToPx(value, unit), unit, { maximumFractionDigits: 2 });
  return formatted.replace(",", ".");
}

function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const firstDot = normalized.indexOf(".");
  if (firstDot < 0) {
    return normalized;
  }

  const integerPart = normalized.slice(0, firstDot);
  const decimalPart = normalized.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  return `${integerPart}.${decimalPart}`;
}

function parseDecimalInput(value: string) {
  if (!value || value === "." || value === "0.") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
