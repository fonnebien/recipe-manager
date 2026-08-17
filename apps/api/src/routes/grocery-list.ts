import { Hono } from "hono";

export const groceryListRoute = new Hono().get("/", async (c) => {
  // TODO: sum ingredient needs across selected recipes (unit-normalized),
  // subtract current pantry stock, return what's missing.
  return c.json([]);
});
