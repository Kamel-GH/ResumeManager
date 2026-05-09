import { describe, expect, it } from "vitest";

import {
  convertMeasurementValue,
  formatMeasurementValue,
  getMeasurementUnitSuffix,
} from "@/features/editor/lib/measurement";
import {
  buildWorkspaceLayout,
  resolveWorkspaceRulerTicks,
} from "@/features/editor/schema/workspace-layout";

describe("measurement", () => {
  it("converts canonical px values to and from display units", () => {
    const pxPerCm = convertMeasurementValue(1, "cm", "px");
    const pxPerMm = convertMeasurementValue(1, "mm", "px");

    expect(pxPerCm).toBeCloseTo(37.7952755906, 6);
    expect(pxPerMm).toBeCloseTo(3.7795275591, 6);
    expect(convertMeasurementValue(pxPerCm, "px", "cm")).toBeCloseTo(1, 6);
    expect(convertMeasurementValue(96, "px", "in")).toBeCloseTo(1, 6);
    expect(formatMeasurementValue(pxPerCm, "cm", 2)).toBe("1");
    expect(getMeasurementUnitSuffix("cm")).toBe("cm");
  });

  it("formats ruler labels in the selected unit and keeps non-major end ticks unlabeled", () => {
    const pxPerCm = convertMeasurementValue(1, "cm", "px");
    const layout = buildWorkspaceLayout(
      [
        {
          id: "page-1",
          name: "Cover",
          width: 120,
          height: 120,
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        },
      ],
      { pageGap: 56, pagePadding: 56 },
    );

    const ticks = resolveWorkspaceRulerTicks(layout, "page-1", {
      mode: "page",
      majorStep: pxPerCm,
      minorStep: pxPerCm / 2,
      fineStep: pxPerCm / 10,
      measurementUnit: "cm",
    });

    expect(ticks.horizontal.map((tick) => tick.label).filter(Boolean)).toEqual([
      "0",
      "1",
      "2",
      "3",
    ]);
    expect(ticks.horizontal.at(-1)?.label).toBeUndefined();
    expect(ticks.vertical.map((tick) => tick.label).filter(Boolean)).toEqual(["0", "1", "2", "3"]);
  });
});
