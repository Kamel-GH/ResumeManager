import type { CsvDelimiter, CsvRow, CsvSource, CsvSourceSummary, MappingVariable, VariableType } from "@/features/data-mapping/types";

const DELIMITER_CANDIDATES: CsvDelimiter[] = [",", ";", "\t", "|"];
const BOOLEAN_VALUES = new Set(["true", "false", "yes", "no", "oui", "non"]);

export type ParsedCsv = {
  delimiter: CsvDelimiter;
  columns: string[];
  rows: CsvRow[];
};

export function parseCsvText(text: string): ParsedCsv {
  const content = text.replace(/^\uFEFF/, "").trim();
  if (!content) {
    return { delimiter: ",", columns: [], rows: [] };
  }

  const delimiter = resolveCsvDelimiter(content);
  const records = parseDelimitedRecords(content, delimiter).filter((record) => record.some((cell) => cell.trim().length > 0));
  const [rawHeaders = [], ...rawRows] = records;
  const headers = normalizeCsvHeaders(rawHeaders);
  const rows = rawRows.map((record) => buildRow(headers, record));

  return { delimiter, columns: headers, rows };
}

export function createCsvSource(input: {
  fileName: string;
  delimiter: CsvDelimiter;
  columns: string[];
  rows: CsvRow[];
}): CsvSource {
  return {
    fileName: input.fileName,
    delimiter: input.delimiter,
    columns: input.columns,
    rows: input.rows,
    rowCount: input.rows.length,
    columnCount: input.columns.length,
    importedAt: new Date().toISOString(),
  };
}

export function createCsvSourceSummary(source: CsvSource): CsvSourceSummary {
  const { rows: _rows, ...summary } = source;
  return summary;
}

export function createVariablesFromCsvSource(source: CsvSource): MappingVariable[] {
  return source.columns.map((column, index) => {
    const samples = source.rows.slice(0, 8).map((row) => row[column] ?? "").filter((value) => value.trim().length > 0);
    return {
      id: `variable-${index + 1}`,
      key: slugifyVariableKey(column, index + 1),
      label: column,
      sourceColumn: column,
      type: inferVariableType(samples),
      enabled: true,
      sampleValue: samples[0] ?? "",
    };
  });
}

export function inferVariableType(values: string[]): VariableType {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return "text";
  }

  const allBoolean = normalized.every((value) => BOOLEAN_VALUES.has(value.toLowerCase()));
  if (allBoolean) {
    return "boolean";
  }

  const allNumber = normalized.every((value) => isNumericValue(value));
  if (allNumber) {
    return "number";
  }

  const allDate = normalized.every((value) => !Number.isNaN(Date.parse(value)));
  if (allDate) {
    return "date";
  }

  return "text";
}

export function slugifyVariableKey(value: string, fallbackIndex: number) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || `variable_${fallbackIndex}`;
}

export function formatCsvCellPreview(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "—";
  }

  return trimmed.length > 48 ? `${trimmed.slice(0, 45)}…` : trimmed;
}

function resolveCsvDelimiter(content: string): CsvDelimiter {
  const firstLine = readFirstLine(content);
  const counts = DELIMITER_CANDIDATES.map((delimiter) => ({
    delimiter,
    count: countDelimiter(firstLine, delimiter),
  }));

  const sorted = counts.sort((a, b) => b.count - a.count);
  const best = sorted[0];
  return best && best.count > 0 ? best.delimiter : ",";
}

function readFirstLine(content: string) {
  let inQuotes = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"') {
      if (inQuotes && content[index + 1] === '"') {
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      return content.slice(0, index);
    }
  }

  return content;
}

function countDelimiter(line: string, delimiter: string) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }

  return count;
}

function parseDelimitedRecords(content: string, delimiter: CsvDelimiter) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      if (inQuotes && content[index + 1] === '"') {
        currentCell += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";

      if (char === "\r" && content[index + 1] === "\n") {
        index += 1;
      }

      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);
  return rows;
}

function normalizeCsvHeaders(headers: string[]) {
  const seen = new Set<string>();
  return headers.map((header, index) => {
    const base = header.trim() || `Colonne ${index + 1}`;
    let candidate = base;
    let suffix = 2;
    while (seen.has(candidate)) {
      candidate = `${base} (${suffix})`;
      suffix += 1;
    }
    seen.add(candidate);
    return candidate;
  });
}

function buildRow(headers: string[], record: string[]) {
  return headers.reduce<CsvRow>((row, header, index) => {
    row[header] = (record[index] ?? "").trim();
    return row;
  }, {});
}

function isNumericValue(value: string) {
  const normalized = value.replace(",", ".");
  return normalized.trim().length > 0 && Number.isFinite(Number(normalized));
}
