"use client";

import type { CanonicalRenderTree, RenderNode, RenderNodeProps } from "@/features/editor/schema/render-tree";
import type { ImageEditingState } from "@/features/editor/components/image-editing/image-editor-types";
import {
  buildImageCssFilter,
  buildImageMaskPathData,
  resolveImageEditingFromProps,
  resolveImageMaskBorderPresentation,
  resolveImageMaskFrame,
} from "@/features/editor/components/image-editing/image-editor-utils";

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
      <ArrowMarker />
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

  if (node.type === "rich-text") {
    return <TemplateRichText node={node} onSelect={handleSelect} />;
  }

  if (node.type === "image") {
    return <TemplateImage node={node} onSelect={handleSelect} />;
  }

  if (node.type === "table") {
    return <TemplateTable node={node} onSelect={handleSelect} />;
  }

  if (node.type === "list") {
    return <TemplateList node={node} onSelect={handleSelect} />;
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
  const rotation = node.rotation ?? 0;
  const svgSource = propString(props, "svg") ?? propString(props, "src");

  if (svgSource) {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <image
          x={frame.x}
          y={frame.y}
          width={frame.width}
          height={frame.height}
          href={normalizeRenderableSvgSource(svgSource)}
          preserveAspectRatio="none"
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "circle") {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <circle
          cx={frame.x + frame.width / 2}
          cy={frame.y + frame.height / 2}
          r={Math.min(frame.width, frame.height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "ellipse") {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <ellipse
          cx={frame.x + frame.width / 2}
          cy={frame.y + frame.height / 2}
          rx={Math.max(frame.width / 2, 1)}
          ry={Math.max(frame.height / 2, 1)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "line") {
    const points = propNumberArray(props, "points") ?? [0, 0, Math.max(frame.width, 1), Math.max(frame.height, 1)];
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <line
          x1={frame.x + points[0]}
          y1={frame.y + points[1]}
          x2={frame.x + points[2]}
          y2={frame.y + points[3]}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          markerEnd={propBoolean(props, "arrow") ? "url(#arrow-marker)" : undefined}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "polygon") {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <polygon
          points={pointsToSvgString(frame, propNumberArray(props, "points"))}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "polyline") {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <polyline
          points={pointsToSvgString(frame, propNumberArray(props, "points"))}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "curve") {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <path
          d={buildCurvePath(frame, propNumberArray(props, "points"))}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  if (shape === "arc") {
    return (
      <>
        <FrameOutlineRect frame={frame} rotation={rotation} />
        <path
          d={buildArcPath(frame, props)}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          transform={buildSvgNodeTransform(frame, props, rotation)}
          onClick={onSelect}
        />
      </>
    );
  }

  return (
    <>
      <FrameOutlineRect frame={frame} rotation={rotation} />
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
        transform={buildSvgNodeTransform(frame, props, rotation)}
        onClick={onSelect}
      />
    </>
  );
}

function TemplateImage({ node, onSelect }: { node: RenderNode; onSelect?: () => void }) {
  const { frame, props } = node;
  const src = normalizeRenderableSvgSource(propString(props, "src") ?? propString(props, "svg") ?? "");
  const imageEditing = resolveImageEditingFromProps(props);
  const clipId = `clip-${node.id}`;
  const imageWidth = frame.width * imageEditing.crop.zoom;
  const imageHeight = frame.height * imageEditing.crop.zoom;
  const imageX = frame.x + frame.width / 2 + imageEditing.crop.x * frame.width * 0.5 - imageWidth / 2;
  const imageY = frame.y + frame.height / 2 + imageEditing.crop.y * frame.height * 0.5 - imageHeight / 2;
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;

  return (
    <>
      <FrameOutlineRect frame={frame} rotation={node.rotation ?? 0} />
      <defs>
        <clipPath id={clipId}>{renderImageSvgClipPath(frame, imageEditing)}</clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} transform={`rotate(${node.rotation ?? 0} ${frame.x} ${frame.y})`} onClick={onSelect}>
        <image
          x={imageX}
          y={imageY}
          width={imageWidth}
          height={imageHeight}
          href={src}
          preserveAspectRatio="none"
          opacity={(propNumber(props, "opacity") ?? 1) * imageEditing.adjustments.opacity}
          transform={`translate(${centerX} ${centerY}) scale(${imageEditing.transform.flipX ? -1 : 1} ${imageEditing.transform.flipY ? -1 : 1}) rotate(${imageEditing.crop.rotation + imageEditing.transform.rotation}) translate(${-centerX} ${-centerY})`}
          style={{ filter: buildImageCssFilter(imageEditing) }}
        />
      </g>
      {renderImageSvgMaskBorder(frame, node.rotation ?? 0, imageEditing)}
    </>
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
    <>
      <FrameOutlineRect frame={frame} rotation={node.rotation ?? 0} />
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
        transform={`rotate(${node.rotation ?? 0} ${frame.x} ${frame.y})`}
        onClick={onSelect}
      >
        {lines.map((line, index) => (
          <tspan key={`${node.id}-${index}`} x={x} dy={index === 0 ? 0 : fontSize * lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </>
  );
}

function TemplateRichText({ node, onSelect }: { node: RenderNode; onSelect?: () => void }) {
  const { frame, props } = node;
  const fontSize = propNumber(props, "fontSize") ?? 12;
  const lineHeight = propNumber(props, "lineHeight") ?? 1.2;
  const textAnchor = propTextAnchor(props);
  const textX = textAnchor === "middle" ? frame.x + frame.width / 2 : textAnchor === "end" ? frame.x + frame.width - 8 : frame.x + 8;
  const fill = propString(props, "fill") ?? "rgba(255,255,255,0.02)";
  const stroke = propString(props, "stroke") ?? "#cbd5e1";
  const strokeWidth = propNumber(props, "strokeWidth") ?? 1;
  const opacity = propNumber(props, "opacity") ?? 1;

  return (
    <g onClick={onSelect} transform={buildSvgNodeTransform(frame, props, node.rotation ?? 0)} opacity={opacity}>
      <FrameOutlineRect frame={frame} rotation={0} />
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <text
        x={textX}
        y={frame.y + fontSize + 8}
        width={Math.max(frame.width - 16, 1)}
        height={Math.max(frame.height - 16, 1)}
        fill={propString(props, "color") ?? "#111827"}
        fontFamily={propString(props, "fontFamily") ?? "Inter"}
        fontSize={fontSize}
        fontStyle={propString(props, "fontStyle") ?? "normal"}
        fontWeight={propFontWeight(props)}
        letterSpacing={propNumber(props, "letterSpacing") ?? 0}
        textAnchor={textAnchor}
      >
        {(propString(props, "text") ?? "").split("\n").map((line, index) => (
          <tspan key={`${node.id}-${index}`} x={textX} dy={index === 0 ? 0 : fontSize * lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function renderImageSvgClipPath(frame: { x: number; y: number; width: number; height: number }, editing: ImageEditingState) {
  const maskFrame = resolveImageMaskFrame(editing.mask.bounds, frame.width, frame.height);
  const centerX = frame.x + maskFrame.x + maskFrame.width / 2;
  const centerY = frame.y + maskFrame.y + maskFrame.height / 2;
  const radius = Math.min(editing.mask.radius, maskFrame.width / 2, maskFrame.height / 2);

  switch (editing.mask.type) {
    case "rounded-rect":
      return <rect x={frame.x + maskFrame.x} y={frame.y + maskFrame.y} width={maskFrame.width} height={maskFrame.height} rx={radius} ry={radius} />;
    case "circle": {
      const size = Math.min(maskFrame.width, maskFrame.height);
      return <circle cx={centerX} cy={centerY} r={size / 2} />;
    }
    case "ellipse":
      return <ellipse cx={centerX} cy={centerY} rx={maskFrame.width / 2} ry={maskFrame.height / 2} />;
    case "diamond":
      return <polygon points={`${centerX},${frame.y + maskFrame.y} ${frame.x + maskFrame.x + maskFrame.width},${centerY} ${centerX},${frame.y + maskFrame.y + maskFrame.height} ${frame.x + maskFrame.x},${centerY}`} />;
    case "star":
      return <polygon points={buildStarSvgPoints({ x: frame.x + maskFrame.x, y: frame.y + maskFrame.y, width: maskFrame.width, height: maskFrame.height })} />;
    case "blob":
      return (
        <polygon
          points={[
            [frame.x + maskFrame.x + maskFrame.width * 0.44, frame.y + maskFrame.y + maskFrame.height * 0.03],
            [frame.x + maskFrame.x + maskFrame.width * 0.75, frame.y + maskFrame.y + maskFrame.height * 0.1],
            [frame.x + maskFrame.x + maskFrame.width * 0.98, frame.y + maskFrame.y + maskFrame.height * 0.38],
            [frame.x + maskFrame.x + maskFrame.width * 0.89, frame.y + maskFrame.y + maskFrame.height * 0.72],
            [frame.x + maskFrame.x + maskFrame.width * 0.61, frame.y + maskFrame.y + maskFrame.height * 0.96],
            [frame.x + maskFrame.x + maskFrame.width * 0.26, frame.y + maskFrame.y + maskFrame.height * 0.88],
            [frame.x + maskFrame.x + maskFrame.width * 0.04, frame.y + maskFrame.y + maskFrame.height * 0.58],
            [frame.x + maskFrame.x + maskFrame.width * 0.12, frame.y + maskFrame.y + maskFrame.height * 0.23],
          ]
            .map((point) => point.join(","))
            .join(" ")}
        />
      );
    case "rectangle":
    default:
      return <rect x={frame.x + maskFrame.x} y={frame.y + maskFrame.y} width={maskFrame.width} height={maskFrame.height} />;
  }
}

function renderImageSvgMaskBorder(frame: { x: number; y: number; width: number; height: number }, rotation: number, editing: ImageEditingState) {
  const border = editing.mask.border;
  if (border.width <= 0) {
    return null;
  }

  const maskFrame = resolveImageMaskFrame(editing.mask.bounds, frame.width, frame.height);
  const pathData = buildImageMaskPathData(
    {
      x: frame.x + maskFrame.x,
      y: frame.y + maskFrame.y,
      width: maskFrame.width,
      height: maskFrame.height,
    },
    editing.mask.type,
    editing.mask.type === "rounded-rect" ? editing.mask.radius : 0,
  );
  const presentation = resolveImageMaskBorderPresentation(border);

  return (
    <g transform={`rotate(${rotation} ${frame.x} ${frame.y})`} aria-hidden="true" pointerEvents="none">
      <path
        d={pathData}
        fill="none"
        stroke={border.color}
        strokeWidth={border.width}
        strokeDasharray={presentation.dash.length > 0 ? presentation.dash.join(" ") : undefined}
        strokeLinecap={presentation.lineCap}
        strokeLinejoin={presentation.lineJoin}
        vectorEffect="non-scaling-stroke"
        style={{
          filter:
            border.shadow > 0
              ? `drop-shadow(0 0 ${Math.max(1, border.shadow * 9).toFixed(2)}px rgba(0, 0, 0, 0.55))`
              : undefined,
        }}
      />
    </g>
  );
}

function buildStarSvgPoints(frame: { x: number; y: number; width: number; height: number }) {
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;
  const outer = Math.min(frame.width, frame.height) / 2;
  const inner = outer * 0.46;
  const points: string[] = [];

  for (let index = 0; index < 10; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 === 0 ? outer : inner;
    points.push(`${centerX + Math.cos(angle) * radius},${centerY + Math.sin(angle) * radius}`);
  }

  return points.join(" ");
}

function TemplateTable({ node, onSelect }: { node: RenderNode; onSelect?: () => void }) {
  const { frame, props } = node;
  const rows = Math.max(2, propNumber(props, "rows") ?? 3);
  const columns = Math.max(2, propNumber(props, "columns") ?? 3);
  const headerRow = propBoolean(props, "headerRow");
  const cellWidth = Math.max(frame.width / columns, 1);
  const cellHeight = Math.max(frame.height / rows, 1);
  const fill = propString(props, "fill") ?? "#ffffff";
  const stroke = propString(props, "stroke") ?? "#cbd5e1";
  const strokeWidth = propNumber(props, "strokeWidth") ?? 1;
  const opacity = propNumber(props, "opacity") ?? 1;

  return (
    <g onClick={onSelect} transform={buildSvgNodeTransform(frame, props, node.rotation ?? 0)} opacity={opacity}>
      <FrameOutlineRect frame={frame} rotation={0} />
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} rx={2} />
      {headerRow ? <rect x={frame.x} y={frame.y} width={frame.width} height={cellHeight} fill="rgba(148, 163, 184, 0.12)" rx={2} /> : null}
      {Array.from({ length: rows - 1 }, (_, index) => index + 1).map((row) => (
        <line key={`table-row-${node.id}-${row}`} x1={frame.x} y1={frame.y + row * cellHeight} x2={frame.x + frame.width} y2={frame.y + row * cellHeight} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {Array.from({ length: columns - 1 }, (_, index) => index + 1).map((column) => (
        <line key={`table-col-${node.id}-${column}`} x1={frame.x + column * cellWidth} y1={frame.y} x2={frame.x + column * cellWidth} y2={frame.y + frame.height} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => {
          const isHeader = row === 0 && headerRow;
          const label = isHeader ? `En-tête ${column + 1}` : `Texte ${row + 1}.${column + 1}`;
          return (
            <text
              key={`table-cell-${node.id}-${row}-${column}`}
              x={frame.x + column * cellWidth + 8}
              y={frame.y + row * cellHeight + 16}
              width={Math.max(cellWidth - 16, 1)}
              height={Math.max(cellHeight - 12, 1)}
              fill={isHeader ? "#0f172a" : "#475569"}
              fontFamily="Inter"
              fontSize={isHeader ? 12 : 11}
              fontWeight={isHeader ? 600 : 400}
              pointerEvents="none"
            >
              {label}
            </text>
          );
        }),
      )}
    </g>
  );
}

function TemplateList({ node, onSelect }: { node: RenderNode; onSelect?: () => void }) {
  const { frame, props } = node;
  const title = propString(props, "label") ?? propString(props, "name") ?? "Preset dynamique";
  const presetType = propString(props, "presetType") ?? "PRESET";
  const mappedPath = propString(props, "mappedPath") ?? propString(props, "bindingId") ?? "";
  const sampleItemsCount = Math.max(propNumber(props, "sampleItemsCount") ?? 3, 1);
  const repeatable = propBoolean(props, "repeatable");
  const rows = Math.max(Math.min(sampleItemsCount, 4), 3);
  const headerHeight = 28;
  const bodyTop = headerHeight + 10;
  const bodyBottom = 10;
  const rowHeight = Math.max((frame.height - bodyTop - bodyBottom) / rows, 20);
  const fill = propString(props, "fill") ?? "#ffffff";
  const stroke = propString(props, "stroke") ?? "#cbd5e1";
  const strokeWidth = propNumber(props, "strokeWidth") ?? 1;
  const opacity = propNumber(props, "opacity") ?? 1;

  return (
    <g onClick={onSelect} transform={buildSvgNodeTransform(frame, props, node.rotation ?? 0)} opacity={opacity}>
      <FrameOutlineRect frame={frame} rotation={0} />
      <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} rx={4} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <rect x={frame.x} y={frame.y} width={frame.width} height={headerHeight} rx={4} fill="rgba(148, 163, 184, 0.12)" />
      <text x={frame.x + 10} y={frame.y + 18} fill="#0f172a" fontFamily="Inter, Arial, sans-serif" fontSize={12} fontWeight={700}>
        {title}
      </text>
      <text x={frame.x + 10} y={frame.y + 39} fill="#64748b" fontFamily="Inter, Arial, sans-serif" fontSize={10}>
        {mappedPath}
      </text>
      <text x={frame.x + frame.width - 10} y={frame.y + 18} fill="#475569" fontFamily="Inter, Arial, sans-serif" fontSize={10} textAnchor="end">
        {repeatable ? "Répétable" : "Bloc"}
      </text>
      {Array.from({ length: rows }, (_, index) => {
        const y = frame.y + bodyTop + index * rowHeight;
        return (
          <g key={`svg-list-row-${node.id}-${index}`}>
            <circle cx={frame.x + 14} cy={y + rowHeight / 2} r={2.6} fill="#94a3b8" />
            <line x1={frame.x + 24} y1={y + rowHeight - 1} x2={frame.x + frame.width - 10} y2={y + rowHeight - 1} stroke="rgba(203, 213, 225, 0.75)" strokeWidth={1} />
            <text x={frame.x + 26} y={y + 16} fill="#0f172a" fontFamily="Inter, Arial, sans-serif" fontSize={11}>
              {`Item ${index + 1}`}
            </text>
          </g>
        );
      })}
      {sampleItemsCount > rows ? (
        <text x={frame.x + 10} y={frame.y + frame.height - 6} fill="#64748b" fontFamily="Inter, Arial, sans-serif" fontSize={10}>
          {`+${sampleItemsCount - rows} élément${sampleItemsCount - rows > 1 ? "s" : ""}`}
        </text>
      ) : null}
      <text x={frame.x + frame.width - 10} y={frame.y + frame.height - 6} fill="#94a3b8" fontFamily="Inter, Arial, sans-serif" fontSize={9} textAnchor="end">
        {presetType}
      </text>
    </g>
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
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeDasharray="6 3"
        transform={`rotate(${node.rotation ?? 0} ${frame.x} ${frame.y})`}
      />
      {handles.map((handle) => (
        <rect key={`${handle.x}-${handle.y}`} x={handle.x} y={handle.y} width={handleSize} height={handleSize} fill="#2563eb" />
      ))}
    </g>
  );
}

function ArrowMarker() {
  return (
    <defs>
      <marker id="arrow-marker" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#2563eb" />
      </marker>
    </defs>
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
    <rect
      x={frame.x}
      y={frame.y}
      width={frame.width}
      height={frame.height}
      fill="none"
      stroke="#cbd5e1"
      strokeOpacity={0.85}
      strokeWidth={1}
      pointerEvents="none"
      transform={`rotate(${rotation} ${frame.x} ${frame.y})`}
    />
  );
}

function buildSvgNodeTransform(frame: { x: number; y: number; width: number; height: number }, props: RenderNodeProps, rotation: number) {
  const transforms = [`rotate(${rotation} ${frame.x} ${frame.y})`];
  const flipX = propBoolean(props, "flipX");
  const flipY = propBoolean(props, "flipY");

  if (flipX || flipY) {
    const centerX = frame.x + frame.width / 2;
    const centerY = frame.y + frame.height / 2;
    transforms.push(`translate(${centerX} ${centerY}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1}) translate(${-centerX} ${-centerY})`);
  }

  return transforms.join(" ");
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

function normalizeRenderableSvgSource(source: string) {
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

function pointsToSvgString(frame: { x: number; y: number }, points: number[] | undefined) {
  if (!points || points.length < 2) {
    return "";
  }

  const coords: string[] = [];
  for (let index = 0; index < points.length; index += 2) {
    const x = points[index];
    const y = points[index + 1];
    if (typeof x !== "number" || typeof y !== "number") {
      continue;
    }
    coords.push(`${frame.x + x},${frame.y + y}`);
  }

  return coords.join(" ");
}

function buildCurvePath(frame: { x: number; y: number }, points: number[] | undefined) {
  if (!points || points.length < 4) {
    return "";
  }

  const coords = absolutePointPairs(frame, points);
  if (coords.length === 0) {
    return "";
  }

  if (coords.length === 1) {
    return `M ${coords[0].x} ${coords[0].y}`;
  }

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let index = 1; index < coords.length; index += 1) {
    const current = coords[index];
    const next = coords[index + 1];
    if (!next) {
      path += ` L ${current.x} ${current.y}`;
      break;
    }

    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }

  return path;
}

function buildArcPath(frame: { x: number; y: number; width: number; height: number }, props: RenderNodeProps) {
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const rx = Math.max(frame.width / 2, 1);
  const ry = Math.max(frame.height / 2, 1);
  const startAngle = ((propNumber(props, "startAngle") ?? 0) * Math.PI) / 180;
  const endAngle = ((propNumber(props, "endAngle") ?? 180) * Math.PI) / 180;
  const arcType = propString(props, "arcType") === "pie" ? "pie" : "open";
  const sweepFlag = propNumber(props, "arcSweep") === -1 ? 0 : 1;
  const startX = cx + rx * Math.cos(startAngle);
  const startY = cy + ry * Math.sin(startAngle);
  const endX = cx + rx * Math.cos(endAngle);
  const endY = cy + ry * Math.sin(endAngle);
  const delta = Math.abs(endAngle - startAngle);
  const largeArcFlag = delta > Math.PI ? 1 : 0;

  if (arcType === "pie") {
    return `M ${cx} ${cy} L ${startX} ${startY} A ${rx} ${ry} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY} Z`;
  }

  return `M ${startX} ${startY} A ${rx} ${ry} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
}

function absolutePointPairs(frame: { x: number; y: number }, points: number[]) {
  const coords: Array<{ x: number; y: number }> = [];
  for (let index = 0; index < points.length; index += 2) {
    const x = points[index];
    const y = points[index + 1];
    if (typeof x !== "number" || typeof y !== "number") {
      continue;
    }
    coords.push({ x: frame.x + x, y: frame.y + y });
  }

  return coords;
}
