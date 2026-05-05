import { describe, expect, it } from "vitest";

import { cloneDraftValue } from "@/features/editor/components/image-editing/use-resettable-draft-state";

describe("cloneDraftValue", () => {
  it("deep clones draft state for image editing", () => {
    const initial = {
      crop: {
        x: 0.25,
        y: -0.1,
        zoom: 1.5,
      },
      mask: {
        type: "rounded-rect" as const,
        radius: 12,
        bounds: {
          x: 0.1,
          y: 0.2,
          width: 0.5,
          height: 0.4,
        },
      },
    };

    const clone = cloneDraftValue(initial);

    expect(clone).toEqual(initial);
    expect(clone).not.toBe(initial);
    expect(clone.crop).not.toBe(initial.crop);
    expect(clone.mask).not.toBe(initial.mask);
    expect(clone.mask.bounds).not.toBe(initial.mask.bounds);
  });
});
