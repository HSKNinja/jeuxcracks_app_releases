<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'

defineProps<{
  title?: string,
  button?: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
}>()
</script>

<template>
  <VueFinalModal
    class="flex justify-center items-center"
    content-class="relative flex flex-col w-full max-w-xl mx-4 p-8 bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 animate-fade-in-up"
    overlay-class="bg-black/80 backdrop-blur-sm transition-opacity duration-300"
  >
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-white/5">
        <h1 class="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span class="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></span>
            {{ title }}
        </h1>
        <!-- Optional Close Button could go here -->
    </div>

    <!-- Content -->
    <div class="py-2">
      <slot />
    </div>

    <!-- Action Button (if provided) -->
    <div v-if="button" class="flex justify-end pt-4 border-t border-white/5">
        <button 
            class="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all hover:scale-105 active:scale-95" 
            @click="emit('confirm')"
        >
          {{ button }}
        </button>
    </div>
  </VueFinalModal>
</template>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}
</style>
