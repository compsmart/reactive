import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimit = (options?: { windowMs?: number; maxRequests?: number }) => {
  const windowMs = options?.windowMs || config.RATE_LIMIT_WINDOW_MS;
  const maxRequests = options?.maxRequests || config.RATE_LIMIT_MAX_REQUESTS;

  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as identifier (consider using user ID for authenticated requests)
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
      // Create new record
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(identifier, record);
    } else {
      record.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};

// Rate limit for auth endpoints (prevent brute force)
// More lenient in development, stricter in production
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'production' ? 20 : 100, // 100 in dev, 20 in prod
});

