import Fastify from "fastify";
import cors from "@fastify/cors";
import dbPlugin from "./plugins/db.js";
import redisPlugin from "./plugins/redis.js";
import authPlugin from "./plugins/auth.js";
import itemRoutes from "./routes/items.js";
import protectedItemRoutes from "./routes/protected-items.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // CORS — must be registered before auth routes
  await app.register(cors, {
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  });

  // Swagger
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
        { name: "auth", description: "Authentication (sign up, sign in)" },
        { name: "items", description: "Items CRUD (public)" },
        { name: "protected-items", description: "Items CRUD (auth required)" },
        { name: "health", description: "Health checks" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            description: "Use the token from POST /auth/sign-in response",
          },
        },
      },
    },
  });

  await app.register(swaggerUi.default, {
    routePrefix: "/docs",
  });

  // Plugins
  await app.register(dbPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);

  // Routes
  await app.register(authRoutes);
  await app.register(itemRoutes);
  await app.register(protectedItemRoutes);
  await app.register(healthRoutes);

  return app;
}
