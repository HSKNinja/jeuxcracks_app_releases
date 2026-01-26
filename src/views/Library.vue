<template>
  <div class="h-full flex flex-col bg-transparent text-white overflow-y-auto custom-scrollbar p-8 md:p-12">
    
    <!-- Header -->
    <div class="flex items-end justify-between mb-12 animate-fade-in">
        <div>
            <h1 class="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85] mb-4">
                Biblio<span class="text-zinc-600">thèque</span>
            </h1>
            <div class="flex items-center gap-4">
                <div class="h-px bg-zinc-800 w-24"></div>
                <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest">{{ enrichedGames.length }} Jeux Installés</p>
            </div>
        </div>

        <div class="flex gap-4">
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
    <div v-if="enrichedGames.length === 0" class="flex-1 flex flex-col items-center justify-center text-center -mt-20">
        <div class="relative group mb-8">
            <div class="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <FolderIcon class="w-32 h-32 text-zinc-800 relative z-10" />
        </div>
        <h3 class="text-4xl font-black text-white uppercase tracking-tighter mb-4">C'est bien vide ici</h3>
        <p class="text-zinc-500 max-w-md mx-auto mb-10 font-medium text-lg">Installez des jeux depuis le catalogue pour constituer votre collection.</p>
        <button 
            @click="router.push('/catalogue')" 
            class="px-10 py-4 bg-white text-black font-black uppercase tracking-wider rounded-none hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
        >
            Explorer le catalogue
        </button>
    </div>

    <!-- Library Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        
        <div v-for="(game, index) in enrichedGames" :key="game.id" 
             class="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
             :style="{ animationDelay: `${index * 50}ms` }"
        >
            
            <!-- Poster Image -->
            <img 
                :src="resolveImage(game)" 
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-0" 
            />
            
            <!-- Video Preview (Hover) -->
            <!-- Note: Library games might not always have 'video' property populated depending on scan source. 
                 If available, strictly use it. -->
            <video
                v-if="game.video"
                :src="game.video"
                class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                muted loop playsinline
                @mouseenter="playVideo"
                @mouseleave="pauseVideo"
            ></video>
            
            <!-- If no video, show image with zoom/glow (handled by CSS above), maybe secondary image? -->

            <!-- Overlays -->
            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity z-20 pointer-events-none"></div>

            <!-- Content -->
            <div class="absolute inset-0 p-6 flex flex-col justify-end z-30 pointer-events-none">
                
                <h4 class="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    {{ game.name || game.title }}
                </h4>
                
                <div class="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span class="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Prêt à jouer
                    </span>
                    
                    <button 
                        @click.stop="launchGame(game)"
                        class="pointer-events-auto flex items-center justify-center w-10 h-10 bg-white text-black rounded-full hover:scale-110 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                        title="Lancer"
                    >
                        <PlayIcon class="w-5 h-5 ml-0.5" />
                    </button>
                </div>
            </div>

            <!-- Settings Button & Menu -->
            <div class="absolute top-4 right-4 z-40">
                <button 
                    @click.stop="toggleMenu(game.id)" 
                    class="p-2 text-zinc-400 hover:text-white bg-black/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto"
                    :class="{ 'opacity-100 bg-indigo-500 text-white': menuOpenId === game.id }"
                >
                    <EllipsisVerticalIcon class="w-5 h-5" />
                </button>

                <!-- Dropdown Menu -->
                <div 
                    v-if="menuOpenId === game.id" 
                    class="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden pointer-events-auto animate-fade-in z-50 origin-top-right"
                    @click.stop
                >
                    <button 
                         @click="openLocation(game)"
                         class="w-full text-left px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <FolderIcon class="w-4 h-4" />
                        Ouvrir l'emplacement
                    </button>
                    <button 
                         @click="uninstallGame(game)"
                         class="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-zinc-800"
                    >
                        <ArrowPathIcon class="w-4 h-4" /> <!-- Using arrow icon as substitute for trash if not avail, or just text -->
                        Désinstaller
                    </button>
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
import { PlayIcon, ArrowPathIcon, FolderIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/solid';

const router = useRouter();
const store = useMainStore();
const scanning = ref(false);

// Local state to hold enriched data (merged store + api)
const enrichedGames = ref<any[]>([]);

// Fetch missing metadata for games
const enrichLibrary = async () => {
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

const launchGame = (game: any) => {
    console.log('Launch', game);
    if ((window as any).electronAPI) {
         (window as any).electronAPI.send('launch-game', game.id);
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

onMounted(() => {
    if (store.library.length === 0) {
        store.syncLibraryFromFile();
    }
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
