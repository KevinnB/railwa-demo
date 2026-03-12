import { prisma } from "../lib/prisma.js";
import { cache } from "../lib/redis.js";

const CACHE_KEY_LIST_PREFIX = "items:list:";
const cacheKeyList = (page: number, pageSize: number) =>
  `${CACHE_KEY_LIST_PREFIX}page=${page}&pageSize=${pageSize}`;
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
  async list(page = 1, pageSize = 10) {
    const key = cacheKeyList(page, pageSize);
    const cached = await cache.get(key);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      prisma.item.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.item.count(),
    ]);

    const result = {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };

    await cache.set(key, result);
    return result;
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

    await cache.delPattern(`${CACHE_KEY_LIST_PREFIX}*`);
    return item;
  },

  async update(id: string, data: UpdateItemData) {
    const item = await prisma.item.update({
      where: { id },
      data,
    });

    await cache.delPattern(`${CACHE_KEY_LIST_PREFIX}*`);
    await cache.del(cacheKeyById(id));
    return item;
  },

  async remove(id: string) {
    await prisma.item.delete({ where: { id } });
    await cache.delPattern(`${CACHE_KEY_LIST_PREFIX}*`);
    await cache.del(cacheKeyById(id));
  },
};
