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

const CACHE_KEY_LIST = "protected-items:list";
const cacheKeyById = (id: string) => `protected-items:${id}`;

export default async function protectedItemRoutes(fastify: FastifyInstance) {
  // All routes in this plugin require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /protected/items
  fastify.get("/protected/items", {
    schema: {
      tags: ["protected-items"],
      security: [{ bearerAuth: [] }],
      response: { 200: itemListSchema, 401: errorSchema },
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

  // GET /protected/items/:id
  fastify.get<{ Params: ItemParams }>(
    "/protected/items/:id",
    {
      schema: {
        tags: ["protected-items"],
        security: [{ bearerAuth: [] }],
        params: itemParamsSchema,
        response: { 200: itemSchema, 401: errorSchema, 404: errorSchema },
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

  // POST /protected/items
  fastify.post<{ Body: CreateItemBody }>(
    "/protected/items",
    {
      schema: {
        tags: ["protected-items"],
        security: [{ bearerAuth: [] }],
        body: createItemSchema,
        response: { 201: itemSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      const item = await fastify.db.item.create({
        data: {
          ...request.body,
          userId: request.session.user.id,
        },
      });

      await fastify.cache.del(CACHE_KEY_LIST);
      return reply.status(201).send(item);
    }
  );

  // PUT /protected/items/:id
  fastify.put<{ Params: ItemParams; Body: UpdateItemBody }>(
    "/protected/items/:id",
    {
      schema: {
        tags: ["protected-items"],
        security: [{ bearerAuth: [] }],
        params: itemParamsSchema,
        body: updateItemSchema,
        response: { 200: itemSchema, 401: errorSchema },
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

  // DELETE /protected/items/:id
  fastify.delete<{ Params: ItemParams }>(
    "/protected/items/:id",
    {
      schema: {
        tags: ["protected-items"],
        security: [{ bearerAuth: [] }],
        params: itemParamsSchema,
        response: { 204: { type: "null", description: "No content" }, 401: errorSchema },
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
