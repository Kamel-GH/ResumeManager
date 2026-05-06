import { describe, expect, it } from "vitest";

import {
  buildRulerTicks,
  resolveWorkspaceRulerTicks,
  convertMeasurementToPx,
  convertMeasurementValue,
  formatMeasurementNumber,
  formatMeasurementValue,
} from "@/features/editor/lib/measurement";
import { buildWorkspaceLayout } from "@/features/editor/schema/workspace-layout";

describe("measurement", () => {
  it("converts between measurement units using the CSS pixel baseline", () => {
    expect(convertMeasurementValue(25.4, "mm", "in")).toBeCloseTo(1, 6);
    expect(convertMeasurementValue(1, "in", "px")).toBe(96);
    expect(convertMeasurementValue(72, "pt", "in")).toBeCloseTo(1, 6);
  });

  it("formats measurement values in the selected unit", () => {
    expect(formatMeasurementNumber(convertMeasurementToPx(10, "mm"), "mm")).toBe("10");
    expect(formatMeasurementValue(convertMeasurementToPx(10, "mm"), "mm")).toBe("10 mm");
    expect(formatMeasurementValue(convertMeasurementToPx(1, "in"), "in")).toBe("1 in");
  });

  it("builds ruler ticks in the selected unit", () => {
    const ticks = buildRulerTicks(convertMeasurementToPx(20, "mm"), convertMeasurementToPx(10, "mm"), convertMeasurementToPx(5, "mm"), 24, "mm");

    expect(ticks).toHaveLength(5);
    expect(ticks.map((tick) => tick.label)).toEqual(["0", undefined, "10", undefined, "20"]);
    expect(ticks[0]).toMatchObject({ position: 0, workspacePosition: 24, isMajor: true });
    expect(ticks[2]).toMatchObject({ position: expect.any(Number), isMajor: true });
  });

  it("resolves ruler ticks for the selected measurement unit and page mode", () => {
    const layout = buildWorkspaceLayout(
      [{ id: "page-1", name: "Cover", width: convertMeasurementToPx(20, "mm"), height: convertMeasurementToPx(20, "mm"), margin: { top: 10, right: 10, bottom: 10, left: 10 } }],
      { pageGap: 56, pagePadding: 56 },
    );

    const ticks = resolveWorkspaceRulerTicks(layout, "page-1", {
      mode: "page",
      majorStep: convertMeasurementToPx(10, "mm"),
      minorStep: convertMeasurementToPx(5, "mm"),
      measurementUnit: "mm",
      zoom: 1,
    });

    expect(ticks.mode).toBe("page");
    expect(ticks.horizontal[0]).toMatchObject({ label: "0", isMajor: true });
    expect(ticks.horizontal[1]).toMatchObject({ label: undefined, isMajor: false });
    expect(ticks.horizontal[2]).toMatchObject({ label: "10", isMajor: true });
  });

  it("keeps ruler labels integer-only even when the selected unit could produce decimals", () => {
    const ticks = buildRulerTicks(convertMeasurementToPx(21.1, "cm"), convertMeasurementToPx(5, "cm"), convertMeasurementToPx(1, "cm"), 0, "cm", 1);

    expect(ticks.filter((tick) => tick.label).every((tick) => /^\d+$/.test(tick.label ?? ""))).toBe(true);
    expect(ticks.map((tick) => tick.label).filter(Boolean)).toEqual(["0", "5", "10", "15", "20"]);
  });

  it("keeps inch ruler labels integer-only with internal px steps", () => {
    const ticks = buildRulerTicks(convertMeasurementToPx(11, "in"), convertMeasurementToPx(1, "in"), convertMeasurementToPx(0.5, "in"), 0, "in", 1);

    expect(ticks.filter((tick) => tick.label).every((tick) => /^\d+$/.test(tick.label ?? ""))).toBe(true);
    expect(ticks.map((tick) => tick.label).filter(Boolean)).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
  });

  it("adds fine ruler ticks at high zoom when a fine step is configured", () => {
    const ticks = buildRulerTicks(convertMeasurementToPx(10, "mm"), convertMeasurementToPx(10, "mm"), convertMeasurementToPx(5, "mm"), 0, "mm", 2, convertMeasurementToPx(2, "mm"));

    expect(ticks.some((tick) => tick.grade === "fine")).toBe(true);
    expect(ticks.some((tick) => tick.label && tick.grade === "fine")).toBe(false);
  });
});
