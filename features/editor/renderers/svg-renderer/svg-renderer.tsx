"use client";

import type { CanonicalRenderTree, RenderNode, RenderNodeProps } from "@/features/editor/schema/render-tree";

export type SvgRendererProps = {
  renderTree: CanonicalRenderTree;
  selectedElementIds: string[];
  onSelectElement: (elementIds: string[]) => void;
};

export function SvgRenderer({ renderTree, selectedElementIds, onSelectElement }: SvgRendererProps) {
  const page = renderTree.pages[0];

  if (!page) {
    return null;
  }

  return (
    <svg className="ef-render-page" width={page.width} height={page.height} viewBox={`0 0 ${page.width} ${page.height}`} role="img" aria-label="Template CV">
      {page.children.map((node) => (
        <RenderNodeView key={node.id} node={node} onSelect={onSelectElement} />
      ))}
      {selectedElementIds.map((elementId) => {
        const selectedNode = page.children.find((node) => node.id === elementId);
        return selectedNode ? <SelectionOverlay key={`selection-${elementId}`} node={selectedNode} /> : null;
      })}
    </svg>
  );
}

function RenderNodeView({ node, onSelect }: { node: RenderNode; onSelect: (elementIds: string[]) => void }) {
  if (!node.visible) {
    return null;
  }

  const selectable = propBoolean(node.props, "selectable");
  const handleSelect = selectable ? () => onSelect([node.id]) : undefined;

  if (node.type === "text") {
    return <TemplateText node={node} onSelect={handleSelect} />;
  }

  if (node.type === "shape") {
    return <TemplateShape node={node} onSelect={handleSelect} />;
  }

  return null;
}

function TemplateShape({ node, onSelect }: { node: RenderNode; onSelect?: () => void }) {
  const { frame, props } = node;
  const fill = propString(props, "fill") ?? "#ffffff";
  const stroke = propString(props, "stroke") ?? "none";
  const strokeWidth = propNumber(props, "strokeWidth") ?? 1;
  const dash = propNumberArray(props, "dash")?.join(" ");
  const opacity = propNumber(props, "opacity") ?? 1;
  const shape = propString(props, "shape") ?? "rect";

  if (shape === "circle") {
    return (
      <circle
        cx={frame.x + frame.width / 2}
        cy={frame.y + frame.height / 2}
        r={Math.min(frame.width, frame.height) / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        onClick={onSelect}
      />
    );
  }

  return (
    <rect
      x={frame.x}
      y={frame.y}
      width={frame.width}
      height={frame.height}
      rx={propNumber(props, "cornerRadius") ?? 0}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dash}
      opacity={opacity}
      onClick={onSelect}
    />
  );
}

function TemplateText({ node, onSelect }: { node: RenderNode; onSelect?: () => void }) {
  const { frame, props } = node;
  const lines = (propString(props, "text") ?? "").split("\n");
  const fontSize = propNumber(props, "fontSize") ?? 12;
  const lineHeight = propNumber(props, "lineHeight") ?? 1.2;
  const textAnchor = propTextAnchor(props);
  const x = textAnchor === "middle" ? frame.x + frame.width / 2 : textAnchor === "end" ? frame.x + frame.width : frame.x;

  return (
    <text
      x={x}
      y={frame.y + fontSize}
      width={frame.width}
      height={frame.height}
      fill={propString(props, "color") ?? "#111827"}
      fontFamily={propString(props, "fontFamily") ?? "Inter"}
      fontSize={fontSize}
      fontStyle={propString(props, "fontStyle") ?? "normal"}
      fontWeight={propFontWeight(props)}
      letterSpacing={propNumber(props, "letterSpacing") ?? 0}
      textAnchor={textAnchor}
      onClick={onSelect}
    >
      {lines.map((line, index) => (
        <tspan key={`${node.id}-${index}`} x={x} dy={index === 0 ? 0 : fontSize * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
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
    <g>
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="6 3" />
      {handles.map((handle) => (
        <rect key={`${handle.x}-${handle.y}`} x={handle.x} y={handle.y} width={handleSize} height={handleSize} fill="#2563eb" />
      ))}
    </g>
  );
}

function propString(props: RenderNodeProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
}

function propNumber(props: RenderNodeProps, key: string): number | undefined {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
}

function propBoolean(props: RenderNodeProps, key: string): boolean {
  return props[key] === true;
}

function propNumberArray(props: RenderNodeProps, key: string): number[] | undefined {
  const value = props[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number") ? value : undefined;
}

function propTextAnchor(props: RenderNodeProps): "start" | "middle" | "end" {
  const value = propString(props, "textAlign");
  return value === "center" ? "middle" : value === "right" ? "end" : "start";
}

function propFontWeight(props: RenderNodeProps): string | number {
  const value = props.fontWeight;
  return typeof value === "string" || typeof value === "number" ? value : "normal";
}
