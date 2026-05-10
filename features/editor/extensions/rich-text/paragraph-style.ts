import { Extension } from "@tiptap/core";
import { cmToPx } from "@/features/editor/lib/measurement";

export type ParagraphStyleAttrs = {
  marginLeft: number;
  marginRight: number;
  tabs: number[];
};

function readNumericAttr(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function readTabsAttr(value: unknown): number[] {
  if (Array.isArray(value)) {
    return normalizeTabs(value);
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? normalizeTabs(parsed) : [];
  } catch {
    return normalizeTabs(value.split(","));
  }
}

function normalizeTabs(input: unknown[]): number[] {
  return Array.from(
    new Set(
      input
        .map((item) => readNumericAttr(item))
        .filter((item) => Number.isFinite(item) && item >= 0)
        .map((item) => Math.round(item)),
    ),
  ).sort((left, right) => left - right);
}

export const DEFAULT_RICH_TEXT_MARGIN_PX = Math.round(cmToPx(1));

export const ParagraphStyle = Extension.create({
  name: "paragraphStyle",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          marginLeft: {
            default: DEFAULT_RICH_TEXT_MARGIN_PX,
            parseHTML: (element) =>
              readNumericAttr(
                element.getAttribute("data-margin-left") || element.style.marginLeft,
                DEFAULT_RICH_TEXT_MARGIN_PX,
              ),
            renderHTML: (attributes) => {
              const marginLeft = readNumericAttr(attributes.marginLeft, 0);
              const marginRight = readNumericAttr(attributes.marginRight, 0);
              const tabs = readTabsAttr(attributes.tabs);
              const style = [
                marginLeft > 0 ? `margin-left:${marginLeft}px` : "",
                marginRight > 0 ? `margin-right:${marginRight}px` : "",
              ]
                .filter(Boolean)
                .join(";");

              return {
                ...(marginLeft > 0 ? { "data-margin-left": String(marginLeft) } : {}),
                ...(marginRight > 0 ? { "data-margin-right": String(marginRight) } : {}),
                ...(tabs.length > 0 ? { "data-tabs": JSON.stringify(tabs) } : {}),
                ...(style ? { style } : {}),
              };
            },
          },
          marginRight: {
            default: DEFAULT_RICH_TEXT_MARGIN_PX,
            parseHTML: (element) =>
              readNumericAttr(
                element.getAttribute("data-margin-right") || element.style.marginRight,
                DEFAULT_RICH_TEXT_MARGIN_PX,
              ),
            renderHTML: () => ({}),
          },
          tabs: {
            default: null,
            parseHTML: (element) => readTabsAttr(element.getAttribute("data-tabs")),
            renderHTML: () => ({}),
          },
        },
      },
    ];
  },
});
