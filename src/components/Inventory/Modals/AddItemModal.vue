<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CaCategories, MdDeleteForever } from '@kalimahapps/vue-icons';
import axiosClient from '../../../axios';
import QRCode from 'qrcode.vue'
import { BxMessageSquareAdd } from '@kalimahapps/vue-icons';
import { IcOpenSelectHandGesture } from '@kalimahapps/vue-icons';
import { MdRoundNavigateNext } from '@kalimahapps/vue-icons';
import { AkShippingBox02 } from '@kalimahapps/vue-icons';
import { FaPenRuler } from '@kalimahapps/vue-icons';
import { BsBoxFill } from '@kalimahapps/vue-icons';
import { FlFilledTextDescription } from '@kalimahapps/vue-icons';
import { BxSolidCategoryAlt } from '@kalimahapps/vue-icons';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import { GlCloseXs } from '@kalimahapps/vue-icons';
import QRCodeDisplay from '../../QRCodeGenerator/QRCodeDisplay.vue';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import { useDatabaseStore } from '../../../stores/databaseStore';
import { AnOutlinedUserAdd } from '@kalimahapps/vue-icons';

const databaseStore = useDatabaseStore()


// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean,
  categories: Object,
})

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


// for qr logics
const showQRCodes = ref(false)
const equipmentQRCodes = ref([])

// user inputs
const selectedImage = ref(null);
const selectedOffice = ref(null)
const selectedCategory = ref(null)
const equipmentName = ref('')
const equipmentDescription = ref('')
const equipmentIcs = ref('')
const supplyIcs = ref('')
const supplyName = ref('')
const supplyDescription = ref('')
const supplyQuantity = ref('')
const equipmentQuantity = ref('')
const equipmentCopySerialNumber = ref('')

// for image
const previewImage = ref(null);
const selectedFileName = ref(null);

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  selectedImage.value = file;

  if (file) {
    previewImage.value = URL.createObjectURL(file);
    selectedFileName.value = file.name;
  } else {
    selectedFileName.value = null;
  }
};

watch(selectedImage, (newVal) => {
  if (!newVal) {
    selectedFileName.value = null;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  // Clean up the object URL
  if (previewImage.value) {
    URL.revokeObjectURL(previewImage.value);
  }
});

const errors = ref({
  selectedOffice: [],
  selectedCategory: [],
  equipmentName: [],
  equipmentDescription: [],
  supplyName: [],
  supplyDescription: [],
  supplyQuantity: [],
  equipmentQuantity: [],
  equipmentIcs: [],
  supplyIcs: [],
  equipmentCopySerialNumber: [],
})

// watch effect for validation
watch(() => equipmentCopySerialNumber.value, (newValue) => {
  if (!newValue) {
    errors.value.equipmentCopySerialNumber = ["Serial Number is required"];
  } else {
    errors.value.equipmentCopySerialNumber = [];
  }
});


watch(() => selectedOffice.value, (newValue) => {
  if (!newValue) {
    errors.value.selectedOffice = ["Office is required"];
  } else {
    errors.value.selectedOffice = [];
  }
});

watch(() => selectedCategory.value, (newValue) => {
  if (!newValue) {
    errors.value.selectedCategory = ["Category is required"];
  } else {
    errors.value.selectedCategory = [];
  }
});

watch(() => equipmentName.value, (newValue) => {
  if (!newValue) {
    errors.value.equipmentName = ["Equipment name is required"];
  } else {
    errors.value.equipmentName = [];
  }
});

watch(() => equipmentDescription.value, (newValue) => {
  if (!newValue) {
    errors.value.equipmentDescription = ["Equipment description is required"];
  } else {
    errors.value.equipmentDescription = [];
  }
});

watch(() => supplyName.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyName = ["Supply name is required"];
  } else {
    errors.value.supplyName = [];
  }
});

watch(() => supplyDescription.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyDescription = ["Supply description is required"];
  } else {
    errors.value.supplyDescription = [];
  }
});

watch(() => supplyQuantity.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyQuantity = ["Supply quantity is required"];
  } else {
    errors.value.supplyQuantity = [];
  }
});

watch(() => equipmentQuantity.value, (newValue) => {
  if (!newValue) {
    errors.value.equipmentQuantity = ["Equipment Quantity is required"];
  } else {
    errors.value.equipmentQuantity = [];
  }
});

watch(() => equipmentIcs.value, (newValue) => {
  if (!newValue) {
    errors.value.equipmentIcs = ["Equipment ICS/ARE is required"];
  } else {
    errors.value.equipmentIcs = [];
  }
});

watch(() => supplyIcs.value, (newValue) => {
  if (!newValue) {
    errors.value.supplyIcs = ["Supply ICS/ARE is required"];
  } else {
    errors.value.supplyIcs = [];
  }
});

const validateEquipmentForm = () => {
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = [];
  });

  let hasErrors = false;

  if (!equipmentCopySerialNumber.value) {
    errors.value.equipmentCopySerialNumber = ["Serial Number is required"];
    hasErrors = true;
  }

  if (!selectedOffice.value) {
    errors.value.selectedOffice = ["Office is required"];
    hasErrors = true;
  }

  if (!selectedCategory.value) {
    errors.value.selectedCategory = ["Category is required"];
    hasErrors = true;
  }

  if (!equipmentName.value) {
    errors.value.equipmentName = ["Equipment name is required"];
    hasErrors = true;
  }

  if (!equipmentDescription.value) {
    errors.value.equipmentDescription = ["Equipment description is required"];
    hasErrors = true;
  }

  if (!equipmentQuantity.value) {
    errors.value.equipmentQuantity = ["Equipment quantity is required"];
    hasErrors = true;
  }

  if (!equipmentIcs.value) {
    errors.value.equipmentIcs = ["Equipment ICS/ARE is required"];
    hasErrors = true;
  }

  return !hasErrors;
}

const validateSupplyForm = () => {
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = [];
  });

  let hasErrors = false;

  if (!selectedOffice.value) {
    errors.value.selectedOffice = ["Office is required"];
    hasErrors = true;
  }

  if (!selectedCategory.value) {
    errors.value.selectedCategory = ["Category is required"];
    hasErrors = true;
  }

  if (!supplyName.value) {
    errors.value.supplyName = ["Supply name is required"];
    hasErrors = true;
  }

  if (!supplyDescription.value) {
    errors.value.supplyDescription = ["Supply description is required"];
    hasErrors = true;
  }

  if (!supplyQuantity.value) {
    errors.value.supplyQuantity = ["Supply quantity is required"];
    hasErrors = true;
  }

  if (!supplyIcs.value) {
    errors.value.supplyIcs = ["Supply ICS/ARE is required"];
    hasErrors = true;
  }

  return !hasErrors;
}

const isClickedShowEquipmentConfirmationModal = () => {
  if (!validateEquipmentForm()) {
    return;
  } else {
    showEquipmentConfirmationModal.value = true
  }
}

const isClickShowSupplyConfirmationModal = () => {
  if (!validateSupplyForm()) {
    return;
  } else {
    showSupplyConfirmationModal.value = true
  }
}

const addEquipmentCopies = async (equipmentId) => {
  try {
    const quantity = parseInt(equipmentQuantity.value);
    for (let i = 1; i <= quantity; i++) {
      const copyData = {
        item_id: equipmentId,
        is_available: true,
        copy_num: i,
        serial_number: equipmentCopySerialNumber.value
      };

      console.log("🚀 ~ addEquipmentCopies ~ copyData:", copyData)

      databaseStore.addEquipmentCopy(copyData);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Equipment copy added successfully:", copyData);
    }
  } catch (error) {
    console.error('Error adding equipment copies:', error);
    throw error;
  }
}


const confirmAddItem = async () => {
  try {

    console.log("🚀 ~ ADDING ITEM ~ isLoading:", isLoading)
    isLoading.value = true;

    if (selectedOffice.value === 1) {
      try {
        const maxId = databaseStore.officeEquipments.length
          ? Math.max(...databaseStore.officeEquipments.map(e => e.id))
          : 0;
        const equipmentId = maxId + 1;

        const newEquipment = {
          id: equipmentId,
          equipment_name: equipmentName.value,
          equipment_description: equipmentDescription.value,
          category_id: selectedCategory.value,
          isc: equipmentIcs.value,
          image: selectedImage.value || null,
        };

        databaseStore.addOfficeEquipment(newEquipment);

        await addEquipmentCopies(equipmentId);

        equipmentQRCodes.value = Array.from({ length: parseInt(equipmentQuantity.value) }, (_, index) => ({
          id: equipmentId,
          copyNumber: index + 1,
          name: equipmentName.value,
          description: equipmentDescription.value,
          categoryId: selectedCategory.value,
          serialNumber: equipmentCopySerialNumber.value,
          type: 'equipment'
        }));

        showQRCodes.value = true;
        console.log('Equipment added to store:', newEquipment);
        selectedBreadCrumbPhase.value = 3;
      } catch (error) {
        console.error('Error adding equipment:', error);
        emitter.emit("show-toast", { message: "Error adding equipment. Please try again.", type: "error" });
        selectedBreadCrumbPhase.value = 2;
        isLoading.value = false;
      } finally {
        isLoading.value = false;
        emitter.emit("show-toast", { message: "Equipment Added Successfully!", type: "success" });
      }
    } else if (selectedOffice.value === 2) {
      try {
        // Generate a unique ID for the new supply
        const maxId = databaseStore.officeSupplies.length
          ? Math.max(...databaseStore.officeSupplies.map(s => s.id))
          : 0;
        const supplyId = maxId + 1;

        // Build the supply object
        const newSupply = {
          id: supplyId,
          supply_name: supplyName.value,
          supply_description: supplyDescription.value,
          category_id: selectedCategory.value,
          supply_quantity: supplyQuantity.value,
          isc: supplyIcs.value,
          image: selectedImage.value || null,
        };

        // Add the supply to the store
        databaseStore.addOfficeSupply(newSupply);

        // Generate QR codes for supplies
        equipmentQRCodes.value = [{
          id: supplyId,
          name: supplyName.value,
          type: 'supply'
        }];

        showQRCodes.value = true;

        console.log('Supply added to store:', newSupply);
        selectedBreadCrumbPhase.value = 3;
      } catch (error) {
        console.error('Error adding supply:', error);
        emitter.emit("show-toast", { message: "Error adding supply. Please try again.", type: "error" });
        selectedBreadCrumbPhase.value = 2;
        isLoading.value = false;
      } finally {
        isLoading.value = false;
        emitter.emit("show-toast", { message: "Supply Added Successfully!", type: "success" });
      }
    }
  } catch (error) {
    console.error('Error adding item:', error);
    console.error('Error details:', error.response?.data);
  }
}

const handlePrint = () => {
  window.print();
}

const closeQRDisplay = () => {
  showQRCodes.value = false;
  closeModal();
}

// FOR BREADCRUMB
const selectedBreadCrumbPhase = ref(1);
const selectedBreadCrumbCategory = ref(null);

const changeSelectedBreadCrumbCategory = (category, phase, office) => {
  console.log("🚀 ~ changeSelectedBreadCrumbCategory ~ changeSelectedBreadCrumbCategory:", changeSelectedBreadCrumbCategory)
  selectedBreadCrumbCategory.value = category;
  selectedBreadCrumbPhase.value = phase;
  selectedOffice.value = office;
}

const showEquipmentConfirmationModal = ref(false)

const confirmEquipmentAction = (confirmed) => {
  if (confirmed) {
    confirmAddItem()
  }
}

const showSupplyConfirmationModal = ref(false)

const confirmSupplyAction = (confirmed) => {
  if (confirmed) {
    confirmAddItem()
  }
}
</script>

<template>
  <div v-if="modelValue"
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center px-4 py-5 z-50 bg-black/70">
    <Loading v-if="isLoading" />
    <div v-else ref="modalContainer"
      class="w-full lg:max-w-[1100px] 2xl:max-w-[1200px] 3xl:max-w-[1350px] h-[90vh] rounded-[20px] bg-white p-4 text-center border border-3 dark:border-gray-300 dark:bg-gray-950">
      <div class="flex flex-row">
        <!-- Breadcrumb -->
        <nav
          class="flex px-5 py-1 w-[95%] text-gray-700 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
          aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li class="inline-flex items-center">
              <button @click="changeSelectedBreadCrumbCategory(null, 1, null)"
                class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                <IcOpenSelectHandGesture class="w-5 h-5 ml-1 mr-2" />
                Select Category
              </button>
            </li>
            <li v-if="selectedBreadCrumbPhase > 1">
              <div class="flex items-center">
                <MdRoundNavigateNext class="w-7 h-7 ml-1 text-gray-400" />
                <button v-if="selectedBreadCrumbCategory === 'equipment'"
                  @click="changeSelectedBreadCrumbCategory('equipment', 2, 1)"
                  class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white">
                  Office Equipment Details
                </button>
                <button v-if="selectedBreadCrumbCategory === 'supply'"
                  @click="changeSelectedBreadCrumbCategory('supply', 2, 2)"
                  class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white">
                  Office Supply Details
                </button>
              </div>
            </li>
            <li aria-current="page" v-if="selectedBreadCrumbPhase > 2">
              <div class="flex items-center">
                <MdRoundNavigateNext class="w-7 h-7 ml-1 text-gray-400" />
                <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">Print QR Code</span>
              </div>
            </li>
          </ol>
        </nav>

        <!-- CLOSE BUTTON -->
        <button @click="closeModal()"
          class="justify-end bg-gray-200 ml-4 text-gray-700 px-1 py-1 rounded-full hover:bg-gray-300 transition">
          <GlCloseXs class="w-8 h-8" />
        </button>
      </div>
      <!-- PHASES -->
      <div>
        <!-- PHASE 1 -->
        <div v-if="selectedBreadCrumbPhase === 1" class="flex flex-col items-center mt-15">
          <p class="text-3xl mb-4">Create a New Item</p>
          <p class="mb-8">Choose the type of item that you want to create</p>
          <div class="grid grid-cols-2 gap-5 sm:gap-10 md:gap-20 item-center justify-center">
            <div class="">
              <button @click="changeSelectedBreadCrumbCategory('equipment', 2, 1)"
                class="p-4 border border-dashed border-2 rounded-3xl w-65 sm:w-75 md:w-80 h-80 justify-center dark:border-gray-300 dark:hover:bg-black dark:hover:border-solid dark:hover:border-blue-500 dark:hover:text-blue-200">
                <AkShippingBox02 class="mb-3 w-23 h-23 w-full items-center justify-center" />
                <p class="font-bold text-xl mb-3">Office Equipment</p>
                <p class="text-sm">Track fixed assets like printers and chairs</p>
              </button>
            </div>
            <div>
              <button @click="changeSelectedBreadCrumbCategory('supply', 2, 2)"
                class="border border-dashed border-2 rounded-3xl w-65 sm:w-75 md:w-80 h-80 justify-center dark:border-gray-300 dark:hover:bg-black dark:hover:border-solid dark:hover:border-blue-500 dark:hover:text-blue-200">
                <FaPenRuler class="mb-5 w-20 h-20 w-full items-center justify-center" />
                <p class="font-bold text-xl mb-3">Office Supply</p>
                <p class="text-sm">Manage consumables like paper and pens.</p>
              </button>
            </div>
          </div>
        </div>
        <!-- PHASE 2 -->
        <div v-if="selectedBreadCrumbPhase === 2">
          <!-- FOR EQUIPMENT -->
          <div v-if="selectedBreadCrumbCategory === 'equipment'">
            <div class="text-start">
              <p class="text-3xl mb-8 text-center mt-8">Input Equipment Details</p>
              <div className="grid grid-cols-2 grid-rows-1 gap-12 w-full">
                <div>
                  <!-- EQUIPMENT IMAGE -->
                  <div class="flex flex-col mt-4 mb-2">
                    <div class="mb-1 relative group cursor-pointer">
                      <!-- Single file input - keep this one -->
                      <input type="file" @change="handleImageUpload" class="hidden" id="imageUpload" accept="image/*">
                      <label for="imageUpload" class="cursor-pointer">
                        <!-- Image preview elements -->
                        <img v-if="previewImage" :src="previewImage"
                          class="w-full h-[500px] object-cover rounded-lg mb-2 transition-all duration-300 group-hover:opacity-75"
                          alt="Preview Image" />
                        <img v-else-if="currentImagePath && !selectedImage"
                          :src="`${API_BASE_URL}/storage/${currentImagePath}`"
                          class="w-full h-100 object-cover rounded-lg mb-2 transition-all duration-300 group-hover:opacity-75"
                          alt="Current Image" />

                        <div
                          class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span class="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">Update Image</span>
                        </div>
                      </label>
                    </div>
                    <div class="relative ml-2 mt-4">
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
                  <!-- EQUIPMENT NAME -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Equipment Name:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.equipmentName ? errors.equipmentName[0]
                      : ''
                    }}</p>
                  </div>
                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <BsBoxFill />
                    </div>
                    <input type="text" v-model="equipmentName"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ex. Printer, Chair, Stairs">

                  </div>
                  <!-- EQUIPMENT DESCRIPTION -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block text font-medium text-gray-900 dark:text-gray-200">Equipment
                      Description:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.equipmentDescription ?
                      errors.equipmentDescription[0] : '' }}</p>
                  </div>
                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <FlFilledTextDescription />
                    </div>
                    <textarea type="text" v-model="equipmentDescription"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ex. Printer, Chair, Stairs"></textarea>

                  </div>

                  <!-- ICS/ARE -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">ICS/ARE: </label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.equipmentIcs ? errors.equipmentIcs[0] :
                      ''
                    }}</p>
                  </div>
                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <AnOutlinedUserAdd />
                    </div>
                    <input type="text" v-model="equipmentIcs"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ex. John Doe">
                  </div>

                  <!-- SERIAL NUMBER -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Serial Number: </label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.equipmentCopySerialNumber ?
                      errors.equipmentCopySerialNumber[0] : ''
                    }}</p>
                  </div>
                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <BsBoxFill />
                    </div>
                    <input type="text" v-model="equipmentCopySerialNumber"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ex. QWER1234">
                  </div>

                  <!-- EQUIPMENT CATEGORY -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block text font-medium text-gray-900 dark:text-gray-200">Equipment
                      Category:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.selectedCategory ?
                      errors.selectedCategory[0] : '' }}</p>
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
                  <!-- EQUIPMENT QUANTITY -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block text font-medium text-gray-900 dark:text-gray-200">Equipment
                      Quantity:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.equipmentQuantity ?
                      errors.equipmentQuantity[0] : '' }}</p>
                  </div>

                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <AnOutlinedNumber />
                    </div>
                    <input type="number" v-model="equipmentQuantity"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- FOR SUPPLY -->
          <div v-if="selectedBreadCrumbCategory === 'supply'">
            <div class="text-start">
              <p class="text-3xl mb-8 text-center mt-8">Input Supply Details</p>
              <div class="grid grid-cols-2 grid-rows-1 gap-12 w-full">
                <div>
                  <!-- SUPPLY IMAGE -->
                  <div class="flex flex-col mt-4 mb-2">
                    <div class="mb-1 relative group cursor-pointer">
                      <!-- Single file input - keep this one -->
                      <input type="file" @change="handleImageUpload" class="hidden" id="imageUpload" accept="image/*">
                      <label for="imageUpload" class="cursor-pointer">
                        <!-- Image preview elements -->
                        <img v-if="previewImage" :src="previewImage"
                          class="w-full h-[400px] object-cover rounded-lg mb-2 transition-all duration-300 group-hover:opacity-75"
                          alt="Preview Image" />
                        <img v-else-if="currentImagePath && !selectedImage"
                          :src="`${API_BASE_URL}/storage/${currentImagePath}`"
                          class="w-full h-100 object-cover rounded-lg mb-2 transition-all duration-300 group-hover:opacity-75"
                          alt="Current Image" />

                        <div
                          class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span class="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">Update Image</span>
                        </div>
                      </label>
                    </div>
                    <div class="relative ml-2 mt-4">
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
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Supply Name:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.supplyName ? errors.supplyName[0] : ''
                    }}
                    </p>
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
                      errors.supplyDescription[0] : '' }}</p>
                  </div>
                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <FlFilledTextDescription />
                    </div>
                    <textarea type="text" v-model="supplyDescription"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ex. Printer, Chair, Stairs"></textarea>
                  </div>
                  <!-- ICS/ARE -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">ICS/ARE: </label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.supplyIcs ? errors.supplyIcs[0] : '' }}
                    </p>
                  </div>
                  <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <AnOutlinedUserAdd />
                    </div>
                    <input type="text" v-model="supplyIcs"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Ex. John Doe">
                  </div>
                  <!-- SUPPLY CATEGORY -->
                  <div class="flex flex-row mt-4 mb-2">
                    <label class="block text font-medium text-gray-900 dark:text-gray-200">Supply Category:</label>
                    <p class="text-red-700 ml-2 font-semibold italic"> {{ errors.selectedCategory ?
                      errors.selectedCategory[0] : '' }}</p>
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
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.supplyQuantity ?
                      errors.supplyQuantity[0] :
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
          </div>


          <div class="flex flex-wrap ml-1 px-5 sm:px-20 md:px-45 lg:px-55 xl:px-60 2xl:px-70  mt-6">
            <div class="w-full pl-1">
              <button v-if="selectedBreadCrumbCategory === 'equipment'"
                @click="isClickedShowEquipmentConfirmationModal()"
                class="mt-3 block w-full rounded-md border p-2 text-center text-base font-medium text-white transition bg-emerald-700  border-emerald-600 hover:border-emerald-500 hover:bg-emerald-600 hover:text-white dark:text-white">
                Add Equipment
              </button>
              <button v-if="selectedBreadCrumbCategory === 'supply'" @click="isClickShowSupplyConfirmationModal()"
                class="block w-full rounded-md border p-2 text-center text-base font-medium text-white transition bg-emerald-700  border-emerald-600 hover:border-emerald-500 hover:bg-emerald-600 hover:text-white dark:text-white mt-4">
                Add Supply
              </button>
            </div>
          </div>
        </div>

        <div v-if="selectedBreadCrumbPhase === 3" class="mt-8">
          <QRCodeDisplay :qr-codes="equipmentQRCodes" :on-print="handlePrint" :on-close="closeQRDisplay" />
        </div>
      </div>

      <!-- QR Codes Section -->
      <div v-if="showQRCodes" class="mt-4">
      </div>
    </div>

    <!-- EQUIPMENT Confirmation Modal -->
    <ConfirmationModal v-model="showEquipmentConfirmationModal" title="Confirm Addition"
      :message="`You are about to add this Equipment.`"
      :messageData="`\nEquipment Name: ${equipmentName}\nDescription: ${equipmentDescription}\nCategory: ${categories.find(category => category.id === selectedCategory)?.category_name || 'Unknown Category'}\nCop${equipmentQuantity === 1 ? 'y' : 'ies'}: ${equipmentQuantity}`"
      cancelText="Cancel" confirmText="Confirm Adding" @confirm="confirmEquipmentAction" />

    <!-- SUPPLY Confirmation Modal -->
    <ConfirmationModal v-model="showSupplyConfirmationModal" title="Confirm Addition"
      :message="`You are about to add this Supply.`"
      :messageData="`\nSupply Name: ${supplyName}\nDescription: ${supplyDescription}\nCategory: ${categories.find(category => category.id === selectedCategory)?.category_name || 'Unknown Category'}\nQuantity: ${supplyQuantity}`"
      cancelText="Cancel" confirmText="Confirm Adding" @confirm="confirmSupplyAction" />
  </div>
</template>
