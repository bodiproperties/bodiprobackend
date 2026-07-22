import Anthropic from "@anthropic-ai/sdk";
import { getRecentNews, searchNews } from "../services/newsTools.js";
import { withTimeout } from "../utils/withTimeout.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Чи бол Bodi Properties admin panel-ийн туслах AI.
Хэрэглэгч манай сайт дээрх мэдээний талаар асуувал get_recent_news эсвэл search_news function-ыг ашигла.
Ерөнхий мэдлэг шаардсан асуултад шууд өөрийн мэдлэгээрээ хариул.
Монгол хэлээр, товч бөгөөд тодорхой хариулна.`;

const tools = [
  {
    name: "get_recent_news",
    description:
      "Bodi Properties сайт дээрх хамгийн сүүлийн үеийн мэдээнүүдийг DB-ээс авчирна",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Хэдэн мэдээ авах вэ, default 5" },
        status: {
          type: "string",
          enum: ["published", "draft", "hidden"],
          description: "Ямар төлөвтэй мэдээ авах вэ, default published",
        },
      },
      required: [],
    },
  },
  {
    name: "search_news",
    description: "Гарчгаар нь мэдээ хайж олно (зөвхөн published)",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Хайх түлхүүр үг" },
        limit: { type: "number", description: "Хэдэн үр дүн авах вэ, default 5" },
      },
      required: ["query"],
    },
  },
];

const TOOL_HANDLERS = {
  get_recent_news: getRecentNews,
  search_news: searchNews,
};

const MAX_TOOL_ITERATIONS = 5;

export async function aiChat(req, res, next) {
  console.log("[aiChat] Хүсэлт ирлээ:", req.body?.messages?.length, "мессеж");

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages массив хоосон байна" });
    }

    const cleanMessages = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          (typeof m.content === "string" || Array.isArray(m.content))
      )
      .slice(-20);

    if (cleanMessages.length === 0) {
      return res.status(400).json({ error: "Хүчинтэй мессеж алга" });
    }

    console.log("[aiChat] Anthropic-руу эхний дуудлага явуулж байна...");
    let response = await withTimeout(
      anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: cleanMessages,
      }),
      30000,
      "AI chat"
    );
    console.log("[aiChat] Эхний хариу ирлээ. stop_reason:", response.stop_reason);

    const workingMessages = [...cleanMessages];
    let iterations = 0;

    // ЗӨВХӨН НЭГ while — давхардсан дотоод давталт байхгүй
    while (response.stop_reason === "tool_use") {
      iterations++;
      console.log(`[aiChat] Tool iteration #${iterations}`);

      if (iterations > MAX_TOOL_ITERATIONS) {
        console.error("[aiChat] Tool loop хэтэрсэн тоо:", iterations);
        return res
          .status(500)
          .json({ error: "AI хэт олон удаа tool дуудлаа, дахин оролдоно уу" });
      }

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      console.log(
        "[aiChat] Дуудаж буй tool-ууд:",
        toolUseBlocks.map((b) => b.name)
      );

      workingMessages.push({ role: "assistant", content: response.content });

      const toolResults = [];
      for (const block of toolUseBlocks) {
        const handler = TOOL_HANDLERS[block.name];
        let result;
        try {
          console.log(
            `[aiChat] "${block.name}" ажиллуулж байна, input:`,
            block.input
          );
          result = handler
            ? await withTimeout(
                Promise.resolve(handler(block.input || {})),
                10000,
                `Tool "${block.name}"`
              )
            : { error: "Tool олдсонгүй" };
          console.log(
            `[aiChat] "${block.name}" амжилттай, ${
              Array.isArray(result) ? result.length : "?"
            } мөр буцаалаа`
          );
        } catch (e) {
          console.error(`[aiChat] "${block.name}" алдаа гарлаа:`, e.message);
          result = { error: "Query алдаа: " + e.message };
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      workingMessages.push({ role: "user", content: toolResults });

      console.log("[aiChat] Anthropic-руу дараагийн дуудлага явуулж байна...");
      response = await withTimeout(
        anthropic.messages.create({
          model: "claude-sonnet-5",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools,
          messages: workingMessages,
        }),
        30000,
        "AI chat"
      );
      console.log("[aiChat] Хариу ирлээ. stop_reason:", response.stop_reason);
    }

    const textBlock = response.content.find((b) => b.type === "text");
    console.log("[aiChat] Эцсийн хариу бэлэн боллоо");

    return res.json({
      success: true,
      reply: textBlock ? textBlock.text : "",
    });
  } catch (err) {
    console.error("[aiChat] КАТCH алдаа:", err.message);
    next(err);
  }
}