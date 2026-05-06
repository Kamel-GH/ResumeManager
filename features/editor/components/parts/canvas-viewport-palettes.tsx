"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type RefObject } from "react";
import { ArrowLeftRight, Check, ChevronLeft, ChevronRight, Grid3X3, GripVertical, Hand, Pentagon, Plus, RotateCcw, Ruler, Magnet, Settings2, Square, X, ZoomIn, ZoomOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { EditorColorPopoverContent, normalizeEditorColorValue, resolveEditorColorButtonStyle } from "@/features/editor/components/parts/editor-color-controls";
import {
  CANVAS_ARC_PRESETS,
  CANVAS_SHAPE_PRESETS,
  createCanvasArcPresetToolPayload,
  createCanvasShapePresetPayload,
  type CanvasArcPreset,
  type CanvasPresetIcon,
  type CanvasPresetIconElement,
  type CanvasShapePreset,
} from "@/features/editor/schema/canvas-presets";
import {
  isCanvasObjectStyleSupportedElement,
  resolveCanvasObjectStyleCapabilities,
  resolveCanvasObjectStylePreview,
} from "@/features/editor/schema/canvas-mutation";
import { isArcToolId, type CanvasToolId } from "@/features/editor/schema/canvas-insertion";
import {
  projectRulerTickToViewportPosition,
  type EditorWorkspaceSettings,
  type RulerTick,
  type WorkspaceViewport,
} from "@/features/editor/schema/workspace-layout";
import type { TemplateElement } from "@/features/editor/schema/template-schema";
import { EDITOR_VIEWPORT_MAX_ZOOM, EDITOR_VIEWPORT_MIN_ZOOM, useEditorStore } from "@/features/editor/stores/editor-store";
import { WorkspaceSettingsDialog } from "@/features/editor/components/parts/canvas-workspace-settings-dialog";

type PaletteOrientation = "vertical" | "horizontal";

type PaletteIconProps = {
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
};

type PaletteTool = {
  id: string;
  label: string;
  icon: ComponentType<PaletteIconProps>;
  active?: boolean;
};

type PaletteGroup = {
  title?: string;
  items: PaletteTool[];
};

type PaletteColorKind = "fill" | "stroke";

type PaletteColorState = {
  value: string;
  defaultValue: string;
  mixed: boolean;
  compatibleElementIds: string[];
};

const floatingPaletteGroups: PaletteGroup[] = [
  {
    items: [
      { id: "pointer", label: "Pointeur", icon: PalettePointerIcon, active: true },
      { id: "selection", label: "Sélection", icon: PaletteSelectionIcon },
      { id: "hand", label: "Main", icon: PaletteHandIcon },
    ],
  },
  {
    items: [
      { id: "eraser", label: "Gomme", icon: PaletteEraserIcon },
      { id: "import", label: "Importer média", icon: PaletteImageIcon },
    ],
  },
  {
    items: [
      { id: "arrows", label: "Ligne", icon: PaletteArrowIcon },
      { id: "curves", label: "Courbes", icon: PaletteCurveIcon },
      { id: "forms", label: "Formes", icon: PaletteFormsIcon },
      { id: "segments", label: "Polyligne", icon: PaletteLineIcon },
    ],
  },
  {
    items: [
      { id: "polygon", label: "Polygone", icon: Pentagon },
      { id: "rectangle", label: "Carré / Rectangle", icon: Square },
      { id: "circle", label: "Cercle / Ovale", icon: PaletteCircleIcon },
      { id: "arc", label: "Arc", icon: PaletteArcIcon },
    ],
  },
  {
    items: [
      { id: "richtext", label: "Zone rich text", icon: PaletteTextFrameIcon },
      { id: "table", label: "Tableau", icon: PaletteTableIcon },
      { id: "stroke-color", label: "Couleur du contour", icon: PaletteStrokeColorIcon },
      { id: "fill-color", label: "Couleur du fond", icon: PaletteFillColorIcon },
    ],
  },
];

const shapePopoverSections: Array<{
  title: string;
  items: readonly CanvasShapePreset[];
}> = [
  {
    title: "Formes prédéfinies",
    items: CANVAS_SHAPE_PRESETS,
  },
];

function PaletteSvg({
  children,
  size = 18,
  strokeWidth = 1.8,
}: PaletteIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function PaletteGripIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <circle cx="6" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <path d="M7 18l5 4 5-4" />
    </PaletteSvg>
  );
}

function PaletteCircleIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <circle cx="12" cy="12" r="7.5" />
    </PaletteSvg>
  );
}

function PaletteArcIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M5.5 15.5a6.5 6.5 0 0 1 13 0" />
      <path d="M16.2 13.5 18.5 15.5 16.2 17.4" />
    </PaletteSvg>
  );
}

function PalettePointerIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M6 5.5 15.5 14l-3.4 1.1 1.3 4.4-1.8.5-1.4-4.5-2.9 2.9z" />
    </PaletteSvg>
  );
}

function PaletteSelectionIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.4" strokeDasharray="2 2" />
    </PaletteSvg>
  );
}

function PaletteHandIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M8.8 11.6V7.8a1 1 0 0 1 2 0v3.1" />
      <path d="M10.8 11.6V6.8a1 1 0 0 1 2 0v4.4" />
      <path d="M12.8 11.6V7.2a1 1 0 0 1 2 0v4.2" />
      <path d="M14.8 12v-2a1 1 0 0 1 2 0v4a4 4 0 0 1-4 4h-2.2a4.8 4.8 0 0 1-3.9-2l-1.6-2.2" />
    </PaletteSvg>
  );
}

function PaletteEraserIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M7 15.5 13.2 9.3a1.8 1.8 0 0 1 2.5 0l1.8 1.8-6.1 6.1H8.5z" />
      <path d="M8.4 16h8.3" />
    </PaletteSvg>
  );
}

function PaletteImageIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="4.8" y="5.8" width="14.4" height="12.4" rx="1.6" />
      <path d="M7 14.5 10.3 11l2.5 2.5 1.8-1.8L17 14.5" />
      <circle cx="9.1" cy="9.1" r="1" fill="currentColor" stroke="none" />
    </PaletteSvg>
  );
}

function PaletteArrowIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M6.5 16.5 16.5 6.5" />
      <path d="M11.5 6.5h5v5" />
    </PaletteSvg>
  );
}

function PaletteCurveIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M5.5 15.8c3.8-6.8 5.7-7.9 12.2-5.9" />
      <path d="M15.4 8.6 18.5 10l-2 2.4" />
    </PaletteSvg>
  );
}

function PaletteFreehandIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M5.8 15.6c1.4-1.8 2.2-3.2 3.4-3.2 1.6 0 1.6 2.2 3.2 2.2 1.4 0 1.8-4.2 4.2-4.2 1.2 0 1.9 1 2.6 2.2" />
    </PaletteSvg>
  );
}

function PaletteFormsIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="4.8" y="4.8" width="4.8" height="4.8" rx="1" />
      <circle cx="17.2" cy="7.2" r="2.3" />
      <path d="M5.4 18 8.8 12.2 12 18z" />
      <path d="M16 12.2 19 15l-3 3-3-3z" />
    </PaletteSvg>
  );
}

function PaletteStrokeColorIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M7.2 17h9.6" />
      <path d="M7.6 14.2 16.4 5.4" />
    </PaletteSvg>
  );
}

function PaletteFillColorIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="7.4" y="7.4" width="9.2" height="9.2" rx="1.4" fill="currentColor" stroke="none" />
    </PaletteSvg>
  );
}

function PaletteLineIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M6.5 17 17 6.5" />
    </PaletteSvg>
  );
}

function PaletteTextFrameIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="1.3" strokeDasharray="2 2" />
      <path d="M8 10.5h8" />
      <path d="M12 8v8" />
    </PaletteSvg>
  );
}

function PaletteTableIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <rect x="5" y="5" width="14" height="14" rx="1.2" />
      <path d="M5 10.2h14" />
      <path d="M5 14.8h14" />
      <path d="M9.7 5v14" />
      <path d="M14.3 5v14" />
    </PaletteSvg>
  );
}

function CanvasPresetIconView({ icon, ...props }: PaletteIconProps & { icon: CanvasPresetIcon }) {
  return (
    <svg
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props["aria-hidden"]}
    >
      {icon.elements.map((element, index) => (
        <CanvasPresetIconElementView key={`preset-icon-${index}`} element={element} />
      ))}
    </svg>
  );
}

function CanvasPresetIconElementView({ element }: { element: CanvasPresetIconElement }) {
  if (element.type === "rect") {
    return (
      <rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rx={element.rx}
        fill={element.fill ?? "none"}
        stroke={element.stroke ?? "currentColor"}
        strokeWidth={element.strokeWidth}
      />
    );
  }

  return (
    <path
      d={element.d}
      fill={element.fill ?? "none"}
      stroke={element.stroke ?? "currentColor"}
      strokeWidth={element.strokeWidth}
      strokeLinecap={element.strokeLinecap}
      strokeLinejoin={element.strokeLinejoin}
    />
  );
}

export function CanvasNavigationPalette({
  activePageIndex,
  gridEnabled,
  isPanActive,
  onAddPage,
  onNextPage,
  onPreviousPage,
  onResetZoom,
  onToggleGrid,
  onTogglePan,
  onToggleRulers,
  onToggleSnap,
  onZoomIn,
  onZoomOut,
  pageCount,
  rulersVisible,
  snapEnabled,
  zoom,
}: {
  activePageIndex: number;
  gridEnabled: boolean;
  isPanActive: boolean;
  onAddPage: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onResetZoom: () => void;
  onToggleGrid: () => void;
  onTogglePan: () => void;
  onToggleRulers: () => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  pageCount: number;
  rulersVisible: boolean;
  snapEnabled: boolean;
  zoom: number;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const zoomPercent = Math.round(zoom * 100);
  const isFirstPage = activePageIndex <= 0;
  const isLastPage = activePageIndex >= pageCount - 1;

  return (
    <>
      <div className="ef-navigation-palette" aria-label="Navigation canvas">
      <div className="ef-navigation-group" aria-label="Zoom">
        <NavigationPaletteButton icon={ZoomOut} label="Zoom -" onClick={onZoomOut} disabled={zoom <= EDITOR_VIEWPORT_MIN_ZOOM} />
        <button className="ef-navigation-zoom-value" type="button" onClick={onResetZoom} title="Zoom 100 %" aria-label="Zoom 100 %">
          {zoomPercent}%
        </button>
        <NavigationPaletteButton icon={ZoomIn} label="Zoom +" onClick={onZoomIn} disabled={zoom >= EDITOR_VIEWPORT_MAX_ZOOM} />
        <NavigationPaletteButton icon={RotateCcw} label="Zoom 100 %" onClick={onResetZoom} />
      </div>
      <span className="ef-navigation-separator" aria-hidden="true" />
      <div className="ef-navigation-group" aria-label="Pan">
        <NavigationPaletteButton icon={Hand} label="Mode Pan" onClick={onTogglePan} active={isPanActive} />
        <NavigationPaletteButton icon={Settings2} label="Réglages de page" onClick={() => setSettingsOpen(true)} />
      </div>
      <span className="ef-navigation-separator" aria-hidden="true" />
      <div className="ef-navigation-group" aria-label="Aides au placement">
        <NavigationPaletteButton icon={Ruler} label="Règles" onClick={onToggleRulers} active={rulersVisible} />
        <NavigationPaletteButton icon={Magnet} label="Magnétisme" onClick={onToggleSnap} active={snapEnabled} />
        <NavigationPaletteButton icon={Grid3X3} label="Grille" onClick={onToggleGrid} active={gridEnabled} />
      </div>
      <span className="ef-navigation-separator" aria-hidden="true" />
      <div className="ef-navigation-group" aria-label="Pages">
        <NavigationPaletteButton icon={ChevronLeft} label="Page précédente" onClick={onPreviousPage} disabled={isFirstPage} />
        <span className="ef-navigation-page-indicator" aria-label="Page courante">
          {Math.min(activePageIndex + 1, pageCount)} / {pageCount}
        </span>
        <NavigationPaletteButton icon={ChevronRight} label="Page suivante" onClick={onNextPage} disabled={isLastPage} />
        <NavigationPaletteButton icon={Plus} label="Ajouter une page" onClick={onAddPage} />
      </div>
      </div>

      <WorkspaceSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function NavigationPaletteButton({
  active,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={["ef-navigation-button", active ? "is-active" : ""].join(" ")} type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

export function RulerCorner() {
  return (
    <div className="ef-ruler-corner">
      <span className="ef-ruler-corner-dot" />
    </div>
  );
}

export function HorizontalRuler({
  ticks,
  viewport,
  width,
  visible,
}: {
  ticks: RulerTick[];
  viewport: WorkspaceViewport;
  width: number;
  visible: boolean;
}) {
  return (
    <div className="ef-ruler-h" style={{ width, visibility: visible ? "visible" : "hidden" }}>
      {ticks.map((tick) => (
        <span
          key={`h-tick-${tick.workspacePosition}`}
          className="ef-ruler-tick-h"
          style={{ left: projectRulerTickToViewportPosition(tick, viewport, "x"), height: tick.grade === "major" ? 11 : tick.grade === "fine" ? 4 : 6 }}
        />
      ))}
      {ticks.filter((tick) => tick.label).map((tick) => (
        <span key={`h-label-${tick.workspacePosition}`} className="ef-ruler-label-h" style={{ left: projectRulerTickToViewportPosition(tick, viewport, "x") }}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

export function VerticalRuler({
  ticks,
  viewport,
  height,
  visible,
}: {
  ticks: RulerTick[];
  viewport: WorkspaceViewport;
  height: number;
  visible: boolean;
}) {
  return (
    <div className="ef-ruler-v" style={{ height, visibility: visible ? "visible" : "hidden" }}>
      {ticks.map((tick) => (
        <span
          key={`v-tick-${tick.workspacePosition}`}
          className="ef-ruler-tick-v"
          style={{ top: projectRulerTickToViewportPosition(tick, viewport, "y"), width: tick.grade === "major" ? 11 : tick.grade === "fine" ? 4 : 6 }}
        />
      ))}
      {ticks.filter((tick) => tick.label).map((tick) => (
        <span key={`v-label-${tick.workspacePosition}`} className="ef-ruler-label-v" style={{ top: projectRulerTickToViewportPosition(tick, viewport, "y") }}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

export function CanvasFloatingPalette({
  boundaryRef,
  onImportImage,
}: {
  boundaryRef: RefObject<HTMLDivElement | null>;
  onImportImage: () => void;
}) {
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ left: number; pointerX: number; pointerY: number; top: number } | null>(null);
  const [position, setPosition] = useState({ left: 20, top: 56 });
  const [orientation, setOrientation] = useState<PaletteOrientation>("vertical");
  const [collapsed, setCollapsed] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);
  const [arcOpen, setArcOpen] = useState(false);
  const [fillColorOpen, setFillColorOpen] = useState(false);
  const [strokeColorOpen, setStrokeColorOpen] = useState(false);
  const activePageId = useEditorStore((state) => state.activePageId);
  const activeToolId = useEditorStore((state) => state.activeCanvasTool);
  const setActiveToolId = useEditorStore((state) => state.setActiveCanvasTool);
  const insertCanvasDropPayload = useEditorStore((state) => state.insertCanvasDropPayload);
  const insertCanvasToolPayload = useEditorStore((state) => state.insertCanvasToolPayload);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const commitCanvasObjectStyle = useEditorStore((state) => state.commitCanvasObjectStyle);
  const defaultFillColor = useEditorStore((state) => state.defaultFillColor);
  const defaultStrokeColor = useEditorStore((state) => state.defaultStrokeColor);
  const setDefaultFillColor = useEditorStore((state) => state.setDefaultFillColor);
  const setDefaultStrokeColor = useEditorStore((state) => state.setDefaultStrokeColor);
  const activePage = useMemo(() => workingTemplate.pages.find((page) => page.id === activePageId) ?? workingTemplate.pages[0] ?? null, [activePageId, workingTemplate.pages]);

  const activeTool = useMemo(() => {
    const tools = floatingPaletteGroups.flatMap((group) => group.items);
    if (activeToolId === "freehand") {
      return {
        id: "freehand",
        label: "Forme libre",
        icon: PaletteFreehandIcon,
      } as PaletteTool;
    }

    if (isArcToolId(activeToolId)) {
      return tools.find((tool) => tool.id === "arc") ?? tools[0];
    }

    return tools.find((tool) => tool.id === activeToolId) ?? tools[0];
  }, [activeToolId]);

  const selectedStyleableElements = useMemo(
    () =>
      selectedElementIds
        .map((elementId) => workingTemplate.elements.find((element) => element.id === elementId) ?? null)
        .filter((element): element is (typeof workingTemplate.elements)[number] => element !== null && isCanvasObjectStyleSupportedElement(element)),
    [selectedElementIds, workingTemplate],
  );

  const paletteFillState = useMemo(() => resolvePaletteColorState(selectedStyleableElements, "fill", defaultFillColor), [defaultFillColor, selectedStyleableElements]);
  const paletteStrokeState = useMemo(() => resolvePaletteColorState(selectedStyleableElements, "stroke", defaultStrokeColor), [defaultStrokeColor, selectedStyleableElements]);

  const toggleOrientation = () => {
    setOrientation((current) => {
      const nextOrientation = current === "vertical" ? "horizontal" : "vertical";
      setPosition((position) => {
        const containerRect = boundaryRef.current?.getBoundingClientRect();
        const paletteRect = paletteRef.current?.getBoundingClientRect();
        return clampPalettePosition(position.left, position.top, nextOrientation, containerRect, paletteRect);
      });
      return nextOrientation;
    });
  };

  useEffect(() => {
    const handleWindowResize = () => {
      setPosition((current) => {
        const containerRect = boundaryRef.current?.getBoundingClientRect();
        const paletteRect = paletteRef.current?.getBoundingClientRect();
        return clampPalettePosition(current.left, current.top, orientation, containerRect, paletteRect);
      });
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [boundaryRef, orientation]);

  const handleToolClick = useCallback(
    (tool: PaletteTool) => {
      if (tool.id === "arc") {
        setArcOpen((value) => !value);
        setFormsOpen(false);
        setFillColorOpen(false);
        setStrokeColorOpen(false);
        return;
      }

      if (tool.id === "forms") {
        setFormsOpen((value) => !value);
        setArcOpen(false);
        setFillColorOpen(false);
        setStrokeColorOpen(false);
        return;
      }

      if (tool.id === "import") {
        setFormsOpen(false);
        setArcOpen(false);
        setFillColorOpen(false);
        setStrokeColorOpen(false);
        onImportImage();
        return;
      }

      if (isCanvasPaletteToolId(tool.id)) {
        setActiveToolId(tool.id);
        setFormsOpen(false);
        setArcOpen(false);
        setFillColorOpen(false);
        setStrokeColorOpen(false);
      }
    },
    [onImportImage, setActiveToolId],
  );

  const applyPaletteColor = useCallback(
    (kind: PaletteColorKind, color: string) => {
      const targetIds = (kind === "fill" ? paletteFillState : paletteStrokeState).compatibleElementIds;
      if (targetIds.length > 0) {
        const result = commitCanvasObjectStyle({
          patches: targetIds.map((elementId) => ({
            id: elementId,
            style: kind === "fill" ? { fill: color } : { stroke: color },
          })),
        });

        if (!result.committed) {
          console.warn("[editor] palette style commit rejected", result.reason);
        }

        return;
      }

      if (kind === "fill") {
        setDefaultFillColor(color);
        return;
      }

      setDefaultStrokeColor(color);
    },
    [commitCanvasObjectStyle, paletteFillState, paletteStrokeState, setDefaultFillColor, setDefaultStrokeColor],
  );

  const insertPresetShape = useCallback(
    (shapePreset: CanvasShapePreset) => {
      if (!activePage) {
        return;
      }

      const result = insertCanvasDropPayload({
        pageId: activePage.id,
        point: {
          x: activePage.width / 2,
          y: activePage.height / 2,
        },
        source: {
          type: "shape",
          payload: createCanvasShapePresetPayload(shapePreset),
        },
      });

      if (!result.inserted) {
        console.warn("[editor] preset shape insertion rejected", result.sourceType, result.reason);
      }
    },
    [activePage, insertCanvasDropPayload],
  );

  const insertPresetArc = useCallback(
    (arcPreset: CanvasArcPreset) => {
      if (!activePage) {
        return;
      }

      const frame = {
        x: activePage.width / 2 - arcPreset.defaultFrame.width / 2,
        y: activePage.height / 2 - arcPreset.defaultFrame.height / 2,
        width: arcPreset.defaultFrame.width,
        height: arcPreset.defaultFrame.height,
      };
      const result = insertCanvasToolPayload({
        pageId: activePage.id,
        frame,
        source: {
          type: "canvas-tool",
          payload: createCanvasArcPresetToolPayload(arcPreset, frame),
        },
      });

      if (!result.inserted) {
        console.warn("[editor] preset arc insertion rejected", result.sourceType, result.reason);
      }
    },
    [activePage, insertCanvasToolPayload],
  );

  const renderTool = (tool: PaletteTool) => {
    const Icon = tool.icon;
    const isActive =
      tool.id === activeToolId ||
      (tool.id === "arc" && isArcToolId(activeToolId)) ||
      (tool.id === "forms" && formsOpen) ||
      (tool.id === "stroke-color" && strokeColorOpen) ||
      (tool.id === "fill-color" && fillColorOpen);

    if (tool.id === "forms") {
      return (
        <Popover
          key={tool.id}
          open={formsOpen}
          onOpenChange={(open) => {
            setFormsOpen(open);
            if (open) {
              setArcOpen(false);
              setFillColorOpen(false);
              setStrokeColorOpen(false);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={["ef-tool-icon-button", isActive ? "is-active" : ""].join(" ")}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={isActive}
              onClick={() => {
                setArcOpen(false);
                setFillColorOpen(false);
                setStrokeColorOpen(false);
              }}
            >
              <Icon size={16} strokeWidth={1.8} aria-hidden={true} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" side={orientation === "vertical" ? "right" : "bottom"} sideOffset={10} className="ef-shape-popover-panel">
            <ShapePopoverContent
              onClose={() => setFormsOpen(false)}
              onSelect={(shapePreset) => {
                insertPresetShape(shapePreset);
                setFormsOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      );
    }

    if (tool.id === "stroke-color" || tool.id === "fill-color") {
      const colorKind: PaletteColorKind = tool.id === "fill-color" ? "fill" : "stroke";
      const colorState = colorKind === "fill" ? paletteFillState : paletteStrokeState;
      const open = colorKind === "fill" ? fillColorOpen : strokeColorOpen;
      const setOpen = colorKind === "fill" ? setFillColorOpen : setStrokeColorOpen;
      const defaultColor = colorKind === "fill" ? defaultFillColor : defaultStrokeColor;

      return (
        <Popover
          key={tool.id}
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen) {
              setFormsOpen(false);
              setArcOpen(false);
              if (colorKind === "fill") {
                setStrokeColorOpen(false);
              } else {
                setFillColorOpen(false);
              }
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn("ef-tool-color-button", `is-${colorKind}`, isActive && "is-active")}
              data-mixed={colorState.mixed ? "true" : undefined}
              style={resolveEditorColorButtonStyle(colorState.value, colorState.mixed)}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={isActive}
              onClick={() => {
                setFormsOpen(false);
                setArcOpen(false);
              }}
            >
              <span className="ef-tool-color-button-chip" aria-hidden="true" />
              <Icon size={12} strokeWidth={2} aria-hidden={true} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" side={orientation === "vertical" ? "right" : "bottom"} sideOffset={10} className="ef-palette-color-popover">
            <EditorColorPopoverContent
              title={tool.label}
              value={colorState.value}
              defaultValue={defaultColor}
              mixed={colorState.mixed}
              onChange={(value) => applyPaletteColor(colorKind, value)}
              onReset={() => applyPaletteColor(colorKind, defaultColor)}
              onClose={() => setOpen(false)}
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <button
        key={tool.id}
        className={["ef-tool-row", isActive ? "is-active" : ""].join(" ")}
        type="button"
        title={tool.label}
        aria-label={tool.label}
        aria-pressed={isActive}
        onClick={() => handleToolClick(tool)}
      >
        <span className="ef-tool-row-icon">
          <Icon size={18} strokeWidth={1.8} aria-hidden={true} />
        </span>
      </button>
    );
  };

  if (collapsed) {
    return (
      <div ref={paletteRef} className="ef-tool-palette is-collapsed" style={{ left: position.left, top: position.top }}>
        <button
          className="ef-tool-mini"
          type="button"
          aria-label={`Rouvrir la palette, outil actif : ${activeTool.label}`}
          title={`Rouvrir la palette, outil actif : ${activeTool.label}`}
          onClick={() => setCollapsed(false)}
        >
          <activeTool.icon size={18} strokeWidth={1.85} aria-hidden={true} />
        </button>
      </div>
    );
  }

  return (
    <div ref={paletteRef} className={["ef-tool-palette", orientation === "vertical" ? "is-vertical" : "is-horizontal"].join(" ")} style={{ left: position.left, top: position.top }}>
      <div className={["ef-tool-palette-bar", orientation === "horizontal" ? "is-left-rail" : ""].join(" ")}>
        <button
          className="ef-tool-palette-grip"
          type="button"
          aria-label="Déplacer la palette"
          title="Déplacer la palette"
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

            const containerRect = boundaryRef.current?.getBoundingClientRect();
            const paletteRect = paletteRef.current?.getBoundingClientRect();
            setPosition(
              clampPalettePosition(
                dragStart.left + event.clientX - dragStart.pointerX,
                dragStart.top + event.clientY - dragStart.pointerY,
                orientation,
                containerRect,
                paletteRect,
              ),
            );
          }}
          onPointerUp={(event) => {
            dragStartRef.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
        >
          {orientation === "vertical" ? <PaletteGripIcon /> : <GripVertical size={14} strokeWidth={2} aria-hidden="true" />}
        </button>
      </div>

      <div className="ef-tool-palette-content">
        {orientation === "vertical" ? (
          <>
            <div className="ef-tool-stack">
              {floatingPaletteGroups.map((group, index) => (
                <div key={`palette-group-${index}`}>
                  {index > 0 ? <div className="ef-tool-section-divider" /> : null}
                  {group.items.map((tool) => renderTool(tool))}
                </div>
              ))}
            </div>
            <div className="ef-tool-footer ef-tool-footer--vertical">
              <button className="ef-tool-footer-button" type="button" aria-label="Réduire" title="Réduire" onClick={() => setCollapsed(true)}>
                <Square size={14} aria-hidden="true" />
              </button>
              <button className="ef-tool-footer-button" type="button" aria-label="Replier / Déplier" title="Replier / Déplier" onClick={toggleOrientation}>
                <ArrowLeftRight size={14} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="ef-tool-strip">
            {floatingPaletteGroups.map((group, index) => (
              <Fragment key={`palette-strip-group-${index}`}>
                {group.items.map((tool) => renderTool(tool))}
                {index < floatingPaletteGroups.length - 1 ? <span className="ef-tool-strip-separator" /> : null}
              </Fragment>
            ))}
            <div className="ef-tool-footer">
              <button className="ef-tool-footer-button" type="button" aria-label="Réduire" title="Réduire" onClick={() => setCollapsed(true)}>
                <Square size={14} aria-hidden="true" />
              </button>
              <button className="ef-tool-footer-button" type="button" aria-label="Replier / Déplier" title="Replier / Déplier" onClick={toggleOrientation}>
                <ArrowLeftRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {arcOpen ? (
        <ArcPopover
          onClose={() => setArcOpen(false)}
          onSelect={(arcPreset) => {
            insertPresetArc(arcPreset);
            setArcOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ShapePopoverContent({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (shapePreset: CanvasShapePreset) => void;
}) {
  return (
    <div className="ef-shape-popover-shell" role="menu" aria-label="Formes">
      <div className="ef-shape-popover-header">
        <span>Formes</span>
        <Button className="ef-shape-popover-close" type="button" variant="ghost" size="icon-sm" aria-label="Fermer" title="Fermer" onClick={onClose}>
          <X size={12} aria-hidden="true" />
        </Button>
      </div>
      {shapePopoverSections.map((section, sectionIndex) => (
        <div key={`shape-section-${sectionIndex}`} className="ef-shape-popover-section">
          <div className="ef-shape-popover-section-title">{section.title}</div>
          <div className="ef-shape-grid">
            {section.items.map((item) => {
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ef-shape-item"
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => onSelect(item)}
                >
                  <CanvasPresetIconView icon={item.icon} size={15} strokeWidth={1.9} aria-hidden={true} />
                </Button>
              );
            })}
          </div>
          {sectionIndex < shapePopoverSections.length - 1 ? <div className="ef-shape-section-divider" /> : null}
        </div>
      ))}
    </div>
  );
}

function isCanvasPaletteToolId(toolId: PaletteTool["id"]): toolId is CanvasToolId {
  return toolId !== "forms" && toolId !== "stroke-color" && toolId !== "fill-color";
}

function ArcPopover({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (variant: CanvasArcPreset) => void;
}) {
  return (
    <div className="ef-shape-popover" role="dialog" aria-label="Outils d'arc">
      <div className="ef-shape-popover-header">
        <span>Arc</span>
        <Button className="ef-shape-popover-close" type="button" variant="ghost" size="icon-sm" aria-label="Fermer" title="Fermer" onClick={onClose}>
          <X size={12} aria-hidden="true" />
        </Button>
      </div>
      <div className="ef-shape-grid">
        {CANVAS_ARC_PRESETS.map((variant) => (
          <button
            key={variant.id}
            className="ef-shape-item"
            type="button"
            title={variant.label}
            aria-label={variant.label}
            onClick={() => onSelect(variant)}
          >
            <CanvasPresetIconView icon={variant.icon} size={15} strokeWidth={1.9} aria-hidden={true} />
          </button>
        ))}
      </div>
    </div>
  );
}

function resolvePaletteColorState(selectedElements: TemplateElement[], kind: PaletteColorKind, defaultValue: string): PaletteColorState {
  const compatibleElementIds: string[] = [];
  const values: string[] = [];

  selectedElements.forEach((element) => {
    const capabilities = resolveCanvasObjectStyleCapabilities(element);
    if (!capabilities[kind]) {
      return;
    }

    compatibleElementIds.push(element.id);
    const preview = resolveCanvasObjectStylePreview(element);
    values.push(preview[kind] ?? defaultValue);
  });

  if (compatibleElementIds.length === 0) {
    return {
      value: defaultValue,
      defaultValue,
      mixed: false,
      compatibleElementIds: [],
    };
  }

  const uniqueValues = new Set(values.map((value) => normalizeEditorColorValue(value)));
  const mixed = uniqueValues.size > 1;
  const value = mixed ? defaultValue : normalizeEditorColorValue(values[0] ?? defaultValue);

  return {
    value,
    defaultValue,
    mixed,
    compatibleElementIds,
  };
}

export function TogglePill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={["ef-toggle-pill", active ? "is-active" : ""].join(" ")} type="button" onClick={onClick}>
      <Icon size={12} aria-hidden />
      {label}
    </button>
  );
}

export function CheckboxPill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button className={["ef-checkbox-pill", active ? "is-active" : ""].join(" ")} type="button" onClick={onClick}>
      <span className="ef-checkbox-icon">
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

function clampPalettePosition(
  nextLeft: number,
  nextTop: number,
  orientation: PaletteOrientation,
  containerRect?: DOMRect | null,
  paletteRect?: DOMRect | null,
) {
  const containerWidth = containerRect?.width ?? window.innerWidth;
  const containerHeight = containerRect?.height ?? window.innerHeight;
  const paletteWidth = paletteRect?.width ?? (orientation === "vertical" ? 56 : 360);
  const paletteHeight = paletteRect?.height ?? (orientation === "vertical" ? 240 : 60);
  const minLeft = 8;
  const minTop = 24;
  const maxLeft = Math.max(minLeft, containerWidth - paletteWidth - 8);
  const maxTop = Math.max(minTop, containerHeight - paletteHeight - 8);

  return {
    left: Math.max(minLeft, Math.min(maxLeft, nextLeft)),
    top: Math.max(minTop, Math.min(maxTop, nextTop)),
  };
}
