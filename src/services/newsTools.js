// src/services/newsTools.js
import { query } from "../db.js";
import { serializeNews } from "../utils/serialize.js";

export async function getRecentNews({ limit = 5, status = "published" }) {
  const { rows } = await query(
    `SELECT * FROM news
     WHERE deleted_at IS NULL AND status = $1
     ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC
     LIMIT $2`,
    [status, limit]
  );
  return rows.map((r) => serializeNews(r));
}

export async function searchNews({ query: searchTerm, limit = 5 }) {
  const pattern = `%${searchTerm}%`;
  const { rows } = await query(
    `SELECT * FROM news
     WHERE deleted_at IS NULL
       AND status = 'published'
       AND (title_mn ILIKE $1 OR title_en ILIKE $1)
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT $2`,
    [pattern, limit]
  );
  return rows.map((r) => serializeNews(r));
}