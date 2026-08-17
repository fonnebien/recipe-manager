import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../lib/logger.js";

export function onError(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  logger.error({ err, requestId: c.get("requestId") }, "unhandled error");
  return c.json({ error: "Internal Server Error" }, 500);
}
