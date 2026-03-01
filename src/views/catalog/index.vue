<template>
  <div class="h-full bg-[#050505] text-white overflow-y-auto custom-scrollbar scroll-smooth">
    
    <div class="max-w-[1920px] mx-auto p-4 md:p-8 xl:p-12 flex flex-col xl:flex-row gap-8 xl:gap-12 items-start relative">
        
        <!-- MOBILE HEADER Actions (Visible < XL) -->
        <div class="w-full xl:hidden flex items-center justify-between mb-6 animate-fade-in">
             <div>
                <h1 class="text-3xl font-black text-white tracking-tighter uppercase">Catalogue</h1>
                <p class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{{ pagination.totalResults }} Jeux</p>
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
                    class="text-[10px] font-bold text-red-500 uppercase hover:text-red-400 flex items-center gap-1"
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
            class="fixed inset-y-0 left-0 w-80 bg-zinc-950 border-r border-white/5 p-8 z-[9999] transform transition-transform duration-300 ease-out xl:relative xl:transform-none xl:w-64 xl:p-0 xl:bg-transparent xl:border-none xl:z-0 xl:sticky xl:top-8 xl:h-auto custom-scrollbar overflow-y-auto"
            :class="showMobileFilters ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'"
        >
            
            <!-- Mobile Close Header -->
            <div class="flex xl:hidden items-center justify-between mb-8">
                <h2 class="text-xl font-black text-white uppercase tracking-tighter">Filtres</h2>
                <button 
                    type="button"
                    @click.stop="showMobileFilters = false" 
                    class="p-4 hover:bg-zinc-900 rounded-full transition-colors cursor-pointer relative z-[10000] pointer-events-auto"
                >
                    <XMarkIcon class="w-6 h-6 text-zinc-400" />
                </button>
            </div>

            <!-- Header (Desktop Only) -->
            <div class="hidden xl:block mb-8">
                <h1 class="text-4xl font-black text-white tracking-tighter uppercase mb-2">Catalogue</h1>
                <div class="flex items-center gap-2">
                     <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                     <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest">{{ pagination.totalResults }} Jeux</p>
                </div>
            </div>

            <!-- Search -->
            <div class="relative group">
                <input 
                    v-model="searchQuery"
                    @input="handleSearch"
                    type="text" 
                    placeholder="Rechercher..." 
                    class="block w-full bg-zinc-900/30 border-b-2 border-zinc-800 text-white placeholder-zinc-600 py-4 px-0 text-xl font-black uppercase tracking-tight focus:border-indigo-500 focus:outline-none transition-all" 
                />
                <MagnifyingGlassIcon class="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
            </div>

            <!-- Filters Section -->
            <div class="space-y-10 mt-12">
                
                <!-- Sort -->
                <div class="space-y-3">
                    <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] border-l-2 border-zinc-800 pl-3">Trier par</h3>
                    <div class="flex flex-col gap-1">
                        <button 
                            v-for="opt in sortOptions"
                            :key="opt.value"
                            @click="setSort(opt.value)" 
                            class="text-left text-sm font-bold uppercase transition-colors py-1"
                            :class="filters.sort === opt.value ? 'text-white pl-2 border-l-2 border-indigo-500' : 'text-zinc-600 hover:text-zinc-400 pl-2 border-l-2 border-transparent'"
                        >
                            {{ opt.label }}
                        </button>
                    </div>
                </div>

                <!-- Online Mode Toggle -->
                <!-- Categories -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between border-l-2 border-zinc-800 pl-3">
                         <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Genre</h3>
                         <button v-if="filters.category !== ''" @click="filters.category = ''; fetchGames()" class="text-[10px] font-bold text-red-500 uppercase hover:text-red-400">Reset</button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-x-2 gap-y-1.5">
                        <button 
                            v-for="cat in categories" 
                            :key="cat.slug"
                            @click="setCategory(cat.slug)"
                            class="text-left px-2.5 py-1.5 rounded bg-zinc-900/50 hover:bg-zinc-900 text-[10px] font-bold uppercase transition-colors flex items-center justify-between group"
                            :class="filters.category === cat.slug ? 'text-indigo-400 ring-1 ring-indigo-500/50' : 'text-zinc-500 hover:text-zinc-300'"
                        >
                            {{ cat.name }}
                            <span v-if="filters.category === cat.slug" class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </button>
                    </div>
                </div>

                <!-- Tags -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between border-l-2 border-zinc-800 pl-3">
                         <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Tags</h3>
                         <button v-if="filters.tags.length > 0" @click="resetTags" class="text-[10px] font-bold text-red-500 uppercase hover:text-red-400">Reset</button>
                    </div>
                    
                    <div class="flex flex-wrap gap-1.5">
                        <button 
                            v-for="tag in availableTags" 
                            :key="tag"
                            @click="toggleTag(tag)"
                            class="px-2 py-1 rounded text-[9px] font-bold uppercase transition-all border"
                            :class="filters.tags.includes(tag) ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600 hover:text-zinc-400'"
                        >
                            {{ tag }}
                        </button>
                    </div>
                </div>

            </div>
            
            <button 
                @click="resetAll"
                class="w-full mt-12 py-4 bg-zinc-900 text-zinc-500 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all rounded-xl"
            >
                Réinitialiser
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
                <MagnifyingGlassIcon class="w-16 h-16 text-zinc-800 mb-6" />
                <h3 class="text-2xl font-black text-white uppercase tracking-tighter mb-2">Rien trouvé</h3>
                <p class="text-zinc-500">Essayez d'autres termes ou filtres.</p>
            </div>

            <!-- Grid (Portrait Cards 264x354) -->
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 xl:gap-6 animate-fade-in-up">
                
                <div 
                    v-for="(game, index) in games" 
                    :key="game.id" 
                    class="group relative bg-[#0a0a0a] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
                    @click="goToGame(game.id)"
                    :style="{ animationDelay: `${index * 50}ms` }"
                >
                    <!-- Image Area (Portrait Aspect Ratio for new API images) -->
                    <div class="relative w-full aspect-[3/4] overflow-hidden bg-zinc-900">
                        <img 
                            :src="game.header" 
                            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102 opacity-80 group-hover:opacity-100"
                            loading="lazy"
                        />
                        <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        
                         <!-- Video Preview -->
                         <video
                            v-if="game.video"
                            :src="game.video"
                            class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            muted loop playsinline
                            @mouseenter="playVideo"
                            @mouseleave="pauseVideo"
                        ></video>
                        
                        <!-- Badges Top Left -->
                        <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
                             <span v-if="game.isOnline" class="px-2 py-0.5 bg-green-500 text-white text-[9px] font-black uppercase tracking-wider rounded shadow-lg">Online</span>
                             <span v-if="game.isNew" class="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider rounded shadow-lg">New</span>
                        </div>
                    </div>

                    <!-- Info Area -->
                    <div class="p-3 xl:p-4 flex flex-col gap-2 overflow-hidden">
                        <div class="flex justify-between items-start min-w-0">
                             <div class="min-w-0 w-full overflow-hidden">
                                 <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1 truncate">{{ game.categories?.[0]?.name || game.categories?.[0] || 'Jeu' }}</span>
                                 <h3 class="text-sm xl:text-base font-black text-white uppercase leading-tight group-hover:text-indigo-400 transition-colors truncate">{{ game.title }}</h3>
                             </div>
                        </div>
                        
                        <div class="flex items-center justify-between pt-2 xl:pt-3 border-t border-zinc-800/50">
                            <span class="text-[10px] font-bold text-zinc-600 uppercase">{{ game.latest_version?.size || 'N/A' }}</span>
                            <div class="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase group-hover:text-zinc-300 transition-colors">
                                <EyeIcon class="w-3 h-3" />
                                {{ formatNumber(game.views) }}
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <!-- Pagination -->
            <div v-if="pagination.totalPages > 1" class="flex justify-center mt-16 mb-8">
                <div class="flex items-center gap-1 bg-zinc-900/50 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                     <button 
                        @click="changePage(pagination.page - 1)" 
                        :disabled="pagination.page <= 1"
                        class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-all"
                    >
                        <ChevronLeftIcon class="w-4 h-4" />
                    </button>
                    
                    <div class="px-4 text-xs font-black text-zinc-500 uppercase">
                        {{ pagination.page }} <span class="text-zinc-700 mx-1">/</span> {{ pagination.totalPages }}
                    </div>

                     <button 
                        @click="changePage(pagination.page + 1)" 
                        :disabled="pagination.page >= pagination.totalPages"
                        class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition-all"
                    >
                        <ChevronRightIcon class="w-4 h-4" />
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
    XMarkIcon
} from '@heroicons/vue/24/solid';

const router = useRouter();
const route = useRoute();

// State
const games = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const showMobileFilters = ref(false);
const pagination = ref({ page: 1, totalPages: 1, totalResults: 0 });

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
    fetchGames();
});

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
           filters.value.category !== '' ||
           filters.value.tags.length > 0 ||
           filters.value.year !== '' ||
           searchQuery.value.length > 0;
});


// Categories Data (from API)
const categories = [
    { name: 'Action', slug: 'action' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'RPG', slug: 'role-playing-rpg' },
    { name: 'Shooter', slug: 'shooter' },
    { name: 'Strategy', slug: 'strategy' },
    { name: 'Simulator', slug: 'simulator' },
    { name: 'Indie', slug: 'indie' },
    { name: 'Racing', slug: 'racing' },
    { name: 'Sport', slug: 'sport' },
    { name: 'Puzzle', slug: 'puzzle' },
    { name: 'Platform', slug: 'platform' },
    { name: 'Arcade', slug: 'arcade' },
    { name: 'Fighting', slug: 'fighting' },
    { name: 'Tactical', slug: 'tactical' },
    { name: 'Horror', slug: 'horror' },
    { name: 'Visual Novel', slug: 'visual-novel' },
];

// Popular Tags Data
const availableTags = [
    'Multiplayer', 'Solo', 'Coop', 'Open world', 'Sandbox',
    'Survival', 'Horror', 'PvP', 'Stealth', 'Simulation',
    'Science fiction', 'Fantasy', 'Romance', 'Comedy',
    'Split screen', 'Steam Cloud', 'HDR disponible'
];

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

const goToGame = (id: string) => {
    router.push(`/catalogue/${id}`);
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

const setCategory = (slug: string) => {
    filters.value.category = filters.value.category === slug ? '' : slug;
    pagination.value.page = 1;
    fetchGames();
};

const toggleTag = (tag: string) => {
    const idx = filters.value.tags.indexOf(tag);
    if (idx >= 0) {
        filters.value.tags.splice(idx, 1);
    } else {
        filters.value.tags.push(tag);
    }
    pagination.value.page = 1;
    fetchGames();
};

const resetTags = () => {
    filters.value.tags = [];
    pagination.value.page = 1;
    fetchGames();
};

const resetAll = () => {
    searchQuery.value = '';
    filters.value = { sort: 'relevance', is_online: true, category: '', tags: [], year: '' };
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
        // Build URL with new search API
        const params = new URLSearchParams();
        params.set('page', pagination.value.page.toString());
        
        // Fuzzy search query
        if (searchQuery.value.trim()) {
            params.set('q', searchQuery.value.trim());
        }

        // Category filter
        if (filters.value.category) {
            params.set('category', filters.value.category);
        }

        // Tags filter (comma-separated)
        if (filters.value.tags.length > 0) {
            params.set('tags', filters.value.tags.join(','));
        }

        // Online filter
        if (filters.value.is_online !== null) {
            params.set('is_online', filters.value.is_online.toString());
        }

        // Year filter
        if (filters.value.year) {
            params.set('year', filters.value.year);
        }

        // Sort order
        if (filters.value.sort !== 'relevance') {
            params.set('sort', filters.value.sort);
        }

        const url = `/api/app/games/search/?${params.toString()}`;

        
        const res: any = await useFetch(url);
        
        if (res && (res.results || res.games)) {
            const rawGames = res.results || res.games;
            games.value = rawGames.map((g: any) => {
                // Get header image (prioritize new API format)
                let header = g.header || g.cover;
                if (!header) header = '/assets/placeholder.webp';

                return {
                    id: g.id,
                    title: g.title,
                    header: header,
                    views: g.views || 0,
                    likes: g.likes || 0,
                    isOnline: g.is_online || g.versions?.[0]?.is_online || false,
                    releaseYear: g.release_date ? new Date(g.release_date).getFullYear() : 'N/A',
                    isNew: isNewGame(g.published_at || g.created_at),
                    video: g.video || null,
                    categories: g.categories || [],
                    is_liked: g.is_liked || false,
                    is_favorited: g.is_favorited || false,
                    latest_version: g.latest_version
                };
            });

            // Handle DRF pagination format
            if (res.count !== undefined) {
                const totalPages = Math.ceil(res.count / 24);
                pagination.value = {
                    page: pagination.value.page,
                    totalPages: totalPages,
                    totalResults: res.count
                };
            } else if (res.pagination) {
                pagination.value = {
                    page: res.pagination.current_page || 1,
                    totalPages: res.pagination.total_pages || 1,
                    totalResults: res.pagination.total_results || 0
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
