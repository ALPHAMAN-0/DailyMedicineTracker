import { google, sheets_v4 } from "googleapis";
import { todayISO, monthTabName } from "./date";

export interface Medicine {
  id: string;
  name: string;
  doseCount: number;
  active: boolean;
  createdAt: string;
  removedAt: string;
}

const MEDICINES_SHEET = "Medicines";

let cachedClient: sheets_v4.Sheets | null = null;

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  return id;
}

function getSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables are not set"
    );
  }

  const jwtClient = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth: jwtClient });
  return cachedClient;
}

function quoteSheetName(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

function range(tabName: string, a1: string): string {
  return `${quoteSheetName(tabName)}!${a1}`;
}

/** Converts a 1-indexed column number to its A1 letter (1 -> A, 27 -> AA). */
function columnLetter(n: number): string {
  let result = "";
  let num = n;
  while (num > 0) {
    const rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export function doseColumnLabel(medicineName: string, doseIndex: number): string {
  return `${medicineName} - Dose ${doseIndex + 1}`;
}

function buildHeaderRow(activeMedicines: Medicine[]): string[] {
  return [
    "Date",
    ...activeMedicines.flatMap((m) =>
      Array.from({ length: m.doseCount }, (_, i) => doseColumnLabel(m.name, i))
    ),
  ];
}

async function getSheetTitles(): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets.properties.title",
  });
  return (res.data.sheets ?? [])
    .map((s) => s.properties?.title ?? "")
    .filter(Boolean);
}

// ---- Medicines tab (persistent medicine list) ----

export async function getMedicines(activeOnly = true): Promise<Medicine[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: range(MEDICINES_SHEET, "A2:F"),
  });
  const rows = res.data.values ?? [];
  const medicines: Medicine[] = rows
    .filter((row) => row[0])
    .map((row) => ({
      id: String(row[0] ?? ""),
      name: String(row[1] ?? ""),
      doseCount: Number(row[2] ?? 1),
      active: String(row[3] ?? "").toUpperCase() === "TRUE",
      createdAt: String(row[4] ?? ""),
      removedAt: String(row[5] ?? ""),
    }));
  return activeOnly ? medicines.filter((m) => m.active) : medicines;
}

export async function addMedicine(name: string, doseCount: number): Promise<void> {
  const sheets = getSheetsClient();
  const id = crypto.randomUUID().slice(0, 8);
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: range(MEDICINES_SHEET, "A:F"),
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[id, name, doseCount, true, todayISO(), ""]],
    },
  });
}

export async function removeMedicine(id: string): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: range(MEDICINES_SHEET, "A2:F"),
  });
  const rows = res.data.values ?? [];
  const rowOffset = rows.findIndex((row) => row[0] === id);
  if (rowOffset === -1) return;
  const rowNumber = rowOffset + 2; // +1 header, +1 for 1-indexing
  const createdAt = rows[rowOffset][4] ?? "";
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: range(MEDICINES_SHEET, `D${rowNumber}:F${rowNumber}`),
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[false, createdAt, todayISO()]] },
  });
}

// ---- Monthly tabs (the daily log) ----

export async function ensureMonthTab(
  tabName: string,
  activeMedicines: Medicine[]
): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const titles = await getSheetTitles();
  if (titles.includes(tabName)) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });

  const header = buildHeaderRow(activeMedicines);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: range(tabName, "A1"),
    valueInputOption: "RAW",
    requestBody: { values: [header] },
  });
}

export async function getHeaderRow(tabName: string): Promise<string[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: range(tabName, "1:1"),
  });
  return (res.data.values?.[0] ?? []).map((v) => String(v));
}

/** Appends columns for any active medicine (or newly added dose) missing from the tab's header. */
export async function ensureColumnsForActiveMedicines(
  tabName: string,
  activeMedicines: Medicine[]
): Promise<string[]> {
  const header = await getHeaderRow(tabName);
  const expectedLabels = buildHeaderRow(activeMedicines).slice(1); // drop "Date"
  const missing = expectedLabels.filter((label) => !header.includes(label));
  if (missing.length === 0) return header;

  const newHeader = [...header, ...missing];
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: range(tabName, "A1"),
    valueInputOption: "RAW",
    requestBody: { values: [newHeader] },
  });
  return newHeader;
}

export async function upsertTodayRow(
  tabName: string,
  header: string[],
  checksByColumnLabel: Record<string, boolean>
): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const today = todayISO();

  const dateColRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: range(tabName, "A2:A"),
  });
  const dateRows = dateColRes.data.values ?? [];
  const existingRowOffset = dateRows.findIndex((row) => row[0] === today);

  const row = header.map((col) =>
    col === "Date" ? today : checksByColumnLabel[col] ?? ""
  );
  const lastCol = columnLetter(header.length);

  if (existingRowOffset !== -1) {
    const rowNumber = existingRowOffset + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: range(tabName, `A${rowNumber}:${lastCol}${rowNumber}`),
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: range(tabName, "A:A"),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  }
}

// ---- High-level operations used by the app ----

export async function getTodayChecklist(): Promise<{
  medicines: Medicine[];
  checks: Record<string, boolean[]>;
}> {
  const medicines = await getMedicines(true);
  const checks: Record<string, boolean[]> = {};
  for (const med of medicines) {
    checks[med.id] = new Array(med.doseCount).fill(false);
  }

  const today = todayISO();
  const tabName = monthTabName(today);
  const titles = await getSheetTitles();
  if (!titles.includes(tabName)) {
    return { medicines, checks };
  }

  const header = await getHeaderRow(tabName);
  const sheets = getSheetsClient();
  const dateColRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: range(tabName, "A2:A"),
  });
  const dateRows = dateColRes.data.values ?? [];
  const rowOffset = dateRows.findIndex((row) => row[0] === today);
  if (rowOffset === -1) {
    return { medicines, checks };
  }

  const rowNumber = rowOffset + 2;
  const lastCol = columnLetter(header.length);
  const rowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: range(tabName, `A${rowNumber}:${lastCol}${rowNumber}`),
  });
  const rowValues = rowRes.data.values?.[0] ?? [];

  for (const med of medicines) {
    for (let i = 0; i < med.doseCount; i++) {
      const colIndex = header.indexOf(doseColumnLabel(med.name, i));
      if (colIndex === -1) continue;
      const val = rowValues[colIndex];
      checks[med.id][i] = val === true || String(val).toUpperCase() === "TRUE";
    }
  }

  return { medicines, checks };
}

export async function saveTodayLog(
  checksByMedicineId: Record<string, boolean[]>
): Promise<void> {
  const today = todayISO();
  const tabName = monthTabName(today);
  const medicines = await getMedicines(true);

  await ensureMonthTab(tabName, medicines);
  const header = await ensureColumnsForActiveMedicines(tabName, medicines);

  const checksByColumnLabel: Record<string, boolean> = {};
  for (const med of medicines) {
    const doses = checksByMedicineId[med.id] ?? [];
    for (let i = 0; i < med.doseCount; i++) {
      checksByColumnLabel[doseColumnLabel(med.name, i)] = Boolean(doses[i]);
    }
  }

  await upsertTodayRow(tabName, header, checksByColumnLabel);
}
