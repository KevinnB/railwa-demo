import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

async function dbPlugin(fastify: FastifyInstance) {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();
  fastify.log.info("Connected to PostgreSQL");

  fastify.decorate("db", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(dbPlugin, { name: "db" });
