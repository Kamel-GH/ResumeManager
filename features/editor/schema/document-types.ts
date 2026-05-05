import type { TemplateSchema } from "@/features/editor/schema/template-schema";
import type { BindingData } from "@/features/editor/schema/editor-model-types";

export type TemplateDocument = {
  schema: TemplateSchema;
  metadata: TemplateDocumentMetadata;
};

export type TemplateDocumentMetadata = {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type BoundDocument = {
  template: TemplateSchema;
  resolvedBindings: BindingData;
  validation: BoundDocumentValidation;
};

export type BoundDocumentValidation = {
  valid: boolean;
  errors: BoundDocumentValidationError[];
};

export type BoundDocumentValidationError = {
  path: string;
  message: string;
};
