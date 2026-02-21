
-- Add proper foreign keys with CASCADE on article_people
-- First check if they exist, drop and recreate
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'article_people_article_id_fkey') THEN
    ALTER TABLE public.article_people DROP CONSTRAINT article_people_article_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'article_people_person_id_fkey') THEN
    ALTER TABLE public.article_people DROP CONSTRAINT article_people_person_id_fkey;
  END IF;
END $$;

ALTER TABLE public.article_people
  ADD CONSTRAINT article_people_article_id_fkey
  FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;

ALTER TABLE public.article_people
  ADD CONSTRAINT article_people_person_id_fkey
  FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;

-- Add proper foreign keys with CASCADE on people_lists_items
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'people_lists_items_list_id_fkey') THEN
    ALTER TABLE public.people_lists_items DROP CONSTRAINT people_lists_items_list_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'people_lists_items_person_id_fkey') THEN
    ALTER TABLE public.people_lists_items DROP CONSTRAINT people_lists_items_person_id_fkey;
  END IF;
END $$;

ALTER TABLE public.people_lists_items
  ADD CONSTRAINT people_lists_items_list_id_fkey
  FOREIGN KEY (list_id) REFERENCES public.people_lists(id) ON DELETE CASCADE;

ALTER TABLE public.people_lists_items
  ADD CONSTRAINT people_lists_items_person_id_fkey
  FOREIGN KEY (person_id) REFERENCES public.people(id) ON DELETE CASCADE;

-- Add unique index on people_leaders to prevent duplicates (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS people_leaders_name_company_idx 
  ON public.people_leaders (lower(name), lower(coalesce(company, '')));

-- Ensure generate-weekly-index is in config
-- (handled via config.toml, not SQL)
