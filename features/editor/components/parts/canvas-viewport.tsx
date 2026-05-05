"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, ReactNode } from "react";
import { ChevronDown, Eye, Magnet, Plus, Ruler, Settings2 } from "lucide-react";

import { isCanvasShortcutEditableTarget, resolveCanvasShortcutAction } from "@/features/editor/components/parts/canvas-shortcuts";
import {
  CanvasFloatingPalette,
  CanvasNavigationPalette,
  CheckboxPill,
  HorizontalRuler,
  RulerCorner,
  TogglePill,
  VerticalRuler,
} from "@/features/editor/components/parts/canvas-viewport-palettes";
import { EditorRenderTreePreview } from "@/features/editor/renderers/editor-render-tree-preview";
import {
  isArcToolId,
  resolveArcGeometryDraft,
  type CanvasToolDraft,
  type CanvasToolId,
} from "@/features/editor/schema/canvas-insertion";
import {
  resolveCanvasObjectStyleCapabilities,
  isCanvasObjectStyleSupportedElement,
  resolveCanvasObjectStylePreview,
} from "@/features/editor/schema/canvas-mutation";
import {
  buildActiveWorkspaceLayout,
  convertClientPointToWorkspacePoint,
  convertWorkspacePointToPagePoint,
  findWorkspacePageAtPoint,
  findWorkspacePageAtPointStrict,
  resolveEffectiveRulerMode,
  resolveWorkspaceRulerTicks,
  snapWorkspaceFrame,
  snapWorkspacePoint,
  type EditorWorkspaceSettings,
  type RulerTick,
  type WorkspacePageLayout,
  type WorkspaceViewport,
} from "@/features/editor/schema/workspace-layout";
import { buildVariableDragOperationLog } from "@/features/data-mapping/lib/variable-display";
import { insertVariableTokenIntoRichTextHtml } from "@/features/editor/renderers/konva-renderer/rich-text-drop-utils";
import { EDITOR_VIEWPORT_MAX_ZOOM, EDITOR_VIEWPORT_MIN_ZOOM, useEditorStore } from "@/features/editor/stores/editor-store";

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
  const dragTraceContext = useEditorStore((state) => state.dragTraceContext);
  const workspaceSettings = useEditorStore((state) => state.workspaceSettings);
  const setWorkspaceSettings = useEditorStore((state) => state.setWorkspaceSettings);
  const viewport = useEditorStore((state) => state.viewport);
  const setZoom = useEditorStore((state) => state.setZoom);
  const setViewportPan = useEditorStore((state) => state.setViewportPan);
  const addTemplatePage = useEditorStore((state) => state.addTemplatePage);
  const insertCanvasDropPayload = useEditorStore((state) => state.insertCanvasDropPayload);
  const updateRichTextElementContent = useEditorStore((state) => state.updateRichTextElementContent);
  const appendOperationLogs = useEditorStore((state) => state.appendOperationLogs);
  const clearDragTraceContext = useEditorStore((state) => state.clearDragTraceContext);
  const insertCanvasToolPayload = useEditorStore((state) => state.insertCanvasToolPayload);
  const deleteCanvasElements = useEditorStore((state) => state.deleteCanvasElements);
  const copyCanvasElements = useEditorStore((state) => state.copyCanvasElements);
  const pasteCanvasElements = useEditorStore((state) => state.pasteCanvasElements);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const setSelectedElementIds = useEditorStore((state) => state.setSelectedElementIds);
  const activePage = useMemo(() => workingTemplate.pages.find((page) => page.id === activePageId) ?? workingTemplate.pages[0] ?? null, [activePageId, workingTemplate.pages]);
  const activePageIndex = useMemo(() => workingTemplate.pages.findIndex((page) => page.id === activePageId), [activePageId, workingTemplate.pages]);
  const isArcPointTool = activeCanvasTool === "arc2point" || activeCanvasTool === "arc3point";
  const workspaceLayout = useMemo(
    () =>
      buildActiveWorkspaceLayout(
        workingTemplate.pages.map((page) => ({
          id: page.id,
          name: page.name,
          width: page.width,
          height: page.height,
          margin: page.margin,
        })),
        activePage?.id ?? activePageId,
        {
          pageGap: workspaceSettings.pageGap,
          pagePadding: workspaceSettings.pagePadding,
        },
      ),
    [activePage?.id, activePageId, workingTemplate.pages, workspaceSettings.pageGap, workspaceSettings.pagePadding],
  );
  const effectiveRulerMode = resolveEffectiveRulerMode(workspaceSettings);
  const rulerMajorStep = workspaceSettings.rulerMajorStep;
  const rulerMinorStep = workspaceSettings.rulerMinorStep;
  const rulerTicks = useMemo(
    () =>
      resolveWorkspaceRulerTicks(workspaceLayout, activePage?.id ?? activePageId, {
        mode: effectiveRulerMode,
        majorStep: rulerMajorStep,
        minorStep: rulerMinorStep,
      }),
    [
      activePage?.id,
      activePageId,
      effectiveRulerMode,
      rulerMajorStep,
      rulerMinorStep,
      workspaceLayout,
    ],
  );
  const [isDropActive, setIsDropActive] = useState(false);
  const [draftCanvasCreation, setDraftCanvasCreation] = useState<CanvasToolDraft | null>(null);
  const dragDepthRef = useRef(0);
  const dragTraceOverSessionRef = useRef<string | null>(null);
  const dragTraceEnterSessionRef = useRef<string | null>(null);
  const dragTraceLoggedKeysRef = useRef<Set<string>>(new Set());
  const lastVariableDragPointRef = useRef<{ x: number; y: number } | null>(null);
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

  const appendVariableDragTrace = useCallback(
    (
      dragContext: {
        sessionId: string;
        type: string;
        sourcePanel?: string;
        payload: unknown;
      } | null,
      input: {
        action: "dragstart" | "dragenter" | "dragover" | "dragleave" | "drop" | "dragend" | "drop-reject";
        pageId: string;
        target: string;
        outcome?: string;
        reason?: string;
      },
    ) => {
      if (!dragContext || dragContext.type !== "variable") {
        return;
      }

      const logKey = [dragContext.sessionId, input.action, input.pageId, input.target, input.outcome ?? "", input.reason ?? ""].join("|");
      if (dragTraceLoggedKeysRef.current.has(logKey)) {
        return;
      }
      dragTraceLoggedKeysRef.current.add(logKey);

      appendOperationLogs([
        buildVariableDragOperationLog(dragContext, {
          action: input.action,
          pageId: input.pageId,
          target: input.target,
          outcome: input.outcome,
          reason: input.reason,
        }),
      ]);
    },
    [appendOperationLogs],
  );

  useEffect(() => {
    if (dragTraceContext) {
      return;
    }

    dragTraceLoggedKeysRef.current.clear();
    dragTraceEnterSessionRef.current = null;
    dragTraceOverSessionRef.current = null;
  }, [dragTraceContext]);

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
      const activeElement = typeof document !== "undefined" ? document.activeElement : null;
      if (isCanvasShortcutEditableTarget(event.target) || isCanvasShortcutEditableTarget(activeElement)) {
        return;
      }

      const shortcut = resolveCanvasShortcutAction(event);
      if (shortcut === "copy") {
        if (selectedElementIds.length === 0) {
          return;
        }

        const result = copyCanvasElements({
          elementIds: selectedElementIds,
        });
        if (!result.copied) {
          console.warn("[editor] copy rejected", result.reason);
          return;
        }

        event.preventDefault();
        return;
      }

      if (shortcut === "paste") {
        const result = pasteCanvasElements();
        if (!result.pasted) {
          console.warn("[editor] paste rejected", result.reason);
          return;
        }

        event.preventDefault();
        return;
      }

      if (shortcut === "undo") {
        undo();
        event.preventDefault();
        return;
      }

      if (shortcut === "redo") {
        redo();
        event.preventDefault();
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
  }, [
    clearCanvasInteractions,
    commitArcDraft,
    commitPointDraft,
    copyCanvasElements,
    deleteCanvasElements,
    pasteCanvasElements,
    undo,
    redo,
    selectedElementIds,
    setSelectedElementIds,
    workspaceLayout.pages,
  ]);

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
    if (isRichTextCanvasOverlayTarget(event.target)) {
      return;
    }

    const dragContext = useEditorStore.getState().dragTraceContext;
    const supported = isSupportedCanvasDrop(event, dragContext);
    if (!supported) {
      if (dragContext) {
        appendVariableDragTrace(dragContext, {
          action: "dragenter",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: "cible non supportée",
        });
      }
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDropActive(true);
    if (dragDepthRef.current === 1 && dragContext) {
      appendVariableDragTrace(dragContext, {
        action: "dragenter",
        pageId: activePage?.id ?? activePageId,
        target: "Canvas",
        outcome: "accepté",
      });
      dragTraceEnterSessionRef.current = dragContext.sessionId;
    }
  };

  const handleWorkspaceDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (isRichTextCanvasOverlayTarget(event.target)) {
      return;
    }

    if (!Array.from(event.dataTransfer.types).includes("application/x-resume-editor-item")) {
      return;
    }

    const dragContext = useEditorStore.getState().dragTraceContext;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDropActive(false);
      if (dragContext) {
        appendVariableDragTrace(dragContext, {
          action: "dragleave",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "sortie",
        });
      }
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
    }
  };

  const handleWorkspaceDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (isRichTextCanvasOverlayTarget(event.target)) {
      return;
    }

    const dragContext = useEditorStore.getState().dragTraceContext;
    if (!isSupportedCanvasDrop(event, dragContext) || !activePage) {
      if (dragContext?.type === "variable") {
        appendVariableDragTrace(dragContext, {
          action: "dragover",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: !activePage ? "page active introuvable" : "cible non supportée",
        });
      }
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (dragContext && dragTraceOverSessionRef.current !== dragContext.sessionId) {
      dragTraceOverSessionRef.current = dragContext.sessionId;
      appendVariableDragTrace(dragContext, {
        action: "dragover",
        pageId: activePage.id,
        target: "Canvas",
        outcome: "survol",
      });
    }
  };

  const handleWorkspaceDrop = (event: DragEvent<HTMLDivElement>) => {
    if (isRichTextCanvasOverlayTarget(event.target)) {
      return;
    }

    const dragContext = useEditorStore.getState().dragTraceContext;
    const supported = isSupportedCanvasDrop(event, dragContext);
    if (!supported || !activePage) {
      if (dragContext) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: !activePage ? "page active introuvable" : "cible non supportée",
        });
      }
      clearDragTraceContext();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDropActive(false);

    const payload = resolveCanvasDropPayload(event, dragContext);
    if (!payload) {
      appendVariableDragTrace(dragContext, {
        action: "drop-reject",
        pageId: activePage.id,
        target: "Canvas",
        outcome: "rejeté",
        reason: "payload introuvable",
      });
      clearDragTraceContext();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      return;
    }

    const workspacePoint = resolveWorkspacePointer(event, viewport, stageRef.current);
    if (!workspacePoint) {
      if (dragContext) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage.id,
          target: "Canvas",
          outcome: "rejeté",
          reason: "position workspace introuvable",
        });
      }
      clearDragTraceContext();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      return;
    }

    const targetPage = findWorkspacePageAtPointStrict(workspaceLayout, workspacePoint);
    if (!targetPage) {
      dragDepthRef.current = 0;
      setIsDropActive(false);
      appendVariableDragTrace(dragContext, {
        action: "drop-reject",
        pageId: activePage.id,
        target: "Canvas",
        outcome: "rejeté",
        reason: "page cible introuvable",
      });
      clearDragTraceContext();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      return;
    }

    const point = snapWorkspacePoint(convertWorkspacePointToPagePoint(workspacePoint, targetPage), targetPage, workspaceSettings);
    const result = insertCanvasDropPayload({
      pageId: targetPage.id,
      point,
      source: payload,
    });

    if (!result.inserted) {
      appendVariableDragTrace(dragContext, {
        action: "drop-reject",
        pageId: targetPage.id,
        target: "Canvas",
        outcome: "rejeté",
        reason: result.reason,
      });
      console.warn("[editor] unsupported canvas drop payload", result.sourceType, result.reason);
      clearDragTraceContext();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      return;
    }
    appendVariableDragTrace(dragContext, {
      action: "drop",
      pageId: targetPage.id,
      target: `Canvas (${targetPage.id})`,
      outcome: "accepté",
    });
    clearDragTraceContext();
    dragTraceEnterSessionRef.current = null;
    dragTraceOverSessionRef.current = null;
  };

  const handleVariableDragEndFallback = useCallback(
    (event: globalThis.DragEvent) => {
      const dragContext = useEditorStore.getState().dragTraceContext;
      if (!dragContext || dragContext.type !== "variable") {
        lastVariableDragPointRef.current = null;
        return;
      }

      const payload = dragContext.payload as Record<string, unknown> | null;
      if (!payload) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: "payload manquant",
        });
        clearDragTraceContext();
        dragTraceEnterSessionRef.current = null;
        dragTraceOverSessionRef.current = null;
        lastVariableDragPointRef.current = null;
        return;
      }

      const clientPoint =
        Number.isFinite(event.clientX) && Number.isFinite(event.clientY) && (event.clientX !== 0 || event.clientY !== 0)
          ? { x: event.clientX, y: event.clientY }
          : lastVariableDragPointRef.current;

      if (!clientPoint) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: "position introuvable",
        });
        clearDragTraceContext();
        dragTraceEnterSessionRef.current = null;
        dragTraceOverSessionRef.current = null;
        lastVariableDragPointRef.current = null;
        return;
      }

      const directTarget = document.elementFromPoint(clientPoint.x, clientPoint.y);
      const richTextBlock = directTarget instanceof Element ? directTarget.closest(".ef-rich-text-canvas-block") : null;
      const richTextBlockId = richTextBlock?.getAttribute("data-rich-text-block-id");
      if (richTextBlockId) {
        const richTextElement = workingTemplate.elements.find((element) => element.id === richTextBlockId) ?? null;
        if (richTextElement?.type === "rich-text") {
          const html = typeof richTextElement.props?.html === "string" ? richTextElement.props.html : "<p></p>";
          const nextHtml = insertVariableTokenIntoRichTextHtml(html, payload as Parameters<typeof insertVariableTokenIntoRichTextHtml>[1]);
          const result = updateRichTextElementContent({
            elementId: richTextElement.id,
            html: nextHtml,
            displayMode: typeof richTextElement.props?.richTextDisplayMode === "string" ? (richTextElement.props.richTextDisplayMode as "label" | "technical" | "value") : "label",
          });

          if (result.updated) {
            appendVariableDragTrace(dragContext, {
              action: "drop",
              pageId: richTextElement.pageId,
              target: `Rich Text (${richTextElement.id})`,
              outcome: "accepté",
            });
          } else {
            appendVariableDragTrace(dragContext, {
              action: "drop-reject",
              pageId: richTextElement.pageId,
              target: `Rich Text (${richTextElement.id})`,
              outcome: "rejeté",
              reason: result.reason,
            });
          }

          clearDragTraceContext();
          dragTraceEnterSessionRef.current = null;
          dragTraceOverSessionRef.current = null;
          lastVariableDragPointRef.current = null;
          return;
        }
      }

      const stage = stageRef.current;
      if (!stage) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: "zone canvas introuvable",
        });
        clearDragTraceContext();
        dragTraceEnterSessionRef.current = null;
        dragTraceOverSessionRef.current = null;
        lastVariableDragPointRef.current = null;
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      if (
        clientPoint.x < stageRect.left ||
        clientPoint.x > stageRect.right ||
        clientPoint.y < stageRect.top ||
        clientPoint.y > stageRect.bottom
      ) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: "hors zone canvas",
        });
        clearDragTraceContext();
        dragTraceEnterSessionRef.current = null;
        dragTraceOverSessionRef.current = null;
        lastVariableDragPointRef.current = null;
        return;
      }

      const workspacePoint = convertClientPointToWorkspacePoint(clientPoint, stageRect, viewport);
      const targetPage = findWorkspacePageAtPointStrict(workspaceLayout, workspacePoint);
      if (!targetPage) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: activePage?.id ?? activePageId,
          target: "Canvas",
          outcome: "rejeté",
          reason: "page cible introuvable",
        });
        clearDragTraceContext();
        dragTraceEnterSessionRef.current = null;
        dragTraceOverSessionRef.current = null;
        lastVariableDragPointRef.current = null;
        return;
      }

      const point = snapWorkspacePoint(convertWorkspacePointToPagePoint(workspacePoint, targetPage), targetPage, workspaceSettings);
      const result = insertCanvasDropPayload({
        pageId: targetPage.id,
        point,
        source: {
          type: dragContext.type,
          payload: dragContext.payload,
        },
      });

      if (!result.inserted) {
        appendVariableDragTrace(dragContext, {
          action: "drop-reject",
          pageId: targetPage.id,
          target: "Canvas",
          outcome: "rejeté",
          reason: result.reason,
        });
        clearDragTraceContext();
        dragTraceEnterSessionRef.current = null;
        dragTraceOverSessionRef.current = null;
        lastVariableDragPointRef.current = null;
        return;
      }

      appendVariableDragTrace(dragContext, {
        action: "drop",
        pageId: targetPage.id,
        target: `Canvas (${targetPage.id})`,
        outcome: "accepté",
      });
      clearDragTraceContext();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      lastVariableDragPointRef.current = null;
    },
    [
      activePage?.id,
      activePageId,
      appendVariableDragTrace,
      clearDragTraceContext,
      insertCanvasDropPayload,
      updateRichTextElementContent,
      viewport,
      workingTemplate.elements,
      workspaceLayout,
      workspaceSettings,
    ],
  );

  useEffect(() => {
    const adaptEvent = (event: globalThis.DragEvent): DragEvent<HTMLDivElement> | null => {
      const currentTarget = stageRef.current;
      if (!currentTarget) {
        return null;
      }

      return {
        clientX: event.clientX,
        clientY: event.clientY,
        dataTransfer: event.dataTransfer,
        currentTarget,
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      } as unknown as DragEvent<HTMLDivElement>;
    };

    const handleDocumentDragEnter = (event: globalThis.DragEvent) => {
      if (isRichTextCanvasOverlayTarget(event.target)) {
        return;
      }

      if (!useEditorStore.getState().dragTraceContext) {
        return;
      }

      const adaptedEvent = adaptEvent(event);
      if (!adaptedEvent) {
        return;
      }

      handleWorkspaceDragEnter(adaptedEvent);
    };

    const handleDocumentDragLeave = (event: globalThis.DragEvent) => {
      if (isRichTextCanvasOverlayTarget(event.target)) {
        return;
      }

      if (!useEditorStore.getState().dragTraceContext) {
        return;
      }

      const adaptedEvent = adaptEvent(event);
      if (!adaptedEvent) {
        return;
      }

      handleWorkspaceDragLeave(adaptedEvent);
    };

    const handleDocumentDragOver = (event: globalThis.DragEvent) => {
      if (Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        lastVariableDragPointRef.current = { x: event.clientX, y: event.clientY };
      }

      if (isRichTextCanvasOverlayTarget(event.target)) {
        return;
      }

      if (!useEditorStore.getState().dragTraceContext) {
        return;
      }

      const adaptedEvent = adaptEvent(event);
      if (!adaptedEvent) {
        return;
      }

      handleWorkspaceDragOver(adaptedEvent);
    };

    const handleDocumentDrop = (event: globalThis.DragEvent) => {
      if (isRichTextCanvasOverlayTarget(event.target)) {
        return;
      }

      if (!useEditorStore.getState().dragTraceContext) {
        return;
      }

      const adaptedEvent = adaptEvent(event);
      if (!adaptedEvent) {
        return;
      }

      handleWorkspaceDrop(adaptedEvent);
    };

    const handleDocumentDragEnd = (event: globalThis.DragEvent) => {
      if (useEditorStore.getState().dragTraceContext?.type === "variable") {
        handleVariableDragEndFallback(event);
      }

      dragTraceLoggedKeysRef.current.clear();
      dragTraceEnterSessionRef.current = null;
      dragTraceOverSessionRef.current = null;
      lastVariableDragPointRef.current = null;
    };

    document.addEventListener("dragenter", handleDocumentDragEnter, true);
    document.addEventListener("dragleave", handleDocumentDragLeave, true);
    document.addEventListener("dragover", handleDocumentDragOver, true);
    document.addEventListener("drop", handleDocumentDrop, true);
    document.addEventListener("dragend", handleDocumentDragEnd, true);

    return () => {
      document.removeEventListener("dragenter", handleDocumentDragEnter, true);
      document.removeEventListener("dragleave", handleDocumentDragLeave, true);
      document.removeEventListener("dragover", handleDocumentDragOver, true);
      document.removeEventListener("drop", handleDocumentDrop, true);
      document.removeEventListener("dragend", handleDocumentDragEnd, true);
    };
  }, [handleVariableDragEndFallback, handleWorkspaceDragEnter, handleWorkspaceDragLeave, handleWorkspaceDragOver, handleWorkspaceDrop]);

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

  const goToPageByOffset = useCallback(
    (offset: -1 | 1) => {
      const nextPage = workingTemplate.pages[activePageIndex + offset];
      if (nextPage) {
        setActivePageId(nextPage.id);
      }
    },
    [activePageIndex, setActivePageId, workingTemplate.pages],
  );

  const handleAddPage = useCallback(() => {
    addTemplatePage();
  }, [addTemplatePage]);

  const handleZoomStep = useCallback(
    (direction: -1 | 1) => {
      const step = viewport.zoom < 1 ? 0.1 : 0.25;
      setZoom(viewport.zoom + step * direction);
    },
    [setZoom, viewport.zoom],
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
        <div
          className="ef-ruler-grid"
          style={{
            gridTemplateColumns: `var(--editor-ruler-size) ${workspaceLayout.width}px`,
            gridTemplateRows: `var(--editor-ruler-h) ${workspaceLayout.height}px`,
          }}
        >
          <RulerCorner />
          <HorizontalRuler ticks={rulerTicks.horizontal} viewport={viewport} width={workspaceLayout.width} visible={workspaceSettings.rulersVisible} />
          <VerticalRuler ticks={rulerTicks.vertical} viewport={viewport} height={workspaceLayout.height} visible={workspaceSettings.rulersVisible} />
          <div
            className={["ef-canvas-stage", isDropActive ? "is-drop-active" : "", isArcPointTool ? "is-pencil-tool" : "", activeCanvasTool === "hand" ? "is-pan-tool" : ""].join(" ")}
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
      <CanvasNavigationPalette
        activePageIndex={activePageIndex >= 0 ? activePageIndex : 0}
        gridEnabled={workspaceSettings.gridEnabled}
        isPanActive={activeCanvasTool === "hand"}
        onAddPage={handleAddPage}
        onNextPage={() => goToPageByOffset(1)}
        onPreviousPage={() => goToPageByOffset(-1)}
        onResetZoom={() => setZoom(1)}
        onToggleGrid={() => setWorkspaceSettings({ gridEnabled: !workspaceSettings.gridEnabled })}
        onTogglePan={() => setActiveCanvasTool(activeCanvasTool === "hand" ? "pointer" : "hand")}
        onToggleRulers={() => setWorkspaceSettings({ rulersVisible: !workspaceSettings.rulersVisible })}
        onToggleSnap={() => setWorkspaceSettings({ snapEnabled: !workspaceSettings.snapEnabled })}
        onZoomIn={() => handleZoomStep(1)}
        onZoomOut={() => handleZoomStep(-1)}
        pageCount={workingTemplate.pages.length}
        rulersVisible={workspaceSettings.rulersVisible}
        snapEnabled={workspaceSettings.snapEnabled}
        zoom={viewport.zoom}
      />
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

function isSupportedCanvasDrop(
  event: DragEvent<HTMLDivElement>,
  fallbackContext: { type: string; sourcePanel?: string; payload: unknown } | null,
) {
  const payload = resolveCanvasDropPayload(event, fallbackContext);
  return payload ? CANVAS_INSERTABLE_TYPES.has(payload.type) : false;
}

function isRichTextCanvasOverlayTarget(target: EventTarget | null) {
  if (target instanceof Element) {
    return Boolean(target.closest(".ef-rich-text-canvas-layer") || target.closest(".ef-rich-text-canvas-block"));
  }

  if (target instanceof Node) {
    return Boolean(target.parentElement?.closest(".ef-rich-text-canvas-layer") || target.parentElement?.closest(".ef-rich-text-canvas-block"));
  }

  return false;
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
