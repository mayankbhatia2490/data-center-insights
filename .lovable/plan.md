

# Making Data Center Pulse a Live News Aggregator

## Overview

Transform your app from static mock data into a real, self-updating news aggregator that passively collects data center industry news from multiple sources, stores them in a database, and serves fresh content automatically.

## Architecture

```text
+------------------+     +-------------------+     +-----------+
| News Sources     |     | Edge Functions    |     | Database  |
|                  |     |                   |     |           |
| - RSS Feeds      | --> | fetch-news        | --> | articles  |
| - News API       |     | (scheduled cron)  |     | table     |
| - Firecrawl      |     +-------------------+     +-----------+
+------------------+                                     |
                                                         v
                                                  +-------------+
                                                  | Frontend    |
                                                  | (React app) |
                                                  +-------------+
```

## What Will Change

### 1. Enable Lovable Cloud (Supabase)
- Set up Cloud backend for database, edge functions, and secrets storage

### 2. Create Database Table
- An `articles` table to store fetched news:
  - `id`, `title`, `summary`, `category`, `source`, `source_url`, `image_url`, `published_at`, `read_time`, `created_at`
- RLS policies for public read access

### 3. Create Edge Function: `fetch-news`
- A single serverless function that pulls news from multiple sources:
  - **RSS Feeds** (free, no key): Parse feeds from DataCenterDynamics, Data Center Knowledge, Reuters Tech, etc.
  - **News API** (requires API key): Fetch articles by keywords like "data center", "hyperscale", "cloud infrastructure"
  - **Firecrawl** (connector): Scrape specific industry sites for deeper content
- Auto-categorize articles into M&A, AI, Sustainability, Middle East, Policy based on keywords
- Deduplicate by URL before inserting into the database

### 4. Schedule Automatic Fetching (Cron)
- Use `pg_cron` to call the `fetch-news` edge function every 30-60 minutes
- News updates passively without any manual action

### 5. Update Frontend
- Replace `mockData.ts` imports with live Supabase queries using `@tanstack/react-query`
- Hero section, news feed, trending stories, and sidebar all pull from the database
- Real-time feel with periodic refetching

### 6. Secrets and Connectors
- Store News API key as a Supabase secret
- Connect Firecrawl connector for web scraping capabilities

## Step-by-Step Implementation Order

1. Enable Lovable Cloud
2. Create `articles` database table with RLS
3. Store News API key as a secret
4. Connect Firecrawl connector
5. Build `fetch-news` edge function (RSS + News API + Firecrawl)
6. Set up cron schedule via `pg_cron`
7. Create a Supabase client hook to query articles
8. Update `Index.tsx`, `HeroSection.tsx`, `Sidebar.tsx`, and `NewsCard.tsx` to use live data
9. Remove or keep `mockData.ts` as fallback

## Technical Details

### Articles Table Schema
```text
articles
  - id: uuid (primary key)
  - title: text (not null)
  - summary: text
  - category: text (M&A, AI, Sustainability, Middle East, Policy)
  - source: text (Bloomberg, Reuters, etc.)
  - source_url: text (unique, for deduplication)
  - image_url: text
  - published_at: timestamptz
  - read_time: text
  - created_at: timestamptz (default now())
```

### RSS Feeds to Include
- DataCenterDynamics, Data Center Knowledge, The Register (Data Center), Capacity Media, Datacenter Frontier

### Auto-Categorization Logic
Keywords-based mapping in the edge function:
- "acquisition", "merger", "IPO", "deal" -> M&A
- "AI", "GPU", "machine learning", "NVIDIA" -> AI
- "renewable", "carbon", "PUE", "green" -> Sustainability
- "Dubai", "Saudi", "UAE", "Oman", "Qatar" -> Middle East
- "regulation", "policy", "EU", "compliance" -> Policy

### Frontend Query Pattern
```text
useQuery to fetch from Supabase articles table
  - ordered by published_at descending
  - filtered by category when user selects a filter
  - limit + offset for pagination ("Load previous days")
```

## What You Will Need to Provide
- A **News API key** (free tier available at newsapi.org)
- Approval to connect the **Firecrawl connector** (optional but recommended for richer scraping)

