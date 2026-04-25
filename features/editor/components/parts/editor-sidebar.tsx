"use client";

import { FileText, LayoutDashboard, LogOut, Settings, Shield, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SIDEBAR_ICON_SIZE = 20;

const globalNavItems: { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Éditeur", icon: LayoutDashboard, active: true },
  { label: "Templates", icon: FileText },
  { label: "Candidats", icon: UserRound },
  { label: "Admin", icon: Shield },
  { label: "Réglages", icon: Settings },
];

export function EditorSidebar() {
  return (
    <nav className="ef-sidebar">
      <div className="ef-sidebar-nav">
        {globalNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <button key={item.label} className={["ef-sidebar-item", item.active ? "is-active" : ""].join(" ")} type="button" title={item.label} aria-label={item.label}>
              <Icon size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              <span className="ef-sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ef-sidebar-bottom">
        <button className="ef-sidebar-avatar" type="button" title="Profil utilisateur" aria-label="Profil utilisateur">
          KM
        </button>
        <button className="ef-sidebar-logout" type="button" title="Déconnexion" aria-label="Déconnexion">
          <LogOut size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
