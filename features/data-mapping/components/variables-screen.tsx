"use client";

/* eslint-disable react-hooks/incompatible-library */

import { useMemo, useRef, type ChangeEvent, type DragEvent, type MouseEvent } from "react";
import { ChevronLeft, Database, FileSpreadsheet, Plus, RefreshCw, Upload, Trash2 } from "lucide-react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, type Row, type Table } from "@tanstack/react-table";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { parseCsvText, formatCsvCellPreview } from "@/features/data-mapping/lib/csv";
import {
  applyVariableDragPayload,
  buildVariableDragOperationLog,
  buildVariableDragEnvelope,
  createVariableDragContext,
  requestRichTextVariableInsert,
  scheduleVariableDragTraceClear,
} from "@/features/data-mapping/lib/variable-display";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import type { MappingVariable } from "@/features/data-mapping/types";
import { useEditorStore } from "@/features/editor/stores/editor-store";

const variableColumnHelper = createColumnHelper<MappingVariable>();

export function VariablesScreen() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const source = useVariablesStore((state) => state.source);
  const variables = useVariablesStore((state) => state.variables);
  const selectedVariableId = useVariablesStore((state) => state.selectedVariableId);
  const importCsvSource = useVariablesStore((state) => state.importCsvSource);
  const clearSource = useVariablesStore((state) => state.clearSource);
  const selectVariable = useVariablesStore((state) => state.selectVariable);
  const addVariable = useVariablesStore((state) => state.addVariable);
  const removeVariable = useVariablesStore((state) => state.removeVariable);
  const updateVariable = useVariablesStore((state) => state.updateVariable);
  const setDragTraceContext = useEditorStore((state) => state.setDragTraceContext);
  const clearDragTraceContext = useEditorStore((state) => state.clearDragTraceContext);
  const activePageId = useEditorStore((state) => state.activePageId);
  const appendOperationLogs = useEditorStore((state) => state.appendOperationLogs);

  const sourceStats = useMemo(
    () => [
      { label: "Source", value: source?.fileName ?? "CSV non chargé" },
      { label: "Colonnes", value: source ? String(source.columnCount) : "0" },
      { label: "Lignes", value: source ? String(source.rowCount) : "0" },
      { label: "Variables", value: String(variables.length) },
    ],
    [source, variables.length],
  );

  const previewRows = useMemo(() => source?.rows.slice(0, 10) ?? [], [source]);
  const previewColumns = useMemo(() => source?.columns ?? [], [source]);

  const variableColumns = useMemo(
    () => [
      variableColumnHelper.accessor("enabled", {
        header: "Actif",
        cell: ({ row }) => (
          <button
            className={["ef-variable-toggle", row.original.enabled ? "is-active" : ""].join(" ")}
            type="button"
            aria-label={row.original.enabled ? "Désactiver la variable" : "Activer la variable"}
            title={row.original.enabled ? "Désactiver" : "Activer"}
            onClick={() => updateVariable(row.original.id, { enabled: !row.original.enabled })}
          >
            {row.original.enabled ? "On" : "Off"}
          </button>
        ),
      }),
      variableColumnHelper.accessor("key", {
        header: "Variable",
        cell: ({ row, getValue }) => (
          <input
            className="ef-inline-input"
            value={getValue()}
            aria-label={`Variable ${row.original.label}`}
            onChange={(event) => updateVariable(row.original.id, { key: event.target.value })}
          />
        ),
      }),
      variableColumnHelper.accessor("label", {
        header: "Libellé",
        cell: ({ row, getValue }) => (
          <input
            className="ef-inline-input"
            value={getValue()}
            aria-label={`Libellé ${row.original.label}`}
            onChange={(event) => updateVariable(row.original.id, { label: event.target.value })}
          />
        ),
      }),
      variableColumnHelper.accessor("sourceColumn", {
        header: "Colonne CSV",
        cell: ({ row, getValue }) => (
          <select
            className="ef-inline-select"
            value={getValue() ?? ""}
            aria-label={`Colonne CSV ${row.original.label}`}
            onChange={(event) => updateVariable(row.original.id, { sourceColumn: event.target.value || null })}
          >
            <option value="">Aucune</option>
            {source?.columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            )) ?? null}
          </select>
        ),
      }),
      variableColumnHelper.accessor("type", {
        header: "Type",
        cell: ({ row, getValue }) => (
          <select
            className="ef-inline-select"
            value={getValue()}
            aria-label={`Type ${row.original.label}`}
            onChange={(event) => updateVariable(row.original.id, { type: event.target.value as MappingVariable["type"] })}
          >
            <option value="text">Texte</option>
            <option value="number">Nombre</option>
            <option value="boolean">Booléen</option>
            <option value="date">Date</option>
          </select>
        ),
      }),
      variableColumnHelper.accessor("sampleValue", {
        header: "Exemple",
        cell: ({ getValue }) => <span className="ef-variable-sample">{getValue() || "—"}</span>,
      }),
      variableColumnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ef-variable-icon-button"
            aria-label={`Supprimer ${row.original.label}`}
            title="Supprimer"
            onClick={() => removeVariable(row.original.id)}
          >
            <Trash2 size={12} aria-hidden="true" />
          </Button>
        ),
      }),
    ],
    [removeVariable, source?.columns, updateVariable],
  );

  const variableTable = useReactTable({
    data: variables,
    columns: variableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const previewTable = useReactTable({
    data: previewRows,
    columns: previewColumns.map((column) => ({
      id: column,
      accessorKey: column,
      header: column,
      cell: (info: { getValue: () => unknown }) => <span>{formatCsvCellPreview(String(info.getValue() ?? ""))}</span>,
    })),
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCsvPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = parseCsvText(text);
    importCsvSource({
      fileName: file.name,
      parsed,
    });
  };

  return (
    <section className="editor-fidelity ef-mapping-screen ef-variables-screen">
      <header className="ef-mapping-screen-header">
        <div>
          <p className="ef-mapping-screen-kicker">Mapping source de données</p>
          <h1 className="ef-mapping-screen-title">Variables CSV</h1>
        </div>
        <Link className="ef-mapping-back-link" href="/editor">
          <ChevronLeft size={14} aria-hidden="true" />
          Retour à l’éditeur
        </Link>
      </header>

      <div className="ef-variables-toolbar">
        <div className="ef-variables-toolbar-actions">
          <Button type="button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} aria-hidden="true" />
            Importer CSV
          </Button>
          <Button type="button" variant="outline" onClick={() => addVariable()}>
            <Plus size={14} aria-hidden="true" />
            Ajouter variable
          </Button>
          <Button type="button" variant="ghost" onClick={() => clearSource()} disabled={!source && variables.length === 0}>
            <RefreshCw size={14} aria-hidden="true" />
            Réinitialiser
          </Button>
        </div>

        <div className="ef-variables-summary" aria-label="Résumé de la source CSV">
          {sourceStats.map((item) => (
            <div key={item.label} className="ef-variables-summary-item">
              <span className="ef-variables-summary-label">{item.label}</span>
              <strong className="ef-variables-summary-value">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={handleCsvPick} />

      <div className="ef-variables-grid">
        <article className="ef-card ef-variables-card">
          <div className="ef-variables-card-head">
            <div className="ef-card-title-row">
              <Database size={15} aria-hidden="true" />
              <h2 className="ef-variables-card-title">Source CSV</h2>
            </div>
            {source ? <span className="ef-badge">{source.delimiter === ";" ? "Point-virgule" : source.delimiter === "\t" ? "Tabulation" : "CSV"}</span> : null}
          </div>
          <div className="ef-variables-card-body">
            {source ? (
              <>
                <div className="ef-file-dropzone">
                  <div>
                    <strong>{source.fileName}</strong>
                    <p className="ef-variables-muted">
                      {source.columnCount} colonnes · {source.rowCount} lignes
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Remplacer
                  </Button>
                </div>

                <div className="ef-variables-column-list" aria-label="Colonnes détectées">
                  {source.columns.map((column) => (
                    <span key={column} className="ef-source-chip" title={column}>
                      {column}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="ef-no-result" style={{ minHeight: 174, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
                <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>Aucun fichier CSV chargé</strong>
                <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Importez un CSV pour générer automatiquement les variables.</span>
              </div>
            )}
          </div>
        </article>

        <article className="ef-card ef-variables-card">
          <div className="ef-variables-card-head">
            <div className="ef-card-title-row">
              <FileSpreadsheet size={15} aria-hidden="true" />
              <h2 className="ef-variables-card-title">Variables</h2>
            </div>
            <span className="ef-badge">{variables.length}</span>
          </div>

          {variables.length > 0 ? (
            <div className="ef-variables-table-scroll">
              <TableGrid
                table={variableTable}
                columnsTemplate="72px minmax(120px, 1.05fr) minmax(130px, 1.05fr) minmax(150px, 1fr) 110px minmax(120px, 0.8fr) 36px"
                rowClassName={(row) => (row.original.id === selectedVariableId ? "is-selected" : "")}
                onRowClick={(row) => selectVariable(row.original.id)}
                onRowDoubleClick={(row, event) => {
                  if ((event.target as HTMLElement | null)?.closest("input, select, textarea, button")) {
                    return;
                  }

                  requestRichTextVariableInsert(buildVariableDragEnvelope(row.original).payload);
                }}
                rowDragContext={(row) => createVariableDragContext(row.original)}
                onRowDragStart={(context) => {
                  setDragTraceContext(context);
                  appendOperationLogs([
                    buildVariableDragOperationLog(context, {
                      action: "dragstart",
                      pageId: activePageId,
                      target: "Variables",
                      outcome: "démarré",
                    }),
                  ]);
                }}
                onRowDragEnd={(context) => {
                  appendOperationLogs([
                    buildVariableDragOperationLog(context, {
                      action: "dragend",
                      pageId: activePageId,
                      target: "Variables",
                      outcome: "terminé",
                    }),
                  ]);
                  scheduleVariableDragTraceClear(clearDragTraceContext);
                }}
              />
            </div>
          ) : (
            <div className="ef-no-result" style={{ minHeight: 220, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
              <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>Variables vides</strong>
              <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Importez un CSV ou créez une variable personnalisée.</span>
            </div>
          )}
        </article>

        <article className="ef-card ef-variables-card ef-variables-card--full">
          <div className="ef-variables-card-head">
            <div className="ef-card-title-row">
              <Database size={15} aria-hidden="true" />
              <h2 className="ef-variables-card-title">Aperçu des données CSV</h2>
            </div>
            <span className="ef-badge">{source ? `${source.rowCount} lignes` : "Vide"}</span>
          </div>

          {previewRows.length > 0 ? (
            <div className="ef-variables-table-scroll">
              <TableGrid
                table={previewTable}
                columnsTemplate={previewColumns.map(() => "minmax(140px, 1fr)").join(" ")}
                dense
              />
            </div>
          ) : (
            <div className="ef-no-result" style={{ minHeight: 160, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
              <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>Aucun aperçu</strong>
              <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>La table d’aperçu apparaît après import du fichier.</span>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function TableGrid<T>({
  table,
  columnsTemplate,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  rowDragContext,
  onRowDragStart,
  onRowDragEnd,
  dense = false,
}: {
  table: Table<T>;
  columnsTemplate: string;
  rowClassName?: (row: Row<T>) => string;
  onRowClick?: (row: Row<T>) => void;
  onRowDoubleClick?: (row: Row<T>, event: MouseEvent<HTMLDivElement>) => void;
  rowDragContext?: (row: Row<T>) => { sessionId: string; type: string; sourcePanel?: string; payload: unknown } | null;
  onRowDragStart?: (context: { sessionId: string; type: string; sourcePanel?: string; payload: unknown }) => void;
  onRowDragEnd?: (context: { sessionId: string; type: string; sourcePanel?: string; payload: unknown }) => void;
  dense?: boolean;
}) {
  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const activeDragContextRef = useRef<{
    sessionId: string;
    type: string;
    sourcePanel?: string;
    payload: unknown;
  } | null>(null);

  return (
    <div className="ef-variables-table" role="table" aria-label="Table">
      <div className="ef-table-head ef-variables-grid-head" style={{ gridTemplateColumns: columnsTemplate, ...(dense ? { position: "sticky", top: 0, zIndex: 2 } : null) }}>
        {headerGroups[0]?.headers.map((header) => (
          <div key={header.id} className="ef-table-head-cell">
            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
          </div>
        ))}
      </div>
      <div className="ef-variables-table-body">
        {rows.map((row) => {
          const rowProps = {
            className: ["ef-table-row ef-variables-grid-row", rowClassName?.(row) ?? ""].join(" ").trim(),
            style: { gridTemplateColumns: columnsTemplate },
            role: "row",
            onClick: onRowClick ? () => onRowClick(row) : undefined,
            onDoubleClick: onRowDoubleClick ? (event: MouseEvent<HTMLDivElement>) => onRowDoubleClick(row, event) : undefined,
            draggable: rowDragContext ? true : undefined,
            onDragStart: rowDragContext
              ? (event: DragEvent<HTMLDivElement>) => {
                  const context = rowDragContext(row);
                  if (!context) {
                    return;
                  }

                  activeDragContextRef.current = context;
                  onRowDragStart?.(context);
                  applyVariableDragPayload(event, context);
                }
              : undefined,
            onDragEnd: rowDragContext
              ? () => {
                  const context = activeDragContextRef.current ?? rowDragContext(row);
                  if (!context) {
                    return;
                  }
                  activeDragContextRef.current = null;
                  onRowDragEnd?.(context);
                }
              : undefined,
          } as const;

          return (
            <div key={row.id} {...rowProps}>
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} className="ef-table-row-cell">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
