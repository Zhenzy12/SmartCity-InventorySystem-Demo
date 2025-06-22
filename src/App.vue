<script setup>
import { onMounted, onUnmounted } from "vue";
import Toast from "./components/Toasts/Toast.vue";
import useUserStore from "./stores/user.js";
import MainLoading from "./components/MainLoading.vue";
import { useDatabaseStore } from "./stores/databaseStore.js";

const userStore = useUserStore();
const databaseStore = useDatabaseStore()
</script>

<template>
	<div>
		<MainLoading v-if="userStore.loading" />
		<RouterView v-else />
		<Toast />
	</div>
</template>
