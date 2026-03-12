import Redis from "ioredis";
import type { Redis as RedisType } from "ioredis";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    redis: RedisType;
    cache: {
      get: <T>(key: string) => Promise<T | null>;
      set: (key: string, value: unknown, ttlSeconds?: number) => Promise<void>;
      del: (...keys: string[]) => Promise<void>;
    };
  }
}

const DEFAULT_TTL = 60;

async function redisPlugin(fastify: FastifyInstance) {
  const redis = new Redis.default(process.env.REDIS_URL ?? "redis://localhost:6379");

  redis.on("connect", () => {
    fastify.log.info("Connected to Redis");
  });

  redis.on("error", (err: Error) => {
    fastify.log.error({ err }, "Redis connection error");
  });

  const cache = {
    async get<T>(key: string): Promise<T | null> {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    },

    async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    },

    async del(...keys: string[]): Promise<void> {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },
  };

  fastify.decorate("redis", redis);
  fastify.decorate("cache", cache);

  fastify.addHook("onClose", async () => {
    redis.disconnect();
  });
}

export default fp(redisPlugin, { name: "redis" });
