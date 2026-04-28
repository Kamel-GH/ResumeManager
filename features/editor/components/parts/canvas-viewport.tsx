"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType, DragEvent, ReactNode, RefObject } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Diamond,
  Eye,
  GripVertical,
  Hexagon,
  Heart,
  MoreHorizontal,
  Pentagon,
  Square,
  Star,
  Triangle,
  Plus,
  Ruler,
  Settings2,
  Magnet,
} from "lucide-react";

import { EditorRenderTreePreview } from "@/features/editor/renderers/editor-render-tree-preview";
import {
  isArcToolId,
  resolveArcGeometryDraft,
  type CanvasToolDraft,
  type CanvasToolId,
} from "@/features/editor/schema/canvas-insertion";
import {
  buildRulerTicks,
  buildWorkspaceLayout,
  convertClientPointToWorkspacePoint,
  convertWorkspacePointToPagePoint,
  findWorkspacePageAtPoint,
  snapWorkspaceFrame,
  snapWorkspacePoint,
  type EditorWorkspaceSettings,
  type RulerTick,
  type WorkspacePageLayout,
  type WorkspaceViewport,
} from "@/features/editor/schema/workspace-layout";
import { useEditorStore } from "@/features/editor/stores/editor-store";

type PaletteOrientation = "vertical" | "horizontal";

type PaletteIconProps = {
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
};

type PaletteTool = {
  id: CanvasToolId;
  label: string;
  icon: ComponentType<PaletteIconProps>;
  active?: boolean;
  menu?: boolean;
};

type PaletteGroup = {
  title?: string;
  items: PaletteTool[];
};

type ShapePaletteGroup = {
  title?: string;
  items: Array<{
    id: string;
    label: string;
    icon: ComponentType<PaletteIconProps>;
    menu?: boolean;
  }>;
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
      { id: "freehand", label: "Forme libre", icon: PaletteScribbleIcon },
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
      { id: "more", label: "Plus d'outils", icon: MoreHorizontal, menu: true },
    ],
  },
];

const floatingShapeGroups: ShapePaletteGroup[] = [
  {
    title: "Formes de base",
    items: [
      { id: "shape-square", label: "Carré", icon: Square },
      { id: "shape-circle", label: "Cercle", icon: PaletteCircleIcon },
      { id: "shape-oval", label: "Ovale", icon: PaletteCircleIcon },
      { id: "shape-triangle", label: "Triangle", icon: Triangle },
      { id: "shape-hexagon", label: "Hexagone", icon: Hexagon },
      { id: "shape-diamond", label: "Losange", icon: Diamond },
      { id: "shape-star", label: "Étoile", icon: Star },
      { id: "shape-heart", label: "Cœur", icon: Heart },
    ],
  },
  {
    title: "Formes de flèche",
    items: [
      { id: "shape-arrow-right", label: "Droite", icon: ArrowLeftRight },
      { id: "shape-arrow-up", label: "Montante", icon: ArrowLeftRight },
      { id: "shape-arrow-diag", label: "Diagonale", icon: ArrowLeftRight },
      { id: "shape-line", label: "Ligne", icon: PaletteLineIcon },
      { id: "shape-free", label: "Courbe", icon: PaletteCurveIcon },
      { id: "shape-chat", label: "Bulle", icon: PaletteBubbleIcon },
    ],
  },
  {
    title: "Étoiles & symboles",
    items: [
      { id: "shape-plus", label: "Plus", icon: Plus },
      { id: "shape-x", label: "Croix", icon: Diamond },
      { id: "shape-cloud", label: "Nuage", icon: PaletteCloudIcon },
      { id: "shape-pin", label: "Repère", icon: Diamond },
      { id: "shape-more", label: "Menu", icon: MoreHorizontal, menu: true },
      { id: "shape-text", label: "Texte", icon: PaletteTextFrameIcon },
    ],
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

function PaletteBubbleIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M5.5 8.5h13v7h-7.5L7 18.5v-3H5.5z" />
    </PaletteSvg>
  );
}

function PaletteCloudIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M7.5 17h8a3.5 3.5 0 0 0 .5-7 4.5 4.5 0 0 0-8.6-1.4A3 3 0 0 0 7.5 17Z" />
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

function PaletteScribbleIcon(props: PaletteIconProps) {
  return (
    <PaletteSvg {...props}>
      <path d="M5.8 15.6c1.2-2.6 2.2-4.6 3.4-5.1 1.1-.4 1.8.4 2.4 1.3.8 1.2 1.8 1.8 3 .9 1.2-.9 1.7-2.5 3.1-4.2" />
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

export function CanvasViewport() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const activePageId = useEditorStore((state) => state.activePageId);
  const setActivePageId = useEditorStore((state) => state.setActivePageId);
  const activeCanvasTool = useEditorStore((state) => state.activeCanvasTool);
  const setActiveCanvasTool = useEditorStore((state) => state.setActiveCanvasTool);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const workingTemplate = useEditorStore((state) => state.workingTemplate);
  const workspaceSettings = useEditorStore((state) => state.workspaceSettings);
  const setWorkspaceSettings = useEditorStore((state) => state.setWorkspaceSettings);
  const viewport = useEditorStore((state) => state.viewport);
  const setViewportPan = useEditorStore((state) => state.setViewportPan);
  const insertCanvasDropPayload = useEditorStore((state) => state.insertCanvasDropPayload);
  const insertCanvasToolPayload = useEditorStore((state) => state.insertCanvasToolPayload);
  const deleteCanvasElements = useEditorStore((state) => state.deleteCanvasElements);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const activePage = useMemo(() => workingTemplate.pages.find((page) => page.id === activePageId) ?? workingTemplate.pages[0] ?? null, [activePageId, workingTemplate.pages]);
  const activePageIndex = useMemo(() => workingTemplate.pages.findIndex((page) => page.id === activePageId), [activePageId, workingTemplate.pages]);
  const isArcPointTool = activeCanvasTool === "arc2point" || activeCanvasTool === "arc3point";
  const workspaceLayout = useMemo(
    () =>
      buildWorkspaceLayout(
        workingTemplate.pages.map((page) => ({
          id: page.id,
          name: page.name,
          width: page.width,
          height: page.height,
          margin: page.margin,
        })),
        {
          pageGap: workspaceSettings.pageGap,
          pagePadding: workspaceSettings.pagePadding,
        },
      ),
    [workingTemplate.pages, workspaceSettings.pageGap, workspaceSettings.pagePadding],
  );
  const horizontalTicks = useMemo(
    () => buildRulerTicks(workspaceLayout.width, workspaceSettings.rulerMajorStep, workspaceSettings.rulerMinorStep),
    [workspaceLayout.width, workspaceSettings.rulerMajorStep, workspaceSettings.rulerMinorStep],
  );
  const verticalTicks = useMemo(
    () => buildRulerTicks(workspaceLayout.height, workspaceSettings.rulerMajorStep, workspaceSettings.rulerMinorStep),
    [workspaceLayout.height, workspaceSettings.rulerMajorStep, workspaceSettings.rulerMinorStep],
  );
  const [isDropActive, setIsDropActive] = useState(false);
  const [draftCanvasCreation, setDraftCanvasCreation] = useState<CanvasToolDraft | null>(null);
  const dragDepthRef = useRef(0);
  const frameDraftRef = useRef<{
    pointerId: number;
    toolId: CanvasToolId;
    pageId: string;
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);
  const arcDraftRef = useRef<{
    pointerId: number;
    toolId: "arc" | "pie" | "arc2point" | "arc3point";
    pageId: string;
    points: { x: number; y: number }[];
    current: { x: number; y: number };
  } | null>(null);
  const lineDraftRef = useRef<{
    pointerId: number;
    toolId: CanvasToolId;
    pageId: string;
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);
  const pointDraftRef = useRef<{
    pointerId: number;
    toolId: CanvasToolId;
    pageId: string;
    points: { x: number; y: number }[];
    current: { x: number; y: number };
  } | null>(null);
  const panDraftRef = useRef<{
    pointerId: number;
    startClient: { x: number; y: number };
    startViewport: { panX: number; panY: number };
  } | null>(null);

  const clearCanvasInteractions = useCallback((target?: HTMLDivElement | null, pointerId?: number) => {
    if (target && typeof pointerId === "number" && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }

    frameDraftRef.current = null;
    arcDraftRef.current = null;
    lineDraftRef.current = null;
    pointDraftRef.current = null;
    panDraftRef.current = null;
    setDraftCanvasCreation(null);
  }, []);

  const commitArcDraft = useCallback(
    (target?: HTMLDivElement | null, pointerId?: number) => {
      const draft = arcDraftRef.current;
      if (!draft) {
        return;
      }

      const pageLayout = workspaceLayout.pages.find((page) => page.id === draft.pageId) ?? null;
      if (!pageLayout) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const geometry = resolveArcGeometryDraft(draft.toolId, draft.points, null, draft.current);
      if (!geometry) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const result = insertCanvasToolPayload({
        pageId: draft.pageId,
        frame: geometry.frame,
        source: {
          type: "canvas-tool",
          payload: {
            toolId: draft.toolId,
            frame: geometry.frame,
            anchor: draft.points[0],
            points: draft.points.flatMap((point) => [point.x, point.y]),
            arcType: geometry.arcType,
            arcSweep: geometry.sweep,
            startAngle: geometry.startAngle,
            endAngle: geometry.endAngle,
            outerRadius: geometry.radius,
          },
        },
      });

      if (result.inserted) {
        setSelectedElementIds([result.elementId]);
        setActiveCanvasTool("pointer");
      } else {
        console.warn("[editor] unsupported canvas tool payload", result.sourceType, result.reason);
      }

      clearCanvasInteractions(target, pointerId);
    },
    [clearCanvasInteractions, insertCanvasToolPayload, setActiveCanvasTool, setSelectedElementIds, workspaceLayout.pages],
  );

  const commitLineDraft = useCallback(
    (target?: HTMLDivElement | null, pointerId?: number) => {
      const draft = lineDraftRef.current;
      if (!draft) {
        return;
      }

      const pageLayout = workspaceLayout.pages.find((page) => page.id === draft.pageId) ?? null;
      if (!pageLayout) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const frame = buildLineDraftFrame(draft.start, draft.current, pageLayout, workspaceSettings);
      if (Math.hypot(draft.current.x - draft.start.x, draft.current.y - draft.start.y) < 8) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const points = buildLineDraftPoints(draft.start, draft.current, frame);
      const result = insertCanvasToolPayload({
        pageId: draft.pageId,
        frame,
        source: {
          type: "canvas-tool",
          payload: {
            toolId: draft.toolId,
            frame,
            anchor: draft.start,
            points,
            arrow: false,
          },
        },
      });

      if (result.inserted) {
        setSelectedElementIds([result.elementId]);
        setActiveCanvasTool("pointer");
      } else {
        console.warn("[editor] unsupported canvas tool payload", result.sourceType, result.reason);
      }

      clearCanvasInteractions(target, pointerId);
    },
    [clearCanvasInteractions, insertCanvasToolPayload, setActiveCanvasTool, setSelectedElementIds, workspaceLayout.pages, workspaceSettings],
  );

  const commitFrameDraft = useCallback(
    (target?: HTMLDivElement | null, pointerId?: number, allowDefaultSize = false) => {
      const draft = frameDraftRef.current;
      if (!draft) {
        return;
      }

      const pageLayout = workspaceLayout.pages.find((page) => page.id === draft.pageId) ?? null;
      if (!pageLayout) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const committedFrame = buildCommittedFrame({
        toolId: draft.toolId,
        start: draft.start,
        current: draft.current,
        pageLayout,
        workspaceSettings,
        allowDefaultSize,
      });

      if (!committedFrame) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const result = insertCanvasToolPayload({
        pageId: draft.pageId,
        frame: committedFrame,
        source: {
          type: "canvas-tool",
          payload: {
            toolId: draft.toolId,
            frame: committedFrame,
            anchor: draft.start,
          },
        },
      });

      if (result.inserted) {
        setSelectedElementIds([result.elementId]);
        setActiveCanvasTool("pointer");
      } else {
        console.warn("[editor] unsupported canvas tool payload", result.sourceType, result.reason);
      }

      clearCanvasInteractions(target, pointerId);
    },
    [clearCanvasInteractions, insertCanvasToolPayload, setActiveCanvasTool, setSelectedElementIds, workspaceLayout.pages, workspaceSettings],
  );

  const commitPointDraft = useCallback(
    (target?: HTMLDivElement | null, pointerId?: number) => {
      const draft = pointDraftRef.current;
      if (!draft) {
        return;
      }

      const minimumPoints = draft.toolId === "polygon" ? 3 : 2;
      if (draft.points.length < minimumPoints) {
        return;
      }

      const pageLayout = workspaceLayout.pages.find((page) => page.id === draft.pageId) ?? null;
      if (!pageLayout) {
        clearCanvasInteractions(target, pointerId);
        return;
      }

      const flatPoints = draft.points.flatMap((point) => [point.x, point.y]);
      const frame = snapWorkspaceFrame(boundsFromPoints(flatPoints), pageLayout, workspaceSettings);
      const result = insertCanvasToolPayload({
        pageId: draft.pageId,
        frame,
        source: {
          type: "canvas-tool",
          payload: {
            toolId: draft.toolId,
            frame,
            anchor: draft.points[0],
            points: flatPoints,
          },
        },
      });

      if (result.inserted) {
        setSelectedElementIds([result.elementId]);
        setActiveCanvasTool("pointer");
      } else {
        console.warn("[editor] unsupported canvas tool payload", result.sourceType, result.reason);
      }

      clearCanvasInteractions(target, pointerId);
    },
    [clearCanvasInteractions, insertCanvasToolPayload, setActiveCanvasTool, setSelectedElementIds, workspaceLayout.pages, workspaceSettings],
  );

  useEffect(
    () => () => {
      clearCanvasInteractions();
    },
    [clearCanvasInteractions],
  );

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isTypingTarget =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.isContentEditable === true;

      if (isTypingTarget) {
        return;
      }

      const hasActiveDraft = Boolean(frameDraftRef.current || arcDraftRef.current || lineDraftRef.current || pointDraftRef.current || panDraftRef.current);
      if (event.key === "Escape") {
        if (hasActiveDraft) {
          clearCanvasInteractions();
          return;
        }

        if (selectedElementIds.length > 0) {
          setSelectedElementIds([]);
        }
      }

      if (event.key === "Enter" && pointDraftRef.current) {
        event.preventDefault();
        commitPointDraft();
        return;
      }

      if (event.key === "Enter" && arcDraftRef.current) {
        event.preventDefault();
        commitArcDraft();
        return;
      }

      if (event.key === "Backspace" && pointDraftRef.current) {
        event.preventDefault();
        const draft = pointDraftRef.current;
        if (!draft) {
          return;
        }

        if (draft.points.length > 0) {
          draft.points = draft.points.slice(0, -1);
        }

        if (draft.points.length === 0) {
          clearCanvasInteractions();
          return;
        }

        const pageLayout = workspaceLayout.pages.find((page) => page.id === draft.pageId) ?? null;
        if (!pageLayout) {
          clearCanvasInteractions();
          return;
        }

        setDraftCanvasCreation({
          toolId: draft.toolId,
          pageId: draft.pageId,
          start: draft.points[0],
          current: draft.current,
          points: draft.points,
          frame: buildPointDraftFrame(draft.points, draft.current),
        });
        return;
      }

      if (event.key === "Backspace" && arcDraftRef.current) {
        event.preventDefault();
        const draft = arcDraftRef.current;
        if (!draft) {
          return;
        }

        if (draft.points.length > 0) {
          draft.points = draft.points.slice(0, -1);
        }

        if (draft.points.length === 0) {
          clearCanvasInteractions();
          return;
        }

        setDraftCanvasCreation({
          toolId: draft.toolId,
          pageId: draft.pageId,
          start: draft.points[0],
          current: draft.current,
          points: draft.points,
          frame: resolveArcGeometryDraft(draft.toolId, draft.points, null, draft.current)?.frame ?? makeDraftFrame(draft.points[0], draft.current),
        });
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedElementIds.length > 0) {
        event.preventDefault();
        const result = deleteCanvasElements({
          elementIds: selectedElementIds,
        });

        if (!result.deleted) {
          console.warn("[editor] delete rejected", result.reason);
        }
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [clearCanvasInteractions, commitArcDraft, commitPointDraft, deleteCanvasElements, selectedElementIds, setSelectedElementIds, workspaceLayout.pages]);

  useEffect(() => {
    const activeFrameDraft = frameDraftRef.current;
    const activeArcDraft = arcDraftRef.current;
    const activeLineDraft = lineDraftRef.current;
    const activePointDraft = pointDraftRef.current;
    const activePanDraft = panDraftRef.current;

    if (activeFrameDraft && activeFrameDraft.toolId !== activeCanvasTool) {
      clearCanvasInteractions();
      return;
    }

    if (activeArcDraft && activeArcDraft.toolId !== activeCanvasTool) {
      clearCanvasInteractions();
      return;
    }

    if (activeLineDraft && activeLineDraft.toolId !== activeCanvasTool) {
      clearCanvasInteractions();
      return;
    }

    if (activePointDraft && activePointDraft.toolId !== activeCanvasTool) {
      clearCanvasInteractions();
      return;
    }

    if (activePanDraft && activeCanvasTool !== "hand") {
      clearCanvasInteractions();
    }
  }, [activeCanvasTool, clearCanvasInteractions, draftCanvasCreation]);

  const handleWorkspaceDragEnter = (event: DragEvent<HTMLDivElement>) => {
    const supported = isSupportedCanvasDrop(event, useEditorStore.getState().dragTraceContext);
    if (!supported) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropActive(true);
  };

  const handleWorkspaceDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer.types).includes("application/x-resume-editor-item")) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDropActive(false);
    }
  };

  const handleWorkspaceDragOver = (event: DragEvent<HTMLDivElement>) => {
    const dragContext = useEditorStore.getState().dragTraceContext;
    if (!isSupportedCanvasDrop(event, dragContext) || !activePage) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    void dragContext;
  };

  const handleWorkspaceDrop = (event: DragEvent<HTMLDivElement>) => {
    const dragContext = useEditorStore.getState().dragTraceContext;
    const supported = isSupportedCanvasDrop(event, dragContext);
    if (!supported || !activePage) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDropActive(false);

    const payload = resolveCanvasDropPayload(event, dragContext);
    if (!payload) {
      return;
    }

    const workspacePoint = resolveWorkspacePointer(event, viewport, stageRef.current);
    if (!workspacePoint) {
      return;
    }

    const targetPage = findWorkspacePageAtPoint(workspaceLayout, workspacePoint, activePage.id);
    if (!targetPage) {
      return;
    }

    const point = snapWorkspacePoint(convertWorkspacePointToPagePoint(workspacePoint, targetPage), targetPage, workspaceSettings);
    const result = insertCanvasDropPayload({
      pageId: targetPage.id,
      point,
      source: payload,
    });

    if (!result.inserted) {
      console.warn("[editor] unsupported canvas drop payload", result.sourceType, result.reason);
      return;
    }

  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const toolId = activeCanvasTool;
    if (toolId === "hand") {
      const startViewport = { panX: viewport.panX, panY: viewport.panY };
      event.currentTarget.setPointerCapture(event.pointerId);
      panDraftRef.current = {
        pointerId: event.pointerId,
        startClient: { x: event.clientX, y: event.clientY },
        startViewport,
      };
      return;
    }

    if (toolId === "import") {
      return;
    }

    if (!isCanvasToolCreationMode(toolId)) {
      return;
    }

    const workspacePoint = resolveWorkspacePointer(event, viewport, stageRef.current ?? event.currentTarget);
    if (!workspacePoint) {
      return;
    }

    const targetPage = findWorkspacePageAtPoint(workspaceLayout, workspacePoint, activePage?.id ?? null);
    if (!targetPage) {
      return;
    }

    const pagePoint = snapWorkspacePoint(convertWorkspacePointToPagePoint(workspacePoint, targetPage), targetPage, workspaceSettings);

    if (isArcToolId(toolId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      const draft = arcDraftRef.current;
      if (draft && draft.toolId === toolId && draft.pageId === targetPage.id) {
        draft.points = [...draft.points, pagePoint];
        draft.current = pagePoint;
        const geometry = resolveArcGeometryDraft(toolId, draft.points, null, pagePoint);
        setDraftCanvasCreation({
          toolId,
          pageId: targetPage.id,
          start: draft.points[0],
          current: pagePoint,
          points: draft.points,
          frame: geometry?.frame ?? makeDraftFrame(draft.points[0], pagePoint),
        });

        if (draft.points.length >= 3) {
          commitArcDraft(event.currentTarget, event.pointerId);
        }
        return;
      }

      arcDraftRef.current = {
        pointerId: event.pointerId,
        toolId,
        pageId: targetPage.id,
        points: [pagePoint],
        current: pagePoint,
      };
      setDraftCanvasCreation({
        toolId,
        pageId: targetPage.id,
        start: pagePoint,
        current: pagePoint,
        points: [pagePoint],
        frame: makeDraftFrame(pagePoint, pagePoint),
      });
      return;
    }

    if (isLineCanvasTool(toolId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      const draft = lineDraftRef.current;
      if (draft && draft.toolId === toolId && draft.pageId === targetPage.id) {
        draft.current = pagePoint;
        setDraftCanvasCreation({
          toolId,
          pageId: targetPage.id,
          start: draft.start,
          current: pagePoint,
          frame: buildLineDraftFrame(draft.start, pagePoint, targetPage, workspaceSettings),
        });
        commitLineDraft(event.currentTarget, event.pointerId);
        return;
      }

      lineDraftRef.current = {
        pointerId: event.pointerId,
        toolId,
        pageId: targetPage.id,
        start: pagePoint,
        current: pagePoint,
      };
      setDraftCanvasCreation({
        toolId,
        pageId: targetPage.id,
        start: pagePoint,
        current: pagePoint,
        frame: buildLineDraftFrame(pagePoint, pagePoint, targetPage, workspaceSettings),
      });
      return;
    }

    if (isPointCanvasTool(toolId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      const draft = pointDraftRef.current;
      if (draft && draft.toolId === toolId && draft.pageId === targetPage.id) {
        draft.points = [...draft.points, pagePoint];
        draft.current = pagePoint;
        setDraftCanvasCreation({
          toolId,
          pageId: targetPage.id,
          start: draft.points[0],
          current: pagePoint,
          points: draft.points,
          frame: buildPointDraftFrame(draft.points, pagePoint),
        });
        return;
      }

      pointDraftRef.current = {
        pointerId: event.pointerId,
        toolId,
        pageId: targetPage.id,
        points: [pagePoint],
        current: pagePoint,
      };
      setDraftCanvasCreation({
        toolId,
        pageId: targetPage.id,
        start: pagePoint,
        current: pagePoint,
        points: [pagePoint],
        frame: buildPointDraftFrame([pagePoint], pagePoint),
      });
      return;
    }

    if (!isFrameCanvasTool(toolId)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
      frameDraftRef.current = {
        pointerId: event.pointerId,
        toolId,
        pageId: targetPage.id,
        start: pagePoint,
        current: pagePoint,
      };
      setDraftCanvasCreation({
        toolId,
        pageId: targetPage.id,
        start: pagePoint,
        current: pagePoint,
        frame: makeDraftFrame(pagePoint, pagePoint),
      });
    };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const panDraft = panDraftRef.current;
    if (panDraft) {
      const deltaX = event.clientX - panDraft.startClient.x;
      const deltaY = event.clientY - panDraft.startClient.y;
      setViewportPan({
        panX: panDraft.startViewport.panX + deltaX,
        panY: panDraft.startViewport.panY + deltaY,
      });
      return;
    }

    const arcDraft = arcDraftRef.current;
    const frameDraft = frameDraftRef.current;
    const lineDraft = lineDraftRef.current;
    const pointDraft = pointDraftRef.current;
    if (!arcDraft && !frameDraft && !lineDraft && !pointDraft) {
      return;
    }

    const workspacePoint = resolveWorkspacePointer(event, viewport, stageRef.current ?? event.currentTarget);
    if (!workspacePoint) {
      return;
    }

    const activeDraft = arcDraft ?? frameDraft ?? lineDraft ?? pointDraft;
    const pageLayout = workspaceLayout.pages.find((page) => page.id === activeDraft?.pageId) ?? null;
    if (!pageLayout) {
      return;
    }

    const point = snapWorkspacePoint(convertWorkspacePointToPagePoint(workspacePoint, pageLayout), pageLayout, workspaceSettings);

    if (arcDraft) {
      arcDraft.current = point;
      const geometry = resolveArcGeometryDraft(arcDraft.toolId, arcDraft.points, null, point);
      setDraftCanvasCreation({
        toolId: arcDraft.toolId,
        pageId: arcDraft.pageId,
        start: arcDraft.points[0],
        current: point,
        points: arcDraft.points,
        frame: geometry?.frame ?? makeDraftFrame(arcDraft.points[0], point),
      });
      return;
    }

    if (frameDraft) {
      frameDraft.current = point;
      setDraftCanvasCreation({
        toolId: frameDraft.toolId,
        pageId: frameDraft.pageId,
        start: frameDraft.start,
        current: point,
        frame: makeDraftFrame(frameDraft.start, point),
      });
      return;
    }

    if (lineDraft) {
      lineDraft.current = point;
      setDraftCanvasCreation({
        toolId: lineDraft.toolId,
        pageId: lineDraft.pageId,
        start: lineDraft.start,
        current: point,
        frame: buildLineDraftFrame(lineDraft.start, point, pageLayout, workspaceSettings),
      });
      return;
    }

    if (pointDraft) {
      pointDraft.current = point;
      setDraftCanvasCreation({
        toolId: pointDraft.toolId,
        pageId: pointDraft.pageId,
        start: pointDraft.points[0],
        current: point,
        points: pointDraft.points,
        frame: buildPointDraftFrame(pointDraft.points, point),
      });
    }
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const panDraft = panDraftRef.current;
    if (panDraft && panDraft.pointerId === event.pointerId) {
      clearCanvasInteractions(event.currentTarget, event.pointerId);
      return;
    }

    const arcDraft = arcDraftRef.current;
    if (arcDraft && arcDraft.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    const pointDraft = pointDraftRef.current;
    if (pointDraft && pointDraft.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    const lineDraft = lineDraftRef.current;
    if (lineDraft && lineDraft.pointerId === event.pointerId) {
      return;
    }

    const frameDraft = frameDraftRef.current;
    if (!frameDraft || frameDraft.pointerId !== event.pointerId) {
      return;
    }

    if (frameDraft.toolId === "richtext" || frameDraft.toolId === "table") {
      commitFrameDraft(event.currentTarget, event.pointerId, true);
      return;
    }

    const pageLayout = workspaceLayout.pages.find((page) => page.id === frameDraft.pageId) ?? null;
    if (!pageLayout) {
      clearCanvasInteractions(event.currentTarget, event.pointerId);
      return;
    }

    const workspacePoint = resolveWorkspacePointer(event, viewport, stageRef.current ?? event.currentTarget);
    const point = workspacePoint ? snapWorkspacePoint(convertWorkspacePointToPagePoint(workspacePoint, pageLayout), pageLayout, workspaceSettings) : frameDraft.start;
    frameDraft.current = point;
    const frame = snapWorkspaceFrame(makeDraftFrame(frameDraft.start, point), pageLayout, workspaceSettings);
    if (Math.max(frame.width, frame.height) < 8) {
      clearCanvasInteractions(event.currentTarget, event.pointerId);
      return;
    }

    commitFrameDraft(event.currentTarget, event.pointerId);
  };

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pointDraftRef.current || activeCanvasTool === "hand" || activeCanvasTool === "import") {
      return;
    }

    commitPointDraft(event.currentTarget, pointDraftRef.current.pointerId);
  };

  const handleCanvasPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    clearCanvasInteractions(event.currentTarget, event.pointerId);
  };

  const openImagePicker = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0] ?? null;
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        console.warn("[editor] unsupported image file type", file.type || file.name);
        return;
      }

      const pageLayout = workspaceLayout.pages.find((page) => page.id === activePage?.id) ?? workspaceLayout.pages[0] ?? null;
      if (!pageLayout) {
        console.warn("[editor] no active page available for image insertion");
        return;
      }

      try {
        const src = await readFileAsDataUrl(file);
        const naturalSize = await readImageNaturalSize(src);
        const point = snapWorkspacePoint(
          {
            x: pageLayout.width / 2,
            y: pageLayout.height / 2,
          },
          pageLayout,
          workspaceSettings,
        );

        const result = insertCanvasDropPayload({
          pageId: pageLayout.id,
          point,
          source: {
            type: "image",
            payload: {
              src,
              name: file.name,
              alt: file.name,
              width: naturalSize.width,
              height: naturalSize.height,
            },
          },
        });

        if (!result.inserted) {
          console.warn("[editor] image insertion rejected", result.sourceType, result.reason);
        } else {
          setActiveCanvasTool("pointer");
        }
      } catch (error) {
        console.warn("[editor] unable to read selected image", error);
      }
    },
    [activePage?.id, insertCanvasDropPayload, setActiveCanvasTool, workspaceLayout.pages, workspaceSettings],
  );

  return (
    <section
      className="ef-canvas-shell"
      ref={shellRef}
      style={
        {
          position: "relative",
          "--editor-page-w": `${workspaceLayout.width}px`,
          "--editor-page-h": `${workspaceLayout.height}px`,
        } as CSSProperties
      }
      onDragEnterCapture={handleWorkspaceDragEnter}
      onDragLeaveCapture={handleWorkspaceDragLeave}
      onDragOverCapture={handleWorkspaceDragOver}
      onDropCapture={handleWorkspaceDrop}
    >
      <div className="ef-pagebar">
        <div className="ef-pagebar-left">
          {workingTemplate.pages.map((page) => (
            <button
              key={page.id}
              className={["ef-page-tab", page.id === activePageId ? "is-active" : ""].join(" ")}
              onClick={() => setActivePageId(page.id)}
            >
              {page.name}
            </button>
          ))}
          <span className="ef-page-divider" />
          <button className="ef-page-add ef-value-field" title="Ajouter une page">
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="ef-pagebar-tools">
          <TogglePill icon={Ruler} label="Regles" active={workspaceSettings.rulersVisible} onClick={() => setWorkspaceSettings({ rulersVisible: !workspaceSettings.rulersVisible })} />
          <TogglePill icon={Eye} label="Marges" active={workspaceSettings.marginsVisible} onClick={() => setWorkspaceSettings({ marginsVisible: !workspaceSettings.marginsVisible })} />
          <TogglePill icon={Magnet} label="Magnetisme" active={workspaceSettings.snapEnabled} onClick={() => setWorkspaceSettings({ snapEnabled: !workspaceSettings.snapEnabled })} />
          <span className="ef-toggle-pill is-active">Page {activePageIndex >= 0 ? activePageIndex + 1 : 1} / {workingTemplate.pages.length}</span>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      <div className="ef-canvas-scroll">
        <div className="ef-ruler-grid">
          <RulerCorner />
          <HorizontalRuler ticks={horizontalTicks} zoom={viewport.zoom} visible={workspaceSettings.rulersVisible} />
          <VerticalRuler ticks={verticalTicks} zoom={viewport.zoom} visible={workspaceSettings.rulersVisible} />
          <div
            className={["ef-canvas-stage", isDropActive ? "is-drop-active" : "", isArcPointTool ? "is-pencil-tool" : ""].join(" ")}
            ref={stageRef}
            style={{ width: `${workspaceLayout.width}px`, height: `${workspaceLayout.height}px` }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerCancel}
            onDoubleClick={handleCanvasDoubleClick}
          >
            <EditorRenderTreePreview
              draftCanvasCreation={draftCanvasCreation}
              workspaceLayout={workspaceLayout}
              viewport={viewport}
              workspaceSettings={workspaceSettings}
            />
          </div>
        </div>
      </div>
      <div className="ef-tool-palette-layer">
        <CanvasFloatingPalette
          boundaryRef={shellRef}
          onImportImage={openImagePicker}
        />
      </div>

      <div className="ef-canvas-footer">
        <button className="ef-adjust-button">
          <Settings2 size={13} aria-hidden="true" />
          Ajuster
          <ChevronDown size={12} aria-hidden="true" />
        </button>
        <div className="ef-footer-toggles">
          <CheckboxPill label="Afficher les marges" active={workspaceSettings.marginsVisible} onClick={() => setWorkspaceSettings({ marginsVisible: !workspaceSettings.marginsVisible })} />
          <CheckboxPill label="Magnétisme" active={workspaceSettings.snapEnabled} onClick={() => setWorkspaceSettings({ snapEnabled: !workspaceSettings.snapEnabled })} />
        </div>
        <button className="ef-format-button">
          {activePage ? `${activePage.width} x ${activePage.height} px` : "Format"} <ChevronDown size={12} aria-hidden="true" />
        </button>
        <span className="ef-footer-page">Page {activePageIndex >= 0 ? activePageIndex + 1 : 1} / {workingTemplate.pages.length}</span>
      </div>
    </section>
  );
}

function RulerCorner() {
  return (
    <div className="ef-ruler-corner">
      <span className="ef-ruler-corner-dot" />
    </div>
  );
}

function HorizontalRuler({ ticks, zoom, visible }: { ticks: RulerTick[]; zoom: number; visible: boolean }) {
  return (
    <div className="ef-ruler-h" style={{ visibility: visible ? "visible" : "hidden" }}>
      {ticks.map((tick) => (
        <span key={`h-tick-${tick.position}`} className="ef-ruler-tick-h" style={{ left: tick.position * zoom, height: tick.isMajor ? 11 : 6 }} />
      ))}
      {ticks.filter((tick) => tick.label).map((tick) => (
        <span key={`h-label-${tick.position}`} className="ef-ruler-label-h" style={{ left: tick.position * zoom }}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

function VerticalRuler({ ticks, zoom, visible }: { ticks: RulerTick[]; zoom: number; visible: boolean }) {
  return (
    <div className="ef-ruler-v" style={{ visibility: visible ? "visible" : "hidden" }}>
      {ticks.map((tick) => (
        <span key={`v-tick-${tick.position}`} className="ef-ruler-tick-v" style={{ top: tick.position * zoom, width: tick.isMajor ? 11 : 6 }} />
      ))}
      {ticks.filter((tick) => tick.label).map((tick) => (
        <span key={`v-label-${tick.position}`} className="ef-ruler-label-v" style={{ top: tick.position * zoom }}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

function CanvasFloatingPalette({
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
  const activeToolId = useEditorStore((state) => state.activeCanvasTool);
  const setActiveToolId = useEditorStore((state) => state.setActiveCanvasTool);

  const activeTool = useMemo(
    () => {
      const tools = floatingPaletteGroups.flatMap((group) => group.items);
      if (isArcToolId(activeToolId)) {
        return tools.find((tool) => tool.id === "arc") ?? tools[0];
      }

      return tools.find((tool) => tool.id === activeToolId) ?? tools[0];
    },
    [activeToolId],
  );

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

  const renderTool = (tool: PaletteTool) => {
    const Icon = tool.icon;
    const isActive = tool.id === activeToolId || (tool.id === "arc" && isArcToolId(activeToolId));
    return (
      <button
        key={tool.id}
        className={["ef-tool-row", isActive ? "is-active" : ""].join(" ")}
        type="button"
        title={tool.label}
        aria-label={tool.label}
        aria-pressed={isActive}
        onClick={() => {
          if (tool.id === "arc") {
            setArcOpen((value) => !value);
            setFormsOpen(false);
            return;
          } else {
            setActiveToolId(tool.id);
            setFormsOpen(tool.menu ? (value) => !value : false);
            setArcOpen(false);
          }
          if (tool.id === "import") {
            onImportImage();
          }
        }}
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
    <div
      ref={paletteRef}
      className={["ef-tool-palette", orientation === "vertical" ? "is-vertical" : "is-horizontal"].join(" ")}
      style={{ left: position.left, top: position.top }}
    >
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
                {group.items.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = tool.id === activeToolId || (tool.id === "arc" && isArcToolId(activeToolId));
                  return (
                    <button
                      key={tool.id}
                      className={["ef-tool-icon-button", isActive ? "is-active" : ""].join(" ")}
                      type="button"
                      title={tool.label}
                      aria-label={tool.label}
                      aria-pressed={isActive}
                      onClick={() => {
                        if (tool.id === "arc") {
                          setArcOpen((value) => !value);
                          setFormsOpen(false);
                          return;
                        } else {
                          setActiveToolId(tool.id);
                          setFormsOpen(tool.menu ? (value) => !value : false);
                          setArcOpen(false);
                        }
                        if (tool.id === "import") {
                          onImportImage();
                        }
                      }}
                    >
                      <Icon size={16} strokeWidth={1.8} aria-hidden={true} />
                    </button>
                  );
                })}
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

      {formsOpen ? <ShapePopover onClose={() => setFormsOpen(false)} /> : null}
      {arcOpen ? (
        <ArcPopover
          activeToolId={activeToolId}
          onClose={() => setArcOpen(false)}
          onSelect={(toolId) => {
            setActiveToolId(toolId);
            setArcOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ShapePopover({ onClose }: { onClose: () => void }) {
  return (
    <div className="ef-shape-popover" role="dialog" aria-label="Palette de formes">
      <div className="ef-shape-popover-header">
        <span>Formes</span>
        <button className="ef-shape-popover-close" type="button" aria-label="Fermer" title="Fermer" onClick={onClose}>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="ef-shape-popover-subtitle">Formes de base, flèches et symboles</div>
      {floatingShapeGroups.map((group) => (
        <div key={group.title} className="ef-shape-popover-group">
          <div className="ef-shape-popover-group-title">{group.title}</div>
          <div className="ef-shape-grid">
            {group.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={["ef-shape-item", index === 0 ? "is-accent" : ""].join(" ")} type="button" title={item.label} aria-label={item.label}>
                    <Icon size={16} strokeWidth={1.8} aria-hidden={true} />
                  </button>
                );
            })}
          </div>
        </div>
      ))}
      <div className="ef-shape-popover-footer">Plus de formes...</div>
    </div>
  );
}

function ArcPopover({
  activeToolId,
  onClose,
  onSelect,
}: {
  activeToolId: CanvasToolId;
  onClose: () => void;
  onSelect: (variant: "arc" | "pie" | "arc2point" | "arc3point") => void;
}) {
  const variants: Array<{ id: "arc" | "pie" | "arc2point" | "arc3point"; label: string; description: string }> = [
    { id: "arc", label: "Arc", description: "1er clic: centre, 2e: rayon, 3e: fin" },
    { id: "pie", label: "Pie", description: "Même geste, secteur fermé" },
    { id: "arc2point", label: "Arc 2 points", description: "1er: extrémité, 2e: extrémité, 3e: bulge" },
    { id: "arc3point", label: "Arc 3 points", description: "1er: départ, 2e: pivot, 3e: fin" },
  ];

  return (
    <div className="ef-shape-popover" role="dialog" aria-label="Outils d'arc">
      <div className="ef-shape-popover-header">
        <span>Arc</span>
        <button className="ef-shape-popover-close" type="button" aria-label="Fermer" title="Fermer" onClick={onClose}>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="ef-shape-popover-subtitle">Choisir le mode de dessin</div>
      <div className="ef-shape-grid">
        {variants.map((variant) => (
          <button
            key={variant.id}
            className={["ef-shape-item", activeToolId === variant.id ? "is-accent" : ""].join(" ")}
            type="button"
            title={variant.label}
            aria-label={variant.label}
            onClick={() => onSelect(variant.id)}
          >
            <ArcModeIcon toolId={variant.id} />
          </button>
        ))}
      </div>
      <div className="ef-shape-popover-footer">Les autres réglages se feront dans l’inspecteur.</div>
    </div>
  );
}

function ArcModeIcon({ toolId, ...props }: PaletteIconProps & { toolId: "arc" | "pie" | "arc2point" | "arc3point" }) {
  const common = (
    <>
      <circle cx="6" cy="6" r="1.2" fill="#ef4444" stroke="none" />
      <circle cx="18" cy="18" r="1.2" fill="#ef4444" stroke="none" />
    </>
  );

  return (
    <PaletteSvg {...props}>
      {common}
      {toolId === "arc" ? <path d="M6 15.5A7.5 7.5 0 0 1 15.5 6" /> : null}
      {toolId === "pie" ? (
        <>
          <path d="M6 6 L14 9 A7.5 7.5 0 0 1 18 18 Z" />
        </>
      ) : null}
      {toolId === "arc2point" ? <path d="M6 16c4-8 8-9 12-4" /> : null}
      {toolId === "arc3point" ? <path d="M6 16c3-8 7-7 12-10" /> : null}
    </PaletteSvg>
  );
}

function TogglePill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: true }>;
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

function CheckboxPill({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button className={["ef-checkbox-pill", active ? "is-active" : ""].join(" ")} type="button" onClick={onClick}>
      <span className="ef-checkbox-icon">
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

function isSupportedCanvasDrop(
  event: DragEvent<HTMLDivElement>,
  fallbackContext: { type: string; sourcePanel?: string; payload: unknown } | null,
) {
  const payload = resolveCanvasDropPayload(event, fallbackContext);
  return payload ? CANVAS_INSERTABLE_TYPES.has(payload.type) : false;
}

function resolveCanvasDropPayload(
  event: {
    dataTransfer?: {
      getData: (format: string) => string;
    } | null;
  },
  fallbackContext: { type: string; sourcePanel?: string; payload: unknown } | null,
): { type: string; payload: unknown; sourcePanel?: string } | null {
  const raw = event.dataTransfer?.getData("application/x-resume-editor-item") ?? "";
  const parsed = parseCanvasDropPayload(raw);
  if (parsed) {
    return parsed;
  }

  if (fallbackContext) {
    return {
      type: fallbackContext.type,
      payload: fallbackContext.payload,
      sourcePanel: fallbackContext.sourcePanel,
    };
  }

  return null;
}

function parseCanvasDropPayload(raw: string): { type: string; payload: unknown; sourcePanel?: string } | null {
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { type?: unknown; payload?: unknown; sourcePanel?: unknown };
    if (typeof parsed.type !== "string") {
      return null;
    }

    return {
      type: parsed.type,
      payload: parsed.payload,
      sourcePanel: typeof parsed.sourcePanel === "string" ? parsed.sourcePanel : undefined,
    };
  } catch {
    return null;
  }
}

function resolveWorkspacePointer(
  event: {
    clientX: number;
    clientY: number;
    currentTarget: {
      getBoundingClientRect: () => DOMRect;
    };
  },
  viewport: WorkspaceViewport,
  targetElement?: { getBoundingClientRect: () => DOMRect } | null,
) {
  const rect = targetElement?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
  const workspacePoint = convertClientPointToWorkspacePoint({ x: event.clientX, y: event.clientY }, rect, viewport);

  if (!Number.isFinite(workspacePoint.x) || !Number.isFinite(workspacePoint.y)) {
    return null;
  }

  return workspacePoint;
}

function makeDraftFrame(start: { x: number; y: number }, current: { x: number; y: number }) {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.max(Math.abs(current.x - start.x), 1);
  const height = Math.max(Math.abs(current.y - start.y), 1);
  return { x, y, width, height };
}

function buildPointDraftFrame(points: { x: number; y: number }[], current: { x: number; y: number }) {
  return boundsFromPoints([...points.flatMap((point) => [point.x, point.y]), current.x, current.y]);
}

function boundsFromPoints(flatPoints: number[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index < flatPoints.length; index += 2) {
    const x = flatPoints[index];
    const y = flatPoints[index + 1];
    if (typeof x !== "number" || typeof y !== "number") {
      continue;
    }
    xs.push(x);
    ys.push(y);
  }

  if (xs.length === 0 || ys.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function buildCommittedFrame(input: {
  toolId: CanvasToolId;
  start: { x: number; y: number };
  current: { x: number; y: number };
  pageLayout: WorkspacePageLayout;
  workspaceSettings: EditorWorkspaceSettings;
  allowDefaultSize?: boolean;
}) {
  const draftFrame = snapWorkspaceFrame(makeDraftFrame(input.start, input.current), input.pageLayout, input.workspaceSettings);

  if (input.allowDefaultSize && Math.max(draftFrame.width, draftFrame.height) < 8) {
    return buildDefaultToolFrame(input.toolId, input.start, input.pageLayout, input.workspaceSettings);
  }

  if (!input.allowDefaultSize && Math.max(draftFrame.width, draftFrame.height) < 8) {
    return null;
  }

  return draftFrame;
}

function buildDefaultToolFrame(
  toolId: CanvasToolId,
  point: { x: number; y: number },
  pageLayout: WorkspacePageLayout,
  workspaceSettings: EditorWorkspaceSettings,
) {
  const defaultSize = isLargeTextTool(toolId)
    ? { width: 240, height: toolId === "table" ? 160 : 110 }
    : { width: 180, height: 120 };

  const x = point.x - defaultSize.width / 2;
  const y = point.y - defaultSize.height / 2;
  const frame = snapWorkspaceFrame({ x, y, width: defaultSize.width, height: defaultSize.height }, pageLayout, workspaceSettings);
  return frame;
}

function isLargeTextTool(toolId: CanvasToolId) {
  return toolId === "richtext" || toolId === "table";
}

function isFrameCanvasTool(toolId: CanvasToolId) {
  return toolId === "rectangle" || toolId === "circle" || isLargeTextTool(toolId);
}

function isPointCanvasTool(toolId: CanvasToolId) {
  return toolId === "polygon" || toolId === "freehand" || toolId === "curves" || toolId === "segments";
}

function isLineCanvasTool(toolId: CanvasToolId) {
  return toolId === "arrows";
}

function buildLineDraftFrame(
  start: { x: number; y: number },
  current: { x: number; y: number },
  pageLayout: WorkspacePageLayout,
  workspaceSettings: EditorWorkspaceSettings,
) {
  return snapWorkspaceFrame(makeDraftFrame(start, current), pageLayout, workspaceSettings);
}

function buildLineDraftPoints(
  start: { x: number; y: number },
  current: { x: number; y: number },
  frame: { x: number; y: number; width: number; height: number },
) {
  return [
    start.x - frame.x,
    start.y - frame.y,
    current.x - frame.x,
    current.y - frame.y,
  ];
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

function isCanvasToolCreationMode(toolId: CanvasToolId) {
  return isArcToolId(toolId) || isFrameCanvasTool(toolId) || isLineCanvasTool(toolId) || isPointCanvasTool(toolId);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("lecture_image_invalide"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("lecture_image_invalide"));
    reader.readAsDataURL(file);
  });
}

function readImageNaturalSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({
        width: Math.max(image.naturalWidth || image.width || 1, 1),
        height: Math.max(image.naturalHeight || image.height || 1, 1),
      });
    };
    image.onerror = () => reject(new Error("lecture_image_invalide"));
    image.src = src;
  });
}

const CANVAS_INSERTABLE_TYPES = new Set(["variable", "image", "shape", "icon", "emoji", "text-block", "preset", "dynamic-preset"]);
