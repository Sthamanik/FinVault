import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const userKey = (req: Request): string => {
  const userId = req.user?._id?.toString();
  if(userId) return `user:${userId}`;
  return `ip:${ipKeyGenerator(req as unknown as string) ?? req.ip}`;
};

const jsonMessage = (message: string) => ({
  success: false,
  message,
});

export const rateLimitConfig = {
  default: {
    windowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    limit: toPositiveInt(process.env.RATE_LIMIT_MAX, 600),
    message: jsonMessage("Too many requests, please try again later."),
  },
  auth: {
    windowMs: toPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    limit: toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 5),
    message: jsonMessage("Too many auth attempts, please try again later."),
  },
  authenticated: {
    windowMs: toPositiveInt(
      process.env.AUTHENTICATED_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000
    ),
    limit: toPositiveInt(process.env.AUTHENTICATED_RATE_LIMIT_MAX, 100),
    keyGenerator: userKey,
    message: jsonMessage("Too many requests, please try again later."),
  },
  publicWrite: {
    windowMs: toPositiveInt(
      process.env.PUBLIC_RATE_LIMIT_WINDOW_MS,
      60 * 60 * 1000
    ),
    limit: toPositiveInt(process.env.PUBLIC_RATE_LIMIT_MAX, 30),
    message: jsonMessage("Too many submissions, please try again later."),
  },
};

export const rateLimitSkips = {
  default: (req: Request) =>
    process.env.NODE_ENV === "test" ||
    req.method === "OPTIONS" ||
    req.path === "/health",
  optionsOnly: (req: Request) =>
    process.env.NODE_ENV === "test" || req.method === "OPTIONS",
};
