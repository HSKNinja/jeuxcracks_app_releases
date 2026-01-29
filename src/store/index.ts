import { defineStore } from 'pinia';
import { useFetch } from '../utils/useFetch';

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
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
    },
    login(data: { user: any; tokens: any }) {
      this.user = data.user;
      this.tokens = data.tokens;
    },
    logout() {
      this.user = null;
      this.tokens = null;
      this.favorites = [];
    },
    async verifyToken() {
      if (!this.tokens) return false;
      try {
        await useFetch('/auth/api/token/verify/', 'POST', { token: this.tokens.access });
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
        console.log('👤 fetchUser raw response:', user); 
        if (user) {
            // Normalize ID: API might return pk, _id
            if (!user.id && user.pk) user.id = user.pk;
            if (!user.id && user._id) user.id = user._id;

            if (!user.id) console.error('❌ CRITICAL: User object still missing ID after API fix', user);
            else console.log('✅ User ID received:', user.id);
        }
        
        this.user = user;
        return user;
      } catch (e) {
        console.error('Failed to fetch user', e);
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
    async fetchFavorites() {
        if (!this.tokens) return;
        try {
            const result = await useFetch('/auth/api/user/me/fav');
            console.log('Favorites from API:', result);
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
    async submitSuggestion(title: string, content: string) {
        try {
            await useFetch('/auth/api/user/me/sug', 'POST', { title, content });
            return true;
        } catch (e) {
            console.error('Failed to submit suggestion', e);
            return false;
        }
    },
    async toggleFavorite(gameID: string | number) {
      if (!this.isAuthenticated) return false;
      try {
        await useFetch(`/Cracks/api/toggle_favorite/${gameID}/`, 'POST');
        // Update local state intelligently to avoid full refetch delay
        const id = Number(gameID);
        const index = this.favorites.indexOf(id as never); // Handle string/number mismatch
        
        // If strict match fails, try string conversion check
        const indexStr = this.favorites.findIndex(f => String(f) === String(id));
        
        if (indexStr !== -1) {
            this.favorites.splice(indexStr, 1);
        } else {
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
            console.log('📚 Bibliothèque synchronisée avec', games.length, 'jeux');
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation de la bibliothèque:', error);
      }
    },
    async forceLibrarySync() {
      // Protection contre les appels multiples
      if (this._isSyncing) {
        console.log('📚 Synchronisation déjà en cours, attente...');
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
            console.log('📚 Bibliothèque synchronisée forcément avec', games.length, 'jeux');
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
