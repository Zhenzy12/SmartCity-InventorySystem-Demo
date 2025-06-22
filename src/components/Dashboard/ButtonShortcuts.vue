<script setup>
import { useDatabaseStore } from "../../stores/databaseStore";
import { HuExchangeHorizontal } from '@kalimahapps/vue-icons';
import { MdInventory2 } from '@kalimahapps/vue-icons';
import { TaQrcode } from '@kalimahapps/vue-icons';
import { defineEmits } from 'vue';

const emit = defineEmits(["open-add-item-modal", "open-create-transaction-modal", "open-generate-qr-code-modal"]);

const OpenAddItemModal = () => {
  emit('open-add-item-modal');
};

const OpenCreateTransactionModal = () => {
  emit('open-create-transaction-modal');
};

const OpenGenerateQRCodeModal = () => {
  emit('open-generate-qr-code-modal');
};

</script>

<template>
  <div class="w-full h-full">
    <label class="text-start text-lg 2xl:text-xl tracking-tight font-medium text-black dark:text-gray-200">
      Shortcuts:
    </label>

    <div class="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3 pt-2 lg:pt-4 lg:h-[90%]">
      <!-- Create Transaction Button -->
      <button
        @click.stop="OpenCreateTransactionModal()"
        class="dashboard-button-shortcut-format dashboard-button-shortcut-colors"
      >
        <HuExchangeHorizontal class="w-6 h-6 lg:w-10 lg:h-10 2xl:w-12 2xl:h-12 lg:mb-1 2xl:mb-2 mr-1 lg:mr-0" />
        <span class="font-semibold tracking-tight leading-4 text-md 2xl:text-lg ">Create Transaction</span>
      </button>

      <!-- Add Item Button -->
      <button
        @click.stop="OpenAddItemModal()"
        class="dashboard-button-shortcut-format dashboard-button-shortcut-colors"
      >
        <MdInventory2 class="w-6 h-6 lg:w-10 lg:h-10 2xl:w-12 2xl:h-12 lg:mb-1 2xl:mb-2 mr-1 lg:mr-0" />
        <span class="font-semibold tracking-tight leading-4 text-md 2xl:text-lg">Add Item</span>
      </button>

      <!-- Generate QR Codes -->
      <button
        @click.stop="OpenGenerateQRCodeModal()"
        class="dashboard-button-shortcut-format dashboard-button-shortcut-colors"
      >
        <TaQrcode class="w-6 h-6 lg:w-10 lg:h-10 2xl:w-12 2xl:h-12 lg:mb-1 2xl:mb-2 mr-1 lg:mr-0" />
        <span class="font-semibold tracking-tight leading-4 text-md 2xl:text-lg">Generate QR Codes</span>
      </button>
    </div>
  </div>
</template>
