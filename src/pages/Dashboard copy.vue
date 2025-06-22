<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import LineGraph from "../components/Dashboard/LineGraph.vue";
import BarGraph from "../components/Dashboard/BarGraph.vue";
import TransactionHistoryTable from "../components/Transactions/TransactionHistoryTable.vue";
import DateRangePicker from "../components/Dashboard/DateRangePicker.vue";
import { useDatabaseStore } from "../stores/databaseStore";
import Loading from "../components/Loading.vue";

// fetching data
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

const { transactionItems, transactionHistory, officeEquipments, officeSupplies, officeList, users, borrowers, equipmentCopies, categoryList } = Object.fromEntries(Object.entries(computedProperties).map(([key, value]) => [key, computed(() => databaseStore[value])]));

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

const formatDate = (date) => date.toISOString().split("T")[0]; // Format as YYYY-MM-DD

const selectedEndDate = ref(formatDate(new Date())); // Current day
const selectedStartDate = ref(formatDate(new Date(new Date().setDate(new Date().getDate() - 6)))); // 6 days ago

const selectedDateRange = ref({ start: selectedStartDate.value, end: selectedEndDate.value });

const updateDateRange = (range) => {
	selectedDateRange.value = range;
};

onMounted(() => {
	updateDateRange({ start: selectedStartDate.value, end: selectedEndDate.value });
});

const totalTransactionsCount = computed(() => {
	if (!transactionHistoryArray.value) return 0;

	const startDate = new Date(selectedDateRange.value.start);
	const endDate = new Date(selectedDateRange.value.end);
	endDate.setHours(23, 59, 59, 999);

	return transactionHistoryArray.value.filter((transaction) => {
		const borrowDate = new Date(transaction.borrow_date);
		return borrowDate >= startDate && borrowDate <= endDate;
	}).length;
});

const returnedCount = computed(() => {
	if (!transactionHistoryArray.value) return 0;

	const startDate = new Date(selectedDateRange.value.start);
	const endDate = new Date(selectedDateRange.value.end);
	endDate.setHours(23, 59, 59, 999);

	return transactionHistoryArray.value.filter((transaction) => {
		if (!transaction.return_date) return false;
		const returnDate = new Date(transaction.return_date);
		const borrowDate = new Date(transaction.borrow_date);
		return borrowDate >= startDate && returnDate <= endDate;
	}).length;
});

const unreturnedCount = computed(() => {
	return totalTransactionsCount.value - returnedCount.value;
});

const isLoading = computed(() => {
	return transactionItemsArray.value.length === 0 || transactionHistoryArray.value.length === 0 || officeEquipmentsArray.value.length === 0 || officeSuppliesArray.value.length === 0 || officeListArray.value.length === 0 || usersArray.value.length === 0 || borrowersArray.value.length === 0 || equipmentCopiesArray.value.length === 0 || categoryListArray.value.length === 0 || databaseStore.inventoryAccesses.length === 0;
});
</script>

<template>
	<div class="">
		<div class="sticky top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
			<h1 class="text-3xl ml-8 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">Dashboard</h1>
		</div>

		<div v-if="isLoading" class="h-[72vh] flex flex-col items-center justify-center">
			<Loading />
			<p class="text-gray-500 dark:text-gray-400">Fetching data...</p>
		</div>
		<div v-else>
			<div class="grid h-25 md:p-4 grid-cols-3 md:grid-cols-2">
				<!-- Date Range Picker -->
				<DateRangePicker @dateRangeSelected="updateDateRange" class="px-4 col-span-2 md:col-span-1 dark:text-gray-200" />
				<!-- Total Transactions Not Returned and Returned -->
				<div class="grid grid-cols-3 gap-4 items-center text-center">
					<div class="border-2 shadow-lg p-2 pb-5 rounded-lg mx-1 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
						<h5 class="inline-flex items-center text-gray-900 dark:text-gray-400 leading-none font-normal mb-2">Total Transactions</h5>
						<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">{{ totalTransactionsCount }}</p>
					</div>
					<div class="border-2 shadow-lg p-2 pb-5 rounded-lg mx-1 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
						<h5 class="inline-flex items-center text-gray-900 dark:text-gray-400 leading-none font-normal mb-2">Total Unreturned</h5>
						<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">{{ unreturnedCount }}</p>
					</div>
					<div class="border-2 shadow-lg p-2 pb-5 rounded-lg mx-1 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
						<h5 class="inline-flex items-center text-gray-900 dark:text-gray-400 leading-none font-normal mb-2">Total Returned</h5>
						<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">{{ returnedCount }}</p>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 p-4 pb-0 h-160 md:h-130 md:grid-cols-2 md:gap-3 dark:text-gray-800">
				<!-- BAR GRAPH -->
				<div class="w-full shadow-lg h-85 md:h-124 md:span-cols-1">
					<div class="card w-full h-full bg-white rounded-lg shadow-sm border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 flex justify-between">
						<BarGraph :dateRange="selectedDateRange" :isLoading="isLoading" :transactionHistory="transactionHistoryArray" class="w-full" />
					</div>
				</div>

				<!-- LINE GRAPH -->
				<div class="w-full shadow-lg h-70 md:h-124 md:span-cols-1">
					<div class="card w-full h-full bg-white rounded-lg shadow-sm border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 flex justify-between">
						<LineGraph :dateRange="selectedDateRange" :isLoading="isLoading" :transactionHistory="transactionHistoryArray" class="w-full" />
					</div>
				</div>
			</div>

			<!-- HISTORY TABLE -->
			<div class="mb-2 md:mt-2">
				<TransactionHistoryTable :transactionItems="transactionItemsArray" :transactionHistory="transactionHistoryArray" :officeEquipments="officeEquipmentsArray" :officeSupplies="officeSuppliesArray" :officeList="officeListArray" :users="usersArray" :borrowers="borrowersArray" :equipmentCopies="equipmentCopiesArray" :categoryList="categoryListArray" :selectedDateRange="selectedDateRange" />
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Optional: Add any additional dark mode specific styles if needed */
</style>
