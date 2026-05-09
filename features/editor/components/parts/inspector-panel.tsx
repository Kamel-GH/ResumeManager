"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Edit2,
  ImageIcon,
  Link2,
  Lock,
  RotateCcw,
  Type,
} from "lucide-react";
import { type ReactNode, useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { ColorPickerControl } from "@/components/ui/color-picker-control";
import {
  type CanvasObjectStyleValues,
  resolveCanvasObjectStyleCapabilities,
  resolveCanvasObjectStylePreview,
} from "@/features/editor/schema/canvas-mutation";
import {
  formatOperationAction,
  formatOperationSnapshot,
  formatOperationSnapshotOrDeleted,
} from "@/features/editor/schema/editor-operation-log";
import type { TemplateElement } from "@/features/editor/schema/template-schema";
import { useEditorStore } from "@/features/editor/stores/editor-store";

const tabs = ["Style", "Texte", "Données", "Effets"];

export function InspectorPanel() {
  const activePageId = useEditorStore((state) => state.activePageId);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const selectionProjection = useEditorStore((state) => state.selectionProjection);
  const operationLogs = useEditorStore((state) => state.operationLogs);
  const clearOperationLogs = useEditorStore((state) => state.clearOperationLogs);
  const commitCanvasObjectStyle = useEditorStore((state) => state.commitCanvasObjectStyle);
  const setEditingImageElementId = useEditorStore((state) => state.setEditingImageElementId);
  const setEditingRichTextElementId = useEditorStore((state) => state.setEditingRichTextElementId);
  const selectedObject = selectionProjection?.object ?? null;
  const selectedPage = selectionProjection?.page ?? null;
  const selectionSummary = selectionProjection ?? {
    selectionTypeLabel: "Page",
    selectionLabel: `Page ${activePageId.replace("page-", "")}`,
    userFacingLayer: null,
  };
  const styleTarget = useMemo(() => {
    const candidates = selectedElementIds
      .map(
        (elementId) => workingTemplate.elements.find((element) => element.id === elementId) ?? null,
      )
      .filter(
        (element): element is (typeof workingTemplate.elements)[number] =>
          element !== null && isStyleableCanvasElement(element),
      );

    return candidates[0] ?? null;
  }, [selectedElementIds, workingTemplate]);
  const styleCapabilities = styleTarget ? resolveCanvasObjectStyleCapabilities(styleTarget) : null;
  const stylePreview = styleTarget ? resolveCanvasObjectStylePreview(styleTarget) : null;
  const selectionType = selectionProjection?.selectionType ?? null;
  const selectedElementId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;
  const selectedElement = useMemo(
    () =>
      selectedElementId
        ? (workingTemplate.elements.find((el) => el.id === selectedElementId) ?? null)
        : null,
    [selectedElementId, workingTemplate.elements],
  );
  const isImageSelection =
    selectionType === "image" && selectedElement?.type === "image" && !selectedElement.locked;
  const isRichTextSelection =
    selectionType === "richText" &&
    selectedElement?.type === "rich-text" &&
    !selectedElement.locked;
  const applyStylePatch = useCallback(
    (style: Partial<CanvasObjectStyleValues>) => {
      if (!selectedElementIds.length) {
        return;
      }

      const result = commitCanvasObjectStyle({
        patches: selectedElementIds.map((elementId) => ({
          id: elementId,
          style,
        })),
      });

      if (!result.committed) {
        console.warn("[editor] canvas style commit rejected", result.reason);
      }
    },
    [commitCanvasObjectStyle, selectedElementIds],
  );

  return (
    <aside className="ef-inspector">
      <div className="ef-inspector-head">
        <div className="ef-inspector-tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={["ef-inspector-tab", index === 0 ? "is-active" : ""].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <InspectorSection title="Sélection" open>
        <div className="ef-grid-font">
          <span className="ef-field ef-field-strong ef-truncate">
            {selectionSummary.selectionTypeLabel}
          </span>
          <span className="ef-field ef-truncate">{selectionSummary.selectionLabel}</span>
        </div>

        {selectionSummary.userFacingLayer ? (
          <div className="ef-grid-font">
            <span className="ef-field ef-field-strong">Calque</span>
            <span className="ef-field ef-truncate">{selectionSummary.userFacingLayer.name}</span>
          </div>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Style" open>
        <div className="ef-grid-two">
          <StyleColorField
            label="Fond"
            value={stylePreview?.fill ?? "#ffffff"}
            disabled={!styleCapabilities?.fill}
            allowTransparent
            onChange={(value) => applyStylePatch({ fill: value })}
          />
          <StyleColorField
            label="Contour"
            value={stylePreview?.stroke ?? "#0f172a"}
            disabled={!styleCapabilities?.stroke}
            onChange={(value) => applyStylePatch({ stroke: value })}
          />
        </div>

        <div className="ef-grid-two">
          <StyleNumberField
            label="Trait"
            value={stylePreview?.strokeWidth ?? 1}
            unit="px"
            min={0}
            step={0.5}
            disabled={!styleCapabilities?.strokeWidth}
            onChange={(value) => applyStylePatch({ strokeWidth: value })}
          />
          <StyleNumberField
            label="Opacité"
            value={stylePreview?.opacity ?? 1}
            unit=""
            min={0}
            max={1}
            step={0.05}
            disabled={!styleCapabilities?.opacity}
            onChange={(value) => applyStylePatch({ opacity: value })}
          />
        </div>
      </InspectorSection>

      {isRichTextSelection && selectedElement ? (
        <InspectorSection title="Texte" open>
          <RichTextInspector
            element={selectedElement}
            onEdit={() => setEditingRichTextElementId(selectedElement.id)}
          />
        </InspectorSection>
      ) : null}

      {isImageSelection && selectedElement ? (
        <InspectorSection title="Image" open>
          <ImageInspector
            element={selectedElement}
            onEdit={() => setEditingImageElementId(selectedElement.id)}
          />
        </InspectorSection>
      ) : null}

      <InspectorSection title="Disposition" open>
        <div className="ef-grid-position">
          <SplitBox values={["X", String(Math.round(selectedObject?.frame.x ?? 0)), "px"]} />
          <SplitBox values={["Y", String(Math.round(selectedObject?.frame.y ?? 0)), "px"]} />
          <span className="ef-lock-cell">
            <Lock size={13} aria-hidden="true" />
          </span>
          <SplitBox
            values={[
              "L",
              String(Math.round(selectedObject?.frame.width ?? selectedPage?.width ?? 0)),
              "px",
            ]}
          />
          <SplitBox
            values={[
              "H",
              String(Math.round(selectedObject?.frame.height ?? selectedPage?.height ?? 0)),
              "px",
            ]}
          />
        </div>

        <div className="ef-grid-transform">
          <IconBox icon={RotateCcw} />
          <SelectBox value={`${Math.round(selectedObject?.rotation ?? 0)}°`} />
          <IconStrip icons={[AlignLeft, AlignCenter, AlignRight, AlignJustify]} activeIndex={1} />
        </div>

        <BoxModel title="Padding" linked />
        <BoxModel title="Marges" />
      </InspectorSection>

      <InspectorSection title="Données" open>
        <DataRow label="Source" value="[Nom]" select />
        <DataRow label="Fallback" value="Prénom Nom" />
        <DataRow label="Visibilité" value="Toujours visible" select />
        <button className="ef-field ef-add-rule">
          <span className="ef-plus-mark">+</span>
          Ajouter une règle
        </button>
      </InspectorSection>

      <InspectorSection title="Journal" open>
        <div className="flex items-center justify-between gap-2 px-1 pb-2 text-[11px] text-slate-500">
          <span>
            {operationLogs.length} opération{operationLogs.length > 1 ? "s" : ""}
          </span>
          <button
            className="rounded px-2 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={clearOperationLogs}
            type="button"
          >
            Effacer
          </button>
        </div>

        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {operationLogs.length === 0 ? (
            <div className="rounded border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-400">
              Aucune opération enregistrée.
            </div>
          ) : (
            [...operationLogs].reverse().map((entry) => (
              <div
                key={entry.id}
                className="rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800">
                    {formatOperationAction(entry.action)}
                  </span>
                  <span>
                    {new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-1 text-slate-500">Objet {entry.elementId}</div>
                <div className="mt-1 grid gap-1">
                  <div>
                    <span className="font-medium text-slate-700">Avant</span>{" "}
                    {entry.before ? formatOperationSnapshot(entry.before) : "—"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Après</span>{" "}
                    {formatOperationSnapshotOrDeleted(entry.after)}
                  </div>
                </div>
                {entry.details?.length ? (
                  <div className="mt-2 grid gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                    {entry.details.map((detail) => (
                      <div
                        key={`${entry.id}-${detail.label}`}
                        className="flex items-start justify-between gap-2"
                      >
                        <span className="font-medium text-slate-600">{detail.label}</span>
                        <span className="text-right text-slate-500">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </InspectorSection>
    </aside>
  );
}

function InspectorSection({
  title,
  children,
  open,
}: {
  title: string;
  children?: ReactNode;
  open?: boolean;
}) {
  return (
    <section className="ef-inspector-section">
      <h3 className="ef-inspector-title">
        <span className="ef-inspector-title-label">
          <ChevronDown size={12} className={open ? "" : "-rotate-90"} aria-hidden="true" />
          {title}
        </span>
        <ChevronDown size={12} className={open ? "" : "rotate-180"} aria-hidden="true" />
      </h3>
      {children ? <div className="ef-inspector-body">{children}</div> : null}
    </section>
  );
}

function SelectBox({ value }: { value: string }) {
  return (
    <button className="ef-field ef-select-field">
      <span className="ef-truncate">{value}</span>
      <ChevronDown size={11} aria-hidden="true" />
    </button>
  );
}

function SplitBox({ values }: { values: string[] }) {
  return (
    <span
      className="ef-field ef-split-field"
      style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
    >
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="ef-split-cell">
          {value}
        </span>
      ))}
    </span>
  );
}

function StyleColorField({
  label,
  value,
  disabled,
  allowTransparent,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  allowTransparent?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <ColorPickerControl
      label={label}
      value={value}
      disabled={disabled}
      allowTransparent={allowTransparent}
      onChange={(nextColor) => onChange(nextColor ?? "transparent")}
    />
  );
}

function StyleNumberField({
  label,
  value,
  unit,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="ef-field ef-style-number-field">
      <span className="ef-style-number-label">{label}</span>
      <input
        className="ef-style-number-input"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const next = Number.parseFloat(event.target.value);
          if (Number.isNaN(next)) {
            return;
          }

          const clampedMax = max !== undefined ? Math.min(max, next) : next;
          const clamped = min !== undefined ? Math.max(min, clampedMax) : clampedMax;
          onChange(clamped);
        }}
      />
      {unit ? <span className="ef-style-number-unit">{unit}</span> : null}
    </label>
  );
}

function isStyleableCanvasElement(element: TemplateElement) {
  const capabilities = resolveCanvasObjectStyleCapabilities(element);
  return (
    capabilities.fill ||
    capabilities.stroke ||
    capabilities.strokeWidth ||
    capabilities.opacity ||
    capabilities.dash
  );
}

function RichTextInspector({ element, onEdit }: { element: TemplateElement; onEdit: () => void }) {
  const html = typeof element.props?.html === "string" ? element.props.html : null;
  const displayMode =
    typeof element.props?.richTextDisplayMode === "string"
      ? element.props.richTextDisplayMode
      : "label";

  const preview = html
    ? html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80)
    : null;

  return (
    <>
      {preview ? (
        <div className="ef-inspector-rich-text-preview" title={preview}>
          <Type size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="ef-truncate text-[11px] text-slate-500">{preview}</span>
        </div>
      ) : (
        <div className="ef-inspector-rich-text-preview">
          <Type size={11} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-[11px] italic text-slate-400">Bloc vide</span>
        </div>
      )}
      <div className="ef-inspector-meta-row">
        <span className="text-[10px] text-slate-400">Mode</span>
        <span className="text-[10px] font-medium text-slate-600">{displayMode}</span>
      </div>
      <button type="button" className="ef-inspector-edit-button" onClick={onEdit}>
        <Edit2 size={12} aria-hidden="true" />
        Éditer le texte
      </button>
    </>
  );
}

function ImageInspector({ element, onEdit }: { element: TemplateElement; onEdit: () => void }) {
  const label =
    typeof element.props?.label === "string"
      ? element.props.label
      : typeof element.props?.name === "string"
        ? element.props.name
        : "Image";
  const src = typeof element.props?.src === "string" ? element.props.src : null;
  const isDataUri = src?.startsWith("data:") ?? false;
  const srcDisplay = isDataUri
    ? "Données intégrées"
    : src
      ? src.slice(0, 40) + (src.length > 40 ? "…" : "")
      : "—";

  return (
    <>
      {src && isDataUri ? (
        <div className="ef-inspector-image-thumb">
          <img src={src} alt={label} className="ef-inspector-image-thumb-img" />
        </div>
      ) : null}
      <div className="ef-inspector-meta-row">
        <span className="text-[10px] text-slate-400">Nom</span>
        <span className="text-[10px] font-medium text-slate-600 ef-truncate">{label}</span>
      </div>
      <div className="ef-inspector-meta-row">
        <span className="text-[10px] text-slate-400">Source</span>
        <span className="text-[10px] text-slate-500 ef-truncate">{srcDisplay}</span>
      </div>
      <button type="button" className="ef-inspector-edit-button" onClick={onEdit}>
        <ImageIcon size={12} aria-hidden="true" />
        Éditer l'image
      </button>
    </>
  );
}

function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <button className="ef-icon-box ef-value-field">
      <Icon size={13} aria-hidden="true" />
    </button>
  );
}

function IconStrip({ icons, activeIndex }: { icons: LucideIcon[]; activeIndex?: number }) {
  return (
    <div
      className="ef-icon-strip"
      style={{ gridTemplateColumns: `repeat(${icons.length}, minmax(0, 1fr))` }}
    >
      {icons.map((Icon, index) => (
        <button
          key={index}
          className={["ef-icon-button", index === activeIndex ? "is-active" : ""].join(" ")}
        >
          <Icon size={13} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function BoxModel({ title, linked }: { title: string; linked?: boolean }) {
  return (
    <div className="ef-box-model">
      <span>{title}</span>
      <span className="ef-box-model-badge ef-box-top">10 mm</span>
      <span className="ef-box-model-badge ef-box-left">10 mm</span>
      <span className="ef-box-model-badge ef-box-center">10 mm</span>
      <span className="ef-box-model-badge ef-box-right">10 mm</span>
      {linked ? <Link2 className="ef-box-link" size={13} aria-hidden="true" /> : null}
    </div>
  );
}

function DataRow({ label, value, select }: { label: string; value: string; select?: boolean }) {
  return (
    <label className="ef-data-row">
      <span>{label}</span>
      <span className="ef-field ef-select-field ef-font-medium">
        {value}
        {select ? <ChevronDown size={11} aria-hidden="true" /> : null}
      </span>
    </label>
  );
}
