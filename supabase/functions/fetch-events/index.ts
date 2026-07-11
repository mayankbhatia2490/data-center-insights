import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EVENT_SOURCES = [
  "data center industry events 2026",
  "GITEX 2026 data center conference",
  "data center world 2026 conference",
  "capacity media events 2026",
];

// Parse date strings like "Oct 14-18, 2026" or "March 12-13"
function parseDateRange(text: string): { start: string | null; end: string | null; dateText: string } {
  const dateText = text.trim();
  // Try to extract year, default to 2026
  const yearMatch = dateText.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : "2026";
  
  // Try to parse month-day ranges like "Oct 14-18"
  const rangeMatch = dateText.match(/(\w+)\s+(\d{1,2})[-–](\d{1,2})/);
  if (rangeMatch) {
    const month = rangeMatch[1];
    const startDay = rangeMatch[2];
    const endDay = rangeMatch[3];
    try {
      const start = new Date(`${month} ${startDay}, ${year}`);
      const end = new Date(`${month} ${endDay}, ${year}`);
      if (!isNaN(start.getTime())) {
        return {
          start: start.toISOString().split("T")[0],
          end: !isNaN(end.getTime()) ? end.toISOString().split("T")[0] : null,
          dateText,
        };
      }
    } catch { /* fall through */ }
  }
  
  return { start: null, end: null, dateText };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
          body: JSON.stringify({ query, limit: 5 }),
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

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Extract upcoming data center industry events from the provided search results. Return ONLY a JSON array of events with fields: name, location, date (e.g. 'Oct 14-18'), url. Include only real, confirmed events happening in 2026 or later. Maximum 6 events. Return raw JSON array, no markdown.",
          },
          { role: "user", content: context },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error("AI extraction failed:", aiRes.status);
      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    let eventsText = aiData.choices?.[0]?.message?.content || "[]";
    
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

    let inserted = 0;
    for (const event of events) {
      if (!event.name) continue;
      const { start, end, dateText } = parseDateRange(event.date || "");
      const { error } = await supabase
        .from("events")
        .upsert(
          {
            name: event.name,
            location: event.location || null,
            date_text: dateText || event.date || null,
            start_date: start,
            end_date: end,
            source_url: event.url || null,
          },
          { onConflict: "source_url", ignoreDuplicates: true }
        );
      if (!error) inserted++;
      else console.error("Event upsert error:", error);
    }

    console.log(`Inserted ${inserted} events`);

    return new Response(
      JSON.stringify({ success: true, found: events.length, inserted }),
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
