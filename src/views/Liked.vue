<template>
  <div class="h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar p-6 md:p-12 pb-32">
    
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
        <div class="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <HeartIcon class="w-8 h-8 text-red-500" />
        </div>
        <div>
            <h1 class="text-3xl font-black text-white uppercase tracking-tighter">Jeux Aimés</h1>
            <p class="text-zinc-500 font-medium">Vos coups de cœur</p>
        </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <div v-for="i in 5" :key="i" class="aspect-[3/4] bg-zinc-900/50 rounded-xl animate-pulse"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="likedGames.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
            <HeartIcon class="w-10 h-10 text-zinc-600" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Aucun jeu aimé</h3>
        <p class="text-zinc-500 max-w-md mx-auto mb-8">Vous n'avez pas encore liké de jeux.</p>
        <button @click="router.push('/')" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
            Découvrir des jeux
        </button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <div 
            v-for="game in likedGames" 
            :key="game.id"
            class="group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 cursor-pointer"
            @click="router.push(`/game/${game.id}`)"
        >
            <!-- Image -->
            <img 
                :src="game.cover || game.header || '/assets/placeholder.webp'" 
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

            <!-- Content -->
            <div class="absolute inset-0 p-5 flex flex-col justify-end">
                <h3 class="text-lg font-black text-white leading-none mb-1 group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {{ game.title }}
                </h3>
            </div>
            
            <!-- Like Indicator -->
            <div class="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10">
                <HeartIcon class="w-4 h-4 text-red-500 fill-red-500" />
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { JeuxCracksAPI } from '../services/api';
import { HeartIcon } from '@heroicons/vue/24/solid';

const router = useRouter();
const loading = ref(true);
const likedGames = ref<any[]>([]);

// Fetch liked games from API
const loadLikedGames = async () => {
    loading.value = true;
    try {
        const response: any = await JeuxCracksAPI.getLikedGames();
        if (Array.isArray(response)) {
            likedGames.value = response;
        } else if (response.results) {
             likedGames.value = response.results;
        } else {
            likedGames.value = [];
        }
    } catch (e) {
        console.error('Failed to load liked games', e);
        likedGames.value = [];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    loadLikedGames();
});
</script>
