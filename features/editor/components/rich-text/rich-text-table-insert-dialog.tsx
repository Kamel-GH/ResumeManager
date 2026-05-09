"use client";

import { Table2, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface RichTextTableInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (rows: number, columns: number, withHeaderRow: boolean) => void;
}

export function RichTextTableInsertDialog({
  open,
  onClose,
  onInsert,
}: RichTextTableInsertDialogProps) {
  const [rows, setRows] = useState("3");
  const [columns, setColumns] = useState("3");
  const [withHeaderRow, setWithHeaderRow] = useState(true);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const parsedRows = clampTableSize(rows, 1, 50);
  const parsedColumns = clampTableSize(columns, 1, 20);
  const canInsert = parsedRows !== null && parsedColumns !== null;

  return (
    <div className="ef-rtp-table-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="ef-rtp-table-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ef-rtp-table-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ef-rtp-table-dialog-header">
          <div>
            <span>Insertion</span>
            <strong id="ef-rtp-table-dialog-title">Nouveau tableau</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X size={15} aria-hidden />
          </button>
        </header>

        <div className="ef-rtp-table-dialog-preview" aria-hidden>
          <Table2 size={22} />
          <span>
            {canInsert
              ? `${parsedColumns} colonnes × ${parsedRows} lignes`
              : "Dimensions invalides"}
          </span>
        </div>

        <div className="ef-rtp-table-dialog-fields">
          <label>
            <span>Nombre de lignes</span>
            <input
              type="text"
              inputMode="numeric"
              value={rows}
              autoFocus
              onChange={(event) => setRows(sanitizeIntegerText(event.target.value))}
            />
          </label>
          <label>
            <span>Nombre de colonnes</span>
            <input
              type="text"
              inputMode="numeric"
              value={columns}
              onChange={(event) => setColumns(sanitizeIntegerText(event.target.value))}
            />
          </label>
        </div>

        <label className="ef-rtp-table-dialog-check">
          <input
            type="checkbox"
            checked={withHeaderRow}
            onChange={(event) => setWithHeaderRow(event.target.checked)}
          />
          <span>Créer une ligne d'en-tête</span>
        </label>

        <footer className="ef-rtp-table-dialog-footer">
          <button type="button" className="ef-rtp-table-dialog-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="ef-rtp-table-dialog-primary"
            disabled={!canInsert}
            onClick={() => {
              if (!canInsert) return;
              onInsert(parsedRows, parsedColumns, withHeaderRow);
              onClose();
            }}
          >
            Créer le tableau
          </button>
        </footer>
      </section>
    </div>
  );
}

function sanitizeIntegerText(value: string): string {
  return value.replace(/[^\d]/g, "").slice(0, 2);
}

function clampTableSize(value: string, min: number, max: number): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}
