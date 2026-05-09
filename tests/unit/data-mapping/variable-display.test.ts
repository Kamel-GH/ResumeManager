import { describe, expect, it, vi } from "vitest";
import {
  buildVariableDragEnvelope,
  buildVariableDragOperationLog,
  createVariableDragContext,
  parseEditorItemDragPayload,
  RICH_TEXT_VARIABLE_INSERT_EVENT,
  requestRichTextVariableInsert,
  resolveVariableDisplayKind,
  resolveVariableDisplayLabel,
  resolveVariableMappedPath,
  resolveVariableTooltip,
  resolveVariableValue,
  scheduleVariableDragTraceClear,
} from "@/features/data-mapping/lib/variable-display";
import type { MappingVariable } from "@/features/data-mapping/types";

function createVariable(overrides: Partial<MappingVariable> = {}): MappingVariable {
  return {
    id: "variable-1",
    key: "prenom",
    label: "Prénom",
    sourceColumn: "Prénom",
    type: "text",
    enabled: true,
    sampleValue: "Ada",
    ...overrides,
  };
}

describe("variable display", () => {
  it("builds the expected label and mapped path for common variables", () => {
    const variable = createVariable();

    expect(resolveVariableDisplayLabel(variable)).toBe("[Prénom]");
    expect(resolveVariableMappedPath(variable)).toBe("candidate.firstName");
    expect(resolveVariableTooltip(variable)).toBe("[Prénom] → candidate.firstName");
    expect(resolveVariableDisplayKind(variable)).toBe("TEXTE");
  });

  it("detects image and list styles from variable names", () => {
    expect(
      resolveVariableDisplayKind(
        createVariable({ key: "photo", label: "Photo", sourceColumn: "Photo" }),
      ),
    ).toBe("IMAGE");
    expect(
      resolveVariableDisplayKind(
        createVariable({ key: "competences", label: "Compétences", sourceColumn: "Compétences" }),
      ),
    ).toBe("LISTE");
    expect(
      resolveVariableDisplayKind(
        createVariable({ key: "tableau", label: "Tableau", sourceColumn: "Tableau" }),
      ),
    ).toBe("TABLE");
  });

  it("builds a shared drag payload understood by the editor and the canvas", () => {
    const variable = createVariable();
    const envelope = buildVariableDragEnvelope(variable);

    expect(envelope.type).toBe("variable");
    expect(envelope.payload.label).toBe("[Prénom]");
    expect(envelope.payload.token).toBe("[Prénom]");
    expect(envelope.payload.mappedPath).toBe("candidate.firstName");
    expect(envelope.payload.type).toBe("TEXTE");
  });

  it("resolves nested variable values safely from the dataset", () => {
    const dataset = {
      candidate: {
        firstName: "Kamel",
        address: {
          city: "Paris",
        },
        experiences: [
          {
            company: "OpenAI",
          },
        ],
      },
    };

    expect(resolveVariableValue("candidate.firstName", dataset, "")).toBe("Kamel");
    expect(resolveVariableValue("candidate.address.city", dataset, "")).toBe("Paris");
    expect(resolveVariableValue("candidate.experiences.0.company", dataset, "")).toBe("OpenAI");
    expect(resolveVariableValue("candidate.unknown", dataset, "fallback")).toBe("fallback");
  });

  it("builds a shared drag context for canvas drops", () => {
    const variable = createVariable();
    const context = createVariableDragContext(variable);

    expect(context.type).toBe("variable");
    expect(context.sourcePanel).toBe("data-variables");
    expect((context.payload as { token?: string }).token).toBe("[Prénom]");
  });

  it("parses the shared drag payload format", () => {
    const payload = buildVariableDragEnvelope(createVariable());
    const parsed = parseEditorItemDragPayload(
      JSON.stringify({
        type: payload.type,
        payload: payload.payload,
        sourcePanel: "data-variables",
      }),
    );

    expect(parsed).toEqual({
      type: "variable",
      payload: payload.payload,
      sourcePanel: "data-variables",
    });
  });

  it("builds a readable trace log for the drag journal", () => {
    const context = createVariableDragContext(createVariable());
    const log = buildVariableDragOperationLog(context, {
      action: "dragstart",
      pageId: "page-1",
      target: "Canvas",
      outcome: "démarré",
    });

    expect(log.action).toBe("dragstart");
    expect(log.elementId).toBe("[Prénom]");
    expect(log.details).toEqual(
      expect.arrayContaining([
        { label: "Phase", value: "dragstart" },
        { label: "Source", value: "data-variables" },
        { label: "Type", value: "variable" },
        { label: "Variable", value: "[Prénom]" },
        { label: "Mapping", value: "candidate.firstName" },
        { label: "Page", value: "page-1" },
        { label: "Cible", value: "Canvas" },
        { label: "Résultat", value: "démarré" },
      ]),
    );
  });

  it("clears variable drag context after the native drag sequence", async () => {
    const calls: string[] = [];

    scheduleVariableDragTraceClear(() => {
      calls.push("cleared");
    });

    expect(calls).toEqual([]);

    await Promise.resolve();

    expect(calls).toEqual(["cleared"]);
  });

  it("dispatches a rich text insert event from the shared variable payload", () => {
    const variable = createVariable();
    const payload = buildVariableDragEnvelope(variable).payload;
    const handler = vi.fn();
    const windowStub = new EventTarget();
    const CustomEventStub = class<T = unknown> extends Event {
      detail: T;

      constructor(type: string, init?: CustomEventInit<T>) {
        super(type, init);
        this.detail = init?.detail as T;
      }
    };

    vi.stubGlobal("window", windowStub);
    vi.stubGlobal("CustomEvent", CustomEventStub);
    try {
      window.addEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handler as EventListener);
      expect(requestRichTextVariableInsert(payload)).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      expect((handler.mock.calls[0]?.[0] as CustomEvent<typeof payload>).detail).toEqual(payload);
    } finally {
      window.removeEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handler as EventListener);
      vi.unstubAllGlobals();
    }
  });
});
