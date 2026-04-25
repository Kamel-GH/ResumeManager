"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, Eye, Magnet, Plus, Ruler, Settings2 } from "lucide-react";

import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  EDITOR_PAGE_HEIGHT_PX,
  EDITOR_PAGE_WIDTH_PX,
  RULER_MAJOR_STEP_MM,
  RULER_MINOR_STEP_MM,
} from "@/features/editor/components/editor-layout-constants";
import { canvasTools, pages } from "@/features/editor/components/editor-mock-data";
import { EditorRenderTreePreview } from "@/features/editor/renderers/editor-render-tree-preview";
import { useEditorStore } from "@/features/editor/stores/editor-store";

export function CanvasViewport() {
  const activePageId = useEditorStore((state) => state.activePageId);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);

  return (
    <section className="ef-canvas-shell">
      <div className="ef-pagebar">
        <div className="ef-pagebar-left">
          {pages.map((page, index) => (
            <button
              key={page}
              className={["ef-page-tab", index === 0 ? "is-active" : ""].join(" ")}
              onClick={() => setActivePageId(`page-${index + 1}`)}
            >
              {page}
            </button>
          ))}
          <span className="ef-page-divider" />
          <button className="ef-page-add ef-value-field" title="Ajouter une page">
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="ef-pagebar-tools">
          <TogglePill icon={Ruler} label="Regles" active />
          <TogglePill icon={Eye} label="Marges" active />
          <TogglePill icon={Magnet} label="Magnetisme" active />
          <span className="ef-toggle-pill is-active">Page {activePageId.replace("page-", "")} / 3</span>
        </div>
      </div>

      <div className="ef-canvas-scroll">
        <CanvasFloatingToolbar />
        <div className="ef-ruler-grid">
          <RulerCorner />
          <HorizontalRuler />
          <VerticalRuler />
          <div className="ef-canvas-stage">
            <EditorRenderTreePreview />
            <div className="ef-guide ef-guide-v" />
            <div className="ef-guide ef-guide-h" />
            <div className="ef-margin-guide" />
          </div>
        </div>
      </div>

      <div className="ef-canvas-footer">
        <button className="ef-adjust-button">
          <Settings2 size={13} aria-hidden="true" />
          Ajuster
          <ChevronDown size={12} aria-hidden="true" />
        </button>
        <div className="ef-footer-toggles">
          <CheckboxPill label="Afficher les marges" />
          <CheckboxPill label="Magnétisme" />
        </div>
        <button className="ef-format-button">
          A4 - 210 x 297 mm <ChevronDown size={12} aria-hidden="true" />
        </button>
        <span className="ef-footer-page">Page {activePageId.replace("page-", "")} / 3</span>
      </div>
    </section>
  );
}

type RulerTick = {
  isMajor: boolean;
  label?: string;
  position: number;
};

const horizontalTicks = buildRulerTicks(A4_WIDTH_MM, EDITOR_PAGE_WIDTH_PX);
const verticalTicks = buildRulerTicks(A4_HEIGHT_MM, EDITOR_PAGE_HEIGHT_PX);

function buildRulerTicks(lengthMm: number, lengthPx: number): RulerTick[] {
  const ticks: RulerTick[] = [];
  const pxPerMm = lengthPx / lengthMm;

  for (let mm = 0; mm <= lengthMm; mm += RULER_MINOR_STEP_MM) {
    const isMajor = mm % RULER_MAJOR_STEP_MM === 0 || mm === lengthMm;
    ticks.push({
      isMajor,
      label: isMajor ? String(mm) : undefined,
      position: Math.round(mm * pxPerMm),
    });
  }

  const lastTick = ticks[ticks.length - 1];
  if (!lastTick || lastTick.position !== lengthPx) {
    ticks.push({ isMajor: true, label: String(lengthMm), position: lengthPx });
  }

  return ticks;
}

function RulerCorner() {
  return (
    <div className="ef-ruler-corner">
      <span className="ef-ruler-corner-dot" />
    </div>
  );
}

function HorizontalRuler() {
  return (
    <div className="ef-ruler-h">
      {horizontalTicks.map((tick) => (
        <span key={`h-tick-${tick.position}`} className="ef-ruler-tick-h" style={{ left: tick.position, height: tick.isMajor ? 11 : 6 }} />
      ))}
      {horizontalTicks.filter((tick) => tick.label).map((tick) => (
        <span key={`h-label-${tick.position}`} className="ef-ruler-label-h" style={{ left: tick.position }}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

function VerticalRuler() {
  return (
    <div className="ef-ruler-v">
      {verticalTicks.map((tick) => (
        <span key={`v-tick-${tick.position}`} className="ef-ruler-tick-v" style={{ top: tick.position, width: tick.isMajor ? 11 : 6 }} />
      ))}
      {verticalTicks.filter((tick) => tick.label).map((tick) => (
        <span key={`v-label-${tick.position}`} className="ef-ruler-label-v" style={{ top: tick.position }}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

function CanvasFloatingToolbar() {
  const dragStartRef = useRef<{ left: number; pointerX: number; pointerY: number; top: number } | null>(null);
  const [position, setPosition] = useState({ left: 20, top: 72 });

  return (
    <div className="ef-tool-palette" style={{ left: position.left, top: position.top }}>
      <button
        className="ef-tool-palette-handle"
        type="button"
        aria-label="Déplacer la palette"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStartRef.current = {
            left: position.left,
            pointerX: event.clientX,
            pointerY: event.clientY,
            top: position.top,
          };
        }}
        onPointerMove={(event) => {
          const dragStart = dragStartRef.current;
          if (!dragStart) {
            return;
          }

          setPosition({
            left: Math.max(8, Math.min(220, dragStart.left + event.clientX - dragStart.pointerX)),
            top: Math.max(38, Math.min(190, dragStart.top + event.clientY - dragStart.pointerY)),
          });
        }}
        onPointerUp={(event) => {
          dragStartRef.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      />
      {canvasTools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.label}
            className={["ef-tool-button", tool.active ? "is-active" : ""].join(" ")}
            title={tool.label}
          >
            <Icon size={18} strokeWidth={tool.label === "Texte" ? 1.45 : 1.85} aria-hidden="true" />
            <span>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TogglePill({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: true }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button className={["ef-toggle-pill", active ? "is-active" : ""].join(" ")}>
      <Icon size={12} aria-hidden />
      {label}
    </button>
  );
}

function CheckboxPill({ label }: { label: string }) {
  return (
    <span className="ef-checkbox-pill">
      <span className="ef-checkbox-icon">
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </span>
      {label}
    </span>
  );
}
