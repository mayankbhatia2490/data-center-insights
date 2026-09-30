import type { Event } from "@/hooks/useSidebarData";

const MIDDLE_EAST =
  /\b(dubai|abu dhabi|sharjah|uae|united arab emirates|riyadh|jeddah|saudi|ksa|doha|qatar|kuwait|bahrain|manama|muscat|oman|jordan|amman|egypt|cairo|middle east|mena|gcc|gulf)\b/i;

export const isMiddleEast = (e: Pick<Event, "name" | "location">): boolean =>
  MIDDLE_EAST.test(`${e.location ?? ""} ${e.name}`);

// Bias the sidebar toward the Middle East without letting it crowd out
// everything else: reserve up to `meSlots` places for the soonest Middle East
// events, fill the rest with the soonest remaining events, then show the
// result in date order. `events` must already be sorted soonest-first.
export function pickSidebarEvents<T extends Pick<Event, "name" | "location">>(
  events: T[],
  limit = 4,
  meSlots = 3,
): T[] {
  const me = events.filter(isMiddleEast).slice(0, meSlots);
  const chosen = new Set(me);
  for (const e of events) {
    if (chosen.size >= limit) break;
    chosen.add(e);
  }
  return events.filter((e) => chosen.has(e));
}
