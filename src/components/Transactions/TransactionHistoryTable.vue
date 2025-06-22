<script setup>
import { onMounted, onUnmounted, ref, computed, watch, toRaw } from "vue";
import UpdateModal from "./Modal/UpdateTransactionModal.vue";
import DeleteModal from "./Modal/DeleteTransactionModal.vue";
import { ChMenuMeatball } from "@kalimahapps/vue-icons";
import { IcSolidFilter } from '@kalimahapps/vue-icons';
import { MdOutlinedArrowDropDown } from '@kalimahapps/vue-icons';
import { BsCheck } from '@kalimahapps/vue-icons';
import { BsX } from '@kalimahapps/vue-icons';
import { AkPlus } from '@kalimahapps/vue-icons';
import CreateTransactionModal from './Modal/CreateTransactionModal.vue';
import baguioLogo from '../../assets/baguio-logo.png';
import { AnFilledPrinter } from '@kalimahapps/vue-icons';
import TableHeaderFormat from '../TableHeaderFormat.vue';
import { ClAddPlus } from '@kalimahapps/vue-icons';

const API_KEY = import.meta.env.VITE_API_KEY;

const officeSupplies = ref([]);

const searchQuery = ref("");

const selectedTransaction = ref(null);

const isUpdateModalOpen = ref(false);

// FETCH DATA FROM PROPS
const props = defineProps({
  transactionItems: Array,
  transactionHistory: Array,
  officeEquipments: Array,
  officeSupplies: Array,
  officeList: Array,
  users: Array,
  borrowers: Array,
  equipmentCopies: Array,
  categoryList: Array,
  selectedDateRange: Object,
  filterBorrowerId: String,
  filterLenderId: String,
  filterOfficeId: String
})

watch(() => props.selectedDateRange, () => {
  console.log("🚀 ~ watch ~ props.transactionHistory:", props.transactionHistory)
  console.log("🚀 ~ watch ~ props.selectedDateRange.start:", props.selectedDateRange.start)
  console.log("🚀 ~ watch ~ props.selectedDateRange.end:", props.selectedDateRange.end)
})

const openUpdateModal = (transaction) => {
  console.log("🚀 ~ openUpdateModal ~ transaction:", transaction)
  const lender =
    props.users?.find((user) => user.id === transaction.lender_id)
      ?.firstName || "Unknown";

  selectedTransaction.value = {
    ...transaction,
    lenderName: lender, // Add lender name
  };

  isUpdateModalOpen.value = true;
};

const isDeleteModalOpen = ref(false);

const openDeleteModal = (transaction) => {
  const lender =
    props.users?.find((user) => user.id === transaction.lender_id)
      ?.firstName || "Unknown";

  selectedTransaction.value = {
    ...transaction,
    lenderName: lender, // Add lender name
  };

  isDeleteModalOpen.value = true;
  console.log("🚀 ~ openDeleteModal ~ isDeleteModalOpen:", isDeleteModalOpen.value);
};

const filteredTransactions = computed(() => {
  if (!props.transactionHistory || !props.selectedDateRange.start || !props.selectedDateRange.end) return [];

  const startDate = new Date(props.selectedDateRange.start);
  const endDate = new Date(props.selectedDateRange.end);

  endDate.setHours(23, 59, 59, 999);
  startDate.setHours(0, 0, 0, 0);

  // Get active office IDs
  const activeOfficeIds = officeDropDownItems.value
    .filter(item => item.isActive)
    .map(item => item.id);

  const activeBorrowerIds = borrowerDropDownItems.value
    .filter(item => item.isActive)
    .map(item => item.id);

  const activeLenderIds = userDropDownItems.value
    .filter(item => item.isActive)
    .map(item => item.id);

  const activeReturnStatuses = returnStatusDropDownItems.value
    .filter(item => item.isActive)
    .map(item => item.id);

  const activeIcsIds = icsDropDownItems.value
    .filter(item => item.isActive)
    .map(item => item.id);

  return props.transactionHistory.filter(transaction => {
    const borrowDate = new Date(transaction.borrow_date);

    if (borrowDate < startDate || borrowDate > endDate) {
      return false;
    }

    if (transaction.is_deleted) return false;

    const searchTerm = searchQuery.value.toLowerCase();
    const borrower = props.borrowers?.find((b) => b.id === transaction.borrower_id);
    const borrowerOfficeId = borrower?.office_id;

    // If there are active filters, check if the transaction's office is in the active list
    if (activeOfficeIds.length > 0 && !activeOfficeIds.includes(borrowerOfficeId)) {
      return false;
    }

    if (activeBorrowerIds.length > 0 && !activeBorrowerIds.includes(transaction.borrower_id)) {
      return false;
    }

    if (activeLenderIds.length > 0 && !activeLenderIds.includes(transaction.lender_id)) {
      return false;
    }

    if (activeIcsIds.length > 0 && !activeIcsIds.includes(transaction.id)) {
      return false;
    }

    if (activeReturnStatuses.length > 0) {
      const hasReturnDate = !!transaction.return_date;
      const isReturned = activeReturnStatuses.includes('returned') && hasReturnDate;
      const isNotReturned = activeReturnStatuses.includes('not_returned') && !hasReturnDate;

      if (!isReturned && !isNotReturned) {
        return false;
      }
    }

    const borrowerName = borrower?.borrowers_name?.toLowerCase() || "";
    const transactionId = transaction.id?.toString().toLowerCase() || "";
    const lender = props.users?.find((user) => user.id === transaction.lender_id)?.firstName?.toLowerCase() || "";
    const returnDate = transaction.return_date?.toLowerCase() || "";
    const borrowDateStr = transaction.borrow_date?.toLowerCase() || "";

    // Fetch transaction items
    const selectedTransactionItems = props.transactionItems?.filter(item => item.transaction_id === transaction.id) || [];
    if (!selectedTransactionItems.length) return false;

    const itemsMatch = selectedTransactionItems.some(item => {
      if (item.item_type === 'Office Supply') {
        const supplyName = props.officeSupplies.find(
          (supply) => Number(supply.id) === Number(item.item_copy_id)
        )?.supply_name?.toLowerCase() || "";
        return supplyName.includes(searchTerm);
      } else if (item.item_type === 'Equipment Copy') {
        const equipmentName = props.officeEquipments.find(
          (equipment) =>
            Number(equipment.id) ===
            Number(
              props.equipmentCopies.find(
                (equipment_copy) =>
                  Number(equipment_copy.id) === Number(item.item_copy_id)
              )?.item_id
            )
        )?.equipment_name?.toLowerCase() || "";

        const equipmentId = props.equipmentCopies.find(
          (equipment_copy) => Number(equipment_copy.id) === Number(item.item_copy_id)
        )?.item_id?.toString()?.toLowerCase() || "";

        return equipmentName.includes(searchTerm) || equipmentId.includes(searchTerm);
      }
      return false;
    });

    return (
      borrowerName.includes(searchTerm) ||
      transactionId.includes(searchTerm) ||
      lender.includes(searchTerm) ||
      returnDate.includes(searchTerm) ||
      borrowDateStr.includes(searchTerm) ||
      itemsMatch
    );
  });
});

// filters dropdown with search

const borrowerSearchQuery = ref("");
const officeSearchQuery = ref("");
const lenderSearchQuery = ref("");
const icsSearchQuery = ref("");
const returnStatusSearchQuery = ref("");

const filteredBorrowerDropdown = computed(() => {
  if (!borrowerSearchQuery.value) return borrowerDropDownItems.value;
  const searchTerm = borrowerSearchQuery.value.toLowerCase();
  return borrowerDropDownItems.value.filter(item =>
    item.type.toLowerCase().includes(searchTerm)
  );
});

const filteredOfficeDropdown = computed(() => {
  if (!officeSearchQuery.value) return officeDropDownItems.value;
  const searchTerm = officeSearchQuery.value.toLowerCase();
  return officeDropDownItems.value.filter(item =>
    item.type.toLowerCase().includes(searchTerm)
  );
});

const filteredLenderDropdown = computed(() => {
  if (!lenderSearchQuery.value) return userDropDownItems.value;
  const searchTerm = lenderSearchQuery.value.toLowerCase();
  return userDropDownItems.value.filter(item =>
    item.type.toLowerCase().includes(searchTerm)
  );
});

const filteredIcsDropdown = computed(() => {
  if (!icsSearchQuery.value) return icsDropDownItems.value;
  const searchTerm = icsSearchQuery.value.toLowerCase();
  return icsDropDownItems.value.filter(item =>
    item.type.toLowerCase().includes(searchTerm)
  );
});

const filteredReturnStatusDropdown = computed(() => {
  if (!returnStatusSearchQuery.value) return returnStatusDropDownItems.value;
  const searchTerm = returnStatusSearchQuery.value.toLowerCase();
  return returnStatusDropDownItems.value.filter(item =>
    item.type.toLowerCase().includes(searchTerm)
  );
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(7);

// Compute total pages based on filtered transactions
const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage.value);
});

const sortedTransactions = computed(() => {
  const transactions = [...filteredTransactions.value];

  return transactions.sort((a, b) => {
    const getFieldValue = (transaction, field) => {
      switch (field) {
        case 'id':
          return transaction.id;

        case 'borrower':
          return props.borrowers.find(b => b.id === transaction.borrower_id)?.borrowers_name?.toLowerCase() || '';

        case 'borrow_date':
          return new Date(transaction.borrow_date);

        case 'return_date':
          return transaction.return_date ? new Date(transaction.return_date) : new Date(0);

        case 'lender':
          return props.users.find(u => u.id === transaction.lender_id)?.firstName?.toLowerCase() || '';

        case 'isc':
          return transaction.isc;

        case 'office':
          const borrower = props.borrowers.find(b => b.id === transaction.borrower_id);
          return props.officeList.find(o => o.id === borrower?.office_id)?.office_name?.toLowerCase() || '';

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

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return sortedTransactions.value.slice(start, end);
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

// Reset to first page when searching
watch(searchQuery, () => {
  currentPage.value = 1;
});

const openDropdownId = ref(null);

const dropdownRefs = ref([]);


onMounted(() => {
  officeDropDownItems.value = props.officeList.map((office) => ({
    id: office.id,
    type: office.office_name,
    isActive: Number(props.filterOfficeId) === Number(office.id), // true if it matches
  }));

  borrowerDropDownItems.value = props.borrowers.map((borrower) => ({
    id: borrower.id,
    type: borrower.borrowers_name,
    isActive: Number(props.filterBorrowerId) === Number(borrower.id), // true if it matches
  }));

  icsDropDownItems.value = props.transactionHistory.map((transaction) => ({
    id: transaction.id,
    type: transaction.isc,
    isActive: false, // true if it matches
  }));
});

const toggleDropdown = (transactionId) => {
  openDropdownId.value = openDropdownId.value === transactionId ? null : transactionId;
};

const officeDropDownFilter = ref(false);
const officeDropDownButtonRef = ref(null);
const officeDropDownMenuRef = ref(null); // Reference to officeDropDown menu


const officeDropDownItems = ref([]);


const resetOfficeFilters = () => {
  officeDropDownItems.value = props.officeList.map((office) => ({
    id: office.id,
    type: office.office_name,
    isActive: false, // Set initial state to false
  }));
};

const toggleOfficeDropDown = () => {
  // if (!officeDropDownFilter.value) {
  //   resetOfficeFilters(); // Reset when opening the dropdown
  // }
  officeDropDownFilter.value = !officeDropDownFilter.value;
};

// Function to handle checkbox toggle
const handleCheckboxChange = (id, event) => {
  event.stopPropagation(); // Prevent event from closing the officeDropDown
  const item = officeDropDownItems.value.find((item) => item.id === id);
  if (item) {
    item.isActive = !item.isActive;
  }
};

// Custom function to handle click outside
const handleClickOutside = (event) => {
  if (
    officeDropDownButtonRef.value &&
    !officeDropDownButtonRef.value.contains(event.target) &&
    officeDropDownMenuRef.value &&
    !officeDropDownMenuRef.value.contains(event.target)
  ) {
    officeDropDownFilter.value = false;
  }
  openDropdownId.value = null;
};

// dropdown borrowers
const borrowerDropDownItems = ref([]);
const borrowerDropDownFilter = ref(false);
const borrowerDropDownButtonRef = ref(null);
const borrowerDropDownMenuRef = ref(null);

const resetBorrowerFilters = () => {
  borrowerDropDownItems.value = props.borrowers.map((borrower) => ({
    id: borrower.id,
    type: borrower.borrowers_name,
    isActive: false, // Set initial state to false
  }));
};

const toggleborrowerDropDown = () => {
  // if (!borrowerDropDownFilter.value) {
  //   resetBorrowerFilters(); // Reset when opening the dropdown
  // }
  borrowerDropDownFilter.value = !borrowerDropDownFilter.value;
};

// Function to handle checkbox toggle
const handleCheckboxChangeBorrower = (id, event) => {
  event.stopPropagation(); // Prevent event from closing the officeDropDown
  const item = borrowerDropDownItems.value.find((item) => item.id === id);
  if (item) {
    item.isActive = !item.isActive;
  }
};

// Custom function to handle click outside
const handleClickOutsideBorrowers = (event) => {
  if (
    borrowerDropDownButtonRef.value &&
    !borrowerDropDownButtonRef.value.contains(event.target) &&
    borrowerDropDownMenuRef.value &&
    !borrowerDropDownMenuRef.value.contains(event.target)
  ) {
    borrowerDropDownFilter.value = false;
  }
  openDropdownId.value = null;
};

// dropdown borrowers
const userDropDownItems = ref([]);
const userDropDownFilter = ref(false);
const userDropDownButtonRef = ref(null);
const userDropDownMenuRef = ref(null);

onMounted(() => {
  userDropDownItems.value = props.users.map((user) => ({
    id: user.id,
    type: `${user.firstName} ${user.lastName || ''}`.trim(),
    isActive: Number(props.filterLenderId) === Number(user.id), // Set initial state to false
  }));
});

const resetUserFilters = () => {
  userDropDownItems.value = props.users.map((user) => ({
    id: user.id,
    type: `${user.firstName} ${user.lastName || ''}`.trim(),
    isActive: false, // Set initial state to false
  }));
};

const toggleuserDropDown = () => {
  // if (!userDropDownFilter.value) {
  //   resetUserFilters(); // Reset when opening the dropdown
  // }
  userDropDownFilter.value = !userDropDownFilter.value;
};

// Function to handle checkbox toggle
const handleCheckboxChangeUser = (id, event) => {
  event.stopPropagation(); // Prevent event from closing the officeDropDown
  const item = userDropDownItems.value.find((item) => item.id === id);
  if (item) {
    item.isActive = !item.isActive;
  }
};

// Custom function to handle click outside
const handleClickOutsideUsers = (event) => {
  if (
    userDropDownButtonRef.value &&
    !userDropDownButtonRef.value.contains(event.target) &&
    userDropDownMenuRef.value &&
    !userDropDownMenuRef.value.contains(event.target)
  ) {
    userDropDownFilter.value = false;
  }
  openDropdownId.value = null;
};

// Return status dropdown
const returnStatusDropDownItems = ref([
  { id: 'returned', type: 'Returned', isActive: false },
  { id: 'not_returned', type: 'Not Returned', isActive: false }
]);
const returnStatusDropDownFilter = ref(false);
const returnStatusDropDownButtonRef = ref(null);
const returnStatusDropDownMenuRef = ref(null);

const resetReturnStatusFilters = () => {
  returnStatusDropDownItems.value = [
    { id: 'returned', type: 'Returned', isActive: false },
    { id: 'not_returned', type: 'Not Returned', isActive: false }
  ];
};

const toggleReturnStatusDropDown = () => {
  // if (!returnStatusDropDownFilter.value) {
  //   resetReturnStatusFilters(); // Reset when opening the dropdown
  // }
  returnStatusDropDownFilter.value = !returnStatusDropDownFilter.value;
};

// Function to handle checkbox toggle
const handleCheckboxChangeReturnStatus = (id, event) => {
  event.stopPropagation(); // Prevent event from closing the dropdown
  const item = returnStatusDropDownItems.value.find((item) => item.id === id);
  if (item) {
    item.isActive = !item.isActive;
  }
};

// Custom function to handle click outside
const handleClickOutsideReturnStatus = (event) => {
  if (
    returnStatusDropDownButtonRef.value &&
    !returnStatusDropDownButtonRef.value.contains(event.target) &&
    returnStatusDropDownMenuRef.value &&
    !returnStatusDropDownMenuRef.value.contains(event.target)
  ) {
    returnStatusDropDownFilter.value = false;
  }
  openDropdownId.value = null;
};

// dropdown borrowers
const icsDropDownItems = ref([]);
const icsDropDownFilter = ref(false);
const icsDropDownButtonRef = ref(null);
const icsDropDownMenuRef = ref(null);

const resetIcsFilters = () => {
  // Filter out unique isc values
  const uniqueIcs = Array.from(
    new Set(props.transactionHistory.map((ics) => ics.isc))
  );

  // Map the unique isc values to the drop-down items
  icsDropDownItems.value = uniqueIcs.map((isc) => ({
    id: props.transactionHistory.find((ics) => ics.isc === isc).id, // Get the first matching transaction id
    type: isc,
    isActive: false, // Set initial state to false
  }));
};

const toggleicsDropDown = () => {
  // if (!icsDropDownFilter.value) {
  //   resetIcsFilters(); // Reset when opening the dropdown
  // }
  icsDropDownFilter.value = !icsDropDownFilter.value;
};

// Function to handle checkbox toggle
const handleCheckboxChangeIcs = (id, event) => {
  event.stopPropagation(); // Prevent event from closing the officeDropDown
  const item = icsDropDownItems.value.find((item) => item.id === id);
  if (item) {
    item.isActive = !item.isActive;
  }
};

// Custom function to handle click outside
const handleClickOutsideIcs = (event) => {
  if (
    icsDropDownButtonRef.value &&
    !icsDropDownButtonRef.value.contains(event.target) &&
    icsDropDownMenuRef.value &&
    !icsDropDownMenuRef.value.contains(event.target)
  ) {
    icsDropDownFilter.value = false;
  }
  openDropdownId.value = null;
};

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

onMounted(() => {
  document.addEventListener("click", handleClickOutside);

  document.addEventListener("click", handleClickOutsideBorrowers);

  document.addEventListener("click", handleClickOutsideUsers);

  document.addEventListener("click", handleClickOutsideIcs);

  document.addEventListener("click", handleClickOutsideReturnStatus);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);

  document.removeEventListener("click", handleClickOutsideBorrowers);

  document.removeEventListener("click", handleClickOutsideUsers);

  document.removeEventListener("click", handleClickOutsideIcs);

  document.removeEventListener("click", handleClickOutsideReturnStatus);
});


// FOR CREATE TRANSACTION MODAL
const isOpenCreateTransactionModal = ref(false);

const OpenCreateTransactionModal = () => {
  isOpenCreateTransactionModal.value = true;
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
            <title>Printed Transactions Reports</title>
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
                <h1>Transaction Management - Printed Report</h1>
                <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Borrower</th>
                        <th>Office</th>
                        <th>Lender</th>
                        <th>ISC/AREE</th>
                        <th>Item</th>
                        <th>Return Date</th>
                        <th>Borrow Date</th>
                    </tr>
                </thead>
                <tbody>
    ${filteredTransactions.value.map(report => `
        <tr>
            <td>${report.id}</td>
            <td>${props.borrowers.find(b => b.id === report.borrower_id)?.borrowers_name || 'Unknown'}</td>
            <td>${props.officeList.find(o => o.id === props.borrowers.find(b => b.id === report.borrower_id)?.office_id)?.office_name || 'Unknown'}</td>
            <td>${(props.users.find(u => u.id === report.lender_id)?.firstName || '') + ' ' + (props.users.find(u => u.id === report.lender_id)?.lastName || 'Unknown')}</td>
            <td>${report.isc || 'No data found'}</td>
            <td>${props.transactionItems
      .filter(item => item.transaction_id === report.id)
      .map(item => {
        if (item.item_type === 'Office Supply') {
          return props.officeSupplies.find(supply => supply.id === item.item_copy_id)?.supply_name || 'Unknown Supply';
        } else if (item.item_type === 'Equipment Copy') {
          const equipment = props.officeEquipments.find(eq =>
            eq.id === props.equipmentCopies.find(ec =>
              ec.id === item.item_copy_id
            )?.item_id
          );
          const copyNum = props.equipmentCopies.find(ec =>
            ec.id === item.item_copy_id
          )?.copy_num;
          return `${equipment?.equipment_name || 'Unknown Equipment'} #${copyNum || ''}`;
        }
        return '';
      }).join(', ')}</td>
            <td>${report.return_date ? new Date(report.return_date).toLocaleString() : 'Not yet returned'}</td>
            <td>${new Date(report.borrow_date).toLocaleString()}</td>
        </tr>
    `).join('')}
</tbody>
            </table>
            <div class="print-footer">
                <p>Total Transactions: ${filteredTransactions.value.length}</p>
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
</script>

<template>
  <div class="w-full">
    <section class="w-full">
      <div
        class="shadow-lg rounded-lg">
        <div class="relative shadow-md sm:rounded-lg overflow-hidden">
          
          <!-- First Row Search and Buttons -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-2 items-center justify-between md:space-y-0 md:space-x-4 py-2">
                <!-- Search Box -->
                <div class="col-span-2 lg:col-span-3 w-full">
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
                                placeholder="Search transactions..." />
                        </div>
                    </form>
                </div>
                <!-- ADD BUTTON -->
                <button @click.stop="OpenCreateTransactionModal()"
    class="col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
    <ClAddPlus class="w-5 h-5 md:w-8 md:h-8" />
    <p class="ml-1 text-xs md:text-base">New Transaction</p>
</button>
                <button @click="handlePrint"
                    class="col-span-1 lg:col-span-1 w-full h-full flex items-center justify-center border px-2 py-1 rounded-lg button-default-green">
                    <AnFilledPrinter class="w-5 h-5 md:w-8 md:h-8" />
                    <p class="ml-1 text-xs md:text-base">Print Transaction</p>
                </button>
            </div>

          <!-- Second Row Filters -->
          <div class="grid grid-cols-6 lg:grid-cols-5 w-full justify-evenly gap-2 mb-2">
            <!--BORROWER DROPDOWN -->
            <div class="col-span-2 lg:col-span-1 relative w-full h-full text-left">
              <button @click="toggleborrowerDropDown" ref="borrowerDropDownButtonRef"
                class="flex justify-center border w-full h-full items-center rounded-lg p-1 font-medium text-xs sm:text-sm md:text-base border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <IcSolidFilter class="w-5 h-5 mr-1" />
                Borrower Filter
                <MdOutlinedArrowDropDown class="w-5 h-5" />
              </button>
              <div v-show="borrowerDropDownFilter" ref="borrowerDropDownMenuRef"
                class="shadow-1 dark:shadow-box-dark absolute border border-gray-500 w-full right-0 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all">
                <div class="relative mb-2">
                  <input type="text" v-model="borrowerSearchQuery"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Search borrowers...">
                </div>
                <div class="max-h-60 overflow-auto">

                  <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
                    v-for="item in filteredBorrowerDropdown" :key="item.id">
                    <div class="relative">
                      <input type="checkbox" class="sr-only" :checked="item.isActive"
                        @change="handleCheckboxChangeBorrower(item.id, $event)" />
                      <div
                        class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                        <span :class="{ 'opacity-100': item.isActive, 'opacity-0': !item.isActive }">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
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

            <!--OFFICE DROPDOWN -->
            <div class="col-span-2 lg:col-span-1 relative w-full h-full text-left">
              <button @click="toggleOfficeDropDown" ref="officeDropDownButtonRef"
                class="flex justify-center border w-full h-full items-center rounded-lg p-1 font-medium text-xs sm:text-sm md:text-base border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <IcSolidFilter class="w-5 h-5 mr-1" />
                Office Filter
                <MdOutlinedArrowDropDown class="w-5 h-5" />
              </button>
              <div v-show="officeDropDownFilter" ref="officeDropDownMenuRef"
                class="shadow-1 dark:shadow-box-dark absolute border border-gray-500 w-full right-0 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all">
                <div class="relative mb-2">
                  <input type="text" v-model="officeSearchQuery"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Search offices...">
                </div>
                <div class="max-h-60 overflow-auto">
                  <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
                    v-for="item in filteredOfficeDropdown" :key="item.id">
                    <div class="relative">
                      <input type="checkbox" class="sr-only" :checked="item.isActive"
                        @change="handleCheckboxChange(item.id, $event)" />
                      <div
                        class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                        <span :class="{ 'opacity-100': item.isActive, 'opacity-0': !item.isActive }">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
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

            <!--LENDER DROPDOWN -->
            <div class="col-span-2 lg:col-span-1 relative w-full h-full text-left">
              <button @click="toggleuserDropDown" ref="userDropDownButtonRef"
                class="flex justify-center border w-full h-full items-center rounded-lg p-1 font-medium text-xs sm:text-sm md:text-base border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <IcSolidFilter class="w-5 h-5 mr-1" />
                Lender Filter
                <MdOutlinedArrowDropDown class="w-5 h-5" />
              </button>
              <div v-show="userDropDownFilter" ref="userDropDownMenuRef"
                class="shadow-1 dark:shadow-box-dark absolute border border-gray-500 w-full right-0 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all">
                <div class="relative mb-2">
                  <input type="text" v-model="lenderSearchQuery"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Search lenders...">
                </div>
                <div class="max-h-60 overflow-auto">
                  <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
                    v-for="item in filteredLenderDropdown" :key="item.id">
                    <div class="relative">
                      <input type="checkbox" class="sr-only" :checked="item.isActive"
                        @change="handleCheckboxChangeUser(item.id, $event)" />
                      <div
                        class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                        <span :class="{ 'opacity-100': item.isActive, 'opacity-0': !item.isActive }">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
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

            <!--ICS DROPDOWN -->
            <div class="col-start-2 col-span-2 lg:col-span-1 relative w-full h-full text-left">
              <button @click="toggleicsDropDown" ref="icsDropDownButtonRef"
                class="flex justify-center border w-full h-full items-center rounded-lg p-1 font-medium text-xs sm:text-sm md:text-base border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <IcSolidFilter class="w-5 h-5 mr-1" />
                ICS Filter
                <MdOutlinedArrowDropDown class="w-5 h-5" />
              </button>
              <div v-show="icsDropDownFilter" ref="icsDropDownMenuRef"
                class="shadow-1 dark:shadow-box-dark absolute border border-gray-500 w-full right-0 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all">
                <div class="relative mb-2">
                  <input type="text" v-model="icsSearchQuery"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Search ics...">
                </div>
                <div class="max-h-60 overflow-auto">
                  <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
                    v-for="item in filteredIcsDropdown" :key="item.id">
                    <div class="relative">
                      <input type="checkbox" class="sr-only" :checked="item.isActive"
                        @change="handleCheckboxChangeIcs(item.id, $event)" />
                      <div
                        class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                        <span :class="{ 'opacity-100': item.isActive, 'opacity-0': !item.isActive }">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
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

            <!--RETURN STATUS DROPDOWN -->
            <div class="col-span-2 lg:col-span-1 relative w-full h-full text-left">
              <button @click="toggleReturnStatusDropDown" ref="returnStatusDropDownButtonRef"
                class="flex justify-center border w-full h-full items-center rounded-lg p-1 font-medium text-xs sm:text-sm md:text-base border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <IcSolidFilter class="w-5 h-5 mr-1" />
                Return Status
                <MdOutlinedArrowDropDown class="w-5 h-5" />
              </button>
              <div v-show="returnStatusDropDownFilter" ref="returnStatusDropDownMenuRef"
                class="shadow-1 dark:shadow-box-dark absolute border border-gray-500 w-full right-0 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all">
                <div class="relative mb-2">
                  <input type="text" v-model="returnStatusSearchQuery"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Search return status...">
                </div>
                <div class="max-h-60 overflow-auto">
                  <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
                    v-for="item in filteredReturnStatusDropdown" :key="item.id">
                    <div class="relative">
                      <input type="checkbox" class="sr-only" :checked="item.isActive"
                        @change="handleCheckboxChangeReturnStatus(item.id, $event)" />
                      <div
                        class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                        <span :class="{ 'opacity-100': item.isActive, 'opacity-0': !item.isActive }">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
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

          <!-- Table -->
          <div class="rounded-lg min-h-[49vh] max-h-[50vh] md:max-h-[53vh] xl:min-h-[57vh] xl:max-h-[58vh] 2xl:xl:max-h-[70vh] overflow-auto [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-gray-200 dark:bg-gray-900">
                <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
                    <thead class=" sticky top-0 z-10">
                <tr class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-center text-xs rounded-lg">
                  <th class="py-3 px-2 cursor-pointer" @click="sortByField('id')">
                                <TableHeaderFormat label="ID" field="id" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-40 cursor-pointer" @click="sortByField('borrower')">
                                <TableHeaderFormat label="Borrower" field="borrower" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-50 cursor-pointer" @click="sortByField('office')">
                                <TableHeaderFormat label="Office" field="office" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-40 cursor-pointer" @click="sortByField('lender')">
                                <TableHeaderFormat label="Lender" field="lender" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-40 cursor-pointer" @click="sortByField('isc')">
                                <TableHeaderFormat label="ICS/ARE" field="isc" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-50">Item/s</th>
                  <th class="py-3 px-2 min-w-30 cursor-pointer" @click="sortByField('return_date')">
                                <TableHeaderFormat label="Return Date" field="return_date" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-30 cursor-pointer" @click="sortByField('borrow_date')">
                                <TableHeaderFormat label="Borrow Date" field="borrow_date" :sortBy="sortBy"
                                    :sortDirection="sortDirection" />
                            </th>
                  <th class="py-3 px-2 min-w-20">Actions</th>
                </tr>
              </thead>

              <tbody class="">
                <template v-if="paginatedTransactions.length">
                  <tr
                    class="border-b font-medium text-xs md:text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300 odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    v-for="transaction in paginatedTransactions" :key="transaction.id">
                    <th scope="row" class="px-4 py-3 whitespace-nowrap ">
                      {{ transaction.id }}
                    </th>
                    <td class="px-4 py-3">
                      {{props.borrowers.find(borrower => Number(borrower.id) ===
                        Number(transaction.borrower_id))?.borrowers_name || 'Unknown First Name'}}
                    </td>
                    <td class="px-4 py-3">
                      {{props.officeList.find(office => Number(office.id) ===
                        (Number(props.borrowers.find(borrower => Number(borrower.id) ===
                          Number(transaction.borrower_id))?.office_id)))?.office_name || 'Unknown Office'}}
                    </td>
                    <td class="px-4 py-3">
                      {{
                        (props.users?.find(user => user.id === transaction.lender_id)?.firstName || '') +
                        " " +
                        (props.users?.find(user => user.id === transaction.lender_id)?.lastName || 'No data found')
                      }}
                    </td>
                    <td class="px-4 py-3">
                      {{ transaction.isc || 'No data found' }}
                    </td>
                    <td>
                      <ul>
                        <li v-for="item in props.transactionItems" :key="item.id"
                          class="flex flex-row pl-2 justify-start items-center font-bold dark:font-semibold ">
                          <div v-if="item.transaction_id === transaction.id">
                            <!-- OFFICE SUPPLY ITEM -->
                            <span v-if="item.item_type === 'Office Supply'"
                              class="flex flex-row justify-center items-center"
                              :class="item.returned_date ? 'text-green-700 dark:text-green-600' : 'text-red-700 dark:text-red-600'">
                              <BsCheck v-if="item.returned_date" class="w-7 h-7" />
                              <BsX v-else class="w-7 h-7" />
                              {{
                                props.officeSupplies.find(
                                  (supply) => Number(supply.id) === Number(item.item_copy_id)
                                )?.supply_name || "Unknown Supply"
                              }}
                            </span>
                            <!-- EQUIPMENT COPY ITEM -->
                            <span v-if="item.item_type === 'Equipment Copy'"
                              class="flex flex-row justify-center items-center"
                              :class="item.returned_date ? 'text-green-700 dark:text-green-600' : 'text-red-700 dark:text-red-600'">
                              <BsCheck v-if="item.returned_date" class="w-7 h-7" />
                              <BsX v-else class="w-7 h-7" />
                              {{
                                props.officeEquipments.find(equipment => Number(equipment.id) ===
                                  Number(props.equipmentCopies.find(equipment_copy => Number(equipment_copy.id) ===
                                    Number(item.item_copy_id))?.item_id))?.equipment_name || 'Unknown Equipment'
                              }}
                              #{{props.equipmentCopies.find(equipment_copy => Number(equipment_copy.id) ===
                                Number(item.item_copy_id))?.copy_num || 'Unknown Equipment'}}
                            </span>
                          </div>
                        </li>
                      </ul>
                    </td>

                    <td class="max-w-min"
                      :class="transaction.return_date ? 'text-green-700 dark:text-green-600' : 'text-red-700 dark:text-red-600'">
                      <div class="flex flex-row justify-start items-center">
                        <BsCheck v-if="transaction.return_date" class="w-7 h-7" />
                        <BsX v-else class="w-7 h-7" />
                        <span v-if="transaction.return_date">
                          {{ formatDate(transaction.return_date) }}
                        </span>
                        <span v-else>
                          Not yet returned
                        </span>
                      </div>
                    </td>

                    <td class="px-4 py-3">{{ formatDate(transaction.borrow_date) }}</td>
                    <td class="px-4 py-3">
                      <button @click.stop="toggleDropdown(transaction.id)"
                        class="inline-flex items-center p-0.5 text-sm font-medium text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100"
                        type="button">
                        <ChMenuMeatball class="w-5 h-5" />
                      </button>

                      <div v-if="openDropdownId === transaction.id" ref="dropdownRefs"
                        class="absolute z-[10] bg-white divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 right-12 -mt-15">
                        <ul class="py-2 text-sm text-gray-700 dark:text-gray-200">
                          <li class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                            <button @click.stop="openUpdateModal(transaction)" class="w-full text-start px-4 py-2">
                              Update
                            </button>
                            <UpdateModal v-if="isUpdateModalOpen" v-model="isUpdateModalOpen"
                              :transaction="selectedTransaction" :officeEquipments="props.officeEquipments"
                              :officeSupplies="props.officeSupplies" :equipmentCopies="props.equipmentCopies"
                              :officeList="props.officeList" :categoryList="props.categoryList"
                              :transactionItems="props.transactionItems" :borrowers="props.borrowers"
                              :users="props.users" @click.stop />
                          </li>
                          <li class="block hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                            <button @click.stop="openDeleteModal(transaction)" class="w-full text-start px-4 py-2">
                              Delete
                            </button>
                            <DeleteModal v-if="isDeleteModalOpen" v-model="isDeleteModalOpen"
                              :transaction="selectedTransaction" :officeSupplies="props.officeSupplies"
                              :transactionItems="props.transactionItems" :borrowers="props.borrowers" @click.stop />
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </template>

                <tr v-else>
                  <td colspan="9" class="text-center py-4 text-gray-500 dark:text-gray-400">
                    No Transaction found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <nav v-if="paginatedTransactions.length > 0"
            class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
            aria-label="Table navigation">
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
              Showing
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ (currentPage - 1) * itemsPerPage + 1 }} -
                {{ Math.min(currentPage * itemsPerPage, filteredTransactions.length) }}
              </span>
              of
              <span class="font-semibold text-gray-900 dark:text-white">{{ filteredTransactions.length }}</span>
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
        </div>
      </div>
    </section>

    <CreateTransactionModal v-if="isOpenCreateTransactionModal" v-model="isOpenCreateTransactionModal"
                  @click.stop />
  </div>
</template>
