<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="flex gap-4 border-b bg-white px-6 py-3">
      <RouterLink to="/" class="font-medium text-gray-700 hover:text-gray-900">Recipes</RouterLink>
      <RouterLink to="/pantry" class="font-medium text-gray-700 hover:text-gray-900">Pantry</RouterLink>
      <RouterLink to="/grocery-list" class="font-medium text-gray-700 hover:text-gray-900">Grocery List</RouterLink>
    </nav>
    <main class="p-6">
      <RouterView />
    </main>
  </div>
</template>
