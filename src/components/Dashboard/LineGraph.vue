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

const databaseStore = useDatabaseStore();
const lineChart = ref(null);
let chart = null;

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
        const returnDate = new Date(transaction.return_date);
        const hasMatchingItem = databaseStore.transactionItems.some(
            item => item.transaction_id === transaction.id
        );
        return (borrowDate >= startDate && borrowDate <= endDate && hasMatchingItem) || (returnDate >= startDate && returnDate <= endDate && hasMatchingItem);
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
            t.return_date && formatDateGMT8(t.return_date) === formattedDate
        ).length;

        borrowedCounts.push(borrowedCount);
        returnedCounts.push(returnedCount);

        startDate.setDate(startDate.getDate() + 1); // Move to the next day
    }

    return { borrowed: borrowedCounts, returned: returnedCounts, categories: days };
});

const options = ref({
    chart: {
        height: "95%",
        maxWidth: "100%",
        type: "area",
        fontFamily: "Inter, sans-serif",
        dropShadow: { enabled: false },
        toolbar: { show: true },
    },
    tooltip: {
        enabled: true,
        x: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: {
        width: 6,
        curve: 'smooth'
    },
    grid: {
        show: false,
        strokeDashArray: 1,
        padding: { left: 2, right: 2, top: -26 },
    },
    series: [],
    legend: { show: false },
    xaxis: {
        categories: [],
        labels: {
            show: true,
            style: {
                fontFamily: "Inter, sans-serif",
                cssClass: 'text-md font-normal fill-gray-900 dark:fill-gray-200'
            }
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
    },
  yaxis: {
  show: true,
  labels: {
    style: {
        cssClass: 'text-md font-normal fill-gray-900 dark:fill-gray-200'
      }
  }
},
});

const updateChart = () => {
    const stats = dailyStats.value;

    options.value.series = [
        {
            name: "Borrowed",
            data: stats.borrowed,
            color: "#bf1029",
        },
        {
            name: "Returned",
            data: stats.returned,
            color: "#3f8f29",
        }
    ];
    options.value.xaxis.categories = stats.categories;

    emit('periodChange', props.dateRange);

    if (chart) {
        chart.updateOptions(options.value);
    }
};

watch(
    [() => props.dateRange, () => props.transactionHistory, () => props.isLoading],
    () => {
        if (!props.transactionHistory || props.isLoading) return;
        updateChart();
    },
    { deep: true, immediate: true }
);

onMounted(() => {
    if (lineChart.value) {
        chart = new ApexCharts(lineChart.value, options.value);
        chart.render();
    }
});

onUnmounted(() => {
    if (chart) chart.destroy();
});
</script>

<template>
    <div class="h-full p-4 pb-8 md:px-6 items-center  text-dark dark:text-gray-950 bg-white/30 rounded-3xl dark:bg-gray-950/20">
        

    <label class="text-start text-lg 2xl:text-xl tracking-tight font-medium text-black dark:text-gray-200">
        Transactions Made vs Returned Daily:
    </label>
        <div class="mt-3" ref="lineChart" id="line-chart"></div>
    </div>
</template>
