// import { EAEditor } from './editors/EAEditor';
import { OnlineFixEditor } from './editors/OnlinefixEditor';
import { FitgirlEditor } from './editors/FitgirlEditor';
import { P2PEditor } from './editors/P2PEditor';
import { Game, EditorInterface } from '../../../types/global';
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
    
    // Essayer de trouver l'éditeur par source
    const editorName = this.getEditorName(gameData);
    const editor = this.getEditor(editorName);
    
    if (editor && editor.verifyStructure(gamePath)) {
      console.log('✅ Éditeur trouvé et structure vérifiée');
      editor.installGame(gamePath, gameData);
    } else {
      // Fallback pour OnlineFix : essayer même si la structure n'est pas parfaite
      if (this.isOnlineFixGame(gameData)) {
        console.log('🔄 Tentative d\'installation OnlineFix en mode fallback');
        const onlineFixEditor = this.editors['OnlineFix'];
        if (onlineFixEditor) {
          onlineFixEditor.installGame(gamePath, gameData);
          return;
        }
      }
      
      console.log('❌ Éditeur non supporté ou structure invalide');
      const win = getMainWindow();
      win?.webContents.send('error', `Éditeur non supporté: ${editorName}`);
      win?.webContents.send('install-failed', gameData.id);
    }
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
      console.log(`❌ Éditeur non trouvé: ${editorName}`);
      console.log('📋 Éditeurs disponibles:', Object.keys(this.editors));
      const win = getMainWindow();
      win?.webContents.send('error', `Éditeur non supporté: ${editorName}`);
      return null;
    }

    console.log(`✅ Éditeur trouvé: ${editorName}`);
      return editor;
    }

  private getEditorName(gameData: Game): string {
    // Vérifier la source
    if (gameData.source && Array.isArray(gameData.source) && gameData.source.length > 0) {
      return gameData.source[0].name;
    }
    
    return '';
  }

  private isOnlineFixGame(gameData: Game): boolean {
    // Vérifier la source
    if (gameData.source && Array.isArray(gameData.source)) {
      return gameData.source.some(source => 
        source.name && source.name.toLowerCase().includes('onlinefix')
      );
    }
    
    return false;
  }
}
