import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: IORedis };

export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required");
  }

  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return globalForRedis.redis;
}

export async function closeRedisConnection() {
  if (!globalForRedis.redis) return;
  await globalForRedis.redis.quit().catch(() => {
    globalForRedis.redis?.disconnect();
  });
  globalForRedis.redis = undefined;
}
