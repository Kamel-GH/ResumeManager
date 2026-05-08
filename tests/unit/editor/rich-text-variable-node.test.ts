import { describe, expect, it } from "vitest";
import type { JSONContent } from "@tiptap/core";

import {
  buildRichTextVariableNodeAttrsFromSource,
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

  it("resolves bracketed payloads from the registry without guessing a new key", () => {
    const attrs = buildRichTextVariableNodeAttrsFromSource({ label: "Prénom", token: "[Prénom]" }, registry);

    expect(attrs).toEqual(
      expect.objectContaining({
        id: "candidate.firstName",
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

  it("resolves value mode from the dataset and falls back when the data is missing", () => {
    const attrs = {
      key: "candidate.firstName",
      fallback: "Prénom",
      label: "Prénom",
    };

    expect(resolveRichTextVariableValue(attrs, "value", { candidate: { firstName: "Kamel" } })).toBe("Kamel");
    expect(resolveRichTextVariableValue(attrs, "value", {})).toBe("Prénom");
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

  it("keeps blank bracket syntax as plain text", () => {
    const parsed = parseRichTextHtmlToJson("<p>Bonjour [   ]</p>", registry);
    const paragraph = parsed.content?.[0];
    const text = paragraph && "content" in paragraph && Array.isArray(paragraph.content)
      ? paragraph.content.map((child) => ("text" in child ? child.text ?? "" : "")).join("")
      : "";

    expect(text).toContain("[   ]");
    expect(paragraph && "content" in paragraph ? paragraph.content?.some((child) => child.type === "variable") : false).toBe(false);
  });
});
