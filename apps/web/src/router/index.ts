import { createRouter, createWebHistory } from "vue-router";
import RecipeListView from "../views/RecipeListView.vue";
import PantryView from "../views/PantryView.vue";
import GroceryListView from "../views/GroceryListView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "recipes", component: RecipeListView },
    { path: "/pantry", name: "pantry", component: PantryView },
    { path: "/grocery-list", name: "grocery-list", component: GroceryListView },
  ],
});
