import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { recipes } from "../db/schema.js";
import { createRecipeSchema } from "../validators/recipe.js";

export const recipesRoute = new Hono()
  .get("/", async (c) => {
    const all = await db.query.recipes.findMany();
    return c.json(all);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: { ingredients: true },
    });
    if (!recipe) return c.json({ error: "Not found" }, 404);
    return c.json(recipe);
  })
  .post("/", zValidator("json", createRecipeSchema), async (c) => {
    const body = c.req.valid("json");
    const [created] = await db
      .insert(recipes)
      .values({
        title: body.title,
        instructions: body.instructions,
        servings: body.servings,
        prepTimeMinutes: body.prepTimeMinutes,
        cookTimeMinutes: body.cookTimeMinutes,
        tags: body.tags,
      })
      .returning();
    return c.json(created, 201);
  });
