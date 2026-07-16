
import { BrowserWindow, ipcMain, app } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { GameInstaller } from '../utils/GameInstaller';
import { rootPath } from 'electron-root-path';
import { getMainWindow } from '..';
import { libraryService } from './libraryService';
import { extractionService } from './ExtractionService';

class InstallService {
  private gameInstaller = new GameInstaller();

  constructor() {
    ipcMain.handle('is-game-installed', this.isGameInstalled);
    ipcMain.on('set-exe-file', this.setEXEFile);
    ipcMain.handle('scan-unextracted-games', this.scanUnextractedGames);
    ipcMain.on('retry-extraction', this.retryExtraction);
    // Annulation best-effort d'une extraction en cours (bouton "Retirer" côté UI).
    ipcMain.on('cancel-extraction', (_, gameId: any) => {
      try { extractionService.cancelByGameId(String(gameId)); } catch (e) { /* non supporté / déjà fini */ }
    });
  }

  private isGameInstalled(_, gameID: string) {
      return libraryService.isGameInstalled(gameID);
  }

  private setEXEFile(_, gameID: string, exePath: string) {
      libraryService.updateGameExe(gameID, exePath);
  }

  // ==========================================
  // Install Entry Point
  // ==========================================

  public installGame = async (gameData: Game, path: string) => {
    const newInstall = {
      id: gameData.id,
      title: gameData.title,
      credit: gameData.source || gameData.informations?.credit || '',
      path: path,
      finished: false,
      canceled: false,
      game: gameData,
    };
    const win = getMainWindow();
    win?.webContents.send('install-start', newInstall);

    // Passer le chemin brut — l'éditeur s'occupera de trouver les fichiers.
    // Garde-fou : si installGame lève (ex: éditeur manquant, erreur de bundle), on notifie
    // l'échec pour ne pas laisser un « fantôme » bloqué à « Validation en cours ».
    try {
      this.gameInstaller.installGame(path, gameData);
    } catch (e: any) {
      console.error('❌ Erreur lors du démarrage de l\'installation:', e);
      win?.webContents.send('error', `Erreur d'installation (${gameData.title}): ${e?.message || e}`);
      win?.webContents.send('install-failed', gameData.id);
    }
  };

  // ==========================================
  // Path Utils
  // ==========================================

  public getValidPath = (path: string): string => {
    let newPath = path;
    while (fs.readdirSync(newPath).length === 1 && fs.lstatSync(join(newPath, fs.readdirSync(newPath)[0])).isDirectory()) {
      newPath = join(newPath, fs.readdirSync(newPath)[0]);
    }
    if (fs.readdirSync(newPath).length === 2) {
      if (fs.readdirSync(newPath).find((file) => file === 'Fix Repair')) {
        newPath = join(
          newPath,
          fs.readdirSync(newPath).find((file) => file !== 'Fix Repair')
        );
      }
    }
    return newPath;
  };

  // ==========================================
  // Unextracted Scanner
  // ==========================================

  public scanUnextractedGames = async () => {
    const unextracted: { title: string, path: string }[] = [];
    const seenPaths = new Set<string>();
    const installedGames = libraryService.getInstalledGames();
    const installedPaths = new Set(
      installedGames.map((g: any) => (g.installPath || '').replace(/\\/g, '/').toLowerCase()).filter(Boolean)
    );

    // On scanne le dossier de téléchargement par défaut ET tous les dossiers de bibliothèque,
    // car les jeux peuvent être téléchargés dans une bibliothèque custom (ex: E:\Jeux).
    const roots = [
      join(app.getPath('userData'), 'downloads'),
      ...libraryService.getLibraries().map((l: any) => l.path),
    ];

    for (const root of roots) {
      if (!root || !fs.existsSync(root)) continue;
      let items: fs.Dirent[] = [];
      try { items = fs.readdirSync(root, { withFileTypes: true }); } catch { continue; }

      for (const item of items) {
        if (!item.isDirectory()) continue;
        const title = item.name;
        const fullPath = join(root, title);
        const normalized = fullPath.replace(/\\/g, '/').toLowerCase();

        if (seenPaths.has(normalized)) continue;
        seenPaths.add(normalized);

        // Déjà installé (par titre ou par chemin d'installation) → on ignore.
        if (installedGames.some((g: any) => g.title.toLowerCase() === title.toLowerCase())) continue;
        if (installedPaths.has(normalized)) continue;

        unextracted.push({ title, path: fullPath });
      }
    }

    return unextracted;
  };

  public retryExtraction = async (event: any, title: string, folderPath: string) => {
      // Create a spoofed gameData for the manual extraction
      const gameData: any = {
          id: `manual-${Date.now()}`,
          title: title,
          source: 'manual',
      };
      
      console.log(`🔄 Relance manuelle de l'extraction via Scanner: ${title}`);
      this.installGame(gameData, folderPath);
  };

  // ==========================================
  // Fallback Installation (non-editor path)
  // ==========================================

  public installAllTypes = async (path: string) => {
    const allFiles = fs.readdirSync(path).filter(f => !f.startsWith('.'));
    
    const archives = allFiles.filter(f => 
      f.endsWith('.rar') || f.endsWith('.zip') || f.endsWith('.7z') || f.endsWith('.iso') || /\.zip\.\d{3}$/.test(f)
    );
    const exeFiles = allFiles.filter(f => f.endsWith('.exe'));

    // Handle archives via ExtractionService
    if (archives.length > 0) {
      // Find the first archive to extract
      const splitZipParts = archives.filter(f => /\.zip\.\d{3}$/.test(f)).sort();
      const rarFiles = archives.filter(f => f.endsWith('.rar'));
      
      let archivePath: string;
      
      if (splitZipParts.length > 0) {
        archivePath = join(path, splitZipParts[0]);
      } else if (rarFiles.length > 0) {
        archivePath = join(path, this.findFirstRarPart(rarFiles));
      } else {
        archivePath = join(path, archives[0]);
      }

      try {
        await extractionService.extract({
          archivePath,
          outputDir: path,
          gameId: 'manual',
          gameTitle: 'Installation manuelle',
          deleteAfter: true,
        });
      } catch (e) {
        console.error('❌ Extraction failed:', e);
        const win = getMainWindow();
        win?.webContents.send('error', `Erreur d'extraction: ${e.message}`);
      }
      return;
    }

    // Handle executables
    if (exeFiles.length === 1) {
      const win = getMainWindow();
      if (this.isSETUPFile(exeFiles[0])) {
        this.runEXE(path, exeFiles[0]);
      }
      win?.webContents.send('install-done');
      return;
    }

    if (exeFiles.length > 1) {
      const win = getMainWindow();
      win?.webContents.send('error', 'Plusieurs fichiers exécutables trouvés, veuillez choisir manuellement.');
      win?.webContents.send('install-failed', path);
      return;
    }

    // Check subdirectories
    const subdirs = allFiles.filter(f => {
      try { return fs.lstatSync(join(path, f)).isDirectory(); } catch { return false; }
    });
    
    if (subdirs.length > 0) {
      path = join(path, subdirs[0]);
      this.installAllTypes(path);
    } else {
      const win = getMainWindow();
      win?.webContents.send('error', 'Aucun fichier extractible trouvé.');
      win?.webContents.send('install-failed', path);
    }
  };

  // ==========================================
  // Install Finished
  // ==========================================

  public installFinished = async (filePath: string, gameData: Game): Promise<void> => {
    const libraries = libraryService.getLibraries();
    const matchedLib = libraries.find(lib => filePath.replace(/\\/g, '/').startsWith(lib.path.replace(/\\/g, '/'))) || libraries[0];

    libraryService.registerInstalledGame({
        id: gameData.id,
        title: gameData.title,
        installPath: filePath,
        libraryId: matchedLib.id,
        installDate: new Date().toISOString(),
        version: (gameData as any).version,
        source: (gameData as any).source || gameData.source || '',
    });

    const newGameData = {
      id: gameData.id,
      title: gameData.title,
      path: filePath,
    };
    
    // Native OS notification (if enabled)
    try {
        const Store = require('electron-store'); // v8 CJS : require() marche dans l'asar packagé
        const storeInst: any = new Store();
        const settings = storeInst.get('settings') || {};
        if (settings.notifications !== false) {
            const { Notification } = require('electron') as typeof import('electron');
            new Notification({ title: 'Installation terminée', body: `${gameData.title} est prêt à jouer !` }).show();
        }
    } catch(e) { /* silent */ }

    const win = getMainWindow();
    win?.webContents.send('install-done', newGameData);
  };

  // ==========================================
  // Utilities
  // ==========================================

  async runEXE(path: string, fileName: string) {
    const { spawn } = require('child_process');
    const exePath = join(path, fileName);
    console.log('🚀 Lancement de l\'installeur:', exePath);
    
    const child = spawn(exePath, [], {
        cwd: path,
        detached: true,
        stdio: 'ignore'
    });
    child.unref();
  }

  async determineGameType(path: string) {
    console.log('🔍 Détermination du type de jeu pour:', path);
    this.installAllTypes(path);
  }

  private isSETUPFile = (fileName: string) => {
    return fileName.match(/setup|install/i);
  };

  private findFirstRarPart(files: string[]): string {
    const part1 = files.find(f => /\.part0?1\.rar$/i.test(f));
    if (part1) return part1;
    const masterRar = files.find(f => f.endsWith('.rar') && !/\.part\d+\.rar$/i.test(f));
    if (masterRar) return masterRar;
    return files[0];
  }
}

export const installService = new InstallService();
