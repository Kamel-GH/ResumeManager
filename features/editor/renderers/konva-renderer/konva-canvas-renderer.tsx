"use client";

import { Circle, Layer, Rect, Stage, Text } from "react-konva";

import type { CanonicalRenderTree, RenderNode } from "@/features/editor/schema/render-tree";

import {
  getKonvaShapeProps,
  getKonvaTextProps,
  isSelectableNode,
} from "@/features/editor/renderers/konva-renderer/konva-renderer-model";

export type KonvaCanvasRendererProps = {
  renderTree: CanonicalRenderTree;
  selectedElementIds: string[];
  onSelectElement: (elementIds: string[]) => void;
};

export function KonvaCanvasRenderer({ renderTree, selectedElementIds, onSelectElement }: KonvaCanvasRendererProps) {
  const page = renderTree.pages[0];

  if (!page) {
    return null;
  }

  return (
    <Stage width={page.width} height={page.height} className="ef-render-page" aria-label="Template CV">
      <Layer>
        {page.children.map((node) => (
          <KonvaRenderNode key={node.id} node={node} onSelectElement={onSelectElement} />
        ))}
        {selectedElementIds.map((elementId) => {
          const selectedNode = page.children.find((node) => node.id === elementId);
          return selectedNode ? <SelectionOverlay key={`konva-selection-${elementId}`} node={selectedNode} /> : null;
        })}
      </Layer>
    </Stage>
  );
}

function KonvaRenderNode({ node, onSelectElement }: { node: RenderNode; onSelectElement: (elementIds: string[]) => void }) {
  if (!node.visible) {
    return null;
  }

  const selectProps = isSelectableNode(node)
    ? {
        onClick: () => onSelectElement([node.id]),
        onTap: () => onSelectElement([node.id]),
      }
    : {};

  if (node.type === "text") {
    return <Text {...getKonvaTextProps(node)} {...selectProps} />;
  }

  if (node.type === "shape") {
    const shapeProps = getKonvaShapeProps(node);

    if (shapeProps.shape === "circle") {
      return <Circle {...shapeProps.circle} {...selectProps} />;
    }

    return <Rect {...shapeProps.rect} {...selectProps} />;
  }

  return null;
}

function SelectionOverlay({ node }: { node: RenderNode }) {
  const { frame } = node;
  const handleSize = 8;
  const offset = 7;
  const handles = [
    { x: frame.x - offset, y: frame.y - offset },
    { x: frame.x + frame.width - 1, y: frame.y - offset },
    { x: frame.x - offset, y: frame.y + frame.height - 1 },
    { x: frame.x + frame.width - 1, y: frame.y + frame.height - 1 },
  ];

  return (
    <>
      <Rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} fillEnabled={false} stroke="#2563eb" strokeWidth={2} dash={[6, 3]} />
      {handles.map((handle) => (
        <Rect key={`${handle.x}-${handle.y}`} x={handle.x} y={handle.y} width={handleSize} height={handleSize} fill="#2563eb" />
      ))}
    </>
  );
}
