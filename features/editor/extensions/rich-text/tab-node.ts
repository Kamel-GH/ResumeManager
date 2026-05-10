import { type Editor, mergeAttributes, Node } from "@tiptap/core";

export const RICH_TEXT_TAB_WIDTH_PX = 48;

function readTabs(attrs: Record<string, unknown>): number[] {
  return Array.isArray(attrs.tabs)
    ? attrs.tabs
        .map((tab) => (typeof tab === "number" ? tab : Number.parseFloat(String(tab))))
        .filter((tab) => Number.isFinite(tab) && tab > 0)
        .sort((left, right) => left - right)
    : [];
}

function resolveCaretOffsetPx(editor: Editor): number {
  try {
    const coords = editor.view.coordsAtPos(editor.state.selection.from);
    const surface = (editor.view.dom as HTMLElement).closest(".ef-rtp-editor-content");
    const rect = surface?.getBoundingClientRect();
    return rect ? Math.max(0, coords.left - rect.left) : 0;
  } catch {
    return 0;
  }
}

export const TabNode = Node.create({
  name: "tab",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      width: {
        default: RICH_TEXT_TAB_WIDTH_PX,
        parseHTML: (element) => {
          const parsed = Number.parseFloat(element.getAttribute("data-width") ?? "");
          return Number.isFinite(parsed) && parsed > 0 ? parsed : RICH_TEXT_TAB_WIDTH_PX;
        },
        renderHTML: (attributes) => ({ "data-width": String(attributes.width) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-rich-text-tab]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const width = Number.isFinite(node.attrs.width) ? node.attrs.width : RICH_TEXT_TAB_WIDTH_PX;
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-rich-text-tab": "",
        "aria-hidden": "true",
        class: "ef-rich-text-tab-node",
        style: `display:inline-block;width:${width}px`,
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const attrs = this.editor.getAttributes("paragraph");
        const tabs = readTabs(attrs);
        const caretOffset = resolveCaretOffsetPx(this.editor);
        const nextTab = tabs.find((tab) => tab > caretOffset + 1);
        const width = nextTab ? Math.max(1, nextTab - caretOffset) : RICH_TEXT_TAB_WIDTH_PX;
        return this.editor.commands.insertContent({ type: this.name, attrs: { width } });
      },
    };
  },
});
