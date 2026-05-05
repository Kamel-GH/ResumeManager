import type { BoundDocument } from "@/features/editor/schema/document-types";
import type { BindingData, BindingValue } from "@/features/editor/schema/editor-model-types";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

export type BindingEngineInput = {
  template: TemplateSchema;
  data: Record<string, unknown>;
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

function resolveBindingValue(data: Record<string, unknown>, bindingId: string): { found: boolean; value: BindingValue } {
  if (Object.prototype.hasOwnProperty.call(data, bindingId)) {
    return { found: true, value: normalizeBindingValue(data[bindingId]) };
  }

  const pathSegments = bindingId.split(".").map((segment) => segment.trim()).filter(Boolean);
  if (pathSegments.length <= 1) {
    return { found: false, value: null };
  }

  let current: unknown = data;

  for (const segment of pathSegments) {
    if (!isRecordLike(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { found: false, value: null };
    }

    current = current[segment];
  }

  return { found: true, value: normalizeBindingValue(current) };
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBindingValue(value: unknown): BindingValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeBindingValue(item));
  }

  if (isRecordLike(value)) {
    const normalized: Record<string, BindingValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      normalized[key] = normalizeBindingValue(entry);
    }
    return normalized;
  }

  return String(value);
}
