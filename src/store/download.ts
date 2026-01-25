import { defineStore } from 'pinia';

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

interface Download {
  gameID: string;
  title: string;
  path: string;
  downloadType: string;
  paused: boolean;
  data: any;
  game?: Game;
  chartData?: any;
}

export const useDownloadStore = defineStore('download', {
  state: () => ({
    downloads: [] as Download[],
  }),
  persist: false,
  getters: {
    getNbDownloads: (state) => state.downloads.length,
    getDownloadByTitle: (state) => (title: string) => state.downloads.find((dl: Download) => dl.title === title),
    getDownloadById: (state) => (id: string) => state.downloads.find((dl: Download) => dl.gameID === id),
    getIndexDownloadByTitle: (state) => (title: string) => state.downloads.findIndex((dl: Download) => dl.title === title),
    isDownloadExist: (state) => (id: string) => state.downloads.some((dl: Download) => dl.gameID === id),
  },
  actions: {
    addDownload(downloadData: Download) {
      this.downloads.push(downloadData);
      this.initChartData(downloadData.title);
    },
    removeDownloadByTitle(title: string) {
      const index = this.downloads.findIndex((dl) => dl.title === title);
      this.downloads.splice(index, 1);
    },
    clearDownloads() {
      this.downloads = [];
    },
    updateDownload(download: any, idOrTitle: string) {
      console.log('🔄 updateDownload appelé avec:', download, idOrTitle);
      let index = this.downloads.findIndex((dl: Download) => dl.gameID === idOrTitle);
      if (index === -1) {
        index = this.downloads.findIndex((dl: Download) => dl.title === idOrTitle);
      }
      if (index === -1) {
        console.log('⚠️ Download non trouvé pour:', idOrTitle);
        return;
      }
      console.log('✅ Download trouvé à l\'index:', index);
      console.log('📊 infoHash reçu:', download.infoHash);
      this.downloads[index].data = download;
      this.updateChartData(this.downloads[index].title, download.downloadSpeed);
    },
    addGameData(gameID: string, data: Game) {
      const index = this.downloads.findIndex((dl) => dl.gameID === gameID);
      
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
      const processedData = {
        ...data,
        header: getImageUrl(data.header)
      };
      
      this.downloads[index].game = processedData;
    },
    initChartData(title: string) {
      const index = this.downloads.findIndex((dl: Download) => dl.title === title);
      this.downloads[index].chartData = {
        labels: [
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
          'Vitesse',
        ],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#8668B3',
            tooltip: 'Vitesse',
          },
        ],
      };
    },
    updateChartData(title: string, data: any) {
      const index = this.downloads.findIndex((dl: Download) => dl.title === title);
      this.downloads[index].chartData.datasets[0].data.shift();
      this.downloads[index].chartData.datasets[0].data = this.downloads[index].chartData.datasets[0].data.concat(data);
    },
    togglePause(title: string) {
      const index = this.downloads.findIndex((dl: Download) => dl.title === title);
      this.downloads[index].paused = !this.downloads[index].paused;
    },
  },
});
