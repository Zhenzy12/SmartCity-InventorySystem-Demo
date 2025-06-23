<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import axiosClient from '../../../axios';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import { BsBoxFill } from '@kalimahapps/vue-icons';
import { FlFilledTextDescription } from '@kalimahapps/vue-icons';
import { BxSolidCategoryAlt } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import { MdOutlinedAlternateEmail } from '@kalimahapps/vue-icons';
import { FlFilledBookContacts } from '@kalimahapps/vue-icons';
import { useDatabaseStore } from '../../../stores/databaseStore';

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

// fetching users
const databaseStore = useDatabaseStore()



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


const isLoading = ref(false)

const firstName = ref('')
const middleName = ref('')
const lastName = ref('')
const email = ref('')

const props = defineProps({
    modelValue: Boolean,
    user: Object,
    users: Array
})

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
    if (confirmed) {
        confirmUpdateUsers()
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

watch(() => props.user, (users) => {
    if (users) {
        firstName.value = users.firstName
        middleName.value = users.middleName
        lastName.value = users.lastName
        email.value = users.email
    }
}, { immediate: true })

const confirmUpdateUsers = async () => {
    try {
        isLoading.value = true

        const updateUser = {
            id: props.user.id,
            firstName: firstName.value,
            middleName: middleName.value,
            lastName: lastName.value,
            email: email.value,
            is_deleted: props.user.is_deleted,
            for_911: props.user.for_911,
            for_inventory: props.user.for_inventory,
            for_traffic: props.user.for_traffic,
        }

        console.log("Update user data sent: ", updateUser)

        databaseStore.updateUser(updateUser)
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("User updated successfully:", updateUser);

    } catch (error) {
        console.error('Error updating user:', error);
        console.error('Error details:', error.response?.data);
        emitter.emit("show-toast", { message: "Error updating user. Please try again.", type: "error" });
    } finally {
        isLoading.value = false;
        emitter.emit("show-toast", { message: "User updated successfully!", type: "success" });
        closeModal();
    }
}

// error validation
const errors = ref({
    firstName: [],
    middleName: [],
    lastName: [],
    email: [],
})

// fetching user data if there is a email in the users database and getting it's data
const foundUser = ref(null)

const checkEmailExists = () => {
    const userMatch = users.value.find(user =>
        user.email === email.value && user.id !== props.user.id
    );

    if (userMatch) {
        foundUser.value = userMatch;
        errors.value.email = ['Email is already registered by another user'];
        return false;
    }

    foundUser.value = null;
    errors.value.email = [];
    return true;
}


// REGEXE s
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = () => {
    Object.keys(errors.value).forEach(key => {
        errors.value[key] = [];
    });

    let hasErrors = false;

    if (!firstName.value) {
        errors.value.firstName = ["First name is required"];
        hasErrors = true;
    }

    if (!lastName.value) {
        errors.value.lastName = ["Last name is required"];
        hasErrors = true;
    }

    if (!email.value) {
        errors.value.email = ["Email is required"];
        hasErrors = true;
    } else if (!emailRegex.test(email.value)) {
        errors.value.email = ["Please enter a valid email address"];
        hasErrors = true;
    } else if (!checkEmailExists()) {
        hasErrors = true;
    }

    return !hasErrors;
}

// watch effect for validation
watch(() => firstName.value, (newValue) => {
    if (!newValue) {
        errors.value.firstName = ["First name is required"];
    } else {
        errors.value.firstName = [];
    }
});

watch(() => lastName.value, (newValue) => {
    if (!newValue) {
        errors.value.lastName = ["Last name is required"];
    } else {
        errors.value.lastName = [];
    }
});


watch(() => email.value, (newValue) => {
    if (!newValue) {
        errors.value.email = ["Email is required"];
    } else if (!emailRegex.test(newValue)) {
        errors.value.email = ["Please enter a valid email address"];
    } else {
        // Directly handle the validation result
        if (!checkEmailExists()) {
            errors.value.email = ['Email is already registered by another user'];
        }
    }
});

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
            class="w-full max-w-[650px] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border border-4 dark:bg-gray-950 dark:border-gray-100">
            <h3 class="text-3xl font-semibold mb-4">
                Update User
            </h3>

            <!-- USER INPUT -->
            <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
                <!-- First Name -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">First Name:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.firstName ?
                        errors.firstName[0] :
                        '' }}</p>
                </div>

                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <FlFilledBookContacts />
                    </div>
                    <input type="text" v-model="firstName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. Leonardo">
                </div>
                <!-- MIDDLE NAME -->
                <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Middle Name:</label>
                <div class="relative ml-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <FlFilledBookContacts />
                    </div>
                    <input type="text" v-model="middleName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. Wilhelm">
                </div>
                <!-- LAST NAME -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Last Name:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.lastName ?
                        errors.lastName[0] :
                        '' }}</p>
                </div>
                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <FlFilledBookContacts />
                    </div>
                    <input type="text" v-model="lastName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. DiCaprio">
                </div>
                <!-- EMAIL -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Email:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.email ?
                        errors.email[0] :
                        '' }}</p>
                </div>
                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <MdOutlinedAlternateEmail />
                    </div>
                    <input type="email" v-model="email"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Ex. example@gmail.com">
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
                        Update
                    </button>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <ConfirmationModal v-model="showConfirmationModal" title="Confirm Update"
                :message="`You are about to update this user.`"
                :messageData="`\nFirst Name: ${firstName}\nMiddle Name: ${middleName || 'N/A'}\nLast Name: ${lastName}\nEmail: ${email}`"
                cancelText="Cancel" confirmText="Confirm Update" @confirm="confirmAction" />
        </div>
    </div>
</template>
