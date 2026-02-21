ALTER TABLE public.articles ADD COLUMN sentiment text DEFAULT NULL;
CREATE INDEX idx_articles_sentiment ON public.articles (sentiment);