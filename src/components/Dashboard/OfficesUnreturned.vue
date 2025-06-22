<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useDatabaseStore } from "../../stores/databaseStore";

const props = defineProps({
  dateRange: Object,
  isLoading: Boolean,
  transactionHistory: Array
});

const databaseStore = useDatabaseStore();

const borrowerUnreturnedItems = ref([]);
const borrowerUnreturnedItemsUnfiltered = ref([]);

const fetchTotalUnreturnedItems = () => {
  const officeMap = new Map();

  databaseStore.transactionHistory.forEach(transaction => {
    if (transaction.return_date !== null) return; // Skip returned

    const borrower = databaseStore.borrowers.find(b => b.id === transaction.borrower_id);
    if (!borrower || borrower.is_deleted) return;

    const office = databaseStore.officeList.find(o => o.id === borrower.office_id && !o.is_deleted);
    if (!office) return;

    const unreturnedItems = databaseStore.transactionItems.filter(item =>
      item.transaction_id === transaction.id && item.returned_date === null
    );

    if (unreturnedItems.length === 0) return;

    const current = officeMap.get(office.office_name) || {
      officeName: office.office_name,
      totalUnreturnedItems: 0,
      totalUnreturnedTransactions: 0,
      totalUnreturnedEquipment: 0,
      totalUnreturnedSupply: 0
    };

    current.totalUnreturnedTransactions += 1;

    unreturnedItems.forEach(item => {
      current.totalUnreturnedItems += item.quantity;

      if (item.item_type === 'Equipment Copy') {
        current.totalUnreturnedEquipment += item.quantity;
      } else if (item.item_type === 'Office Supply') {
        current.totalUnreturnedSupply += item.quantity;
      }
    });

    officeMap.set(office.office_name, current);
  });

  borrowerUnreturnedItemsUnfiltered.value = Array.from(officeMap.values());
  sortBorrowerData();
};

const sortBorrowerData = () => {
  if (currentFilter.value === "All Items") {
    borrowerUnreturnedItems.value = [...borrowerUnreturnedItemsUnfiltered.value].sort(
      (a, b) => b.totalUnreturnedItems - a.totalUnreturnedItems
    );
  } else if (currentFilter.value === "Equipments") {
    borrowerUnreturnedItems.value = [...borrowerUnreturnedItemsUnfiltered.value].sort(
      (a, b) => b.totalUnreturnedEquipment - a.totalUnreturnedEquipment
    );
  } else if (currentFilter.value === "Supplies") {
    borrowerUnreturnedItems.value = [...borrowerUnreturnedItemsUnfiltered.value].sort(
      (a, b) => b.totalUnreturnedSupply - a.totalUnreturnedSupply
    );
  }
};

onMounted(() => {
  fetchTotalUnreturnedItems();
});

const toggleItemTypeFilter = () => {
  itemTypeFilter.value = !itemTypeFilter.value;
};

const itemTypeFilter = ref(false);
const officeButtonRef = ref(null);
const officeMenuRef = ref(null);
const currentFilter = ref("All Items");

const itemTypeFilterItems = ref([
  { id: 1, type: "Equipments", isActive: true },
  { id: 2, type: "Supplies", isActive: true },
]);

const handleItemTypeCheckboxChange = (id, event) => {
  event.stopPropagation();
  const item = itemTypeFilterItems.value.find((item) => item.id === id);
  if (item) {
    item.isActive = !item.isActive;
  }

  if (itemTypeFilterItems.value[0].isActive && itemTypeFilterItems.value[1].isActive) {
    currentFilter.value = "All Items";
  } else if (itemTypeFilterItems.value[0].isActive) {
    currentFilter.value = "Equipments";
  } else if (itemTypeFilterItems.value[1].isActive) {
    currentFilter.value = "Supplies";
  }

  fetchTotalUnreturnedItems();
};

const filteredBorrowerUnreturnedItems = computed(() => {
  return borrowerUnreturnedItems.value.filter((borrower) => {
    const showEquipments = itemTypeFilterItems.value[0].isActive;
    const showSupplies = itemTypeFilterItems.value[1].isActive;

    const equipmentCount = borrower.totalUnreturnedEquipment || 0;
    const supplyCount = borrower.totalUnreturnedSupply || 0;

    if (showEquipments && showSupplies) {
      return equipmentCount > 0 || supplyCount > 0;
    } else if (showEquipments) {
      return equipmentCount > 0;
    } else if (showSupplies) {
      return supplyCount > 0;
    }
    return false; // if both are inactive, show nothing
  });
});


const handleClickOutside = (event) => {
  if (itemTypeFilter.value && !officeButtonRef.value?.contains(event.target) && !officeMenuRef.value?.contains(event.target)) {
    itemTypeFilter.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

</script>

<template>
  <div class="w-full h-full">
    <div class="flex flex-row justify-between items-center mb-4">
      <label class="text-start text-lg 2xl:text-xl tracking-tight font-medium text-black dark:text-gray-200">
        Top Offices with Unreturned Items:
      </label>

      <div class=" relative ml-2 flex justify-end">
        <button @click="toggleItemTypeFilter" ref="officeButtonRef"
          class="flex items-center rounded-lg px-4 py-1 2xl:px-6 2xl:py-2 bg-dark dark:bg-dark-2 text-base font-medium text-white border dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
          <span class="material-icons">filter_alt</span>
          {{ currentFilter }}
          <span class="material-icons ml-1">arrow_drop_down</span>
        </button>
        <div v-show="itemTypeFilter" ref="itemTypeMenuRef"
          class="absolute shadow-1 dark:shadow-box-dark right-0 border border-gray-500 w-48 z-40 mt-2 rounded-md bg-gray-200 dark:bg-gray-900 px-4 pt-2 transition-all"
          :class="{
            'top-full visible': itemTypeFilter,
            'top-[110%] invisible': !itemTypeFilter,
          }">
          <label class="flex items-center cursor-pointer select-none text-dark dark:text-white mb-2"
            v-for="item in itemTypeFilterItems" :key="item.id">
            <div class="relative">
              <input type="checkbox" class="sr-only" :checked="item.isActive"
                @change="handleItemTypeCheckboxChange(item.id, $event)" />
              <div
                class="box mr-4 flex h-5 w-5 items-center justify-center rounded border border-stroke dark:border-dark-3">
                <span :class="{
                  'opacity-100': item.isActive,
                  'opacity-0': !item.isActive,
                }">
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                      fill="#3056D3" stroke="#3056D3" strokeWidth="0.4"></path>
                  </svg>
                </span>
              </div>
            </div>
            {{ item.type }}
          </label>
        </div>
      </div>
    </div>

    <div
      class="max-h-[85%] flex flex-col border-4 rounded-xl bg-sky-100/40 dark:bg-slate-950/60 border-slate-400/50 dark:border-blue-900/10 ">
      <table class="w-full text-sm text-center text-slate-800 dark:text-slate-300">
        <thead>
          <tr class="uppercase text-center 2xl:text-lg ">
            <th class="py-4 text-center w-3/5">Office</th>
            <th class="py-4 text-center pr-4">Unreturned Items</th>
          </tr>
        </thead>
      </table>

      <!-- Scrollable table body wrapper -->
      <div
        class="max-h-[90%] overflow-y-auto border-t [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-b-xl border-slate-500/50 dark:border-slate-700/50">
        <table class="w-full text-md text-center ">
          <tbody>
            <tr v-for="office in filteredBorrowerUnreturnedItems" :key="office.officeName"
              class="odd:bg-slate-400/20 even:bg-gray-200/40 even:dark:bg-slate-950/40 odd:dark:bg-slate-900/30 hover:bg-blue-800/30 dark:hover:bg-blue-700/20 ">
              <td class="py-4 w-3/5">
                {{ office.officeName }}
              </td>
              <td v-if="itemTypeFilterItems[0].isActive && itemTypeFilterItems[1].isActive" class="py-3">
                {{ office.totalUnreturnedItems }}
              </td>
              <td v-if="itemTypeFilterItems[0].isActive && !itemTypeFilterItems[1].isActive" class="py-3">
                {{ office.totalUnreturnedEquipment || 0 }}
              </td>
              <td v-if="!itemTypeFilterItems[0].isActive && itemTypeFilterItems[1].isActive" class="py-3">
                {{ office.totalUnreturnedSupply }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
