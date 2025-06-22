<script setup>
import { FlCheckboxChecked, FlCheckboxUnchecked } from "@kalimahapps/vue-icons";
import { ref } from 'vue';
import { AkArrowClockwise } from "@kalimahapps/vue-icons";

const props = defineProps({
  invAccess: Object,
  userId: Number,
  type: String,
  onToggle: Function,
  user: Object,
});

const isLoading = ref(false);

const handleToggle = async (user, accessId, type) => {
  isLoading.value = true;
  try {
    await props.onToggle(user, accessId, type);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <label class="flex w-full justify-center cursor-pointer select-none text-dark dark:text-white"
    v-if="invAccess?.user_id === userId">
    <div class="relative">
      <input type="checkbox" class="sr-only" :checked="invAccess[type] === true"
        @change="handleToggle(user, invAccess.id, type)" :disabled="isLoading" />

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="animate-spin">
        <AkArrowClockwise class="h-6 w-6 text-blue-500" />
      </div>

      <!-- Checkbox Icons -->
      <span v-else-if="invAccess[type] === true">
        <FlCheckboxChecked class="h-6 w-6 text-green-600" />
      </span>
      <span v-else>
        <FlCheckboxUnchecked class="h-6 w-6 text-red-500" />
      </span>
    </div>
  </label>
</template>