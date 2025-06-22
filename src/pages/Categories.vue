<script setup>
import { ref } from "vue";
import Loading from "../components/Loading.vue";
import CategoryTable from "../components/Category/CategoryTable.vue";
import AddCategoryModal from "../components/Category/Modals/AddCategoryModal.vue";
import RecoverCategoryModal from "../components/Category/Modals/RecoverCategoryModal.vue";

const isLoading = ref(false);
const isOpenAddCategoryModal = ref(false);
const isOpenRecoverCategoryModal = ref(false);

const API_KEY = import.meta.env.VITE_API_KEY;
</script>

<template>
    <div class="">
        <div
            class="sticky top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
            <h1 class="text-3xl ml-10 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">
                Categories
            </h1>
        </div>

        <!-- MAIN CONTAINER -->
        <div
            class="border-2 mt-4 px-4 border-blue-400 dark:border-gray-800 backdrop-blur-lg bg-slate-400/50 dark:bg-black rounded-xl">
            <div class="">
                <CategoryTable 
                    @open-add-category-modal="isOpenAddCategoryModal = true"
                    @open-recover-category-modal="isOpenRecoverCategoryModal = true" 
                />
            </div>
        </div>

        <AddCategoryModal v-if="isOpenAddCategoryModal" v-model="isOpenAddCategoryModal" @click.stop />
        <RecoverCategoryModal v-if="isOpenRecoverCategoryModal" v-model="isOpenRecoverCategoryModal" @click.stop />
    </div>
</template>