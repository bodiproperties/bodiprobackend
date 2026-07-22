import { Router } from "express";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projects.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public
router.get("/", listProjects);
router.get("/:id", getProject);

// Admin
router.post("/", requireAuth, createProject);
router.put("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

export default router;
