<template>
  <div class="flex items-center justify-center">
    <div class="text-center">
      <div class="relative inline-block mb-6">
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl animate-pulse"></div>
        <img class="relative w-20 h-20 rounded-2xl shadow-2xl" src="/assets/logo.webp" alt="JeuxCracks" />
      </div>
      <h2 class="text-2xl font-bold text-white mb-4">{{ message || 'Chargement...' }}</h2>
      <div class="flex justify-center gap-2">
        <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
        <div class="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
}

defineProps<Props>();
</script> 