<template>
  <header class="h-16 flex items-center justify-between px-4 md:px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 select-none transition-all duration-300" style="-webkit-app-region: drag">
    
    <!-- Title / Breadcrumbs (Hidden on very small screens to make room for generic search if focused, or just truncate) -->
    <div class="flex items-center gap-4 min-w-0 pr-4">
       <h2 class="text-sm font-bold text-zinc-100 truncate">{{ pageTitle || 'JeuxCracks' }}</h2>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-4 pr-[135px] flex-shrink-0" style="-webkit-app-region: no-drag">
       <!-- Search -->
       <div class="relative group w-full md:w-auto">
         <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
         <input 
           v-model="searchQuery"
           @keyup.enter="handleSearch"
           type="text" 
           placeholder="Rechercher..." 
           class="bg-zinc-900/50 border border-white/5 text-sm rounded-xl py-2 pl-9 pr-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-zinc-900 focus:border-indigo-500/50 transition-all w-32 focus:w-48 sm:w-48 sm:focus:w-64 md:w-64"
         />
       </div>

       <!-- Notifications Toggle -->
       <button @click="notificationStore.togglePanel()" class="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group">
          <BellIcon class="w-5 h-5" />
          <span v-if="notificationStore.unreadCount > 0" 
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-zinc-950 px-1">
             {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
          </span>
       </button>

       <!-- Social Toggle -->
       <button @click="socialStore.togglePanel()" class="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors group">
          <UsersIcon class="w-5 h-5" />
          <span v-if="socialStore.totalNotifications > 0" 
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-zinc-950 px-1">
             {{ socialStore.totalNotifications > 99 ? '99+' : socialStore.totalNotifications }}
          </span>
       </button>
    </div>

  </header>
</template>

<script setup lang="ts">
import { MagnifyingGlassIcon, ChevronLeftIcon, UsersIcon, BellIcon } from '@heroicons/vue/24/outline';
import { useRouter, useRoute } from 'vue-router';
import { computed, ref } from 'vue';
import { useSocialStore } from '../../store/social';
import { useNotificationStore } from '../../store/notifications';

const router = useRouter();
const route = useRoute();
const socialStore = useSocialStore();
const notificationStore = useNotificationStore();

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
</script>
