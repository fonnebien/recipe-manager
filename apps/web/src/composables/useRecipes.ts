import { useQuery } from "@tanstack/vue-query";
import { client } from "../api/client.js";

export function useRecipesQuery() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const res = await client.recipes.$get();
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
  });
}
