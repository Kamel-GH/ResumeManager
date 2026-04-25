"use client";

import { editorNavItems } from "@/features/editor/components/editor-mock-data";

const SIDEBAR_ICON_SIZE = 20;

export function EditorSidebar() {
  return (
    <nav className="ef-sidebar">
      {editorNavItems.map((item) => {
        const Icon = item.icon;

        return (
          <button key={item.label} className={["ef-sidebar-item", item.active ? "is-active" : ""].join(" ")} title={item.label}>
            <Icon size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
            <span className="ef-sidebar-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
