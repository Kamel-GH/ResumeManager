import type { BoundDocument } from "@/features/editor/schema/document-types";
import type { BindingData, BindingValue } from "@/features/editor/schema/editor-model-types";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

export type BindingEngineInput = {
  template: TemplateSchema;
  data: BindingData;
};

export function resolveBindings(input: BindingEngineInput): BoundDocument {
  const bindingIds = new Set<string>();

  for (const element of input.template.elements) {
    if (typeof element.bindingId === "string" && element.bindingId.trim().length > 0) {
      bindingIds.add(element.bindingId.trim());
    }
  }

  const resolvedBindings: BindingData = {};
  const errors: BoundDocument["validation"]["errors"] = [];

  for (const bindingId of bindingIds) {
    const resolution = resolveBindingValue(input.data, bindingId);
    if (resolution.found) {
      resolvedBindings[bindingId] = resolution.value;
      continue;
    }

    resolvedBindings[bindingId] = null;
    errors.push({
      path: `bindings.${bindingId}`,
      message: `Missing data for binding "${bindingId}"`,
    });
  }

  return {
    template: input.template,
    resolvedBindings,
    validation: {
      valid: errors.length === 0,
      errors,
    },
  };
}

function resolveBindingValue(data: BindingData, bindingId: string): { found: boolean; value: BindingValue | null } {
  if (Object.prototype.hasOwnProperty.call(data, bindingId)) {
    const value = data[bindingId];
    return { found: true, value: value === undefined ? null : value };
  }

  const pathSegments = bindingId.split(".").map((segment) => segment.trim()).filter(Boolean);
  if (pathSegments.length <= 1) {
    return { found: false, value: null };
  }

  let current: BindingValue | null = data;

  for (const segment of pathSegments) {
    if (!isRecordLike(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { found: false, value: null };
    }

    const nextValue: BindingValue = current[segment];
    if (nextValue === undefined) {
      return { found: false, value: null };
    }

    current = nextValue;
  }

  return { found: true, value: current };
}

function isRecordLike(value: BindingValue | null): value is BindingData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
