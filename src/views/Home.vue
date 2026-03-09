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

    <!-- 1. HERO SLIDER SECTION -->
    <section class="relative w-full h-[75vh] min-h-[550px] overflow-hidden">
        <transition-group name="fade" tag="div" class="h-full w-full relative">
            <div 
                v-if="trendingGames[activeIndex]"
                :key="trendingGames[activeIndex].id"
                class="absolute inset-0 w-full h-full"
            >
                <!-- Background Layer -->
                <div class="absolute inset-0 bg-black">
                    <img 
                        :src="trendingGames[activeIndex].header" 
                        class="w-full h-full object-cover animate-pan-zoom opacity-60" 
                    />
                    <div class="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                </div>

                <!-- Content Area -->
                <div class="absolute inset-0 z-20 px-8 md:px-16 xl:px-24 flex flex-col justify-center items-start h-full max-w-[1920px] mx-auto">
                    <div class="w-full max-w-4xl space-y-6">
                        <!-- Tags -->
                        <div class="flex items-center gap-4 animate-slide-up" style="animation-delay: 100ms">
                             <div class="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                <FireIcon class="w-3 h-3 text-indigo-400" />
                                <span class="text-[10px] font-black uppercase tracking-widest text-indigo-300">Tendance</span>
                             </div>
                             <span class="text-white/40 text-[10px] font-bold uppercase tracking-widest">{{ trendingGames[activeIndex].categories?.[0]?.name || 'Jeu' }}</span>
                        </div>

                        <!-- Title -->
                        <h1 class="text-5xl md:text-7xl xl:text-8xl font-black text-white leading-none tracking-tighter uppercase animate-reveal-text">
                            {{ trendingGames[activeIndex].title }}
                        </h1>
                        
                        <!-- Desc -->
                        <p class="max-w-xl text-zinc-400 text-sm md:text-base font-medium leading-relaxed line-clamp-2 animate-slide-up" style="animation-delay: 300ms">
                            {{ trendingGames[activeIndex].descriptionShort }}
                        </p>

                        <!-- Actions -->
                        <div class="flex items-center gap-4 pt-4 animate-slide-up" style="animation-delay: 400ms">
                            <button 
                                @click="goToPage(`/catalogue/${trendingGames[activeIndex].slug || trendingGames[activeIndex].id}`)"
                                class="group relative px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 overflow-hidden transition-all hover:pr-12"
                            >
                                <PlayIcon class="w-4 h-4" />
                                <span>Jouer</span>
                                <ArrowLongRightIcon class="absolute right-4 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0" />
                            </button>
                            
                            <button 
                                @click="nextSlide"
                                class="p-4 border border-white/10 hover:bg-white/5 text-white transition-all rounded-full group"
                            >
                                <ArrowLongRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>

        <!-- Slider Dots -->
        <div class="absolute bottom-40 right-8 md:right-16 xl:right-24 z-30 flex flex-col gap-3">
             <button 
                v-for="(g, idx) in trendingGames" 
                :key="g.id"
                @click="goToSlide(idx)"
                class="group p-2 flex items-center gap-4 justify-end cursor-pointer"
            >   
                <span :class="activeIndex === idx ? 'text-white' : 'text-zinc-600'" class="text-[10px] font-black tracking-widest transition-colors opacity-0 group-hover:opacity-100 uppercase">
                    {{ g.title }}
                </span>
                <div 
                    class="w-8 h-[2px] transition-all duration-500"
                    :class="activeIndex === idx ? 'bg-indigo-500 w-12' : 'bg-white/10 group-hover:bg-white/30'"
                ></div>
             </button>
        </div>
    </section>

    <!-- 2. MAIN CONTENT WRAPPER -->
    <div class="relative z-30 max-w-[1920px] mx-auto px-8 md:px-16 xl:px-24 -mt-20 pb-24 space-y-24">
        
        <!-- Quick Stats / Badges -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style="animation-delay: 500ms">
            <!-- 1. Nombre de Jeux -->
            <div class="p-6 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 flex flex-col gap-1 hover:border-indigo-500/20 transition-all group">
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-indigo-400 transition-colors">Nombre de Jeux</span>
                <span class="text-xl font-bold text-white">{{ formatNumber(totalGames) }}</span>
            </div>

            <!-- 2. Nouveautés -->
            <div class="p-6 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 flex flex-col gap-1 hover:border-indigo-500/20 transition-all group">
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-indigo-400 transition-colors">Nouveautés</span>
                <span class="text-xl font-bold text-white">12 Ajouts</span>
            </div>

            <!-- 3. Premium -->
            <div class="p-6 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 flex flex-col gap-1 hover:border-indigo-500/20 transition-all group">
                <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-indigo-400 transition-colors">Version App</span>
                <span class="text-xl font-bold text-white">v1.1.2</span>
            </div>

            <!-- 4. Soutenez-nous (Goal) -->
            <div class="p-6 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 flex flex-col gap-2 hover:border-emerald-500/20 transition-all group cursor-pointer" @click="goToPage('/premium')">
                <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-emerald-400 transition-colors">Objectif Global</span>
                    <div class="flex items-baseline justify-between">
                        <span class="text-lg font-bold text-white">{{ Math.round(revenue.total || 0) }}€ <span class="text-[10px] text-zinc-500">/ {{ monthlyGoal }}€</span></span>
                        <span class="text-[8px] font-black text-emerald-500/50 uppercase tracking-tighter">{{ Math.round(revenueProgress) }}%</span>
                    </div>
                </div>
                <!-- Mini Sleek Progress Bar -->
                <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-1000" :style="{ width: revenueProgress + '%' }"></div>
                </div>
            </div>
        </div>

        <!-- Section: Actualités -->
        <section class="space-y-8">
            <div class="flex items-end justify-between">
                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-indigo-400">
                        <NewspaperIcon class="w-5 h-5" />
                        <span class="text-[10px] font-black uppercase tracking-[0.3em]">Actualités</span>
                    </div>
                    <h2 class="text-4xl font-black text-white uppercase tracking-tighter">Patch Notes & Infos</h2>
                </div>
                <router-link to="/news" class="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors pb-2">Tout voir</router-link>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Dynamic News Cards -->
                <div 
                    v-for="article in newsArticles" 
                    :key="article.id"
                    @click="article.link.startsWith('/') ? goToPage(article.link) : window.open(article.link, '_blank')"
                    class="group relative aspect-[16/10] rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer"
                >
                    <!-- Background Image -->
                    <img :src="article.image" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60" />
                    
                    <!-- Gradient Overlay -->
                    <div 
                        class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        :class="[
                            article.accent_color === 'indigo' ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20' : '',
                            article.accent_color === 'amber' ? 'bg-gradient-to-br from-amber-600/20 to-orange-600/20' : '',
                            article.accent_color === 'emerald' ? 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20' : '',
                            !['indigo', 'amber', 'emerald'].includes(article.accent_color) ? 'bg-gradient-to-br from-zinc-600/20 to-zinc-900/20' : ''
                        ]"
                    ></div>
                    
                    <div class="absolute inset-0 p-8 flex flex-col justify-end gap-3 z-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                        <span 
                            class="text-[10px] font-black uppercase tracking-widest"
                            :class="[
                                article.accent_color === 'indigo' ? 'text-indigo-400' : '',
                                article.accent_color === 'amber' ? 'text-amber-500' : '',
                                article.accent_color === 'emerald' ? 'text-emerald-500' : '',
                                !['indigo', 'amber', 'emerald'].includes(article.accent_color) ? 'text-zinc-400' : ''
                            ]"
                        >
                            {{ article.category }}
                        </span>
                        <h3 class="text-xl font-black text-white uppercase leading-tight group-hover:translate-x-2 transition-transform">{{ article.title }}</h3>
                        <p class="text-xs text-zinc-400 line-clamp-2">{{ article.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Banner: Premium -->
        <section class="relative group p-1 w-full rounded-[2.5rem] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border border-white/5 overflow-hidden transition-all hover:border-indigo-500/30">
            <div class="relative p-12 md:p-16 rounded-[2.2rem] bg-[#080808] flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden">
                <!-- BG Glow -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
                
                <div class="relative z-10 max-w-2xl space-y-6 text-center md:text-left">
                    <div class="flex items-center justify-center md:justify-start gap-3">
                        <div class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <SparklesIcon class="w-6 h-6 text-indigo-400" />
                        </div>
                        <span class="text-sm font-black text-indigo-400 uppercase tracking-[0.4em]">JeuxCracks Premium</span>
                    </div>
                    <h2 class="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Poussez l'expérience à son maximum</h2>
                    <p class="text-zinc-400 font-medium">Libérez toute la puissance de la plateforme avec des vitesses illimitées, un badge donateur et un accès anticipé aux nouveaux cracks.</p>
                </div>

                <div class="relative z-10 flex flex-col items-center gap-6">
                    <div class="text-center">
                        <span class="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">À partir de</span>
                        <span class="text-5xl font-black text-white tracking-tighter">2.99€<span class="ml-2 text-sm text-zinc-600 font-bold tracking-normal">/mois</span></span>
                    </div>
                    <router-link to="/premium" class="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:scale-105">
                        M'abonner maintenant
                    </router-link>
                </div>
            </div>
        </section>

        <!-- Section: Nouveautés (Grille) -->
        <section class="space-y-8">
            <div class="flex items-end justify-between">
                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-indigo-400">
                        <ClockIcon class="w-5 h-5" />
                        <span class="text-[10px] font-black uppercase tracking-[0.3em]">Catalogue</span>
                    </div>
                    <h2 class="text-4xl font-black text-white uppercase tracking-tighter">Dernières Sorties</h2>
                </div>
                <router-link to="/catalogue" class="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors pb-2">Explorer le catalogue</router-link>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div 
                    v-for="game in newGames" :key="game.id"
                    @click="goToPage(`/catalogue/${game.slug || game.id}`)"
                    class="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 hover:border-indigo-500/30 transition-all"
                >
                    <img :src="game.header" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                    
                    <!-- Hover Info -->
                    <div class="absolute inset-0 p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <div class="space-y-1">
                            <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{{ game.categories?.[0] }}</span>
                            <h3 class="text-lg font-black text-white uppercase line-clamp-1 leading-tight">{{ game.title }}</h3>
                        </div>
                    </div>
                    
                    <!-- Floating Views -->
                    <div class="absolute top-4 right-4 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <EyeIcon class="w-3 h-3 text-zinc-400" />
                        <span class="text-[10px] font-bold text-white">{{ formatNumber(game.views) }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer / Donation CTA -->
        <footer class="flex flex-col items-center gap-12 text-center pt-12">
            <div class="max-w-xl space-y-4">
                <div class="flex items-center justify-center gap-2 text-amber-500">
                    <HeartIcon class="w-5 h-5" />
                    <span class="text-[10px] font-black uppercase tracking-[0.3em]">Support communitaitre</span>
                </div>
                <h2 class="text-3xl font-black text-white uppercase tracking-tight">Maintenez le projet en vie</h2>
                <p class="text-zinc-500 text-sm font-medium">JeuxCracks est un projet indépendant. Vos dons nous permettent de continuer à mettre à jour le catalogue et d'améliorer le launcher chaque jour.</p>
                <div class="flex items-center justify-center gap-4 pt-4">
                    <router-link to="/premium" class="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all">
                        Faire un don
                    </router-link>
                    <a href="https://discord.jeuxcracks.fr" target="_blank" class="px-8 py-3 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                        Rejoindre le Discord
                    </a>
                </div>
            </div>
            
            <div class="h-px w-24 bg-zinc-800"></div>
            
            <div class="flex flex-col items-center gap-2">
                <img src="/assets/logo.webp" class="w-8 opacity-20 filter grayscale" />
                <span class="text-[10px] font-bold text-zinc-700 uppercase tracking-[0.5em]">JeuxCracks Launcher © 2026</span>
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
    ClockIcon,
    NewspaperIcon
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
const progress = ref(0);

// Computed
const revenueProgress = computed(() => {
    if (!revenue.value.total || !monthlyGoal.value) return 0;
    return Math.min(100, (revenue.value.total / monthlyGoal.value) * 100);
});


// Timers
let slideTimer: any = null;
let progressTimer: any = null;
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
    clearInterval(progressTimer);
    progress.value = 0;
    
    if (trendingGames.value.length === 0) return;

    const step = 100 / (SLIDE_DURATION / 100);
    progressTimer = setInterval(() => {
        progress.value += step;
        if (progress.value >= 100) progress.value = 100;
    }, 100);

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
    // Background fetch for revenue (don't block the UI)
    JeuxCracksAPI.getMonthlyRevenue().then(res => {
        revenue.value = res;
    }).catch(err => console.error('Failed to fetch revenue:', err));

    // Fetch total games count
    useFetch('/api/engine/games/?per_page=1').then((res: any) => {
        totalGames.value = res?.meta?.total || 0;
    }).catch(err => console.error('Failed to fetch total games:', err));

    // Parallel fetch for trending and new games
    const [trending, newest] = await Promise.all([
        fetchGameRow('views', 5),
        fetchGameRow('-id', 8) // Assume -id gives freshest
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
    clearInterval(progressTimer);
});
</script>

<style scoped>
@keyframes pan-zoom {
    0% { transform: scale(1.05); }
    100% { transform: scale(1.15); }
}
.animate-pan-zoom {
    animation: pan-zoom 10s ease-out forwards;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
    animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-40px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-slide-down {
    animation: slideDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}

@keyframes revealText {
    0% { clip-path: inset(0 100% 0 0); opacity: 0; transform: translateX(-20px); }
    100% { clip-path: inset(0 0 0 0); opacity: 1; transform: translateX(0); }
}
.animate-reveal-text {
    animation: revealText 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
    opacity: 0; /* Fallback */
}

/* Custom Gradients/Shaders */
.backdrop-blur-xl {
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animation-delay-200 {
    animation-delay: 0.2s;
}
</style>
