<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import LineGraph from "../components/Dashboard/LineGraph.vue";
import BarGraph from "../components/Dashboard/BarGraph.vue";
import TransactionHistoryTable from "../components/Transactions/TransactionHistoryTable.vue";
import DateRangePicker from "../components/Dashboard/DateRangePicker.vue";
import { useDatabaseStore } from "../stores/databaseStore";
import Loading from "../components/Loading.vue";
import PieGraph from "../components/Dashboard/PieGraph.vue";
import ButtonShortcuts from "../components/Dashboard/ButtonShortcuts.vue";
import UsersUnreturned from "../components/Dashboard/UsersUnreturned.vue";
import OfficesUnreturned from "../components/Dashboard/OfficesUnreturned.vue";
import OutOfStockSupplies from "../components/Dashboard/OutOfStockSupplies.vue";
import AddItemModal from "../components/Inventory/Modals/AddItemModal.vue";
import CreateTransactionModal from "../components/Transactions/Modal/CreateTransactionModal.vue";
import GenerateQRCodeModal from "../components/Inventory/Modals/GenerateQRCodeModal.vue";

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

const selectedDateRange = ref({
	start: selectedStartDate.value,
	end: selectedEndDate.value,
});

const updateDateRange = (range) => {
	selectedDateRange.value = range;
};

onMounted(() => {
	updateDateRange({
		start: selectedStartDate.value,
		end: selectedEndDate.value,
	});
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

const isOpenAddItemModal = ref(false);
const isOpenCreateTransactionModal = ref(false);
const isOpenGenerateQRCodeModal = ref(false);
</script>

<template>
	<div class="pb-5">
		<div class="sticky flex flex-row md:gap-25 items-center justify-stretch top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
			<h1 class="text-3xl ml-10 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">Dashboard</h1>
			<div class="w-full grid grid-cols-1 lg:grid-cols-6 lg:gap-1 2xl:gap-2 items-center text-center">
				<DateRangePicker @dateRangeSelected="updateDateRange" class="hidden sm:block col-span-1 lg:col-span-3 px-4 w-full dark:text-gray-200" />
				<div class="hidden min-h-full lg:flex lg:flex-col lg:justify-center lg:items-center border-2 shadow-lg px-1 py-2 2xl:p-2 2xl:pb-5 rounded-lg mx-1 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
					<h5 class="inline-flex text-sm 2xl:text-md items-center text-gray-900 dark:text-gray-400 leading-none font-normal mb-2">Total Transactions</h5>
					<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">
						{{ totalTransactionsCount }}
					</p>
				</div>
				<div class="hidden min-h-full lg:flex lg:flex-col lg:justify-center lg:items-center border-2 shadow-lg px-1 py-2 2xl:p-2 2xl:pb-5 rounded-lg mx-1 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
					<h5 class="inline-flex text-sm 2xl:text-md items-center text-gray-900 dark:text-gray-400 leading-none font-normal mb-2">Total Unreturned</h5>
					<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">
						{{ unreturnedCount }}
					</p>
				</div>
				<div class="hidden min-h-full lg:flex lg:flex-col lg:justify-center lg:items-center border-2 shadow-lg px-1 py-2 2xl:p-2 2xl:pb-5 rounded-lg mx-1 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
					<h5 class="inline-flex text-sm 2xl:text-md items-center text-gray-900 dark:text-gray-400 leading-none font-normal mb-2">Total Returned</h5>
					<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">
						{{ returnedCount }}
					</p>
				</div>
			</div>
		</div>

		<div v-if="isLoading" class="h-[72vh] flex flex-col items-center justify-center">
			<Loading />
			<p class="text-gray-500 dark:text-gray-400">Fetching data...</p>
		</div>
		<div v-else>
			<!-- SHORTCUT BUTTONS FOR MEDIUM AND BELOW -->
			<div class="grid grid-cols-3 md:grid-cols-5 lg:hidden gap-3 p-2 pt-6 pb-0 dark:text-gray-800">
				<!-- BUTTON SHORTCUTS -->
				<div class="group col-span-3 w-full h-fit rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full rounded-3xl p-4 lg:p-6 flex flex-col items-center justify-center dashboard-div-inside-colors">
						<ButtonShortcuts @open-add-item-modal="isOpenAddItemModal = true" @open-create-transaction-modal="isOpenCreateTransactionModal = true" @open-generate-qr-code-modal="isOpenGenerateQRCodeModal = true" />
					</div>
				</div>

				<!-- TRANSACTIONS COUNT -->
				<div class="col-span-3 md:col-span-2 grid grid-cols-3 text-center gap-3">
					<div class="flex flex-col h-full justify-center items-center border-2 rounded-lg shadow-lg p-3 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
						<p class="inline-flex items-center text-gray-900 dark:text-gray-400 leading-none font-semibold mb-2">Total Transactions</p>
						<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">
							{{ totalTransactionsCount }}
						</p>
					</div>
					<div class="flex flex-col h-full justify-center items-center border-2 rounded-lg shadow-lg p-3 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
						<p class="inline-flex items-center text-gray-900 dark:text-gray-400 leading-none font-semibold mb-2">Total Unreturned</p>
						<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">
							{{ unreturnedCount }}
						</p>
					</div>
					<div class="flex flex-col h-full justify-center items-center border-2 rounded-lg shadow-lg p-3 bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700">
						<p class="inline-flex items-center text-gray-900 dark:text-gray-400 leading-none font-semibold mb-2">Total Returned</p>
						<p class="text-gray-900 dark:text-white text-2xl leading-none font-bold">
							{{ returnedCount }}
						</p>
					</div>
				</div>
			</div>

			<!-- SHORTCUTS BUTTONS AND OTHERS FOR MEDIUM AND ABOVE -->
			<div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-5 p-1 md:p-4 pt-4 md:pt-6 pb-0 h-255 md:h-130 dark:text-gray-800">
				<!-- USERS UNRETURNED -->
				<div class="group w-full h-124 md:col-span-2 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full rounded-3xl p-6 flex flex-col items-center justify-center dashboard-div-inside-colors">
						<OutOfStockSupplies />
					</div>
				</div>

				<!-- PIE GRAPH -->
				<div class="group w-full h-124 md:col-span-2 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full rounded-3xl p-6 flex flex-col items-center justify-center dashboard-div-inside-colors">
						<PieGraph :dateRange="selectedDateRange" :isLoading="isLoading" :transactionHistory="transactionHistoryArray" />
					</div>
				</div>

				<!-- BUTTON SHORTCUTS -->
				<div class="hidden lg:block group w-full md:h-124 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full rounded-3xl p-6 flex flex-col items-center justify-center dashboard-div-inside-colors">
						<ButtonShortcuts @open-add-item-modal="isOpenAddItemModal = true" @open-create-transaction-modal="isOpenCreateTransactionModal = true" @open-generate-qr-code-modal="isOpenGenerateQRCodeModal = true" />
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 p-4 pb-0 hh-255 md:h-130 md:grid-cols-2 gap-2 md:gap-5 dark:text-gray-800">
				<!-- BAR GRAPH -->
				<div class="group w-full h-124 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full rounded-3xl shadow-sm flex justify-between dashboard-div-inside-colors">
						<BarGraph :dateRange="selectedDateRange" :isLoading="isLoading" :transactionHistory="transactionHistoryArray" class="w-full" />
					</div>
				</div>

				<!-- USERS UNRETURNED -->
				<div class="group w-full h-124 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full px-6 py-4 rounded-3xl shadow-sm flex justify-between dashboard-div-inside-colors">
						<UsersUnreturned />
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 p-4 pb-0 h-255 md:h-130 md:grid-cols-2 md:gap-3 dark:text-gray-800">
				<!-- LINE GRAPH -->
				<div class="group w-full h-124 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full rounded-3xl shadow-sm flex justify-between dashboard-div-inside-colors">
						<LineGraph :dateRange="selectedDateRange" :isLoading="isLoading" :transactionHistory="transactionHistoryArray" class="w-full" />
					</div>
				</div>

				<!-- Users Unreturned -->
				<div class="group w-full h-124 rounded-3xl p-1 dashboard-div-main-colors">
					<div class="w-full h-full px-6 py-4 rounded-3xl shadow-sm flex justify-between dashboard-div-inside-colors">
						<OfficesUnreturned />
					</div>
				</div>
			</div>
		</div>
		<AddItemModal v-if="isOpenAddItemModal" v-model="isOpenAddItemModal" :categories="databaseStore.categoryList" @click.stop />
		<CreateTransactionModal v-if="isOpenCreateTransactionModal" v-model="isOpenCreateTransactionModal" @click.stop />
		<GenerateQRCodeModal v-if="isOpenGenerateQRCodeModal" v-model="isOpenGenerateQRCodeModal" @click.stop />
	</div>
</template>

<style scoped>
/* Optional: Add any additional dark mode specific styles if needed */
</style>
