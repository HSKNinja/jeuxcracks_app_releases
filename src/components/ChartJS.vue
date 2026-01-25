<script setup>
import Chart from "chart.js/auto";
import { ref, onMounted, watch, toRaw } from "vue";

const props = defineProps(["data"]);
const ChartLine = ref(null);
let chart;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  parsing: {
    xAxisKey: 'value',
    yAxisKey: 'value'
  },
  plugins: {
    legend: false,
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#d1d5db',
      borderColor: 'rgba(59, 130, 246, 0.5)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: function(context) {
          return prettyBites(context.parsed.y);
        }
      }
    },
    annotation: {
      annotations: [

      ]
    }
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false
      }
    },
    y: {
      display: false,
      grid: {
        display: false 
    }
  } 
  },
  elements: {
    bar: {
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(147, 51, 234, 0.8)',
      borderWidth: 0.5,
      borderRadius: 2,
      borderSkipped: false,
      barThickness: 3,
      maxBarThickness: 4,
    }
  },
  animation: {
    duration: 800,
    easing: 'easeOutQuart'
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
}

onMounted(() => {
  const canvas = ChartLine.value;
  chart = new Chart(canvas, {
    type: "line",
    data: toRaw(props.data), // To avoid errors, remove Vue Proxy data using `ToRaw`
    options: chartOptions,
  });
});

watch(props.data, (newData) => {
  if (chart) {
    chart.data = toRaw(newData); // To avoid errors, remove Vue Proxy data using `ToRaw`
    chart.update('active');
  }
});

function prettyBites(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}
</script>

<template>
  <div class="relative w-full h-full">
    <canvas ref="ChartLine" class="w-full h-full"></canvas>
  </div>
</template>

<style scoped>
/* Styles pour améliorer l'apparence du canvas */
canvas {
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 51, 234, 0.03) 100%);
}
</style>