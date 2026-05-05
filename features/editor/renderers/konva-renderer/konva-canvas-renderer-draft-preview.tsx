"use client";

import Konva from "konva";
import { Ellipse as EllipseImpl, Group as GroupImpl, Line as LineImpl, Rect as RectImpl, Shape as ShapeImpl } from "react-konva";
import type { ComponentType } from "react";

import { isArcToolId, resolveArcGeometryDraft, type CanvasToolDraft } from "@/features/editor/schema/canvas-insertion";
import type { WorkspacePageLayout } from "@/features/editor/schema/workspace-layout";

type KonvaJsxComponent = ComponentType<Record<string, unknown>>;

const Group = GroupImpl as unknown as KonvaJsxComponent;
const Line = LineImpl as unknown as KonvaJsxComponent;
const Rect = RectImpl as unknown as KonvaJsxComponent;
const Ellipse = EllipseImpl as unknown as KonvaJsxComponent;
const Shape = ShapeImpl as unknown as KonvaJsxComponent;

export function DraftPreview({ draft, pageLayout }: { draft: CanvasToolDraft; pageLayout: WorkspacePageLayout | undefined }) {
  if (!pageLayout) {
    return null;
  }

  const { frame, toolId } = draft;
  const points = draft.points ?? [];
  const previewPoints =
    draft.current && points.length > 0 ? [...points.flatMap((point) => [point.x, point.y]), draft.current.x, draft.current.y] : points.flatMap((point) => [point.x, point.y]);

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
              return <Line points={[points[0].x, points[0].y, draft.current.x, draft.current.y]} stroke="#2563eb" strokeWidth={2} dash={[6, 3]} fillEnabled={false} listening={false} />;
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
        <Line points={[draft.start.x, draft.start.y, draft.current.x, draft.current.y]} stroke="#2563eb" strokeWidth={2} dash={[6, 3]} pointerAtEnding={false} pointerLength={8} pointerWidth={8} listening={false} />
      ) : null}
      {toolId === "segments" ? (
        <Line points={previewPoints} stroke="#2563eb" strokeWidth={2} dash={[6, 3]} fill="transparent" tension={0} listening={false} />
      ) : null}
      {toolId === "polygon" ? (
        <Line points={previewPoints} stroke="#2563eb" strokeWidth={2} dash={[6, 3]} closed={points.length >= 3} fill="rgba(59, 130, 246, 0.08)" tension={0} listening={false} />
      ) : null}
      {toolId === "freehand" || toolId === "curves" ? (
        <Line points={previewPoints} stroke="#2563eb" strokeWidth={2} dash={[6, 3]} tension={toolId === "curves" ? 0.5 : 0.35} fill="transparent" listening={false} />
      ) : null}
      {toolId === "richtext" || toolId === "table" ? (
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
