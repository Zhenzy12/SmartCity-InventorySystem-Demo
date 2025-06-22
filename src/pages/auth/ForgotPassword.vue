<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axiosClient from "../../axios.js";
import router from "../../router.js";
import logo from "../../assets/baguio-logo.png";
import { useDatabaseStore } from "../../stores/databaseStore.js";
import { MdNavigateNext } from '@kalimahapps/vue-icons';
import emitter from "../../eventBus.js";

const API_KEY = import.meta.env.VITE_API_KEY;

const props = defineProps({
  token: String,
  email: String,
  reset: Boolean
});

const isLoading = ref(false);

// fetching data
const databaseStore = useDatabaseStore()

const computedProperties = {
  users: "users",
};

const {
  users,
} = Object.fromEntries(
  Object.entries(computedProperties).map(([key, value]) => [key, computed(() => databaseStore[value])])
);

const data = ref({
  email: '',
  password: '',
  password_confirmation: '',
  token: '',
})

const errors = ref({
  email: [],
  password: [],
  password_confirmation: [],
})

// REGEX s
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = () => {
  Object.keys(errors.value).forEach(key => {
    errors.value[key] = [];
  });

  let hasErrors = false;

  if (!data.value.email) {
    errors.value.email = ["Email is required"];
    hasErrors = true;
  } else if (!emailRegex.test(data.value.email)) {
    errors.value.email = ["Please enter a valid email address"];
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

// watch effect for validation
// Watch effects for real-time validation
watch(() => data.value.email, (newValue) => {
  if (!newValue) {
    errors.value.email = ["Email is required"];
  } else if (!emailRegex.test(newValue)) {
    errors.value.email = ["Please enter a valid email address"];
  } else {
    errors.value.email = [];
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

const sendResetLink = async () => {
  try {
    isLoading.value = true;
    
    // Check if email exists first
    const userMatch = users.value.find(user => user.email === data.value.email);
    if (!userMatch) {
      errors.value.email = ['Email not found in our records'];
      return;
    }

    // Send reset link email
    const response = await axiosClient.post('/forgot-password', {
      email: data.value.email
    });

    emitter.emit("show-toast", { 
      message: "Password reset link has been sent to your email!", 
      type: "success" 
    });
    
    // Clear the form after successful send
    data.value.email = '';
  } catch (error) {
    console.error('Error sending reset link:', error);
    emitter.emit("show-toast", { 
      message: error.response?.data?.message || "Error sending reset link", 
      type: "error" 
    });
  } finally {
    isLoading.value = false;
  }
};

const resetPassword = async () => {
  console.log("changing")
  try {
    console.log("validating form")

    if (validateForm()) {
      return;
    }
    console.log("validated form")
    
    isLoading.value = true;
    const response = await axiosClient.post('/reset-password', {
      email: props.email,
      password: data.value.password,
      password_confirmation: data.value.password_confirmation,
      token: props.token
    });

    
    console.log("response: ", response.value)

    emitter.emit("show-toast", { 
      message: "Password reset successfully!", 
      type: "success" 
    });
    
    // Clear sensitive data
    data.value = {
      email: '',
      password: '',
      password_confirmation: '',
      token: ''
    };
    
    // Redirect to login
    router.push('/login');
  } catch (error) {
    console.error('Error resetting password:', error);
    emitter.emit("show-toast", { 
      message: error.response?.data?.message || "Error resetting password", 
      type: "error" 
    });
  } finally {
    isLoading.value = false;
  }
};

// Add this in the setup section:
onMounted(() => {
  if (!props.token && !props.email) {
    data.value.token = props.token;
    data.value.email = props.email;
    phaseNum.value = 1;
  }else {
    phaseNum.value = 2;
  }

  databaseStore.fetchData();
});


const breadcrumbItems = ref([
  { text: 'Input Email' },
  { text: 'Input Password' },
])

const phaseNum = ref(1)

const phaseOne = () => {
  phaseNum.value = 1
}

// const phaseTwo = () => {
//   if (checkEmailExists()) {
//     phaseNum.value = 2;
//   }
// }
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-blue-900 relative">
    <!-- Main Container -->
    <div class="flex flex-col items-center gap-1 z-10 bg-gray-200 rounded-xl p-8 min-h-[30vh]">

      <!-- TITLE -->
      <h2 class="text-gray-900 text-2xl text-center font-bold mb-2">Forgot Password</h2>

      <!-- BREAD CRUMB -->
      <div class="w-full px-1 mb-4  ">
        <ul class="flex items-center">
          <li class="flex items-center">
            <a class="text-md font-medium" @click="phaseOne"
              :class="{ 'text-blue-600': phaseNum === 1, 'text-gray-800': phaseNum !== 1 }">Enter Email</a>
          </li>
          <li class="flex items-center">
            <span class="text-body-color dark:text-dark-6 px-3">
              <MdNavigateNext class="w-5 h-5" />
            </span>
            <span class="text-md font-medium"
              :class="{ 'text-blue-600': phaseNum === 2, 'text-gray-800': phaseNum !== 2 }">Enter Password</span>
          </li>
        </ul>
      </div>

      <!-- FOR PHASE 1 -->
      <div v-if="phaseNum === 1">
        <div
          class="bg-gray-100 mb-4 px-6 rounded-xl shadow-lg min-w-[900px] min-h-[21vh] flex justify-center items-center w-full">

          <div class="w-full">
            <div class="flex flex-row">
              <label for="email" class="block text-md font-medium text-gray-700">Enter Email</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.email ? errors.email[0] : '' }}</p>
            </div>

            <input type="email" name="email" id="email" autocomplete="email" v-model="data.email"
              class="mt-1 w-full px-3 py-2 border text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

        </div>
        <div class="flex justify-center">
  <!-- Replace this existing button -->
  <button @click="sendResetLink"
    :disabled="isLoading"
    class="w-full items-center bg-blue-600 text-white py-2 mt-1 font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
    {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
  </button>
</div>
      </div>

      <!-- FOR PHASE 2 -->
      <div v-if="phaseNum === 2">
        <div class="bg-white p-6 rounded-xl shadow-lg min-w-[900px] mb-4 min-h-[21vh]">

          <div class="">
            <div class="flex flex-row">
              <label for="email" class="block text-md font-medium text-gray-700">Password</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.password ? errors.password[0] : '' }}</p>
            </div>
            <input type="password" name="password" id="password" v-model="data.password"
              class="mt-1 w-full px-3 py-2 border text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="">
            <div class="flex flex-row">
              <label for="email" class="block text-md font-medium text-gray-700">Confirm Password</label>
              <p class="text-red-700 ml-2 font-semibold italic">{{ errors.password_confirmation ?
                errors.password_confirmation[0] : '' }}</p>
            </div>
            <input type="password" name="password" id="passwordConfirmation" v-model="data.password_confirmation"
              class="mt-1 w-full px-3 py-2 border text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>


        <div class="flex gap-2">
  <button @click="phaseOne"
    class="w-full bg-blue-600 text-white py-2 mt-1 font-semibold rounded-md hover:bg-blue-700">Back</button>
  <!-- Replace this existing button -->
  <button @click="resetPassword()"
    :disabled="isLoading"
    class="w-full bg-blue-600 text-white py-2 mt-1 font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400">
    {{ isLoading ? 'Resetting...' : 'Reset Password' }}
  </button>
</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>