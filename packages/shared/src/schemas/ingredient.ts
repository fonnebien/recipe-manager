import { z } from "zod";

export const ingredientCategorySchema = z.enum([
  "produce",
  "dairy",
  "meat",
  "grain",
  "spice",
  "condiment",
  "baking",
  "other",
]);

export const unitSchema = z.enum([
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "piece",
]);

export const ingredientSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  baseUnit: unitSchema,
  category: ingredientCategorySchema,
});

export const createIngredientSchema = ingredientSchema.omit({ id: true });

export type IngredientCategory = z.infer<typeof ingredientCategorySchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type CreateIngredient = z.infer<typeof createIngredientSchema>;
