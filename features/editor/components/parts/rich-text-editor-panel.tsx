"use client";

import type { JSONContent } from "@tiptap/core";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { NodeSelection } from "@tiptap/pm/state";
import { CellSelection, findCell, isInTable, selectionCell, TableMap } from "@tiptap/pm/tables";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  ChevronDown,
  Code2,
  Eraser,
  Eye,
  Grid2x2,
  Italic,
  List,
  ListOrdered,
  Plus,
  Search,
  Settings2,
  Strikethrough,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  Tag,
  Trash2,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";
import type { DragEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ColorPickerControl } from "@/components/ui/color-picker-control";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  buildVariableDragOperationLog,
  parseEditorItemDragPayload,
  RICH_TEXT_VARIABLE_INSERT_EVENT,
  type VariableDragEnvelope,
} from "@/features/data-mapping/lib/variable-display";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import {
  createRichTextVariableNodeViewExtension,
  RichTextVariableDatasetContext,
  RichTextVariableDisplayModeContext,
  RichTextVariableRegistryContext,
} from "@/features/editor/components/parts/rich-text-variable-node-view";
import { RichTextTableInsertDialog } from "@/features/editor/components/rich-text/rich-text-table-insert-dialog";
import {
  RichTextTableInspector,
  type RichTextTableInspectorTab,
} from "@/features/editor/components/rich-text/rich-text-table-inspector";
import type {
  RichTextTableBorderPreset,
  RtpTableCellStyleAttrs,
  RtpTableRowStyleAttrs,
  RtpTableStyleAttrs,
} from "@/features/editor/components/rich-text/rich-text-table-model";
import { RichTextTextInspector } from "@/features/editor/components/rich-text/rich-text-text-inspector";
import { RichTextVariableInspector } from "@/features/editor/components/rich-text/rich-text-variable-inspector";
import { HorizontalRuler } from "@/features/editor/components/rich-text/ruler";
import { ParagraphStyle } from "@/features/editor/extensions/rich-text/paragraph-style";
import { TabNode } from "@/features/editor/extensions/rich-text/tab-node";
import {
  convertMeasurementValue,
  formatMeasurementValue,
  type MeasurementUnit,
} from "@/features/editor/lib/measurement";
import {
  createRichTextVariableRegistry,
  parseRichTextHtmlToJson,
  type RichTextVariableDisplayMode,
  type RichTextVariableNodeAttrs,
  type RichTextVariableRegistry,
  serializeRichTextJsonToHtml,
} from "@/features/editor/lib/rich-text-variable";
import { insertVariableTokenIntoRichTextEditor } from "@/features/editor/renderers/konva-renderer/rich-text-drop-utils";
import { resolveCanvasObjectStylePreview } from "@/features/editor/schema/canvas-mutation";
import { useEditorStore } from "@/features/editor/stores/editor-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type RtpTab = "content" | "properties";
type TableSelectionMode = "table" | "row" | "column";
type RichTextTableHoverTarget =
  | { mode: "table" }
  | { mode: "row"; index: number }
  | { mode: "column"; index: number }
  | { mode: "column-resize"; index: number }
  | { mode: "row-resize"; index: number }
  | null;
type RichTextTableSelectedTarget =
  | { mode: TableSelectionMode; index?: number }
  | { mode: "cell-range"; startRow: number; startColumn: number; endRow: number; endColumn: number }
  | null;
type RichTextTableCellDragRef = {
  tableIndex: number;
  tableElement: HTMLTableElement;
  startRow: number;
  startColumn: number;
  startClientX: number;
  startClientY: number;
  active: boolean;
} | null;

type RichTextTableOverlay = {
  tableIndex: number;
  table: { left: number; top: number; width: number; height: number };
  columns: Array<{ left: number; width: number; index: number }>;
  rows: Array<{ top: number; height: number; index: number }>;
};

type RichTextTableResizeGuide =
  | { kind: "column"; x: number; top: number; height: number }
  | { kind: "row"; y: number; left: number; width: number };

export type RichTextEditorPanelProps = {
  blockId: string;
  initialHtml?: string;
  initialJson?: JSONContent | null;
  initialDisplayMode?: RichTextVariableDisplayMode;
  onClose: () => void;
};

const DASH_PRESETS: Record<string, number[]> = {
  solid: [],
  dotted: [2, 4],
  dashed: [8, 4],
  "dash-dot": [8, 3, 2, 3],
};

function mergeStyleRules(rules: Array<string | null | undefined>) {
  return rules.filter(Boolean).join(";");
}

function dashToBorderType(dash: number[] | undefined): string {
  if (!dash || dash.length === 0) return "solid";
  if (dash.length === 2 && dash[0] <= 3) return "dotted";
  if (dash.length === 2) return "dashed";
  return "dash-dot";
}

// ─── Custom TipTap table extensions ──────────────────────────────────────────

const RtpTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el) => el.style.backgroundColor || null,
        renderHTML: (attrs) => {
          const style = mergeStyleRules([
            attrs.backgroundColor ? `background-color:${attrs.backgroundColor}` : null,
            attrs.textAlign ? `text-align:${attrs.textAlign}` : null,
            attrs.verticalAlign ? `vertical-align:${attrs.verticalAlign}` : null,
            attrs.cellPadding ? `padding:${attrs.cellPadding}` : null,
          ]);
          return style ? { style } : {};
        },
      },
      verticalAlign: {
        default: null,
        parseHTML: (el) => el.style.verticalAlign || null,
        renderHTML: () => ({}),
      },
      textAlign: {
        default: null,
        parseHTML: (el) => el.style.textAlign || null,
        renderHTML: () => ({}),
      },
      cellPadding: {
        default: null,
        parseHTML: (el) => el.style.padding || null,
        renderHTML: () => ({}),
      },
    };
  },
});

const RtpTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (el) => el.style.backgroundColor || null,
        renderHTML: (attrs) => {
          const style = mergeStyleRules([
            attrs.backgroundColor ? `background-color:${attrs.backgroundColor}` : null,
            attrs.textAlign ? `text-align:${attrs.textAlign}` : null,
            attrs.verticalAlign ? `vertical-align:${attrs.verticalAlign}` : null,
            attrs.cellPadding ? `padding:${attrs.cellPadding}` : null,
          ]);
          return style ? { style } : {};
        },
      },
      verticalAlign: {
        default: null,
        parseHTML: (el) => el.style.verticalAlign || null,
        renderHTML: () => ({}),
      },
      textAlign: {
        default: null,
        parseHTML: (el) => el.style.textAlign || null,
        renderHTML: () => ({}),
      },
      cellPadding: {
        default: null,
        parseHTML: (el) => el.style.padding || null,
        renderHTML: () => ({}),
      },
    };
  },
});

const RtpTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowHeight: {
        default: null,
        parseHTML: (el) => el.style.height || null,
        renderHTML: (attrs) => (attrs.rowHeight ? { style: `height:${attrs.rowHeight}` } : {}),
      },
    };
  },
});

const RtpTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      tableWidth: {
        default: null,
        parseHTML: (el) => el.style.width || null,
        renderHTML: (attrs) => {
          const style = mergeStyleRules([
            attrs.tableWidth ? `width:${attrs.tableWidth}` : null,
            attrs.borderColor ? `--rtp-bc:${attrs.borderColor}` : null,
            attrs.borderWidth ? `--rtp-bw:${attrs.borderWidth}` : null,
            attrs.headerBackgroundColor ? `--rtp-header-bg:${attrs.headerBackgroundColor}` : null,
            attrs.headerTextColor ? `--rtp-header-color:${attrs.headerTextColor}` : null,
            attrs.firstColumnBackgroundColor
              ? `--rtp-first-col-bg:${attrs.firstColumnBackgroundColor}`
              : null,
            attrs.firstColumnTextColor
              ? `--rtp-first-col-color:${attrs.firstColumnTextColor}`
              : null,
            attrs.stripedEvenColor ? `--rtp-striped-even:${attrs.stripedEvenColor}` : null,
            attrs.stripedOddColor ? `--rtp-striped-odd:${attrs.stripedOddColor}` : null,
          ]);
          return style ? { style } : {};
        },
      },
      bordered: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-bordered") === "true",
        renderHTML: (attrs) => (attrs.bordered ? { "data-bordered": "true" } : {}),
      },
      borderPreset: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-border-preset") || null,
        renderHTML: (attrs) =>
          attrs.borderPreset ? { "data-border-preset": attrs.borderPreset } : {},
      },
      striped: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-striped") === "true",
        renderHTML: (attrs) => (attrs.striped ? { "data-striped": "true" } : {}),
      },
      firstColumn: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-first-column") === "true",
        renderHTML: (attrs) => (attrs.firstColumn ? { "data-first-column": "true" } : {}),
      },
      borderColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-bc") || null,
        renderHTML: () => ({}),
      },
      borderWidth: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-bw") || null,
        renderHTML: () => ({}),
      },
      headerBackgroundColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-header-bg") || null,
        renderHTML: () => ({}),
      },
      headerTextColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-header-color") || null,
        renderHTML: () => ({}),
      },
      firstColumnBackgroundColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-first-col-bg") || null,
        renderHTML: () => ({}),
      },
      firstColumnTextColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-first-col-color") || null,
        renderHTML: () => ({}),
      },
      stripedEvenColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-striped-even") || null,
        renderHTML: () => ({}),
      },
      stripedOddColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue("--rtp-striped-odd") || null,
        renderHTML: () => ({}),
      },
    };
  },
});

const LIVE_SYNC_MS = 300;

// ─── Main component ────────────────────────────────────────────────────────────

export function RichTextEditorPanel({
  blockId,
  initialHtml,
  initialJson,
  initialDisplayMode,
  onClose,
}: RichTextEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<RtpTab>("content");
  const [displayMode, setDisplayMode] = useState<RichTextVariableDisplayMode>(
    initialDisplayMode ?? "label",
  );
  const [varSearch, setVarSearch] = useState("");

  // ── Floating window (drag + resize) ────────────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => {
    const W = Math.round(Math.min(window.innerWidth - 48, 1180));
    const H = Math.round(Math.min(window.innerHeight - 48, 760));
    return {
      x: Math.max(16, Math.round((window.innerWidth - W) / 2)),
      y: Math.max(0, Math.round((window.innerHeight - H) / 2)),
    };
  });
  const [size, setSize] = useState(() => {
    const W = Math.round(Math.min(window.innerWidth - 48, 1180));
    const H = Math.round(Math.min(window.innerHeight - 48, 760));
    return { w: W, h: H };
  });
  const posRef = useRef(pos);
  const sizeRef = useRef(size);
  useLayoutEffect(() => {
    posRef.current = pos;
    sizeRef.current = size;
  }, [pos, size]);

  const dragRef = useRef<{ sx: number; sy: number; ix: number; iy: number } | null>(null);
  const resizeRef = useRef<{
    dir: string;
    sx: number;
    sy: number;
    ix: number;
    iy: number;
    iw: number;
    ih: number;
  } | null>(null);

  // Stable global handlers — read values from refs only
  useEffect(() => {
    const MIN_W = 320,
      MIN_H = 280;

    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      const rsz = resizeRef.current;

      if (drag) {
        setPos({
          x: Math.max(
            0,
            Math.min(window.innerWidth - sizeRef.current.w, drag.ix + e.clientX - drag.sx),
          ),
          y: Math.max(0, Math.min(window.innerHeight - 64, drag.iy + e.clientY - drag.sy)),
        });
        return;
      }

      if (rsz) {
        const dx = e.clientX - rsz.sx;
        const dy = e.clientY - rsz.sy;
        let nx = rsz.ix,
          ny = rsz.iy,
          nw = rsz.iw,
          nh = rsz.ih;

        if (rsz.dir.includes("e")) nw = Math.max(MIN_W, rsz.iw + dx);
        if (rsz.dir.includes("s")) nh = Math.max(MIN_H, rsz.ih + dy);
        if (rsz.dir.includes("w")) {
          nw = Math.max(MIN_W, rsz.iw - dx);
          nx = rsz.ix + rsz.iw - nw;
        }
        if (rsz.dir.includes("n")) {
          nh = Math.max(MIN_H, rsz.ih - dy);
          ny = rsz.iy + rsz.ih - nh;
        }

        nx = Math.max(0, nx);
        ny = Math.max(0, ny);
        nw = Math.min(nw, window.innerWidth - nx);
        nh = Math.min(nh, window.innerHeight - ny);

        setPos({ x: nx, y: ny });
        setSize({ w: nw, h: nh });
      }
    };

    const onUp = () => {
      if (dragRef.current || resizeRef.current) {
        dragRef.current = null;
        resizeRef.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []); // stable — only reads refs

  function startDrag(e: ReactMouseEvent<HTMLElement>) {
    if ((e.target as Element).closest(".ef-rtp-header-controls")) return;
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ix: posRef.current.x, iy: posRef.current.y };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }

  function startResize(e: ReactMouseEvent<HTMLElement>, dir: string) {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      dir,
      sx: e.clientX,
      sy: e.clientY,
      ix: posRef.current.x,
      iy: posRef.current.y,
      iw: sizeRef.current.w,
      ih: sizeRef.current.h,
    };
    // eslint-disable-next-line react-hooks/immutability -- temporary global style override during resize interaction
    document.body.style.userSelect = "none";
    const cursorMap: Record<string, string> = {
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      ne: "ne-resize",
      nw: "nw-resize",
      se: "se-resize",
      sw: "sw-resize",
    };
    // eslint-disable-next-line react-hooks/immutability
    document.body.style.cursor = cursorMap[dir] ?? "se-resize";
  }

  // Store
  const workingTemplate = useEditorStore((s) => s.workingTemplate);
  const activePageId = useEditorStore((s) => s.activePageId);
  const dragTraceContext = useEditorStore((s) => s.dragTraceContext);
  const appendOperationLogs = useEditorStore((s) => s.appendOperationLogs);
  const updateRichTextElementContent = useEditorStore((s) => s.updateRichTextElementContent);
  const updateRichTextContainerProps = useEditorStore((s) => s.updateRichTextContainerProps);
  const commitCanvasObjectStyle = useEditorStore((s) => s.commitCanvasObjectStyle);
  const measurementUnit = useEditorStore((s) => s.workspaceSettings.measurementUnit);
  const workspaceSettings = useEditorStore((s) => s.workspaceSettings);
  const setWorkspaceSettings = useEditorStore((s) => s.setWorkspaceSettings);

  // Live element
  const element = useMemo(
    () => workingTemplate.elements.find((el) => el.id === blockId) ?? null,
    [workingTemplate, blockId],
  );

  // Variables
  const variables = useVariablesStore((s) => s.variables);
  const source = useVariablesStore((s) => s.source);
  const variableRegistry = useMemo<RichTextVariableRegistry>(
    () => createRichTextVariableRegistry(variables),
    [variables],
  );
  const variableDataset = source?.rows[0] ?? null;

  // Refs
  const liveSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorSurfaceRef = useRef<HTMLDivElement | null>(null);
  const dragTraceSessionRef = useRef<string | null>(null);
  const handledVarDropSessionRef = useRef<string | null>(null);
  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const tableCellDragRef = useRef<RichTextTableCellDragRef>(null);
  const [selectedVarAttrs, setSelectedVarAttrs] = useState<RichTextVariableNodeAttrs | null>(null);
  const [inTableCtx, setInTableCtx] = useState(false);
  const [tableAttrs, setTableAttrs] = useState<RtpTableStyleAttrs | null>(null);
  const [tableCellAttrs, setTableCellAttrs] = useState<RtpTableCellStyleAttrs | null>(null);
  const [tableRowAttrs, setTableRowAttrs] = useState<RtpTableRowStyleAttrs | null>(null);
  const [tableColumnWidth, setTableColumnWidth] = useState<number | null>(null);
  const [tablePanelTab, setTablePanelTab] = useState<RichTextTableInspectorTab>("selection");
  const [tablePanelOpen, setTablePanelOpen] = useState(false);
  const [tableOverlay, setTableOverlay] = useState<RichTextTableOverlay | null>(null);
  const [tableSelectedTarget, setTableSelectedTarget] = useState<RichTextTableSelectedTarget>(null);
  const [tableResizeGuide, setTableResizeGuide] = useState<RichTextTableResizeGuide | null>(null);
  const [tableInsertOpen, setTableInsertOpen] = useState(false);
  const [showRulerMarginZones, setShowRulerMarginZones] = useState(true);

  // Initial content — captured once at open
  const initialContent = useMemo<JSONContent>(() => {
    if (initialJson) return initialJson;
    return parseRichTextHtmlToJson(initialHtml ?? "<p></p>", variableRegistry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId]);

  // ── TipTap editor ──────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ParagraphStyle,
      TabNode,
      TextStyleKit.configure({
        backgroundColor: { types: ["textStyle"] },
        color: { types: ["textStyle"] },
        fontFamily: { types: ["textStyle"] },
        fontSize: { types: ["textStyle"] },
        lineHeight: { types: ["textStyle"] },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      RtpTable.configure({ resizable: true }),
      RtpTableRow,
      RtpTableHeader,
      RtpTableCell,
      createRichTextVariableNodeViewExtension().configure({ registry: variableRegistry }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "ef-rtp-editor-content",
        "aria-label": "Contenu du bloc Rich Text",
      },
      handleDOMEvents: {
        dragover: (_, event) => {
          const ctx = useEditorStore.getState().dragTraceContext;
          const types = Array.from(event.dataTransfer?.types ?? []);
          const canAccept =
            ctx?.type === "variable" || types.includes("application/x-resume-editor-item");
          if (!canAccept) return false;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
          if (ctx?.type === "variable" && dragTraceSessionRef.current !== ctx.sessionId) {
            dragTraceSessionRef.current = ctx.sessionId;
            appendOperationLogs([
              buildVariableDragOperationLog(ctx, {
                action: "dragover",
                pageId: activePageId,
                target: `Rich Text (${blockId})`,
                outcome: "survol",
              }),
            ]);
          }
          return true;
        },
      },
      handleDrop: (view, event) => {
        const ctx = useEditorStore.getState().dragTraceContext;
        if (ctx?.type === "variable" && handledVarDropSessionRef.current === ctx.sessionId)
          return false;
        const raw = event.dataTransfer?.getData("application/x-resume-editor-item") ?? "";
        const payload = parseVarDropPayload(raw, ctx);
        if (!payload) {
          dragTraceSessionRef.current = null;
          handledVarDropSessionRef.current = null;
          return false;
        }
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertVariableTokenIntoRichTextEditor(
          viewToInsertionTarget(view),
          payload.payload,
          typeof pos === "number"
            ? { from: pos, to: pos }
            : { from: view.state.selection.from, to: view.state.selection.to },
          variableRegistry,
        );
        dragTraceSessionRef.current = null;
        handledVarDropSessionRef.current = null;
        return true;
      },
    },
    immediatelyRender: false,
  });

  // Reset on blockId change
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialContent);
  }, [editor, initialContent, blockId]);

  // ── Variable selection ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const sel = editor.state.selection;
      setSelectedVarAttrs(
        sel instanceof NodeSelection && sel.node.type.name === "variable"
          ? (sel.node.attrs as unknown as RichTextVariableNodeAttrs)
          : null,
      );
      setInTableCtx(isInTable(editor.state));
      setTableAttrs(getTableAttrs(editor));
      setTableCellAttrs(getSelectedCellAttrs(editor));
      setTableRowAttrs(getSelectedRowAttrs(editor));
      setTableColumnWidth(getSelectedColumnWidth(editor));
    };
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);
    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);

  /* eslint-disable react-hooks/set-state-in-effect -- auto-open table panel when cursor enters a table */
  useEffect(() => {
    if (inTableCtx) {
      setTablePanelOpen(true);
    }
  }, [inTableCtx]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const syncTableOverlay = useCallback(
    (targetTable?: HTMLTableElement | null) => {
      if (!editor || !editorSurfaceRef.current) {
        setTableOverlay(null);
        return;
      }

      const table = targetTable ?? findActiveTableElement(editor.view.dom);
      setTableOverlay(table ? resolveRichTextTableOverlay(editorSurfaceRef.current, table) : null);
    },
    [editor],
  );

  const handleEditorMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target instanceof Element && event.target.closest("[data-rtp-table-overlay]")) {
        return;
      }
      const table = event.target instanceof Element ? event.target.closest("table") : null;
      if (table instanceof HTMLTableElement) {
        syncTableOverlay(table);
        return;
      }
    },
    [syncTableOverlay],
  );

  const handleEditorMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!editor || !editorSurfaceRef.current || event.button !== 0) return;
      if (
        event.target instanceof Element &&
        event.target.closest("button, input, select, textarea, [data-rtp-table-overlay]")
      ) {
        return;
      }

      const cell = event.target instanceof Element ? event.target.closest("td, th") : null;
      const row = cell?.closest("tr");
      const table = cell?.closest("table");
      if (
        !(cell instanceof HTMLTableCellElement) ||
        !(row instanceof HTMLTableRowElement) ||
        !(table instanceof HTMLTableElement)
      ) {
        return;
      }

      const editorDom = editorSurfaceRef.current.querySelector(".ef-rtp-editor-content");
      const tableIndex = editorDom
        ? Array.from(editorDom.querySelectorAll("table")).indexOf(table)
        : -1;
      if (tableIndex < 0) return;

      tableCellDragRef.current = {
        tableIndex,
        tableElement: table,
        startRow: row.rowIndex,
        startColumn: cell.cellIndex,
        startClientX: event.clientX,
        startClientY: event.clientY,
        active: false,
      };
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;

    const onMove = (event: MouseEvent) => {
      const drag = tableCellDragRef.current;
      if (!drag || event.buttons !== 1) return;

      const distance =
        Math.abs(event.clientX - drag.startClientX) + Math.abs(event.clientY - drag.startClientY);
      if (!drag.active && distance < 6) return;

      const target = document.elementFromPoint(event.clientX, event.clientY);
      const cell = target instanceof Element ? target.closest("td, th") : null;
      const row = cell?.closest("tr");
      const table = cell?.closest("table");
      if (
        !(cell instanceof HTMLTableCellElement) ||
        !(row instanceof HTMLTableRowElement) ||
        table !== drag.tableElement
      )
        return;

      event.preventDefault();
      drag.active = true;
      const nextTarget = {
        mode: "cell-range" as const,
        startRow: drag.startRow,
        startColumn: drag.startColumn,
        endRow: row.rowIndex,
        endColumn: cell.cellIndex,
      };
      selectTableCellRangeByIndex(editor.view, drag.tableIndex, nextTarget);
      setTableSelectedTarget(nextTarget);
      setTablePanelOpen(true);
      setTablePanelTab("selection");
    };

    const onUp = () => {
      tableCellDragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [editor]);

  useLayoutEffect(() => {
    syncTableOverlay();
  }, [syncTableOverlay, inTableCtx, tableAttrs, tableCellAttrs, tableRowAttrs, tableColumnWidth]);

  const startTableColumnResize = useCallback(
    (
      overlay: RichTextTableOverlay,
      columnIndex: number,
      event: ReactMouseEvent<HTMLButtonElement>,
    ) => {
      if (!editor) return;
      const column = overlay.columns[columnIndex];
      if (!column) return;

      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = column.width;

      const onMove = (moveEvent: MouseEvent) => {
        const nextWidth = clampNumber(startWidth + moveEvent.clientX - startX, 24, 1600);
        setTableResizeGuide({
          kind: "column",
          x: column.left + nextWidth,
          top: overlay.table.top,
          height: overlay.table.height,
        });
      };

      const onUp = (upEvent: MouseEvent) => {
        const nextWidth = clampNumber(startWidth + upEvent.clientX - startX, 24, 1600);
        const nextWidths = overlay.columns.map((item) => Math.round(item.width));
        nextWidths[columnIndex] = Math.round(nextWidth);
        setTableColumnWidthsByTableIndex(editor.view, overlay.tableIndex, nextWidths);
        setTableResizeGuide(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        requestAnimationFrame(() => syncTableOverlay());
      };

      setTableResizeGuide({
        kind: "column",
        x: column.left + startWidth,
        top: overlay.table.top,
        height: overlay.table.height,
      });
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editor, syncTableOverlay],
  );

  const startTableRowResize = useCallback(
    (
      overlay: RichTextTableOverlay,
      rowIndex: number,
      event: ReactMouseEvent<HTMLButtonElement>,
    ) => {
      if (!editor) return;
      const row = overlay.rows[rowIndex];
      if (!row) return;

      event.preventDefault();
      event.stopPropagation();

      const startY = event.clientY;
      const startHeight = row.height;

      const onMove = (moveEvent: MouseEvent) => {
        const nextHeight = clampNumber(startHeight + moveEvent.clientY - startY, 18, 800);
        setTableResizeGuide({
          kind: "row",
          y: row.top + nextHeight,
          left: overlay.table.left,
          width: overlay.table.width,
        });
      };

      const onUp = (upEvent: MouseEvent) => {
        const nextHeight = clampNumber(startHeight + upEvent.clientY - startY, 18, 800);
        setRowHeightByTableIndex(editor.view, overlay.tableIndex, rowIndex, nextHeight);
        setTableResizeGuide(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        requestAnimationFrame(() => syncTableOverlay());
      };

      setTableResizeGuide({
        kind: "row",
        y: row.top + startHeight,
        left: overlay.table.left,
        width: overlay.table.width,
      });
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editor, syncTableOverlay],
  );

  const applyVarStyle = useCallback(
    (patch: Partial<RichTextVariableNodeAttrs>) => {
      if (!editor) return;
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "variable") return;
      const { tr } = editor.state;
      tr.setNodeMarkup(sel.from, undefined, { ...sel.node.attrs, ...patch });
      editor.view.dispatch(tr);
      editor.view.focus();
    },
    [editor],
  );

  // ── Live sync ──────────────────────────────────────────────────────────────

  const doSync = useCallback(
    (mode: RichTextVariableDisplayMode, editorInstance: Editor) => {
      const json = editorInstance.getJSON();
      const html = serializeRichTextJsonToHtml(json, {
        displayMode: mode,
        registry: variableRegistry,
        dataset: variableDataset,
      });
      updateRichTextElementContent({ elementId: blockId, html, json, displayMode: mode });
    },
    [blockId, variableRegistry, variableDataset, updateRichTextElementContent],
  );

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
      liveSyncTimerRef.current = setTimeout(() => doSync(displayMode, editor), LIVE_SYNC_MS);
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
    };
  }, [editor, displayMode, doSync]);

  const handleDisplayMode = useCallback(
    (mode: RichTextVariableDisplayMode) => {
      setDisplayMode(mode);
      if (editor) doSync(mode, editor);
    },
    [editor, doSync],
  );

  // ── Text selection memory ──────────────────────────────────────────────────

  const rememberSelection = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    lastSelectionRef.current = { from, to };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", rememberSelection);
    editor.on("focus", rememberSelection);
    return () => {
      editor.off("selectionUpdate", rememberSelection);
      editor.off("focus", rememberSelection);
    };
  }, [editor, rememberSelection]);

  const runOnSelection = useCallback(
    (command: (e: Editor) => void) => {
      if (!editor) return;
      const saved = lastSelectionRef.current;
      if (saved && saved.to <= editor.state.doc.content.size) {
        editor.chain().focus().setTextSelection(saved).run();
      } else {
        editor.commands.focus();
      }
      command(editor);
      rememberSelection();
    },
    [editor, rememberSelection],
  );

  // ── Variable insert event ──────────────────────────────────────────────────

  useEffect(() => {
    if (!editor) return;
    const handler = (event: Event) => {
      const payload = (event as CustomEvent<VariableDragEnvelope["payload"]>).detail;
      if (!payload) return;
      insertVariableTokenIntoRichTextEditor(
        editor,
        payload,
        lastSelectionRef.current ?? editor.state.selection,
        variableRegistry,
      );
      rememberSelection();
    };
    window.addEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handler as EventListener);
  }, [editor, rememberSelection, variableRegistry]);

  useEffect(() => {
    if (!dragTraceContext) handledVarDropSessionRef.current = null;
  }, [dragTraceContext]);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Properties ────────────────────────────────────────────────────────────

  const stylePreview = useMemo(
    () => (element ? resolveCanvasObjectStylePreview(element) : null),
    [element],
  );

  const patchStyle = useCallback(
    (patch: Parameters<typeof commitCanvasObjectStyle>[0]["patches"][number]["style"]) => {
      commitCanvasObjectStyle({ patches: [{ id: blockId, style: patch }] });
    },
    [blockId, commitCanvasObjectStyle],
  );

  const patchContainerProp = useCallback(
    (props: Record<string, unknown>) => {
      updateRichTextContainerProps({ elementId: blockId, props });
    },
    [blockId, updateRichTextContainerProps],
  );

  const props = element?.props ?? {};
  const defaultPadding = typeof props.padding === "number" ? (props.padding as number) : 8;
  const paddingTop =
    typeof props.paddingTop === "number" ? (props.paddingTop as number) : defaultPadding;
  const paddingRight =
    typeof props.paddingRight === "number" ? (props.paddingRight as number) : defaultPadding;
  const paddingBottom =
    typeof props.paddingBottom === "number" ? (props.paddingBottom as number) : defaultPadding;
  const paddingLeft =
    typeof props.paddingLeft === "number" ? (props.paddingLeft as number) : defaultPadding;

  // ── Filtered variables ────────────────────────────────────────────────────

  const filteredVars = useMemo(() => {
    const q = varSearch.toLowerCase().trim();
    if (!q) return variableRegistry.entries;
    return variableRegistry.entries.filter(
      (v) => v.label.toLowerCase().includes(q) || v.key.toLowerCase().includes(q),
    );
  }, [variableRegistry.entries, varSearch]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <RichTextVariableDisplayModeContext.Provider value={displayMode}>
      <RichTextVariableRegistryContext.Provider value={variableRegistry}>
        <RichTextVariableDatasetContext.Provider value={variableDataset}>
          <div
            className="ef-rtp"
            ref={panelRef}
            style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
            data-rtp-block-id={blockId}
          >
            {/* ── Resize handles ── */}
            {(["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const).map((dir) => (
              <div
                key={dir}
                className={`ef-rtp-rh ef-rtp-rh-${dir}`}
                onMouseDown={(e) => startResize(e, dir)}
              />
            ))}

            {/* ── Header (drag handle) ── */}
            <header className="ef-rtp-header" onMouseDown={startDrag}>
              <div className="ef-rtp-header-info">
                <strong>Éditer le texte</strong>
                <span>{blockId}</span>
              </div>
              <div className="ef-rtp-header-controls">
                {(
                  [
                    {
                      value: "label",
                      icon: <Tag size={14} aria-hidden />,
                      title: "Nom des variables",
                    },
                    {
                      value: "value",
                      icon: <Eye size={14} aria-hidden />,
                      title: "Aperçu des valeurs",
                    },
                    {
                      value: "technical",
                      icon: <Code2 size={14} aria-hidden />,
                      title: "Clé technique {{…}}",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={["ef-rtp-mode-btn", displayMode === opt.value ? "is-active" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleDisplayMode(opt.value)}
                    title={opt.title}
                    aria-label={opt.title}
                    aria-pressed={displayMode === opt.value}
                  >
                    {opt.icon}
                  </button>
                ))}
                <span className="ef-rtp-header-sep" aria-hidden />
                <button
                  type="button"
                  className="ef-rtp-close-btn"
                  onClick={onClose}
                  aria-label="Fermer (Échap)"
                  title="Fermer (Échap)"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            </header>

            {/* ── Tabs ── */}
            <nav className="ef-rtp-tabs" aria-label="Onglets d'édition" role="tablist">
              <button
                type="button"
                role="tab"
                className={["ef-rtp-tab", activeTab === "content" ? "is-active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveTab("content")}
                aria-selected={activeTab === "content"}
              >
                Contenu
              </button>
              <button
                type="button"
                role="tab"
                className={["ef-rtp-tab", activeTab === "properties" ? "is-active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveTab("properties")}
                aria-selected={activeTab === "properties"}
              >
                Propriétés
              </button>
            </nav>

            {/* ── Tab : Contenu ── */}
            {activeTab === "content" && (
              <div className="ef-rtp-content-tab">
                <RichTextTopToolbar
                  editor={editor}
                  selectedVarAttrs={selectedVarAttrs}
                  applyVarStyle={applyVarStyle}
                  rememberSelection={rememberSelection}
                  runOnSelection={runOnSelection}
                  varSearch={varSearch}
                  setVarSearch={setVarSearch}
                  filteredVars={filteredVars}
                  variableRegistry={variableRegistry}
                  rulerUnit={measurementUnit}
                  rulerMajorStepPx={workspaceSettings.rulerMajorStep}
                  rulerMinorStepPx={workspaceSettings.rulerMinorStep}
                  rulerFineStepPx={workspaceSettings.rulerFineStep}
                  onRulerUnitChange={(nextUnit) =>
                    setWorkspaceSettings({ measurementUnit: nextUnit })
                  }
                  onRulerStepChange={setWorkspaceSettings}
                  showRulerMarginZones={showRulerMarginZones}
                  onShowRulerMarginZonesChange={setShowRulerMarginZones}
                  onOpenTableDialog={() => setTableInsertOpen(true)}
                  onInsertVariable={(entry) => {
                    runOnSelection((te) => {
                      insertVariableTokenIntoRichTextEditor(
                        te,
                        {
                          key: entry.key,
                          label: entry.label,
                          sampleValue: entry.sampleValue,
                          sourceColumn: entry.sourceColumn,
                        },
                        te.state.selection,
                        variableRegistry,
                      );
                    });
                  }}
                />

                <div className="ef-rtp-workarea">
                  <div
                    className="ef-rtp-editor"
                    ref={editorSurfaceRef}
                    onMouseDown={handleEditorMouseDown}
                    onMouseMove={handleEditorMouseMove}
                    onScroll={() => syncTableOverlay()}
                    onDragOverCapture={(event: DragEvent<HTMLDivElement>) => {
                      const ctx = useEditorStore.getState().dragTraceContext;
                      const types = Array.from(event.dataTransfer?.types ?? []);
                      if (
                        !(
                          ctx?.type === "variable" ||
                          types.includes("application/x-resume-editor-item")
                        )
                      )
                        return;
                      event.preventDefault();
                      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
                    }}
                    onDropCapture={(event: DragEvent<HTMLDivElement>) => {
                      const ctx = useEditorStore.getState().dragTraceContext;
                      const raw =
                        event.dataTransfer?.getData("application/x-resume-editor-item") ?? "";
                      const payload = parseVarDropPayload(raw, ctx);
                      if (!payload || !editor) return;
                      event.preventDefault();
                      event.stopPropagation();
                      handledVarDropSessionRef.current = ctx?.sessionId ?? "__handled__";
                      const pos = editor.view.posAtCoords({
                        left: event.clientX,
                        top: event.clientY,
                      })?.pos;
                      const insertAt =
                        typeof pos === "number"
                          ? { from: pos, to: pos }
                          : { from: editor.state.selection.from, to: editor.state.selection.to };
                      insertVariableTokenIntoRichTextEditor(
                        viewToInsertionTarget(editor.view),
                        payload.payload,
                        insertAt,
                        variableRegistry,
                      );
                      editor.commands.focus();
                    }}
                  >
                    <HorizontalRuler
                      editor={editor}
                      scrollContainerRef={editorSurfaceRef}
                      unit={measurementUnit}
                      showMarginZones={showRulerMarginZones}
                      majorStepPx={workspaceSettings.rulerMajorStep}
                      minorStepPx={workspaceSettings.rulerMinorStep}
                      fineStepPx={workspaceSettings.rulerFineStep}
                    />
                    <div
                      className="ef-rtp-editor-document-shell"
                      data-show-ruler-margins={showRulerMarginZones ? "true" : "false"}
                    >
                      {showRulerMarginZones ? (
                        <>
                          <span className="ef-rtp-editor-margin-zone is-left" />
                          <span className="ef-rtp-editor-margin-zone is-right" />
                        </>
                      ) : null}
                      <EditorContent editor={editor} />
                    </div>
                    {tableOverlay && editor ? (
                      <RichTextTableSelectionOverlay
                        overlay={tableOverlay}
                        resizeGuide={tableResizeGuide}
                        selectedTarget={tableSelectedTarget}
                        onSelect={(mode, index) => {
                          setTableSelectedTarget({ mode, index });
                          selectTableTargetByOverlayIndex(
                            editor.view,
                            tableOverlay.tableIndex,
                            mode,
                            index,
                          );
                          setTablePanelOpen(true);
                          setTablePanelTab("selection");
                        }}
                        onColumnResizeStart={(index, event) =>
                          startTableColumnResize(tableOverlay, index, event)
                        }
                        onRowResizeStart={(index, event) =>
                          startTableRowResize(tableOverlay, index, event)
                        }
                        onAddRow={() => editor.chain().focus().addRowAfter().run()}
                        onAddColumn={() => editor.chain().focus().addColumnAfter().run()}
                        onMergeCells={() => editor.chain().focus().mergeCells().run()}
                        onSplitCell={() => editor.chain().focus().splitCell().run()}
                        onToggleBorders={() => {
                          const nextBordered = !getTableAttrs(editor)?.bordered;
                          updateTableAttr(
                            editor,
                            { bordered: nextBordered, borderPreset: nextBordered ? "all" : "none" },
                            { focus: true },
                          );
                        }}
                        onApplySoftColor={() =>
                          updateCellAttr(editor, { backgroundColor: "#dbeafe" }, { focus: true })
                        }
                        onDelete={() => editor.chain().focus().deleteTable().run()}
                        capabilities={{
                          addRow: !!editor.can().addRowAfter(),
                          addColumn: !!editor.can().addColumnAfter(),
                          deleteRow: !!editor.can().deleteRow(),
                          deleteColumn: !!editor.can().deleteColumn(),
                          mergeCells: !!editor.can().mergeCells(),
                          splitCell: !!editor.can().splitCell(),
                          deleteTable: !!editor.can().deleteTable(),
                        }}
                      />
                    ) : null}
                  </div>
                  <RichTextContextInspector
                    editor={editor}
                    inTableCtx={inTableCtx}
                    selectedVarAttrs={selectedVarAttrs}
                    displayMode={displayMode}
                    onDisplayModeChange={handleDisplayMode}
                    tablePanelOpen={tablePanelOpen}
                    onShowTablePanel={() => setTablePanelOpen(true)}
                    tableAttrs={tableAttrs}
                    cellAttrs={tableCellAttrs}
                    rowAttrs={tableRowAttrs}
                    columnWidth={tableColumnWidth}
                    activeTab={tablePanelTab}
                    onTabChange={setTablePanelTab}
                    onClose={() => setTablePanelOpen(false)}
                  />
                </div>
                <RichTextTableInsertDialog
                  open={tableInsertOpen}
                  onClose={() => setTableInsertOpen(false)}
                  onInsert={(rows, cols, withHeaderRow) => {
                    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
                    setTablePanelOpen(true);
                    setTablePanelTab("selection");
                  }}
                />
              </div>
            )}

            {/* ── Tab : Propriétés ── */}
            {activeTab === "properties" && (
              <div className="ef-rtp-props-tab">
                {/* Padding */}
                <section className="ef-rtp-prop-group">
                  <h3 className="ef-rtp-prop-group-title">Padding</h3>
                  <div className="ef-rtp-padding-grid">
                    <label className="ef-rtp-field" style={{ gridArea: "top" }}>
                      <span>Haut</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        className="ef-rtp-input"
                        value={paddingTop}
                        onChange={(e) =>
                          patchContainerProp({ paddingTop: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </label>
                    <label className="ef-rtp-field" style={{ gridArea: "right" }}>
                      <span>Droite</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        className="ef-rtp-input"
                        value={paddingRight}
                        onChange={(e) =>
                          patchContainerProp({ paddingRight: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </label>
                    <label className="ef-rtp-field" style={{ gridArea: "bottom" }}>
                      <span>Bas</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        className="ef-rtp-input"
                        value={paddingBottom}
                        onChange={(e) =>
                          patchContainerProp({ paddingBottom: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </label>
                    <label className="ef-rtp-field" style={{ gridArea: "left" }}>
                      <span>Gauche</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        className="ef-rtp-input"
                        value={paddingLeft}
                        onChange={(e) =>
                          patchContainerProp({ paddingLeft: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </label>
                  </div>
                </section>

                {/* Arrondi */}
                <section className="ef-rtp-prop-group">
                  <h3 className="ef-rtp-prop-group-title">Arrondi</h3>
                  <label className="ef-rtp-field">
                    <span>Rayon des coins (px)</span>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      className="ef-rtp-input"
                      value={element?.style?.cornerRadius ?? 0}
                      onChange={(e) =>
                        patchStyle({ cornerRadius: Math.max(0, Number(e.target.value)) })
                      }
                    />
                  </label>
                </section>

                {/* Bordure */}
                <section className="ef-rtp-prop-group">
                  <h3 className="ef-rtp-prop-group-title">Bordure</h3>
                  <div className="ef-rtp-field-row">
                    <label className="ef-rtp-field">
                      <span>Épaisseur (px)</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        className="ef-rtp-input"
                        value={stylePreview?.strokeWidth ?? 0}
                        onChange={(e) =>
                          patchStyle({ strokeWidth: Math.max(0, Number(e.target.value)) })
                        }
                      />
                    </label>
                    <label className="ef-rtp-field">
                      <span>Type de ligne</span>
                      <select
                        className="ef-rtp-select"
                        value={dashToBorderType(stylePreview?.dash)}
                        onChange={(e) => patchStyle({ dash: DASH_PRESETS[e.target.value] ?? [] })}
                      >
                        <option value="solid">Continue</option>
                        <option value="dashed">Tirets</option>
                        <option value="dotted">Pointillés</option>
                        <option value="dash-dot">Tirets + Points</option>
                      </select>
                    </label>
                  </div>
                  <ColorPickerControl
                    label="Couleur"
                    value={resolveColorInput(stylePreview?.stroke)}
                    onChange={(color) => color && patchStyle({ stroke: color })}
                  />
                </section>

                {/* Opacité */}
                <section className="ef-rtp-prop-group">
                  <h3 className="ef-rtp-prop-group-title">
                    Opacité — {Math.round((stylePreview?.opacity ?? 1) * 100)}%
                  </h3>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    className="ef-rtp-range"
                    value={stylePreview?.opacity ?? 1}
                    onChange={(e) => patchStyle({ opacity: Number(e.target.value) })}
                    aria-label="Opacité du bloc"
                  />
                </section>
              </div>
            )}
          </div>
        </RichTextVariableDatasetContext.Provider>
      </RichTextVariableRegistryContext.Provider>
    </RichTextVariableDisplayModeContext.Provider>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ── Table selection helpers ──────────────────────────────────────────────────

function resolveRichTextTableOverlay(
  surface: HTMLDivElement,
  table: HTMLTableElement,
): RichTextTableOverlay | null {
  const surfaceRect = surface.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  const rows = Array.from(table.querySelectorAll("tr"));
  const firstRowCells = Array.from(rows[0]?.querySelectorAll("th, td") ?? []);
  const editorDom = surface.querySelector(".ef-rtp-editor-content");
  const tableIndex = editorDom
    ? Array.from(editorDom.querySelectorAll("table")).indexOf(table)
    : -1;

  return {
    tableIndex: Math.max(0, tableIndex),
    table: {
      left: tableRect.left - surfaceRect.left + surface.scrollLeft,
      top: tableRect.top - surfaceRect.top + surface.scrollTop,
      width: tableRect.width,
      height: tableRect.height,
    },
    columns: firstRowCells.map((cell, index) => {
      const rect = cell.getBoundingClientRect();
      return {
        left: rect.left - surfaceRect.left + surface.scrollLeft,
        width: rect.width,
        index,
      };
    }),
    rows: rows.map((row, index) => {
      const rect = row.getBoundingClientRect();
      return {
        top: rect.top - surfaceRect.top + surface.scrollTop,
        height: rect.height,
        index,
      };
    }),
  };
}

function findActiveTableElement(editorDom: HTMLElement): HTMLTableElement | null {
  const selectedCell = editorDom.querySelector(".selectedCell");
  const selectedTable = selectedCell?.closest("table");
  if (selectedTable instanceof HTMLTableElement) {
    return selectedTable;
  }

  const focusedCell = editorDom.querySelector("td:focus-within, th:focus-within");
  const focusedTable = focusedCell?.closest("table");
  if (focusedTable instanceof HTMLTableElement) {
    return focusedTable;
  }

  return null;
}

function getTableCtx(editor: Editor) {
  if (!isInTable(editor.state)) return null;
  try {
    const $cell = selectionCell(editor.state);
    const tableDepth = findAncestorDepth($cell, "table");
    if (tableDepth === null) {
      return null;
    }
    const table = $cell.node(tableDepth);
    const tableStart = $cell.start(tableDepth);
    const map = TableMap.get(table);
    return { map, tableStart, $cell };
  } catch {
    return null;
  }
}

function execSelectTable(editor: Editor): void {
  const ctx = getTableCtx(editor);
  if (!ctx) return;
  const { map, tableStart } = ctx;
  try {
    const $anchor = editor.state.doc.resolve(tableStart + map.map[0]);
    const $head = editor.state.doc.resolve(tableStart + map.map[map.map.length - 1]);
    editor.view.dispatch(editor.state.tr.setSelection(new CellSelection($anchor, $head)));
    editor.view.focus();
  } catch {
    /* merged-cell edge case */
  }
}

function execSelectRow(editor: Editor): void {
  const ctx = getTableCtx(editor);
  if (!ctx) return;
  const { map, tableStart, $cell } = ctx;
  try {
    const { top } = findCell($cell);
    const $anchor = editor.state.doc.resolve(tableStart + map.map[top * map.width]);
    const $head = editor.state.doc.resolve(tableStart + map.map[(top + 1) * map.width - 1]);
    editor.view.dispatch(editor.state.tr.setSelection(new CellSelection($anchor, $head)));
    editor.view.focus();
  } catch {
    /* merged-cell edge case */
  }
}

function execSelectColumn(editor: Editor): void {
  const ctx = getTableCtx(editor);
  if (!ctx) return;
  const { map, tableStart, $cell } = ctx;
  try {
    const { left } = findCell($cell);
    const $anchor = editor.state.doc.resolve(tableStart + map.map[left]);
    const $head = editor.state.doc.resolve(
      tableStart + map.map[(map.height - 1) * map.width + left],
    );
    editor.view.dispatch(editor.state.tr.setSelection(new CellSelection($anchor, $head)));
    editor.view.focus();
  } catch {
    /* merged-cell edge case */
  }
}

type RichTextEditorView = {
  state: Editor["state"];
  dispatch: Editor["view"]["dispatch"];
  focus: Editor["view"]["focus"];
};

type RichTextTableDocumentCtx = {
  map: ReturnType<typeof TableMap.get>;
  tablePos: number;
  tableStart: number;
};

function selectTableTargetByOverlayIndex(
  view: RichTextEditorView,
  tableIndex: number,
  mode: TableSelectionMode,
  index = 0,
): void {
  const ctx = getTableCtxByDocumentIndex(view, tableIndex);
  if (!ctx) {
    return;
  }

  try {
    const { map, tableStart } = ctx;
    let anchorOffset = map.map[0];
    let headOffset = map.map[map.map.length - 1];

    if (mode === "row") {
      const rowIndex = Math.min(map.height - 1, Math.max(0, index));
      anchorOffset = map.map[rowIndex * map.width];
      headOffset = map.map[(rowIndex + 1) * map.width - 1];
    }

    if (mode === "column") {
      const columnIndex = Math.min(map.width - 1, Math.max(0, index));
      anchorOffset = map.map[columnIndex];
      headOffset = map.map[(map.height - 1) * map.width + columnIndex];
    }

    const $anchor = view.state.doc.resolve(tableStart + anchorOffset);
    const $head = view.state.doc.resolve(tableStart + headOffset);
    view.dispatch(view.state.tr.setSelection(new CellSelection($anchor, $head)).scrollIntoView());
    view.focus();
  } catch {
    // Ignore invalid merged-cell edge cases; regular table selections still work.
  }
}

function selectTableCellRangeByIndex(
  view: RichTextEditorView,
  tableIndex: number,
  range: Extract<RichTextTableSelectedTarget, { mode: "cell-range" }>,
): void {
  const ctx = getTableCtxByDocumentIndex(view, tableIndex);
  if (!ctx) return;

  try {
    const { map, tableStart } = ctx;
    const startRow = Math.min(map.height - 1, Math.max(0, range.startRow));
    const endRow = Math.min(map.height - 1, Math.max(0, range.endRow));
    const startColumn = Math.min(map.width - 1, Math.max(0, range.startColumn));
    const endColumn = Math.min(map.width - 1, Math.max(0, range.endColumn));
    const $anchor = view.state.doc.resolve(
      tableStart + map.map[startRow * map.width + startColumn],
    );
    const $head = view.state.doc.resolve(tableStart + map.map[endRow * map.width + endColumn]);
    view.dispatch(view.state.tr.setSelection(new CellSelection($anchor, $head)).scrollIntoView());
    view.focus();
  } catch {
    // Ignore merged-cell edge cases; regular table cell-range selection keeps working.
  }
}

function getTableCtxByDocumentIndex(
  view: RichTextEditorView,
  tableIndex: number,
): RichTextTableDocumentCtx | null {
  let currentIndex = -1;
  let found: RichTextTableDocumentCtx | null = null;

  view.state.doc.descendants((node, pos) => {
    if (node.type.name !== "table") {
      return true;
    }

    currentIndex += 1;
    if (currentIndex !== tableIndex) {
      return false;
    }

    found = {
      map: TableMap.get(node),
      tablePos: pos,
      tableStart: pos + 1,
    };
    return false;
  });

  return found;
}

function _setColumnWidthByTableIndex(
  view: RichTextEditorView,
  tableIndex: number,
  columnIndex: number,
  widthPx: number,
): void {
  const ctx = getTableCtxByDocumentIndex(view, tableIndex);
  if (!ctx) return;
  const widths = getTableColumnWidthsFromDocument(view, ctx).map((width, index) =>
    index === columnIndex ? Math.round(widthPx) : width,
  );
  setTableColumnWidthsByTableIndex(view, tableIndex, widths);
}

function setTableColumnWidthsByTableIndex(
  view: RichTextEditorView,
  tableIndex: number,
  widthsPx: number[],
): void {
  const ctx = getTableCtxByDocumentIndex(view, tableIndex);
  if (!ctx) return;

  try {
    const { map, tablePos, tableStart } = ctx;
    const seen = new Set<number>();
    const { tr } = view.state;
    const normalizedWidths = Array.from({ length: map.width }, (_, index) =>
      Math.round(clampNumber(widthsPx[index] ?? widthsPx[widthsPx.length - 1] ?? 80, 24, 1600)),
    );

    for (let column = 0; column < map.width; column += 1) {
      for (let row = 0; row < map.height; row += 1) {
        const cellOffset = map.map[row * map.width + column];
        if (seen.has(cellOffset)) continue;
        seen.add(cellOffset);

        const cellPos = tableStart + cellOffset;
        const cellNode = view.state.doc.nodeAt(cellPos);
        if (!cellNode) continue;

        const existing = Array.isArray(cellNode.attrs.colwidth)
          ? (cellNode.attrs.colwidth as number[])
          : [];
        tr.setNodeMarkup(cellPos, undefined, {
          ...cellNode.attrs,
          colwidth: [normalizedWidths[column], ...existing.slice(1)],
        });
      }
    }

    const tableNode = view.state.doc.nodeAt(tablePos);
    if (tableNode) {
      const totalWidth = normalizedWidths.reduce((sum, width) => sum + width, 0);
      tr.setNodeMarkup(tablePos, undefined, { ...tableNode.attrs, tableWidth: `${totalWidth}px` });
    }

    if (tr.docChanged) {
      view.dispatch(tr);
      view.focus();
    }
  } catch {
    // Ignore invalid table maps; normal tables keep resizing.
  }
}

function getTableColumnWidthsFromDocument(
  view: RichTextEditorView,
  ctx: RichTextTableDocumentCtx,
): number[] {
  const { map, tableStart } = ctx;
  return Array.from({ length: map.width }, (_, column) => {
    const firstCellOffset = map.map[column];
    const firstCellNode = view.state.doc.nodeAt(tableStart + firstCellOffset);
    const colwidth = firstCellNode?.attrs.colwidth;
    const width = Array.isArray(colwidth) ? Number(colwidth[0]) : NaN;
    return Number.isFinite(width) && width > 0 ? Math.round(width) : 80;
  });
}

function setRowHeightByTableIndex(
  view: RichTextEditorView,
  tableIndex: number,
  rowIndex: number,
  heightPx: number,
): void {
  let currentIndex = -1;
  let applied = false;
  const { tr } = view.state;

  view.state.doc.descendants((node, pos) => {
    if (node.type.name !== "table") {
      return true;
    }

    currentIndex += 1;
    if (currentIndex !== tableIndex) {
      return false;
    }

    const row = Math.min(node.childCount - 1, Math.max(0, rowIndex));
    let rowPos: number | null = null;
    node.forEach((child, offset, index) => {
      if (index === row && child.type.name === "tableRow") {
        rowPos = pos + 1 + offset;
      }
    });

    if (rowPos !== null) {
      const rowNode = view.state.doc.nodeAt(rowPos);
      if (rowNode) {
        tr.setNodeMarkup(rowPos, undefined, {
          ...rowNode.attrs,
          rowHeight: `${Math.round(heightPx)}px`,
        });
        applied = true;
      }
    }

    return false;
  });

  if (applied && tr.docChanged) {
    view.dispatch(tr);
    view.focus();
  }
}

function findAncestorDepth(
  $pos: Editor["state"]["selection"]["$from"],
  nodeName: string,
): number | null {
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name === nodeName) {
      return depth;
    }
  }
  return null;
}

// ── Table style helpers ──────────────────────────────────────────────────────

function getTableAttrs(editor: Editor | null): RtpTableStyleAttrs | null {
  if (!editor || !isInTable(editor.state)) return null;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === "table") return $cell.node(d).attrs as RtpTableStyleAttrs;
    }
    return null;
  } catch {
    return null;
  }
}

function getSelectedCellAttrs(editor: Editor | null): RtpTableCellStyleAttrs | null {
  if (!editor || !isInTable(editor.state)) return null;
  try {
    const sel = editor.state.selection;
    if (sel instanceof CellSelection) {
      let attrs: RtpTableCellStyleAttrs | null = null;
      sel.forEachCell((node) => {
        if (!attrs) {
          attrs = node.attrs as RtpTableCellStyleAttrs;
        }
      });
      return attrs;
    }

    const $from = editor.state.selection.$from;
    for (let d = $from.depth; d > 0; d--) {
      const name = $from.node(d).type.name;
      if (name === "tableCell" || name === "tableHeader") {
        return $from.node(d).attrs as RtpTableCellStyleAttrs;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getSelectedRowAttrs(editor: Editor | null): RtpTableRowStyleAttrs | null {
  if (!editor || !isInTable(editor.state)) return null;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === "tableRow") {
        return $cell.node(d).attrs as RtpTableRowStyleAttrs;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getSelectedColumnWidth(editor: Editor | null): number | null {
  const cellAttrs = getSelectedCellAttrs(editor);
  const firstWidth = Array.isArray(cellAttrs?.colwidth) ? cellAttrs.colwidth[0] : null;
  return typeof firstWidth === "number" && Number.isFinite(firstWidth) ? firstWidth : null;
}

function updateTableAttr(
  editor: Editor,
  attrPatch: Record<string, unknown>,
  options: { focus?: boolean } = {},
): void {
  if (!isInTable(editor.state)) return;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === "table") {
        const { tr } = editor.state;
        tr.setNodeMarkup($cell.before(d), undefined, { ...$cell.node(d).attrs, ...attrPatch });
        editor.view.dispatch(tr);
        if (options.focus !== false) {
          editor.view.focus();
        }
        return;
      }
    }
  } catch {}
}

function updateCellAttr(
  editor: Editor,
  attrPatch: Record<string, unknown>,
  options: { focus?: boolean } = {},
): void {
  if (!isInTable(editor.state)) return;
  try {
    const sel = editor.state.selection;
    const { tr } = editor.state;
    if (sel instanceof CellSelection) {
      sel.forEachCell((node, pos) => {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrPatch });
      });
    } else {
      const $from = editor.state.selection.$from;
      for (let d = $from.depth; d > 0; d--) {
        const name = $from.node(d).type.name;
        if (name === "tableCell" || name === "tableHeader") {
          tr.setNodeMarkup($from.before(d), undefined, { ...$from.node(d).attrs, ...attrPatch });
          break;
        }
      }
    }
    editor.view.dispatch(tr);
    if (options.focus !== false) {
      editor.view.focus();
    }
  } catch {}
}

function updateRowAttr(
  editor: Editor,
  attrPatch: Record<string, unknown>,
  options: { focus?: boolean } = {},
): void {
  if (!isInTable(editor.state)) return;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === "tableRow") {
        const { tr } = editor.state;
        tr.setNodeMarkup($cell.before(d), undefined, { ...$cell.node(d).attrs, ...attrPatch });
        editor.view.dispatch(tr);
        if (options.focus !== false) {
          editor.view.focus();
        }
        return;
      }
    }
  } catch {}
}

function setColumnWidth(
  editor: Editor,
  widthPx: number | null,
  options: { focus?: boolean } = {},
): void {
  if (!isInTable(editor.state)) return;
  try {
    const ctx = getTableCtx(editor);
    if (!ctx) return;
    const { map, tableStart, $cell } = ctx;
    const { left } = findCell($cell);
    const { tr } = editor.state;
    const seen = new Set<number>();
    for (let row = 0; row < map.height; row++) {
      const cellOffset = map.map[row * map.width + left];
      if (seen.has(cellOffset)) continue;
      seen.add(cellOffset);
      const cellPos = tableStart + cellOffset;
      const cellNode = editor.state.doc.nodeAt(cellPos);
      if (!cellNode) continue;
      const existing = Array.isArray(cellNode.attrs.colwidth)
        ? (cellNode.attrs.colwidth as number[])
        : [];
      const newColwidth = widthPx === null ? null : [widthPx, ...existing.slice(1)];
      tr.setNodeMarkup(cellPos, undefined, { ...cellNode.attrs, colwidth: newColwidth });
    }
    editor.view.dispatch(tr);
    if (options.focus !== false) {
      editor.view.focus();
    }
  } catch {}
}

// ── Color / drag helpers ─────────────────────────────────────────────────────

function resolveColorInput(value: string | undefined): string {
  if (!value) return "#000000";
  if (/^#[0-9a-f]{3,6}$/i.test(value)) return value;
  return "#000000";
}

function parseCssPixelValue(value: string | null | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cssPixelPatch(value: string, min = 0, max = Number.POSITIVE_INFINITY): string | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return `${Math.min(max, Math.max(min, parsed))}px`;
}

function numericPatch(value: string, min = 0, max = Number.POSITIVE_INFINITY): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(max, Math.max(min, parsed));
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseVarDropPayload(
  raw: string,
  context: { type: string; payload: unknown; sourcePanel?: string } | null,
): VariableDragEnvelope | null {
  const parsed = raw.trim().length > 0 ? parseEditorItemDragPayload(raw) : null;
  if (parsed?.type === "variable") return parsed as VariableDragEnvelope;
  if (context?.type === "variable")
    return {
      type: "variable",
      payload: context.payload,
      sourcePanel: context.sourcePanel,
    } as VariableDragEnvelope;
  return null;
}

function viewToInsertionTarget(
  rawView: unknown,
): import("@/features/editor/renderers/konva-renderer/rich-text-drop-utils").RichTextEditorInsertionTarget {
  const view = rawView as {
    state: {
      selection: { from: number; to: number };
      doc: { content: { size: number } };
      schema: { nodes: { variable: { create: (attrs: Record<string, unknown>) => unknown } } };
      tr: {
        replaceRangeWith: (
          from: number,
          to: number,
          node: unknown,
        ) => { scrollIntoView: () => unknown };
      };
    };
    dispatch: (transaction: unknown) => void;
    focus: () => void;
  };
  return {
    state:
      view.state as import("@/features/editor/renderers/konva-renderer/rich-text-drop-utils").RichTextEditorInsertionTarget["state"],
    commands: {
      focus: () => view.focus(),
      insertContentAt: (position, content) => {
        const node = view.state.schema.nodes.variable.create(content.attrs);
        const tx = view.state.tr
          .replaceRangeWith(position.from, position.to, node)
          .scrollIntoView();
        view.dispatch(tx);
      },
    },
  };
}

function promptLink(editor: Editor | null) {
  if (!editor) return;
  const prev = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("URL du lien", prev ?? "https://");
  if (url === null) return;
  if (!url.trim()) {
    editor.chain().focus().unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type RichTextVariableEntry = RichTextVariableRegistry["entries"][number];

function RichTextTopToolbar({
  editor,
  selectedVarAttrs,
  applyVarStyle,
  rememberSelection,
  runOnSelection,
  varSearch,
  setVarSearch,
  filteredVars,
  variableRegistry,
  rulerUnit,
  rulerMajorStepPx,
  rulerMinorStepPx,
  rulerFineStepPx,
  onRulerUnitChange,
  onRulerStepChange,
  showRulerMarginZones,
  onShowRulerMarginZonesChange,
  onOpenTableDialog,
  onInsertVariable,
}: {
  editor: Editor | null;
  selectedVarAttrs: RichTextVariableNodeAttrs | null;
  applyVarStyle: (patch: Partial<RichTextVariableNodeAttrs>) => void;
  rememberSelection: () => void;
  runOnSelection: (runner: (editor: Editor) => void) => void;
  varSearch: string;
  setVarSearch: (value: string) => void;
  filteredVars: RichTextVariableEntry[];
  variableRegistry: RichTextVariableRegistry;
  rulerUnit: MeasurementUnit;
  rulerMajorStepPx: number;
  rulerMinorStepPx: number;
  rulerFineStepPx: number;
  onRulerUnitChange: (unit: MeasurementUnit) => void;
  onRulerStepChange: (patch: {
    rulerMajorStep?: number;
    rulerMinorStep?: number;
    rulerFineStep?: number;
  }) => void;
  showRulerMarginZones: boolean;
  onShowRulerMarginZonesChange: (visible: boolean) => void;
  onOpenTableDialog: () => void;
  onInsertVariable: (entry: RichTextVariableEntry) => void;
}) {
  const textAttrs = editor?.getAttributes("textStyle") ?? {};
  const paragraphAttrs = editor?.getAttributes("paragraph") ?? {};
  const marginLeftPx =
    typeof paragraphAttrs.marginLeft === "number" ? paragraphAttrs.marginLeft : 0;
  const marginRightPx =
    typeof paragraphAttrs.marginRight === "number" ? paragraphAttrs.marginRight : 0;
  const updateParagraphRulerAttrs = (patch: Record<string, number>) => {
    editor?.chain().focus().updateAttributes("paragraph", patch).run();
  };

  return (
    <div className="ef-rtp-toolbar" role="toolbar" aria-label="Barre de mise en forme">
      <select
        className="ef-rtp-toolbar-select ef-rtp-toolbar-style-select"
        value={resolveCurrentTextStyle(editor)}
        onChange={(event) => applyToolbarStyle(editor, event.target.value)}
        aria-label="Style de paragraphe"
      >
        <option value="paragraph">Normal</option>
        <option value="h1">Titre 1</option>
        <option value="h2">Titre 2</option>
        <option value="h3">Titre 3</option>
        <option value="blockquote">Citation</option>
        <option value="codeBlock">Code</option>
      </select>

      <select
        className="ef-rtp-toolbar-select ef-rtp-toolbar-font-select"
        value={
          selectedVarAttrs ? (selectedVarAttrs.fontFamily ?? "") : (textAttrs.fontFamily ?? "")
        }
        onMouseDown={rememberSelection}
        onChange={(event) =>
          selectedVarAttrs
            ? applyVarStyle({ fontFamily: event.target.value || null })
            : runOnSelection((te) => te.chain().setFontFamily(event.target.value).run())
        }
        aria-label="Police"
      >
        <option value="">Inter</option>
        <option value="Inter, system-ui, sans-serif">Inter</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="ui-monospace, monospace">Mono</option>
      </select>

      <select
        className="ef-rtp-toolbar-select ef-rtp-toolbar-size-select"
        value={selectedVarAttrs ? (selectedVarAttrs.fontSize ?? "") : (textAttrs.fontSize ?? "")}
        onMouseDown={rememberSelection}
        onChange={(event) =>
          selectedVarAttrs
            ? applyVarStyle({ fontSize: event.target.value || null })
            : runOnSelection((te) => te.chain().setFontSize(event.target.value).run())
        }
        aria-label="Taille de police"
      >
        <option value="">14</option>
        {[12, 13, 14, 16, 18, 22, 24, 32].map((size) => (
          <option key={size} value={`${size}px`}>
            {size}
          </option>
        ))}
      </select>

      <span className="ef-rtp-toolbar-separator" aria-hidden />
      <ToolbarIconButton
        label="Gras"
        active={selectedVarAttrs ? !!selectedVarAttrs.bold : editor?.isActive("bold")}
        onClick={() =>
          selectedVarAttrs
            ? applyVarStyle({ bold: !selectedVarAttrs.bold || null })
            : editor?.chain().focus().toggleBold().run()
        }
        icon={<Bold size={15} />}
      />
      <ToolbarIconButton
        label="Italique"
        active={selectedVarAttrs ? !!selectedVarAttrs.italic : editor?.isActive("italic")}
        onClick={() =>
          selectedVarAttrs
            ? applyVarStyle({ italic: !selectedVarAttrs.italic || null })
            : editor?.chain().focus().toggleItalic().run()
        }
        icon={<Italic size={15} />}
      />
      <ToolbarIconButton
        label="Souligné"
        active={selectedVarAttrs ? !!selectedVarAttrs.underline : editor?.isActive("underline")}
        onClick={() =>
          selectedVarAttrs
            ? applyVarStyle({ underline: !selectedVarAttrs.underline || null })
            : editor?.chain().focus().toggleUnderline().run()
        }
        icon={<UnderlineIcon size={15} />}
      />
      <ToolbarIconButton
        label="Barré"
        active={selectedVarAttrs ? !!selectedVarAttrs.strike : editor?.isActive("strike")}
        onClick={() =>
          selectedVarAttrs
            ? applyVarStyle({ strike: !selectedVarAttrs.strike || null })
            : editor?.chain().focus().toggleStrike().run()
        }
        icon={<Strikethrough size={15} />}
      />

      <div className="ef-rtp-toolbar-color-picker" onMouseDown={rememberSelection}>
        <ColorPickerControl
          label="Texte"
          value={
            selectedVarAttrs
              ? (selectedVarAttrs.color ?? "#111827")
              : (textAttrs.color ?? "#111827")
          }
          onChange={(color) => {
            if (!color) return;
            if (selectedVarAttrs) {
              applyVarStyle({ color });
            } else {
              runOnSelection((te) => te.chain().setColor(color).run());
            }
          }}
        />
      </div>
      <div className="ef-rtp-toolbar-color-picker" onMouseDown={rememberSelection}>
        <ColorPickerControl
          label="Surlignage"
          value={textAttrs.backgroundColor ?? "#fef08a"}
          disabled={!!selectedVarAttrs}
          allowTransparent
          onChange={(color) =>
            runOnSelection((te) =>
              color
                ? te.chain().setBackgroundColor(color).run()
                : te.chain().unsetBackgroundColor().run(),
            )
          }
        />
      </div>

      <span className="ef-rtp-toolbar-separator" aria-hidden />
      <ToolbarIconButton
        label="Aligner à gauche"
        active={editor?.isActive({ textAlign: "left" })}
        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        icon={<AlignLeft size={15} />}
      />
      <ToolbarIconButton
        label="Centrer"
        active={editor?.isActive({ textAlign: "center" })}
        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        icon={<AlignCenter size={15} />}
      />
      <ToolbarIconButton
        label="Aligner à droite"
        active={editor?.isActive({ textAlign: "right" })}
        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        icon={<AlignRight size={15} />}
      />
      <ToolbarIconButton
        label="Justifier"
        active={editor?.isActive({ textAlign: "justify" })}
        onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
        icon={<AlignJustify size={15} />}
      />

      <span className="ef-rtp-toolbar-separator" aria-hidden />
      <ToolbarIconButton
        label="Liste à puces"
        active={editor?.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        icon={<List size={15} />}
      />
      <ToolbarIconButton
        label="Liste numérotée"
        active={editor?.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        icon={<ListOrdered size={15} />}
      />
      <ToolbarIconButton
        label="Lien"
        active={editor?.isActive("link")}
        onClick={() => promptLink(editor)}
        icon={<Code2 size={15} />}
      />
      <ToolbarIconButton
        label="Tableau"
        active={editor?.isActive("table")}
        onClick={onOpenTableDialog}
        icon={<Table2 size={15} />}
      />

      <RtpPopover label="Variables" icon={<Braces size={14} aria-hidden />}>
        <div className="ef-rtp-var-search-wrap">
          <Search size={11} className="ef-rtp-var-search-icon" aria-hidden />
          <input
            type="search"
            className="ef-rtp-var-search"
            placeholder="Rechercher une variable..."
            value={varSearch}
            onChange={(event) => setVarSearch(event.target.value)}
            aria-label="Rechercher une variable"
          />
        </div>
        {filteredVars.length === 0 ? (
          <p className="ef-rtp-var-empty">
            {variableRegistry.entries.length === 0
              ? "Aucune variable disponible"
              : "Aucun résultat"}
          </p>
        ) : (
          <div className="ef-rtp-popover-grid">
            {filteredVars.map((entry) => (
              <RtpActionBtn
                key={entry.id}
                label={entry.label}
                icon={<Braces size={12} />}
                onClick={() => onInsertVariable(entry)}
              />
            ))}
          </div>
        )}
      </RtpPopover>

      <ToolbarIconButton
        label="Effacer format"
        onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
        icon={<Eraser size={15} />}
      />

      <RichTextRulerSettingsDialog
        unit={rulerUnit}
        majorStepPx={rulerMajorStepPx}
        minorStepPx={rulerMinorStepPx}
        fineStepPx={rulerFineStepPx}
        marginLeftPx={marginLeftPx}
        marginRightPx={marginRightPx}
        showMarginZones={showRulerMarginZones}
        onUnitChange={onRulerUnitChange}
        onStepChange={onRulerStepChange}
        onMarginChange={updateParagraphRulerAttrs}
        onShowMarginZonesChange={onShowRulerMarginZonesChange}
      />
    </div>
  );
}

function RichTextRulerSettingsDialog({
  unit,
  majorStepPx,
  minorStepPx,
  fineStepPx,
  marginLeftPx,
  marginRightPx,
  showMarginZones,
  onUnitChange,
  onStepChange,
  onMarginChange,
  onShowMarginZonesChange,
}: {
  unit: MeasurementUnit;
  majorStepPx: number;
  minorStepPx: number;
  fineStepPx: number;
  marginLeftPx: number;
  marginRightPx: number;
  showMarginZones: boolean;
  onUnitChange: (unit: MeasurementUnit) => void;
  onStepChange: (patch: {
    rulerMajorStep?: number;
    rulerMinorStep?: number;
    rulerFineStep?: number;
  }) => void;
  onMarginChange: (patch: Record<string, number>) => void;
  onShowMarginZonesChange: (visible: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const safeUnit = unit === "mm" || unit === "cm" ? unit : "px";
  const suffix = safeUnit;
  const toDisplay = (valuePx: number) =>
    formatMeasurementValue(valuePx, safeUnit, safeUnit === "px" ? 0 : 2);
  const toPx = (value: string) =>
    convertMeasurementValue(Number.parseFloat(value), safeUnit, "px") || 0;

  return (
    <div className="ef-rtp-ruler-dialog-wrap">
      <button
        type="button"
        className="ef-rtp-toolbar-icon"
        aria-label="Réglages de la règle"
        title="Réglages de la règle"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((value) => !value)}
      >
        <Settings2 size={15} />
      </button>
      {open ? (
        <div className="ef-rtp-ruler-dialog" role="dialog" aria-label="Paramétrage règle">
          <header>
            <strong>Paramétrage règle</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
              ×
            </button>
          </header>
          <label>
            Unité
            <select
              value={safeUnit}
              onChange={(event) => onUnitChange(event.target.value as MeasurementUnit)}
            >
              <option value="px">px</option>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
            </select>
          </label>
          <RulerDialogNumber
            label="Pas principal"
            value={toDisplay(majorStepPx)}
            suffix={suffix}
            onChange={(value) => onStepChange({ rulerMajorStep: toPx(value) })}
          />
          <RulerDialogNumber
            label="Pas secondaire"
            value={toDisplay(minorStepPx)}
            suffix={suffix}
            onChange={(value) => onStepChange({ rulerMinorStep: toPx(value) })}
          />
          <RulerDialogNumber
            label="Pas fin"
            value={toDisplay(fineStepPx)}
            suffix={suffix}
            onChange={(value) => onStepChange({ rulerFineStep: toPx(value) })}
          />
          <RulerDialogNumber
            label="Marge gauche"
            value={toDisplay(marginLeftPx)}
            suffix={suffix}
            onChange={(value) => onMarginChange({ marginLeft: toPx(value) })}
          />
          <RulerDialogNumber
            label="Marge droite"
            value={toDisplay(marginRightPx)}
            suffix={suffix}
            onChange={(value) => onMarginChange({ marginRight: toPx(value) })}
          />
          <label className="ef-rtp-ruler-dialog-check">
            <input
              type="checkbox"
              checked={showMarginZones}
              onChange={(event) => onShowMarginZonesChange(event.target.checked)}
            />
            Marges grisées dans zone de travail
          </label>
        </div>
      ) : null}
    </div>
  );
}

function RulerDialogNumber({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  /* eslint-disable react-hooks/set-state-in-effect -- draft input needs to reset when external value changes */
  useEffect(() => setDraft(value), [value]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return (
    <label>
      {label}
      <span className="ef-rtp-ruler-dialog-number">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => onChange(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onChange(draft);
              event.currentTarget.blur();
            }
          }}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );
}

function ToolbarIconButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={["ef-rtp-toolbar-icon", active ? "is-active" : ""].filter(Boolean).join(" ")}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function resolveCurrentTextStyle(editor: Editor | null): string {
  if (!editor) return "paragraph";
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("blockquote")) return "blockquote";
  if (editor.isActive("codeBlock")) return "codeBlock";
  return "paragraph";
}

function applyToolbarStyle(editor: Editor | null, style: string): void {
  if (!editor) return;
  if (style === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
  else if (style === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
  else if (style === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
  else if (style === "blockquote") editor.chain().focus().toggleBlockquote().run();
  else if (style === "codeBlock") editor.chain().focus().toggleCodeBlock().run();
  else editor.chain().focus().setParagraph().run();
}

function RichTextContextInspector({
  editor,
  inTableCtx,
  selectedVarAttrs,
  displayMode,
  onDisplayModeChange,
  tablePanelOpen,
  onShowTablePanel,
  tableAttrs,
  cellAttrs,
  rowAttrs,
  columnWidth,
  activeTab,
  onTabChange,
  onClose,
}: {
  editor: Editor | null;
  inTableCtx: boolean;
  selectedVarAttrs: RichTextVariableNodeAttrs | null;
  displayMode: RichTextVariableDisplayMode;
  onDisplayModeChange: (mode: RichTextVariableDisplayMode) => void;
  tablePanelOpen: boolean;
  onShowTablePanel: () => void;
  tableAttrs: RtpTableStyleAttrs | null;
  cellAttrs: RtpTableCellStyleAttrs | null;
  rowAttrs: RtpTableRowStyleAttrs | null;
  columnWidth: number | null;
  activeTab: RichTextTableInspectorTab;
  onTabChange: (tab: RichTextTableInspectorTab) => void;
  onClose: () => void;
}) {
  if (inTableCtx) {
    if (!tablePanelOpen) {
      return (
        <aside className="ef-rtp-context-inspector" aria-label="Inspecteur contextuel">
          <div className="ef-rtp-context-empty">
            <strong>Tableau détecté</strong>
            <span>Le panneau tableau est masqué.</span>
            <button type="button" onClick={onShowTablePanel}>
              Afficher les réglages
            </button>
          </div>
        </aside>
      );
    }

    return (
      <RichTextTableInspector
        isActive={inTableCtx}
        tableAttrs={tableAttrs}
        cellAttrs={cellAttrs}
        rowAttrs={rowAttrs}
        columnWidth={columnWidth}
        activeTab={activeTab}
        capabilities={{
          addRowBefore: !!editor?.can().addRowBefore(),
          addRowAfter: !!editor?.can().addRowAfter(),
          deleteRow: !!editor?.can().deleteRow(),
          addColumnBefore: !!editor?.can().addColumnBefore(),
          addColumnAfter: !!editor?.can().addColumnAfter(),
          deleteColumn: !!editor?.can().deleteColumn(),
          mergeCells: !!editor?.can().mergeCells(),
          splitCell: !!editor?.can().splitCell(),
          deleteTable: !!editor?.can().deleteTable(),
        }}
        onTabChange={onTabChange}
        onClose={onClose}
        onSelectTable={() => editor && execSelectTable(editor)}
        onSelectRow={() => editor && execSelectRow(editor)}
        onSelectColumn={() => editor && execSelectColumn(editor)}
        onAddRowBefore={() => editor?.chain().focus().addRowBefore().run()}
        onAddRowAfter={() => editor?.chain().focus().addRowAfter().run()}
        onDeleteRow={() => editor?.chain().focus().deleteRow().run()}
        onAddColumnBefore={() => editor?.chain().focus().addColumnBefore().run()}
        onAddColumnAfter={() => editor?.chain().focus().addColumnAfter().run()}
        onDeleteColumn={() => editor?.chain().focus().deleteColumn().run()}
        onMergeCells={() => editor?.chain().focus().mergeCells().run()}
        onSplitCell={() => editor?.chain().focus().splitCell().run()}
        onDeleteTable={() => editor?.chain().focus().deleteTable().run()}
        onToggleHeaderRow={() => editor?.chain().focus().toggleHeaderRow().run()}
        onToggleHeaderColumn={() => editor?.chain().focus().toggleHeaderColumn().run()}
        onToggleStriped={() => {
          if (!editor) return;
          updateTableAttr(editor, { striped: !getTableAttrs(editor)?.striped }, { focus: true });
        }}
        onFirstColumnToggle={() => {
          if (!editor) return;
          updateTableAttr(
            editor,
            { firstColumn: !getTableAttrs(editor)?.firstColumn },
            { focus: true },
          );
        }}
        onBorderPresetChange={(borderPreset: RichTextTableBorderPreset) => {
          if (!editor) return;
          updateTableAttr(
            editor,
            { bordered: borderPreset !== "none", borderPreset },
            { focus: true },
          );
        }}
        onBorderColorChange={(color) =>
          editor &&
          updateTableAttr(editor, { bordered: true, borderColor: color }, { focus: false })
        }
        onCellBackgroundChange={(color) =>
          editor && updateCellAttr(editor, { backgroundColor: color }, { focus: false })
        }
        onCellTextAlignChange={(value) =>
          editor && updateCellAttr(editor, { textAlign: value }, { focus: false })
        }
        onHeaderBackgroundChange={(color) =>
          editor && updateTableAttr(editor, { headerBackgroundColor: color }, { focus: false })
        }
        onHeaderTextColorChange={(color) =>
          editor && updateTableAttr(editor, { headerTextColor: color }, { focus: false })
        }
        onFirstColumnBackgroundChange={(color) =>
          editor &&
          updateTableAttr(
            editor,
            { firstColumn: true, firstColumnBackgroundColor: color },
            { focus: false },
          )
        }
        onFirstColumnTextColorChange={(color) =>
          editor &&
          updateTableAttr(
            editor,
            { firstColumn: true, firstColumnTextColor: color },
            { focus: false },
          )
        }
        onStripedEvenColorChange={(color) =>
          editor &&
          updateTableAttr(editor, { striped: true, stripedEvenColor: color }, { focus: false })
        }
        onStripedOddColorChange={(color) =>
          editor &&
          updateTableAttr(editor, { striped: true, stripedOddColor: color }, { focus: false })
        }
        onBorderWidthChange={(value) => {
          if (!editor) return;
          const borderWidth = cssPixelPatch(value, 0, 20);
          updateTableAttr(
            editor,
            {
              bordered: borderWidth !== null && parseCssPixelValue(borderWidth, 0) > 0,
              borderWidth,
            },
            { focus: false },
          );
        }}
        onTableWidthChange={(value) =>
          editor &&
          updateTableAttr(editor, { tableWidth: cssPixelPatch(value, 50, 2000) }, { focus: false })
        }
        onColumnWidthChange={(value) =>
          editor && setColumnWidth(editor, numericPatch(value, 20, 1000), { focus: false })
        }
        onRowHeightChange={(value) =>
          editor &&
          updateRowAttr(editor, { rowHeight: cssPixelPatch(value, 16, 500) }, { focus: false })
        }
        onCellPaddingChange={(value) =>
          editor &&
          updateCellAttr(editor, { cellPadding: cssPixelPatch(value, 0, 40) }, { focus: false })
        }
        onVerticalAlignChange={(value) =>
          editor && updateCellAttr(editor, { verticalAlign: value }, { focus: false })
        }
      />
    );
  }

  if (selectedVarAttrs) {
    return (
      <RichTextVariableInspector
        attrs={selectedVarAttrs}
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
      />
    );
  }

  return <RichTextTextInspector editor={editor} />;
}

function RichTextTableSelectionOverlay({
  overlay,
  resizeGuide,
  selectedTarget,
  onSelect,
  onColumnResizeStart,
  onRowResizeStart,
  onAddRow,
  onAddColumn,
  onMergeCells,
  onSplitCell,
  onToggleBorders,
  onApplySoftColor,
  onDelete,
  capabilities,
}: {
  overlay: RichTextTableOverlay;
  resizeGuide: RichTextTableResizeGuide | null;
  selectedTarget: RichTextTableSelectedTarget;
  onSelect: (mode: TableSelectionMode, index?: number) => void;
  onColumnResizeStart: (index: number, event: ReactMouseEvent<HTMLButtonElement>) => void;
  onRowResizeStart: (index: number, event: ReactMouseEvent<HTMLButtonElement>) => void;
  onAddRow: () => void;
  onAddColumn: () => void;
  onMergeCells: () => void;
  onSplitCell: () => void;
  onToggleBorders: () => void;
  onApplySoftColor: () => void;
  onDelete: () => void;
  capabilities: {
    addRow: boolean;
    addColumn: boolean;
    deleteRow: boolean;
    deleteColumn: boolean;
    mergeCells: boolean;
    splitCell: boolean;
    deleteTable: boolean;
  };
}) {
  const [hoverTarget, setHoverTarget] = useState<RichTextTableHoverTarget>(null);

  return (
    <div className="ef-rtp-table-selection-overlay" onMouseLeave={() => setHoverTarget(null)}>
      <RichTextTableHoverMark overlay={overlay} target={hoverTarget} />
      {selectedTarget?.mode === "cell-range" ? (
        <RichTextTableCellRangeMark overlay={overlay} target={selectedTarget} />
      ) : null}
      {selectedTarget?.mode === "column" &&
      typeof selectedTarget.index === "number" &&
      overlay.columns[selectedTarget.index] ? (
        <span
          className="ef-rtp-table-selection-mark ef-rtp-table-selection-mark-column"
          style={{
            left: `${overlay.columns[selectedTarget.index].left}px`,
            top: `${overlay.table.top}px`,
            width: `${overlay.columns[selectedTarget.index].width}px`,
            height: `${overlay.table.height}px`,
          }}
          aria-hidden="true"
        />
      ) : null}
      {selectedTarget?.mode === "row" &&
      typeof selectedTarget.index === "number" &&
      overlay.rows[selectedTarget.index] ? (
        <span
          className="ef-rtp-table-selection-mark ef-rtp-table-selection-mark-row"
          style={{
            left: `${overlay.table.left}px`,
            top: `${overlay.rows[selectedTarget.index].top}px`,
            width: `${overlay.table.width}px`,
            height: `${overlay.rows[selectedTarget.index].height}px`,
          }}
          aria-hidden="true"
        />
      ) : null}
      <div
        className="ef-rtp-table-active-outline"
        style={{
          left: `${overlay.table.left}px`,
          top: `${overlay.table.top}px`,
          width: `${overlay.table.width}px`,
          height: `${overlay.table.height}px`,
        }}
        aria-hidden="true"
      >
        <span className="ef-rtp-table-outline-node ef-rtp-table-outline-node-nw" />
        <span className="ef-rtp-table-outline-node ef-rtp-table-outline-node-ne" />
        <span className="ef-rtp-table-outline-node ef-rtp-table-outline-node-se" />
        <span className="ef-rtp-table-outline-node ef-rtp-table-outline-node-sw" />
        <span className="ef-rtp-table-outline-node ef-rtp-table-outline-node-n" />
        <span className="ef-rtp-table-outline-node ef-rtp-table-outline-node-s" />
      </div>
      <div
        className="ef-rtp-table-context-toolbar"
        style={{
          left: `${Math.max(0, overlay.table.left + overlay.table.width / 2 - 238)}px`,
          top: `${Math.max(0, overlay.table.top - 66)}px`,
        }}
        role="toolbar"
        aria-label="Outils tableau"
        onMouseDown={(event) => event.preventDefault()}
      >
        <TableOverlayAction
          label="Ligne"
          icon={<Plus size={22} />}
          disabled={!capabilities.addRow}
          onClick={onAddRow}
        />
        <TableOverlayAction
          label="Colonne"
          icon={<Plus size={22} />}
          disabled={!capabilities.addColumn}
          onClick={onAddColumn}
        />
        <TableOverlayAction
          label="Fusionner"
          icon={<TableCellsMerge size={22} />}
          disabled={!capabilities.mergeCells}
          onClick={onMergeCells}
        />
        <TableOverlayAction
          label="Scinder"
          icon={<TableCellsSplit size={22} />}
          disabled={!capabilities.splitCell}
          onClick={onSplitCell}
        />
        <TableOverlayAction
          label="Bordures"
          icon={<Grid2x2 size={22} />}
          onClick={onToggleBorders}
        />
        <TableOverlayAction
          label="Couleur"
          icon={<Eraser size={22} />}
          onClick={onApplySoftColor}
        />
        <TableOverlayAction
          label="Supprimer"
          icon={<Trash2 size={22} />}
          disabled={!capabilities.deleteTable}
          danger
          onClick={onDelete}
        />
      </div>
      <button
        type="button"
        className="ef-rtp-table-select-handle"
        data-rtp-table-overlay="true"
        style={{
          left: `${overlay.table.left - 8}px`,
          top: `${overlay.table.top - 8}px`,
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect("table");
        }}
        onMouseEnter={() => setHoverTarget({ mode: "table" })}
        onMouseLeave={() => setHoverTarget(null)}
        aria-label="Sélectionner le tableau"
      >
        <Table2 size={11} aria-hidden />
      </button>
      {overlay.columns.map((column) => (
        <button
          type="button"
          key={`column-${column.index}`}
          className="ef-rtp-table-column-gutter"
          data-rtp-table-overlay="true"
          style={{
            left: `${column.left}px`,
            top: `${overlay.table.top - 28}px`,
            width: `${column.width}px`,
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect("column", column.index);
          }}
          onMouseEnter={() => setHoverTarget({ mode: "column", index: column.index })}
          onMouseLeave={() => setHoverTarget(null)}
          aria-label={`Sélectionner la colonne ${column.index + 1}`}
        >
          <span aria-hidden>↓</span>
        </button>
      ))}
      {overlay.columns.map((column) => (
        <button
          type="button"
          key={`column-resize-${column.index}`}
          className="ef-rtp-table-column-resize-handle"
          data-rtp-table-overlay="true"
          style={{
            left: `${column.left + column.width - 4}px`,
            top: `${overlay.table.top}px`,
            height: `${overlay.table.height}px`,
          }}
          onMouseDown={(event) => onColumnResizeStart(column.index, event)}
          onMouseEnter={() => setHoverTarget({ mode: "column-resize", index: column.index })}
          onMouseLeave={() => setHoverTarget(null)}
          aria-label={`Redimensionner la colonne ${column.index + 1}`}
        />
      ))}
      {overlay.rows.map((row) => (
        <button
          type="button"
          key={`row-${row.index}`}
          className="ef-rtp-table-row-gutter"
          data-rtp-table-overlay="true"
          style={{
            left: `${overlay.table.left - 30}px`,
            top: `${row.top}px`,
            height: `${row.height}px`,
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect("row", row.index);
          }}
          onMouseEnter={() => setHoverTarget({ mode: "row", index: row.index })}
          onMouseLeave={() => setHoverTarget(null)}
          aria-label={`Sélectionner la ligne ${row.index + 1}`}
        >
          <span aria-hidden>→</span>
        </button>
      ))}
      {overlay.rows.map((row) => (
        <button
          type="button"
          key={`row-resize-${row.index}`}
          className="ef-rtp-table-row-resize-handle"
          data-rtp-table-overlay="true"
          style={{
            left: `${overlay.table.left}px`,
            top: `${row.top + row.height - 4}px`,
            width: `${overlay.table.width}px`,
          }}
          onMouseDown={(event) => onRowResizeStart(row.index, event)}
          onMouseEnter={() => setHoverTarget({ mode: "row-resize", index: row.index })}
          onMouseLeave={() => setHoverTarget(null)}
          aria-label={`Redimensionner la ligne ${row.index + 1}`}
        />
      ))}
      {resizeGuide?.kind === "column" ? (
        <span
          className="ef-rtp-table-resize-guide ef-rtp-table-resize-guide-column"
          style={{
            left: `${resizeGuide.x}px`,
            top: `${resizeGuide.top}px`,
            height: `${resizeGuide.height}px`,
          }}
          aria-hidden="true"
        />
      ) : null}
      {resizeGuide?.kind === "row" ? (
        <span
          className="ef-rtp-table-resize-guide ef-rtp-table-resize-guide-row"
          style={{
            left: `${resizeGuide.left}px`,
            top: `${resizeGuide.y}px`,
            width: `${resizeGuide.width}px`,
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

function TableOverlayAction({
  label,
  icon,
  active,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[active ? "is-active" : "", danger ? "is-danger" : ""].filter(Boolean).join(" ")}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      aria-label={label}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RichTextTableCellRangeMark({
  overlay,
  target,
}: {
  overlay: RichTextTableOverlay;
  target: Extract<RichTextTableSelectedTarget, { mode: "cell-range" }>;
}) {
  const rowStart = Math.min(target.startRow, target.endRow);
  const rowEnd = Math.max(target.startRow, target.endRow);
  const columnStart = Math.min(target.startColumn, target.endColumn);
  const columnEnd = Math.max(target.startColumn, target.endColumn);
  const firstRow = overlay.rows[rowStart];
  const lastRow = overlay.rows[rowEnd];
  const firstColumn = overlay.columns[columnStart];
  const lastColumn = overlay.columns[columnEnd];

  if (!firstRow || !lastRow || !firstColumn || !lastColumn) return null;

  return (
    <span
      className="ef-rtp-table-selection-mark ef-rtp-table-selection-mark-cells"
      style={{
        left: `${firstColumn.left}px`,
        top: `${firstRow.top}px`,
        width: `${lastColumn.left + lastColumn.width - firstColumn.left}px`,
        height: `${lastRow.top + lastRow.height - firstRow.top}px`,
      }}
      aria-hidden="true"
    />
  );
}

function RichTextTableHoverMark({
  overlay,
  target,
}: {
  overlay: RichTextTableOverlay;
  target: RichTextTableHoverTarget;
}) {
  if (!target) return null;

  if (target.mode === "table") {
    return (
      <span
        className="ef-rtp-table-hover-mark ef-rtp-table-hover-mark-table"
        style={{
          left: `${overlay.table.left}px`,
          top: `${overlay.table.top}px`,
          width: `${overlay.table.width}px`,
          height: `${overlay.table.height}px`,
        }}
        aria-hidden="true"
      />
    );
  }

  if (
    (target.mode === "column" || target.mode === "column-resize") &&
    overlay.columns[target.index]
  ) {
    const column = overlay.columns[target.index];
    return (
      <span
        className={[
          "ef-rtp-table-hover-mark",
          target.mode === "column-resize"
            ? "ef-rtp-table-hover-mark-resize-column"
            : "ef-rtp-table-hover-mark-column",
        ].join(" ")}
        style={{
          left: `${target.mode === "column-resize" ? column.left + column.width - 1 : column.left}px`,
          top: `${overlay.table.top}px`,
          width: `${target.mode === "column-resize" ? 2 : column.width}px`,
          height: `${overlay.table.height}px`,
        }}
        aria-hidden="true"
      />
    );
  }

  if ((target.mode === "row" || target.mode === "row-resize") && overlay.rows[target.index]) {
    const row = overlay.rows[target.index];
    return (
      <span
        className={[
          "ef-rtp-table-hover-mark",
          target.mode === "row-resize"
            ? "ef-rtp-table-hover-mark-resize-row"
            : "ef-rtp-table-hover-mark-row",
        ].join(" ")}
        style={{
          left: `${overlay.table.left}px`,
          top: `${target.mode === "row-resize" ? row.top + row.height - 1 : row.top}px`,
          width: `${overlay.table.width}px`,
          height: `${target.mode === "row-resize" ? 2 : row.height}px`,
        }}
        aria-hidden="true"
      />
    );
  }

  return null;
}

function RtpPopover({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={["ef-rtp-toolbar-btn", active ? "is-active" : ""].filter(Boolean).join(" ")}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={label}
          title={label}
        >
          {icon}
          <span>{label}</span>
          <ChevronDown size={10} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="ef-rtp-popover"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(event) => {
          if (
            document.activeElement instanceof HTMLInputElement &&
            document.activeElement.type === "color"
          ) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          if (
            document.activeElement instanceof HTMLInputElement &&
            document.activeElement.type === "color"
          ) {
            event.preventDefault();
          }
        }}
      >
        <div className="ef-rtp-popover-title">{label}</div>
        {children}
      </PopoverContent>
    </Popover>
  );
}

function RtpActionBtn({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={["ef-rtp-action-btn", active ? "is-active" : ""].filter(Boolean).join(" ")}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <span className="ef-rtp-action-icon">{icon}</span>
      <span className="ef-rtp-action-label">{label}</span>
    </button>
  );
}
