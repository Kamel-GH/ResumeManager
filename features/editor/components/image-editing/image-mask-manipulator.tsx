"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { ImageEditingState, ImageMaskBounds, ImageMaskResizeHandle } from "./image-editor-types";
import { moveImageMaskBounds, resizeImageMaskBounds } from "./image-editor-utils";

type ImageMaskManipulatorProps = {
  editing: ImageEditingState;
  onChange: (bounds: ImageMaskBounds) => void;
};

type MaskInteraction = {
  pointerId: number;
  kind: "move" | "resize";
  handle?: ImageMaskResizeHandle;
  startBounds: ImageMaskBounds;
  startPoint: { x: number; y: number };
  containerRect: DOMRect;
};

const handles: Array<{ id: ImageMaskResizeHandle; className: string; title: string }> = [
  { id: "top-left", className: "is-top-left", title: "Redimensionner le masque en haut à gauche" },
  { id: "top-right", className: "is-top-right", title: "Redimensionner le masque en haut à droite" },
  { id: "bottom-left", className: "is-bottom-left", title: "Redimensionner le masque en bas à gauche" },
  { id: "bottom-right", className: "is-bottom-right", title: "Redimensionner le masque en bas à droite" },
];

export function ImageMaskManipulator({ editing, onChange }: ImageMaskManipulatorProps) {
  const interactionRef = useRef<MaskInteraction | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const boundsStyle = useMemo(
    () => ({
      left: `${editing.mask.bounds.x * 100}%`,
      top: `${editing.mask.bounds.y * 100}%`,
      width: `${editing.mask.bounds.width * 100}%`,
      height: `${editing.mask.bounds.height * 100}%`,
    }),
    [editing.mask.bounds.height, editing.mask.bounds.width, editing.mask.bounds.x, editing.mask.bounds.y],
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

      const nextPoint = getPointFromEvent(interaction.containerRect, event.clientX, event.clientY);
      const deltaX = nextPoint.x - interaction.startPoint.x;
      const deltaY = nextPoint.y - interaction.startPoint.y;
      const nextBounds =
        interaction.kind === "move"
          ? moveImageMaskBounds(interaction.startBounds, deltaX, deltaY)
          : resizeImageMaskBounds(interaction.startBounds, interaction.handle ?? "bottom-right", deltaX, deltaY, editing.mask.type);

      onChange(nextBounds);
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
  }, [dragging, editing.mask.type, onChange]);

  const startMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (!frameRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const containerRect = frameRef.current.getBoundingClientRect();
    interactionRef.current = {
      pointerId: event.pointerId,
      kind: "move",
      startBounds: structuredClone(editing.mask.bounds),
      startPoint: getPointFromEvent(containerRect, event.clientX, event.clientY),
      containerRect,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startResize = (handle: ImageMaskResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (!frameRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const containerRect = frameRef.current.getBoundingClientRect();
    interactionRef.current = {
      pointerId: event.pointerId,
      kind: "resize",
      handle,
      startBounds: structuredClone(editing.mask.bounds),
      startPoint: getPointFromEvent(containerRect, event.clientX, event.clientY),
      containerRect,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div ref={frameRef} className="ef-image-mask-manipulator" aria-label="Manipulation du masque">
      <div
        className="ef-image-mask-manipulator-box"
        style={boundsStyle}
        onPointerDown={startMove}
        role="button"
        aria-label="Déplacer le masque"
        title="Déplacer le masque"
      >
        <div className="ef-image-mask-manipulator-frame" aria-hidden="true" />
        {handles.map((handle) => (
          <button key={handle.id} type="button" className={`ef-image-mask-manipulator-handle ${handle.className}`} aria-label={handle.title} title={handle.title} onPointerDown={(event) => startResize(handle.id, event)}>
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function getPointFromEvent(rect: DOMRect, clientX: number, clientY: number) {
  return {
    x: clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
    y: clamp((clientY - rect.top) / Math.max(rect.height, 1), 0, 1),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
