import { defineStore } from 'pinia';
import { useFetch } from '../utils/useFetch';
import { API_CONFIG } from '../config/api';
import router from '../router';

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
    };
  }
}

export const useMainStore = defineStore('main', {
  state: () => ({
    user: null as User | null,
    tokens: null as { access: string; refresh: string } | null,
    favorites: [] as string[],
    library: [] as GameInstalled[],
    _isSyncing: false,
    isOfflineMode: false,
  }),
  persist: {
    paths: ['user', 'tokens', 'favorites'],
  },
  getters: {
    getTokens: (state) => state.tokens,
    getUser: (state) => state.user,
    isAuthenticated: (state) => (state.user && state.tokens ? true : false),
    getFavorites: (state) => state.favorites,
    getGameInLibrary: (state) => (gameID: string) => state.library.find((game) => game.id === gameID),
  },
  actions: {
    setTokens(tokens: { access: string; refresh: string }) {
      this.tokens = tokens;
      window.electronAPI?.send('auth-token-refresh', tokens.access);
    },
    login(data: { user: any; tokens: any }) {
      this.user = data.user;
      this.tokens = data.tokens;
      this.isOfflineMode = false;
      window.electronAPI?.send('auth-success', data.tokens.access);
    },
    logout() {
      this.user = null;
      this.tokens = null;
      this.favorites = [];
      this.isOfflineMode = false;
      // Rediriger immédiatement vers la connexion quand la session meurt (token/refresh expirés),
      // même sans navigation — sinon l'utilisateur reste bloqué sur une page pleine de 401.
      try {
        if (router.currentRoute.value.name !== 'Login') {
          router.push({ name: 'Login' }).catch(() => {});
        }
      } catch (e) { /* routeur pas encore prêt : ignore */ }
    },
    /**
     * Rafraîchit le token d'accès à partir du refresh token, SANS déconnexion.
     * Appelé périodiquement (App.vue) pour garder la session vivante même si
     * l'utilisateur ne fait aucun appel API (page téléchargements, etc.).
     * Renvoie true si le token a été régénéré.
     */
    async refreshTokens(): Promise<boolean> {
      if (!this.tokens?.refresh) return false;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: this.tokens.refresh }),
        });
        if (res.ok) {
          const data = await res.json();
          // SimpleJWT renvoie { access } (et { refresh } si la rotation est activée)
          this.setTokens({
            access: data.access,
            refresh: data.refresh || this.tokens.refresh,
          });
          this.isOfflineMode = false;
          return true;
        }
        // refresh invalide/expiré : on ne déconnecte pas ici, la reconnexion se fera si besoin
        return false;
      } catch (e) {
        // Erreur réseau : ne pas déconnecter (mode hors-ligne possible)
        return false;
      }
    },
    async verifyToken() {
      if (!this.tokens) return false;
      try {
        await useFetch('/auth/api/token/verify/', 'POST', { token: this.tokens.access });
        this.isOfflineMode = false;
        return true;
      } catch (e) {
        // Token invalide, mais peut-être refreshable ailleurs
        return false;
      }
    },
    async fetchUser() {
      if (!this.tokens) return;
      try {
        // Force fresh fetch
        const user = await useFetch('/auth/api/user/me');
        if (user) {
            // Normalize ID: API might return pk, _id
            if (!user.id && user.pk) user.id = user.pk;
            if (!user.id && user._id) user.id = user._id;

            if (!user.id) console.error('❌ CRITICAL: User object still missing ID after API fix', user);
        }
        
        this.user = user;
        this.isOfflineMode = false;
        return user;
      } catch (e) {
        console.error('Failed to fetch user', e);
        // If we have a user and this is a network error, assume offline mode
        if (this.user) {
            console.warn('⚠️ Unable to fetch user, falling back to cached user (Offline Mode)');
            this.isOfflineMode = true;
            return this.user;
        }
        throw e;
      }
    },
    async updateProfile(data: any) {
      try {
        const updatedUser = await useFetch('/auth/api/user/me/change', 'PUT', data);
        if (updatedUser) {
            this.user = updatedUser;
            // Double check by re-fetching
            await this.fetchUser();
            return true;
        }
        return false;
      } catch (error) {
        console.error('Update profile failed', error);
        return false;
      }
    },
    async uploadProfilePicture(file: File) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const result = await useFetch('/auth/api/user/me/picture', 'POST', formData);
            if (result && result.image_url) {
                // Update local user object
                if (this.user) {
                    this.user.profile_picture = result.image_url;
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Upload profile picture failed', error);
            return false;
        }
    },
    async deleteAccount() {
        try {
            await useFetch('/auth/api/user/me/delete', 'DELETE');
            this.logout();
            return true;
        } catch (error) {
            console.error('Delete account failed', error);
            return false;
        }
    },
    async changePassword(data: { old_password: string; new_password: string }) {
        try {
            const response = await useFetch('/auth/api/user/me/reset_password', 'POST', data);
            return { success: true, message: response?.message || "Mot de passe mis à jour." };
        } catch (error: any) {
            console.error('Change password failed', error);
            // useFetch returns { data: { error: "..." } } on 400
            const errorMessage = error?.data?.error || error?.data?.detail || "Ancien mot de passe incorrect.";
            return { success: false, message: errorMessage };
        }
    },
    async submitSuggestion(title: string, details: string) {
        try {
            const response = await useFetch('/auth/api/user/me/suggestion', 'POST', { title, details });
            return { success: true, message: response?.message || "Suggestion envoyée avec succès." };
        } catch (error: any) {
            console.error('Submit suggestion failed', error);
            
            // Extract DRF validation errors
            // DRF often returns { "field": ["error message"] } or { "details": ["..."] }
            let errorMessage = "Détails manquants ou erreur serveur.";
            const data = error?.data;
            if (data) {
                 if (Array.isArray(data.details) && data.details.length > 0) {
                     errorMessage = data.details[0];
                 } else if (data.detail) {
                     errorMessage = data.detail;
                 } else if (typeof data === 'object') {
                     // Get the first error message from the object keys
                     const firstKey = Object.keys(data)[0];
                     if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
                         errorMessage = data[firstKey][0];
                     }
                 }
            }

            return { success: false, message: errorMessage };
        }
    },
    async fetchFavorites() {
        if (!this.tokens) return;
        try {
            const result = await useFetch('/auth/api/user/me/fav');

            // Assuming result is a list of games or IDs. 
            // If it's a list of objects with 'id', map it.
            if (Array.isArray(result)) {
                this.favorites = result.map((item: any) => typeof item === 'string' ? item : item.id);
            } else if (result && Array.isArray(result.favorites)) {
                // Handle potential object wrapper { favorites: [...] }
                this.favorites = result.favorites.map((item: any) => typeof item === 'string' ? item : item.id);
            } else if (result && Array.isArray(result.favorite_game_ids)) {
                // Handle actual API response { favorite_game_ids: [...] }
                this.favorites = result.favorite_game_ids;
            }
        } catch (e) {
            console.error('Failed to fetch favorites', e);
        }
    },

    async toggleFavorite(gameID: string | number) {
      if (!this.isAuthenticated) return false;
      try {
        const id = Number(gameID);
        const indexStr = this.favorites.findIndex(f => String(f) === String(id));
        
        if (indexStr !== -1) {
          // Remove from favorites
          await useFetch(`/api/app/games/${gameID}/unfavorite/`, 'POST');
          this.favorites.splice(indexStr, 1);
        } else {
          // Add to favorites
          await useFetch(`/api/app/games/${gameID}/favorite/`, 'POST');
          this.favorites.push(id as never);
        }
        
        // Background sync to be sure
        this.fetchFavorites(); 
        return true;
      } catch (e) {
        console.error('Failed to toggle favorite', e);
        return false;
      }
    },
    addLibrary(game: GameInstalled) {
      if (!this.library.find((lib) => lib.id === game.id)) {
        this.library.push(game);
      }
    },
    removeLibrary(id: string) {
      this.library = this.library.filter((lib) => lib.id !== id);
    },
    initLibrary(library: string[] | GameInstalled[]) {
      this.library = library as GameInstalled[];
    },
    async syncLibraryFromFile() {
      try {
        if (window.electronAPI) {
          const downloadsData = await window.electronAPI.invoke('read-downloads');
          
          if (downloadsData && downloadsData !== '[]' && downloadsData !== '') {
            const games = JSON.parse(downloadsData);
            this.library = [];
            games.forEach((game: GameInstalled) => {
              this.addLibrary(game);
            });

          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation de la bibliothèque:', error);
      }
    },
    async forceLibrarySync() {
      // Protection contre les appels multiples
      if (this._isSyncing) {

        return false;
      }
      
      this._isSyncing = true;
      
      try {
        if (window.electronAPI) {
          const downloadsData = await window.electronAPI.invoke('force-library-sync');
          
          if (downloadsData && downloadsData !== '[]' && downloadsData !== '') {
            const games = JSON.parse(downloadsData);
            this.library = [];
            games.forEach((game: GameInstalled) => {
              this.addLibrary(game);
            });

            return true;
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation forcée de la bibliothèque:', error);
      } finally {
        this._isSyncing = false;
      }
      return false;
    },
  },
});
