import Fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import redisPlugin from "./plugins/redis.js";
import itemRoutes from "./routes/items.js";
import healthRoutes from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Swagger — dev only
  if (process.env.NODE_ENV !== "production") {
    const swagger = await import("@fastify/swagger");
    const swaggerUi = await import("@fastify/swagger-ui");

    await app.register(swagger.default, {
      openapi: {
        info: {
          title: "Railwa Demo API",
          version: "1.0.0",
          description: "Fastify + Prisma + Redis POC",
        },
        tags: [
          { name: "items", description: "Items CRUD" },
          { name: "health", description: "Health checks" },
        ],
      },
    });

    await app.register(swaggerUi.default, {
      routePrefix: "/docs",
    });
  }

  // Plugins
  await app.register(dbPlugin);
  await app.register(redisPlugin);

  // Routes
  await app.register(itemRoutes);
  await app.register(healthRoutes);

  return app;
}
