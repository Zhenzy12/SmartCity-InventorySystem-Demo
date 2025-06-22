<script setup>

import { ref, computed, onMounted, onUnmounted } from "vue";
import useUserStore from "../stores/user.js";
import axiosClient from "../axios.js";
import { FeLogOut } from '@kalimahapps/vue-icons';
import { ClCloseMd } from '@kalimahapps/vue-icons';
import { MdDashboard } from '@kalimahapps/vue-icons';
import { MdInventory2 } from '@kalimahapps/vue-icons';
import { MdRoundCategory } from '@kalimahapps/vue-icons';
import { FlFilledPeopleSwap } from '@kalimahapps/vue-icons';
import { FaUserGear } from '@kalimahapps/vue-icons';
import { BxSolidBuildings } from '@kalimahapps/vue-icons';
import lightBlueBg from "../assets/lightBlueBg.jpg";
import darkBlueBg from "../assets/darkBlueBg3.jpg";
import { MdRoundDarkMode } from '@kalimahapps/vue-icons';
import { MdRoundLightMode } from '@kalimahapps/vue-icons';
import { HuExchangeHorizontal } from '@kalimahapps/vue-icons';

const theme = ref(localStorage.getItem("theme") || "light");

const signout_visible = ref(false);

const sidebarVisible = ref(false);

const toggleTheme = () => {
    if (theme.value === "light") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        theme.value = "dark";
    } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        theme.value = "light";
    }
};

const toggleSidebar = () => {
    sidebarVisible.value = !sidebarVisible.value;
}

const closeSidebar = () => {
    sidebarVisible.value = false;
};

onMounted(() => {
    if (localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark");
        theme.value = "dark";
    }
    document.addEventListener('click', handleClickOutside);
});

const userStore = useUserStore();
const user = computed(() => userStore.user);
const inventoryAccess = computed(() => userStore.inventoryAccess?.inventoryAccess || {});

function logout() {
    axiosClient.post('/logout').then(() => {
        window.location.reload();
    });
}

const profileSettingsDropdownOpen = ref(false)
const profileSettingsDropdownButtonRef = ref(null)

const toggleProfileSettingsDropdown = () => {
    profileSettingsDropdownOpen.value = !profileSettingsDropdownOpen.value
}
const toggleButtonRef = ref(null);
const sidebarRef = ref(null);

// Custom composition function to handle click outside
const handleClickOutside = (event) => {
    console.log("clicked outside");
    if (
        profileSettingsDropdownButtonRef.value &&
        !profileSettingsDropdownButtonRef.value.contains(event.target)
    ) {
        profileSettingsDropdownOpen.value = false;
    }
    if (
        sidebarVisible.value &&
        sidebarRef.value &&
        toggleButtonRef.value &&
        !sidebarRef.value.contains(event.target) &&
        !toggleButtonRef.value.contains(event.target)
    ) {
        sidebarVisible.value = false;
    }
};

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

const openSignOutModal = () => {
    signout_visible.value = true;
};

const closeSignOutModal = () => {
    signout_visible.value = false;
};


</script>

<template>
    <div :style="{ backgroundImage: `url(${theme === 'dark' ? darkBlueBg : lightBlueBg})` }"
        class="bg-cover bg-center min-h-screen">

        <aside id="logo-sidebar" ref="sidebarRef"
            class="fixed top-0 left-0 w-64 h-screen pt-4 pl-3 xl:pt-4 transition-transform z-100 xl:z-5 backdrop-blur-lg xl:translate-x-0 bg-sky-200/10 dark:bg-gray-900/80 xl:bg-transparent xl:dark:bg-transparent"
            :class="sidebarVisible ? 'translate-x-0' : '-translate-x-full'" aria-label="Sidebar">

        <!-- <aside id="logo-sidebar" ref="sidebarRef"
            class="fixed top-0 left-0 w-64 h-screen pt-4 pl-3 xl:pt-4 transition-transform z-100 xl:z-5 backdrop-blur-lg xl:translate-x-0 bg-sky-200/10 dark:bg-gray-900/80 xl:bg-transparent xl:dark:bg-transparent"
            :class="sidebarVisible ? 'translate-x-0' : '-translate-x-full'" aria-label="Sidebar"> -->
            <div class="h-full px-3 pb-4 overflow-y-auto flex flex-col justify-between">

                <ul class=" font-medium">
                    <div class="mb-6 mt-2">
                        <div class="flex">
                            <img src="../assets/baguio-logo.png" class="h-12 me-1" alt="Smart City Baguio" />
                            <span
                                class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">SCCC-Inventory</span>
                        </div>
                        <div
                            class="h-0.5 bg-gradient-to-r from-blue-100 via-blue-500 to-blue-100 dark:from-blue-950 dark:via-blue-500 dark:to-blue-950">
                        </div>
                    </div>
                    <li>
                        <div v-if="inventoryAccess.for_dashboard === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/" @click="closeSidebar()" 
                                :class="[$route.name === 'Dashboard' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Dashboard' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <MdDashboard class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Dashboard' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Dashboard</span>
                            </RouterLink>
                        </div>
                    </li>
                    <li>
                        <div v-if="inventoryAccess.for_transactions === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/transactions" @click="closeSidebar()"
                                :class="[$route.name === 'Transactions' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Transactions' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <HuExchangeHorizontal class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Transactions' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Transactions</span>
                            </RouterLink>
                        </div>
                    </li>
                    <li>
                        <div v-if="inventoryAccess.for_inventory === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/inventory" @click="closeSidebar()"
                                :class="[$route.name === 'Inventory' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Inventory' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <MdInventory2 class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Inventory' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Inventory</span>
                            </RouterLink>
                        </div>
                    </li>
                    <li>
                        <div v-if="inventoryAccess.for_categories === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/categories" @click="closeSidebar()"
                                :class="[$route.name === 'Categories' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Categories' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <MdRoundCategory class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Categories' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Categories</span>
                            </RouterLink>
                        </div>
                    </li>
                    <li>
                        <div v-if="inventoryAccess.for_borrowers === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/borrowers" @click="closeSidebar()"
                                :class="[$route.name === 'Borrowers' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Borrowers' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <FlFilledPeopleSwap class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Borrowers' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Borrowers</span>
                            </RouterLink>
                        </div>
                    </li>
                    <li>
                        <div v-if="inventoryAccess.for_users === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/users" @click="closeSidebar()" 
                                :class="[$route.name === 'Users' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Users' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <FaUserGear class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Users' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Users</span>
                            </RouterLink>
                        </div>
                    </li>
                    <li>
                        <div v-if="inventoryAccess.for_offices === true" class="profile-div profile-div-not-active group">
                            <RouterLink to="/offices" @click="closeSidebar()" 
                                :class="[$route.name === 'Offices' ?
                                    'profile-button-active' :
                                    'profile-button-not-active',
                                    'profile-button']">
                                <span :class="[$route.name === 'Offices' ?
                                    'profile-icon-span-active' :
                                    'profile-icon-span-not-active',
                                    'profile-icon-span']">
                                    <BxSolidBuildings class="icon-6" />
                                </span>
                                <span
                                    :class="[$route.name === 'Offices' ? 'profile-title-span-active' : 'profile-title-span-not-active']"
                                    class="profile-title-span">Offices</span>
                            </RouterLink>
                        </div>
                    </li>
                </ul>

                <div class="w-full font-medium">
                    <div class="profile-div profile-div-not-active group">
                        <button class="profile-button profile-button-not-active">
                            <span class="profile-icon-span profile-icon-span-not-active">
                                <FaUserGear class="icon-6" />
                            </span>
                            <span class="profile-title-span profile-title-span-not-active">
                                {{ user.firstName }}
                            </span>
                        </button>
                    </div>

                    <div @click="toggleTheme" class="profile-div profile-div-not-active group">
                        <button class="profile-button profile-button-not-active">
                            <span class="profile-icon-span profile-icon-span-not-active">
                                <MdRoundLightMode v-if="theme === 'light'" class="icon-6" />
                                <MdRoundDarkMode v-else class="icon-6" />
                            </span>
                            <span v-if="theme === 'light'"
                                class="profile-title-span profile-title-span-not-active">Light Mode</span>
                            <span v-else class="profile-title-span profile-title-span-not-active">Dark Mode</span>
                        </button>
                    </div>

                    <div @click="openSignOutModal()" class="profile-div profile-div-not-active group">
                        <button class="profile-button profile-button-not-active">
                            <span class="profile-icon-span profile-icon-span-not-active">
                                <FeLogOut class="icon-6" />
                            </span>
                            <span class="profile-title-span profile-title-span-not-active">
                                Sign Out
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        <nav class="fixed top-3 w-full z-50">
            <div class="px-3 py-3 xl:px-5 xl:pl-3">
                <div class="flex items-center xl:pl-64 justify-between">
                    <div class="flex items-center ml-8 justify-start rtl:justify-end">
                        <button @click="toggleSidebar" aria-controls="logo-sidebar" type="button" ref="toggleButtonRef"
                            class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg border xl:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 border-blue-500 dark:border-gray-600">
                            <span class="sr-only">Open sidebar</span>
                            <svg class="icon-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path clip-rule="evenodd" fill-rule="evenodd"
                                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <div class="min-h-[100vh] max-h-[100vh] overflow-auto px-4 pl-8 xl:pl-4 xl:ml-64 dark:text-gray-200">
            <!-- MAIN CONTENT -->
            <router-view class="" />

            <!-- SIGN OUT modal -->
            <div v-show="signout_visible" class="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                <div class="relative p-4 w-full max-w-md">
                    <div
                        class="relative bg-white rounded-lg shadow-sm border-2 border-gray-700 dark:bg-gray-800 dark:border-gray-500">
                        <button type="button"
                            class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                            @click="closeSignOutModal()">
                            <ClCloseMd class="icon-6" aria-hidden="true" />
                        </button>
                        <div class="p-4 md:p-5 text-center">
                            <div class="flex mb-5 w-full items-center justify-center ">
                                <FeLogOut class="w-10 h-10 " />
                            </div>
                            <h3 class="mb-6 text-lg font-normal text-gray-800 dark:text-gray-200">Are you sure you want
                                to sign out?</h3>
                            <button @click="logout" type="button"
                                class="text-white bg-red-700 hover:bg-red-500 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
                                Yes, Sign Out
                            </button>
                            <button @click="closeSignOutModal()" type="button"
                                class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-400 hover:bg-green-500 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                                No, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    </div>
</template>