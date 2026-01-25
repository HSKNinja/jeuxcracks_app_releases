// Fonction récursive pour supprimer un répertoire et tout son contenu
import * as fs from 'fs';
import { join } from 'path';

export function deleteFolderRecursive(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Récurse à travers le sous-répertoire
        deleteFolderRecursive(curPath);
      } else {
        // Supprime le fichier
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}
