import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { ingredients } from "../db/schema.js";
import { createIngredientSchema, updateIngredientSchema } from "../validators/ingredient.js";

const notDeleted = isNull(ingredients.deletedAt);

export const ingredientsRoute = new Hono()
  .get("/", async (c) => {
    const all = await db.query.ingredients.findMany({ where: notDeleted });
    return c.json(all);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const ingredient = await db.query.ingredients.findFirst({
      where: and(eq(ingredients.id, id), notDeleted),
    });
    if (!ingredient) return c.json({ error: "Not found" }, 404);
    return c.json(ingredient);
  })
  .post("/", zValidator("json", createIngredientSchema), async (c) => {
    const body = c.req.valid("json");
    const [created] = await db.insert(ingredients).values(body).returning();
    return c.json(created, 201);
  })
  .patch("/:id", zValidator("json", updateIngredientSchema), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const [updated] = await db
      .update(ingredients)
      .set(body)
      .where(and(eq(ingredients.id, id), notDeleted))
      .returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [deleted] = await db
      .update(ingredients)
      .set({ deletedAt: new Date() })
      .where(and(eq(ingredients.id, id), notDeleted))
      .returning();
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.body(null, 204);
  });
