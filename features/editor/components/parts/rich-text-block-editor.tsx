"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code,
  Code2,
  Columns3,
  Eraser,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  Palette,
  Pilcrow,
  Plus,
  Quote,
  Rows3,
  Strikethrough,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  Tag,
  Trash2,
  Type,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
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
import { createRichTextVariableNodeViewExtension, RichTextVariableDatasetContext, RichTextVariableDisplayModeContext, RichTextVariableRegistryContext } from "@/features/editor/components/parts/rich-text-variable-node-view";
import { useRichTextLinkEditor } from "@/features/editor/lib/rich-text-link";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import { insertVariableTokenIntoRichTextEditor } from "@/features/editor/renderers/konva-renderer/rich-text-drop-utils";

type RichTextBlockEditorProps = {
  blockId: string;
  contentStyle?: CSSProperties;
  initialHtml?: string;
  initialJson?: JSONContent | null;
  initialDisplayMode?: RichTextVariableDisplayMode;
  onCancel: () => void;
  onSave: (input: { html: string; json: JSONContent; displayMode: RichTextVariableDisplayMode }) => void;
};

type RichTextEditorWindowBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const RICH_TEXT_EDITOR_MIN_WIDTH = 640;
const RICH_TEXT_EDITOR_MIN_HEIGHT = 440;
const RICH_TEXT_EDITOR_DEFAULT_WIDTH = 920;
const RICH_TEXT_EDITOR_DEFAULT_HEIGHT = 680;
const RICH_TEXT_EDITOR_EDGE_PADDING = 24;

function resolveInitialRichTextEditorBounds(): RichTextEditorWindowBounds {
  if (typeof window === "undefined") {
    return {
      left: 48,
      top: 56,
      width: RICH_TEXT_EDITOR_DEFAULT_WIDTH,
      height: RICH_TEXT_EDITOR_DEFAULT_HEIGHT,
    };
  }

  const maxWidth = Math.max(RICH_TEXT_EDITOR_MIN_WIDTH, window.innerWidth - RICH_TEXT_EDITOR_EDGE_PADDING * 2);
  const maxHeight = Math.max(RICH_TEXT_EDITOR_MIN_HEIGHT, window.innerHeight - RICH_TEXT_EDITOR_EDGE_PADDING * 2);
  const width = Math.min(RICH_TEXT_EDITOR_DEFAULT_WIDTH, maxWidth);
  const height = Math.min(RICH_TEXT_EDITOR_DEFAULT_HEIGHT, maxHeight);
  return {
    left: Math.max(RICH_TEXT_EDITOR_EDGE_PADDING, Math.round((window.innerWidth - width) / 2)),
    top: Math.max(RICH_TEXT_EDITOR_EDGE_PADDING, Math.round((window.innerHeight - height) / 2)),
    width,
    height,
  };
}

function clampRichTextEditorBounds(bounds: RichTextEditorWindowBounds): RichTextEditorWindowBounds {
  if (typeof window === "undefined") {
    return bounds;
  }

  const maxWidth = Math.max(RICH_TEXT_EDITOR_MIN_WIDTH, window.innerWidth - RICH_TEXT_EDITOR_EDGE_PADDING * 2);
  const maxHeight = Math.max(RICH_TEXT_EDITOR_MIN_HEIGHT, window.innerHeight - RICH_TEXT_EDITOR_EDGE_PADDING * 2);
  const width = Math.max(RICH_TEXT_EDITOR_MIN_WIDTH, Math.min(bounds.width, maxWidth));
  const height = Math.max(RICH_TEXT_EDITOR_MIN_HEIGHT, Math.min(bounds.height, maxHeight));
  const left = Math.max(
    RICH_TEXT_EDITOR_EDGE_PADDING,
    Math.min(bounds.left, Math.max(RICH_TEXT_EDITOR_EDGE_PADDING, window.innerWidth - width - RICH_TEXT_EDITOR_EDGE_PADDING)),
  );
  const top = Math.max(
    RICH_TEXT_EDITOR_EDGE_PADDING,
    Math.min(bounds.top, Math.max(RICH_TEXT_EDITOR_EDGE_PADDING, window.innerHeight - height - RICH_TEXT_EDITOR_EDGE_PADDING)),
  );

  return { left, top, width, height };
}

export function RichTextBlockEditor({ blockId, contentStyle, initialHtml, initialJson, initialDisplayMode, onCancel, onSave }: RichTextBlockEditorProps) {
  const lastTextSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const dragTraceSessionRef = useRef<string | null>(null);
  const handledVariableDropSessionRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  const resizeSessionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const activePageId = useEditorStore((state) => state.activePageId);
  const dragTraceContext = useEditorStore((state) => state.dragTraceContext);
  const appendOperationLogs = useEditorStore((state) => state.appendOperationLogs);
  const variables = useVariablesStore((state) => state.variables);
  const source = useVariablesStore((state) => state.source);
  const variableRegistry = useMemo<RichTextVariableRegistry>(() => createRichTextVariableRegistry(variables), [variables]);
  const variableDataset = source?.rows[0] ?? null;
  const [displayMode, setDisplayMode] = useState<RichTextVariableDisplayMode>(initialDisplayMode ?? "label");
  const [windowBounds, setWindowBounds] = useState<RichTextEditorWindowBounds>(() => resolveInitialRichTextEditorBounds());
  const initialContent = useMemo(() => {
    if (initialJson) {
      return initialJson;
    }

    return parseRichTextHtmlToJson(initialHtml ?? "<p></p>", variableRegistry);
  }, [initialHtml, initialJson, variableRegistry]);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyleKit.configure({
        backgroundColor: {
          types: ["textStyle"],
        },
        color: {
          types: ["textStyle"],
        },
        fontFamily: {
          types: ["textStyle"],
        },
        fontSize: {
          types: ["textStyle"],
        },
        lineHeight: {
          types: ["textStyle"],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      createRichTextVariableNodeViewExtension().configure({
        registry: variableRegistry,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "ef-rich-text-editor-content",
        "aria-label": "Contenu du bloc Rich Text",
      },
      handleDOMEvents: {
        dragover: (_, event) => {
          const context = useEditorStore.getState().dragTraceContext;
          const dataTransfer = event.dataTransfer;
          const types = Array.from(dataTransfer?.types ?? []);
          const canAcceptVariable = context?.type === "variable" || types.includes("application/x-resume-editor-item");
          if (!canAcceptVariable) {
            return false;
          }

          event.preventDefault();
          if (dataTransfer) {
            dataTransfer.dropEffect = "copy";
          }
          if (context?.type === "variable" && dragTraceSessionRef.current !== context.sessionId) {
            dragTraceSessionRef.current = context.sessionId;
            appendOperationLogs([
              buildVariableDragOperationLog(context, {
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
        const context = useEditorStore.getState().dragTraceContext;
        if (context?.type === "variable" && handledVariableDropSessionRef.current === context.sessionId) {
          return false;
        }

        const raw = event.dataTransfer?.getData("application/x-resume-editor-item") ?? "";
        const payload = parseRichTextVariableDropPayload(raw, context);
        if (!payload) {
          if (context?.type === "variable") {
            appendOperationLogs([
              buildVariableDragOperationLog(context, {
                action: "drop-reject",
                pageId: activePageId,
                target: `Rich Text (${blockId})`,
                outcome: "rejeté",
                reason: "payload manquant",
              }),
            ]);
          }
          dragTraceSessionRef.current = null;
          handledVariableDropSessionRef.current = null;
          return false;
        }

        event.preventDefault();
        const dropPosition = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        const insertionResult = insertVariableTokenIntoRichTextEditor(
          viewToInsertionTarget(view),
          payload.payload,
          typeof dropPosition === "number"
            ? { from: dropPosition, to: dropPosition }
            : {
                from: view.state.selection.from,
                to: view.state.selection.to,
              },
          variableRegistry,
        );
        if (!insertionResult.inserted) {
          return false;
        }
        if (context?.type === "variable") {
          appendOperationLogs([
            buildVariableDragOperationLog(context, {
              action: "drop",
              pageId: activePageId,
              target: `Rich Text (${blockId})`,
              outcome: "accepté",
            }),
          ]);
        }
        dragTraceSessionRef.current = null;
        handledVariableDropSessionRef.current = null;
        return true;
      },
    },
    immediatelyRender: false,
  });
  const linkEditor = useRichTextLinkEditor(editor);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setWindowBounds((current) => clampRichTextEditorBounds(current));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const beginWindowDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if ((event.target as HTMLElement | null)?.closest("button, select, input, textarea, [role='button']")) {
      return;
    }

    const panel = panelRef.current;
    if (!panel || typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = panel.getBoundingClientRect();
    dragSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const onMove = (moveEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || moveEvent.pointerId !== session.pointerId) {
        return;
      }

      moveEvent.preventDefault();
      const nextBounds = clampRichTextEditorBounds({
        left: session.startLeft + (moveEvent.clientX - session.startX),
        top: session.startTop + (moveEvent.clientY - session.startY),
        width: windowBounds.width,
        height: windowBounds.height,
      });
      setWindowBounds(nextBounds);
    };

    const onEnd = () => {
      dragSessionRef.current = null;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }, [windowBounds.height, windowBounds.width]);

  const beginWindowResize = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    const panel = panelRef.current;
    if (!panel || typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = panel.getBoundingClientRect();
    resizeSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    };

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const onMove = (moveEvent: PointerEvent) => {
      const session = resizeSessionRef.current;
      if (!session || moveEvent.pointerId !== session.pointerId) {
        return;
      }

      moveEvent.preventDefault();
      const nextBounds = clampRichTextEditorBounds({
        left: windowBounds.left,
        top: windowBounds.top,
        width: session.startWidth + (moveEvent.clientX - session.startX),
        height: session.startHeight + (moveEvent.clientY - session.startY),
      });
      setWindowBounds(nextBounds);
    };

    const onEnd = () => {
      resizeSessionRef.current = null;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }, [windowBounds.left, windowBounds.top]);

  useEffect(() => {
    if (!dragTraceContext) {
      handledVariableDropSessionRef.current = null;
    }
  }, [dragTraceContext]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(initialContent);
  }, [editor, initialContent, blockId]);

  const [selectedVarAttrs, setSelectedVarAttrs] = useState<RichTextVariableNodeAttrs | null>(null);

  useEffect(() => {
    if (!editor) return;

    const syncVariableSelection = () => {
      const sel = editor.state.selection;
      if (sel instanceof NodeSelection && sel.node.type.name === "variable") {
        setSelectedVarAttrs(sel.node.attrs as unknown as RichTextVariableNodeAttrs);
      } else {
        setSelectedVarAttrs(null);
      }
    };

    editor.on("selectionUpdate", syncVariableSelection);
    editor.on("transaction", syncVariableSelection);

    return () => {
      editor.off("selectionUpdate", syncVariableSelection);
      editor.off("transaction", syncVariableSelection);
    };
  }, [editor]);

  const applyVariableStyle = useCallback((patch: Partial<RichTextVariableNodeAttrs>) => {
    if (!editor) return;
    const sel = editor.state.selection;
    if (!(sel instanceof NodeSelection) || sel.node.type.name !== "variable") return;
    const { tr } = editor.state;
    tr.setNodeMarkup(sel.from, undefined, { ...sel.node.attrs, ...patch });
    editor.view.dispatch(tr);
    editor.view.focus();
  }, [editor]);

  const rememberTextSelection = useCallback(() => {
    if (!editor) {
      return;
    }

    const { from, to } = editor.state.selection;
    lastTextSelectionRef.current = { from, to };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.on("selectionUpdate", rememberTextSelection);
    editor.on("focus", rememberTextSelection);

    return () => {
      editor.off("selectionUpdate", rememberTextSelection);
      editor.off("focus", rememberTextSelection);
    };
  }, [editor, rememberTextSelection]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleRichTextVariableInsert = (event: Event) => {
      const customEvent = event as CustomEvent<VariableDragEnvelope["payload"]>;
      const payload = customEvent.detail;
      if (!payload) {
        return;
      }

      insertVariableTokenIntoRichTextEditor(editor, payload, lastTextSelectionRef.current ?? editor.state.selection, variableRegistry);
      rememberTextSelection();
    };

    window.addEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handleRichTextVariableInsert as EventListener);

    return () => {
      window.removeEventListener(RICH_TEXT_VARIABLE_INSERT_EVENT, handleRichTextVariableInsert as EventListener);
    };
  }, [editor, rememberTextSelection, variableRegistry]);

  const runOnTextSelection = useCallback(
    (command: (targetEditor: Editor) => void) => {
      if (!editor) {
        return;
      }

      const savedSelection = lastTextSelectionRef.current;
      if (savedSelection && savedSelection.to <= editor.state.doc.content.size) {
        editor.chain().focus().setTextSelection(savedSelection).run();
      } else {
        editor.commands.focus();
      }

      command(editor);
      rememberTextSelection();
    },
    [editor, rememberTextSelection],
  );

  const handleSave = useCallback(() => {
    if (!editor) {
      return;
    }

    const json = editor.getJSON();
    const html = serializeRichTextJsonToHtml(json, {
      displayMode,
      registry: variableRegistry,
      dataset: variableDataset,
    });

    onSave({
      html,
      json,
      displayMode,
    });
  }, [displayMode, editor, onSave, variableDataset, variableRegistry]);

  return (
    <RichTextVariableDisplayModeContext.Provider value={displayMode}>
      <RichTextVariableRegistryContext.Provider value={variableRegistry}>
        <RichTextVariableDatasetContext.Provider value={variableDataset}>
          <div className="ef-rich-text-editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
            <div
              ref={panelRef}
              className="ef-rich-text-editor-panel"
              role="dialog"
              aria-label="Éditeur Rich Text"
              aria-modal="true"
              data-rich-text-editor-id={blockId}
              style={{
                left: `${windowBounds.left}px`,
                top: `${windowBounds.top}px`,
                width: `${windowBounds.width}px`,
                height: `${windowBounds.height}px`,
              }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="ef-rich-text-editor-windowbar">
                <div className="ef-rich-text-editor-title-block" onPointerDown={beginWindowDrag} role="presentation">
                  <strong>Éditer le bloc Rich Text</strong>
                  <span>{blockId}</span>
                </div>
                <div className="ef-rich-text-editor-window-actions">
                  {(
                    [
                      { value: "label", icon: <Tag size={14} aria-hidden="true" />, title: "Variables [Nom]" },
                      { value: "value", icon: <Eye size={14} aria-hidden="true" />, title: "Valeurs réelles" },
                      { value: "technical", icon: <Code2 size={14} aria-hidden="true" />, title: "Technique {{clé}}" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={["ef-rich-text-editor-mode-icon-button", displayMode === option.value ? "is-active" : ""].filter(Boolean).join(" ")}
                      aria-pressed={displayMode === option.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => setDisplayMode(option.value)}
                      title={option.title}
                      aria-label={option.title}
                    >
                      {option.icon}
                    </button>
                  ))}
                  <div className="ef-rich-text-editor-window-separator" />
                  <button type="button" className="ef-rich-text-editor-icon-button" onClick={onCancel} aria-label="Fermer" title="Fermer">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="ef-rich-text-editor-body">
              <div className="ef-rich-text-editor-toolbar" aria-label="Formatage Rich Text">
                {/* ─── Paragraphe + Listes ─── */}
                <RichTextToolbarPopover
                  label="Paragraphe"
                  icon={<Pilcrow size={15} aria-hidden="true" />}
                  active={editor?.isActive("heading") || editor?.isActive("blockquote") || editor?.isActive("codeBlock") || editor?.isActive("bulletList") || editor?.isActive("orderedList")}
                >
                  <RichTextEditorToolbarButton label="Normal" active={editor?.isActive("paragraph")} onClick={() => editor?.chain().focus().setParagraph().run()} icon={<Pilcrow size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Titre 1" active={editor?.isActive("heading", { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Titre 2" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Titre 3" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Citation" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()} icon={<Quote size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Code bloc" active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} icon={<Code size={15} aria-hidden="true" />} />
                  <div className="ef-rich-text-editor-popover-section">Listes</div>
                  <RichTextEditorToolbarButton label="Liste à puces" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} icon={<List size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Liste numérotée" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} icon={<ListOrdered size={15} aria-hidden="true" />} />
                </RichTextToolbarPopover>

                {/* ─── Format inline ─── */}
                <RichTextToolbarPopover
                  label="Format"
                  icon={<Bold size={15} aria-hidden="true" />}
                  active={
                    selectedVarAttrs
                      ? !!(selectedVarAttrs.bold || selectedVarAttrs.italic || selectedVarAttrs.underline || selectedVarAttrs.strike)
                      : !!(editor?.isActive("bold") || editor?.isActive("italic") || editor?.isActive("underline") || editor?.isActive("strike") || editor?.isActive("code"))
                  }
                >
                  <RichTextEditorToolbarButton
                    label="Gras"
                    active={selectedVarAttrs ? !!selectedVarAttrs.bold : editor?.isActive("bold")}
                    onClick={() => selectedVarAttrs ? applyVariableStyle({ bold: !selectedVarAttrs.bold || null }) : editor?.chain().focus().toggleBold().run()}
                    icon={<Bold size={15} aria-hidden="true" />}
                  />
                  <RichTextEditorToolbarButton
                    label="Italique"
                    active={selectedVarAttrs ? !!selectedVarAttrs.italic : editor?.isActive("italic")}
                    onClick={() => selectedVarAttrs ? applyVariableStyle({ italic: !selectedVarAttrs.italic || null }) : editor?.chain().focus().toggleItalic().run()}
                    icon={<Italic size={15} aria-hidden="true" />}
                  />
                  <RichTextEditorToolbarButton
                    label="Souligné"
                    active={selectedVarAttrs ? !!selectedVarAttrs.underline : editor?.isActive("underline")}
                    onClick={() => selectedVarAttrs ? applyVariableStyle({ underline: !selectedVarAttrs.underline || null }) : editor?.chain().focus().toggleUnderline().run()}
                    icon={<UnderlineIcon size={15} aria-hidden="true" />}
                  />
                  <RichTextEditorToolbarButton
                    label="Barré"
                    active={selectedVarAttrs ? !!selectedVarAttrs.strike : editor?.isActive("strike")}
                    onClick={() => selectedVarAttrs ? applyVariableStyle({ strike: !selectedVarAttrs.strike || null }) : editor?.chain().focus().toggleStrike().run()}
                    icon={<Strikethrough size={15} aria-hidden="true" />}
                  />
                  <RichTextEditorToolbarButton label="Code inline" active={!selectedVarAttrs && editor?.isActive("code")} disabled={!!selectedVarAttrs} onClick={() => editor?.chain().focus().toggleCode().run()} icon={<Code size={15} aria-hidden="true" />} />
                  <div className="ef-rich-text-editor-popover-section">Nettoyer</div>
                  <RichTextEditorToolbarButton
                    label="Effacer formats"
                    onClick={() => selectedVarAttrs
                      ? applyVariableStyle({ bold: null, italic: null, underline: null, strike: null, color: null, fontSize: null, fontFamily: null })
                      : editor?.chain().focus().unsetAllMarks().clearNodes().run()
                    }
                    icon={<Eraser size={15} aria-hidden="true" />}
                  />
                </RichTextToolbarPopover>

                {/* ─── Police ─── */}
                <RichTextToolbarPopover label="Police" icon={<Type size={15} aria-hidden="true" />}>
                  <label className="ef-rich-text-editor-field">
                    Police
                    <select
                      value={selectedVarAttrs ? (selectedVarAttrs.fontFamily ?? "") : (editor?.getAttributes("textStyle").fontFamily ?? "")}
                      onMouseDown={rememberTextSelection}
                      onFocus={rememberTextSelection}
                      onChange={(e) => selectedVarAttrs ? applyVariableStyle({ fontFamily: e.target.value || null }) : runOnTextSelection((te) => te.chain().setFontFamily(e.target.value).run())}
                    >
                      <option value="" disabled>Choisir</option>
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Playfair Display, serif">Playfair Display</option>
                      <option value="'Courier New', Courier, monospace">Courier New</option>
                      <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Monospace</option>
                    </select>
                  </label>
                  <label className="ef-rich-text-editor-field">
                    Taille
                    <select
                      value={selectedVarAttrs ? (selectedVarAttrs.fontSize ?? "") : (editor?.getAttributes("textStyle").fontSize ?? "")}
                      onMouseDown={rememberTextSelection}
                      onFocus={rememberTextSelection}
                      onChange={(e) => selectedVarAttrs ? applyVariableStyle({ fontSize: e.target.value || null }) : runOnTextSelection((te) => te.chain().setFontSize(e.target.value).run())}
                    >
                      <option value="" disabled>Choisir</option>
                      {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48].map((size) => (
                        <option key={size} value={`${size}px`}>{size}px</option>
                      ))}
                    </select>
                  </label>
                  <label className="ef-rich-text-editor-field">
                    Interligne
                    <select value={editor?.getAttributes("textStyle").lineHeight ?? ""} onMouseDown={rememberTextSelection} onFocus={rememberTextSelection} onChange={(e) => runOnTextSelection((te) => te.chain().setLineHeight(e.target.value).run())} disabled={!!selectedVarAttrs}>
                      <option value="" disabled>Choisir</option>
                      {["1", "1.15", "1.25", "1.3", "1.5", "1.75", "2"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                </RichTextToolbarPopover>

                {/* ─── Couleur ─── */}
                <RichTextToolbarPopover label="Couleur" icon={<Palette size={15} aria-hidden="true" />}>
                  <label className="ef-rich-text-editor-color-field">
                    Couleur texte
                    <input
                      type="color"
                      defaultValue="#111827"
                      onMouseDown={rememberTextSelection}
                      onFocus={rememberTextSelection}
                      onChange={(e) => selectedVarAttrs ? applyVariableStyle({ color: e.target.value }) : runOnTextSelection((te) => te.chain().setColor(e.target.value).run())}
                    />
                  </label>
                  <label className="ef-rich-text-editor-color-field">
                    Surlignage
                    <input type="color" defaultValue="#fff2a8" onMouseDown={rememberTextSelection} onFocus={rememberTextSelection} onChange={(e) => runOnTextSelection((te) => te.chain().setBackgroundColor(e.target.value).run())} disabled={!!selectedVarAttrs} />
                  </label>
                  <RichTextEditorToolbarButton
                    label="Retirer couleur"
                    onClick={() => selectedVarAttrs ? applyVariableStyle({ color: null }) : runOnTextSelection((te) => te.chain().unsetColor().unsetBackgroundColor().run())}
                    icon={<Eraser size={15} aria-hidden="true" />}
                  />
                </RichTextToolbarPopover>

                <div className="ef-rich-text-editor-toolbar-divider" aria-hidden="true" />

                {/* ─── Alignement ─── */}
                <RichTextToolbarPopover
                  label="Alignement"
                  icon={
                    editor?.isActive({ textAlign: "center" }) ? <AlignCenter size={15} aria-hidden="true" /> :
                    editor?.isActive({ textAlign: "right" })  ? <AlignRight  size={15} aria-hidden="true" /> :
                    editor?.isActive({ textAlign: "justify" })? <AlignJustify size={15} aria-hidden="true" /> :
                                                                 <AlignLeft   size={15} aria-hidden="true" />
                  }
                >
                  <div className="ef-rich-text-editor-popover-align-row">
                    <RichTextEditorToolbarButton label="Gauche"   active={editor?.isActive({ textAlign: "left"    })} onClick={() => editor?.chain().focus().setTextAlign("left").run()}    icon={<AlignLeft    size={15} aria-hidden="true" />} />
                    <RichTextEditorToolbarButton label="Centre"   active={editor?.isActive({ textAlign: "center"  })} onClick={() => editor?.chain().focus().setTextAlign("center").run()}  icon={<AlignCenter  size={15} aria-hidden="true" />} />
                    <RichTextEditorToolbarButton label="Droite"   active={editor?.isActive({ textAlign: "right"   })} onClick={() => editor?.chain().focus().setTextAlign("right").run()}   icon={<AlignRight   size={15} aria-hidden="true" />} />
                    <RichTextEditorToolbarButton label="Justifié" active={editor?.isActive({ textAlign: "justify" })} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} icon={<AlignJustify size={15} aria-hidden="true" />} />
                  </div>
                </RichTextToolbarPopover>

                <div className="ef-rich-text-editor-toolbar-divider" aria-hidden="true" />

                {/* ─── Lien ─── */}
                <RichTextToolbarPopover label="Lien" icon={<LinkIcon size={15} aria-hidden="true" />} active={editor?.isActive("link")}>
                  <label className="ef-rich-text-editor-popover-field">
                    URL du lien
                    <input
                      type="text"
                      className="ef-rich-text-editor-popover-input"
                      value={linkEditor.href}
                      placeholder="https://exemple.com"
                      onChange={(event) => linkEditor.setHref(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          linkEditor.apply();
                        }
                      }}
                    />
                  </label>
                  <div className="ef-rich-text-editor-popover-grid">
                    <RichTextEditorToolbarButton label="Appliquer" onClick={linkEditor.apply} icon={<LinkIcon size={15} aria-hidden="true" />} />
                    <RichTextEditorToolbarButton label="Supprimer le lien" disabled={!linkEditor.hasLink && linkEditor.href.trim().length === 0} onClick={linkEditor.clear} icon={<Eraser size={15} aria-hidden="true" />} />
                  </div>
                </RichTextToolbarPopover>

                {/* ─── Tableau ─── */}
                <RichTextToolbarPopover label="Tableau" icon={<Table2 size={15} aria-hidden="true" />} active={editor?.isActive("table")}>
                  <RichTextEditorToolbarButton label="Insérer tableau" onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={<Table2 size={15} aria-hidden="true" />} />
                  <div className="ef-rich-text-editor-popover-section">Lignes</div>
                  <RichTextEditorToolbarButton label="Ligne avant" disabled={!editor?.can().addRowBefore()} onClick={() => editor?.chain().focus().addRowBefore().run()} icon={<Plus size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Ligne après" disabled={!editor?.can().addRowAfter()} onClick={() => editor?.chain().focus().addRowAfter().run()} icon={<Rows3 size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Supprimer ligne" disabled={!editor?.can().deleteRow()} onClick={() => editor?.chain().focus().deleteRow().run()} icon={<Trash2 size={15} aria-hidden="true" />} />
                  <div className="ef-rich-text-editor-popover-section">Colonnes</div>
                  <RichTextEditorToolbarButton label="Colonne avant" disabled={!editor?.can().addColumnBefore()} onClick={() => editor?.chain().focus().addColumnBefore().run()} icon={<Plus size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Colonne après" disabled={!editor?.can().addColumnAfter()} onClick={() => editor?.chain().focus().addColumnAfter().run()} icon={<Columns3 size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Supprimer colonne" disabled={!editor?.can().deleteColumn()} onClick={() => editor?.chain().focus().deleteColumn().run()} icon={<Trash2 size={15} aria-hidden="true" />} />
                  <div className="ef-rich-text-editor-popover-section">Cellules</div>
                  <RichTextEditorToolbarButton label="Fusionner cellules" disabled={!editor?.can().mergeCells()} onClick={() => editor?.chain().focus().mergeCells().run()} icon={<TableCellsMerge size={15} aria-hidden="true" />} />
                  <RichTextEditorToolbarButton label="Fractionner cellule" disabled={!editor?.can().splitCell()} onClick={() => editor?.chain().focus().splitCell().run()} icon={<TableCellsSplit size={15} aria-hidden="true" />} />
                  <div className="ef-rich-text-editor-popover-section">Tableau</div>
                  <RichTextEditorToolbarButton label="Supprimer tableau" disabled={!editor?.can().deleteTable()} onClick={() => editor?.chain().focus().deleteTable().run()} icon={<Trash2 size={15} aria-hidden="true" />} />
                </RichTextToolbarPopover>

                <div className="ef-rich-text-editor-toolbar-divider" aria-hidden="true" />

                {/* ─── Variables ─── */}
                <RichTextToolbarPopover label="Variables" icon={<Braces size={15} aria-hidden="true" />}>
                  {variableRegistry.entries.length === 0 ? (
                    <p className="ef-rich-text-editor-variables-empty">Aucune variable disponible</p>
                  ) : (
                    variableRegistry.entries.map((entry) => (
                      <RichTextEditorToolbarButton
                        key={entry.id}
                        label={entry.label}
                        icon={<Braces size={13} aria-hidden="true" />}
                        onClick={() =>
                          runOnTextSelection((targetEditor) => {
                            insertVariableTokenIntoRichTextEditor(
                              targetEditor,
                              { key: entry.key, label: entry.label, sampleValue: entry.sampleValue, sourceColumn: entry.sourceColumn },
                              targetEditor.state.selection,
                              variableRegistry,
                            );
                          })
                        }
                      />
                    ))
                  )}
                </RichTextToolbarPopover>
              </div>
              <div
                className="ef-rich-text-editor-canvas-preview"
                style={contentStyle}
                onDragOverCapture={(event: DragEvent<HTMLDivElement>) => {
                  const context = useEditorStore.getState().dragTraceContext;
                  const dataTransfer = event.dataTransfer;
                  const types = Array.from(dataTransfer?.types ?? []);
                  const canAcceptVariable = context?.type === "variable" || types.includes("application/x-resume-editor-item");
                  if (!canAcceptVariable) {
                    return;
                  }

                  event.preventDefault();
                  if (dataTransfer) {
                    dataTransfer.dropEffect = "copy";
                  }
                  if (context?.type === "variable" && dragTraceSessionRef.current !== context.sessionId) {
                    dragTraceSessionRef.current = context.sessionId;
                    appendOperationLogs([
                      buildVariableDragOperationLog(context, {
                        action: "dragover",
                        pageId: activePageId,
                        target: `Rich Text (${blockId})`,
                        outcome: "survol",
                      }),
                    ]);
                  }
                }}
                onDropCapture={(event: DragEvent<HTMLDivElement>) => {
                  const context = useEditorStore.getState().dragTraceContext;
                  const raw = event.dataTransfer?.getData("application/x-resume-editor-item") ?? "";
                  const payload = parseRichTextVariableDropPayload(raw, context);
                  if (!payload || !editor) {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();
                  handledVariableDropSessionRef.current = context?.sessionId ?? "__handled-rich-text-variable-drop__";

                  const dropPosition = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
                  const insertAt =
                    typeof dropPosition === "number"
                      ? { from: dropPosition, to: dropPosition }
                      : {
                          from: editor.state.selection.from,
                          to: editor.state.selection.to,
                        };

                  const insertionResult = insertVariableTokenIntoRichTextEditor(viewToInsertionTarget(editor.view), payload.payload, insertAt, variableRegistry);
                  if (!insertionResult.inserted) {
                    return;
                  }

                  editor.commands.focus();

                  if (context?.type === "variable") {
                    appendOperationLogs([
                      buildVariableDragOperationLog(context, {
                        action: "drop",
                        pageId: activePageId,
                        target: `Rich Text (${blockId})`,
                        outcome: "accepté",
                      }),
                    ]);
                  }
                }}
              >
                <EditorContent editor={editor} />
              </div>
              </div>
              <div className="ef-rich-text-editor-footer">
                <button type="button" className="ef-rich-text-editor-secondary" onClick={onCancel}>
                  Annuler
                </button>
                <button type="button" className="ef-rich-text-editor-primary" onClick={handleSave} disabled={!editor}>
                  Enregistrer
                </button>
              </div>
              <button
                type="button"
                className="ef-rich-text-editor-resize-handle"
                onPointerDown={beginWindowResize}
                aria-label="Redimensionner la fenêtre"
                title="Redimensionner"
              >
                <Maximize2 size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        </RichTextVariableDatasetContext.Provider>
      </RichTextVariableRegistryContext.Provider>
    </RichTextVariableDisplayModeContext.Provider>
  );
}

function parseRichTextVariableDropPayload(raw: string, context: { type: string; payload: unknown; sourcePanel?: string } | null): VariableDragEnvelope | null {
  const parsed = raw.trim().length > 0 ? parseEditorItemDragPayload(raw) : null;
  if (parsed?.type === "variable") {
    return parsed as VariableDragEnvelope;
  }

  if (context?.type === "variable") {
    return {
      type: "variable",
      payload: context.payload,
      sourcePanel: context.sourcePanel,
    } as VariableDragEnvelope;
  }

  return null;
}

function viewToInsertionTarget(view: {
  state: {
    selection: { from: number; to: number };
    doc: { content: { size: number } };
  };
}): import("@/features/editor/renderers/konva-renderer/rich-text-drop-utils").RichTextEditorInsertionTarget {
  const editorView = view as unknown as {
    state: {
      selection: { from: number; to: number };
      doc: { content: { size: number } };
      schema: {
        nodes: {
          variable: {
            create: (attrs: Record<string, unknown>) => unknown;
          };
        };
      };
      tr: {
        replaceRangeWith: (from: number, to: number, node: unknown) => {
          scrollIntoView: () => unknown;
        };
      };
    };
    dispatch: (transaction: unknown) => void;
    focus: () => void;
  };

  return {
    state: editorView.state,
    commands: {
      focus: () => editorView.focus(),
      insertContentAt: (position: { from: number; to: number }, content: { type: string; attrs: Record<string, unknown> }) => {
        const node = editorView.state.schema.nodes.variable.create(content.attrs);
        const transaction = editorView.state.tr.replaceRangeWith(position.from, position.to, node).scrollIntoView();
        editorView.dispatch(transaction);
      },
    },
  } as import("@/features/editor/renderers/konva-renderer/rich-text-drop-utils").RichTextEditorInsertionTarget;
}

function RichTextEditorToolbarButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={["ef-rich-text-editor-toolbar-button", active ? "is-active" : ""].join(" ")} onMouseDown={(event) => event.preventDefault()} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RichTextToolbarPopover({ active, children, icon, label }: { active?: boolean; children: ReactNode; icon: ReactNode; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={["ef-rich-text-editor-popover-trigger", active ? "is-active" : ""].filter(Boolean).join(" ")}
          onMouseDown={(event) => event.preventDefault()}
          aria-label={label}
          title={label}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="ef-rich-text-editor-popover" align="start" side="bottom" sideOffset={8} collisionPadding={12}>
        <div className="ef-rich-text-editor-popover-title">{label}</div>
        <div className="ef-rich-text-editor-popover-grid">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
