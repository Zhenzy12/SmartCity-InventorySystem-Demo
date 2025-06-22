<script setup>
import { ref } from "vue";
import OfficeTable from "../components/Office/OfficeTable.vue";
import RecoverOfficeModal from "../components/Office/Modals/RecoverOfficeModal.vue";
import AddOfficeModal from "../components/Office/Modals/AddOfficeModal.vue";

const isLoading = ref(false);
const isOpenAddOfficeModal = ref(false);
const isOpenRecoverOfficeModal = ref(false);

const API_KEY = import.meta.env.VITE_API_KEY;
</script>

<template>
    <div class="">
        <div
            class="sticky top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
            <h1 class="text-3xl ml-10 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">
                Offices
            </h1>
        </div>

        <!-- MAIN CONTAINER -->
        <div
            class="border-2 mt-4 px-4 border-blue-400 dark:border-gray-800 backdrop-blur-lg bg-slate-400/50 dark:bg-black rounded-xl">
            <div class="">
                <OfficeTable @open-add-office-modal="isOpenAddOfficeModal = true"
                    @open-recover-office-modal="isOpenRecoverOfficeModal = true" />
            </div>
        </div>
        <AddOfficeModal v-if="isOpenAddOfficeModal" v-model="isOpenAddOfficeModal" @click.stop />
        <RecoverOfficeModal v-if="isOpenRecoverOfficeModal" v-model="isOpenRecoverOfficeModal" @click.stop />
    </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
