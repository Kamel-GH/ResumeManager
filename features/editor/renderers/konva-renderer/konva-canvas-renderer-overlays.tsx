"use client";

import type { ComponentType } from "react";
import { Group as GroupImpl, Line as LineImpl, Rect as RectImpl } from "react-konva";

import type { WorkspacePageLayout } from "@/features/editor/schema/workspace-layout";

type KonvaJsxComponent = ComponentType<Record<string, unknown>>;

const Group = GroupImpl as unknown as KonvaJsxComponent;
const Line = LineImpl as unknown as KonvaJsxComponent;
const Rect = RectImpl as unknown as KonvaJsxComponent;

export function SelectedContourBox({ bounds }: { bounds: { x: number; y: number; width: number; height: number } }) {
  return (
    <Rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      fill="rgba(59, 130, 246, 0.06)"
      stroke="#3b82f6"
      strokeWidth={1}
      dash={[4, 4]}
      listening={false}
      name="SelectedContourBox"
    />
  );
}

export function FrameOutlineRect({
  x,
  y,
  width,
  height,
  active,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}) {
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={active ? "rgba(17, 24, 39, 0.02)" : "transparent"}
      stroke={active ? "#111827" : "#d1d5db"}
      strokeWidth={active ? 1.4 : 1}
      listening={false}
      name="FrameOutlineRect"
    />
  );
}

export function WorkspaceGrid({ page, gridSize }: { page: WorkspacePageLayout; gridSize: number }) {
  const step = Math.max(gridSize, 1);
  const columns = Math.ceil(page.width / step);
  const rows = Math.ceil(page.height / step);

  return (
    <Group x={page.x} y={page.y} listening={false} name={`WorkspaceGrid:${page.id}`}>
      {Array.from({ length: columns + 1 }).map((_, index) => (
        <Line key={`grid-v-${page.id}-${index}`} points={[index * step, 0, index * step, page.height]} stroke="rgba(148, 163, 184, 0.18)" strokeWidth={1} />
      ))}
      {Array.from({ length: rows + 1 }).map((_, index) => (
        <Line key={`grid-h-${page.id}-${index}`} points={[0, index * step, page.width, index * step]} stroke="rgba(148, 163, 184, 0.18)" strokeWidth={1} />
      ))}
    </Group>
  );
}

export function PageSurface({ page, active }: { page: WorkspacePageLayout; active: boolean }) {
  return (
    <Group x={page.x} y={page.y} listening={false} name={`PageSurface:${page.id}`}>
      <Rect x={0} y={0} width={page.width} height={page.height} fill="white" stroke={active ? "#0f172a" : "#cbd5e1"} strokeWidth={active ? 1.4 : 1} />
      <FrameOutlineRect x={0} y={0} width={page.width} height={page.height} active={active} />
    </Group>
  );
}

export function PageMarginGuides({ page }: { page: WorkspacePageLayout }) {
  const margin = page.margin;
  const innerX = margin.left;
  const innerY = margin.top;
  const innerWidth = Math.max(page.width - margin.left - margin.right, 1);
  const innerHeight = Math.max(page.height - margin.top - margin.bottom, 1);

  return (
    <Group x={page.x} y={page.y} listening={false} name={`PageMarginGuides:${page.id}`}>
      <Line points={[innerX, 0, innerX, page.height]} stroke="rgba(148, 163, 184, 0.38)" strokeWidth={1} dash={[6, 6]} />
      <Line points={[page.width - margin.right, 0, page.width - margin.right, page.height]} stroke="rgba(148, 163, 184, 0.38)" strokeWidth={1} dash={[6, 6]} />
      <Line points={[0, innerY, page.width, innerY]} stroke="rgba(148, 163, 184, 0.38)" strokeWidth={1} dash={[6, 6]} />
      <Line points={[0, page.height - margin.bottom, page.width, page.height - margin.bottom]} stroke="rgba(148, 163, 184, 0.38)" strokeWidth={1} dash={[6, 6]} />
      <Rect x={innerX} y={innerY} width={innerWidth} height={innerHeight} stroke="rgba(148, 163, 184, 0.18)" strokeWidth={1} dash={[4, 4]} listening={false} />
    </Group>
  );
}
