import "dotenv/config";
import express from "express";
import cors from "cors";

// Маршрутууд (Routes)
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/projects.routes.js";
import newsRoutes from "./routes/news.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

// Алдаа боловсруулах middleware
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

// CORS тохиргоо
// Төгсгөлийн "/"-ийг автоматаар хасна — browser Origin header-ийг slash-гүй илгээдэг тул
// "https://site.vercel.app/" гэж бичсэн ч "https://site.vercel.app"-тай таарна.
const normalizeOrigin = (s) => s.trim().replace(/\/+$/, "");

const rawOrigins = process.env.CORS_ORIGIN;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(",").map(normalizeOrigin).filter(Boolean)
  : [];

app.use(
  cors({
    origin(origin, callback) {
      // origin байхгүй: server-to-server (Next.js server fetch, curl, health check)
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(normalizeOrigin(origin))
      ) {
        return callback(null, true);
      }
      // Зөвшөөрөгдөөгүй origin — 500 алдаа биш, зүгээр CORS header-гүй хариу өгнө.
      // Browser хүсэлтийг өөрөө хаана; log дээр аль origin блоклогдсоныг харна.
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

// Хүсэлтийн хэмжээг хязгаарлах (Image upload зэрэгт зориулж 10mb болгов)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Серверийн эрүүл мэндийн шалгалт
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// API Маршрутууд
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/upload", uploadRoutes);

// Алдааны зохицуулалт (Эдгээр нь хамгийн доор байх ёстой)
app.use(notFound);
app.use(errorHandler);

// Серверийг асаах порт
const port = process.env.PORT || 4000;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 bodi-properties API server is running on:`);
  console.log(`   - Local:            http://localhost:${port}`);
  console.log(`   - Environment:      ${process.env.NODE_ENV || "development"}`);
  console.log(
    `   - Allowed Origins:  ${
      allowedOrigins.length > 0
        ? allowedOrigins.join(", ")
        : "All (Development Mode)"
    }`
  );
});