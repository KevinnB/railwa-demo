import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import itemRoutes from "./routes/items.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";

export function buildApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    })
  );

  // Swagger UI
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Better Auth catch-all (hidden from Swagger — handled by explicit auth routes)
  app.all("/api/auth/*path", async (req, res) => {
    try {
      const url = new URL(req.originalUrl, `http://${req.headers.host}`);
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) headers.append(key, String(value));
      }

      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        ...(req.body && Object.keys(req.body).length > 0
          ? { body: JSON.stringify(req.body) }
          : {}),
      });

      const response = await auth.handler(request);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      const text = await response.text();
      res.send(text || null);
    } catch (error) {
      console.error("Auth handler error:", error);
      res.status(500).json({ error: "Internal authentication error" });
    }
  });

  // Routes
  app.use(authRoutes);
  app.use(itemRoutes);
  app.use(healthRoutes);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return app;
}
