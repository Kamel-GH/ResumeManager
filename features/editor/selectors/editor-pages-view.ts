import type { TemplateSchema } from "@/features/editor/schema/template-schema";

export type EditorPageView = {
  id: string;
  name: string;
  index: number;
  width: number;
  height: number;
  active: boolean;
  elementCount: number;
};

export function deriveEditorPagesView(template: TemplateSchema, activePageId?: string | null): EditorPageView[] {
  if (template.pages.length === 0) {
    return [];
  }

  const resolvedActivePageId = template.pages.some((page) => page.id === activePageId) ? activePageId : template.pages[0]?.id ?? null;
  const elementCountByPageId = template.elements.reduce<Record<string, number>>((counts, element) => {
    counts[element.pageId] = (counts[element.pageId] ?? 0) + 1;
    return counts;
  }, {});

  return template.pages.map((page, index) => ({
    id: page.id,
    name: page.name,
    index: index + 1,
    width: page.width,
    height: page.height,
    active: page.id === resolvedActivePageId,
    elementCount: elementCountByPageId[page.id] ?? 0,
  }));
}
