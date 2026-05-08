"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  convertMeasurementValue,
  formatMeasurementValue,
  getMeasurementUnitLabel,
  getMeasurementUnitSuffix,
  measurementUnitOptions,
  roundToFractionDigits,
  sanitizeMeasurementDraft,
  type MeasurementUnit,
} from "@/features/editor/lib/measurement";
import type { PageMargin } from "@/features/editor/schema/template-schema";
import type { EditorWorkspaceSettings, RulerMode, WorkspaceMode } from "@/features/editor/schema/workspace-layout";
import { resolveEffectiveWorkspaceMode } from "@/features/editor/schema/workspace-layout";

type CanvasWorkspaceSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EditorWorkspaceSettings;
  onChange: (patch: Partial<EditorWorkspaceSettings>) => void;
  pageMargin: PageMargin;
  onPageMarginChange: (patch: Partial<PageMargin>) => void;
};

const workspaceModeOptions: Array<{ value: WorkspaceMode; label: string; description: string }> = [
  {
    value: "fit-space",
    label: "Ajuster à l'espace",
    description: "Le workspace tient dans tout l'espace visible et reste centré.",
  },
  {
    value: "fit-width",
    label: "Ajuster à la largeur",
    description: "Le workspace suit la largeur disponible et conserve une lecture stable.",
  },
  {
    value: "free",
    label: "Libre",
    description: "Le zoom et le pan restent manuels.",
  },
];

const rulerModeOptions: Array<{ value: RulerMode; label: string; description: string }> = [
  {
    value: "page",
    label: "Règle de page",
    description: "Les graduations suivent la page active.",
  },
  {
    value: "global",
    label: "Règle globale",
    description: "Les graduations sont continues sur l'ensemble du workspace.",
  },
];

export function CanvasWorkspaceSettingsDialog({ open, onOpenChange, settings, pageMargin, onChange, onPageMarginChange }: CanvasWorkspaceSettingsDialogProps) {
  const [draftSettings, setDraftSettings] = useState(settings);
  const [draftPageMargin, setDraftPageMargin] = useState(pageMargin);
  const initialSettingsRef = useRef(settings);
  const initialPageMarginRef = useRef(pageMargin);
  const commitRequestedRef = useRef(false);
  const wasOpenRef = useRef(false);
  const effectiveWorkspaceMode = resolveEffectiveWorkspaceMode(draftSettings.workspaceMode);
  const autoCenterOnLoad = draftSettings.autoCenterOnLoad ?? true;
  const measurementUnit = draftSettings.measurementUnit ?? "px";
  const measurementUnitLabel = getMeasurementUnitLabel(measurementUnit);
  const measurementUnitSuffix = getMeasurementUnitSuffix(measurementUnit);
  const workspaceModeLabel = workspaceModeOptions.find((option) => option.value === effectiveWorkspaceMode)?.label ?? "Ajuster à l'espace";
  const rulerModeLabel = rulerModeOptions.find((option) => option.value === draftSettings.rulerMode)?.label ?? "Règle de page";
  const rulerMajorStepDisplay = formatMeasurementValue(draftSettings.rulerMajorStep, measurementUnit, 2);
  const rulerMinorStepDisplay = formatMeasurementValue(draftSettings.rulerMinorStep, measurementUnit, 2);
  const rulerFineStepDisplay = formatMeasurementValue(draftSettings.rulerFineStep, measurementUnit, 2);
  const snapToleranceDisplay = formatMeasurementValue(draftSettings.snapTolerance, "px", 2);
  const pageGapDisplay = formatMeasurementValue(draftSettings.pageGap, measurementUnit, 2);
  const pagePaddingDisplay = formatMeasurementValue(draftSettings.pagePadding, measurementUnit, 2);
  const gridSizeDisplay = formatMeasurementValue(draftSettings.gridSize, measurementUnit, 2);
  const pageMarginSummary = `G:${formatMeasurementValue(draftPageMargin.left, measurementUnit, 2)} D:${formatMeasurementValue(draftPageMargin.right, measurementUnit, 2)} H:${formatMeasurementValue(draftPageMargin.top, measurementUnit, 2)} B:${formatMeasurementValue(draftPageMargin.bottom, measurementUnit, 2)}`;
  const rulerSummary = `${rulerModeLabel} • pas ${rulerMajorStepDisplay} ${measurementUnitSuffix} • sous-pas ${rulerMinorStepDisplay} ${measurementUnitSuffix} • fin ${rulerFineStepDisplay} ${measurementUnitSuffix}`;
  const spacesSummary = `Grille ${gridSizeDisplay} ${measurementUnitSuffix} • Snap ${snapToleranceDisplay} px`;
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      initialSettingsRef.current = settings;
      initialPageMarginRef.current = pageMargin;
      commitRequestedRef.current = false;
      setDraftSettings(settings);
      setDraftPageMargin(pageMargin);
      bodyRef.current?.scrollTo({ top: 0 });
    }

    if (!open && wasOpenRef.current) {
      commitRequestedRef.current = false;
    }

    wasOpenRef.current = open;
  }, [open, pageMargin, settings]);

  const restoreInitialDraft = () => {
    setDraftSettings(initialSettingsRef.current);
    setDraftPageMargin(initialPageMarginRef.current);
    onChange(initialSettingsRef.current);
    onPageMarginChange(initialPageMarginRef.current);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !commitRequestedRef.current) {
      restoreInitialDraft();
    }

    if (!nextOpen) {
      commitRequestedRef.current = false;
    }

    onOpenChange(nextOpen);
  };

  const commitDraft = () => {
    commitRequestedRef.current = true;
    onOpenChange(false);
  };

  const updateDraftSettings = (patch: Partial<EditorWorkspaceSettings>) => {
    setDraftSettings((current) => ({
      ...current,
      ...patch,
    }));
    onChange(patch);
  };

  const updateDraftPageMargin = (patch: Partial<PageMargin>) => {
    setDraftPageMargin((current) => ({
      ...current,
      ...patch,
    }));
    onPageMarginChange(patch);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ef-workspace-settings-backdrop" />
        <Dialog.Content className="ef-workspace-settings-dialog">
          <div className="ef-workspace-settings-header">
            <div>
              <Dialog.Title className="ef-workspace-settings-title">Réglages du workspace</Dialog.Title>
              <Dialog.Description className="ef-workspace-settings-description">
                Contrôle le comportement du workspace et les repères visibles sans occuper tout l’écran.
              </Dialog.Description>
            </div>
            <div className="ef-workspace-settings-summary" aria-label="Résumé des réglages">
              <SettingsPill label="Unité" value={measurementUnitLabel} />
              <SettingsPill label="Mode" value={workspaceModeLabel} />
              <SettingsPill label="Règle" value={rulerModeLabel} />
              <SettingsPill label="Snap" value={draftSettings.snapEnabled ? "Activé" : "Désactivé"} />
              <SettingsPill label="Grille" value={draftSettings.gridEnabled ? "Visible" : "Masquée"} />
            </div>
          </div>

          <div className="ef-workspace-settings-body" ref={bodyRef}>
            <WorkspaceSettingsSection title="Mesure" summary={measurementUnitLabel} description="Le moteur interne reste en px. L'unité choisie sert à afficher et saisir les valeurs.">
              <div className="ef-workspace-settings-grid">
                <LabeledSelect
                  label="Unité d'affichage"
                  value={measurementUnit}
                  onChange={(value) => updateDraftSettings({ measurementUnit: value as MeasurementUnit })}
                  options={measurementUnitOptions.map((option) => ({ value: option.value, label: option.label }))}
                />
              </div>
            </WorkspaceSettingsSection>

            <WorkspaceSettingsSection title="Comportement" summary={workspaceModeLabel} description="Le workspace s'adapte à l'espace disponible ou reste libre.">
              <div className="ef-workspace-settings-choice-list" role="radiogroup" aria-label="Comportement du workspace">
                {workspaceModeOptions.map((option) => {
                  const active = effectiveWorkspaceMode === option.value;
                  return (
                    <button
                      key={option.value}
                      className={cn("ef-workspace-settings-choice", active && "is-active")}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => updateDraftSettings({ workspaceMode: option.value })}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  );
                })}
              </div>
              <div className="ef-workspace-settings-switches is-inline">
                <WorkspaceToggle
                  label="Auto-center au chargement"
                  checked={autoCenterOnLoad}
                  onChange={(checked) => updateDraftSettings({ autoCenterOnLoad: checked })}
                />
              </div>
            </WorkspaceSettingsSection>

            <WorkspaceSettingsSection
              title="Règles et graduations"
              summary={rulerSummary}
              description="Réglages de la règle, des subdivisions et du seuil de magnétisme."
            >
              <div className="ef-workspace-settings-grid">
                <LabeledSelect
                  label="Mode de règle"
                  value={draftSettings.rulerMode}
                  onChange={(value) => updateDraftSettings({ rulerMode: value as RulerMode })}
                  options={rulerModeOptions.map((option) => ({ value: option.value, label: option.label }))}
                />
                <LabeledMeasurementField
                  label="Pas principal"
                  valuePx={draftSettings.rulerMajorStep}
                  measurementUnit={measurementUnit}
                  onChangePx={(value) => updateDraftSettings({ rulerMajorStep: value })}
                />
                <LabeledMeasurementField
                  label="Pas secondaire"
                  valuePx={draftSettings.rulerMinorStep}
                  measurementUnit={measurementUnit}
                  onChangePx={(value) => updateDraftSettings({ rulerMinorStep: value })}
                />
                <LabeledMeasurementField
                  label="Pas fine"
                  valuePx={draftSettings.rulerFineStep}
                  measurementUnit={measurementUnit}
                  onChangePx={(value) => updateDraftSettings({ rulerFineStep: value })}
                />
                <LabeledMeasurementField
                  label="Seuil du snap"
                  valuePx={draftSettings.snapTolerance}
                  measurementUnit="px"
                  onChangePx={(value) => updateDraftSettings({ snapTolerance: value })}
                />
              </div>
            </WorkspaceSettingsSection>

            <WorkspaceSettingsSection title="Marges de page" summary={pageMarginSummary} description="Définissent la zone utile du document dans la page active.">
              <div className="ef-workspace-settings-grid">
                <LabeledMeasurementField label="Gauche" valuePx={draftPageMargin.left} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftPageMargin({ left: value })} />
                <LabeledMeasurementField label="Droite" valuePx={draftPageMargin.right} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftPageMargin({ right: value })} />
                <LabeledMeasurementField label="Haut" valuePx={draftPageMargin.top} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftPageMargin({ top: value })} />
                <LabeledMeasurementField label="Bas" valuePx={draftPageMargin.bottom} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftPageMargin({ bottom: value })} />
              </div>
            </WorkspaceSettingsSection>

            <WorkspaceSettingsSection
              title="Espaces et repères"
              summary={spacesSummary}
              description="Réglages visuels du workspace, de la grille et des aides au placement."
            >
              <div className="ef-workspace-settings-grid">
                <LabeledMeasurementField label="Marge entre pages" valuePx={draftSettings.pageGap} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftSettings({ pageGap: value })} />
                <LabeledMeasurementField label="Padding du workspace" valuePx={draftSettings.pagePadding} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftSettings({ pagePadding: value })} />
                <LabeledMeasurementField label="Pas de grille" valuePx={draftSettings.gridSize} measurementUnit={measurementUnit} onChangePx={(value) => updateDraftSettings({ gridSize: value })} />
                <div className="ef-workspace-settings-switches">
                  <WorkspaceToggle label="Grille visible" checked={draftSettings.gridEnabled} onChange={(checked) => updateDraftSettings({ gridEnabled: checked })} />
                  <WorkspaceToggle label="Règles visibles" checked={draftSettings.rulersVisible} onChange={(checked) => updateDraftSettings({ rulersVisible: checked })} />
                  <WorkspaceToggle label="Marges visibles" checked={draftSettings.marginsVisible} onChange={(checked) => updateDraftSettings({ marginsVisible: checked })} />
                  <WorkspaceToggle label="Guides visibles" checked={draftSettings.guidesVisible} onChange={(checked) => updateDraftSettings({ guidesVisible: checked })} />
                  <WorkspaceToggle label="Magnétisme activé" checked={draftSettings.snapEnabled} onChange={(checked) => updateDraftSettings({ snapEnabled: checked })} />
                  <WorkspaceToggle label="Snap sur la grille" checked={draftSettings.snapToGrid} onChange={(checked) => updateDraftSettings({ snapToGrid: checked })} />
                  <WorkspaceToggle label="Snap sur les marges" checked={draftSettings.snapToMargins} onChange={(checked) => updateDraftSettings({ snapToMargins: checked })} />
                  <WorkspaceToggle label="Snap sur les bords de page" checked={draftSettings.snapToPageBounds} onChange={(checked) => updateDraftSettings({ snapToPageBounds: checked })} />
                </div>
              </div>
              <p className="ef-workspace-settings-note">
                Espacement entre pages: {pageGapDisplay} {measurementUnitSuffix} • Padding du workspace: {pagePaddingDisplay} {measurementUnitSuffix}
              </p>
            </WorkspaceSettingsSection>
          </div>

          <div className="ef-workspace-settings-footer">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="button" onClick={commitDraft}>
              Valider
            </Button>
          </div>

          <Dialog.Close className="ef-workspace-settings-close" aria-label="Fermer">
            <X size={16} aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WorkspaceSettingsSection({
  title,
  summary,
  description,
  children,
}: {
  title: string;
  summary: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="ef-workspace-settings-section">
      <header className="ef-workspace-settings-section-header">
        <div className="ef-workspace-settings-section-head">
          <span className="ef-workspace-settings-section-title">{title}</span>
          <span className="ef-workspace-settings-section-summary">{summary}</span>
        </div>
        <span className="ef-workspace-settings-section-description">{description}</span>
      </header>
      <div className="ef-workspace-settings-section-body">{children}</div>
    </section>
  );
}

function SettingsPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="ef-workspace-settings-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="ef-workspace-settings-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LabeledMeasurementField({
  label,
  valuePx,
  measurementUnit,
  onChangePx,
}: {
  label: string;
  valuePx: number;
  measurementUnit: MeasurementUnit;
  onChangePx: (value: number) => void;
}) {
  const measurementUnitSuffix = getMeasurementUnitSuffix(measurementUnit);
  const [draft, setDraft] = useState(() => formatMeasurementValue(valuePx, measurementUnit, 2));

  useEffect(() => {
    setDraft(formatMeasurementValue(valuePx, measurementUnit, 2));
  }, [measurementUnit, valuePx]);

  const commit = () => {
    const parsed = parseDecimalValue(draft);
    if (parsed === null) {
      setDraft(formatMeasurementValue(valuePx, measurementUnit, 2));
      return;
    }

    const nextUnitValue = roundToTwoDecimals(parsed);
    const nextPxValue = roundToTwoDecimals(convertMeasurementValue(nextUnitValue, measurementUnit, "px"));
    setDraft(formatMeasurementValue(nextPxValue, measurementUnit, 2));
    if (Math.abs(nextPxValue - valuePx) > 0.001) {
      onChangePx(nextPxValue);
    }
  };

  return (
    <label className="ef-workspace-settings-field">
      <span>{label}</span>
      <div className="ef-workspace-settings-field-row">
        <input
          className="ef-workspace-settings-number"
          type="text"
          inputMode="decimal"
          spellCheck={false}
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(sanitizeMeasurementDraft(event.target.value))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
        <span className="ef-workspace-settings-unit">{measurementUnitSuffix}</span>
      </div>
    </label>
  );
}

function WorkspaceToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="ef-workspace-settings-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function parseDecimalValue(input: string) {
  if (!input.trim()) {
    return null;
  }

  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToTwoDecimals(value: number) {
  return roundToFractionDigits(value, 2);
}
