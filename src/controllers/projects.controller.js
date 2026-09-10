import { query } from "../db.js";
import { serializeProject } from "../utils/serialize.js";
import { asyncHandler } from "../middleware/error.js";

const STATUSES = ["draft", "published", "hidden"];
const normStatus = (s) => (STATUSES.includes(s) ? s : "draft");

export const listProjects = asyncHandler(async (req, res) => {
  const isAdmin = Boolean(req.admin);

  const conditions = ["deleted_at IS NULL"];
  if (!isAdmin) {
    conditions.push("status = 'published'");
    conditions.push("(published_at IS NULL OR published_at <= now())");
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const { rows } = await query(
    `SELECT * FROM projects ${where} ORDER BY sort_order ASC, id ASC`
  );
  res.json(rows.map(serializeProject));
});

export const getProject = asyncHandler(async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [req.params.id]
  );
  const row = rows[0];

  const live =
    row &&
    row.status === "published" &&
    (!row.published_at || new Date(row.published_at) <= new Date());

  if (!row || (!live && !req.admin)) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json(serializeProject(row));
});

export const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    type,
    location,
    year,
    image,
    descriptionEn = "",
    descriptionMn = "",
    detail = {},
    sortOrder = 0,
    status = "draft",
    publishedAt = null,
  } = req.body || {};

  if (!title || !type || !location || !year || !image) {
    return res
      .status(400)
      .json({ error: "title, type, location, year and image are required" });
  }

  const finalStatus = normStatus(status);
  const pubAt = publishedAt
    ? new Date(publishedAt)
    : finalStatus === "published"
      ? new Date()
      : null;

  const { rows } = await query(
    `INSERT INTO projects
       (title, type, location, year, image, description_en, description_mn,
        detail, sort_order, status, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
     RETURNING *`,
    [
      title,
      type,
      location,
      year,
      image,
      descriptionEn,
      descriptionMn,
      JSON.stringify(detail),
      sortOrder,
      finalStatus,
      pubAt,
    ]
  );
  res.status(201).json(serializeProject(rows[0]));
});

export const updateProject = asyncHandler(async (req, res) => {
  const {
    title,
    type,
    location,
    year,
    image,
    descriptionEn,
    descriptionMn,
    detail,
    sortOrder,
    status,
    publishedAt,
  } = req.body || {};

  const nextStatus = status ? normStatus(status) : null;

  const { rows } = await query(
    `UPDATE projects SET
       title           = COALESCE($2, title),
       type            = COALESCE($3, type),
       location        = COALESCE($4, location),
       year            = COALESCE($5, year),
       image           = COALESCE($6, image),
       description_en  = COALESCE($7, description_en),
       description_mn  = COALESCE($8, description_mn),
       detail          = COALESCE($9::jsonb, detail),
       sort_order      = COALESCE($10, sort_order),
       status          = COALESCE($11, status),
       published_at    = CASE
                            WHEN $12::timestamptz IS NOT NULL THEN $12::timestamptz
                            WHEN COALESCE($11, status) = 'published' AND published_at IS NULL THEN now()
                            WHEN COALESCE($11, status) = 'draft' THEN NULL
                            ELSE published_at
                          END,
       updated_at      = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [
      req.params.id,
      title ?? null,
      type ?? null,
      location ?? null,
      year ?? null,
      image ?? null,
      descriptionEn ?? null,
      descriptionMn ?? null,
      detail !== undefined ? JSON.stringify(detail) : null,
      sortOrder ?? null,
      nextStatus,
      publishedAt ?? null,
    ]
  );
  if (!rows[0]) return res.status(404).json({ error: "Project not found" });
  res.json(serializeProject(rows[0]));
});

// Soft delete
export const deleteProject = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE projects SET deleted_at = now(), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Project not found" });
  res.json({ ok: true });
});

// Устгасныг сэргээх
export const restoreProject = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE projects SET deleted_at = NULL, updated_at = now()
     WHERE id = $1 AND deleted_at IS NOT NULL
     RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Project not found" });
  res.json(serializeProject(rows[0]));
});