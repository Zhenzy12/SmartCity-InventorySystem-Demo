<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axiosClient from '../../../axios';
import { AnOutlinedNumber } from '@kalimahapps/vue-icons';
import { BsBoxFill } from '@kalimahapps/vue-icons';
import { FlFilledTextDescription } from '@kalimahapps/vue-icons';
import { BxSolidCategoryAlt } from '@kalimahapps/vue-icons';
import ConfirmationModal from '../../ConfirmationModal.vue';
import Loading from '../../Loading.vue';
import { MdOutlinedAlternateEmail } from '@kalimahapps/vue-icons';
import { FlFilledBookContacts } from '@kalimahapps/vue-icons';
import { ReLockPasswordLine } from '@kalimahapps/vue-icons';
import { useDatabaseStore } from '../../../stores/databaseStore';

const databaseStore = useDatabaseStore()

// FOR THE TOAST
import emitter from "../../../eventBus";

const API_KEY = import.meta.env.VITE_API_KEY;

const isLoading = ref(false)

const password = ref('')
const confirmPassword = ref('')

const props = defineProps({
    modelValue: Boolean,
    user: Object,
})

const showConfirmationModal = ref(false)

const confirmAction = (confirmed) => {
    if (confirmed) {
        confirmUpdatePassword()
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

const passwordError = ref('')

const confirmUpdatePassword = async () => {
    try {
        isLoading.value = true

        const updatePassword = {
            id: props.user.id,
            firstName: props.user.firstName,
            middleName: props.user.middleName,
            lastName: props.user.lastName,
            email: props.user.email,
            is_deleted: props.user.is_deleted,
            password: password.value,
            for_911: props.user.for_911,
            for_inventory: props.user.for_inventory,
            for_traffic: props.user.for_traffic,
        }

        console.log("Add password data sent: ", updatePassword)

        databaseStore.updateUser(updatePassword);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("User password updated successfully:", updatePassword);
    } catch (error) {
        console.error('Error updating password:', error);
        emitter.emit("show-toast", { message: "Error updating password. Please try again.", type: "error" });
    } finally {
        isLoading.value = false;
        emitter.emit("show-toast", { message: "User password updated successfully!", type: "success" });
        closeModal();
    }
}

// validations
const errors = ref({
    password: [],
    password_confirmation: [],
})

// REGEX s
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;

const validateForm = () => {
    Object.keys(errors.value).forEach(key => {
        errors.value[key] = [];
    });

    let hasErrors = false;

    if (!password.value) {
        errors.value.password = ["Password is required"];
        hasErrors = true;
    } else {
        if (!passwordRegex.test(password.value)) {
            errors.value.password = ["Password must contain special characters, letters and numbers"];
            hasErrors = true;
        }
        if (password.value.length < 8) {
            errors.value.password = ["Password must be at least 8 characters long"];
            hasErrors = true;
        }
    }

    // Validate password confirmation
    if (!confirmPassword.value) {
        errors.value.password_confirmation = ["Password confirmation is required"];
        hasErrors = true;
    } else if (password.value !== confirmPassword.value) {
        errors.value.password_confirmation = ["Passwords don't match"];
        hasErrors = true;
    }

    return !hasErrors;
    
}


// watch for validation
watch(() => password.value, (newValue) => {
    errors.value.password = [];
    if (!newValue) {
        errors.value.password = ["Password is required"];
    } else {
        if (!passwordRegex.test(newValue)) {
            errors.value.password = ["Password must contain special characters,  letters and numbers"];
        }
        if (newValue.length < 8) {
            errors.value.password = ["Password must be at least 8 characters long"];
        }
    }
});

watch(() => confirmPassword.value, (newValue) => {
    if (!newValue) {
        errors.value.password_confirmation = ["Password confirmation is required"];
    } else if (newValue !== password.value) {
        errors.value.password_confirmation = ["Passwords don't match"];
    } else {
        errors.value.password_confirmation = [];
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
                Change Password
            </h3>

            <!-- USER INPUT -->
            <div class="px-5 text-start max-h-[69vh] overflow-y-auto">
                <!-- Password -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Password:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.password ? errors.password[0] : '' }}
                    </p>
                </div>

                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <ReLockPasswordLine />
                    </div>
                    <input type="password" v-model="password"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Enter new password">
                </div>
                <!-- Password verification -->
                <div class="flex flex-row">
                    <label class="block mb-2 text font-medium text-gray-900 dark:text-gray-200">Confirm
                        Password:</label>
                    <p class="text-red-700 ml-2 font-semibold italic">{{ errors.password_confirmation ?
                        errors.password_confirmation[0] : '' }}</p>
                </div>
                <div class="relative ml-2 mb-2">
                    <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                        <ReLockPasswordLine />
                    </div>
                    <input type="password" v-model="confirmPassword"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Enter password again">
                </div>
                <div v-if="passwordError" style="color: red">{{ passwordError }}</div>
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
                        Change Password
                    </button>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <ConfirmationModal v-model="showConfirmationModal" title="Change Password"
                :message="`You are about to update this user's password.`"
                :messageData="`\nFirst Name: ${props.user.firstName}\nMiddle Name: ${props.user.middleName}\nLast Name: ${props.user.lastName}\nEmail: ${props.user.email}`"
                cancelText="Cancel" confirmText="Change Password" @confirm="confirmAction" />
        </div>
    </div>
</template>
