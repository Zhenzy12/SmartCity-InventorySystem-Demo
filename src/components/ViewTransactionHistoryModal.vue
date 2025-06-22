<!-- ILALAGAY SA MODAL -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Loading from '../components/Loading.vue';
import { GlCloseXs } from '@kalimahapps/vue-icons';
import { useDatabaseStore } from '../stores/databaseStore';
import TransactionHistoryTable from './Transactions/TransactionHistoryTable.vue';

const isLoading = ref(false)

const props = defineProps({
    modelValue: Boolean,
    selectedUser: Object,
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

const formatDate = (date) => date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

const selectedEndDate = ref(formatDate(new Date())); // Current day
const selectedStartDate = ref(formatDate(new Date(new Date().setDate(new Date().getDate() - 6)))); // 6 days ago

const selectedDateRange = ref({ start: selectedStartDate.value, end: selectedEndDate.value });


// fetching data
const databaseStore = useDatabaseStore()



onMounted(() => {
    databaseStore.fetchData()
})



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
    Object.entries(computedProperties).map(([key, value]) => [key, computed(() => databaseStore[value])])
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

</script>

<template>
    <div v-if="modelValue"
        class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50 ">
        <!-- Loading State -->
        <Loading v-if="isLoading" />

        <!-- Main Add Copy Form -->
        <div v-else ref="modalContainer"
            class="min-w-[80vw] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border border-4 dark:bg-gray-950 dark:border-gray-100">
            <div class="flex justify-between">
                <div class="w-full text-2xl font-semibold mb-4 flex flex-row justify-center items-center">
                    <p class=" text-3xl ">Transaction History</p>
                </div>
                <button @click="closeModal()"
                    class="bg-gray-200 max-h-fit ml-4 text-gray-700 px-1 py-1 rounded-full hover:bg-gray-300 transition">
                    <GlCloseXs class="w-8 h-8" />
                </button>
            </div>
            <div>
                <TransactionHistoryTable :transactionItems="transactionItemsArray"
                    :transactionHistory="transactionHistoryArray" :officeEquipments="officeEquipmentsArray"
                    :officeSupplies="officeSuppliesArray" :officeList="officeListArray" :users="usersArray"
                    :borrowers="borrowersArray" :equipmentCopies="equipmentCopiesArray"
                    :categoryList="categoryListArray" :selectedDateRange="selectedDateRange" />
            </div>
        </div>
    </div>
</template>