import * as fs from 'fs';
import { join, basename } from 'path';
import { installService } from '../../services/installService';
import { extractionService } from '../../services/ExtractionService';
import { getMainWindow } from '../..';

// ==========================================
// Types
// ==========================================

type ArchiveType = 'rar-single' | 'rar-multipart' | 'split-zip' | 'zip-single' | '7z-single' | '7z-multipart';

interface ArchiveInfo {
  fullPath: string;
  directory: string;
  fileName: string;
  relativePath: string;
  type: ArchiveType;
  isFixRepair: boolean;
}

// ==========================================
// OnlineFixEditor
// ==========================================

export class OnlineFixEditor implements EditorInterface {

  /**
   * Vérifie si le torrent contient une structure OnlineFix.
   */
  verifyStructure(torrentPath: string): boolean {
    console.log('🔍 Vérification structure OnlineFix dans:', torrentPath);
    const archives = this.findArchives(torrentPath);
    const found = archives.length > 0;
    console.log(found ? `✅ ${archives.length} archive(s) OnlineFix trouvée(s)` : '❌ Aucune archive OnlineFix');
    return found;
  }

  /**
   * Point d'entrée principal. Reçoit le chemin BRUT du torrent.
   */
  public installGame = async (torrentPath: string, gameData: Game): Promise<void> => {
    console.log('🔧 Installation OnlineFix:', gameData.title);
    console.log('📂 Chemin torrent:', torrentPath);
    
    const win = getMainWindow();

    try {
      // 1. Scanner pour trouver les archives
      const archives = this.findArchives(torrentPath);
      
      if (archives.length === 0) {
        throw new Error(`Aucune archive trouvée dans ${torrentPath}`);
      }

      console.log('📦 Archives trouvées:');
      archives.forEach(a => console.log(`   ${a.isFixRepair ? '🔧' : '🎮'} ${a.relativePath} (${a.type})`));

      // 2. Séparer Fix Repair et archives de jeu
      const fixArchives = archives.filter(a => a.isFixRepair);
      const gameArchives = archives.filter(a => !a.isFixRepair);

      // 3. Extraire Fix Repair d'abord
      for (const fix of fixArchives) {
        console.log('🔧 Extraction Fix Repair:', fix.fileName);
        await extractionService.extract({
          archivePath: fix.fullPath,
          outputDir: fix.directory,
          gameId: gameData?.id,
          gameTitle: `${gameData.title} (Fix)`,
          password: 'online-fix.me',
          deleteAfter: true,
        });
      }

      // 4. Extraire le jeu
      if (gameArchives.length === 0) {
        throw new Error('Aucune archive de jeu trouvée (seulement Fix Repair)');
      }

      const firstArchive = this.findFirstPart(gameArchives);
      console.log('📦 Extraction du jeu:', firstArchive.fileName);
      
      const extractedPath = await extractionService.extract({
        archivePath: firstArchive.fullPath,
        outputDir: firstArchive.directory,
        gameId: gameData?.id,
        gameTitle: gameData.title,
        password: 'online-fix.me',
        deleteAfter: true,
      });

      // 5. Enregistrer le jeu
      installService.installFinished(extractedPath, gameData);

    } catch (error) {
      console.error('❌ Erreur installation OnlineFix:', error);
      win?.webContents.send('error', `Erreur installation: ${error.message}`);
      win?.webContents.send('install-failed', gameData?.id);
    }
  };

  // ==========================================
  // Archive Scanning
  // ==========================================

  private findArchives(rootPath: string, maxDepth = 4): ArchiveInfo[] {
    const results: ArchiveInfo[] = [];
    
    const scan = (dir: string, depth: number) => {
      if (depth > maxDepth || !fs.existsSync(dir)) return;
      
      try {
        for (const item of fs.readdirSync(dir)) {
          const fullPath = join(dir, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              scan(fullPath, depth + 1);
            } else {
              const type = this.getArchiveType(item);
              if (type) {
                results.push({
                  fullPath,
                  directory: dir,
                  fileName: item,
                  relativePath: fullPath.replace(rootPath, '').replace(/^[\\/]/, ''),
                  type,
                  isFixRepair: dir.includes('Fix Repair') || item.includes('Fix_Repair'),
                });
              }
            }
          } catch (e) { /* skip inaccessible */ }
        }
      } catch (e) { /* skip inaccessible dir */ }
    };

    scan(rootPath, 0);
    return results;
  }

  private getArchiveType(fileName: string): ArchiveType | null {
    if (/\.part\d+\.rar$/i.test(fileName)) return 'rar-multipart';
    if (/\.rar$/i.test(fileName)) return 'rar-single';
    if (/\.zip\.\d{3}$/i.test(fileName)) return 'split-zip';
    if (/\.zip$/i.test(fileName)) return 'zip-single';
    if (/\.7z\.\d{3}$/i.test(fileName)) return '7z-multipart';
    if (/\.7z$/i.test(fileName)) return '7z-single';
    return null;
  }

  private findFirstPart(archives: ArchiveInfo[]): ArchiveInfo {
    const multipart = archives.find(a => 
      a.type === 'rar-multipart' && /\.part0?1\.rar$/i.test(a.fileName)
    ) || archives.find(a => 
      a.type === 'split-zip' && /\.zip\.001$/i.test(a.fileName)
    ) || archives.find(a => 
      a.type === '7z-multipart' && /\.7z\.001$/i.test(a.fileName)
    );

    if (multipart) return multipart;

    const singleArchive = archives.find(a => 
      a.type === 'rar-single' || a.type === 'zip-single' || a.type === '7z-single'
    );
    
    return singleArchive || archives[0];
  }
}
