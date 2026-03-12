import type { PrismaClient } from "../generated/prisma/client.js";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

async function dbPlugin(fastify: FastifyInstance) {
  await prisma.$connect();
  fastify.log.info("Connected to PostgreSQL");

  fastify.decorate("db", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(dbPlugin, { name: "db" });
