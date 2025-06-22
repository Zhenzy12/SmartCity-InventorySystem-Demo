<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { MdDeleteForever } from '@kalimahapps/vue-icons';
import axiosClient from '../../../axios';
import { useDatabaseStore } from '../../../stores/databaseStore';
import Loading from '../../Loading.vue';

const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;


const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean, // v-model binding for modal open state
  transactionName: String, // Pass the transaction name
  transaction: Object,
  officeSupplies: Object,
  transactionItems: Array,
  borrowers: Array,
})
console.log("Transaction Items", props.transactionItems)

console.log("Office Supplies", props.officeSupplies)

const updateItemAvailability = async () => {
  try {
    for (const item of props.transactionItems) {
      if (item.item_type === "Equipment Copy" && item.transaction_id === props.transaction.id) {
        const updateTransactionItems = {
          is_available: true,
        };

        const response = await axiosClient.put(
          `/api/equipment_copies/${item.item_copy_id}`,
          updateTransactionItems,
          {
            headers: {
              "x-api-key": API_KEY,
            },
          }
        );

        console.log("Updated Equipment Copy successfully:", response.data);
      } else if (item.item_type === "Office Supply" && item.transaction_id === props.transaction.id) {
        const officeSupply = props.officeSupplies?.find(
          (office_supply) => office_supply.id === item.item_copy_id
        );
        const newQuantity = officeSupply.supply_quantity + item.quantity

        const updateTransactionItems = {
          supply_quantity: newQuantity,
        };

        const response = await axiosClient.put(
          `/api/office_supplies/${item.item_copy_id}`,
          updateTransactionItems,
          {
            headers: {
              "x-api-key": API_KEY,
            },
          }
        );
        console.log("Updated Office Supply successfully:", response.data);
      }
    }
  } catch (error) {
    console.error("Error updating items:", error);
  } finally {
    await databaseStore.fetchData();
    isLoading.value = false;
    emitter.emit("show-toast", { message: "Transaction deleted successfully!", type: "success" });
    closeModal();
  }
};


const emit = defineEmits(['update:modelValue', 'confirmDelete'])

const modalContainer = ref(null)

const closeModal = () => {
  emit('update:modelValue', false) // Notify parent to close modal
}

const confirmDelete = async () => {
  try {
    isLoading.value = true;

    const updateData = {
      borrow_date: props.transaction.borrow_date,
      return_date: props.transaction.return_date,
      lender_id: props.transaction.lender_id,
      borrowers_id: props.borrowers.id,
      remarks: props.transaction.remarks,
      is_deleted: true,
    };

    const response = await axiosClient.put(
      `/api/borrow_transactions/${props.transaction.id}`,
      updateData,
      {
        headers: {
          "x-api-key": API_KEY,
        },
      }
    );

    if (response.data.success) {
      emit('confirmDelete', response.data.data)
      closeModal()
      emitter.emit("show-toast", { message: "Transaction deleted successfully!", type: "success" });
    }
  } catch (error) {
    console.error('Error deleting transaction:', error)
    emitter.emit("show-toast", { message: "Error deleting transaction. Please try again.", type: "error" });
  } finally {
    updateItemAvailability()
    isLoading.value = false
  }
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


</script>

<template>
  <div v-if="modelValue" class="fixed left-0 top-0 flex h-full w-full items-center justify-center c px-4 py-5">
  <div v-if="isLoading" ref="modalContainer">
    <div class="flex flex-col items-center justify-center">
        <Loading />
      </div>
  </div>

    <div v-else ref="modalContainer"
      class="w-full max-w-[570px] rounded-[20px] bg-white px-8 py-8 text-center dark:bg-dark-2 border dark:bg-gray-700">
      
      
        <div class="flex justify-center text-center">
          <span class="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
            <MdDeleteForever class="text-4xl text-red-600 " />
          </span>
        </div>

        <h3 class="text-3xl mb-5 mt-1 font-semibold text-dark dark:text-white">
          Delete Transaction
        </h3>
        <p class="text-base mb-2 leading-relaxed text-body-color dark:text-dark-6">
          Are you sure you want to delete this Transaction?
        </p>
        <div class="grid grid-cols-2 mb-5 text-md pl-25 pr-15">
          <div class="grid-cols-1 text-start mr-2 font-bold">
            <p> Borrower: </p>
            <p> Borrow Date:</p>
            <p> Lender: </p>
          </div>
          <div class="grid-cols-1 text-start">
            <p> {{ transaction.borrowers?.borrowers_name }}</p>
            <p> {{ transaction.borrow_date }}</p>
            <p> {{ transaction.lenderName }}</p>
          </div>
        </div>
        <div class="-mx-3 flex flex-wrap">
          <div class="w-1/2 px-3">
            <button @click="closeModal"
              class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-dark transition bg-gray-200 hover:border-green-800 hover:bg-green-800 hover:text-white dark:text-black">
              No, Keep it.
            </button>
          </div>
          <div class="w-1/2 px-3">
            <button @click="confirmDelete"
              class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white dark:text-white">
              Yes, Delete!
            </button>
          </div>
        </div>
      </div>
    </div>
</template>
