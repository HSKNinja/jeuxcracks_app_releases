import 'dotenv/config';
import { app, BrowserWindow, shell, ipcMain, dialog, Menu, Tray, nativeImage, session } from 'electron';
import { release } from 'os';
import { join, dirname } from 'path';
import { rootPath } from 'electron-root-path';
import * as fs from 'fs/promises';
import { client, torrentService } from './services/torrentService';
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
    icon: join(process.env.VITE_PUBLIC, 'logo.ico'),
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

  // Minimize-to-tray: intercept close
  win.on('close', (e) => {
      saveState();
      if (!isQuitting) {
          const settings = store ? store.get('settings') || {} : {};
          if (settings.minimizeToTray) {
              e.preventDefault();
              win?.hide();
              return;
          }
      }
  });

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
      const iconPath = join(process.env.VITE_PUBLIC, 'logo.ico');
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
  
  // Suppress specific warnings
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('ch-ua-form-factors')) {
      return;
    }
    originalConsoleError(...args);
  };

  // Fix YouTube Embed Error 153/101 in Production
  session.defaultSession.webRequest.onBeforeSendHeaders({
    urls: ['*://*.youtube.com/*', '*://*.googlevideo.com/*']
  }, (details, callback) => {
    // Strategy: Remove Referer/Origin completely for the embed iframe.
    // This makes the request look like a direct navigation (browser tab), bypassing embedding restrictions.
    // Works reliably in both Dev (localhost) and Prod (file://).
    if (details.resourceType === 'subFrame' || details.url.includes('/embed/')) {
        if (!details.requestHeaders) details.requestHeaders = {};
        delete details.requestHeaders['Referer'];
        delete details.requestHeaders['Origin'];
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  createWindow();

  // Configuration des logs pour electron-updater
  autoUpdater.logger = log;

  // Restore Download Limits
  if(store) {
      const limits = store.get('downloadLimits');
      if (limits) {
          if(limits.download !== undefined) torrentService.setDownloadLimit(limits.download);
          if(limits.upload !== undefined) torrentService.setUploadLimit(limits.upload);
          console.log('📉 Limites de téléchargement restaurées:', limits);
      }
  }

  // Restore auto-launch setting
  if(store) {
      const settings = store.get('settings') || {};
      if (app.isPackaged) {
          app.setLoginItemSettings({ openAtLogin: !!settings.autoLaunch });
      }
      console.log('⚙️ Paramètres restaurés:', settings);
  }

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

// --- SETTINGS & DOWNLOAD LIMITS ---
ipcMain.handle('get-settings', async () => {
   if(!store) return {};
   return store.get('settings') || {};
});

ipcMain.on('update-setting', (e, key, value) => {
   if(!store) return;
   const settings = store.get('settings') || {};
   settings[key] = value;
   store.set('settings', settings);

   // Apply setting immediately
   if (key === 'autoLaunch' && app.isPackaged) {
       app.setLoginItemSettings({ openAtLogin: !!value });
       console.log('🚀 Auto-launch:', value ? 'activé' : 'désactivé');
   }
   if (key === 'minimizeToTray') {
       console.log('🔽 Minimize to tray:', value ? 'activé' : 'désactivé');
   }
   if (key === 'notifications') {
       // Forward to renderer so it can enable/disable vue-notification
       win?.webContents.send('setting-changed', key, value);
       console.log('🔔 Notifications:', value ? 'activées' : 'désactivées');
   }
});

ipcMain.handle('get-app-version', () => app.getVersion());

// ... (in ipcMain handlers)
ipcMain.on('set-download-limit', (e, bytes) => {
    torrentService.setDownloadLimit(bytes);
    
    // Persist
    if(store) {
        const limits = store.get('downloadLimits') || {};
        limits.download = bytes;
        store.set('downloadLimits', limits);
    }
});

ipcMain.on('set-upload-limit', (e, bytes) => {
    torrentService.setUploadLimit(bytes);
    
    if(store) {
        const limits = store.get('downloadLimits') || {};
        limits.upload = bytes;
        store.set('downloadLimits', limits);
    }
});

ipcMain.handle('get-download-limits', () => {
    return torrentService.getLimits();
});

ipcMain.handle('open-data-folder', async () => {
    const { shell } = require('electron');
    shell.openPath(app.getPath('userData'));
});

ipcMain.handle('get-electron-version', () => {
    return process.versions.electron;
});

// --- LIBRARY STATS & CACHE MANAGEMENT ---
ipcMain.handle('get-library-stats', async () => {
    const configPath = join(app.getPath('userData'), 'library_config.json');
    let libraries: any[] = [];
    try {
        const { readFileSync, existsSync } = require('fs');
        if (existsSync(configPath)) {
            const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
            libraries = cfg.libraries || [];
        }
    } catch { return { folders: [], disks: [] }; }
    
    if (libraries.length === 0) return { folders: [], disks: [] };
    
    const formatB = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'Ko', 'Mo', 'Go', 'To'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Unique disk saturation
    const drivesSeen = new Set<string>();
    const disks: any[] = [];
    
    for (const lib of libraries) {
        const drive = lib.path.charAt(0).toUpperCase() + ':';
        if (drivesSeen.has(drive)) continue;
        drivesSeen.add(drive);
        
        let free = 0, total = 0;
        try {
            const { execSync } = require('child_process');
            const output = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get FreeSpace,Size /format:csv`, { encoding: 'utf8' });
            const lines = output.trim().split('\n').filter((l: string) => l.trim());
            if (lines.length > 1) {
                const parts = lines[lines.length - 1].split(',');
                free = parseInt(parts[1]) || 0;
                total = parseInt(parts[2]) || 0;
            }
        } catch { /* silent */ }
        
        const used = total - free;
        const percent = total > 0 ? Math.round((used / total) * 100) : 0;

        disks.push({
            drive,
            usedFormatted: formatB(used),
            freeFormatted: formatB(free),
            totalFormatted: formatB(total),
            percent,
        });
    }

    return { folders: [], disks };
});

ipcMain.handle('get-cache-sizes', async () => {
    const { readdirSync, statSync, readFileSync, existsSync } = require('fs');
    const cachePath = join(app.getPath('userData'), 'Cache');
    
    const TEMP_EXTENSIONS = ['.rar', '.torrent', '.tmp', '.part', '.zip', '.7z', '.gz', '.tar'];
    
    // Get all library paths
    const configPath = join(app.getPath('userData'), 'library_config.json');
    let libraryPaths: string[] = [];
    try {
        if (existsSync(configPath)) {
            const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
            libraryPaths = (cfg.libraries || []).map((l: any) => l.path);
        }
    } catch {}
    
    // Count temp files across all libraries
    const getTempSize = (dir: string): number => {
        try {
            let size = 0;
            const items = readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                if (item.isFile()) {
                    const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
                    if (TEMP_EXTENSIONS.includes(ext)) {
                        try { size += statSync(join(dir, item.name)).size; } catch {}
                    }
                }
                if (item.isDirectory()) {
                    size += getTempSize(join(dir, item.name));
                }
            }
            return size;
        } catch { return 0; }
    };

    const getDirSize = (dir: string): number => {
        try {
            let size = 0;
            const items = readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = join(dir, item.name);
                if (item.isDirectory()) size += getDirSize(fullPath);
                else try { size += statSync(fullPath).size; } catch {}
            }
            return size;
        } catch { return 0; }
    };

    let totalTemp = 0;
    for (const libPath of libraryPaths) {
        totalTemp += getTempSize(libPath);
    }

    return {
        temp: totalTemp,
        imageCache: getDirSize(cachePath),
    };
});

ipcMain.handle('open-temp-folder', async () => {
    const { shell } = require('electron');
    const downloadsPath = join(app.getPath('userData'), 'downloads');
    shell.openPath(downloadsPath);
});

ipcMain.handle('clear-temp-files', async () => {
    const TEMP_EXTENSIONS = ['.rar', '.torrent', '.tmp', '.part', '.zip', '.7z', '.gz', '.tar'];
    
    // Get all library paths
    const configPath = join(app.getPath('userData'), 'library_config.json');
    let libraryPaths: string[] = [];
    try {
        const { readFileSync, existsSync } = require('fs');
        if (existsSync(configPath)) {
            const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
            libraryPaths = (cfg.libraries || []).map((l: any) => l.path);
        }
    } catch {}
    
    const cleanDir = (dir: string) => {
        const { readdirSync, rmSync } = require('fs');
        try {
            const items = readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = join(dir, item.name);
                if (item.isFile()) {
                    const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
                    if (TEMP_EXTENSIONS.includes(ext)) {
                        try { rmSync(fullPath, { force: true }); } catch {}
                    }
                }
                if (item.isDirectory()) {
                    cleanDir(fullPath);
                }
            }
        } catch {}
    };
    
    for (const libPath of libraryPaths) {
        cleanDir(libPath);
    }
    console.log(`🗑️ Temp files cleared across ${libraryPaths.length} libraries`);
    return true;
});

ipcMain.handle('clear-image-cache', async () => {
    const cachePath = join(app.getPath('userData'), 'Cache');
    try {
        const { rmSync, mkdirSync } = require('fs');
        rmSync(cachePath, { recursive: true, force: true });
        mkdirSync(cachePath, { recursive: true });
        console.log('🗑️ Image cache cleared');
    } catch (e) { console.error('Failed to clear image cache', e); }
    return true;
});

ipcMain.handle('verify-library-integrity', async () => {
    const configPath = join(app.getPath('userData'), 'library_config.json');
    let libraries: any[] = [];
    try {
        const { readFileSync, existsSync } = require('fs');
        if (existsSync(configPath)) {
            const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
            libraries = cfg.libraries || [];
        }
    } catch { return { ok: true, totalFiles: 0, missingFiles: 0 }; }
    
    let totalFiles = 0, missingFiles = 0;
    const { existsSync, readdirSync } = require('fs');
    for (const lib of libraries) {
        try {
            if (!existsSync(lib.path)) { missingFiles++; continue; }
            const games = readdirSync(lib.path, { withFileTypes: true });
            for (const game of games) {
                if (game.isDirectory()) totalFiles++;
            }
        } catch { /* silent */ }
    }
    
    console.log(`✅ Library integrity: ${totalFiles} games found, ${missingFiles} paths missing`);
    return { ok: missingFiles === 0, totalFiles, missingFiles };
});
// ----------------------------------

ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});

// Open URL in default browser (Stripe checkout, invoices, etc.)
ipcMain.on('open-external', (_e, url: string) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
        const { shell } = require('electron');
        shell.openExternal(url);
    }
});

ipcMain.on('auth-success', async (event, token) => {
    console.log('👤 User logged in, starting Telemetry...');
    TelemetryService.getInstance().sendStartup(token);
});

ipcMain.on('auth-token-refresh', (event, token) => {
    // console.log('🔄 Telemetry: Token updated');
    TelemetryService.getInstance().updateToken(token);
});

let isQuitting = false;
app.on('before-quit', async (e) => {
    if (!isQuitting) {
        e.preventDefault();
        console.log('🛑 Application closing, sending final telemetry...');
        
        // Wait for telemetry (max 2 seconds to avoid freezing)
        const timeout = new Promise(resolve => setTimeout(resolve, 2000));
        const shutdown = TelemetryService.getInstance().sendShutdown();
        
        await Promise.race([shutdown, timeout]);
        
        isQuitting = true;
        app.quit();
    }
});


export function getMainWindow(): BrowserWindow | null {
  return win;
}
