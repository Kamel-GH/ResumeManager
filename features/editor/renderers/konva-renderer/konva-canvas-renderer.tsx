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
import {
  convertClientPointToWorkspacePoint,
  findWorkspacePageAtPoint,
  type WorkspaceSnapGuide,
} from "@/features/editor/schema/workspace-layout";
import { resolveWorkspaceAlignmentSnapResolution, resolveWorkspaceResizeSnapResolution, type WorkspaceSnapSource } from "@/features/editor/schema/workspace-snap-guides";
import { resolveWorkspaceVisualAids } from "@/features/editor/schema/workspace-layout";
import { CanvasSelectionActionBar } from "@/features/editor/components/parts/canvas-selection-action-bar";
import { RichTextEditorPanel } from "@/features/editor/components/parts/rich-text-editor-panel";
import { ImageEditButton } from "@/features/editor/components/image-editing/image-edit-button";
import { ImageEditorDialog } from "@/features/editor/components/image-editing/image-editor-dialog";
import type { ImageEditingState } from "@/features/editor/components/image-editing/image-editor-types";
import { buildVariableDragOperationLog, parseEditorItemDragPayload } from "@/features/data-mapping/lib/variable-display";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
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
  resolveRenderNodeOrderGroupKey,
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
  canvasSize?: { width: number; height: number };
  workspaceLayout: WorkspaceLayout;
  workspaceSettings: EditorWorkspaceSettings;
  viewport: WorkspaceViewport;
  activePageId: string;
  selectedElementIds: string[];
  activeCanvasTool: CanvasToolId;
  isSpacePanActive?: boolean;
  draftCanvasCreation: CanvasToolDraft | null;
  onSelectElement: (elementIds: string[], options?: { additive?: boolean }) => void;
};

type NodeInteractionProps = {
  draggable?: boolean;
  onClick?: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap?: (event: Konva.KonvaEventObject<TouchEvent>) => void;
  onDragStart?: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: () => void;
  onTransformEnd?: () => void;
};

type PaintFrame = { width: number; height: number };

function resolveRenderableColor(value: string | null | undefined, fallback = "transparent"): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  if (/^\{\{theme\.[a-z0-9_.-]+}}$/i.test(trimmed)) return resolveThemeTokenColor(trimmed);
  if (/^linear-gradient\(/i.test(trimmed)) return parseLinearGradientColors(trimmed)[0] ?? fallback;
  return trimmed;
}

function resolveKonvaFillProps(value: string | null | undefined, frame: PaintFrame): Record<string, unknown> {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { fill: "transparent" };

  if (/^linear-gradient\(/i.test(trimmed)) {
    const colors = parseLinearGradientColors(trimmed);
    if (colors.length >= 2) {
      return {
        fill: undefined,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: Math.max(frame.width, 1), y: Math.max(frame.height, 1) },
        fillLinearGradientColorStops: [0, colors[0], 1, colors[1]],
      };
    }
  }

  return { fill: resolveRenderableColor(trimmed) };
}

function parseLinearGradientColors(value: string): string[] {
  return Array.from(value.matchAll(/#[0-9a-f]{3,6}|rgba?\([^)]+\)/gi)).map((match) => resolveRenderableColor(match[0]));
}

function resolveThemeTokenColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "{{theme.primary}}") return "#2563eb";
  if (normalized === "{{theme.text}}") return "#111827";
  if (normalized === "{{theme.border}}") return "#e5e7eb";
  if (normalized === "{{theme.surface}}") return "#ffffff";
  return "#2563eb";
}

export function KonvaCanvasRenderer({
  renderTree,
  canvasSize,
  workspaceLayout,
  workspaceSettings,
  viewport,
  activePageId,
  selectedElementIds,
  activeCanvasTool,
  isSpacePanActive = false,
  draftCanvasCreation,
  onSelectElement,
}: KonvaCanvasRendererProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const surfaceWidth = Math.max(workspaceLayout.width, canvasSize?.width ?? 0);
  const surfaceHeight = Math.max(workspaceLayout.height, canvasSize?.height ?? 0);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const selectionDragRef = useRef<{
    pointerId: number;
    pageId: string;
    start: { x: number; y: number };
    current: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const [draggingElementIds, setDraggingElementIds] = useState<string[]>([]);
  const [snapGuideDraft, setSnapGuideDraft] = useState<{ pageId: string; guides: WorkspaceSnapGuide[] } | null>(null);
  const dragSelectionRef = useRef<{
    anchorId: string;
    pageId: string;
    groupKey: string;
    selectionIds: string[];
    startPositions: Map<string, { x: number; y: number }>;
    startBounds: { x: number; y: number; width: number; height: number };
    spacePan: {
      pointerClient: { x: number; y: number };
      viewport: { panX: number; panY: number };
      frozenPositions: Map<string, { x: number; y: number }>;
    } | null;
  } | null>(null);
  const transformSelectionRef = useRef<{
    pageId: string;
    groupKey: string;
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
  const visualAids = useMemo(() => resolveWorkspaceVisualAids(workspaceSettings), [workspaceSettings]);
  const deleteCanvasElements = useEditorStore((state) => state.deleteCanvasElements);
  const copyCanvasElements = useEditorStore((state) => state.copyCanvasElements);
  const pasteCanvasElements = useEditorStore((state) => state.pasteCanvasElements);
  const duplicateCanvasElements = useEditorStore((state) => state.duplicateCanvasElements);
  const setViewportPan = useEditorStore((state) => state.setViewportPan);
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
        imageEditing,
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
    setSnapGuideDraft(null);
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
    const firstNode = renderNodeById.get(selectedTransformableIds[0])?.node ?? null;
    const groupKey = firstNode ? resolveRenderNodeOrderGroupKey(firstNode) : "root";
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
      groupKey,
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
    const startRects: Array<{ x: number; y: number; width: number; height: number }> = [];
    const groupKey = resolveRenderNodeOrderGroupKey(node);
    selectionIds.forEach((selectionId) => {
        const selectedNode = stageRef.current?.findOne<Konva.Node>(`#${selectionId}`);
        if (!selectedNode) {
          return;
        }

        const renderNode = renderNodeById.get(selectionId)?.node ?? null;
        if (renderNode) {
          startRects.push(resolveCommittedFrame(renderNode, selectedNode));
        }

        startPositions.set(selectionId, {
          x: selectedNode.x(),
          y: selectedNode.y(),
        });
      });

      const startBounds = startRects.length > 0 ? unionRects(startRects) : { ...(startRects[0] ?? { x: 0, y: 0, width: 1, height: 1 }) };

    dragSelectionRef.current = {
      anchorId,
      pageId: node.pageId,
      groupKey,
      selectionIds,
      startPositions,
      startBounds,
      spacePan: null,
    };
    setSnapGuideDraft(null);
    setDraggingElementIds(selectionIds);
  },
  [canSelect, handleSelectElement, renderNodeById, selectedElementIds, selectedIds],
  );
  const handleDragMove = useCallback((node: RenderNode, event: Konva.KonvaEventObject<DragEvent>) => {
    const drag = dragSelectionRef.current;
    if (!drag) {
      return;
    }

    const pageLayout = pageLayoutsById.get(drag.pageId ?? node.pageId);
    const anchorNode = stageRef.current?.findOne<Konva.Node>(`#${drag.anchorId}`);
    const anchorStart = drag.startPositions.get(drag.anchorId);
    const eventClient =
      typeof event.evt.clientX === "number" && typeof event.evt.clientY === "number"
        ? {
            x: event.evt.clientX,
            y: event.evt.clientY,
          }
        : null;

    if (isSpacePanActive && anchorNode && anchorStart) {
      if (!drag.spacePan) {
        const frozenPositions = new Map<string, { x: number; y: number }>();
        drag.selectionIds.forEach((selectionId) => {
          const movingNode = stageRef.current?.findOne<Konva.Node>(`#${selectionId}`);
          const startPosition = drag.startPositions.get(selectionId);
          frozenPositions.set(selectionId, movingNode ? { x: movingNode.x(), y: movingNode.y() } : { ...(startPosition ?? { x: 0, y: 0 }) });
        });

        drag.spacePan = {
          pointerClient: eventClient ?? { x: 0, y: 0 },
          viewport: { panX: viewport.panX, panY: viewport.panY },
          frozenPositions,
        };
      }

      drag.spacePan.frozenPositions.forEach((position, selectionId) => {
        const movingNode = stageRef.current?.findOne<Konva.Node>(`#${selectionId}`);
        movingNode?.position(position);
      });

      if (eventClient) {
        setViewportPan({
          panX: drag.spacePan.viewport.panX + eventClient.x - drag.spacePan.pointerClient.x,
          panY: drag.spacePan.viewport.panY + eventClient.y - drag.spacePan.pointerClient.y,
        });
      }

      setSnapGuideDraft(null);
      stageRef.current?.batchDraw();
      refreshSelectionActionBarPlacement();
      return;
    }

    if (drag.spacePan && anchorNode && anchorStart) {
      const frozenAnchor = drag.spacePan.frozenPositions.get(drag.anchorId);
      if (frozenAnchor) {
        const frozenDeltaX = frozenAnchor.x - anchorStart.x;
        const frozenDeltaY = frozenAnchor.y - anchorStart.y;
        drag.startBounds = {
          ...drag.startBounds,
          x: drag.startBounds.x + frozenDeltaX,
          y: drag.startBounds.y + frozenDeltaY,
        };
      }

      drag.spacePan.frozenPositions.forEach((position, selectionId) => {
        drag.startPositions.set(selectionId, position);
      });
      drag.spacePan = null;
    }

    const resolvedAnchorStart = anchorStart ? (drag.startPositions.get(drag.anchorId) ?? anchorStart) : null;

    if (pageLayout && anchorNode && resolvedAnchorStart) {
      const currentDeltaX = anchorNode.x() - resolvedAnchorStart.x;
      const currentDeltaY = anchorNode.y() - resolvedAnchorStart.y;
      const currentFrame = {
        x: drag.startBounds.x + currentDeltaX,
        y: drag.startBounds.y + currentDeltaY,
        width: drag.startBounds.width,
        height: drag.startBounds.height,
      };
      const snapSources = buildWorkspaceSnapSources(renderNodeById, pageLayoutsById, drag.pageId, drag.selectionIds);
      const alignmentResolution = resolveWorkspaceAlignmentSnapResolution(currentFrame, pageLayout, workspaceSettings, snapSources, null, viewport.zoom, drag.groupKey);
      const snapDeltaX = alignmentResolution.point.x - drag.startBounds.x;
      const snapDeltaY = alignmentResolution.point.y - drag.startBounds.y;
      anchorNode.position({
        x: resolvedAnchorStart.x + snapDeltaX,
        y: resolvedAnchorStart.y + snapDeltaY,
      });
      setSnapGuideDraft(
        alignmentResolution.guides.length > 0
          ? {
              pageId: pageLayout.id,
              guides: alignmentResolution.guides,
            }
          : null,
      );
    } else {
      setSnapGuideDraft(null);
    }

    if (drag.selectionIds.length > 1 && anchorNode && resolvedAnchorStart) {
      const deltaX = anchorNode.x() - resolvedAnchorStart.x;
      const deltaY = anchorNode.y() - resolvedAnchorStart.y;

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
    }

    stageRef.current?.batchDraw();
    refreshSelectionActionBarPlacement();
  }, [isSpacePanActive, pageLayoutsById, refreshSelectionActionBarPlacement, renderNodeById, setViewportPan, viewport.panX, viewport.panY, viewport.zoom, workspaceSettings]);
  const handleDragEnd = useCallback(
    (node: RenderNode) => {
      const drag = dragSelectionRef.current;
      if (!drag) {
        setDraggingElementIds([]);
        setSnapGuideDraft(null);
        return;
      }

      const anchorStart = drag.startPositions.get(drag.anchorId);
      const anchorNode = stageRef.current?.findOne<Konva.Node>(`#${drag.anchorId}`);
      const snappedAnchorPoint = anchorNode ? { x: anchorNode.x(), y: anchorNode.y() } : null;
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
      setSnapGuideDraft(null);
    },
    [pageLayoutsById, renderNodeById, workspaceSettings],
  );
  const handleTransformMove = useCallback(() => {
    const selection = transformSelectionRef.current;
    const stage = stageRef.current;
    const pageLayout = selection ? pageLayoutsById.get(selection.pageId) : null;
    if (selection && pageLayout && stage) {
      const selectedRects = selection.selectionIds
        .map((selectionId) => {
          const renderNode = renderNodeById.get(selectionId)?.node ?? null;
          const selectedNode = stage.findOne<Konva.Node>(`#${selectionId}`);
          if (!renderNode || !selectedNode) {
            return null;
          }

          return resolveCommittedFrame(renderNode, selectedNode);
        })
        .filter((rect): rect is { x: number; y: number; width: number; height: number } => rect !== null);

      const currentFrame = selectedRects.length > 0 ? unionRects(selectedRects) : null;
      if (currentFrame) {
        const snapSources = buildWorkspaceSnapSources(renderNodeById, pageLayoutsById, selection.pageId, selection.selectionIds);
        const activeAnchor = transformerRef.current?.getActiveAnchor?.() ?? null;
        const guideResolution = resolveWorkspaceAlignmentSnapResolution(currentFrame, pageLayout, workspaceSettings, snapSources, activeAnchor, viewport.zoom, selection.groupKey);
        const resizeResolution = resolveSelectionResizeSnapResolution({
          oldBox: currentFrame,
          newBox: currentFrame,
          pageId: selection.pageId,
          selectionIds: selection.selectionIds,
          groupKey: selection.groupKey,
          activeAnchor,
          renderNodeById,
          pageLayoutsById,
          workspaceSettings,
          viewportZoom: viewport.zoom,
        });
        const snapDeltaX = guideResolution.point.x - currentFrame.x;
        const snapDeltaY = guideResolution.point.y - currentFrame.y;

        if (Math.abs(snapDeltaX) > 0.001 || Math.abs(snapDeltaY) > 0.001) {
          selection.selectionIds.forEach((selectionId) => {
            const selectedNode = stage.findOne<Konva.Node>(`#${selectionId}`);
            if (!selectedNode) {
              return;
            }

            selectedNode.position({
              x: selectedNode.x() + snapDeltaX,
              y: selectedNode.y() + snapDeltaY,
            });
          });
        }

        const guides = [...guideResolution.guides, ...resizeResolution.guides];
        setSnapGuideDraft(
          guides.length > 0
            ? {
                pageId: pageLayout.id,
                guides,
              }
            : null,
        );
      } else {
        setSnapGuideDraft(null);
      }
    }

    refreshSelectionActionBarPlacement();
  }, [pageLayoutsById, refreshSelectionActionBarPlacement, renderNodeById, workspaceSettings]);
  const handleTransformEnd = useCallback(() => {
    const selection = transformSelectionRef.current;
    if (!selection || selection.selectionIds.length === 0) {
      setSnapGuideDraft(null);
      return;
    }

    const stage = stageRef.current;
    const anchorNode = stage?.findOne<Konva.Node>(`#${selection.selectionIds[0]}`);
      if (!anchorNode) {
        transformSelectionRef.current = null;
        setSnapGuideDraft(null);
        return;
      }

    if (selection.selectionIds.length === 1) {
      const selectionId = selection.selectionIds[0];
      const renderNode = renderNodeById.get(selectionId)?.node;
      const selectedNode = stage?.findOne<Konva.Node>(`#${selectionId}`);
      if (!renderNode || !selectedNode) {
        transformSelectionRef.current = null;
        setSnapGuideDraft(null);
        return;
      }

      const frame = resolveCommittedFrame(renderNode, selectedNode);
      const points = resolveScaledShapePoints(renderNode, frame);
      const result = useEditorStore.getState().commitCanvasObjectGeometry({
        pageId: renderNode.pageId,
        patches: [
          {
            id: selectionId,
            frame,
            rotation: selectedNode.rotation(),
            ...(points ? { points } : {}),
          },
        ],
      });

      selectedNode.scaleX(1);
      selectedNode.scaleY(1);
      transformSelectionRef.current = null;
      setSnapGuideDraft(null);

      if (!result.committed) {
        console.warn("[editor] canvas transform commit rejected", result.reason);
      }
      return;
    }

    const originalAnchor = selection.originalById.get(selection.selectionIds[0]);
    if (!originalAnchor) {
      transformSelectionRef.current = null;
      setSnapGuideDraft(null);
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
        setSnapGuideDraft(null);
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
      setSnapGuideDraft(null);
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
      setSnapGuideDraft(null);
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
    setSnapGuideDraft(null);
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
    <div className="ef-konva-stage-shell" style={{ position: "relative", width: `${surfaceWidth}px`, height: `${surfaceHeight}px` }}>
      <Stage
        width={surfaceWidth}
        height={surfaceHeight}
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
        <Rect x={0} y={0} width={surfaceWidth} height={surfaceHeight} fill="#eef2f7" />
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
          {visualAids.gridVisible ? (
            <Group listening={false} name="workspaceGridRoot">
              {workspaceLayout.pages.map((page) => (
                <WorkspaceGrid key={`grid-${page.id}`} page={page} gridSize={workspaceSettings.gridSize} />
              ))}
            </Group>
          ) : null}
          {visualAids.marginGuidesVisible
            ? workspaceLayout.pages.map((page) => <PageMarginGuides key={`margins-${page.id}`} page={page} />)
            : null}
          {visualAids.guidesVisible && snapGuideDraft
            ? workspaceLayout.pages.map((page) => (page.id === snapGuideDraft.pageId ? <SnapGuideOverlay key={`snap-guides-${page.id}`} page={page} guides={snapGuideDraft.guides} /> : null))
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

              const selection = transformSelectionRef.current;
              const activeAnchor = transformerRef.current?.getActiveAnchor?.() ?? null;
              if (!selection || !activeAnchor) {
                return newBox;
              }

              const resizeResolution = resolveSelectionResizeSnapResolution({
                oldBox: {
                  x: oldBox.x,
                  y: oldBox.y,
                  width: oldBox.width,
                  height: oldBox.height,
                },
                newBox: {
                  x: newBox.x,
                  y: newBox.y,
                  width: newBox.width,
                  height: newBox.height,
                },
                pageId: selection.pageId,
                selectionIds: selection.selectionIds,
                groupKey: selection.groupKey,
                activeAnchor,
                renderNodeById,
                pageLayoutsById,
                workspaceSettings,
                viewportZoom: viewport.zoom,
              });

              return {
                ...newBox,
                ...resizeResolution.frame,
              };
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

function buildWorkspaceSnapSources(
  renderNodeById: Map<string, { node: RenderNode; pageId: string }>,
  pageLayoutsById: Map<string, WorkspacePageLayout>,
  pageId: string,
  excludedIds: string[],
): WorkspaceSnapSource[] {
  const excluded = new Set(excludedIds);
  const pageLayout = pageLayoutsById.get(pageId);
  if (!pageLayout) {
    return [];
  }

  const sources: WorkspaceSnapSource[] = [];
  for (const [id, entry] of renderNodeById) {
    if (entry.pageId !== pageId || excluded.has(id) || !entry.node.visible) {
      continue;
    }

    const workspaceBounds = getWorkspaceSelectionBounds(entry.node, pageLayout);
    sources.push({
      id,
      groupKey: resolveRenderNodeOrderGroupKey(entry.node),
      parentId:
        propString(entry.node.props, "parentId") ??
        propString(entry.node.props, "groupId") ??
        propString(entry.node.props, "frameId") ??
        propString(entry.node.props, "containerId") ??
        propString(entry.node.props, "sectionId"),
      label: resolveSnapSourceLabel(entry.node),
      frame: {
        x: workspaceBounds.x - pageLayout.x,
        y: workspaceBounds.y - pageLayout.y,
        width: workspaceBounds.width,
        height: workspaceBounds.height,
      },
    });
  }

  return sources;
}

function resolveSelectionResizeSnapResolution({
  oldBox,
  newBox,
  pageId,
  selectionIds,
  groupKey,
  activeAnchor,
  renderNodeById,
  pageLayoutsById,
  workspaceSettings,
  viewportZoom,
}: {
  oldBox: { x: number; y: number; width: number; height: number };
  newBox: { x: number; y: number; width: number; height: number };
  pageId: string;
  selectionIds: string[];
  groupKey: string;
  activeAnchor: string | null;
  renderNodeById: Map<string, { node: RenderNode; pageId: string }>;
  pageLayoutsById: Map<string, WorkspacePageLayout>;
  workspaceSettings: EditorWorkspaceSettings;
  viewportZoom: number;
}) {
  const pageLayout = pageLayoutsById.get(pageId);
  if (!pageLayout) {
    return { frame: newBox, guides: [] as WorkspaceSnapGuide[] };
  }

  const snapSources = buildWorkspaceSnapSources(renderNodeById, pageLayoutsById, pageId, selectionIds);
  return resolveWorkspaceResizeSnapResolution(oldBox, newBox, pageLayout, workspaceSettings, snapSources, activeAnchor, viewportZoom, groupKey);
}

function resolveSnapSourceLabel(node: RenderNode) {
  if (node.type === "text" || node.type === "rich-text") {
    return "Texte";
  }

  if (node.type === "image") {
    return "Image";
  }

  if (node.type === "table") {
    return "Table";
  }

  if (node.type === "list") {
    return "Liste";
  }

  if (node.type === "shape") {
    return "Forme";
  }

  return "Objet";
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
  onDragMove: (node: RenderNode, event: Konva.KonvaEventObject<DragEvent>) => void;
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
        onDragMove: (event) => onDragMove(node, event),
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
          <Circle
            id={node.id}
            name={`RenderNode:${node.id}`}
            selectable={selectable}
            locked={node.locked}
            {...shapeProps.circle}
            {...resolveKonvaFillProps(shapeProps.circle.fill, { width: shapeProps.circle.radius * 2, height: shapeProps.circle.radius * 2 })}
            stroke={resolveRenderableColor(shapeProps.circle.stroke)}
            {...interactionProps}
            {...dragProps}
            {...transformProps}
          />
        </>
      );
    }

    if (shapeProps.shape === "ellipse") {
      return (
        <>
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
          <Ellipse
            id={node.id}
            name={`RenderNode:${node.id}`}
            selectable={selectable}
            locked={node.locked}
            {...shapeProps.ellipse}
            {...resolveKonvaFillProps(shapeProps.ellipse.fill, { width: shapeProps.ellipse.radiusX * 2, height: shapeProps.ellipse.radiusY * 2 })}
            stroke={resolveRenderableColor(shapeProps.ellipse.stroke)}
            {...interactionProps}
            {...dragProps}
            {...transformProps}
          />
        </>
      );
    }

    if (shapeProps.shape === "line") {
      return (
        <>
          {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={node.rotation ?? 0} /> : null}
          <Line
            id={node.id}
            name={`RenderNode:${node.id}`}
            selectable={selectable}
            locked={node.locked}
            {...shapeProps.line}
            stroke={resolveRenderableColor(shapeProps.line.stroke)}
            fill={shapeProps.line.fill ? resolveRenderableColor(shapeProps.line.fill) : undefined}
            {...interactionProps}
            {...dragProps}
            {...transformProps}
          />
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
            {...resolveKonvaFillProps(shapeProps.polygon.fill, node.frame)}
            stroke={resolveRenderableColor(shapeProps.polygon.stroke)}
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
            fill={resolveRenderableColor(shapeProps.polyline.fill)}
            stroke={resolveRenderableColor(shapeProps.polyline.stroke)}
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
            fill={resolveRenderableColor(shapeProps.curve.fill)}
            stroke={resolveRenderableColor(shapeProps.curve.stroke)}
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
        <Rect
          id={node.id}
          name={`RenderNode:${node.id}`}
          selectable={selectable}
          locked={node.locked}
          {...shapeProps.rect}
          {...resolveKonvaFillProps(shapeProps.rect.fill, { width: shapeProps.rect.width, height: shapeProps.rect.height })}
          stroke={resolveRenderableColor(shapeProps.rect.stroke)}
          {...interactionProps}
          {...dragProps}
          {...transformProps}
        />
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

function ArcKonvaNode({
  id,
  frame,
  shapeProps,
  selectable,
  locked,
  showFrameOutline,
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
    scaleX?: number;
    scaleY?: number;
    offsetX?: number;
    offsetY?: number;
  };
  selectable: boolean;
  locked: boolean;
  showFrameOutline: boolean;
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
      x={shapeProps.x}
      y={shapeProps.y}
      rotation={shapeProps.rotation}
      scaleX={shapeProps.scaleX}
      scaleY={shapeProps.scaleY}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      {showFrameOutline ? <FrameOutlineRect frame={{ x: 0, y: 0, width: frame.width, height: frame.height }} rotation={0} /> : null}
        <Shape
          x={frame.width / 2}
          y={frame.height / 2}
        sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
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
        hitFunc={(context: Konva.Context, shape: Konva.Shape) => {
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
        {...resolveKonvaFillProps(shapeProps.fill, frame)}
        stroke={resolveRenderableColor(shapeProps.stroke)}
        strokeWidth={shapeProps.strokeWidth}
        opacity={shapeProps.opacity}
      />
    </Group>
  );
}

function TablePlaceholderNode({
  node,
  selectable,
  showFrameOutline,
  interactionProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  selectable: boolean;
  showFrameOutline: boolean;
  interactionProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const rows = Math.max(2, propNumber(node.props, "rows") ?? 3);
  const columns = Math.max(2, propNumber(node.props, "columns") ?? 3);
  const headerRow = propBoolean(node.props, "headerRow");
  const cellWidth = Math.max(node.frame.width / columns, 1);
  const cellHeight = Math.max(node.frame.height / rows, 1);
  const fill = propString(node.props, "fill") ?? "#ffffff";
  const stroke = propString(node.props, "stroke") ?? "#cbd5e1";
  const strokeWidth = propNumber(node.props, "strokeWidth") ?? 1;
  const opacity = propNumber(node.props, "opacity") ?? 1;
  const flipX = propBoolean(node.props, "flipX");
  const flipY = propBoolean(node.props, "flipY");

  return (
    <Group
      id={node.id}
      name={`RenderNode:${node.id}`}
      selectable={selectable}
      locked={node.locked}
      x={node.frame.x + (flipX ? node.frame.width : 0)}
      y={node.frame.y + (flipY ? node.frame.height : 0)}
      width={node.frame.width}
      height={node.frame.height}
      rotation={node.rotation ?? 0}
      opacity={opacity}
      scaleX={flipX ? -1 : 1}
      scaleY={flipY ? -1 : 1}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      {showFrameOutline ? <FrameOutlineRect frame={{ x: 0, y: 0, width: node.frame.width, height: node.frame.height }} rotation={0} /> : null}
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} {...resolveKonvaFillProps(fill, node.frame)} stroke={resolveRenderableColor(stroke)} strokeWidth={strokeWidth} cornerRadius={2} />
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
  showFrameOutline,
  interactionProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  selectable: boolean;
  showFrameOutline: boolean;
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
  const fill = propString(node.props, "fill") ?? "#ffffff";
  const stroke = propString(node.props, "stroke") ?? "#cbd5e1";
  const strokeWidth = propNumber(node.props, "strokeWidth") ?? 1;
  const opacity = propNumber(node.props, "opacity") ?? 1;
  const flipX = propBoolean(node.props, "flipX");
  const flipY = propBoolean(node.props, "flipY");

  return (
    <Group
      id={node.id}
      name={`RenderNode:${node.id}`}
      selectable={selectable}
      locked={node.locked}
      x={node.frame.x + (flipX ? node.frame.width : 0)}
      y={node.frame.y + (flipY ? node.frame.height : 0)}
      width={node.frame.width}
      height={node.frame.height}
      rotation={node.rotation ?? 0}
      opacity={opacity}
      scaleX={flipX ? -1 : 1}
      scaleY={flipY ? -1 : 1}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      {showFrameOutline ? <FrameOutlineRect frame={{ x: 0, y: 0, width: node.frame.width, height: node.frame.height }} rotation={0} /> : null}
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} {...resolveKonvaFillProps(fill, node.frame)} stroke={resolveRenderableColor(stroke)} strokeWidth={strokeWidth} cornerRadius={4} />
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
  showFrameOutline,
  interactionProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  selectable: boolean;
  showFrameOutline: boolean;
  interactionProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const fill = propString(node.props, "fill") ?? "rgba(255,255,255,0.02)";
  const stroke = propString(node.props, "stroke") ?? "#cbd5e1";
  const strokeWidth = propNumber(node.props, "strokeWidth") ?? 1;
  const opacity = propNumber(node.props, "opacity") ?? 1;
  const flipX = propBoolean(node.props, "flipX");
  const flipY = propBoolean(node.props, "flipY");

  return (
    <Group
      id={node.id}
      name={`RenderNode:${node.id}`}
      selectable={selectable}
      locked={node.locked}
      x={node.frame.x + (flipX ? node.frame.width : 0)}
      y={node.frame.y + (flipY ? node.frame.height : 0)}
      width={node.frame.width}
      height={node.frame.height}
      rotation={node.rotation ?? 0}
      opacity={opacity}
      scaleX={flipX ? -1 : 1}
      scaleY={flipY ? -1 : 1}
      {...interactionProps}
      {...dragProps}
      {...transformProps}
    >
      {showFrameOutline ? <FrameOutlineRect frame={{ x: 0, y: 0, width: node.frame.width, height: node.frame.height }} rotation={0} /> : null}
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} {...resolveKonvaFillProps(fill, node.frame)} stroke={resolveRenderableColor(stroke)} strokeWidth={strokeWidth} cornerRadius={2} />
    </Group>
  );
}

function LoadedKonvaImage({
  node,
  sourceOverride,
  showFrameOutline,
  selectProps,
  dragProps,
  transformProps,
}: {
  node: RenderNode;
  sourceOverride?: string;
  showFrameOutline: boolean;
  selectProps: NodeInteractionProps;
  dragProps: NodeInteractionProps;
  transformProps: NodeInteractionProps;
}) {
  const imageProps = getKonvaImageProps(node);
  const loadedImage = useLoadedImage(sourceOverride ?? imageProps.src);
  const imageRef = useRef<Konva.Image | null>(null);
  const imageEditing = resolveImageEditingFromProps(node.props);
  const imageFilters = resolveKonvaImageFilters(imageEditing);
  const hasAdvancedImageEditing = hasImageEditingChanges(imageEditing);
  const internalTransform = resolveEditedImageTransform(node, imageEditing);
  const shadow = imageEditing.adjustments.shadow;
  const border = imageEditing.mask.border;
  const maskFrame = resolveImageMaskFrame(imageEditing.mask.bounds, imageProps.width, imageProps.height);
  const borderPathData = buildImageMaskPathData(maskFrame, imageEditing.mask.type, imageEditing.mask.type === "rounded-rect" ? imageEditing.mask.radius : 0);
  const borderPresentation = resolveImageMaskBorderPresentation(border);

  useLayoutEffect(() => {
    const imageNode = imageRef.current;
    if (!imageNode || imageFilters.length === 0) {
      imageNode?.clearCache();
      imageNode?.getLayer()?.batchDraw();
      return;
    }

    imageNode.cache();
    imageNode.getLayer()?.batchDraw();
  }, [imageFilters.length, imageEditing]);

  if (!loadedImage) {
    return (
      <>
        {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={imageProps.rotation} /> : null}
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
        scaleX={imageProps.scaleX}
        scaleY={imageProps.scaleY}
        offsetX={imageProps.offsetX}
        offsetY={imageProps.offsetY}
        selectable={true}
        locked={node.locked}
        {...selectProps}
        {...dragProps}
        {...transformProps}
        />
        {border.width > 0 ? (
          <Group
            x={imageProps.x}
            y={imageProps.y}
            rotation={imageProps.rotation}
            scaleX={imageProps.scaleX}
            scaleY={imageProps.scaleY}
            offsetX={imageProps.offsetX}
            offsetY={imageProps.offsetY}
          >
            <Path
              x={0}
              y={0}
              data={borderPathData}
              stroke={border.color}
              strokeWidth={border.width}
              dash={borderPresentation.dash}
              lineCap={borderPresentation.lineCap}
              lineJoin={borderPresentation.lineJoin}
              shadowColor={border.shadow > 0 ? "rgba(0,0,0,0.55)" : undefined}
              shadowBlur={border.shadow * 18}
              shadowOpacity={border.shadow}
              listening={false}
              strokeScaleEnabled={false}
              perfectDrawEnabled={false}
            />
          </Group>
        ) : null}
      </>
    );
  }

  return (
    <>
      {showFrameOutline ? <FrameOutlineRect frame={node.frame} rotation={imageProps.rotation} /> : null}
      <Group
        id={node.id}
        name={`RenderNode:${node.id}`}
        selectable={true}
        locked={node.locked}
        x={imageProps.x}
        y={imageProps.y}
        width={imageProps.width}
        height={imageProps.height}
        rotation={imageProps.rotation}
        scaleX={imageProps.scaleX}
        scaleY={imageProps.scaleY}
        offsetX={imageProps.offsetX}
        offsetY={imageProps.offsetY}
        {...selectProps}
        {...dragProps}
        {...transformProps}
      >
        <Group clipFunc={(context: Konva.Context) => applyImageMaskClip(context, imageProps.width, imageProps.height, imageEditing)}>
          <KonvaImage
            ref={imageRef}
            image={loadedImage}
            x={internalTransform.x}
            y={internalTransform.y}
            width={internalTransform.width}
            height={internalTransform.height}
            opacity={imageProps.opacity * imageEditing.adjustments.opacity}
            rotation={internalTransform.rotation}
            offsetX={internalTransform.offsetX}
            offsetY={internalTransform.offsetY}
            scaleX={internalTransform.scaleX}
            scaleY={internalTransform.scaleY}
            filters={imageFilters}
            brightness={resolveKonvaBrightness(imageEditing)}
            contrast={resolveKonvaContrast(imageEditing)}
            saturation={resolveKonvaSaturation(imageEditing)}
            hue={imageEditing.adjustments.hue + imageEditing.adjustments.temperature * 18}
            blurRadius={imageEditing.adjustments.blur}
            noise={imageEditing.adjustments.grain * 0.28}
            shadowColor={shadow > 0 ? "rgba(0,0,0,0.42)" : undefined}
            shadowBlur={shadow * 22}
            shadowOffsetY={shadow * 10}
            shadowOpacity={shadow}
          />
          {imageEditing.adjustments.vignette > 0 ? (
            <Rect x={0} y={0} width={imageProps.width} height={imageProps.height} fill="rgba(0,0,0,0.22)" opacity={imageEditing.adjustments.vignette} listening={false} />
          ) : null}
        </Group>
        {border.width > 0 ? (
          <Path
            x={0}
            y={0}
            width={imageProps.width}
            height={imageProps.height}
            data={borderPathData}
            stroke={border.color}
            strokeWidth={border.width}
            dash={borderPresentation.dash}
            lineCap={borderPresentation.lineCap}
            lineJoin={borderPresentation.lineJoin}
            shadowColor={border.shadow > 0 ? "rgba(0,0,0,0.55)" : undefined}
            shadowBlur={border.shadow * 18}
            shadowOpacity={border.shadow}
            listening={false}
            strokeScaleEnabled={false}
            perfectDrawEnabled={false}
          />
        ) : null}
        {!hasAdvancedImageEditing ? null : <Rect x={0} y={0} width={imageProps.width} height={imageProps.height} fillEnabled={false} listening={false} />}
      </Group>
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

  const minorStroke = "rgba(148, 163, 184, 0.12)";
  const majorStroke = "rgba(148, 163, 184, 0.24)";
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
  const usefulX = page.margin.left;
  const usefulY = page.margin.top;
  const usefulWidth = Math.max(page.width - page.margin.left - page.margin.right, 1);
  const usefulHeight = Math.max(page.height - page.margin.top - page.margin.bottom, 1);

  return (
    <Group x={page.x} y={page.y} listening={false} name={`MarginGuide:${page.id}`}>
      {page.margin.top > 0 ? <Rect x={0} y={0} width={page.width} height={page.margin.top} fill="rgba(148, 163, 184, 0.13)" listening={false} /> : null}
      {page.margin.left > 0 ? <Rect x={0} y={page.margin.top} width={page.margin.left} height={usefulHeight} fill="rgba(148, 163, 184, 0.11)" listening={false} /> : null}
      {page.margin.right > 0 ? <Rect x={page.width - page.margin.right} y={page.margin.top} width={page.margin.right} height={usefulHeight} fill="rgba(148, 163, 184, 0.11)" listening={false} /> : null}
      {page.margin.bottom > 0 ? <Rect x={0} y={page.height - page.margin.bottom} width={page.width} height={page.margin.bottom} fill="rgba(148, 163, 184, 0.13)" listening={false} /> : null}
      <Rect
        x={usefulX}
        y={usefulY}
        width={usefulWidth}
        height={usefulHeight}
        fillEnabled={false}
        stroke="#f59e0b"
        strokeWidth={1.2}
        dash={[6, 4]}
        opacity={0.95}
        listening={false}
      />
    </Group>
  );
}

function SnapGuideOverlay({
  page,
  guides,
}: {
  page: WorkspacePageLayout;
  guides: WorkspaceSnapGuide[];
}) {
  if (guides.length === 0) {
    return null;
  }

  return (
    <Group x={page.x} y={page.y} listening={false} name={`SnapGuideOverlay:${page.id}`}>
      {[...guides].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0)).map((guide, index) => {
        const isPrimary = index === 0;
        const isVertical = guide.axis === "x";
        const stroke =
          guide.kind === "object"
            ? "#22c55e"
            : guide.kind === "container"
              ? "#0ea5e9"
            : guide.kind === "dimension"
              ? "#a855f7"
            : guide.kind === "page"
              ? "#8b5cf6"
              : guide.kind === "bounds"
                ? "#ef4444"
                : guide.kind === "margin"
                  ? "#f59e0b"
                  : "#22d3ee";
        const dash = guide.kind === "grid" ? [3, 3] : [7, 4];
        const label =
          guide.label ??
          (guide.kind === "object"
            ? "Objet"
            : guide.kind === "page"
              ? "Page"
              : guide.kind === "bounds"
                ? "Bord"
            : guide.kind === "margin"
                  ? "Marge"
                  : guide.kind === "container"
                    ? "Conteneur"
                  : guide.kind === "dimension"
                    ? "Dimension"
                  : guide.kind === "spacing"
                    ? "Espacement"
                  : "Grille");
        const labelPosition = isVertical ? { x: guide.position + 6, y: Math.min(guide.start + 14, guide.end - 14) } : { x: Math.min(guide.start + 14, guide.end - 14), y: guide.position - 18 };
        return (
          <Fragment key={`${page.id}-${guide.axis}-${guide.kind}-${index}`}>
            <Line
              points={isVertical ? [guide.position, guide.start, guide.position, guide.end] : [guide.start, guide.position, guide.end, guide.position]}
              stroke={stroke}
              strokeWidth={isPrimary ? 3.2 : 2.1}
              dash={dash}
              opacity={isPrimary ? 1 : 0.72}
              listening={false}
              strokeScaleEnabled={false}
              perfectDrawEnabled={false}
            />
            <Circle
              x={isVertical ? guide.position : guide.start}
              y={isVertical ? guide.start : guide.position}
              radius={isPrimary ? 3 : 2.4}
              fill={stroke}
              opacity={isPrimary ? 1 : 0.82}
              listening={false}
            />
            <Circle
              x={isVertical ? guide.position : guide.end}
              y={isVertical ? guide.end : guide.position}
              radius={isPrimary ? 3 : 2.4}
              fill={stroke}
              opacity={isPrimary ? 1 : 0.82}
              listening={false}
            />
            <Group x={labelPosition.x} y={labelPosition.y} listening={false}>
              <Rect width={Math.max(label.length * 5.4, 34)} height={16} fill={isPrimary ? "rgba(15, 23, 42, 0.92)" : "rgba(15, 23, 42, 0.78)"} cornerRadius={8} />
              <Text x={0} y={1} width={Math.max(label.length * 5.4, 34)} height={14} text={label} fill="#f8fafc" fontFamily="Inter" fontSize={9} align="center" listening={false} />
            </Group>
          </Fragment>
        );
      })}
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
              sceneFunc={(context: Konva.Context, shape: Konva.Shape) => {
                context.beginPath();
                drawArcPreviewPath(context, geometry);
                if (geometry.arcType === "pie") {
                  context.fillStrokeShape(shape);
                  return;
                }

                context.strokeShape(shape);
              }}
              hitFunc={(context: Konva.Context, shape: Konva.Shape) => {
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
  return resolveCanonicalFrameFromProjectedGeometry(renderNode, {
    x: override?.x ?? konvaNode.x(),
    y: override?.y ?? konvaNode.y(),
    width: konvaNode.width() || baseFrame.width,
    height: konvaNode.height() || baseFrame.height,
    scaleX: konvaNode.scaleX(),
    scaleY: konvaNode.scaleY(),
  });
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

function isApproximatelyScale(value: number, expected: number) {
  return Math.abs(value - expected) < 0.0001;
}

function isCanonicalProjectedScale(renderNode: RenderNode, konvaNode: Konva.Node) {
  const expectedScaleX = propBoolean(renderNode.props, "flipX") ? -1 : 1;
  const expectedScaleY = propBoolean(renderNode.props, "flipY") ? -1 : 1;
  return isApproximatelyScale(konvaNode.scaleX(), expectedScaleX) && isApproximatelyScale(konvaNode.scaleY(), expectedScaleY);
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

function resolveRichTextCanvasHtml(node: RenderNode, dataset: unknown) {
  const displayMode = (propString(node.props, "richTextDisplayMode") as RichTextVariableDisplayMode | undefined) ?? "label";
  const rawJson = node.props?.richTextJson;
  if (rawJson && typeof rawJson === "object") {
    return serializeRichTextJsonToHtml(rawJson as JSONContent, { displayMode, dataset });
  }

  return propString(node.props, "html") ?? "";
}

function hasImageEditingChanges(editing: ImageEditingState) {
  const maskBounds = editing.mask.bounds;
  return (
    editing.crop.ratio !== "free" ||
    Math.abs(editing.crop.zoom - 1) > 0.001 ||
    Math.abs(editing.crop.x) > 0.001 ||
    Math.abs(editing.crop.y) > 0.001 ||
    Math.abs(editing.crop.rotation) > 0.001 ||
    editing.mask.type !== "rectangle" ||
    editing.mask.radius > 0 ||
    Math.abs(maskBounds.x) > 0.001 ||
    Math.abs(maskBounds.y) > 0.001 ||
    Math.abs(maskBounds.width - 1) > 0.001 ||
    Math.abs(maskBounds.height - 1) > 0.001 ||
    hasImageMaskBorderChanges(editing.mask.border) ||
    editing.filter !== "none" ||
    Object.entries(editing.adjustments).some(([key, value]) => (key === "opacity" ? Math.abs(value - 1) > 0.001 : Math.abs(value) > 0.001)) ||
    editing.transform.flipX ||
    editing.transform.flipY ||
    Math.abs(editing.transform.rotation) > 0.001
  );
}

function resolveEditedImageTransform(node: RenderNode, editing: ImageEditingState) {
  const zoom = Math.max(0.25, editing.crop.zoom);
  const width = node.frame.width * zoom;
  const height = node.frame.height * zoom;

  return {
    x: node.frame.width / 2 + editing.crop.x * node.frame.width * 0.5,
    y: node.frame.height / 2 + editing.crop.y * node.frame.height * 0.5,
    width,
    height,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: editing.crop.rotation + editing.transform.rotation,
    scaleX: editing.transform.flipX ? -1 : 1,
    scaleY: editing.transform.flipY ? -1 : 1,
  };
}

function resolveKonvaImageFilters(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  const filters: Array<(imageData: ImageData) => void> = [];
  const konvaFilters = Konva.Filters as Record<string, (imageData: ImageData) => void>;

  if (preset.grayscale > 0.5 && konvaFilters.Grayscale) {
    filters.push(konvaFilters.Grayscale);
  }

  if (preset.sepia > 0.01 && konvaFilters.Sepia) {
    filters.push(konvaFilters.Sepia);
  }

  if (Math.abs(resolveKonvaBrightness(editing)) > 0.001 && konvaFilters.Brighten) {
    filters.push(konvaFilters.Brighten);
  }

  if (Math.abs(resolveKonvaContrast(editing)) > 0.001 && konvaFilters.Contrast) {
    filters.push(konvaFilters.Contrast);
  }

  if ((Math.abs(resolveKonvaSaturation(editing)) > 0.001 || Math.abs(editing.adjustments.hue) > 0.001 || Math.abs(editing.adjustments.temperature) > 0.001) && konvaFilters.HSL) {
    filters.push(konvaFilters.HSL);
  }

  if (editing.adjustments.blur > 0.001 && konvaFilters.Blur) {
    filters.push(konvaFilters.Blur);
  }

  if (editing.adjustments.grain > 0.001 && konvaFilters.Noise) {
    filters.push(konvaFilters.Noise);
  }

  return filters;
}

function resolveKonvaBrightness(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  return clampNumber(editing.adjustments.brightness + editing.adjustments.exposure * 0.35 + preset.brightness, -1, 1);
}

function resolveKonvaContrast(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  return clampNumber((editing.adjustments.contrast + preset.contrast) * 100, -100, 100);
}

function resolveKonvaSaturation(editing: ImageEditingState) {
  const preset = getFilterPresetValues(editing.filter);
  return clampNumber((editing.adjustments.saturation + preset.saturation) * 2, -2, 2);
}

function applyImageMaskClip(context: Konva.Context, width: number, height: number, editing: ImageEditingState) {
  const maskFrame = resolveImageMaskFrame(editing.mask.bounds, width, height);
  const radius = Math.min(editing.mask.radius, maskFrame.width / 2, maskFrame.height / 2);
  context.beginPath();

  switch (editing.mask.type) {
    case "rounded-rect":
      drawRoundedRectClip(context, maskFrame.x, maskFrame.y, maskFrame.width, maskFrame.height, radius);
      return;
    case "circle": {
      const size = Math.min(maskFrame.width, maskFrame.height);
      context.arc(maskFrame.x + maskFrame.width / 2, maskFrame.y + maskFrame.height / 2, size / 2, 0, Math.PI * 2, false);
      return;
    }
    case "ellipse":
      context.save();
      context.translate(maskFrame.x + maskFrame.width / 2, maskFrame.y + maskFrame.height / 2);
      context.scale(maskFrame.width / 2, maskFrame.height / 2);
      context.arc(0, 0, 1, 0, Math.PI * 2, false);
      context.restore();
      return;
    case "diamond":
      drawPolygonClip(context, [
        [maskFrame.x + maskFrame.width / 2, maskFrame.y],
        [maskFrame.x + maskFrame.width, maskFrame.y + maskFrame.height / 2],
        [maskFrame.x + maskFrame.width / 2, maskFrame.y + maskFrame.height],
        [maskFrame.x, maskFrame.y + maskFrame.height / 2],
      ]);
      return;
    case "star":
      drawStarClip(context, maskFrame.x, maskFrame.y, maskFrame.width, maskFrame.height);
      return;
    case "blob":
      drawPolygonClip(context, [
        [maskFrame.x + maskFrame.width * 0.44, maskFrame.y + maskFrame.height * 0.03],
        [maskFrame.x + maskFrame.width * 0.75, maskFrame.y + maskFrame.height * 0.1],
        [maskFrame.x + maskFrame.width * 0.98, maskFrame.y + maskFrame.height * 0.38],
        [maskFrame.x + maskFrame.width * 0.89, maskFrame.y + maskFrame.height * 0.72],
        [maskFrame.x + maskFrame.width * 0.61, maskFrame.y + maskFrame.height * 0.96],
        [maskFrame.x + maskFrame.width * 0.26, maskFrame.y + maskFrame.height * 0.88],
        [maskFrame.x + maskFrame.width * 0.04, maskFrame.y + maskFrame.height * 0.58],
        [maskFrame.x + maskFrame.width * 0.12, maskFrame.y + maskFrame.height * 0.23],
      ]);
      return;
    case "rectangle":
    default:
      context.rect(maskFrame.x, maskFrame.y, maskFrame.width, maskFrame.height);
      context.closePath();
  }
}

function drawRoundedRectClip(context: Konva.Context, x: number, y: number, width: number, height: number, radius: number) {
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawPolygonClip(context: Konva.Context, points: Array<[number, number]>) {
  const [firstPoint, ...remainingPoints] = points;
  context.moveTo(firstPoint[0], firstPoint[1]);
  remainingPoints.forEach((point) => context.lineTo(point[0], point[1]));
  context.closePath();
}

function drawStarClip(context: Konva.Context, x: number, y: number, width: number, height: number) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const outer = Math.min(width, height) / 2;
  const inner = outer * 0.46;
  const points: Array<[number, number]> = [];

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? outer : inner;
    points.push([centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius]);
  }

  drawPolygonClip(context, points);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildRichTextCanvasBlockStyle(node: RenderNode, pageLayout: WorkspacePageLayout, viewport: WorkspaceViewport): CSSProperties {
  const flipX = propBoolean(node.props, "flipX");
  const flipY = propBoolean(node.props, "flipY");
  const x = (pageLayout.x + node.frame.x + (flipX ? node.frame.width : 0)) * viewport.zoom + viewport.panX;
  const y = (pageLayout.y + node.frame.y + (flipY ? node.frame.height : 0)) * viewport.zoom + viewport.panY;
  const transforms = [`scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`];
  const rotation = node.rotation ?? 0;
  if (Math.abs(rotation) > 0.001) {
    transforms.push(`rotate(${rotation}deg)`);
  }

  return {
    left: x,
    top: y,
    width: Math.max(node.frame.width * viewport.zoom, 1),
    height: Math.max(node.frame.height * viewport.zoom, 1),
    opacity: propNumber(node.props, "opacity") ?? 1,
    transform: transforms.join(" "),
    transformOrigin: "top left",
  };
}

function buildRichTextContentStyle(node: RenderNode): CSSProperties {
  const padding = propNumber(node.props, "padding") ?? 8;
  return {
    color: propString(node.props, "color") ?? "#111827",
    fontFamily: propString(node.props, "fontFamily") ?? "Inter, system-ui, sans-serif",
    fontSize: propNumber(node.props, "fontSize") ?? 12,
    fontStyle: propString(node.props, "fontStyle") ?? "normal",
    fontWeight: propString(node.props, "fontWeight") ?? propNumber(node.props, "fontWeight") ?? 400,
    letterSpacing: propNumber(node.props, "letterSpacing") ?? 0,
    lineHeight: propNumber(node.props, "lineHeight") ?? 1.2,
    paddingTop: propNumber(node.props, "paddingTop") ?? padding,
    paddingRight: propNumber(node.props, "paddingRight") ?? padding,
    paddingBottom: propNumber(node.props, "paddingBottom") ?? padding,
    paddingLeft: propNumber(node.props, "paddingLeft") ?? padding,
    textAlign: resolveRichTextAlign(node.props),
  };
}

function resolveRichTextAlign(props: RenderNode["props"]): CSSProperties["textAlign"] {
  const align = propString(props, "textAlign") ?? propString(props, "align");
  return align === "center" || align === "right" || align === "justify" ? align : "left";
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
