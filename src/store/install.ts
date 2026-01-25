import { defineStore } from 'pinia';
import { useFetch } from '../utils/useFetch';

interface Game {
  id: string;
  steam_id?: string;
  title: string;
  descriptionShort?: string;
  description?: string;
  header?: string;
  video?: string;
  categories?: string[];
  views?: number;
  like?: number;
  favorite?: number;
  isOnline?: boolean;
  releaseDate?: string;
  publishedDate?: string;
  lastModified?: string;
  download?: {
    torrent?: string | null;
    direct?: string | null;
  };
  requirements?: {
    minimum?: any;
    recommended?: any;
  };
  monetization?: any;
  source?: any[];
}

interface Install {
  id: number; // or string? Note: interface says number, but game IDs are strings usually? User store defines id as number?
  // Checking existing code: id: number. But Game has id: string.
  // In App.vue: window.electronAPI.on('find-many-exe', ..., gameID, ...)
  // In installService: newInstall.id = gameData.id.
  // If gameData.id is string, Install.id should be string.
  // Existing code has id: number. Likely a typing mismatch or legacy.
  // I will check if I should fix this type too.
  // For now, I'll stick to adding progress/message.
  title: string;
  credit: string;
  path: string;
  finished: boolean;
  canceled: boolean;
  game?: Game;
  progress?: number;
  message?: string;
}

export const useInstallStore = defineStore('install', {
  state: () => ({
    installs: [] as Install[],
  }),
  persist: false,
  getters: {
    getNbInstalls: (state) => state.installs.length,
    getInstallsPending: (state) => state.installs.filter((dl: Install) => !dl.finished),
    getInstallByTitle: (state) => (title: string) => state.installs.find((dl: Install) => dl.title === title),
    getInstall: (state) => (id: any) => state.installs.find((dl: Install) => dl.id == id),
    getIndexInstallByTitle: (state) => (title: string) => state.installs.findIndex((dl: Install) => dl.title === title),
    getIndexInstall: (state) => (id: any) => state.installs.findIndex((dl: Install) => dl.id == id),
    isInstallExist: (state) => (id: any) => state.installs.some((dl: Install) => dl.id == id),
    isFinished: (state) => (id: any) =>
      state.installs.some((dl: Install) => dl.id == id)
        ? state.installs[state.installs.findIndex((dl: Install) => dl.id == id)].finished
        : false,
  },
  actions: {
    updateProgress(id: any, progress: number, message: string) {
        const index = this.installs.findIndex((i) => i.id == id);
        if (index !== -1) {
            this.installs[index].progress = progress;
            this.installs[index].message = message;
        }
    },
    addInstall(install: Install) {
      this.installs.push(install);
      // Les données du jeu sont maintenant incluses dans l'événement install-start
      // this.fetchGameData(install.id);
    },
    removeInstallByTitle(title: string) {
      const index = this.getIndexInstallByTitle(title);
      this.installs.splice(index, 1);
    },
    removeInstallById(id: number) {
      const index = this.installs.findIndex((dl: Install) => dl.id === id);
      this.installs.splice(index, 1);
    },
    clearInstalls() {
      this.installs = [];
    },
    updateInstall(install: Install, title: string) {
      const index = this.getIndexInstallByTitle(title);
      if (index === -1) return;
      this.installs[index] = install;
    },
    toggleCancel(title: string) {
      const index = this.getIndexInstallByTitle(title);
      this.installs[index].canceled = !this.installs[index].canceled;
    },
    setFinished(id: number) {
      const index = this.getIndexInstall(id);
      this.installs[index].finished = true;
    },
    async fetchGameData(id: number) {
      try {
        const game = await useFetch(`/Cracks/api/game/?format=json&id=${id}`);
      const index = this.getIndexInstall(id);
        if (index !== -1 && this.installs[index]) {
          // Traiter l'image avec getImageUrl
          const getImageUrl = (imagePath: string | undefined): string => {
            if (!imagePath) return '/assets/placeholder.webp';
            
            // Si c'est déjà une URL complète
            if (imagePath.startsWith('http')) {
              return imagePath;
            }
            
            // Si c'est un chemin relatif, ajouter le domaine
            if (imagePath.startsWith('/')) {
              return `https://api.jeuxcracks.fr${imagePath}`;
            }
            
            // Sinon, retourner l'image de fallback
            return '/assets/placeholder.webp';
          };
          
          // Traiter l'image du jeu
          const processedGame = {
            ...game,
            header: getImageUrl(game.header)
          };
          
          this.installs[index].game = processedGame;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données du jeu:', error);
      }
    },
  },
});
