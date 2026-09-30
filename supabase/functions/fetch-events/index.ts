import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cronAuth.ts";
import { callAI } from "../_shared/aiClient.ts";
import { isPast, resolveDates } from "../_shared/eventDates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EVENT_SOURCES = [
  "data center industry events 2026",
  "data center conference 2027",
  "GITEX Global data center conference Dubai",
  "Datacloud Global Congress Cannes",
  "DCD Connect Dubai Riyadh data center conference",
  "LEAP Riyadh data center summit",
  "Capacity Middle East conference data centre",
  "Saudi Arabia UAE data center summit expo",
  "India data center conference summit",
  "Data Center World conference",
];

// Events ended more than this many days ago are pruned; undated rows are
// pruned by created_at after UNDATED_TTL_DAYS.
const PRUNE_AFTER_DAYS = 30;
const UNDATED_TTL_DAYS = 90;
const MAX_EVENTS = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireCronSecret(req, corsHeaders);
  if (authError) return authError;

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().slice(0, 10);
    const defaultYear = Number(today.slice(0, 4));

    // Search for events using Firecrawl
    const allResults: any[] = [];
    for (const query of EVENT_SOURCES) {
      try {
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 6 }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.data) allResults.push(...data.data);
      } catch (e) {
        console.error(`Firecrawl search error for "${query}":`, e);
      }
    }

    console.log(`Found ${allResults.length} potential event results`);

    // Use AI to extract structured events from the search results
    const context = allResults
      .map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ""}`)
      .join("\n---\n");

    let eventsText: string;
    try {
      eventsText = await callAI([
        {
          role: "system",
          content: `Today is ${today}. Extract upcoming data center industry events from the provided search results. Return ONLY a JSON array of events with fields: name, location, date (human text, e.g. 'Oct 14-18, 2026'), start_date (YYYY-MM-DD or null), end_date (YYYY-MM-DD or null), url (the event's own page). Include only real events that start on or after ${today}; skip anything already past and skip duplicates. Prefer events in the Middle East, Africa, India and major global data center events. Maximum ${MAX_EVENTS} events. Return raw JSON array, no markdown.`,
        },
        { role: "user", content: context },
      ]);
    } catch (err) {
      console.error("AI extraction failed:", err);
      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean markdown fences if present
    eventsText = eventsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let events: any[];
    try {
      events = JSON.parse(eventsText);
    } catch {
      console.error("Failed to parse AI events:", eventsText.slice(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(events)) events = [];

    let saved = 0;
    let skippedPast = 0;
    let skippedNoUrl = 0;
    for (const event of events.slice(0, MAX_EVENTS)) {
      if (!event?.name) continue;
      if (!event.url) { skippedNoUrl++; continue; } // source_url is the dedupe key
      const dates = resolveDates(event, defaultYear);
      if (isPast(dates, today)) { skippedPast++; continue; }
      const { error } = await supabase
        .from("events")
        .upsert(
          {
            name: event.name,
            location: event.location || null,
            date_text: dates.dateText || null,
            start_date: dates.start,
            end_date: dates.end,
            source_url: event.url,
          },
          { onConflict: "source_url" } // update in place so corrected dates/locations land
        );
      if (!error) saved++;
      else console.error("Event upsert error:", error);
    }

    // Prune stale rows so they can't crowd out upcoming events.
    const day = 24 * 60 * 60 * 1000;
    const pruneBefore = new Date(Date.now() - PRUNE_AFTER_DAYS * day).toISOString().slice(0, 10);
    const undatedBefore = new Date(Date.now() - UNDATED_TTL_DAYS * day).toISOString();
    const { error: pruneErr1 } = await supabase.from("events").delete().lt("end_date", pruneBefore);
    const { error: pruneErr2 } = await supabase
      .from("events").delete().is("end_date", null).lt("start_date", pruneBefore);
    const { error: pruneErr3 } = await supabase
      .from("events").delete().is("end_date", null).is("start_date", null).lt("created_at", undatedBefore);
    for (const e of [pruneErr1, pruneErr2, pruneErr3]) if (e) console.error("Event prune error:", e);

    console.log(`Saved ${saved} events (skipped ${skippedPast} past, ${skippedNoUrl} without url)`);

    return new Response(
      JSON.stringify({ success: true, found: events.length, saved, skippedPast, skippedNoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-events error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
