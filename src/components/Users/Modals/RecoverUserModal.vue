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
const recoverUsers = () => {
  const selectedUsers = deletedUsersArray.value.filter(user => user.is_selected);
  console.log('Selected Users:', selectedUsers);

  if (selectedUsers.length > 0) {
    showConfirmationModal.value = true;
  } else {
    console.log('Please select at least one user to recover.');
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

const filteredDeletedUsers = ref([]);
const deletedUsersArray = ref([]);

onMounted(() => {
  // Fetch data from the database store
  databaseStore.fetchData();
  // Filter the deleted users
  filteredDeletedUsers.value = databaseStore.users.filter(user =>
    user.is_deleted === 1 && user.for_inventory === true
  );
  console.log(filteredDeletedUsers.value);
  // Map the filtered users to include is_selected property
  deletedUsersArray.value = filteredDeletedUsers.value.map((user) => ({
    ...user,
    is_selected: false,
  }));
  console.log('Filtered Deleted Users:', deletedUsersArray.value);
});

const confirmRecoverUsers = async () => {
  try {
    isLoading.value = true

    const selectedUsers = deletedUsersArray.value.filter(user => user.is_selected);

    if (selectedUsers.length === 0) {
      emitter.emit("show-toast", { message: "Please select users to recover.", type: "warning" });
      return;
    }

    for (const user of selectedUsers) {
      const updateUser = {
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        is_deleted: 0,
        for_911: user.for_911,
        for_inventory: user.for_inventory,
        for_traffic: user.for_traffic,
      }

      console.log("Update user data sent: ", updateUser)

      databaseStore.restoreUser(user.id, updateUser);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay for each
      console.log("User updated successfully:", user.id);
    }

  } catch (error) {
    console.error('Error updating users:', error);
    console.error('Error details:', error.response?.data);
    emitter.emit("show-toast", { message: "Error recovering users. Please try again.", type: "error" });
  } finally {
    await databaseStore.fetchData();
    isLoading.value = false;
    emitter.emit("show-toast", {
      message: "Selected users recovered successfully!",
      type: "success"
    });
    closeModal();
  }
}

const handleCheckboxChange = (userId) => {
  deletedUsersArray.value = deletedUsersArray.value.map(user => ({
    ...user,
    is_selected: user.id === userId ? !user.is_selected : user.is_selected
  }));

  // Check if all users are selected
  const allSelected = deletedUsersArray.value.every(copy => copy.is_selected);

  checkedAll.value = allSelected;
};

const checkedAll = ref(false);

const handleCheckboxChangeAll = () => {
  if (checkedAll.value) {
    checkedAll.value = false;
    deletedUsersArray.value = deletedUsersArray.value.map(copy => ({
      ...copy,
      is_selected: false
    }));
  } else {
    checkedAll.value = true;
    deletedUsersArray.value = deletedUsersArray.value.map(copy => ({
      ...copy,
      is_selected: true
    }));
  }
};

// search function 
const searchQuery = ref("");

// Replace your existing filteredDeletedUsers logic with this computed property
const filteredDeletedUsersSearch = computed(() => {
  return databaseStore.users.filter(user =>
    user.is_deleted === 1 && user.for_inventory === true &&
    (user.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()))
  );
});

// Add a watch to update deletedUsersArray when search changes
watch(filteredDeletedUsersSearch, (newUsers) => {
  deletedUsersArray.value = newUsers.map((user) => ({
    ...user,
    is_selected: false,
  }));
});

const confirmAction = (confirmed) => {
  if (confirmed) {
    confirmRecoverUsers();
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
        Recover Users
      </h3>
      <div class="w-full px-5 mb-4">
        <form class="flex items-center">
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
              class="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Search users..." />
          </div>
        </form>
      </div>

      <!-- FOR THE EQUIPMENT -->
      <div v-if="deletedUsersArray.length > 0"
        class="flex items-center justify-center lg:px-5 text-start max-h-[69vh] w-full overflow-y-auto">
        <!-- TABLE FOR CHOOSING MULTIPLE EQUIPMENT COPY -->
        <div
          class="border w-fit  min-w-full max-w-[600px] lg:max-w-full overflow-y-auto lg:mx-10 my-1 pb-1 rounded-lg dark:border-gray-700 ">
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
                <th class="px-2">First Name</th>
                <th class="px-2">Middle Name</th>
                <th class="px-2">Last Name</th>
                <th class="px-2">Email</th>
                <th class="px-2">Date Deleted</th>
              </tr>
            </thead>
            <tbody class="w-full">
              <template v-for="user in deletedUsersArray">
                <tr class="w-full text-center items-center justify-center border-t">
                  <td class="pl-3 pt-1 w-10">
                    <label class="flex items-center cursor-pointer select-none text-dark dark:text-white">
                      <div class="relative">
                        <input type="checkbox" class="sr-only" @change="handleCheckboxChange(user.id)" />
                        <AkCheckBox v-if="user.is_selected" class="w-7 h-7" />
                        <AkBox v-else class="w-7 h-7" />
                      </div>
                    </label>
                  </td>
                  <td class="text-center">{{ user.firstName }}</td>
                  <td class="text-center">{{ user.middleName ? user.middleName : 'N/A' }}</td>
                  <td class="text-center">{{ user.lastName }}</td>
                  <td class="text-center">{{ user.email }} </td>
                  <td class="text-center">{{ formatDate(user.updated_at) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="px-5 text-start max-h-[69vh] overflow-y-auto">
        <p class="text-gray-500 dark:text-gray-400">No available users to recover.</p>
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
          <button @click="recoverUsers()"
            class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
            Recover Selected Users
          </button>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal v-model="showConfirmationModal" title="Confirm Recovery"
        :messageData="`Are you sure you want to recover the selected users?`" confirmText="Confirm Recovery"
        @confirm="confirmAction(true)" />
    </div>
  </div>
</template>