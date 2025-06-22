<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useDatabaseStore } from '../../stores/databaseStore'
import axiosClient from "../../axios";
import { ClAddPlus } from '@kalimahapps/vue-icons';
import { AnFilledPrinter } from '@kalimahapps/vue-icons';
import { ChMenuMeatball } from "@kalimahapps/vue-icons";
import AddOfficeModal from './Modals/AddOfficeModal.vue';
import RecoverOfficeModal from './Modals/RecoverOfficeModal.vue';
import UpdateOfficeModal from './Modals/UpdateOfficeModal.vue';
import DeleteConfirmationModal from '../ConfirmationModal.vue';
import emitter from '../../eventBus';
import Loading from '../../components/Loading.vue';
import baguioLogo from '../../assets/baguio-logo.png';
import { AkEyeOpen } from '@kalimahapps/vue-icons';
import { useRouter } from 'vue-router';
import TableHeaderFormat from '../TableHeaderFormat.vue';
import useUserStore from '../../stores/user';
import { MdRestore } from '@kalimahapps/vue-icons';

const userStore = useUserStore()
const user = computed(() => userStore.user)
const router = useRouter();

const API_KEY = import.meta.env.VITE_API_KEY;

// FOR THE ADD CATEGORY MODAL
const isOpenAddOfficeModal = ref(false);

const isOpenRecoverOfficeModal = ref(false);

import { defineEmits } from 'vue';

const emit = defineEmits(["open-add-office-modal", "open-recover-office-modal"]);

const OpenAddOfficeModal = () => {
    emit('open-add-office-modal');
};

const OpenRecoverOfficeModal = () => {
    emit('open-recover-office-modal');
};

// fetching data
const databaseStore = useDatabaseStore()

onMounted(() => {
    databaseStore.fetchData()
})

// for search function
const searchQuery = ref("");

const filteredOffices = computed(() => {
    return databaseStore.officeList
        .filter(office =>
            (office.office_name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
            office.id.toString().includes(searchQuery.value.toLowerCase())) && !office.is_deleted
        );
});

// Reset to first page when searching
watch(searchQuery, () => {
    currentPage.value = 1;
});

// for pagination
const currentPage = ref(1);
const itemsPerPage = ref(8);

const totalPages = computed(() => {
    return Math.ceil(filteredOffices.value.length / itemsPerPage.value);
});

const sortedOffices = computed(() => {
    const offices = [...filteredOffices.value];

    return offices.sort((a, b) => {
        const getFieldValue = (office, field) => {
            switch (field) {
                case 'id':
                    return office.id;

                case 'office_name':
                    return office.office_name?.toLowerCase() || '';

                default:
                    return '';
            }
        };

        const aVal = getFieldValue(a, sortBy.value);
        const bVal = getFieldValue(b, sortBy.value);

        if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
    });
});

const paginatedOffices = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return sortedOffices.value.slice(start, end);
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
        pages.push('...');
    }

    // Add pages in the calculated range
    for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
    }

    // Add ellipsis if there are more pages after the range
    if (currentPage.value + delta < totalPages.value - 1) {
        pages.push('...');
    }

    // Always show last page if it's not the first page
    if (totalPages.value > 1) {
        pages.push(totalPages.value);
    }

    return pages;
});

// Action Dropdown
const openDropdownId = ref(null);

const toggleDropdown = (transactionId) => {
    openDropdownId.value = openDropdownId.value === transactionId ? null : transactionId;
};

// FOR THE UPDATE CATEGORY MODAL
const isOpenUpdateOfficeModal = ref(false);

const OpenUpdateOfficeModal = () => {
    isOpenUpdateOfficeModal.value = true;
}

// FOR DELETE
const showDeleteConfirmationModal = ref(false)

const isLoadingAgain = ref(false)

const confirmDeleteOffice = async (confirmed, officeId) => {
    if (confirmed) {
        isLoadingAgain.value = true
        try {
            const deleteOffice = {
                is_deleted: 1,
                deleted_by: user.value.id,
            }

            const response = await axiosClient.put(`api/offices/${officeId}`, deleteOffice,
                {
                    headers: { 'x-api-key': API_KEY },
                });

            console.log('Delete Office API response:', response);

            databaseStore.officeList = databaseStore.officeList.filter(office => office.id !== officeId);

            console.log(`Office deleted successfully.`);
            // emitter.emit("show-toast", { message: "Category deleted successfully!", type: "success" });
        } catch (error) {
            console.error('Error deleting office:', error);
            emitter.emit("show-toast", { message: "Error deleting office. Please try again.", type: "error" });
            isLoadingAgain.value = false
        } finally {
            await databaseStore.fetchData();
            emitter.emit("show-toast", { message: "Office deleted successfully!", type: "success" });
            showDeleteConfirmationModal.value = false; // Close the modal
            isLoadingAgain.value = false
        }
    }
}

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
    return (
        databaseStore.transactionItems.length === 0 ||
        databaseStore.transactionHistory.length === 0 ||
        databaseStore.officeEquipments.length === 0 ||
        databaseStore.officeSupplies.length === 0 ||
        databaseStore.officeList.length === 0 ||
        databaseStore.users.length === 0 ||
        databaseStore.borrowers.length === 0 ||
        databaseStore.equipmentCopies.length === 0 ||
        databaseStore.categoryList.length === 0
    );
});

// for printing reports
const handlePrint = async () => {


    const printWindow = window.open('', '_blank', 'width=800,height=600');

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
                <title>Printed Office Reports</title>
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
                    <h1>Office Management - Printed Report</h1>
                    <p>Printed on: ${new Date().toLocaleString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Office Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOffices.value.map(report => `
                            <tr>
                                <td>${report.id}</td>
                                <td>${report.office_name}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="print-footer">
                    <p>Total Offices: ${filteredOffices.value.length}</p>
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

const isOpenViewItemsModal = ref(false);
const selectedOffice = ref(null);

const OpenViewItemsModal = (office) => {
    selectedOffice.value = office;
    isOpenViewItemsModal.value = true;
}

const unreturnedCount = (officeId) =>
    databaseStore.transactionHistory.filter(t =>
        t.office_id === officeId && t.return_date === null
    ).length;



const getUnreturnedCountByOffice = (officeId) => {
    const borrowersFromOffice = databaseStore.borrowers.filter(
        borrower => borrower.office_id === officeId
    ).map(b => b.id);

    const unreturnedTransactions = databaseStore.transactionHistory.filter(
        t => borrowersFromOffice.includes(t.borrower_id) && t.return_date === null
    );

    return unreturnedTransactions.length;
};


const OpenViewTransactionHistoryPage = (office) => {
    selectedOffice.value = office;

    router.push({
        name: 'Transactions',
        query: {
            office_id: selectedOffice.value.id
        }
    });
}
</script>

<template>
    <div>
        <div v-if="isLoading" class="h-[72vh] flex flex-col items-center justify-center">
            <Loading />
            <p class="text-gray-500 dark:text-gray-400">Fetching data...</p>
        </div>
        <div v-else-if="isLoadingAgain" class="h-[72vh] flex flex-col items-center justify-center bg-black/60">
            <Loading />
        </div>
        <div v-else class="overflow-x-auto">
            <div class="grid grid-cols-3 md:grid-cols-7 gap-2 md:flex-row items-center justify-between  md:space-y-0 md:space-x-4 p-4">
                <!-- Search Box -->
                <div class="col-span-3 md:col-span-4 h-full">
                    <form class="flex items-center h-full">
                        <label for="simple-search" class="sr-only">Search</label>
                        <div class="relative w-full h-full">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    fill="currentColor" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <input v-model="searchQuery" type="text" id="simple-search"
                                class="bg-gray-50 h-full border border-gray-500 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                placeholder="Search office..." />
                        </div>
                    </form>
                </div>

                <button @click.stop="OpenAddOfficeModal()"
                    class="col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <ClAddPlus class="w-8 h-8" />
                    <p class="ml-1">Add Office</p>
                </button>
                <button @click="handlePrint"
                    class="col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <AnFilledPrinter class="w-8 h-8" />
                    <p class="ml-1 text-sm">Print Office</p>
                </button>
                <button @click.stop="OpenRecoverOfficeModal()"
                    class="col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <MdRestore class="w-8 h-8" />
                    <p class="ml-1">Recover Offices</p>
                </button>
            </div>

            <div class="rounded-lg min-h-[59vh] max-h-[60vh] md:max-h-[65vh] xl:max-h-[68vh] 2xl:xl:max-h-[70vh] overflow-auto [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-gray-200 dark:bg-gray-900">
                <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
                    <thead class=" sticky top-0 z-10">
                        <tr class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-center text-xs rounded-lg">
                            <th class="py-3 px-2 cursor-pointer" @click="sortByField('id')">
                                <TableHeaderFormat label="ID" field="id" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                            <th class="py-3 px-2 cursor-pointer" @click="sortByField('office_name')">
                                <TableHeaderFormat label="Office Name" field="office_name" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                            <th class="py-3">Transactions</th>
                            <th class="py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="paginatedOffices.length === 0" class="border-b border-gray-400 dark:border-gray-700">
                            <td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                No Office found
                            </td>
                        </tr>
                        <tr v-for="office in paginatedOffices" :key="office.id"
                            class="border-b font-medium border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-300 odd:bg-gray-300 odd:dark:bg-gray-900 even:bg-gray-100 even:dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                            <td class="px-4 py-3 ">{{ office.id }}</td>
                            <td class="px-4 py-3">
                                {{ office.office_name }}
                            </td>
                            <td class="px-4 py-3">
                                <button @click.stop="OpenViewTransactionHistoryPage(office)" class="items-center justify-center gap-2 mx-auto px-8 py-1.5 rounded-lg 
               border border-gray-300 hover:border-gray-400 
               dark:border-gray-600 dark:hover:border-gray-400 
               text-gray-700 dark:text-gray-200 transition duration-150 ease-in-out">
                                    <div class="flex items-center gap-2">
                                        <span>
                                            {{(databaseStore.transactionHistory.filter(transaction =>
                                                transaction.borrower_id ===
                                                (Number(databaseStore.borrowers.filter(borrower =>
                                                    Number(borrower.office_id) ===
                                                    office.id)?.length || 0)))?.length || 0)}}
                                        </span>
                                        <span class="text-gray-400">transactions</span>
                                        <span></span>
                                    </div>
                                    <div class="flex justify-center items-center gap-2"
                                        :class="(databaseStore.transactionHistory.filter(transaction =>
                                            transaction.office_id === office.id)?.length || 0) > 0 ? 'text-gray-400' : 'text-gray-700'">
                                        <span
                                            :class="{ 'text-red-500': getUnreturnedCountByOffice(office.id) > 0, 'text-green-500': getUnreturnedCountByOffice(office.id) === 0 }">
                                            ( {{ getUnreturnedCountByOffice(office.id) }} Unreturned )
                                        </span>
                                    </div>
                                </button>
                            </td>
                            <td class="px-4 py-3 flex items-center justify-center relative">
                                <button @click.stop="toggleDropdown(office.id)"
                                    class="inline-flex items-center p-0.5 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
                                    type="button">
                                    <ChMenuMeatball class="w-5 h-5" />
                                </button>

                                <div v-if="openDropdownId === office.id" ref="dropdownRefs"
                                    class="absolute z-[10] bg-white divide-gray-100 rounded-lg right-42 shadow-sm w-44 border-2 dark:border-gray-600 dark:bg-gray-800">
                                    <ul class="text-sm text-gray-700 dark:text-gray-200">
                                        <li
                                            class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            <button @click.stop="OpenUpdateOfficeModal()"
                                                class="w-full text-start px-4 py-2">
                                                Update
                                            </button>

                                            <UpdateOfficeModal v-if="isOpenUpdateOfficeModal"
                                                v-model="isOpenUpdateOfficeModal" :office="office" @click.stop />
                                        </li>
                                        <li
                                            class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            <button @click="showDeleteConfirmationModal = true"
                                                class="w-full text-start px-4 py-2">
                                                Delete
                                            </button>

                                            <!-- Delete Confirmation Modal -->
                                            <DeleteConfirmationModal v-model="showDeleteConfirmationModal"
                                                title="Confirm Deletion"
                                                :message="`You are about to delete this office.`"
                                                :messageData="`\nOffice Name: ${office.office_name}`"
                                                cancelText="Cancel" confirmText="Confirm Deleting"
                                                @confirm="() => confirmDeleteOffice(true, office.id)" />
                                        </li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <nav v-if="paginatedOffices.length > 0"
                class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
                aria-label="Table navigation">
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Showing
                    <span class="font-semibold text-gray-900 dark:text-white">
                        {{ (currentPage - 1) * itemsPerPage + 1 }} -
                        {{ Math.min(currentPage * itemsPerPage, filteredOffices.length) }}
                    </span>
                    of
                    <span class="font-semibold text-gray-900 dark:text-white">{{ filteredOffices.length
                        }}</span>
                </span>

                <ul class="inline-flex items-stretch -space-x-px">
                    <li>
                        <button @click="prevPage" :disabled="currentPage === 1" class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 
                     hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 
                     dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="sr-only">Previous</span>
                            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                        </button>
                    </li>

                    <li v-for="page in visiblePageNumbers" :key="page">
                        <button @click="goToPage(page)"
                            :class="['flex items-center justify-center text-sm py-2 px-3 leading-tight border',
                                page === currentPage
                                    ? 'text-primary-600 bg-primary-50 border-primary-300 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white']">
                            {{ page }}
                        </button>
                    </li>

                    <li>
                        <button @click="nextPage" :disabled="currentPage === totalPages" class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 
                     hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 
                     dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <span class="sr-only">Next</span>
                            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                        </button>
                    </li>
                </ul>
            </nav>

            <AddOfficeModal v-if="isOpenAddOfficeModal" v-model="isOpenAddOfficeModal" @click. stop />

            <RecoverOfficeModal v-if="isOpenRecoverOfficeModal" v-model="isOpenRecoverOfficeModal" @click. stop />

            <!-- <ViewItemsModal v-if="isOpenViewItemsModal" v-model="isOpenViewItemsModal"
                :selectedCategory="selectedCategory" :officeEquipments="databaseStore.officeEquipments"
                :officeSupplies="databaseStore.officeSupplies" :equipmentCopies="databaseStore.equipmentCopies"
                @click.stop /> -->
        </div>
    </div>
</template>