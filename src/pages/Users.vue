<script setup>
import { ref } from "vue";
import Loading from "../components/Loading.vue";
import UsersTable from "../components/Users/UsersTable.vue";
import AddUserModal from "../components/Users/Modals/AddUserModal.vue";
import RecoverUserModal from "../components/Users/Modals/RecoverUserModal.vue";
import GiveAccessModal from "../components/Users/Modals/GiveAccessModal.vue";
import UpdateUserModal from "../components/Users/Modals/UpdateUsersModal.vue";
import UpdateUsersPasswordModal from "../components/Users/Modals/UpdateUsersPasswordModal.vue";

const isLoading = ref(false);
const isOpenAddUserModal = ref(false);
const isOpenRecoverUserModal = ref(false);
const isOpenUpdateUsersModal = ref(false);
const isOpenGiveAccessModal = ref(false);
const isOpenUpdateUsersPasswordModal = ref(false);
const selectedUser = ref(null);

const OpenGiveAccessModal = (user) => {
    selectedUser.value = user;
    isOpenGiveAccessModal.value = true;
};

const OpenUpdateUsersModal = (user) => {
    selectedUser.value = user;
    isOpenUpdateUsersModal.value = true;
};

const OpenUpdateUsersPasswordModal = (user) => {
    console.log("Update user password data: ", user)
    selectedUser.value = user;
    isOpenUpdateUsersPasswordModal.value = true;
};

</script>

<template>
    <div class="">
        <div
            class="sticky top-2 z-20 backdrop-blur-sm px-6 py-4 border-2 rounded-2xl bg-gray-200/45 border-blue-500/85 dark:bg-gray-800/45 dark:border-gray-300/85">
            <h1 class="text-3xl ml-10 xl:ml-0 font-bold tracking-tight text-gray-950 dark:text-gray-100">
                Users
            </h1>
        </div>

        <!-- MAIN CONTAINER -->
        <div
            class="border-2 mt-4 px-4 rounded-xl border-blue-400 dark:border-gray-800 backdrop-blur-lg bg-slate-400/50 dark:bg-black">
            <div v-if="isLoading" class="min-h-[88vh] flex items-center justify-center">
                <Loading />
            </div>
            <div class="">
                <UsersTable @open-add-user-modal="isOpenAddUserModal = true"
                    @open-recover-user-modal="isOpenRecoverUserModal = true"
                    @open-update-users-modal="OpenUpdateUsersModal"
                    @open-give-access-modal="OpenGiveAccessModal" 
                    @open-update-users-password-modal="OpenUpdateUsersPasswordModal"
                    />
            </div>
        </div>
        <AddUserModal v-if="isOpenAddUserModal" v-model="isOpenAddUserModal" @click.stop />
        <RecoverUserModal v-if="isOpenRecoverUserModal" v-model="isOpenRecoverUserModal" @click.stop />
        <GiveAccessModal v-if="isOpenGiveAccessModal" v-model="isOpenGiveAccessModal" :user="selectedUser"  @click.stop />
        <UpdateUserModal v-if="isOpenUpdateUsersModal" v-model="isOpenUpdateUsersModal" :user="selectedUser"  @click.stop />
        <UpdateUsersPasswordModal v-if="isOpenUpdateUsersPasswordModal" v-model="isOpenUpdateUsersPasswordModal" :user="selectedUser"  @click.stop />
    </div>
</template>
