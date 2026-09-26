// Retired: wrote to an orphaned people_leaders table the frontend never
// reads (superseded by the people-extraction step inside fetch-news). Left
// stubbed here because this project's tooling can't delete a deployed
// function outright — remove it from the Supabase dashboard's Edge
// Functions list when convenient.
Deno.serve(() => new Response(JSON.stringify({ error: "Retired" }), { status: 410 }));
