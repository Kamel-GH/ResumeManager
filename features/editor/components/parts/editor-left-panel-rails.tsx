import type { LucideIcon } from "lucide-react";

import type {
  EditorLeftPanelTab,
  EditorLeftSubTab,
} from "@/features/editor/stores/editor-store";

type LeftPanelPrimaryTab = {
  id: EditorLeftPanelTab;
  label: string;
  icon: LucideIcon;
  subTabs: Array<LeftPanelSubTab> | null;
};

type LeftPanelSubTab = {
  id: EditorLeftSubTab;
  label: string;
  icon: LucideIcon;
};

export function EditorLeftPanelPrimaryRail({
  tabs,
  activeTab,
  onTabChange,
  renderIcon,
}: {
  tabs: LeftPanelPrimaryTab[];
  activeTab: EditorLeftPanelTab;
  onTabChange: (tab: EditorLeftPanelTab) => void;
  renderIcon: (icon: LucideIcon, size: number) => React.ReactNode;
}) {
  return (
    <div className="ef-left-tabs" role="tablist" aria-label="Modules éditeur">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            title={tab.label}
            className={["ef-left-tab", active ? "is-active" : ""].join(" ")}
            onClick={() => onTabChange(tab.id)}
          >
            {renderIcon(tab.icon, 18)}
          </button>
        );
      })}
    </div>
  );
}

export function EditorLeftPanelSubTabRail({
  subTabs,
  activeSubTab,
  onSubTabChange,
  renderIcon,
}: {
  subTabs: LeftPanelSubTab[];
  activeSubTab?: EditorLeftSubTab;
  onSubTabChange: (subTab?: EditorLeftSubTab) => void;
  renderIcon: (icon: LucideIcon, size: number) => React.ReactNode;
}) {
  return (
    <div className="ef-left-subtabs" role="tablist" aria-label="Sous-sections">
      {subTabs.map((item) => {
        const active = item.id === activeSubTab;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={item.label}
            title={item.label}
            className={["ef-left-subtab", active ? "is-active" : ""].join(" ")}
            onClick={() => onSubTabChange(item.id)}
          >
            {renderIcon(item.icon, 16)}
          </button>
        );
      })}
    </div>
  );
}

export type { LeftPanelPrimaryTab, LeftPanelSubTab };
