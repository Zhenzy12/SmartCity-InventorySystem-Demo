<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import ConfirmationModal from "../../ConfirmationModal.vue";
import Loading from "../../Loading.vue";
import image from "../../../../src/assets/baguio-logo.png";
import { useDatabaseStore } from "../../../stores/databaseStore";
import AddTransactionItemModal from "./IncludeItemPressedModal.vue";
import { GlCloseXs } from "@kalimahapps/vue-icons";
import { MdRoundDeleteForever } from "@kalimahapps/vue-icons";
import { BxSolidUser } from "@kalimahapps/vue-icons";
import { AkTextAlignLeft } from "@kalimahapps/vue-icons";
import useUserStore from "../../../stores/user.js";
import axiosClient from "../../../axios.js";
import { ClAddPlus } from '@kalimahapps/vue-icons';
import { ClRemoveMinus } from '@kalimahapps/vue-icons';
import QRCodeDisplay from '../../QRCodeGenerator/QRCodeDisplay.vue';

const API_KEY = import.meta.env.VITE_API_KEY;

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// storing inputs
const borrowerInput = ref("");
const lenderInput = ref("");
const iscInput = ref("");
const remarksInput = ref("");
const borrowerContactInput = ref("");
const borrowerOfficeInput = ref("");

// User Store to get Lender
const userStore = useUserStore();
const loggedInUser = computed(() => userStore.user);
lenderInput.value = loggedInUser.value.id;

// FETCHING DATA
const databaseStore = useDatabaseStore();



onMounted(() => {
  databaseStore.fetchData();
});

const computedProperties = {
  transactionItems: "transactionItems",
  transactionHistory: "transactionHistory",
  officeEquipments: "officeEquipments",
  officeSupplies: "officeSupplies",
  officeList: "officeList",
  users: "users",
  borrowers: "borrowers",
  equipmentCopies: "equipmentCopies",
  categoryList: "categoryList",
};

const {
  transactionItems,
  transactionHistory,
  officeEquipments,
  officeSupplies,
  officeList,
  users,
  borrowers,
  equipmentCopies,
  categoryList,
} = Object.fromEntries(
  Object.entries(computedProperties).map(([key, value]) => [
    key,
    computed(() => databaseStore[value]),
  ])
);

const computedArrays = (source) => computed(() => Object.values(source.value));

const transactionItemsArray = computedArrays(transactionItems);
const transactionHistoryArray = computedArrays(transactionHistory);
const officeEquipmentsArray = computedArrays(officeEquipments);
const officeSuppliesArray = computedArrays(officeSupplies);
const officeListArray = computedArrays(officeList);
const usersArray = computedArrays(users);
const borrowersArray = computedArrays(borrowers);
const equipmentCopiesArray = computedArrays(equipmentCopies);
const categoryListArray = computedArrays(categoryList);

// FOR THE TOAST
import emitter from "../../../eventBus";

const isLoading = ref(false);
const isShowQR = ref(false);

const props = defineProps({
  modelValue: Boolean,
});

const showConfirmationModal = ref(false);

const modalContainer = ref(null);

const emit = defineEmits(["update:modelValue", "confirmDelete"]);

const closeModal = () => {
  emit("update:modelValue", false); // Notify parent to close modal
};

const handleClickOutside = (event) => {
  if (modalContainer.value && !modalContainer.value.contains(event.target)) {
    closeModal();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const allInventory = computed(() => {
  return [...officeEquipmentsArray.value, ...officeSuppliesArray.value]
    .filter((item) => {
      if (item.type === "Office Supply") {
        return item.supply_quantity > 0;
      } else if (item.type === "Office Equipment") {
        return equipmentCopiesArray.value.some(
          (e_copy) => e_copy.item_id === item.id && e_copy.is_available === 1
        );
      }
      return false;
    })
    .map((item, index) => ({
      ...item,
      newId: `INV-${index + 1}`,
    }));
});

// FOR SEARCH
const searchQuery = ref("");

const filteredInventory = computed(() => {
  if (!searchQuery.value) return allInventory.value;

  const searchTerm = searchQuery.value.toLowerCase();
  return allInventory.value.filter((item) => {
    const equipmentName = item.equipment_name?.toLowerCase() || "";
    const equipmentDescription =
      item.equipment_description?.toLowerCase() || "";
    const serialNumber = item.serial_number?.toString().toLowerCase() || "";
    const supplyName = item.supply_name?.toLowerCase() || "";
    const supplyDescription = item.supply_description?.toLowerCase() || "";
    const id = item.id?.toString().toLowerCase() || "";
    const newId = item.newId?.toLowerCase() || "";

    return (
      equipmentName.includes(searchTerm) ||
      equipmentDescription.includes(searchTerm) ||
      serialNumber.includes(searchTerm) ||
      supplyName.includes(searchTerm) ||
      supplyDescription.includes(searchTerm) ||
      id.includes(searchTerm) ||
      newId.includes(searchTerm)
    );
  });
});

// FOR THE ADD TRANSACTION ITEM MODAL
const isOpenAddTransactionItemModal = ref(false);
const selectedItem = ref(null);

const OpenAddTransactionItemModal = (item) => {
  selectedItem.value = item;
  if (item.type === "Office Equipment") {
    isOpenAddTransactionItemModal.value = true;
  } else {
    itemsToAdd.value = [
      {
        item_name: item.supply_name,
        item_copy_id: item.id,
        item_type: "Office Supply",
        basis_type: "Office Supply",
        basis_id: item.id,
        returned: false,
        quantity: 1,
      },
    ];
    handleConfirmAdd(itemsToAdd.value);
  }
};

const itemsToAdd = ref([]);

const selectedItems = ref([]);

// Add selected item from the modal to the overall list
const handleConfirmAdd = (items) => {
  items.forEach((item) => {
    const exists = selectedItems.value.some(
      (selected) =>
        selected.item_copy_id === item.item_copy_id &&
        selected.item_type === item.item_type
    );

    if (!exists) {
      selectedItems.value.push(item);
    }
  });
};

// Remove selected item from the overall list
const handleRemoveItem = (item) => {
  // Remove the item matching both item_copy_id and item_type
  selectedItems.value = selectedItems.value.filter(
    (selected) =>
      !(
        selected.item_copy_id === item.item_copy_id &&
        selected.item_type === item.item_type
      )
  );
};

// HANDLE OF CREATE TRANSACTION BUTTON
const handleCreateTransactionButton = () => {
  if (selectedItems.value.length) {
    showConfirmationModal.value = true;
  } else {
    // add an error if there is no selected items
    emitter.emit("show-toast", {
      message: "Please select at least one item to proceed.",
      type: "error",
    });
  }
};

// FOR THE CONFIRMATION MODAL
const formattedMessageData = computed(() => {
  if (!selectedItems.value.length) return "No items selected.";

  return selectedItems.value
    .map(
      (item, index) =>
        `\n${index + 1}. Name: ${item.item_name || "N/A"}\n   QR Codes: ${
          item.quantity || item.copy || "N/A"
        }`
    )
    .join("\n");
});

const increaseQuantity = (item) => {
  item.quantity = item.quantity || 1;
  item.quantity++;
};

const decreaseQuantity = (item) => {
  if (item.quantity && item.quantity > 1) {
    item.quantity--;
  }
};

const generateQRCode = () => {
  isShowQR.value = true;
  selectedItems.value.forEach((item) => {
    console.log("🚀 ~ generateQRCode ~ item:", item);
    if (item.basis_type === "Office Equipment") {
      const selectedItemData = databaseStore.equipmentCopies.find(
        (equipment) => equipment.id === item.item_copy_id
      );
      const selectedItemEquipmentData = databaseStore.officeEquipments.find(
        (equipment) => equipment.id === selectedItemData.item_id
      );
      for (let i = 0; i < item.quantity; i++) {
        generatedQRCodes.value.push({
          id: selectedItemEquipmentData.id || null,
          name: selectedItemEquipmentData.equipment_name || null,
          description: selectedItemEquipmentData.equipment_description || null,
          categoryId: selectedItemEquipmentData.category_id || null,
          copyNumber: selectedItemData.copy_num || null,
          serialNumber: selectedItemData.serial_number || null,
          type: "equipment",
        });
      }
    } else {
      const selectedItemData = databaseStore.officeSupplies.find(
        (supply) => supply.id === item.item_copy_id
      );
      for (let i = 0; i < item.quantity; i++) {
      generatedQRCodes.value.push({
        id: selectedItemData.id || null,
        name: selectedItemData.supply_name || null,
        description: selectedItemData.supply_description || null,
        categoryId: selectedItemData.category_id || null,
        type: "supply",
      });
    }   
    }
  });
};

const generatedQRCodes = ref([])

const closeQRDisplay = () => {
  generatedQRCodes.value = [];
  isShowQR.value = false;
}

const handlePrint = () => {
  window.print();
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50"
  >
    <!-- Loading State -->
    <Loading v-if="isLoading" />

    <div
      v-else
      ref="modalContainer"
      class="w-full h-[95vh] rounded-[20px] bg-white px-8 py-6 text-center border-4 dark:bg-gray-950 dark:border-gray-100"
    >
      <div v-if="isShowQR" class="grid grid-cols-3 gap-4 h-[90vh]">
        <!-- CLOSE BUTTON -->
        <button
          @click="closeModal()"
          class="absolute top-10 right-8 justify-end bg-gray-200 ml-4 text-gray-700 px-1 py-1 rounded-full hover:bg-gray-300 transition dark:bg-gray-300"
        >
          <GlCloseXs class="w-10 h-10" />
        </button>

        <!-- CHOOSE ITEM -->
        <div
          class="col-span-3 rounded-2xl max-h-[90vh] border-2 p-4 text-start dark:bg-black dark:border-gray-600"
        >
          <!-- LIST OF ITEMS -->
          <div
            class="w-full text-center rounded-xl px-4 py-2 mt-4 items-center justify-center max-h-[89vh] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
          <QRCodeDisplay :qr-codes="generatedQRCodes" :on-print="handlePrint" :on-close="closeQRDisplay" />
          </div>
        </div>
      </div>

      
      <div v-else class="grid grid-cols-3 w-full gap-4 h-[87vh]">
        <!-- CLOSE BUTTON -->
        <button
          @click="closeModal()"
          class="absolute top-10 right-8 justify-end bg-gray-200 ml-4 text-gray-700 px-1 py-1 rounded-full hover:bg-gray-300 transition dark:bg-gray-300"
        >
          <GlCloseXs class="w-10 h-10" />
        </button>

        <!-- CHOOSE ITEM -->
        <div
          class="col-span-2 rounded-2xl max-h-[89vh] border-2 p-4 text-start dark:bg-black dark:border-gray-600"
        >
          <p class="text-2xl font-bold pl-2 mb-2">Choose Item/s:</p>
          <!-- SEARCH BAR -->
          <div class="w-full">
            <form class="flex items-center" @submit.prevent>
              <label for="simple-search" class="sr-only">Search</label>
              <div class="relative w-full">
                <div
                  class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                >
                  <svg
                    aria-hidden="true"
                    class="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="currentColor"
                    viewbox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  id="simple-search"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Search items..."
                />
              </div>
            </form>
          </div>

          <!-- LIST OF ITEMS -->
          <div
            class="w-full rounded-xl px-4 py-2 mt-4 grid grid-cols-5 gap-4 items-center justify-center max-h-[71vh] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              v-for="item in filteredInventory"
              :key="item.newId"
              class="w-full h-full"
            >
              <button
                @click.stop="OpenAddTransactionItemModal(item)"
                class="w-full h-full cursor-pointer p-2 border rounded-lg hover:shadow-lg transition duration-300 ease-in-out dark:font-bold"
                :class="{
                  'bg-gradient-to-b bg-green-500 dark:from-green-600 dark:via-green-950 dark:to-black dark:border-green-800 text-white dark:hover:from-emerald-400 dark:hover:via-emerald-900 dark:hover:to-black ':
                    selectedItems.some(
                      (selected) =>
                        selected.basis_id === item.id &&
                        selected.basis_type === item.type
                    ),
                  'bg-gray-300 dark:bg-gray-950 dark:border-gray-600 dark:hover:bg-green-800 dark:hover:text-white dark:hover:border-green-800':
                    !selectedItems.some(
                      (selected) =>
                        selected.basis_id === item.id &&
                        selected.basis_type === item.type
                    ),
                }"
              >
                <img
                  :src="
                    item.image_path
                      ? `${VITE_API_BASE_URL}/storage/${item.image_path}`
                      : image
                  "
                  class="w-full h-28 object-cover rounded-lg"
                />
                <p class="text-center mt-2 font-medium">
                  {{ item.equipment_name || item.supply_name }}
                </p>
              </button>
            </div>
            <AddTransactionItemModal
              v-if="isOpenAddTransactionItemModal"
              v-model="isOpenAddTransactionItemModal"
              :selectedItem="selectedItem"
              :equipmentCopies="equipmentCopiesArray"
              :currentlySelectedItems="selectedItems"
              @confirmAdd="handleConfirmAdd"
              @click.stop
            />
          </div>
        </div>

        <!-- SELECTED ITEMS -->
        <div
          class="rounded-2xl max-h-[89vh] border-2 p-4 text-start dark:bg-black dark:border-gray-600"
        >
          <p class="text-2xl font-bold pl-2 mb-2">Selected Item/s:</p>
          <div
            class="border-2 h-[70vh] rounded-xl overflow-y-auto bg-gray-100 dark:bg-gray-950 dark:border-gray-600"
          >
            <table class="w-full text-center">
              <thead class="border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
                <tr>
                  <th class="py-2">Item</th>
                  <th>QR Code Qty</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in selectedItems"
                  :key="item.id"
                  class="items-center border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  <td class="py-2">{{ item.item_name }}</td>

                  <td class="flex justify-center items-center h-full py-2">
                    <button @click="decreaseQuantity(item)" class="px-2 py-1 mr-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-red-700 rounded group hover:scale-110 transition hover:cursor-pointer">
                      <ClRemoveMinus class="w-5 h-5 " />
                    </button>
                    <span class="px-2 py-1 min-w-[20px] text-center text-lg">{{ item.quantity || 1 }}</span>
                    <button @click="increaseQuantity(item)" class="px-2 py-1 ml-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-green-700 rounded group hover:scale-110 transition hover:cursor-pointer">
                      <ClAddPlus class="w-5 h-5" />
                    </button>
                  </td>

                  <td class="py-2 justify-center items-center">
                    <button>
                      <MdRoundDeleteForever
                        class="w-7 h-7 text-red-500 hover:text-red-400"
                        @click="handleRemoveItem(item)"
                      />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Action Buttons -->
          <div class="-mx-3 flex flex-wrap mt-4">
            <div class="w-1/2 px-3">
              <button
                @click="closeModal"
                class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-dark transition bg-gray-300 hover:border-red-800 hover:bg-red-800 hover:text-white dark:text-black"
              >
                Cancel
              </button>
            </div>
            <div class="w-1/2 px-3">
              <button
                @click="handleCreateTransactionButton"
                class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400"
              >
                Generate QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal
        v-model="showConfirmationModal"
        title="Confirm Generate QR Code"
        :message="`You are about to generate QR code with this items.`"
        :messageData="formattedMessageData"
        cancelText="Cancel"
        confirmText="Generate QR Codes"
        @confirm="generateQRCode()"
      />
    </div>
  </div>
</template>
