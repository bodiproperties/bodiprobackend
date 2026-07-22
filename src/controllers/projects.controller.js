import { query } from "../db.js";
import { serializeProject } from "../utils/serialize.js";
import { asyncHandler } from "../middleware/error.js";

export const listProjects = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    "SELECT * FROM projects ORDER BY sort_order ASC, id ASC"
  );
  res.json(rows.map(serializeProject));
});

export const getProject = asyncHandler(async (req, res) => {
  const { rows } = await query("SELECT * FROM projects WHERE id = $1", [
    req.params.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "Project not found" });
  res.json(serializeProject(rows[0]));
});

export const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    type,
    location,
    year,
    image,
    gallery = [],
    description = "",
    longDescription = "",
    detail = {},
    sortOrder = 0,
  } = req.body || {};

  if (!title || !type || !location || !year || !image) {
    return res
      .status(400)
      .json({ error: "title, type, location, year and image are required" });
  }

  const { rows } = await query(
    `INSERT INTO projects
       (title, type, location, year, image, gallery, description, long_description, detail, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10)
     RETURNING *`,
    [
      title,
      type,
      location,
      year,
      image,
      JSON.stringify(gallery),
      description,
      longDescription,
      JSON.stringify(detail),
      sortOrder,
    ]
  );
  res.status(201).json(serializeProject(rows[0]));
});

// Partial update via COALESCE — only the fields you send get changed
export const updateProject = asyncHandler(async (req, res) => {
  const {
    title,
    type,
    location,
    year,
    image,
    gallery,
    description,
    longDescription,
    detail,
    sortOrder,
  } = req.body || {};

  const { rows } = await query(
    `UPDATE projects SET
       title            = COALESCE($2, title),
       type             = COALESCE($3, type),
       location         = COALESCE($4, location),
       year             = COALESCE($5, year),
       image            = COALESCE($6, image),
       gallery          = COALESCE($7::jsonb, gallery),
       description      = COALESCE($8, description),
       long_description = COALESCE($9, long_description),
       detail           = COALESCE($10::jsonb, detail),
       sort_order       = COALESCE($11, sort_order),
       updated_at       = now()
     WHERE id = $1
     RETURNING *`,
    [
      req.params.id,
      title ?? null,
      type ?? null,
      location ?? null,
      year ?? null,
      image ?? null,
      gallery !== undefined ? JSON.stringify(gallery) : null,
      description ?? null,
      longDescription ?? null,
      detail !== undefined ? JSON.stringify(detail) : null,
      sortOrder ?? null,
    ]
  );
  if (!rows[0]) return res.status(404).json({ error: "Project not found" });
  res.json(serializeProject(rows[0]));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { rowCount } = await query("DELETE FROM projects WHERE id = $1", [
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ error: "Project not found" });
  res.json({ ok: true });
});
