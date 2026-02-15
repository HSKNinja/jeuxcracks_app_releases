const WebTorrent = require('webtorrent');
import { BrowserWindow, ipcMain, app } from 'electron';
import { installService } from './installService';
import * as fs from 'fs';
import { join } from 'path';
import { getMainWindow } from '..';

export const client = new WebTorrent({
  maxConns: 55,
  utp: true,
  dht: true,
  tracker: true,
});

client.on('error', (err) => {
  console.error('WebTorrent client error:', err);
  const win = getMainWindow();
  win?.webContents.send('error', err.message || 'Erreur WebTorrent');
});

class TorrentService {
  private cancelledTorrents = new Set<string>(); // Pour tracker les torrents annulés
  private activeTorrents = new Map<string, any>(); // Pour tracker les torrents actifs
  private torrentsMetadata = new Map<string, any>(); // Metadata for persistence
  private persistenceFile = join(app.getPath('userData'), 'downloads', 'active_torrents.json');

  constructor() {
    ipcMain.handle('start-torrent', this.startTorrent);
    ipcMain.on('pause-torrent', this.pauseTorrent);
    ipcMain.on('resume-torrent', this.resumeTorrent);
    ipcMain.on('stop-torrent', (event, infoHash, savePath) => {
      console.log('🛑 Événement stop-torrent reçu:', infoHash, savePath);
      this.stopTorrent(event, infoHash, savePath);
    });
    ipcMain.on('stop-torrent-by-id', (event, gameID) => {
      console.log('🛑 Événement stop-torrent-by-id reçu:', gameID);
      this.stopTorrentByGameId(event, gameID);
    });
    
    // Load persisted torrents on startup
    this.loadState();
  }

  private stopTorrentByGameId = (event, gameID: string) => {
      // Find infoHash from metadata
      let infoHashToStop = null;
      let savePathToStop = null;

      for (const [hash, meta] of this.torrentsMetadata.entries()) {
          if (meta.gameData && String(meta.gameData.id) === String(gameID)) {
              infoHashToStop = hash;
              savePathToStop = meta.savePath; // We might need to append title if that's how it was saved
              // Check if savePath already includes title or not. 
              // In startTorrent, we do: client.add(torrentFile, { path: savePath })
              // Usually savePath comes from UI as "Downloads/GameTitle"
              break;
          }
      }

      if (infoHashToStop) {
          console.log(`🎯 Torrent trouvé par ID ${gameID} -> ${infoHashToStop}`);
          this.stopTorrent(event, infoHashToStop, savePathToStop);
      } else {
          console.log(`⚠️ Aucun torrent trouvé pour l'ID ${gameID}`);
          // Fallback: If not in metadata but in activeTorrents? Unlikely if they stay synced.
          // But maybe it's a magnet link pending metadata?
          // WebTorrent doesn't easily map magnet -> gameID unless we stored it.
          // We stored it in activeTorrents via 'gameData' property attached? No, we don't attach yet.
          
          // Try to cancel from cancelledTorrents set just in case
          this.cancelledTorrents.add(gameID);
      }
  }
  
  private saveState() {
     try {
         const data = Array.from(this.torrentsMetadata.values());
         fs.writeFileSync(this.persistenceFile, JSON.stringify(data, null, 2));
         console.log('💾 État des torrents sauvegardé:', data.length, 'torrents');
     } catch (error) {
         console.error('❌ Erreur lors de la sauvegarde des torrents:', error);
     }
  }

  private loadState() {
     try {
         if (fs.existsSync(this.persistenceFile)) {
             const data = JSON.parse(fs.readFileSync(this.persistenceFile, 'utf8'));
             console.log('📂 Chargement des torrents persistants:', data.length);
             
             data.forEach(item => {
                 if (item.torrentFile && typeof item.torrentFile === 'string' && fs.existsSync(item.torrentFile)) {
                     console.log('🔄 Relance du torrent persistant:', item.gameData.title);
                     // Simulate event as null since it's internal restoration
                     this.startTorrent(null, item.torrentFile, item.savePath, item.gameData);
                 } else {
                     console.log('⚠️ Impossible de relancer le torrent (fichier manquant):', item.gameData.title);
                 }
             });
         }
     } catch (error) {
         console.error('❌ Erreur lors du chargement des torrents:', error);
     }
  }

  async startTorrent(_event, torrentFile: string | Buffer, savePath: string, gameData: Game) {
    try {
      console.log('🚀 Démarrage du torrent:', gameData.title);
      
      // Si on redémarre explicitement un torrent, on doit le retirer de la liste des annulés
      if (this.cancelledTorrents.has(gameData.id)) {
        console.log('🔄 Retrait de la liste des torrents annulés pour redémarrage:', gameData.title);
        this.cancelledTorrents.delete(gameData.id);
      }

      
      console.log('🚀 Appel de client.add pour:', gameData.title);
      console.log('📂 SavePath:', savePath);
      // console.log('📄 TorrentFile:', typeof torrentFile === 'string' ? torrentFile : 'Buffer');

      client.add(torrentFile, { path: savePath }, (torrent) => {
        console.log('📦 Callback client.add déclenché !');
        console.log('📦 Torrent ajouté avec succès:', torrent.name);
        console.log('🔑 InfoHash:', torrent.infoHash);
        
        // Ajouter le torrent à la liste des torrents actifs
        this.activeTorrents.set(torrent.infoHash, torrent);
        
        // Persist metadata if torrentFile is a path string
        if (typeof torrentFile === 'string') {
            this.torrentsMetadata.set(torrent.infoHash, {
                torrentFile,
                savePath,
                gameData
            });
            this.saveState();
        }
        
      const interval = setInterval(() => {
          try {
             // console.log('Progress:', torrent.progress); // Too verbose
         const torrentData = {
          gameID: gameData.id,
          title: gameData.title,
          name: torrent.name,
          infoHash: torrent.infoHash,
          progress: torrent.progress,
          downloaded: torrent.downloaded,
          received: torrent.received,
          total: torrent.length,
          timeRemaining: torrent.timeRemaining, // ms
          uploaded: torrent.uploaded,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          numPeers: torrent.numPeers,
          path: torrent.path,
          ready: torrent.ready,
          paused: torrent.paused,
          done: torrent.done,
          downloadType: 'torrent'
        };
            
        const win = getMainWindow();
        win?.webContents.send('download-progress', torrentData, gameData.title);
            
        if (torrent.done || torrent.paused || torrent.destroyed || torrent.progress === 1) {
              clearInterval(interval);
            }
          } catch (error) {
            console.error('Erreur lors de la mise à jour du torrent:', error);
          clearInterval(interval);
        }
      }, 1000);

        torrent.on('ready', () => {
          console.log('✅ Torrent prêt:', torrent.name);
        });

      torrent.on('done', async () => {
          console.log('✅ Torrent terminé:', torrent.name);
        clearInterval(interval);
        
        // Remove from persistence
        this.torrentsMetadata.delete(torrent.infoHash);
        this.saveState();
        
        // Vérifier si le torrent a été annulé
        if (this.cancelledTorrents.has(torrent.infoHash)) {
          console.log('🚫 Torrent annulé, pas d\'installation:', torrent.name);
          this.cancelledTorrents.delete(torrent.infoHash);
          this.activeTorrents.delete(torrent.infoHash);
          return;
        }
        
        const win = getMainWindow();
          win?.webContents.send('download-done', gameData.title);
          
          try {
            // Supprimer le fichier torrent
        const torrentName = fs.readdirSync(torrent.path).find((file) => file.endsWith('.torrent'));
            if (torrentName) {
              fs.rmSync(join(torrent.path, torrentName), { recursive: true });
            }
            
            // Supprimer le torrent de la liste active
            this.activeTorrents.delete(torrent.infoHash);
            
        installService.installGame(gameData, savePath);
          } catch (error) {
            console.error('Erreur lors de la finalisation du torrent:', error);
          }
      });

      torrent.on('error', (err) => {
          console.error('❌ Erreur torrent:', err);
        clearInterval(interval);
        this.activeTorrents.delete(torrent.infoHash);
        this.torrentsMetadata.delete(torrent.infoHash); // Remove from persistence
        this.saveState();
        
        const win = getMainWindow();
          win?.webContents.send('error', `Erreur torrent: ${err.message}`);
        });

        torrent.on('warning', (warning) => {
          console.warn('⚠️ Avertissement torrent:', warning);
        });
      });
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du torrent:', error);
      const win = getMainWindow();
      win?.webContents.send('error', `Erreur lors du démarrage du torrent: ${error.message}`);
    }
  }

  private pauseTorrent = (_, infoHash: string) => {
    try {
      const torrent = client.get(infoHash);
      if (torrent) {
        torrent.destroy();
        console.log('⏸️ Torrent mis en pause:', infoHash);
        // Maybe we should keep it in persistence but marked as paused? 
        // For now, pausing via UI destroys the client connection.
        // If we want to resume on restart, we keep it in persistence.
        // So I do NOT delete from persistence here.
      }
    } catch (error) {
      console.error('Erreur lors de la pause du torrent:', error);
    }
  };

  private resumeTorrent = (event, infoHash: string, savePath: string, gameData: Game) => {
    try {
        console.log('🔄 Demande de reprise du torrent:', infoHash);
        
        // If gameData is missing (e.g. from Downloads.vue), try to recover it from persistence
        if (!gameData || !gameData.title) {
            const meta = this.torrentsMetadata.get(infoHash);
            if (meta && meta.gameData) {
                console.log('♻️ Récupération des données de jeu depuis la persistance pour:', meta.gameData.title);
                gameData = meta.gameData;
            } else {
                console.error('❌ Impossible de reprendre : données de jeu manquantes pour le hash', infoHash);
                return;
            }
        }
        
    const win = getMainWindow();
    win?.webContents.send('download-pending');
    this.startTorrent(event, infoHash, savePath, gameData);
    } catch (error) {
      console.error('Erreur lors de la reprise du torrent:', error);
    }
  };

  private stopTorrent = async (_, infoHash: string, savePath?: string) => {
    try {
      console.log('🛑 Tentative d\'arrêt du torrent:', infoHash);
      
      // Marquer le torrent comme annulé
      this.cancelledTorrents.add(infoHash);
      
      // Remove from persistence
      this.torrentsMetadata.delete(infoHash);
      this.saveState();
      
      // Essayer de trouver le torrent dans la liste active
      let torrent = this.activeTorrents.get(infoHash);
      if (!torrent) {
        // Si pas dans la liste active, essayer de le récupérer du client
        torrent = client.get(infoHash);
      }
      
    if (torrent) {
        console.log('🛑 Torrent trouvé, arrêt en cours...');
        
        // Arrêter complètement le torrent
        torrent.pause();
      torrent.destroy();
        
        // Supprimer le torrent du client
        try {
          client.remove(torrent);
        } catch (error) {
          console.log('⚠️ Torrent déjà supprimé du client');
        }
        
        // Supprimer de la liste active
        this.activeTorrents.delete(infoHash);
        
        // Nettoyer les fichiers partiellement téléchargés
        if (savePath) {
          try {
            const fs = require('fs').promises;
            await fs.rm(savePath, { recursive: true, force: true });
            console.log('🗑️ Fichiers partiels supprimés:', savePath);
          } catch (error) {
            console.error('Erreur lors de la suppression des fichiers partiels:', error);
          }
        }
        
        console.log('🛑 Torrent arrêté et supprimé:', infoHash);
      } else {
        console.log('⚠️ Torrent non trouvé pour l\'arrêt:', infoHash);
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du torrent:', error);
    }
  };
}

export const torrentService = new TorrentService();
