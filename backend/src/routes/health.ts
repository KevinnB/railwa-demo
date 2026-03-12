import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  const [dbResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const checks = {
    database: dbResult.status === "fulfilled" ? "ok" : "error",
    redis: redisResult.status === "fulfilled" ? "ok" : "error",
  };

  const healthy = checks.database === "ok" && checks.redis === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "unhealthy",
    checks,
  });
});

export default router;
