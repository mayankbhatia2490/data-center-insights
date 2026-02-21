
-- 1) Add insight and source_excerpt to articles
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS insight TEXT,
  ADD COLUMN IF NOT EXISTS source_excerpt TEXT;

-- 2) People master table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  known_as text,
  title text,
  organization text,
  region text,
  roles jsonb DEFAULT '[]'::jsonb,
  importance_score integer DEFAULT 0,
  mention_count integer DEFAULT 0,
  first_mentioned timestamptz,
  last_mentioned timestamptz,
  bio text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS people_name_org_idx ON people (lower(name), lower(coalesce(organization,'')));

-- 3) Association table
CREATE TABLE IF NOT EXISTS article_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  role_in_article text,
  context_excerpt text,
  created_at timestamptz DEFAULT now()
);

-- 4) Curated lists
CREATE TABLE IF NOT EXISTS people_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  region text,
  role_filter text,
  is_curated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS people_lists_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES people_lists(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  rank integer,
  note text,
  created_at timestamptz DEFAULT now()
);

-- 5) Weekly index table
CREATE TABLE IF NOT EXISTS weekly_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  score integer,
  drivers jsonb,
  risks jsonb,
  outlook text,
  created_at timestamptz DEFAULT now()
);

-- 6) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_last_mentioned ON people (last_mentioned);
CREATE INDEX IF NOT EXISTS idx_article_people_article ON article_people (article_id);
CREATE INDEX IF NOT EXISTS idx_article_people_person ON article_people (person_id);

-- 7) Enable RLS on all new tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_lists_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_index ENABLE ROW LEVEL SECURITY;

-- 8) Public read policies (data inserted via edge functions only)
CREATE POLICY "People are publicly readable" ON people FOR SELECT USING (true);
CREATE POLICY "Article people are publicly readable" ON article_people FOR SELECT USING (true);
CREATE POLICY "People lists are publicly readable" ON people_lists FOR SELECT USING (true);
CREATE POLICY "People list items are publicly readable" ON people_lists_items FOR SELECT USING (true);
CREATE POLICY "Weekly index is publicly readable" ON weekly_index FOR SELECT USING (true);
