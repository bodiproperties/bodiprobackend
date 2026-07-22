-- ============ PROJECTS ============
CREATE TABLE IF NOT EXISTS projects (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL,
  location         TEXT NOT NULL,
  year             TEXT NOT NULL,
  image            TEXT NOT NULL,
  gallery          JSONB NOT NULL DEFAULT '[]'::jsonb,
  description      TEXT DEFAULT '',
  long_description TEXT DEFAULT '',
  detail           JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ NEWS (bilingual MN / EN) ============
CREATE TABLE IF NOT EXISTS news (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title_en     TEXT NOT NULL,
  title_mn     TEXT NOT NULL,
  excerpt_en   TEXT DEFAULT '',
  excerpt_mn   TEXT DEFAULT '',
  body_en      TEXT DEFAULT '',
  body_mn      TEXT DEFAULT '',
  category_en  TEXT DEFAULT '',
  category_mn  TEXT DEFAULT '',
  cover_image  TEXT DEFAULT '',
  published    BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug      ON news (slug);
