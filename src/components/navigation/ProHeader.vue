<template>
  <header class="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 select-none" style="-webkit-app-region: drag">
    
    <!-- Title / Breadcrumbs -->
    <div class="flex items-center gap-4">
       <h2 class="text-sm font-semibold text-zinc-100">{{ pageTitle || 'JeuxCracks' }}</h2>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-4" style="-webkit-app-region: no-drag">
       <!-- Search -->
       <div class="relative group">
         <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
         <input 
           v-model="searchQuery"
           @keyup.enter="handleSearch"
           type="text" 
           placeholder="Rechercher un jeu..." 
           class="bg-zinc-900 border border-zinc-800 text-sm rounded-md py-1.5 pl-9 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 focus:bg-zinc-800 transition-all w-64"
         />
       </div>

       <div class="w-px h-4 bg-zinc-800"></div>

       <!-- Window Controls -->
       <div class="flex items-center gap-2">
          <button @click="minimize" class="btn-icon cursor-pointer">
            <MinusIcon class="w-4 h-4" />
          </button>
          <button @click="maximize" class="btn-icon cursor-pointer">
             <Square2StackIcon class="w-4 h-4" />
          </button>
          <button @click="close" class="btn-icon hover:bg-red-900/50 hover:text-red-200 cursor-pointer">
             <XMarkIcon class="w-4 h-4" />
          </button>
       </div>
    </div>

  </header>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, MinusIcon, Square2StackIcon, XMarkIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline';
import { useRouter, useRoute } from 'vue-router';
import { computed, ref } from 'vue';

const router = useRouter();
const route = useRoute();

const searchQuery = ref('');

const handleSearch = () => {
  console.log('🔍 Global Search Triggered:', searchQuery.value);
  if (searchQuery.value.trim()) {
    router.push(`/catalogue?q=${encodeURIComponent(searchQuery.value)}`);
    // Optional: Clear search after navigating? 
    // Usually keep it, but if we navigate away, it might be confusing. 
    // For now, keep it.
  }
};

const pageTitle = computed(() => {
    // Simple mapping or route logic
    if (route.path === '/') return 'Accueil';
    if (route.path.startsWith('/catalogue')) return 'Catalogue';
    if (route.path.startsWith('/library')) return 'Bibliothèque';
    if (route.path.startsWith('/downloads')) return 'Téléchargements';
    if (route.path.startsWith('/account')) return 'Compte';
    return '';
});

const minimize = () => window.electronAPI?.minimize();
const maximize = () => window.electronAPI?.maximize();
const close = () => window.electronAPI?.close();
</script>
