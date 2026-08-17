<script setup lang="ts">
import { useRecipesQuery } from "../composables/useRecipes.js";

const { data: recipes, isLoading, error } = useRecipesQuery();
</script>

<template>
  <h1 class="mb-4 text-xl font-semibold">Recipes</h1>
  <p v-if="isLoading">Loading…</p>
  <p v-else-if="error" class="text-red-600">Failed to load recipes.</p>
  <ul v-else class="space-y-2">
    <li v-for="recipe in recipes" :key="recipe.id" class="rounded border bg-white p-3">
      {{ recipe.title }}
    </li>
  </ul>
</template>
