import * as fs from 'fs';

import { installService } from '../../services/installService';

import { getMainWindow } from '../..';

export class P2PEditor implements EditorInterface {
  /**
   * Pour P2P, on suppose que le dossier contient directement les fichiers du jeu.
   * On vérifie simplement que le dossier contient au moins un fichier exécutable (.exe)
   * ou qu'il n'est pas vide.
   */
  verifyStructure(gamePath: string): boolean {
    try {
      if (!fs.existsSync(gamePath)) return false;
      const files = fs.readdirSync(gamePath);
      
      // On cherche un .exe pour être sûr que c'est bien un jeu/app
      // ou au moins des fichiers
      if (files.length === 0) return false;
      
      const hasExe = files.some(file => file.toLowerCase().endsWith('.exe'));
      
      // Si on veut être strict :
      // return hasExe;
      
      // Si on veut être permissif (car l'exe peut être dans un sous-dossier) :
      return files.length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * L'installation P2P consiste simplement à valider que le jeu est présent.
   * Pas d'extraction ni d'installation à exécuter.
   */
  public installGame = async (gameFolder: string, gameData: Game): Promise<void> => {
    console.log('📂 Installation P2P : Validation directe du dossier', gameFolder);
    
    // On notifie juste que c'est fini, car le torrent a déjà tout mis en place
    installService.installFinished(gameFolder, gameData);
    
    const win = getMainWindow();
    win?.webContents.send('install-done', gameData);
  };
}
