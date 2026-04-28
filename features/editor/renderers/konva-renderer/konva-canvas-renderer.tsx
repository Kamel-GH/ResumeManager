"use client";

import Konva from "konva";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Ellipse, Group, Image as KonvaImage, Layer, Line, Rect, Shape, Stage, Text } from "react-konva";
import { Transformer } from "react-konva";

import { isArcToolId, resolveArcGeometryDraft, type CanvasToolDraft, type CanvasToolId } from "@/features/editor/schema/canvas-insertion";
import type { CanonicalRenderTree, RenderNode } from "@/features/editor/schema/render-tree";
import type { EditorWorkspaceSettings, WorkspaceLayout, WorkspacePageLayout, WorkspaceViewport } from "@/features/editor/schema/workspace-layout";
import { convertClientPointToWorkspacePoint, findWorkspacePageAtPoint, snapWorkspaceFrame, snapWorkspacePoint } from "@/features/editor/schema/workspace-layout";
import { useEditorStore } from "@/features/editor/stores/editor-store";

import {
  getKonvaImageProps,
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
  isTransformableNode,
} from "@/features/editor/renderers/konva-renderer/konva-renderer-model";

export type KonvaCanvasRendererProps = {
  renderTree: CanonicalRenderTree;
  workspaceLayout: WorkspaceLayout;
  workspaceSettings: EditorWorkspaceSettings;
  viewport: WorkspaceViewport;
  activePageId: string;
  selectedElementIds: string[];
  activeCanvasTool: CanvasToolId;
  draftCanvasCreation: CanvasToolDraft | null;
  onSelectElement: (elementIds: string[], options?: { additive?: boolean }) => void;
};

type NodeInteractionProps = {
  draggable?: boolean;
  onClick?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap?: (event: Konva.KonvaEventObject<TouchEvent>) => void;
  onDragStart?: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: () => void;
  onDragEnd?: () => void;
  onTransformEnd?: () => void;
};

export function KonvaCanvasRenderer({
  renderTree,
  workspaceLayout,
  workspaceSettings,
  viewport,
  activePageId,
  selectedElementIds,
  activeCanvasTool,
  draftCanvasCreation,
  onSelectElement,
}: KonvaCanvasRendererProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const selectionDragRef = useRef<{
    pointerId: number;
    pageId: string;
    start: { x: number; y: number };
    current: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const dragSelectionRef = useRef<{
    anchorId: string;
    pageId: string;
    selectionIds: string[];
    startPositions: Map<string, { x: number; y: number }>;
  } | null>(null);
  const transformSelectionRef = useRef<{
    pageId: string;
    selectionIds: string[];
    originalById: Map<
      string,
      {
        frame: { x: number; y: number; width: number; height: number };
        rotation: number;
        anchorMode: "center" | "origin";
        anchorPoint: { x: number; y: number };
      }
    >;
    selectionCenter: { x: number; y: number };
  } | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [selectionBoxDraft, setSelectionBoxDraft] = useState<{ x: number; y: number; width: number; height: number; pageId: string } | null>(null);
  const pageLayoutsById = useMemo(
    () => new Map(workspaceLayout.pages.map((layoutPage) => [layoutPage.id, layoutPage] as const)),
    [workspaceLayout.pages],
  );
  const deleteCanvasElements = useEditorStore((state) => state.deleteCanvasElements);
  const renderNodeById = useMemo(() => {
    const nodes = new Map<string, { node: RenderNode; pageId: string }>();
    renderTree.pages.forEach((page) => {
      page.children.forEach((node) => {
        nodes.set(node.id, { node, pageId: page.id });
      });
    });
    return nodes;
  }, [renderTree.pages]);
  const selectedIds = useMemo(() => new Set(selectedElementIds), [selectedElementIds]);
  const selectedContourBoxes = useMemo(() => {
    const byPage = new Map<string, { pageLayout: WorkspacePageLayout; rects: Array<{ x: number; y: number; width: number; height: number }> }>();

    selectedElementIds.forEach((elementId) => {
      const entry = renderNodeById.get(elementId);
      if (!entry || !entry.node.visible) {
        return;
      }

      const pageLayout = pageLayoutsById.get(entry.pageId);
      if (!pageLayout) {
        return;
      }

      const bucket = byPage.get(pageLayout.id);
      const workspaceFrame = getWorkspaceSelectionBounds(entry.node, pageLayout);
      if (bucket) {
        bucket.rects.push(workspaceFrame);
        return;
      }

      byPage.set(pageLayout.id, {
        pageLayout,
        rects: [workspaceFrame],
      });
    });

    return [...byPage.values()]
      .map(({ pageLayout, rects }) => {
        if (rects.length === 0) {
          return null;
        }

        const bounds = rects.reduce(
          (acc, rect) => ({
            x: Math.min(acc.x, rect.x),
            y: Math.min(acc.y, rect.y),
            width: Math.max(acc.x + acc.width, rect.x + rect.width) - Math.min(acc.x, rect.x),
            height: Math.max(acc.y + acc.height, rect.y + rect.height) - Math.min(acc.y, rect.y),
          }),
          { ...rects[0] },
        );

        return {
          pageId: pageLayout.id,
          bounds,
        };
      })
      .filter((entry): entry is { pageId: string; bounds: { x: number; y: number; width: number; height: number } } => entry !== null);
  }, [pageLayoutsById, renderNodeById, selectedElementIds]);
  const canSelect = activeCanvasTool === "pointer" || activeCanvasTool === "selection";
  const selectedTransformableIds = useMemo(() => {
    const ids = selectedElementIds.filter((elementId) => {
      const entry = renderNodeById.get(elementId);
      return entry ? isTransformableNode(entry.node) : false;
    });

    if (ids.length <= 1) {
      return ids;
    }

    const pageIds = new Set(ids.map((elementId) => renderNodeById.get(elementId)?.pageId).filter(Boolean) as string[]);
    return pageIds.size === 1 ? ids : [];
  }, [renderNodeById, selectedElementIds]);
  const canRotateSelection = selectedTransformableIds.length > 0;
  const canResizeSelection = selectedTransformableIds.length > 0;
  const enableShiftKeepRatio =
    isShiftPressed &&
    selectedTransformableIds.length > 0 &&
    selectedTransformableIds.every((elementId) => allowsProportionalResize(renderNodeById.get(elementId)?.node ?? null));
  const viewportTransform = useMemo(
    () => ({
      x: viewport.panX,
      y: viewport.panY,
      scaleX: viewport.zoom,
      scaleY: viewport.zoom,
    }),
    [viewport.panX, viewport.panY, viewport.zoom],
  );
  const handleSelectElement = useCallback(
    (elementIds: string[], options?: { additive?: boolean }) => {
      if (!canSelect) {
        return;
      }

      const nextIds = getNextSelectionIds({
        currentSelection: selectedElementIds,
        renderNodeById,
        elementIds,
        additive: options?.additive === true,
      });

      onSelectElement(nextIds);
    },
    [canSelect, onSelectElement, renderNodeById, selectedElementIds],
  );
  const handleDeleteElements = useCallback(
    (elementIds: string[]) => {
      const result = deleteCanvasElements({ elementIds });
      if (!result.deleted) {
        console.warn("[editor] delete rejected", result.reason);
      }
    },
    [deleteCanvasElements],
  );
  const clearSelectionDraft = useCallback(() => {
    selectionDragRef.current = null;
    setSelectionBoxDraft(null);
  }, []);
  const handleTransformStart = useCallback(() => {
    if (selectedTransformableIds.length === 0) {
      transformSelectionRef.current = null;
      return;
    }

    const pageId = renderNodeById.get(selectedTransformableIds[0])?.node.pageId;
    if (!pageId) {
      transformSelectionRef.current = null;
      return;
    }

    const originalById = new Map<
      string,
      {
        frame: { x: number; y: number; width: number; height: number };
        rotation: number;
        anchorMode: "center" | "origin";
        anchorPoint: { x: number; y: number };
      }
    >();
    const frames = selectedTransformableIds
      .map((selectionId) => {
        const node = renderNodeById.get(selectionId)?.node;
        if (!node) {
          return null;
        }

        const anchorMode = getRenderNodeAnchorMode(node);
        originalById.set(selectionId, {
          frame: {
            x: node.frame.x,
            y: node.frame.y,
            width: node.frame.width,
            height: node.frame.height,
          },
          rotation: node.rotation,
          anchorMode,
          anchorPoint: getRenderNodeTransformAnchorPoint(node, anchorMode),
        });

        return node.frame;
      })
      .filter((frame): frame is { x: number; y: number; width: number; height: number } => frame !== null);

    if (frames.length === 0) {
      transformSelectionRef.current = null;
      return;
    }

    const bounds = frames.reduce(
      (acc, frame) => ({
        x: Math.min(acc.x, frame.x),
        y: Math.min(acc.y, frame.y),
        width: Math.max(acc.x + acc.width, frame.x + frame.width) - Math.min(acc.x, frame.x),
        height: Math.max(acc.y + acc.height, frame.y + frame.height) - Math.min(acc.y, frame.y),
      }),
      { ...frames[0] },
    );

    transformSelectionRef.current = {
      pageId,
      selectionIds: [...selectedTransformableIds],
      originalById,
      selectionCenter: {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      },
    };
  }, [renderNodeById, selectedTransformableIds]);
  const isTransformerInteraction = useCallback((target: Konva.Node) => {
    let current: Konva.Node | null = target;
    while (current) {
      if (current === transformerRef.current) {
        return true;
      }

      current = current.getParent();
    }

    return false;
  }, []);
  const commitSelectionDraft = useCallback(() => {
    const draft = selectionDragRef.current;
    if (!draft) {
      return;
    }

    const pageLayout = pageLayoutsById.get(draft.pageId);
    if (!pageLayout) {
      clearSelectionDraft();
      return;
    }

    const selectionRect = normalizeRect(makeFrameFromPoints(draft.start, draft.current));
    if (!draft.moved || Math.max(selectionRect.width, selectionRect.height) < 4) {
      onSelectElement([]);
      clearSelectionDraft();
      return;
    }

    const selectedIds = getElementIdsWithinSelectionRect({
      selectionRect,
      pageLayout,
      renderTree,
    });

    onSelectElement(selectedIds);
    clearSelectionDraft();
  }, [clearSelectionDraft, onSelectElement, pageLayoutsById, renderTree]);
  const handleDragStart = useCallback(
    (node: RenderNode) => {
      if (!canSelect) {
        return;
      }

      const anchorId = node.id;
      const selectionIds =
        selectedIds.has(anchorId) && selectedElementIds.length > 1
          ? selectedElementIds.filter((selectionId) => {
              const entry = renderNodeById.get(selectionId);
              return Boolean(entry && entry.pageId === node.pageId && entry.node.visible && !entry.node.locked && entry.node.props.selectable === true);
            })
          : [anchorId];

      if (!selectedIds.has(anchorId)) {
        handleSelectElement([anchorId]);
      }

      const startPositions = new Map<string, { x: number; y: number }>();
      selectionIds.forEach((selectionId) => {
        const selectedNode = stageRef.current?.findOne<Konva.Node>(`#${selectionId}`);
        if (!selectedNode) {
          return;
        }

        startPositions.set(selectionId, {
          x: selectedNode.x(),
          y: selectedNode.y(),
        });
      });

      dragSelectionRef.current = {
        anchorId,
        pageId: node.pageId,
        selectionIds,
        startPositions,
      };
    },
    [canSelect, handleSelectElement, renderNodeById, selectedElementIds, selectedIds],
  );
  const handleDragMove = useCallback(() => {
      const drag = dragSelectionRef.current;
      if (!drag || drag.selectionIds.length <= 1) {
        return;
      }

      const anchorNode = stageRef.current?.findOne<Konva.Node>(`#${drag.anchorId}`);
      const anchorStart = drag.startPositions.get(drag.anchorId);
      if (!anchorNode || !anchorStart) {
        return;
      }

      const deltaX = anchorNode.x() - anchorStart.x;
      const deltaY = anchorNode.y() - anchorStart.y;

      drag.selectionIds.forEach((selectionId) => {
        if (selectionId === drag.anchorId) {
          return;
        }

        const movingNode = stageRef.current?.findOne<Konva.Node>(`#${selectionId}`);
        const start = drag.startPositions.get(selectionId);
        if (!movingNode || !start) {
          return;
        }

        movingNode.position({
          x: start.x + deltaX,
          y: start.y + deltaY,
        });
      });

      stageRef.current?.batchDraw();
    },
    [],
  );
  const handleDragEnd = useCallback(
    (node: RenderNode) => {
      const drag = dragSelectionRef.current;
      if (!drag) {
        return;
      }

      const pageLayout = pageLayoutsById.get(drag.pageId ?? node.pageId);
      const anchorStart = drag.startPositions.get(drag.anchorId);
      const anchorNode = stageRef.current?.findOne<Konva.Node>(`#${drag.anchorId}`);
      const snappedAnchorPoint =
        pageLayout && anchorStart && anchorNode
          ? snapWorkspacePoint({ x: anchorNode.x(), y: anchorNode.y() }, pageLayout, workspaceSettings)
          : anchorNode
            ? { x: anchorNode.x(), y: anchorNode.y() }
            : null;
      const deltaX = snappedAnchorPoint && anchorStart ? snappedAnchorPoint.x - anchorStart.x : 0;
      const deltaY = snappedAnchorPoint && anchorStart ? snappedAnchorPoint.y - anchorStart.y : 0;

      const patches = drag.selectionIds
        .map((selectionId) => {
          const selectedNode = stageRef.current?.findOne<Konva.Node>(`#${selectionId}`);
          const renderNode = renderNodeById.get(selectionId)?.node;
          if (!selectedNode || !renderNode) {
            return null;
          }

          const startPosition = drag.startPositions.get(selectionId);
          const nextX = startPosition ? startPosition.x + deltaX : selectedNode.x();
          const nextY = startPosition ? startPosition.y + deltaY : selectedNode.y();
          const committedFrame = resolveCommittedFrame(renderNode, selectedNode, {
            x: nextX,
            y: nextY,
          });

          return {
            id: selectionId,
            frame: committedFrame,
            rotation: selectedNode.rotation(),
          };
        })
        .filter((patch): patch is { id: string; frame: { x: number; y: number; width: number; height: number }; rotation: number } => patch !== null);

      if (patches.length > 0) {
        const pageId = drag.pageId ?? node.pageId;
        const result = useEditorStore.getState().commitCanvasObjectGeometry({
          pageId,
          patches,
        });

        if (!result.committed) {
          console.warn("[editor] canvas geometry commit rejected", result.reason);
        }
      }

      dragSelectionRef.current = null;
    },
    [pageLayoutsById, renderNodeById, workspaceSettings],
  );
  const handleTransformEnd = useCallback(() => {
    const selection = transformSelectionRef.current;
    if (!selection || selection.selectionIds.length === 0) {
      return;
    }

    const stage = stageRef.current;
    const anchorNode = stage?.findOne<Konva.Node>(`#${selection.selectionIds[0]}`);
    if (!anchorNode) {
      transformSelectionRef.current = null;
      return;
    }

    if (selection.selectionIds.length === 1) {
      const selectionId = selection.selectionIds[0];
      const renderNode = renderNodeById.get(selectionId)?.node;
      const selectedNode = stage?.findOne<Konva.Node>(`#${selectionId}`);
      if (!renderNode || !selectedNode) {
        transformSelectionRef.current = null;
        return;
      }

      const pageLayout = pageLayoutsById.get(renderNode.pageId);
      const isRotationOnly = isApproximatelyOne(selectedNode.scaleX()) && isApproximatelyOne(selectedNode.scaleY());
      const frame = isRotationOnly
        ? {
            x: renderNode.frame.x,
            y: renderNode.frame.y,
            width: renderNode.frame.width,
            height: renderNode.frame.height,
          }
        : resolveCommittedFrame(renderNode, selectedNode);
      const snappedFrame = pageLayout ? snapWorkspaceFrame(frame, pageLayout, workspaceSettings) : frame;
      const points = resolveScaledShapePoints(renderNode, snappedFrame);
      const result = useEditorStore.getState().commitCanvasObjectGeometry({
        pageId: renderNode.pageId,
        patches: [
          {
            id: selectionId,
            frame: snappedFrame,
            rotation: selectedNode.rotation(),
            ...(points ? { points } : {}),
          },
        ],
      });

      selectedNode.scaleX(1);
      selectedNode.scaleY(1);
      transformSelectionRef.current = null;

      if (!result.committed) {
        console.warn("[editor] canvas transform commit rejected", result.reason);
      }
      return;
    }

    const originalAnchor = selection.originalById.get(selection.selectionIds[0]);
    if (!originalAnchor) {
      transformSelectionRef.current = null;
      return;
    }

    const rotationDelta = anchorNode.rotation() - originalAnchor.rotation;
    const selectionCenter = selection.selectionCenter;
    const hasResizeChange = selection.selectionIds.some((selectionId) => {
      const selectedNode = stage?.findOne<Konva.Node>(`#${selectionId}`);
      return Boolean(selectedNode && (!isApproximatelyOne(selectedNode.scaleX()) || !isApproximatelyOne(selectedNode.scaleY())));
    });

    if (hasResizeChange) {
      const resizePatches: Array<{
        id: string;
        frame: { x: number; y: number; width: number; height: number };
        rotation: number;
        points?: number[];
      }> = [];

      selection.selectionIds.forEach((selectionId) => {
        const original = selection.originalById.get(selectionId);
        const renderNode = renderNodeById.get(selectionId)?.node;
        const selectedNode = stage?.findOne<Konva.Node>(`#${selectionId}`);
        if (!original || !renderNode || !selectedNode) {
          return;
        }

        const committedFrame = resolveCommittedFrame(renderNode, selectedNode);
        const points = resolveScaledShapePoints(renderNode, committedFrame);

        resizePatches.push({
          id: selectionId,
          frame: committedFrame,
          rotation: selectedNode.rotation(),
          ...(points ? { points } : {}),
        });

        selectedNode.scaleX(1);
        selectedNode.scaleY(1);
      });

      if (resizePatches.length === 0) {
        transformSelectionRef.current = null;
        return;
      }

      const result = useEditorStore.getState().commitCanvasObjectGeometry({
        pageId: selection.pageId,
        patches: resizePatches,
      });

      if (!result.committed) {
        console.warn("[editor] canvas transform commit rejected", result.reason);
      }

      transformSelectionRef.current = null;
      return;
    }

      const patches: Array<{
        id: string;
        frame: { x: number; y: number; width: number; height: number };
        rotation: number;
        points?: number[];
      }> = [];

    selection.selectionIds.forEach((selectionId) => {
      const original = selection.originalById.get(selectionId);
      const selectedNode = stage?.findOne<Konva.Node>(`#${selectionId}`);
      if (!original || !selectedNode) {
        return;
      }

      const rotatedAnchorPoint = rotatePointAroundPoint(original.anchorPoint, selectionCenter, rotationDelta);
      const frame =
        original.anchorMode === "center"
          ? {
              x: rotatedAnchorPoint.x - original.frame.width / 2,
              y: rotatedAnchorPoint.y - original.frame.height / 2,
              width: original.frame.width,
              height: original.frame.height,
            }
          : {
              x: rotatedAnchorPoint.x,
              y: rotatedAnchorPoint.y,
              width: original.frame.width,
              height: original.frame.height,
            };

      patches.push({
        id: selectionId,
        frame,
        rotation: original.rotation + rotationDelta,
      });

      selectedNode.scaleX(1);
      selectedNode.scaleY(1);
    });

    if (patches.length === 0) {
      transformSelectionRef.current = null;
      return;
    }

    const result = useEditorStore.getState().commitCanvasObjectGeometry({
      pageId: selection.pageId,
      patches,
    });

    if (!result.committed) {
      console.warn("[editor] canvas transform commit rejected", result.reason);
    }

    transformSelectionRef.current = null;
  }, [pageLayoutsById, renderNodeById, workspaceSettings]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
      if (!transformer || !stage) {
        return;
      }

    const nextNodes = selectedTransformableIds
      .map((elementId) => stage.findOne<Konva.Node>(`#${elementId}`))
      .filter((node): node is Konva.Node => node !== null && node !== undefined)
      .filter((node) => isTransformableKonvaNode(node));

    if (nextNodes.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    transformer.nodes(nextNodes);
    transformer.enabledAnchors(canResizeSelection ? [...ALL_TRANSFORM_ANCHORS] : []);
    transformer.resizeEnabled(canResizeSelection);
    transformer.rotateEnabled(canRotateSelection);
    transformer.keepRatio(enableShiftKeepRatio);
    transformer.flipEnabled(false);
    transformer.getLayer()?.batchDraw();
  }, [canResizeSelection, canRotateSelection, enableShiftKeepRatio, selectedTransformableIds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectionDragRef.current) {
          clearSelectionDraft();
          return;
        }

        if (dragSelectionRef.current) {
          dragSelectionRef.current = null;
        }

        if (selectedElementIds.length > 0) {
          onSelectElement([]);
        }
      }

      if (event.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [clearSelectionDraft, onSelectElement, selectedElementIds.length]);

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      const draft = selectionDragRef.current;
      if (!draft) {
        return;
      }

      const stage = stageRef.current;
      const rect = stage?.container().getBoundingClientRect();
      if (!rect) {
        return;
      }

      const workspacePoint = convertClientPointToWorkspacePoint({ x: event.clientX, y: event.clientY }, rect, viewport);
      draft.current = workspacePoint;
      draft.moved = draft.moved || distanceBetweenPoints(draft.start, workspacePoint) > 2;
      const frame = normalizeRect(makeFrameFromPoints(draft.start, workspacePoint));
      setSelectionBoxDraft({
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
        pageId: draft.pageId,
      });
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      if (!selectionDragRef.current) {
        return;
      }

      if (stageRef.current?.container().hasPointerCapture(event.pointerId)) {
        stageRef.current.container().releasePointerCapture(event.pointerId);
      }

      commitSelectionDraft();
    };

    const handleWindowPointerCancel = (event: PointerEvent) => {
      if (!selectionDragRef.current) {
        return;
      }

      if (stageRef.current?.container().hasPointerCapture(event.pointerId)) {
        stageRef.current.container().releasePointerCapture(event.pointerId);
      }

      clearSelectionDraft();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
    };
  }, [clearSelectionDraft, commitSelectionDraft, viewport]);

  useEffect(
    () => () => {
      dragSelectionRef.current = null;
      clearSelectionDraft();
    },
    [clearSelectionDraft],
  );

  if (workspaceLayout.pages.length === 0) {
    return null;
  }

  return (
      <Stage
        width={workspaceLayout.width}
        height={workspaceLayout.height}
        className="ef-konva-page ef-render-page"
        aria-label="Template CV"
        ref={stageRef}
      onPointerDown={(event) => {
        if (activeCanvasTool === "eraser") {
          if (isTransformerInteraction(event.target)) {
            if (selectedElementIds.length > 0) {
              handleDeleteElements(selectedElementIds);
            }
            return;
          }

          if (isSelectableEventTarget(event.target)) {
            return;
          }
        }

        if (!canSelect) {
          return;
        }

        if (isTransformerInteraction(event.target)) {
          return;
        }

        if (isSelectableEventTarget(event.target)) {
          return;
        }

        const workspacePoint = resolveKonvaWorkspacePointer(event, viewport);
        const pageLayout = workspacePoint ? findWorkspacePageAtPoint(workspaceLayout, workspacePoint, activePageId) : null;

        if (activeCanvasTool === "selection") {
          if (!workspacePoint || !pageLayout) {
            onSelectElement([]);
            clearSelectionDraft();
            return;
          }

          const frame = makeFrameFromPoints(workspacePoint, workspacePoint);
          selectionDragRef.current = {
            pointerId: event.evt.pointerId,
            pageId: pageLayout.id,
            start: workspacePoint,
            current: workspacePoint,
            moved: false,
          };
          setSelectionBoxDraft({
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
            pageId: pageLayout.id,
          });
          stageRef.current?.container().setPointerCapture(event.evt.pointerId);
          return;
        }

        if (workspacePoint && pageLayout) {
          onSelectElement([]);
        }
      }}
      onPointerMove={(event) => {
        const draft = selectionDragRef.current;
        if (!draft) {
          return;
        }

        const workspacePoint = resolveKonvaWorkspacePointer(event, viewport);
        if (!workspacePoint) {
          return;
        }

        draft.current = workspacePoint;
        draft.moved = draft.moved || distanceBetweenPoints(draft.start, workspacePoint) > 2;
        const frame = normalizeRect(makeFrameFromPoints(draft.start, workspacePoint));
        setSelectionBoxDraft({
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
          pageId: draft.pageId,
        });
      }}
      onPointerUp={(event) => {
        const draft = selectionDragRef.current;
        if (!draft) {
          return;
        }

        if (stageRef.current?.container().hasPointerCapture(event.evt.pointerId)) {
          stageRef.current.container().releasePointerCapture(event.evt.pointerId);
        }

        commitSelectionDraft();
      }}
      onPointerCancel={(event) => {
        const draft = selectionDragRef.current;
        if (!draft) {
          return;
        }

        if (stageRef.current?.container().hasPointerCapture(event.evt.pointerId)) {
          stageRef.current.container().releasePointerCapture(event.evt.pointerId);
        }

        clearSelectionDraft();
      }}
    >
      <Layer name="backgroundLayer" listening={false}>
        <Rect x={0} y={0} width={workspaceLayout.width} height={workspaceLayout.height} fill="#eef2f7" />
        {workspaceSettings.gridEnabled ? (
          <Group {...viewportTransform} listening={false} name="workspaceGridRoot">
            {workspaceLayout.pages.map((page) => (
              <WorkspaceGrid key={`grid-${page.id}`} page={page} gridSize={workspaceSettings.gridSize} />
            ))}
          </Group>
        ) : null}
      </Layer>

      <Layer name="pageLayer" listening={false}>
        <Group {...viewportTransform} name="pageLayerRoot" listening={false}>
          {workspaceLayout.pages.map((page) => (
            <PageSurface key={page.id} page={page} active={page.id === activePageId} />
          ))}
        </Group>
      </Layer>

      <Layer name="contentLayer">
        <Group {...viewportTransform} name="contentLayerRoot">
          {renderTree.pages.map((pageNode, index) => {
            const pageLayout = pageLayoutsById.get(pageNode.id) ?? workspaceLayout.pages[index] ?? workspaceLayout.pages[0];
            if (!pageLayout) {
              return null;
            }

            const userLayerGroups = groupNodesByUserLayer(pageNode.children);

            return (
              <Group key={pageNode.id} name={`PageGroup:${pageNode.id}`} x={pageLayout.x} y={pageLayout.y}>
                {userLayerGroups.map((group) => (
                  <Group key={group.id} name={`UserLayerGroup:${group.id}`} x={0} y={0}>
                    {group.nodes.map((node) => (
                      <KonvaRenderNode
                        key={node.id}
                        node={node}
                        canSelect={canSelect}
                        activeCanvasTool={activeCanvasTool}
                        onSelectElement={handleSelectElement}
                        onDeleteElements={handleDeleteElements}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </Group>
                ))}
              </Group>
            );
          })}
        </Group>
      </Layer>

      <Layer name="guideLayer" listening={false}>
        <Group {...viewportTransform} name="guideLayerRoot" listening={false}>
          {workspaceSettings.guidesVisible && workspaceSettings.marginsVisible
            ? workspaceLayout.pages.map((page) => <PageMarginGuides key={`margins-${page.id}`} page={page} />)
            : null}
          {draftCanvasCreation ? <DraftPreview draft={draftCanvasCreation} pageLayout={pageLayoutsById.get(draftCanvasCreation.pageId)} /> : null}
        </Group>
      </Layer>

      <Layer name="interactionLayer">
        <Group {...viewportTransform} name="interactionLayerRoot">
          {selectedElementIds.length > 1
            ? selectedContourBoxes.map((entry) => (
                <SelectedContourBox key={`selected-${entry.pageId}`} bounds={entry.bounds} />
              ))
            : null}
          {selectionBoxDraft ? (
            <Rect
              x={selectionBoxDraft.x}
              y={selectionBoxDraft.y}
              width={selectionBoxDraft.width}
              height={selectionBoxDraft.height}
              fill="rgba(37, 99, 235, 0.10)"
              stroke="#2563eb"
              strokeWidth={1.5}
              dash={[6, 3]}
              listening={false}
            />
          ) : null}
          <Transformer
            ref={transformerRef}
            rotateEnabled={canRotateSelection}
            resizeEnabled={canResizeSelection}
            flipEnabled={false}
            keepRatio={enableShiftKeepRatio}
            centeredScaling={false}
            anchorSize={8}
            borderStroke="#2563eb"
            borderStrokeWidth={1.5}
            anchorFill="#ffffff"
            anchorStroke="#2563eb"
            anchorCornerRadius={2}
            shouldOverdrawWholeArea={false}
            onTransformStart={handleTransformStart}
            onTransformEnd={handleTransformEnd}
            enabledAnchors={canResizeSelection ? [...ALL_TRANSFORM_ANCHORS] : []}
            boundBoxFunc={(oldBox, newBox) => {
              if (!canResizeSelection) {
                return newBox;
              }

              if (newBox.width < 1 || newBox.height < 1) {
                return oldBox;
              }

              return newBox;
            }}
          />
        </Group>
      </Layer>
    </Stage>
  );
}

function SelectedContourBox({
  bounds,
}: {
  bounds: { x: number; y: number; width: number; height: number };
}) {
  return (
    <Rect
      x={bounds.x}
      y={bounds.y}
      width={Math.max(bounds.width, 1)}
      height={Math.max(bounds.height, 1)}
      fill="transparent"
      stroke="#2563eb"
      strokeWidth={1.5}
      dash={[6, 3]}
      listening={false}
      strokeScaleEnabled={false}
      perfectDrawEnabled={false}
    />
  );
}

function KonvaRenderNode({
  node,
  canSelect,
  activeCanvasTool,
  onSelectElement,
  onDeleteElements,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  node: RenderNode;
  canSelect: boolean;
  activeCanvasTool: CanvasToolId;
  onSelectElement: (elementIds: string[], options?: { additive?: boolean }) => void;
  onDeleteElements: (elementIds: string[]) => void;
  onDragStart: (node: RenderNode) => void;
  onDragMove: () => void;
  onDragEnd: (node: RenderNode) => void;
}) {
  if (!node.visible) {
    return null;
  }

  const selectable = canSelect && isSelectableNode(node);
  const draggable = selectable;
  const canErase = activeCanvasTool === "eraser" && isSelectableNode(node);
  const interactionProps: NodeInteractionProps = canErase
    ? {
        onClick: (event) => {
          event.cancelBubble = true;
          onDeleteElements([node.id]);
        },
        onTap: (event) => {
          event.cancelBubble = true;
          onDeleteElements([node.id]);
        },
      }
    : selectable
    ? {
        onClick: (event) => onSelectElement([node.id], { additive: isAdditiveSelectionEvent(event.evt) }),
        onTap: () => onSelectElement([node.id], { additive: false }),
      }
    : {};
  const dragProps: NodeInteractionProps = draggable
    ? {
        draggable: true,
        onDragStart: () => {
          onDragStart(node);
        },
        onDragMove: () => onDragMove(),
        onDragEnd: () => onDragEnd(node),
      }
    : {};
  const transformProps: NodeInteractionProps = {};

  if (node.type === "text") {
    return (
      <>
        <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
        <Text id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...getKonvaTextProps(node)} {...interactionProps} {...dragProps} {...transformProps} />
      </>
    );
  }

  if (node.type === "rich-text") {
    return <RichTextPlaceholderNode node={node} selectable={selectable} interactionProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
  }

  if (node.type === "image") {
    return <LoadedKonvaImage node={node} selectProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
  }

  if (node.type === "shape") {
    const svgSource = getRenderableSvgSource(node);
    if (svgSource) {
      return <LoadedKonvaImage node={node} sourceOverride={svgSource} selectProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
    }

    const shapeProps = getKonvaShapeProps(node);

    if (shapeProps.shape === "circle") {
      return (
        <>
          <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
          <Circle id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.circle} {...interactionProps} {...dragProps} {...transformProps} />
        </>
      );
    }

    if (shapeProps.shape === "ellipse") {
      return (
        <>
          <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
          <Ellipse id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.ellipse} {...interactionProps} {...dragProps} {...transformProps} />
        </>
      );
    }

    if (shapeProps.shape === "line") {
      return (
        <>
          <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
          <Line id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.line} {...interactionProps} {...dragProps} {...transformProps} />
        </>
      );
    }

    if (shapeProps.shape === "polygon") {
      return (
        <>
          <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
          <Line
            id={node.id}
            name={`RenderNode:${node.id}`}
            selectable={selectable}
            locked={node.locked}
            x={shapeProps.polygon.x}
            y={shapeProps.polygon.y}
            points={shapeProps.polygon.points}
            closed={true}
            fill={shapeProps.polygon.fill}
            stroke={shapeProps.polygon.stroke}
            strokeWidth={shapeProps.polygon.strokeWidth}
            opacity={shapeProps.polygon.opacity}
            rotation={shapeProps.polygon.rotation}
            {...interactionProps}
            {...dragProps}
            {...transformProps}
          />
        </>
      );
    }

    if (shapeProps.shape === "polyline") {
      return (
        <>
          <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
          <Line
            id={node.id}
            name={`RenderNode:${node.id}`}
            selectable={selectable}
            locked={node.locked}
            x={shapeProps.polyline.x}
            y={shapeProps.polyline.y}
            points={shapeProps.polyline.points}
            fill={shapeProps.polyline.fill}
            stroke={shapeProps.polyline.stroke}
            strokeWidth={shapeProps.polyline.strokeWidth}
            opacity={shapeProps.polyline.opacity}
            rotation={shapeProps.polyline.rotation}
            {...interactionProps}
            {...dragProps}
            {...transformProps}
          />
        </>
      );
    }

    if (shapeProps.shape === "curve") {
      return (
        <>
          <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
          <Line
            id={node.id}
            name={`RenderNode:${node.id}`}
            selectable={selectable}
            locked={node.locked}
            x={shapeProps.curve.x}
            y={shapeProps.curve.y}
            points={shapeProps.curve.points}
            tension={shapeProps.curve.tension}
            fill={shapeProps.curve.fill}
            stroke={shapeProps.curve.stroke}
            strokeWidth={shapeProps.curve.strokeWidth}
            opacity={shapeProps.curve.opacity}
            rotation={shapeProps.curve.rotation}
            {...interactionProps}
            {...dragProps}
            {...transformProps}
          />
        </>
      );
    }

    if (shapeProps.shape === "arc") {
      return <ArcKonvaNode id={node.id} frame={node.frame} shapeProps={shapeProps.arc} selectable={selectable} locked={node.locked} interactionProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
    }

    return (
      <>
        <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} />
        <Rect id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.rect} {...interactionProps} {...dragProps} {...transformProps} />
      </>
    );
  }

  if (node.type === "table") {
    return (
      <TablePlaceholderNode
        node={node}
        selectable={selectable}
        interactionProps={interactionProps}
        dragProps={dragProps}
        transformProps={transformProps}
      />
    );
  }

  if (node.type === "list") {
    return (
      <ListPlaceholderNode
        node={node}
        selectable={selectable}
        interactionProps={interactionProps}
        dragProps={dragProps}
        transformProps={transformProps}
      />
    );
  }

  return null;
}

function ArcKonvaNode({
  id,
  frame,
  shapeProps,
  selectable,
  locked,
  interactionProps,
  dragProps,
  transformProps,
}: {
  id: string;
  frame: { x: number; y: number; width: number; height: number };
  shapeProps: {
    x: number;
    y: number;
    radiusX: number;
    radiusY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    arcType: "open" | "pie";
    arcSweep: 1 | -1;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    rotation: number;
  };
  selectable: boolean;
  locked: boolean;
  interactionProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const startAngle = (shapeProps.startAngle * Math.PI) / 180;
  const endAngle = (shapeProps.endAngle * Math.PI) / 180;
  const anticlockwise = shapeProps.arcSweep === -1;

  return (
    <Group
      id={id}
      name={`RenderNode:${id}`}
      selectable={selectable}
      locked={locked}
      x={frame.x}
      y={frame.y}
      rotation={shapeProps.rotation}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      <FrameOutlineRect frame={{ x: 0, y: 0, width: frame.width, height: frame.height }} rotation={0} />
      <Shape
        x={frame.width / 2}
        y={frame.height / 2}
        sceneFunc={(context, shape) => {
          context.beginPath();
          if (shapeProps.arcType === "pie") {
            const startX = shapeProps.radiusX * Math.cos(startAngle);
            const startY = shapeProps.radiusY * Math.sin(startAngle);
            context.moveTo(0, 0);
            context.lineTo(startX, startY);
            context.ellipse(0, 0, shapeProps.radiusX, shapeProps.radiusY, 0, startAngle, endAngle, anticlockwise);
            context.closePath();
          } else {
            context.ellipse(0, 0, shapeProps.radiusX, shapeProps.radiusY, 0, startAngle, endAngle, anticlockwise);
          }

          if (shapeProps.fill && shapeProps.fill !== "transparent") {
            context.fillStrokeShape(shape);
          } else {
            context.strokeShape(shape);
          }
        }}
        hitFunc={(context, shape) => {
          context.beginPath();
          if (shapeProps.arcType === "pie") {
            const startX = shapeProps.radiusX * Math.cos(startAngle);
            const startY = shapeProps.radiusY * Math.sin(startAngle);
            context.moveTo(0, 0);
            context.lineTo(startX, startY);
            context.ellipse(0, 0, shapeProps.radiusX, shapeProps.radiusY, 0, startAngle, endAngle, anticlockwise);
            context.closePath();
          } else {
            context.ellipse(0, 0, shapeProps.radiusX, shapeProps.radiusY, 0, startAngle, endAngle, anticlockwise);
          }
          context.fillStrokeShape(shape);
        }}
        fill={shapeProps.fill}
        stroke={shapeProps.stroke}
        strokeWidth={shapeProps.strokeWidth}
        opacity={shapeProps.opacity}
      />
    </Group>
  );
}

function TablePlaceholderNode({
  node,
  selectable,
  interactionProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  selectable: boolean;
  interactionProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const rows = Math.max(2, propNumber(node.props, "rows") ?? 3);
  const columns = Math.max(2, propNumber(node.props, "columns") ?? 3);
  const headerRow = propBoolean(node.props, "headerRow");
  const cellWidth = Math.max(node.frame.width / columns, 1);
  const cellHeight = Math.max(node.frame.height / rows, 1);

  return (
    <Group
      id={node.id}
      name={`RenderNode:${node.id}`}
      selectable={selectable}
      locked={node.locked}
      x={node.frame.x}
      y={node.frame.y}
      width={node.frame.width}
      height={node.frame.height}
      rotation={node.rotation ?? 0}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      <FrameOutlineRect frame={{ x: 0, y: 0, width: node.frame.width, height: node.frame.height }} rotation={0} />
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} cornerRadius={2} />
      {headerRow ? <Rect x={0} y={0} width={node.frame.width} height={cellHeight} fill="rgba(148, 163, 184, 0.12)" cornerRadius={2} /> : null}
      {Array.from({ length: rows - 1 }, (_, index) => index + 1).map((row) => (
        <Line key={`table-row-${node.id}-${row}`} points={[0, row * cellHeight, node.frame.width, row * cellHeight]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
      ))}
      {Array.from({ length: columns - 1 }, (_, index) => index + 1).map((column) => (
        <Line key={`table-col-${node.id}-${column}`} points={[column * cellWidth, 0, column * cellWidth, node.frame.height]} stroke="#e2e8f0" strokeWidth={1} listening={false} />
      ))}
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => {
          const isHeader = row === 0 && headerRow;
          const label = isHeader ? `En-tête ${column + 1}` : `Texte ${row + 1}.${column + 1}`;
          const x = column * cellWidth + 8;
          const y = row * cellHeight + 6;
          return (
          <Text
            key={`table-cell-${node.id}-${row}-${column}`}
            x={x}
            y={y}
            width={Math.max(cellWidth - 16, 1)}
            height={Math.max(cellHeight - 12, 1)}
            text={label}
            fill={isHeader ? "#0f172a" : "#475569"}
            fontFamily="Inter"
            fontSize={isHeader ? 12 : 11}
            fontStyle={isHeader ? "bold" : "normal"}
            listening={false}
          />
        );
      }),
      )}
    </Group>
  );
}

function ListPlaceholderNode({
  node,
  selectable,
  interactionProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  selectable: boolean;
  interactionProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const title = propString(node.props, "label") ?? propString(node.props, "name") ?? "Preset dynamique";
  const presetType = propString(node.props, "presetType") ?? "PRESET";
  const mappedPath = propString(node.props, "mappedPath") ?? propString(node.props, "bindingId") ?? "";
  const sampleItemsCount = Math.max(propNumber(node.props, "sampleItemsCount") ?? 3, 1);
  const repeatable = propBoolean(node.props, "repeatable");
  const rows = Math.max(Math.min(sampleItemsCount, 4), 3);
  const headerHeight = 28;
  const bodyTop = headerHeight + 10;
  const bodyBottom = 10;
  const rowHeight = Math.max((node.frame.height - bodyTop - bodyBottom) / rows, 20);

  return (
    <Group
      id={node.id}
      name={`RenderNode:${node.id}`}
      selectable={selectable}
      locked={node.locked}
      x={node.frame.x}
      y={node.frame.y}
      width={node.frame.width}
      height={node.frame.height}
      rotation={node.rotation ?? 0}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      <FrameOutlineRect frame={{ x: 0, y: 0, width: node.frame.width, height: node.frame.height }} rotation={0} />
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} fill="#ffffff" stroke="#cbd5e1" strokeWidth={1} cornerRadius={4} />
      <Rect x={0} y={0} width={node.frame.width} height={headerHeight} fill="rgba(148, 163, 184, 0.12)" cornerRadius={4} />
      <Text x={10} y={6} width={Math.max(node.frame.width - 20, 1)} height={16} text={title} fill="#0f172a" fontFamily="Inter" fontSize={12} fontStyle="bold" listening={false} />
      <Text
        x={10}
        y={20}
        width={Math.max(node.frame.width - 20, 1)}
        height={12}
        text={mappedPath}
        fill="#64748b"
        fontFamily="Inter"
        fontSize={10}
        listening={false}
      />
      <Text
        x={Math.max(node.frame.width - 90, 10)}
        y={6}
        width={80}
        height={16}
        text={repeatable ? "Répétable" : "Bloc"}
        fill="#475569"
        fontFamily="Inter"
        fontSize={10}
        align="right"
        listening={false}
      />
      {Array.from({ length: rows }, (_, index) => {
        const y = bodyTop + index * rowHeight;
        const itemLabel = `Item ${index + 1}`;
        return (
          <Fragment key={`list-row-${node.id}-${index}`}>
            <Circle cx={14} cy={y + rowHeight / 2} radius={2.6} fill="#94a3b8" listening={false} />
            <Line x={0} y={0} points={[24, y + rowHeight - 1, node.frame.width - 10, y + rowHeight - 1]} stroke="rgba(203, 213, 225, 0.75)" strokeWidth={1} listening={false} />
            <Text
              x={26}
              y={y + 4}
              width={Math.max(node.frame.width - 36, 1)}
              height={Math.max(rowHeight - 8, 1)}
              text={itemLabel}
              fill="#0f172a"
              fontFamily="Inter"
              fontSize={11}
              listening={false}
            />
          </Fragment>
        );
      })}
      {sampleItemsCount > rows ? (
        <Text
          x={10}
          y={node.frame.height - 18}
          width={Math.max(node.frame.width - 20, 1)}
          height={12}
          text={`+${sampleItemsCount - rows} élément${sampleItemsCount - rows > 1 ? "s" : ""}`}
          fill="#64748b"
          fontFamily="Inter"
          fontSize={10}
          listening={false}
        />
      ) : null}
      <Text x={Math.max(node.frame.width - 90, 10)} y={node.frame.height - 18} width={80} height={12} text={presetType} fill="#94a3b8" fontFamily="Inter" fontSize={9} align="right" listening={false} />
    </Group>
  );
}

function RichTextPlaceholderNode({
  node,
  selectable,
  interactionProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  selectable: boolean;
  interactionProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const textProps = getKonvaTextProps(node);
  const padding = 8;

  return (
    <Group
      id={node.id}
      name={`RenderNode:${node.id}`}
      selectable={selectable}
      locked={node.locked}
      x={node.frame.x}
      y={node.frame.y}
      width={node.frame.width}
      height={node.frame.height}
      rotation={node.rotation ?? 0}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      <FrameOutlineRect frame={{ x: 0, y: 0, width: node.frame.width, height: node.frame.height }} rotation={0} />
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} fill="rgba(255,255,255,0.02)" stroke="#cbd5e1" strokeWidth={1} cornerRadius={2} />
      <Text
        {...textProps}
        x={padding}
        y={padding}
        width={Math.max(node.frame.width - padding * 2, 1)}
        height={Math.max(node.frame.height - padding * 2, 1)}
        rotation={0}
      />
    </Group>
  );
}

function LoadedKonvaImage({
  node,
  sourceOverride,
  selectProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  sourceOverride?: string;
  selectProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const imageProps = getKonvaImageProps(node);
  const loadedImage = useLoadedImage(sourceOverride ?? imageProps.src);

  if (!loadedImage) {
    return (
      <>
        <FrameOutlineRect frame={node.frame} rotation={imageProps.rotation} />
        <Rect
          id={node.id}
          name={`RenderNode:${node.id}`}
          x={imageProps.x}
          y={imageProps.y}
          width={imageProps.width}
          height={imageProps.height}
          fill="#f3f4f6"
          stroke="transparent"
          strokeWidth={1}
          rotation={imageProps.rotation}
          selectable={true}
          locked={node.locked}
          {...selectProps}
          {...dragProps}
          {...transformProps}
        />
      </>
    );
  }

  return (
    <>
      <FrameOutlineRect frame={node.frame} rotation={imageProps.rotation} />
      <KonvaImage
        id={node.id}
        name={`RenderNode:${node.id}`}
        selectable={true}
        locked={node.locked}
        image={loadedImage}
        x={imageProps.x}
        y={imageProps.y}
        width={imageProps.width}
        height={imageProps.height}
        opacity={imageProps.opacity}
        rotation={imageProps.rotation}
        {...selectProps}
        {...dragProps}
        {...transformProps}
      />
    </>
  );
}

function FrameOutlineRect({
  frame,
  rotation,
}: {
  frame: { x: number; y: number; width: number; height: number };
  rotation: number;
}) {
  return (
    <Rect
      x={frame.x}
      y={frame.y}
      width={frame.width}
      height={frame.height}
      fillEnabled={false}
      stroke="#cbd5e1"
      strokeOpacity={0.85}
      strokeWidth={1}
      rotation={rotation}
      listening={false}
      strokeScaleEnabled={false}
      perfectDrawEnabled={false}
      cornerRadius={2}
    />
  );
}

function WorkspaceGrid({ page, gridSize }: { page: WorkspacePageLayout; gridSize: number }) {
  if (gridSize <= 0) {
    return null;
  }

  const minorStroke = "rgba(148, 163, 184, 0.08)";
  const majorStroke = "rgba(148, 163, 184, 0.16)";
  const majorEvery = gridSize * 5;

  return (
    <Group x={page.x} y={page.y} listening={false} name={`WorkspaceGrid:${page.id}`}>
      {Array.from({ length: Math.floor(page.width / gridSize) + 1 }, (_, index) => index * gridSize).map((x) => (
        <Line
          key={`grid-v-${page.id}-${x}`}
          points={[x, 0, x, page.height]}
          stroke={x % majorEvery === 0 ? majorStroke : minorStroke}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {Array.from({ length: Math.floor(page.height / gridSize) + 1 }, (_, index) => index * gridSize).map((y) => (
        <Line
          key={`grid-h-${page.id}-${y}`}
          points={[0, y, page.width, y]}
          stroke={y % majorEvery === 0 ? majorStroke : minorStroke}
          strokeWidth={1}
          listening={false}
        />
      ))}
    </Group>
  );
}

function PageSurface({ page, active }: { page: WorkspacePageLayout; active: boolean }) {
  return (
    <Group x={page.x} y={page.y} listening={false} name={`PageSurface:${page.id}`}>
      <Rect
        x={0}
        y={0}
        width={page.width}
        height={page.height}
        fill="#ffffff"
        cornerRadius={2}
        stroke={active ? "#5b4dff" : "#d1d9e4"}
        strokeWidth={1}
        shadowColor="rgba(15, 23, 42, 0.18)"
        shadowBlur={24}
        shadowOffsetX={0}
        shadowOffsetY={18}
        shadowOpacity={1}
        listening={false}
      />
    </Group>
  );
}

function PageMarginGuides({ page }: { page: WorkspacePageLayout }) {
  const width = Math.max(page.width - page.margin.left - page.margin.right, 1);
  const height = Math.max(page.height - page.margin.top - page.margin.bottom, 1);

  return (
    <Group x={page.x} y={page.y} listening={false} name={`MarginGuide:${page.id}`}>
      <Rect
        x={page.margin.left}
        y={page.margin.top}
        width={width}
        height={height}
        fillEnabled={false}
        stroke="#d946ef"
        strokeWidth={1}
        dash={[6, 4]}
        opacity={0.7}
        listening={false}
      />
    </Group>
  );
}

function DraftPreview({ draft, pageLayout }: { draft: CanvasToolDraft; pageLayout: WorkspacePageLayout | undefined }) {
  if (!pageLayout) {
    return null;
  }

  const { frame, toolId } = draft;
  const points = draft.points ?? [];
  const previewPoints = draft.current && points.length > 0
    ? [...points.flatMap((point) => [point.x, point.y]), draft.current.x, draft.current.y]
    : points.flatMap((point) => [point.x, point.y]);

  return (
    <Group x={pageLayout.x} y={pageLayout.y} listening={false} name={`DraftPreview:${draft.pageId}`}>
      {toolId === "rectangle" ? (
        <Rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} fill="rgba(59, 130, 246, 0.08)" stroke="#2563eb" strokeWidth={2} dash={[6, 3]} listening={false} />
      ) : null}
      {toolId === "circle" ? (
        <Ellipse
          x={frame.x + frame.width / 2}
          y={frame.y + frame.height / 2}
          radiusX={Math.max(frame.width / 2, 1)}
          radiusY={Math.max(frame.height / 2, 1)}
          fill="rgba(59, 130, 246, 0.08)"
          stroke="#2563eb"
          strokeWidth={2}
          dash={[6, 3]}
          listening={false}
        />
      ) : null}
      {isArcToolId(toolId) ? (
        (() => {
          const geometry = resolveArcGeometryDraft(toolId, points, null, draft.current);
          if (!geometry) {
            if (points.length === 1 && draft.current) {
              return (
                <Line
                  points={[points[0].x, points[0].y, draft.current.x, draft.current.y]}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dash={[6, 3]}
                  fillEnabled={false}
                  listening={false}
                />
              );
            }

            return null;
          }

          return (
            <Shape
              sceneFunc={(context, shape) => {
                context.beginPath();
                drawArcPreviewPath(context, geometry);
                if (geometry.arcType === "pie") {
                  context.fillStrokeShape(shape);
                  return;
                }

                context.strokeShape(shape);
              }}
              hitFunc={(context, shape) => {
                context.beginPath();
                drawArcPreviewPath(context, geometry);
                context.fillStrokeShape(shape);
              }}
              stroke="#2563eb"
              strokeWidth={2}
              dash={[6, 3]}
              fill={geometry.arcType === "pie" ? "rgba(59, 130, 246, 0.08)" : undefined}
              fillEnabled={geometry.arcType === "pie"}
              listening={false}
            />
          );
        })()
      ) : null}
      {toolId === "arrows" ? (
        <Line
          points={[draft.start.x, draft.start.y, draft.current.x, draft.current.y]}
          stroke="#2563eb"
          strokeWidth={2}
          dash={[6, 3]}
          pointerAtEnding={false}
          pointerLength={8}
          pointerWidth={8}
          listening={false}
        />
      ) : null}
      {toolId === "segments" ? (
        <Line
          points={previewPoints}
          stroke="#2563eb"
          strokeWidth={2}
          dash={[6, 3]}
          fill="transparent"
          tension={0}
          listening={false}
        />
      ) : null}
      {toolId === "polygon" ? (
        <Line
          points={previewPoints}
          stroke="#2563eb"
          strokeWidth={2}
          dash={[6, 3]}
          closed={points.length >= 3}
          fill="rgba(59, 130, 246, 0.08)"
          tension={0}
          listening={false}
        />
      ) : null}
      {(toolId === "freehand" || toolId === "curves") ? (
        <Line
          points={previewPoints}
          stroke="#2563eb"
          strokeWidth={2}
          dash={[6, 3]}
          tension={toolId === "curves" ? 0.5 : 0.35}
          fill="transparent"
          listening={false}
        />
      ) : null}
      {(toolId === "richtext" || toolId === "table") ? (
        <Rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} fill="rgba(59, 130, 246, 0.06)" stroke="#2563eb" strokeWidth={2} dash={[6, 3]} listening={false} />
      ) : null}
    </Group>
  );
}

function drawArcPreviewPath(
  context: Konva.Context,
  geometry: {
    frame: { x: number; y: number; width: number; height: number };
    startAngle: number;
    endAngle: number;
    sweep: 1 | -1;
    arcType: "open" | "pie";
  },
) {
  const cx = geometry.frame.x + geometry.frame.width / 2;
  const cy = geometry.frame.y + geometry.frame.height / 2;
  const rx = Math.max(geometry.frame.width / 2, 1);
  const ry = Math.max(geometry.frame.height / 2, 1);
  const start = (geometry.startAngle * Math.PI) / 180;
  const end = (geometry.endAngle * Math.PI) / 180;
  const anticlockwise = geometry.sweep === -1;

  if (geometry.arcType === "pie") {
    const startX = cx + rx * Math.cos(start);
    const startY = cy + ry * Math.sin(start);
    context.moveTo(cx, cy);
    context.lineTo(startX, startY);
  }

  context.ellipse(cx, cy, rx, ry, 0, start, end, anticlockwise);

  if (geometry.arcType === "pie") {
    context.closePath();
  }
}

function useLoadedImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const resolvedSrc = normalizeRenderableImageSource(src);
    if (!resolvedSrc) {
      return;
    }

    let cancelled = false;
    const nextImage = new window.Image();
    if (!resolvedSrc.startsWith("data:") && !resolvedSrc.startsWith("blob:")) {
      nextImage.crossOrigin = "anonymous";
    }
    nextImage.onload = () => {
      if (!cancelled) {
        setImage(nextImage);
      }
    };
    nextImage.onerror = () => {
      if (!cancelled) {
        setImage(null);
      }
    };
    nextImage.src = resolvedSrc;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return normalizeRenderableImageSource(src) ? image : null;
}

function getRenderableSvgSource(node: RenderNode) {
  const svg = propString(node.props, "svg");
  const src = propString(node.props, "src");
  return normalizeRenderableImageSource(svg ?? src ?? "");
}

function normalizeRenderableImageSource(source: string) {
  const trimmed = source.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("<svg")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

const ALL_TRANSFORM_ANCHORS = ["top-left", "top-center", "top-right", "middle-right", "middle-left", "bottom-left", "bottom-center", "bottom-right"] as const;

function getNextSelectionIds(input: {
  currentSelection: string[];
  renderNodeById: Map<string, { node: RenderNode; pageId: string }>;
  elementIds: string[];
  additive: boolean;
}) {
  if (!input.additive) {
    return input.elementIds;
  }

  const currentPageId = input.currentSelection
    .map((id) => input.renderNodeById.get(id)?.pageId)
    .find((pageId): pageId is string => Boolean(pageId));

  const targetPageIds = new Set(
    input.elementIds.map((id) => input.renderNodeById.get(id)?.pageId).filter((pageId): pageId is string => Boolean(pageId)),
  );

  if (currentPageId && targetPageIds.size > 0 && (!targetPageIds.has(currentPageId) || targetPageIds.size > 1)) {
    return input.elementIds;
  }

  const nextSelection = new Set(input.currentSelection);
  input.elementIds.forEach((elementId) => {
    if (nextSelection.has(elementId)) {
      nextSelection.delete(elementId);
      return;
    }

    nextSelection.add(elementId);
  });

  return [...nextSelection];
}

function isAdditiveSelectionEvent(event: MouseEvent | PointerEvent | TouchEvent) {
  return "shiftKey" in event && (event.shiftKey || "metaKey" in event && event.metaKey || "ctrlKey" in event && event.ctrlKey);
}

function isSelectableEventTarget(target: Konva.Node) {
  return target.getAttr("selectable") === true;
}

function isTransformableKonvaNode(node: Konva.Node) {
  return node.getAttr("selectable") === true && node.isVisible() && node.getAttr("locked") !== true;
}

function allowsProportionalResize(node: RenderNode | null) {
  if (!node) {
    return false;
  }

  if (node.type === "image" || node.type === "rich-text" || node.type === "text") {
    return true;
  }

  if (node.type !== "shape") {
    return false;
  }

  const shape = propString(node.props, "shape");
  return shape === "rect" || shape === "circle" || shape === "ellipse" || shape === "line" || shape === "polygon" || shape === "polyline" || shape === "curve";
}

function groupNodesByUserLayer(nodes: RenderNode[]) {
  const groups = new Map<string, { id: string; order: number; nodes: RenderNode[] }>();

  nodes.forEach((node) => {
    const descriptor = resolveNodeLayerDescriptor(node);
    const groupId = descriptor.id;
    const group = groups.get(groupId);

    if (group) {
      group.nodes.push(node);
      group.order = Math.min(group.order, descriptor.order);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      order: descriptor.order,
      nodes: [node],
    });
  });

  return [...groups.values()].sort((a, b) => a.order - b.order);
}

function resolveNodeLayerDescriptor(node: RenderNode) {
  const layerId = propString(node.props, "layerId") ?? propString(node.props, "layerName");
  const layerName = propString(node.props, "layerName") ?? layerId ?? "default";
  const layerOrder = propNumber(node.props, "layerOrder") ?? node.zIndex;

  return {
    id: layerId ?? `layer:${layerName}`,
    name: layerName,
    order: layerOrder,
  };
}

function resolveCommittedFrame(
  renderNode: RenderNode,
  konvaNode: Konva.Node,
  override?: Partial<{ x: number; y: number }>,
) {
  const baseFrame = renderNode.frame;
  const rawWidth = Math.abs(konvaNode.width());
  const rawHeight = Math.abs(konvaNode.height());
  const width = Math.max(1, Math.abs((rawWidth > 1 ? rawWidth : baseFrame.width) * konvaNode.scaleX()));
  const height = Math.max(1, Math.abs((rawHeight > 1 ? rawHeight : baseFrame.height) * konvaNode.scaleY()));
  const anchorMode = getRenderNodeAnchorMode(renderNode);
  const rawX = override?.x ?? konvaNode.x();
  const rawY = override?.y ?? konvaNode.y();
  const x = anchorMode === "center" ? rawX - width / 2 : rawX;
  const y = anchorMode === "center" ? rawY - height / 2 : rawY;

  return {
    x,
    y,
    width: width > 1 ? width : baseFrame.width,
    height: height > 1 ? height : baseFrame.height,
  };
}

function resolveScaledShapePoints(renderNode: RenderNode, nextFrame: { x: number; y: number; width: number; height: number }) {
  if (renderNode.type !== "shape") {
    return null;
  }

  const shape = propString(renderNode.props, "shape");
  if (shape !== "line" && shape !== "polygon" && shape !== "polyline" && shape !== "curve") {
    return null;
  }

  const sourcePoints = propNumberArray(renderNode.props, "points");
  const points = sourcePoints && sourcePoints.length >= 4 ? sourcePoints : [0, 0, renderNode.frame.width, renderNode.frame.height];
  const scaleX = renderNode.frame.width > 0 ? nextFrame.width / renderNode.frame.width : 1;
  const scaleY = renderNode.frame.height > 0 ? nextFrame.height / renderNode.frame.height : 1;

  return points.map((value, index) => (index % 2 === 0 ? value * scaleX : value * scaleY));
}

function getRenderNodeAnchorMode(renderNode: RenderNode): "center" | "origin" {
  if (renderNode.type !== "shape") {
    return "origin";
  }

  const shape = propString(renderNode.props, "shape");
  return shape === "circle" || shape === "ellipse" ? "center" : "origin";
}

function getRenderNodeTransformAnchorPoint(
  renderNode: RenderNode,
  anchorMode: "center" | "origin",
) {
  return anchorMode === "center"
    ? {
        x: renderNode.frame.x + renderNode.frame.width / 2,
        y: renderNode.frame.y + renderNode.frame.height / 2,
      }
    : {
        x: renderNode.frame.x,
        y: renderNode.frame.y,
      };
}

function getElementIdsWithinSelectionRect(input: {
  selectionRect: { x: number; y: number; width: number; height: number };
  pageLayout: WorkspacePageLayout;
  renderTree: CanonicalRenderTree;
}) {
  const page = input.renderTree.pages.find((candidatePage) => candidatePage.id === input.pageLayout.id);
  if (!page) {
    return [];
  }

  return page.children
    .filter((node) => isSelectableNode(node) && !node.locked)
    .filter((node) => rectIntersects(input.selectionRect, translateFrameToWorkspace(node.frame, input.pageLayout)))
    .map((node) => node.id);
}

function translateFrameToWorkspace(frame: { x: number; y: number; width: number; height: number }, pageLayout: WorkspacePageLayout) {
  return {
    x: pageLayout.x + frame.x,
    y: pageLayout.y + frame.y,
    width: frame.width,
    height: frame.height,
  };
}

function getWorkspaceSelectionBounds(node: RenderNode, pageLayout: WorkspacePageLayout) {
  const rotation = normalizeAngle(node.rotation ?? 0);
  if (Math.abs(rotation) < 0.001) {
    return translateFrameToWorkspace(node.frame, pageLayout);
  }

  const anchorMode = getRenderNodeAnchorMode(node);
  const anchorPoint = getRenderNodeTransformAnchorPoint(node, anchorMode);
  const corners = [
    { x: node.frame.x, y: node.frame.y },
    { x: node.frame.x + node.frame.width, y: node.frame.y },
    { x: node.frame.x + node.frame.width, y: node.frame.y + node.frame.height },
    { x: node.frame.x, y: node.frame.y + node.frame.height },
  ];

  const rotatedCorners = corners.map((corner) => rotatePointAroundPoint(corner, anchorPoint, rotation));
  const minX = Math.min(...rotatedCorners.map((point) => point.x));
  const minY = Math.min(...rotatedCorners.map((point) => point.y));
  const maxX = Math.max(...rotatedCorners.map((point) => point.x));
  const maxY = Math.max(...rotatedCorners.map((point) => point.y));
  const bounds = {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };

  return translateFrameToWorkspace(bounds, pageLayout);
}

function normalizeAngle(angle: number) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function rectIntersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function normalizeRect(frame: { x: number; y: number; width: number; height: number }) {
  return {
    x: Math.min(frame.x, frame.x + frame.width),
    y: Math.min(frame.y, frame.y + frame.height),
    width: Math.max(Math.abs(frame.width), 1),
    height: Math.max(Math.abs(frame.height), 1),
  };
}

function isApproximatelyOne(value: number) {
  return Math.abs(value - 1) < 0.0001;
}

function rotatePointAroundPoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  rotationDegrees: number,
) {
  const radians = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const offsetX = point.x - center.x;
  const offsetY = point.y - center.y;
  return {
    x: center.x + offsetX * cos - offsetY * sin,
    y: center.y + offsetX * sin + offsetY * cos,
  };
}

function makeFrameFromPoints(start: { x: number; y: number }, current: { x: number; y: number }) {
  return {
    x: Math.min(start.x, current.x),
    y: Math.min(start.y, current.y),
    width: Math.max(Math.abs(current.x - start.x), 1),
    height: Math.max(Math.abs(current.y - start.y), 1),
  };
}

function distanceBetweenPoints(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function resolveKonvaWorkspacePointer(
  event: Konva.KonvaEventObject<PointerEvent>,
  viewport: WorkspaceViewport,
) {
  const stage = event.target.getStage();
  const rect = stage?.container().getBoundingClientRect();
  if (!rect) {
    return null;
  }

  return convertClientPointToWorkspacePoint({ x: event.evt.clientX, y: event.evt.clientY }, rect, viewport);
}

function propString(props: RenderNode["props"], key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

function propNumberArray(props: RenderNode["props"], key: string): number[] | undefined {
  const value = props[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined;
}

function propNumber(props: RenderNode["props"], key: string): number | undefined {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
}

function propBoolean(props: RenderNode["props"], key: string): boolean {
  return props[key] === true;
}
