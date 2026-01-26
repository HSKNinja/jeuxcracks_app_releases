<template>
  <div class="h-full flex flex-col p-8 md:p-12 space-y-12 overflow-y-auto custom-scrollbar">
    
    <!-- Header -->
    <div class="border-b border-white/5 pb-8 animate-fade-in">
        <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
            Vos <span class="text-indigo-500">Favoris</span>
        </h1>
        <p class="text-zinc-500 font-medium">Retrouvez ici tous vos jeux coup de cœur.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-pulse">
        <div v-for="n in 4" :key="n" class="aspect-video bg-zinc-900 rounded-2xl ring-1 ring-white/5"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="favoritesData.length === 0" class="flex-1 flex flex-col items-center justify-center text-center animate-fade-in py-20">
        <div class="relative group mb-8">
            <div class="absolute inset-0 bg-pink-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <HeartIcon class="w-32 h-32 text-zinc-800 relative z-10" />
        </div>
        <h3 class="text-3xl font-black text-white uppercase tracking-tighter mb-4">Aucun favori</h3>
        <p class="text-zinc-500 max-w-md mx-auto mb-10 font-medium text-lg">Votre collection de favoris est vide. Ajoutez des jeux depuis le catalogue.</p>
        <button 
            @click="router.push('/catalogue')" 
            class="px-10 py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-indigo-500 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/30"
        >
            Explorer le catalogue
        </button>
    </div>

    <!-- Favorites Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 animate-slide-up">
        <div 
            v-for="(game, index) in favoritesData" 
            :key="game.id" 
            class="group relative aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden cursor-pointer border border-zinc-800 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
            :style="{ animationDelay: `${index * 50}ms` }"
            @click="goToGame(game.id)"
        >
             <!-- Image -->
             <img 
                :src="resolveImage(game)" 
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40" 
             />
             
             <!-- Overlay Gradient -->
             <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>

             <!-- Content -->
             <div class="absolute inset-0 p-6 flex flex-col justify-end z-20">
                 <h3 class="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                     {{ game.title || game.name }}
                 </h3>
                 <div class="h-0.5 w-12 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 mb-4"></div>
                 
                 <div class="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0 delay-100">
                     <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                         Voir la fiche
                     </span>
                     <button 
                        @click.stop="removeFavorite(game.id)" 
                        class="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
                        title="Retirer des favoris"
                     >
                         <HeartIcon class="w-5 h-5" /> <!-- Solid heart implies 'favorited', clicking removes it -->
                     </button>
                 </div>
             </div>

             <!-- Top Right Badge (Optional status) -->
             <div class="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <!-- Could add badges here if needed -->
             </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '../store';
import { useFetch } from '../utils/useFetch';
import { HeartIcon } from '@heroicons/vue/24/solid';

const router = useRouter();
const store = useMainStore();
const loading = ref(true);
const favoritesData = ref<any[]>([]);

// Fetch full game details for each ID in store.favorites
const loadFavorites = async () => {
    loading.value = true;
    console.log('Loading favorites for IDs:', store.favorites);
    
    if (!store.favorites || store.favorites.length === 0) {
        favoritesData.value = [];
        loading.value = false;
        return;
    }

    const promises = store.favorites.map(async (id) => {
        try {
            // Ensure ID is valid before fetching
            if (!id) return null;
            
            const data: any = await useFetch(`/Cracks/api/game/?format=json&id=${id}`);
            if (data && data.status) {
                return data;
            }
        } catch (e) {
            console.error(`Failed to fetch favorite ${id}`, e);
        }
        return null;
    });

    const results = await Promise.all(promises);
    favoritesData.value = results.filter(g => g !== null);
    console.log('Favorites loaded:', favoritesData.value);
    loading.value = false;
};

const removeFavorite = async (id: string) => {
    // Local optimistic update
    favoritesData.value = favoritesData.value.filter(g => g.id !== id);
    // Persist
    await store.toggleFavorite(id);
};

const goToGame = (id: string) => router.push(`/catalogue/${id}`);

const resolveImage = (game: any) => {
    if (!game) return '/assets/placeholder.webp';
    const img = game.header || game.urls?.header_image || game.urls?.image || game.informations?.image;
    
    if (!img) return '/assets/placeholder.webp';
    if (img.startsWith('http')) return img;
    if (img.startsWith('//')) return `https:${img}`;
    return `https://api.jeuxcracks.fr${img.startsWith('/') ? '' : '/'}${img}`;
};

onMounted(async () => {
    // If favorites are empty, try fetching them from the server first
    if (store.favorites.length === 0) {
        console.log('Store favorites empty, fetching from server...');
        await store.fetchFavorites();
    }
    
    // Now load the game data
    loadFavorites();
});

// Watch for store changes (e.g. if removed from sidebar)
watch(() => store.favorites, () => {
    // If store changes drastically we might reload, but for simple removal it handles itself.
    // If added externally, we reload.
    if (store.favorites.length !== favoritesData.value.length) {
         loadFavorites(); // Simple re-fetch strategy
    }
}, { deep: true });
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

.animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes slideUp {
    to { opacity: 1; transform: translateY(0); }
}
</style>
