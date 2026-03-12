<template>
  <div class="h-full flex flex-col p-4 md:p-8 xl:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
    
    <!-- Header -->
    <div class="border-b border-white/5 pb-6 md:pb-8 animate-fade-in">
        <h1 class="text-2xl md:text-4xl xl:text-5xl font-black text-white tracking-tighter uppercase mb-2">
            Centre de <span class="text-indigo-500">Téléchargement</span>
        </h1>
        <p class="text-zinc-500 font-medium">Gérez vos téléchargements et installations en temps réel.</p>
    </div>

    <!-- 1. ACTIVE DOWNLOADS -->
    <section class="space-y-6 animate-slide-up" :style="{ animationDelay: '100ms' }">
        <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Téléchargements en cours ({{ downloadStore.downloads.length }})
            </h3>
        </div>
        
        <div v-if="downloadStore.downloads.length === 0" class="p-12 border border-dashed border-zinc-800/50 rounded-3xl flex flex-col items-center justify-center text-center bg-zinc-900/20 backdrop-blur-sm shadow-inner group transition-colors hover:border-zinc-700/50">
            <div class="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <ArrowDownTrayIcon class="w-6 h-6 text-zinc-600 group-hover:text-indigo-500 transition-colors duration-500" />
            </div>
            <p class="text-zinc-500 font-medium">Aucun téléchargement actif</p>
            <p class="text-xs text-zinc-600 mt-1">Vos téléchargements apparaîtront ici.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6">
            <div v-for="dl in downloadStore.downloads" :key="dl.gameID" 
                 class="group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-md">
                 
                 <!-- Background Gradient (Subtle) -->
                 <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                 <div class="relative flex h-full">
                     <!-- Cover Art (Left) -->
                     <div class="w-32 sm:w-40 flex-shrink-0 relative">
                         <img :src="resolveImage(dl.game)" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                         <div class="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a]/90"></div>
                     </div>

                     <!-- Content (Right) -->
                     <div class="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
                         
                         <!-- Top: Header -->
                         <div class="flex justify-between items-start gap-4">
                             <div class="flex-1 min-w-0 pr-4">
                                 <div class="flex items-center gap-2 mb-1">
                                    <span v-if="dl.paused" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">En Pause</span>
                                    <span v-else class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">Téléchargement</span>
                                 </div>
                                 <h4 class="text-xl md:text-2xl font-black text-white leading-tight truncate group-hover:text-indigo-400 transition-colors duration-300" :title="dl.title">{{ dl.title }}</h4>
                             </div>
                             
                             <!-- Actions -->
                             <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
                                 <button @click="togglePause(dl)" class="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95" :title="dl.paused ? 'Reprendre' : 'Pause'">
                                     <PlayIcon v-if="dl.paused" class="w-5 h-5" />
                                     <PauseIcon v-else class="w-5 h-5" />
                                 </button>
                                 <button @click="cancelDownload(dl)" class="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-95" title="Annuler">
                                     <XMarkIcon class="w-5 h-5" />
                                 </button>
                             </div>
                         </div>

                         <!-- Middle: Stats Grid -->
                         <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
                             <div class="flex flex-col">
                                 <span class="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-0.5">Vitesse</span>
                                 <span class="text-sm font-mono text-white flex items-center gap-1.5">
                                     <BoltIcon class="w-3.5 h-3.5 text-indigo-500" />
                                     {{ formatSpeed(dl.data?.downloadSpeed) }}
                                 </span>
                             </div>
                             <div class="flex flex-col">
                                 <span class="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-0.5">Avancement</span>
                                 <span class="text-sm font-mono text-zinc-300">
                                     {{ formatSize(dl.data?.downloaded) }} <span class="text-zinc-600">/</span> {{ formatTotalSize(dl) }}
                                 </span>
                             </div>
                             <div class="hidden sm:flex flex-col">
                                 <span class="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-0.5">Temps Restant</span>
                                 <span class="text-sm font-mono text-zinc-300">{{ formatTime(dl.data?.timeRemaining) }}</span>
                             </div>
                         </div>

                         <!-- Bottom: Progress Bar -->
                         <div class="space-y-2">
                             <div class="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                 <div 
                                    class="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 relative overflow-hidden transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    :style="`width: ${Math.round(dl.data?.progress * 100) || 0}%`"
                                 ></div>
                             </div>
                             <div class="flex justify-between items-end">
                                 <span class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">{{ Math.round((dl.data?.progress * 100) || 0) }}<span class="text-sm text-zinc-600 ml-0.5">%</span></span>
                                 <span class="sm:hidden text-xs font-mono text-zinc-500">{{ formatTime(dl.data?.timeRemaining) }}</span>
                             </div>
                         </div>

                     </div>
                 </div>
            </div>
        </div>
    </section>

    <!-- 2. INSTALLATIONS / EXTRACTIONS -->
    <section v-if="installStore.getInstallsPending.length > 0" class="space-y-6 animate-slide-up" :style="{ animationDelay: '200ms' }">
        <h3 class="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
             <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Extraction / Installation ({{ installStore.getInstallsPending.length }})
        </h3>
        
        <div class="grid grid-cols-1 gap-6">
             <div v-for="install in installStore.getInstallsPending" :key="install.id" 
                  class="group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 backdrop-blur-md">
                  
                  <!-- Background Gradient -->
                  <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div class="relative flex h-full">
                      <!-- Cover Art (Left) -->
                      <div class="w-32 sm:w-40 flex-shrink-0 relative bg-gradient-to-br from-green-900/30 to-zinc-900">
                          <img v-if="install.game?.header" :src="install.game.header" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div class="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a]/90"></div>
                          <!-- Spinning Cog Overlay -->
                          <div class="absolute inset-0 flex items-center justify-center">
                              <div class="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                                  <Cog6ToothIcon class="w-6 h-6 text-green-400 animate-spin-slow" />
                              </div>
                          </div>
                      </div>

                      <!-- Content (Right) -->
                      <div class="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
                          <div class="flex justify-between items-start gap-4">
                              <div class="flex-1 min-w-0">
                                  <div class="flex items-center gap-2 mb-1">
                                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                                            :class="(install.progress || 0) > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'">
                                          {{ (install.progress || 0) > 0 ? 'Installation' : 'En file d\'attente' }}
                                      </span>
                                  </div>
                                  <h4 class="text-xl md:text-2xl font-black text-white leading-tight truncate group-hover:text-green-400 transition-colors duration-300" :title="install.title">{{ install.title }}</h4>
                              </div>
                              
                              <span class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tabular-nums flex-shrink-0"
                                    v-if="(install.progress || 0) > 0">
                                  {{ Math.round(install.progress || 0) }}<span class="text-sm text-zinc-600 ml-0.5">%</span>
                              </span>
                          </div>
                          
                          <!-- Progress -->
                          <div class="space-y-2 mt-4">
                              <div class="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider"
                                   :class="(install.progress || 0) > 0 ? 'text-green-400/80' : 'text-zinc-500'">
                                  <span class="truncate">{{ install.message || 'Validation en cours...' }}</span>
                              </div>
                              <div class="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                  <div 
                                      class="h-full relative overflow-hidden transition-all duration-300 rounded-full"
                                      :class="(install.progress || 0) > 0 
                                          ? 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(74,222,128,0.4)]' 
                                          : 'bg-zinc-600/50 indeterminate-bar'"
                                      :style="`width: ${(install.progress || 0) > 0 ? Math.round(install.progress) : 100}%`"
                                  ></div>
                              </div>
                          </div>
                      </div>
                  </div>
             </div>
        </div>
    </section>

    <!-- 3. HISTORY -->
    <section class="space-y-6 animate-slide-up" :style="{ animationDelay: '300ms' }">
        <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Historique Récent</h3>
        
        <div class="rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden">
             <!-- Finished Installs -->
             <div v-for="item in finishedInstalls" :key="item.id" 
                  class="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-zinc-800/50 last:border-0 hover:bg-white/5 transition-colors cursor-default">
                  
                  <div class="flex items-center gap-4 w-full sm:w-auto">
                      <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                          <CheckIcon class="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                          <h4 class="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors">{{ item.title }}</h4>
                          <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Installé avec succès</p>
                      </div>
                  </div>

                  <button class="w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors">
                      JOUER
                  </button>
             </div>

             <!-- Empty History -->
             <div v-if="finishedInstalls.length === 0" class="p-8 text-center text-zinc-600 text-sm italic">
                  Aucun historique récent.
             </div>
        </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDownloadStore } from '../store/download';
import { useInstallStore } from '../store/install';
import { 
    ArrowDownTrayIcon, 
    PlayIcon, 
    PauseIcon, 
    XMarkIcon, 
    BoltIcon,
    Cog6ToothIcon,
    CheckIcon
} from '@heroicons/vue/24/solid';

const downloadStore = useDownloadStore();
const installStore = useInstallStore();

// Computed for finished installs (limited to last 5)
const finishedInstalls = computed(() => {
    return installStore.installs.filter(i => i.finished).slice(-5).reverse();
});

import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();

// ACTIONS (IPC)
const togglePause = (dl: any) => {
    if (!(window as any).electronAPI) return;

    if (dl.downloadType === 'torrent') {
         if (dl.paused) {
             // Resume
             if (dl.data?.infoHash) {
                 // We need path and game data to resume properly, which might be missing in 'dl' object if not stored fully
                 // But assuming dl object has necessary info or Main process handles resume by hash if available
                 // Game.vue sends: resume-torrent(hash, path+title, gameData).
                 // Simplification: Try sending just hash if Main supports it, otherwise warn.
                 // Ideally we stored path in store.
                 const path = dl.path ? `${dl.path}/${dl.title}` : null;
                 if (path) {
                    (window as any).electronAPI.send('resume-torrent', dl.data.infoHash, path, null); // game data null? Main process might need it.
                 } else {
                     notify({ type: 'error', title: 'Erreur', text: 'Informations manquantes pour reprendre.' });
                 }
             }
         } else {
             // Pause
             if (dl.data?.infoHash) {
                 (window as any).electronAPI.send('pause-torrent', dl.data.infoHash);
             }
         }
    } else {
        // Direct download
        (window as any).electronAPI.send('pause-download', dl.gameID);
    }
    
    downloadStore.togglePause(dl.title); 
};

const cancelDownload = (dl: any) => {
    if (confirm(`Annuler le téléchargement de ${dl.title} ?`)) {
        if ((window as any).electronAPI) {
            if (dl.downloadType === 'torrent') {
                 // Try by Hash first
                 if (dl.data?.infoHash) {
                     const path = dl.path ? `${dl.path}/${dl.title}` : '';
                     // Also try removing by ID just to be sure it cleans metadata
                     (window as any).electronAPI.send('stop-torrent', dl.data.infoHash, path);
                 } else {
                     // Fallback by ID if hash missing (Starting...)
                     // We need gameID. dl.gameID should be there.
                     if (dl.gameID) {
                         (window as any).electronAPI.send('stop-torrent-by-id', dl.gameID);
                     }
                 }
            } else {
                 (window as any).electronAPI.send('cancel-download', dl.gameID);
            }
            
            // Remove from UI immediately
            downloadStore.removeDownloadByTitle(dl.title);
            notify({ type: 'info', title: 'Téléchargement', text: 'Téléchargement annulé.' });
        }
    }

    // Restore keyboard focus after native dialog steals it (Electron bug)
    window.focus();
    document.body.focus();
};

// HELPERS
const resolveImage = (game: any) => {
    if (!game) return '/assets/placeholder.webp';
    if (game.header?.startsWith('http')) return game.header;
    if (game.header) return `https://api.jeuxcracks.fr${game.header}`;
    return '/assets/placeholder.webp';
};

const formatSpeed = (speed: number) => {
    if (!speed) return '0 MB/s';
    // Assuming speed in bytes/s or MB/s? Usually bytes/s coming from torrent engine
    // If it's pure number, let's assume bytes.
    if (speed < 1024) return `${speed.toFixed(1)} B/s`;
    if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(1)} KB/s`;
    return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
};

const formatSize = (bytes: number) => {
    if (!bytes) return '0 GB';
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatTime = (ms: number) => {
    if (!ms || ms === Infinity) return '--';
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m ${s}s`;
};
const formatTotalSize = (dl: any) => {
    if (dl.data?.element?.size) return formatSize(dl.data.element.size);
    if (dl.game?.size) return typeof dl.game.size === 'number' ? formatSize(dl.game.size) : dl.game.size;
    return '--';
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
}

.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes slideUp {
    to { opacity: 1; transform: translateY(0); }
}

.animate-spin-slow {
    animation: spin 3s linear infinite;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.animate-pulse-fast {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
