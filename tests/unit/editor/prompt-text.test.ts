import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { promptTextValue } from "@/features/editor/lib/prompt-text";

const promptMock = vi.fn();

describe("prompt text helper", () => {
  beforeEach(() => {
    promptMock.mockReset();
    vi.stubGlobal("window", { prompt: promptMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trims returned values and collapses blank or cancelled prompts to null", () => {
    promptMock.mockReturnValueOnce("  Calque principal  ");
    expect(promptTextValue("Nom du calque", "Défaut")).toBe("Calque principal");

    promptMock.mockReturnValueOnce("   ");
    expect(promptTextValue("Nom du calque", "Défaut")).toBeNull();

    promptMock.mockReturnValueOnce(null);
    expect(promptTextValue("Nom du calque", "Défaut")).toBeNull();
  });
});
