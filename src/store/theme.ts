import { defineStore } from 'pinia';
import { JeuxCracksAPI } from '../services/api';

export interface ShopItem {
    slug: string;
    type: 'avatar_frame' | 'banner' | 'global_theme' | 'pseudo_effect';
    name: string;
    description?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    price: string;          // "2.99€" — formatted by backend
    price_cents: number;    // 299
    image_url?: string;
    is_css_only?: boolean;
    css_class?: string;
    is_new?: boolean;
    owned?: boolean;        // true if current user owns this
}

export const useThemeStore = defineStore('theme', {
    state: () => ({
        items: [] as ShopItem[],
        inventory: [] as string[],   // slugs of owned items
        equipped: {
            avatar_frame: null as string | null,
            banner: null as string | null,
            pseudo_effect: null as string | null,
            global_theme: null as string | null,
        },
        loading: false,
        error: null as string | null,
    }),
    persist: {
        paths: ['inventory', 'equipped']
    },
    getters: {
        isOwned: (state) => (slug: string) => state.inventory.includes(slug),
        getEquippedFrame: (state) => state.items.find(i => i.slug === state.equipped.avatar_frame),
        getEquippedBanner: (state) => state.items.find(i => i.slug === state.equipped.banner),
        getEquippedPseudoEffect: (state) => state.items.find(i => i.slug === state.equipped.pseudo_effect),
        getItem: (state) => (slug: string) => state.items.find(i => i.slug === slug),
    },
    actions: {
        // ─── Fetch catalogue ───
        async fetchItems() {
            this.loading = true;
            this.error = null;
            try {
                const data = await JeuxCracksAPI.getShopItems();
                this.items = Array.isArray(data) ? data : [];
                // Sync owned flags into inventory
                this.items.forEach(item => {
                    if (item.owned && !this.inventory.includes(item.slug)) {
                        this.inventory.push(item.slug);
                    }
                });
            } catch (err: any) {
                this.error = err.message || 'Erreur chargement boutique';
            } finally {
                this.loading = false;
            }
        },

        // ─── Fetch inventory ───
        async fetchInventory() {
            try {
                const data = await JeuxCracksAPI.getInventory();
                if (Array.isArray(data)) {
                    this.inventory = data.map((entry: any) => entry.item?.slug || entry.slug).filter(Boolean);
                }
            } catch {
                // silent — keep local cache
            }
        },

        // ─── Fetch equipment ───
        async fetchEquipment() {
            try {
                const data = await JeuxCracksAPI.getEquipment();
                if (data) {
                    this.equipped.avatar_frame = data.avatar_frame || null;
                    this.equipped.banner = data.banner || null;
                    this.equipped.pseudo_effect = data.pseudo_effect || null;
                    this.equipped.global_theme = data.global_theme || null;
                }
            } catch {
                // silent — keep local cache
            }
        },

        // ─── Buy item (Stripe Checkout) ───
        async buyItem(slug: string): Promise<string | null> {
            try {
                const { checkout_url } = await JeuxCracksAPI.shopBuyItem(slug);
                return checkout_url;
            } catch (err: any) {
                this.error = err.message || 'Erreur paiement';
                return null;
            }
        },

        // ─── Equip item (API) ───
        async equipItem(slug: string): Promise<boolean> {
            try {
                await JeuxCracksAPI.shopEquipItem(slug);
                const item = this.getItem(slug);
                if (item) {
                    if (item.type === 'avatar_frame') this.equipped.avatar_frame = slug;
                    if (item.type === 'banner') this.equipped.banner = slug;
                    if (item.type === 'pseudo_effect') this.equipped.pseudo_effect = slug;
                    if (item.type === 'global_theme') this.equipped.global_theme = slug;
                }
                return true;
            } catch {
                return false;
            }
        },

        // ─── Unequip item (API) ───
        async unequipItem(type: 'avatar_frame' | 'banner' | 'pseudo_effect' | 'global_theme'): Promise<boolean> {
            try {
                await JeuxCracksAPI.shopUnequipItem(type);
                if (type === 'avatar_frame') this.equipped.avatar_frame = null;
                if (type === 'banner') this.equipped.banner = null;
                if (type === 'pseudo_effect') this.equipped.pseudo_effect = null;
                if (type === 'global_theme') this.equipped.global_theme = null;
                return true;
            } catch {
                return false;
            }
        },
    }
});
