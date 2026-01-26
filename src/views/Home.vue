<template>
  <div class="h-full w-full bg-[#050505] overflow-hidden relative selection:bg-indigo-500/30">
    
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 z-50 flex items-center justify-center bg-black">
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

    <!-- MAIN SLIDER -->
    <transition-group name="fade" tag="div" class="h-full w-full relative">
        <div 
            v-if="currentGame"
            :key="currentGame.id"
            class="absolute inset-0 w-full h-full"
        >
            <!-- 1. BACKGROUND LAYERS -->
            <div class="absolute inset-0 bg-black">
                
                <!-- Video Background -->
                <video 
                    v-if="currentGame.video"
                    :src="currentGame.video" 
                    class="w-full h-full object-cover opacity-60 animate-pan-zoom"
                    autoplay loop muted playsinline
                ></video>
                <!-- Image Fallback -->
                <img 
                    v-else
                    :src="currentGame.header" 
                    class="w-full h-full object-cover opacity-50 animate-pan-zoom" 
                />

                <!-- Artistic Overlays -->
                <div class="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div class="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                
                <!-- Vignette -->
                <div class="absolute inset-0 ring-1 ring-white/5 inset-shadow"></div>
            </div>

            <!-- 2. CONTENT CONTAINER -->
            <div class="absolute inset-0 z-20 p-12 md:p-20 lg:p-24 flex flex-col justify-end items-start h-full max-w-[1920px] mx-auto">
                
                <!-- Top Info (Floating) -->
                <div class="absolute top-12 left-12 md:top-16 md:left-16 flex items-center gap-6 animate-slide-down">
                     <div class="flex items-center gap-3">
                        <div class="h-[1px] w-12 bg-white/50"></div>
                        <span class="text-xs font-black uppercase tracking-[0.3em] text-white/80">
                            {{ activeIndex + 1 < 10 ? '0' + (activeIndex + 1) : activeIndex + 1 }} / {{ games.length < 10 ? '0' + games.length : games.length }}
                        </span>
                     </div>
                </div>

                <!-- Main Info Area -->
                <div class="w-full max-w-4xl space-y-8">
                    
                    <!-- Decorative Tags -->
                    <div class="flex flex-wrap items-center gap-4 animate-slide-up" style="animation-delay: 100ms">
                         <span v-if="currentGame.isNew" class="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                            Nouveauté
                         </span>
                         <span class="px-3 py-1 border border-white/20 backdrop-blur-md text-white/80 text-[10px] font-bold uppercase tracking-[0.25em]">
                            {{ currentGame.categories?.[0] || 'Jeu' }}
                         </span>
                         <span class="px-3 py-1 text-zinc-400 text-[10px] font-bold uppercase tracking-[0.25em] flex items-center gap-2">
                             <EyeIcon class="w-3 h-3" /> {{ formatNumber(currentGame.views) }}
                         </span>
                    </div>

                    <!-- Title -->
                    <h1 class="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tighter uppercase drop-shadow-2xl mix-blend-screen animate-reveal-text max-w-5xl">
                        {{ currentGame.title }}
                    </h1>
                    
                    <!-- Description -->
                    <p class="max-w-xl text-base md:text-lg text-zinc-300 font-medium leading-relaxed drop-shadow-lg animate-slide-up border-l-2 border-indigo-500 pl-6 line-clamp-3" style="animation-delay: 300ms">
                        {{ currentGame.descriptionShort }}
                    </p>

                    <!-- Actions -->
                    <div class="flex items-center gap-6 pt-8 animate-slide-up" style="animation-delay: 400ms">
                        <button 
                            @click="goToPage(`/catalogue/${currentGame.id}`)"
                            class="group relative px-10 py-5 bg-white text-black overflow-hidden"
                        >
                            <div class="absolute inset-0 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                            <span class="relative z-10 flex items-center gap-3 font-black uppercase tracking-widest text-sm group-hover:text-white transition-colors">
                                <PlayIcon class="w-5 h-5" />
                                Découvrir
                            </span>
                        </button>

                         <button 
                            @click="nextSlide"
                            class="px-8 py-5 border border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest text-xs backdrop-blur-md transition-all flex items-center gap-3"
                        >
                            Suivant
                            <ArrowLongRightIcon class="w-5 h-5" />
                        </button>
                    </div>

                </div>

            </div>
            
            <!-- 3. PROGRESS BAR -->
            <div class="absolute bottom-0 left-0 h-1 bg-indigo-600 z-30 transition-all ease-linear" :style="{ width: progress + '%' }"></div>
        
        </div>
    </transition-group>

    <!-- Navigation Controls (Right Side) -->
    <div class="absolute right-0 top-0 bottom-0 w-24 md:w-32 z-40 flex flex-col items-center justify-center gap-4 pr-8 md:pr-12 pointer-events-none">
         <div class="flex flex-col gap-3 pointer-events-auto">
             <button 
                v-for="(g, idx) in games" 
                :key="g.id"
                @click="goToSlide(idx)"
                class="group flex items-center gap-4 justify-end cursor-pointer py-2"
            >   
                <span class="text-[10px] font-bold text-white/40 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 duration-300">
                    {{ idx + 1 < 10 ? '0' + (idx + 1) : idx + 1 }}
                </span>
                <div 
                    class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    :class="activeIndex === idx ? 'bg-indigo-500 scale-150 shadow-[0_0_10px_currentColor]' : 'bg-white/20 group-hover:bg-white'"
                ></div>
             </button>
         </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFetch } from '../utils/useFetch';
import { 
    PlayIcon, 
    EyeIcon,
    ArrowLongRightIcon
} from '@heroicons/vue/24/solid';
import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();

const router = useRouter();

const games = ref<any[]>([]);
const loading = ref(true);
const activeIndex = ref(0);
const progress = ref(0);
let slideTimer: any = null;
let progressTimer: any = null;
const SLIDE_DURATION = 8000; // 8 seconds per slide

const currentGame = computed(() => games.value[activeIndex.value]);

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
    activeIndex.value = (activeIndex.value + 1) % games.value.length;
    resetTimer();
}

function resetTimer() {
    clearInterval(slideTimer);
    clearInterval(progressTimer);
    progress.value = 0;
    
    // Progress Bar Animation
    const step = 100 / (SLIDE_DURATION / 100);
    progressTimer = setInterval(() => {
        progress.value += step;
        if (progress.value >= 100) progress.value = 100;
    }, 100);

    // Slide Switching
    slideTimer = setInterval(() => {
        nextSlide();
    }, SLIDE_DURATION);
}

function isNewGame(dateString: string) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays < 30;
}

onMounted(async () => {
  loading.value = true;
  try {
    // API Call: Top 5 Games
    const response: any = await useFetch('/Cracks/api/liste_jeux/?app=true&views=true&limit=5'); 
    
    const fixGame = (g: any) => {
        let header = g.header;
        if(g.urls?.header_image) header = g.urls.header_image;
        if(!header && g.urls?.image) header = g.urls.image; // Fallback
        if(!header && g.informations?.image) header = "https://api.jeuxcracks.fr" + g.informations.image;
        if (!header) header = '/assets/placeholder.webp';

        let video = g.video || g.urls?.trailer || null;

        return {
            ...g,
            id: g.id,
            title: g.informations?.title || g.title,
            descriptionShort: stripHtml(g.short_description || g.descriptions?.short_description || g.description || ''),
            header: header,
            video: video,
            views: g.views,
            categories: g.categories || [],
            isNew: isNewGame(g.status?.created_at || g.created_at)
        };
    };

    if (response && (response.results || response.games)) {
        const rawGames = response.results || response.games;
        games.value = rawGames.map(fixGame);
        
        if (games.value.length > 0) {
            resetTimer();
        }
    }

  } catch (e) {
    console.error(e);
    notify({ type: 'error', title: 'Erreur', text: 'Impossible de charger les jeux à la une.' });
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
    clearInterval(slideTimer);
    clearInterval(progressTimer);
});

function stripHtml(html: string) {
   if (!html) return '';
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

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

/* Vue Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animation-delay-200 {
    animation-delay: 0.2s;
}
</style>
