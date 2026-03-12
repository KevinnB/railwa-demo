import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     redis:
 *                       type: string
 *       503:
 *         description: Unhealthy
 */
router.get("/health", async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  const status = healthy ? 200 : 503;

  res.status(status).json({
    status: healthy ? "healthy" : "unhealthy",
    checks,
  });
});

export default router;
