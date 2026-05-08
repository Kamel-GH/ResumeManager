import { describe, expect, it } from "vitest";

import {
  buildRulerTicks,
  buildActiveWorkspaceLayout,
  buildWorkspaceLayout,
  convertClientPointToWorkspacePoint,
  convertWorkspacePointToPagePoint,
  defaultWorkspaceSettings,
  findWorkspacePageAtPoint,
  findWorkspacePageAtPointStrict,
  projectRulerTickToViewportPosition,
  projectWorkspacePositionToViewport,
  resolveEffectiveRulerMode,
  resolveEffectiveWorkspaceMode,
  resolveRulerOrigin,
  resolveWorkspaceContentBounds,
  resolveWorkspaceSnapResolution,
  resolveWorkspaceRulerTicks,
  resolveWorkspaceVisualAids,
  resolveWorkspaceViewportPreset,
} from "@/features/editor/schema/workspace-layout";
import { resolveWorkspaceAlignmentSnapResolution, resolveWorkspaceResizeSnapResolution } from "@/features/editor/schema/workspace-snap-guides";

describe("workspace layout", () => {
  it("converts client coordinates through viewport zoom and pan into workspace coordinates", () => {
    const workspacePoint = convertClientPointToWorkspacePoint({ x: 260, y: 180 }, { left: 100, top: 40 }, { zoom: 2, panX: 20, panY: 10 });

    expect(workspacePoint).toEqual({ x: 70, y: 65 });
  });

  it("converts workspace coordinates into page-local coordinates", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const pagePoint = convertWorkspacePointToPagePoint({ x: page.x + 120, y: page.y + 45 }, page);
    expect(pagePoint).toEqual({ x: 120, y: 45 });
  });

  it("returns the hit page only when the workspace point is inside a page", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        {
          id: "page-2",
          name: "Inside",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    const page = layout.pages[1];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    expect(findWorkspacePageAtPointStrict(layout, { x: page.x + 10, y: page.y + 10 })?.id).toBe("page-2");
    expect(findWorkspacePageAtPointStrict(layout, { x: 4, y: 4 })).toBeNull();
  });

  it("returns the padding-only canvas for an empty workspace layout", () => {
    const layout = buildWorkspaceLayout([], { pageGap: 56, pagePadding: 56 });

    expect(layout).toEqual({
      width: 112,
      height: 112,
      pages: [],
    });
  });

  it("defaults rulers to page mode without changing snap or grid defaults", () => {
    expect(defaultWorkspaceSettings.measurementUnit).toBe("px");
    expect(defaultWorkspaceSettings.rulerMode).toBe("page");
    expect(defaultWorkspaceSettings.workspaceMode).toBe("fit-space");
    expect(defaultWorkspaceSettings.autoCenterOnLoad).toBe(true);
    expect(defaultWorkspaceSettings.rulersVisible).toBe(true);
    expect(defaultWorkspaceSettings.gridEnabled).toBe(true);
    expect(defaultWorkspaceSettings.snapEnabled).toBe(true);
    expect(defaultWorkspaceSettings.rulerFineStep).toBe(10);
  });

  it("builds a workspace layout for the active page only", () => {
    const layout = buildActiveWorkspaceLayout(
      [
        { id: "page-1", name: "Cover", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
        { id: "page-2", name: "Inside", width: 240, height: 180, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
      ],
      "page-2",
      { pageGap: 56, pagePadding: 56 },
    );

    expect(layout.pages.map((page) => page.id)).toEqual(["page-2"]);
    expect(layout.width).toBe(240 + 56 * 2);
    expect(layout.height).toBe(180 + 56 * 2);
  });

  it("resolves content bounds from the rendered page envelope and excludes outer padding", () => {
    const layout = buildWorkspaceLayout(
      [
        { id: "page-1", name: "Cover", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
        { id: "page-2", name: "Inside", width: 240, height: 180, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    expect(resolveWorkspaceContentBounds(layout)).toEqual({
      x: 56,
      y: 56,
      width: 400,
      height: 536,
    });
  });

  it("detects square pages as square orientation", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Square",
          width: 220,
          height: 220,
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    expect(layout.pages[0]?.orientation).toBe("square");
  });

  it("preserves the configured effective ruler mode", () => {
    expect(resolveEffectiveRulerMode({ ...defaultWorkspaceSettings, rulerMode: "global" })).toBe("global");
    expect(resolveEffectiveRulerMode({ ...defaultWorkspaceSettings, rulerMode: "page" })).toBe("page");
  });

  it("resolves workspace visual aids from the current workspace settings", () => {
    expect(
      resolveWorkspaceVisualAids({
        ...defaultWorkspaceSettings,
        rulersVisible: false,
        gridEnabled: false,
        marginsVisible: true,
        guidesVisible: true,
        snapEnabled: true,
        snapToGrid: true,
        snapToMargins: true,
        snapToPageBounds: true,
      }),
    ).toMatchObject({
      rulersVisible: false,
      gridVisible: false,
      marginsVisible: true,
      guidesVisible: true,
      snapEnabled: true,
      snapToGrid: true,
      snapToMargins: true,
      snapToPageBounds: true,
      marginGuidesVisible: true,
    });

    expect(
      resolveWorkspaceVisualAids({
        ...defaultWorkspaceSettings,
        rulersVisible: true,
        gridEnabled: true,
        marginsVisible: false,
        guidesVisible: false,
        snapEnabled: false,
        snapToGrid: true,
        snapToMargins: true,
        snapToPageBounds: true,
      }),
    ).toMatchObject({
      rulersVisible: true,
      gridVisible: true,
      marginsVisible: false,
      guidesVisible: false,
      snapEnabled: false,
      snapToGrid: false,
      snapToMargins: false,
      snapToPageBounds: false,
      marginGuidesVisible: false,
    });
  });

  it("resolves snap guides and snapped points from the same visual-aid contract", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceSnapResolution(
      { x: 23, y: 276 },
      page,
      {
        ...defaultWorkspaceSettings,
        gridSize: 20,
        snapTolerance: 8,
        snapEnabled: true,
        snapToGrid: true,
        snapToMargins: true,
        snapToPageBounds: true,
      },
    );

    expect(resolution.point).toEqual({ x: 20, y: 280 });
    expect(resolution.guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: "x", kind: "grid", position: 20 }),
        expect.objectContaining({ axis: "y", kind: "margin", position: 280 }),
      ]),
    );
  });

  it("scales the snap threshold with viewport zoom for point snapping", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const snappedAtNormalZoom = resolveWorkspaceSnapResolution(
      { x: 15, y: 100 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: true,
        snapToPageBounds: false,
        snapTolerance: 8,
      },
    );

    const snappedAtZoomedViewport = resolveWorkspaceSnapResolution(
      { x: 15, y: 100 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: true,
        snapToPageBounds: false,
        snapTolerance: 8,
      },
      2,
    );

    expect(snappedAtNormalZoom.point.x).toBe(20);
    expect(snappedAtZoomedViewport.point.x).toBe(15);
  });

  it("resolves object and margin alignment guides for frame-based snapping", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceAlignmentSnapResolution(
      { x: 204, y: 22, width: 80, height: 40 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: true,
        snapToPageBounds: true,
      },
      [
        {
          id: "object-1",
          frame: { x: 200, y: 90, width: 80, height: 40 },
          label: "Objet",
        },
      ],
    );

    expect(resolution.point).toEqual({ x: 200, y: 20 });
    expect(resolution.guides).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: "x", kind: "object", label: "Objet centre", position: 240 }),
        expect.objectContaining({ axis: "y", kind: "margin", label: "Marge haute", position: 20 }),
      ]),
    );
  });

  it("resolves equal spacing guides within the active group context", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceAlignmentSnapResolution(
      { x: 83, y: 120, width: 40, height: 40 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: false,
        snapToPageBounds: false,
        snapTolerance: 8,
      },
      [
        {
          id: "left",
          frame: { x: 20, y: 100, width: 40, height: 40 },
          label: "Bloc gauche",
          groupKey: "group-1",
        },
        {
          id: "right",
          frame: { x: 140, y: 100, width: 40, height: 40 },
          label: "Bloc droite",
          groupKey: "group-1",
        },
      ],
      null,
      1,
      "group-1",
    );

    expect(resolution.point).toEqual({ x: 80, y: 120 });
    expect(resolution.guides).toEqual(
      expect.arrayContaining([expect.objectContaining({ axis: "x", kind: "spacing", label: "Espacement égal", position: 80 })]),
    );
    expect(resolution.guides[0]?.priority).toBe(86);
  });

  it("snaps resize dimensions to identical peer sizes within the active group context", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceResizeSnapResolution(
      { x: 80, y: 120, width: 120, height: 40 },
      { x: 80, y: 120, width: 116, height: 40 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: false,
        snapToPageBounds: false,
        snapTolerance: 8,
      },
      [
        {
          id: "peer",
          frame: { x: 20, y: 100, width: 120, height: 60 },
          label: "Bloc",
          groupKey: "group-1",
        },
      ],
      "middle-right",
      1,
      "group-1",
    );

    expect(resolution.frame.width).toBe(120);
    expect(resolution.frame.x).toBe(80);
    expect(resolution.guides).toEqual(
      expect.arrayContaining([expect.objectContaining({ axis: "x", kind: "dimension", label: "Largeur identique", position: 200 })]),
    );
    expect(resolution.guides[0]?.priority).toBe(92);
  });

  it("snaps to explicit parent container guides when a child has a parent reference", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceAlignmentSnapResolution(
      { x: 242, y: 120, width: 40, height: 40 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: false,
        snapToPageBounds: false,
        snapTolerance: 8,
      },
      [
        {
          id: "container-1",
          frame: { x: 200, y: 100, width: 120, height: 80 },
          label: "Bloc parent",
        },
        {
          id: "child-1",
          frame: { x: 40, y: 40, width: 40, height: 40 },
          label: "Bloc enfant",
          parentId: "container-1",
          groupKey: "group-1",
        },
      ],
      null,
      1,
      "group-1",
    );

    expect(resolution.point).toEqual({ x: 240, y: 120 });
    expect(resolution.guides).toEqual(
      expect.arrayContaining([expect.objectContaining({ axis: "x", kind: "container", label: "Bloc parent conteneur centre", position: 260 })]),
    );
    expect(resolution.guides[0]?.priority).toBe(97);
  });

  it("limits alignment targets according to the active transformer anchor", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceAlignmentSnapResolution(
      { x: 204, y: 22, width: 80, height: 40 },
      page,
      {
        ...defaultWorkspaceSettings,
        snapEnabled: true,
        snapToGrid: false,
        snapToMargins: false,
        snapToPageBounds: false,
        snapTolerance: 80,
      },
      [
        {
          id: "object-1",
          frame: { x: 260, y: 100, width: 100, height: 80 },
          label: "Objet",
        },
      ],
      "middle-right",
    );

    expect(resolution.point).toEqual({ x: 280, y: 22 });
    expect(resolution.guides).toEqual(
      expect.arrayContaining([expect.objectContaining({ axis: "x", kind: "object", label: "Objet droite", position: 360 })]),
    );
    expect(resolution.guides).not.toEqual(expect.arrayContaining([expect.objectContaining({ label: "Objet centre" })]));
  });

  it("keeps grid snapping available for resize anchors", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[0];
    expect(page).toBeDefined();
    if (!page) {
      return;
    }

    const resolution = resolveWorkspaceAlignmentSnapResolution(
      { x: 24, y: 24, width: 80, height: 40 },
      page,
      {
        ...defaultWorkspaceSettings,
        gridEnabled: true,
        gridSize: 20,
        snapEnabled: true,
        snapToGrid: true,
        snapToMargins: false,
        snapToPageBounds: false,
        snapTolerance: 8,
      },
      [],
      "middle-right",
    );

    expect(resolution.point).toEqual({ x: 20, y: 20 });
    expect(resolution.guides).toEqual(
      expect.arrayContaining([expect.objectContaining({ axis: "x", kind: "grid", label: "Grille", position: 100 })]),
    );
  });

  it("normalizes workspace mode and resolves viewport presets for fit-space, fit-width and free", () => {
    const layout = buildWorkspaceLayout(
      [{ id: "page-1", name: "Cover", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } }],
      { pageGap: 56, pagePadding: 56 },
    );

    expect(resolveEffectiveWorkspaceMode("document")).toBe("free");
    expect(resolveEffectiveWorkspaceMode("fit-space")).toBe("fit-space");
    expect(resolveEffectiveWorkspaceMode("fit-width")).toBe("fit-width");
    expect(resolveEffectiveWorkspaceMode("free")).toBe("free");

    const fitSpace = resolveWorkspaceViewportPreset(layout, { width: 1200, height: 800 }, {
      mode: "fit-space",
      autoCenterOnLoad: true,
      currentViewport: { zoom: 1, panX: 0, panY: 0 },
      minZoom: 0.25,
      maxZoom: 4,
    });

    expect(fitSpace).not.toBeNull();
    if (!fitSpace) {
      return;
    }

    expect(fitSpace.zoom).toBeCloseTo(Math.min(1200 / 400, 800 / 300) * 0.92, 4);
    expect(fitSpace.panX).toBeCloseTo((1200 - 400 * fitSpace.zoom) / 2 - 56 * fitSpace.zoom, 4);
    expect(fitSpace.panY).toBeCloseTo((800 - 300 * fitSpace.zoom) / 2 - 56 * fitSpace.zoom, 4);

    const fitWidth = resolveWorkspaceViewportPreset(layout, { width: 1200, height: 800 }, {
      mode: "fit-width",
      autoCenterOnLoad: true,
      currentViewport: { zoom: 1, panX: 0, panY: 0 },
      minZoom: 0.25,
      maxZoom: 4,
    });

    expect(fitWidth).not.toBeNull();
    if (!fitWidth) {
      return;
    }

    expect(fitWidth.zoom).toBeCloseTo(1200 / 400, 4);
    expect(fitWidth.panX).toBeCloseTo((1200 - 400 * fitWidth.zoom) / 2 - 56 * fitWidth.zoom, 4);

    const free = resolveWorkspaceViewportPreset(layout, { width: 1200, height: 800 }, {
      mode: "free",
      autoCenterOnLoad: false,
      currentViewport: { zoom: 1.2, panX: 12, panY: 34 },
      minZoom: 0.25,
      maxZoom: 4,
    });
    expect(free).toBeNull();

    const freeCentered = resolveWorkspaceViewportPreset(layout, { width: 1200, height: 800 }, {
      mode: "free",
      autoCenterOnLoad: true,
      currentViewport: { zoom: 1.2, panX: 12, panY: 34 },
      minZoom: 0.25,
      maxZoom: 4,
    });
    expect(freeCentered).not.toBeNull();
    if (!freeCentered) {
      return;
    }

    expect(freeCentered.zoom).toBeCloseTo(1.2, 4);
    expect(freeCentered.panX).toBeCloseTo((1200 - 400 * 1.2) / 2 - 56 * 1.2, 4);
    expect(freeCentered.panY).toBeCloseTo((800 - 300 * 1.2) / 2 - 56 * 1.2, 4);
  });

  it("resolves global and page ruler origins from the workspace layout", () => {
    const layout = buildWorkspaceLayout(
      [
        { id: "page-1", name: "Cover", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
        { id: "page-2", name: "Inside", width: 240, height: 180, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    expect(resolveRulerOrigin(layout, "page-2", "global")).toEqual({ x: 0, y: 0 });
    expect(resolveRulerOrigin(layout, "page-2", "page")).toEqual({
      x: layout.pages[1]?.x,
      y: layout.pages[1]?.y,
    });
    expect(resolveRulerOrigin(layout, "page-1", "page")).not.toEqual(resolveRulerOrigin(layout, "page-2", "page"));
  });

  it("builds global ruler ticks in workspace coordinates", () => {
    const layout = buildWorkspaceLayout(
      [{ id: "page-1", name: "Cover", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } }],
      { pageGap: 56, pagePadding: 56 },
    );

    const ticks = resolveWorkspaceRulerTicks(layout, "page-1", {
      mode: "global",
      majorStep: 100,
      minorStep: 50,
      fineStep: 25,
      measurementUnit: "px",
    });

    expect(ticks.horizontal[0]).toMatchObject({ position: 0, workspacePosition: 0, label: "0" });
    expect(ticks.horizontal.at(-1)?.position).toBe(layout.width);
    expect(ticks.horizontal.at(-1)?.workspacePosition).toBe(layout.width);
    expect(ticks.horizontal.at(-1)?.label).toBeUndefined();
    expect(ticks.vertical.at(-1)?.position).toBe(layout.height);
    expect(ticks.vertical.at(-1)?.workspacePosition).toBe(layout.height);
    expect(ticks.vertical.at(-1)?.label).toBeUndefined();
  });

  it("builds page ruler ticks with page-local labels and workspace positions", () => {
    const layout = buildWorkspaceLayout(
      [
        { id: "page-1", name: "Cover", width: 400, height: 300, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
        { id: "page-2", name: "Inside", width: 240, height: 180, margin: { top: 20, right: 20, bottom: 20, left: 20 } },
      ],
      { pageGap: 56, pagePadding: 56 },
    );
    const page = layout.pages[1];

    const ticks = resolveWorkspaceRulerTicks(layout, "page-2", {
      mode: "page",
      majorStep: 100,
      minorStep: 50,
      fineStep: 25,
      measurementUnit: "px",
    });

    expect(page).toBeDefined();
    expect(ticks.horizontal[0]).toMatchObject({ position: 0, workspacePosition: page?.x, label: "0" });
    expect(ticks.vertical[0]).toMatchObject({ position: 0, workspacePosition: page?.y, label: "0" });
    expect(ticks.horizontal.at(-1)?.position).toBe(page?.width);
    expect(ticks.horizontal.at(-1)?.workspacePosition).toBe(page ? page.x + page.width : undefined);
    expect(ticks.horizontal.at(-1)?.label).toBeUndefined();
  });

  it("falls back to the requested page when a point misses all pages", () => {
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        {
          id: "page-2",
          name: "Inside",
          width: 400,
          height: 300,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    expect(findWorkspacePageAtPoint(layout, { x: 10_000, y: 10_000 }, "page-2")?.id).toBe("page-2");
    expect(findWorkspacePageAtPoint(layout, { x: 10_000, y: 10_000 }, "missing-page")?.id).toBe("page-1");
  });

  it("keeps base ruler tick generation compatible with workspace offsets", () => {
    expect(buildRulerTicks(120, 100, 50, 25, "px", 24)).toEqual([
      { isMajor: true, isMinor: false, label: "0", position: 0, workspacePosition: 24 },
      { isMajor: false, isMinor: false, label: undefined, position: 25, workspacePosition: 49 },
      { isMajor: false, isMinor: true, label: undefined, position: 50, workspacePosition: 74 },
      { isMajor: false, isMinor: false, label: undefined, position: 75, workspacePosition: 99 },
      { isMajor: true, isMinor: false, label: "100", position: 100, workspacePosition: 124 },
      { isMajor: false, isMinor: false, label: undefined, position: 120, workspacePosition: 144 },
    ]);
  });

  it("projects ruler ticks through viewport zoom and pan", () => {
    const tick = { isMajor: true, isMinor: false, label: "100", position: 100, workspacePosition: 124 };
    const viewport = { zoom: 2, panX: 10, panY: -6 };

    expect(projectRulerTickToViewportPosition(tick, viewport, "x")).toBe(258);
    expect(projectRulerTickToViewportPosition(tick, viewport, "y")).toBe(242);
    expect(projectWorkspacePositionToViewport(124, viewport, "x")).toBe(258);
    expect(projectWorkspacePositionToViewport(124, viewport, "y")).toBe(242);
  });
});
