import { Hono } from "hono";
import { db } from "../db/client.js";

export const pantryRoute = new Hono().get("/", async (c) => {
  const all = await db.query.pantryItems.findMany();
  return c.json(all);
});
