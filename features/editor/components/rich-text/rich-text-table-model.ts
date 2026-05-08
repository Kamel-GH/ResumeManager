export type RichTextTableBorderPreset =
  | "none"
  | "all"
  | "outside"
  | "inside"
  | "horizontal"
  | "vertical";

export interface RtpTableStyleAttrs {
  bordered?: boolean;
  striped?: boolean;
  firstColumn?: boolean;
  borderColor?: string | null;
  borderWidth?: string | null;
  borderPreset?: RichTextTableBorderPreset | null;
  tableWidth?: string | null;
  headerBackgroundColor?: string | null;
  headerTextColor?: string | null;
  firstColumnBackgroundColor?: string | null;
  firstColumnTextColor?: string | null;
  stripedEvenColor?: string | null;
  stripedOddColor?: string | null;
}

export interface RtpTableCellStyleAttrs {
  backgroundColor?: string | null;
  textAlign?: string | null;
  verticalAlign?: string | null;
  cellPadding?: string | null;
  colwidth?: number[] | null;
}

export interface RtpTableRowStyleAttrs {
  rowHeight?: string | null;
}

export const RICH_TEXT_COLOR_PALETTES = [
  {
    label: "Neutres",
    colors: ["#ffffff", "#f8fafc", "#e5e7eb", "#cbd5e1", "#94a3b8", "#475569", "#111827"],
  },
  {
    label: "Document",
    colors: ["#fef3c7", "#fde68a", "#f59e0b", "#d97706", "#92400e", "#1d4ed8", "#0f172a"],
  },
  {
    label: "Accents",
    colors: ["#fee2e2", "#fecaca", "#fca5a5", "#dc2626", "#dcfce7", "#86efac", "#16a34a"],
  },
  {
    label: "Froids",
    colors: ["#dbeafe", "#93c5fd", "#2563eb", "#e0f2fe", "#67e8f9", "#0891b2", "#0f766e"],
  },
] as const;

export const RICH_TEXT_BORDER_PRESETS: Array<{
  value: RichTextTableBorderPreset;
  label: string;
  description: string;
}> = [
  { value: "none", label: "Aucune", description: "Masque toutes les bordures." },
  { value: "all", label: "Toutes", description: "Applique contour et cellules." },
  { value: "outside", label: "Contour", description: "Bordure externe uniquement." },
  { value: "inside", label: "Intérieures", description: "Traits internes uniquement." },
  { value: "horizontal", label: "Horizontales", description: "Traits de lignes." },
  { value: "vertical", label: "Verticales", description: "Traits de colonnes." },
] as const;
