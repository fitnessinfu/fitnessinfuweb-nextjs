// In-memory sliding window rate limiter for authentication endpoints
const tracker = new Map();

// Periodic cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Check if an IP/key has exceeded its request quota.
 * @param {string} key - e.g. `login:${ip}` or `register:${ip}`
 * @param {number} limit - maximum requests allowed in window
 * @param {number} windowMs - window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(key, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const existing = tracker.get(key);

  if (!existing || now > existing.resetTime) {
    const record = { count: 1, resetTime: now + windowMs };
    tracker.set(key, record);
    return { allowed: true, remaining: limit - 1, resetTime: record.resetTime };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetTime: existing.resetTime };
}

/**
 * Helper to extract client IP from Next.js request headers.
 */
export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
