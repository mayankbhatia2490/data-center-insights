-- Replace overly-permissive always-true INSERT policy on subscribers
-- with a validated check that still allows public newsletter signups.
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;

CREATE POLICY "Anyone can subscribe"
  ON public.subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND confirmed = true
    AND (name IS NULL OR length(name) <= 200)
  );