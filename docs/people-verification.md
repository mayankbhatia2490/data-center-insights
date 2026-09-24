# Automated People Verification

This project now includes a mostly automated evidence-verification loop for leader profiles. It is separate from profile ownership claims: **verification means that the available source evidence supports the profile; it does not mean the person claimed or endorsed the profile.**

## Flow

```text
articles + article_people
          |
          v
verify-people Edge Function
  - fetches source URL
  - checks HTTP reachability
  - checks person name in article/source text
  - checks organization and title when available
  - applies a deterministic 0–100 score
          |
    +-----+------------------+
    |                        |
 score >= 80             score 45–79
    |                        |
 verified              needs_review
    |                        |
 public badge          admin queue
                             |
                    approve / reject / dismiss
```

Scores below 45 are recorded as rejected evidence. The record remains available for later research and is not silently deleted.

## What is stored

- `people.verification_status`: `unverified`, `verified`, `needs_review`, or `rejected`.
- `people.verification_score`: the latest automated score from 0 to 100.
- `people_verification_sources`: the source URL, article, excerpt, HTTP status, checks, and timestamp.
- `people_verification_queue`: records that require an administrator’s decision.
- `people_verification_audit`: immutable-ish history of automated and human decisions.

The migration is `supabase/migrations/20260924150000_people_verification_pipeline.sql`. The function is deployed from `supabase/functions/verify-people/index.ts`.

## Human review

Administrators can review the queue at `/admin/people-verification`. The page is protected by the existing `admin_users` table. Reviewers can open the original source, inspect the evidence excerpt, and approve, reject, or dismiss the item.

An approved item updates the person to `verified`. A rejected item updates the person to `rejected`. Dismissal closes the queue item without changing the person’s current evidence status.

## Deployment

Run the migration and deploy the function from the project root:

```sh
supabase db push
supabase functions deploy verify-people
```

The function needs the standard Supabase secrets already used by the project:

```sh
supabase secrets set SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

The migration only creates the daily cron job when `app.settings.supabase_url` and `app.settings.service_role_key` are configured in the database. If those settings are not available, create the job using your platform’s scheduler or configure the existing project cron convention to call:

```text
https://YOUR_PROJECT.supabase.co/functions/v1/verify-people
```

The request must include the Supabase service-role authorization header. Do not expose that key in the browser.

## Recommended next improvements

The initial verifier is intentionally deterministic and auditable. The next safe improvements are:

1. Add a source registry with per-domain trust levels for official operator, government, industry, and user-submitted sources.
2. Add a field-level conflict detector when two sources disagree on title, company, or country.
3. Add a re-check interval based on risk: fast-changing project announcements should be checked more often than stable biographies.
4. Add a claim-review email notification for providers who want to correct a profile.
5. Add structured source citations to the public profile page, while keeping reviewer notes private.
6. Add a second-pass language model only for records already flagged as `needs_review`; do not let the model directly publish a verified status.

## Safety and data policy

The verifier fetches only `http` and `https` source URLs already present in the project’s article records, follows redirects, applies an eight-second timeout, and stores only a bounded source excerpt. It does not scrape Data Center Map or any other restricted directory. A source being reachable is not proof that the source is authoritative, which is why the score also requires the person name and supporting organization or role when available.
