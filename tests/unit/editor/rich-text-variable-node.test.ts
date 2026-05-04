import { describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/core";

import {
  createRichTextVariableRegistry,
  parseRichTextHtmlToJson,
  serializeRichTextJsonToHtml,
  resolveRichTextVariableValue,
} from "@/features/editor/lib/rich-text-variable";

describe("rich text variable node", () => {
  const registry = createRichTextVariableRegistry([
    {
      id: "candidate.firstName",
      key: "prenom",
      label: "Prénom",
      sourceColumn: "Prénom",
      type: "text",
      enabled: true,
      sampleValue: "Kamel",
    },
  ]);

  const content: JSONContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Bonjour " },
          {
            type: "variable",
            attrs: {
              id: "candidate.firstName",
              key: "candidate.firstName",
              label: "Prénom",
              fallback: "Prénom",
              source: "candidate",
            },
          },
        ],
      },
    ],
  };

  it("parses technical syntax into a variable node", () => {
    const parsed = parseRichTextHtmlToJson("<p>Bonjour {{candidate.firstName}}</p>", registry);
    const paragraph = parsed.content?.[0];
    const variableNode = paragraph && "content" in paragraph ? paragraph.content?.find((child) => child.type === "variable") : null;

    expect(variableNode?.attrs).toEqual(
      expect.objectContaining({
        key: "candidate.firstName",
        label: "Prénom",
        fallback: "Prénom",
        source: "candidate",
      }),
    );
  });

  it("serializes variable nodes without mutating the canonical JSON", () => {
    const technicalHtml = serializeRichTextJsonToHtml(content, { displayMode: "technical", registry });
    const valueHtml = serializeRichTextJsonToHtml(content, {
      displayMode: "value",
      registry,
      dataset: {
        candidate: {
          firstName: "Kamel",
        },
      },
    });

    expect(technicalHtml).toContain("{{candidate.firstName}}");
    expect(valueHtml).toContain("Kamel");
    expect(content.content?.[0]?.content?.[1]?.attrs).toEqual(
      expect.objectContaining({
        key: "candidate.firstName",
        label: "Prénom",
      }),
    );
  });

  it("never renders an empty variable label fallback", () => {
    expect(
      resolveRichTextVariableValue(
        {
          key: "",
          fallback: "",
          label: "",
        },
        "label",
      ),
    ).toBe("[variable]");
  });
});
