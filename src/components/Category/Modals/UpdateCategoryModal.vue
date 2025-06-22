<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axiosClient from '../../../axios';
import { BsBoxFill } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import { useDatabaseStore } from '../../../stores/databaseStore'

// fetching data
const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

const isLoading = ref(false)

const categoryName = ref('')

const props = defineProps({
    modelValue: Boolean,
    category: Object,
})

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
    if (confirmed) {
        confirmUpdateCategory()
    }
}

const emit = defineEmits(['update:modelValue', 'confirmDelete'])

const modalContainer = ref(null)

const closeModal = () => {
    emit('update:modelValue', false) // Notify parent to close modal
}

const handleClickOutside = (event) => {
    if (modalContainer.value && !modalContainer.value.contains(event.target)) {
        closeModal()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

watch(() => props.category, (categories) => {
    if (categories) {
        categoryName.value = categories.category_name
    }
}, { immediate: true })

const confirmUpdateCategory = async () => {
    try {
        isLoading.value = true

        const updateCategory = {
            category_name: categoryName.value
        }

        console.log("Add copy data sent: ", updateCategory)

        const response = await axiosClient.put(
            `/api/categories/${props.category.id}`,
            updateCategory,
            {
                headers: {
                    "x-api-key": API_KEY,
                },
            }
        );
        console.log('Update Category API response:', response);
        // emitter.emit("show-toast", { message: "Copy/Copies updated successfully!", type: "success" });
        // closeModal()
    } catch (error) {
        console.error('Error updating category:', error);
        console.error('Error details:', error.response?.data);
        emitter.emit("show-toast", { message: "Error updating category. Please try again.", type: "error" });
    } finally {
        await databaseStore.fetchData();
        isLoading.value = false;
        emitter.emit("show-toast", { message: "Copy updated successfully!", type: "success" });
        closeModal();
    }
}

// error validation
const errors = ref({
    categoryName: [],
})

const validateForm = () => {
    Object.keys(errors.value).forEach(key => {
        errors.value[key] = [];
    });

    let hasErrors = false;

    if (!categoryName.value) {
        errors.value.categoryName = ["Category name is required"];
        hasErrors = true;
    }

    return !hasErrors;
}

// watch effect for validation
watch(() => categoryName.value, (newValue) => {
    if (!newValue) {
        errors.value.categoryName = ["Category name is required"];
    } else {
        errors.value.categoryName = [];
    }
});

const isClickedShowConfirmationModal = () => {
    if (!validateForm()) {
        return;
    } else {
        showConfirmationModal.value = true
    }
}

</script>

<template>
    <div v-if="modelValue"
        class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50 ">
        <!-- Loading State -->
        <Loading v-if="isLoading" />

        <!-- Main Add Copy Form -->
        <div v-else ref="modalContainer"
            class="w-full max-w-[650px] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
            <h3 class="text-3xl font-semibold mb-4">
                Update Category
            </h3>

            <!-- QUANTITY INPUT -->
            <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
                <!-- Category NAME -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Category Name:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.categoryName ? errors.categoryName[0] :
                        '' }}</p>
                </div>
                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <BsBoxFill />
                    </div>
                    <input type="text" v-model="categoryName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. Printer, Chair, Stairs">
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="-mx-3 flex flex-wrap mt-4">
                <div class="w-1/2 px-3">
                    <button @click="closeModal"
                        class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-dark transition bg-gray-300 hover:border-red-800 hover:bg-red-800 hover:text-white dark:text-black">
                        Cancel
                    </button>
                </div>
                <div class="w-1/2 px-3">
                    <button @click="isClickedShowConfirmationModal()"
                        class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
                        Update
                    </button>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <ConfirmationModal v-model="showConfirmationModal" title="Confirm Update"
                :message="`You are about to update this category.`" :messageData="`\nCategory Name: ${categoryName}`"
                cancelText="Cancel" confirmText="Confirm Update" @confirm="confirmAction" />
        </div>
    </div>
</template>
