"use client";

import type { Editor } from "@tiptap/react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  formatMeasurementValue,
  type MeasurementUnit,
} from "@/features/editor/components/rich-text/ruler/UnitConverter";
import { DEFAULT_RICH_TEXT_MARGIN_PX } from "@/features/editor/extensions/rich-text/paragraph-style";

type RulerUnit = Extract<MeasurementUnit, "px" | "mm" | "cm">;

type ParagraphRulerState = {
  marginLeft: number;
  marginRight: number;
  tabs: number[];
};

type RulerTick = {
  key: string;
  x: number;
  height: number;
  label?: string;
  kind: "major" | "minor" | "fine";
};

export type HorizontalRulerProps = {
  editor: Editor | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  unit: MeasurementUnit;
  showMarginZones: boolean;
  majorStepPx: number;
  minorStepPx: number;
  fineStepPx: number;
  widthPx?: number;
  zoom?: number;
  viewportOffsetPx?: number;
};

const DEFAULT_RULER_WIDTH = 720;
const RULER_HEIGHT = 34;
const SNAP_STEP_PX = 4;
const MIN_TEXT_WIDTH = 80;

function clampUnit(unit: MeasurementUnit): RulerUnit {
  return unit === "mm" || unit === "cm" ? unit : "px";
}

function getUnitMajorStep(unit: RulerUnit): number {
  if (unit === "cm") return 96 / 2.54;
  if (unit === "mm") return 96 / 25.4;
  return 100;
}

function snapPx(value: number): number {
  return Math.max(0, Math.round(value / SNAP_STEP_PX) * SNAP_STEP_PX);
}

function normalizeTabs(tabs: unknown): number[] {
  return Array.isArray(tabs)
    ? Array.from(
        new Set(
          tabs
            .map((tab) => (typeof tab === "number" ? tab : Number.parseFloat(String(tab))))
            .filter((tab) => Number.isFinite(tab) && tab >= 0)
            .map((tab) => Math.round(tab)),
        ),
      ).sort((left, right) => left - right)
    : [];
}

function readParagraphRulerState(editor: Editor | null): ParagraphRulerState {
  const attrs = editor?.getAttributes("paragraph") ?? {};
  return {
    marginLeft:
      typeof attrs.marginLeft === "number" ? attrs.marginLeft : DEFAULT_RICH_TEXT_MARGIN_PX,
    marginRight:
      typeof attrs.marginRight === "number" ? attrs.marginRight : DEFAULT_RICH_TEXT_MARGIN_PX,
    tabs: normalizeTabs(attrs.tabs),
  };
}

function buildTicks(
  widthPx: number,
  zoom: number,
  unit: RulerUnit,
  majorStepPx: number,
  minorStepPx: number,
  fineStepPx: number,
): RulerTick[] {
  const major = majorStepPx > 0 ? majorStepPx : getUnitMajorStep(unit);
  const minor = minorStepPx > 0 ? minorStepPx : major / 2;
  const fine = fineStepPx > 0 ? fineStepPx : major / 10;
  const ticks: RulerTick[] = [];
  const max = Math.max(0, widthPx);

  for (let position = 0; position <= max + 0.001; position += fine) {
    const isMajor = Math.abs(position / major - Math.round(position / major)) < 0.001;
    const isMinor = !isMajor && Math.abs(position / minor - Math.round(position / minor)) < 0.001;
    const screenX = position * zoom;
    ticks.push({
      key: `${unit}-${Math.round(position * 1000)}`,
      x: screenX,
      height: isMajor ? 15 : isMinor ? 10 : 5,
      label: isMajor ? formatMeasurementValue(position, unit, unit === "px" ? 0 : 1) : undefined,
      kind: isMajor ? "major" : isMinor ? "minor" : "fine",
    });
  }

  return ticks;
}

function applyParagraphState(editor: Editor | null, nextState: ParagraphRulerState): void {
  if (!editor) return;
  editor
    .chain()
    .focus()
    .updateAttributes("paragraph", {
      marginLeft: Math.max(0, Math.round(nextState.marginLeft)),
      marginRight: Math.max(0, Math.round(nextState.marginRight)),
      tabs: normalizeTabs(nextState.tabs),
    })
    .run();
}

function formatTooltip(valuePx: number, unit: RulerUnit): string {
  return `${formatMeasurementValue(valuePx, unit, unit === "px" ? 0 : 2)} ${unit}`;
}

export const HorizontalRuler = memo(function HorizontalRuler({
  editor,
  scrollContainerRef,
  unit,
  showMarginZones,
  majorStepPx,
  minorStepPx,
  fineStepPx,
  widthPx = DEFAULT_RULER_WIDTH,
  zoom = 1,
  viewportOffsetPx = 0,
}: HorizontalRulerProps) {
  const activeUnit = clampUnit(unit);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [paragraphState, setParagraphState] = useState<ParagraphRulerState>(() =>
    readParagraphRulerState(editor),
  );
  const [dragState, setDragState] = useState<{
    kind: "left-margin" | "right-margin" | "tab";
    index?: number;
    valuePx: number;
    clientX: number;
  } | null>(null);
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(paragraphState);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = paragraphState;
    const element = scrollContainerRef.current;
    if (element) {
      element.style.setProperty("--rtp-margin-left", `${paragraphState.marginLeft}px`);
      element.style.setProperty("--rtp-margin-right", `${paragraphState.marginRight}px`);
    }
  }, [paragraphState]);

  useEffect(() => {
    if (!editor) return;
    const sync = () => setParagraphState(readParagraphRulerState(editor));
    sync();
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;
    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrollLeft(element.scrollLeft));
    };
    handleScroll();
    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", handleScroll);
    };
  }, [scrollContainerRef]);

  const ticks = useMemo(
    () => buildTicks(widthPx, zoom, activeUnit, majorStepPx, minorStepPx, fineStepPx),
    [activeUnit, fineStepPx, majorStepPx, minorStepPx, widthPx, zoom],
  );
  const rulerLeftOffset = viewportOffsetPx - scrollLeft;
  const leftHandleX = paragraphState.marginLeft * zoom + rulerLeftOffset;
  const resolvePointerValue = useCallback(
    (clientX: number) => {
      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return snapPx((clientX - rect.left - rulerLeftOffset) / zoom);
    },
    [rulerLeftOffset, zoom],
  );

  const scheduleUpdate = useCallback(
    (
      nextState: ParagraphRulerState,
      nextDragState: {
        kind: "left-margin" | "right-margin" | "tab";
        index?: number;
        valuePx: number;
        clientX: number;
      },
    ) => {
      stateRef.current = nextState;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setParagraphState(stateRef.current);
        applyParagraphState(editor, stateRef.current);
      });
      setDragState(nextDragState);
    },
    [editor],
  );

  const updateFromPointer = useCallback(
    (kind: "left-margin" | "right-margin" | "tab", clientX: number, index?: number) => {
      const value = resolvePointerValue(clientX);
      const current = stateRef.current;
      if (kind === "left-margin") {
        const maxLeft = Math.max(0, widthPx - current.marginRight - MIN_TEXT_WIDTH);
        const nextValue = Math.min(value, maxLeft);
        scheduleUpdate(
          { ...current, marginLeft: nextValue },
          { kind, index, valuePx: nextValue, clientX },
        );
        return;
      }

      if (kind === "right-margin") {
        const maxRight = Math.max(0, widthPx - current.marginLeft - MIN_TEXT_WIDTH);
        const nextValue = Math.min(Math.max(0, widthPx - value), maxRight);
        scheduleUpdate(
          { ...current, marginRight: nextValue },
          { kind, index, valuePx: nextValue, clientX },
        );
        return;
      }

      if (typeof index !== "number") return;
      const nextTabs = [...current.tabs];
      nextTabs[index] = Math.min(
        Math.max(value, current.marginLeft),
        widthPx - current.marginRight,
      );
      scheduleUpdate(
        { ...current, tabs: normalizeTabs(nextTabs) },
        { kind, index, valuePx: nextTabs[index], clientX },
      );
    },
    [resolvePointerValue, scheduleUpdate, widthPx],
  );

  const startDrag = useCallback(
    (
      event: ReactPointerEvent,
      kind: "left-margin" | "right-margin" | "tab",
      valuePx: number,
      index?: number,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragState({ kind, index, valuePx, clientX: event.clientX });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      if (!dragState) return;
      event.preventDefault();
      updateFromPointer(dragState.kind, event.clientX, dragState.index);
    },
    [dragState, updateFromPointer],
  );

  const endDrag = useCallback(
    (event: ReactPointerEvent) => {
      if (!dragState) return;
      if (dragState.kind === "tab") {
        const rect = rulerRef.current?.getBoundingClientRect();
        if (rect && (event.clientY < rect.top - 18 || event.clientY > rect.bottom + 28)) {
          const current = stateRef.current;
          const nextTabs = current.tabs.filter((_, index) => index !== dragState.index);
          applyParagraphState(editor, { ...current, tabs: nextTabs });
          setParagraphState({ ...current, tabs: nextTabs });
        }
      }
      setDragState(null);
    },
    [dragState, editor],
  );

  const handleRulerClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!editor) return;
      if (event.detail !== 1) return;
      if ((event.target as Element | null)?.closest("button")) return;
      const value = resolvePointerValue(event.clientX);
      const current = stateRef.current;
      if (value <= current.marginLeft || value >= widthPx - current.marginRight) return;
      const tabs = normalizeTabs([...current.tabs, value]);
      const nextState = { ...current, tabs };
      setParagraphState(nextState);
      applyParagraphState(editor, nextState);
    },
    [editor, resolvePointerValue, widthPx],
  );

  const editTab = useCallback(
    (index: number) => {
      const current = stateRef.current;
      const value = current.tabs[index];
      if (typeof value !== "number") return;
      const nextRaw = window.prompt("Position de la tabulation en px", String(value));
      if (nextRaw === null) return;
      const nextValue = snapPx(Number.parseFloat(nextRaw));
      if (!Number.isFinite(nextValue)) return;
      const nextTabs = [...current.tabs];
      nextTabs[index] = Math.min(
        Math.max(nextValue, current.marginLeft),
        widthPx - current.marginRight,
      );
      const nextState = { ...current, tabs: normalizeTabs(nextTabs) };
      setParagraphState(nextState);
      applyParagraphState(editor, nextState);
    },
    [editor, widthPx],
  );

  const removeTab = useCallback(
    (index: number) => {
      const current = stateRef.current;
      const nextState = {
        ...current,
        tabs: current.tabs.filter((_, tabIndex) => tabIndex !== index),
      };
      setParagraphState(nextState);
      applyParagraphState(editor, nextState);
    },
    [editor],
  );

  return (
    <div
      className="ef-rtp-ruler-shell"
      style={{ width: widthPx * zoom }}
      aria-label="Règle horizontale Rich Text"
    >
      <div
        ref={rulerRef}
        className="ef-rtp-ruler"
        style={{ height: RULER_HEIGHT }}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={handleRulerClick}
      >
        <div
          className="ef-rtp-ruler-track"
          style={{ width: widthPx * zoom, transform: `translateX(${rulerLeftOffset}px)` }}
        >
          {ticks.map((tick) => (
            <span
              key={tick.key}
              className={`ef-rtp-ruler-tick is-${tick.kind}`}
              style={{ left: tick.x, height: tick.height }}
            >
              {tick.label ? <span className="ef-rtp-ruler-label">{tick.label}</span> : null}
            </span>
          ))}
          {showMarginZones ? (
            <>
              <span
                className="ef-rtp-ruler-margin-zone is-left"
                style={{ left: 0, width: paragraphState.marginLeft * zoom }}
              />
              <span
                className="ef-rtp-ruler-margin-zone is-right"
                style={{
                  left: (widthPx - paragraphState.marginRight) * zoom,
                  width: paragraphState.marginRight * zoom,
                }}
              />
            </>
          ) : null}
          <span
            className="ef-rtp-ruler-useful-zone"
            style={{
              left: leftHandleX - rulerLeftOffset,
              right: paragraphState.marginRight * zoom,
            }}
          />
          <button
            type="button"
            className="ef-rtp-ruler-margin-handle is-left"
            style={{ left: paragraphState.marginLeft * zoom }}
            aria-label="Marge gauche"
            onPointerDown={(event) => startDrag(event, "left-margin", paragraphState.marginLeft)}
          />
          <button
            type="button"
            className="ef-rtp-ruler-margin-handle is-right"
            style={{ left: (widthPx - paragraphState.marginRight) * zoom }}
            aria-label="Marge droite"
            onPointerDown={(event) => startDrag(event, "right-margin", paragraphState.marginRight)}
          />
          {paragraphState.tabs.map((tab, index) => (
            <button
              type="button"
              key={`${tab}-${index}`}
              className="ef-rtp-ruler-tab"
              style={{ left: tab * zoom }}
              aria-label={`Tabulation ${index + 1}`}
              title="Glisser pour déplacer, glisser hors règle ou Alt+clic pour supprimer, double-clic pour saisir une valeur."
              onClick={(event) => {
                if (event.altKey) {
                  event.preventDefault();
                  event.stopPropagation();
                  removeTab(index);
                }
              }}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                editTab(index);
              }}
              onPointerDown={(event) => startDrag(event, "tab", tab, index)}
            />
          ))}
        </div>
        {dragState ? (
          <>
            <span
              className="ef-rtp-ruler-guide"
              style={{
                left:
                  (dragState.kind === "right-margin"
                    ? widthPx - dragState.valuePx
                    : dragState.valuePx) *
                    zoom +
                  rulerLeftOffset,
              }}
            />
            <span
              className="ef-rtp-ruler-tooltip"
              style={{
                left: dragState.clientX - (rulerRef.current?.getBoundingClientRect().left ?? 0),
              }}
            >
              {formatTooltip(dragState.valuePx, activeUnit)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
});
