import * as fs from 'fs';
import { join } from 'path';
import { EditorInterface } from '../../../../types/global';
import { installService } from '../../services/installService';
import { Worker } from 'worker_threads';
import { BrowserWindow } from 'electron';
import { Game, GameInstalled } from '../../../../types/global';
import { rootPath } from 'electron-root-path';
import { getMainWindow } from '../..';
import { app } from 'electron';
import * as unrar from 'node-unrar-js';
import { dirname } from 'path';

export class OnlineFixEditor implements EditorInterface {
  verifyStructure(filePath: string): boolean {
    console.log('🔍 Vérification de la structure OnlineFix pour:', filePath);
    
    // Structure OnlineFix :
    // gamePath/
    // ├── Fix Repair/
    // │   ├── NameOfTheGame_Fix_Repair_Steam_Generic.rar
    // ├── NameOfTheGame-OFME.rar (ou .part1.rar, .part2.rar, etc.)

    const gamePath = join(filePath, '..');
    const fixRepairPath = join(gamePath, 'Fix Repair');
    
    console.log('📁 Chemin du jeu:', gamePath);
    console.log('🔧 Chemin Fix Repair:', fixRepairPath);
    
    // Vérifier si le dossier Fix Repair existe
    if (!fs.existsSync(fixRepairPath)) {
      console.log('❌ Dossier Fix Repair non trouvé');
      return false;
    }

    // Vérifier s'il y a des fichiers de réparation
    const fixFiles = fs.readdirSync(fixRepairPath);
    console.log('🔧 Fichiers de réparation trouvés:', fixFiles);
    
    const hasFixFile = fixFiles.some((file) => file.endsWith('_Fix_Repair_Steam_Generic.rar'));
    if (!hasFixFile) {
      console.log('❌ Aucun fichier de réparation trouvé');
      return false;
    }

    // Vérifier s'il y a des fichiers de jeu OnlineFix
    const gameFiles = fs.readdirSync(gamePath);
    console.log('🎮 Fichiers dans le dossier du jeu:', gameFiles);
    
    const gameFilePattern = /.*-OFME(\.rar|\.part\d+\.rar)$/;
    const hasGameFile = gameFiles.some((file) => gameFilePattern.test(file));
    
    if (!hasGameFile) {
      console.log('❌ Aucun fichier de jeu OnlineFix trouvé');
      return false;
    }

    console.log('✅ Structure OnlineFix vérifiée avec succès');
    return true;
  }

  public installGame = async (filePath: string, gameData: Game): Promise<void> => {
    console.log('🔧 Installation OnlineFix:', gameData.title);
    console.log('📦 Source du jeu:', gameData.source);
    
    const gamePath = join(filePath, '..');
    const fixRepairPath = join(gamePath, 'Fix Repair');
    
    try {
      // 1. Extraire d'abord les fichiers de réparation
      const fixFiles = fs.readdirSync(fixRepairPath);
      const fixFile = fixFiles.find((file) => file.endsWith('_Fix_Repair_Steam_Generic.rar'));

      if (fixFile) {
        console.log('🔧 Extraction du fichier de réparation:', fixFile);
        await this.extractFile(fixRepairPath, fixFile, gameData, true);
      }

      // 2. Extraire ensuite les fichiers de jeu
    const gameFiles = fs.readdirSync(gamePath);
    const gameFilePattern = /.*-OFME(\.rar|\.part\d+\.rar)$/;
    const gameParts = gameFiles.filter((file) => gameFilePattern.test(file)).sort();

    if (gameParts.length > 0) {
        console.log('🎮 Extraction des fichiers de jeu:', gameParts);
        
      if (gameParts.length === 1) {
          // Fichier unique
          await this.extractFile(gamePath, gameParts[0], gameData, false);
      } else {
          // Fichiers multipart
          await this.extractMultipartFiles(gameParts.map((part) => join(gamePath, part)), gamePath, gameData);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation OnlineFix:', error);
      const win = getMainWindow();
      win?.webContents.send('error', `Erreur lors de l'installation OnlineFix: ${error.message}`);
    }
  };

  private extractFile = async (filePath: string, fileName: string, gameData: Game, isFixFile: boolean = false): Promise<void> => {
    console.log(`📦 Extraction: ${fileName} (Fix: ${isFixFile})`);
    
    // Utiliser le service d'installation qui gère le worker thread
    await installService.runRAR(filePath, fileName, gameData, 'online-fix.me');
    
    // Si c'est la dernière étape (jeu principal), ajouter à la bibliothèque
    if (!isFixFile) {
        this.addToLibrary(filePath, gameData);
        installService.installFinished(filePath, gameData);
    }
  };

  private extractMultipartFiles = async (filePaths: string[], destination: string, gameData: Game): Promise<void> => {
    console.log('📦 Extraction multipart:', filePaths.length, 'fichiers');
    
    // Pour les fichiers multipart, on extrait seulement la première partie
    // car node-unrar-js peut avoir des problèmes avec les gros fichiers
    if (filePaths.length > 0) {
      const firstPart = filePaths[0];
      const fileName = firstPart.split('/').pop() || firstPart.split('\\').pop();
      await this.extractFile(destination, fileName, gameData, false);
    }
  };

  private addToLibrary = (gamePath: string, gameData: Game): void => {
    try {
      const libraryPath = join(app.getPath('userData'), 'downloads', 'index.json');
      
      // Créer le fichier s'il n'existe pas
      if (!fs.existsSync(libraryPath)) {
        fs.writeFileSync(libraryPath, JSON.stringify([]));
      }
      
      // Lire la bibliothèque existante
      const libraryData = fs.readFileSync(libraryPath, 'utf8');
      const library = JSON.parse(libraryData);
      
      // Vérifier si le jeu existe déjà
      const existingGame = library.find((game: any) => game.id === gameData.id);
      
      if (!existingGame) {
        // Ajouter le nouveau jeu
        const newGame: GameInstalled = {
          id: gameData.id,
          title: gameData.title,
          path: gamePath,
        };
        
        library.push(newGame);
        
        // Sauvegarder la bibliothèque
        fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
        
        console.log('📚 Jeu ajouté à la bibliothèque:', gameData.title);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout à la bibliothèque:', error);
      }
  };
}
