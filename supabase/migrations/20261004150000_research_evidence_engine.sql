-- Evidence-first research engine. Existing data_center_sources remains the ingestion
-- compatibility layer; these tables preserve field-level provenance and approvals.

CREATE TABLE IF NOT EXISTS public.research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL CHECK (run_type IN ('source_sync','claim_extraction','validation','review_promotion')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed','dry_run')),
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('dry_run','live')),
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_created INTEGER NOT NULL DEFAULT 0,
  records_flagged INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  source_name TEXT,
  source_type TEXT,
  source_tier SMALLINT CHECK (source_tier IN (1,2,3)),
  title TEXT,
  publisher TEXT,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_text TEXT,
  evidence_excerpt TEXT,
  content_hash TEXT NOT NULL,
  http_status INTEGER,
  fetch_status TEXT NOT NULL DEFAULT 'fetched' CHECK (fetch_status IN ('fetched','failed','blocked','not_modified')),
  discovered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (canonical_url, content_hash)
);

CREATE TABLE IF NOT EXISTS public.research_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES public.source_documents(id) ON DELETE CASCADE,
  data_center_id UUID REFERENCES public.data_centers(id) ON DELETE SET NULL,
  entity_name TEXT,
  field_name TEXT NOT NULL CHECK (field_name IN ('capacity_mw','full_ambition_mw','capacity_basis','lifecycle_stage','operator_name','latitude','longitude','location_precision','estimated_energization')),
  proposed_value JSONB NOT NULL,
  normalized_value JSONB,
  unit TEXT,
  evidence_excerpt TEXT NOT NULL,
  extraction_confidence INTEGER NOT NULL DEFAULT 0 CHECK (extraction_confidence BETWEEN 0 AND 100),
  match_confidence INTEGER NOT NULL DEFAULT 0 CHECK (match_confidence BETWEEN 0 AND 100),
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','passed','failed','conflict','needs_review')),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','dismissed')),
  conflict_status TEXT NOT NULL DEFAULT 'not_checked' CHECK (conflict_status IN ('not_checked','none','conflict')),
  ai_model TEXT,
  prompt_version TEXT,
  run_id UUID REFERENCES public.research_runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_document_id, data_center_id, field_name)
);

CREATE TABLE IF NOT EXISTS public.research_review_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.research_claims(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'claim_review' CHECK (task_type IN ('claim_review','conflict_review','entity_match','source_review')),
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','dismissed')),
  reason TEXT NOT NULL,
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (claim_id)
);

CREATE TABLE IF NOT EXISTS public.research_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_center_id UUID NOT NULL REFERENCES public.data_centers(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.research_claims(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  value JSONB NOT NULL,
  unit TEXT,
  evidence_excerpt TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('approved','company_confirmed','government_confirmed','corroborated')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  supersedes_observation_id UUID REFERENCES public.research_observations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.research_claims(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.research_review_tasks(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('automation','human')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_documents_url_idx ON public.source_documents(canonical_url);
CREATE INDEX IF NOT EXISTS research_claims_review_idx ON public.research_claims(review_status, validation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS research_tasks_queue_idx ON public.research_review_tasks(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS research_observations_current_idx ON public.research_observations(data_center_id, field_name, approved_at DESC);

ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved research observations" ON public.research_observations;
CREATE POLICY "Public can view approved research observations" ON public.research_observations FOR SELECT USING (verification_status IN ('approved','company_confirmed','government_confirmed','corroborated'));
DROP POLICY IF EXISTS "Admins can view research documents" ON public.source_documents;
CREATE POLICY "Admins can view research documents" ON public.source_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view research claims" ON public.research_claims;
CREATE POLICY "Admins can view research claims" ON public.research_claims FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view research tasks" ON public.research_review_tasks;
CREATE POLICY "Admins can view research tasks" ON public.research_review_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can update research tasks" ON public.research_review_tasks;
CREATE POLICY "Admins can update research tasks" ON public.research_review_tasks FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view research runs" ON public.research_runs;
CREATE POLICY "Admins can view research runs" ON public.research_runs FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view research audit" ON public.research_audit_log;
CREATE POLICY "Admins can view research audit" ON public.research_audit_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
