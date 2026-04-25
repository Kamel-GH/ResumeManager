import {
  Bell,
  ChartColumn,
  CircleHelp,
  Database,
  FileText,
  FilePlus2,
  FolderOpen,
  Image,
  Layers,
  Library,
  MessageSquare,
  MousePointer2,
  PencilLine,
  PenLine,
  Save,
  Search,
  Share2,
  Copy,
  Eye,
  Upload,
  Shapes,
  Star,
  Table2,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EditorNavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export const editorNavItems: EditorNavItem[] = [
  { label: "Données", icon: Database, active: true },
  { label: "Bibliothèques", icon: Library },
  { label: "Calques", icon: Layers },
  { label: "Objets", icon: Shapes },
  { label: "Pages", icon: FileText },
];

export const documentActions = [
  { label: "Nouveau", icon: FilePlus2 },
  { label: "Ouvrir", icon: FolderOpen },
  { label: "Enregistrer", icon: Save },
  { label: "Exporter", icon: Upload, primary: true },
  { label: "Aperçu", icon: Eye },
];

export const utilityActions = [
  { label: "Recherche", icon: Search },
  { label: "Partager / Publier", icon: Share2 },
  { label: "Aide", icon: CircleHelp },
  { label: "Notifications", icon: Bell },
];

export const canvasTools = [
  { label: "Sélection", icon: MousePointer2, active: true },
  { label: "Texte", icon: Type },
  { label: "Image", icon: Image },
  { label: "Forme", icon: Copy },
  { label: "Ligne", icon: PenLine },
  { label: "Icône", icon: Star },
  { label: "Tableau", icon: Table2 },
  { label: "Graphique", icon: ChartColumn },
  { label: "Dessin libre", icon: PencilLine },
  { label: "Commentaire", icon: MessageSquare },
];

export const variables = [
  { token: "[Nom]", type: "TEXTE", color: "#3b82f6" },
  { token: "[Prenom]", type: "TEXTE", color: "#3b82f6" },
  { token: "[Poste]", type: "TEXTE", color: "#3b82f6" },
  { token: "[Telephone]", type: "TEXTE", color: "#3b82f6" },
  { token: "[Email]", type: "TEXTE", color: "#3b82f6" },
  { token: "[Photo]", type: "IMAGE", color: "#22c55e" },
  { token: "[Experience]", type: "LISTE", color: "#f59e0b" },
  { token: "[Competences]", type: "LISTE", color: "#f59e0b" },
  { token: "[Langues]", type: "TABLE", color: "#8b5cf6" },
];

export const presets = [
  { title: "CV Classique", subtitle: "A4 sobre" },
  { title: "CV Creatif", subtitle: "Accent or" },
  { title: "Flyer Evenement", subtitle: "Format print" },
  { title: "Brochure Entreprise", subtitle: "Multi-pages" },
];

export const pages = ["Cover", "Page 2", "Page 3"];

export const layers = [
  { name: "Header", children: ["Photo profil", "Nom & Prenom", "Poste"], active: "Nom & Prenom" },
  { name: "Sidebar", children: ["Contact", "Competences", "Langues"] },
  { name: "Content", children: ["Experience", "Repeater Experience", "Formation"] },
  { name: "Footer", children: ["Mention", "Page number"] },
];

export const mappingRows = [
  { source: "Nom & Prenom", field: "Nom + Prenom", target: "[Nom] [Prenom]", preview: "Lucas Dupont", status: "Valide" },
  { source: "Poste", field: "Poste", target: "[Poste]", preview: "Directeur Artistique", status: "Valide" },
  { source: "Telephone", field: "Telephone", target: "[Telephone]", preview: "+33 6 12 34 56 78", status: "Valide" },
  { source: "Email", field: "Email", target: "[Email]", preview: "lucas.dupont@email.com", status: "Valide" },
];

export const repeaterRows = [
  { label: "Experience List", items: "3 items", target: "[Experience]" },
  { label: "Competences", items: "5 items", target: "[Competences]" },
  { label: "Langues", items: "3 items", target: "[Langues]" },
];

export const dataPreview = [
  "Dupont",
  "Lucas",
  "Directeur Artistique",
  "+33 6 18 42 77 10",
];

export const chartBars = [
  { label: "Design", value: 92 },
  { label: "Branding", value: 84 },
  { label: "Motion", value: 68 },
];
