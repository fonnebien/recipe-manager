import { z } from "zod";
import { unitSchema } from "./ingredient.js";

export const pantryItemSchema = z.object({
  id: z.uuid(),
  ingredientId: z.uuid(),
  quantity: z.number().nonnegative(),
  unit: unitSchema,
  expirationDate: z.iso.date().nullable(),
});

export const createPantryItemSchema = pantryItemSchema.omit({ id: true });
export const updatePantryItemSchema = createPantryItemSchema.partial();

export type PantryItem = z.infer<typeof pantryItemSchema>;
export type CreatePantryItem = z.infer<typeof createPantryItemSchema>;
export type UpdatePantryItem = z.infer<typeof updatePantryItemSchema>;
