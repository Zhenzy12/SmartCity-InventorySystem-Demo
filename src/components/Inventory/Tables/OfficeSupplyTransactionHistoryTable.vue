<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import IncreaseSupplyQty from '../Modals/IncreaseSupplyQty.vue';
import { ClAddPlus } from '@kalimahapps/vue-icons';
import UpdateSelectedSupply from '../Modals/UpdateSelectedSupply.vue';

const props = defineProps({
    selectedItem: Object,
    transactionItems: Object,
    transactionHistory: Object,
    users: Object,
    officeList: Object,
    borrowers: Object,
})


const isOpenIncreaseSupplyQtyModal = ref(false);

const OpenIncreaseSupplyQtyModal = () => {
    isOpenIncreaseSupplyQtyModal.value = true;
}

const searchQuery = ref("");

// Add after the searchQuery ref
const officeSearchQuery = ref("");
const officeFilter = ref(false);
const officeButtonRef = ref(null);
const officeMenuRef = ref(null);

// Create a ref instead of computed for office items
const officeFilterItems = ref([]);

// Initialize the office items in onMounted
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    // Initialize office filter items
    officeFilterItems.value = props.officeList.map(office => ({
        id: office.id,
        type: office.office_name,
        isActive: true
    }));
});

const filteredOfficeDropdown = computed(() => {
    if (!officeSearchQuery.value) return officeFilterItems.value;
    const searchTerm = officeSearchQuery.value.toLowerCase();
    return officeFilterItems.value.filter(item =>
        item.type.toLowerCase().includes(searchTerm)
    );
});

// Add filter methods
const toggleOfficeFilter = () => {
    officeFilter.value = !officeFilter.value;
};

const handleOfficeCheckboxChange = (id, event) => {
    event.stopPropagation();
    const item = officeFilterItems.value.find((item) => item.id === id);
    if (item) {
        item.isActive = !item.isActive;
    }
};

const handleClickOutside = (event) => {
    if (
        officeFilter.value &&
        !officeButtonRef.value?.contains(event.target) &&
        !officeMenuRef.value?.contains(event.target)
    ) {
        officeFilter.value = false;
    }
};

const filteredTransactionItems = computed(() => {
    const searchTerm = searchQuery.value.toLowerCase();
    const activeOffices = officeFilterItems.value
        .filter(item => item.isActive)
        .map(item => item.id);

    return props.transactionItems
        .filter(item =>
            item.item_type === "Equipment Copy" && item.item_copy_id === props.selectedItem.id
        )
        .filter(item => {
            // Get related transaction
            const transaction = props.transactionHistory.find(t => t.id === item.transaction_id);
            if (!transaction) return false;

            // Get borrower and office info
            const borrower = props.borrowers.find(u => u.id === transaction.borrower_id);
            const office = props.officeList.find(o => o.id === borrower?.office_id);

            // Filter by office
            if (!activeOffices.includes(office?.id)) return false;

            // Search fields
            const id = item.id.toString();
            const borrowerName = borrower?.borrowers_name || '';
            const officeName = office?.office_name || '';
            const lender = props.users.find(u => u.id === transaction.lender_id);
            const lenderName = lender?.firstName || '';

            // Return true if any field matches the search term
            return id.includes(searchTerm) ||
                borrowerName.toLowerCase().includes(searchTerm) ||
                officeName.toLowerCase().includes(searchTerm) ||
                lenderName.toLowerCase().includes(searchTerm);
        })
        .reverse();
});

// Reset to first page when searching
watch(searchQuery, () => {
    currentPage.value = 1;
});

const formatDate = (dateString) => {
    if (!dateString) return "N/A"; // Handle null values
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(5);

// Compute total pages based on filtered transactions
const totalPages = computed(() => {
    return Math.ceil(filteredTransactionItems.value.length / itemsPerPage.value);
});

// Get paginated transactions
const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;

    return filteredTransactionItems.value.slice(start, end);
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

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

</script>

<template>
    <div class="overflow-x-auto ">
        <div class="flex flex-row items-center p-4">
            <!-- Search Box -->
            <div class="w-4/5">
                <form class="flex items-center" @submit.prevent>
                    <label for="simple-search" class="sr-only">Search</label>
                    <div class="relative w-full">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor"
                                viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <input v-model="searchQuery" type="text" id="simple-search"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Search supply transaction..." />
                    </div>
                </form>
            </div>
            <div class="relative ml-2 flex justify-end w-full md:w-1/5">
        <button @click="toggleOfficeFilter" ref="officeButtonRef"
            class="flex justify-between gap-1 border items-center rounded-lg px-6 py-2 text-base font-medium border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white dark:border-gray-600">
            <span class="material-icons">filter_alt</span>
            Filter Offices
            <span class="material-icons ml-1">arrow_drop_down</span>
        </button>
        <div v-show="officeFilter" ref="officeMenuRef"
            class="shadow-1 dark:shadow-box-dark absolute right-0 border border-gray-500 w-48 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all">
            <!-- Add search input for offices -->
            <div class="relative mb-2">
                <input type="text" v-model="officeSearchQuery"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Search offices...">
            </div>
            <!-- Filtered office list -->
            <div class="max-h-60 overflow-auto">
                <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
                    v-for="item in filteredOfficeDropdown" :key="item.id">
                    <div class="relative">
                        <input type="checkbox" class="sr-only" :checked="item.isActive"
                            @change="handleOfficeCheckboxChange(item.id, $event)" />
                        <div class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                            <span :class="{ 'opacity-100': item.isActive, 'opacity-0': !item.isActive }">
                                <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                                        fill="#3056D3" stroke="#3056D3" strokeWidth="0.4"></path>
                                </svg>
                            </span>
                        </div>
                    </div>
                    {{ item.type }}
                </label>
            </div>
        </div>
    </div>
        </div>
        <table class="w-full border-collapse text-sm text-gray-300">
            <thead>
                <tr class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-center text-xs rounded-lg">
                    <th class="px-4 py-2 border-b border-gray-600">ID</th>
                    <th class="px-4 py-2 border-b border-gray-600">Borrower</th>
                    <th class="px-4 py-2 border-b border-gray-600">Office</th>
                    <th class="px-4 py-2 border-b border-gray-600">Lender</th>
                    <th class="px-4 py-2 border-b border-gray-600">Return Date & Time</th>
                    <th class="px-4 py-2 border-b border-gray-600">Borrow Date & Time</th>
                    <th class="px-4 py-2 border-b border-gray-600">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="paginatedTransactions.length === 0" class="border-b dark:border-gray-700">
                    <td colspan="6" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                        No Transaction found
                    </td>
                </tr>
                <tr v-for="transactionItem in paginatedTransactions" :key="transactionItem.id"
                    class="border-b font-medium border-gray-400 dark:border-gray-700 text-gray-600 dark:text-gray-300 odd:bg-gray-300 odd:dark:bg-gray-900 even:bg-gray-100 even:dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                    <td class="px-4 py-3 border-b border-gray-700">{{ transactionItem.id }}</td>
                    <td class="px-4 py-3 border-b border-gray-700">
                        {{borrowers.find(u => u.id === transactionHistory.find(t => t.id ===
                            transactionItem.transaction_id)?.borrower_id)?.borrowers_name || 'N/A'}}
                    </td>
                    <td class="px-4 py-3 border-b border-gray-700">
                        {{officeList.find(o => o.id === borrowers.find(u => u.id === transactionHistory.find(t => t.id
                            === transactionItem.transaction_id).borrower_id).office_id)?.office_name || 'N/A'}}
                    </td>
                    <td class="px-4 py-3 border-b border-gray-700">
                        {{users.find(u => u.id === transactionHistory.find(t => t.id ===
                            transactionItem.transaction_id)?.lender_id)?.firstName || 'N/A'}}
                    </td>
                    <td class="px-4 py-3 border-b border-gray-700">
                        {{ formatDate(transactionHistory?.returned_date) ?? 'N/A' }}
                    </td>
                    <td class="px-4 py-3 border-b border-gray-700">
                        {{formatDate(transactionHistory.find(t => t.id ===
                            transactionItem.transaction_id)?.borrow_date) || 'N/A'}}
                    </td>
                    <td class="px-4 py-3 border-b border-gray-700">...</td>
                </tr>
            </tbody>
        </table>
        <nav v-if="paginatedTransactions.length > 0"
            class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
            aria-label="Table navigation">
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                Showing
                <span class="font-semibold text-gray-900 dark:text-white">
                    {{ (currentPage - 1) * itemsPerPage + 1 }} -
                    {{ Math.min(currentPage * itemsPerPage, filteredTransactionItems.length) }}
                </span>
                of
                <span class="font-semibold text-gray-900 dark:text-white">{{ filteredTransactionItems.length }}</span>
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

        <IncreaseSupplyQty v-if="isOpenIncreaseSupplyQtyModal" v-model="isOpenIncreaseSupplyQtyModal"
            :selectedItems="selectedItem" @click.stop />
    </div>
</template>