import { describe, expect, it } from "vitest";

import {
  buildRulerTicks,
  buildActiveWorkspaceLayout,
  buildWorkspaceLayout,
  convertClientPointToWorkspacePoint,
  convertWorkspacePointToPagePoint,
  defaultWorkspaceSettings,
  findWorkspacePageAtPointStrict,
  projectRulerTickToViewportPosition,
  resolveEffectiveRulerMode,
  resolveRulerOrigin,
  resolveWorkspaceRulerTicks,
} from "@/features/editor/schema/workspace-layout";

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

  it("defaults rulers to page mode without changing snap or grid defaults", () => {
    expect(defaultWorkspaceSettings.rulerMode).toBe("page");
    expect(defaultWorkspaceSettings.rulersVisible).toBe(true);
    expect(defaultWorkspaceSettings.gridEnabled).toBe(true);
    expect(defaultWorkspaceSettings.snapEnabled).toBe(true);
    expect(defaultWorkspaceSettings.measurementUnit).toBe("px");
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

  it("preserves the configured effective ruler mode", () => {
    expect(resolveEffectiveRulerMode({ ...defaultWorkspaceSettings, rulerMode: "global" })).toBe("global");
    expect(resolveEffectiveRulerMode({ ...defaultWorkspaceSettings, rulerMode: "page" })).toBe("page");
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
    });

    expect(ticks.horizontal[0]).toMatchObject({ position: 0, workspacePosition: 0, label: "0" });
    expect(ticks.horizontal.at(-1)).toMatchObject({ position: layout.width, workspacePosition: layout.width, label: undefined });
    expect(ticks.vertical.at(-1)).toMatchObject({ position: layout.height, workspacePosition: layout.height, label: undefined });
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
    });

    expect(page).toBeDefined();
    expect(ticks.horizontal[0]).toMatchObject({ position: 0, workspacePosition: page?.x, label: "0" });
    expect(ticks.vertical[0]).toMatchObject({ position: 0, workspacePosition: page?.y, label: "0" });
    expect(ticks.horizontal.at(-1)).toMatchObject({ position: page?.width, workspacePosition: page ? page.x + page.width : undefined, label: undefined });
  });

  it("keeps base ruler tick generation compatible with workspace offsets", () => {
    expect(buildRulerTicks(100, 100, 50, 24)).toEqual([
      { isMajor: true, grade: "major", label: "0", position: 0, workspacePosition: 24 },
      { isMajor: false, grade: "minor", label: undefined, position: 50, workspacePosition: 74 },
      { isMajor: true, grade: "major", label: "100", position: 100, workspacePosition: 124 },
    ]);
  });

  it("projects ruler ticks through viewport zoom and pan", () => {
    const tick = { isMajor: true, grade: "major" as const, label: "100", position: 100, workspacePosition: 124 };
    const viewport = { zoom: 2, panX: 10, panY: -6 };

    expect(projectRulerTickToViewportPosition(tick, viewport, "x")).toBe(258);
    expect(projectRulerTickToViewportPosition(tick, viewport, "y")).toBe(242);
  });
});
