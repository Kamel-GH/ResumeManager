import type { BoundDocument } from "@/features/editor/schema/document-types";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

export type BindingEngineInput = {
  template: TemplateSchema;
  data: Record<string, unknown>;
};

export function resolveBindings(input: BindingEngineInput): BoundDocument {
  return {
    template: input.template,
    resolvedBindings: input.data,
    validation: {
      valid: true,
      errors: [],
    },
  };
}
