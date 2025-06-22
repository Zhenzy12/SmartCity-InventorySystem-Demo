<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import ApexCharts from 'apexcharts';
import { useDatabaseStore } from "../../stores/databaseStore";

const props = defineProps({
  dateRange: Object,
  isLoading: Boolean,
  transactionHistory: Array
});

const emit = defineEmits(['periodChange']);

// Access database store
const databaseStore = useDatabaseStore();

// Reference for the chart container
const barChart = ref(null);

// Chart instance
let chart = null;

// Compute borrowed and returned items per day
const dailyStats = computed(() => {
  if (!props.transactionHistory) return { borrowed: [], returned: [], categories: [] };

  const startDate = new Date(props.dateRange.start);

  const endDate = new Date(props.dateRange.end);

  // Adjust the end date to GMT+8
  endDate.setHours(23);
  endDate.setMinutes(59);
  endDate.setSeconds(59);
  endDate.setMilliseconds(999);

  const categoryStartDate = startDate;
  categoryStartDate.setHours(startDate.getHours() + 8);

  const days = [];
  const borrowedCounts = [];
  const returnedCounts = [];

  const transactions = props.transactionHistory.filter(transaction => {
    const borrowDate = new Date(transaction.borrow_date);
    const hasMatchingItem = databaseStore.transactionItems.some(
      item => item.transaction_id === transaction.id
    );
    return borrowDate >= startDate && borrowDate <= endDate && hasMatchingItem;
  });


  const formatDateGMT8 = (dateStr) => {
    const date = new Date(dateStr);
    const gmt8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return gmt8Date.toISOString().split('T')[0];
  }

  while (categoryStartDate <= endDate) {
    const formattedDate = startDate.toISOString().split('T')[0];
    days.push(formattedDate);

    const borrowedCount = transactions.filter(t =>
      t.borrow_date && formatDateGMT8(t.borrow_date) === formattedDate
    ).length;

    const returnedCount = transactions.filter(t =>
      t.return_date && formatDateGMT8(t.borrow_date) === formattedDate
    ).length;

    borrowedCounts.push(borrowedCount);
    returnedCounts.push(returnedCount);

    startDate.setDate(startDate.getDate() + 1); // Move to the next day
  }

  return { borrowed: borrowedCounts, returned: returnedCounts, categories: days };
});

const options = ref({
  colors: ["#3f8f29", "#bf1029"], // Returned first (bottom), Unreturned (top)
  series: [
    { name: "Returned", color: "#3f8f29", data: [] },
    { name: "Unreturned", color: "#bf1029", data: [] }
  ],
  chart: {
    type: "bar",
    height: "98%",
    stacked: true, // ✅ Enable stacked bars
    fontFamily: "Inter, sans-serif",
    toolbar: { show: true }
  },
  plotOptions: {
    bar: { horizontal: false, columnWidth: "70%", borderRadius: 8 }
  },
  tooltip: { shared: true, intersect: false },
  stroke: { show: true, width: 0, colors: ["transparent"] },
  grid: { show: false, strokeDashArray: 4 },
  dataLabels: { enabled: false },
  legend: { show: true }, // ✅ Show legend now
  xaxis: {
    categories: [],
    labels: {
      show: true,
      style: {
        cssClass: 'text-md font-normal fill-gray-900 dark:fill-gray-200'
      }
    },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
  show: true,
  labels: {
    style: {
        cssClass: 'text-md font-normal fill-gray-900 dark:fill-gray-200'
      }
  }
},
  fill: { opacity: 1 }
});

// Update chart with real data
const updateChart = () => {
  const stats = dailyStats.value;

  const borrowed = stats.borrowed;
  const returned = stats.returned;

  // Compute "Unreturned"
  const stillBorrowed = borrowed.map((b, i) => Math.max(b - returned[i], 0));
  const adjustedReturned = returned.map((r, i) => Math.min(r, borrowed[i]));

  options.value.series = [
    {
      name: "Returned",
      color: "#3f8f29",
      data: adjustedReturned
    },
    {
      name: "Unreturned",
      color: "#bf1029",
      data: stillBorrowed
    }
  ];

  options.value.xaxis.categories = stats.categories;

  emit('periodChange', props.dateRange);

  if (chart) {
    chart.updateOptions(options.value);
  }
};

// New: Track if the chart is initialized
const isChartInitialized = ref(false);

// Update chart setup logic inside a watcher
watch(
  [() => props.dateRange, () => props.transactionHistory, () => props.isLoading],
  () => {
    // Wait until data is available and not loading
    if (!props.transactionHistory || props.isLoading) return;

    updateChart();

    // Initialize chart only once
    if (!isChartInitialized.value && barChart.value) {
      console.log('Initializing chart inside watcher...');
      chart = new ApexCharts(barChart.value, options.value);
      chart.render();
      isChartInitialized.value = true;
    }
  },
  { deep: true, immediate: true } // `immediate` makes it run on first load
);

// Initialize chart
onMounted(() => {
  if (!isChartInitialized.value && barChart.value) {
    // console.log('Initializing chart inside onMounted...');
    chart = new ApexCharts(barChart.value, options.value);
    chart.render();
    isChartInitialized.value = true;
  }
});

// Destroy chart on unmount
onUnmounted(() => {
  if (chart) chart.destroy();
});
</script>

<template>
  <div class="p-4 pb-8 md:px-8 items-center text-dark dark:text-gray-950 bg-white/30 rounded-3xl dark:bg-gray-950/20 z-10">
    <label class="text-start text-lg 2xl:text-xl tracking-tight font-medium text-black dark:text-gray-200">
      Returned vs Unreturned Transactions by Day:
    </label>
    <div ref="barChart"></div>
  </div>
</template>
