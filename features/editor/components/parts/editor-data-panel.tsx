"use client";

import { GripVertical, Search, Settings } from "lucide-react";

import { presets, variables } from "@/features/editor/components/editor-mock-data";

export function EditorDataPanel() {
  return (
    <aside className="ef-data-panel">
      <h2 className="ef-panel-heading">Données</h2>

      <div className="ef-two-tabs">
        <button className="ef-tab-button is-active">Variables</button>
        <button className="ef-tab-button">Presets</button>
      </div>

      <div className="ef-search-row">
        <label className="ef-search-box">
          <Search size={14} aria-hidden="true" />
          Filtrer les variables...
        </label>
        <button className="ef-square-button">
          <Settings size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="ef-data-table">
        <div className="ef-data-table-row ef-data-table-head">
          <span />
          <span>Variable</span>
          <span>Type</span>
        </div>
        {variables.map((variable) => (
          <div key={variable.token} className="ef-data-table-row">
            <GripVertical size={12} className="ef-muted-icon" aria-hidden="true" />
            <span className="ef-token">{variable.token}</span>
            <span className="ef-type-pill">
              <span className="ef-dot" style={{ backgroundColor: variable.color }} />
              {variable.type}
            </span>
          </div>
        ))}
      </div>

      <div className="ef-section-header">
        <h3 className="ef-panel-subheading">Presets</h3>
        <button className="ef-panel-link">Voir tout</button>
      </div>

      <div className="ef-preset-grid">
        {presets.map((preset, index) => (
          <button key={preset.title} className="ef-preset-card">
            <PresetThumb index={index} />
            <span className="ef-preset-title">{preset.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function PresetThumb({ index }: { index: number }) {
  if (index === 0) {
    return (
      <span className="ef-preset-thumb is-classic">
        <span className="ef-preset-shape ef-classic-page" />
        <span className="ef-preset-shape ef-classic-panel" />
        <span className="ef-preset-shape ef-classic-line-strong" />
        <span className="ef-preset-shape ef-classic-line" />
      </span>
    );
  }

  if (index === 1) {
    return (
      <span className="ef-preset-thumb is-creative">
        <span className="ef-preset-shape ef-creative-sidebar" />
        <span className="ef-preset-shape ef-creative-line-strong" />
        <span className="ef-preset-shape ef-creative-line" />
        <span className="ef-preset-shape ef-creative-dot" />
      </span>
    );
  }

  if (index === 2) {
    return (
      <span className="ef-preset-thumb is-flyer">
        <span className="ef-preset-shape ef-flyer-title">
          Flyer
          <br />
          Event
        </span>
        <span className="ef-preset-shape ef-flyer-block" />
        <span className="ef-preset-shape ef-flyer-dot" />
      </span>
    );
  }

  return (
    <span className="ef-preset-thumb is-brochure">
      <span className="ef-preset-shape ef-brochure-sidebar" />
      <span className="ef-preset-shape ef-brochure-page" />
      <span className="ef-preset-shape ef-brochure-line-strong" />
      <span className="ef-preset-shape ef-brochure-line" />
    </span>
  );
}
