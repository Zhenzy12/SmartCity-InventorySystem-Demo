<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import image from '../../../../src/assets/baguio-logo.png'
import { useDatabaseStore } from "../../../stores/databaseStore";
import AddTransactionItemModal from './IncludeItemPressedModal.vue';
import { GlCloseXs } from '@kalimahapps/vue-icons';
import { MdRoundDeleteForever } from '@kalimahapps/vue-icons';
import { BxSolidUser } from '@kalimahapps/vue-icons';
import { AkTextAlignLeft } from '@kalimahapps/vue-icons';
import useUserStore from "../../../stores/user.js";
import axiosClient from '../../../axios.js';
const API_KEY = import.meta.env.VITE_API_KEY;

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// storing inputs
const borrowerInput = ref("")
const lenderInput = ref("")
const iscInput = ref("")
const remarksInput = ref("")
const borrowerContactInput = ref("")
const borrowerOfficeInput = ref("")

// User Store to get Lender
const userStore = useUserStore();
const loggedInUser = computed(() => userStore.user);
lenderInput.value = loggedInUser.value.id


// FETCHING DATA
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


// FOR THE TOAST
import emitter from "../../../eventBus";

const isLoading = ref(false)

const props = defineProps({
    modelValue: Boolean,
})

const showConfirmationModal = ref(false)

const modalContainer = ref(null)

const emit = defineEmits(['update:modelValue', 'confirmDelete'])

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

const allInventory = computed(() => {
    return [...officeEquipmentsArray.value, ...officeSuppliesArray.value]
        .filter(item => {
            if (item.type === "Office Supply") {
                return item.supply_quantity > 0;
            } else if (item.type === "Office Equipment") {
                return equipmentCopiesArray.value.some(e_copy =>
                    e_copy.item_id === item.id && e_copy.is_available === 1
                );
            }
            return false;
        })
        .map((item, index) => ({
            ...item,
            newId: `INV-${index + 1}`,
        }));
});


// FOR SEARCH
const searchQuery = ref("");

const filteredInventory = computed(() => {
    if (!searchQuery.value) return allInventory.value;

    const searchTerm = searchQuery.value.toLowerCase();
    return allInventory.value.filter((item) => {
        const equipmentName = item.equipment_name?.toLowerCase() || "";
        const equipmentDescription = item.equipment_description?.toLowerCase() || "";
        const serialNumber = item.serial_number?.toString().toLowerCase() || "";
        const supplyName = item.supply_name?.toLowerCase() || "";
        const supplyDescription = item.supply_description?.toLowerCase() || "";
        const id = item.id?.toString().toLowerCase() || "";
        const newId = item.newId?.toLowerCase() || "";

        return (
            equipmentName.includes(searchTerm) ||
            equipmentDescription.includes(searchTerm) ||
            serialNumber.includes(searchTerm) ||
            supplyName.includes(searchTerm) ||
            supplyDescription.includes(searchTerm) ||
            id.includes(searchTerm) ||
            newId.includes(searchTerm)
        );
    });
});


// FOR THE ADD TRANSACTION ITEM MODAL
const isOpenAddTransactionItemModal = ref(false);
const selectedItem = ref(null);


const OpenAddTransactionItemModal = (item) => {
    selectedItem.value = item;
    isOpenAddTransactionItemModal.value = true;
}

const selectedItems = ref([]);

// Add selected item from the modal to the overall list
const handleConfirmAdd = (items) => {
    items.forEach(item => {
        const exists = selectedItems.value.some(selected => selected.item_copy_id === item.item_copy_id && selected.item_type === item.item_type);

        if (!exists) {
            selectedItems.value.push(item);
        } else {
            if (item.item_type === 'Office Supply') {
                selectedItems.value = selectedItems.value.filter(selected => selected.item_copy_id !== item.item_copy_id);
                selectedItems.value.push(item);
            }
        }
    });
};

// Remove selected item from the overall list
const handleRemoveItem = (item) => {
    selectedItems.value = selectedItems.value.filter(selected => selected.item_copy_id !== item.item_copy_id)
};

// BORROWER LIST DROPDOWN
const showBorrowerListDropdown = ref(false);

// Filtered List for Searching
const filteredBorrowers = computed(() => {
    if (!borrowerInput.value) return borrowersArray.value;
    return borrowersArray.value.filter((borrower) =>
        borrower.borrowers_name.toLowerCase().includes(borrowerInput.value.toLowerCase())
    );
});


const selectBorrower = (value) => {
    borrowerInput.value = value;
    showBorrowerListDropdown.value = false;
};

// Delay Hiding Dropdown to Allow Selection
const hideBorrowerDropdownWithDelay = () => {
    setTimeout(() => {
        showBorrowerListDropdown.value = false;
    }, 200);
};


// Filtered List for Searching ISC
const showIscListDropdown = ref(false);

const filteredIsc = computed(() => {
    if (!iscInput.value) return transactionHistoryArray.value;
    return transactionHistoryArray.value.filter((transaction) =>
        transaction.isc?.toLowerCase().includes(iscInput.value.toLowerCase())
    );
});

const selectIsc = (value) => {
    iscInput.value = value;
    showIscListDropdown.value = false;
};

const hideIscDropdownWithDelay = () => {
    setTimeout(() => {
        showIscListDropdown.value = false;
    }, 0);
};


const showBorrowerOfficeListDropdown = ref(false);

const filteredBorrowerOffice = computed(() => {
    if (!borrowerOfficeInput.value) return officeListArray.value;
    return officeListArray.value.filter((office) =>
        office.office_name.toLowerCase().includes(borrowerOfficeInput.value.toLowerCase())
    );
});

const selectBorrowerOffice = (value) => {
    borrowerOfficeInput.value = value;
    showBorrowerOfficeListDropdown.value = false;
};

const hideBorrowerOfficeDropdownWithDelay = () => {
    setTimeout(() => {
        showBorrowerOfficeListDropdown.value = false;
    }, 0);
};

// HANDLE OF CREATE TRANSACTION BUTTON
const handleCreateTransactionButton = () => {
    if (!validateForm()) {
        console.log("Validation failed");
        return;
    } else if (selectedItems.value.length) {
        showConfirmationModal.value = true
    } else {
        // add an error if there is no selected items
        emitter.emit("show-toast", {
            message: "Please select at least one item to proceed.",
            type: "error",
        });
    }
}

// FOR THE CONFIRMATION MODAL
const formattedMessageData = computed(() => {
    if (!selectedItems.value.length) return "No items selected.";

    return selectedItems.value
        .map(
            (item, index) =>
                `\n${index + 1}. Equipment Name: ${item.item_name || "N/A"}\n   Copy to add: ${item.quantity || item.copy || "N/A"}`
        )
        .join("\n");
});

// IF CONFIRM CREATE TRANSACTION WAS PRESSED:
const createTransactionConfirmed = () => {
    confirmCreateTransaction()
}

const selectedBorrowerId = ref(0);
const selectedOfficeId = ref(null);
const borrowerInfoAllowedInput = ref(true);

watch(borrowerInput, () => {
    borrowerOfficeInput.value = '';
    borrowerContactInput.value = '';
    borrowerInfoAllowedInput.value = true;

    selectedBorrowerId.value = borrowersArray.value.find((borrower) =>
        borrower.borrowers_name.toLowerCase() === borrowerInput.value.toLowerCase()
    )?.id || 0;

    if (selectedBorrowerId.value === 0) {
        console.log("Borrower ID not found:");
    } else {
        selectedOfficeId.value = borrowersArray.value.find(
            (borrower) => borrower.id === selectedBorrowerId.value
        )?.office_id || 0;
        borrowerOfficeInput.value = officeListArray.value.find(
            (office) => office.id === selectedOfficeId.value
        )?.office_name || '';
        borrowerContactInput.value = borrowersArray.value.find(
            (borrower) => borrower.id === selectedBorrowerId.value
        )?.borrowers_contact || '';
        console.log("Borrower ID already exists:", selectedBorrowerId.value);
        borrowerInfoAllowedInput.value = false;
    }
});

const confirmUpdate = async () => {
    try {
        for (const item of selectedItems.value) {
            if (item.item_type === "Equipment Copy") {
                const availability = false;
                updateEquipment(availability, item);
            } else if (item.item_type === "Office Supply") {
                const officeSupply = officeSupplies.value.find(
                    (office_supply) => office_supply.id === item.item_copy_id
                );
                const newQuantity = officeSupply.supply_quantity - item.quantity;
                updateOfficeSupply(newQuantity, item);
            }
        }
    } catch (error) {
        console.error("Error updating items:", error);
    }
}

const updateOfficeSupply = async (newQuantity, item) => {
    try {
        const updateTransactionItems = {
            id: item.item_copy_id,
            supply_quantity: newQuantity,
        };

        databaseStore.updateOfficeSupply(updateTransactionItems);
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("Updated Office Supply successfully:", updateTransactionItems);
    } catch (error) {
        console.error('Error updating office supply:', error);
        console.error('Error details:', error.response?.data);
    }
}

const updateEquipment = async (availability, item) => {
    try {

        const updateTransactionItems = {
            id: item.item_copy_id,
            is_available: availability,
        };

        databaseStore.updateEquipmentCopy(updateTransactionItems);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("Updated Equipment Copy successfully:", updateTransactionItems);

    } catch (error) {
        console.error('Error updating item copy:', error);
        console.error('Error details:', error.response?.data);
    }
}

// SAVE DATA IN BACKEND
const formatDateForMySQL = (date) => {
    return date instanceof Date
        ? new Date(date).toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/(\d+)\/(\d+)\/(\d+),\s/, '$3-$1-$2 ')
        : date;
};

const confirmCreateTransaction = async () => {
    try {
        isLoading.value = true;

        let borrowerId = borrowersArray.value.find((borrower) =>
            borrower.borrowers_name.toLowerCase() === borrowerInput.value.toLowerCase()
        )?.id || 0;

        // If borrower doesn't exist, create new borrower first
        if (borrowerId === 0) {
            const officeId = officeListArray.value.find((office) =>
                office.office_name.toLowerCase() === borrowerOfficeInput.value.toLowerCase()
            )?.id;

            const newBorrowerId =
                Math.max(0, ...borrowersArray.value.map(b => b.id || 0)) + 1;

            const newBorrower = {
                id: newBorrowerId,
                borrowers_name: borrowerInput.value,
                borrowers_contact: borrowerContactInput.value,
                office_id: officeId,
                is_deleted: 0,
                deleted_by: null,
            };

            databaseStore.addBorrower(newBorrower);
            borrowerId = newBorrowerId;
        }

        const currentDate = new Date();
        const formattedDate = formatDateForMySQL(currentDate);

        const newTransactionId =
            Math.max(0, ...databaseStore.transactionHistory.map(t => t.id || 0)) + 1;

        const newTransaction = {
            id: newTransactionId,
            borrower_id: borrowerId,
            lender_id: lenderInput.value,
            isc: iscInput.value,
            remarks: remarksInput.value,
            borrow_date: formattedDate,
            // Add other fields as needed (e.g., returned, returned_date, etc.)
        };

        databaseStore.addTransactionHistory(newTransaction);
        const transactionId = newTransactionId;

        // Format items for transaction
        const formattedItems = selectedItems.value.map(item => ({
            item_copy_id: item.item_copy_id,
            returned: false,
            returned_date: null,
            item_type: item.item_type,
            quantity: item.quantity || item.copy || 1
        }));

        // Create transaction items
        formattedItems.forEach(item => {
            const newTransactionItemId =
                Math.max(0, ...databaseStore.transactionItems.map(ti => ti.id || 0)) + 1;

            const newTransactionItem = {
                id: newTransactionItemId,
                transaction_id: transactionId,
                ...item
            };

            databaseStore.addTransactionItem(newTransactionItem);
        });

    } catch (error) {
        // console.error('Transaction error:', error);
        let errorMessage = "Error creating transaction. Please try again.";

        if (error.response?.data) {
            // console.error('Error details:', error.response.data);
            errorMessage = Object.values(error.response.data)[0] || errorMessage;
        }

        // emitter.emit("show-toast", {
        //     message: errorMessage,
        //     type: "error"
        // });
    } finally {
        await confirmUpdate();
        isLoading.value = false;
        emitter.emit("show-toast", { message: "Transaction created successfully!", type: "success" });
        closeModal();
    }
};

// error validation
const errors = ref({
    borrowerInput: [],
    iscInput: [],
    remarksInput: [],
    selectedBorrowerId: [],
    borrowerOfficeInput: [],
    borrowerContactInput: [],
})

const validateForm = () => {
    Object.keys(errors.value).forEach(key => {
        errors.value[key] = [];
    });

    let hasErrors = false;

    if (!borrowerInput.value) {
        errors.value.borrowerInput = ["Borrower is required"];
        hasErrors = true;
    }

    if (!borrowerContactInput.value) {
        errors.value.borrowerContactInput = ["Contact number is required"];
        hasErrors = true;
    } else if (!/^(09|\+63)[0-9]{9}$/.test(borrowerContactInput.value)) {
        errors.value.borrowerContactInput = ["Contact number must start with 09 or +63 followed by 9 digits"];
        hasErrors = true;
    }


    if (!iscInput.value) {
        errors.value.iscInput = ["ISC is required"];
        hasErrors = true;
    }

    if (!remarksInput.value) {
        errors.value.remarksInput = ["Remarks is required"];
        hasErrors = true;
    }

    const officeChecked = officeListArray.value.find((office) => office.office_name === borrowerOfficeInput.value)

    if (!borrowerOfficeInput.value) {
        errors.value.borrowerOfficeInput = ["Borrower Office is required"];
        hasErrors = true;
    } else if (!officeChecked) {
        errors.value.borrowerOfficeInput = ["Select a valid Borrower Office"];
        hasErrors = true;
    }

    return !hasErrors;
}

// watch effect for validation
watch(() => borrowerInput.value, (newValue) => {
    if (!newValue) {
        errors.value.borrowerInput = ["Borrower is required"];
    } else {
        errors.value.borrowerInput = [];
    }
});


watch(() => iscInput.value, (newValue) => {
    if (!newValue) {
        errors.value.iscInput = ["ISC is required"];
    } else {
        errors.value.iscInput = [];
    }
});

watch(() => remarksInput.value, (newValue) => {
    if (!newValue) {
        errors.value.remarksInput = ["Remarks is required"];
    } else {
        errors.value.remarksInput = [];
    }
});

watch(() => selectedBorrowerId.value, (newValue) => {
    if (!newValue) {
        errors.value.selectedBorrowerId = ["Borrower is required"];
    } else {
        errors.value.selectedBorrowerId = [];
    }
});

watch(() => borrowerContactInput.value, (newValue) => {
    if (!newValue) {
        errors.value.borrowerContactInput = ["Contact number is required"];
    } else if (!/^(09|\+63)[0-9]{9}$/.test(newValue)) {
        errors.value.borrowerContactInput = ["Contact number must start with 09 or +63 followed by 9 digits"];
    } else {
        errors.value.borrowerContactInput = [];
    }
});

watch(() => borrowerOfficeInput.value, (newValue) => {
    const officeChecked = officeListArray.value.find((office) => office.office_name === borrowerOfficeInput.value)
    if (!newValue) {
        errors.value.borrowerOfficeInput = ["Borrower Office is required"];
    } else if (!officeChecked) {
        errors.value.borrowerOfficeInput = ["Select a valid Borrower Office"];
    } else {
        errors.value.borrowerOfficeInput = [];
    }
});

</script>

<template>
    <div v-if="modelValue"
        class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50 ">
        <!-- Loading State -->
        <Loading v-if="isLoading" />

        <div v-else ref="modalContainer"
            class="w-full h-[95vh] rounded-[20px] bg-white px-8 py-6 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
            <div class="grid grid-cols-3 gap-4 h-[87vh]">
                <!-- CLOSE BUTTON -->
                <button @click="closeModal()"
                    class="absolute top-10 right-8 justify-end bg-gray-200 ml-4 text-gray-700 px-1 py-1 rounded-full hover:bg-gray-300 transition dark:bg-gray-300">
                    <GlCloseXs class="w-10 h-10" />
                </button>

                <!-- CHOOSE ITEM -->
                <div
                    class="col-span-2 rounded-2xl max-h-[89vh] border-2 p-4 text-start dark:bg-black dark:border-gray-600">
                    <p class="text-2xl font-bold pl-2 mb-2">Choose Item/s:</p>
                    <!-- SEARCH BAR -->
                    <div class="w-full">
                        <form class="flex items-center" @submit.prevent>
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
                                <input type="text" v-model="searchQuery" id="simple-search"
                                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                    placeholder="Search items..." />
                            </div>
                        </form>
                    </div>

                    <!-- LIST OF ITEMS -->
                    <div
                        class="w-full rounded-xl px-4 py-2 mt-4 grid grid-cols-5 gap-4 items-center justify-center max-h-[71vh] overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div v-for="item in filteredInventory" :key="item.newId" class="w-full h-full">
                            <button @click.stop="OpenAddTransactionItemModal(item)"
                                class="w-full h-full cursor-pointer p-2 border rounded-lg hover:shadow-lg transition duration-300 ease-in-out dark:font-bold "
                                :class="{
                                    'bg-gradient-to-b bg-green-500 dark:from-green-600 dark:via-green-950 dark:to-black dark:border-green-800 text-white dark:hover:from-emerald-400 dark:hover:via-emerald-900 dark:hover:to-black ': selectedItems.some(selected => selected.basis_id === item.id && selected.basis_type === item.type),
                                    'bg-gray-300 dark:bg-gray-950 dark:border-gray-600 dark:hover:bg-green-800 dark:hover:text-white dark:hover:border-green-800': !selectedItems.some(selected => selected.basis_id === item.id && selected.basis_type === item.type)
                                }">
                                <img :src="item.image_path ? `${VITE_API_BASE_URL}/storage/${item.image_path}` : image"
                                    class="w-full h-28 object-cover rounded-lg" />
                                <p class="text-center mt-2 font-medium">
                                    {{ item.equipment_name || item.supply_name }}
                                </p>
                            </button>
                        </div>
                        <AddTransactionItemModal v-if="isOpenAddTransactionItemModal"
                            v-model="isOpenAddTransactionItemModal" :selectedItem="selectedItem"
                            :equipmentCopies="equipmentCopiesArray" :currentlySelectedItems="selectedItems"
                            @confirmAdd="handleConfirmAdd" @click.stop />
                    </div>
                </div>

                <!-- SELECTED ITEMS -->
                <div class="rounded-2xl max-h-[89vh] border-2 p-4 text-start dark:bg-black dark:border-gray-600">
                    <p class="text-2xl font-bold pl-2 mb-2">Selected Item/s:</p>
                    <div
                        class="border-2 h-[30vh] rounded-xl overflow-y-auto bg-gray-100 dark:bg-gray-950 dark:border-gray-600">
                        <table class="w-full text-center ">
                            <thead class="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th class="py-2">Item</th>
                                    <th>Quantity</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in selectedItems" :key="item.id"
                                    class="items-center border-b dark:border-gray-600">
                                    <td class="py-2 ">{{ item.item_name }}</td>
                                    <td>{{ item.quantity || item.copy }}</td>
                                    <td class="flex py-2 justify-center items-center ">
                                        <button>
                                            <MdRoundDeleteForever class="w-7 h-7 text-red-500 hover:text-red-400"
                                                @click="handleRemoveItem(item)" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div
                        class="mt-2 overflow-y-auto max-h-[36vh] xl:max-h-[38vh] 2xl:max-h-[39vh] [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <!-- BORROWER -->
                        <div class="flex flex-row mb-2">
                            <label class="block text font-medium text-gray-900 dark:text-gray-200">
                                Type Borrower: {{ borrowerInput }}
                            </label>
                            <p class="text-red-700 ml-2 font-semibold italic">{{ errors.borrowerInput ?
                                errors.borrowerInput[0] :
                                '' }}
                            </p>
                        </div>

                        <div class="relative ml-2">
                            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <BxSolidUser />
                            </div>

                            <!-- Input Field -->
                            <input type="text" v-model="borrowerInput" @focus="showBorrowerListDropdown = true"
                                @blur="hideBorrowerDropdownWithDelay"
                                @keydown.enter.prevent="selectBorrower(borrowerInput)"
                                placeholder="Search or enter new borrower..."
                                class="bg-gray-50 mb-2 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />

                            <!-- Dropdown List -->
                            <ul v-if="showBorrowerListDropdown && filteredBorrowers.length"
                                class="absolute ml-5 w-[92%] border rounded-lg shadow-lg mt-1 z-10 max-h-37 overflow-y-auto bg-white border-gray-300 dark:bg-gray-800">
                                <li v-for="borrower in filteredBorrowers" :key="borrower.id"
                                    @mousedown="selectBorrower(borrower.borrowers_name)"
                                    class="p-2 hover:bg-blue-100 cursor-pointer">
                                    {{ borrower.borrowers_name }}
                                </li>
                            </ul>
                        </div>

                        <!-- BORROWER CONTACT -->
                        <div class="flex flex-row mt-2 mb-2">
                            <label class="block text font-medium text-gray-900 dark:text-gray-200">Type
                                Borrower Contact:</label>
                            <p class="text-red-700 ml-2 font-semibold italic">{{ errors.borrowerContactInput ?
                                errors.borrowerContactInput[0] :
                                '' }}</p>
                        </div>

                        <div class="relative ml-2">
                            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <AkTextAlignLeft />
                            </div>
                            <input type="tel" v-model="borrowerContactInput" pattern="(09|\+63)[0-9]{9}" maxlength="13"
                                oninput="this.value = this.value.replace(/[^0-9+]/g, '')"
                                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Ex. Printer, Chair, Stairs" :disabled="!borrowerInfoAllowedInput"
                                :class="!borrowerInfoAllowedInput ? ' dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-gray-500' : ' dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white '">
                        </div>

                        <!-- BORROWER OFFICE -->
                        <div class="flex flex-row mt-2 mb-2">
                            <label class="block text font-medium text-gray-900 dark:text-gray-200">Type
                                Borrower Office:</label>
                            <p class="text-red-700 ml-2 font-semibold italic">{{ errors.borrowerOfficeInput ?
                                errors.borrowerOfficeInput[0] :
                                '' }}</p>
                        </div>

                        <div class="relative ml-2">
                            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <BxSolidUser />
                            </div>
                            <input type="text" v-model="borrowerOfficeInput"
                                @focus="showBorrowerOfficeListDropdown = true"
                                @blur="hideBorrowerOfficeDropdownWithDelay"
                                @keydown.enter.prevent="selectBorrowerOffice(borrowerOfficeInput)"
                                placeholder="Search or enter new Borrower Office..."
                                class="bg-gray-50 mb-2 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                :disabled="!borrowerInfoAllowedInput"
                                :class="!borrowerInfoAllowedInput ? ' dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-gray-500' : ' dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white '">

                            <!-- Dropdown List -->
                            <ul v-if="showBorrowerOfficeListDropdown && filteredBorrowerOffice.length"
                                class="absolute ml-5 w-[92%] border rounded-lg shadow-lg mt-1 z-10 max-h-37 overflow-y-auto bg-white border-gray-300 dark:bg-gray-800">
                                <li v-for="office in filteredBorrowerOffice" :key="office.id"
                                    @mousedown="selectBorrowerOffice(office.office_name)"
                                    class="p-2 hover:bg-blue-100 cursor-pointer">
                                    {{ office.office_name }}
                                </li>
                            </ul>
                        </div>

                        <!-- ISC/AREE -->
                        <div class="flex flex-row mt-2 mb-2">
                            <label class="block text font-medium text-gray-900 dark:text-gray-200">Type
                                ISC/AREE:</label>
                            <p class="text-red-700 ml-2 font-semibold italic">{{ errors.iscInput ? errors.iscInput[0] :
                                '' }}</p>
                        </div>
                        <div class="relative ml-2">
                            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <BxSolidUser />
                            </div>
                            <input type="text" v-model="iscInput" @focus="showIscListDropdown = true"
                                @blur="hideIscDropdownWithDelay" @keydown.enter.prevent="selectIsc(iscInput)"
                                placeholder="Search or enter new ICS/AREE..."
                                class="bg-gray-50 mb-2 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">

                            <!-- Dropdown List -->
                            <ul v-if="showIscListDropdown && filteredIsc.length"
                                class="absolute ml-5 w-[92%] border rounded-lg shadow-lg mt-1 z-10 max-h-37 overflow-y-auto bg-white border-gray-300 dark:bg-gray-800">
                                <li v-for="transaction in filteredIsc" :key="transaction.id"
                                    @mousedown="selectIsc(transaction.isc)"
                                    class="p-2 hover:bg-blue-100 cursor-pointer">
                                    {{ transaction.isc }}
                                </li>
                            </ul>
                        </div>

                        <!-- REMARKS -->
                        <div class="flex flex-row mt-2 mb-2">
                            <label class="block text font-medium text-gray-900 dark:text-gray-200">Type
                                Remarks:</label>
                            <p class="text-red-700 ml-2 font-semibold italic">{{ errors.remarksInput ?
                                errors.remarksInput[0] :
                                '' }}</p>
                        </div>

                        <div class="relative ml-2">
                            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                <AkTextAlignLeft />
                            </div>
                            <input type="text" v-model="remarksInput"
                                class="min-h-11 max-h-11 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Enter Remarks">
                        </div>
                    </div>
                    <!-- Action Buttons -->
                    <div class="-mx-3 flex flex-wrap mt-4">
                        <div class="w-1/2 px-3">
                            <button @click="closeModal"
                                class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-dark transition bg-gray-300 hover:border-red-800 hover:bg-red-800 hover:text-white dark:text-black">
                                Cancel
                            </button>
                        </div>
                        <div class="w-1/2 px-3">
                            <button @click="handleCreateTransactionButton"
                                class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
                                Create Transaction
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <ConfirmationModal v-model="showConfirmationModal" title="Confirm Create Transaction"
                :message="`You are about to make a transaction with this items.`" :messageData="formattedMessageData"
                cancelText="Cancel" confirmText="Create Transaction" @confirm="createTransactionConfirmed()" />
        </div>
    </div>
</template>