import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { ingredients } from "../db/schema.js";
import { isForeignKeyViolation } from "../lib/db-errors.js";
import { createIngredientSchema, updateIngredientSchema } from "../validators/ingredient.js";

export const ingredientsRoute = new Hono()
  .get("/", async (c) => {
    const all = await db.query.ingredients.findMany();
    return c.json(all);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const ingredient = await db.query.ingredients.findFirst({
      where: eq(ingredients.id, id),
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
      .where(eq(ingredients.id, id))
      .returning();
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const [deleted] = await db.delete(ingredients).where(eq(ingredients.id, id)).returning();
      if (!deleted) return c.json({ error: "Not found" }, 404);
      return c.body(null, 204);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        return c.json({ error: "Ingredient is still referenced by a recipe or pantry item" }, 409);
      }
      throw err;
    }
  });
