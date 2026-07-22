// Wrap async controllers so thrown errors hit the error handler
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.code === "23505") {
    // unique_violation (e.g. duplicate news slug)
    return res.status(409).json({ error: "Duplicate value (slug already exists)" });
  }
  res.status(err.status || 500).json({ error: err.message || "Server error" });
}
