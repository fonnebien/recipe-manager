import { z } from "zod";
import { unitSchema } from "./ingredient.js";

export const recipeIngredientSchema = z.object({
  ingredientId: z.uuid(),
  quantity: z.number().positive(),
  unit: unitSchema,
});

export const recipeSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  instructions: z.string().min(1),
  servings: z.number().int().positive(),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  ingredients: z.array(recipeIngredientSchema),
});

export const createRecipeSchema = recipeSchema.omit({ id: true });
export const updateRecipeSchema = createRecipeSchema.partial();

export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type CreateRecipe = z.infer<typeof createRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
