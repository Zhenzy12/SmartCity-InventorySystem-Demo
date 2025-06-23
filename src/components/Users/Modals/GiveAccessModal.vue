<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { BsBoxFill } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import axiosClient from '../../../axios';
import { useDatabaseStore } from '../../../stores/databaseStore';

const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean,
  user: Object,
})

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
  if (confirmed) {
    confirmAddUser()
  }
}

const emit = defineEmits(['update:modelValue', 'confirmDelete'])

const modalContainer = ref(null)

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



onMounted(() => {
  databaseStore.fetchData()
})


const computedProperties = {
  users: "users",
};

const {
  users,
} = Object.fromEntries(
  Object.entries(computedProperties).map(([key, value]) => [key, computed(() => databaseStore[value])])
);

const data = ref({
  for_inventory: true,

  access: {
  for_dashboard: false,
  for_transactions:false,
  for_inventory: false,
  for_categories: false,
  for_borrowers: false,
  for_offices: false,
  for_users: false,
  }
  
})

const confirmAddUser = async () => {
  try {
    isLoading.value = true

    const addUser = {
      id: props.user.id,
      firstName: props.user.firstName,
      middleName: props.user.middleName,
      lastName: props.user.lastName,
      email: props.user.email,
      for_911: props.user.for_911,
      for_inventory: data.value.for_inventory,
      for_traffic: props.user.for_traffic,
      is_deleted: props.user.is_deleted,
    }

    console.log("Add copy data sent: ", addUser)

    databaseStore.updateUser(addUser);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("User updated successfully:", addUser);

    // Then create their access permissions
    if (props.user.id) {
        const inventoryAccess = databaseStore.inventoryAccesses.find((access) => access.user_id === props.user.id)

        if (inventoryAccess) {
            // Convert boolean values to 0/1 for the database
      const accessData = {
        user_id: props.user.id,
        for_dashboard: data.value.access.for_dashboard ? 1 : 0,
        for_transactions: data.value.access.for_transactions ? 1 : 0,
        for_inventory: data.value.access.for_inventory ? 1 : 0,
        for_categories: data.value.access.for_categories ? 1 : 0,
        for_borrowers: data.value.access.for_borrowers ? 1 : 0,
        for_offices: data.value.access.for_offices ? 1 : 0,
        for_users: data.value.access.for_users ? 1 : 0
      };

      console.log("Sending access data:", accessData);

      databaseStore.updateInventoryAccess(accessData);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Access updated successfully:", accessData);
        }else {
            // Convert boolean values to 0/1 for the database
      const accessData = {
        user_id: props.user.id,
        for_dashboard: data.value.access.for_dashboard ? 1 : 0,
        for_transactions: data.value.access.for_transactions ? 1 : 0,
        for_inventory: data.value.access.for_inventory ? 1 : 0,
        for_categories: data.value.access.for_categories ? 1 : 0,
        for_borrowers: data.value.access.for_borrowers ? 1 : 0,
        for_offices: data.value.access.for_offices ? 1 : 0,
        for_users: data.value.access.for_users ? 1 : 0
      };

      console.log("Sending access data:", accessData);

      databaseStore.addInventoryAccess(accessData);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Access created successfully:", accessData);
        }
      
    }
    // emitter.emit("show-toast", { message: "Category added successfully!", type: "success" });
    // closeModal()
  } catch (error) {
    console.error('Error adding user:', error);
    emitter.emit("show-toast", { message: "Error adding user. Please try again.", type: "error" });
  } finally {
    isLoading.value = false;
    emitter.emit("show-toast", { message: "User added successfully!", type: "success" });
    closeModal();
  }
}


const isClickedShowConfirmationModal = () => {
    showConfirmationModal.value = true
}
</script>

<template>
  <div v-if="modelValue"
    class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50 ">
    <!-- Loading State -->
    <Loading v-if="isLoading" />

    <!-- Main Add Copy Form -->
    <div v-else ref="modalContainer"
      class="w-full max-w-[650px] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border-4 dark:bg-gray-950 dark:border-gray-100">
      <h3 class="text-3xl font-semibold mb-4">
        Give Access
      </h3>

      <!-- QUANTITY INPUT -->
      <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
        <div class="px-5 mt-4">
  <label class="block mb-2 text-lg font-medium text-gray-900 dark:text-gray-200">Access Permissions:</label>
  
  <div class="grid grid-cols-2 gap-4">
    <div class="flex items-center">
      <input type="checkbox" 
        id="dashboard_access" 
        v-model="data.access.for_dashboard"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="dashboard_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Dashboard Access</label>
    </div>

    <div class="flex items-center">
      <input type="checkbox" 
        id="dashboard_access" 
        v-model="data.access.for_transactions"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="dashboard_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Transaction Access</label>
    </div> 

    <div class="flex items-center">
      <input type="checkbox" 
        id="inventory_access" 
        v-model="data.access.for_inventory"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="inventory_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Inventory Access</label>
    </div>

    <div class="flex items-center">
      <input type="checkbox" 
        id="offices_access" 
        v-model="data.access.for_offices"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="offices_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Offices Access</label>
    </div>

    <div class="flex items-center">
      <input type="checkbox" 
        id="categories_access" 
        v-model="data.access.for_categories"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="categories_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Categories Access</label>
    </div>

    <div class="flex items-center">
      <input type="checkbox" 
        id="borrowers_access" 
        v-model="data.access.for_borrowers"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="borrowers_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Borrowers Access</label>
    </div>

    <div class="flex items-center">
      <input type="checkbox" 
        id="users_access" 
        v-model="data.access.for_users"
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
      <label for="users_access" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Users Access</label>
    </div>
  </div>
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
          <button @click="isClickedShowConfirmationModal()"
            class="block w-full rounded-md border bg-primary p-3 text-center text-base font-medium text-white transition bg-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white dark:text-white dark:border-green-700 dark:hover:border-green-400">
            Give Access
          </button>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal v-model="showConfirmationModal" title="Confirm Addition"
        :message="`You are about to give access to this user.`"
        :messageData="`\nFirst Name: ${props.user.firstName}\nLast Name: ${props.user.lastName}\nEmail: ${props.user.email}`" cancelText="Cancel"
        confirmText="Confirm Adding" @confirm="confirmAction" />
    </div>
  </div>
</template>