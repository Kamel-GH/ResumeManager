export const EDITOR_VIEWPORT_MIN_ZOOM = 0.25;
export const EDITOR_VIEWPORT_MAX_ZOOM = 4;

export function clampEditorViewportZoom(zoom: number) {
  if (!Number.isFinite(zoom)) {
    return 1;
  }

  return Math.min(EDITOR_VIEWPORT_MAX_ZOOM, Math.max(EDITOR_VIEWPORT_MIN_ZOOM, zoom));
}

export function resolveStableLayerNumber(layerId: string, fallback: number) {
  const match = /(?:^|:)(?:layer|calque)[^\d]*(\d+)$/i.exec(layerId);
  if (!match) {
    return fallback;
  }

  const number = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(number) ? number : fallback;
}
