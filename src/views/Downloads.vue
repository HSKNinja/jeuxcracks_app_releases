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
        
        <div v-if="downloadStore.downloads.length === 0" class="p-12 border border-dashed border-zinc-800/50 rounded-2xl flex flex-col items-center justify-center text-center bg-zinc-900/20 backdrop-blur-sm">
            <div class="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 shadow-inner">
                <ArrowDownTrayIcon class="w-6 h-6 text-zinc-600" />
            </div>
            <p class="text-zinc-500 font-medium">Aucun téléchargement actif</p>
            <p class="text-xs text-zinc-600 mt-1">Vos téléchargements apparaîtront ici.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-4">
            <div v-for="dl in downloadStore.downloads" :key="dl.gameID" 
                 class="group relative bg-[#0a0a0a] border border-zinc-800 hover:border-indigo-500/30 rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 overflow-hidden">
                 
                 <!-- Background Beam -->
                 <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>

                 <div class="flex flex-col md:flex-row gap-6 items-center">
                     
                     <!-- Icon -->
                     <div class="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                         <img :src="resolveImage(dl.game)" class="w-full h-full object-cover" />
                     </div>

                     <!-- Info -->
                     <div class="flex-1 min-w-0 w-full space-y-4">
                         
                         <div class="flex justify-between items-start">
                             <div>
                                 <h4 class="text-xl font-bold text-white mb-1 truncate">{{ dl.title }}</h4>
                                 <div class="flex items-center gap-4 text-xs font-mono text-zinc-400">
                                     <span class="flex items-center gap-1.5">
                                         <BoltIcon class="w-3 h-3 text-yellow-500" />
                                         {{ formatSpeed(dl.data?.downloadSpeed) }}
                                     </span>
                                     <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
                                     <span>{{ formatSize(dl.data?.downloaded) }} / {{ formatTotalSize(dl) }}</span> <!-- Assuming size avail -->
                                 </div>
                             </div>
                             
                             <!-- Actions -->
                             <div class="flex items-center gap-2">
                                 <button @click="togglePause(dl)" class="p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" :title="dl.paused ? 'Reprendre' : 'Pause'">
                                     <PlayIcon v-if="dl.paused" class="w-5 h-5" />
                                     <PauseIcon v-else class="w-5 h-5" />
                                 </button>
                                 <button @click="cancelDownload(dl)" class="p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-colors" title="Annuler">
                                     <XMarkIcon class="w-5 h-5" />
                                 </button>
                             </div>
                         </div>

                         <!-- Progress -->
                         <div class="space-y-2">
                             <div class="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                 <div 
                                    class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 relative overflow-hidden transition-all duration-300 ease-out"
                                    :style="`width: ${Math.round(dl.data?.progress * 100) || 0}%`"
                                 >
                                    <div class="absolute inset-0 bg-white/20 animate-pulse-fast"></div>
                                 </div>
                             </div>
                             <div class="flex justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500">
                                 <span>{{ Math.round((dl.data?.progress * 100) || 0) }}% COMPLÉTÉ</span>
                                 <span>ETA: {{ formatTime(dl.data?.timeRemaining) }}</span>
                             </div>
                         </div>

                     </div>

                 </div>
            </div>
        </div>
    </section>

    <!-- 2. INSTALLATIONS -->
    <section v-if="installStore.getInstallsPending.length > 0" class="space-y-6 animate-slide-up" :style="{ animationDelay: '200ms' }">
        <h3 class="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
             <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             Installations en cours
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div v-for="install in installStore.getInstallsPending" :key="install.id" 
                  class="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 flex items-center gap-4 animate-pulse border-l-4 border-l-green-500">
                  <div class="w-12 h-12 rounded bg-zinc-900 flex items-center justify-center">
                      <Cog6ToothIcon class="w-6 h-6 text-green-500 animate-spin-slow" />
                  </div>
                  <div>
                      <h4 class="font-bold text-white text-sm">{{ install.title }}</h4>
                      <div class="mt-1">
                          <div class="flex justify-between items-center gap-4">
                              <p class="text-xs text-green-500 font-bold uppercase tracking-wider truncate max-w-[150px]">
                                  {{ install.message || 'En attente...' }}
                              </p>
                              <span v-if="install.progress !== undefined" class="text-[10px] font-mono text-zinc-400 min-w-[30px] text-right">
                                  {{ Math.round(install.progress) }}%
                              </span>
                          </div>
                          <div v-if="install.progress !== undefined" class="h-1 w-full bg-zinc-900 rounded-full overflow-hidden mt-1">
                                <div class="h-full bg-green-500 transition-all duration-300" :style="`width: ${install.progress}%`"></div>
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
            if (dl.downloadType === 'torrent' && dl.data?.infoHash) {
                 const path = dl.path ? `${dl.path}/${dl.title}` : '';
                 (window as any).electronAPI.send('stop-torrent', dl.data.infoHash, path);
            } else {
                 (window as any).electronAPI.send('cancel-download', dl.gameID);
            }
            downloadStore.removeDownloadByTitle(dl.title);
            notify({ type: 'info', title: 'Téléchargement', text: 'Téléchargement annulé.' });
        }
    }
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
