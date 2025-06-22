<template>
	<div class=" ">
		<label class="mb-2 block text-sm 2xl:text-md font-medium text-dark dark:text-gray-200"> Select Date Range: </label>

		<div class="relative" ref="datepickerRef">
			<div class="relative flex items-center text-sm 2xl:text-md">
				<span class="absolute left-0 pl-5 text-dark-5">
					<MdOutlinedCalendarMonth class="w-6 h-6 2xl:w-7 2xl:h-7" />
				</span>

				<input id="datepicker" type="text" placeholder="Pick a date" class="w-full shadow-lg rounded-lg border-2 border-stroke bg-white border-gray-300 dark:bg-gray-950 dark:border-gray-700 py-2.5 pl-[50px] pr-8 text-dark-2 outline-none transition focus:border-primary dark:border-dark-3 dark:focus:border-primary" :value="updateInput()" @click="toggleDatepicker" readonly />
				<span class="absolute right-0 cursor-pointer pr-4 text-dark-5" @click="toggleDatepicker">
					<AkChevronDownSmall class="w-6 h-6 2xl:w-7 2xl:h-7" />
				</span>
			</div>

			<div v-if="isOpen" id="datepicker-container" class="shadow-datepicker absolute z-30 mt-2 rounded-xl border-2 border-stroke bg-white pt-5 border-gray-400 dark:bg-gray-950 dark:border-gray-600">
				<div class="flex items-center justify-between px-5">
					<button id="prevMonth" class="rounded-md px-2 py-2 text-dark hover:bg-gray-200 dark:text-white dark:hover:bg-gray-200" @click="changeMonth(-1)">
						<AkChevronLeftSmall class="w-6 h-6 2xl:w-7 2xl:h-7" />
					</button>

					<div id="currentMonth" class="text-lg font-medium text-dark-3 dark:text-white">
						{{ currentMonth }}
					</div>

					<button id="nextMonth" :disabled="isCurrentMonth()" :class="['rounded-md px-2 py-2 text-dark dark:text-white', isCurrentMonth() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-200']" @click="changeMonth(1)">
						<AkChevronRightSmall class="w-6 h-6 2xl:w-7 2xl:h-7" />
					</button>
				</div>

				<div class="grid grid-cols-7 px-5">
					<div v-for="day in daysOfWeek" :key="day" class="mb-2 mt-6 text-center text-sm font-medium text-secondary-color">
						{{ day }}
					</div>

					<div v-for="(day, index) in renderCalendar()" :key="index" :class="day.className" :data-date="day.dayString" @click="handleDayClick(day.dayString)">
						{{ day.day }}
					</div>
				</div>

				<div class="mt-5 flex justify-end space-x-2.5 border-t border-stroke p-5 dark:border-dark-3">
					<button id="cancelButton" class="rounded-lg border border-primary px-5 py-2.5 text-base font-medium text-primary hover:bg-blue-light-5" @click="handleCancel">Cancel</button>
					<button id="applyButton" class="rounded-lg bg-blue-700 px-5 py-2.5 text-base font-medium text-white hover:bg-blue-900" @click="handleApply">Apply</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { MdOutlinedCalendarMonth } from "@kalimahapps/vue-icons";
import { AkChevronDownSmall } from "@kalimahapps/vue-icons";
import { AkChevronLeftSmall } from "@kalimahapps/vue-icons";
import { AkChevronRightSmall } from "@kalimahapps/vue-icons";

const currentDate = ref(new Date());

// Get the formatted date string (MM/DD/YYYY) for today and 6 days ago
const formatDate = (date) => date.toLocaleDateString("en-US");

const selectedEndDate = ref(formatDate(currentDate.value));
const selectedStartDate = ref(formatDate(new Date(currentDate.value.setDate(currentDate.value.getDate() - 6))));

const isOpen = ref(false);
const datepickerRef = ref(null);

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emit = defineEmits(["dateRangeSelected"]);

const renderCalendar = () => {
	const year = currentDate.value.getFullYear();
	const month = currentDate.value.getMonth();
	const today = new Date(); // Get today's date

	const firstDayOfMonth = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysArray = [];

	for (let i = 0; i < firstDayOfMonth; i++) {
		daysArray.push({ day: "", className: "", dayString: "" });
	}

	for (let i = 1; i <= daysInMonth; i++) {
		const day = new Date(year, month, i);
		const dayString = day.toLocaleDateString("en-US");
		let className = "flex items-center justify-center cursor-pointer w-[46px] h-[46px] rounded-full text-dark-3 dark:text-dark-6 my-0.5 hover:bg-blue-700 hover:text-white";

		if (selectedStartDate.value && dayString === selectedStartDate.value) {
			className += " bg-blue-700 text-white dark:text-white rounded-r-none";
		}
		if (selectedEndDate.value && dayString === selectedEndDate.value) {
			className += " bg-blue-700 text-white dark:text-white rounded-l-none";
		}
		if (selectedStartDate.value && selectedEndDate.value && new Date(day) > new Date(selectedStartDate.value) && new Date(day) < new Date(selectedEndDate.value)) {
			className += " bg-blue-400 text-white rounded-none dark:bg-blue-500";
		}

		// **Disable future dates**
		if (day > today) {
			className += " text-gray-400 cursor-not-allowed";
		} else {
			daysArray.push({ day: i, className, dayString });
		}
	}

	return daysArray;
};

const handleDayClick = (selectedDay) => {
	const selectedDate = new Date(selectedDay);
	const today = new Date();

	// Prevent selection of future dates
	if (selectedDate > today) {
		return;
	}

	if (!selectedStartDate.value || (selectedStartDate.value && selectedEndDate.value)) {
		selectedStartDate.value = selectedDay;
		selectedEndDate.value = null;
	} else {
		if (new Date(selectedDay) < new Date(selectedStartDate.value)) {
			selectedEndDate.value = selectedStartDate.value;
			selectedStartDate.value = selectedDay;
		} else {
			selectedEndDate.value = selectedDay;
		}
	}
};

const updateInput = () => {
	if (selectedStartDate.value && selectedEndDate.value) {
		return `${selectedStartDate.value}  to  ${selectedEndDate.value}`;
	} else if (selectedStartDate.value) {
		return selectedStartDate.value;
	} else {
		return "";
	}
};

const toggleDatepicker = () => {
	isOpen.value = !isOpen.value;
};

//   const handleApply = () => {
//     console.log('Applied:', selectedStartDate.value, selectedEndDate.value)
//     isOpen.value = false
//   }

const handleApply = () => {
	if (selectedStartDate.value && selectedEndDate.value) {
		emit("dateRangeSelected", { start: selectedStartDate.value, end: selectedEndDate.value });
		console.log("Applied:", selectedStartDate.value, selectedEndDate.value);
		isOpen.value = false;
	}
};

const handleCancel = () => {
	// selectedStartDate.value = null
	// selectedEndDate.value = null
	isOpen.value = false;
};

const handleDocumentClick = (e) => {
	if (datepickerRef.value && !datepickerRef.value.contains(e.target)) {
		isOpen.value = false;
	}
};

const currentMonth = computed(() => currentDate.value.toLocaleString("default", { month: "long", year: "numeric" }));

const isCurrentMonth = () => {
	const today = new Date();
	return currentDate.value.getMonth() === today.getMonth() && currentDate.value.getFullYear() === today.getFullYear();
};

const changeMonth = (direction) => {
	currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + direction));
};

onMounted(() => {
	document.addEventListener("click", handleDocumentClick);
});

onUnmounted(() => {
	document.removeEventListener("click", handleDocumentClick);
});

onMounted(() => {
	selectedEndDate.value = formatDate(new Date());
	selectedStartDate.value = formatDate(new Date(new Date().setDate(new Date().getDate() - 6)));
});
</script>
