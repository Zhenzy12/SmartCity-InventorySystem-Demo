<script setup>
import { useRouter } from 'vue-router';
import { ref, watch, onMounted } from 'vue';
import errorBg from '../../assets/errorBg.jpg';
import { IcPcNoEntry } from '@kalimahapps/vue-icons';
import { GlGoBack } from '@kalimahapps/vue-icons';
import { HiSolidUserPlus } from '@kalimahapps/vue-icons';
import axiosClient from '../../axios.js';
import useUserStore from '../../stores/user.js';
import emitter from '../../eventBus.js';

const API_KEY = import.meta.env.VITE_API_KEY;

const userStore = useUserStore();

const router = useRouter();

const isLoading = ref(false)

function goLogout() {
    console.log('Logout clicked');
    if (userStore.user) {
        axiosClient.post('/logout').then(() => {
            router.push('/login');
        });
    } else {
        router.push('/login');
    }
}

// function updateUser() {
//     console.log('updateUser Clicked');
//     console.log('userStore.user', userStore.user);
// }

onMounted(() => {
    if (userStore.user === null) {
        router.push({ name: 'Login' })
    }
});

const confirmUpdateUser = async () => {
    console.log('userStore.user', userStore.user);

    try {
        isLoading.value = true

        const updateUsers = {
            firstName: userStore.user.firstName,
            middleName: userStore.user.middleName,
            lastName: userStore.user.lastName,
            email: userStore.user.email,
            email_verified_at: userStore.user.email_verified_at,
            for_911: userStore.user.for_911,
            for_inventory: 1,
            is_deleted: userStore.user.is_deleted,
        }

        console.log("Add copy data sent: ", updateUsers)

        const response = await axiosClient.put(
            `/api/users/${userStore.user.id}`,
            updateUsers,
            {
                headers: {
                    "x-api-key": API_KEY,
                },
            }
        );
        console.log('Update User API response:', response);
        // emitter.emit("show-toast", { message: "Borrower updated successfully!", type: "success" });
        // closeModal()
        router.push({ name: 'Dashboard' })
    } catch (error) {
        console.error('Error updating user:', error);
        console.error('Error details:', error.response?.data);
        emitter.emit("show-toast", { message: "Error updating user. Please try again.", type: "error" });
    } finally {
        useUserStore();
        isLoading.value = false;
        emitter.emit("show-toast", { message: "User updated successfully!", type: "success" });
    }
}

</script>

<template>
    <div :style="{
        backgroundImage: `url(${errorBg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    }" class="flex flex-col items-center justify-center min-h-screen w-full">

        <div class="absolute inset-0 bg-black/50 z-0"></div>

        <div
            class="animate-rotate-border max-w-[50vw] rounded-3xl p-1.5 transition-all duration-500 ease-out bg-conic/[from_var(--border-angle)] from-red-900/30 via-red-600 to-red-900/30">
            <div
                class="bg-black/80 backdrop-blur-lg rounded-3xl p-20 flex flex-col items-center justify-center text-white">
                <IcPcNoEntry class="w-50 h-50 mb-6 text-red-700" />
                <p class="text-5xl font-bold mb-1">NO SCCC INVENTORY ACCESS</p>
                <p class="text-xl mt-2">You have no access to SCCC Inventory Dashboard but you have an account with an
                    access to SCCC 911 Dashboard. Press the CREATE ACCOUNT button to have an access to SCCC Inventory
                    Dashboard.
                </p>
                <div class="flex flex-row w-full items-center justify-center gap-2">
                    <button @click="goLogout()"
                        class="mt-6 px-5 py-2 cursor-pointer rounded-lg bg-red-700 hover:bg-green-700 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
                        <GlGoBack class="w-5 h-5" />
                        Back to Login
                    </button>
                    <button @click="confirmUpdateUser()"
                        class="mt-6 px-5 py-2 cursor-pointer rounded-lg bg-green-700 hover:bg-green-900 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
                        <HiSolidUserPlus class="w-5 h-5" />
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
