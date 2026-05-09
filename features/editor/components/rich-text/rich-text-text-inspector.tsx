"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from "lucide-react";

export interface RichTextTextInspectorProps {
  editor: Editor | null;
}

export function RichTextTextInspector({ editor }: RichTextTextInspectorProps) {
  const textAttrs = editor?.getAttributes("textStyle") ?? {};

  return (
    <aside className="ef-rtp-text-inspector" aria-label="Inspecteur texte">
      <header className="ef-rtp-text-inspector-header">
        <div>
          <span>Inspecteur</span>
          <strong>Texte</strong>
        </div>
      </header>

      <section className="ef-rtp-text-inspector-section">
        <div className="ef-rtp-text-section-title">
          <strong>Mise en forme inline</strong>
        </div>
        <div className="ef-rtp-inline-format-grid">
          <FormatButton
            label="Gras"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            icon={<Bold size={15} />}
          />
          <FormatButton
            label="Italique"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            icon={<Italic size={15} />}
          />
          <FormatButton
            label="Souligné"
            active={editor?.isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            icon={<Underline size={15} />}
          />
          <FormatButton
            label="Barré"
            active={editor?.isActive("strike")}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            icon={<Strikethrough size={15} />}
          />
        </div>
      </section>

      <section className="ef-rtp-text-inspector-section">
        <div className="ef-rtp-text-section-title">
          <strong>Paragraphe & listes</strong>
          <span>Tous les réglages de paragraphe au même endroit.</span>
        </div>
        <div className="ef-rtp-align-grid">
          <FormatButton
            label="Gauche"
            active={editor?.isActive({ textAlign: "left" })}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            icon={<AlignLeft size={15} />}
          />
          <FormatButton
            label="Centre"
            active={editor?.isActive({ textAlign: "center" })}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            icon={<AlignCenter size={15} />}
          />
          <FormatButton
            label="Droite"
            active={editor?.isActive({ textAlign: "right" })}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            icon={<AlignRight size={15} />}
          />
          <FormatButton
            label="Justifié"
            active={editor?.isActive({ textAlign: "justify" })}
            onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
            icon={<AlignJustify size={15} />}
          />
        </div>
        <div className="ef-rtp-text-fields">
          <TextField label="Avant" value="12" suffix="px" disabled />
          <TextField label="Après" value="12" suffix="px" disabled />
          <SelectField
            label="Interligne"
            value={textAttrs.lineHeight ?? ""}
            onChange={(value) => editor?.chain().focus().setLineHeight(value).run()}
            options={["1", "1.15", "1.3", "1.5", "1.75", "2"].map((value) => [value, value])}
          />
        </div>
      </section>
    </aside>
  );
}

function FormatButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "is-active" : ""}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="ef-rtp-text-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Auto</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  suffix,
  disabled,
}: {
  label: string;
  value: string;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <label className="ef-rtp-text-field">
      <span>{label}</span>
      <span className="ef-rtp-text-input-wrap">
        <input type="text" value={value} disabled={disabled} readOnly />
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  );
}
