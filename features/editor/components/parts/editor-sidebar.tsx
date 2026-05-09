"use client";

import type { LucideIcon } from "lucide-react";
import {
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_ICON_SIZE = 20;

const globalNavItems: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Éditeur", icon: LayoutDashboard, href: "/editor" },
  { label: "Variables", icon: Database, href: "/editor/mapping" },
  { label: "Templates", icon: FileText },
  { label: "Candidats", icon: UserRound },
  { label: "Admin", icon: Shield },
  { label: "Réglages", icon: Settings },
];

export function EditorSidebar() {
  const pathname = usePathname();

  return (
    <nav className="ef-sidebar">
      <div className="ef-sidebar-nav">
        {globalNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;
          const className = ["ef-sidebar-item", active ? "is-active" : ""].join(" ").trim();

          return item.href ? (
            <Link
              key={item.label}
              className={className}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              <span className="ef-sidebar-label">{item.label}</span>
            </Link>
          ) : (
            <button
              key={item.label}
              className={className}
              type="button"
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              <span className="ef-sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ef-sidebar-bottom">
        <button
          className="ef-sidebar-avatar"
          type="button"
          title="Profil utilisateur"
          aria-label="Profil utilisateur"
        >
          KM
        </button>
        <button
          className="ef-sidebar-logout"
          type="button"
          title="Déconnexion"
          aria-label="Déconnexion"
        >
          <LogOut size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
