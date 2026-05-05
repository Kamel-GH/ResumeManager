"use client";

import Konva from "konva";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { Circle as CircleImpl, Group as GroupImpl, Image as KonvaImageImpl, Line as LineImpl, Path as PathImpl, Rect as RectImpl, Shape as ShapeImpl, Text as TextImpl } from "react-konva";

import { buildImageMaskPathData, resolveImageEditingFromProps, resolveImageMaskBorderPresentation, resolveImageMaskFrame } from "@/features/editor/components/image-editing/image-editor-utils";
import { getKonvaImageProps } from "@/features/editor/renderers/konva-renderer/konva-renderer-model";
import {
  applyImageMaskClip,
  hasImageEditingChanges,
  normalizeRenderableImageSource,
  propNumber,
  propBoolean,
  propString,
  resolveEditedImageTransform,
  resolveKonvaBrightness,
  resolveKonvaContrast,
  resolveKonvaImageFilters,
  resolveKonvaSaturation,
} from "@/features/editor/renderers/konva-renderer/konva-canvas-renderer-geometry-helpers";
import type { RenderNode } from "@/features/editor/schema/render-tree";

type KonvaJsxComponent = ComponentType<Record<string, unknown>>;

const Group = GroupImpl as unknown as KonvaJsxComponent;
const Rect = RectImpl as unknown as KonvaJsxComponent;
const Line = LineImpl as unknown as KonvaJsxComponent;
const Path = PathImpl as unknown as KonvaJsxComponent;
const Shape = ShapeImpl as unknown as KonvaJsxComponent;
const Text = TextImpl as unknown as KonvaJsxComponent;
const KonvaImage = KonvaImageImpl as unknown as KonvaJsxComponent;

export function FrameOutlineRect({
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

export function ArcKonvaNode({
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
  interactionProps: Record<string, unknown>;
  dragProps: Record<string, unknown>;
  transformProps: Record<string, unknown>;
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
        fill={shapeProps.fill}
        stroke={shapeProps.stroke}
        strokeWidth={shapeProps.strokeWidth}
        opacity={shapeProps.opacity}
      />
    </Group>
  );
}

export function TablePlaceholderNode({
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
  interactionProps: Record<string, unknown>;
  dragProps: Record<string, unknown>;
  transformProps: Record<string, unknown>;
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
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2} />
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

export function ListPlaceholderNode({
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
  interactionProps: Record<string, unknown>;
  dragProps: Record<string, unknown>;
  transformProps: Record<string, unknown>;
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
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={4} />
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
            <CircleImpl cx={14} cy={y + rowHeight / 2} radius={2.6} fill="#94a3b8" listening={false} />
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

export function RichTextPlaceholderNode({
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
  interactionProps: Record<string, unknown>;
  dragProps: Record<string, unknown>;
  transformProps: Record<string, unknown>;
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
      <Rect x={0} y={0} width={node.frame.width} height={node.frame.height} fill={fill} stroke={stroke} strokeWidth={strokeWidth} cornerRadius={2} />
    </Group>
  );
}

export function LoadedKonvaImage({
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
  selectProps: Record<string, unknown>;
  dragProps: Record<string, unknown>;
  transformProps: Record<string, unknown>;
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
