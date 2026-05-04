"use client";

import { ChevronDown, GitBranch, RefreshCw, Table2, X } from "lucide-react";

export function BottomDataMappingPanel() {
  return (
    <section className="ef-mapping-panel">
      <div className="ef-mapping-header">
        <h2 className="ef-mapping-title">Mapping des donnees</h2>
        <button className="ef-square-button" title="Fermer" type="button">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="ef-mapping-grid">
        <div className="ef-card">
          <div className="ef-card-toolbar">
            <span>Source de donnees</span>
            <button className="ef-mini-button" type="button">
              Source <ChevronDown size={12} aria-hidden="true" />
            </button>
            <button className="ef-mini-button ef-mini-select" type="button">
              Non branchée <ChevronDown size={12} aria-hidden="true" />
            </button>
            <span className="ef-status-ok">
              <span className="ef-dot ef-dot-ok" />
              Hors périmètre
            </span>
            <RefreshCw size={13} aria-hidden="true" />
          </div>

          <div className="ef-mapping-body">
            <div className="ef-card-kicker">Aperçu des données</div>
            <div className="ef-no-result" style={{ minHeight: 132, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
              <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>Mapping</strong>
              <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Section non branchée dans ce lot.</span>
            </div>
          </div>
        </div>

        <div className="ef-card">
          <div className="ef-no-result" style={{ minHeight: 174, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
            <strong style={{ color: "var(--editor-text-on-dark)", fontSize: 12 }}>Table de mapping</strong>
            <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Aucune donnée réelle branchée ici pour le moment.</span>
          </div>
        </div>

        <div className="ef-card ef-card-padded">
          <div className="ef-card-head">
            <div className="ef-card-title-row">
              <GitBranch size={15} aria-hidden="true" />
              <h3 className="ef-card-title">Repeteurs / Listes</h3>
            </div>
            <ChevronDown size={14} aria-hidden="true" />
          </div>
          <div className="ef-no-result" style={{ minHeight: 96, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
            <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Module non branché dans ce lot.</span>
          </div>
        </div>

        <div className="ef-card ef-card-padded">
          <div className="ef-card-title-row">
            <Table2 size={15} aria-hidden="true" />
            <h3 className="ef-card-title">Graphiques</h3>
          </div>
          <div className="ef-no-result" style={{ minHeight: 132, flexDirection: "column", gap: 6, padding: 16, textAlign: "center" }}>
            <span style={{ fontSize: 10, lineHeight: 1.2, color: "#8b8b92" }}>Section non branchée dans ce lot.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
