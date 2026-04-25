"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Copy,
  Database,
  FileText,
  Grid2X2,
  Image,
  Import,
  Layers,
  Library,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Shapes,
  Star,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EditorDataPanel } from "@/features/editor/components/parts/editor-data-panel";
import { LayersPanel } from "@/features/editor/components/parts/layers-panel";
import { useEditorStore } from "@/features/editor/stores/editor-store";
import type { EditorLeftPanelTab, EditorLeftSubTab } from "@/features/editor/stores/editor-store";
import { emojis, icons, images, objects, pages, shapes, textBlocks } from "@/src/data/editorMockData";
import type {
  EditorEmojiMock,
  EditorIconMock,
  EditorImageMock,
  EditorShapeMock,
  EditorTextBlockMock,
} from "@/src/data/editorMockData";

type MainTabConfig = {
  id: EditorLeftPanelTab;
  label: string;
  icon: LucideIcon;
  subTabs?: { id: EditorLeftSubTab; label: string; icon: LucideIcon }[];
};

const mainTabs: MainTabConfig[] = [
  {
    id: "data",
    label: "Données",
    icon: Database,
    subTabs: [
      { id: "variables", label: "Variables", icon: Type },
      { id: "presets", label: "Presets", icon: Shapes },
    ],
  },
  {
    id: "libraries",
    label: "Bibliothèques",
    icon: Library,
    subTabs: [
      { id: "images", label: "Images", icon: Image },
      { id: "text-blocks", label: "Blocs Textes", icon: Type },
      { id: "charts-shapes", label: "Graphiques & Shapes", icon: Shapes },
      { id: "icons", label: "Icônes", icon: Star },
      { id: "emoji", label: "Emoji", icon: Shapes },
    ],
  },
  { id: "layers", label: "Calques", icon: Layers },
  { id: "objects", label: "Objets", icon: Shapes },
  { id: "pages", label: "Pages", icon: FileText },
];

export function EditorLeftPanel() {
  const activeTab = useEditorStore((state) => state.panelPreferences.activeLeftTab);
  const activeSubTabs = useEditorStore((state) => state.panelPreferences.activeSubTabs);
  const setActiveLeftTab = useEditorStore((state) => state.setActiveLeftTab);
  const setActiveSubTab = useEditorStore((state) => state.setActiveSubTab);
  const tab = mainTabs.find((item) => item.id === activeTab) ?? mainTabs[0];
  const activeSubTab = activeSubTabs[activeTab] ?? tab?.subTabs?.[0]?.id;

  return (
    <aside className="ef-left-panel-v2">
      <div className="ef-left-tabs" role="tablist" aria-label="Modules éditeur">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeTab;

          return (
            <button
              key={item.id}
              className={["ef-left-tab", active ? "is-active" : ""].join(" ")}
              type="button"
              role="tab"
              aria-selected={active}
              title={item.label}
              onClick={() => setActiveLeftTab(item.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab?.subTabs ? (
        <div className="ef-left-subtabs" role="tablist" aria-label={`Sous-sections ${tab.label}`}>
          {tab.subTabs.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeSubTab;

            return (
              <button
                key={item.id}
                className={["ef-left-subtab", active ? "is-active" : ""].join(" ")}
                type="button"
                role="tab"
                aria-selected={active}
                title={item.label}
                onClick={() => setActiveSubTab(activeTab, item.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <PanelContent activeTab={activeTab} activeSubTab={activeSubTab} />
    </aside>
  );
}

function PanelContent({ activeTab, activeSubTab }: { activeTab: EditorLeftPanelTab; activeSubTab?: EditorLeftSubTab }) {
  if (activeTab === "data") {
    return <EditorDataPanel activeSubTab={activeSubTab === "presets" ? "presets" : "variables"} />;
  }

  if (activeTab === "layers") {
    return <LayersPanel embedded />;
  }

  if (activeTab === "libraries") {
    return <LibraryPanel activeSubTab={activeSubTab ?? "images"} />;
  }

  if (activeTab === "objects") {
    return <GenericDensePanel kind="objects" filterPlaceholder="Nom, calque, page, type" footerActions={["Dupliquer", "Déplacer", "Supprimer"]} />;
  }

  return <GenericDensePanel kind="pages" filterPlaceholder="Filtrer pages..." footerActions={["Modifier", "Dupliquer", "Supprimer", "Déplacer"]} />;
}

function LibraryPanel({ activeSubTab }: { activeSubTab: EditorLeftSubTab }) {
  const viewMode = useEditorStore((state) => state.panelPreferences.assetViewMode);
  const filter = useEditorStore((state) => state.panelPreferences.filters[activeSubTab] ?? "");
  const setAssetViewMode = useEditorStore((state) => state.setAssetViewMode);
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);

  return (
    <div className="ef-left-panel-body">
      <PanelToolbar>
        <div className="ef-view-toggle" role="group" aria-label="Mode d’affichage">
          <button className={viewMode === "grid" ? "is-active" : ""} type="button" title="Grille" aria-label="Grille" onClick={() => setAssetViewMode("grid")}>
            <Grid2X2 size={18} aria-hidden="true" />
          </button>
          <button className={viewMode === "list" ? "is-active" : ""} type="button" title="Liste" aria-label="Liste" onClick={() => setAssetViewMode("list")}>
            <List size={18} aria-hidden="true" />
          </button>
        </div>
      </PanelToolbar>
      <PanelSearch value={filter} placeholder={filterPlaceholderForSubTab(activeSubTab)} onChange={(value) => setPanelFilter(activeSubTab, value)} />
      <div className="ef-left-panel-scroll">
        <LibraryList activeSubTab={activeSubTab} viewMode={viewMode} filter={filter} />
      </div>
    </div>
  );
}

function GenericDensePanel({ kind, filterPlaceholder, footerActions }: { kind: "objects" | "pages"; filterPlaceholder: string; footerActions: string[] }) {
  const filter = useEditorStore((state) => state.panelPreferences.filters[kind] ?? "");
  const setPanelFilter = useEditorStore((state) => state.setPanelFilter);

  return (
    <div className="ef-left-panel-body">
      <PanelToolbar />
      <PanelSearch value={filter} placeholder={filterPlaceholder} onChange={(value) => setPanelFilter(kind, value)} />
      <div className="ef-left-panel-scroll">
        {kind === "objects" ? <ObjectList filter={filter} /> : <PageList filter={filter} />}
      </div>
      <div className="ef-left-panel-footer">
        {footerActions.map((action) => (
          <button key={action} className="ef-footer-icon-action" type="button" title={action} aria-label={action}>
            <FooterActionIcon action={action} />
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelToolbar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="ef-left-panel-toolbar">
      {children ?? <span />}
      <span className="ef-toolbar-actions">
        <button className="ef-square-button ef-icon-28" type="button" title="Importer" aria-label="Importer">
          <Import size={18} aria-hidden="true" />
        </button>
        <button className="ef-square-button ef-icon-28" type="button" title="Paramètres" aria-label="Paramètres">
          <Settings size={18} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

function PanelSearch({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="ef-search-line">
      <label className="ef-search-box ef-left-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(event) => onChange(event.target.value)} />
      </label>
      <button className="ef-filter-select" type="button">CAT.</button>
    </div>
  );
}

function LibraryList({ activeSubTab, viewMode, filter }: { activeSubTab: EditorLeftSubTab; viewMode: "grid" | "list"; filter: string }) {
  if (activeSubTab === "images") {
    const rows = images.filter((item) => matchesFilter(filter, [item.name, item.category, ...item.tags]));
    return viewMode === "grid" ? <AssetGrid items={rows} kind="image" columns={2} /> : <ImageList items={rows} />;
  }

  if (activeSubTab === "text-blocks") {
    const rows = textBlocks.filter((item) => matchesFilter(filter, [item.name, item.category, ...item.tags]));
    return viewMode === "grid" ? <TextBlockGrid items={rows} /> : <TextBlockList items={rows} />;
  }

  if (activeSubTab === "charts-shapes") {
    const rows = shapes.filter((item) => matchesFilter(filter, [item.name, item.category, item.type, ...item.tags]));
    return viewMode === "grid" ? <AssetGrid items={rows} kind="shape" columns={3} /> : <ShapeList items={rows} />;
  }

  if (activeSubTab === "icons") {
    const rows = icons.filter((item) => matchesFilter(filter, [item.name, item.category, item.variant, ...item.tags]));
    return viewMode === "grid" ? <AssetGrid items={rows} kind="icon" columns={4} /> : <IconList items={rows} />;
  }

  const rows = emojis.filter((item) => matchesFilter(filter, [item.name, item.category, item.emoji, ...item.tags]));
  return <EmojiGrid items={rows} />;
}

function AssetGrid({ items, kind, columns }: { items: Array<EditorImageMock | EditorShapeMock | EditorIconMock>; kind: "image" | "shape" | "icon"; columns: 2 | 3 | 4 }) {
  if (!items.length) return <NoResult />;

  return (
    <div className={`ef-asset-grid ef-asset-grid-${columns}`}>
      {items.map((item) => (
        <button key={item.id} className={`ef-asset-card is-${kind}`} type="button" title={item.name} draggable onDragStart={(event) => setDragPayload(event, kind, item)}>
          <AssetPreview item={item} kind={kind} />
          <HoverActions />
        </button>
      ))}
    </div>
  );
}

function AssetPreview({ item, kind }: { item: EditorImageMock | EditorShapeMock | EditorIconMock; kind: "image" | "shape" | "icon" }) {
  if (kind === "image") return <img src={(item as EditorImageMock).src} alt={(item as EditorImageMock).name} loading="lazy" />;
  if (kind === "shape") return <img src={svgToDataUri((item as EditorShapeMock).svg)} alt={(item as EditorShapeMock).name} />;
  const icon = item as EditorIconMock;
  return icon.svg ? <img src={svgToDataUri(icon.svg)} alt={icon.name} /> : <span className="ef-mono-icon">{icon.name.slice(0, 2).toUpperCase()}</span>;
}

function ImageList({ items }: { items: EditorImageMock[] }) {
  if (!items.length) return <NoResult />;

  return (
    <div className="ef-list-table">
      <div className="ef-list-row ef-list-head is-image"><span>NOM ↑</span><span>CAT.</span><span>TAILLE</span></div>
      {items.map((item) => (
        <button key={item.id} className="ef-list-row is-image" type="button" draggable onDragStart={(event) => setDragPayload(event, "image", item)}>
          <img src={item.src} alt="" loading="lazy" />
          <strong>{item.name}</strong>
          <span>{item.category}</span>
          <span>{item.width}×{item.height}</span>
          <HoverActions />
        </button>
      ))}
    </div>
  );
}

function TextBlockGrid({ items }: { items: EditorTextBlockMock[] }) {
  if (!items.length) return <NoResult />;

  return (
    <div className="ef-text-block-grid">
      {items.map((item) => (
        <button key={item.id} className="ef-text-block-card" type="button" draggable onDragStart={(event) => setDragPayload(event, "text-block", item)}>
          <span dangerouslySetInnerHTML={{ __html: item.preview }} />
          <HoverActions />
        </button>
      ))}
    </div>
  );
}

function TextBlockList({ items }: { items: EditorTextBlockMock[] }) {
  if (!items.length) return <NoResult />;

  return (
    <div className="ef-list-table">
      <div className="ef-list-row ef-list-head is-text-block"><span>NOM DU BLOC ↑</span><span>CAT.</span></div>
      {items.map((item) => (
        <button key={item.id} className="ef-list-row is-text-block" type="button" draggable onDragStart={(event) => setDragPayload(event, "text-block", item)}>
          <span className="ef-mini-preview" dangerouslySetInnerHTML={{ __html: item.preview }} />
          <strong>{item.name}</strong>
          <span>{item.category}</span>
          <HoverActions />
        </button>
      ))}
    </div>
  );
}

function ShapeList({ items }: { items: EditorShapeMock[] }) {
  return <SimpleAssetList items={items} title="SHAPE ↑" second="CAT." third="MODE" getPreview={(item) => <img src={svgToDataUri(item.svg)} alt="" />} getSecond={(item) => item.category} getThird={(item) => item.fillMode.toUpperCase()} kind="shape" />;
}

function IconList({ items }: { items: EditorIconMock[] }) {
  return <SimpleAssetList items={items} title="ICÔNE ↑" second="CAT." third="FORMAT" getPreview={(item) => item.svg ? <img src={svgToDataUri(item.svg)} alt="" /> : <span className="ef-mono-icon">{item.name.slice(0, 2).toUpperCase()}</span>} getSecond={(item) => item.category} getThird={(item) => item.variant === "mono" ? "SVG" : "PNG"} kind="icon" />;
}

function SimpleAssetList<T extends { id: string; name: string }>(props: { items: T[]; title: string; second: string; third: string; getPreview: (item: T) => React.ReactNode; getSecond: (item: T) => string; getThird: (item: T) => string; kind: string }) {
  if (!props.items.length) return <NoResult />;

  return (
    <div className="ef-list-table">
      <div className="ef-list-row ef-list-head is-icon"><span>{props.title}</span><span>{props.second}</span><span>{props.third}</span></div>
      {props.items.map((item) => (
        <button key={item.id} className="ef-list-row is-icon" type="button" draggable onDragStart={(event) => setDragPayload(event, props.kind, item)}>
          <span className="ef-list-preview">{props.getPreview(item)}</span>
          <strong>{item.name}</strong>
          <span>{props.getSecond(item)}</span>
          <Badge value={props.getThird(item)} />
          <HoverActions />
        </button>
      ))}
    </div>
  );
}

function EmojiGrid({ items }: { items: EditorEmojiMock[] }) {
  if (!items.length) return <NoResult />;

  return (
    <div className="ef-emoji-grid">
      {items.map((item) => (
        <button key={item.id} className="ef-emoji-card" type="button" title={item.name} draggable onDragStart={(event) => setDragPayload(event, "emoji", item)}>
          {item.emoji}
        </button>
      ))}
    </div>
  );
}

function ObjectList({ filter }: { filter: string }) {
  const rows = objects.filter((item) => matchesFilter(filter, [item.id, item.name, item.type, String(item.page), String(item.layerNumber)]));
  if (!rows.length) return <NoResult />;

  return (
    <div className="ef-object-table">
      <div className="ef-object-row ef-list-head"><span>ID</span><span>Type</span><span>Nom</span><span>Pg</span><span>Calq.</span><span>Œil</span><span>Ver.</span></div>
      {rows.map((item) => (
        <button key={item.id} className="ef-object-row" type="button" draggable onDragStart={(event) => setDragPayload(event, "object", item)}>
          <span>{item.id.replace("object-", "")}</span>
          <Badge value={item.type} />
          <strong>{item.name}</strong>
          <span>{item.page}</span>
          <span>{item.layerNumber}</span>
          <span>{item.visible ? "◉" : "○"}</span>
          <span>{item.locked ? "🔒" : "—"}</span>
        </button>
      ))}
    </div>
  );
}

function PageList({ filter }: { filter: string }) {
  const rows = pages.filter((item) => matchesFilter(filter, [item.name, item.orientation, String(item.number), `${item.width}x${item.height}`]));
  if (!rows.length) return <NoResult />;

  return (
    <div className="ef-page-list">
      {rows.map((page) => (
        <button key={page.id} className={["ef-page-card", page.active ? "is-active" : ""].join(" ")} type="button" draggable onDragStart={(event) => setDragPayload(event, "page", page)}>
          <span className="ef-page-preview"><img src={page.previewSvg} alt="" /></span>
          <span className="ef-page-meta"><span className="ef-page-number">{page.number}</span><strong>{page.name}</strong></span>
          <HoverActions />
        </button>
      ))}
    </div>
  );
}

function HoverActions() {
  return (
    <span className="ef-hover-actions" aria-hidden="true">
      <span><Plus size={14} /></span>
      <span><Star size={14} /></span>
      <span><MoreHorizontal size={14} /></span>
    </span>
  );
}

function Badge({ value }: { value: string }) {
  return <span className={`ef-real-badge is-${value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`}>{value.slice(0, 12)}</span>;
}

function FooterActionIcon({ action }: { action: string }) {
  if (action === "Dupliquer") return <Copy size={18} aria-hidden="true" />;
  if (action === "Supprimer") return <span aria-hidden="true">×</span>;
  if (action === "Déplacer") return <span aria-hidden="true">↕</span>;
  return <span aria-hidden="true">✎</span>;
}

function NoResult() {
  return <div className="ef-no-result">Aucun résultat</div>;
}

function filterPlaceholderForSubTab(subTab: EditorLeftSubTab): string {
  const placeholders: Record<EditorLeftSubTab, string> = {
    variables: "Filtrer variables...",
    presets: "Filtrer presets...",
    images: "Filtrer images...",
    "text-blocks": "Filtrer blocs...",
    "charts-shapes": "Filtrer shapes...",
    icons: "Filtrer icônes...",
    emoji: "Filtrer emoji...",
  };

  return placeholders[subTab];
}

function matchesFilter(filter: string, values: string[]): boolean {
  if (!filter.trim()) return true;
  const query = filter.trim().toLowerCase();
  return values.some((value) => value.toLowerCase().includes(query));
}

function setDragPayload(event: React.DragEvent<HTMLElement>, type: string, payload: unknown) {
  event.dataTransfer.setData("application/x-resume-editor-item", JSON.stringify({ type, payload }));
  event.dataTransfer.effectAllowed = "copy";
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
