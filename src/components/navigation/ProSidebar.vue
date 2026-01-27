<template>
  <aside class="w-[280px] h-full flex flex-col bg-zinc-950 border-r border-zinc-800 flex-shrink-0 z-20">
    
    <!-- Brand -->
    <div class="h-16 flex items-center px-6 gap-3 select-none">
       <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-bold text-lg shadow-sm">
          J
       </div>
       <h1 class="text-base font-bold text-white tracking-wide">JeuxCracks</h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">
      
      <!-- Section 1 -->
      <div class="space-y-1">
        <router-link to="/" class="nav-item">
            <HomeIcon class="w-5 h-5" />
            <span>Accueil</span>
        </router-link>
        <router-link to="/catalogue" class="nav-item">
            <RectangleStackIcon class="w-5 h-5" />
            <span>Catalogue</span>
        </router-link>
        <router-link to="/library" class="nav-item">
            <FolderIcon class="w-5 h-5" />
            <span>Bibliothèque</span>
        </router-link>
        <router-link to="/premium" class="nav-item group/premium">
            <SparklesIcon class="w-5 h-5 group-hover/premium:text-amber-500 transition-colors" />
            <span class="group-hover/premium:text-amber-400 transition-colors">Premium</span>
        </router-link>
        <router-link to="/dmca" class="nav-item">
            <ScaleIcon class="w-5 h-5" />
            <span>DMCA</span>
        </router-link>
      </div>

      <!-- Section 2 -->
      <div>
        <h3 class="px-3 mb-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Utilisateur</h3>
        <div class="space-y-1">
            <router-link to="/downloads" class="nav-item justify-between">
                <div class="flex items-center gap-3">
                    <ArrowDownTrayIcon class="w-5 h-5" />
                    <span>Téléchargements</span>
                </div>
                <span v-if="downloadStore.downloads.length > 0" class="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                    {{ downloadStore.downloads.length }}
                </span>
            </router-link>
            <router-link to="/favorites" class="nav-item">
                <HeartIcon class="w-5 h-5" />
                <span>Favoris</span>
            </router-link>
            <!-- Moved Shop to User Section -->
            <router-link to="/shop" class="nav-item">
                <ShoppingBagIcon class="w-5 h-5" />
                <span>Boutique</span>
            </router-link>
        </div>
      </div>

    </nav>

    <!-- Bottom User -->
    <div class="p-4 border-t border-zinc-800">
        <router-link to="/account" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer group">
           <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors overflow-hidden">
              <img v-if="store.user?.profile_picture" :src="resolveAvatar(store.user.profile_picture)" class="w-full h-full object-cover" />
              <span v-else>U</span>
           </div>
           <div class="flex-1 min-w-0">
               <div class="text-sm font-medium text-zinc-200 truncate">{{ store.user?.pseudo || 'Utilisateur' }}</div>
               <div class="text-xs text-zinc-500">Mon Compte</div>
           </div>
           <UserCircleIcon class="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
        </router-link>
    </div>

  </aside>
</template>

<script setup lang="ts">
import { HomeIcon, RectangleStackIcon, FolderIcon, ArrowDownTrayIcon, UserCircleIcon, HeartIcon, ShoppingBagIcon, SparklesIcon, ScaleIcon } from '@heroicons/vue/24/outline';
import { API_CONFIG } from '../../config/api';
import { useDownloadStore } from '../../store/download';
import { useMainStore } from '../../store';

const downloadStore = useDownloadStore();
const store = useMainStore();

const resolveAvatar = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_CONFIG.BASE_URL}${path}`;
};
</script>

<style scoped>
.nav-item {
    @apply flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg transition-all duration-200;
}
.nav-item:hover {
    @apply text-zinc-100 bg-zinc-900;
}
.nav-item.router-link-active {
    @apply text-white bg-zinc-900 shadow-sm ring-1 ring-zinc-800;
}
</style>
