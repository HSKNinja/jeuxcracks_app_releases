import { app, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { getMainWindow } from '..';

export interface LibraryPath {
    id: string; // uuid
    path: string; // Absolute path (e.g. D:\Games)
    label: string; // e.g. "Disque D"
    isDefault: boolean;
    totalSpace?: number;
    freeSpace?: number;
}

export interface InstalledGameRegistry {
    id: string; // Game ID (from API)
    slug?: string; // slug API — sert à vérifier les mises à jour du jeu
    title: string;
    installPath: string; // directory where it's installed
    exePath?: string; // specific executable selected by user
    libraryId: string; // which library it belongs to
    installDate: string;
    version?: string;
    source?: string;
}

export interface LibraryConfig {
    libraries: LibraryPath[];
    games: InstalledGameRegistry[];
}

class LibraryService {
    private configPath: string;
    private config: LibraryConfig;

    constructor() {
        this.configPath = join(app.getPath('userData'), 'library_config.json');
        this.config = this.loadConfig();
        this.registerHandlers();
        this.syncDefenderExclusions();
    }

    private loadConfig(): LibraryConfig {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
            }
        } catch (e) {
            console.error('Failed to load library config, resetting', e);
        }
        
        // Default Config — use a dedicated folder at the root of the system drive
        const defaultLibPath = join(process.env.SystemDrive || 'C:', 'JeuxCracks');
        if (!fs.existsSync(defaultLibPath)) {
            fs.mkdirSync(defaultLibPath, { recursive: true });
        }

        return {
            libraries: [{
                id: 'default',
                path: defaultLibPath,
                label: 'Défaut',
                isDefault: true
            }],
            games: []
        };
    }

    private saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        } catch (e) {
            console.error('Failed to save library config', e);
        }
    }

    private registerHandlers() {
        ipcMain.handle('get-libraries', () => this.getLibraries());
        ipcMain.handle('add-library', (_, path) => this.addLibrary(path));
        ipcMain.handle('remove-library', (_, id) => this.removeLibrary(id));
        ipcMain.handle('set-default-library', (_, id) => this.setDefaultLibrary(id));
        ipcMain.handle('rename-library', (_, id, name) => this.renameLibrary(id, name));
        
        ipcMain.handle('get-installed-games', () => this.config.games);
        ipcMain.handle('get-game-install-info', (_, gameId) => this.getGameInfo(gameId));
        
        ipcMain.handle('register-game-exe', (_, { gameId, exePath }) => this.updateGameExe(gameId, exePath));
        ipcMain.handle('open-file-dialog-exe', async () => {
             const { dialog } = require('electron');
             const result = await dialog.showOpenDialog(getMainWindow(), {
                 properties: ['openFile'],
                 filters: [{ name: 'Executables', extensions: ['exe'] }]
             });
             if (!result.canceled && result.filePaths.length > 0) return result.filePaths[0];
             return null;
        });
    }

    public getLibraries() {
        return this.config.libraries;
    }

    public addLibrary(path: string) {
        if (this.config.libraries.some(l => l.path === path)) return false;
        
        const id = Date.now().toString();
        this.config.libraries.push({
            id,
            path,
            label: `Bibliothèque ${this.config.libraries.length + 1}`,
            isDefault: false
        });
        this.saveConfig();
        this.syncDefenderExclusions();
        return this.config.libraries;
    }

    public removeLibrary(id: string) {
        if (id === 'default') return false;
        this.config.libraries = this.config.libraries.filter(l => l.id !== id);
        this.saveConfig();
        return this.config.libraries;
    }

    public setDefaultLibrary(id: string) {
        this.config.libraries.forEach(l => l.isDefault = (l.id === id));
        this.saveConfig();
        return this.config.libraries;
    }

    public renameLibrary(id: string, name: string) {
        const lib = this.config.libraries.find(l => l.id === id);
        if (lib) {
            lib.label = name;
            this.saveConfig();
        }
        return this.config.libraries;
    }

    public getDefaultLibraryPath(): string {
        const def = this.config.libraries.find(l => l.isDefault);
        return def ? def.path : this.config.libraries[0].path;
    }

    public registerInstalledGame(game: InstalledGameRegistry) {
        this.config.games = this.config.games.filter(g => g.id !== game.id);
        this.config.games.push(game);
        this.saveConfig();
    }

    public updateGameExe(gameId: string, exePath: string) {
        const game = this.config.games.find(g => g.id === gameId);
        if (game) {
            game.exePath = exePath;
            this.saveConfig();
            return true;
        }
        return false;
    }

    public getGameInfo(gameId: string) {
        return this.config.games.find(g => g.id === gameId);
    }
    
    public isGameInstalled(gameId: string) {
        return this.config.games.some(g => g.id === gameId);
    }

    public getInstalledGames() {
        return this.config.games;
    }

    public removeGame(gameId: string) {
        this.config.games = this.config.games.filter(g => g.id !== gameId);
        this.saveConfig();
    }

    /**
     * Add library paths as Windows Defender exclusions.
     * Caches synced paths locally — UAC only triggers for NEW paths.
     */
    private syncDefenderExclusions() {
        try {
            const paths = this.config.libraries.map(l => l.path).filter(p => fs.existsSync(p));
            if (paths.length === 0) return;

            // Read local cache of already-synced paths
            const cachePath = join(app.getPath('userData'), '.defender_cache.json');
            let cached: string[] = [];
            try {
                if (fs.existsSync(cachePath)) cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
            } catch { /* ignore */ }

            const newPaths = paths.filter(p => !cached.includes(p));
            if (newPaths.length === 0) {
                console.log('🛡️ Defender — all paths already synced, skipping');
                return;
            }

            // Build elevated PowerShell command for only the new paths
            const pathsArg = newPaths.map(p => "'" + p.replace(/'/g, "''") + "'").join(',');
            const innerScript = `$paths = @(${pathsArg}); foreach($p in $paths){ Add-MpPreference -ExclusionPath $p -ErrorAction SilentlyContinue }`;
            
            // Encode to Base64 in UTF-16LE, which is explicitly required by PowerShell's -EncodedCommand
            const base64Script = Buffer.from(innerScript, 'utf16le').toString('base64');
            const cmd = `powershell -WindowStyle Hidden -NoProfile -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -NoProfile -EncodedCommand ${base64Script}' -Verb RunAs -Wait"`;

            exec(cmd, { windowsHide: true }, (err) => {
                if (err) {
                    console.warn('⚠️ Defender — user declined UAC or error');
                } else {
                    const all = [...new Set([...cached, ...newPaths])];
                    try { fs.writeFileSync(cachePath, JSON.stringify(all)); } catch { /* ignore */ }
                    console.log(`🛡️ Defender exclusions added for ${newPaths.length} new path(s)`);
                }
            });
        } catch (e) {
            console.warn('⚠️ Defender exclusion sync failed:', e);
        }
    }
}

export const libraryService = new LibraryService();
