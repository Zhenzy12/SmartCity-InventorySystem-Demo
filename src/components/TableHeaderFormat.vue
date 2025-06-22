<template>
  <span
    class="inline-flex items-center space-x-1"
    :class="sortBy === field ? 'text-green-600 dark:text-lime-500' : ''"
  >
    <span>{{ label }}</span>
    <span v-if="sortBy === field">
      {{ sortDirection === 'asc' ? '▲' : '▼' }}
    </span>
    <span v-else class="text-gray-400">
      <FaSort />
    </span>
  </span>
</template>

<script setup>
import { defineProps } from 'vue';
import { FaSort } from '@kalimahapps/vue-icons';

defineProps({
  label: String,
  field: String,
  sortBy: String,
  sortDirection: String
})
</script>
