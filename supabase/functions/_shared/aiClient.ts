const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ChatMessage {
  role: string;
  content: string;
}

async function chatCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Gemini is primary. If it errors (rate limit, outage, misconfiguration) and
// GROQ_API_KEY is set, the same messages are retried against Groq instead of
// failing the whole pipeline run. Without GROQ_API_KEY configured this
// behaves exactly as a Gemini-only call.
export async function callAI(
  messages: ChatMessage[],
  geminiModel = "gemini-3.1-flash-lite",
  groqModel = "llama-3.3-70b-versatile"
): Promise<string> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");

  if (geminiKey) {
    try {
      return await chatCompletion(GEMINI_URL, geminiKey, geminiModel, messages);
    } catch (err) {
      console.error("Gemini call failed:", err);
      if (!groqKey) throw err;
      console.log("Falling back to Groq...");
    }
  } else if (!groqKey) {
    throw new Error("Neither GEMINI_API_KEY nor GROQ_API_KEY is configured");
  }

  return await chatCompletion(GROQ_URL, groqKey!, groqModel, messages);
}
