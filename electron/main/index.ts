import 'dotenv/config';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { release } from 'os';
import { join, dirname } from 'path';
import { rootPath } from 'electron-root-path';
import * as fs from 'fs/promises';
import { client } from './services/torrentService';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// const decompress = require('decompress');
// const assert = require('assert');
import './services';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

console.log('test', join(dirname(''), 'assets', 'logo.webp'));

async function createWindow() {
  win = new BrowserWindow({
    title: 'JeuxCracks Launcher',
    show: false,
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    transparent: true,
    frame: false,
    movable: true,
    hasShadow: true,
    resizable: true,
    icon: join(dirname(''), 'assets', 'logo.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false, // SÉCURISÉ : on désactive l'accès direct Node
      contextIsolation: true, // SÉCURISÉ : on isole le contexte
    },
    center: false,
    x: process.env.SECOND_MONITOR ? -1400 : 0,
    y: process.env.SECOND_MONITOR ? 100 : 0,
    fullscreen: process.env.SECOND_MONITOR ? true : false,
  });

  win.show();

  // Bloque l'ouverture des DevTools via Ctrl+Shift+I et F12
  // win.webContents.on('before-input-event', (event, input) => {
  //   // Ne bloquer que les raccourcis clavier, pas les clics de souris
  //   if (input.type === 'keyDown' || input.type === 'keyUp') {
  //     if (
  //       (input.control && input.shift && input.key.toLowerCase() === 'i') ||
  //       input.key === 'F12' ||
  //       (input.control && input.key.toLowerCase() === 'r')
  //     ) {
  //       event.preventDefault();
  //     }
  //   }
  // });
  //Listen the event "enter-full-screen" and "leave-full-screen"
  win.on('enter-full-screen', () => {
    win.webContents.send('enter-full-screen');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    console.log('🔧 Mode développement - Chargement depuis:', url);
    win.loadURL(url);
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools()
  } else {
    console.log('📦 Mode production - Chargement depuis:', indexHtml);
    console.log('📁 Dossier DIST:', process.env.DIST);
    win.loadFile(indexHtml);
    // win.webContents.openDevTools(); // Désactivé pour la prod
    // win.webContents.openDevTools(); // Force OPEN for debugging
  }

  // FORCE OPEN DEVTOOLS (GLOBAL)
  win.webContents.openDevTools();

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    console.log('✅ Page chargée avec succès');
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Gestion des erreurs de chargement
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Erreur de chargement:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(async () => {
  // Créer le répertoire downloads s'il n'existe pas
  const downloadsPath = join(app.getPath('userData'), 'downloads');
  try {
    await fs.mkdir(downloadsPath, { recursive: true });
    console.log('📁 Répertoire downloads créé/vérifié:', downloadsPath);
  } catch (error) {
    console.error('Erreur lors de la création du répertoire downloads:', error);
  }
  
  createWindow();

  // Configuration des logs pour electron-updater
  autoUpdater.logger = log;

  // Vérifie les mises à jour à chaque lancement
  autoUpdater.checkForUpdatesAndNotify();

  // Notifie le renderer si une mise à jour est dispo/téléchargée
  // Notifie le renderer si une mise à jour est dispo/téléchargée
  autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('checking-for-update');
  });
  autoUpdater.on('update-not-available', () => {
    win?.webContents.send('update-not-available');
  });
  autoUpdater.on('update-available', () => {
    win?.webContents.send('update-available');
  });
  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update-downloaded');
  });
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

ipcMain.handle('open-dialog', async (e, options) => {
  const savePath = await dialog.showOpenDialog(options);
  if (savePath.canceled) return null;
  return savePath.filePaths[0];
});
ipcMain.handle('get-save-path', async (e) => {
  return join(app.getPath('userData'), 'downloads');
});
ipcMain.handle('choose-exe-file', async (e, path) => {
  const filePath = dialog.showOpenDialogSync({ properties: ['openFile'], defaultPath: path });
  if (!filePath) return null;
  // Get name of the file
  const file = filePath[0].split('\\').pop();
  return file;
});
ipcMain.on('minimize-window', () => {
  win?.minimize();
});
ipcMain.on('maximize-window', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});
ipcMain.on('close-window', () => {
  console.log('close');
  client.destroy();
  app.quit();
});
ipcMain.handle('open-navigator', async (e, url) => {
  shell.openExternal(url);
});

ipcMain.handle('read-file', async (_event, path, encoding = 'utf8') => {
  return fs.readFile(path, { encoding });
});
ipcMain.handle('write-file', async (_event, path, data, encoding = 'utf8') => {
  await fs.writeFile(path, data, { encoding });
  return true;
});

ipcMain.handle('read-downloads', async () => {
  const path = join(app.getPath('userData'), 'downloads', 'index.json');
  try {
    const data = await fs.readFile(path, { encoding: 'utf8' });
    
    // Vérifier si le fichier est vide
    if (!data || data.trim() === '') {
      return '[]';
    }
    
    // Retourner directement la chaîne JSON au lieu de la parser
    return data;
  } catch (e) {
    console.error('Error reading downloads file:', e);
    // Si le fichier n'existe pas ou erreur de lecture, retourner un tableau vide
    return '[]';
  }
});

ipcMain.on('remove-game', async (e, gameID: string) => {
  try {
    // Lire le fichier downloads/index.json
    const path = join(app.getPath('userData'), 'downloads', 'index.json');
    const data = await fs.readFile(path, 'utf8');
    const games = JSON.parse(data);
    
    // Trouver le jeu à supprimer
    const gameIndex = games.findIndex((game) => game.id === gameID);
    if (gameIndex !== -1) {
      const gameToRemove = games[gameIndex];
      
      // Supprimer les fichiers du jeu
      if (gameToRemove.path) {
        try {
          await fs.rm(gameToRemove.path, { recursive: true, force: true });
          console.log('🗑️ Fichiers supprimés:', gameToRemove.path);
        } catch (error) {
          console.error('Erreur lors de la suppression des fichiers:', error);
        }
      }
      
      // Supprimer du JSON
      games.splice(gameIndex, 1);
      await fs.writeFile(path, JSON.stringify(games, null, 2));
      console.log('📝 Jeu supprimé du JSON:', gameID);
      
      // Envoyer une confirmation au renderer
      const win = getMainWindow();
      win?.webContents.send('game-removed', gameID);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du jeu:', error);
  }
});

ipcMain.on('delete-game', async (e, path) => {
  try {
    await fs.rm(path, { recursive: true, force: true });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
  }
});

ipcMain.on('open-game-emplacement', async (e, path) => {
  shell.openPath(path);
});

ipcMain.handle('force-library-sync', async () => {
  try {
    const downloadsData = await fs.readFile(join(app.getPath('userData'), 'downloads', 'index.json'), { encoding: 'utf8' });
    console.log('📚 Synchronisation forcée de la bibliothèque');
    return downloadsData;
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation forcée:', error);
    return '[]';
  }
});

ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});



export function getMainWindow(): BrowserWindow | null {
  return win;
}
