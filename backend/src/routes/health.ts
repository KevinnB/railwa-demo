import { FastifyInstance } from "fastify";

const healthResponseSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["healthy", "unhealthy"] },
    checks: {
      type: "object",
      properties: {
        database: { type: "string" },
        redis: { type: "string" },
      },
    },
  },
} as const;

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", {
    schema: {
      tags: ["health"],
      response: { 200: healthResponseSchema, 503: healthResponseSchema },
    },
  }, async (_request, reply) => {
    const checks: Record<string, string> = {};

    try {
      await fastify.db.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    try {
      await fastify.redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }

    const healthy = Object.values(checks).every((v) => v === "ok");
    const status = healthy ? 200 : 503;

    return reply.status(status).send({ status: healthy ? "healthy" : "unhealthy", checks });
  });
}
