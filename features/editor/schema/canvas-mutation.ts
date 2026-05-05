import type { TemplateElement, TemplateElementStyle, TemplateSchema } from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";
import {
  compareCanvasElementsByPresentationOrder,
  groupTemplateElementsByPageAndLayer,
} from "@/features/editor/schema/canvas-layer-object-model";

export const DEFAULT_CANVAS_FILL_COLOR = "#d9b86f";
export const DEFAULT_CANVAS_STROKE_COLOR = "#0f172a";
export const DEFAULT_CANVAS_STROKE_WIDTH = 2;

export type CanvasObjectGeometryPatch = {
  id: string;
  frame: Rect;
  rotation: number;
  points?: number[];
};

export type CanvasObjectStylePatch = {
  id: string;
  style: Partial<CanvasObjectStyleValues>;
};

export type CanvasObjectStyleValues = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: number[];
  cornerRadius?: number;
};

export type CanvasObjectStyleCapabilities = {
  fill: boolean;
  stroke: boolean;
  strokeWidth: boolean;
  opacity: boolean;
  dash: boolean;
  cornerRadius: boolean;
};

export type CanvasObjectOrderAction = "bring-to-front" | "bring-forward" | "send-backward" | "send-to-back";

export type CanvasObjectAlignmentAction =
  | "align-left"
  | "align-center-horizontal"
  | "align-right"
  | "align-top"
  | "align-center-vertical"
  | "align-bottom";

export type CanvasObjectFlipAxis = "horizontal" | "vertical";

export function applyCanvasObjectGeometry(template: TemplateSchema, patches: CanvasObjectGeometryPatch[]) {
  if (patches.length === 0) {
    return template;
  }

  const patchById = new Map(patches.map((patch) => [patch.id, patch] as const));

  return {
    ...template,
    elements: template.elements.map((element) => {
      const patch = patchById.get(element.id);
      if (!patch || element.locked) {
        return element;
      }

      return {
        ...element,
        frame: {
          x: patch.frame.x,
          y: patch.frame.y,
          width: patch.frame.width,
          height: patch.frame.height,
        },
        rotation: patch.rotation,
        props:
          patch.points && element.props
            ? {
                ...element.props,
                points: patch.points,
              }
            : element.props,
      };
    }),
  };
}

export function applyCanvasObjectStyle(template: TemplateSchema, patches: CanvasObjectStylePatch[]) {
  if (patches.length === 0) {
    return template;
  }

  const patchById = new Map(patches.map((patch) => [patch.id, patch] as const));

  return {
    ...template,
    elements: template.elements.map((element) => {
      if (element.locked) {
        return element;
      }

      const patch = patchById.get(element.id);
      if (!patch) {
        return element;
      }

      const filteredPatch = filterCanvasObjectStylePatch(element, patch.style);
      if (!filteredPatch) {
        return element;
      }

      const nextStyle = {
        ...(element.style ?? {}),
        ...filteredPatch,
      };

      if (areTemplateElementStylesEqual(element.style, nextStyle)) {
        return element;
      }

      return {
        ...element,
        style: nextStyle,
      };
    }),
  };
}

export function duplicateTemplateCanvasElements(
  template: TemplateSchema,
  input: {
    elementIds: string[];
    offset?: { x: number; y: number };
  },
) {
  const selectedIds = new Set(normalizeUniqueIds(input.elementIds));
  if (selectedIds.size === 0) {
    return {
      template,
      duplicatedIds: [] as string[],
      duplicatedElements: [] as TemplateElement[],
    };
  }

  const offset = input.offset ?? { x: 12, y: 12 };
  const sourceElements = template.elements.filter((element) => selectedIds.has(element.id) && !element.locked);
  if (sourceElements.length === 0) {
    return {
      template,
      duplicatedIds: [] as string[],
      duplicatedElements: [] as TemplateElement[],
    };
  }

  const result = duplicateTemplateCanvasElementsFromElements(template, sourceElements, offset);

  return {
    template: result.template,
    duplicatedIds: result.duplicatedIds,
    duplicatedElements: result.duplicatedElements,
  };
}

export function duplicateTemplateCanvasElementsFromElements(
  template: TemplateSchema,
  sourceElements: TemplateElement[],
  offset?: { x: number; y: number },
) {
  const editableElements = sourceElements.filter((element) => !element.locked);
  if (editableElements.length === 0) {
    return {
      template,
      duplicatedIds: [] as string[],
      duplicatedElements: [] as TemplateElement[],
    };
  }

  const delta = offset ?? { x: 12, y: 12 };
  const pageById = new Map(template.pages.map((page) => [page.id, page] as const));
  const nextTemplate = structuredClone(template);
  let nextZIndex = nextTemplate.elements.reduce((max, element) => Math.max(max, element.zIndex), 0) + 1;
  const duplicatedElements: TemplateElement[] = [];

  editableElements
    .slice()
    .sort(compareCanvasElementsByPresentationOrder(template))
    .forEach((element) => {
      const page = pageById.get(element.pageId);
      const duplicate = structuredClone(element);
      duplicate.id = createCanvasDuplicateId(element.id);
      duplicate.frame = clampFrameToPage(
        {
          x: element.frame.x + delta.x,
          y: element.frame.y + delta.y,
          width: element.frame.width,
          height: element.frame.height,
        },
        page?.width ?? element.frame.width + delta.x,
        page?.height ?? element.frame.height + delta.y,
      );
      duplicate.zIndex = nextZIndex++;
      duplicate.props = duplicate.props ? structuredClone(duplicate.props) : undefined;
      duplicate.style = duplicate.style ? structuredClone(duplicate.style) : undefined;
      nextTemplate.elements.push(duplicate);
      duplicatedElements.push(duplicate);
    });

  return {
    template: nextTemplate,
    duplicatedIds: duplicatedElements.map((element) => element.id),
    duplicatedElements,
  };
}

export function deleteTemplateCanvasElements(
  template: TemplateSchema,
  input: {
    elementIds: string[];
  },
) {
  const idsToDelete = new Set(normalizeUniqueIds(input.elementIds));
  if (idsToDelete.size === 0) {
    return {
      template,
      deletedIds: [] as string[],
    };
  }

  const deletedIds = template.elements.filter((element) => idsToDelete.has(element.id) && !element.locked).map((element) => element.id);
  if (deletedIds.length === 0) {
    return {
      template,
      deletedIds: [] as string[],
    };
  }

  const deletedSet = new Set(deletedIds);

  return {
    template: {
      ...template,
      elements: template.elements.filter((element) => !deletedSet.has(element.id)),
    },
    deletedIds,
  };
}

export function reorderTemplateCanvasElements(
  template: TemplateSchema,
  input: {
    elementIds: string[];
    action: CanvasObjectOrderAction;
  },
) {
  const selectedIds = new Set(normalizeUniqueIds(input.elementIds));
  if (selectedIds.size === 0) {
    return {
      template,
      changedIds: [] as string[],
    };
  }

  const groups = groupTemplateElementsByPageAndLayer(template);
  const nextElementsById = new Map(template.elements.map((element) => [element.id, structuredClone(element)] as const));
  const changedIds = new Set<string>();

  groups.forEach((group) => {
    const editableSelected = group.elements.filter((element) => selectedIds.has(element.id) && !element.locked);
    if (editableSelected.length === 0) {
      return;
    }

    const reorderedIds = reorderCanvasElementGroup(group.elements, editableSelected.map((element) => element.id), input.action);
    if (areStringArraysEqual(group.elements.map((element) => element.id), reorderedIds)) {
      return;
    }

    const baseZIndex = group.elements.reduce((min, element) => Math.min(min, element.zIndex), group.elements[0]?.zIndex ?? 0);
    reorderedIds.forEach((elementId, index) => {
      const element = nextElementsById.get(elementId);
      if (!element) {
        return;
      }

      element.zIndex = baseZIndex + index;
      changedIds.add(element.id);
    });
  });

  if (changedIds.size === 0) {
    return {
      template,
      changedIds: [] as string[],
    };
  }

  return {
    template: {
      ...template,
      elements: template.elements.map((element) => nextElementsById.get(element.id) ?? element),
    },
    changedIds: [...changedIds],
  };
}

export function alignTemplateCanvasElements(
  template: TemplateSchema,
  input: {
    elementIds: string[];
    alignment: CanvasObjectAlignmentAction;
  },
) {
  const selectedIds = new Set(normalizeUniqueIds(input.elementIds));
  if (selectedIds.size === 0) {
    return {
      template,
      patches: [] as CanvasObjectGeometryPatch[],
      changedIds: [] as string[],
    };
  }

  const pageById = new Map(template.pages.map((page) => [page.id, page] as const));
  const groupsByPageId = new Map<string, TemplateElement[]>();

  template.elements.forEach((element) => {
    if (!selectedIds.has(element.id) || element.locked) {
      return;
    }

    const group = groupsByPageId.get(element.pageId);
    if (group) {
      group.push(element);
      return;
    }

    groupsByPageId.set(element.pageId, [element]);
  });

  const patches: CanvasObjectGeometryPatch[] = [];
  const changedIds = new Set<string>();

  groupsByPageId.forEach((elements, pageId) => {
    const page = pageById.get(pageId);
    if (!page || elements.length < 2) {
      return;
    }

    const selectionBounds = computeElementBounds(elements);
    elements.forEach((element) => {
      const nextFrame = clampFrameToPage(resolveAlignedFrame(element.frame, selectionBounds, input.alignment), page.width, page.height);

      if (areRectsEqual(element.frame, nextFrame)) {
        return;
      }

      patches.push({
        id: element.id,
        frame: nextFrame,
        rotation: element.rotation ?? 0,
      });
      changedIds.add(element.id);
    });
  });

  if (patches.length === 0) {
    return {
      template,
      patches,
      changedIds: [] as string[],
    };
  }

  return {
    template: applyCanvasObjectGeometry(template, patches),
    patches,
    changedIds: [...changedIds],
  };
}

export function flipTemplateCanvasElements(
  template: TemplateSchema,
  input: {
    elementIds: string[];
    axis: CanvasObjectFlipAxis;
  },
) {
  const selectedIds = new Set(normalizeUniqueIds(input.elementIds));
  if (selectedIds.size === 0) {
    return {
      template,
      changedIds: [] as string[],
    };
  }

  const nextTemplate = structuredClone(template);
  const changedIds: string[] = [];

  nextTemplate.elements = nextTemplate.elements.map((element) => {
    if (!selectedIds.has(element.id) || element.locked) {
      return element;
    }

    const nextProps = {
      ...(element.props ?? {}),
      ...(input.axis === "horizontal" ? { flipX: !Boolean(element.props?.flipX) } : { flipY: !Boolean(element.props?.flipY) }),
    };

    changedIds.push(element.id);
    return {
      ...element,
      props: nextProps,
    };
  });

  return {
    template: changedIds.length > 0 ? nextTemplate : template,
    changedIds,
  };
}

export function isCanvasObjectStyleSupportedElement(element: TemplateElement) {
  const capabilities = resolveCanvasObjectStyleCapabilities(element);
  return capabilities.fill || capabilities.stroke || capabilities.strokeWidth || capabilities.opacity || capabilities.dash || capabilities.cornerRadius;
}

export function resolveCanvasObjectStyleCapabilities(element: TemplateElement): CanvasObjectStyleCapabilities {
  if (element.type === "image") {
    return {
      fill: false,
      stroke: false,
      strokeWidth: false,
      opacity: true,
      dash: false,
      cornerRadius: false,
    };
  }

  if (element.type === "rich-text" || element.type === "table" || element.type === "list") {
    return {
      fill: true,
      stroke: true,
      strokeWidth: true,
      opacity: true,
      dash: true,
      cornerRadius: true,
    };
  }

  if (element.type !== "shape") {
    return {
      fill: false,
      stroke: false,
      strokeWidth: false,
      opacity: false,
      dash: false,
      cornerRadius: false,
    };
  }

  if (hasRenderableSvgSource(element)) {
    return {
      fill: false,
      stroke: false,
      strokeWidth: false,
      opacity: true,
      dash: false,
      cornerRadius: false,
    };
  }

  const shape = getShapeKind(element);
  if (shape === "line" || shape === "polyline" || shape === "curve") {
    return {
      fill: false,
      stroke: true,
      strokeWidth: true,
      opacity: true,
      dash: true,
      cornerRadius: false,
    };
  }

  if (shape === "arc") {
    return {
      fill: isPieArc(element),
      stroke: true,
      strokeWidth: true,
      opacity: true,
      dash: true,
      cornerRadius: false,
    };
  }

  return {
    fill: true,
    stroke: true,
    strokeWidth: true,
    opacity: true,
    dash: true,
    cornerRadius: true,
  };
}

export function resolveCanvasObjectStylePreview(element: TemplateElement): CanvasObjectStyleValues {
  const defaults = resolveCanvasObjectStyleDefaults(element);
  const style = element.style ?? {};

  return {
    fill: style.fill ?? defaults.fill,
    stroke: style.stroke ?? defaults.stroke,
    strokeWidth: style.strokeWidth ?? defaults.strokeWidth,
    opacity: style.opacity ?? defaults.opacity,
    dash: style.dash ?? defaults.dash,
    cornerRadius: style.cornerRadius ?? defaults.cornerRadius,
  };
}

export function resolveCanvasObjectStyleDefaults(element: TemplateElement): CanvasObjectStyleValues {
  if (element.type === "image") {
    return {
      opacity: 1,
    };
  }

  if (element.type === "rich-text") {
    return {
      fill: "rgba(255,255,255,0.02)",
      stroke: "#cbd5e1",
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 0,
    };
  }

  if (element.type === "table" || element.type === "list") {
    return {
      fill: "#ffffff",
      stroke: "#cbd5e1",
      strokeWidth: 1,
      opacity: 1,
      cornerRadius: 0,
    };
  }

  if (element.type !== "shape") {
    return {
      opacity: 1,
    };
  }

  if (hasRenderableSvgSource(element)) {
    return {
      opacity: 1,
    };
  }

  const shape = getShapeKind(element);
  if (shape === "line" || shape === "polyline" || shape === "curve" || shape === "arc") {
    return {
      fill: "transparent",
      stroke: DEFAULT_CANVAS_STROKE_COLOR,
      strokeWidth: DEFAULT_CANVAS_STROKE_WIDTH,
      opacity: 1,
    };
  }

  if (shape === "polygon") {
    return {
      fill: DEFAULT_CANVAS_FILL_COLOR,
      stroke: DEFAULT_CANVAS_STROKE_COLOR,
      strokeWidth: DEFAULT_CANVAS_STROKE_WIDTH,
      opacity: 1,
    };
  }

  return {
    fill: DEFAULT_CANVAS_FILL_COLOR,
    stroke: "transparent",
    strokeWidth: 1,
    opacity: 1,
  };
}

function filterCanvasObjectStylePatch(element: TemplateElement, stylePatch: Partial<CanvasObjectStyleValues>): Partial<CanvasObjectStyleValues> | null {
  const capabilities = resolveCanvasObjectStyleCapabilities(element);
  const nextStyle: Partial<CanvasObjectStyleValues> = {};

  if (stylePatch.fill !== undefined && capabilities.fill) {
    nextStyle.fill = stylePatch.fill;
  }

  if (stylePatch.stroke !== undefined && capabilities.stroke) {
    nextStyle.stroke = stylePatch.stroke;
  }

  if (stylePatch.strokeWidth !== undefined && capabilities.strokeWidth) {
    nextStyle.strokeWidth = stylePatch.strokeWidth;
  }

  if (stylePatch.opacity !== undefined && capabilities.opacity) {
    nextStyle.opacity = clampNumber(stylePatch.opacity, 0, 1);
  }

  if (stylePatch.dash !== undefined && capabilities.dash) {
    nextStyle.dash = [...stylePatch.dash];
  }

  if (stylePatch.cornerRadius !== undefined && capabilities.cornerRadius) {
    nextStyle.cornerRadius = Math.max(0, stylePatch.cornerRadius);
  }

  return Object.keys(nextStyle).length > 0 ? nextStyle : null;
}

function areTemplateElementStylesEqual(a: TemplateElementStyle | undefined, b: TemplateElementStyle | undefined) {
  const left = a ?? {};
  const right = b ?? {};

  return left.fill === right.fill && left.stroke === right.stroke && left.strokeWidth === right.strokeWidth && left.opacity === right.opacity && areNumberArraysEqual(left.dash, right.dash) && left.cornerRadius === right.cornerRadius;
}

function areNumberArraysEqual(a: number[] | undefined, b: number[] | undefined) {
  if (a === b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function getShapeKind(element: TemplateElement) {
  return typeof element.props?.shape === "string" ? element.props.shape : "rect";
}

function hasRenderableSvgSource(element: TemplateElement) {
  return typeof element.props?.svg === "string" || typeof element.props?.src === "string";
}

function isPieArc(element: TemplateElement) {
  return element.props?.shape === "arc" && element.props?.arcType === "pie";
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeUniqueIds(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function areStringArraysEqual(a: string[], b: string[]) {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function reorderCanvasElementGroup(elements: TemplateElement[], selectedIds: string[], action: CanvasObjectOrderAction) {
  const selectedSet = new Set(selectedIds);
  const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  const lockedSlots = ordered.reduce<number[]>((slots, element, index) => {
    if (element.locked) {
      slots.push(index);
    }

    return slots;
  }, []);

  if (lockedSlots.length === 0) {
    return reorderUnlockedCanvasElementGroup(ordered, selectedSet, action).map((element) => element.id);
  }

  const next = [...ordered];
  const segments = splitCanvasElementsByLockedAnchors(ordered);

  segments.forEach((segment) => {
    const movableSelectedIds = segment.elements.filter((element) => selectedSet.has(element.id) && !element.locked).map((element) => element.id);
    if (movableSelectedIds.length === 0) {
      return;
    }

    const reorderedIds = reorderUnlockedCanvasElementGroup(segment.elements, new Set(movableSelectedIds), action).map((element) => element.id);
    const reorderedElementsById = new Map(reorderedIds.map((id) => [id, ordered.find((element) => element.id === id)] as const));

    segment.elements.forEach((element, index) => {
      if (element.locked) {
        return;
      }

      const reorderedId = reorderedIds[index];
      const reorderedElement = reorderedElementsById.get(reorderedId);
      if (!reorderedElement) {
        return;
      }

      next[segment.startIndex + index] = reorderedElement;
    });
  });

  return next.map((element) => element.id);
}

function reorderUnlockedCanvasElementGroup(elements: TemplateElement[], selectedSet: Set<string>, action: CanvasObjectOrderAction) {
  const ordered = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  switch (action) {
    case "bring-to-front": {
      const stationary = ordered.filter((element) => !selectedSet.has(element.id));
      const moving = ordered.filter((element) => selectedSet.has(element.id));
      return [...stationary, ...moving];
    }
    case "send-to-back": {
      const moving = ordered.filter((element) => selectedSet.has(element.id));
      const stationary = ordered.filter((element) => !selectedSet.has(element.id));
      return [...moving, ...stationary];
    }
    case "bring-forward": {
      const next = [...ordered];
      for (let index = next.length - 2; index >= 0; index -= 1) {
        const current = next[index];
        const follower = next[index + 1];
        if (!selectedSet.has(current.id) || selectedSet.has(follower.id)) {
          continue;
        }

        next[index] = follower;
        next[index + 1] = current;
      }

      return next;
    }
    case "send-backward": {
      const next = [...ordered];
      for (let index = 1; index < next.length; index += 1) {
        const current = next[index];
        const previous = next[index - 1];
        if (!selectedSet.has(current.id) || selectedSet.has(previous.id)) {
          continue;
        }

        next[index] = previous;
        next[index - 1] = current;
      }

      return next;
    }
  }

  return ordered;
}

function splitCanvasElementsByLockedAnchors(elements: TemplateElement[]) {
  const segments: Array<{ startIndex: number; elements: TemplateElement[] }> = [];
  let segmentStart = 0;

  elements.forEach((element, index) => {
    if (!element.locked) {
      return;
    }

    if (index > segmentStart) {
      segments.push({
        startIndex: segmentStart,
        elements: elements.slice(segmentStart, index),
      });
    }

    segments.push({
      startIndex: index,
      elements: [element],
    });
    segmentStart = index + 1;
  });

  if (segmentStart < elements.length) {
    segments.push({
      startIndex: segmentStart,
      elements: elements.slice(segmentStart),
    });
  }

  return segments;
}

function computeElementBounds(elements: TemplateElement[]) {
  return elements.reduce(
    (acc, element, index) => {
      if (index === 0) {
        return {
          x: element.frame.x,
          y: element.frame.y,
          width: element.frame.width,
          height: element.frame.height,
        };
      }

      const minX = Math.min(acc.x, element.frame.x);
      const minY = Math.min(acc.y, element.frame.y);
      const maxX = Math.max(acc.x + acc.width, element.frame.x + element.frame.width);
      const maxY = Math.max(acc.y + acc.height, element.frame.y + element.frame.height);

      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    },
    {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },
  );
}

function resolveAlignedFrame(frame: Rect, reference: Rect, alignment: CanvasObjectAlignmentAction) {
  switch (alignment) {
    case "align-left":
      return { x: reference.x, y: frame.y, width: frame.width, height: frame.height };
    case "align-center-horizontal":
      return {
        x: reference.x + reference.width / 2 - frame.width / 2,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      };
    case "align-right":
      return { x: reference.x + reference.width - frame.width, y: frame.y, width: frame.width, height: frame.height };
    case "align-top":
      return { x: frame.x, y: reference.y, width: frame.width, height: frame.height };
    case "align-center-vertical":
      return {
        x: frame.x,
        y: reference.y + reference.height / 2 - frame.height / 2,
        width: frame.width,
        height: frame.height,
      };
    case "align-bottom":
      return { x: frame.x, y: reference.y + reference.height - frame.height, width: frame.width, height: frame.height };
  }
}

function clampFrameToPage(frame: Rect, pageWidth: number, pageHeight: number) {
  const width = Math.max(1, Math.min(frame.width, pageWidth));
  const height = Math.max(1, Math.min(frame.height, pageHeight));
  const x = clampNumber(frame.x, 0, Math.max(0, pageWidth - width));
  const y = clampNumber(frame.y, 0, Math.max(0, pageHeight - height));

  return {
    x,
    y,
    width,
    height,
  };
}

function areRectsEqual(a: Rect, b: Rect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function createCanvasDuplicateId(sourceId: string) {
  return `${sourceId}-copy-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}
