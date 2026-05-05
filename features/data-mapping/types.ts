export type CsvDelimiter = "," | ";" | "\t" | "|";

export type CsvRow = Record<string, string>;

export type CsvSource = {
  fileName: string;
  delimiter: CsvDelimiter;
  columns: string[];
  rows: CsvRow[];
  rowCount: number;
  columnCount: number;
  importedAt: string;
};

export type CsvSourceSummary = Omit<CsvSource, "rows">;

export type VariableType = "text" | "number" | "boolean" | "date";

export type MappingVariable = {
  id: string;
  key: string;
  label: string;
  sourceColumn: string | null;
  type: VariableType;
  enabled: boolean;
  sampleValue: string;
};
