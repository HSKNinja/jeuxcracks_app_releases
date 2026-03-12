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

        <div>
             <button 
                @click="openScannerModal" 
                class="group flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-zinc-700/50 backdrop-blur-md text-zinc-300 font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-black hover:border-white transition-all rounded-full shadow-lg"
            >
                 <ArrowPathIcon class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" :class="isScanningFolders ? 'animate-spin' : ''" />
                 <span>Scanner</span>
             </button>
        </div>
    </div>

    <!-- Empty State -->
    <div v-if="enrichedGames.length === 0" class="flex-1 flex flex-col items-center justify-center text-center -mt-10 md:-mt-20 animate-fade-in">
        <div class="relative group mb-8">
            <div class="absolute inset-0 bg-indigo-500 blur-[100px] opacity-10 group-hover:opacity-30 transition-opacity duration-1000"></div>
            <div class="relative w-32 h-32 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-center shadow-2xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                <FolderIcon class="w-12 h-12 text-zinc-600 group-hover:text-indigo-400 transition-colors duration-500" />
            </div>
        </div>
        <h3 class="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">C'est bien vide ici</h3>
        <p class="text-zinc-500 max-w-md mx-auto mb-8 font-medium">Installez des jeux depuis le catalogue pour constituer votre collection.</p>
        <button 
            @click="router.push('/catalogue')" 
            class="px-8 py-4 bg-white text-black font-black uppercase tracking-wider rounded-full hover:bg-indigo-500 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-1"
        >
            Explorer le catalogue
        </button>
    </div>

    <!-- COVERS GRID VIEW (Default & Only) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 animate-slide-up">
        <div v-for="(game, index) in enrichedGames" :key="game.id" 
             class="group relative aspect-video transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 hover:z-50"
             :style="{ animationDelay: `${index * 50}ms` }"
             @click="launchGame(game)"
        >
            <!-- Visual Content (Clipped) -->
            <div class="absolute inset-0 bg-[#0a0a0a] rounded-xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 group-hover:border-white/20 transition-all duration-300">
                <!-- Cover Image -->
                <img :src="resolveImage(game)" @error="handleImageError" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]"></div>

                <!-- Play Button (Centered) -->
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                    <div class="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                        <PlayIcon class="w-8 h-8 text-white ml-1" />
                    </div>
                </div>

                <!-- Bottom Info Gradient -->
                <div class="absolute bottom-0 inset-x-0 pt-20 pb-4 px-4 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none">
                     <h4 class="text-sm font-bold text-white uppercase tracking-condensed truncate leading-tight mb-1 shadow-black drop-shadow-md">{{ game.name || game.title }}</h4>
                     
                     <!-- Stats Pill -->
                     <div v-if="userStats[game.id]" class="flex items-center gap-3 text-[10px] text-zinc-400 font-medium">
                        <span class="flex items-center gap-1"><ClockIcon class="w-3 h-3 text-indigo-400" /> {{ prettyMilliseconds(userStats[game.id].totalTimePlayedMs) }}</span>
                     </div>
                     <div v-else class="text-[10px] text-zinc-500 font-medium italic">Jamais joué</div>
                </div>
            </div>

            <!-- Options Menu Trigger -->
            <div class="absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <button @click.stop="toggleMenu($event, game)" class="p-2 rounded-full bg-black/50 hover:bg-indigo-500 text-white backdrop-blur-md transition-colors shadow-lg border border-white/10">
                     <EllipsisVerticalIcon class="w-5 h-5" />
                 </button>
            </div>
        </div>
    </div>

    <!-- GLOBAL CONTEXT MENU (Fixed Position) -->
    <Teleport to="body">
        <div v-if="activeGame && menuOpenId" 
             class="fixed w-64 bg-zinc-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in z-[9999]"
             :style="{ top: menuPosition.top + 'px', left: menuPosition.left + 'px' }"
             @click.stop
        >
            <!-- Game Info Header -->
            <div class="p-4 border-b border-white/5 bg-white/5">
                <h4 class="font-bold text-white text-sm truncate mb-1">{{ activeGame.title || activeGame.name }}</h4>
                <div class="flex flex-wrap gap-1">
                    <span v-if="activeGame.version" class="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">{{ activeGame.version }}</span>
                    <span v-if="activeGame.source" class="px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400 text-[10px] font-mono border border-zinc-600/30 truncate max-w-[100px]">{{ typeof activeGame.source === 'string' ? activeGame.source : (activeGame.source[0]?.name || 'Inconnu') }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="p-1">
                <button @click.stop="openLocation(activeGame)" class="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors rounded-lg flex items-center gap-3">
                    <FolderIcon class="w-4 h-4 text-zinc-500" />Emplacement
                </button>
                <button @click.stop="uninstallGame(activeGame)" class="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-lg flex items-center gap-3">
                    <ArrowPathIcon class="w-4 h-4" />Désinstaller
                </button>
            </div>

            <!-- Footer: Install Date -->
            <div v-if="activeGame.installDate" class="px-4 py-2 bg-black/20 text-[10px] text-zinc-500 font-mono text-center border-t border-white/5">
                Installé le {{ new Date(activeGame.installDate).toLocaleDateString() }}
            </div>
        </div>

        <!-- Backdrop for closing menu -->
        <div v-if="menuOpenId" @click="closeMenu" class="fixed inset-0 z-[9998] bg-transparent"></div>
    </Teleport>

    <!-- SCANNER MODAL -->
    <Teleport to="body">
        <div v-if="isScannerModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden">
            <!-- Backdrop -->
            <div @click="closeScannerModal" class="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in text-white/10"></div>
            
            <!-- Modal Content -->
            <div class="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-full">
                <!-- Header -->
                <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 class="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                            <FolderIcon class="w-6 h-6 text-indigo-500" />
                            Dossiers Résiduels
                        </h2>
                        <p class="text-xs text-zinc-500 mt-1">Dossiers téléchargés mais non extraits/installés dans la bibliothèque.</p>
                    </div>
                    <button @click="closeScannerModal" class="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-[#0a0a0a] to-zinc-900">
                    <div v-if="isScanningFolders" class="flex flex-col items-center justify-center py-12">
                        <ArrowPathIcon class="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p class="text-zinc-400 font-medium animate-pulse">Analyse du dossier Downloads...</p>
                    </div>

                    <div v-else-if="unextractedGames.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                        <div class="w-16 h-16 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-4">
                            <CheckIcon class="w-8 h-8 text-green-500" />
                        </div>
                        <p class="font-bold text-white mb-1 tracking-wide">Aucun jeu en attente</p>
                        <p class="text-sm">Votre dossier de téléchargement est propre.</p>
                    </div>

                    <div v-else class="space-y-3">
                        <div v-for="game in unextractedGames" :key="game.path" class="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/5 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-colors">
                                    <ArchiveBoxIcon class="w-5 h-5 text-zinc-400 group-hover:text-indigo-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-bold text-white tracking-wide truncate">{{ game.title }}</h4>
                                    <p class="text-[10px] sm:text-xs text-zinc-500 font-mono truncate w-48 sm:w-80" :title="game.path">{{ game.path }}</p>
                                </div>
                            </div>
                            <button @click="retryExtraction(game.title, game.path)" class="px-4 py-2 bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-400 transition-all shadow-lg active:scale-95 flex items-center gap-2 flex-shrink-0">
                                <RocketLaunchIcon class="w-4 h-4 hidden sm:block" />
                                Installer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '../store';
import { useFetch } from '../utils/useFetch';
import { PlayIcon, ArrowPathIcon, FolderIcon, EllipsisVerticalIcon, Squares2X2Icon, ListBulletIcon, RectangleGroupIcon, ClockIcon, RocketLaunchIcon, XMarkIcon, CheckIcon, ArchiveBoxIcon } from '@heroicons/vue/24/solid';

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
        if (!game.header && !game.icon) {
            try {
                let targetSlug = game.slug;

                // Legacy save support: if game doesn't have a slug, try to find it via Search API
                if (!targetSlug && (game.name || game.title)) {
                    const searchQ = game.name || game.title;
                    const searchRes: any = await useFetch(`/api/engine/search/?q=${encodeURIComponent(searchQ)}&enriched_only=false`);
                    if (searchRes && searchRes.results && searchRes.results.length > 0) {
                        // Find match by ID or pick the first
                        const match = searchRes.results.find((r:any) => r.id === game.id) || searchRes.results[0];
                        if (match && match.slug) {
                            targetSlug = match.slug;
                            game.slug = match.slug;
                        }
                    }
                }

                if (!targetSlug) continue; // Skip if we still have no slug 

                // Fetch full game details from new API using slug
                const data: any = await useFetch(`/api/engine/games/${targetSlug}/`);
                if (data && data.id) { // New API
                     let headerImg = data.metadata?.header_image;
                     if (!headerImg && data.steam_app_id) {
                         headerImg = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${data.steam_app_id}/header.jpg`;
                     }

                     // Only overwrite properties if we actually have new data
                     if (headerImg) game.header = headerImg;
                     if (data.steam_app_id) game.steam_app_id = data.steam_app_id;
                     if (data.metadata?.icon) game.icon = data.metadata.icon;
                     if (data.metadata?.trailers?.[0]) game.video = data.metadata.trailers[0];
                }
            } catch (e) {
                console.error(`Failed to enrich game ${game.slug || game.name}`, e);
            }
        }
    }
};

const fetchStats = async () => {
    const userId = store.user?.id || 'anonymous';

    
    if ((window as any).electronAPI) {
        try {
            userStats.value = await (window as any).electronAPI.invoke('get-all-user-stats', userId);
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

// Scanner Modal logic
const isScannerModalOpen = ref(false);
const isScanningFolders = ref(false);
const unextractedGames = ref<any[]>([]);

const openScannerModal = async () => {
    isScannerModalOpen.value = true;
    isScanningFolders.value = true;
    unextractedGames.value = [];
    
    // Auto-sync library first to ensure our baseline is correct
    try { await store.forceLibrarySync(); } catch (e) {}

    if ((window as any).electronAPI) {
        try {
            unextractedGames.value = await (window as any).electronAPI.invoke('scan-unextracted-games');
            
            // Filter out any games that are currently being actively downloaded or installed
            const downloadStore = (await import('../store/download')).useDownloadStore();
            unextractedGames.value = unextractedGames.value.filter(uGame => {
                return !downloadStore.downloads.some(activeDl => 
                    activeDl.title.toLowerCase() === uGame.title.toLowerCase()
                );
            });
            
        } catch(e) {
            console.error('Scan unextracted error', e);
            notify({ type: 'error', title: 'Erreur', text: 'Impossible d\'analyser le dossier.' });
        }
    }
    isScanningFolders.value = false;
};

const closeScannerModal = () => {
    isScannerModalOpen.value = false;
};

const retryExtraction = (gameTitle: string, folderPath: string) => {
    if ((window as any).electronAPI) {
        (window as any).electronAPI.send('retry-extraction', gameTitle, folderPath);
        
        // Remove from UI optimistically
        unextractedGames.value = unextractedGames.value.filter(g => g.path !== folderPath);
        
        notify({ type: 'success', title: 'Installation lancée', text: `Reprise de ${gameTitle}.` });
        
        // Redirect to downloads page
        closeScannerModal();
        router.push('/downloads');
    }
};

const launchGame = async (game: any) => {

    if ((window as any).electronAPI) {
         let userId = store.user?.id;
         
         // Try to recover user ID if missing but we have tokens
         if (!userId && store.tokens) {

             try {
                 await store.fetchUser();
                 userId = store.user?.id;

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

const menuOpenId = ref<string | number | null>(null);
const activeGame = ref<any>(null);
const menuPosition = ref({ top: 0, left: 0 });

const toggleMenu = (event: MouseEvent, game: any) => {
    if (menuOpenId.value === game.id) {
        closeMenu();
        return;
    }

    activeGame.value = game;
    menuOpenId.value = game.id;

    // Calculate position
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Default: Align right edge of menu with right edge of button
    const menuWidth = 256; // w-64
    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;

    // console.log('📍 Menu Position Calc:', { rect, left, top, windowHeight: window.innerHeight });

    // Prevent going off-screen left
    if (left < 16) left = 16; 
    
    // Check bottom overflow
    const windowHeight = window.innerHeight;
    if (top + 300 > windowHeight) {
        top = rect.top - 300; 
    }

    menuPosition.value = { top, left };
    // console.log('✅ Menu Opened:', activeGame.value?.title, menuPosition.value);
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
    // IMPORTANT: Close menu BEFORE the blocking confirm() dialog.
    // Otherwise the z-[9998] backdrop stays active and blocks all UI.
    closeMenu();

    // Use nextTick to ensure the DOM has cleared the backdrop before showing confirm()
    await new Promise(r => setTimeout(r, 50));

    if (confirm(`Voulez-vous vraiment désinstaller ${game.title || game.name} ?`)) {
        if ((window as any).electronAPI) {
             (window as any).electronAPI.send('remove-game', game.id);
             // Remove locally optimistically
              enrichedGames.value = enrichedGames.value.filter(g => g.id !== game.id);
              store.library = store.library.filter(g => g.id !== game.id);
              notify({ type: 'success', title: 'Désinstallation', text: 'Jeu supprimé de la bibliothèque.' });
        }
    }

    // Restore keyboard focus after native dialog steals it (Electron bug)
    window.focus();
    document.body.focus();
};

const resolveImage = (item: any): string => {
    if (!item) return '/assets/placeholder-cover.jpg';

    // Helper to process URL
    const processUrl = (url: string | undefined | null) => {
        if (!url) return null;
        if (url.startsWith('/assets/')) return url; // Load local assets directly
        if (url.startsWith('http')) return url; 
        if (url.startsWith('//')) return `https:${url}`;
        if (url.startsWith('/')) return `https://api.jeuxcracks.fr${url}`;
        return `https://api.jeuxcracks.fr/${url}`;
    };

    // 1. Unpack nested game object if present (store.library might be Install[] which has .game)
    const gameData = item.game || item;

    // Steam App ID Generation directly
    if (gameData.steam_app_id) {
        return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${gameData.steam_app_id}/header.jpg`;
    }

    // 2. Check candidates in order of preference
    const candidates = [
        gameData.header,
        gameData.metadata?.header_image,
        gameData.urls?.header_image,
        gameData.urls?.image,
        gameData.informations?.image,
        gameData.icon,
        item.header,
        item.icon
    ];

    for (const candidate of candidates) {
        const processed = processUrl(candidate);
        if (processed) return processed;
    }

    return '/assets/placeholder-cover.jpg';
};

function handleImageError(event: Event) {
  (event.target as HTMLImageElement).src = '/assets/placeholder-cover.jpg';
}

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

    // Dependency Installation Listeners
    if ((window as any).electronAPI) {
        (window as any).electronAPI.on('dependency-install-start', (event: any, data: { name: string }) => {
            notify({ 
                type: 'warn', 
                title: 'Installation Dépendance', 
                text: `Préparation de ${data.name}... Veuillez accepter la demande d'administrateur si elle apparaît.`,
                duration: 10000 
            });
        });

        (window as any).electronAPI.on('dependency-install-end', (event: any, data: { name: string }) => {
            notify({ 
                type: 'success', 
                title: 'Dépendance Installée', 
                text: `${data.name} a été installé avec succès.` 
            });
        });
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
