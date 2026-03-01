<template>
  <div class="h-full overflow-y-auto custom-scrollbar">
    
    <!-- ======== HERO HEADER ======== -->
    <div class="relative px-6 md:px-12 pt-8 pb-12 overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-[#050505] to-purple-950/40 pointer-events-none"></div>
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[80px] pointer-events-none"></div>

      <div class="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
              <ShoppingBagIcon class="w-5 h-5 text-indigo-400" />
            </div>
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">Tout est gratuit en bêta</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight">Boutique</h1>
          <p class="text-zinc-500 text-sm mt-2 max-w-md">Personnalisez votre profil, boostez vos téléchargements et soutenez le projet.</p>
        </div>

        <!-- Item count -->
        <div class="flex items-center gap-4 text-xs">
          <div class="bg-zinc-900/80 border border-white/5 rounded-xl px-4 py-2.5 text-center">
            <div class="text-white font-black text-lg">{{ themeStore.inventory.length }}</div>
            <div class="text-zinc-500 font-bold">Possédés</div>
          </div>
          <div class="bg-zinc-900/80 border border-white/5 rounded-xl px-4 py-2.5 text-center">
            <div class="text-white font-black text-lg">{{ themeStore.items.length }}</div>
            <div class="text-zinc-500 font-bold">Disponibles</div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 md:px-12 pb-20 space-y-8">

      <!-- ======== NAVIGATION TABS ======== -->
      <div class="sticky top-0 z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5">
        <div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border"
              :class="activeTab === tab.id 
                ? 'bg-white text-black border-white shadow-lg shadow-white/10' 
                : 'bg-transparent text-zinc-500 hover:text-white border-transparent hover:bg-white/5'"
          >
              <span class="text-sm">{{ tab.icon }}</span>
              {{ tab.name }}
              <span v-if="tab.count" class="text-[9px] px-1.5 py-0.5 rounded-full ml-0.5"
                    :class="activeTab === tab.id ? 'bg-black/10 text-black/60' : 'bg-white/5 text-zinc-600'">
                {{ tab.count }}
              </span>
          </button>
        </div>
      </div>

      <!-- ======== COSMETICS GRID ======== -->
      <template v-if="isCosmeticTab">
        <!-- Rarity Filter -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mr-2">Rareté :</span>
          <button 
            v-for="r in rarityFilters" :key="r.id"
            @click="activeRarity = activeRarity === r.id ? null : r.id"
            class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border"
            :class="activeRarity === r.id ? r.activeClass : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400'">
            {{ r.label }}
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          <div 
              v-for="item in displayedItems" 
              :key="item.slug"
              class="group relative bg-zinc-900/40 border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60"
              :class="{ 'ring-1 ring-green-500/30': isEquipped(item) }"
          >
              <!-- Preview -->
              <div class="aspect-[4/3] relative flex items-center justify-center overflow-hidden bg-black/30">
                  <!-- Rarity indicator strip -->
                  <div class="absolute top-0 left-0 right-0 h-[2px] z-10" :class="getRarityStrip(item.rarity)"></div>
                  
                  <!-- Equipped badge -->
                  <div v-if="isEquipped(item)" class="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-green-500/20 text-green-400 border border-green-500/20 backdrop-blur-sm">
                    Équipé
                  </div>
                  <div v-if="item.is_new" class="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/20 backdrop-blur-sm" :class="{ 'left-14': isEquipped(item) }">
                    New
                  </div>
                  
                  <!-- Rarity tag -->
                  <div class="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide backdrop-blur-sm" :class="getRarityColor(item.rarity)">
                      {{ getRarityLabel(item.rarity) }}
                  </div>

                  <!-- Avatar Frame Preview -->
                  <div v-if="item.type === 'avatar_frame'" class="relative w-20 h-20 flex items-center justify-center">
                      <div v-if="item.is_css_only" class="absolute inset-0 z-20 pointer-events-none" :class="item.css_class"></div>
                      <img v-else :src="item.image_url" class="absolute inset-0 w-full h-full object-contain drop-shadow-lg z-20" />
                      <div class="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700/50">
                          <span class="text-sm font-bold text-zinc-600">You</span>
                      </div>
                  </div>

                  <!-- Banner Preview -->
                  <div v-if="item.type === 'banner'" class="absolute inset-0 overflow-hidden">
                      <div v-if="item.is_css_only" class="absolute inset-0 transition-transform duration-700 group-hover:scale-110" :class="item.css_class"></div>
                      <img v-else :src="item.image_url" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                      <div class="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent"></div>
                  </div>
                  
                  <!-- Pseudo Effect Preview -->
                  <div v-if="item.type === 'pseudo_effect'" class="flex items-center justify-center w-full h-full">
                      <span class="text-xl font-black" :class="item.css_class">Pseudo</span>
                  </div>

                  <!-- Theme Preview -->
                  <div v-if="item.type === 'global_theme'" class="w-full h-full relative" :class="item.css_class">
                      <div class="absolute inset-0 flex items-center justify-center p-4">
                          <div class="w-full h-full bg-black/30 border border-white/5 rounded-lg flex flex-col overflow-hidden shadow-xl">
                               <div class="h-4 border-b border-white/5 flex items-center px-1.5 gap-0.5 bg-white/5">
                                   <div class="w-1.5 h-1.5 rounded-full bg-red-500/40"></div>
                                   <div class="w-1.5 h-1.5 rounded-full bg-yellow-500/40"></div>
                               </div>
                               <div class="flex-1 flex">
                                   <div class="w-1/4 border-r border-white/5 bg-white/[0.02]"></div>
                                   <div class="flex-1"></div>
                               </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Info -->
              <div class="p-3">
                  <h3 class="text-white font-bold text-xs truncate">{{ item.name }}</h3>
                  <p class="text-zinc-600 text-[10px] truncate mt-0.5">{{ item.description || getTypeLabel(item.type) }}</p>
                  
                  <div class="mt-2.5">
                      <button 
                          v-if="!themeStore.isOwned(item.slug)"
                          @click="purchase(item)"
                          :disabled="buyingSlug === item.slug"
                          class="w-full py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-[11px] transition-colors disabled:opacity-50 disabled:cursor-wait"
                      >
                          {{ buyingSlug === item.slug ? '⏳' : item.price }}
                      </button>
                      <button 
                          v-else-if="isEquipped(item)"
                          @click="unequip(item)"
                          class="w-full py-1.5 rounded-lg bg-green-500/10 text-green-400 font-bold text-[11px] cursor-pointer border border-green-500/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/10 transition-colors"
                      >
                          Retirer
                      </button>
                      <button 
                          v-else
                          @click="equip(item)"
                          class="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors"
                      >
                          Équiper
                      </button>
                  </div>
              </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="displayedItems.length === 0" class="text-center py-16">
          <div class="text-3xl mb-3">🔍</div>
          <p class="text-zinc-500 text-sm font-bold">Aucun item trouvé pour ce filtre</p>
        </div>
      </template>

      <!-- ======== BOOSTERS SECTION ======== -->
      <template v-if="activeTab === 'boosters'">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-black text-white">⚡ Boosters</h2>
            <p class="text-zinc-500 text-sm mt-1">Améliorations temporaires pour votre expérience</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="boost in shopBoosters" :key="boost.id"
                 class="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 hover:border-white/10 transition-all duration-300 group">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0" :class="boost.bgClass">
                        {{ boost.icon }}
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-sm font-bold text-white truncate">{{ boost.name }}</h4>
                        <span class="text-[9px] font-bold px-2 py-0.5 rounded-full" :class="boost.tagClass">{{ boost.duration }}</span>
                    </div>
                </div>
                <p class="text-[11px] text-zinc-500 mb-4 leading-relaxed">{{ boost.desc }}</p>
                <div class="flex items-center justify-between pt-3 border-t border-white/5">
                    <span class="font-black text-white text-sm">{{ boost.price }}</span>
                    <button @click="buyItem('booster', boost.id)"
                            class="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-[11px] font-bold rounded-lg transition-colors">
                        Activer
                    </button>
                </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ======== CLOUD SAVE SECTION ======== -->
      <template v-if="activeTab === 'cloud'">
        <div class="max-w-lg mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-black text-white">💾 Cloud Save</h2>
            <p class="text-zinc-500 text-sm mt-1">Protégez vos sauvegardes de jeux dans le cloud</p>
          </div>
          <div class="bg-zinc-900/40 border border-white/[0.04] rounded-2xl overflow-hidden">
              <div v-for="(slot, idx) in cloudSlots" :key="slot.id"
                   class="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                   :class="{ 'border-t border-white/5': idx > 0 }">
                  <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-black">
                          +{{ slot.qty }}
                      </div>
                      <div>
                          <span class="text-sm font-bold text-white">{{ slot.label }}</span>
                          <p class="text-[10px] text-zinc-600">{{ slot.sub }}</p>
                      </div>
                  </div>
                  <div class="flex items-center gap-3">
                      <span class="text-white font-black text-sm">{{ slot.price }}</span>
                      <button @click="buyItem('cloud', slot.id)"
                              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors">
                          Acheter
                      </button>
                  </div>
              </div>
          </div>
        </div>
      </template>

      <!-- ======== GIFTS SECTION ======== -->
      <template v-if="activeTab === 'gifts'">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-black text-white">🎁 Offrir</h2>
            <p class="text-zinc-500 text-sm mt-1">Faites plaisir à un ami</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div v-for="gift in giftCards" :key="gift.id"
                 class="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-6 hover:border-pink-500/20 transition-all duration-300 text-center group">
                <div class="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl" :class="gift.bgClass">
                    {{ gift.icon }}
                </div>
                <h4 class="text-sm font-bold text-white mb-1">{{ gift.name }}</h4>
                <p class="text-[10px] text-zinc-600 mb-4">{{ gift.desc }}</p>
                <div class="text-white font-black text-lg mb-4">{{ gift.price }}</div>
                <button @click="buyItem('gift', gift.id)"
                        class="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all">
                    Offrir
                </button>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useThemeStore, type ShopItem } from '../store/theme';
import { ShoppingBagIcon } from '@heroicons/vue/24/outline';
import { useNotification } from '@kyvg/vue3-notification';

const themeStore = useThemeStore();
const { notify } = useNotification();

const activeTab = ref<string>('all');
const activeRarity = ref<string | null>(null);
const buyingSlug = ref<string | null>(null);

// ─── Load data from API on mount ───
onMounted(async () => {
    await themeStore.fetchItems();
    // These may fail if not logged in — that's ok
    themeStore.fetchInventory();
    themeStore.fetchEquipment();
});

// ---- Tabs ----
const cosmeticTabIds = ['all', 'avatar_frame', 'banner', 'pseudo_effect', 'global_theme'];
const isCosmeticTab = computed(() => cosmeticTabIds.includes(activeTab.value));

const countByType = (type: string) => themeStore.items.filter(i => i.type === type).length;

const tabs = computed(() => [
    { id: 'all', name: 'Tout', icon: '🎨', count: themeStore.items.length },
    { id: 'avatar_frame', name: 'Cadres', icon: '🖼️', count: countByType('avatar_frame') },
    { id: 'banner', name: 'Bannières', icon: '🏳️', count: countByType('banner') },
    { id: 'pseudo_effect', name: 'Effets', icon: '✨', count: countByType('pseudo_effect') },
    { id: 'global_theme', name: 'Thèmes', icon: '🎭', count: countByType('global_theme') },
    { id: 'boosters', name: 'Boosters', icon: '⚡', count: null },
    { id: 'cloud', name: 'Cloud Save', icon: '💾', count: null },
    { id: 'gifts', name: 'Offrir', icon: '🎁', count: null },
]);

// ---- Rarity ----
const rarityFilters = [
    { id: 'common', label: 'Commun', activeClass: 'bg-zinc-800 border-zinc-600 text-zinc-300' },
    { id: 'rare', label: 'Rare', activeClass: 'bg-blue-900/40 border-blue-500/30 text-blue-400' },
    { id: 'epic', label: 'Épique', activeClass: 'bg-purple-900/40 border-purple-500/30 text-purple-400' },
    { id: 'legendary', label: 'Légendaire', activeClass: 'bg-amber-900/40 border-amber-500/30 text-amber-400' },
    { id: 'mythic', label: 'Mythique', activeClass: 'bg-red-900/40 border-red-500/30 text-red-400' },
];

// ---- Cosmetics ----
const filteredItems = computed(() => {
    let items = activeTab.value === 'all' 
        ? themeStore.items 
        : themeStore.items.filter(i => i.type === activeTab.value);
    if (activeRarity.value) {
        items = items.filter(i => i.rarity === activeRarity.value);
    }
    return items;
});

const displayedItems = computed(() => filteredItems.value);

// ---- Boosters ----
const shopBoosters: any[] = [];

// ---- Cloud Save ----
const cloudSlots: any[] = [];

// ---- Gift Cards ----
const giftCards: any[] = [];

// ---- Helpers ----
function getRarityColor(rarity: string) {
    const map: Record<string, string> = {
        common: 'bg-zinc-800/80 text-zinc-500',
        rare: 'bg-blue-900/60 text-blue-400',
        epic: 'bg-purple-900/60 text-purple-400',
        legendary: 'bg-amber-900/60 text-amber-400',
        mythic: 'bg-red-900/60 text-red-400 animate-pulse',
    };
    return map[rarity] || map.common;
}

function getRarityStrip(rarity: string) {
    const map: Record<string, string> = {
        common: 'bg-zinc-700',
        rare: 'bg-blue-500',
        epic: 'bg-purple-500',
        legendary: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        mythic: 'bg-gradient-to-r from-red-500 via-pink-500 to-red-500 animate-pulse',
    };
    return map[rarity] || map.common;
}

function getRarityLabel(rarity: string) {
    const map: Record<string, string> = { common: 'C', rare: 'R', epic: 'É', legendary: 'L', mythic: 'M' };
    return map[rarity] || '?';
}

function getTypeLabel(type: string) {
    const map: Record<string, string> = {
        avatar_frame: 'Cadre de profil',
        banner: 'Bannière de profil',
        pseudo_effect: 'Effet de pseudo',
        global_theme: 'Thème global',
    };
    return map[type] || 'Cosmétique';
}

function isEquipped(item: ShopItem) {
    if (item.type === 'avatar_frame') return themeStore.equipped.avatar_frame === item.slug;
    if (item.type === 'banner') return themeStore.equipped.banner === item.slug;
    if (item.type === 'pseudo_effect') return themeStore.equipped.pseudo_effect === item.slug;
    if (item.type === 'global_theme') return themeStore.equipped.global_theme === item.slug;
    return false;
}

async function purchase(item: ShopItem) {
    buyingSlug.value = item.slug;
    try {
        const checkoutUrl = await themeStore.buyItem(item.slug);
        if (checkoutUrl) {
            if ((window as any).electronAPI) {
                (window as any).electronAPI.send('open-external', checkoutUrl);
            } else {
                window.open(checkoutUrl, '_blank');
            }
            notify({ type: 'success', title: 'Redirection', text: 'Finalisez votre achat dans le navigateur.' });
        } else {
            notify({ type: 'error', title: 'Erreur', text: themeStore.error || 'Impossible de créer le paiement.' });
        }
    } catch (err: any) {
        notify({ type: 'error', title: 'Erreur', text: err.message || 'Impossible de créer le paiement.' });
    } finally {
        buyingSlug.value = null;
    }
}

async function equip(item: ShopItem) {
    const ok = await themeStore.equipItem(item.slug);
    if (ok) {
        notify({ type: 'success', title: 'Équipé', text: `${item.name} est maintenant actif.` });
    } else {
        notify({ type: 'error', title: 'Erreur', text: "Impossible d'équiper cet item." });
    }
}

async function unequip(item: ShopItem) {
    if (item.type === 'global_theme') return;
    const ok = await themeStore.unequipItem(item.type as 'avatar_frame' | 'banner' | 'pseudo_effect');
    if (ok) {
        notify({ type: 'info', title: 'Retiré', text: `${item.name} a été retiré.` });
    }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    height: 4px;
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
</style>
