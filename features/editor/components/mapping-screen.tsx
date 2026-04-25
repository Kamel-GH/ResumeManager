"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BottomDataMappingPanel } from "@/features/editor/components/parts/bottom-data-mapping-panel";

export function MappingScreen() {
  return (
    <section className="editor-fidelity ef-mapping-screen">
      <header className="ef-mapping-screen-header">
        <div>
          <p className="ef-mapping-screen-kicker">Studio Templates</p>
          <h1 className="ef-mapping-screen-title">Mapping des données</h1>
        </div>
        <Link className="ef-mapping-back-link" href="/editor">
          <ArrowLeft size={14} aria-hidden="true" />
          Retour à l’éditeur
        </Link>
      </header>

      <BottomDataMappingPanel />
    </section>
  );
}
