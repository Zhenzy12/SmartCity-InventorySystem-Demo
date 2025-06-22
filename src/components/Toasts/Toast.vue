<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import emitter from "../../eventBus";
import { JaClose } from '@kalimahapps/vue-icons';
import { AkCircleCheckFill } from '@kalimahapps/vue-icons';
import { BsExclamationTriangleFill } from '@kalimahapps/vue-icons';
import { IoCloseCircle } from '@kalimahapps/vue-icons';

const toasts = ref([]);

const addToast = ({ message, type = "success" }) => {
    const id = Date.now();
    toasts.value.push({ id, message, type });

    setTimeout(() => {
        removeToast(id);
    }, 5000);
};

const removeToast = (id) => {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
};

onMounted(() => {
    emitter.on("show-toast", addToast);
});

onUnmounted(() => {
    emitter.off("show-toast", addToast);
});
</script>

<template>
    <div class="fixed top-20 right-5 flex flex-col items-end space-y-4 z-500">
        <div v-for="(toast) in toasts" :key="toast.id"
            class="grid grid-cols-10 items-center rounded-lg px-5 py-2 transition-all duration-500 bg-gradient-to-b border border-2 w-full w-[300px] sm:w-[350px] md:w-[400px]"
            :class="{
                'from-green-950 to-gray-950 border-emerald-900 dark:from-green-950 dark:to-gray-950 dark:border-emerald-900': toast.type === 'success',
                'from-red-950 to-gray-950 border-red-900 dark:from-red-950 dark:to-gray-950 dark:border-red-900': toast.type === 'error',
                'from-yellow-950 to-gray-950 border-yellow-900 dark:from-yellow-950 dark:to-gray-950 dark:border-yellow-900': toast.type === 'warning',
            }">
            <span class="col-span-1">
                <AkCircleCheckFill v-if="toast.type === 'success'" class="w-7 h-7 text-green-500 mr-4" />
                <BsExclamationTriangleFill v-else-if="toast.type === 'warning'" class="w-6 h-6 text-yellow-500 mr-2" />
                <IoCloseCircle v-else class="w-7 h-7 text-red-600 mr-4" />
            </span>

            <p class="col-span-8 font-semibold text-lg" :class="{
                'text-green-600 dark:text-green-500': toast.type === 'success',
                'text-red-600 dark:text-red-500': toast.type === 'error',
                'text-yellow-600 dark:text-yellow-500': toast.type === 'warning',
            }">
                {{ toast.type.charAt(0).toUpperCase() + toast.type.slice(1) }}
            </p>

            <button class="col-span-1 ml-4 text-gray-200 dark:text-gray-200" @click="removeToast(toast.id)">
                <JaClose class="w-7 h-7" />
            </button>

            <div class="col-span-1"></div>

            <p class="col-span-9 text-gray-200 dark:text-gray-200">{{ toast.message }}</p>
        </div>
    </div>
</template>
