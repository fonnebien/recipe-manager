import { defineStore } from "pinia";

export const useGroceryListStore = defineStore("grocery-list", {
  state: () => ({
    selectedRecipeIds: [] as string[],
  }),
  actions: {
    toggleRecipe(id: string) {
      const index = this.selectedRecipeIds.indexOf(id);
      if (index === -1) {
        this.selectedRecipeIds.push(id);
      } else {
        this.selectedRecipeIds.splice(index, 1);
      }
    },
  },
});
