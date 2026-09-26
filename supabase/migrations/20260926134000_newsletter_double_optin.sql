-- The subscribe function inserted rows with confirmed defaulting to true
-- (schema default), so anyone could add any email address to the mailing
-- list with zero proof they own it. Add a real double opt-in: a
-- confirmation token sent by email, and a timestamp recording when
-- consent was actually given.
alter table public.subscribers alter column confirmed set default false;
alter table public.subscribers add column if not exists confirmation_token uuid not null default gen_random_uuid();
alter table public.subscribers add column if not exists confirmed_at timestamptz;

-- Stripe checkout is its own proof of intent (a card was charged), so
-- paying subscribers stay auto-confirmed; backfill their confirmed_at
-- since payment already happened.
update public.subscribers set confirmed_at = subscribed_at where confirmed = true and confirmed_at is null;
