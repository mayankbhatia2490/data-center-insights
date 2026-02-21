
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  confirmed boolean NOT NULL DEFAULT true,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  preferences jsonb DEFAULT '{"categories": ["all"]}'::jsonb
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (subscribe)
CREATE POLICY "Anyone can subscribe"
  ON public.subscribers FOR INSERT
  WITH CHECK (true);

-- No public reads (protect email addresses)
CREATE POLICY "No public reads"
  ON public.subscribers FOR SELECT
  USING (false);
