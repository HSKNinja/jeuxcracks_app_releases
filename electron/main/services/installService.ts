
import { BrowserWindow, ipcMain, app } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { GameInstaller } from '../utils/GameInstaller';
import { rootPath } from 'electron-root-path';
import { getMainWindow } from '..';
import { libraryService } from './libraryService';

class InstallService {
  private gameInstaller = new GameInstaller();

  constructor() {
    ipcMain.handle('is-game-installed', this.isGameInstalled);
    ipcMain.on('set-exe-file', this.setEXEFile);
  }

  private isGameInstalled(_, gameID: string) {
      return libraryService.isGameInstalled(gameID);
  }

  private setEXEFile(_, gameID: string, exePath: string) {
      libraryService.updateGameExe(gameID, exePath);
  }

  public installGame = async (gameData: Game, path: string) => {
    let validPath = this.getValidPath(path);
    const newInstall = {
      id: gameData.id,
      title: gameData.title,
      credit: gameData.source || gameData.informations?.credit || '',
      path: validPath,
      finished: false,
      canceled: false,
      game: gameData, // Inclure les données complètes du jeu
    };
    const win = getMainWindow();
    win?.webContents.send('install-start', newInstall);
    //On extrait le .rar si il n'y a qu'un seul fichier .rar dans le dossier et aucun sous dossier et aucun autres fichiers
    // if (
    //   fs.readdirSync(validPath).length === 1 &&
    //   fs.lstatSync(join(validPath, fs.readdirSync(validPath)[0])).isFile() &&
    //   fs.readdirSync(validPath)[0].endsWith('.rar')
    // ) {
    //   this.runRAR({ path: validPath, fileName: fs.readdirSync(validPath)[0] });
    // }
    //TODO: On monte l'iso si c'est un .iso

    //Puis on installe le jeu
    this.gameInstaller.installGame(validPath, gameData);
    // this.addGameInIndex(validPath, gameData);
  };
  public getValidPath = (path: string): string => {
    let newPath = path;
    while (fs.readdirSync(newPath).length === 1 && fs.lstatSync(join(newPath, fs.readdirSync(newPath)[0])).isDirectory()) {
      newPath = join(newPath, fs.readdirSync(newPath)[0]);
    }
    //If the folder contains 2 folders and the name of one is "Fix Repair" we take the other one
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
  public installAllTypes = async (path) => {
    const files = fs
      .readdirSync(path)
      .filter(
        (file) =>
          !file.startsWith('.') &&
          (file.endsWith('.exe') ||
            file.endsWith('.rar') ||
            file.endsWith('.zip') ||
            file.endsWith('.7z') ||
            file.endsWith('.iso'))
      );
    if (files.length === 1) {
      if (files[0].endsWith('.exe')) {
        const win = getMainWindow();
        if (this.isSETUPFile(files[0])) {
          this.runEXE(path, files[0]);
          // TODO: Add a listener to check if the installation is done
          win?.webContents.send('install-done');
        } else {
          win?.webContents.send('install-done');
        }
      } else if (files[0].endsWith('.rar')) {
        this.runRAR(path, files[0], { id: 'manual' });
      } else if (files[0].endsWith('.zip')) {
        this.runZIP(path, files[0]);
      } else if (files[0].endsWith('.7z')) {
        this.run7Z(path, files[0]);
      } else if (files[0].endsWith('.iso')) {
        this.runISO(path, files[0]);
      }
    } else if (files.length > 1) {
      if (files.every((file) => file.endsWith('.rar'))) {
        //TODO: If many .rar then normally we need to extract just the part 1 but we need to make tests to be sure
        files.forEach((file) => {
          this.runRAR(path, file, { id: 'manual' });
        });
      }
      if (files.every((file) => file.endsWith('.exe'))) {
        const win = getMainWindow();
        win?.webContents.send(
          'error',
          'Plusieurs fichiers exécutables trouvés veuillez choisir manuellement le fichier à exécuter.'
        );
        win?.webContents.send('install-failed', path);
      } else {
        const win = getMainWindow();
        win?.webContents.send('error', 'Veuillez installer manuellement le jeu.');
      }
    } else {
      if (fs.readdirSync(path).find((file) => fs.lstatSync(join(path, file)).isDirectory())) {
        path = join(
          path,
          fs.readdirSync(path).find((file) => fs.lstatSync(join(path + file)).isDirectory())
        );
        this.determineGameType(path);
      } else if (
        fs.readdirSync(path).find((file) => !file.startsWith('.') && !fs.lstatSync(join(path, file)).isDirectory())
      ) {
        const win = getMainWindow();
        win?.webContents.send(
          'error',
          'Aucun fichier exécutable trouvé. Veuillez choisir manuellement le fichier à exécuter.'
        );
        win?.webContents.send('install-failed', path);
      } else {
        const win = getMainWindow();
        win?.webContents.send('error', 'Aucun fichier trouvé. Veuillez vérifier le contenu du dossier.');
        win?.webContents.send('install-failed', path);
      }
    }
  };

  public installFinished = async (filePath: string, gameData: Game): Promise<void> => {
    // Determine which library this path belongs to, or just check default
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
    const win = getMainWindow();
    win?.webContents.send('install-done', newGameData);
  };

  async runRAR(path: string, fileName: string, gameData: any, password?: string) {
    const win = getMainWindow();
    win?.webContents.send('install-progress', { progress: 0, message: 'Extraction en cours...', gameID: gameData?.id });
    win?.setProgressBar(0, { mode: 'indeterminate' }); // Barre de tâche indéterminée
    
    return new Promise((resolve, reject) => {
      // Determine worker path based on environment
      let workerPath = join(__dirname, '../unrar.js');
      // If we are in dev mode (ts-node), we might need to point to the ts file or a compiled js?
      // For simplicity in this environment, assuming standard build structure
      if (!fs.existsSync(workerPath)) {
         // Fallback/Dev check
         workerPath = join(__dirname, 'unrar.js');
      }
      if (!fs.existsSync(workerPath) && !app.isPackaged) {
         // If generic dev environment
         workerPath = join(rootPath, 'electron/main/unrar.ts');
      }

      console.log('👷 Démarrage du worker unrar:', workerPath, 'pour le jeu:', gameData?.title);

      const { Worker } = require('worker_threads');
      const worker = new Worker(workerPath, {});
      let isFinished = false;

      worker.on('message', (message) => {
        if (message === 'done') {
          isFinished = true;
          console.log('✅ Extraction terminée', workerPath);
          win?.webContents.send('install-progress', { progress: 100, message: 'Extraction terminée', gameID: gameData?.id });
          win?.setProgressBar(1, { mode: 'normal' }); // 100% avant de clear
          setTimeout(() => win?.setProgressBar(-1), 1000); // Clear après 1s
          
          // Cleanup RAR (with retry)
          const rarPath = join(path, fileName);
          const cleanup = async () => {
             for(let i=0; i<5; i++) {
                 try {
                     if(fs.existsSync(rarPath)) {
                         fs.unlinkSync(rarPath);
                         console.log('🗑️ Archive RAR supprimée:', rarPath);
                     }
                     break;
                 } catch(e) {
                     console.log(`⚠️ Echec suppression RAR (tentative ${i+1}):`, e.message);
                     await new Promise(r => setTimeout(r, 1000));
                 }
             }
          };
          
          cleanup().then(async () => {
              // Deep Flattening Strategy
              let finalPath = path;
              try {
                  // 1. Define Target Root (Library/GameName)
                  // 'path' is usually Library/GameName/TorrentName. We want Library/GameName.
                  // But check if 'path' IS already the root (unlikely for OnlineFix).
                  // Safest: Try to move to 'path/..' if 'path' seems to be a wrapper.
                  const parentDir = join(path, '..');
                  
                  // 2. Find the "Real" Content Root
                  // Search recursively downwards until we find a folder with multiple files or .exe
                  // (ignoring 'Fix Repair', txt, archives)
                  const findContentRoot = (currentPath: string): string => {
                      if (!fs.existsSync(currentPath)) return currentPath;
                      if (!fs.lstatSync(currentPath).isDirectory()) return currentPath;

                      const items = fs.readdirSync(currentPath);
                      const validItems = items.filter(f => 
                           f !== 'Fix Repair' && f !== fileName &&
                           !f.endsWith('.rar') && !f.endsWith('.zip') &&
                           !f.endsWith('.txt') && !f.endsWith('.url') && !f.endsWith('.ini')
                      );

                      // If single valid folder, go deeper
                      if (validItems.length === 1 && fs.lstatSync(join(currentPath, validItems[0])).isDirectory()) {
                          return findContentRoot(join(currentPath, validItems[0]));
                      }
                      
                      // Otherwise, this is the root
                      return currentPath;
                  };

                  const sourceRoot = findContentRoot(path);
                  
                  // 3. Move Content from SourceRoot to ParentDir
                  // Only if SourceRoot is deeper than ParentDir
                  if (sourceRoot.startsWith(parentDir) && sourceRoot !== parentDir) {
                      console.log(`🚀 Deep Flatten: Déplacement de ${sourceRoot} vers ${parentDir}`);
                      
                      // A. Rescue "Fix Repair" from intermediate folders (e.g. path)
                      // "Fix Repair" might be in 'path' (TorrentFolder) but not in 'sourceRoot' (GameSubFolder)
                      if (path !== sourceRoot && fs.existsSync(path)) {
                          const potentialFix = join(path, 'Fix Repair');
                          if (fs.existsSync(potentialFix)) {
                              console.log('🔧 Sauvetage du dossier Fix Repair...');
                              const targetFix = join(parentDir, 'Fix Repair');
                              for(let i=0; i<5; i++) {
                                  try {
                                      fs.renameSync(potentialFix, targetFix);
                                      break;
                                  } catch(e: any) { 
                                      console.warn(`⚠️ Echec déplacement Fix Repair (tentative ${i+1}):`, e.message); 
                                      await new Promise(r => setTimeout(r, 800));
                                  }
                              }
                          }
                      }

                      // B. Move Game Files
                      const itemsToMove = fs.readdirSync(sourceRoot);
                      for(const item of itemsToMove) {
                          const src = join(sourceRoot, item);
                          const dest = join(parentDir, item);
                          
                          // Retry loop for move
                          for(let k=0; k<5; k++) {
                              try {
                                  // Overwrite/Merge handling
                                  if (fs.existsSync(dest)) {
                                      const destStat = fs.lstatSync(dest);
                                      if (destStat.isDirectory()) {
                                         // If dest dir exists, we can't just renameSync over it.
                                         console.warn(`⚠️ Collision dossier ${item}, ignoré.`); 
                                      } else {
                                          fs.unlinkSync(dest); // Overwrite file
                                          fs.renameSync(src, dest);
                                      }
                                  } else {
                                      fs.renameSync(src, dest);
                                  }
                                  break;
                              } catch(err: any) {
                                  if (k===4) console.warn(`⚠️ Echec déplacement ${item}:`, err.message);
                                  await new Promise(r => setTimeout(r, 500));
                              }
                          }
                      }
                      
                      // 4. Cleanup old structure (SourceRoot up to ParentDir)
                      try {
                          // Allow some time for locks to release
                          await new Promise(r => setTimeout(r, 1000));
                          
                          // We delete 'path' (TorrentFolder)
                          // Safe bet: Delete 'path' if it's not ParentDir.
                          if (path !== parentDir && fs.existsSync(path)) {
                                try {
                                    fs.rmSync(path, { recursive: true, force: true });
                                } catch(cleanupErr: any) {
                                    console.warn('⚠️ Impossible de supprimer le dossier temporaire (fichiers verrouillés ?):', cleanupErr.message);
                                    // This is not fatal, the game is installed.
                                }
                          }
                      } catch(e) { console.warn('Nettoyage post-aplatissement incomplet:', e); }

                      finalPath = parentDir;
                  }

              } catch (e) {
                  console.error('Erreur critique aplatissement:', e);
              }
              
              resolve(finalPath);
          });
        } else if (message.startsWith('error:')) {
          console.error('❌ Erreur worker:', message);
          win?.setProgressBar(1, { mode: 'error' }); // Barre rouge
          setTimeout(() => win?.setProgressBar(-1), 5000);

          win?.webContents.send('error', 'Erreur lors de l\'extraction: ' + message);
          // TODO: Send failed event with ID?
          if (gameData?.id) win?.webContents.send('install-failed', gameData.id);
          worker.terminate();
          reject(new Error(message));
        } else {
             // Progress update if worker supported it
             // win?.webContents.send('install-progress', { progress: ..., gameID: gameData?.id });
        }
      });

      worker.on('error', (err) => {
        console.error('❌ Erreur worker uncaught:', err);
        if (gameData?.id) win?.webContents.send('install-failed', gameData.id);
        reject(err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });

      // Start extraction
      worker.postMessage({
        path,
        fileName,
        password: password || '' 
      });
    });
  }

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
      // We don't wait for installer to finish usually? Or do we?
      // For now, assume fire and forget for setup.exe
  }

  async determineGameType(path: string) {
      console.log('🔍 Détermination du type de jeu pour:', path);
      // Logic to check contents and call appropriate installer
      this.installAllTypes(path);
  }

  // Stubs for other formats
  async runZIP(path, fileName) { console.log('ZIP not implemented'); }
  async run7Z(path, fileName) { console.log('7Z not implemented'); }
  async runISO(path, fileName) { console.log('ISO not implemented'); }

  private isSETUPFile = (fileName) => {
    return fileName.match(/setup|install/i);
  };
}

export const installService = new InstallService();
