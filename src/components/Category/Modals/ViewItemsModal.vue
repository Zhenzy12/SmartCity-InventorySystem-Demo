<!-- ILALAGAY SA MODAL -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Loading from '../../Loading.vue';
import { GlCloseXs } from '@kalimahapps/vue-icons';

const isLoading = ref(false)

const props = defineProps({
    modelValue: Boolean,
    selectedCategory: Object,
    officeEquipments: Object,
    officeSupplies: Object,
    equipmentCopies: Object,
})

const emit = defineEmits(['update:modelValue', 'confirmDelete'])

const modalContainer = ref(null)

const closeModal = () => {
    emit('update:modelValue', false) // Notify parent to close modal
}

const handleClickOutside = (event) => {
    if (modalContainer.value && !modalContainer.value.contains(event.target)) {
        closeModal()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

const allInventory = computed(() => {
    return [...props.officeEquipments, ...props.officeSupplies]
        .filter(item => item.category_id === props.selectedCategory.id)
        .map((item, index) => ({
            ...item,
            newId: `INV-${index + 1}`,
        }));
});

const getEquipmentCopyCount = (itemId) => {
    return props.equipmentCopies.filter(ec => ec.item_id === itemId).length;
};

</script>

<template>
    <div v-if="modelValue"
        class="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black/55 px-4 py-5 z-50 ">
        <!-- Loading State -->
        <Loading v-if="isLoading" />

        <!-- Main Add Copy Form -->
        <div v-else ref="modalContainer"
            class="min-w-[80vw] max-h-[90vh] rounded-[20px] bg-white px-8 py-8 text-center border border-4 dark:bg-gray-950 dark:border-gray-100">
            <div class="flex justify-between">
                <div class="w-full text-2xl font-semibold mb-4 flex flex-row justify-center items-center">
                    <p class="text-gray-400 mr-2">Category:</p>
                    <p class=" text-3xl ">{{ selectedCategory.category_name }}</p>
                </div>
                <button @click="closeModal()"
                    class="bg-gray-200 max-h-fit ml-4 text-gray-700 px-1 py-1 rounded-full hover:bg-gray-300 transition">
                    <GlCloseXs class="w-8 h-8" />
                </button>
            </div>
            <div class="rounded-lg max-h-[70vh] overflow-y-auto dark:bg-gray-900 ">
                <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
                    <thead class=" dark:bg-gray-600 dark:text-gray-300">
                        <tr class="bg-gray-700 text-gray-200 uppercase text-center text-xs rounded-lg">
                            <th class="py-3">Item Name</th>
                            <th class="py-3">Item Type</th>
                            <th class="py-3 w-100">Quantity/Copy</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in allInventory" :key="item.newId"
                            class="border-b font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300 odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                            <td class="px-4 py-3 ">{{ item.equipment_name || item.supply_name }}</td>
                            <td class="px-4 py-3">
                                {{ item.type }}
                            </td>
                            <td class="px-4 py-1 text-center">
                                <span v-if="item.type === 'Office Equipment'" >
                                    <div v-for="copy in props.equipmentCopies" :key="copy.id" class="flex flex-row justify-around">
                                        <div v-if="copy.item_id === item.id" class="py-1" :class="copy.is_available ? 'text-green-500' : 'text-red-500'">
                                            {{ item.equipment_name}} #{{ copy.copy_num }}
                                        </div>
                                        <div v-if="copy.item_id === item.id" class="py-1" :class="copy.is_available ? 'text-green-500' : 'text-red-500'">
                                            {{ copy.is_available ? 'Available' : 'Not Available' }}
                                        </div>
                                    </div>
                                </span>
                                <span v-else :class="item.supply_quantity > 0 ? 'text-green-500' : 'text-red-500'">
                                    {{ item.supply_quantity }} pieces
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>