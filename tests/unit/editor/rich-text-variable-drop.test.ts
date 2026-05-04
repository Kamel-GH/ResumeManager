import { describe, expect, it, vi } from "vitest";

import {
  insertVariableTokenIntoRichTextEditor,
  insertVariableTokenIntoRichTextHtml,
} from "@/features/editor/renderers/konva-renderer/rich-text-drop-utils";
import { buildVariableDragEnvelope } from "@/features/data-mapping/lib/variable-display";

const variablePayload = buildVariableDragEnvelope({
  id: "variable-1",
  key: "prenom",
  label: "Prénom",
  sourceColumn: "Prénom",
  type: "text",
  enabled: true,
  sampleValue: "Ada",
}).payload;

describe("rich text variable drop", () => {
  it("appends a variable token to an empty rich text block", () => {
    expect(insertVariableTokenIntoRichTextHtml("", variablePayload)).toContain('data-variable="true"');
  });

  it("preserves the existing rich text structure when appending a variable token", () => {
    const html = "<p>Bonjour <strong>monde</strong></p>";
    const nextHtml = insertVariableTokenIntoRichTextHtml(html, variablePayload);

    expect(nextHtml).toContain("<strong>monde</strong>");
    expect(nextHtml).toContain('data-variable="true"');
    expect(nextHtml).toContain("<p>");
  });

  it("adds a trailing paragraph when the content is not a paragraph block", () => {
    const html = "<table><tr><td>Cellule</td></tr></table>";
    const nextHtml = insertVariableTokenIntoRichTextHtml(html, variablePayload);

    expect(nextHtml).toContain("<table>");
    expect(nextHtml).toContain('data-variable="true"');
  });

  it("replaces the empty placeholder text with the dropped variable token", () => {
    const nextHtml = insertVariableTokenIntoRichTextHtml("<p>Double-cliquez pour éditer</p>", variablePayload);

    expect(nextHtml).toContain('data-variable="true"');
  });

  it("inserts a variable token at the current rich text cursor position", () => {
    const focus = vi.fn();
    const insertContentAt = vi.fn();
    const editor = {
      state: {
        selection: { from: 4, to: 4 },
        doc: { content: { size: 40 } },
        schema: {
          nodes: {
            variable: {
              create: (attrs: Record<string, unknown>) => ({ type: "variable", attrs }),
            },
          },
        },
      },
      commands: { focus, insertContentAt },
    };

    const result = insertVariableTokenIntoRichTextEditor(editor, variablePayload, null);

    expect(result.inserted).toBe(true);
    expect(result.range).toEqual({ from: 4, to: 4 });
    expect(insertContentAt).toHaveBeenCalledWith({ from: 4, to: 4 }, { type: "variable", attrs: expect.objectContaining({ key: "candidate.firstName" }) });
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
