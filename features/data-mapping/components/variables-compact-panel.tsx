"use client";

import Link from "next/link";
import { Database, ExternalLink, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import {
  applyVariableDragPayload,
  buildVariableDragOperationLog,
  buildVariableDragEnvelope,
  createVariableDragContext,
  resolveVariableDisplayKind,
  resolveVariableDisplayLabel,
  resolveVariableTooltip,
  requestRichTextVariableInsert,
  scheduleVariableDragTraceClear,
  type EditorItemDragContext,
} from "@/features/data-mapping/lib/variable-display";
import { useEditorStore } from "@/features/editor/stores/editor-store";

type VariablesCompactPanelProps = {
  onDragContext?: (context: EditorItemDragContext) => void;
  onDragEnd?: () => void;
};

export function VariablesCompactPanel({ onDragContext, onDragEnd }: VariablesCompactPanelProps) {
  const activePageId = useEditorStore((state) => state.activePageId);
  const appendOperationLogs = useEditorStore((state) => state.appendOperationLogs);
  const source = useVariablesStore((state) => state.source);
  const variables = useVariablesStore((state) => state.variables);
  const selectedVariableId = useVariablesStore((state) => state.selectedVariableId);
  const selectVariable = useVariablesStore((state) => state.selectVariable);
  const clearSource = useVariablesStore((state) => state.clearSource);

  return (
    <section className="ef-data-variables-panel" aria-label="Variables du mapping">
      <div className="ef-data-variables-head">
        <div className="ef-card-title-row">
          <Database size={14} aria-hidden="true" />
          <div>
            <p className="ef-data-variables-kicker">Mapping source de données</p>
            <h3 className="ef-data-variables-title">{source ? source.fileName : "Variables CSV"}</h3>
          </div>
        </div>

        <div className="ef-data-variables-actions">
          <Button asChild variant="outline" size="sm" className="ef-data-variables-open-link">
            <Link href="/editor/mapping">
              <ExternalLink size={13} aria-hidden="true" />
              Module
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ef-data-variables-reset"
            onClick={() => clearSource()}
            disabled={!source && variables.length === 0}
            title="Réinitialiser"
            aria-label="Réinitialiser"
          >
            <RefreshCw size={13} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {variables.length > 0 ? (
        <div className="ef-data-variables-list" role="list" aria-label="Liste des variables">
          {variables.map((variable) => {
            const active = variable.id === selectedVariableId;
            const kind = resolveVariableDisplayKind(variable);
            const displayLabel = resolveVariableDisplayLabel(variable);
            const tooltip = resolveVariableTooltip(variable);
            const dragContext = createVariableDragContext(variable);

            return (
              <button
                key={variable.id}
                type="button"
                draggable={true}
                aria-pressed={active}
                aria-label={tooltip}
                className={["ef-data-variable-card", active ? "is-active" : ""].join(" ")}
                onClick={() => selectVariable(variable.id)}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  requestRichTextVariableInsert(buildVariableDragEnvelope(variable).payload);
                }}
                onDragStart={(event) => {
                  onDragContext?.(dragContext);
                  applyVariableDragPayload(event, dragContext);
                  appendOperationLogs([
                    buildVariableDragOperationLog(dragContext, {
                      action: "dragstart",
                      pageId: activePageId,
                      target: "Variables",
                      outcome: "démarré",
                    }),
                  ]);
                }}
                onDragEnd={() => {
                  appendOperationLogs([
                    buildVariableDragOperationLog(dragContext, {
                      action: "dragend",
                      pageId: activePageId,
                      target: "Variables",
                      outcome: "terminé",
                    }),
                  ]);
                  if (onDragEnd) {
                    scheduleVariableDragTraceClear(onDragEnd);
                  }
                }}
                title={tooltip}
              >
                <span className="ef-data-variable-card-inner">
                  <span className="ef-data-variable-label">{displayLabel}</span>
                  <span className={["ef-data-variable-badge", `is-${kind.toLowerCase()}`].join(" ")}>{kind}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="ef-data-variables-empty">
          <strong>Aucune variable chargée</strong>
          <p>Importez un fichier CSV depuis le module Variables pour alimenter cette liste.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/editor/mapping">Ouvrir Variables</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
