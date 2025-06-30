<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import axiosClient from "../../axios";
import { ChMenuMeatball } from "@kalimahapps/vue-icons";
import { ClAddPlus } from "@kalimahapps/vue-icons";
import UpdateUsersModal from "./Modals/UpdateUsersModal.vue";
import UpdateUsersPasswordModal from "./Modals/UpdateUsersPasswordModal.vue";
import DeleteConfirmationModal from "../ConfirmationModal.vue";
import emitter from "../../eventBus";
import { useDatabaseStore } from "../../stores/databaseStore";
import Loading from "../../components/Loading.vue";
import baguioLogo from "../../assets/baguio-logo.png";
import { AnFilledPrinter } from "@kalimahapps/vue-icons";
import AccessCheckbox from "./AccessCheckbox.vue";
import { useRouter } from "vue-router";
import TableHeaderFormat from "../TableHeaderFormat.vue";
import { MdRestore } from "@kalimahapps/vue-icons";
import { IcSolidWarningTriangle } from "@kalimahapps/vue-icons";

const API_KEY = import.meta.env.VITE_API_KEY;

// fetching data
const databaseStore = useDatabaseStore();

const loadingCheckboxes = ref(new Set());

onMounted(() => {
	databaseStore.fetchData();
});

watch(databaseStore.inventoryAccesses, (newVal) => {
	console.log('inv access', newVal)
})

// for search function
const searchQuery = ref("");

const filteredUsers = computed(() => {
	const activeFilters = filterItems.value.filter((item) => item.isActive).map((item) => item.type);

	// Return empty array if no filters are selected
	if (activeFilters.length === 0) {
		return [];
	}

	// const inventoryUsers = databaseStore.users.filter((user) => user.for_inventory === 1);

	return databaseStore.users
		.filter((user) => {
			// Filter based on archive status
			if (activeFilters.includes("Active") && !activeFilters.includes("Archived")) {
				return !user.is_deleted;
			} else if (!activeFilters.includes("Active") && activeFilters.includes("Archived")) {
				return user.is_deleted;
			} else {
				return true; // Show all if both are selected
			}
		})
		.filter((user) => user?.firstName?.toLowerCase().includes(searchQuery.value.toLowerCase()) || user?.middleName?.toLowerCase().includes(searchQuery.value.toLowerCase()) || user?.lastName?.toLowerCase().includes(searchQuery.value.toLowerCase()) || user?.email?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                user?.id?.toString().includes(searchQuery.value.toLowerCase()));
});

watch(searchQuery, () => {
	currentPage.value = 1;
});

// for pagination
const currentPage = ref(1);
const itemsPerPage = ref(7);

const totalPages = computed(() => {
	return Math.ceil(filteredUsers.value.length / itemsPerPage.value);
});

const sortedUsers = computed(() => {
	const users = [...filteredUsers.value];

	return users.sort((a, b) => {
		const getFieldValue = (user, field) => {
			switch (field) {
				case "id":
					return user.id;

				case "first_name":
					return user.firstName?.toLowerCase() || "";

				case "middle_name":
					return user.middleName?.toLowerCase() || "";

				case "last_name":
					return user.lastName?.toLowerCase() || "";

				case "email":
					return user.email?.toLowerCase() || "";

				default:
					return "";
			}
		};

		const aVal = getFieldValue(a, sortBy.value);
		const bVal = getFieldValue(b, sortBy.value);

		if (aVal < bVal) return sortDirection.value === "asc" ? -1 : 1;
		if (aVal > bVal) return sortDirection.value === "asc" ? 1 : -1;
		return 0;
	});
});

const paginatedUsers = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage.value;
	const end = start + itemsPerPage.value;
	return sortedUsers.value.slice(start, end);
});

// Pagination controls
const nextPage = () => {
	if (currentPage.value < totalPages.value) {
		currentPage.value++;
	}
};

const prevPage = () => {
	if (currentPage.value > 1) {
		currentPage.value--;
	}
};

const goToPage = (page) => {
	if (page >= 1 && page <= totalPages.value) {
		currentPage.value = page;
	}
};

const visiblePageNumbers = computed(() => {
	const delta = 2; // Number of pages to show before and after current page
	const pages = [];

	// Always show first page
	pages.push(1);

	// Calculate range around current page
	let leftBound = Math.max(2, currentPage.value - delta);
	let rightBound = Math.min(totalPages.value - 1, currentPage.value + delta);

	// Adjust bounds to ensure we show enough pages
	if (currentPage.value - delta > 2) {
		pages.push("...");
	}

	// Add pages in the calculated range
	for (let i = leftBound; i <= rightBound; i++) {
		pages.push(i);
	}

	// Add ellipsis if there are more pages after the range
	if (currentPage.value + delta < totalPages.value - 1) {
		pages.push("...");
	}

	// Always show last page if it's not the first page
	if (totalPages.value > 1) {
		pages.push(totalPages.value);
	}

	return pages;
});

// Action Dropdown
const openDropdownId = ref(null);

const toggleDropdown = (userId) => {
	openDropdownId.value = openDropdownId.value === userId ? null : userId;
};

// FOR THE UPDATE USER MODAL
const isOpenUpdateUsersModal = ref(false);

// const OpenUpdateUsersModal = () => {
// 	isOpenUpdateUsersModal.value = true;
// };

// FOR THE UPDATE USER PASSWORD MODAL
// const isOpenUpdateUsersPasswordModal = ref(false);

// const OpenUpdateUsersPasswordModal = () => {
// 	isOpenUpdateUsersPasswordModal.value = true;
// };

// FOR THE GIVE ACCESS MODAL
const isOpenGiveAccessModal = ref(false);

// const OpenGiveAccessModal = () => {
// 	isOpenGiveAccessModal.value = true;
// };

// FOR THE ADD USER MODAL
const isOpenAddUserModal = ref(false);

// const OpenAddUserModal = () => {
//     isOpenAddUserModal.value = true;
// };

// FOR DELETE
const showDeleteConfirmationModal = ref(false);

const isLoadingAgain = ref(false);

const confirmDeleteUser = async (confirmed, userId) => {
	if (confirmed) {
		isLoadingAgain.value = true;

		const userToDelete = databaseStore.users.find((user) => user.id === userId);

		try {
			databaseStore.deleteUser(userId);
			await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay for UI update
			console.log("User deleted successfully:", userToDelete);
		} catch (error) {
			console.error("Error deleting user:", error);
			emitter.emit("show-toast", {
				message: "Error deleting user. Please try again.",
				type: "error",
			});
			isLoadingAgain.value = false;
		} finally {
			isLoadingAgain.value = false;
			emitter.emit("show-toast", {
				message: "User deleted successfully!",
				type: "success",
			});
			showDeleteConfirmationModal.value = false; // Close the modal
		}
	}
};

// filter function
const archiveFilter = ref(false);
const filterButtonRef = ref(null);
const filterMenuRef = ref(null);

const filterItems = ref([
	{ id: 1, type: "Active", isActive: true },
	{ id: 2, type: "Archived", isActive: false },
]);

// Add these methods
const toggleFilter = () => {
	archiveFilter.value = !archiveFilter.value;
};

const handleCheckboxChange = (id, event) => {
	event.stopPropagation();
	const item = filterItems.value.find((item) => item.id === id);
	if (item) {
		item.isActive = !item.isActive;
	}
};

const sortBy = ref("id");
const sortDirection = ref("asc");

const sortByField = (field) => {
	currentPage.value = 1;
	if (sortBy.value === field) {
		sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
	} else {
		sortBy.value = field;
		sortDirection.value = "asc";
	}
};

const isLoading = computed(() => {
	return databaseStore.transactionItems.length === 0 || databaseStore.transactionHistory.length === 0 || databaseStore.officeEquipments.length === 0 || databaseStore.officeSupplies.length === 0 || databaseStore.officeList.length === 0 || databaseStore.users.length === 0 || databaseStore.borrowers.length === 0 || databaseStore.equipmentCopies.length === 0 || databaseStore.categoryList.length === 0 || databaseStore.inventoryAccesses.length === 0;
});

// for printing reports
const handlePrint = async () => {
	const printWindow = window.open("", "_blank", "width=800,height=600");

	// Wait for the image to load
	await new Promise((resolve) => {
		const img = new Image();
		img.src = baguioLogo;
		img.onload = resolve;
		img.onerror = resolve; // Avoid hanging if image fails
	});

	// Wait for the reports data to be fully available
	await new Promise((resolve) => {
		setTimeout(resolve, 100); // Small delay to ensure data is processed
	});

	printWindow.document.write(`
    <html>
        <head>
            <title>Printed Users Reports</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                }
                th { 
                    background-color: #f2f2f2; 
                    font-weight: bold; 
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <img src="${baguioLogo}" alt="Logo" style="width: 100px; height: auto; display: block; margin: 20px auto;">
                <h1>User Management - Printed Report</h1>
                <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Borrower Name</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredUsers.value
						.map(
							(report) => `
                        <tr>
                            <td>${report.id}</td>
                            <td>${report.firstName} ${report.middleName} ${report.lastName}</td>
                            <td>${report.email}</td>
                        </tr>
                    `
						)
						.join("")}
                </tbody>
            </table>
            <div class="print-footer">
                <p>Total Users: ${filteredUsers.value.length}</p>
            </div>
        </body>
    </html>
`);

	printWindow.document.close();

	// Wait for the new window to finish rendering before printing
	await new Promise((resolve) => setTimeout(resolve, 500));

	printWindow.print();

	printWindow.onafterprint = () => {
		printWindow.close();
	};
};

const unreturnedCount = (userId) => databaseStore.transactionHistory.filter((t) => t.lender_id === userId && t.return_date === null).length;

const selectedUser = ref(null);

const router = useRouter();

const OpenViewTransactionHistoryPage = (user) => {
	selectedUser.value = user;

	router.push({
		name: "Transactions",
		query: {
			user_id: selectedUser.value.id,
		},
	});
};

const toggleCheckbox = async (user, accessId, type) => {
	const loadingKey = `${accessId}-${type}`;
	loadingCheckboxes.value.add(loadingKey);

	const access = databaseStore.inventoryAccesses.find((inv) => inv.id === accessId && inv.user_id === user.id);

	if (!access) {
		loadingCheckboxes.value.delete(loadingKey);
		return;
	}

	try {
		const updateInventoryAccess = {
			id: accessId,
			user_id: user.id,
			for_dashboard: access.for_dashboard,
			for_inventory: access.for_inventory,
			for_categories: access.for_categories,
			for_borrowers: access.for_borrowers,
			for_offices: access.for_offices,
			for_users: access.for_users,
			[type]: access[type] === true ? false : true,
		};

		console.log("Update inventory access data sent:", updateInventoryAccess);
		databaseStore.updateInventoryAccess(updateInventoryAccess);
		await new Promise((resolve) => setTimeout(resolve, 500));
		console.log("Inventory access updated successfully:", updateInventoryAccess);

		const accessIndex = databaseStore.inventoryAccesses.findIndex((inv) => inv.id === accessId && inv.user_id === user.id);

		if (accessIndex !== -1) {
			databaseStore.inventoryAccesses[accessIndex] = {
				...databaseStore.inventoryAccesses[accessIndex],
				[type]: updateInventoryAccess[type],
			};
		}
	} catch (error) {
		console.error("Error updating inventory access:", error);
		emitter.emit("show-toast", {
			message: "Error updating access. Please try again.",
			type: "error",
		});
	} finally {
		loadingCheckboxes.value.delete(loadingKey);
	}
};

const permissionTypes = ["for_dashboard", "for_transactions", "for_inventory", "for_categories", "for_borrowers", "for_offices", "for_users"];

import { defineEmits } from "vue";
const emit = defineEmits(["open-add-user-modal", "open-recover-user-modal", "open-give-access-modal", "open-update-users-modal", "open-update-users-password-modal"]);

const OpenAddUserModal = () => {
	emit("open-add-user-modal");
};

const OpenRecoverUserModal = () => {
	emit("open-recover-user-modal");
};

const OpenGiveAccessModal = (user) => {
	emit("open-give-access-modal", user);
};

const OpenUpdateUsersModal = (user) => {
	emit("open-update-users-modal", user);
};

const OpenUpdateUsersPasswordModal = (user) => {
	emit("open-update-users-password-modal", user);
};

const userHasPermissions = (userId) => {
	return databaseStore.inventoryAccesses.some((invAccess) => invAccess.user_id === userId);
};
</script>

<template>
	<div>
		<div v-if="isLoading" class="h-[62vh] flex flex-col items-center justify-center">
			<Loading />
			<p class="text-gray-500 dark:text-gray-400">Fetching data...</p>
		</div>

		<div v-else-if="isLoadingAgain" class="h-[62vh] flex flex-col items-center justify-center bg-black/60">
			<Loading />
		</div>

		<div v-else class="overflow-x-auto">
			<div class="grid grid-cols-3 lg:grid-cols-9 gap-2 items-center justify-between md:space-x-4 p-4">
				<!-- Search Box -->
				<div class="col-span-2 lg:col-span-5 w-full">
					<form class="flex items-center">
						<label for="simple-search" class="sr-only">Search</label>
						<div class="relative w-full">
							<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								<svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
									<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
								</svg>
							</div>
							<input v-model="searchQuery" type="text" id="simple-search" class="bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 border-gray-500 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Search equipment copies..." />
						</div>
					</form>
				</div>
				<!-- Filter-->
				<div class="col-span-1 w-full relative inline-block rounded-lg text-left dark:bg-slate-700 mr-3 justify-center items-center">
					<button @click="toggleFilter" ref="filterButtonRef" class="flex items-center justify-center w-full p-2 bg-dark dark:bg-dark-2 dark:text-gray-200">
						<span class="material-icons pr-2">filter_alt</span>
						Filter
						<span class="material-icons pl-4">arrow_drop_down</span>
					</button>
					<div
						v-show="archiveFilter"
						ref="filterMenuRef"
						class="shadow-1 dark:shadow-box-dark absolute border border-gray-500 w-3xs right-0 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all"
						:class="{
							'top-full visible': archiveFilter,
							'top-[110%] invisible': !archiveFilter,
						}">
						<label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2" v-for="item in filterItems" :key="item.id">
							<div class="relative">
								<input type="checkbox" class="sr-only" :checked="item.isActive" @change="handleCheckboxChange(item.id, $event)" />
								<div class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
									<span
										:class="{
											'opacity-100': item.isActive,
											'opacity-0': !item.isActive,
										}">
										<svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
												fill="#3056D3"
												stroke="#3056D3"
												strokeWidth="0.4"></path>
										</svg>
									</span>
								</div>
							</div>
							{{ item.type }}
						</label>
					</div>
				</div>
				<!--  -->
				<button @click.stop="OpenAddUserModal()" class="col-span-1 w-full flex items-center justify-center px-2 py-1 rounded-lg button-default-green">
					<ClAddPlus class="w-8 h-8" />
					<p class="ml-1">Add Users</p>
				</button>
				<button @click="handlePrint" class="col-span-1 w-full flex items-center justify-center px-2 py-1 rounded-lg button-default-green">
					<AnFilledPrinter class="w-8 h-8" />
					<p class="ml-1">Print Users</p>
				</button>
				<button @click.stop="OpenRecoverUserModal()" class="col-span-1 w-full flex items-center justify-center px-2 py-1 rounded-lg button-default-green">
					<MdRestore class="w-8 h-8" />
					<p class="ml-1">Recover Users</p>
				</button>
			</div>
			<div class="rounded-lg min-h-[59vh] max-h-[60vh] md:max-h-[65vh] xl:max-h-[68vh] 2xl:xl:max-h-[70vh] overflow-auto [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-gray-200 dark:bg-gray-900">
				<table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
					<thead class="sticky top-0 z-10">
						<tr class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-center text-xs rounded-lg">
							<th class="py-3 px-2 cursor-pointer" @click="sortByField('id')">
								<TableHeaderFormat label="ID" field="id" :sortBy="sortBy" :sortDirection="sortDirection" />
							</th>

							<th class="hidden 2xl:table-cell py-3 px-2 cursor-pointer" @click="sortByField('first_name')">
								<TableHeaderFormat label="First Name" field="first_name" :sortBy="sortBy" :sortDirection="sortDirection" />
							</th>

							<th class="hidden 2xl:table-cell py-3 px-2 cursor-pointer" @click="sortByField('middle_name')">
								<TableHeaderFormat label="Middle Name" field="middle_name" :sortBy="sortBy" :sortDirection="sortDirection" />
							</th>

							<th class="hidden 2xl:table-cell py-3 px-2 cursor-pointer" @click="sortByField('last_name')">
								<TableHeaderFormat label="Last Name" field="last_name" :sortBy="sortBy" :sortDirection="sortDirection" />
							</th>

							<th class="table-cell 2xl:hidden py-3 px-2 cursor-pointer" @click="sortByField('first_name')">
								<TableHeaderFormat label="Full Name" field="first_name" :sortBy="sortBy" :sortDirection="sortDirection" />
							</th>

							<th class="py-3 px-2 cursor-pointer" @click="sortByField('email')">
								<TableHeaderFormat label="Email" field="email" :sortBy="sortBy" :sortDirection="sortDirection" />
							</th>
							<th class="py-3 px-2">Transactions</th>
							<th class="py-3 px-2">Dashboard</th>
							<th class="py-3 px-2">Transactions</th>
							<th class="py-3 px-2">Inventory</th>
							<th class="py-3 px-2">Categories</th>
							<th class="py-3 px-2">Borrower</th>
							<th class="py-3 px-2">Offices</th>
							<th class="py-3 px-2">Users</th>
							<th class="py-3 px-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="paginatedUsers.length === 0" class="border-b border-gray-400 dark:border-gray-700">
							<td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">No User found</td>
						</tr>
						<tr v-for="user in paginatedUsers" :key="user.id" class="border-b font-medium border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-300 odd:bg-gray-300 odd:dark:bg-gray-900 even:bg-gray-100 even:dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
							<td class="px-4 py-3">{{ user.id }}</td>
							<td class="px-4 py-3 hidden 2xl:table-cell">
								{{ user.firstName }}
							</td>
							<td class="px-4 py-3 hidden 2xl:table-cell">
								{{ user.middleName }}
							</td>
							<td class="px-4 py-3 hidden 2xl:table-cell">
								{{ user.lastName }}
							</td>
							<td class="px-4 py-3 block 2xl:hidden">{{ user.firstName }} {{ user.middleName }} {{ user.lastName }}</td>
							<td class="px-4 py-3">
								{{ user.email }}
							</td>

							<td class="min-w-30 px-1 py-1 2xl:py-2">
								<button @click.stop="OpenViewTransactionHistoryPage(user)" class="flex flex-col w-full items-center justify-center px-1 py-1.5 rounded-lg border hover:scale-105 border-gray-500 hover:border-gray-600 dark:border-gray-600 dark:hover:border-gray-400 text-gray-700 dark:text-gray-200 transition duration-150 ease-in-out">
									<div class="flex items-center gap-1 text-xs 2xl:text-base">
										<span>
											{{ databaseStore.transactionHistory.filter((transaction) => transaction.lender_id === user.id)?.length || 0 }}
										</span>
										<span class="text-gray-400 text-xs 2xl:text-base">transactions</span>
									</div>
									<div class="flex justify-center items-center" :class="(databaseStore.transactionHistory.filter((transaction) => transaction.lender_id === user.id)?.length || 0) > 0 ? 'text-gray-400' : 'text-gray-700'">
										<span
											class="w-full text-xs 2xl:text-base"
											:class="{
												'text-red-500': unreturnedCount(user.id) > 0,
												'text-green-500': unreturnedCount(user.id) === 0,
											}">
											({{ unreturnedCount(user.id) }} Unreturned)
										</span>
									</div>
								</button>
							</td>
							<td v-if=(!user.for_inventory) class="px-4 py-3 text-gray-500 italic" :colspan="7">
								<span class="flex flex-col justify-center items-center">
									<span class="flex flex-row gap-2">
										User used in:
										<span v-if="user.for_911"> 911 Dashboard</span>
										<span v-if="user.for_traffic"> Traffic Monitoring System</span>
									</span>

									<button @click.stop="OpenGiveAccessModal(user)" class="flex items-center justify-center px-2 py-1 rounded-lg button-default-green">
										<IcSolidWarningTriangle class="w-8 h-8" />
										<p class="ml-1">Give Inventory Access</p>
									</button>
								</span>
							</td>
							<td v-else-if="userHasPermissions(user.id)" v-for="perm in permissionTypes" :key="perm" class="px-4 py-3">
								<AccessCheckbox v-for="invAccess in databaseStore.inventoryAccesses" :key="invAccess.id" :invAccess="invAccess" :userId="user.id" :user="user" :type="perm" :onToggle="toggleCheckbox" />
							</td>
							<td v-else class="px-4 py-3 text-gray-500 italic" :colspan="7">
								<span class="flex flex-col justify-center items-center">
									<span class="flex flex-row gap-2">
										User used in:
										<span v-if="user.for_911"> 911 Dashboard System</span>
										<span v-if="user.for_traffic"> Traffic Monitoring System</span>
									</span>

									<button @click.stop="OpenGiveAccessModal(user)" class="flex items-center justify-center px-2 py-1 rounded-lg button-default-green">
										<IcSolidWarningTriangle class="w-8 h-8" />
										<p class="ml-1">Give Inventory Access</p>
									</button>
								</span>
							</td>

							<td class="px-4 py-3 flex items-center justify-center relative">
								<button @click.stop="toggleDropdown(user.id)" class="inline-flex items-center p-0.5 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100" type="button">
									<ChMenuMeatball class="w-5 h-5" />
								</button>

								<div v-if="openDropdownId === user.id" ref="dropdownRefs" class="absolute bg-white divide-gray-100 rounded-lg right-23 z-10 shadow-sm w-44 border-2 dark:border-gray-600 dark:bg-gray-800">
									<ul class="text-sm text-gray-700 dark:text-gray-200">
										<li class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
											<button @click.stop="OpenUpdateUsersModal(user)" class="w-full text-start px-4 py-2">Update</button>

											<UpdateUsersModal v-if="isOpenUpdateUsersModal" v-model="isOpenUpdateUsersModal" :user="user" @click.stop />
										</li>
										<li class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
											<button @click.stop="OpenUpdateUsersPasswordModal(user)" class="w-full text-start px-4 py-2">Change Password</button>

											<UpdateUsersPasswordModal v-if="isOpenUpdateUsersPasswordModal" v-model="isOpenUpdateUsersPasswordModal" :user="user" @click.stop />
										</li>
										<li class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
											<button @click="showDeleteConfirmationModal = true" class="w-full text-start px-4 py-2">Delete</button>

											<!-- Delete Confirmation Modal -->
											<DeleteConfirmationModal v-model="showDeleteConfirmationModal" title="Confirm Deletion" :message="`You are about to delete this user.`" :messageData="`\nName: ${user.firstName} ${user.middleName} ${user.lastName}\nEmail: ${user.email}`" cancelText="Cancel" confirmText="Confirm Deleting" @confirm="() => confirmDeleteUser(true, user.id)" />
										</li>
									</ul>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<nav v-if="paginatedUsers.length > 0" class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4" aria-label="Table navigation">
				<span class="text-sm font-normal text-gray-700 dark:text-gray-400">
					Showing
					<span class="font-semibold text-gray-950 dark:text-white">
						{{ (currentPage - 1) * itemsPerPage + 1 }} -
						{{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }}
					</span>
					of
					<span class="font-semibold text-gray-950 dark:text-white">{{ filteredUsers.length }}</span>
				</span>

				<ul class="inline-flex items-stretch -space-x-px">
					<li>
						<button @click="prevPage" :disabled="currentPage === 1" class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-700 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
							<span class="sr-only">Previous</span>
							<svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						</button>
					</li>

					<li v-for="page in visiblePageNumbers" :key="page">
						<button @click="goToPage(page)" :class="['flex items-center justify-center text-sm py-2 px-3 leading-tight border', page === currentPage ? 'text-primary-600 bg-primary-50 border-primary-300 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white']">
							{{ page }}
						</button>
					</li>

					<li>
						<button @click="nextPage" :disabled="currentPage === totalPages" class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
							<span class="sr-only">Next</span>
							<svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
							</svg>
						</button>
					</li>
				</ul>
			</nav>
		</div>
	</div>
</template>
