import rateLimit from 'express-rate-limit';

// Protects the single GraphQL endpoint from brute-force / abuse.
// Keyed per-IP; tune the window and max for your traffic profile.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: [{ message: 'Too many requests, please slow down.' }] },
});
