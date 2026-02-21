

# Data Center Pulse - Complete Project Documentation and Independence Guide

## 1. Project Overview

Data Center Pulse is a news aggregation and newsletter platform for the data center industry. It automatically fetches, filters, and presents news articles with AI-powered summaries, sentiment analysis, and daily digest generation.

## 2. Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM v6
- **State/Data Fetching**: TanStack React Query
- **Charts**: Recharts
- **Markdown Rendering**: react-markdown

### Backend (currently on Lovable Cloud / Supabase)
- **Database**: PostgreSQL (via Supabase)
- **Serverless Functions**: 8 Deno-based Edge Functions
- **Scheduled Jobs**: pg_cron (news fetch every 2 hours)

---

## 3. Database Schema (5 Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **articles** | News articles | title, summary, category, source, source_url, sentiment, image_url, published_at, read_time |
| **subscribers** | Newsletter subscribers | email, name, confirmed, unsubscribe_token, preferences |
| **daily_digests** | AI-generated daily summaries | digest_date, content, article_count |
| **market_tickers** | Stock prices (EQIX, DLR, IRM, QTS) | symbol, name, price, change_percent, status |
| **events** | Industry events | name, location, date_text, start_date, end_date, source_url |

---

## 4. Edge Functions (8 Total)

| Function | Purpose | External Dependencies |
|----------|---------|----------------------|
| **fetch-news** | Fetches from RSS, News API, Firecrawl; AI quality filter + summarization + sentiment | NEWS_API_KEY, FIRECRAWL_API_KEY, LOVABLE_API_KEY |
| **fetch-stocks** | Gets stock prices from Alpha Vantage | ALPHA_VANTAGE_API_KEY |
| **fetch-events** | Searches for industry events via Firecrawl + AI extraction | FIRECRAWL_API_KEY, LOVABLE_API_KEY |
| **generate-digest** | AI-generates daily newsletter digest | LOVABLE_API_KEY |
| **news-chat** | AI chatbot for querying news (streaming) | LOVABLE_API_KEY |
| **subscribe** | Handles email subscriptions | None (DB only) |
| **unsubscribe** | Handles unsubscriptions | None (DB only) |
| **send-newsletter** | Sends digest emails via Resend | RESEND_API_KEY |

---

## 5. Required API Keys / Secrets

| Secret | Service | Purpose | Required? |
|--------|---------|---------|-----------|
| NEWS_API_KEY | newsapi.org | News article fetching | Optional (RSS works without it) |
| FIRECRAWL_API_KEY | firecrawl.dev | Web search for news + events | Optional |
| ALPHA_VANTAGE_API_KEY | alphavantage.co | Stock price data | Required for market tickers |
| RESEND_API_KEY | resend.com | Sending newsletter emails | Required for newsletters |
| LOVABLE_API_KEY | Lovable AI Gateway | AI summaries, sentiment, quality filter, digest, chatbot | **This is the main Lovable dependency** |

---

## 6. Scheduled Jobs

- **fetch-news-every-2-hours**: Runs `0 */2 * * *` via pg_cron, calls the fetch-news edge function

---

## 7. Steps to Remove Lovable Dependency

### Step 1: Export the Code
- Go to Settings and transfer your project to GitHub
- Clone the repository locally

### Step 2: Set Up Your Own Supabase Project
- Create a free account at [supabase.com](https://supabase.com)
- Create a new project
- Run all 8 migration files from `supabase/migrations/` in order via the SQL editor
- This recreates all 5 tables and enables pg_cron + pg_net

### Step 3: Replace the Lovable AI Gateway
This is the **biggest change**. Four edge functions use `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`. You need to replace this with your own AI provider:

**Option A: Use OpenAI directly**
- Get an API key from [platform.openai.com](https://platform.openai.com)
- In all 4 functions, change the URL to `https://api.openai.com/v1/chat/completions`
- Change models from `google/gemini-*` to `gpt-4o-mini` or `gpt-4o`
- Store your key as `OPENAI_API_KEY` in Supabase secrets

**Option B: Use Google AI (Gemini) directly**
- Get an API key from [aistudio.google.com](https://aistudio.google.com)
- Change the URL to `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- Keep the same model names but adjust the format
- Store your key in Supabase secrets

**Files to modify:**
- `supabase/functions/fetch-news/index.ts` (4 AI calls: quality filter, summarize, sentiment)
- `supabase/functions/news-chat/index.ts` (1 AI call: chatbot)
- `supabase/functions/generate-digest/index.ts` (1 AI call: digest generation)
- `supabase/functions/fetch-events/index.ts` (1 AI call: event extraction)

### Step 4: Update Environment Variables
In `src/integrations/supabase/client.ts` (or create your own), update:
- `VITE_SUPABASE_URL` to your new Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` to your new anon key

### Step 5: Deploy Edge Functions
- Install Supabase CLI: `npm i -g supabase`
- Link your project: `supabase link --project-ref YOUR_PROJECT_ID`
- Deploy all functions: `supabase functions deploy`
- Set secrets: `supabase secrets set NEWS_API_KEY=xxx RESEND_API_KEY=xxx ...`

### Step 6: Re-create the Cron Job
Run this SQL in your new Supabase SQL editor (replace the URL and anon key):
```text
select cron.schedule(
  'fetch-news-every-2-hours',
  '0 */2 * * *',
  $$
  select net.http_post(
    url:='https://YOUR_PROJECT.supabase.co/functions/v1/fetch-news',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Step 7: Remove Lovable-specific packages
- Remove `lovable-tagger` from devDependencies
- Remove the `componentTagger()` plugin from `vite.config.ts`
- Update `index.html` meta tags (author, OG images) to your own

### Step 8: Host the Frontend
- **Vercel**: `npm run build` then deploy the `dist` folder (free tier available)
- **Netlify**: Same process, drag-and-drop or connect GitHub
- **Cloudflare Pages**: Connect your GitHub repo

---

## 8. Estimated Monthly Costs (Self-Hosted)

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| Supabase | 500MB DB, 50K edge function calls | $25/mo (Pro) |
| OpenAI or Gemini | Varies | $5-20/mo depending on volume |
| News API | 100 requests/day | $449/mo (Business) or use RSS only |
| Firecrawl | 500 credits/mo free | $19/mo starter |
| Alpha Vantage | 25 requests/day free | $49/mo premium |
| Resend | 3,000 emails/mo free | $20/mo starter |
| Vercel/Netlify | Free tier | $0-20/mo |
| **Total** | **Mostly free at low scale** | **~$100-600/mo at scale** |

---

## 9. Summary of Lovable-Specific Things to Replace

1. **LOVABLE_API_KEY** + `ai.gateway.lovable.dev` -- Replace with direct OpenAI/Gemini API
2. **lovable-tagger** npm package -- Remove from vite config
3. **Lovable Cloud (Supabase)** -- Create your own Supabase project
4. **Auto-generated files** (`client.ts`, `types.ts`, `.env`) -- Manage manually
5. **OG image URLs** on `storage.googleapis.com/gpt-engineer-*` -- Host your own images
6. **Deployment** -- Use Vercel, Netlify, or Cloudflare Pages instead of Lovable publish

