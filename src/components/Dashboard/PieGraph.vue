<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import ApexCharts from 'apexcharts';
import { useDatabaseStore } from "../../stores/databaseStore";

const props = defineProps({
  dateRange: Object,
  isLoading: Boolean,
  transactionHistory: Array
});

const databaseStore = useDatabaseStore();
const donutChart = ref(null);
let chart = null;

// Helper: Convert date string to GMT+8 formatted date
const formatDateGMT8 = (dateStr) => {
  const date = new Date(dateStr);
  const gmt8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return gmt8Date.toISOString().split('T')[0];
};

const totals = computed(() => {
  if (!props.transactionHistory) return { returned: 0, unreturned: 0 };

  const startDate = new Date(props.dateRange.start);
  const endDate = new Date(props.dateRange.end);
  endDate.setHours(23, 59, 59, 999);

  const transactions = props.transactionHistory.filter(transaction => {
    const borrowDate = new Date(transaction.borrow_date);
    const hasMatchingItem = databaseStore.transactionItems.some(
      item => item.transaction_id === transaction.id
    );
    return borrowDate >= startDate && borrowDate <= endDate && hasMatchingItem;
  });

  let returned = 0;
  let borrowed = 0;

  transactions.forEach(transaction => {
    if (transaction.borrow_date) borrowed++;
    if (transaction.return_date) returned++;
  });

  const unreturned = borrowed - returned;
  return {
    returned,
    unreturned: unreturned < 0 ? 0 : unreturned
  };
});

const chartOptions = ref({
  chart: {
    type: 'donut',
    height: 350
  },
  labels: ['Returned', 'Unreturned'],
  colors: ['#3f8f29', '#bf1029'], // green, red
  legend: {
    position: 'bottom',
    fontSize: '14px',
    fontWeight: 'bold',
    labels: {
      useSeriesColors: true
    }
  },
  dataLabels: {
    enabled: true,
    style: {
        cssClass: 'text-md font-normal fill-gray-900 dark:fill-gray-200'
      }
  },
  stroke: {
    show: true,
    width: 1,
    colors: ['#bcc4c4']
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 300
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
});

const updateChart = () => {
  const data = totals.value;

  if (chart) {
    chart.updateOptions({
      ...chartOptions.value,
      series: [data.returned, data.unreturned]
    });
  } else if (donutChart.value) {
    chart = new ApexCharts(donutChart.value, {
      ...chartOptions.value,
      series: [data.returned, data.unreturned]
    });
    chart.render();
  }
};

watch(
  [() => props.dateRange, () => props.transactionHistory, () => props.isLoading],
  () => {
    if (!props.transactionHistory || props.isLoading) return;
    updateChart();
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  if (donutChart.value && !chart) updateChart();
});

onUnmounted(() => {
  if (chart) chart.destroy();
});
</script>


<template>
  <div class="w-full h-full">
    <label class="text-start text-lg 2xl:text-xl tracking-tight font-medium text-black dark:text-gray-200">
      Total Transactions:
    </label>
    <div class="mb-4"></div>
    <div ref="donutChart"></div>
  </div>
</template>

