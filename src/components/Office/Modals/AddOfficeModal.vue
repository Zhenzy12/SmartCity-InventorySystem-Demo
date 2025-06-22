<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { BsBoxFill } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import axiosClient from '../../../axios';
import { useDatabaseStore } from '../../../stores/databaseStore';

const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

const isLoading = ref(false)

const props = defineProps({
    modelValue: Boolean,
})

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
    if (confirmed) {
        confirmAddOffice()
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

const officeName = ref('')

const confirmAddOffice = async () => {
    try {
        isLoading.value = true

        const addOffice = {
            office_name: officeName.value,
            is_deleted: 0,
            deleted_by: null
        }

        console.log("Add copy data sent: ", addOffice)

        const response = await axiosClient.post(
            `/api/offices/`,
            addOffice,
            {
                headers: {
                    "x-api-key": API_KEY,
                },
            }
        );
        console.log('Add Office API response:', response);
        // emitter.emit("show-toast", { message: "Category added successfully!", type: "success" });
        // closeModal()
    } catch (error) {
        console.error('Error adding office:', error);
        console.error('Error details:', error.response?.data);
        emitter.emit("show-toast", { message: "Error adding office. Please try again.", type: "error" });
    } finally {
        await databaseStore.fetchData();
        isLoading.value = false;
        emitter.emit("show-toast", { message: "Office added successfully!", type: "success" });
        closeModal();
    }
}

// error validation
const errors = ref({
    officeName: [],
})

const validateForm = () => {
    Object.keys(errors.value).forEach(key => {
        errors.value[key] = [];
    });

    let hasErrors = false;

    if (!officeName.value) {
        errors.value.officeName = ["Office name is required"];
        hasErrors = true;
    }

    return !hasErrors;
}

// watch effect for validation
watch(() => officeName.value, (newValue) => {
    if (!newValue) {
        errors.value.officeName = ["Office name is required"];
    } else {
        errors.value.officeName = [];
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
                Add Office
            </h3>

            <!-- QUANTITY INPUT -->
            <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
                <!-- CATEGORY NAME -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Office Name:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.officeName ? errors.officeName[0] :
                        '' }}</p>
                </div>

                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <BsBoxFill />
                    </div>
                    <input type="text" v-model="officeName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. SC3 Office">
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
                        Add Office
                    </button>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <ConfirmationModal v-model="showConfirmationModal" title="Confirm Addition"
                :message="`You are about to add this office.`" :messageData="`\nOffice Name: ${officeName}`"
                cancelText="Cancel" confirmText="Confirm Adding" @confirm="confirmAction" />
        </div>
    </div>
</template>