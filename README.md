# bodi-properties — backend

Express + Neon (PostgreSQL) API for **projects** and **bilingual (MN/EN) news**, with token-based admin CRUD.

## Stack
- Express 4 (ESM)
- Neon PostgreSQL via `pg`
- JWT auth for admin write operations

## Setup

```bash
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed              # creates tables + inserts 4 projects and 2 news items
npm run dev               # http://localhost:4000
```

`DATABASE_URL` is your Neon **pooled** connection string (host contains `-pooler`, ends with `?sslmode=require`).

## Auth

```
POST /api/auth/login   { email, password }  ->  { token }
GET  /api/auth/me      (Bearer token)        ->  { admin }
```

Send the token on write requests:  `Authorization: Bearer <token>`

## Projects

| Method | Path                | Auth | Notes                         |
|--------|---------------------|------|-------------------------------|
| GET    | /api/projects       | –    | list (sorted by sort_order)   |
| GET    | /api/projects/:id   | –    | single                        |
| POST   | /api/projects       | ✓    | create                        |
| PUT    | /api/projects/:id   | ✓    | partial update (COALESCE)     |
| DELETE | /api/projects/:id   | ✓    | delete                        |

Body shape (camelCase, matches the frontend `Project` type):
`title, type, location, year, image, gallery[], description, longDescription, detail{ client, area, status, services[] }, sortOrder`

## News (MN / EN)

| Method | Path              | Auth | Notes                                            |
|--------|-------------------|------|--------------------------------------------------|
| GET    | /api/news         | opt  | published only; admins also see drafts           |
| GET    | /api/news/:slug   | opt  | single by slug                                   |
| POST   | /api/news         | ✓    | create                                           |
| PUT    | /api/news/:id     | ✓    | partial update                                   |
| DELETE | /api/news/:id     | ✓    | delete                                           |

Query params on the public endpoints:
- `?lang=en` or `?lang=mn` → flattens each item to one language (`title`, `excerpt`, `body`, `category` become strings).
- without `lang` → each field is returned bilingually: `title: { en, mn }`, etc.
- `?category=...` → filter by category (matches en or mn).

Create/update body (camelCase):
`slug, titleEn, titleMn, excerptEn, excerptMn, bodyEn, bodyMn, categoryEn, categoryMn, coverImage, published`

`published_at` is set automatically the first time an item goes live.

## Frontend integration (Next.js)

Add `NEXT_PUBLIC_API_URL=http://localhost:4000` to the frontend `.env.local`, then e.g.:

```ts
// lib/api.ts
const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getProjects() {
  const res = await fetch(`${API}/api/projects`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json();
}

export async function getNews(lang: "en" | "mn") {
  const res = await fetch(`${API}/api/news?lang=${lang}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load news");
  return res.json();
}
```

The returned project shape is identical to your current `lib/data.ts`, so the
projects grid / modal keep working — just swap the hardcoded array for `getProjects()`.

## Deploy (Render / Azure)
- Set the same env vars in the host dashboard.
- Build: `npm install` · Start: `npm start`
- Run `npm run seed` once against the production DB (or apply `src/schema.sql` manually).
