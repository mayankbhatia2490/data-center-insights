-- Phase 5: minimal admin primitive so profile claims can actually be approved.
-- Nothing in the codebase previously set profile_claims.status='approved' or
-- people.claimed_by/claimed_at, even manually — this closes that gap.

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update any claim" ON public.profile_claims;
CREATE POLICY "Admins can update any claim"
  ON public.profile_claims FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all claims" ON public.profile_claims;
CREATE POLICY "Admins can view all claims"
  ON public.profile_claims FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update people claimed_by" ON public.people;
CREATE POLICY "Admins can update people claimed_by"
  ON public.people FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
