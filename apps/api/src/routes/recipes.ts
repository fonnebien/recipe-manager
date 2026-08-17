import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { recipeIngredients, recipes } from "../db/schema.js";
import { isForeignKeyViolation } from "../lib/db-errors.js";
import { createRecipeSchema, updateRecipeSchema } from "../validators/recipe.js";

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
    try {
      const created = await db.transaction(async (tx) => {
        const [recipe] = await tx
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

        if (body.ingredients.length > 0) {
          await tx.insert(recipeIngredients).values(
            body.ingredients.map((ingredient) => ({
              recipeId: recipe.id,
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity.toString(),
              unit: ingredient.unit,
            })),
          );
        }

        return recipe;
      });
      return c.json(created, 201);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        return c.json({ error: "One or more ingredients do not exist" }, 400);
      }
      throw err;
    }
  })
  .patch("/:id", zValidator("json", updateRecipeSchema), async (c) => {
    const id = c.req.param("id");
    const { ingredients: newIngredients, ...fields } = c.req.valid("json");

    try {
      const updated = await db.transaction(async (tx) => {
        const recipe =
          Object.keys(fields).length > 0
            ? (await tx.update(recipes).set(fields).where(eq(recipes.id, id)).returning())[0]
            : await tx.query.recipes.findFirst({ where: eq(recipes.id, id) });
        if (!recipe) return null;

        if (newIngredients) {
          await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
          if (newIngredients.length > 0) {
            await tx.insert(recipeIngredients).values(
              newIngredients.map((ingredient) => ({
                recipeId: id,
                ingredientId: ingredient.ingredientId,
                quantity: ingredient.quantity.toString(),
                unit: ingredient.unit,
              })),
            );
          }
        }

        return recipe;
      });

      if (!updated) return c.json({ error: "Not found" }, 404);
      return c.json(updated);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        return c.json({ error: "One or more ingredients do not exist" }, 400);
      }
      throw err;
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [deleted] = await db.delete(recipes).where(eq(recipes.id, id)).returning();
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.body(null, 204);
  });
