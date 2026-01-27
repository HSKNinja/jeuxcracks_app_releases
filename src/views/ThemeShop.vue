<template>
  <div class="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShoppingBagIcon class="w-8 h-8 text-indigo-500" />
            Boutique & Personnalisation
        </h1>
        <p class="text-zinc-500 text-sm mt-1">Personnalisez votre profil et l'interface de l'application.</p>
      </div>
      
      <!-- User Credits (Fake for now) -->
      <div class="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <span class="text-white font-bold text-sm">Gratuit (Bêta)</span>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
            :class="activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'"
        >
            {{ tab.name }}
        </button>
    </div>

    <!-- GRID -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="group relative bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
        >
            <!-- Preview Area -->
            <div class="aspect-square bg-zinc-900/50 relative flex items-center justify-center overflow-hidden">
                <!-- Rarity Badge -->
                <div 
                    class="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide z-10"
                    :class="getRarityColor(item.rarity)"
                >
                    {{ item.rarity }}
                </div>

                <!-- AVATAR FRAME PREVIEW -->
                <div v-if="item.type === 'avatar_frame'" class="relative w-32 h-32 flex items-center justify-center">
                    <!-- CSS Frame -->
                    <div v-if="item.isCssOnly" class="absolute inset-0 z-20 pointer-events-none" :class="item.cssClass"></div>
                    <!-- Image Frame -->
                    <img v-else :src="item.image" class="absolute inset-0 w-full h-full object-contain drop-shadow-lg z-20" />
                    
                    <!-- Base Avatar -->
                    <div class="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700/50">
                        <span class="text-2xl font-bold text-zinc-600">You</span>
                    </div>
                </div>

                <!-- BANNER PREVIEW -->
                <div v-if="item.type === 'banner'" class="absolute inset-0">
                    <img :src="item.image" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
                </div>
                
                <!-- PSEUDO EFFECT PREVIEW -->
                <div v-if="item.type === 'pseudo_effect'" class="flex items-center justify-center w-full h-full bg-zinc-900/50">
                    <span class="text-2xl font-bold" :class="item.cssClass">Pseudo</span>
                </div>

                <!-- THEME PREVIEW -->
                <div v-if="item.type === 'global_theme'" class="w-full h-full relative" :class="item.cssClass">
                    <div class="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
                        <div class="w-2/3 h-2/3 bg-black/40 border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden">
                             <!-- Fake Header -->
                             <div class="h-6 border-b border-white/10 flex items-center px-2 space-x-1 bg-white/5">
                                 <div class="w-2 h-2 rounded-full bg-red-500/50"></div>
                                 <div class="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                             </div>
                             <!-- Fake Sidebar/Content -->
                             <div class="flex-1 flex">
                                 <div class="w-1/4 h-full border-r border-white/10 bg-white/5"></div>
                                 <div class="flex-1"></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content -->
            <div class="p-5">
                <h3 class="text-white font-bold text-lg mb-1">{{ item.name }}</h3>
                <p class="text-zinc-500 text-xs line-clamp-2 min-h-[2.5em]">{{ item.description || "Un objet cosmétique exclusif." }}</p>
                
                <div class="mt-4 flex gap-2">
                    <button 
                        v-if="!themeStore.isOwned(item.id)"
                        @click="purchase(item)"
                        class="flex-1 py-2 rounded-lg bg-zinc-100 hover:bg-white text-black font-bold text-sm transition-colors"
                    >
                        Obtenir
                    </button>
                    
                    <button 
                        v-else-if="isEquipped(item)"
                        class="flex-1 py-2 rounded-lg bg-green-500/10 text-green-500 font-bold text-sm cursor-default border border-green-500/20"
                    >
                        Équipé
                    </button>
                    
                    <button 
                        v-else
                        @click="equip(item)"
                        class="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Équiper
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useThemeStore, type ShopItem } from '../store/theme';
import { ShoppingBagIcon } from '@heroicons/vue/24/outline';
import { useNotification } from '@kyvg/vue3-notification';

const themeStore = useThemeStore();
const { notify } = useNotification();

const activeTab = ref<string>('all');

const tabs = [
    { id: 'all', name: 'Tout' },
    { id: 'avatar_frame', name: 'Cadres' },
    { id: 'banner', name: 'Bannières' },
    { id: 'pseudo_effect', name: 'Effets Pseudo' },
    { id: 'global_theme', name: 'Thèmes Globaux' }
];

const filteredItems = computed(() => {
    if (activeTab.value === 'all') return themeStore.items;
    return themeStore.items.filter(i => i.type === activeTab.value);
});

function getRarityColor(rarity: string) {
    switch(rarity) {
        case 'common': return 'bg-zinc-800 text-zinc-400';
        case 'rare': return 'bg-blue-900/50 text-blue-400 border border-blue-500/20';
        case 'epic': return 'bg-purple-900/50 text-purple-400 border border-purple-500/20';
        case 'legendary': return 'bg-amber-900/50 text-amber-400 border border-amber-500/20';
        case 'mythic': return 'bg-red-900/50 text-red-500 border border-red-500/20 animate-pulse';
        default: return 'bg-zinc-800 text-zinc-400';
    }
}

function isEquipped(item: ShopItem) {
    if (item.type === 'avatar_frame') return themeStore.equipped.avatar_frame === item.id;
    if (item.type === 'banner') return themeStore.equipped.banner === item.id;
    if (item.type === 'global_theme') return themeStore.equipped.global_theme === item.id;
    return false;
}

function purchase(item: ShopItem) {
    if (themeStore.purchaseItem(item.id)) {
        notify({ type: 'success', title: 'Achat réussi', text: `Vous avez obtenu ${item.name} !` });
    }
}

function equip(item: ShopItem) {
    if (themeStore.equipItem(item.id)) {
        notify({ type: 'success', title: 'Équipé', text: `${item.name} est maintenant équipé.` });
    }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    height: 4px;
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #3f3f46;
    border-radius: 10px;
}
</style>
