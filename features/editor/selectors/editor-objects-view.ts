import type { TemplateElementType, TemplateSchema } from "@/features/editor/schema/template-schema";
import {
  readElementPropBoolean,
  readElementPropString,
  resolveElementLabel,
  resolveElementLayerIdentity,
  resolveSingleLayerIdForPage,
  resolveStableLayerNumber,
} from "@/features/editor/schema/canvas-layer-object-model";

export type EditorObjectView = {
  id: string;
  name: string;
  type: TemplateElementType;
  pageId: string;
  pageName: string;
  pageIndex: number;
  layerId: string | null;
  layerNumber: number | null;
  layerName: string;
  layerOrder: number | null;
  visible: boolean;
  locked: boolean;
  grouped: boolean | null;
  groupId: string | null;
  selected: boolean;
};

export type EditorObjectViewFilters = {
  text?: string;
  type?: string;
  layer?: string;
  page?: string;
};

export function deriveEditorObjectsView(template: TemplateSchema, selectedElementIds: string[], activePageId?: string | null): EditorObjectView[] {
  const activePage = template.pages.find((page) => page.id === activePageId) ?? template.pages[0] ?? null;
  if (!activePage) {
    return [];
  }

  const pageIndex = template.pages.findIndex((page) => page.id === activePage.id) + 1;
  const fallbackLayerId = resolveSingleLayerIdForPage(template, activePage.id);
  const pageElements = template.elements
    .filter((element) => element.pageId === activePage.id)
    .sort((a, b) => {
      const layerOrderA = resolveElementLayerIdentity(a, fallbackLayerId)?.order ?? 0;
      const layerOrderB = resolveElementLayerIdentity(b, fallbackLayerId)?.order ?? 0;
      if (layerOrderA !== layerOrderB) {
        return layerOrderA - layerOrderB;
      }

      return a.zIndex - b.zIndex || a.id.localeCompare(b.id, "fr");
    });

  return pageElements.map((element) => {
    const layerIdentity = resolveElementLayerIdentity(element, fallbackLayerId);
    return {
      id: element.id,
      name: resolveElementLabel(element),
      type: element.type,
      pageId: activePage.id,
      pageName: activePage.name,
      pageIndex,
      layerId: layerIdentity?.key ?? null,
      layerNumber: layerIdentity ? resolveStableLayerNumber(layerIdentity.key, layerIdentity.order ?? 1) : null,
      layerName: layerIdentity?.name ?? "Contenu",
      layerOrder: layerIdentity?.order ?? null,
      visible: element.visible,
      locked: element.locked,
      grouped: readElementPropBoolean(element, "grouped") ?? (readElementPropString(element, "groupId") ? true : null),
      groupId: readElementPropString(element, "groupId"),
      selected: selectedElementIds.includes(element.id),
    };
  });
}

export function filterEditorObjectsView(objects: EditorObjectView[], filters: EditorObjectViewFilters) {
  const query = filters.text?.trim().toLowerCase() ?? "";

  return objects.filter((object) => {
    const matchesText =
      !query ||
      [object.name, object.type, object.pageName, String(object.pageIndex), object.layerName, object.layerNumber ? String(object.layerNumber) : "", object.visible ? "visible" : "hidden", object.locked ? "locked" : "unlocked"].some((value) =>
        value.toLowerCase().includes(query),
      );
    const matchesType = !filters.type || filters.type === "all" || object.type === filters.type;
    const matchesLayer = !filters.layer || filters.layer === "all" || object.layerId === filters.layer;
    const matchesPage = !filters.page || filters.page === "all" || String(object.pageIndex) === filters.page || object.pageId === filters.page;
    return matchesText && matchesType && matchesLayer && matchesPage;
  });
}
