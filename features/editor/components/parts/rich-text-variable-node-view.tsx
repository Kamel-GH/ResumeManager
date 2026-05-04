"use client";

import React, { createContext, useContext } from "react";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

import {
  RichTextVariableNode,
  resolveRichTextVariableValue,
  type RichTextVariableDisplayMode,
  type RichTextVariableNodeAttrs,
  type RichTextVariableRegistry,
} from "@/features/editor/lib/rich-text-variable";

export const RichTextVariableDisplayModeContext = createContext<RichTextVariableDisplayMode>("label");
export const RichTextVariableRegistryContext = createContext<RichTextVariableRegistry | null>(null);
export const RichTextVariableDatasetContext = createContext<unknown>(null);

export function createRichTextVariableNodeViewExtension() {
  return RichTextVariableNode.extend({
    addNodeView() {
      return ReactNodeViewRenderer(RichTextVariableNodeView);
    },
  });
}

export function RichTextVariableNodeView({ node, selected }: NodeViewProps) {
  const displayMode = useContext(RichTextVariableDisplayModeContext);
  const registry = useContext(RichTextVariableRegistryContext);
  const dataset = useContext(RichTextVariableDatasetContext);
  const attrs = node.attrs as RichTextVariableNodeAttrs;
  const resolvedText = resolveRichTextVariableValue(attrs, displayMode, dataset);
  const displayText = resolvedText.trim() || attrs.label?.trim() || attrs.fallback?.trim() || attrs.key?.trim() || "[variable]";

  const chipStyle: React.CSSProperties = {};
  if (attrs.bold) chipStyle.fontWeight = "bold";
  if (attrs.italic) chipStyle.fontStyle = "italic";
  const decorations: string[] = [];
  if (attrs.underline) decorations.push("underline");
  if (attrs.strike) decorations.push("line-through");
  if (decorations.length) chipStyle.textDecoration = decorations.join(" ");
  if (attrs.color) chipStyle.color = attrs.color;
  if (attrs.fontSize) chipStyle.fontSize = attrs.fontSize;
  if (attrs.fontFamily) chipStyle.fontFamily = attrs.fontFamily;

  return (
    <NodeViewWrapper
      as="span"
      className={[
        "ef-rich-text-variable-node-view",
        selected ? "is-selected" : "",
        `is-${displayMode}`,
      ]
        .filter(Boolean)
        .join(" ")}
      contentEditable={false}
      data-variable="true"
      data-variable-id={attrs.id}
      data-variable-key={attrs.key}
      data-variable-label={attrs.label}
      data-variable-fallback={attrs.fallback}
      data-variable-source={attrs.source}
      data-variable-display-mode={displayMode}
      data-variable-text={displayText}
      aria-label={displayText}
      title={displayText}
      data-variable-registry-size={registry?.entries.length ?? 0}
      draggable="true"
    >
      {displayMode === "value" ? (
        <span style={chipStyle}>{displayText}</span>
      ) : (
        <span className="ef-rich-text-variable-node-chip" style={chipStyle}>{displayText}</span>
      )}
    </NodeViewWrapper>
  );
}
