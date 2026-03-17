import rateLimit from "express-rate-limit";
import { rateLimitConfig, rateLimitSkips } from "@config/rateLimit.config.js";

export const defaultLimiter = rateLimit({
  ...rateLimitConfig.default,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: rateLimitSkips.default,
});

export const authLimiter = rateLimit({
  ...rateLimitConfig.auth,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: rateLimitSkips.optionsOnly,
});

export const authenticatedLimiter = rateLimit({
  ...rateLimitConfig.authenticated,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: rateLimitSkips.optionsOnly,
});

export const publicWriteLimiter = rateLimit({
  ...rateLimitConfig.publicWrite,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: rateLimitSkips.optionsOnly,
});
