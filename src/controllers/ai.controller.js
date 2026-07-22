// controllers/ai.controller.js
import Anthropic from "@anthropic-ai/sdk";
import { withTimeout } from "../utils/withTimeout.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS = {
  translate: `Чи бол Монгол-Англи хэлний мэргэжлийн орчуулагч, барилга/архитектурын салбарт мэргэшсэн.
Орчуулгыг үг үгээр биш, англи хэлний байгалийн, luxury real estate-ийн мэргэжлийн өнгө аясаар хий.
Зөвхөн дараах JSON форматаар хариул, өөр юу ч нэмэхгүй:
{"title_en": string, "content_en": string}`,

  summarize: `Чи бол мэдээний хураангуй бичигч. Өгөгдсөн контентоос 2-3 өгүүлбэрт багтсан хураангуй гарга (MN болон EN хоёуланд нь).
Зөвхөн JSON: {"summary_mn": string, "summary_en": string}`,

  seo: `Чи бол SEO мэргэжилтэн. Meta title (60 тэмдэгтээс бага), meta description (155 тэмдэгтээс бага) үүсгэ.
Зөвхөн JSON: {"meta_title": string, "meta_description": string}`,

  improve: `Чи бол мэргэжлийн редактор. Найруулгын алдааг засаж, мэргэжлийн өнгө аясаар дахин бич. Утга агуулгыг бүү өөрчил.
Зөвхөн JSON: {"improved_content": string}`,
};

export async function aiAssist(req, res, next) {
  try {
    const { action, title, content } = req.body;

    if (!PROMPTS[action]) {
      return res.status(400).json({ error: `Буруу action: ${action}` });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: "Контент хэт богино байна" });
    }

    console.log(
      `[AI Assist] admin=${req.admin?.id ?? "unknown"} action=${action}`,
    );

    const response = await withTimeout(
      anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 2048,
        system: PROMPTS[action],
        messages: [
          {
            role: "user",
            content: `Гарчиг: ${title || "(байхгүй)"}\n\nАгуулга:\n${content}`,
          },
        ],
      }),
      30000,
      "AI assist",
    );

    const textBlock = response.content.find((b) => b.type === "text");

    if (!textBlock?.text) {
      console.error("[AI Assist] Текст хариу ирсэнгүй");
      return res
        .status(502)
        .json({ error: "AI хариу өгсөнгүй, дахин оролдоно уу" });
    }

    let data;
    try {
      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      data = JSON.parse(cleaned);
    } catch {
      console.error(
        "[AI Assist] JSON parse алдаа:",
        textBlock.text.slice(0, 200),
      );
      return res
        .status(502)
        .json({ error: "AI буруу форматтай хариу өглөө, дахин оролдоно уу" });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[AI Assist] Алдаа:", err.message);
    next(err);
  }
}