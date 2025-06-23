<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { CaCategories, MdDeleteForever } from '@kalimahapps/vue-icons';
import axiosClient from '../../../axios';
import QRCodeDisplay from '../../QRCodeGenerator/QRCodeDisplay.vue';
import Loading from '../../Loading.vue';
import ConfirmationModal from '../../ConfirmationModal.vue';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import { useDatabaseStore } from '../../../stores/databaseStore';

const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

const showQRCodes = ref(false)
const generatedQRCodes = ref([])

const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean,
  selectedItems: Object,
})

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
  if (confirmed) {
    confirmUpdateQty()
  }
}

console.log("Selected Items: ", props.selectedItems)

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

const supplyQty = ref('')

const confirmUpdateQty = async () => {
  try {
    isLoading.value = true;
    const updateQty = {
      id: props.selectedItems.id,
      supply_quantity: props.selectedItems.supply_quantity + supplyQty.value
    }

    console.log("Update supply quantity data sent: ", updateQty)

    databaseStore.updateOfficeSupply(updateQty);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Supply quantity updated successfully:", updateQty);
    

    // Generate QR codes after successful update
    generatedQRCodes.value = [{
      id: props.selectedItems.id,
      name: props.selectedItems.supply_name,
      description: props.selectedItems.supply_description,
      serialNumber: props.selectedItems.serial_number,
      categoryId: props.selectedItems.category_id,
      type: 'supply'
    }];

    showQRCodes.value = true;
    console.log("Generated QR Codes: ", generatedQRCodes.value);

  } catch (error) {
    console.error('Error updating office quantity:', error);
    emitter.emit("show-toast", { message: "Error updating office quantity. Please try again.", type: "error" });
  } finally {
    isLoading.value = false;
    emitter.emit("show-toast", { message: "Office Quantity updated successfully!", type: "success" });
    // closeModal();
  }
}

const handlePrint = () => {
  window.print();
}

const closeQRDisplay = () => {
  showQRCodes.value = false;
  closeModal();
}


</script>

<template>
  <div v-if="modelValue"
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5">
    <Loading v-if="isLoading" />
    <div v-if="!showQRCodes && !isLoading" ref="modalContainer"
      class="w-full max-w-[650px] rounded-[20px] bg-white px-8 py-8 text-center border border-4 dark:bg-gray-950 dark:border-gray-100">
      <h3 class="text-3xl font-semibold mb-4">
        Increase Supply Quantity
      </h3>
      <!-- QUANTITY INPUT -->
      <div class="text-start">
        <label class="block mt-4 mb-2 text font-medium text-gray-900 dark:text-gray-200">Copy Quantity to be
          Added:</label>
        <div class="relative ml-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <AnOutlinedNumber />
          </div>
          <input type="number" v-model="supplyQty" placeholder="Enter quantity..."
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
        </div>
      </div>
      <!-- BUTTONS -->
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
    </div>
    <!-- QR Code Display -->
    <div v-if="showQRCodes && !isLoading"
      class="w-full max-w-[1000px] bg-white rounded-[20px] p-8 dark:bg-gray-950 border border-4 dark:border-white">
      <QRCodeDisplay :qr-codes="generatedQRCodes" :on-print="handlePrint" :on-close="closeQRDisplay" />
    </div>
    <!-- CONFIRMATION MODAL -->
    <ConfirmationModal v-model="showConfirmationModal" title="Confirm Addition"
      :message="`You are about to add a copy to this Supply.`"
      :messageData="`\nSupply Name: ${selectedItems.supply_name}\nQuantit${supplyQty === 1 ? 'y' : 'ies'} to add: ${supplyQty}`"
      cancelText="Cancel" confirmText="Confirm Adding" @confirm="confirmAction" />
  </div>
</template>
