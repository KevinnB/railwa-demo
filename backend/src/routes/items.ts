import { FastifyInstance } from "fastify";
import {
  createItemSchema,
  updateItemSchema,
  itemParamsSchema,
  itemSchema,
  itemListSchema,
  errorSchema,
} from "../schemas/item.js";

interface CreateItemBody {
  name: string;
  description?: string;
}

interface UpdateItemBody {
  name?: string;
  description?: string | null;
}

interface ItemParams {
  id: string;
}

const CACHE_KEY_LIST = "items:list";
const cacheKeyById = (id: string) => `items:${id}`;

export default async function itemRoutes(fastify: FastifyInstance) {
  // GET /items
  fastify.get("/items", {
    schema: {
      tags: ["items"],
      response: { 200: itemListSchema },
    },
  }, async (request, reply) => {
    const cached = await fastify.cache.get(CACHE_KEY_LIST);
    if (cached) {
      return reply.send(cached);
    }

    const items = await fastify.db.item.findMany({
      orderBy: { createdAt: "desc" },
    });

    await fastify.cache.set(CACHE_KEY_LIST, items);
    return reply.send(items);
  });

  // GET /items/:id
  fastify.get<{ Params: ItemParams }>(
    "/items/:id",
    {
      schema: {
        tags: ["items"],
        params: itemParamsSchema,
        response: { 200: itemSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const cached = await fastify.cache.get(cacheKeyById(id));
      if (cached) {
        return reply.send(cached);
      }

      const item = await fastify.db.item.findUnique({ where: { id } });
      if (!item) {
        return reply.status(404).send({ error: "Item not found" });
      }

      await fastify.cache.set(cacheKeyById(id), item);
      return reply.send(item);
    }
  );

  // POST /items
  fastify.post<{ Body: CreateItemBody }>(
    "/items",
    {
      schema: {
        tags: ["items"],
        body: createItemSchema,
        response: { 201: itemSchema },
      },
    },
    async (request, reply) => {
      const item = await fastify.db.item.create({
        data: request.body,
      });

      await fastify.cache.del(CACHE_KEY_LIST);
      return reply.status(201).send(item);
    }
  );

  // PUT /items/:id
  fastify.put<{ Params: ItemParams; Body: UpdateItemBody }>(
    "/items/:id",
    {
      schema: {
        tags: ["items"],
        params: itemParamsSchema,
        body: updateItemSchema,
        response: { 200: itemSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const item = await fastify.db.item.update({
        where: { id },
        data: request.body,
      });

      await fastify.cache.del(CACHE_KEY_LIST, cacheKeyById(id));
      return reply.send(item);
    }
  );

  // DELETE /items/:id
  fastify.delete<{ Params: ItemParams }>(
    "/items/:id",
    {
      schema: {
        tags: ["items"],
        params: itemParamsSchema,
        response: { 204: { type: "null", description: "No content" } },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      await fastify.db.item.delete({ where: { id } });
      await fastify.cache.del(CACHE_KEY_LIST, cacheKeyById(id));
      return reply.status(204).send();
    }
  );
}
