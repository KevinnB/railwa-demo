import { prisma } from "../lib/prisma.js";
import { cache } from "../lib/redis.js";

const CACHE_KEY_LIST = "items:list";
const cacheKeyById = (id: string) => `items:${id}`;

interface CreateItemData {
  name: string;
  description?: string;
}

interface UpdateItemData {
  name?: string;
  description?: string | null;
}

export const itemService = {
  async list() {
    const cached = await cache.get(CACHE_KEY_LIST);
    if (cached) return cached;

    const items = await prisma.item.findMany({
      orderBy: { createdAt: "desc" },
    });

    await cache.set(CACHE_KEY_LIST, items);
    return items;
  },

  async getById(id: string) {
    const cached = await cache.get(cacheKeyById(id));
    if (cached) return cached;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return null;

    await cache.set(cacheKeyById(id), item);
    return item;
  },

  async create(data: CreateItemData, userId?: string) {
    const item = await prisma.item.create({
      data: { ...data, userId },
    });

    await cache.del(CACHE_KEY_LIST);
    return item;
  },

  async update(id: string, data: UpdateItemData) {
    const item = await prisma.item.update({
      where: { id },
      data,
    });

    await cache.del(CACHE_KEY_LIST, cacheKeyById(id));
    return item;
  },

  async remove(id: string) {
    await prisma.item.delete({ where: { id } });
    await cache.del(CACHE_KEY_LIST, cacheKeyById(id));
  },
};
