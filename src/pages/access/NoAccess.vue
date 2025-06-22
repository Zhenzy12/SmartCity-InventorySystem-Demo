<script setup>
import { useRouter } from "vue-router";
import errorBg from "../../assets/errorBg.jpg";
import { IcPcNoEntry } from "@kalimahapps/vue-icons";
import { GlGoBack } from "@kalimahapps/vue-icons";
import axiosClient from "../../axios.js";
import useUserStore from "../../stores/user.js";

const router = useRouter();

const goHome = () => {
	router.push("/");
};

const API_KEY = import.meta.env.VITE_API_KEY;

const userStore = useUserStore();

function goLogout() {
	if (!userStore.user) {
		router.push("/login");
	} else {
		axiosClient.post("/logout", null, {
			headers: { "x-api-key": import.meta.env.VITE_API_KEY }
		}).then(() => {
			// Clear user store data
			userStore.user = null;
			userStore.inventoryAccess = null;
			userStore.userLoaded = false;

			router.push("/login");
		});
	}
}

</script>

<template>
	<div
		:style="{
			backgroundImage: `url(${errorBg})`,
			backgroundSize: 'cover',
			backgroundRepeat: 'no-repeat',
			backgroundPosition: 'center',
		}"
		class="flex flex-col items-center justify-center min-h-screen w-full">
		<div class="absolute inset-0 bg-black/50 z-0"></div>

		<div class="animate-rotate-border rounded-3xl p-1.5 transition-all duration-500 ease-out bg-conic/[from_var(--border-angle)] from-red-900/30 via-red-600 to-red-900/30">
			<div class="bg-black/80 backdrop-blur-lg rounded-3xl p-20 flex flex-col items-center justify-center text-white">
				<IcPcNoEntry class="w-50 h-50 mb-6 text-red-700" />
				<p class="text-5xl font-bold mb-1">NO ACCESS</p>
				<p class="text-xl mt-2">You have no access to this page. Please contact an admin and ask for permission.</p>
				<div class="flex flex-row w-full items-center justify-center gap-2">
					<button @click="goHome" class="mt-6 px-5 py-2 cursor-pointer rounded-lg bg-red-700 hover:bg-green-700 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
						<GlGoBack class="w-5 h-5" />
						Back to Dashboard
					</button>
					<button @click="goLogout()" class="mt-6 px-5 py-2 cursor-pointer rounded-lg bg-red-700 hover:bg-green-700 hover:scale-105 text-white font-medium shadow-md transition-all duration-300 flex items-center gap-2">
						<GlGoBack class="w-5 h-5" />
						Back to Login
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
