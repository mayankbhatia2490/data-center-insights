// Retired: duplicated generate-weekly-index, writing the same weekly_index
// table. Left stubbed here because this project's tooling can't delete a
// deployed function outright — remove it from the Supabase dashboard's Edge
// Functions list when convenient.
Deno.serve(() => new Response(JSON.stringify({ error: "Retired" }), { status: 410 }));
