import { Router } from "express";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
} from "../controllers/projects.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public (draft/hidden/deleted зөвхөн valid admin token vед харагдана)
router.get("/", optionalAuth, listProjects);
router.get("/:id", optionalAuth, getProject);

// Admin
router.post("/", requireAuth, createProject);
router.put("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject); // soft delete
router.post("/:id/restore", requireAuth, restoreProject);

export default router;