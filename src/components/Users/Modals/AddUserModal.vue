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
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  password: '',
  password_confirmation: '',
  for_911: false,
  for_inventory: true,
  for_traffic: false,
  is_deleted: 0,

  access: {
  for_dashboard: true,
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

    const maxId = databaseStore.users.length
      ? Math.max(...databaseStore.users.map(u => u.id))
      : 0;
    const userId = maxId + 1;

    const addUser = {
      id: userId,
      firstName: data.value.firstName,
      middleName: data.value.middleName,
      lastName: data.value.lastName,
      email: data.value.email,
      password: data.value.password,
      password_confirmation: data.value.password_confirmation,
      for_911: data.value.for_911,
      for_inventory: data.value.for_inventory,
      for_traffic: data.value.for_traffic,
      is_deleted: data.value.is_deleted,
    }

    console.log("Add copy data sent: ", addUser)

    databaseStore.addUser(addUser);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("User added successfully:", addUser);

    const maxAccessId = databaseStore.inventoryAccesses.length
        ? Math.max(...databaseStore.inventoryAccesses.map(a => a.id || 0))
        : 0;

      // Convert boolean values to 0/1 for the database
      const accessData = {
        id: maxAccessId + 1,
        user_id: userId,
        for_dashboard: data.value.access.for_dashboard,
        for_transactions: data.value.access.for_transactions,
        for_inventory: data.value.access.for_inventory,
        for_categories: data.value.access.for_categories,
        for_borrowers: data.value.access.for_borrowers,
        for_offices: data.value.access.for_offices,
        for_users: data.value.access.for_users
      };

      console.log("Sending access data:", accessData);

      databaseStore.addInventoryAccess(accessData);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Access permissions added successfully:", accessData);
  } catch (error) {
    console.error('Error adding user:', error);
    emitter.emit("show-toast", { message: "Error adding user. Please try again.", type: "error" });
  } finally {

    isLoading.value = false;
    emitter.emit("show-toast", { message: "User added successfully!", type: "success" });
    closeModal();
  }
}

// error validation
const errors = ref({
  firstName: [],
  lastName: [],
  email: [],
  password: [],
  password_confirmation: [],
})

// fetching user data if there is a email in the users database and getting it's data
const foundUser = ref(null)

const checkEmailExists = () => {
  const userMatch = users.value.find(user => user.email === data.value.email);
  if (userMatch) {
    foundUser.value = userMatch;
    errors.value.email = ['Email is already registered'];
    return false;
  }
  foundUser.value = null;
  errors.value.email = [];
  return true;
}


// REGEXE s
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;


// Watch effects for real-time validation
watch(() => data.value.email, (newValue) => {
  if (!newValue) {
    errors.value.email = ["Email is required"];
  } else if (!emailRegex.test(newValue)) {
    errors.value.email = ["Please enter a valid email address"];
  } else {
    if (!checkEmailExists()) {
      errors.value.email = ['Email is already registered by another user'];
    }
  }
});

watch(() => data.value.password, (newValue) => {
  errors.value.password = [];
  if (!newValue) {
    errors.value.password = ["Password is required"];
  } else {
    if (!passwordRegex.test(newValue)) {
      errors.value.password = ["Password must contain special characters, letters and numbers"];
    }
    if (newValue.length < 8) {
      errors.value.password = ["Password must be at least 8 characters long"];
    }
  }
});

watch(() => data.value.password_confirmation, (newValue) => {
  if (!newValue) {
    errors.value.password_confirmation = ["Password confirmation is required"];
  } else if (newValue !== data.value.password) {
    errors.value.password_confirmation = ["Passwords don't match"];
  } else {
    errors.value.password_confirmation = [];
  }
});

// First name and last name validation
watch(() => data.value.firstName, (newValue) => {
  if (!newValue) {
    errors.value.firstName = ["First name is required"];
  } else {
    errors.value.firstName = [];
  }
});

watch(() => data.value.lastName, (newValue) => {
  if (!newValue) {
    errors.value.lastName = ["Last name is required"];
  } else {
    errors.value.lastName = [];
  }
});

const validateForm = () => {
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = [];
  });

  let hasErrors = false;

  if (!data.value.firstName) {
    errors.value.firstName = ["First name is required"];
    hasErrors = true;
  }

  if (!data.value.lastName) {
    errors.value.lastName = ["Last name is required"];
    hasErrors = true;
  }

  if (!data.value.email) {
    errors.value.email = ["Email is required"];
    hasErrors = true;
  } else if (!emailRegex.test(data.value.email)) {
    errors.value.email = ["Please enter a valid email address"];
    hasErrors = true;
  } else if (!checkEmailExists()) { // Add this condition
    hasErrors = true;
  }

  if (!data.value.password) {
    errors.value.password = ["Password is required"];
    hasErrors = true;
  } else {
    if (!passwordRegex.test(data.value.password)) {
      errors.value.password = ["Password must contain special characters, letters and numbers"];
      hasErrors = true;
    }
    if (data.value.password.length < 8) {
      errors.value.password = ["Password must be at least 8 characters long"];
      hasErrors = true;
    }
  }

  // Validate password confirmation
  if (!data.value.password_confirmation) {
    errors.value.password_confirmation = ["Password confirmation is required"];
    hasErrors = true;
  } else if (data.value.password !== data.value.password_confirmation) {
    errors.value.password_confirmation = ["Passwords don't match"];
    hasErrors = true;
  }

  return !hasErrors;
}

const isClickedShowConfirmationModal = () => {
  if (!validateForm()) {
    return;
  } else {
    showConfirmationModal.value = true
  }
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
        Add User
      </h3>

      <!-- QUANTITY INPUT -->
      <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
        <!-- FIRST NAME -->
        <div class="flex flex-row">
          <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">First Name:</label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.firstName ? errors.firstName[0] :
            '' }}</p>
        </div>

        <div class="relative ml-2 mb-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <BsBoxFill />
          </div>
          <input type="text" v-model="data.firstName"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="John">
        </div>
        <!-- MIDDLE NAME -->
        <div class="flex flex-row">
          <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Middle Name:</label>
        </div>

        <div class="relative ml-2 mb-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <BsBoxFill />
          </div>
          <input type="text" v-model="data.middleName"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Diego">
        </div>
        <!-- LAST NAME -->
        <div class="flex flex-row">
          <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Last Name:</label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.lastName ? errors.lastName[0] :
            '' }}</p>
        </div>

        <div class="relative ml-2 mb-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <BsBoxFill />
          </div>
          <input type="text" v-model="data.lastName"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Doe">
        </div>
        <!-- EMAIL -->
        <div class="flex flex-row">
          <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Email:</label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.email ? errors.email[0] :
            '' }}</p>
        </div>

        <div class="relative ml-2 mb-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <BsBoxFill />
          </div>
          <input type="text" v-model="data.email"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="johndoe@example.com">
        </div>

        <!-- PASSWORD -->
        <div class="flex flex-row">
          <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Password:</label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.password ? errors.password[0] :
            '' }}</p>
        </div>

        <div class="relative ml-2 mb-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <BsBoxFill />
          </div>
          <input type="password" v-model="data.password"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••">
        </div>

        <!-- CONFIRM PASSWORD -->
        <div class="flex flex-row">
          <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Confirm Password:</label>
          <p class="text-red-700 ml-2 font-semibold italic">{{ errors.password_confirmation ?
            errors.password_confirmation[0] :
            '' }}</p>
        </div>

        <div class="relative ml-2 mb-2">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <BsBoxFill />
          </div>
          <input type="password" v-model="data.password_confirmation"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••">
        </div>
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
            Add User
          </button>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <ConfirmationModal v-model="showConfirmationModal" title="Confirm Addition"
        :message="`You are about to add this user.`"
        :messageData="`\nFirst Name: ${data.firstName}\nLast Name: ${data.lastName}\nEmail: ${data.email}`" cancelText="Cancel"
        confirmText="Confirm Adding" @confirm="confirmAction" />
    </div>
  </div>
</template>