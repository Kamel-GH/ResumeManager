"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  ChevronDown,
  Columns3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Lock,
  RotateCcw,
  Strikethrough,
  Underline,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useEditorStore } from "@/features/editor/stores/editor-store";
import { formatOperationAction, formatOperationSnapshot, formatOperationSnapshotOrDeleted } from "@/features/editor/schema/editor-operation-log";

const tabs = ["Style", "Texte", "Données", "Effets"];

export function InspectorPanel() {
  const activePageId = useEditorStore((state) => state.activePageId);
  const selectionProjection = useEditorStore((state) => state.selectionProjection);
  const operationLogs = useEditorStore((state) => state.operationLogs);
  const clearOperationLogs = useEditorStore((state) => state.clearOperationLogs);
  const selectedObject = selectionProjection?.object ?? null;
  const selectedPage = selectionProjection?.page ?? null;
  const selectionSummary =
    selectionProjection ?? {
      selectionTypeLabel: "Page",
      selectionLabel: `Page ${activePageId.replace("page-", "")}`,
      userFacingLayer: null,
    };

  return (
    <aside className="ef-inspector">
      <div className="ef-inspector-head">
        <div className="ef-inspector-tabs">
          {tabs.map((tab, index) => (
            <button key={tab} className={["ef-inspector-tab", index === 0 ? "is-active" : ""].join(" ")}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <InspectorSection title="Sélection" open>
        <div className="ef-grid-font">
          <span className="ef-field ef-field-strong ef-truncate">{selectionSummary.selectionTypeLabel}</span>
          <span className="ef-field ef-truncate">{selectionSummary.selectionLabel}</span>
        </div>

        {selectionSummary.userFacingLayer ? (
          <div className="ef-grid-font">
            <span className="ef-field ef-field-strong">Calque</span>
            <span className="ef-field ef-truncate">{selectionSummary.userFacingLayer.name}</span>
          </div>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Texte" open>
        <div className="ef-grid-font">
          <SelectBox value="Playfair Display" />
          <SelectBox value="Bold" />
        </div>

        <div className="ef-grid-type">
          <SplitBox values={["48", "px"]} />
          <IconBox icon={Baseline} />
          <IconStrip icons={[AlignLeft, AlignCenter, AlignRight, AlignJustify]} activeIndex={1} />
        </div>

        <div className="ef-grid-spacing">
          <IconBox icon={List} />
          <ValueBox value="1.2" />
          <span />
          <ValueBox value="-0.5 °" />
          <ValueBox value="px" />
        </div>

        <div className="ef-grid-two">
          <ColorBox value="#0D1B2A" color="#0d1b2a" />
          <ColorBox value="#DJAF37" color="#daaf37" />
        </div>

        <IconStrip icons={[Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter]} activeIndex={7} />
        <IconStrip icons={[Columns3, List, AlignJustify, Link2, RotateCcw, Baseline, AlignRight]} />

        <div className="ef-grid-columns">
          <span>Colonnes</span>
          <SplitBox values={["1", "⌄"]} />
          <span className="ef-text-right">Espacement</span>
          <SplitBox values={["12", "px"]} />
        </div>
      </InspectorSection>

      <InspectorSection title="Image" />

      <InspectorSection title="Disposition" open>
        <div className="ef-grid-position">
          <SplitBox values={["X", String(Math.round(selectedObject?.frame.x ?? 0)), "px"]} />
          <SplitBox values={["Y", String(Math.round(selectedObject?.frame.y ?? 0)), "px"]} />
          <span className="ef-lock-cell">
            <Lock size={13} aria-hidden="true" />
          </span>
          <SplitBox values={["L", String(Math.round(selectedObject?.frame.width ?? selectedPage?.width ?? 0)), "px"]} />
          <SplitBox values={["H", String(Math.round(selectedObject?.frame.height ?? selectedPage?.height ?? 0)), "px"]} />
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
          <span>{operationLogs.length} opération{operationLogs.length > 1 ? "s" : ""}</span>
          <button className="rounded px-2 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" onClick={clearOperationLogs} type="button">
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
              <div key={entry.id} className="rounded border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800">{formatOperationAction(entry.action)}</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                </div>
                <div className="mt-1 text-slate-500">Objet {entry.elementId}</div>
                <div className="mt-1 grid gap-1">
                  <div><span className="font-medium text-slate-700">Avant</span> {entry.before ? formatOperationSnapshot(entry.before) : "—"}</div>
                  <div><span className="font-medium text-slate-700">Après</span> {formatOperationSnapshotOrDeleted(entry.after)}</div>
                </div>
                {entry.details?.length ? (
                  <div className="mt-2 grid gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                    {entry.details.map((detail) => (
                      <div key={`${entry.id}-${detail.label}`} className="flex items-start justify-between gap-2">
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

function InspectorSection({ title, children, open }: { title: string; children?: React.ReactNode; open?: boolean }) {
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

function ValueBox({ value }: { value: string }) {
  return <span className="ef-field ef-field-strong ef-value-field">{value}</span>;
}

function SplitBox({ values }: { values: string[] }) {
  return (
    <span className="ef-field ef-split-field" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="ef-split-cell">
          {value}
        </span>
      ))}
    </span>
  );
}

function ColorBox({ value, color }: { value: string; color: string }) {
  return (
    <span className="ef-field ef-color-field">
      <span className="ef-color-chip" style={{ backgroundColor: color }} />
      {value}
    </span>
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
    <div className="ef-icon-strip" style={{ gridTemplateColumns: `repeat(${icons.length}, minmax(0, 1fr))` }}>
      {icons.map((Icon, index) => (
        <button key={index} className={["ef-icon-button", index === activeIndex ? "is-active" : ""].join(" ")}>
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
