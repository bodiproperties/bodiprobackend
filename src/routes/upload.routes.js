import { Router } from "express";
import multer from "multer";
import { uploadToBlob } from "../utils/blobStorage.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB хязгаар (видео дэмжихийн тулд арай өргөн)
});

const router = Router();

router.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Файл алга" });
    const url = await uploadToBlob(req.file);
    res.json({ url });
  })
);

export default router;