<!-- ILALAGAY SA MODAL -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import axiosClient from '../../../axios';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import { BsBoxFill } from '@kalimahapps/vue-icons';
import { FlFilledTextDescription } from '@kalimahapps/vue-icons';
import { BxSolidCategoryAlt } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';

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
        confirmAddCopy()
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

const copyQuantity = ref('')

const confirmAddCopy = async () => {
    try {
        emitter.emit("show-toast", { message: "Copy/Copies added successfully!", type: "success" });
        // closeModal()
    } catch (error) {
        emitter.emit("show-toast", { message: "Error adding copies. Please try again.", type: "error" });
    } finally {
        isLoading.value = false;
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
            class="w-full max-w-[650px] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border border-4 dark:bg-gray-950 dark:border-gray-100">
            <h3 class="text-3xl font-semibold mb-4">
                Add Copy    
            </h3>

            <!-- QUANTITY INPUT -->
            <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
                <!-- SUPPLY IMAGE -->
                <label class="block mt-4 mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply Image:</label>
                <div class="relative ml-2">
                    <input type="file" @change="handleImageUpload" accept="image/*"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                </div>
                <!-- SUPPLY NAME -->
                <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply Name:</label>
                <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <BsBoxFill />
                    </div>
                    <input type="text" v-model="supplyName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. Printer, Chair, Stairs">
                </div>
                <!-- SUPPLY DESCRIPTION -->
                <label class="block mt-4 mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply
                    Description:</label>
                <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <FlFilledTextDescription />
                    </div>
                    <textarea type="text" v-model="supplyDescription"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. Printer, Chair, Stairs"></textarea>
                </div>
                <!-- SUPPLY CATEGORY -->
                <label class="block mt-4 mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply
                    Category:</label>

                <div class="relative">
                    <div class="absolute inset-y-0 start-2 flex items-center ps-3.5 pointer-events-none">
                        <BxSolidCategoryAlt />
                    </div>
                    <div class="pr-2">
                        <select v-model="selectedCategory"
                            class="border rounded-lg ml-2 w-full text-sm pl-9  dark:text-gray-100 h-10 dark:bg-gray-700 dark:border-gray-600 pl-4 ">
                            <option v-for="category in props.categories" :key="category.id" :value="category.id">
                                {{ category.category_name }}
                            </option>
                        </select>
                    </div>
                </div>
                <!-- SERIAL NUMBER -->
                <label class="block mt-4 mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply Number:</label>
                <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <BsBoxFill />
                    </div>
                    <input type="text" v-model="serialNumber"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. Printer, Chair, Stairs">
                </div>
                <!-- EQUIPMENT QUANTITY -->
                <label class="block mt-4 mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply
                    Quantity:</label>
                <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <AnOutlinedNumber />
                    </div>
                    <input type="number" v-model="supplyQuantity"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
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
                    <button @click="showConfirmationModal = true"
                        class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
                        Add Copy
                    </button>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <ConfirmationModal v-model="showConfirmationModal" title="Confirm Addition" :message="`The Message Here.`"
                :messageData="`\nEquipment Name: hehehehe\nCopy to add: hehehhe`" cancelText="Cancel"
                confirmText="Confirm Adding" @confirm="confirmAction" />
        </div>
    </div>
</template>


<!-- SA FRONTEND -->

<!-- SCRIPT PART -->
 import { ClAddPlus } from '@kalimahapps/vue-icons';
const isOpenAddItemModal = ref(false);

const OpenAddItemModal = () => {
  isOpenAddItemModal.value = true;
}


<!-- TEMPLATE PART -->
<button @click.stop="OpenAddItemModal()"
    class="flex items-center justify-center border w-full px-2 py-1 rounded-lg dark:border-gray-600 dark:bg-green-800 dark:hover:bg-green-700">
<ClAddPlus class="w-8 h-8" />
<p class="ml-1">Add Item</p>
</button>


<AddItemModal v-if="isOpenAddItemModal" v-model="isOpenAddItemModal" :categories="categoryList" @click.stop />