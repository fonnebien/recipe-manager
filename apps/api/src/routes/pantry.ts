import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client.js";
import { pantryItems } from "../db/schema.js";
import { isForeignKeyViolation } from "../lib/db-errors.js";
import { createPantryItemSchema, updatePantryItemSchema } from "../validators/pantry.js";

export const pantryRoute = new Hono()
  .get("/", async (c) => {
    const all = await db.query.pantryItems.findMany();
    return c.json(all);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const item = await db.query.pantryItems.findFirst({
      where: eq(pantryItems.id, id),
    });
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json(item);
  })
  .post("/", zValidator("json", createPantryItemSchema), async (c) => {
    const body = c.req.valid("json");
    try {
      const [created] = await db
        .insert(pantryItems)
        .values({ ...body, quantity: body.quantity.toString() })
        .returning();
      return c.json(created, 201);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        return c.json({ error: "Ingredient does not exist" }, 400);
      }
      throw err;
    }
  })
  .patch("/:id", zValidator("json", updatePantryItemSchema), async (c) => {
    const id = c.req.param("id");
    const { quantity, ...rest } = c.req.valid("json");
    try {
      const [updated] = await db
        .update(pantryItems)
        .set({ ...rest, ...(quantity !== undefined && { quantity: quantity.toString() }) })
        .where(eq(pantryItems.id, id))
        .returning();
      if (!updated) return c.json({ error: "Not found" }, 404);
      return c.json(updated);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        return c.json({ error: "Ingredient does not exist" }, 400);
      }
      throw err;
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [deleted] = await db.delete(pantryItems).where(eq(pantryItems.id, id)).returning();
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.body(null, 204);
  });
