<script setup>
import { useRouter } from 'vue-router';
import errorBg from '../../assets/darkBlueBg.jpg';
import { MdMarkEmailRead } from '@kalimahapps/vue-icons';
import { IoOutlineArrowForward } from '@kalimahapps/vue-icons';

const router = useRouter();

const goHome = () => {
    router.push('/');
};
</script>

<template>
    <div :style="{
        backgroundImage: `url(${errorBg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    }" class="flex flex-col items-center justify-center min-h-screen w-full">

        <div class="absolute inset-0 bg-teal-700/30 z-0"></div>

        <div
            class="animate-rotate-border rounded-3xl p-1.5 transition-all duration-500 ease-out bg-conic/[from_var(--border-angle)] from-green-500/10 via-green-500 to-green-500/10">
            <div
                class="bg-black/95 backdrop-blur-lg rounded-3xl p-20 flex flex-col items-center justify-center text-white">
                <MdMarkEmailRead class="w-50 h-50 mb-6 text-green-700" />
                <p class="text-5xl font-bold mb-1">EMAIL VERIFIED</p>
                <p class="text-xl mt-2">Your email has been successfully verified! You can now access the SCCC-Inventory System.
                </p>
                <button @click="goHome"
                    class="mt-6 px-5 py-2 cursor-pointer rounded-lg bg-green-700 hover:bg-green-700 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
                    Go to Dashboard
                    <IoOutlineArrowForward class="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
</template>
