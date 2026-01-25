const Downloader = require('nodejs-file-downloader');
import { BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { torrentService } from './torrentService';
import { installService } from './installService';
import { getMainWindow } from '..';

class DownloadService {
  constructor() {
    ipcMain.on('download', this.download);
  }

  private download = async (event, fileURL, savePath, downloadType, gameData) => {
    savePath = join(savePath, gameData.title);
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    if (downloadType === 'torrent') {
      this.downloadTorrent(event, fileURL, savePath, gameData);
    } else {
      const { filePath } = await this.downloadFile(fileURL, savePath, gameData);
      const win = getMainWindow();
      if (filePath) {
      win?.webContents.send('download-done', gameData.title);
      installService.installGame(gameData, savePath);
      } else {
        win?.webContents.send('error', 'Échec du téléchargement');
      }
    }
  };

  private downloadFile = async (url, savePath, gameData) => {
    if (!url || !savePath) {
      const win = getMainWindow();
      win?.webContents.send(
        'error',
        'Le lien de téléchargement à expiré. Contactez le support sur notre discord pour résoudre ce problème.'
      );
      return { filePath: null, downloadStatus: 'FAILED' };
    }

      const dateStart = new Date();
      let downloadedBytes = 0;
    
    try {
      const downloader = new Downloader({
        url: url,
        directory: savePath,
        onProgress: (percentage, chunk, remainingSize) => {
          const dateEnd = new Date();
          const seconds = (dateEnd.getTime() - dateStart.getTime()) / 1000;
          
          // Track total bytes downloaded
          if (chunk && chunk.length) {
            downloadedBytes += chunk.length;
          }
          
          // Speed in bytes per second
          const downloadSpeed = seconds > 0 ? downloadedBytes / seconds : 0;
          
          // Calculate total size with fallbacks
          let totalSize = 0;
          const parsedPercentage = parseFloat(String(percentage));

          if (remainingSize !== undefined && remainingSize !== null && !isNaN(remainingSize)) {
             totalSize = downloadedBytes + remainingSize;
          } else if (parsedPercentage > 0) {
             // Fallback: extrapolate total from current correlation
             totalSize = (downloadedBytes * 100) / parsedPercentage;
          } else {
             // Absolute fallback if start
             totalSize = downloadedBytes; 
          }
          
          // console.log(`Stats: ${downloadedBytes} / ${totalSize} (${percentage}%) - rem: ${remainingSize}`);

          const data = {
            progress: parsedPercentage / 100,
            remainingSize,
            downloadSpeed,
            downloaded: downloadedBytes,
            element: {
                size: totalSize
            },
            totalSize,
            gameID: gameData.id,
            title: gameData.title,
          };
          const win = getMainWindow();
          // Fix signature: pass title as 2nd arg
          win?.webContents.send('download-progress', data, gameData.title);
        },
        cloneFiles: false,
      });

      const { filePath, downloadStatus } = await downloader.download();
        return { filePath, downloadStatus };
      } catch (error) {
      console.error('Erreur de téléchargement:', error);
      const win = getMainWindow();
      win?.webContents.send('error', 'Erreur lors du téléchargement');
      return { filePath: null, downloadStatus: 'FAILED' };
    }
  };

  private downloadTorrent = async (event, fileURL, savePath, gameData) => {
    try {
      // Pour les torrents, on télécharge d'abord le fichier .torrent
    const { filePath, downloadStatus } = await this.downloadFile(fileURL, savePath, gameData);
    const win = getMainWindow();
      
      if (downloadStatus === 'COMPLETE' && filePath) {
      win?.webContents.send('download-pending');
      // Pass filePath string for persistence support instead of buffer
      await torrentService.startTorrent(event, filePath, savePath, gameData);
    } else {
        win?.webContents.send('error', 'Échec du téléchargement du fichier torrent');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement torrent:', error);
      const win = getMainWindow();
      win?.webContents.send('error', 'Erreur lors du téléchargement torrent');
    }
  };
}

export const downloadService = new DownloadService();
