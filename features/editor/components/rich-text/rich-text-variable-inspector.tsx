"use client";

import { Braces, Eye, Tag } from "lucide-react";

import type {
  RichTextVariableDisplayMode,
  RichTextVariableNodeAttrs,
} from "@/features/editor/lib/rich-text-variable";

export interface RichTextVariableInspectorProps {
  attrs: RichTextVariableNodeAttrs;
  displayMode: RichTextVariableDisplayMode;
  onDisplayModeChange: (mode: RichTextVariableDisplayMode) => void;
}

export function RichTextVariableInspector({
  attrs,
  displayMode,
  onDisplayModeChange,
}: RichTextVariableInspectorProps) {
  const label = attrs.label ?? attrs.key ?? "Variable";
  const technical = attrs.key ? `{{${attrs.key}}}` : "{{variable}}";
  const preview = label;

  return (
    <aside className="ef-rtp-text-inspector" aria-label="Inspecteur variable">
      <header className="ef-rtp-text-inspector-header">
        <div>
          <span>Inspecteur</span>
          <strong>Variable</strong>
        </div>
      </header>

      <section className="ef-rtp-text-inspector-section">
        <div className="ef-rtp-text-section-title">
          <strong>Modes d'affichage</strong>
          <span>Un même contenu, trois modes de lecture.</span>
        </div>
        <div className="ef-rtp-variable-modes">
          <VariableModeButton
            label="Aperçu"
            value={preview}
            active={displayMode === "value"}
            icon={<Eye size={16} />}
            onClick={() => onDisplayModeChange("value")}
          />
          <VariableModeButton
            label="Nom variable"
            value={`[${label}]`}
            active={displayMode === "label"}
            icon={<Tag size={16} />}
            onClick={() => onDisplayModeChange("label")}
          />
          <VariableModeButton
            label="Technique"
            value={technical}
            active={displayMode === "technical"}
            icon={<Braces size={16} />}
            onClick={() => onDisplayModeChange("technical")}
          />
        </div>
      </section>

      <section className="ef-rtp-text-inspector-section">
        <div className="ef-rtp-text-section-title">
          <strong>Détails</strong>
        </div>
        <dl className="ef-rtp-variable-details">
          <div>
            <dt>Libellé</dt>
            <dd>{label}</dd>
          </div>
          <div>
            <dt>Clé</dt>
            <dd>{technical}</dd>
          </div>
          <div>
            <dt>Aperçu</dt>
            <dd>{preview}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

function VariableModeButton({
  label,
  value,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "is-active" : ""} onClick={onClick}>
      <span>{icon}</span>
      <strong>{label}</strong>
      <em>{value}</em>
    </button>
  );
}
