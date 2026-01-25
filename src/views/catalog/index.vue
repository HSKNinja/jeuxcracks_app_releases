<template>
  <div class="h-full bg-[#050505] text-white overflow-y-auto custom-scrollbar scroll-smooth">
    
    <div class="max-w-[1920px] mx-auto p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 items-start">
        
        <!-- SIDEBAR FILTERS -->
        <aside class="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-12 space-y-12 animate-fade-in" :class="{ 'hidden lg:block': !showMobileFilters }">
            
            <!-- Header -->
            <div>
                <h1 class="text-4xl font-black text-white tracking-tighter uppercase mb-2">Catalogue</h1>
                <div class="flex items-center gap-2">
                     <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                     <p class="text-zinc-500 text-xs font-bold uppercase tracking-widest">{{ pagination.totalResults }} Jeux</p>
                </div>
                
                <!-- Mobile Toggle -->
                <button 
                    @click="showMobileFilters = !showMobileFilters"
                    class="lg:hidden mt-6 w-full flex items-center justify-center gap-2 px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs font-black uppercase text-white hover:bg-zinc-800 transition-colors"
                >
                    <FunnelIcon class="w-4 h-4" />
                    {{ showMobileFilters ? 'Fermer' : 'Filtres' }}
                </button>
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
            <div class="space-y-10">
                
                <!-- Sort -->
                <div class="space-y-4">
                    <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] border-l-2 border-zinc-800 pl-3">Trier par</h3>
                    <div class="flex flex-col gap-2">
                        <button 
                            @click="setFilter('views', 'all')" 
                            class="text-left text-sm font-bold uppercase transition-colors"
                            :class="filters.views === 'all' ? 'text-white pl-2 border-l-2 border-indigo-500' : 'text-zinc-600 hover:text-zinc-400 pl-2 border-l-2 border-transparent'"
                        >
                            Pertinence
                        </button>
                        <button 
                            @click="setFilter('views', 'true')" 
                            class="text-left text-sm font-bold uppercase transition-colors"
                            :class="filters.views === 'true' ? 'text-white pl-2 border-l-2 border-indigo-500' : 'text-zinc-600 hover:text-zinc-400 pl-2 border-l-2 border-transparent'"
                        >
                            Populaires
                        </button>
                         <button 
                            @click="setFilter('views', 'false')" 
                            class="text-left text-sm font-bold uppercase transition-colors"
                            :class="filters.views === 'false' ? 'text-white pl-2 border-l-2 border-indigo-500' : 'text-zinc-600 hover:text-zinc-400 pl-2 border-l-2 border-transparent'"
                        >
                            Nouveautés
                        </button>
                    </div>
                </div>

                <!-- Mode -->
                <div class="space-y-4">
                    <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] border-l-2 border-zinc-800 pl-3">Mode</h3>
                    <div class="flex flex-wrap gap-2">
                         <button 
                            @click="setFilter('multiplayer', 'all')" 
                            class="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all border"
                            :class="filters.multiplayer === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600'"
                        >Tout</button>
                        <button 
                            @click="setFilter('multiplayer', 'true')" 
                            class="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all border"
                            :class="filters.multiplayer === 'true' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600'"
                        >Multi</button>
                         <button 
                            @click="setFilter('multiplayer', 'false')" 
                            class="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all border"
                            :class="filters.multiplayer === 'false' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600'"
                        >Solo</button>
                    </div>
                </div>

                <!-- Categories -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between border-l-2 border-zinc-800 pl-3">
                         <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Genre</h3>
                         <button v-if="filters.categories.length > 0" @click="resetCategories" class="text-[10px] font-bold text-red-500 uppercase hover:text-red-400">Reset</button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-x-2 gap-y-2">
                        <button 
                            v-for="cat in categories" 
                            :key="cat.value"
                            @click="toggleCategory(cat.value)"
                            class="text-left px-3 py-2 rounded bg-zinc-900/50 hover:bg-zinc-900 text-[10px] font-bold uppercase transition-colors flex items-center justify-between group"
                            :class="filters.categories.includes(cat.value) ? 'text-indigo-400 ring-1 ring-indigo-500/50' : 'text-zinc-500 hover:text-zinc-300'"
                        >
                            {{ cat.name }}
                            <span v-if="filters.categories.includes(cat.value)" class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </button>
                    </div>
                </div>

            </div>
            
            <button 
                @click="resetAll"
                class="w-full py-4 bg-zinc-900 text-zinc-500 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all rounded-xl"
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

            <!-- Grid (Landscape Cards) -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 animate-fade-in-up">
                
                <div 
                    v-for="(game, index) in games" 
                    :key="game.id" 
                    class="group relative bg-[#0a0a0a] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
                    @click="goToGame(game.id)"
                    :style="{ animationDelay: `${index * 50}ms` }"
                >
                    <!-- Image Area (Wider Aspect Ratio to fit Steam headers) -->
                    <div class="relative w-full aspect-[2/1] overflow-hidden bg-zinc-900">
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
                    <div class="p-5 flex flex-col gap-3">
                        <div class="flex justify-between items-start">
                             <div>
                                 <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">{{ game.categories?.[0] || 'Jeu' }}</span>
                                 <h3 class="text-lg font-black text-white uppercase leading-none group-hover:text-indigo-400 transition-colors line-clamp-1">{{ game.title }}</h3>
                             </div>
                        </div>
                        
                        <div class="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                            <span class="text-[10px] font-bold text-zinc-600 uppercase">{{ game.releaseYear }}</span>
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
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFetch } from '../../utils/useFetch';
import { 
    MagnifyingGlassIcon, 
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FunnelIcon 
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
    views: 'all', // 'all', 'true' (popular), 'false' (new)
    multiplayer: 'all', // 'all', 'true', 'false'
    categories: [] as string[]
});


// Categories Data
const categories = [
  { name: 'Action', value: 'Action' },
  { name: 'Aventure', value: 'Adventure' },
  { name: 'RPG', value: 'RPG' },
  { name: 'Stratégie', value: 'Strategy' },
  { name: 'Simulation', value: 'Simulation' },
  { name: 'Horreur', value: 'Horreur' },
  { name: 'FPS', value: 'FPS' },
  { name: 'Course', value: 'Racing' },
  { name: 'Sport', value: 'Sport' },
  { name: 'Indie', value: 'Indie' },
];

// Methods
const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { notation: "compact", compactDisplay: "short" }).format(num);
};

const goToGame = (id: string) => {
    router.push(`/catalogue/${id}`);
};

const setFilter = (key: 'views' | 'multiplayer', value: string) => {
    filters.value[key] = value;
    pagination.value.page = 1;
    fetchGames();
};

const toggleCategory = (cat: string) => {
    if (filters.value.categories.includes(cat)) {
        filters.value.categories = filters.value.categories.filter(c => c !== cat);
    } else {
        filters.value.categories.push(cat);
    }
    pagination.value.page = 1;
    fetchGames();
};

const resetCategories = () => {
    filters.value.categories = [];
    pagination.value.page = 1;
    fetchGames();
};

const resetAll = () => {
    searchQuery.value = '';
    filters.value = { views: 'all', multiplayer: 'all', categories: [] };
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
    console.log('🔍 Sidebar Search Input:', searchQuery.value);
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


// Fetch Logic
const fetchGames = async () => {
    loading.value = true;
    games.value = [];
    
    try {
        let url = `/Cracks/api/liste_jeux/?app=true&format=json&page=${pagination.value.page}&limit=24`; // Reduced limit for better perf
        
        // Search
        if (searchQuery.value.trim()) {
            url += `&title=${encodeURIComponent(searchQuery.value)}`;
        }

        // Filters
        if (filters.value.views !== 'all') url += `&views=${filters.value.views}`;
        if (filters.value.multiplayer !== 'all') url += `&online=${filters.value.multiplayer}`;
        filters.value.categories.forEach(cat => url += `&category=${cat}`);

        console.log('🌐 Fetching Games via URL:', url);
        const res: any = await useFetch(url);
        
        if (res && res.games) {
            games.value = res.games.map((g: any) => {
                // Prioritize Landscape Header
                let header = g.header;
                if(g.urls?.header_image) header = g.urls.header_image;
                if(!header && g.urls?.image) header = g.urls.image; 
                if(!header && g.informations?.image) header = "https://api.jeuxcracks.fr" + g.informations.image;
                if (!header) header = '/assets/placeholder.webp';

                return {
                    id: g.id,
                    title: g.informations?.title || g.title,
                    header: header,
                    views: g.views || 0,
                    isOnline: g.status?.is_online || false,
                    releaseYear: g.status?.release_date ? new Date(g.status.release_date).getFullYear() : 'N/A',
                    isNew: isNewGame(g.status?.created_at || g.created_at),
                    video: g.video || g.urls?.trailer || null,
                    categories: g.categories || []
                };
            });

            if (res.pagination) {
                pagination.value = {
                    page: res.pagination.current_page || 1,
                    totalPages: res.pagination.total_pages || 1,
                    totalResults: res.pagination.total_results || 0
                };
            }
        }
    } catch (error) {
        console.error("Error fetching games:", error);
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
