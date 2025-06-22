<script setup>
import { ref, onMounted, onUnmounted, computed, toRaw, watch } from 'vue'
import { BsBoxFill } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import { AkBox } from '@kalimahapps/vue-icons';
import { AkCheckBox } from '@kalimahapps/vue-icons';
import { useDatabaseStore } from '../../../stores/databaseStore';
import emitter from "../../../eventBus";
import axiosClient from '../../../axios';

const API_KEY = import.meta.env.VITE_API_KEY;

const databaseStore = useDatabaseStore()

const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'confirmDelete'])

// AFTER PRESSING RECOVER SELECTED USERS
const recoverBorrowers = () => {
  const selectedBorrowers = deletedBorrowersArray.value.filter(borrower => borrower.is_selected);
  console.log('Selected Offices:', selectedBorrowers);

  if (selectedBorrowers.length > 0) {
    showConfirmationModal.value = true;
  } else {
    console.log('Please select at least one borrower to recover.');
  }
}

const showConfirmationModal = ref(false)

const modalContainer = ref(null)

const closeModal = () => {
  emit('update:modelValue', false)
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

const filteredDeletedBorrowers = ref([]);
const deletedBorrowersArray = ref([]);

onMounted(() => {
  // Fetch data from the database store
  databaseStore.fetchData();
  // Filter the deleted users and map with office names
  filteredDeletedBorrowers.value = databaseStore.borrowers
    .filter(borrower => borrower.is_deleted === 1)
    .map(borrower => ({
      ...borrower,
      is_selected: false,
      office_name: databaseStore.officeList.find(
        office => office.id === borrower.office_id
      )?.office_name || 'N/A'
    }));
  
  deletedBorrowersArray.value = filteredDeletedBorrowers.value;
  console.log('Filtered Deleted Borrowers:', deletedBorrowersArray.value);
});
const confirmRecoverBorrowers = async () => {
    try {
        isLoading.value = true

        const selectedBorrowers = deletedBorrowersArray.value.filter(borrower => borrower.is_selected);
        
        if (selectedBorrowers.length === 0) {
            emitter.emit("show-toast", { message: "Please select borrower to recover.", type: "error" });
            return;
        }

        for (const borrower of selectedBorrowers) {
            const updateBorrower = {
                borrowers_name: borrower.borrowers_name,
                borrowers_contact: borrower.borrowers_contact,
                office_id: borrower.office_id,
                is_deleted: 0,
                deleted_by: null
            }


            console.log("Update user data sent: ", updateBorrower)

            const response = await axiosClient.put(
                `/api/borrowers/${borrower.id}`,
                updateBorrower,
                {
                    headers: {
                        "x-api-key": API_KEY,
                    },
                }
            );
            console.log('Update Borrower API response:', response);
        }

    } catch (error) {
        console.error('Error updating borrowers:', error);
        console.error('Error details:', error.response?.data);
        emitter.emit("show-toast", { message: "Error recovering borrowers. Please try again.", type: "error" });
    } finally {
        await databaseStore.fetchData();
        isLoading.value = false;
        emitter.emit("show-toast", { 
            message: "Selected borrowers recovered successfully!", 
            type: "success" 
        });
        closeModal();
    }
}

const handleCheckboxChange = (borrowerId) => {
  deletedBorrowersArray.value = deletedBorrowersArray.value.map(borrower => ({
    ...borrower,
    is_selected: borrower.id === borrowerId ? !borrower.is_selected : borrower.is_selected
  }));

  // Check if all users are selected
  const allSelected = deletedBorrowersArray.value.every(copy => copy.is_selected);

  checkedAll.value = allSelected;
};

const checkedAll = ref(false);

const handleCheckboxChangeAll = () => {
  if (checkedAll.value) {
    checkedAll.value = false;
    deletedBorrowersArray.value = deletedBorrowersArray.value.map(copy => ({
      ...copy,
      is_selected: false
    }));
  } else {
    checkedAll.value = true;
    deletedBorrowersArray.value = deletedBorrowersArray.value.map(copy => ({
      ...copy,
      is_selected: true
    }));
  }
};

// search function 
const searchQuery = ref("");

const filteredDeletedBorrowersSearch = computed(() => {
    return databaseStore.borrowers.filter(borrower =>
        borrower.is_deleted === 1 && (
            borrower.borrowers_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            borrower.borrowers_contact.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            borrower.office_name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    );
});

watch(filteredDeletedBorrowersSearch, (newBorrowers) => {
    deletedBorrowersArray.value = newBorrowers.map((borrower) => ({
        ...borrower,
        is_selected: false,
        office_name: databaseStore.officeList.find(
            office => office.id === borrower.office_id
        )?.office_name || 'N/A'
    }));
});

const confirmAction = (confirmed) => {
    if (confirmed) {
        confirmRecoverBorrowers();
        showConfirmationModal.value = false;
    }
}

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};
</script>

<template>
  <div v-if="modelValue"
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50 ">
    <!-- Loading State -->
    <Loading v-if="isLoading" />

    <!-- Main Add Copy Form -->
    <div v-else ref="modalContainer"
      class="w-full max-w-[90vw] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
      <h3 class="text-3xl font-semibold mb-4">
        Recover Borrowers
      </h3>
      <div class="w-full px-5 mb-4">
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
                placeholder="Search borrowers..." />
        </div>
    </form>
</div>

      <!-- FOR THE EQUIPMENT -->
      <div v-if="deletedBorrowersArray.length > 0"
        class="flex items-center justify-center lg:px-5 text-start max-h-[69vh] w-full overflow-y-auto">
        <!-- TABLE FOR CHOOSING MULTIPLE EQUIPMENT COPY -->
        <div class="border w-fit max-w-[900px] lg:max-w-full overflow-y-auto lg:mx-10 my-1 pb-1 rounded-lg dark:border-gray-700 ">
          <table class="w-full">
            <thead>
              <tr class="text-center dark:bg-gray-800">
                <th class="pl-3 pt-2 py-1">
                  <label class="flex items-center cursor-pointer select-none text-dark dark:text-white">
                    <div class="relative">
                      <input type="checkbox" class="sr-only" @change="handleCheckboxChangeAll()" />
                      <AkCheckBox v-if="checkedAll" class="w-7 h-7" />
                      <AkBox v-else class="w-7 h-7" />
                    </div>
                  </label>
                </th>
                <th class="px-2">Borrowers Name</th>
                <th class="px-2">Borrowers Contact</th>
                <th class="px-2">Office Name</th>
                <th class="px-2">Date Deleted</th>
              </tr>
            </thead>
            <tbody class="w-full">
              <template v-for="borrower in deletedBorrowersArray">
                <tr 
                  class="w-full text-center items-center justify-center border-t">
                  <td class="pl-3 pt-1 w-10">
                    <label class="flex items-center cursor-pointer select-none text-dark dark:text-white">
                      <div class="relative">
                        <input type="checkbox" class="sr-only" @change="handleCheckboxChange(borrower.id)" />
                        <AkCheckBox v-if="borrower.is_selected" class="w-7 h-7" />
                        <AkBox v-else class="w-7 h-7" />
                      </div>
                    </label>
                  </td>
                  <td class="text-center">{{ borrower.borrowers_name }}</td>
                  <td class="text-center">{{ borrower.borrowers_contact }}</td>
                  <td class="text-center">{{ borrower.office_name }}</td>
                  <td class="text-center">{{ formatDate(borrower.updated_at) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else
        class="px-5 text-start max-h-[69vh] overflow-y-auto">
        <p class="text-gray-500 dark:text-gray-400">No available borrowers to recover.</p>
      </div>

      <!-- Action Buttons -->
      <div class="-mx-3 flex flex-wrap mt-4">
        <div class="w-1/2 px-3">
          <button @click="closeModal()"
            class="block w-full rounded-md border border-stroke p-3 text-center text-base font-medium text-dark transition bg-gray-300 hover:border-red-800 hover:bg-red-800 hover:text-white dark:text-black">
            Cancel
          </button>
        </div>
        <div class="w-1/2 px-3">
          <button @click="recoverBorrowers()"
            class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
            Recover Selected Borrowers
          </button>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal v-model="showConfirmationModal" title="Confirm Recovery" :message="``" :messageData="`\nAre you sure you want to recover the selected borrowers?`"
        confirmText="Confirm Recovery" @confirm="confirmAction(true)" />
    </div>
  </div>
</template>