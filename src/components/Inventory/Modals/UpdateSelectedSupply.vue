<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import axiosClient from '../../../axios';
import QRCodeDisplay from '../../QRCodeGenerator/QRCodeDisplay.vue';
import { BsBoxFill } from '@kalimahapps/vue-icons';
import { FlFilledTextDescription } from '@kalimahapps/vue-icons';
import { BxSolidCategoryAlt } from '@kalimahapps/vue-icons';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import Loading from '../../Loading.vue';
import ConfirmationModal from '../../ConfirmationModal.vue';
import { useDatabaseStore } from '../../../stores/databaseStore';

const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isLoading = ref(false)

const showQRCodes = ref(false)
const generatedQRCodes = ref([])

const props = defineProps({
  modelValue: Boolean,
  selectedItems: Object,
  categories: Object,
})

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

// previous image
const currentImagePath = ref('');

const supplyName = ref('')
const supplyDescription = ref('')
const selectedCategory = ref(null)
const ics = ref('')
const supplyQuantity = ref('')
const selectedImage = ref(null);
const previewImage = ref(null);
const selectedFileName = ref(null)

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  selectedImage.value = file

  if (file) {
    previewImage.value = URL.createObjectURL(file)
    selectedFileName.value = file.name
  } else {
    selectedFileName.value = null
  }
}

// Add watcher to clear name when removing image
watch(selectedImage, (newVal) => {
  if (!newVal) {
    selectedFileName.value = null
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  // Clean up the object URL
  if (previewImage.value) {
    URL.revokeObjectURL(previewImage.value);
  }
});

// Add this watch effect
watch(() => props.selectedItems, (items) => {
  if (items) {
    supplyName.value = items.supply_name
    supplyDescription.value = items.supply_description
    ics.value = items.isc
    selectedCategory.value = items.category_id
    supplyQuantity.value = items.supply_quantity
    currentImagePath.value = items.image_path
  }
}, { immediate: true })

const confirmUpdateSupply = async () => {
  try {
    isLoading.value = true;

    const formData = new FormData();
    formData.append("supply_name", supplyName.value);
    formData.append("supply_description", supplyDescription.value);
    formData.append("category_id", selectedCategory.value);
    formData.append("supply_quantity", supplyQuantity.value);
    formData.append("isc", ics.value)

    if (selectedImage.value) {
      formData.append("image", selectedImage.value);
    }

    formData.append("_method", "PUT");

    console.log("Update supply data sent: ", formData)

    const response = await axiosClient.post(
      `/api/office_supplies/${props.selectedItems.id}`,
      formData,
      {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    // Generate QR codes with updated values
    generatedQRCodes.value = [{
      id: props.selectedItems.id,
      name: supplyName.value,
      description: supplyDescription.value,
      categoryId: selectedCategory.value,
      type: 'supply'
    }];

    showQRCodes.value = true;
    console.log('Update Supplies API response:', response);
    // emitter.emit("show-toast", { message: "Supply updated successfully!", type: "success" });
    // closeModal()
  } catch (error) {
    console.error('Error updating supplies:', error);
    console.error('Error details:', error.response?.data);
    emitter.emit("show-toast", { message: "Error updating supplies. Please try again.", type: "error" });
  } finally {
    await databaseStore.fetchData();
    isLoading.value = false;
    emitter.emit("show-toast", { message: "Supply Updated successfully!", type: "success" });
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
  supplyName: [],
  supplyDescription: [],
  selectedCategory: [],
  supplyQuantity: [],
  selectedImage: [],
  ics: [],
})

const validateForm = () => {
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = [];
  });

  let hasErrors = false;

  if (!supplyName.value) {
    errors.value.supplyName = ["Supply Name is required"];
    hasErrors = true;
  }

  if (!ics.value) {
    errors.value.ics = ["ISC/ARE is required"];
    hasErrors = true;
  }

  if (!supplyDescription.value) {
    errors.value.supplyDescription = ["Supply Description is required"];
    hasErrors = true;
  }

  if (!selectedCategory.value) {
    errors.value.selectedCategory = ["Category is required"];
    hasErrors = true;
  }

  if (!supplyQuantity.value) {
    errors.value.supplyQuantity = ["Supply Quantity is required"];
    hasErrors = true;
  }

  return !hasErrors;
}

watch(() => supplyName.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyName = ["Supply Name is required"];
  } else {
    errors.value.supplyName = [];
  }
});

watch(() => supplyDescription.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyDescription = ["Supply Description is required"];
  } else {
    errors.value.supplyDescription = [];
  }
});

watch(() => selectedCategory.value, (newValue) => {
  if (!newValue) {
    errors.value.selectedCategory = ["Category is required"];
  } else {
    errors.value.selectedCategory = [];
  }
});

watch(() => supplyQuantity.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyQuantity = ["Supply Quantity is required"];
  } else {
    errors.value.supplyQuantity = [];
  }
});

watch(() => ics.value, (newValue) => {
  if (!newValue) {
    errors.value.ics = ["ISC/ARE is required"];
  } else {
    errors.value.ics = [];
  }
});

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
  if (confirmed) {
    confirmUpdateSupply()
  }
}

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
    class="fixed left-0 top-0 z-20 flex h-full w-full items-center justify-center bg-black/70 px-4 py-5">
    <Loading v-if="isLoading" />
    <div v-if="!showQRCodes && !isLoading" ref="modalContainer"
      class="w-full max-w-[650px] rounded-[20px] bg-white px-8 py-8 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
      <h3 class="text-3xl font-semibold mb-4">
        Update Supply
      </h3>
      <div class="flex flex-col text-start">
        <div class="grid grid-cols-2 grid-rows-1 gap-12 w-full">
          <div>
            <!-- IMAGE UPLOAD -->
            <div class="flex flex-col mb-2">
              <div class="mb-1 relative group cursor-pointer">
                <!-- Single file input - keep this one -->
                <input type="file" @change="handleImageUpload" class="hidden" id="imageUpload" accept="image/*">
                <label for="imageUpload" class="cursor-pointer">
                  <!-- Image preview elements -->
                  <img v-if="previewImage" :src="previewImage"
                    class="w-100 h-60 object-cover rounded-lg mb-2 transition-all duration-300 group-hover:opacity-75"
                    alt="Preview Image" />
                  <img v-else-if="currentImagePath && !selectedImage"
                    :src="`${API_BASE_URL}/storage/${currentImagePath}`"
                    class="w-100 h-60 object-cover rounded-lg mb-2 transition-all duration-300 group-hover:opacity-75"
                    alt="Current Image" />

                  <div
                    class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">Update Image</span>
                  </div>
                </label>
              </div>
              <div class="relative ml-2">
                <input type="file" @change="handleImageUpload" accept="image/*" class="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:text-sm file:font-semibold
        file:bg-gray-800 file:text-white
        hover:file:bg-gray-700
        dark:file:bg-gray-600 dark:file:hover:bg-gray-500
        file:cursor-pointer">
              </div>
            </div>
          </div>
          <div>
            <!-- SUPPLY NAME -->
            <div class="flex flex-row">
              <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply Name:</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.supplyName ? errors.supplyName[0] :
                '' }}</p>
            </div>

            <div class="relative ml-2">
              <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <BsBoxFill />
              </div>
              <input type="text" v-model="supplyName"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Ex. Printer, Chair, Stairs">
            </div>
            <!-- SUPPLY DESCRIPTION -->
            <div class="flex flex-row mt-4 mb-2">
              <label class="block text font-medium text-gray-900 dark:text-gray-200">Supply
                Description:</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.supplyDescription ?
                errors.supplyDescription[0] :
                '' }}</p>
            </div>

            <div class="relative ml-2">
              <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <FlFilledTextDescription />
              </div>
              <textarea type="text" v-model="supplyDescription"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Ex. Printer, Chair, Stairs"></textarea>
            </div>
            <!-- ISC/ARE -->
            <div class="flex flex-row">
              <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">ISC/ARE:</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.ics ? errors.ics[0] :
                '' }}</p>
            </div>

            <div class="relative ml-2">
              <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <BsBoxFill />
              </div>
              <input type="text" v-model="ics"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Ex. John Doe">
            </div>
            <!-- SUPPLY CATEGORY -->
            <div class="flex flex-row mt-4 mb-2">
              <label class="block text font-medium text-gray-900 dark:text-gray-200">Supply Category:</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.selectedCategory ? errors.selectedCategory[0]
                :
                '' }}</p>
            </div>


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
            <!-- SUPPLY QUANTITY -->
            <div class="flex flex-row mt-4 mb-2">
              <label class="block text font-medium text-gray-900 dark:text-gray-200">Supply Quantity:</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.supplyQuantity ? errors.supplyQuantity[0] :
                '' }}</p>
            </div>

            <div class="relative ml-2">
              <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <AnOutlinedNumber />
              </div>
              <input type="number" v-model="supplyQuantity"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            </div>
          </div>
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
          <button @click="isClickedShowConfirmationModal()"
            class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
            Update
          </button>
        </div>
      </div>
    </div>
    <!-- QR CODE DISPLAY -->
    <div v-if="showQRCodes && !isLoading"
      class="w-full max-w-[1000px] bg-white rounded-[20px] p-8 dark:bg-gray-950 border border-4 dark:border-white">
      <QRCodeDisplay :qr-codes="generatedQRCodes" :on-print="handlePrint" :on-close="closeQRDisplay" />
    </div>
    <!-- CONFIRMATION MODAL -->
    <ConfirmationModal v-model="showConfirmationModal" title="Confirm Update"
      :message="`You are about to update this supply with the updated information:`"
      :messageData="`\nName: ${supplyName}\nDescription: ${supplyDescription} \nISC/ARE: ${ics} \nCategory: ${categories.find(category => category.id === selectedCategory)?.category_name || 'Unknown'}\nQuantity: ${supplyQuantity}`"
      cancelText="Cancel" confirmText="Confirm Update" @confirm="confirmAction" />
  </div>
</template>
