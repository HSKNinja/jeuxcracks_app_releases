// import { EAEditor } from './editors/EAEditor';
import { OnlineFixEditor } from './editors/OnlinefixEditor';
import { FitgirlEditor } from './editors/FitgirlEditor';
import { P2PEditor } from './editors/P2PEditor';
import { BrowserWindow } from 'electron';
import { getMainWindow } from '..';

export class GameInstaller {
  private editors: { [key: string]: EditorInterface } = {};

  constructor() {
    // Enregistre les éditeurs disponibles
    this.editors['OnlineFix'] = new OnlineFixEditor();
    this.editors['online-fix.me'] = new OnlineFixEditor();
    this.editors['online-fix'] = new OnlineFixEditor();
    this.editors['onlinefix'] = new OnlineFixEditor();
    this.editors['FitGirl Repacks'] = new FitgirlEditor();
    this.editors['FitGirl'] = new FitgirlEditor();
    this.editors['P2P'] = new P2PEditor();
    this.editors['p2p'] = new P2PEditor();
    // Ajoute d'autres éditeurs ici...
  }

  installGame(gamePath: string, gameData: Game): void {
    console.log('🔍 Recherche d\'éditeur pour source:', gameData.source);
    console.log('📂 Chemin brut reçu:', gamePath);

    const { installService } = require('../services/installService');
    const editorName = this.getEditorName(gameData);
    const editor = this.getEditor(editorName);

    if (editor) {
      // Essayer avec le chemin brut d'abord (OnlineFixEditor scanne récursivement)
      if (editor.verifyStructure(gamePath)) {
        console.log(`✅ Structure vérifiée avec chemin brut (${editorName})`);
        editor.installGame(gamePath, gameData);
        return;
      }

      // Fallback: essayer avec getValidPath pour les éditeurs qui ont besoin d'un chemin drillé (FitGirl, P2P)
      const validPath = installService.getValidPath(gamePath);
      if (validPath !== gamePath && editor.verifyStructure(validPath)) {
        console.log('✅ Structure vérifiée avec chemin drillé:', validPath);
        editor.installGame(validPath, gameData);
        return;
      }

      console.log(`⚠️ Éditeur nommé "${editorName}" trouvé mais structure non reconnue, passage en auto-détection`);
    }

    // Auto-détection par structure de dossier.
    // Beaucoup de jeux n'ont pas de source explicite (source = "Unknown") : dans ce cas,
    // on déduit l'éditeur à partir du contenu du dossier téléchargé au lieu d'échouer.
    // Priorité : FitGirl (setup.exe + MD5) > OnlineFix (archives) > P2P (dossier prêt, fallback universel).
    const detected = this.autoDetectEditor(gamePath, installService);
    if (detected) {
      console.log(`🔎 Éditeur auto-détecté: ${detected.name} (${detected.path})`);
      detected.editor.installGame(detected.path, gameData);
      return;
    }

    console.log('❌ Aucun éditeur compatible, même après auto-détection');
    const win = getMainWindow();
    win?.webContents.send('error', `Impossible d'installer ${gameData.title} : format de jeu non reconnu.`);
    win?.webContents.send('install-failed', gameData.id);
  }

  /**
   * Détecte automatiquement l'éditeur adapté en testant la structure réelle du dossier.
   * Le P2PEditor sert de filet de sécurité : il accepte tout dossier non vide et l'enregistre
   * simplement comme installé (cas des torrents déjà prêts à jouer).
   */
  private autoDetectEditor(
    gamePath: string,
    installService: any
  ): { name: string; editor: EditorInterface; path: string } | null {
    const candidates: { name: string; editor: EditorInterface }[] = [
      { name: 'FitGirl', editor: this.editors['FitGirl'] },
      { name: 'OnlineFix', editor: this.editors['OnlineFix'] },
      { name: 'P2P', editor: this.editors['P2P'] },
    ];

    let validPath = gamePath;
    try {
      validPath = installService.getValidPath(gamePath);
    } catch (e) {
      /* garde le chemin brut si la résolution échoue */
    }

    for (const c of candidates) {
      if (!c.editor) continue;
      try {
        if (c.editor.verifyStructure(gamePath)) return { ...c, path: gamePath };
        if (validPath !== gamePath && c.editor.verifyStructure(validPath)) return { ...c, path: validPath };
      } catch (e) {
        /* éditeur suivant */
      }
    }
    return null;
  }

  private getEditor(editorName: string): EditorInterface | null {
    if (!editorName) {
      console.log('❌ Aucun nom d\'éditeur fourni');
      return null;
    }

    // Essayer de trouver l'éditeur par nom exact
    let editor = this.editors[editorName];
    
    if (!editor) {
      // Essayer de trouver par correspondance partielle
      const editorKeys = Object.keys(this.editors);
      const matchingEditor = editorKeys.find(key => 
        editorName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(editorName.toLowerCase())
      );
      
      if (matchingEditor) {
        editor = this.editors[matchingEditor];
        console.log(`🔍 Éditeur trouvé par correspondance: ${editorName} -> ${matchingEditor}`);
      }
    }

    if (!editor) {
      // Pas d'erreur affichée ici : installGame() tentera l'auto-détection par structure
      // avant de conclure à un échec réel.
      console.log(`❌ Éditeur nommé non trouvé: ${editorName} — passage en auto-détection`);
      console.log('📋 Éditeurs disponibles:', Object.keys(this.editors));
      return null;
    }

    console.log(`✅ Éditeur trouvé: ${editorName}`);
      return editor;
    }

  private getEditorName(gameData: Game): string {
    // Vérifier la source
    if (gameData.source) {
      if (typeof gameData.source === 'string') {
        return gameData.source;
      }
      if (Array.isArray(gameData.source) && gameData.source.length > 0) {
        return gameData.source[0].name;
      }
    }
    
    return '';
  }

  private isOnlineFixGame(gameData: Game): boolean {
    // Vérifier la source
    if (gameData.source) {
      if (typeof gameData.source === 'string') {
        return gameData.source.toLowerCase().includes('onlinefix') || 
               gameData.source.toLowerCase().includes('online-fix');
      }
      if (Array.isArray(gameData.source)) {
        return gameData.source.some(source => 
          source.name && source.name.toLowerCase().includes('onlinefix')
        );
      }
    }
    
    return false;
  }
}
