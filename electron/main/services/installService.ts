import { Game } from '../../../types/global';
import { BrowserWindow, ipcMain, app } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { GameInstaller } from '../utils/GameInstaller';
import { rootPath } from 'electron-root-path';
import { getMainWindow } from '..';
class InstallService {
  private gameInstaller = new GameInstaller();

  constructor() {
    ipcMain.handle('is-game-installed', this.isGameInstalled);
    ipcMain.on('set-exe-file', this.setEXEFile);
    // Créer le répertoire downloads s'il n'existe pas
    const downloadsPath = join(app.getPath('userData'), 'downloads');
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
  }
  private isGameInstalled(_, gameID: string) {
    const data = fs.readFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), { encoding: 'utf-8' });
    const installed = JSON.parse(data);
    if (installed.find((game) => game.id === gameID)) {
      return true;
    } else {
      return false;
    }
  }
  private setEXEFile(_, gameID: string, exePath: string) {
    try {
      // Lire le fichier downloads/index.json
      const data: string = fs.readFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), { encoding: 'utf-8' });
      let installed = JSON.parse(data);

      // Trouver le jeu et mettre à jour le fichier exe
      const gameIndex = installed.findIndex((game) => game.id === gameID);
      if (gameIndex !== -1) {
        installed[gameIndex].exeFile = exePath;
        fs.writeFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), JSON.stringify(installed));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fichier exe:', error);
    }
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
    const newGameData: GameInstalled = {
      id: gameData.id,
      title: gameData.title,
      path: filePath,
    };
    this.addGameInIndex(filePath, newGameData);
    const win = getMainWindow();
    win?.webContents.send('install-done', newGameData);
  };
  private addGameInIndex = (savePath: string, gameData: GameInstalled) => {
    const data: string = fs.readFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), { encoding: 'utf-8' });
    const installed: GameInstalled[] = JSON.parse(data);
    if (!installed.find((game) => game.id === gameData.id)) {
      installed.push(gameData);
    }
    fs.writeFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), JSON.stringify(installed));
  };
  async runRAR(path: string, fileName: string, gameData: any, password?: string) {
    const win = getMainWindow();
    win?.webContents.send('install-progress', { progress: 0, message: 'Extraction en cours...', gameID: gameData?.id });
    
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
      const worker = new Worker(workerPath, {
         // If using .ts in dev, might need execArgv: ['-r', 'ts-node/register'] 
         // But usually electron-vite handles this. 
      });

      worker.on('message', (message) => {
        if (message === 'done') {
          console.log('✅ Extraction terminée');
          win?.webContents.send('install-progress', { progress: 100, message: 'Extraction terminée', gameID: gameData?.id });
          worker.terminate();
          resolve(true);
        } else if (message.startsWith('error:')) {
          console.error('❌ Erreur worker:', message);
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
