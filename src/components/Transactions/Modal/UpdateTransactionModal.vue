<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { MdDeleteForever } from "@kalimahapps/vue-icons";
import axiosClient from "../../../axios";
import { FlCheckboxChecked } from '@kalimahapps/vue-icons';
import { FlCheckboxUnchecked } from '@kalimahapps/vue-icons';
import { AkCheck } from '@kalimahapps/vue-icons';
import { RaCross2 } from '@kalimahapps/vue-icons';
import { useDatabaseStore } from "../../../stores/databaseStore";
import Loading from "../../Loading.vue";


import emitter from "../../../eventBus";
const API_KEY = import.meta.env.VITE_API_KEY;

const isLoading = ref(false);

const databaseStore = useDatabaseStore()

const props = defineProps({
  modelValue: Boolean,
  transactionName: String,
  transaction: Object,
  transactionItems: Array,
  officeEquipments: Array,
  officeSupplies: Array,
  equipmentCopies: Array,
  officeList: Array,
  categoryList: Array,
  borrowers: Array,
  users: Array
})

const transactionItems = ref([]);

const emit = defineEmits(["update:modelValue", "confirmDelete"]);

const modalContainer = ref(null);

const closeModal = () => {
  emit("update:modelValue", false);
};

const confirmUpdate = async () => {
  isLoading.value = true;
  try {
    for (const item of transactionItems.value) {
      if (item.item_type === "Equipment Copy") {
        if (item.isChecked && item.returned_date === null) {
          const availability = true;
          updateEquipment(availability, item);
          const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          const returned = true;
          updateItems(date, returned, item);
        } else if (!item.isChecked && item.returned_date !== null) {
          const availability = false;
          updateEquipment(availability, item);
          const date = null;
          const returned = false;
          updateItems(date, returned, item);
        }
      } else if (item.item_type === "Office Supply") {
        const officeSupply = props.officeSupplies?.find(
          (office_supply) => office_supply.id === item.item_copy_id
        );
        if (item.isChecked && item.returned_date === null) {
          const newQuantity = officeSupply.supply_quantity + item.quantity;
          updateOfficeSupply(newQuantity, item);

          const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          const returned = true;
          updateItems(date, returned, item);
        } else if (!item.isChecked && item.returned_date !== null) {
          const newQuantity = officeSupply.supply_quantity - item.quantity;
          updateOfficeSupply(newQuantity, item);
          const date = null;
          const returned = false;
          updateItems(date, returned, item);
        }
      }
    }
  } catch (error) {
    console.error("Error updating items:", error);
  } finally {
    const allItemsChecked = transactionItems.value.every(item => item.isChecked);

    if (allItemsChecked) {
      updateBorrowTransaction(new Date());
    } else {
      updateBorrowTransaction(null);
    }
  }
};

const updateOfficeSupply = async (newQuantity, item) => {
  try {
    const updateTransactionItems = {
      id:item.item_copy_id,
      supply_quantity: newQuantity,
    };
    databaseStore.updateOfficeSupply(updateTransactionItems);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Updated Office Supply successfully:", updateTransactionItems);
  } catch (error) {
    console.error('Error updating office supply:', error);
    console.error('Error details:', error.response?.data);
  }
}

const updateEquipment = async (availability, item) => {
  try {

    const updateTransactionItems = {
      id: item.item_copy_id,
      is_available: availability,
    };

    databaseStore.updateEquipmentCopy(updateTransactionItems);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Updated Equipment Copy successfully:", updateTransactionItems);

  } catch (error) {
    console.error('Error updating item copy:', error);
    console.error('Error details:', error.response?.data);
  }
}

const updateBorrowTransaction = async (date) => {
  try {

    const formattedDate = date instanceof Date
      ? new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+),\s/, '$3-$1-$2 ')
      : date;

    const updateTransactions = {
      id: props.transaction.id,
      return_date: formattedDate
    }

    databaseStore.updateTransactionHistory(updateTransactions);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Updated Transaction successfully:", updateTransactions);

  } catch (error) {
    console.error('Error updating transaction item:', error);
    console.error('Error details:', error.response?.data);
  } finally {
    isLoading.value = false;
    emitter.emit("show-toast", { message: "Transaction updated successfully!", type: "success" });
    closeModal();
  }
}

const updateItems = async (date, returned, item) => {
  try {
    isLoading.value = true;

    // Ensure proper date formatting
    const formattedDate = date instanceof Date
      ? new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+),\s/, '$3-$1-$2 ')
      : date;


    // Simplify the update data structure
    const updateData = {
      id: item.id,
      returned: returned,
      returned_date: formattedDate,
    };

    databaseStore.updateTransactionItem(updateData);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Updated Transaction Item successfully:", updateData);

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    emitter.emit("show-toast", { message: `Error updating transaction: ${error.response?.data?.message || error.message}`, type: "error" });
  } finally {
    isLoading.value = false
  }
};

const handleClickOutside = (event) => {
  if (modalContainer.value && !modalContainer.value.contains(event.target)) {
    closeModal();
  }
};

const selectedTransactionItems = ref([]);

onMounted(() => {
  console.log('PROPS TRANSACTION ITEMS', props.transactionItems)
  console.log('PROPS TRANSACTION ID', props.transaction.id)

  selectedTransactionItems.value = props.transactionItems
    .filter(item => props.transaction.id === item.transaction_id) // Filter only matching items
    .map(item => ({
      ...item,
      isChecked: !!item.returned_date // Convert to boolean
    }));
  console.log("🚀 ~ onMounted ~ selectedTransactionItems:", selectedTransactionItems.value)

  if (selectedTransactionItems.value.length) {
    transactionItems.value = selectedTransactionItems.value.map(item => ({
      ...item,
      isChecked: !!item.returned_date
    }));
  }

  document.addEventListener("click", handleClickOutside);;
});

console.log("transaction items: ", transactionItems)

// **Computed Properties**
const allEquipmentsChecked = computed(() =>
  transactionItems.value
    .filter(item => item.item_type === "Equipment Copy")
    .every(item => item.isChecked)
);

const allSuppliesChecked = computed(() =>
  transactionItems.value
    .filter(item => item.item_type === "Office Supply")
    .every(item => item.isChecked)
);

// **Methods**
const toggleAllEquipments = () => {
  const newCheckedState = !allEquipmentsChecked.value;
  transactionItems.value
    .filter(item => item.item_type === "Equipment Copy")
    .forEach(item => (item.isChecked = newCheckedState));
};

const toggleAllSupplies = () => {
  const newCheckedState = !allSuppliesChecked.value;
  transactionItems.value
    .filter(item => item.item_type === "Office Supply")
    .forEach(item => (item.isChecked = newCheckedState));
};

const handleCheckboxChange = (item) => {
  item.isChecked = !item.isChecked;
};

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// **Computed properties to automatically calculate counts**
const equipmentCount = computed(() =>
  transactionItems.value.filter(item => item.item_type === 'Equipment Copy').length
);

const supplyCount = computed(() =>
  transactionItems.value.filter(item => item.item_type === 'Office Supply').length
);

const formatDate = (dateString) => {
  if (!dateString) return "N/A"; // Handle null values
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

</script>

<template>
  <div v-if="modelValue"
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/60 px-4 py-5 ">
    <div v-if="isLoading" ref="modalContainer">
    <div class="flex flex-col items-center justify-center">
      <Loading />
    </div>
  </div>
    <div v-else ref="modalContainer"
      class="w-full max-w-[900px] max-h-[87vh] rounded-[20px] mt-13 bg-white px-8 py-8 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
      <h3 class="text-3xl mb-3 mt-1 font-semibold text-dark dark:text-white">
        Update Transaction
      </h3>
      <div class="dark:text-gray-200 max-h-[65vh] overflow-auto">
        <!-- FIRST ROW -->
        <div class="text-start rounded-2xl py-4 px-8 mb-3 dark:bg-gray-800">
          <p class="text-xl mb-1 font-semibold text-white">Transaction #{{ transaction.id }}</p>
          <p class="text-gray-300 mb-3">{{ formatDate(transaction.borrow_date) }}</p>
          <div class="flex flex-row text-center items-center">
            <p class="mr-2 text-lg">Status:</p>
            <p v-if="transaction.return_date"
              class="text-sm mb-1 flex flex-row bg-green-200 text-green-800 font-bold py-1 px-2 rounded-xl">
              <AkCheck class="text-lg mr-1 font-bold" />Returned
            </p>
            <p v-else class="text-sm mb-1 flex flex-row bg-red-200 text-red-800 font-bold py-1 px-2 rounded-xl">
              <RaCross2 class="text-xl mr-1 font-bold" />Items Not Yet Returned
            </p>
          </div>
          <p v-if="transaction.return_date" class="text-gray-300 mb-3 h-full">Return Date: {{
            formatDate(transaction.return_date) }}</p>

          <div v-if="transaction.remarks" class="flex flex-row text-center items-center">
            <p class="mr-2 text-lg">Remarks:</p>
            <p class="">{{ transaction.remarks }}</p>
          </div>
        </div>
        <!-- SECOND ROW -->
        <div class="text-start mb-3 rounded-2xl py-4 px-8 dark:bg-gray-800 grid grid-cols-2 dark:text-gray-300">
          <div class="">
            <p class="text-lg font-bold mb-1 dark:text-white">Borrower Information:</p>
            <p class="font-bold">{{props.borrowers.find(borrower => Number(borrower.id) ===
              Number(transaction.borrower_id))?.borrowers_name || 'Unknown First Name'}}</p>
            <p class="">{{props.borrowers.find(borrower => Number(borrower.id) ===
              Number(transaction.borrower_id))?.borrowers_contact || 'Unknown Contact'}}</p>
            <p class="">{{props.officeList.find(office => Number(office.id) ===
              (Number(props.borrowers.find(borrower => Number(borrower.id) ===
                Number(transaction.borrower_id))?.office_id)))?.office_name || 'Unknown Office'}}</p>
          </div>
          <div class="">
            <p class="text-lg font-bold mb-1 dark:text-white">Lender Information:</p>
            <p class="font-bold">
              {{props.users.find(user => Number(user.id) ===
                Number(transaction.lender_id))?.firstName || 'Unknown First Name'}}
              {{props.users.find(user => Number(user.id) ===
                Number(transaction.lender_id))?.lastName || 'Unknown Last Name'}}
            </p>
            <p class="">{{props.users.find(user => Number(user.id) ===
              Number(transaction.lender_id))?.email || 'Unknown Email'}}</p>
          </div>
        </div>
        <!-- THIRD ROW -->
        <div class="text-start rounded-2xl mb-3 py-4 px-8 dark:bg-gray-800 dark:text-gray-300">
          <p v-if="supplyCount > 0" class="text-xl font-bold mb-1 dark:text-white">Borrowed Items</p>
          <p v-if="transactionItems.length === 0"
            class="text-sm mb-1 flex flex-row bg-red-200 text-red-800 font-bold py-5 px-5 rounded-xl">
            <RaCross2 class="text-xl mr-1 font-bold" />NO ITEMS FOUND
          </p>
          <!-- OFFICE SUPPLIES -->
          <p v-if="supplyCount > 0" class="text-lg font-semibold mb-1 dark:text-white">Office Supplies:</p>
          <table v-if="supplyCount > 0" class="w-full border-2 rounded-xl border-gray-300">
            <thead>
            <tr class="border bg-gray-900">
              <th class="py-2 px-1">
                <label class="flex items-center cursor-pointer select-none text-dark dark:text-white">
                  <div class="relative">
                    <input type="checkbox" class="sr-only" :checked="allSuppliesChecked" @change="toggleAllSupplies" />
                    <span v-if="allSuppliesChecked">
                      <FlCheckboxChecked class="h-7 w-7" />
                    </span>
                    <span v-else>
                      <FlCheckboxUnchecked class="h-7 w-7" />
                    </span>
                  </div>
                </label>
              </th>
              <th class="text-start">Office Supply</th>
              <th>Quantity</th>
              <th>Serial Number</th>
            </tr>
            </thead>
            <tr v-for="item in transactionItems" :key="item.id">
              <td v-if="item.item_type === 'Office Supply'" colspan="2" class="p-1">
                <label class="items-center cursor-pointer select-none text-dark dark:text-white flex flex-row gap-10">
                  <div class="relative max-w-fit">
                    <input type="checkbox" class="sr-only" :checked="item.isChecked"
                      @change="handleCheckboxChange(item)" />
                    <div class="">
                      <span v-if="item.isChecked">
                        <FlCheckboxChecked class="h-7 w-7" />
                      </span>
                      <span v-if="!item.isChecked">
                        <FlCheckboxUnchecked class="h-7 w-7" />
                      </span>
                    </div>
                  </div>
                  <div class="text-start w-full">
                    {{officeSupplies.find(supply => Number(supply.id) ===
                      Number(item.item_copy_id))?.supply_name || 'Unknown Supply'}}
                  </div>
                </label>
              </td>
              <td v-if="item.item_type === 'Office Supply'" class="text-center">{{ item.quantity }}</td>
              <td v-if="item.item_type === 'Office Supply'" class="text-center">
                {{officeSupplies.find(supply => Number(supply.id) ===
                  Number(item.item_copy_id))?.serial_number || 'Unknown Supply'}}
              </td>
            </tr>
          </table>

          <!-- SPACER -->
          <div v-if="equipmentCount > 0 && supplyCount > 0" class="mt-3"></div>

          <!-- OFFICE EQUIPMENTS -->
          <p v-if="equipmentCount > 0" class="text-lg font-semibold mb-1 dark:text-white">Office Equipments:</p>
          <table v-if="equipmentCount > 0" class="w-full border-2 rounded-xl border-gray-300">
            <thead>
            <tr class="border bg-gray-900">
              <th class="py-2 px-1">
                <label class="flex items-center cursor-pointer select-none text-dark dark:text-white">
                  <div class="relative">
                    <input type="checkbox" class="sr-only" :checked="allEquipmentsChecked"
                      @change="toggleAllEquipments" />
                    <span v-if="allEquipmentsChecked">
                      <FlCheckboxChecked class="h-7 w-7" />
                    </span>
                    <span v-else>
                      <FlCheckboxUnchecked class="h-7 w-7" />
                    </span>
                  </div>
                </label>
              </th>
              <th class="text-start">Office Equipments</th>
              <th>Category</th>
            </tr>
            </thead>
            <tr v-for="item in transactionItems" :key="item.id">
              <td v-if="item.item_type === 'Equipment Copy'" colspan="2" class="p-1">
                <label class="items-center cursor-pointer select-none text-dark dark:text-white flex flex-row gap-10">
                  <div class="relative max-w-fit">
                    <input type="checkbox" class="sr-only" :checked="item.isChecked"
                      @change="handleCheckboxChange(item)" />
                    <div class="">
                      <span v-if="item.isChecked">
                        <FlCheckboxChecked class="h-7 w-7" />
                      </span>
                      <span v-if="!item.isChecked">
                        <FlCheckboxUnchecked class="h-7 w-7" />
                      </span>
                    </div>
                  </div>
                  <div class="text-start w-full">
                    {{officeEquipments.find(equipment => Number(equipment.id) ===
                      Number(equipmentCopies.find(equipment_copy => Number(equipment_copy.id) ===
                        Number(item.item_copy_id))?.item_id))?.equipment_name || 'Unknown Equipment'}}
                    #{{equipmentCopies.find(equipment_copy => Number(equipment_copy.id) ===
                      Number(item.item_copy_id))?.copy_num || 'Unknown Equipment'}}
                  </div>
                </label>
              </td>
              <td v-if="item.item_type === 'Equipment Copy'" class="text-center">
                {{props.categoryList.find(category => Number(category.id) === officeEquipments.find(equipment =>
                  Number(equipment.id) ===
                  Number(equipmentCopies.find(equipment_copy => Number(equipment_copy.id) ===
                    Number(item.item_copy_id))?.item_id))?.category_id)?.category_name || 'Unknown Category'}}
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div class="mt-1 -mx-3 flex flex-wrap">
        <div class="w-1/2 px-3">
          <button @click="closeModal"
            class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-dark transition bg-gray-200 hover:border-red-800 hover:bg-red-800 hover:text-white dark:text-black">
            Cancel
          </button>
        </div>
        <div class="w-1/2 px-3">
          <button @click="confirmUpdate"
            class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white">
            Mark Selected Items as Returned
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
