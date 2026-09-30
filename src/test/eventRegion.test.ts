import { describe, expect, it } from "vitest";
import { isMiddleEast, pickSidebarEvents } from "@/lib/eventRegion";

const ev = (name: string, location: string | null) => ({ name, location });

describe("isMiddleEast", () => {
  it("matches Gulf/MENA locations and names", () => {
    expect(isMiddleEast(ev("DCD Connect MENA 2026", "Dubai, UAE"))).toBe(true);
    expect(isMiddleEast(ev("Data Center Xpo", "Riyadh, Saudi Arabia"))).toBe(true);
    expect(isMiddleEast(ev("GCC Summit", null))).toBe(true);
  });
  it("does not match other regions", () => {
    expect(isMiddleEast(ev("Capacity Europe", "London, United Kingdom"))).toBe(false);
    expect(isMiddleEast(ev("SC26", "Chicago, USA"))).toBe(false);
  });
});

describe("pickSidebarEvents", () => {
  const list = [
    ev("Brazil", "São Paulo"),
    ev("London", "London"),
    ev("Vienna", "Vienna"),
    ev("Riyadh", "Riyadh, Saudi Arabia"),
    ev("Dubai", "Dubai, UAE"),
    ev("Chicago", "Chicago"),
    ev("Abu Dhabi", "Abu Dhabi, UAE"),
    ev("Doha", "Doha, Qatar"),
  ];
  it("reserves up to 3 slots for Middle East events and keeps date order", () => {
    expect(pickSidebarEvents(list, 4, 3).map((e) => e.name)).toEqual([
      "Brazil", "Riyadh", "Dubai", "Abu Dhabi",
    ]);
  });
  it("fills remaining slots with soonest events when few Middle East ones exist", () => {
    const few = [ev("A", "Paris"), ev("B", "Berlin"), ev("Dubai", "Dubai"), ev("C", "Rome"), ev("D", "Oslo")];
    expect(pickSidebarEvents(few, 4, 3).map((e) => e.name)).toEqual(["A", "B", "Dubai", "C"]);
  });
  it("handles fewer events than the limit", () => {
    expect(pickSidebarEvents([ev("A", "Paris")], 4, 3)).toHaveLength(1);
  });
});
