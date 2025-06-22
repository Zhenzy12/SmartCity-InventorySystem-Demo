<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDatabaseStore } from "../../stores/databaseStore";

const props = defineProps({
  dateRange: Object,
  isLoading: Boolean,
  transactionHistory: Array,
});

const databaseStore = useDatabaseStore();

const quantityFilters = [
  { label: "0 - 20", max: 20 },
  { label: "0 - 50", max: 50 },
  { label: "0 - 100", max: 100 },
  { label: "0 - 250", max: 250 },
  { label: "0 - 500", max: 500 },
];
const selectedFilter = ref(quantityFilters[0]);

const filteredAndSortedSupplies = computed(() => {
  return databaseStore.officeSupplies.filter((item) => item.supply_quantity <= selectedFilter.value.max).sort((a, b) => a.supply_quantity - b.supply_quantity);
});

const itemTypeFilter = ref(false);
const officeButtonRef = ref(null);
const itemTypeMenuRef = ref(null);

const toggleItemTypeFilter = () => {
  itemTypeFilter.value = !itemTypeFilter.value;
};

const handleClickOutside = (event) => {
  if (itemTypeFilter.value && !officeButtonRef.value?.contains(event.target) && !itemTypeMenuRef.value?.contains(event.target)) {
    itemTypeFilter.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="w-full h-full">
    <div class="flex flex-row justify-between items-center mb-4">
      <label class="text-start text-lg 2xl:text-xl tracking-tight font-medium text-black dark:text-gray-200"> Low Stock Supplies: </label>

      <div class="relative ml-2 flex justify-end">
        <button @click="toggleItemTypeFilter" ref="officeButtonRef" class="flex items-center rounded-lg px-4 py-1 2xl:px-6 2xl:py-2 bg-dark dark:bg-dark-2 text-base font-medium text-white border dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
          <span class="material-icons">filter_alt</span>
          {{ selectedFilter.label }}
          <span class="material-icons ml-1">arrow_drop_down</span>
        </button>
        <div
          v-show="itemTypeFilter"
          ref="itemTypeMenuRef"
          class="absolute shadow-1 dark:shadow-box-dark right-0 border border-gray-500 w-48 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all"
          :class="{
            'top-full visible': itemTypeFilter,
            'top-[110%] invisible': !itemTypeFilter,
          }">
          <button
            v-for="item in quantityFilters"
            :key="item.max"
            @click="
              selectedFilter = item;
              itemTypeFilter = false;
            "
            class="w-full text-left mb-2 px-3 py-1 rounded text-dark dark:text-white hover:bg-blue-200 dark:hover:bg-blue-800"
            :class="{
              'bg-blue-500 text-white dark:bg-blue-600': item.max === selectedFilter.max,
              'bg-transparent': item.max !== selectedFilter.max,
            }">
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="max-h-[85%] flex flex-col border-4 rounded-xl bg-sky-100/40 dark:bg-slate-950/60 border-slate-400/50 dark:border-blue-900/10">
      <table class="w-full text-sm text-center text-slate-800 dark:text-slate-300">
        <thead>
          <tr class="uppercase text-center font-extrabold 2xl:text-lg">
            <th class="py-4 text-center w-3/5">Supply</th>
            <th class="py-4 text-center pr-4 2xl:hidden">Qty</th>
            <th class="py-4 text-center pr-4 hidden 2xl:block">Remaining Qty</th>
          </tr>
        </thead>
      </table>

      <!-- Scrollable table body wrapper -->
      <div class="max-h-[90%] overflow-y-auto border-t [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-b-xl border-slate-500/50 dark:border-slate-700/50">
        <table class="w-full text-md text-center">
          <tbody>
            <tr v-for="office in filteredAndSortedSupplies" :key="office.officeName" class="odd:bg-slate-400/20 even:bg-gray-200/40 even:dark:bg-slate-950/40 odd:dark:bg-slate-900/30 hover:bg-blue-800/30 dark:hover:bg-blue-700/20">
              <td class="py-4 w-3/5">
                {{ office.supply_name }}
              </td>
              <td>
                {{ office.supply_quantity }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
