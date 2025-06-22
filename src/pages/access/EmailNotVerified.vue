<script setup>
import { useRouter } from 'vue-router';
import errorBg from '../../assets/errorBg.jpg';
import { GlGoBack } from '@kalimahapps/vue-icons';
import { FlFilledCalendarQuestionMark } from '@kalimahapps/vue-icons';
import axiosClient from '../../axios.js';
import useUserStore from '../../stores/user.js';
import emitter from '../../eventBus.js';
import Loading from '../../components/Loading.vue';
import { ref } from 'vue';

const userStore = useUserStore();

const isLoading = ref(false);

const router = useRouter();

function goLogout() {
    isLoading.value = true
    console.log('Logout clicked');
    if (userStore.user) {
        axiosClient.post('/logout').then(() => {
            router.push('/login');
        });
    } else {
        router.push('/login');
    }
}

const resendEmail = () => {
    isLoading.value = true
    axiosClient.post('/email/verification-notification')
        .then(response => {
            // Handle success
            console.log('Verification email sent:', response.data);
            // alert('Verification email has been sent! Please check your inbox.');
            emitter.emit("show-toast", { message: "Verification email has been sent! Please check your inbox.", type: "success" });
        })
        .catch(error => {
            // Handle error
            console.error('Error sending verification email:', error);
            // alert('Failed to send verification email. Please try again later.');
            isLoading.value = false
            emitter.emit("show-toast", { message: "Failed to send verification email. Please try again later.", type: "error" });
        })
};

</script>

<template>
    <div>


        <div :style="{
            backgroundImage: `url(${errorBg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
        }" class="flex flex-col items-center justify-center min-h-screen w-full">

            <div class="absolute inset-0 bg-black/50 z-0"></div>
            <div v-if="isLoading" class="h-[72vh] flex flex-col items-center justify-center">
                    <Loading />
                </div>
            <div
                v-else class="animate-rotate-border rounded-3xl p-1.5 transition-all duration-500 ease-out bg-conic/[from_var(--border-angle)] from-red-900/30 via-red-600 to-red-900/30">

                <div
                    class="bg-black/80 backdrop-blur-lg rounded-3xl p-20 flex flex-col items-center justify-center text-white">
                    <FlFilledCalendarQuestionMark class="w-52 h-52 mb-4 text-red-700" />
                    <p class="text-5xl font-bold mb-1">EMAIL NOT VERIFIED</p>
                    <p class="text-xl mt-2">Oops! The page you're looking for doesn't exist.
                    </p>
                    <div class="flex flex-row w-full items-center justify-between gap-2">
                        <button @click="goLogout()"
                            class="mt-6 px-5 py-2 w-full text-center cursor-pointer rounded-lg bg-red-700 hover:bg-green-700 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
                            <GlGoBack class="w-5 h-5" />
                            Back to Login
                        </button>
                        <button @click="resendEmail"
                            class="mt-6 px-5 py-2 w-full text-center cursor-pointer rounded-lg bg-red-700 hover:bg-green-700 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
                            <GlGoBack class="w-5 h-5" />
                            Send Verification Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
