export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`))
    .replace(" de ", " ");
}

/** Prefixa com apóstrofo valores textuais interpretáveis como fórmulas por planilhas. */
function escapeCsvCell(value: string | number) {
  let cell = String(value);
  if (typeof value === "string" && /^[\s\u0000-\u001f]*[=+\-@]/u.test(value)) {
    cell = `'${cell}`;
  }
  return `"${cell.replaceAll('"', '""')}"`;
}

/** Serializador exportado para manter a neutralização de fórmulas testável sem criar arquivos. */
export function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  return [columns.map(escapeCsvCell).join(";"), ...rows.map(row => columns.map(key => escapeCsvCell(row[key] ?? "")).join(";"))].join("\r\n");
}

export function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const csv = toCsv(rows);
  if (!csv) return;
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function friendlyError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
