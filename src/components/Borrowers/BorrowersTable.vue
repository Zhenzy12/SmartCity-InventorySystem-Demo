<script setup>
import { ref, onMounted, onUnmounted, computed, watch, watchEffect } from 'vue'
import axiosClient from "../../axios";
import { ClAddPlus } from '@kalimahapps/vue-icons';
import { ChMenuMeatball } from "@kalimahapps/vue-icons";
import AddBorrowerModal from './Modals/AddBorrowerModal.vue';
import UpdateBorrowerModal from './Modals/UpdateBorrowerModal.vue';
import DeleteConfirmationModal from '../ConfirmationModal.vue';
import RecoverBorrowerModal from './Modals/RecoverBorrowerModal.vue';
import emitter from '../../eventBus';
import { useDatabaseStore } from "../../stores/databaseStore";
import Loading from '../../components/Loading.vue';
import baguioLogo from '../../assets/baguio-logo.png';
import { AnFilledPrinter } from '@kalimahapps/vue-icons';
import { useRouter } from 'vue-router';
import TableHeaderFormat from '../TableHeaderFormat.vue';
import useUserStore from '../../stores/user';
import { defineEmits } from 'vue';
import { MdRestore } from "@kalimahapps/vue-icons";

const userStore = useUserStore()
const user = computed(() => userStore.user)
const router = useRouter();

const API_KEY = import.meta.env.VITE_API_KEY;

// fetching data
const databaseStore = useDatabaseStore()


onMounted(() => {
    databaseStore.fetchData()
})

const emit = defineEmits(["open-add-borrower-modal", "open-recover-borrower-modal"]);

const OpenRecoverBorrowerModal = () => {
    emit('open-recover-borrower-modal');
};

const OpenAddBorrowerModal = () => {
    isOpenAddBorrowerModal.value = true;
};

const isOpenRecoverBorrowerModal = ref(false);

// for search function
const searchQuery = ref("");

const filteredBorrowers = computed(() => {

    return databaseStore.borrowers.filter((borrower) => !borrower.is_deleted)
        .filter((borrower) => {
            const office = databaseStore.officeList.find((office) => office.id === borrower.office_id);
            const borrowerName = borrower.borrowers_name.toLowerCase();
            const contactNumber = borrower.borrowers_contact.toLowerCase();
            const officeName = office ? office.office_name.toLowerCase() : 'unknown';
            const searchQueryValue = searchQuery.value.toLowerCase();
            return (
                borrowerName.includes(searchQueryValue) ||
                contactNumber.includes(searchQueryValue) ||
                officeName.includes(searchQueryValue) ||
                borrower.id.toString().includes(searchQueryValue)
            );
        }).map((borrower) => {
            const office = databaseStore.officeList.find((office) => office.id === borrower.office_id);
            return {
                id: borrower.id,
                borrowers_name: borrower.borrowers_name,
                contact_number: borrower.borrowers_contact,
                office_name: office ? office.office_name : 'Unknown',
            };
        });
});

// Reset to first page when searching
watch(searchQuery, () => {
    currentPage.value = 1;
});

// for pagination
const currentPage = ref(1);
const itemsPerPage = ref(8);

const totalPages = computed(() => {
    return Math.ceil(filteredBorrowers.value.length / itemsPerPage.value);
});


const sortedBorrowers = computed(() => {
    const borrowers = [...filteredBorrowers.value];

    return borrowers.sort((a, b) => {
        const getFieldValue = (borrower, field) => {
            switch (field) {
                case 'id':
                    return borrower.id;

                case 'borrowers_name':
                    return borrower.borrowers_name?.toLowerCase() || '';

                case 'contact_number':
                    return borrower.contact_number?.toLowerCase() || '';

                case 'office':
                    return borrower.office_name?.toLowerCase() || '';

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

const paginatedBorrowers = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return sortedBorrowers.value.slice(start, end);
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

// FOR THE ADD BORROWER MODAL
const isOpenAddBorrowerModal = ref(false);

// Action Dropdown
const openDropdownId = ref(null);

const toggleDropdown = (borrowerId) => {
    openDropdownId.value = openDropdownId.value === borrowerId ? null : borrowerId;
};

// FOR THE UPDATE BORROWER MODAL
const isOpenUpdateBorrowerModal = ref(false);

const OpenUpdateBorrowerModal = () => {
    isOpenUpdateBorrowerModal.value = true;
}

// FOR DELETE
const showDeleteConfirmationModal = ref(false)

const confirmDeleteBorrower = async (confirmed, borrowerId) => {
    if (confirmed) {
        isLoadingAgain.value = true
        try {
            databaseStore.deleteBorrower(borrowerId, user.value.id);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error deleting borrower:', error);
            emitter.emit("show-toast", { message: "Error deleting borrower. Please try again.", type: "error" });
            isLoadingAgain.value = false
        } finally {
            showDeleteConfirmationModal.value = false; // Close the modal
            isLoadingAgain.value = false
            emitter.emit("show-toast", { message: "Borrower deleted successfully!", type: "success" });
        }
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
const isLoadingAgain = ref(false)
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
        databaseStore.categoryList.length === 0 ||
        databaseStore.inventoryAccesses.length === 0
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
            <title>Printed Borrowers Reports</title>
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
                <h1>Borrowers Management - Printed Report</h1>
                <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Borrower Name</th>
                        <th>Contact Number</th>
                        <th>Office</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredBorrowers.value.map(report => `
                        <tr>
                            <td>${report.id}</td>
                            <td>${report.borrowers_name}</td>
                            <td>${report.contact_number}</td>
                            <td>${report.office_name}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="print-footer">
                <p>Total Borrowers: ${filteredBorrowers.value.length}</p>
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

const unreturnedCount = (borrowerId) =>
    databaseStore.transactionHistory.filter(t =>
        t.borrower_id === borrowerId && t.return_date === null
    ).length;

const selectedBorrower = ref(null);

const OpenViewTransactionHistoryPage = (borrower) => {
    selectedBorrower.value = borrower;

    router.push({
        name: 'Transactions',
        query: {
            borrower_id: selectedBorrower.value.id
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
            <div
                class="grid grid-cols-3 lg:grid-cols-8 gap-2 items-center justify-between md:space-y-0 md:space-x-4 p-4">
                <!-- Search Box -->
                <div class="col-span-3 lg:col-span-5 w-full">
                    <form class="flex items-center">
                        <label for="simple-search" class="sr-only">Search</label>
                        <div class="relative w-full">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    fill="currentColor" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clip-rule="evenodd" />
                                </svg>
                            </div>
                            <input v-model="searchQuery" type="text" id="simple-search"
                                class="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                placeholder="Search equipment copies..." />
                        </div>
                    </form>
                </div>
                <!-- ADD BUTTON -->
                <button @click.stop="OpenAddBorrowerModal"
                    class="col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <ClAddPlus class="w-8 h-8" />
                    <p class="ml-1">Add Borrower</p>
                </button>
                <button @click="handlePrint"
                    class="col-span-1 lg:col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <AnFilledPrinter class="w-8 h-8" />
                    <p class="ml-1 text-sm">Print Borrowers</p>
                </button>
                <button @click.stop="OpenRecoverBorrowerModal()"
                    class="col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <MdRestore class="w-8 h-8" />
                    <p class="ml-1">Recover Borrowers</p>
                </button>
            </div>
            <div
                class="rounded-lg min-h-[59vh] max-h-[60vh] md:max-h-[65vh] xl:max-h-[68vh] 2xl:xl:max-h-[70vh] overflow-auto [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-gray-200 dark:bg-gray-900">
                <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
                    <thead class=" sticky top-0 z-10">
                        <tr
                            class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-center text-xs rounded-lg">
                            <th class="py-3 px-2 cursor-pointer" @click="sortByField('id')">
                                <TableHeaderFormat label="ID" field="id" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                            <th class="py-3 px-2 cursor-pointer" @click="sortByField('borrowers_name')">
                                <TableHeaderFormat label="Borrower Name" field="borrowers_name" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                            <th class="py-3 px-2 cursor-pointer" @click="sortByField('contact_number')">
                                <TableHeaderFormat label="Contact Number" field="contact_number" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                            <th class="py-3 px-2 cursor-pointer" @click="sortByField('office')">
                                <TableHeaderFormat label="Office" field="office" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                            <th class="py-3">Transactions</th>
                            <th class="py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="paginatedBorrowers.length === 0"
                            class="border-b border-gray-400 dark:border-gray-700">
                            <td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                No borrowers found
                            </td>
                        </tr>
                        <tr v-for="borrower in paginatedBorrowers" :key="borrower.id"
                            class="border-b font-medium border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-300 odd:bg-gray-300 odd:dark:bg-gray-900 even:bg-gray-100 even:dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                            <td class="px-4 py-3 ">{{ borrower.id }}</td>
                            <td class="px-4 py-3 ">
                                {{ borrower.borrowers_name }}
                            </td>
                            <td class="px-4 py-3 ">
                                {{ borrower.contact_number }}
                            </td>
                            <td class="px-4 py-3 min-w-[100px] max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                                :title="borrower.office_name">
                                {{ borrower.office_name }}
                            </td>

                            <td class="px-4 py-3">
                                <button @click.stop="OpenViewTransactionHistoryPage(borrower)" class="items-center justify-center gap-2 mx-auto px-8 py-1.5 rounded-lg 
               border border-gray-300 hover:border-gray-400 
               dark:border-gray-600 dark:hover:border-gray-400 
               text-gray-700 dark:text-gray-200 transition duration-150 ease-in-out">
                                    <div class="flex items-center gap-2">
                                        <span>
                                            {{(databaseStore.transactionHistory.filter(transaction =>
                                                transaction.borrower_id === borrower.id)?.length || 0)}}
                                        </span>
                                        <span class="text-gray-400">transactions</span>
                                    </div>
                                    <div class="flex justify-center items-center gap-2"
                                        :class="(databaseStore.transactionHistory.filter(transaction =>
                                            transaction.borrower_id === borrower.id)?.length || 0) > 0 ? 'text-gray-400' : 'text-gray-700'">
                                        <span
                                            :class="{ 'text-red-500': unreturnedCount(borrower.id) > 0, 'text-green-500': unreturnedCount(borrower.id) === 0 }">
                                            ( {{ unreturnedCount(borrower.id) }} Unreturned )
                                        </span>
                                    </div>
                                </button>
                            </td>
                            <td class="px-4 py-3 flex items-center justify-center relative">
                                <button @click.stop="toggleDropdown(borrower.id)"
                                    class="inline-flex items-center p-0.5 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
                                    type="button">
                                    <ChMenuMeatball class="w-5 h-5" />
                                </button>
                                <div v-if="openDropdownId === borrower.id" ref="dropdownRefs"
                                    class="absolute z-[10] bg-white divide-gray-100 rounded-lg right-26 shadow-sm w-44 border-2 dark:border-gray-600 dark:bg-gray-800">
                                    <ul class="text-sm text-gray-700 dark:text-gray-200">
                                        <li
                                            class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            <button @click.stop="OpenUpdateBorrowerModal()"
                                                class="w-full text-start px-4 py-2">
                                                Update
                                            </button>

                                            <UpdateBorrowerModal v-if="isOpenUpdateBorrowerModal"
                                                v-model="isOpenUpdateBorrowerModal" :borrower="borrower"
                                                :officeList="databaseStore.officeList" @click.stop />
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
                                                :message="`You are about to delete this borrower.`"
                                                :messageData="`\nBorrower Name: ${borrower.borrowers_name}`"
                                                cancelText="Cancel" confirmText="Confirm Deleting"
                                                @confirm="() => confirmDeleteBorrower(true, borrower.id)" />
                                        </li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <nav v-if="paginatedBorrowers.length > 0"
                class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
                aria-label="Table navigation">
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Showing
                    <span class="font-semibold text-gray-900 dark:text-white">
                        {{ (currentPage - 1) * itemsPerPage + 1 }} -
                        {{ Math.min(currentPage * itemsPerPage, filteredBorrowers.length) }}
                    </span>
                    of
                    <span class="font-semibold text-gray-900 dark:text-white">{{ filteredBorrowers.length
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

            <AddBorrowerModal v-if="isOpenAddBorrowerModal" v-model="isOpenAddBorrowerModal"
                :officeList="databaseStore.officeList" @click.stop />
            <RecoverBorrowerModal v-if="isOpenRecoverBorrowerModal" v-model="isOpenRecoverBorrowerModal" @click.stop />
        </div>
    </div>
</template>