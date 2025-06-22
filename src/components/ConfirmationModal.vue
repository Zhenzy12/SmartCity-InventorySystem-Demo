<script setup>
import { ref} from 'vue'
import { GlCloseXs } from '@kalimahapps/vue-icons';

const props = defineProps({
  title: String,
  message: String,
  cancelText: { type: String, default: "Cancel" },
  confirmText: { type: String, default: "Confirm" },
  modelValue: Boolean,
  messageData: String,
})

const emit = defineEmits(["update:modelValue", "confirm"])

const closeModal = () => {
  emit("update:modelValue", false) // Close modal
}

const confirmAction = () => {
  emit("confirm", 1) // Return 1 when confirmed
  closeModal()
}
</script>

<template>
  <div v-if="modelValue" class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55">
    <div class="w-full max-w-[600px] max-h-[90vh] rounded-3xl p-8 text-center border-4 bg-sky-100 dark:bg-gray-950">
      <div class="flex flex-row justify-between items-center border-b border-blue-900 dark:border-gray-400">
        <!-- Title -->
        <h3 class="text-start text-3xl pb-2">
          {{ title }}
        </h3>
        <!-- CLOSE BUTTON -->
        <button @click="closeModal"
          class="bg-red-600 dark:bg-gray-200 text-gray-300 dark:text-gray-700 w-10 h-10 -mr-5 -mt-8 rounded-full hover:bg-orange-600 dark:hover:bg-gray-300 hover:scale-105 transition">
          <GlCloseXs class="w-8 h-8 m-auto" />
        </button>
      </div>
      <p class="text-start mt-5 mb-4">
        {{ message }}
      </p>
      <div class="flex justify-center ">
        <pre class="text-wrap text-start mb-6 px-12 rounded-2xl w-[420px] min-h-20 max-h-[50vh] overflow-y-auto [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-slate-400 dark:bg-gray-800">
          {{ messageData}}
        </pre>
      </div>
      <div class="flex flex-wrap">
        <div class="w-1/2 px-3">
          <button @click="closeModal"
            class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-white dark:text-dark transition hover:scale-105 hover:bg-orange-600 bg-red-600 border-red-950 hover:border-red-700 dark:hover:bg-red-700 dark:bg-red-800 dark:border-red-950 dark:hover:border-red-700">
            {{ cancelText }}
          </button>
        </div>
        <div class="w-1/2 px-3">
          <button @click="confirmAction"
            class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition hover:scale-105 hover:bg-green-900 bg-green-700 border-green-950 hover:border-green-700 dark:hover:bg-green-700 dark:bg-green-800 dark:border-green-950 dark:hover:border-green-700">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
