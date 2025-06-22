<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import LoadingAnimation from '../assets/baguio-logo.png';

const loading = ref(true);

// Simulate loading process
let timer;
onMounted(() => {
  timer = setTimeout(() => {
    loading.value = false;
  }, 5000);
});

onBeforeUnmount(() => {
  clearTimeout(timer);
});
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen bg-gradient-to-t from-black to-blue-700 relative overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute w-full h-full">
      <div class="absolute w-32 h-32 bg-blue-500 rounded-full opacity-10 top-1/4 left-1/4 animate-pulse"></div>
      <div class="absolute w-48 h-48 bg-cyan-400 rounded-full opacity-5 bottom-1/3 right-1/4 animation-delay-700"></div>
      <div class="absolute w-24 h-24 bg-indigo-500 rounded-full opacity-10 bottom-1/4 left-1/3 animation-delay-500"></div>
    </div>
    
    <!-- Grid lines effect -->
    <div class="absolute inset-0 grid grid-cols-12 gap-4 opacity-5">
      <div v-for="i in 12" :key="`col-${i}`" class="h-full w-px bg-blue-200"></div>
    </div>
    
    <div class="absolute inset-0 grid grid-rows-12 gap-4 opacity-5">
      <div v-for="i in 12" :key="`row-${i}`" class="w-full h-px bg-blue-200"></div>
    </div>
    
    <!-- Logo container with enhanced animation -->
    <div class="relative flex items-center justify-center mb-8">
      <div class="absolute w-80 h-80 rounded-full border-4 border-blue-300 opacity-30 animate-spin-slow"></div>
      <div class="absolute w-72 h-72 rounded-full border-2 border-cyan-400 opacity-20 animate-spin-reverse"></div>
      
      <!-- The main logo -->
      <div class="relative w-60 h-60 flex items-center justify-center">
        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping-slow"></div>
        <!-- Your actual logo -->
        <img class="w-60 h-60 rounded-full animate-pulse shadow-lg" :src="LoadingAnimation" alt="Loading..." />
      </div>
    </div>
    
    <!-- Text animations -->
    <div :class="['text-center z-10 transition-all duration-1000', loading ? 'opacity-100' : 'opacity-0']">
      <div class="animated-text text-white font-bold text-3xl mb-2">
        Smart City Command Center
      </div>
      <div class="animated-text text-white font-bold text-3xl">
        Inventory System
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.animated-text {
  color: white;
  font-weight: bold;
  font-size: 1.875rem; /* text-3xl */
  animation: fadeInUp 1s ease-out forwards;
  opacity: 0;
}

.animated-text:nth-child(1) {
  animation-delay: 0.5s;
}

.animated-text:nth-child(2) {
  animation-delay: 1s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-700 {
  animation-delay: 0.7s;
}

.animate-spin-slow {
  animation: spin 15s linear infinite;
}

.animate-spin-reverse {
  animation: spin 10s linear infinite reverse;
}

.animate-ping-slow {
  animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.animate-loading-progress {
  animation: loading-progress 4s linear forwards;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes loading-progress {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}
</style>