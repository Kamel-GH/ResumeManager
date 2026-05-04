"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { CellSelection, TableMap, findCell, isInTable, selectionCell } from "@tiptap/pm/tables";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";

import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight,
  Bold, Braces, ChevronDown, Code, Code2,
  Columns3, Eraser, Eye, Heading1, Heading2, Heading3,
  Italic, LayoutList, List, ListOrdered, Minus, Pilcrow,
  Plus, Quote, Rows3, Search, Strikethrough,
  Table2, TableCellsMerge, TableCellsSplit, Tag,
  Trash2, Type, Underline as UnderlineIcon, X,
} from "lucide-react";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { Editor } from "@tiptap/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useVariablesStore } from "@/features/data-mapping/stores/variables-store";
import {
  RICH_TEXT_VARIABLE_INSERT_EVENT,
  buildVariableDragOperationLog,
  parseEditorItemDragPayload,
  type VariableDragEnvelope,
} from "@/features/data-mapping/lib/variable-display";
import {
  createRichTextVariableRegistry,
  parseRichTextHtmlToJson,
  serializeRichTextJsonToHtml,
  type RichTextVariableDisplayMode,
  type RichTextVariableNodeAttrs,
  type RichTextVariableRegistry,
} from "@/features/editor/lib/rich-text-variable";
import {
  createRichTextVariableNodeViewExtension,
  RichTextVariableDatasetContext,
  RichTextVariableDisplayModeContext,
  RichTextVariableRegistryContext,
} from "@/features/editor/components/parts/rich-text-variable-node-view";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { insertVariableTokenIntoRichTextEditor } from "@/features/editor/renderers/konva-renderer/rich-text-drop-utils";
import { resolveCanvasObjectStylePreview } from "@/features/editor/schema/canvas-mutation";

// ─── Types ────────────────────────────────────────────────────────────────────

type RtpTab = "content" | "properties";

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
        renderHTML: (attrs) => attrs.backgroundColor ? { style: `background-color:${attrs.backgroundColor}` } : {},
      },
      verticalAlign: {
        default: null,
        parseHTML: (el) => el.style.verticalAlign || null,
        renderHTML: (attrs) => attrs.verticalAlign ? { style: `vertical-align:${attrs.verticalAlign}` } : {},
      },
      cellPadding: {
        default: null,
        parseHTML: (el) => el.style.padding || null,
        renderHTML: (attrs) => attrs.cellPadding ? { style: `padding:${attrs.cellPadding}` } : {},
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
        renderHTML: (attrs) => attrs.backgroundColor ? { style: `background-color:${attrs.backgroundColor}` } : {},
      },
      verticalAlign: {
        default: null,
        parseHTML: (el) => el.style.verticalAlign || null,
        renderHTML: (attrs) => attrs.verticalAlign ? { style: `vertical-align:${attrs.verticalAlign}` } : {},
      },
      cellPadding: {
        default: null,
        parseHTML: (el) => el.style.padding || null,
        renderHTML: (attrs) => attrs.cellPadding ? { style: `padding:${attrs.cellPadding}` } : {},
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
        renderHTML: (attrs) => attrs.rowHeight ? { style: `height:${attrs.rowHeight}` } : {},
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
        renderHTML: (attrs) => attrs.tableWidth ? { style: `width:${attrs.tableWidth}` } : {},
      },
      bordered: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-bordered') === 'true',
        renderHTML: (attrs) => attrs.bordered ? { 'data-bordered': 'true' } : {},
      },
      striped: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-striped') === 'true',
        renderHTML: (attrs) => attrs.striped ? { 'data-striped': 'true' } : {},
      },
      borderColor: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue('--rtp-bc') || null,
        renderHTML: (attrs) => attrs.borderColor ? { style: `--rtp-bc:${attrs.borderColor}` } : {},
      },
      borderWidth: {
        default: null,
        parseHTML: (el) => el.style.getPropertyValue('--rtp-bw') || null,
        renderHTML: (attrs) => attrs.borderWidth ? { style: `--rtp-bw:${attrs.borderWidth}` } : {},
      },
    };
  },
});

interface RtpTableStyleAttrs {
  bordered?: boolean;
  striped?: boolean;
  borderColor?: string | null;
  borderWidth?: string | null;
  tableWidth?: string | null;
}

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
  const [displayMode, setDisplayMode] = useState<RichTextVariableDisplayMode>(initialDisplayMode ?? "label");
  const [varSearch, setVarSearch] = useState("");

  // ── Floating window (drag + resize) ────────────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 520, h: 600 });
  const posRef  = useRef(pos);
  const sizeRef = useRef(size);
  posRef.current  = pos;   // kept in sync every render (no stale-closure in stable effects)
  sizeRef.current = size;

  const dragRef   = useRef<{ sx: number; sy: number; ix: number; iy: number } | null>(null);
  const resizeRef = useRef<{
    dir: string; sx: number; sy: number; ix: number; iy: number; iw: number; ih: number;
  } | null>(null);

  // Position to top-right on first mount (synchronous → no flash)
  useLayoutEffect(() => {
    const W = 520;
    const H = Math.round(Math.min(window.innerHeight - 24, 780));
    const x = Math.max(0, window.innerWidth - W - 16);
    const y = Math.max(0, Math.round((window.innerHeight - H) / 2));
    posRef.current  = { x, y };
    sizeRef.current = { w: W, h: H };
    setPos({ x, y });
    setSize({ w: W, h: H });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable global handlers — read values from refs only
  useEffect(() => {
    const MIN_W = 320, MIN_H = 280;

    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      const rsz  = resizeRef.current;

      if (drag) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth  - sizeRef.current.w, drag.ix + e.clientX - drag.sx)),
          y: Math.max(0, Math.min(window.innerHeight - 64,                 drag.iy + e.clientY - drag.sy)),
        });
        return;
      }

      if (rsz) {
        const dx = e.clientX - rsz.sx;
        const dy = e.clientY - rsz.sy;
        let nx = rsz.ix, ny = rsz.iy, nw = rsz.iw, nh = rsz.ih;

        if (rsz.dir.includes('e')) nw = Math.max(MIN_W, rsz.iw + dx);
        if (rsz.dir.includes('s')) nh = Math.max(MIN_H, rsz.ih + dy);
        if (rsz.dir.includes('w')) { nw = Math.max(MIN_W, rsz.iw - dx); nx = rsz.ix + rsz.iw - nw; }
        if (rsz.dir.includes('n')) { nh = Math.max(MIN_H, rsz.ih - dy); ny = rsz.iy + rsz.ih - nh; }

        nx = Math.max(0, nx);
        ny = Math.max(0, ny);
        nw = Math.min(nw, window.innerWidth  - nx);
        nh = Math.min(nh, window.innerHeight - ny);

        setPos({ x: nx, y: ny });
        setSize({ w: nw, h: nh });
      }
    };

    const onUp = () => {
      if (dragRef.current || resizeRef.current) {
        dragRef.current   = null;
        resizeRef.current = null;
        document.body.style.userSelect = '';
        document.body.style.cursor     = '';
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []); // stable — only reads refs

  function startDrag(e: ReactMouseEvent<HTMLElement>) {
    if ((e.target as Element).closest('.ef-rtp-header-controls')) return;
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ix: posRef.current.x, iy: posRef.current.y };
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = 'grabbing';
  }

  function startResize(e: ReactMouseEvent<HTMLElement>, dir: string) {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      dir, sx: e.clientX, sy: e.clientY,
      ix: posRef.current.x,  iy: posRef.current.y,
      iw: sizeRef.current.w, ih: sizeRef.current.h,
    };
    document.body.style.userSelect = 'none';
    const cursorMap: Record<string, string> = {
      n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
      ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
    };
    document.body.style.cursor = cursorMap[dir] ?? 'se-resize';
  }

  // Store
  const workingTemplate = useEditorStore((s) => s.workingTemplate);
  const activePageId = useEditorStore((s) => s.activePageId);
  const dragTraceContext = useEditorStore((s) => s.dragTraceContext);
  const appendOperationLogs = useEditorStore((s) => s.appendOperationLogs);
  const updateRichTextElementContent = useEditorStore((s) => s.updateRichTextElementContent);
  const updateRichTextContainerProps = useEditorStore((s) => s.updateRichTextContainerProps);
  const commitCanvasObjectStyle = useEditorStore((s) => s.commitCanvasObjectStyle);

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
  const dragTraceSessionRef = useRef<string | null>(null);
  const handledVarDropSessionRef = useRef<string | null>(null);
  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);

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
          const canAccept = ctx?.type === "variable" || types.includes("application/x-resume-editor-item");
          if (!canAccept) return false;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
          if (ctx?.type === "variable" && dragTraceSessionRef.current !== ctx.sessionId) {
            dragTraceSessionRef.current = ctx.sessionId;
            appendOperationLogs([buildVariableDragOperationLog(ctx, { action: "dragover", pageId: activePageId, target: `Rich Text (${blockId})`, outcome: "survol" })]);
          }
          return true;
        },
      },
      handleDrop: (view, event) => {
        const ctx = useEditorStore.getState().dragTraceContext;
        if (ctx?.type === "variable" && handledVarDropSessionRef.current === ctx.sessionId) return false;
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
          typeof pos === "number" ? { from: pos, to: pos } : { from: view.state.selection.from, to: view.state.selection.to },
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

  const [selectedVarAttrs, setSelectedVarAttrs] = useState<RichTextVariableNodeAttrs | null>(null);
  const [inTableCtx, setInTableCtx] = useState(false);
  const [tableTab, setTableTab] = useState<'structure' | 'style'>('structure');

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
    };
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);
    return () => { editor.off("selectionUpdate", sync); editor.off("transaction", sync); };
  }, [editor]);

  const applyVarStyle = useCallback((patch: Partial<RichTextVariableNodeAttrs>) => {
    if (!editor) return;
    const sel = editor.state.selection;
    if (!(sel instanceof NodeSelection) || sel.node.type.name !== "variable") return;
    const { tr } = editor.state;
    tr.setNodeMarkup(sel.from, undefined, { ...sel.node.attrs, ...patch });
    editor.view.dispatch(tr);
    editor.view.focus();
  }, [editor]);

  // ── Live sync ──────────────────────────────────────────────────────────────

  const doSync = useCallback((mode: RichTextVariableDisplayMode, editorInstance: Editor) => {
    const json = editorInstance.getJSON();
    const html = serializeRichTextJsonToHtml(json, { displayMode: mode, registry: variableRegistry, dataset: variableDataset });
    updateRichTextElementContent({ elementId: blockId, html, json, displayMode: mode });
  }, [blockId, variableRegistry, variableDataset, updateRichTextElementContent]);

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

  const handleDisplayMode = useCallback((mode: RichTextVariableDisplayMode) => {
    setDisplayMode(mode);
    if (editor) doSync(mode, editor);
  }, [editor, doSync]);

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
    return () => { editor.off("selectionUpdate", rememberSelection); editor.off("focus", rememberSelection); };
  }, [editor, rememberSelection]);

  const runOnSelection = useCallback((command: (e: Editor) => void) => {
    if (!editor) return;
    const saved = lastSelectionRef.current;
    if (saved && saved.to <= editor.state.doc.content.size) {
      editor.chain().focus().setTextSelection(saved).run();
    } else {
      editor.commands.focus();
    }
    command(editor);
    rememberSelection();
  }, [editor, rememberSelection]);

  // ── Variable insert event ──────────────────────────────────────────────────

  useEffect(() => {
    if (!editor) return;
    const handler = (event: Event) => {
      const payload = (event as CustomEvent<VariableDragEnvelope["payload"]>).detail;
      if (!payload) return;
      insertVariableTokenIntoRichTextEditor(editor, payload, lastSelectionRef.current ?? editor.state.selection, variableRegistry);
      rememberSelection();
    };
    window.addEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handler as EventListener);
    return () => window.removeEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handler as EventListener);
  }, [editor, rememberSelection, variableRegistry]);

  useEffect(() => {
    if (!dragTraceContext) handledVarDropSessionRef.current = null;
  }, [dragTraceContext]);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Properties ────────────────────────────────────────────────────────────

  const stylePreview = useMemo(() => (element ? resolveCanvasObjectStylePreview(element) : null), [element]);

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
  const paddingTop = typeof props.paddingTop === "number" ? (props.paddingTop as number) : defaultPadding;
  const paddingRight = typeof props.paddingRight === "number" ? (props.paddingRight as number) : defaultPadding;
  const paddingBottom = typeof props.paddingBottom === "number" ? (props.paddingBottom as number) : defaultPadding;
  const paddingLeft = typeof props.paddingLeft === "number" ? (props.paddingLeft as number) : defaultPadding;

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
            {(["n","ne","e","se","s","sw","w","nw"] as const).map((dir) => (
              <div key={dir} className={`ef-rtp-rh ef-rtp-rh-${dir}`} onMouseDown={(e) => startResize(e, dir)} />
            ))}

            {/* ── Header (drag handle) ── */}
            <header className="ef-rtp-header" onMouseDown={startDrag}>
              <div className="ef-rtp-header-info">
                <strong>Éditer le texte</strong>
                <span>{blockId}</span>
              </div>
              <div className="ef-rtp-header-controls">
                {([
                  { value: "label",     icon: <Tag    size={14} aria-hidden />, title: "Nom des variables"   },
                  { value: "value",     icon: <Eye    size={14} aria-hidden />, title: "Aperçu des valeurs"  },
                  { value: "technical", icon: <Code2  size={14} aria-hidden />, title: "Clé technique {{…}}" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={["ef-rtp-mode-btn", displayMode === opt.value ? "is-active" : ""].filter(Boolean).join(" ")}
                    onClick={() => handleDisplayMode(opt.value)}
                    title={opt.title}
                    aria-label={opt.title}
                    aria-pressed={displayMode === opt.value}
                  >
                    {opt.icon}
                  </button>
                ))}
                <span className="ef-rtp-header-sep" aria-hidden />
                <button type="button" className="ef-rtp-close-btn" onClick={onClose} aria-label="Fermer (Échap)" title="Fermer (Échap)">
                  <X size={15} aria-hidden />
                </button>
              </div>
            </header>

            {/* ── Tabs ── */}
            <nav className="ef-rtp-tabs" aria-label="Onglets d'édition">
              <button
                type="button"
                className={["ef-rtp-tab", activeTab === "content" ? "is-active" : ""].filter(Boolean).join(" ")}
                onClick={() => setActiveTab("content")}
                aria-selected={activeTab === "content"}
              >
                Contenu
              </button>
              <button
                type="button"
                className={["ef-rtp-tab", activeTab === "properties" ? "is-active" : ""].filter(Boolean).join(" ")}
                onClick={() => setActiveTab("properties")}
                aria-selected={activeTab === "properties"}
              >
                Propriétés
              </button>
            </nav>

            {/* ── Tab : Contenu ── */}
            {activeTab === "content" && (
              <div className="ef-rtp-content-tab">

                {/* Toolbar */}
                <div className="ef-rtp-toolbar" role="toolbar" aria-label="Barre de mise en forme">

                  {/* ── Styles ── */}
                  <RtpPopover
                    label="Styles"
                    icon={<Pilcrow size={13} aria-hidden />}
                    active={editor?.isActive("heading") || editor?.isActive("blockquote") || editor?.isActive("codeBlock")}
                  >
                    <div className="ef-rtp-popover-section">Styles de texte</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Texte normal"     active={editor?.isActive("paragraph")}               onClick={() => editor?.chain().focus().setParagraph().run()}                icon={<Pilcrow   size={13} />} />
                      <RtpActionBtn label="Titre 1"          active={editor?.isActive("heading", { level: 1 })}   onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1  size={13} />} />
                      <RtpActionBtn label="Titre 2"          active={editor?.isActive("heading", { level: 2 })}   onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2  size={13} />} />
                      <RtpActionBtn label="Titre 3"          active={editor?.isActive("heading", { level: 3 })}   onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3  size={13} />} />
                      <RtpActionBtn label="Sous-titre"       active={editor?.isActive("heading", { level: 4 })}   onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()} icon={<Type      size={13} />} />
                      <RtpActionBtn label="Citation"         active={editor?.isActive("blockquote")}              onClick={() => editor?.chain().focus().toggleBlockquote().run()}           icon={<Quote     size={13} />} />
                      <RtpActionBtn label="Code / Monospace" active={editor?.isActive("codeBlock")}               onClick={() => editor?.chain().focus().toggleCodeBlock().run()}            icon={<Code      size={13} />} />
                    </div>
                    <div className="ef-rtp-popover-section">Actions</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Réinitialiser le style" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} icon={<Eraser size={13} />} />
                      <RtpActionBtn label="Copier le style"        onClick={() => {}} disabled icon={<Code2  size={13} />} />
                      <RtpActionBtn label="Coller le style"        onClick={() => {}} disabled icon={<Code2  size={13} />} />
                    </div>
                  </RtpPopover>

                  {/* ── Texte ── */}
                  <RtpPopover
                    label="Texte"
                    icon={<Bold size={13} aria-hidden />}
                    active={
                      selectedVarAttrs
                        ? !!(selectedVarAttrs.bold || selectedVarAttrs.italic || selectedVarAttrs.underline || selectedVarAttrs.strike)
                        : !!(editor?.isActive("bold") || editor?.isActive("italic") || editor?.isActive("underline") || editor?.isActive("strike"))
                    }
                  >
                    <div className="ef-rtp-popover-section">Police</div>
                    <div className="ef-rtp-popover-grid">
                      <label className="ef-rtp-popover-field">
                        Famille
                        <select
                          className="ef-rtp-popover-select"
                          value={selectedVarAttrs ? (selectedVarAttrs.fontFamily ?? "") : (editor?.getAttributes("textStyle").fontFamily ?? "")}
                          onMouseDown={rememberSelection}
                          onChange={(e) => selectedVarAttrs ? applyVarStyle({ fontFamily: e.target.value || null }) : runOnSelection((te) => te.chain().setFontFamily(e.target.value).run())}
                        >
                          <option value="" disabled>Choisir</option>
                          <option value="Inter, system-ui, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Arial, sans-serif">Arial</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="Playfair Display, serif">Playfair Display</option>
                          <option value="'Courier New', Courier, monospace">Courier New</option>
                          <option value="ui-monospace, monospace">Monospace</option>
                        </select>
                      </label>
                      <label className="ef-rtp-popover-field">
                        Taille
                        <select
                          className="ef-rtp-popover-select"
                          value={selectedVarAttrs ? (selectedVarAttrs.fontSize ?? "") : (editor?.getAttributes("textStyle").fontSize ?? "")}
                          onMouseDown={rememberSelection}
                          onChange={(e) => selectedVarAttrs ? applyVarStyle({ fontSize: e.target.value || null }) : runOnSelection((te) => te.chain().setFontSize(e.target.value).run())}
                        >
                          <option value="" disabled>Choisir</option>
                          {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48].map((s) => (
                            <option key={s} value={`${s}px`}>{s}px</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="ef-rtp-popover-section">Format</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Gras"         active={selectedVarAttrs ? !!selectedVarAttrs.bold      : editor?.isActive("bold")}      onClick={() => selectedVarAttrs ? applyVarStyle({ bold:      !selectedVarAttrs.bold      || null }) : editor?.chain().focus().toggleBold().run()}      icon={<Bold            size={13} />} />
                      <RtpActionBtn label="Italique"     active={selectedVarAttrs ? !!selectedVarAttrs.italic    : editor?.isActive("italic")}    onClick={() => selectedVarAttrs ? applyVarStyle({ italic:    !selectedVarAttrs.italic    || null }) : editor?.chain().focus().toggleItalic().run()}    icon={<Italic          size={13} />} />
                      <RtpActionBtn label="Souligné"     active={selectedVarAttrs ? !!selectedVarAttrs.underline : editor?.isActive("underline")} onClick={() => selectedVarAttrs ? applyVarStyle({ underline: !selectedVarAttrs.underline || null }) : editor?.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon   size={13} />} />
                      <RtpActionBtn label="Barré"        active={selectedVarAttrs ? !!selectedVarAttrs.strike    : editor?.isActive("strike")}    onClick={() => selectedVarAttrs ? applyVarStyle({ strike:    !selectedVarAttrs.strike    || null }) : editor?.chain().focus().toggleStrike().run()}    icon={<Strikethrough   size={13} />} />
                      <RtpActionBtn label="Code inline"  active={!selectedVarAttrs && editor?.isActive("code")}  disabled={!!selectedVarAttrs}    onClick={() => editor?.chain().focus().toggleCode().run()}   icon={<Code            size={13} />} />
                      <RtpActionBtn label="Exposant"     disabled icon={<Type size={13} />} onClick={() => {}} />
                      <RtpActionBtn label="Indice"       disabled icon={<Type size={13} />} onClick={() => {}} />
                    </div>
                    <div className="ef-rtp-popover-section">Couleurs</div>
                    <div className="ef-rtp-popover-grid">
                      <label className="ef-rtp-popover-field">
                        Couleur du texte
                        <div className="ef-rtp-popover-color-row">
                          <input type="color" className="ef-rtp-popover-color-input" defaultValue="#111827" onMouseDown={rememberSelection} onChange={(e) => selectedVarAttrs ? applyVarStyle({ color: e.target.value }) : runOnSelection((te) => te.chain().setColor(e.target.value).run())} />
                          <span className="ef-rtp-popover-color-label">Couleur texte</span>
                        </div>
                      </label>
                      <label className="ef-rtp-popover-field">
                        Surlignage
                        <div className="ef-rtp-popover-color-row">
                          <input type="color" className="ef-rtp-popover-color-input" defaultValue="#fef08a" onMouseDown={rememberSelection} disabled={!!selectedVarAttrs} onChange={(e) => runOnSelection((te) => te.chain().setBackgroundColor(e.target.value).run())} />
                          <span className="ef-rtp-popover-color-label">Couleur fond</span>
                        </div>
                      </label>
                      <RtpActionBtn
                        label="Effacer couleurs"
                        onClick={() => selectedVarAttrs ? applyVarStyle({ color: null }) : runOnSelection((te) => te.chain().unsetColor().unsetBackgroundColor().run())}
                        icon={<Eraser size={13} />}
                      />
                      <RtpActionBtn
                        label="Effacer tous les formats"
                        onClick={() => selectedVarAttrs
                          ? applyVarStyle({ bold: null, italic: null, underline: null, strike: null, color: null, fontSize: null, fontFamily: null })
                          : editor?.chain().focus().unsetAllMarks().run()
                        }
                        icon={<Eraser size={13} />}
                      />
                    </div>
                  </RtpPopover>

                  {/* ── Paragraphe ── */}
                  <RtpPopover label="Paragraphe" icon={<AlignLeft size={13} aria-hidden />}>
                    <div className="ef-rtp-popover-section">Alignement</div>
                    <div className="ef-rtp-popover-align-row">
                      <RtpActionBtn label="Gauche"   active={editor?.isActive({ textAlign: "left"    })} onClick={() => editor?.chain().focus().setTextAlign("left").run()}    icon={<AlignLeft    size={14} />} />
                      <RtpActionBtn label="Centre"   active={editor?.isActive({ textAlign: "center"  })} onClick={() => editor?.chain().focus().setTextAlign("center").run()}  icon={<AlignCenter  size={14} />} />
                      <RtpActionBtn label="Droite"   active={editor?.isActive({ textAlign: "right"   })} onClick={() => editor?.chain().focus().setTextAlign("right").run()}   icon={<AlignRight   size={14} />} />
                      <RtpActionBtn label="Justifié" active={editor?.isActive({ textAlign: "justify" })} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} icon={<AlignJustify size={14} />} />
                    </div>
                    <div className="ef-rtp-popover-section">Espacement</div>
                    <div className="ef-rtp-popover-grid">
                      <label className="ef-rtp-popover-field">
                        Interligne
                        <select
                          className="ef-rtp-popover-select"
                          value={editor?.getAttributes("textStyle").lineHeight ?? ""}
                          onMouseDown={rememberSelection}
                          onChange={(e) => runOnSelection((te) => te.chain().setLineHeight(e.target.value).run())}
                        >
                          <option value="" disabled>Choisir</option>
                          {["1", "1.15", "1.25", "1.3", "1.5", "1.75", "2"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <label className="ef-rtp-popover-field">
                        Espacement avant (px)
                        <input type="number" className="ef-rtp-popover-input" disabled placeholder="—" />
                      </label>
                      <label className="ef-rtp-popover-field">
                        Espacement après (px)
                        <input type="number" className="ef-rtp-popover-input" disabled placeholder="—" />
                      </label>
                    </div>
                  </RtpPopover>

                  {/* ── Listes ── */}
                  <RtpPopover
                    label="Listes"
                    icon={<List size={13} aria-hidden />}
                    active={editor?.isActive("bulletList") || editor?.isActive("orderedList")}
                  >
                    <div className="ef-rtp-popover-section">Type de liste</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Liste à puces"    active={editor?.isActive("bulletList")}  onClick={() => editor?.chain().focus().toggleBulletList().run()}  icon={<List         size={13} />} />
                      <RtpActionBtn label="Liste numérotée"  active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} icon={<ListOrdered  size={13} />} />
                      <RtpActionBtn label="Checklist"        disabled onClick={() => {}}               icon={<LayoutList   size={13} />} />
                      <RtpActionBtn label="Alphabétique"     disabled onClick={() => {}}               icon={<ListOrdered  size={13} />} />
                      <RtpActionBtn label="Chiffres romains" disabled onClick={() => {}}               icon={<ListOrdered  size={13} />} />
                    </div>
                    <div className="ef-rtp-popover-section">Niveau</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Augmenter le niveau" onClick={() => editor?.chain().focus().sinkListItem("listItem").run()} disabled={!editor?.can().sinkListItem("listItem")} icon={<Plus  size={13} />} />
                      <RtpActionBtn label="Réduire le niveau"   onClick={() => editor?.chain().focus().liftListItem("listItem").run()} disabled={!editor?.can().liftListItem("listItem")} icon={<Minus size={13} />} />
                    </div>
                  </RtpPopover>

                  {/* ── Tableaux ── */}
                  <RtpPopover
                    label="Tableaux"
                    icon={<Table2 size={13} aria-hidden />}
                    active={editor?.isActive("table")}
                  >
                    {/* Tab switcher */}
                    <div className="ef-rtp-popover-tabs">
                      <button
                        type="button"
                        className={["ef-rtp-popover-tab", tableTab === "structure" ? "is-active" : ""].filter(Boolean).join(" ")}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setTableTab("structure")}
                      >
                        Structure
                      </button>
                      <button
                        type="button"
                        className={["ef-rtp-popover-tab", tableTab === "style" ? "is-active" : ""].filter(Boolean).join(" ")}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setTableTab("style")}
                      >
                        Style
                      </button>
                    </div>

                    {/* ── NIVEAU 1 — STRUCTURE ── */}
                    {tableTab === "structure" && (
                      <>
                        <div className="ef-rtp-popover-section">Insérer</div>
                        <TableInsertGrid
                          onInsert={(rows, cols) =>
                            editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
                          }
                        />
                        <div className="ef-rtp-popover-section">Lignes</div>
                        <div className="ef-rtp-popover-grid">
                          <RtpActionBtn label="Ligne au-dessus"  disabled={!editor?.can().addRowBefore()}  onClick={() => editor?.chain().focus().addRowBefore().run()} icon={<Rows3  size={13} />} />
                          <RtpActionBtn label="Ligne en-dessous" disabled={!editor?.can().addRowAfter()}   onClick={() => editor?.chain().focus().addRowAfter().run()}  icon={<Rows3  size={13} />} />
                          <RtpActionBtn label="Supprimer ligne"  disabled={!editor?.can().deleteRow()}     onClick={() => editor?.chain().focus().deleteRow().run()}    icon={<Trash2 size={13} />} />
                        </div>
                        <div className="ef-rtp-popover-section">Colonnes</div>
                        <div className="ef-rtp-popover-grid">
                          <RtpActionBtn label="Colonne à gauche"  disabled={!editor?.can().addColumnBefore()} onClick={() => editor?.chain().focus().addColumnBefore().run()} icon={<Columns3 size={13} />} />
                          <RtpActionBtn label="Colonne à droite"  disabled={!editor?.can().addColumnAfter()}  onClick={() => editor?.chain().focus().addColumnAfter().run()}  icon={<Columns3 size={13} />} />
                          <RtpActionBtn label="Supprimer colonne" disabled={!editor?.can().deleteColumn()}    onClick={() => editor?.chain().focus().deleteColumn().run()}    icon={<Trash2   size={13} />} />
                        </div>
                        <div className="ef-rtp-popover-section">Cellules</div>
                        <div className="ef-rtp-popover-grid">
                          <RtpActionBtn label="Fusionner"                disabled={!editor?.can().mergeCells()}  onClick={() => editor?.chain().focus().mergeCells().run()} icon={<TableCellsMerge size={13} />} />
                          <RtpActionBtn label="Fractionner"              disabled={!editor?.can().splitCell()}   onClick={() => editor?.chain().focus().splitCell().run()}  icon={<TableCellsSplit size={13} />} />
                          <RtpActionBtn label="Sélectionner le tableau" disabled={!inTableCtx}                  onClick={() => editor && execSelectTable(editor)}          icon={<Table2   size={13} />} />
                          <RtpActionBtn label="Sélectionner la ligne"   disabled={!inTableCtx}                  onClick={() => editor && execSelectRow(editor)}            icon={<Rows3    size={13} />} />
                          <RtpActionBtn label="Sélectionner la colonne" disabled={!inTableCtx}                  onClick={() => editor && execSelectColumn(editor)}         icon={<Columns3 size={13} />} />
                        </div>
                        <div className="ef-rtp-popover-section">Tableau</div>
                        <div className="ef-rtp-popover-grid">
                          <RtpActionBtn label="Supprimer le tableau" disabled={!editor?.can().deleteTable()} onClick={() => editor?.chain().focus().deleteTable().run()} icon={<Trash2 size={13} />} />
                        </div>
                      </>
                    )}

                    {/* ── NIVEAU 2 — STYLE ── */}
                    {tableTab === "style" && (
                      <>
                        <div className="ef-rtp-popover-section">Apparence</div>
                        <div className="ef-rtp-popover-grid">
                          <RtpActionBtn
                            label="Bordures"
                            active={inTableCtx && !!(getTableAttrs(editor)?.bordered)}
                            disabled={!inTableCtx}
                            onClick={() => { if (!editor) return; updateTableAttr(editor, { bordered: !getTableAttrs(editor)?.bordered }); }}
                            icon={<Table2 size={13} />}
                          />
                          <RtpActionBtn
                            label="Alternance"
                            active={inTableCtx && !!(getTableAttrs(editor)?.striped)}
                            disabled={!inTableCtx}
                            onClick={() => { if (!editor) return; updateTableAttr(editor, { striped: !getTableAttrs(editor)?.striped }); }}
                            icon={<Rows3 size={13} />}
                          />
                          <RtpActionBtn
                            label="Ligne en-tête"
                            disabled={!inTableCtx}
                            onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
                            icon={<Rows3 size={13} />}
                          />
                          <RtpActionBtn
                            label="1ère colonne"
                            disabled={!inTableCtx}
                            onClick={() => editor?.chain().focus().toggleHeaderColumn().run()}
                            icon={<Columns3 size={13} />}
                          />
                        </div>
                        <div className="ef-rtp-popover-grid">
                          <label className="ef-rtp-popover-field">
                            Couleur bordure
                            <div className="ef-rtp-popover-color-row">
                              <input
                                type="color"
                                className="ef-rtp-popover-color-input"
                                defaultValue="#cccccc"
                                disabled={!inTableCtx}
                                onChange={(e) => editor && updateTableAttr(editor, { borderColor: e.target.value })}
                              />
                              <span className="ef-rtp-popover-color-label">Bordure</span>
                            </div>
                          </label>
                          <label className="ef-rtp-popover-field">
                            Fond cellule
                            <div className="ef-rtp-popover-color-row">
                              <input
                                type="color"
                                className="ef-rtp-popover-color-input"
                                defaultValue="#ffffff"
                                disabled={!inTableCtx}
                                onChange={(e) => editor && updateCellAttr(editor, { backgroundColor: e.target.value })}
                              />
                              <span className="ef-rtp-popover-color-label">Cellule</span>
                            </div>
                          </label>
                          <label className="ef-rtp-popover-field">
                            Épaisseur (px)
                            <select
                              className="ef-rtp-popover-select"
                              disabled={!inTableCtx}
                              onChange={(e) => editor && updateTableAttr(editor, { borderWidth: e.target.value ? `${e.target.value}px` : null })}
                            >
                              <option value="">Auto</option>
                              {[1, 2, 3, 4].map((n) => (
                                <option key={n} value={String(n)}>{n}px</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="ef-rtp-popover-section">Dimensions</div>
                        <div className="ef-rtp-popover-grid">
                          <label className="ef-rtp-popover-field">
                            Largeur tableau (px)
                            <input
                              type="number"
                              className="ef-rtp-popover-input"
                              min={50}
                              max={2000}
                              placeholder="Auto"
                              disabled={!inTableCtx}
                              onBlur={(e) => editor && e.target.value && updateTableAttr(editor, { tableWidth: `${e.target.value}px` })}
                              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                            />
                          </label>
                          <label className="ef-rtp-popover-field">
                            Largeur colonne (px)
                            <input
                              type="number"
                              className="ef-rtp-popover-input"
                              min={20}
                              max={1000}
                              placeholder="Auto"
                              disabled={!inTableCtx}
                              onBlur={(e) => editor && e.target.value && setColumnWidth(editor, Number(e.target.value))}
                              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                            />
                          </label>
                          <label className="ef-rtp-popover-field">
                            Hauteur ligne (px)
                            <input
                              type="number"
                              className="ef-rtp-popover-input"
                              min={16}
                              max={500}
                              placeholder="Auto"
                              disabled={!inTableCtx}
                              onBlur={(e) => editor && e.target.value && updateRowAttr(editor, { rowHeight: `${e.target.value}px` })}
                              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                            />
                          </label>
                          <label className="ef-rtp-popover-field">
                            Align. vertical
                            <select
                              className="ef-rtp-popover-select"
                              disabled={!inTableCtx}
                              onChange={(e) => editor && updateCellAttr(editor, { verticalAlign: e.target.value || null })}
                            >
                              <option value="">Auto</option>
                              <option value="top">Haut</option>
                              <option value="middle">Milieu</option>
                              <option value="bottom">Bas</option>
                            </select>
                          </label>
                          <label className="ef-rtp-popover-field">
                            Marges cellule (px)
                            <input
                              type="number"
                              className="ef-rtp-popover-input"
                              min={0}
                              max={40}
                              placeholder="4"
                              disabled={!inTableCtx}
                              onBlur={(e) => editor && e.target.value !== "" && updateCellAttr(editor, { cellPadding: `${e.target.value}px` })}
                              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </RtpPopover>

                  {/* ── Insertion ── */}
                  <RtpPopover label="Insertion" icon={<Plus size={13} aria-hidden />}>
                    <div className="ef-rtp-popover-section">Éléments</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Séparateur horizontal" onClick={() => editor?.chain().focus().setHorizontalRule().run()} icon={<Minus size={13} />} />
                      <RtpActionBtn label="Saut de ligne"         onClick={() => editor?.chain().focus().setHardBreak().run()}      icon={<Plus  size={13} />} />
                      <RtpActionBtn label="Saut de page"          disabled onClick={() => {}}                                       icon={<Plus  size={13} />} />
                    </div>
                    <div className="ef-rtp-popover-section">Lien</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn
                        label={editor?.isActive("link") ? "Modifier le lien" : "Insérer un lien"}
                        onClick={() => promptLink(editor)}
                        icon={<Code2 size={13} />}
                      />
                    </div>
                    <div className="ef-rtp-popover-section">Médias</div>
                    <div className="ef-rtp-popover-grid">
                      <RtpActionBtn label="Image"  disabled onClick={() => {}} icon={<Plus size={13} />} />
                      <RtpActionBtn label="Icône"  disabled onClick={() => {}} icon={<Plus size={13} />} />
                    </div>
                  </RtpPopover>

                  {/* ── Variables ── */}
                  <RtpPopover label="Variables" icon={<Braces size={13} aria-hidden />}>
                    <div className="ef-rtp-var-search-wrap">
                      <Search size={11} className="ef-rtp-var-search-icon" aria-hidden />
                      <input
                        type="search"
                        className="ef-rtp-var-search"
                        placeholder="Rechercher…"
                        value={varSearch}
                        onChange={(e) => setVarSearch(e.target.value)}
                        aria-label="Rechercher une variable"
                      />
                    </div>
                    {filteredVars.length === 0 ? (
                      <p className="ef-rtp-var-empty">
                        {variableRegistry.entries.length === 0 ? "Aucune variable disponible" : "Aucun résultat"}
                      </p>
                    ) : (
                      <div className="ef-rtp-popover-grid">
                        {filteredVars.map((entry) => (
                          <RtpActionBtn
                            key={entry.id}
                            label={entry.label}
                            icon={<Braces size={12} />}
                            onClick={() =>
                              runOnSelection((te) => {
                                insertVariableTokenIntoRichTextEditor(
                                  te,
                                  { key: entry.key, label: entry.label, sampleValue: entry.sampleValue, sourceColumn: entry.sourceColumn },
                                  te.state.selection,
                                  variableRegistry,
                                );
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </RtpPopover>
                </div>

                {/* Editor area */}
                <div
                  className="ef-rtp-editor"
                  onDragOverCapture={(event: DragEvent<HTMLDivElement>) => {
                    const ctx = useEditorStore.getState().dragTraceContext;
                    const types = Array.from(event.dataTransfer?.types ?? []);
                    if (!(ctx?.type === "variable" || types.includes("application/x-resume-editor-item"))) return;
                    event.preventDefault();
                    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
                  }}
                  onDropCapture={(event: DragEvent<HTMLDivElement>) => {
                    const ctx = useEditorStore.getState().dragTraceContext;
                    const raw = event.dataTransfer?.getData("application/x-resume-editor-item") ?? "";
                    const payload = parseVarDropPayload(raw, ctx);
                    if (!payload || !editor) return;
                    event.preventDefault();
                    event.stopPropagation();
                    handledVarDropSessionRef.current = ctx?.sessionId ?? "__handled__";
                    const pos = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                    const insertAt = typeof pos === "number" ? { from: pos, to: pos } : { from: editor.state.selection.from, to: editor.state.selection.to };
                    insertVariableTokenIntoRichTextEditor(viewToInsertionTarget(editor.view), payload.payload, insertAt, variableRegistry);
                    editor.commands.focus();
                  }}
                >
                  <EditorContent editor={editor} />
                </div>
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
                        type="number" min={0} max={200}
                        className="ef-rtp-input"
                        value={paddingTop}
                        onChange={(e) => patchContainerProp({ paddingTop: Math.max(0, Number(e.target.value)) })}
                      />
                    </label>
                    <label className="ef-rtp-field" style={{ gridArea: "right" }}>
                      <span>Droite</span>
                      <input
                        type="number" min={0} max={200}
                        className="ef-rtp-input"
                        value={paddingRight}
                        onChange={(e) => patchContainerProp({ paddingRight: Math.max(0, Number(e.target.value)) })}
                      />
                    </label>
                    <label className="ef-rtp-field" style={{ gridArea: "bottom" }}>
                      <span>Bas</span>
                      <input
                        type="number" min={0} max={200}
                        className="ef-rtp-input"
                        value={paddingBottom}
                        onChange={(e) => patchContainerProp({ paddingBottom: Math.max(0, Number(e.target.value)) })}
                      />
                    </label>
                    <label className="ef-rtp-field" style={{ gridArea: "left" }}>
                      <span>Gauche</span>
                      <input
                        type="number" min={0} max={200}
                        className="ef-rtp-input"
                        value={paddingLeft}
                        onChange={(e) => patchContainerProp({ paddingLeft: Math.max(0, Number(e.target.value)) })}
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
                      type="number" min={0} max={999}
                      className="ef-rtp-input"
                      value={element?.style?.cornerRadius ?? 0}
                      onChange={(e) => patchStyle({ cornerRadius: Math.max(0, Number(e.target.value)) })}
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
                        type="number" min={0} max={20}
                        className="ef-rtp-input"
                        value={stylePreview?.strokeWidth ?? 0}
                        onChange={(e) => patchStyle({ strokeWidth: Math.max(0, Number(e.target.value)) })}
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
                  <label className="ef-rtp-field">
                    <span>Couleur</span>
                    <div className="ef-rtp-color-field">
                      <input
                        type="color"
                        className="ef-rtp-color-input"
                        value={resolveColorInput(stylePreview?.stroke)}
                        onChange={(e) => patchStyle({ stroke: e.target.value })}
                        title="Couleur de la bordure"
                      />
                      <span className="ef-rtp-color-value">{stylePreview?.stroke ?? "—"}</span>
                    </div>
                  </label>
                </section>

                {/* Opacité */}
                <section className="ef-rtp-prop-group">
                  <h3 className="ef-rtp-prop-group-title">Opacité — {Math.round((stylePreview?.opacity ?? 1) * 100)}%</h3>
                  <input
                    type="range" min={0} max={1} step={0.01}
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

function getTableCtx(editor: Editor) {
  if (!isInTable(editor.state)) return null;
  try {
    const $cell = selectionCell(editor.state);
    const table = $cell.node(-1);
    const tableStart = $cell.start(-1);
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
  } catch { /* merged-cell edge case */ }
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
  } catch { /* merged-cell edge case */ }
}

function execSelectColumn(editor: Editor): void {
  const ctx = getTableCtx(editor);
  if (!ctx) return;
  const { map, tableStart, $cell } = ctx;
  try {
    const { left } = findCell($cell);
    const $anchor = editor.state.doc.resolve(tableStart + map.map[left]);
    const $head = editor.state.doc.resolve(tableStart + map.map[(map.height - 1) * map.width + left]);
    editor.view.dispatch(editor.state.tr.setSelection(new CellSelection($anchor, $head)));
    editor.view.focus();
  } catch { /* merged-cell edge case */ }
}

// ── Table style helpers ──────────────────────────────────────────────────────

function getTableAttrs(editor: Editor | null): RtpTableStyleAttrs | null {
  if (!editor || !isInTable(editor.state)) return null;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === 'table') return $cell.node(d).attrs as RtpTableStyleAttrs;
    }
    return null;
  } catch { return null; }
}

function updateTableAttr(editor: Editor, attrPatch: Record<string, unknown>): void {
  if (!isInTable(editor.state)) return;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === 'table') {
        const { tr } = editor.state;
        tr.setNodeMarkup($cell.before(d), undefined, { ...$cell.node(d).attrs, ...attrPatch });
        editor.view.dispatch(tr);
        editor.view.focus();
        return;
      }
    }
  } catch {}
}

function updateCellAttr(editor: Editor, attrPatch: Record<string, unknown>): void {
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
        if (name === 'tableCell' || name === 'tableHeader') {
          tr.setNodeMarkup($from.before(d), undefined, { ...$from.node(d).attrs, ...attrPatch });
          break;
        }
      }
    }
    editor.view.dispatch(tr);
    editor.view.focus();
  } catch {}
}

function updateRowAttr(editor: Editor, attrPatch: Record<string, unknown>): void {
  if (!isInTable(editor.state)) return;
  try {
    const $cell = selectionCell(editor.state);
    for (let d = $cell.depth; d > 0; d--) {
      if ($cell.node(d).type.name === 'tableRow') {
        const { tr } = editor.state;
        tr.setNodeMarkup($cell.before(d), undefined, { ...$cell.node(d).attrs, ...attrPatch });
        editor.view.dispatch(tr);
        editor.view.focus();
        return;
      }
    }
  } catch {}
}

function setColumnWidth(editor: Editor, widthPx: number): void {
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
      const existing = Array.isArray(cellNode.attrs.colwidth) ? cellNode.attrs.colwidth as number[] : [];
      const newColwidth = [widthPx, ...existing.slice(1)];
      tr.setNodeMarkup(cellPos, undefined, { ...cellNode.attrs, colwidth: newColwidth });
    }
    editor.view.dispatch(tr);
    editor.view.focus();
  } catch {}
}

// ── Color / drag helpers ─────────────────────────────────────────────────────

function resolveColorInput(value: string | undefined): string {
  if (!value) return "#000000";
  if (/^#[0-9a-f]{3,6}$/i.test(value)) return value;
  return "#000000";
}

function parseVarDropPayload(raw: string, context: { type: string; payload: unknown; sourcePanel?: string } | null): VariableDragEnvelope | null {
  const parsed = raw.trim().length > 0 ? parseEditorItemDragPayload(raw) : null;
  if (parsed?.type === "variable") return parsed as VariableDragEnvelope;
  if (context?.type === "variable") return { type: "variable", payload: context.payload, sourcePanel: context.sourcePanel } as VariableDragEnvelope;
  return null;
}

function viewToInsertionTarget(rawView: unknown): import("@/features/editor/renderers/konva-renderer/rich-text-drop-utils").RichTextEditorInsertionTarget {
  const view = rawView as {
    state: {
      selection: { from: number; to: number };
      doc: { content: { size: number } };
      schema: { nodes: { variable: { create: (attrs: Record<string, unknown>) => unknown } } };
      tr: { replaceRangeWith: (from: number, to: number, node: unknown) => { scrollIntoView: () => unknown } };
    };
    dispatch: (transaction: unknown) => void;
    focus: () => void;
  };
  return {
    state: view.state as import("@/features/editor/renderers/konva-renderer/rich-text-drop-utils").RichTextEditorInsertionTarget["state"],
    commands: {
      focus: () => view.focus(),
      insertContentAt: (position, content) => {
        const node = view.state.schema.nodes.variable.create(content.attrs);
        const tx = view.state.tr.replaceRangeWith(position.from, position.to, node).scrollIntoView();
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
  if (!url.trim()) { editor.chain().focus().unsetLink().run(); return; }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TableInsertGrid({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [hovered, setHovered] = useState({ r: 0, c: 0 });
  const COLS = 10, ROWS = 10;
  return (
    <div className="ef-rtp-tg-wrap">
      <div className="ef-rtp-tg" onMouseLeave={() => setHovered({ r: 0, c: 0 })}>
        {Array.from({ length: ROWS }, (_, ri) =>
          Array.from({ length: COLS }, (_, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={["ef-rtp-tg-cell", ri < hovered.r && ci < hovered.c ? "is-hovered" : ""].filter(Boolean).join(" ")}
              onMouseEnter={() => setHovered({ r: ri + 1, c: ci + 1 })}
              onClick={() => hovered.r > 0 && hovered.c > 0 && onInsert(hovered.r, hovered.c)}
            />
          ))
        ).flat()}
      </div>
      <div className="ef-rtp-tg-label">
        {hovered.r > 0 && hovered.c > 0 ? `${hovered.c} × ${hovered.r}` : "Survolez pour insérer"}
      </div>
    </div>
  );
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
