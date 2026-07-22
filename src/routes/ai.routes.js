import express from "express";
import rateLimit from "express-rate-limit";
import { aiAssist } from "../controllers/ai.controller.js";
import { aiChat } from "../controllers/aiChat.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: "Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу." },
});

router.post("/news/ai-assist", requireAuth, aiLimiter, aiAssist);
router.post("/ai-chat", requireAuth, aiLimiter, aiChat);

export default router;