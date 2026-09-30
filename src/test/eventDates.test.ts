import { describe, expect, it } from "vitest";
import { isPast, parseDateRange, resolveDates } from "../../supabase/functions/_shared/eventDates";

describe("parseDateRange", () => {
  const cases: [string, string | null, string | null][] = [
    ["Oct 14-18", "2026-10-14", "2026-10-18"],
    ["Oct 14-18, 2027", "2027-10-14", "2027-10-18"],
    ["Oct 14", "2026-10-14", null],
    ["October 14, 2026", "2026-10-14", null],
    ["Oct 30 - Nov 1", "2026-10-30", "2026-11-01"],
    ["14-18 October 2026", "2026-10-14", "2026-10-18"],
    ["14 Oct", "2026-10-14", null],
    ["14 Oct - 2 Nov", "2026-10-14", "2026-11-02"],
    ["TBA", null, null],
    ["Feb 30", null, null],
  ];
  it.each(cases)("%s", (text, start, end) => {
    const r = parseDateRange(text, 2026);
    expect([r.start, r.end]).toEqual([start, end]);
  });
});

describe("resolveDates / isPast", () => {
  it("prefers valid ISO dates from the model", () => {
    const r = resolveDates({ date: "TBA", start_date: "2026-11-02", end_date: "2026-11-04" }, 2026);
    expect([r.start, r.end]).toEqual(["2026-11-02", "2026-11-04"]);
  });
  it("drops an end before the start", () => {
    expect(resolveDates({ start_date: "2026-11-05", end_date: "2026-11-01" }, 2026).end).toBeNull();
  });
  it("flags ended events only", () => {
    expect(isPast({ start: "2026-09-01", end: "2026-09-03", dateText: "" }, "2026-09-30")).toBe(true);
    expect(isPast({ start: "2026-09-30", end: null, dateText: "" }, "2026-09-30")).toBe(false);
    expect(isPast({ start: null, end: null, dateText: "" }, "2026-09-30")).toBe(false);
  });
});
