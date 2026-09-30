// Pure date helpers for fetch-events (no Deno APIs, so vitest can import it).

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export interface EventDates {
  start: string | null;
  end: string | null;
  dateText: string;
}

const iso = (y: number, m: number, d: number): string | null => {
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.toISOString().slice(0, 10);
};

const monthNum = (s: string): number | null => MONTHS[s.slice(0, 3).toLowerCase()] ?? null;

export function isIsoDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && iso(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10)) === s;
}

// Handles "Oct 14-18", "Oct 14", "Oct 30 - Nov 1", "14-18 Oct 2026", "14 Oct",
// "October 14, 2026". Year defaults to defaultYear when absent.
export function parseDateRange(text: string, defaultYear: number): EventDates {
  const dateText = (text || "").trim();
  const year = Number(dateText.match(/\b(20\d{2})\b/)?.[1] ?? defaultYear);
  const t = dateText.replace(/\b20\d{2}\b/g, "").replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
  const none = { start: null, end: null, dateText };

  // "Oct 30 - Nov 1"
  let m = t.match(/^([A-Za-z]{3,9}) (\d{1,2}) ?(?:[-–—]|to) ?([A-Za-z]{3,9}) (\d{1,2})$/);
  if (m) {
    const [m1, m2] = [monthNum(m[1]), monthNum(m[3])];
    if (m1 && m2) return { start: iso(year, m1, +m[2]), end: iso(year, m2, +m[4]), dateText };
  }
  // "Oct 14-18" / "Oct 14"
  m = t.match(/^([A-Za-z]{3,9}) (\d{1,2})(?: ?[-–—] ?(\d{1,2}))?$/);
  if (m) {
    const mo = monthNum(m[1]);
    if (mo) return { start: iso(year, mo, +m[2]), end: m[3] ? iso(year, mo, +m[3]) : null, dateText };
  }
  // "14 Oct - 2 Nov"
  m = t.match(/^(\d{1,2}) ([A-Za-z]{3,9}) ?[-–—] ?(\d{1,2}) ([A-Za-z]{3,9})$/);
  if (m) {
    const [m1, m2] = [monthNum(m[2]), monthNum(m[4])];
    if (m1 && m2) return { start: iso(year, m1, +m[1]), end: iso(year, m2, +m[3]), dateText };
  }
  // "14-18 Oct" / "14 Oct"
  m = t.match(/^(\d{1,2})(?: ?[-–—] ?(\d{1,2}))? ([A-Za-z]{3,9})$/);
  if (m) {
    const mo = monthNum(m[3]);
    if (mo) return { start: iso(year, mo, +m[1]), end: m[2] ? iso(year, mo, +m[2]) : null, dateText };
  }
  return none;
}

// Prefer the model's ISO dates; fall back to parsing the free-text date.
export function resolveDates(
  event: { date?: string; start_date?: string; end_date?: string },
  defaultYear: number,
): EventDates {
  const parsed = parseDateRange(event.date || "", defaultYear);
  const start = isIsoDate(event.start_date) ? event.start_date : parsed.start;
  let end = isIsoDate(event.end_date) ? event.end_date : parsed.end;
  if (start && end && end < start) end = null;
  return { start, end, dateText: parsed.dateText || event.date || "" };
}

export const isPast = (d: EventDates, today: string): boolean => {
  const last = d.end ?? d.start;
  return !!last && last < today;
};
