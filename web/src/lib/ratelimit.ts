import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Simple sliding window rate limit implementation
export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowDurationSec: number = 60
): Promise<{ success: boolean }> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // If Redis is not configured, bypass rate limiting (useful for local dev without redis)
    return { success: true };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowDurationSec * 1000);

  try {
    // Remove old requests
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    const requestCount = await redis.zcard(key);
    
    if (requestCount >= limit) {
      return { success: false };
    }
    
    // Add new request
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    // Set expiry on the key to clean up automatically
    await redis.expire(key, windowDurationSec);
    
    return { success: true };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open if Redis is down, or choose to fail closed based on security needs
    return { success: true };
  }
}
