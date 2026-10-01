-- SEO phase 1 groundwork: stable slugs, honest updated_at, and a redirect history.
-- See docs/technical-seo-spec.md sections 4 and 5.
--  * articles.slug is the full URL segment: <title-slug>-<8 hex of id>  -> /news/{slug}
--  * data_centers.slug is unique per country                            -> /data/facilities/{country}/{slug}
--  * people.slug is globally unique                                     -> /leaders/{slug}
--  * updated_at only moves when content changes (not on pipeline bookkeeping fields)

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------- helpers
create or replace function public.slugify(value text)
returns text
language sql
stable
set search_path = public, extensions
as $$
  select nullif(
    regexp_replace(
      left(regexp_replace(lower(unaccent(coalesce(value, ''))), '[^a-z0-9]+', '-', 'g'), 80),
      '(^-+|-+$)', '', 'g'),
    '')
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ex text[] := array['updated_at'] || tg_argv;
begin
  if (to_jsonb(new) - ex) is distinct from (to_jsonb(old) - ex) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------- slug history
create table if not exists public.slug_history (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('article', 'facility', 'person')),
  entity_id uuid not null,
  old_slug text not null,
  changed_at timestamptz not null default now(),
  unique (entity, old_slug)
);
alter table public.slug_history enable row level security;
drop policy if exists "Slug history is publicly readable" on public.slug_history;
create policy "Slug history is publicly readable" on public.slug_history for select using (true);

create or replace function public.record_slug_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.slug is not null and new.slug is distinct from old.slug then
    insert into public.slug_history (entity, entity_id, old_slug)
    values (tg_argv[0], old.id, old.slug)
    on conflict (entity, old_slug) do nothing;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------- articles
alter table public.articles add column if not exists slug text;
alter table public.articles add column if not exists updated_at timestamptz not null default now();

update public.articles
set slug = regexp_replace(left(coalesce(public.slugify(title), 'story'), 80), '-+$', '', 'g')
           || '-' || left(replace(id::text, '-', ''), 8)
where slug is null;
-- existing rows: modified date is when they were published, not the migration time
update public.articles set updated_at = coalesce(published_at, created_at);

create or replace function public.articles_set_slug()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.slug is null then
    new.slug := regexp_replace(left(coalesce(public.slugify(new.title), 'story'), 80), '-+$', '', 'g')
                || '-' || left(replace(new.id::text, '-', ''), 8);
  end if;
  return new;
end;
$$;

alter table public.articles alter column slug set not null;
create unique index if not exists articles_slug_key on public.articles (slug);

drop trigger if exists articles_set_slug on public.articles;
create trigger articles_set_slug before insert on public.articles
  for each row execute function public.articles_set_slug();
drop trigger if exists articles_touch_updated_at on public.articles;
create trigger articles_touch_updated_at before update on public.articles
  for each row execute function public.touch_updated_at(
    'validation_status', 'validation_score', 'validation_notes', 'validated_at',
    'corroboration_count', 'corroboration_urls', 'primary_source_count',
    'importance_score', 'confidence_score');
drop trigger if exists articles_record_slug_change on public.articles;
create trigger articles_record_slug_change before update of slug on public.articles
  for each row execute function public.record_slug_change('article');

-- ---------------------------------------------------------------- data_centers
alter table public.data_centers add column if not exists slug text;

with base as (
  select id, country,
         coalesce(public.slugify(canonical_name), 'facility') as s,
         row_number() over (
           partition by country, coalesce(public.slugify(canonical_name), 'facility')
           order by created_at, id) as n
  from public.data_centers
  where slug is null
)
update public.data_centers d
set slug = case when b.n = 1 then b.s else b.s || '-' || b.n end
from base b
where d.id = b.id;

create or replace function public.data_centers_set_slug()
returns trigger language plpgsql set search_path = public as $$
declare
  base text := coalesce(public.slugify(new.canonical_name), 'facility');
  cand text := base;
  n int := 1;
begin
  if new.slug is null then
    while exists (select 1 from public.data_centers where country = new.country and slug = cand and id <> new.id) loop
      n := n + 1;
      cand := base || '-' || n;
    end loop;
    new.slug := cand;
  end if;
  return new;
end;
$$;

alter table public.data_centers alter column slug set not null;
create unique index if not exists data_centers_country_slug_key on public.data_centers (country, slug);

drop trigger if exists data_centers_set_slug on public.data_centers;
create trigger data_centers_set_slug before insert on public.data_centers
  for each row execute function public.data_centers_set_slug();
drop trigger if exists data_centers_touch_updated_at on public.data_centers;
create trigger data_centers_touch_updated_at before update on public.data_centers
  for each row execute function public.touch_updated_at(
    'last_verified_at', 'verification_score', 'verification_status', 'extraction_confidence');
drop trigger if exists data_centers_record_slug_change on public.data_centers;
create trigger data_centers_record_slug_change before update of slug on public.data_centers
  for each row execute function public.record_slug_change('facility');

-- ---------------------------------------------------------------- people
alter table public.people add column if not exists slug text;

with base as (
  select id,
         coalesce(public.slugify(name), 'person-' || left(replace(id::text, '-', ''), 8)) as s,
         row_number() over (
           partition by coalesce(public.slugify(name), 'person-' || left(replace(id::text, '-', ''), 8))
           order by coalesce(mention_count, 0) desc, created_at, id) as n
  from public.people
  where slug is null
)
update public.people p
set slug = case when b.n = 1 then b.s else b.s || '-' || b.n end
from base b
where p.id = b.id;

create or replace function public.people_set_slug()
returns trigger language plpgsql set search_path = public as $$
declare
  base text := coalesce(public.slugify(new.name), 'person-' || left(replace(new.id::text, '-', ''), 8));
  cand text := base;
  n int := 1;
begin
  if new.slug is null then
    while exists (select 1 from public.people where slug = cand and id <> new.id) loop
      n := n + 1;
      cand := base || '-' || n;
    end loop;
    new.slug := cand;
  end if;
  return new;
end;
$$;

alter table public.people alter column slug set not null;
create unique index if not exists people_slug_key on public.people (slug);

drop trigger if exists people_set_slug on public.people;
create trigger people_set_slug before insert on public.people
  for each row execute function public.people_set_slug();
drop trigger if exists people_touch_updated_at on public.people;
create trigger people_touch_updated_at before update on public.people
  for each row execute function public.touch_updated_at(
    'mention_count', 'importance_score', 'first_mentioned', 'last_mentioned',
    'last_verified_at', 'verification_score', 'verification_status', 'verification_notes');
drop trigger if exists people_record_slug_change on public.people;
create trigger people_record_slug_change before update of slug on public.people
  for each row execute function public.record_slug_change('person');
