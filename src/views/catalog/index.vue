<template>
  <div class="h-full bg-[#050505] text-white overflow-y-auto custom-scrollbar scroll-smooth">
    
    <div class="max-w-[1920px] mx-auto p-4 md:p-8 xl:p-12 flex flex-col xl:flex-row gap-8 xl:gap-12 items-start relative">
        
        <!-- MOBILE HEADER Actions (Visible < XL) -->
        <div class="w-full xl:hidden flex items-center justify-between mb-6 animate-fade-in">
             <div>
                <h1 class="text-3xl font-black text-white tracking-tighter uppercase">Catalogue</h1>
                <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{{ totalEnrichedGames }} Jeux</p>
             </div>
             <div class="flex flex-col items-center gap-2">
                 <button 
                    @click="showMobileFilters = true"
                    class="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-xl text-xs font-black uppercase hover:bg-zinc-200 transition-colors"
                >
                    <FunnelIcon class="w-4 h-4" />
                    Filtres
                </button>
                 <button 
                    v-if="hasActiveFilters"
                    @click="resetAll"
                    class="text-[10px] font-bold text-red-500 uppercase hover:text-red-400 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg"
                >
                    <XMarkIcon class="w-3 h-3" />
                    Réinitialiser
                </button>
             </div>
        </div>

        <!-- BACKDROP (Mobile Only) -->
        <div 
            v-if="showMobileFilters" 
            @click="showMobileFilters = false" 
            class="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 xl:hidden animate-fade-in"
        ></div>

        <!-- SIDEBAR DRAWER -->
        <aside 
            class="fixed inset-y-0 left-0 w-80 bg-[#050505] border-r border-white/5 p-6 z-[9999] transform transition-transform duration-300 ease-out xl:relative xl:transform-none xl:w-72 xl:p-0 xl:bg-transparent xl:border-none xl:z-0 xl:sticky xl:top-12 xl:h-[calc(100vh-6rem)] custom-scrollbar overflow-y-auto flex flex-col gap-8"
            :class="showMobileFilters ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'"
        >
            
            <!-- Mobile Close Header -->
            <div class="flex xl:hidden items-center justify-between">
                <h2 class="text-xl font-black text-white uppercase tracking-tighter">Filtres</h2>
                <button 
                    type="button"
                    @click.stop="showMobileFilters = false" 
                    class="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                    <XMarkIcon class="w-6 h-6 text-zinc-400" />
                </button>
            </div>

            <!-- Header (Desktop Only) -->
            <div class="hidden xl:block">
                <h1 class="text-3xl font-black text-white tracking-tighter uppercase mb-1">Catalogue</h1>
                 <div class="flex items-center gap-2">
                     <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                     <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{{ totalEnrichedGames }} Titres</p>
                </div>
            </div>

            <!-- Search -->
            <div class="relative group">
                <input 
                    v-model="searchQuery"
                    @input="handleSearch"
                    type="text" 
                    placeholder="Rechercher..." 
                    class="block w-full bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 py-3.5 pl-12 pr-4 text-sm font-bold tracking-wide focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all shadow-inner" 
                />
                <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                
                <!-- Clear Search Button -->
                <button v-if="searchQuery" @click="searchQuery = ''; handleSearch()" class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                    <XMarkIcon class="w-4 h-4" />
                </button>
            </div>

            <div class="w-full h-px bg-gradient-to-r from-white/10 to-transparent"></div>

            <!-- Filters Section -->
            <div class="flex-1 flex flex-col gap-8">
                
                <!-- Sort -->
                <div class="space-y-4">
                    <h3 class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Trier par</h3>
                    <div class="flex flex-col gap-0.5">
                        <button 
                            v-for="opt in sortOptions"
                            :key="opt.value"
                            @click="setSort(opt.value)" 
                            class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                            :class="filters.sort === opt.value ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'"
                        >
                            {{ opt.label }}
                        </button>
                    </div>
                </div>

            </div>
            
            <button 
                @click="resetAll"
                class="w-full mt-4 py-3.5 bg-zinc-900 border border-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-xl shadow-lg"
            >
                Tout Réinitialiser
            </button>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="flex-1 min-w-0">
            
            <!-- Loading -->
            <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                <div v-for="n in 6" :key="n" class="aspect-video bg-zinc-900 rounded-lg animate-pulse"></div>
            </div>

            <!-- Empty -->
            <div v-else-if="games.length === 0" class="h-[60vh] flex flex-col items-center justify-center text-center">
                <MagnifyingGlassIcon class="w-16 h-16 text-zinc-700 mb-6" />
                <h3 class="text-2xl font-light text-white tracking-tight mb-2">Aucun résultat trouvé</h3>
                <p class="text-zinc-500">Essayez d'autres termes de recherche ou de modifier vos filtres.</p>
            </div>

            <!-- Grid (Landscape Cards 16:9 aspect-video) -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 animate-fade-in-up">
                
                <div 
                    v-for="(game, index) in games" 
                    :key="game.id" 
                    class="group relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 hover:z-50 bg-[#050505]"
                    @click="goToGame(game.slug)"
                    :style="{ animationDelay: `${index * 30}ms` }"
                >
                    <!-- Image Area -->
                    <img 
                        :src="game.header" 
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                    
                     <!-- Video Preview -->
                     <video
                        v-if="game.video"
                        :src="game.video"
                        class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        muted loop playsinline
                        @mouseenter="playVideo"
                        @mouseleave="pauseVideo"
                    ></video>

                    <!-- Hover Darkener Overlay -->
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]"></div>

                    <!-- Badges Top Left -->
                    <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
                         <span v-if="game.isOnline" class="px-2 py-0.5 bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider rounded shadow-lg">Multi</span>
                         <span v-if="game.isNew" class="px-2 py-0.5 bg-black/60 backdrop-blur-md text-indigo-400 border border-indigo-500/30 text-[9px] font-bold uppercase tracking-wider rounded shadow-lg">New</span>
                    </div>

                    <!-- Tags Top Right -->
                    <div class="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        <span class="px-2 py-0.5 bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10 text-[9px] font-bold uppercase tracking-wider rounded shadow-lg">
                            {{ game.categories?.[0] || 'Jeu' }}
                        </span>
                    </div>

                    <!-- Bottom Info Gradient Overlay -->
                    <div class="absolute bottom-0 inset-x-0 pt-24 pb-4 px-4 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-500 pointer-events-none z-10 flex flex-col justify-end">
                        <h3 class="text-sm md:text-base font-bold text-white uppercase tracking-tight leading-tight mb-1.5 truncate drop-shadow-md">
                            {{ game.display_name }}
                        </h3>
                        
                        <div class="flex items-center justify-between mt-0.5">
                            <span class="text-[10px] font-bold text-indigo-400">{{ game.total_size || 'N/A' }}</span>
                            
                            <!-- Stats -->
                            <div class="flex items-center gap-3 text-[10px] font-bold text-zinc-400">
                                <div class="flex items-center gap-1" title="Vues">
                                    <EyeIcon class="w-3 h-3" />
                                    {{ formatNumber(game.views) }}
                                </div>
                                <div class="flex items-center gap-1" title="Téléchargements">
                                    <ArrowDownTrayIcon class="w-3 h-3" />
                                    {{ formatNumber(game.downloads || 0) }}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <!-- Pagination (Redesigned & Modernized) -->
            <div v-if="pagination.totalPages > 1" class="flex justify-center mt-16 mb-16 animate-fade-in-up">
                <div class="inline-flex items-center bg-[#0a0a0a] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                    
                    <!-- Previous Button -->
                     <button 
                        @click="changePage(pagination.page - 1)" 
                        :disabled="pagination.page <= 1"
                        class="h-10 px-4 flex items-center justify-center rounded-xl text-xs font-bold uppercase transition-all duration-300 mr-2"
                        :class="pagination.page <= 1 ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'text-zinc-400 hover:bg-white/10 hover:text-white'"
                    >
                        <ChevronLeftIcon class="w-4 h-4 mr-1" />
                        Précédent
                    </button>
                    
                    <!-- Page Numbers -->
                    <div class="flex items-center gap-1 hidden md:flex">
                        <template v-for="p in visiblePages" :key="p">
                            <!-- Number Button -->
                            <button 
                                v-if="p !== '...'"
                                @click="changePage(p as number)"
                                class="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all duration-300"
                                :class="p === pagination.page ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-zinc-500 hover:bg-white/10 hover:text-white'"
                            >
                                {{ p }}
                            </button>
                            <!-- Ellipsis -->
                            <span v-else class="w-8 h-10 flex items-center justify-center text-zinc-600 font-bold">
                                ...
                            </span>
                        </template>
                    </div>
                    
                    <!-- Short representation for mobile -->
                    <div class="px-6 text-sm font-black flex items-center gap-2 md:hidden">
                        <span class="text-white">{{ pagination.page }}</span> 
                        <span class="text-zinc-700">/</span> 
                        <span class="text-zinc-500">{{ pagination.totalPages }}</span>
                    </div>

                    <!-- Next Button -->
                     <button 
                        @click="changePage(pagination.page + 1)" 
                        :disabled="pagination.page >= pagination.totalPages"
                        class="h-10 px-4 flex items-center justify-center rounded-xl text-xs font-bold uppercase transition-all duration-300 ml-2"
                        :class="pagination.page >= pagination.totalPages ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'text-zinc-400 hover:bg-white/10 hover:text-white'"
                    >
                        Suivant
                        <ChevronRightIcon class="w-4 h-4 ml-1" />
                    </button>

                </div>
            </div>

        </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFetch } from '../../utils/useFetch';
import { 
    MagnifyingGlassIcon, 
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon,
    XMarkIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/solid';

const router = useRouter();
const route = useRoute();

// State
const games = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const showMobileFilters = ref(false);
const pagination = ref({ page: 1, totalPages: 1, totalResults: 0 });
const totalEnrichedGames = ref(0);

// Visible pages logic for the new pagination
const visiblePages = computed(() => {
    const total = pagination.value.totalPages;
    const current = pagination.value.page;
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
        return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
        return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
});
// Watch for URL query changes (from global header search)
watch(() => route.query.q, (newQ) => {
    if (newQ !== undefined) {
        searchQuery.value = (newQ as string);
        pagination.value.page = 1;
        fetchGames();
    }
});

onMounted(() => {
    if (route.query.q) {
        searchQuery.value = route.query.q as string;
    }
    fetchStats();
    fetchGames();
});

const fetchStats = async () => {
    try {
        const res: any = await useFetch('/api/engine/stats/');
        if (res && res.engine && res.engine.enriched_games) {
            totalEnrichedGames.value = res.engine.enriched_games;
        }
    } catch (e) {
        console.error("Failed to fetch game stats:", e);
    }
};

const filters = ref({
    sort: 'relevance', // 'relevance', 'newest', 'popular', 'views', 'downloads'
    is_online: true as boolean | null, // null = all, true = online only
    category: '' as string, // single category slug
    tags: [] as string[], // array of tag names
    year: '' as string // release year filter
});

const hasActiveFilters = computed(() => {
    return filters.value.sort !== 'relevance' || 
           filters.value.is_online !== null || 
           filters.value.year !== '' ||
           searchQuery.value.length > 0;
});




// Sort Options
const sortOptions = [
    { label: 'Pertinence', value: 'relevance' },
    { label: 'Populaires', value: 'popular' },
    { label: 'Nouveautés', value: 'newest' },
    { label: 'Vues', value: 'views' },
    { label: 'Téléchargements', value: 'downloads' },
];

// Methods
const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { notation: "compact", compactDisplay: "short" }).format(num);
};

const goToGame = (slug: string) => {
    router.push(`/catalogue/${slug}`);
};

const setSort = (value: string) => {
    filters.value.sort = value;
    pagination.value.page = 1;
    fetchGames();
};

const toggleOnline = () => {
    if (filters.value.is_online === null) {
        filters.value.is_online = true;
    } else if (filters.value.is_online === true) {
        filters.value.is_online = false;
    } else {
        filters.value.is_online = null;
    }
    pagination.value.page = 1;
    fetchGames();
};



const resetAll = () => {
    searchQuery.value = '';
    filters.value = { sort: 'relevance', is_online: true, year: '' };
    pagination.value.page = 1;
    fetchGames();
};

const changePage = (p: number) => {
    pagination.value.page = p;
    scrollToTop();
    fetchGames();
};

const scrollToTop = () => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
};

// Search Debounce 
let searchTimeout: any = null;
const handleSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        pagination.value.page = 1;
        
        // Push to URL to keep ProHeader and URL in sync
        const query: any = { ...route.query };
        if (searchQuery.value.trim()) {
            query.q = searchQuery.value.trim();
        } else {
            delete query.q;
        }
        router.replace({ path: route.path, query }).catch(() => {});
        
        fetchGames();
    }, 500);
};

// Video Playback Handlers (Safe)
const playVideo = (e: Event) => {
    const video = e.target as HTMLVideoElement;
    if (video) {
        const p = video.play();
        if (p !== undefined) {
             p.catch(() => {});
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


import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();

// ... existing code ...

// Fetch Logic - Uses new search API
const fetchGames = async () => {
    loading.value = true;
    games.value = [];
    
    try {
        const isSearch = !!searchQuery.value.trim();
        const baseUrl = isSearch ? '/api/engine/search/' : '/api/engine/games/';
        const params = new URLSearchParams();
        
        params.set('page', pagination.value.page.toString());
        params.set('per_page', '39');
        
        // Custom search routing uses `q`
        if (isSearch) {
            params.set('q', searchQuery.value.trim());
        }

        // Apply filters if engine API supports them
        if (filters.value.is_online !== null) params.set('is_online', filters.value.is_online.toString());
        if (filters.value.year) params.set('year', filters.value.year);
        
        // Correct sorting parameter mapping for the new engine API
        const sortMapping: Record<string, string> = {
            'relevance': 'views,downloads_count', // Mixed fields for Django OrderingFilter
            'popular': 'likes',
            'newest': 'new',
            'views': 'views',
            'downloads': 'downloads_count'
        };
        const mappedSort = sortMapping[filters.value.sort] || filters.value.sort;
        if (mappedSort) {
            params.set('sort', mappedSort);
        }
        
        // Ensure ONLY enriched games are requested
        params.set('enriched_only', 'true');

        const url = `${baseUrl}?${params.toString()}`;
        const res: any = await useFetch(url);
        
        if (res && res.results) {
            // Further client-side safegard to strictly remove any game without steam_app_id / metadata
            const rawGames = res.results.filter((g: any) => g.steam_app_id || g.metadata);
            
            games.value = rawGames.map((g: any) => {
                // Prioritize metadata header image since we want landscape, fallback to generating it from steam_app_id
                let header = g.metadata?.header_image;
                if (!header && g.steam_app_id) {
                    header = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.steam_app_id}/header.jpg`;
                }
                header = header || g.header || g.cover || '/assets/placeholder.webp';

                // Evaluate properties based on Game Hub API
                const isOnline = g.metadata?.tags?.includes('Multi-player') || g.metadata?.tags?.includes('Co-op') || false;
                const releaseYear = g.metadata?.release_date ? new Date(g.metadata.release_date).getFullYear() : 'N/A';
                
                // File size (either direct from list 'total_size' or from detail 'versions[0].file_size')
                const latestVersionSize = g.total_size || (g.versions && g.versions.length > 0 ? g.versions[0].file_size : 'N/A');

                return {
                    id: g.id,
                    slug: g.slug || g.id, // Fallback to id if slug is somehow missing
                    display_name: g.display_name || g.title,
                    header: header,
                    views: g.views || 0,
                    likes: g.likes || 0,
                    downloads: g.downloads_count || 0,
                    isOnline: isOnline,
                    releaseYear: releaseYear,
                    isNew: isNewGame(g.last_updated || (g.versions && g.versions.length > 0 ? g.versions[0].upload_date : null)),
                    video: g.metadata?.trailers?.[0] || g.video || null,
                    categories: g.metadata?.genres || g.categories || [],
                    is_liked: g.is_liked || false,
                    is_favorited: g.is_favorited || false,
                    total_size: latestVersionSize
                };
            });

            // Handle new Game Hub pagination format
            if (res.meta) {
                 pagination.value = {
                     page: res.meta.page || 1,
                     totalPages: Math.ceil((res.meta.total || 0) / (res.meta.per_page || 39)) || 1,
                     totalResults: res.meta.total || 0
                 };
            }
        }
    } catch (error: any) {
        console.error("Error fetching games:", error);
        notify({ type: 'error', title: 'Erreur', text: "Impossible de charger le catalogue." });
    } finally {
        loading.value = false;
    }
};

const isNewGame = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays < 30; 
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

.animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
}
.animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
