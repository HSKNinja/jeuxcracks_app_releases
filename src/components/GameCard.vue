<template>
  <div v-if="game" class="relative cursor-pointer group" @click="goToPage(`/catalogue/${game.id}`)">
    <!-- Bouton favori - affiché seulement sur certaines pages -->
    <button 
      v-if="showFavoriteButton"
      @click.stop="toggleFavorite"
      class="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
      :class="{ 'text-red-500': isFavorite, 'text-white': !isFavorite }"
      :disabled="isLoading"
    >
      <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
      <svg v-else-if="isFavorite" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    </button>

    <!-- Image du jeu -->
    <div class="w-full h-32 rounded-md overflow-hidden bg-neutral-800">
      <img 
        v-if="game?.header && !imageError"
        class="w-full h-full object-cover group-hover:contrast-125 transition"
        :src="getImageUrl(game.header)"
      :alt="game.title"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="w-full h-full bg-neutral-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"/>
        </svg>
      </div>
    </div>

    <h3 class="text-lg font-bold mt-2 truncate">{{ game.title }}</h3>
  </div>
  <div v-else>
    <Skeleton class="h-32 w-full" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMainStore } from '../store';
import { JeuxCracksAPI } from '../services/api';
import Skeleton from './Skeleton.vue';

const router = useRouter();
const route = useRoute();
const store = useMainStore();

const props = defineProps({
  game: Object,
  forceFavorite: {
    type: Boolean,
    default: false
  }
});

const isFavorite = ref(false);
const isLoading = ref(false);
const imageError = ref(false);

// Déterminer si on doit afficher le bouton favori
const showFavoriteButton = computed(() => {
  // Afficher sur la page favoris ou si forcé
  return route.path === '/favoris' || props.forceFavorite;
});

// Vérifier si le jeu est dans les favoris seulement si nécessaire
onMounted(async () => {
  if (props.game?.id && showFavoriteButton.value) {
    await checkFavoriteStatus();
  } else if (props.forceFavorite) {
    isFavorite.value = true;
  }
});

// Écouter les changements de props
watch(() => props.forceFavorite, (newValue) => {
  if (newValue) {
    isFavorite.value = true;
  }
});

// Écouter les changements de route
watch(() => route.path, async (newPath) => {
  if (newPath === '/favoris' && props.game?.id) {
    await checkFavoriteStatus();
  }
});

async function checkFavoriteStatus() {
  if (!props.game?.id || !showFavoriteButton.value) return;
  
  try {
    const favorites = await JeuxCracksAPI.getUserFavorites();
    isFavorite.value = favorites.favorite_game_ids.includes(Number(props.game.id));
  } catch (error) {
    console.error('Erreur lors de la vérification des favoris:', error);
  }
}

function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // Si c'est déjà une URL complète
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Si c'est un chemin relatif, ajouter le domaine
  if (imagePath.startsWith('/')) {
    return `https://api.jeuxcracks.fr${imagePath}`;
  }
  
  // Sinon, retourner tel quel
  return imagePath;
}

function handleImageError() {
  imageError.value = true;
}

function handleImageLoad() {
  imageError.value = false;
}

async function toggleFavorite() {
  if (!props.game?.id || isLoading.value) return;
  
  // Vérifier que l'utilisateur est connecté
  if (!store.isAuthenticated) {
    console.error('Utilisateur non connecté');
    return;
  }
  
  isLoading.value = true;
  try {
    console.log('🔄 Toggle favori pour le jeu:', props.game.id);
    await JeuxCracksAPI.toggleFavorite(Number(props.game.id));
    isFavorite.value = !isFavorite.value;
    
    // Émettre un événement pour informer les autres composants
    window.dispatchEvent(new CustomEvent('favorites-updated', {
      detail: { gameId: props.game.id, isFavorite: isFavorite.value }
    }));
  } catch (error) {
    console.error('Erreur lors du toggle des favoris:', error);
  } finally {
    isLoading.value = false;
  }
}

function goToPage(path: string) {
  router.push(path);
}
</script>
