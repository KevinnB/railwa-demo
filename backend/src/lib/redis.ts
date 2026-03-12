import Redis from "ioredis";

export const redis = new Redis.default(
  process.env.REDIS_URL ?? "redis://localhost:6379"
);

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err: Error) => {
  console.error("Redis connection error:", err.message);
});

const DEFAULT_TTL = 60;

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set(
    key: string,
    value: unknown,
    ttlSeconds = DEFAULT_TTL
  ): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
