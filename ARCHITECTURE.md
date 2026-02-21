# Data Center Pulse — Architecture Manifest

## 1. Package Dependencies

### Frontend (React/Vite)
| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | ^18.3.1 | UI framework |
| react-router-dom | ^6.30.1 | Client-side routing |
| @tanstack/react-query | ^5.83.0 | Data fetching, caching, polling |
| @supabase/supabase-js | ^2.97.0 | Supabase client SDK |
| tailwindcss-animate | ^1.0.7 | Tailwind animation utilities |
| tailwind-merge | ^2.6.0 | Conditional class merging |
| class-variance-authority | ^0.7.1 | Component variant system |
| clsx | ^2.1.1 | Classname utility |
| lucide-react | ^0.462.0 | Icon library |
| recharts | ^2.15.4 | Charting (Stats page) |
| react-markdown | ^10.1.0 | Markdown rendering (Digest, Chatbot) |
| date-fns | ^3.6.0 | Date formatting |
| sonner | ^1.7.4 | Toast notifications |
| react-hook-form | ^7.61.1 | Form handling |
| zod | ^3.25.76 | Schema validation |
| @hookform/resolvers | ^3.10.0 | Zod ↔ react-hook-form bridge |
| next-themes | ^0.3.0 | Dark/light mode |
| vaul | ^0.9.9 | Drawer component |
| cmdk | ^1.1.1 | Command palette |
| embla-carousel-react | ^8.6.0 | Carousel |
| input-otp | ^1.4.2 | OTP input |
| react-day-picker | ^8.10.1 | Date picker |
| react-resizable-panels | ^2.1.9 | Resizable panels |

### UI Component Library
All `@radix-ui/*` primitives (accordion, dialog, dropdown-menu, tabs, tooltip, etc.) via **shadcn/ui**.

### Build Tooling
- **Vite** (bundler)
- **TypeScript** (strict mode)
- **PostCSS** + **Tailwind CSS**
- **Vitest** (testing)
- **ESLint** (linting)

---

## 2. Frontend Data Flow

### Supabase Client
```
src/integrations/supabase/client.ts
```
- Initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Used throughout via `import { supabase } from "@/integrations/supabase/client"`

### TanStack React Query Polling Intervals

| Hook / Query Key | Refetch Interval | Source |
|-----------------|-----------------|--------|
| `useArticles` | 5 min (300,000ms) | `src/hooks/useArticles.ts` |
| `useMarketTickers` | 5 min (300,000ms) | `src/hooks/useSidebarData.ts` |
| `useEvents` | 30 min (1,800,000ms) | `src/hooks/useSidebarData.ts` |
| `useIntelligence` | 10 min (600,000ms) | `src/hooks/useIntelligence.ts` |

### Pages & Routes
| Route | Page Component | Purpose |
|-------|---------------|---------|
| `/` | `Index.tsx` | Homepage: hero, daily digest, news feed, sidebar |
| `/archive` | `Archive.tsx` | Full article archive with filters |
| `/intelligence` | `Intelligence.tsx` | Weekly Pulse Index, Market Signals |
| `/insights` | `Insights.tsx` | Editor's Picks, Keyword Cloud |
| `/leaders` | `Leaders.tsx` | Industry leadership directory |
| `/leaders/:id` | `LeaderProfile.tsx` | Individual leader profile |
| `/stats` | `Stats.tsx` | Industry statistics & charts |
| `/unsubscribe` | `Unsubscribe.tsx` | Newsletter unsubscribe |

---

## 3. Edge Functions & Trigger Schedule

### Function Inventory

| Function | Trigger | Schedule | AI Model Used | Description |
|----------|---------|----------|---------------|-------------|
| `fetch-news` | Cron | `0 */2 * * *` (every 2h) | `gemini-2.5-flash-lite` | RSS/API ingestion + AI quality gate, summarization, sentiment, insight, people extraction |
| `generate-digest` | Cron | `0 4 * * *` (daily 04:00) | `gemini-3-flash-preview` | Morning intelligence briefing from last 24h articles |
| `send-newsletter` | Cron | `30 4 * * *` (daily 04:30) | — | Sends digest email via Resend to all subscribers |
| `fetch-stocks` | Cron | `0 */4 * * *` (every 4h) | `gemini-2.5-flash-lite` | AI-driven stock ticker extraction + Alpha Vantage quotes |
| `fetch-events` | Cron | `0 6 * * *` (daily 06:00) | `gemini-2.5-flash-lite` | Firecrawl search + AI extraction of industry events |
| `fetch-stats` | Cron | `0 5 1 * *` (monthly 1st) | `gemini-2.5-flash-lite` | AI-estimated industry statistics |
| `extract-people` | Cron | `0 3 * * *` (daily 03:00) | `gemini-2.5-flash-lite` | Extract industry leaders from recent articles |
| `extract-capacity` | Cron | `0 4 * * *` (daily 04:00) | `gemini-2.5-flash-lite` | Extract MW capacity data from articles |
| `market-signals` | Cron | `0 5 * * *` (daily 05:00) | `gemini-2.5-flash-lite` | Detect trends, risks, opportunities |
| `strategic-insights` | Cron | `0 7 * * 1` (weekly Mon) | `gemini-2.5-flash-lite` | Generate actionable business insights from signals |
| `regional-outlook` | Cron | `0 6 * * 1` (weekly Mon) | `gemini-2.5-flash-lite` | Per-region market outlook (UAE, Saudi, EU, US, Asia) |
| `word-cloud` | Cron | `0 1 * * *` (daily 01:00) | `gemini-2.5-flash-lite` | AI keyword extraction for trending topics |
| `generate-weekly-index` | Cron | `0 8 * * 1` (weekly Mon) | `gemini-2.5-flash` | Weekly Pulse Index score (-100 to +100) |
| `compute-trending` | Cron | — (duplicate of weekly-index) | `gemini-3-flash-preview` | Weekly index (legacy) |
| `backfill-insights` | Manual | — | `gemini-2.5-flash-lite` | Backfill missing insights & sentiment on articles |
| `news-chat` | On-demand | — | `gemini-3-flash-preview` | Streaming AI chatbot with news context |
| `subscribe` | On-demand | — | — | Newsletter subscription endpoint |
| `unsubscribe` | On-demand | — | — | Newsletter unsubscribe endpoint |
| `word-bubble` | On-demand | — | — | Simple word frequency analysis (no AI) |

### AI Gateway
- **Current**: `https://ai.gateway.lovable.dev/v1/chat/completions` (OpenAI-compatible)
- **Auth**: `Bearer LOVABLE_API_KEY`
- **Migration target**: Replace with direct Gemini API (`https://generativelanguage.googleapis.com/v1beta/`) or OpenAI API

### AI Models Used
| Model | Used By | Purpose |
|-------|---------|---------|
| `google/gemini-2.5-flash-lite` | fetch-news, fetch-stocks, fetch-events, fetch-stats, market-signals, strategic-insights, regional-outlook, word-cloud, extract-capacity, extract-people, backfill-insights | Fast classification, extraction, summarization |
| `google/gemini-2.5-flash` | generate-weekly-index | Higher quality for weekly index generation |
| `google/gemini-3-flash-preview` | generate-digest, news-chat, compute-trending | Highest quality for digest writing and conversational AI |

---

## 4. Data Pipeline Flow

```
                    ┌──────────────┐
                    │  RSS Feeds   │ (9 feeds: DCD, DCK, Register, etc.)
                    │  News API    │
                    │  Firecrawl   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  fetch-news  │ (every 2h)
                    │  • Dedup     │
                    │  • Quality   │
                    │  • AI Enrich │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │      articles table     │
              │  (title, summary,       │
              │   sentiment, insight,   │
              │   category, source)     │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
  │ generate-  │    │  extract-   │    │  market-    │
  │ digest     │    │  people     │    │  signals    │
  │ (daily)    │    │  (daily)    │    │  (daily)    │
  └─────┬──────┘    └─────┬──────┘    └──────┬──────┘
        │                 │                  │
  ┌─────▼──────┐   ┌─────▼──────┐   ┌──────▼──────┐
  │ send-      │   │  people    │   │  strategic- │
  │ newsletter │   │  leaders   │   │  insights   │
  │ (daily)    │   │  tables    │   │  (weekly)   │
  └────────────┘   └────────────┘   └─────────────┘
```

---

## 5. Migration Notes (Lovable → Self-Hosted)

### AI Gateway Replacement
Replace all `https://ai.gateway.lovable.dev/v1/chat/completions` calls with:

**Option A: Google Gemini Direct**
```typescript
const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  }),
});
// Add ?key=YOUR_GEMINI_API_KEY to the URL
```

**Option B: OpenAI-Compatible Proxy (e.g., LiteLLM)**
Keep the same fetch calls but change the URL to your proxy.

### Deployment
- **Frontend**: `npm run build` → deploy `dist/` to Vercel/Netlify
- **Edge Functions**: Deploy to standalone Supabase with `supabase functions deploy`
- **Database**: Run `database_export.sql` against your Supabase project
- **Cron Jobs**: Update URLs in `database_export.sql` cron section and run against your DB
- **Secrets**: Set all env vars from `.env.example` as Supabase secrets
