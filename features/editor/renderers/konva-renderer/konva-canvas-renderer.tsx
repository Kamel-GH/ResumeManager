"use client";

import Konva from "konva";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type DragEvent as ReactDragEvent } from "react";
import type { JSONContent } from "@tiptap/core";
import {
  Circle as CircleImpl,
  Ellipse as EllipseImpl,
  Group as GroupImpl,
  Image as KonvaImageImpl,
  Layer as LayerImpl,
  Line as LineImpl,
  Path as PathImpl,
  Rect as RectImpl,
  Shape as ShapeImpl,
  Stage as StageImpl,
  Text as TextImpl,
  Transformer as TransformerImpl,
} from "react-konva";

import { isArcToolId, resolveArcGeometryDraft, type CanvasToolDraft, type CanvasToolId } from "@/features/editor/schema/canvas-insertion";
import type { CanvasObjectAlignmentAction, CanvasObjectOrderAction } from "@/features/editor/schema/canvas-mutation";
import type { CanonicalRenderTree, RenderNode } from "@/features/editor/schema/render-tree";
import type { EditorWorkspaceSettings, WorkspaceLayout, WorkspacePageLayout, WorkspaceViewport } from "@/features/editor/schema/workspace-layout";
import { convertClientPointToWorkspacePoint, findWorkspacePageAtPoint, snapWorkspaceFrame, snapWorkspacePoint } from "@/features/editor/schema/workspace-layout";
import { CanvasSelectionActionBar } from "@/features/editor/components/parts/canvas-selection-action-bar";
import { RichTextEditorPanel } from "@/features/editor/components/parts/rich-text-editor-panel";
import { ImageEditButton } from "@/features/editor/components/image-editing/image-edit-button";
import { ImageEditorDialog } from "@/features/editor/components/image-editing/image-editor-dialog";
import type { ImageEditingState } from "@/features/editor/components/image-editing/image-editor-types";
import { buildVariableDragOperationLog, parseEditorItemDragPayload } from "@/features/data-mapping/lib/variable-display";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import {
  PageMarginGuides,
  PageSurface,
  SelectedContourBox,
  WorkspaceGrid,
} from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer-overlays";
import { DraftPreview } from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer-draft-preview";
import {
  ArcKonvaNode,
  FrameOutlineRect,
  ListPlaceholderNode,
  LoadedKonvaImage,
  RichTextPlaceholderNode,
  TablePlaceholderNode,
} from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer-nodes";
import {
  ALL_TRANSFORM_ANCHORS,
  allowsProportionalResize,
  buildRichTextCanvasBlockStyle,
  buildRichTextContentStyle,
  distanceBetweenPoints,
  getElementIdsWithinSelectionRect,
  getRenderableSvgSource,
  getNextSelectionIds,
  getRenderNodeAnchorMode,
  getRenderNodeTransformAnchorPoint,
  getWorkspaceSelectionBounds,
  groupNodesByUserLayer,
  isAdditiveSelectionEvent,
  isCanonicalProjectedScale,
  isSelectableEventTarget,
  isTransformableKonvaNode,
  makeFrameFromPoints,
  normalizeRect,
  propBoolean,
  propNumber,
  propNumberArray,
  propString,
  resolveCommittedFrame,
  resolveKonvaWorkspacePointer,
  resolveRichTextCanvasHtml,
  resolveScaledShapePoints,
  rotatePointAroundPoint,
} from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer-geometry-helpers";
import {
  buildImageMaskPathData,
  getFilterPresetValues,
  hasImageMaskBorderChanges,
  resolveImageEditingFromProps,
  resolveImageMaskBorderPresentation,
  resolveImageMaskFrame,
} from "@/features/editor/components/image-editing/image-editor-utils";
import { serializeRichTextJsonToHtml, type RichTextVariableDisplayMode } from "@/features/editor/lib/rich-text-variable";
import { insertVariableTokenIntoRichTextHtml } from "@/features/editor/renderers/konva-renderer/rich-text-drop-utils";
import { useEditorStore } from "@/features/editor/stores/editor-store";

import {
  getKonvaImageProps,
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
  isTransformableNode,
  resolveCanonicalFrameFromProjectedGeometry,
  resolveDragSelectionIds,
  resolveSelectionOrderCapabilities,
  resolveSelectionActionBarPlacement,
  isSelectionBoxTool,
  shouldShowFrameOutline,
} from "@/features/editor/renderers/konva-renderer/konva-renderer-model";

type KonvaJsxComponent = ComponentType<Record<string, unknown>>;

const Stage = StageImpl as unknown as KonvaJsxComponent;
const Layer = LayerImpl as unknown as KonvaJsxComponent;
const Group = GroupImpl as unknown as KonvaJsxComponent;
const Rect = RectImpl as unknown as KonvaJsxComponent;
const Line = LineImpl as unknown as KonvaJsxComponent;
const Path = PathImpl as unknown as KonvaJsxComponent;
const Circle = CircleImpl as unknown as KonvaJsxComponent;
const Ellipse = EllipseImpl as unknown as KonvaJsxComponent;
const Text = TextImpl as unknown as KonvaJsxComponent;
const Shape = ShapeImpl as unknown as KonvaJsxComponent;
const Transformer = TransformerImpl as unknown as KonvaJsxComponent;
const KonvaImage = KonvaImageImpl as unknown as KonvaJsxComponent;

type KonvaTransformBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

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
  const [draggingElementIds, setDraggingElementIds] = useState<string[]>([]);
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
  const copyCanvasElements = useEditorStore((state) => state.copyCanvasElements);
  const pasteCanvasElements = useEditorStore((state) => state.pasteCanvasElements);
  const duplicateCanvasElements = useEditorStore((state) => state.duplicateCanvasElements);
  const reorderCanvasElements = useEditorStore((state) => state.reorderCanvasElements);
  const alignCanvasElements = useEditorStore((state) => state.alignCanvasElements);
  const flipCanvasElements = useEditorStore((state) => state.flipCanvasElements);
  const updateRichTextElementContent = useEditorStore((state) => state.updateRichTextElementContent);
  const updateImageElementEditing = useEditorStore((state) => state.updateImageElementEditing);
  const dragTraceContext = useEditorStore((state) => state.dragTraceContext);
  const appendOperationLogs = useEditorStore((state) => state.appendOperationLogs);
  const canvasClipboard = useEditorStore((state) => state.canvasClipboard);
  const variableDataset = useVariablesStore((state) => state.source?.rows[0] ?? null);
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
  const selectedEditableIds = useMemo(
    () =>
      selectedElementIds.filter((elementId) => {
        const entry = renderNodeById.get(elementId);
        return Boolean(entry && isSelectableNode(entry.node) && !entry.node.locked);
      }),
    [renderNodeById, selectedElementIds],
  );
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
  const canSelect = isSelectionBoxTool(activeCanvasTool);
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
  const selectionActionCapabilities = useMemo(
    () => resolveSelectionOrderCapabilities(renderTree, selectedEditableIds),
    [renderTree, selectedEditableIds],
  );
  const [selectionActionBarPlacement, setSelectionActionBarPlacement] = useState<{
    left: number;
    top: number;
    placement: "top" | "bottom";
  } | null>(null);
  const editingRichTextId = useEditorStore((state) => state.editingRichTextElementId);
  const setEditingRichTextId = useEditorStore((state) => state.setEditingRichTextElementId);
  const editingImageId = useEditorStore((state) => state.editingImageElementId);
  const setEditingImageId = useEditorStore((state) => state.setEditingImageElementId);
  const richTextDropTraceRef = useRef<{ sessionId: string; blockId: string } | null>(null);
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
  const richTextCanvasOverlays = useMemo(
    () =>
      renderTree.pages.flatMap((pageNode) => {
        const pageLayout = pageLayoutsById.get(pageNode.id);
        if (!pageLayout) {
          return [];
        }

        return pageNode.children
          .filter((node) => node.type === "rich-text")
          .map((node) => ({
            node,
            richTextDisplayMode: (propString(node.props, "richTextDisplayMode") as RichTextVariableDisplayMode | undefined) ?? "label",
            richTextJson:
              node.props?.richTextJson && typeof node.props.richTextJson === "object"
                ? (node.props.richTextJson as JSONContent)
                : null,
            style: {
              ...buildRichTextCanvasBlockStyle(node, pageLayout, viewport),
              pointerEvents: (dragTraceContext?.type === "variable" ? "auto" : "none") as CSSProperties["pointerEvents"],
              cursor: dragTraceContext?.type === "variable" ? "copy" : undefined,
            },
            contentStyle: buildRichTextContentStyle(node),
            html: resolveRichTextCanvasHtml(node, variableDataset),
          }));
      }),
    [dragTraceContext?.type, pageLayoutsById, renderTree.pages, variableDataset, viewport],
  );
  const selectedRichTextNode = useMemo(() => {
    if (selectedElementIds.length !== 1) {
      return null;
    }

    const node = renderNodeById.get(selectedElementIds[0])?.node ?? null;
    return node?.type === "rich-text" && !node.locked ? node : null;
  }, [renderNodeById, selectedElementIds]);
  const editingRichTextNode = useMemo(() => {
    if (!editingRichTextId) {
      return null;
    }

    const node = renderNodeById.get(editingRichTextId)?.node ?? null;
    return node?.type === "rich-text" && !node.locked ? node : null;
  }, [editingRichTextId, renderNodeById]);
  const selectedImageNode = useMemo(() => {
    if (selectedElementIds.length !== 1) {
      return null;
    }

    const node = renderNodeById.get(selectedElementIds[0])?.node ?? null;
    return node?.type === "image" && !node.locked ? node : null;
  }, [renderNodeById, selectedElementIds]);
  const editingImageNode = useMemo(() => {
    if (!editingImageId) {
      return null;
    }

    const node = renderNodeById.get(editingImageId)?.node ?? null;
    return node?.type === "image" && !node.locked ? node : null;
  }, [editingImageId, renderNodeById]);
  const richTextEditButtonPlacement = useMemo(() => {
    if (!selectedRichTextNode) {
      return null;
    }

    const pageLayout = pageLayoutsById.get(selectedRichTextNode.pageId);
    if (!pageLayout) {
      return null;
    }

    const bounds = getWorkspaceSelectionBounds(selectedRichTextNode, pageLayout);
    return {
      left: Math.max(8, bounds.x * viewport.zoom + viewport.panX + bounds.width * viewport.zoom - 34),
      top: Math.max(8, bounds.y * viewport.zoom + viewport.panY - 34),
    };
  }, [pageLayoutsById, selectedRichTextNode, viewport.panX, viewport.panY, viewport.zoom]);
  const imageEditButtonPlacement = useMemo(() => {
    if (!selectedImageNode) {
      return null;
    }

    const pageLayout = pageLayoutsById.get(selectedImageNode.pageId);
    if (!pageLayout) {
      return null;
    }

    const bounds = getWorkspaceSelectionBounds(selectedImageNode, pageLayout);
    return {
      left: Math.max(8, bounds.x * viewport.zoom + viewport.panX + bounds.width * viewport.zoom - 34),
      top: Math.max(8, bounds.y * viewport.zoom + viewport.panY - 34),
    };
  }, [pageLayoutsById, selectedImageNode, viewport.panX, viewport.panY, viewport.zoom]);
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
  const handleSaveRichTextContent = useCallback(
    (elementId: string, html: string, json: JSONContent, displayMode: RichTextVariableDisplayMode) => {
      const result = updateRichTextElementContent({ elementId, html, json, displayMode });
      if (!result.updated) {
        console.warn("[editor] rich text update rejected", result.reason);
        return;
      }

      setEditingRichTextId(null);
    },
    [updateRichTextElementContent],
  );
  const handleApplyImageEditing = useCallback(
    (elementId: string, imageEditing: ImageEditingState) => {
      const result = updateImageElementEditing({
        elementId,
        imageEditing: imageEditing as unknown as NonNullable<RenderNode["props"]>,
      });
      if (!result.updated) {
        console.warn("[editor] image update rejected", result.reason);
        return;
      }

      setEditingImageId(null);
    },
    [updateImageElementEditing],
  );
  const handleRichTextOverlayDragOver = useCallback(
    (node: RenderNode, pageId: string, event: ReactDragEvent<HTMLDivElement>) => {
      const dragContext = useEditorStore.getState().dragTraceContext;

      if (!dragContext || dragContext.type !== "variable") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";

      if (richTextDropTraceRef.current?.sessionId !== dragContext.sessionId || richTextDropTraceRef.current?.blockId !== node.id) {
        richTextDropTraceRef.current = { sessionId: dragContext.sessionId, blockId: node.id };
        appendOperationLogs([
          buildVariableDragOperationLog(dragContext, {
            action: "dragover",
            pageId,
            target: `Rich Text (${node.id})`,
            outcome: "survol",
          }),
        ]);
      }
    },
    [appendOperationLogs],
  );
  const handleRichTextOverlayDrop = useCallback(
    (node: RenderNode, pageId: string, event: ReactDragEvent<HTMLDivElement>) => {
      const dragContext = useEditorStore.getState().dragTraceContext;
      const raw = event.dataTransfer.getData("application/x-resume-editor-item");
      const parsedPayload = parseEditorItemDragPayload(raw);
      const payload = parsedPayload ?? (dragContext?.type === "variable" ? { type: "variable", payload: dragContext.payload, sourcePanel: dragContext.sourcePanel } : null);

      if (!dragContext || dragContext.type !== "variable") {
        richTextDropTraceRef.current = null;
        return false;
      }

      if (!payload || payload.type !== "variable") {
        event.preventDefault();
        event.stopPropagation();
        appendOperationLogs([
          buildVariableDragOperationLog(dragContext, {
            action: "drop-reject",
            pageId,
            target: `Rich Text (${node.id})`,
            outcome: "rejeté",
            reason: "payload manquant",
          }),
        ]);
        richTextDropTraceRef.current = null;
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      const html = propString(node.props, "html") ?? "<p></p>";
      const variablePayload = payload.payload as Parameters<typeof insertVariableTokenIntoRichTextHtml>[1];
      const nextHtml = insertVariableTokenIntoRichTextHtml(html, variablePayload);
      const result = updateRichTextElementContent({
        elementId: node.id,
        html: nextHtml,
        displayMode: (propString(node.props, "richTextDisplayMode") as RichTextVariableDisplayMode | undefined) ?? "label",
      });
      if (!result.updated) {
        appendOperationLogs([
          buildVariableDragOperationLog(dragContext, {
            action: "drop-reject",
            pageId,
            target: `Rich Text (${node.id})`,
            outcome: "rejeté",
            reason: result.reason,
          }),
        ]);
        richTextDropTraceRef.current = null;
        return false;
      }

      appendOperationLogs([
        buildVariableDragOperationLog(dragContext, {
          action: "drop",
          pageId,
          target: `Rich Text (${node.id})`,
          outcome: "accepté",
        }),
      ]);
      richTextDropTraceRef.current = null;
      return true;
    },
    [appendOperationLogs, updateRichTextElementContent],
  );
  const resolveRichTextOverlayEntryFromEvent = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      const directTarget = event.target;
      if (directTarget instanceof Element) {
        const directBlock = directTarget.closest(".ef-rich-text-canvas-block");
        const directBlockId = directBlock?.getAttribute("data-rich-text-block-id");
        if (directBlockId) {
          const node = renderNodeById.get(directBlockId)?.node ?? null;
          if (node?.type === "rich-text") {
            return { node, pageId: node.pageId };
          }
        }
      }

      const stage = stageRef.current;
      if (!stage) {
        return null;
      }

      const stageRect = stage.container().getBoundingClientRect();
      const localX = event.clientX - stageRect.left;
      const localY = event.clientY - stageRect.top;

      for (const entry of richTextCanvasOverlays) {
        const left = typeof entry.style.left === "number" ? entry.style.left : Number(entry.style.left);
        const top = typeof entry.style.top === "number" ? entry.style.top : Number(entry.style.top);
        const width = typeof entry.style.width === "number" ? entry.style.width : Number(entry.style.width);
        const height = typeof entry.style.height === "number" ? entry.style.height : Number(entry.style.height);

        if (
          Number.isFinite(left) &&
          Number.isFinite(top) &&
          Number.isFinite(width) &&
          Number.isFinite(height) &&
          localX >= left &&
          localX <= left + width &&
          localY >= top &&
          localY <= top + height
        ) {
          return { node: entry.node, pageId: entry.node.pageId };
        }
      }

      return null;
    },
    [richTextCanvasOverlays, renderNodeById],
  );
  const handleRichTextOverlayLayerDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      const entry = resolveRichTextOverlayEntryFromEvent(event);
      if (!entry) {
        return;
      }

      handleRichTextOverlayDragOver(entry.node, entry.pageId, event);
    },
    [handleRichTextOverlayDragOver, resolveRichTextOverlayEntryFromEvent],
  );
  const handleRichTextOverlayLayerDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      const entry = resolveRichTextOverlayEntryFromEvent(event);
      if (!entry) {
        return false;
      }

      return handleRichTextOverlayDrop(entry.node, entry.pageId, event);
    },
    [handleRichTextOverlayDrop, resolveRichTextOverlayEntryFromEvent],
  );
  useEffect(() => {
    if (dragTraceContext === null) {
      richTextDropTraceRef.current = null;
    }
  }, [dragTraceContext]);
  const refreshSelectionActionBarPlacement = useCallback(() => {
    const stage = stageRef.current;
    if (selectedEditableIds.length === 0) {
      setSelectionActionBarPlacement(null);
      return;
    }

    const rects =
      stage !== null
        ? selectedEditableIds
            .map((elementId) => stage.findOne<Konva.Node>(`#${elementId}`))
            .filter((node): node is Konva.Node => node !== null && node !== undefined)
            .map((node) => node.getClientRect({ relativeTo: stage }))
            .filter((rect) => rect.width > 0 && rect.height > 0)
        : [];

    const fallbackBounds = resolveSelectionBoundsFromRenderTree(renderTree, selectedEditableIds, pageLayoutsById);
    const bounds =
      rects.length > 0
        ? unionRects(rects)
        : fallbackBounds
          ? {
              x: fallbackBounds.x * viewport.zoom + viewport.panX,
              y: fallbackBounds.y * viewport.zoom + viewport.panY,
              width: fallbackBounds.width * viewport.zoom,
              height: fallbackBounds.height * viewport.zoom,
            }
          : null;
    if (!bounds) {
      setSelectionActionBarPlacement(null);
      return;
    }

    setSelectionActionBarPlacement(resolveSelectionActionBarPlacement(bounds, workspaceLayout.width, workspaceLayout.height));
  }, [
    pageLayoutsById,
    renderTree,
    selectedEditableIds,
    viewport.panX,
    viewport.panY,
    viewport.zoom,
    workspaceLayout.height,
    workspaceLayout.width,
  ]);
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
      const selectionIds = resolveDragSelectionIds({
        anchorId,
        anchorPageId: node.pageId,
        selectedElementIds,
        renderNodeById,
      });

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
      setDraggingElementIds(selectionIds);
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
      refreshSelectionActionBarPlacement();
    },
    [refreshSelectionActionBarPlacement],
  );
  const handleDragEnd = useCallback(
    (node: RenderNode) => {
      const drag = dragSelectionRef.current;
      if (!drag) {
        setDraggingElementIds([]);
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
      setDraggingElementIds([]);
    },
    [pageLayoutsById, renderNodeById, workspaceSettings],
  );
  const handleTransformMove = useCallback(() => {
    refreshSelectionActionBarPlacement();
  }, [refreshSelectionActionBarPlacement]);
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
      const frame = resolveCommittedFrame(renderNode, selectedNode);
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
      const renderNode = renderNodeById.get(selectionId)?.node;
      return Boolean(selectedNode && renderNode && !isCanonicalProjectedScale(renderNode, selectedNode));
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
  const handleDuplicateSelection = useCallback(() => {
    const result = duplicateCanvasElements({
      elementIds: selectedEditableIds,
    });

    if (!result.duplicated) {
      console.warn("[editor] duplicate rejected", result.reason);
      return;
    }

  }, [duplicateCanvasElements, selectedEditableIds]);
  const handleCopySelection = useCallback(() => {
    const result = copyCanvasElements({
      elementIds: selectedEditableIds,
    });

    if (!result.copied) {
      console.warn("[editor] copy rejected", result.reason);
    }
  }, [copyCanvasElements, selectedEditableIds]);
  const handlePasteSelection = useCallback(() => {
    const result = pasteCanvasElements();

    if (!result.pasted) {
      console.warn("[editor] paste rejected", result.reason);
    }
  }, [pasteCanvasElements]);
  const handleOrderSelection = useCallback(
    (action: CanvasObjectOrderAction) => {
      const result = reorderCanvasElements({
        elementIds: selectedEditableIds,
        action,
      });

      if (!result.reordered) {
        console.warn("[editor] reorder rejected", result.reason);
        return;
      }
    },
    [reorderCanvasElements, selectedEditableIds],
  );
  const handleFlipSelection = useCallback(
    (axis: "horizontal" | "vertical") => {
      const result = flipCanvasElements({
        elementIds: selectedEditableIds,
        axis,
      });

      if (!result.flipped) {
        console.warn("[editor] flip rejected", result.reason);
      }
    },
    [flipCanvasElements, selectedEditableIds],
  );
  const handleAlignSelection = useCallback(
    (alignment: CanvasObjectAlignmentAction) => {
      const result = alignCanvasElements({
        elementIds: selectedEditableIds,
        alignment,
      });

      if (!result.aligned) {
        console.warn("[editor] align rejected", result.reason);
        return;
      }
    },
    [alignCanvasElements, selectedEditableIds],
  );

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

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      refreshSelectionActionBarPlacement();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [refreshSelectionActionBarPlacement, viewport.panX, viewport.panY, viewport.zoom]);

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
      setDraggingElementIds([]);
      clearSelectionDraft();
    },
    [clearSelectionDraft],
  );

  if (workspaceLayout.pages.length === 0) {
    return null;
  }

  return (
    <div className="ef-konva-stage-shell" style={{ position: "relative", width: `${workspaceLayout.width}px`, height: `${workspaceLayout.height}px` }}>
      <Stage
        width={workspaceLayout.width}
        height={workspaceLayout.height}
        className="ef-konva-page ef-render-page"
        aria-label="Template CV"
        ref={stageRef}
      onPointerDown={(event: Konva.KonvaEventObject<PointerEvent>) => {
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

        if (isSelectionBoxTool(activeCanvasTool)) {
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
      onPointerMove={(event: Konva.KonvaEventObject<PointerEvent>) => {
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
      onPointerUp={(event: Konva.KonvaEventObject<PointerEvent>) => {
        const draft = selectionDragRef.current;
        if (!draft) {
          return;
        }

        if (stageRef.current?.container().hasPointerCapture(event.evt.pointerId)) {
          stageRef.current.container().releasePointerCapture(event.evt.pointerId);
        }

        commitSelectionDraft();
      }}
      onPointerCancel={(event: Konva.KonvaEventObject<PointerEvent>) => {
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
          {renderTree.pages.map((pageNode) => {
            const pageLayout = pageLayoutsById.get(pageNode.id);
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
                        draggingElementIds={draggingElementIds}
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
          {selectedElementIds.length > 1 && draggingElementIds.length === 0
            ? selectedContourBoxes.map((entry) => <SelectedContourBox key={`selected-${entry.pageId}`} bounds={entry.bounds} />)
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
            onTransform={handleTransformMove}
            onTransformEnd={handleTransformEnd}
            enabledAnchors={canResizeSelection ? [...ALL_TRANSFORM_ANCHORS] : []}
            boundBoxFunc={(oldBox: KonvaTransformBox, newBox: KonvaTransformBox) => {
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

      {selectionActionBarPlacement && selectedEditableIds.length > 0 ? (
        <CanvasSelectionActionBar
          left={selectionActionBarPlacement.left}
          top={selectionActionBarPlacement.top}
          placement={selectionActionBarPlacement.placement}
          canDuplicate={selectedEditableIds.length > 0}
          canCopy={selectedEditableIds.length > 0}
          canPaste={Boolean(canvasClipboard?.elements.length)}
          canDelete={selectedEditableIds.length > 0}
          canBringToFront={selectionActionCapabilities.bringToFront}
          canBringForward={selectionActionCapabilities.bringForward}
          canSendBackward={selectionActionCapabilities.sendBackward}
          canSendToBack={selectionActionCapabilities.sendToBack}
          canAlign={selectedEditableIds.length > 1}
          canFlipHorizontal={selectedEditableIds.length > 0}
          canFlipVertical={selectedEditableIds.length > 0}
          onDuplicate={handleDuplicateSelection}
          onCopy={handleCopySelection}
          onPaste={handlePasteSelection}
          onDelete={() => handleDeleteElements(selectedEditableIds)}
          onOrder={handleOrderSelection}
          onAlign={handleAlignSelection}
          onFlipHorizontal={() => handleFlipSelection("horizontal")}
          onFlipVertical={() => handleFlipSelection("vertical")}
        />
      ) : null}
      {selectedRichTextNode && richTextEditButtonPlacement ? (
        <button
          type="button"
          className="ef-rich-text-edit-button"
          style={{ left: richTextEditButtonPlacement.left, top: richTextEditButtonPlacement.top }}
          aria-label="Éditer le bloc Rich Text"
          title="Éditer le bloc"
          onClick={() => setEditingRichTextId(selectedRichTextNode.id)}
        >
          <span aria-hidden="true">✎</span>
        </button>
      ) : null}
      {editingRichTextId && editingRichTextNode ? (
        <RichTextEditorPanel
          blockId={editingRichTextId}
          initialHtml={propString(editingRichTextNode.props, "html") ?? "<p></p>"}
          initialJson={
            editingRichTextNode.props?.richTextJson && typeof editingRichTextNode.props.richTextJson === "object"
              ? (editingRichTextNode.props.richTextJson as JSONContent)
              : null
          }
          initialDisplayMode={(propString(editingRichTextNode.props, "richTextDisplayMode") as RichTextVariableDisplayMode | undefined) ?? "label"}
          onClose={() => setEditingRichTextId(null)}
        />
      ) : null}
      {selectedImageNode && imageEditButtonPlacement ? (
        <ImageEditButton left={imageEditButtonPlacement.left} top={imageEditButtonPlacement.top} onClick={() => setEditingImageId(selectedImageNode.id)} />
      ) : null}
      {editingImageId && editingImageNode ? (
        <ImageEditorDialog
          node={editingImageNode}
          onCancel={() => setEditingImageId(null)}
          onApply={(imageEditing) => handleApplyImageEditing(editingImageId, imageEditing)}
        />
      ) : null}
      {richTextCanvasOverlays.length > 0 ? (
        <div
          className="ef-rich-text-canvas-layer"
          aria-hidden="true"
          style={{ pointerEvents: dragTraceContext?.type === "variable" ? "auto" : "none" }}
          onDragOver={handleRichTextOverlayLayerDragOver}
          onDrop={handleRichTextOverlayLayerDrop}
        >
          {richTextCanvasOverlays.map((entry) => (
            <div key={entry.node.id} className="ef-rich-text-canvas-block" data-rich-text-block-id={entry.node.id} style={entry.style}>
              <div className="ef-rich-text-canonical-content" style={entry.contentStyle} dangerouslySetInnerHTML={{ __html: entry.html }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function resolveSelectionBoundsFromRenderTree(
  renderTree: CanonicalRenderTree,
  selectedEditableIds: string[],
  pageLayoutsById: Map<string, WorkspacePageLayout>,
) {
  const rects = selectedEditableIds
    .map((elementId) => {
      const page = renderTree.pages.find((candidatePage) => candidatePage.children.some((node) => node.id === elementId)) ?? null;
      if (!page) {
        return null;
      }

      const node = page.children.find((candidateNode) => candidateNode.id === elementId) ?? null;
      if (!node) {
        return null;
      }

      const pageLayout = pageLayoutsById.get(page.id);
      if (!pageLayout) {
        return null;
      }

      return getWorkspaceSelectionBounds(node, pageLayout);
    })
    .filter((rect): rect is { x: number; y: number; width: number; height: number } => rect !== null);

  if (rects.length === 0) {
    return null;
  }

  return unionRects(rects);
}

function unionRects(rects: Array<{ x: number; y: number; width: number; height: number }>) {
  return rects.reduce(
    (acc, rect, index) => {
      if (index === 0) {
        return { ...rect };
      }

      const minX = Math.min(acc.x, rect.x);
      const minY = Math.min(acc.y, rect.y);
      const maxX = Math.max(acc.x + acc.width, rect.x + rect.width);
      const maxY = Math.max(acc.y + acc.height, rect.y + rect.height);

      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    },
    rects[0] ?? {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },
  );
}

function KonvaRenderNode({
  node,
  canSelect,
  activeCanvasTool,
  draggingElementIds,
  onSelectElement,
  onDeleteElements,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  node: RenderNode;
  canSelect: boolean;
  activeCanvasTool: CanvasToolId;
  draggingElementIds: string[];
  onSelectElement: (elementIds: string[], options?: { additive?: boolean }) => void;
  onDeleteElements: (elementIds: string[]) => void;
  onDragStart: (node: RenderNode) => void;
  onDragMove: () => void;
  onDragEnd: (node: RenderNode) => void;
}) {
  if (!node.visible) {
    return null;
  }

  const showFrameOutline = shouldShowFrameOutline(node.id, draggingElementIds);
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
        {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
        <Text id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...getKonvaTextProps(node)} {...interactionProps} {...dragProps} {...transformProps} />
      </>
    );
  }

  if (node.type === "rich-text") {
    return <RichTextPlaceholderNode node={node} selectable={selectable} showFrameOutline={showFrameOutline} interactionProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
  }

  if (node.type === "image") {
    return <LoadedKonvaImage node={node} showFrameOutline={showFrameOutline} selectProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
  }

  if (node.type === "shape") {
    const svgSource = getRenderableSvgSource(node);
    if (svgSource) {
      return <LoadedKonvaImage node={node} sourceOverride={svgSource} showFrameOutline={showFrameOutline} selectProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
    }

    const shapeProps = getKonvaShapeProps(node);

    if (shapeProps.shape === "circle") {
      return (
        <>
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
          <Circle id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.circle} {...interactionProps} {...dragProps} {...transformProps} />
        </>
      );
    }

    if (shapeProps.shape === "ellipse") {
      return (
        <>
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
          <Ellipse id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.ellipse} {...interactionProps} {...dragProps} {...transformProps} />
        </>
      );
    }

    if (shapeProps.shape === "line") {
      return (
        <>
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
          <Line id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.line} {...interactionProps} {...dragProps} {...transformProps} />
        </>
      );
    }

    if (shapeProps.shape === "polygon") {
      return (
        <>
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
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
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
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
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
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
      return <ArcKonvaNode id={node.id} frame={node.frame} shapeProps={shapeProps.arc} selectable={selectable} locked={node.locked} showFrameOutline={showFrameOutline} interactionProps={interactionProps} dragProps={dragProps} transformProps={transformProps} />;
    }

    return (
      <>
        {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
        <Rect id={node.id} name={`RenderNode:${node.id}`} selectable={selectable} locked={node.locked} {...shapeProps.rect} {...interactionProps} {...dragProps} {...transformProps} />
      </>
    );
  }

  if (node.type === "table") {
    return (
      <TablePlaceholderNode
      node={node}
      selectable={selectable}
      showFrameOutline={showFrameOutline}
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
      showFrameOutline={showFrameOutline}
      interactionProps={interactionProps}
      dragProps={dragProps}
      transformProps={transformProps}
      />
    );
  }

  return null;
}
