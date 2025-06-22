<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Loading from "../components/Loading.vue";
import OfficeTable from "../components/Category/CategoryTable.vue";
import TransactionHistoryTable from "../components/Transactions/TransactionHistoryTable.vue";
import { useRoute } from "vue-router";
import { useDatabaseStore } from "../stores/databaseStore";

const API_KEY = import.meta.env.VITE_API_KEY;

const route = useRoute();
const borrowerId = route.query.borrower_id;
const lenderId = route.query.user_id;
const officeId = route.query.office_id;

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

const formatDate = (date) => date.toISOString().split('T')[0];

const selectedEndDate = ref(formatDate(new Date())); // Current day
const selectedStartDate = ref(formatDate(new Date('2025-01-01')));

const selectedDateRange = ref({ start: selectedStartDate.value, end: selectedEndDate.value });

const updateDateRange = (range) => {
    selectedDateRange.value = range;
};

onMounted(() => {
    updateDateRange({ start: selectedStartDate.value, end: selectedEndDate.value });
});

const isLoading = computed(() => {
    return (
        transactionItemsArray.value.length === 0 ||
        transactionHistoryArray.value.length === 0 ||
        officeEquipmentsArray.value.length === 0 ||
        officeSuppliesArray.value.length === 0 ||
        officeListArray.value.length === 0 ||
        usersArray.value.length === 0 ||
        borrowersArray.value.length === 0 ||
        equipmentCopiesArray.value.length === 0 ||
        categoryListArray.value.length === 0 ||
        databaseStore.inventoryAccesses.length === 0
    );
});
</script>

<template>
    <div class="">
        <div
            class="sticky top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
            <h1 class="text-3xl ml-10 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">
                Transactions
            </h1>
        </div>
        
        <div v-if="isLoading" class="h-[80vh] flex flex-col items-center justify-center">
            <Loading />
            <p class="text-gray-500 dark:text-gray-400">Fetching data...</p>
        </div>

        <!-- MAIN CONTAINER -->
        <div v-else class="border-2 mt-4 px-4 border-gray-300 dark:border-gray-800 dark:bg-black rounded-xl">
            <div class="min-h-[80vh]">
                <TransactionHistoryTable :transactionItems="transactionItemsArray"
                    :transactionHistory="transactionHistoryArray" :officeEquipments="officeEquipmentsArray"
                    :officeSupplies="officeSuppliesArray" :officeList="officeListArray" :users="usersArray"
                    :borrowers="borrowersArray" :equipmentCopies="equipmentCopiesArray"
                    :categoryList="categoryListArray" :selectedDateRange="selectedDateRange" :filterBorrowerId="borrowerId"
                    :filterLenderId="lenderId" :filterOfficeId="officeId" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
