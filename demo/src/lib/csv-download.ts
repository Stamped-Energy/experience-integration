/** Browser-side fixture CSV download for Auto reports hub. */

export function downloadTextFile(filename: string, body: string, mime = "text/csv"): void {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  const needsFormulaGuard = FORMULA_PREFIX.test(raw);
  const guarded = needsFormulaGuard ? `'${raw}` : raw;
  if (/[",\n\r]/.test(guarded) || needsFormulaGuard) {
    return `"${guarded.replaceAll('"', '""')}"`;
  }
  return guarded;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  return `${[
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n")}\n`;
}
