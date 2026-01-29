<template>
  <div class="h-full flex flex-col bg-transparent text-white overflow-y-auto custom-scrollbar p-4 md:p-8 xl:p-12">
    
    <!-- Header -->
    <div class="flex items-end justify-between mb-8 xl:mb-12 animate-fade-in">
        <div>
            <h1 class="text-3xl md:text-5xl xl:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85] mb-2 xl:mb-4">
                Biblio<span class="text-zinc-600">thèque</span>
            </h1>
            <div class="flex items-center gap-4">
                <div class="h-px bg-zinc-800 w-24"></div>
                <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest">{{ enrichedGames.length }} Jeux Installés</p>
            </div>
        </div>

        <div class="flex gap-4">
             <!-- View Switcher -->
             <div class="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                 <button 
                    @click="viewMode = 'grid'" 
                    class="p-2 rounded hover:bg-zinc-800 transition-colors"
                    :class="viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500'"
                    title="Grille"
                >
                    <Squares2X2Icon class="w-4 h-4" />
                 </button>
                 <button 
                    @click="viewMode = 'covers'" 
                    class="p-2 rounded hover:bg-zinc-800 transition-colors"
                    :class="viewMode === 'covers' ? 'bg-zinc-800 text-white' : 'text-zinc-500'"
                    title="Pochettes"
                >
                    <RectangleGroupIcon class="w-4 h-4" />
                </button>
                 <button 
                    @click="viewMode = 'list'" 
                    class="p-2 rounded hover:bg-zinc-800 transition-colors"
                    :class="viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500'"
                    title="Liste"
                >
                    <ListBulletIcon class="w-4 h-4" />
                 </button>
             </div>

             <button 
                @click="scanGames" 
                class="group flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-black hover:border-white transition-all rounded-lg"
            >
                 <ArrowPathIcon class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" :class="scanning ? 'animate-spin' : ''" />
                 <span>Scanner</span>
             </button>
        </div>
    </div>

    <!-- Empty State -->
    <div v-if="enrichedGames.length === 0" class="flex-1 flex flex-col items-center justify-center text-center -mt-10 md:-mt-20">
        <div class="relative group mb-6 md:mb-8">
            <div class="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <FolderIcon class="w-20 h-20 md:w-32 md:h-32 text-zinc-800 relative z-10" />
        </div>
        <h3 class="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2 md:mb-4">C'est bien vide ici</h3>
        <p class="text-zinc-500 max-w-xs md:max-w-md mx-auto mb-6 md:mb-10 font-medium text-base md:text-lg">Installez des jeux depuis le catalogue pour constituer votre collection.</p>
        <button 
            @click="router.push('/catalogue')" 
            class="px-6 py-3 md:px-10 md:py-4 bg-white text-black font-black uppercase tracking-wider rounded-none hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
        >
            Explorer le catalogue
        </button>
    </div>

    <!-- Views -->
    <div v-else>
        
        <!-- GRID VIEW (Default) -->
        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 xl:gap-8">
            <div v-for="(game, index) in enrichedGames" :key="game.id" 
                 class="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                 :style="{ animationDelay: `${index * 50}ms` }"
            >
                <img :src="resolveImage(game)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-0" />
                <video v-if="game.video" :src="game.video" class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" muted loop playsinline @mouseenter="playVideo" @mouseleave="pauseVideo"></video>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity z-20 pointer-events-none"></div>
                <div class="absolute inset-0 p-6 flex flex-col justify-end z-30 pointer-events-none">
                    <h4 class="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">{{ game.name || game.title }}</h4>
                    <div class="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider w-fit">Prêt à jouer</span>
                            <div v-if="userStats[game.id]" class="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                                <span class="flex items-center gap-1"><ClockIcon class="w-3 h-3" /> {{ prettyMilliseconds(userStats[game.id].totalTimePlayedMs) }}</span>
                                <span class="flex items-center gap-1"><RocketLaunchIcon class="w-3 h-3" /> {{ userStats[game.id].totalLaunches }}</span>
                            </div>
                        </div>
                        <button @click.stop="launchGame(game)" class="pointer-events-auto flex items-center justify-center w-10 h-10 bg-white text-black rounded-full hover:scale-110 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"><PlayIcon class="w-5 h-5 ml-0.5" /></button>
                    </div>
                </div>
                <div class="absolute top-4 right-4 z-40">
                    <button @click.stop="toggleMenu(game.id)" class="p-2 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto" :class="{ 'opacity-100 bg-indigo-500 text-white': menuOpenId === game.id }"><EllipsisVerticalIcon class="w-5 h-5" /></button>
                    <div v-if="menuOpenId === game.id" class="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden pointer-events-auto animate-fade-in z-50 origin-top-right" @click.stop>
                        <button @click="openLocation(game)" class="w-full text-left px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"><FolderIcon class="w-4 h-4" />Ouvrir l'emplacement</button>
                        <button @click="uninstallGame(game)" class="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-zinc-800"><ArrowPathIcon class="w-4 h-4" />Désinstaller</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- COVERS VIEW (Dense Posters) -->
        <div v-else-if="viewMode === 'covers'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 animate-fade-in">
             <div v-for="(game, index) in enrichedGames" :key="game.id" 
                 class="group relative aspect-[2/3] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                 @click="launchGame(game)"
            >
                <img :src="resolveImage(game)" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <PlayIcon class="w-12 h-12 text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                </div>
                <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                     <h4 class="text-xs font-bold text-white uppercase truncate">{{ game.name || game.title }}</h4>
                     <div v-if="userStats[game.id]" class="flex items-center gap-2 text-[9px] text-zinc-400 mt-0.5">
                        <ClockIcon class="w-3 h-3" /> {{ prettyMilliseconds(userStats[game.id].totalTimePlayedMs) }}
                     </div>
                </div>
            </div>
        </div>

        <!-- LIST VIEW -->
        <div v-else-if="viewMode === 'list'" class="flex flex-col gap-2 animate-fade-in">
             <div v-for="(game, index) in enrichedGames" :key="game.id" 
                 class="group flex items-center gap-4 p-2 bg-zinc-900/30 border border-white/5 rounded-lg hover:bg-zinc-900 hover:border-indigo-500/30 transition-all cursor-pointer"
                 @click="launchGame(game)"
            >
                <div class="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-black">
                     <img :src="resolveImage(game)" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                     <h4 class="text-sm font-bold text-white uppercase truncate">{{ game.name || game.title }}</h4>
                     <div class="flex items-center gap-3 mt-0.5">
                        <p class="text-[10px] text-zinc-500 font-medium">Installé</p>
                        <div v-if="userStats[game.id]" class="flex items-center gap-2 text-[10px] text-zinc-500">
                             <span class="flex items-center gap-1"><ClockIcon class="w-3 h-3" /> {{ prettyMilliseconds(userStats[game.id].totalTimePlayedMs) }}</span>
                             <span class="flex items-center gap-1 border-l border-zinc-700 pl-2"><RocketLaunchIcon class="w-3 h-3" /> {{ userStats[game.id].totalLaunches }}</span>
                        </div>
                     </div>
                </div>
                <div class="flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button @click.stop="openLocation(game)" class="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white" title="Dossier"><FolderIcon class="w-4 h-4" /></button>
                     <button @click.stop="uninstallGame(game)" class="p-2 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-500" title="Désinstaller"><ArrowPathIcon class="w-4 h-4" /></button>
                     <button @click.stop="launchGame(game)" class="px-4 py-1.5 bg-white text-black text-xs font-bold uppercase rounded hover:bg-indigo-500 hover:text-white transition-colors">Jouer</button>
                </div>
            </div>
        </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '../store';
import { useFetch } from '../utils/useFetch';
import { PlayIcon, ArrowPathIcon, FolderIcon, EllipsisVerticalIcon, Squares2X2Icon, ListBulletIcon, RectangleGroupIcon, ClockIcon, RocketLaunchIcon } from '@heroicons/vue/24/solid';

const router = useRouter();
const store = useMainStore();
const scanning = ref(false);
const viewMode = ref<'grid' | 'covers' | 'list'>('grid');

// Local state to hold enriched data (merged store + api)
const enrichedGames = ref<any[]>([]);
const userStats = ref<Record<string, any>>({});

function prettyMilliseconds(ms: number) {
  if (!ms) return '0h 0m';
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  
  if (hour > 0) return `${hour}h ${min % 60}m`;
  return `${min}m`;
}

// Fetch missing metadata for games
const enrichLibrary = async () => {
    // ... existing enrich logic ...
    for (const game of enrichedGames.value) {
        if (!game.header && !game.icon && game.id) {
            try {
                // Fetch full game details
                const data: any = await useFetch(`/Cracks/api/game/?format=json&id=${game.id}`);
                if (data && data.status) { // Assuming data structure
                     // Update local object reactive
                     Object.assign(game, {
                         header: data.header || data.urls?.header_image || data.urls?.image || data.informations?.image,
                         icon: data.icon,
                         video: data.video || data.urls?.trailer ? (data.video || data.urls.trailer) : null,
                         ...data // Merge other useful fields
                     });
                }
            } catch (e) {
                console.error(`Failed to enrich game ${game.id}`, e);
            }
        }
    }
};

const fetchStats = async () => {
    const userId = store.user?.id || 'anonymous';
    console.log('📊 Fetching stats for user:', userId, 'Store User:', store.user);
    
    if ((window as any).electronAPI) {
        try {
            userStats.value = await (window as any).electronAPI.invoke('get-all-user-stats', userId);
            console.log('✅ Stats received:', userStats.value);
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    }
};

// Sync from store to local state
watch(() => store.library, (newLib) => {
    // Preserve existing enriched data if ids match
    enrichedGames.value = newLib.map(libGame => {
        const existing = enrichedGames.value.find(g => g.id === libGame.id);
        if (existing && existing.header) {
            // Merge existing enriched data
            return { ...libGame, ...existing };
        }
        // Return a COPY of the store object to avoid modifying store + triggering deep watch loop
        return { ...libGame };
    });
    enrichLibrary();
}, { immediate: true, deep: true });

import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();

const scanGames = async () => {
    scanning.value = true;
    try {
        await store.forceLibrarySync(); 
        notify({ type: 'success', title: 'Scan terminé', text: 'Bibliothèque mise à jour.' });
    } catch (e) {
        console.error("Scan error", e);
        notify({ type: 'error', title: 'Erreur', text: 'Impossible de scanner la bibliothèque.' });
    } finally {
        scanning.value = false;
    }
};

const launchGame = async (game: any) => {
    console.log('Launch', game);
    if ((window as any).electronAPI) {
         let userId = store.user?.id;
         
         // Try to recover user ID if missing but we have tokens
         if (!userId && store.tokens) {
             console.log('⚠️ Missing User ID on launch, attempting to fetch...');
             try {
                 await store.fetchUser();
                 userId = store.user?.id;
                 console.log('✅ User ID recovered:', userId);
             } catch (e) {
                 console.error('Failed to recover user ID', e);
             }
         }
         
         userId = userId || 'anonymous';
         (window as any).electronAPI.send('launch-game', game.id, userId);
    } else {
        notify({ type: 'error', title: 'Erreur', text: 'Fonctionnalité non disponible ici.' });
    }
};

const menuOpenId = ref<string | null>(null);

const toggleMenu = (gameId: string) => {
    menuOpenId.value = menuOpenId.value === gameId ? null : gameId;
};

// Close menu when clicking outside
const closeMenu = () => {
    menuOpenId.value = null;
};

// ACTIONS
const openLocation = (game: any) => {
    if ((window as any).electronAPI) {
        // Fallback to searching installation path if not explicit
        const path = game.path || game.installPath; // Adjust based on actual data structure
        if (path) {
             (window as any).electronAPI.send('open-game-emplacement', path);
        } else {
             notify({ type: 'error', title: 'Erreur', text: 'Chemin introuvable.' });
        }
    }
    closeMenu();
};

const uninstallGame = async (game: any) => {
    if (confirm(`Voulez-vous vraiment désinstaller ${game.title || game.name} ?`)) {
        if ((window as any).electronAPI) {
             (window as any).electronAPI.send('remove-game', game.id);
             // Remove locally optimistically
              enrichedGames.value = enrichedGames.value.filter(g => g.id !== game.id);
              store.library = store.library.filter(g => g.id !== game.id);
              notify({ type: 'success', title: 'Désinstallation', text: 'Jeu supprimé de la bibliothèque.' });
        }
    }
    closeMenu();
};

const resolveImage = (item: any): string => {
    if (!item) return '/assets/placeholder.webp';

    // Helper to process URL
    const processUrl = (url: string | undefined | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url; 
        if (url.startsWith('//')) return `https:${url}`;
        if (url.startsWith('/')) return `https://api.jeuxcracks.fr${url}`;
        return `https://api.jeuxcracks.fr/${url}`;
    };

    // 1. Unpack nested game object if present (store.library might be Install[] which has .game)
    const gameData = item.game || item;

    // 2. Check candidates in order of preference (Header -> Icon -> API fields)
    const candidates = [
        gameData.header,
        gameData.icon,
        gameData.urls?.header_image,
        gameData.urls?.image,
        gameData.informations?.image,
        // Fallback to item root if different
        item.header,
        item.icon
    ];

    for (const candidate of candidates) {
        const processed = processUrl(candidate);
        if (processed) return processed;
    }

    return '/assets/placeholder.webp';
};

// Video Playback Handlers (Safe)
const playVideo = (e: Event) => {
    const video = e.target as HTMLVideoElement;
    if (video) {
        const p = video.play();
        if (p !== undefined) {
            p.catch(() => {
                // Auto-play was prevented or interrupted by pause.
                // Safely ignore to prevent console errors.
            });
        }
    }
};

const pauseVideo = (e: Event) => {
    const video = e.target as HTMLVideoElement;
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
};

onMounted(async () => {
    if (store.library.length === 0) {
        store.syncLibraryFromFile();
    }
    await fetchStats();
});
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

.animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
