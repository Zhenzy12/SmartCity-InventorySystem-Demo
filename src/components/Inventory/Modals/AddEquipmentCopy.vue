<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axiosClient from '../../../axios';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import QRCodeDisplay from '../../QRCodeGenerator/QRCodeDisplay.vue';
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
  equipmentCopies: Object,
})

console.log("Equipment Copies: ", props.equipmentCopies)

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
const serialNumber = ref('')

const confirmAddCopy = async () => {
  try {
    if (!props.equipmentCopies || props.equipmentCopies.length === 0) {
      emitter.emit("show-toast", { message: "No equipment copies data available", type: "warning" });
      return;
    }

    isLoading.value = true;
    const quantity = parseInt(copyQuantity.value);
    const serialNum = serialNumber.value
    const highestCopyNum = Math.max(...props.equipmentCopies.map(copy => copy.copy_num));
    const newQRCodes = [];

    for (let i = 0; i < quantity; i++) {
      const newCopyNum = highestCopyNum + i + 1;
      const addCopy = {
        item_id: props.equipmentCopies[0].item_id,
        is_available: 1,
        serial_number: serialNum,
        copy_num: newCopyNum,
      }

      console.log("Add copy data sent: ", addCopy)

     databaseStore.addEquipmentCopy(addCopy);
     await new Promise(resolve => setTimeout(resolve, 500));
     console.log("Copy added successfully:", addCopy);

      // Add QR code data for each new copy
      newQRCodes.push({
        id: props.selectedItems.id,
        name: props.selectedItems.equipment_name,
        description: props.selectedItems.equipment_description,
        categoryId: props.selectedItems.category_id,
        copyNumber: newCopyNum,
        serialNumber: serialNum,
        type: 'equipment'
      });

      console.log('Add Copies API response:', response);
    }

    // Set the generated QR codes
    generatedQRCodes.value = newQRCodes;
    showQRCodes.value = true;

    // closeModal()
  } catch (error) {
    console.error('Error adding copies:', error);
    emitter.emit("show-toast", { message: "Error adding copies. Please try again.", type: "error" });
  } finally {
    isLoading.value = false;
    emitter.emit("show-toast", { message: "Transaction updated successfully!", type: "success" });
    // closeModal();
  }
}

// Add these required functions
const handlePrint = () => {
  window.print();
}

const closeQRDisplay = () => {
  showQRCodes.value = false;
  closeModal();
}

// error validation
const errors = ref({
  copyQuantity: [],
  serialNumber: [],
})

const validateForm = () => {
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = [];
  });

  let hasErrors = false;

  if (!copyQuantity.value) {
    errors.value.copyQuantity = ["Copy Quantity is required"];
    hasErrors = true;
  } else if (Number(copyQuantity.value) <= 0) {
    errors.value.copyQuantity = ["Copy Quantity must be greater than 0"];
    hasErrors = true;
  }

  if (!serialNumber.value) {
    errors.value.serialNumber = ["Serial Number is required"];
    hasErrors = true;
  }

  return !hasErrors;
}

// watch effect for validation
watch(() => copyQuantity.value, (newValue) => {
  if (!newValue) {
    errors.value.copyQuantity = ["Copy Quantity is required"];
  } else if (Number(newValue) <= 0) {
    errors.value.copyQuantity = ["Copy Quantity must be greater than 0"];
  } else {
    errors.value.copyQuantity = [];
  }
});

// watch effect for validation
watch(() => serialNumber.value, (newValue) => {
  if (!newValue) {
    errors.value.serialNumber = ["Serial Number is required"];
  } else {
    errors.value.copyQuantity = [];
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
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50">
    <!-- Loading State -->
    <Loading v-if="isLoading" />

    <!-- Main Add Copy Form -->
    <div v-else-if="!showQRCodes" ref="modalContainer"
      class="w-full max-w-[650px] rounded-[20px] bg-white px-8 py-8 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
      <h3 class="text-3xl font-semibold mb-4">
        Add Copy
      </h3>

      <!-- QUANTITY INPUT -->
      <div class="text-start">
        <div class="flex flex-row mt-4 mb-2">
          <label class="block text font-medium text-gray-900 dark:text-gray-200">
            Copy Quantity to be Added:
          </label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.copyQuantity?.length ? errors.copyQuantity[0] : ''
          }}</p>
        </div>
        <div class="relative ml-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <AnOutlinedNumber />
          </div>
          <input type="number" min="1" v-model="copyQuantity" placeholder="Enter quantity..."
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
        </div>
      </div>


      <!-- QUANTITY INPUT -->
      <div class="text-start">
        <div class="flex flex-row mt-4 mb-2">
          <label class="block text font-medium text-gray-900 dark:text-gray-200">
            Serial Number:
          </label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.serialNumber?.length ? errors.serialNumber[0] : ''
          }}</p>
        </div>
        <div class="relative ml-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <AnOutlinedNumber />
          </div>
          <input type="text" min="1" v-model="serialNumber" placeholder="Enter Serial Number..."
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
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
            Add Copy
          </button>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal v-model="showConfirmationModal" title="Confirm Addition"
        :message="`You are about to add a copy to this Equipment.`"
        :messageData="`\nEquipment Name: ${selectedItems.equipment_name}\nCop${copyQuantity === 1 ? 'y' : 'ies'} to add: ${copyQuantity}`"
        cancelText="Cancel" confirmText="Confirm Adding" @confirm="confirmAction" />
    </div>

    <!-- QR Codes Display (Separate Modal) -->
    <div v-else
      class="w-full max-w-[60vw] bg-white rounded-[20px] p-8 dark:bg-gray-950 border border-4 dark:border-white">
      <QRCodeDisplay :qr-codes="generatedQRCodes" :on-print="handlePrint" :on-close="closeQRDisplay" />
    </div>
  </div>
</template>
