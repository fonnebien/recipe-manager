import type { MiddlewareHandler } from "hono";
import { logger } from "../lib/logger.js";

export const requestLogging: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const durationMs = Math.round(performance.now() - start);
  logger.info(
    {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs,
    },
    "request handled",
  );
};
