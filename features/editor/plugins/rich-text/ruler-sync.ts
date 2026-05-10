export type RulerViewportState = {
  zoom: number;
  scrollLeft: number;
  viewportOffset: number;
};

export const defaultRulerViewportState: RulerViewportState = {
  zoom: 1,
  scrollLeft: 0,
  viewportOffset: 0,
};
