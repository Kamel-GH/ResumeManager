"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { ImageEditingState, ImageMaskResizeHandle } from "./image-editor-types";
import { buildImagePreviewFrameStyle, moveImageCrop, scaleImageCropZoom } from "./image-editor-utils";

type ImageCropManipulatorProps = {
  editing: ImageEditingState;
  onChange: (crop: ImageEditingState["crop"]) => void;
};

type CropInteraction = {
  pointerId: number;
  kind: "move" | "resize";
  handle?: ImageMaskResizeHandle;
  startCrop: ImageEditingState["crop"];
  startPoint: { x: number; y: number };
  frameRect: DOMRect;
};

const handles: Array<{ id: ImageMaskResizeHandle; className: string; title: string }> = [
  { id: "top-left", className: "is-top-left", title: "Ajuster l’image en haut à gauche" },
  { id: "top-right", className: "is-top-right", title: "Ajuster l’image en haut à droite" },
  { id: "bottom-left", className: "is-bottom-left", title: "Ajuster l’image en bas à gauche" },
  { id: "bottom-right", className: "is-bottom-right", title: "Ajuster l’image en bas à droite" },
];

export function ImageCropManipulator({ editing, onChange }: ImageCropManipulatorProps) {
  const interactionRef = useRef<CropInteraction | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const boxStyle = useMemo(
    () => ({
      ...buildImagePreviewFrameStyle(editing),
    }),
    [editing],
  );

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const nextPoint = getPointFromEvent(interaction.frameRect, event.clientX, event.clientY);
      if (interaction.kind === "move") {
        onChange(moveImageCrop(interaction.startCrop, nextPoint.x - interaction.startPoint.x, nextPoint.y - interaction.startPoint.y, interaction.frameRect.width, interaction.frameRect.height));
        return;
      }

      const center = resolveCropCenter(interaction.startCrop, interaction.frameRect);
      const startDistance = distanceBetweenPoints(interaction.startPoint, center);
      const currentDistance = distanceBetweenPoints(nextPoint, center);
      onChange({
        ...interaction.startCrop,
        zoom: scaleImageCropZoom(interaction.startCrop.zoom, startDistance, currentDistance),
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      interactionRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [dragging, onChange]);

  const startMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !frameRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const frameRect = frameRef.current.getBoundingClientRect();
    interactionRef.current = {
      pointerId: event.pointerId,
      kind: "move",
      startCrop: structuredClone(editing.crop),
      startPoint: getPointFromEvent(frameRect, event.clientX, event.clientY),
      frameRect,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startResize = (handle: ImageMaskResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !frameRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const frameRect = frameRef.current.getBoundingClientRect();
    interactionRef.current = {
      pointerId: event.pointerId,
      kind: "resize",
      handle,
      startCrop: structuredClone(editing.crop),
      startPoint: getPointFromEvent(frameRect, event.clientX, event.clientY),
      frameRect,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div ref={frameRef} className="ef-image-crop-manipulator" aria-label="Manipulation de l’image">
      <div
        className="ef-image-crop-manipulator-box"
        style={boxStyle}
        onPointerDown={startMove}
        role="button"
        aria-label="Déplacer l’image"
        title="Déplacer l’image"
      >
        <div className="ef-image-crop-manipulator-frame" aria-hidden="true" />
        {handles.map((handle) => (
          <button
            key={handle.id}
            type="button"
            className={`ef-image-crop-manipulator-handle ${handle.className}`}
            aria-label={handle.title}
            title={handle.title}
            onPointerDown={(event) => startResize(handle.id, event)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function resolveCropCenter(crop: ImageEditingState["crop"], frameRect: DOMRect) {
  return {
    x: frameRect.width / 2 + crop.x * (frameRect.width / 2),
    y: frameRect.height / 2 + crop.y * (frameRect.height / 2),
  };
}

function distanceBetweenPoints(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getPointFromEvent(rect: DOMRect, clientX: number, clientY: number) {
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}
