import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { ingredients, recipeIngredients, recipes } from "../db/schema.js";
import { isForeignKeyViolation } from "../lib/db-errors.js";
import { createRecipeSchema, updateRecipeSchema } from "../validators/recipe.js";

const notDeleted = isNull(recipes.deletedAt);

class IngredientsNotFoundError extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function assertIngredientsExist(tx: Tx, ingredientIds: string[]) {
  const uniqueIds = [...new Set(ingredientIds)];
  if (uniqueIds.length === 0) return;

  const found = await tx.query.ingredients.findMany({
    where: and(inArray(ingredients.id, uniqueIds), isNull(ingredients.deletedAt)),
    columns: { id: true },
  });
  if (found.length !== uniqueIds.length) {
    throw new IngredientsNotFoundError("One or more ingredients do not exist");
  }
}

export const recipesRoute = new Hono()
  .get("/", async (c) => {
    const all = await db.query.recipes.findMany({ where: notDeleted });
    return c.json(all);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const recipe = await db.query.recipes.findFirst({
      where: and(eq(recipes.id, id), notDeleted),
      with: { ingredients: true },
    });
    if (!recipe) return c.json({ error: "Not found" }, 404);
    return c.json(recipe);
  })
  .post("/", zValidator("json", createRecipeSchema), async (c) => {
    const body = c.req.valid("json");
    try {
      const created = await db.transaction(async (tx) => {
        await assertIngredientsExist(
          tx,
          body.ingredients.map((ingredient) => ingredient.ingredientId),
        );

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
      if (err instanceof IngredientsNotFoundError || isForeignKeyViolation(err)) {
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
            ? (
                await tx
                  .update(recipes)
                  .set(fields)
                  .where(and(eq(recipes.id, id), notDeleted))
                  .returning()
              )[0]
            : await tx.query.recipes.findFirst({ where: and(eq(recipes.id, id), notDeleted) });
        if (!recipe) return null;

        if (newIngredients) {
          await assertIngredientsExist(
            tx,
            newIngredients.map((ingredient) => ingredient.ingredientId),
          );

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
      if (err instanceof IngredientsNotFoundError || isForeignKeyViolation(err)) {
        return c.json({ error: "One or more ingredients do not exist" }, 400);
      }
      throw err;
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [deleted] = await db
      .update(recipes)
      .set({ deletedAt: new Date() })
      .where(and(eq(recipes.id, id), notDeleted))
      .returning();
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.body(null, 204);
  });
