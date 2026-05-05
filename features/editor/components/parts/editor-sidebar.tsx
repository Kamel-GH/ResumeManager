"use client";

import { Database, FileText, LayoutDashboard, LogOut, Settings, Shield, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_ICON_SIZE = 20;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const globalNavItems: { label: string; icon: LucideIcon; href?: string; disabled?: boolean }[] = [
  { label: "Éditeur", icon: LayoutDashboard, href: "/editor" },
  { label: "Variables", icon: Database, href: "/editor/mapping" },
  { label: "Templates", icon: FileText, disabled: true },
  { label: "Candidats", icon: UserRound, disabled: true },
  { label: "Admin", icon: Shield, disabled: true },
  { label: "Réglages", icon: Settings, disabled: true },
];

export function EditorSidebar() {
  const pathname = usePathname();

  return (
    <nav className="ef-sidebar" aria-label="Navigation du studio">
      <div className="ef-sidebar-nav">
        {globalNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;
          const className = cn("ef-sidebar-item", active ? "is-active" : "", item.disabled ? "is-disabled" : "");

          return item.href ? (
            <Link key={item.label} className={className} href={item.href} title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined}>
              <Icon size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              <span className="ef-sidebar-label">{item.label}</span>
            </Link>
          ) : (
            <button
              key={item.label}
              className={className}
              type="button"
              title={`${item.label} · Bientôt disponible`}
              aria-label={`${item.label} · Bientôt disponible`}
              disabled={item.disabled ?? false}
            >
              <Icon size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
              <span className="ef-sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ef-sidebar-bottom">
        <button className="ef-sidebar-avatar" type="button" title="Profil utilisateur non branché" aria-label="Profil utilisateur non branché" disabled>
          KM
        </button>
        <button className="ef-sidebar-logout" type="button" title="Déconnexion non branchée" aria-label="Déconnexion non branchée" disabled>
          <LogOut size={SIDEBAR_ICON_SIZE} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
