<template>
  <div class="min-h-full w-full bg-[#050505] relative selection:bg-indigo-500/30 overflow-x-hidden">
    
    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <div class="flex flex-col items-center gap-6">
            <div class="relative w-20 h-20">
                <div class="absolute inset-0 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
                <div class="absolute inset-3 border-t-2 border-l-2 border-purple-500 rounded-full animate-spin animation-delay-200"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- 1. HERO SLIDER                             -->
    <!-- ═══════════════════════════════════════════ -->
    <section class="relative w-full h-[55vh] min-h-[420px] overflow-hidden">
        <transition-group name="hero-fade" tag="div" class="h-full w-full relative">
            <div 
                v-if="trendingGames[activeIndex]"
                :key="trendingGames[activeIndex].id"
                class="absolute inset-0 w-full h-full"
            >
                <!-- BG Image -->
                <div class="absolute inset-0 bg-black">
                    <img 
                        :src="trendingGames[activeIndex].header" 
                        class="w-full h-full object-cover animate-pan-zoom opacity-50" 
                    />
                    <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"></div>
                </div>

                <!-- Content -->
                <div class="absolute inset-0 z-20 px-8 md:px-12 flex items-end pb-28 max-w-[1920px] mx-auto">
                    <div class="w-full max-w-3xl space-y-5">
                        <!-- Badge -->
                        <div class="flex items-center gap-3 animate-slide-up" style="animation-delay: 50ms">
                             <div class="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                <FireIcon class="w-3 h-3 text-indigo-400" />
                                <span class="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">Tendance</span>
                             </div>
                             <span class="text-white/30 text-[9px] font-bold uppercase tracking-widest">{{ trendingGames[activeIndex].categories?.[0]?.name || trendingGames[activeIndex].categories?.[0] || '' }}</span>
                        </div>

                        <!-- Title -->
                        <h1 class="text-4xl md:text-6xl xl:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase animate-reveal-text line-clamp-2">
                            {{ trendingGames[activeIndex].title }}
                        </h1>
                        
                        <!-- Desc -->
                        <p class="max-w-lg text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2 animate-slide-up" style="animation-delay: 200ms">
                            {{ trendingGames[activeIndex].descriptionShort }}
                        </p>

                        <!-- Actions -->
                        <div class="flex items-center gap-3 animate-slide-up" style="animation-delay: 300ms">
                            <button 
                                @click="goToPage(`/catalogue/${trendingGames[activeIndex].slug || trendingGames[activeIndex].id}`)"
                                class="group px-7 py-3.5 bg-white text-black font-black uppercase tracking-widest text-[11px] flex items-center gap-2.5 rounded-xl hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-xl"
                            >
                                <PlayIcon class="w-4 h-4" />
                                <span>Découvrir</span>
                            </button>
                            
                            <button 
                                @click="nextSlide"
                                class="p-3.5 border border-white/10 hover:bg-white/10 text-white transition-all rounded-xl group backdrop-blur-sm"
                            >
                                <ArrowLongRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>

        <!-- Slide Progress Dots (Vertical, Right) -->
        <div class="absolute bottom-8 right-8 md:right-12 z-30 flex flex-col gap-2">
             <button 
                v-for="(g, idx) in trendingGames" 
                :key="g.id"
                @click="goToSlide(idx)"
                class="group flex items-center gap-3 justify-end cursor-pointer"
            >   
                <span :class="activeIndex === idx ? 'text-white/60' : 'text-transparent'" class="text-[9px] font-bold tracking-widest transition-all group-hover:text-white/40 uppercase truncate max-w-[120px]">
                    {{ g.title }}
                </span>
                <div 
                    class="h-[3px] transition-all duration-500 rounded-full"
                    :class="activeIndex === idx ? 'bg-indigo-500 w-10' : 'bg-white/15 w-5 group-hover:bg-white/30'"
                ></div>
             </button>
        </div>

        <!-- Slide Counter -->
        <div class="absolute bottom-8 left-8 md:left-12 z-30 flex items-baseline gap-1 select-none">
            <span class="text-2xl font-black text-white tabular-nums">0{{ activeIndex + 1 }}</span>
            <span class="text-sm text-zinc-700 font-bold">/</span>
            <span class="text-sm text-zinc-600 font-bold tabular-nums">0{{ trendingGames.length }}</span>
        </div>
    </section>

    <!-- ═══════════════════════════════════════════ -->
    <!-- 2. MAIN CONTENT                             -->
    <!-- ═══════════════════════════════════════════ -->
    <div class="relative z-30 max-w-[1920px] mx-auto px-8 md:px-12 pb-16 space-y-16">
        
        <!-- ── Stats Strip ── -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-14">
            <!-- Games Count -->
            <div class="p-5 rounded-2xl bg-[#0c0c0c]/90 backdrop-blur-xl border border-white/[0.04] flex items-center gap-4 hover:border-white/10 transition-all group">
                <div class="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                    <RectangleStackIcon class="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <span class="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 block">Catalogue</span>
                    <span class="text-lg font-black text-white tracking-tight">{{ formatNumber(totalGames) }}</span>
                </div>
            </div>

            <!-- New Games -->
            <div class="p-5 rounded-2xl bg-[#0c0c0c]/90 backdrop-blur-xl border border-white/[0.04] flex items-center gap-4 hover:border-white/10 transition-all group">
                <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <BoltIcon class="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <span class="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 block">Nouveautés</span>
                    <span class="text-lg font-black text-white tracking-tight">{{ newGames.length }} Ajouts</span>
                </div>
            </div>

            <!-- Version -->
            <div class="p-5 rounded-2xl bg-[#0c0c0c]/90 backdrop-blur-xl border border-white/[0.04] flex items-center gap-4 hover:border-white/10 transition-all group">
                <div class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                    <CpuChipIcon class="w-4 h-4 text-purple-400" />
                </div>
                <div>
                    <span class="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 block">Version</span>
                    <span class="text-lg font-black text-white tracking-tight">v1.1.3</span>
                </div>
            </div>

            <!-- Revenue Goal -->
            <div class="p-5 rounded-2xl bg-[#0c0c0c]/90 backdrop-blur-xl border border-white/[0.04] hover:border-emerald-500/20 transition-all group cursor-pointer" @click="goToPage('/premium')">
                <div class="flex items-center gap-4 mb-3">
                    <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <HeartIcon class="w-4 h-4 text-emerald-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600 block">Objectif</span>
                        <div class="flex items-baseline gap-1">
                            <span class="text-lg font-black text-white tracking-tight">{{ Math.round(revenue.total || 0) }}€</span>
                            <span class="text-[10px] text-zinc-600 font-bold">/ {{ monthlyGoal }}€</span>
                        </div>
                    </div>
                </div>
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :style="{ width: revenueProgress + '%' }"></div>
                </div>
            </div>
        </div>

        <!-- ── News Section (Bento Grid) ── -->
        <section class="space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-indigo-500 rounded-full"></div>
                    <h2 class="text-2xl font-black text-white uppercase tracking-tight">Actualités</h2>
                </div>
                <router-link to="/news" class="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors flex items-center gap-1.5">
                    Tout voir
                    <ArrowLongRightIcon class="w-4 h-4" />
                </router-link>
            </div>

            <!-- Bento Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Featured Article (Main) -->
                <div 
                    v-if="newsArticles[0]"
                    @click="newsArticles[0].link.startsWith('/') ? goToPage(newsArticles[0].link) : null"
                    class="lg:col-span-2 group relative rounded-2xl overflow-hidden cursor-pointer min-h-[280px] bg-zinc-900"
                >
                    <img :src="newsArticles[0].image" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-30 group-hover:opacity-50" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                    <div class="absolute inset-0 p-8 flex flex-col justify-end z-10">
                        <span class="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">{{ newsArticles[0].category }}</span>
                        <h3 class="text-2xl md:text-3xl font-black text-white uppercase leading-tight mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">{{ newsArticles[0].title }}</h3>
                        <p class="text-sm text-zinc-400 line-clamp-2 max-w-xl">{{ newsArticles[0].description }}</p>
                        <div class="flex items-center gap-2 mt-4 text-[10px] font-bold text-zinc-600">
                            <span>{{ newsArticles[0].date }}</span>
                            <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
                            <span class="text-indigo-500 group-hover:text-indigo-400 transition-colors">Lire l'article →</span>
                        </div>
                    </div>
                </div>

                <!-- Stacked Secondary Articles -->
                <div class="flex flex-col gap-4">
                    <div 
                        v-for="article in newsArticles.slice(1, 3)" 
                        :key="article.id"
                        @click="article.link.startsWith('/') ? goToPage(article.link) : null"
                        class="group relative flex-1 rounded-2xl overflow-hidden cursor-pointer min-h-[130px] bg-zinc-900"
                    >
                        <img :src="article.image" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-25 group-hover:opacity-40" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div class="absolute inset-0 p-6 flex flex-col justify-end z-10">
                            <span 
                                class="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5"
                                :class="[
                                    article.accent_color === 'amber' ? 'text-amber-500' : '',
                                    article.accent_color === 'emerald' ? 'text-emerald-500' : '',
                                    article.accent_color === 'indigo' ? 'text-indigo-400' : '',
                                    !['indigo', 'amber', 'emerald'].includes(article.accent_color) ? 'text-zinc-400' : ''
                                ]"
                            >{{ article.category }}</span>
                            <h3 class="text-base font-black text-white uppercase leading-tight line-clamp-1 group-hover:translate-x-1 transition-transform">{{ article.title }}</h3>
                            <p class="text-[11px] text-zinc-500 line-clamp-1 mt-1">{{ article.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Dernières Sorties (Horizontal Scroll) ── -->
        <section class="space-y-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    <h2 class="text-2xl font-black text-white uppercase tracking-tight">Dernières Sorties</h2>
                </div>
                <router-link to="/catalogue?sort=newest" class="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors flex items-center gap-1.5">
                    Tout le catalogue
                    <ArrowLongRightIcon class="w-4 h-4" />
                </router-link>
            </div>

            <!-- Scroll Container -->
            <div class="relative group/scroll">
                <!-- Fade Edges -->
                <div class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity"></div>
                <div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>
                
                <div ref="scrollContainer" class="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory custom-scrollbar-h">
                    <div 
                        v-for="game in newGames" :key="game.id"
                        @click="goToPage(`/catalogue/${game.slug || game.id}`)"
                        class="group flex-shrink-0 w-[260px] snap-start cursor-pointer"
                    >
                        <!-- Card -->
                        <div class="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.04] group-hover:border-white/15 transition-all duration-300 mb-3 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/50">
                            <img :src="game.header" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <!-- Play Icon Overlay -->
                            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div class="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
                                    <PlayIcon class="w-4 h-4 text-white ml-0.5" />
                                </div>
                            </div>

                            <!-- Views Badge -->
                            <div class="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <EyeIcon class="w-3 h-3 text-zinc-400" />
                                <span class="text-[9px] font-bold text-white">{{ formatNumber(game.views) }}</span>
                            </div>
                        </div>

                        <!-- Info -->
                        <div class="px-1">
                            <h3 class="text-sm font-bold text-zinc-300 truncate group-hover:text-white transition-colors">{{ game.title }}</h3>
                            <span class="text-[10px] text-zinc-600 font-medium">{{ game.categories?.[0] || '' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ── Premium CTA (Slim Banner) ── -->
        <section class="relative group overflow-hidden rounded-2xl border border-white/[0.04] hover:border-indigo-500/20 transition-all">
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-indigo-600/10 group-hover:from-indigo-600/15 group-hover:to-indigo-600/15 transition-all"></div>
            <div class="absolute top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[200px] bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
            
            <div class="relative z-10 px-8 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <SparklesIcon class="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-white uppercase tracking-tight">JeuxCracks Premium</h3>
                        <p class="text-sm text-zinc-500">Vitesses illimitées, badge donateur et accès anticipé. <span class="text-white font-bold">À partir de 2.99€<span class="ml-1 text-zinc-600 font-normal">/mois</span></span></p>
                    </div>
                </div>
                <router-link to="/premium" class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 whitespace-nowrap flex-shrink-0">
                    Découvrir Premium
                </router-link>
            </div>
        </section>

        <!-- ── Footer ── -->
        <footer class="flex flex-col items-center gap-6 text-center pt-4">
            <div class="h-px w-16 bg-zinc-800/50"></div>
            <div class="flex items-center gap-6">
                <router-link to="/premium" class="text-[10px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Faire un don</router-link>
                <span class="w-1 h-1 rounded-full bg-zinc-800"></span>
                <a href="https://discord.jeuxcracks.fr" target="_blank" class="text-[10px] font-bold text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Discord</a>
            </div>
            <div class="flex items-center gap-2 pb-4">
                <img src="/assets/logo.webp" class="w-5 opacity-15 filter grayscale" />
                <span class="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.4em]">JeuxCracks © 2026</span>
            </div>
        </footer>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFetch } from '../utils/useFetch';
import { JeuxCracksAPI } from '../services/api';
import newsData from '../data/news.json';
import { 
    PlayIcon, 
    EyeIcon,
    ArrowLongRightIcon,
    SparklesIcon,
    HeartIcon,
    FireIcon,
    RectangleStackIcon,
    BoltIcon,
    CpuChipIcon,
} from '@heroicons/vue/24/solid';
import { useNotification } from '@kyvg/vue3-notification';

const { notify } = useNotification();
const router = useRouter();

// States
const loading = ref(true);
const trendingGames = ref<any[]>([]);
const newGames = ref<any[]>([]);
const newsArticles = ref<any[]>(newsData);
const revenue = ref<any>({});
const monthlyGoal = ref(80);
const totalGames = ref(0);
const activeIndex = ref(0);

// Computed
const revenueProgress = computed(() => {
    if (!revenue.value.total || !monthlyGoal.value) return 0;
    return Math.min(100, (revenue.value.total / monthlyGoal.value) * 100);
});

// Timers
let slideTimer: any = null;
const SLIDE_DURATION = 8000;

// Functions
function goToPage(path: string) {
  router.push(path);
}

function formatNumber(num: number) {
    return new Intl.NumberFormat('fr-FR', { notation: "compact", compactDisplay: "short" }).format(num || 0);
}

function goToSlide(index: number) {
    activeIndex.value = index;
    resetTimer();
}

function nextSlide() {
    if (trendingGames.value.length === 0) return;
    activeIndex.value = (activeIndex.value + 1) % trendingGames.value.length;
    resetTimer();
}

function resetTimer() {
    clearInterval(slideTimer);
    if (trendingGames.value.length === 0) return;
    slideTimer = setInterval(() => {
        nextSlide();
    }, SLIDE_DURATION);
}

function stripHtml(html: string) {
   if (!html) return '';
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

function isNewGame(dateString: string) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays < 30;
}

async function fetchGameRow(sort: string, count: number) {
    try {
        const response: any = await useFetch(`/api/engine/games/?sort=${sort}&per_page=${count}`);
        const results = response?.results || [];
        
        return await Promise.all(results.map(async (g: any) => {
            const detail: any = await useFetch(`/api/engine/games/${g.slug}/`);
            const meta = detail?.metadata;
            return {
                id: detail?.id || g.id,
                slug: detail?.slug || g.slug,
                title: detail?.display_name || g.display_name,
                header: meta?.header_image || detail?.header || '/assets/placeholder.webp',
                descriptionShort: stripHtml(meta?.short_description || detail?.description || ''),
                views: detail?.views || g.views || 0,
                categories: meta?.genres || detail?.categories || [],
                isNew: isNewGame(detail?.last_updated || g.last_updated)
            };
        }));
    } catch (e) {
        console.error(`Error fetching row ${sort}:`, e);
        return [];
    }
}

onMounted(async () => {
  loading.value = true;
  try {
    // Background fetch for revenue
    JeuxCracksAPI.getMonthlyRevenue().then(res => {
        revenue.value = res;
    }).catch(err => console.error('Failed to fetch revenue:', err));

    // Fetch total games count
    useFetch('/api/engine/games/?per_page=1').then((res: any) => {
        totalGames.value = res?.meta?.total || 0;
    }).catch(err => console.error('Failed to fetch total games:', err));

    // Parallel fetch
    const [trending, newest] = await Promise.all([
        fetchGameRow('views', 5),
        fetchGameRow('-id', 10)
    ]);
    
    trendingGames.value = trending;
    newGames.value = newest;
    
    if (trendingGames.value.length > 0) {
        resetTimer();
    }
  } catch (e) {
    console.error(e);
    notify({ type: 'error', title: 'Erreur', text: 'Impossible de charger la page d\'accueil.' });
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
    clearInterval(slideTimer);
});
</script>

<style scoped>
@keyframes pan-zoom {
    0% { transform: scale(1.05); }
    100% { transform: scale(1.15); }
}
.animate-pan-zoom {
    animation: pan-zoom 12s ease-out forwards;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}

@keyframes revealText {
    0% { clip-path: inset(0 100% 0 0); opacity: 0; transform: translateX(-15px); }
    100% { clip-path: inset(0 0 0 0); opacity: 1; transform: translateX(0); }
}
.animate-reveal-text {
    animation: revealText 1s cubic-bezier(0.77, 0, 0.175, 1) forwards;
    opacity: 0;
}

/* Hero Transition */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

/* Horizontal Scrollbar */
.custom-scrollbar-h::-webkit-scrollbar {
    height: 4px;
}
.custom-scrollbar-h::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar-h::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 10px;
}
.custom-scrollbar-h::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
}

.animation-delay-200 {
    animation-delay: 0.2s;
}
</style>
