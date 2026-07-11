-- ============================================================
-- Auth-backed billing (subscribers) and claimable profiles (people)
-- ============================================================

-- Link anonymous newsletter subscribers to a logged-in Supabase Auth
-- user once they sign in, and track subscription/billing state.
ALTER TABLE public.subscribers
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  ADD COLUMN subscription_status TEXT,
  ADD COLUMN stripe_customer_id TEXT,
  ADD COLUMN stripe_subscription_id TEXT;

CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);

CREATE POLICY "Users can view their own subscriber record" ON public.subscribers
  FOR SELECT USING (auth.uid() = user_id);

-- Executives already extracted into the people directory can claim
-- and verify their own profile once logged in.
ALTER TABLE public.people
  ADD COLUMN claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN claimed_at TIMESTAMPTZ;

CREATE TABLE public.profile_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (person_id, user_id)
);

CREATE INDEX idx_profile_claims_person_id ON public.profile_claims(person_id);
CREATE INDEX idx_profile_claims_user_id ON public.profile_claims(user_id);

ALTER TABLE public.profile_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims" ON public.profile_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit a claim for themselves" ON public.profile_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);
