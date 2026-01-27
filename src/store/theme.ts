import { defineStore } from 'pinia';

export interface ShopItem {
    id: string;
    type: 'avatar_frame' | 'banner' | 'global_theme' | 'pseudo_effect';
    name: string;
    description?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    image?: string; // Preview image
    isCssOnly?: boolean; // If true, rendering is done via CSS classes
    cssClass?: string; // The actual class to apply
    price: number; 
    isNew?: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
    // --- AVATAR FRAMES (CSS BASED) ---
    {
        id: 'frame_neon_blue',
        type: 'avatar_frame',
        name: 'Néon Pulse',
        description: 'Un anneau néon bleu qui pulse.',
        rarity: 'common',
        isCssOnly: true,
        cssClass: 'frame-neon-blue',
        price: 0
    },
    {
        id: 'frame_gold_halo',
        type: 'avatar_frame',
        name: 'Halo Doré',
        description: 'Une aura divine pour les vrais champions.',
        rarity: 'legendary',
        isCssOnly: true,
        cssClass: 'frame-gold-halo',
        price: 0
    },
    {
        id: 'frame_rgb_spin',
        type: 'avatar_frame',
        name: 'RGB Spin',
        description: 'Le classique gamer. Ça tourne, ça brille.',
        rarity: 'epic',
        isCssOnly: true,
        cssClass: 'frame-rgb-spin',
        price: 0
    },
    {
        id: 'frame_glitch',
        type: 'avatar_frame',
        name: 'Glitch System',
        description: 'Erreur dans la matrice.',
        rarity: 'rare',
        isCssOnly: true,
        cssClass: 'frame-glitch',
        price: 0
    },
    {
        id: 'frame_fire_aura',
        type: 'avatar_frame',
        name: 'Aura de Feu',
        description: 'Chaud devant !',
        rarity: 'epic',
        isCssOnly: true,
        cssClass: 'frame-fire-aura',
        price: 0
    },
    {
        id: 'frame_cyber_tech',
        type: 'avatar_frame',
        name: 'Cyber Tech',
        description: 'Interface futuriste.',
        rarity: 'rare',
        isCssOnly: true,
        cssClass: 'frame-cyber',
        price: 0
    },
    {
        id: 'frame_void',
        type: 'avatar_frame',
        name: 'Néant Violet',
        description: 'L\'obscurité vous appelle.',
        rarity: 'legendary',
        isCssOnly: true,
        cssClass: 'frame-void',
        price: 0
    },
    {
        id: 'frame_toxic',
        type: 'avatar_frame',
        name: 'Déchets Toxiques',
        description: 'Radioactif.',
        rarity: 'common',
        isCssOnly: true,
        cssClass: 'frame-toxic',
        price: 0
    },

    // --- PSEUDO EFFECTS ---
    {
        id: 'effect_glitch_text',
        type: 'pseudo_effect',
        name: 'Nom Glitch',
        description: 'Votre pseudo est instable.',
        rarity: 'rare',
        isCssOnly: true,
        cssClass: 'text-effect-glitch',
        price: 0
    },
    {
        id: 'effect_fire_text',
        type: 'pseudo_effect',
        name: 'Nom Enflammé',
        description: 'Ça brûle !',
        rarity: 'epic',
        isCssOnly: true,
        cssClass: 'text-effect-fire',
        price: 0
    },
    {
        id: 'effect_rainbow_text',
        type: 'pseudo_effect',
        name: 'Nom RGB',
        description: 'Plus de couleurs = Plus de skill.',
        rarity: 'legendary',
        isCssOnly: true,
        cssClass: 'text-effect-rainbow',
        price: 0
    },
    {
        id: 'effect_neon_glow',
        type: 'pseudo_effect',
        name: 'Glow Néon',
        description: 'Brillez dans le noir.',
        rarity: 'common',
        isCssOnly: true,
        cssClass: 'text-effect-neon',
        price: 0
    },
    {
        id: 'effect_ghost',
        type: 'pseudo_effect',
        name: 'Fantôme',
        description: 'Effrayant.',
        rarity: 'rare',
        isCssOnly: true,
        cssClass: 'text-effect-ghost',
        price: 0
    },

    // --- BANNERS (High Quality Unsplash) ---
    {
        id: 'banner_cyberpunk',
        type: 'banner',
        name: 'Night City',
        rarity: 'epic',
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop', 
        price: 0
    },
    {
        id: 'banner_galaxy',
        type: 'banner',
        name: 'Deep Space',
        rarity: 'legendary',
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2111&auto=format&fit=crop',
        price: 0
    },
    {
        id: 'banner_matrix',
        type: 'banner',
        name: 'Digital Rain',
        rarity: 'rare',
        image: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=2070&auto=format&fit=crop',
        price: 0
    },
    {
        id: 'banner_abstract_dark',
        type: 'banner',
        name: 'Abstract Dark',
        rarity: 'common',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop',
        price: 0
    },
    {
        id: 'banner_japan',
        type: 'banner',
        name: 'Kyoto Vibes',
        rarity: 'epic',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop',
        price: 0
    },
    {
        id: 'banner_gaming_setup',
        type: 'banner',
        name: 'Setup Dream',
        rarity: 'common',
        image: 'https://images.unsplash.com/photo-1598550476439-c92309798087?q=80&w=2070&auto=format&fit=crop',
        price: 0
    },
    {
        id: 'banner_fire',
        type: 'banner',
        name: 'Inferno',
        rarity: 'rare',
        image: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2074&auto=format&fit=crop',
        price: 0
    },
    {
        id: 'banner_ice',
        type: 'banner',
        name: 'Glacier',
        rarity: 'rare',
        image: 'https://images.unsplash.com/photo-1518112390430-f4ab02e9c2c8?q=80&w=2081&auto=format&fit=crop',
        price: 0
    },

    // --- MERYOUL EXCLUSIVES ---
    {
        id: 'frame_meryoul_spin',
        type: 'avatar_frame',
        name: 'Anneau Meryoul',
        description: 'L\'anneau légendaire qui tourne à l\'envers.',
        rarity: 'mythic',
        isCssOnly: true,
        cssClass: 'animate-spin-slow-reverse ring-4 ring-offset-2 ring-offset-black ring-red-500 rounded-full',
        price: 0
    },
    {
        id: 'effect_meryoul_glitch',
        type: 'pseudo_effect',
        name: 'Glitch Meryoul',
        description: 'Instabilité critique.',
        rarity: 'mythic',
        isCssOnly: true,
        cssClass: 'glitch-text',
        price: 0
    },

    // --- GLOBAL THEMES ---
    {
        id: 'theme_default',
        type: 'global_theme',
        name: 'Défaut (Clean)',
        rarity: 'common',
        isCssOnly: true,
        cssClass: 'bg-gradient-to-br from-[#050505] to-[#151515]',
        price: 0
    },
    {
        id: 'theme_cyberpunk',
        type: 'global_theme',
        name: 'Cyberpunk City',
        rarity: 'epic',
        isCssOnly: true,
        cssClass: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-[#050505] to-black',
        price: 0
    },
    {
        id: 'theme_forest',
        type: 'global_theme',
        name: 'Forêt Mystique',
        rarity: 'rare',
        isCssOnly: true,
        cssClass: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-[#050505] to-black',
        price: 0
    },
    {
        id: 'theme_royal',
        type: 'global_theme',
        name: 'Luxe Royal',
        rarity: 'legendary',
        isCssOnly: true,
        cssClass: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/20 via-[#050505] to-black',
        price: 0
    },
    {
        id: 'theme_ocean',
        type: 'global_theme',
        name: 'Océan Profond',
        rarity: 'rare',
        isCssOnly: true,
        cssClass: 'bg-gradient-to-b from-blue-950/40 to-[#050505]',
        price: 0
    },
    {
        id: 'theme_midnight',
        type: 'global_theme',
        name: 'Minuit Absolu',
        rarity: 'common',
        isCssOnly: true,
        cssClass: 'bg-black',
        price: 0
    }
];

export const useThemeStore = defineStore('theme', {
    state: () => ({
        inventory: [] as string[],
        equipped: {
            avatar_frame: null as string | null,
            banner: null as string | null,
            pseudo_effect: null as string | null,
            global_theme: 'theme_default'
        }
    }),
    persist: {
        paths: ['inventory', 'equipped']
    },
    getters: {
        items: () => SHOP_ITEMS,
        isOwned: (state) => (itemId: string) => state.inventory.includes(itemId),
        getEquippedFrame: (state) => SHOP_ITEMS.find(i => i.id === state.equipped.avatar_frame),
        getEquippedBanner: (state) => SHOP_ITEMS.find(i => i.id === state.equipped.banner),
        getEquippedPseudoEffect: (state) => SHOP_ITEMS.find(i => i.id === state.equipped.pseudo_effect),
        getItem: (state) => (itemId: string) => SHOP_ITEMS.find(i => i.id === itemId)
    },
    actions: {
        itemExists(itemId: string) {
            return SHOP_ITEMS.some(i => i.id === itemId);
        },
        purchaseItem(itemId: string) {
            if (!this.itemExists(itemId)) return false;
            if (this.inventory.includes(itemId)) return true;
            this.inventory.push(itemId);
            return true;
        },
        equipItem(itemId: string) {
            if (!this.inventory.includes(itemId)) return false;
            const item = this.getItem(itemId);
            if (!item) return false;

            if (item.type === 'avatar_frame') this.equipped.avatar_frame = itemId;
            if (item.type === 'banner') this.equipped.banner = itemId;
            if (item.type === 'pseudo_effect') this.equipped.pseudo_effect = itemId;
            if (item.type === 'global_theme') this.equipped.global_theme = itemId;
            return true;
        },
        unequipItem(type: 'avatar_frame' | 'banner' | 'pseudo_effect') {
            if (type === 'avatar_frame') this.equipped.avatar_frame = null;
            if (type === 'banner') this.equipped.banner = null;
            if (type === 'pseudo_effect') this.equipped.pseudo_effect = null;
        }
    }
});
