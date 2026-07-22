import { query } from "../db.js";
import { serializeNews } from "../utils/serialize.js";
import { asyncHandler } from "../middleware/error.js";

const STATUSES = ["draft", "published", "hidden"];
const normStatus = (s) => (STATUSES.includes(s) ? s : "draft");

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Public list. Admin token байвал бүх төлөв (draft/hidden) ч ирнэ.
export const listNews = asyncHandler(async (req, res) => {
  const lang = req.query.lang;
  const isAdmin = Boolean(req.admin);

  const conditions = ["deleted_at IS NULL"];
  if (!isAdmin) {
    conditions.push("status = 'published'");
    conditions.push("(published_at IS NULL OR published_at <= now())");
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const { rows } = await query(
    `SELECT * FROM news ${where}
     ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC`
  );
  res.json(rows.map((r) => serializeNews(r, lang)));
});

// Public single — slug эсвэл uuid-аар. draft/hidden зөвхөн админд.
export const getNewsBySlug = asyncHandler(async (req, res) => {
  const lang = req.query.lang;
  const key = req.params.slug;

  const { rows } = await query(
    `SELECT * FROM news
     WHERE deleted_at IS NULL AND (slug = $1 OR id::text = $1)
     LIMIT 1`,
    [key]
  );
  const row = rows[0];

  const live =
    row &&
    row.status === "published" &&
    (!row.published_at || new Date(row.published_at) <= new Date());

  if (!row || (!live && !req.admin)) {
    return res.status(404).json({ error: "News not found" });
  }
  res.json(serializeNews(row, lang));
});

export const createNews = asyncHandler(async (req, res) => {
  const {
    titleEn,
    titleMn,
    descEn = "",
    descMn = "",
    youtubeUrl = "",
    status = "draft",
    publishedAt = null,
  } = req.body || {};

  if (!titleEn?.trim() && !titleMn?.trim()) {
    return res
      .status(400)
      .json({ error: "Дор хаяж нэг хэлээр гарчиг оруулна уу" });
  }

  const finalStatus = normStatus(status);

  // Slug vргэлж давхцахгvй байхын тулд timestamp нэмнэ
  const baseSlug = slugify(titleEn || titleMn || "") || "news";
  const finalSlug = `${baseSlug}-${Date.now()}`;

  // published_at: гараар өгсөн бол түүнийг, эс бол published үед now(), бусад үед null
  const pubAt = publishedAt
    ? new Date(publishedAt)
    : finalStatus === "published"
      ? new Date()
      : null;

  const { rows } = await query(
    `INSERT INTO news
       (slug, title_en, title_mn, desc_en, desc_mn, status, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      finalSlug,
      titleEn?.trim() || "",
      titleMn?.trim() || "",
      descEn,
      descMn,
      finalStatus,
      pubAt,
    ]
  );
  res.status(201).json(serializeNews(rows[0]));
});

export const updateNews = asyncHandler(async (req, res) => {
  const { titleEn, titleMn, descEn, descMn, youtubeUrl, status, publishedAt } =
    req.body || {};

  const nextStatus = status ? normStatus(status) : null;

  const { rows } = await query(
    `UPDATE news SET
       title_en     = COALESCE($2, title_en),
       title_mn     = COALESCE($3, title_mn),
       desc_en      = COALESCE($4, desc_en),
       desc_mn      = COALESCE($5, desc_mn),
       youtube_url  = COALESCE($6, youtube_url),
       status       = COALESCE($7, status),
       published_at = CASE
                        WHEN $8::timestamptz IS NOT NULL THEN $8::timestamptz
                        WHEN COALESCE($7, status) = 'published' AND published_at IS NULL THEN now()
                        WHEN COALESCE($7, status) = 'draft' THEN NULL
                        ELSE published_at
                      END,
       updated_at   = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [
      req.params.id,
      titleEn ?? null,
      titleMn ?? null,
      descEn ?? null,
      descMn ?? null,
      youtubeUrl ?? null,
      nextStatus,
      publishedAt ?? null,
    ]
  );
  if (!rows[0]) return res.status(404).json({ error: "News not found" });
  res.json(serializeNews(rows[0]));
});

// Soft delete
export const deleteNews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE news SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "News not found" });
  res.json({ ok: true });
});

// Устгасныг сэргээх
export const restoreNews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE news SET deleted_at = NULL, updated_at = now()
     WHERE id = $1 AND deleted_at IS NOT NULL
     RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "News not found" });
  res.json(serializeNews(rows[0]));
});