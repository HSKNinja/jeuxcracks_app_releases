import 'dotenv/config';
import { app, BrowserWindow, shell, ipcMain, dialog, Menu, Tray, nativeImage } from 'electron';
import { release } from 'os';
import { join, dirname } from 'path';
import { rootPath } from 'electron-root-path';
import * as fs from 'fs/promises';
import { client } from './services/torrentService';
import { libraryService } from './services/libraryService';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

import './services';
import { TelemetryService } from './services/TelemetryService';

// The built directory structure
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

let store: any; // Initialized in whenReady
let win: BrowserWindow | null = null;
let tray: Tray | null = null;

const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

console.log('test', join(dirname(''), 'assets', 'logo.webp'));

async function createWindow() {
  const savedBounds = store ? store.get('windowBounds') : null;

  win = new BrowserWindow({
    title: 'JeuxCracks Launcher',
    show: false, // Use ready-to-show
    width: savedBounds?.width || 1280,
    height: savedBounds?.height || 720,
    minWidth: 1024,
    minHeight: 600,
    x: savedBounds?.x,
    y: savedBounds?.y,
    // transparent: true, // Disable for Mica/Acrylic & Native Snap
    backgroundMaterial: 'mica', 
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
        color: '#00000000', 
        symbolColor: '#ffffff',
        height: 60 // Aligné avec le header (h-16 ~ 64px)
    },
    movable: true,
    hasShadow: true,
    resizable: true,
    icon: join(dirname(''), 'assets', 'logo.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: !app.isPackaged,
    },
    center: !savedBounds,
  });

  win.setMenu(null);

  const saveState = () => {
      if (!win || win.isMaximized() || win.isFullScreen() || !store) return;
      store.set('windowBounds', win.getBounds());
  };
  win.on('resize', saveState);
  win.on('move', saveState);
  win.on('close', saveState);

  win.once('ready-to-show', () => {
    win?.show();
    win?.focus();
  });

  if (app.isPackaged) {
      win.webContents.on('context-menu', (e) => e.preventDefault());
      win.webContents.on('before-input-event', (event, input) => {
          if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
              event.preventDefault();
          }
      });
  }

  win.on('enter-full-screen', () => {
    win.webContents.send('enter-full-screen');
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('🔧 Mode développement - Chargement depuis:', url);
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    console.log('📦 Mode production - Chargement depuis:', indexHtml);
    console.log('📁 Dossier DIST:', process.env.DIST);
    win.loadFile(indexHtml);
  }

  win.webContents.on('did-finish-load', () => {
    console.log('✅ Page chargée avec succès');
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Erreur de chargement:', { errorCode, errorDescription, validatedURL });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  // Initialize Store (ESM workaround)
  try {
      const { default: StoreVal } = await import('electron-store');
      store = new StoreVal();
  } catch(e) { console.error('Failed to load electron-store', e); }

  // Initialize Tray
  try {
      const iconPath = join(dirname(''), 'assets', 'logo.ico');
      tray = new Tray(nativeImage.createFromPath(iconPath));
      tray.setToolTip('JeuxCracks Launcher');
      
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Ouvrir', click: () => { win?.show(); win?.focus(); } },
        { label: 'Quitter', click: () => { app.quit(); } }
      ]);
      tray.setContextMenu(contextMenu);
      
      tray.on('double-click', () => {
          win?.show();
          win?.focus();
      });
  } catch(e) { console.error('Failed to create Tray', e); }

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

  // Check via IPC
  ipcMain.on('check-for-update', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

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
  autoUpdater.on('error', (err) => {
    console.error('Update Error:', err);
    win?.webContents.send('update-error', err.message);
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
  let legacyGames: any[] = [];
  const path = join(app.getPath('userData'), 'downloads', 'index.json');
  
  // 1. Read Legacy
  try {
    const data = await fs.readFile(path, { encoding: 'utf8' });
    if (data && data.trim() !== '') {
      legacyGames = JSON.parse(data);
    }
  } catch (e) {
    // Legacy file missing or invalid is fine
  }

  // 2. Read New Library
  const newGames = libraryService.getInstalledGames();
  const formattedNewGames = newGames.map(g => ({
      id: g.id,
      title: g.title,
      path: g.installPath || g.exePath || '', // Frontend expects 'path'
      // Add other fields if necessary
      finished: true,
      ...g
  }));

  // 3. Merge (New overrides Legacy by ID)
  // Create a map by ID
  const gameMap = new Map();
  
  // Add legacy first
  legacyGames.forEach(g => gameMap.set(g.id, g));
  
  // Add/Override with new
  formattedNewGames.forEach(g => gameMap.set(g.id, g));
  
  // Return as JSON string
  const merged = Array.from(gameMap.values());
  return JSON.stringify(merged);
});

ipcMain.on('remove-game', async (e, gameID: string) => {
  try {
    // 1. Nouvelle méthode via LibraryService
    const libGame = libraryService.getGameInfo(gameID);
    if (libGame) {
        if (libGame.installPath) {
            try {
                // Robust delete with retries
                const maxRetries = 5;
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        if ((await fs.stat(libGame.installPath).catch(() => null))) {
                            await fs.rm(libGame.installPath, { recursive: true, force: true });
                            console.log('🗑️ Fichiers supprimés (Library):', libGame.installPath);
                        }
                        break;
                    } catch (err: any) {
                        if (i === maxRetries - 1) throw err;
                        if (err.code === 'EBUSY' || err.code === 'EPERM') {
                            console.log(`⚠️ EBUSY lors de la suppression, nouvelle tentative (${i + 1}/${maxRetries})...`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            throw err;
                        }
                    }
                }
                
                // Nettoyage récursif des parents vides
                try {
                    let currentPath = dirname(libGame.installPath);
                    const libraries = libraryService.getLibraries();
                    
                    // On remonte tant qu'on n'est pas à la racine d'une bibliothèque
                    while (true) {
                        const isLibRoot = libraries.some(l => l.path.replace(/\\/g, '/').toLowerCase() === currentPath.replace(/\\/g, '/').toLowerCase());
                        if (isLibRoot) break; // Sécurité : on ne supprime jamais la racine de la bibliothèque
                        
                        // Sécurité anti boucle infinie (si on atteint la racine du disque)
                        if (dirname(currentPath) === currentPath) break;

                        const siblings = await fs.readdir(currentPath);
                        if (siblings.length === 0) {
                            await fs.rmdir(currentPath);
                            console.log('🗑️ Dossier parent vide supprimé:', currentPath);
                            currentPath = dirname(currentPath);
                        } else {
                            // Le dossier n'est pas vide, on arrête
                            break;
                        }
                    }
                } catch (e) { 
                    console.error('Erreur lors du nettoyage des dossiers parents:', e);
                }
            } catch (err) {
                console.error('Erreur suppression fichiers:', err);
            }
        }
        libraryService.removeGame(gameID);
        getMainWindow()?.webContents.send('game-removed', gameID);
        return;
    }

    // 2. Legacy Method
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

ipcMain.on('auth-success', async (event, token) => {
    console.log('👤 User logged in, starting Telemetry...');
    TelemetryService.getInstance().sendStartup(token);
});

app.on('before-quit', async () => {
    // Note: Best effort shutdown telemetry
    // We can't really await here reliably without blocking quit, 
    // but TelemetryService.sendShutdown is async. 
    // Ideally we would grab a token if we stored it in the service.
    // For now we skip shutdown telemetry or rely on heartbeat.
});


export function getMainWindow(): BrowserWindow | null {
  return win;
}
