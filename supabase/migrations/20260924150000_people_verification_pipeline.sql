-- Automated people verification with human-in-the-loop review.
-- The verifier is intentionally separate from profile claims: a person can be
-- automatically evidence-backed without being claimed by that person.

ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified', 'needs_review', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_score INTEGER NOT NULL DEFAULT 0
    CHECK (verification_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

CREATE TABLE IF NOT EXISTS public.people_verification_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  source_name TEXT,
  source_title TEXT,
  evidence_excerpt TEXT,
  observed_name TEXT,
  observed_title TEXT,
  observed_organization TEXT,
  source_published_at TIMESTAMPTZ,
  http_status INTEGER,
  automated_score INTEGER NOT NULL DEFAULT 0 CHECK (automated_score BETWEEN 0 AND 100),
  automated_result TEXT NOT NULL DEFAULT 'pending'
    CHECK (automated_result IN ('pending', 'verified', 'needs_review', 'rejected')),
  checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (person_id, source_url)
);

CREATE TABLE IF NOT EXISTS public.people_verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.people_verification_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'dismissed')),
  reason TEXT,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS people_verification_queue_person_source_idx
  ON public.people_verification_queue(person_id, source_id);

CREATE TABLE IF NOT EXISTS public.people_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('automation', 'human')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  score INTEGER,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS people_verification_sources_person_idx
  ON public.people_verification_sources(person_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS people_verification_queue_status_idx
  ON public.people_verification_queue(status, created_at ASC);
CREATE INDEX IF NOT EXISTS people_verification_audit_person_idx
  ON public.people_verification_audit(person_id, created_at DESC);

ALTER TABLE public.people_verification_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people_verification_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view verification sources" ON public.people_verification_sources;
CREATE POLICY "Public can view verification sources"
  ON public.people_verification_sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can view verification queue" ON public.people_verification_queue;
CREATE POLICY "Admins can view verification queue"
  ON public.people_verification_queue FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update verification queue" ON public.people_verification_queue;
CREATE POLICY "Admins can update verification queue"
  ON public.people_verification_queue FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view verification audit" ON public.people_verification_audit;
CREATE POLICY "Admins can view verification audit"
  ON public.people_verification_audit FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Run once per day. The verifier itself is idempotent and only re-checks
-- records whose evidence is stale or has never been checked.
SELECT cron.schedule(
  'verify-people-daily',
  '20 3 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/verify-people',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );$$
)
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'verify-people-daily'
)
AND current_setting('app.settings.supabase_url', true) IS NOT NULL
AND current_setting('app.settings.service_role_key', true) IS NOT NULL;

COMMENT ON TABLE public.people_verification_sources IS
  'Field-level evidence captured by automated people verification.';
COMMENT ON TABLE public.people_verification_queue IS
  'Human review queue for low-confidence or conflicting automated results.';
COMMENT ON COLUMN public.people.verification_score IS
  'Evidence score from 0 to 100; not an identity claim or commercial badge.';
