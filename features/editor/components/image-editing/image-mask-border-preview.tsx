"use client";

import type { ImageEditingState } from "./image-editor-types";
import {
  buildImageMaskPathData,
  resolveImageMaskBorderPresentation,
  resolveImageMaskFrame,
} from "./image-editor-utils";

type ImageMaskBorderPreviewProps = {
  editing: ImageEditingState;
};

export function ImageMaskBorderPreview({ editing }: ImageMaskBorderPreviewProps) {
  const border = editing.mask.border;

  if (border.width <= 0) {
    return null;
  }

  const maskFrame = resolveImageMaskFrame(editing.mask.bounds, 100, 100);
  const radius = editing.mask.type === "rounded-rect" ? editing.mask.radius : 0;
  const pathData = buildImageMaskPathData(maskFrame, editing.mask.type, radius);
  const presentation = resolveImageMaskBorderPresentation(border);

  return (
    <svg className="ef-image-editor-mask-border-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
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
    </svg>
  );
}
