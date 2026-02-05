// File parser for CSV and XLSX files
// Extends the existing CSV parser with XLSX support

export type ParsedFile = {
  headers: string[];
  rows: string[][];
  rowCount: number;
  fileName: string;
  fileSize: number;
  fileType: "csv" | "xlsx";
};

export type ParseError = {
  message: string;
  row?: number;
  column?: string;
};

export type ParseResult = {
  success: boolean;
  data?: ParsedFile;
  error?: string;
};

/**
 * Remove UTF-8 BOM and normalize line endings
 */
function normalizeText(text: string): string {
  // Remove BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  // Normalize line endings
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Detect CSV delimiter (comma, semicolon, or tab)
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (tabs > commas && tabs > semicolons) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

/**
 * Parse CSV text into a 2D array
 * Handles quoted fields, escaped quotes, and different delimiters
 */
export function parseCsv(text: string, delimiter?: string): string[][] {
  const normalized = normalizeText(text);
  const delim = delimiter || detectDelimiter(normalized);
  
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote
        field += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (ch === delim || ch === "\n")) {
      row.push(field.trim());
      field = "";
      if (ch === "\n") {
        // Only add non-empty rows
        if (row.some((cell) => cell !== "")) {
          rows.push(row);
        }
        row = [];
      }
      continue;
    }

    field += ch;
  }

  // Handle last field
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) {
    rows.push(row);
  }

  return rows;
}

/**
 * Parse XLSX file using the xlsx library
 * Dynamically imports xlsx to keep bundle size smaller
 */
async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  // Dynamic import to avoid loading xlsx unless needed
  const XLSX = await import("xlsx");
  
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  
  if (!firstSheetName) {
    throw new Error("Excel file has no sheets");
  }
  
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  
  // Convert all values to strings and trim
  return data.map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell).trim()))
  );
}

/**
 * Parse a file (CSV or XLSX) and return structured data
 */
export async function parseFile(file: File): Promise<ParseResult> {
  try {
    const fileName = file.name;
    const fileSize = file.size;
    const extension = fileName.split(".").pop()?.toLowerCase();

    let rows: string[][];
    let fileType: "csv" | "xlsx";

    if (extension === "xlsx" || extension === "xls") {
      fileType = "xlsx";
      const buffer = await file.arrayBuffer();
      rows = await parseXlsx(buffer);
    } else if (extension === "csv" || extension === "tsv" || extension === "txt") {
      fileType = "csv";
      const text = await file.text();
      rows = parseCsv(text);
    } else {
      return {
        success: false,
        error: `Unsupported file type: ${extension}. Please upload a CSV or Excel file.`,
      };
    }

    if (rows.length === 0) {
      return {
        success: false,
        error: "File is empty or could not be parsed.",
      };
    }

    if (rows.length === 1) {
      return {
        success: false,
        error: "File only contains headers, no data rows found.",
      };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Normalize header count - ensure all rows have same number of columns
    const maxColumns = Math.max(...rows.map((r) => r.length));
    const normalizedRows = dataRows.map((row) => {
      while (row.length < maxColumns) {
        row.push("");
      }
      return row.slice(0, maxColumns);
    });

    return {
      success: true,
      data: {
        headers: headers.slice(0, maxColumns),
        rows: normalizedRows,
        rowCount: normalizedRows.length,
        fileName,
        fileSize,
        fileType,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse file",
    };
  }
}

/**
 * Get sample values from a column (first 3 non-empty values)
 */
export function getSampleValues(rows: string[][], columnIndex: number, limit = 3): string[] {
  const samples: string[] = [];
  for (const row of rows) {
    const value = row[columnIndex];
    if (value && samples.length < limit) {
      samples.push(value);
    }
    if (samples.length >= limit) break;
  }
  return samples;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
