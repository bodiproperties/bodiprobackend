import { Router } from "express";
import {
  listNews,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  restoreNews,
} from "../controllers/news.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public (draft/idewhgui зөвхөн valid admin token үед харагдана)
router.get("/", optionalAuth, listNews);
router.get("/:slug", optionalAuth, getNewsBySlug);

// Admin
router.post("/", requireAuth, createNews);
router.put("/:id", requireAuth, updateNews);
router.delete("/:id", requireAuth, deleteNews); // soft delete
router.post("/:id/restore", requireAuth, restoreNews);

export default router;