<script setup>
import { ref } from "vue";
import Loading from "../components/Loading.vue";
import BorrowersTable from "../components/Borrowers/BorrowersTable.vue";
import RecoverBorrowerModal from "../components/Borrowers/Modals/RecoverBorrowerModal.vue";
import AddBorrowerModal from "../components/Borrowers/Modals/AddBorrowerModal.vue";

const isLoading = ref(false);
const isOpenAddBorrowerModal = ref(false);
const isOpenRecoverBorrowerModal = ref(false);

const API_KEY = import.meta.env.VITE_API_KEY;
</script>

<template>
    <div class="">
        <div
            class="sticky top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
            <h1 class="text-3xl ml-10 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">
                Borrowers
            </h1>
        </div>

        <!-- MAIN CONTAINER -->
        <div
            class="border-2 mt-4 px-4 border-blue-400 dark:border-gray-800 backdrop-blur-lg bg-slate-400/50 dark:bg-black rounded-xl">
            <div v-if="isLoading" class="min-h-[88vh] flex items-center justify-center">
                <Loading />
            </div>
            <div class="">
                <BorrowersTable 
            @open-add-borrower-modal="isOpenAddBorrowerModal = true"
            @open-recover-borrower-modal="isOpenRecoverBorrowerModal = true" 
        />
            </div>
        </div>
        <AddBorrowerModal v-if="isOpenAddBorrowerModal" v-model="isOpenAddBorrowerModal" @click.stop />
    <RecoverBorrowerModal v-if="isOpenRecoverBorrowerModal" v-model="isOpenRecoverBorrowerModal" @click.stop />
    </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
