<template>
  <div class="h-full flex flex-col items-center justify-center text-center p-8">
    
    <!-- Ambient glow -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]"></div>
    </div>

    <div class="relative z-10 flex flex-col items-center">
      <!-- Glitch 404 -->
      <div class="relative mb-8">
        <h1 class="text-[12rem] md:text-[16rem] font-black text-white/[0.03] leading-none tracking-tighter select-none">404</h1>
        <h1 class="absolute inset-0 text-[12rem] md:text-[16rem] font-black text-white leading-none tracking-tighter select-none animate-glitch">404</h1>
      </div>

      <h2 class="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">Page introuvable</h2>
      <p class="text-zinc-500 max-w-md mb-10 font-medium">La page que vous recherchez n'existe pas ou a été déplacée.</p>

      <button 
        @click="router.push('/')"
        class="group relative px-8 py-4 bg-white text-black overflow-hidden rounded-xl"
      >
        <div class="absolute inset-0 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out rounded-xl"></div>
        <span class="relative z-10 flex items-center gap-3 font-black uppercase tracking-widest text-sm group-hover:text-white transition-colors">
          <ArrowLeftIcon class="w-5 h-5" />
          Retour à l'accueil
        </span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

const router = useRouter();
</script>

<style scoped>
@keyframes glitch {
  0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
  20% { clip-path: inset(20% 0 50% 0); transform: translate(-4px, 2px); }
  40% { clip-path: inset(60% 0 10% 0); transform: translate(4px, -2px); }
  60% { clip-path: inset(40% 0 30% 0); transform: translate(-2px, 4px); }
  80% { clip-path: inset(10% 0 70% 0); transform: translate(2px, -4px); }
}
.animate-glitch {
  animation: glitch 3s infinite linear;
  text-shadow: 2px 0 #6366f1, -2px 0 #ec4899;
}
</style>
