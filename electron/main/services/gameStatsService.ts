import { app, ipcMain } from 'electron';
import { join } from 'path';
import * as fs from 'fs';

interface GameStats {
    totalLaunches: number;
    totalTimePlayedMs: number;
    lastPlayedDate: string | null;
}

interface UserStats {
    [gameId: string]: GameStats;
}

interface StatsDatabase {
    [userId: string]: UserStats;
}

class GameStatsService {
    private configPath: string;
    private db: StatsDatabase;

    constructor() {
        this.configPath = join(app.getPath('userData'), 'game_stats.json');
        console.log('📈 GameStatsService initialized. File path:', this.configPath);
        this.db = this.loadStats();
        // Ensure file exists immediately for debugging/UX
        if (!fs.existsSync(this.configPath)) {
            this.saveStats();
        }
        this.registerHandlers();
    }

    private loadStats(): StatsDatabase {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
            }
        } catch (e) {
            console.error('Failed to load game stats, resetting', e);
        }
        return {};
    }

    private saveStats() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.db, null, 2));
        } catch (e) {
            console.error('Failed to save game stats', e);
        }
    }

    private registerHandlers() {
        ipcMain.handle('get-game-stats', (_, { userId, gameId }) => this.getStats(userId, gameId));
        ipcMain.handle('get-all-user-stats', (_, userId) => this.getAllUserStats(userId));
        ipcMain.handle('get-total-user-stats', (_, userId) => this.getTotalStats(userId));
    }

    public getStats(userId: string, gameId: string, ): GameStats {
        if (!userId) return { totalLaunches: 0, totalTimePlayedMs: 0, lastPlayedDate: null };
        
        if (!this.db[userId]) {
            this.db[userId] = {};
        }
        if (!this.db[userId][gameId]) {
            this.db[userId][gameId] = {
                totalLaunches: 0,
                totalTimePlayedMs: 0,
                lastPlayedDate: null
            };
        }
        return this.db[userId][gameId];
    }

    public getTotalStats(userId: string) {
        if (!userId || !this.db[userId]) return { totalLaunches: 0, totalTimePlayedMs: 0 };
        
        let totalLaunches = 0;
        let totalTimePlayedMs = 0;
        
        Object.values(this.db[userId]).forEach(stat => {
            totalLaunches += stat.totalLaunches;
            totalTimePlayedMs += stat.totalTimePlayedMs;
        });
        
        return { totalLaunches, totalTimePlayedMs };
    }

    public getAllUserStats(userId: string): UserStats {
        if (!userId) return {};
        if (!this.db[userId]) return {};
        return this.db[userId];
    }

    public incrementLaunch(userId: string, gameId: string) {
        if (!userId || !gameId) return;

        const stats = this.getStats(userId, gameId);
        stats.totalLaunches++;
        stats.lastPlayedDate = new Date().toISOString();
        this.saveStats();
        console.log(`📈 Stats updated for user ${userId}, game ${gameId}: Launches = ${stats.totalLaunches}`);
    }

    public addPlaytime(userId: string, gameId: string, durationMs: number) {
        if (!userId || !gameId || durationMs <= 0) return;

        const stats = this.getStats(userId, gameId);
        stats.totalTimePlayedMs += durationMs;
        stats.lastPlayedDate = new Date().toISOString();
        this.saveStats();
        console.log(`⏱️ Playtime updated for user ${userId}, game ${gameId}: +${durationMs}ms (Total: ${stats.totalTimePlayedMs}ms)`);
    }
}

export const gameStatsService = new GameStatsService();
