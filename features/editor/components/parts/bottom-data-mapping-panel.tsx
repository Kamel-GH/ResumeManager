"use client";

import { CheckCircle2, ChevronDown, GitBranch, RefreshCw, Table2, X } from "lucide-react";

import { chartBars, dataPreview, mappingRows, repeaterRows } from "@/features/editor/components/editor-mock-data";

export function BottomDataMappingPanel() {
  return (
    <section className="ef-mapping-panel">
      <div className="ef-mapping-header">
        <h2 className="ef-mapping-title">Mapping des donnees</h2>
        <button className="ef-square-button" title="Fermer">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="ef-mapping-grid">
        <div className="ef-card">
          <div className="ef-card-toolbar">
            <span>Source de donnees</span>
            <button className="ef-mini-button">
              CSV <ChevronDown size={12} aria-hidden="true" />
            </button>
            <button className="ef-mini-button ef-mini-select">
              cv_donnees.csv <ChevronDown size={12} aria-hidden="true" />
            </button>
            <span className="ef-status-ok">
              <span className="ef-dot ef-dot-ok" />
              Connecte
            </span>
            <RefreshCw size={13} aria-hidden="true" />
          </div>

          <div className="ef-mapping-body">
            <div className="ef-card-kicker">Apercu des donnees</div>
            <div className="ef-card">
              <div className="ef-table-head ef-preview-grid">
                <span>Nom</span>
                <span>Prenom</span>
                <span>Poste</span>
                <span>Telephone</span>
                <span />
              </div>
              <div className="ef-table-row ef-preview-grid">
                {dataPreview.map((cell) => (
                  <span key={cell} className="ef-truncate">
                    {cell}
                  </span>
                ))}
                <span className="ef-muted-cell">...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ef-card">
          <div className="ef-table-head ef-mapping-table-grid">
            <span>Element du template</span>
            <span>Variable</span>
            <span>Source</span>
            <span>Apercu</span>
          </div>
          {mappingRows.map((row) => (
            <div key={row.source} className="ef-table-row ef-mapping-table-grid">
              <span className="ef-truncate ef-font-medium">
                <CheckCircle2 className="ef-inline-icon-blue" size={12} aria-hidden="true" />
                {row.source}
              </span>
              <span className="ef-truncate">{row.target}</span>
              <span className="ef-truncate">{row.field}</span>
              <span className="ef-truncate">{row.preview}</span>
            </div>
          ))}
        </div>

        <div className="ef-card ef-card-padded">
          <div className="ef-card-head">
            <div className="ef-card-title-row">
              <GitBranch size={15} aria-hidden="true" />
              <h3 className="ef-card-title">Repeteurs / Listes</h3>
            </div>
            <ChevronDown size={14} aria-hidden="true" />
          </div>
          <div className="ef-card-list">
            {repeaterRows.map((row) => (
              <div key={row.label} className="ef-repeater-row">
                <span className="ef-truncate ef-font-medium">{row.label}</span>
                <span className="ef-badge">{row.items}</span>
                <span className="ef-truncate">{row.target}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ef-card ef-card-padded">
          <div className="ef-card-title-row">
            <Table2 size={15} aria-hidden="true" />
            <h3 className="ef-card-title">Graphiques</h3>
          </div>
          <p className="ef-chart-title">Competences</p>
          <button className="ef-mini-button ef-chart-select">
            Barres verticales <ChevronDown size={12} aria-hidden="true" />
          </button>
          <div className="ef-chart">
            {chartBars.concat([{ label: "Print", value: 74 }, { label: "Web", value: 88 }]).map((bar) => (
              <span key={bar.label} className="ef-chart-bar" style={{ height: `${Math.max(18, bar.value * 0.55)}px` }} title={`${bar.label} ${bar.value}%`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
