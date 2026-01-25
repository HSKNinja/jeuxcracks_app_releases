import { ipcMain, BrowserWindow, app, dialog } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { getMainWindow } from '..';
import { installService } from './installService';
import sudo from 'sudo-prompt';

class LaunchService {
  constructor() {
    ipcMain.on('launch-game', (event, gameID) => {
      console.log(`📡 Événement launch-game reçu pour le jeu ID: ${gameID}`);
      this.runGame(event, gameID);
    });
    // Créer le répertoire downloads s'il n'existe pas
    const downloadsPath = join(app.getPath('userData'), 'downloads');
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
  }

  private async waitForGameInJson(gameID: string, maxTries = 30, delayMs = 500): Promise<any> {
    console.log(`🔍 Attente du jeu ${gameID} dans le fichier JSON...`);
    for (let i = 0; i < maxTries; i++) {
      try {
        const data = fs.readFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), { encoding: 'utf-8' });
        const installed = JSON.parse(data);
        // Compare IDs as strings to avoid number/string mismatch
        const gameData = installed.find((game) => String(game.id) === String(gameID));
        if (gameData) {
          console.log(`✅ Jeu ${gameID} trouvé dans le fichier JSON après ${i + 1} tentatives`);
          return gameData;
        } else if (i === 0) {
             console.log(`ℹ️ IDs disponibles dans le JSON:`, installed.map(g => g.id));
        }
      } catch (e) {
        console.log(`⚠️ Erreur lors de la lecture du fichier JSON (tentative ${i + 1}):`, e);
      }
      console.log(`⏳ Tentative ${i + 1}/${maxTries} - Attente de ${delayMs}ms...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
    console.log(`❌ Jeu ${gameID} non trouvé après ${maxTries} tentatives`);
    return null;
  }

  private async waitForExeInFolder(path: string, maxTries = 10, delayMs = 200): Promise<boolean> {
    console.log(`🔍 Recherche d'exécutables dans: ${path} (${maxTries} tentatives max)`);
    
    for (let i = 0; i < maxTries; i++) {
      if (fs.existsSync(path)) {
        let found = false;
        let exeCount = 0;
        
        const checkDir = (dir: string) => {
          try {
            const files = fs.readdirSync(dir);
            console.log(`📂 Vérification du dossier: ${dir} (${files.length} fichiers)`);
            
            for (const file of files) {
              const filePath = join(dir, file);
              try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                  checkDir(filePath);
                } else if (file.endsWith('.exe') && !this.BLACKLISTED_EXE.includes(file.toLowerCase())) {
                  console.log(`🎯 Exécutable trouvé: ${file}`);
                  exeCount++;
                  found = true;
                }
              } catch (e) {
                // Ignore inaccessible files
              }
            }
          } catch (error) {
            console.error(`❌ Erreur lors de la lecture du dossier ${dir}:`, error);
          }
        };
        
        checkDir(path);
        
        if (found) {
          console.log(`✅ ${exeCount} exécutable(s) trouvé(s) dans ${path}`);
          return true;
        } else {
          console.log(`⏳ Aucun exécutable trouvé (tentative ${i + 1}/${maxTries})`);
        }
      } else {
        console.log(`❌ Le dossier n'existe pas: ${path} (tentative ${i + 1}/${maxTries})`);
      }
      
      await new Promise(res => setTimeout(res, delayMs));
    }
    
    console.log(`❌ Aucun exécutable trouvé après ${maxTries} tentatives dans: ${path}`);
    return false;
  }

  private runGame = async (_, gameID) => {
    try {
      console.log(`🚀 Tentative de lancement du jeu ID: ${gameID}`);
      
      // Attendre que le jeu soit bien présent dans le JSON
      const gameData = await this.waitForGameInJson(gameID);
      if (!gameData) {
        const win = getMainWindow();
        console.error(`❌ Jeu ${gameID} non trouvé dans la bibliothèque après attente`);
        win?.webContents.send('error', `Jeu non trouvé dans la bibliothèque (ID: ${gameID}). Veuillez réessayer dans quelques secondes.`);
        return;
      }
      
      console.log(`✅ Jeu trouvé: ${gameData.title} dans ${gameData.path}`);

      const win = getMainWindow();
      const originalPath = gameData.path;
      
      // Vérifier que le dossier existe
      if (!fs.existsSync(originalPath)) {
        console.error(`❌ Le dossier du jeu n'existe pas: ${originalPath}`);
        win?.webContents.send('error', `Le dossier du jeu n'existe pas: ${originalPath}`);
        return;
      }
      
      console.log(`📁 Dossier du jeu vérifié: ${originalPath}`);

      // Attendre qu'au moins un .exe soit présent dans le dossier du jeu (récursivement)
      console.log(`🔍 Recherche d'exécutables dans: ${originalPath}`);
      const exeFound = await this.waitForExeInFolder(originalPath);
      
      if (!exeFound) {
        console.error(`❌ Aucun exécutable trouvé dans: ${originalPath}`);
        win?.webContents.send('error', `Aucun exécutable trouvé dans le dossier du jeu: ${originalPath}`);
        return;
      }
      
      console.log(`✅ Exécutables trouvés dans: ${originalPath}`);

      if (gameData.exeFile) {
        // exeFile peut être un chemin relatif (ex: 'Content Warning\\Content Warning.exe')
        console.log(`🎯 Exécutable spécifique trouvé: ${gameData.exeFile}`);
        const exePath = join(originalPath, gameData.exeFile);
        if (fs.existsSync(exePath)) {
          console.log(`✅ Exécutable trouvé et existe: ${exePath}`);
          const exeDir = join(exePath, '..');
          this.runEXE(exeDir, exePath.split(/[\\/]/).pop());
        } else {
          console.log(`❌ Exécutable spécifique non trouvé: ${exePath}`);
          // Si on ne le trouve pas, on relance la recherche de tous les .exe
          this.findEXE(originalPath, gameData);
        }
      } else {
        console.log(`🔍 Aucun exécutable spécifique, recherche de tous les .exe`);
        this.findEXE(originalPath, gameData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du lancement du jeu:', error);
      const win = getMainWindow();
      win?.webContents.send('error', `Erreur lors du lancement du jeu: ${error.message || error}`);
    }
  };
  private runEXE = (path, fileName) => {
    const win = getMainWindow();
    const executable = fileName;
    const executablePath = join(path, executable);
    
    console.log('🚀 Tentative de lancement du jeu:');
    console.log('📁 Chemin du jeu:', path);
    console.log('📄 Nom du fichier exécutable:', fileName);
    console.log('🔗 Chemin complet:', executablePath);
    console.log('📂 Le fichier existe:', fs.existsSync(executablePath));
    
    try {
      // Utiliser spawn au lieu de sudo sur Windows
      const child = spawn(executablePath, [], {
        cwd: path, // Définir le répertoire de travail
        detached: true, // Détacher le processus
        stdio: 'ignore' // Ignorer stdin/stdout/stderr
      });
      
      // Détacher complètement le processus enfant
      child.unref();
      
      console.log('✅ Jeu lancé avec succès (PID:', child.pid, ')');
      win?.webContents.send('game-launched');
      
      // Écouter la fermeture du processus
      child.on('close', (code) => {
        console.log('🎮 Jeu fermé avec le code:', code);
        win?.webContents.send('game-closed');
      });
      
      child.on('error', (err) => {
        console.error('❌ Erreur lors du lancement:', err);
        win?.webContents.send('error', `Erreur lors du lancement: ${err.message}`);
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du lancement:', error);
      win?.webContents.send('error', `Erreur lors du lancement: ${error.message}`);
    }
  };
  private findEXE = (path, gameData) => {
    const win = getMainWindow();
    const executables: string[] = [];
    this.collectExecutablesRecursively(path, executables, path);
    // On envoie tous les .exe trouvés (chemin relatif)
    win?.webContents.send('find-many-exe', executables, gameData.id, gameData.path, gameData.title);
  };
  
  private saveExeChoice = (gameID: string, exeFile: string) => {
    try {
      const data = fs.readFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), { encoding: 'utf-8' });
      const installed = JSON.parse(data);
      const gameIndex = installed.findIndex((game) => game.id === gameID);
      if (gameIndex !== -1) {
        // Sauvegarder le chemin relatif (ou le nom du fichier) dans exeFile
        installed[gameIndex].exeFile = exeFile;
        fs.writeFileSync(join(app.getPath('userData'), 'downloads', 'index.json'), JSON.stringify(installed, null, 2));
        console.log('💾 Choix de fichier exécutable sauvegardé:', exeFile);
        console.log('📁 Chemin du jeu dans le JSON:', installed[gameIndex].path);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du choix:', error);
    }
  };
  
  private findExeRecursively = (startPath: string, exeName: string): string | null => {
    try {
      if (!fs.existsSync(startPath)) return null;
      const items = fs.readdirSync(startPath);
      for (const item of items) {
        const itemPath = join(startPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          const found = this.findExeRecursively(itemPath, exeName);
          if (found) return found;
        } else if (
          item.toLowerCase() === exeName.toLowerCase()
        ) {
          return itemPath;
        }
      }
      return null;
    } catch {
      return null;
    }
  };
  
  private findAllExecutablesRecursively = (startPath: string, gameData: any) => {
    console.log('🔍 Recherche de tous les fichiers .exe dans:', startPath);
    const win = getMainWindow();
    const executables: string[] = [];
    
    try {
      this.collectExecutablesRecursively(startPath, executables, startPath);
      
      if (executables.length > 0) {
        console.log('📋 Fichiers .exe trouvés:', executables);
        // Envoyer la liste à la popup
        win?.webContents.send('find-many-exe', executables, gameData.id, gameData.path, gameData.title);
      } else {
        console.log('❌ Aucun fichier .exe trouvé, ouverture de l\'explorateur');
        // Aucun fichier .exe trouvé, ouvrir l'explorateur
        this.openFileDialog(startPath, gameData);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de tous les exécutables:', error);
      this.openFileDialog(startPath, gameData);
    }
  };
  
  // Liste noire des exécutables à ignorer
  private readonly BLACKLISTED_EXE = [
    'unitycrashhandler64.exe',
    'unitycrashhandler32.exe',
    'unins.exe',
    'uninstall.exe',
    'dxsetup.exe',
    'vcredist_x64.exe',
    'vcredist_x86.exe',
    'oalinst.exe',
    'dotnetfx.exe',
    'setup.exe',
    'autorun.exe',
    'physx.exe',
    'eac_launcher.exe',
    'eac.exe',
    'installscript.vdf',
    'support.exe',
    'redist.exe',
    'directx.exe',
    'depcheck.exe',
    'helper.exe',
    'helper64.exe',
    'launcher_helper.exe',
    'readme.exe',
    'patch.exe',
    'patcher.exe',
    'patchinstall.exe',
    'patchupdate.exe',
    'patchupdater.exe',
    'patcher_x64.exe',
    'patcher_x86.exe',
    'setup-1c.exe',
    'setup-2c.exe',
    'setup-3c.exe',
    'setup-4c.exe',
    'setup-5c.exe',
    'setup-6c.exe',
    'setup-7c.exe',
    'setup-8c.exe',
    'setup-9c.exe',
    'setup-10c.exe',
    'ffmpeg.exe',
    // Ajoute ici d'autres noms à ignorer si besoin
  ];

  // On ajoute un paramètre rootPath pour avoir des chemins relatifs
  private collectExecutablesRecursively = (dir: string, executables: string[], rootPath: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          this.collectExecutablesRecursively(filePath, executables, rootPath);
        } else if (
          file.endsWith('.exe') &&
          !this.BLACKLISTED_EXE.includes(file.toLowerCase())
        ) {
          // On stocke le chemin relatif pour l'affichage côté front
          executables.push(filePath.replace(rootPath + '\\', '').replace(rootPath + '/', ''));
        }
      } catch (e) {
        console.warn(`⚠️ Impossible de lire les infos du fichier ${filePath}:`, e);
      }
    }
  };
  
  private openFileDialog = async (path: string, gameData: any) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Sélectionner le fichier exécutable',
        defaultPath: path,
        filters: [
          { name: 'Fichiers exécutables', extensions: ['exe'] },
          { name: 'Tous les fichiers', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedFile = result.filePaths[0];
        const fileName = selectedFile.split(/[\\/]/).pop(); // Nom du fichier
        
        // Sauvegarder le choix dans le JSON
        this.saveExeChoice(gameData.id, fileName);
        
        // Lancer le jeu
        this.runEXE(path, fileName);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      const win = getMainWindow();
      win?.webContents.send('error', 'Erreur lors de la sélection du fichier exécutable');
    }
  };
}

export const launchService = new LaunchService();
