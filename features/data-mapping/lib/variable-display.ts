import type { MappingVariable } from "@/features/data-mapping/types";
import {
  buildTraceOperationLog,
  type EditorOperationAction,
  type EditorOperationDetail,
  type EditorOperationLogEntry,
} from "@/features/editor/schema/editor-operation-log";

export type VariableDisplayKind = "TEXTE" | "IMAGE" | "LISTE" | "TABLE";

export type VariableDragEnvelope = {
  type: "variable";
  payload: {
    label: string;
    token: string;
    sampleValue: string;
    type: VariableDisplayKind;
    mappedPath: string;
    key: string;
    sourceColumn?: string | null;
  };
};

export const RICH_TEXT_VARIABLE_INSERT_EVENT = "resume-manager:rich-text-insert-variable";

export type EditorItemDragContext = {
  sessionId: string;
  type: string;
  sourcePanel?: string;
  payload: unknown;
};

type VariableDragPayload = {
  label?: unknown;
  token?: unknown;
  mappedPath?: unknown;
  key?: unknown;
  sourceColumn?: unknown;
};

const VARIABLE_PATH_BY_LABEL: Record<string, string> = {
  prenom: "candidate.firstName",
  nom: "candidate.lastName",
  photo: "candidate.photo",
  email: "candidate.email",
  telephone: "candidate.phone",
  adresse: "candidate.address",
  experiences: "candidate.experiences",
  formations: "candidate.education",
  langues: "candidate.languages",
  competences: "candidate.skills",
  interets: "candidate.interests",
};

const IMAGE_HINTS = ["photo", "image", "avatar", "portrait", "logo"];
const LIST_HINTS = [
  "experience",
  "experiences",
  "formation",
  "formations",
  "langue",
  "langues",
  "competence",
  "competences",
  "interet",
  "interets",
];
const TABLE_HINTS = ["table", "tableau", "grid", "grille"];

export function resolveVariableDisplayLabel(variable: Pick<MappingVariable, "label" | "key">) {
  const raw = variable.label.trim() || variable.key.trim() || "Variable";
  return raw.startsWith("[") && raw.endsWith("]") ? raw : `[${raw}]`;
}

export function resolveVariableMappedPath(
  variable: Pick<MappingVariable, "label" | "key" | "sourceColumn">,
) {
  const normalizedLabel = normalizeVariableName(variable.label);
  const normalizedKey = normalizeVariableName(variable.key);
  const normalizedSourceColumn = normalizeVariableName(variable.sourceColumn ?? "");

  return (
    VARIABLE_PATH_BY_LABEL[normalizedLabel] ??
    VARIABLE_PATH_BY_LABEL[normalizedKey] ??
    VARIABLE_PATH_BY_LABEL[normalizedSourceColumn] ??
    `candidate.${toCamelCase(variable.sourceColumn ?? variable.label ?? variable.key ?? "variable")}`
  );
}

export function resolveVariableDisplayKind(
  variable: Pick<MappingVariable, "label" | "key" | "sourceColumn" | "type">,
): VariableDisplayKind {
  const haystack = `${variable.label} ${variable.key} ${variable.sourceColumn ?? ""}`.toLowerCase();

  if (IMAGE_HINTS.some((hint) => haystack.includes(hint))) {
    return "IMAGE";
  }

  if (TABLE_HINTS.some((hint) => haystack.includes(hint))) {
    return "TABLE";
  }

  if (LIST_HINTS.some((hint) => haystack.includes(hint))) {
    return "LISTE";
  }

  return "TEXTE";
}

export function resolveVariableTooltip(
  variable: Pick<MappingVariable, "label" | "key" | "sourceColumn">,
) {
  return `${resolveVariableDisplayLabel(variable)} → ${resolveVariableMappedPath(variable)}`;
}

export function resolveVariableValue(key: string, dataset: unknown, fallback = "") {
  const normalizedKey = key.trim();
  if (!normalizedKey) {
    return fallback;
  }

  const pathSegments = normalizedKey
    .split(".")
    .flatMap((segment) => segment.match(/\[(\d+)\]|[^[]+/g) ?? [])
    .map((segment) => segment.replace(/^\[|\]$/g, "").trim())
    .filter(Boolean);

  if (pathSegments.length === 0) {
    return fallback;
  }

  let current: unknown = dataset;
  for (const segment of pathSegments) {
    if (current === null || current === undefined) {
      return fallback;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return fallback;
      }
      current = current[index];
      continue;
    }

    if (typeof current !== "object") {
      return fallback;
    }

    const record = current as Record<string, unknown>;
    current = record[segment];
  }

  if (current === null || current === undefined) {
    return fallback;
  }

  if (typeof current === "string") {
    return current.trim().length > 0 ? current : fallback;
  }

  if (typeof current === "number" || typeof current === "boolean" || typeof current === "bigint") {
    return String(current);
  }

  if (current instanceof Date) {
    return Number.isNaN(current.getTime()) ? fallback : current.toISOString();
  }

  return fallback || String(current);
}

export function buildVariableDragEnvelope(variable: MappingVariable): VariableDragEnvelope {
  const label = resolveVariableDisplayLabel(variable);
  const mappedPath = resolveVariableMappedPath(variable);
  const type = resolveVariableDisplayKind(variable);

  return {
    type: "variable",
    payload: {
      label,
      token: label,
      sampleValue: variable.sampleValue || variable.label || variable.key,
      type,
      mappedPath,
      key: variable.key,
      sourceColumn: variable.sourceColumn,
    },
  };
}

export function createVariableDragContext(variable: MappingVariable): EditorItemDragContext {
  const envelope = buildVariableDragEnvelope(variable);
  return {
    sessionId: `variable-drag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: envelope.type,
    sourcePanel: "data-variables",
    payload: envelope.payload,
  };
}

export function requestRichTextVariableInsert(payload: VariableDragEnvelope["payload"]) {
  if (typeof window === "undefined") {
    return false;
  }

  window.dispatchEvent(new CustomEvent(RICH_TEXT_VARIABLE_INSERT_EVENT, { detail: payload }));
  return true;
}

export function applyVariableDragPayload(
  event: { dataTransfer: DataTransfer },
  context: EditorItemDragContext,
) {
  const payload = JSON.stringify({
    type: context.type,
    payload: context.payload,
    sourcePanel: context.sourcePanel,
  });

  event.dataTransfer.setData("application/x-resume-editor-item", payload);
  event.dataTransfer.setData(
    "text/plain",
    String((context.payload as { token?: string } | null)?.token ?? context.type),
  );
  event.dataTransfer.effectAllowed = "copy";
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const drawing = canvas.getContext("2d");
  drawing?.clearRect(0, 0, 1, 1);
  event.dataTransfer.setDragImage(canvas, 0, 0);
}

export function scheduleVariableDragTraceClear(clear: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(clear);
    return;
  }

  setTimeout(clear, 0);
}

export function resolveVariableDragTraceElementId(context: EditorItemDragContext) {
  const payload = readVariableDragPayload(context.payload);
  const label = typeof payload?.label === "string" ? payload.label.trim() : "";
  const token = typeof payload?.token === "string" ? payload.token.trim() : "";
  return label || token || context.sessionId;
}

export function buildVariableDragTraceDetails(
  context: EditorItemDragContext,
  input: {
    action: EditorOperationAction;
    target: string;
    outcome?: string;
    reason?: string;
    pageId?: string;
  },
): EditorOperationDetail[] {
  const payload = readVariableDragPayload(context.payload);
  const details: EditorOperationDetail[] = [
    { label: "Phase", value: input.action },
    { label: "Source", value: context.sourcePanel ?? "unknown" },
    { label: "Type", value: context.type },
    { label: "Session", value: context.sessionId },
  ];

  if (typeof payload?.label === "string" && payload.label.trim().length > 0) {
    details.push({ label: "Variable", value: payload.label.trim() });
  }

  if (typeof payload?.token === "string" && payload.token.trim().length > 0) {
    details.push({ label: "Token", value: payload.token.trim() });
  }

  if (typeof payload?.mappedPath === "string" && payload.mappedPath.trim().length > 0) {
    details.push({ label: "Mapping", value: payload.mappedPath.trim() });
  }

  if (typeof payload?.sourceColumn === "string" && payload.sourceColumn.trim().length > 0) {
    details.push({ label: "Colonne", value: payload.sourceColumn.trim() });
  }

  if (typeof payload?.key === "string" && payload.key.trim().length > 0) {
    details.push({ label: "Key", value: payload.key.trim() });
  }

  if (input.pageId) {
    details.push({ label: "Page", value: input.pageId });
  }

  details.push({ label: "Cible", value: input.target });

  if (input.outcome) {
    details.push({ label: "Résultat", value: input.outcome });
  }

  if (input.reason) {
    details.push({ label: "Raison", value: input.reason });
  }

  return details;
}

export function buildVariableDragOperationLog(
  context: EditorItemDragContext,
  input: {
    action: Extract<
      EditorOperationAction,
      "dragstart" | "dragenter" | "dragover" | "dragleave" | "drop" | "dragend" | "drop-reject"
    >;
    pageId: string;
    target: string;
    outcome?: string;
    reason?: string;
    timestamp?: number;
  },
): EditorOperationLogEntry {
  return buildTraceOperationLog({
    action: input.action,
    pageId: input.pageId,
    elementId: resolveVariableDragTraceElementId(context),
    details: buildVariableDragTraceDetails(context, {
      action: input.action,
      target: input.target,
      outcome: input.outcome,
      reason: input.reason,
      pageId: input.pageId,
    }),
    timestamp: input.timestamp,
  });
}

export function parseEditorItemDragPayload(
  raw: string,
): { type: string; payload: unknown; sourcePanel?: string } | null {
  if (!raw.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { type?: unknown; payload?: unknown; sourcePanel?: unknown };
    if (typeof parsed.type !== "string") {
      return null;
    }

    return {
      type: parsed.type,
      payload: parsed.payload,
      sourcePanel: typeof parsed.sourcePanel === "string" ? parsed.sourcePanel : undefined,
    };
  } catch {
    return null;
  }
}

function normalizeVariableName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[[\]]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readVariableDragPayload(payload: unknown): VariableDragPayload | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  return payload as VariableDragPayload;
}

function toCamelCase(value: string) {
  const normalized = normalizeVariableName(value);
  if (!normalized) {
    return "variable";
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join("");
}
