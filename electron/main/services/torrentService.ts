import { BrowserWindow, ipcMain, app } from 'electron';
import { installService } from './installService';
import * as fs from 'fs';
import { join } from 'path';
import * as https from 'https';
import * as http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { getMainWindow } from '..';
import Aria2 from 'aria2';

// Ensure standard paths
const isPackaged = app.isPackaged;
let aria2cPath = isPackaged 
    ? join(process.resourcesPath, 'assets', 'aria2c', 'aria2c.exe')
    : join(__dirname, '../../assets/aria2c/aria2c.exe');

// Production Fallback: electron-builder might put extraResources directly in resources/
if (isPackaged && !fs.existsSync(aria2cPath)) {
    const fallbackPath = join(process.resourcesPath, 'aria2c', 'aria2c.exe');
    if (fs.existsSync(fallbackPath)) {
        aria2cPath = fallbackPath;
    }
}
console.log(`🔍 Path Aria2c résolu (${isPackaged ? 'PROD' : 'DEV'}): ${aria2cPath}`);
if (isPackaged && !fs.existsSync(aria2cPath)) {
    console.error('❌ CRITIQUE: aria2c.exe introuvable dans le package !');
}

export class TorrentService {
  private aria2Process: ChildProcess | null = null;
  private aria2Client: Aria2;
  private activeTorrents = new Map<string, any>(); // infoHash -> { gid, gameData, savePath }
  private torrentsMetadataFile = join(app.getPath('userData'), 'downloads', 'torrents_metav2.json');
  private pollInterval: NodeJS.Timeout | null = null;
  private isReady = false; // true une fois la connexion RPC Aria2c confirmée

  private downloadLimit = 0;
  private uploadLimit = 0;

  // Liste de trackers publics actifs (basée sur ngosang/trackerslist).
  // Les anciens trackers morts (coppersurfer.tk, zer0day.to, leechers-paradise...)
  // ralentissaient la récupération des métadonnées des magnets.
  private globalTrackersArray = [
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://open.demonii.com:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://explodie.org:6969/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://tracker.dler.org:6969/announce",
    "udp://opentracker.i2p.rocks:6969/announce",
    "udp://tracker.openbittorrent.com:6969/announce",
    "http://tracker.openbittorrent.com:80/announce",
    "udp://tracker.tiny-vps.com:6969/announce",
    "udp://tracker-udp.gbitt.info:80/announce",
    "udp://tracker.moeking.me:6969/announce",
    "udp://p4p.arenabg.com:1337/announce",
    "https://tracker.tamersunion.org:443/announce"
  ];
  
  constructor() {
    this.aria2Client = new Aria2({
      host: '127.0.0.1',
      port: 16800,
      secure: false,
      secret: 'JeuxCracksV2',
      path: '/jsonrpc'
    });

    ipcMain.handle('start-torrent', this.startTorrent);
    ipcMain.on('pause-torrent', this.pauseTorrent);
    ipcMain.on('resume-torrent', this.resumeTorrent);
    ipcMain.on('stop-torrent', (event, infoHash, savePath) => this.stopTorrent(event, infoHash, savePath));
    ipcMain.on('stop-torrent-by-id', (event, gameID) => this.stopTorrentByGameId(event, gameID));
    
    this.initAria2();
  }

  /**
   * Exclut aria2c.exe de Windows Defender (une seule fois, mise en cache).
   * En production, l'app tourne en administrateur : les téléchargeurs P2P comme aria2c
   * sont souvent bloqués/quarantinés par l'antivirus, ce qui laisse les téléchargements
   * bloqués à 0%. On applique l'exclusion AVANT de lancer le process.
   */
  private ensureAntivirusExclusion() {
      try {
          const cachePath = join(app.getPath('userData'), '.aria2_defender_cache');
          if (fs.existsSync(cachePath)) return; // déjà fait

          const aria2Dir = require('path').dirname(aria2cPath).replace(/'/g, "''");
          const inner =
              `Add-MpPreference -ExclusionProcess 'aria2c.exe' -ErrorAction SilentlyContinue; ` +
              `Add-MpPreference -ExclusionPath '${aria2Dir}' -ErrorAction SilentlyContinue`;
          const b64 = Buffer.from(inner, 'utf16le').toString('base64');

          const { execSync } = require('child_process');
          // L'app est lancée en admin (requestedExecutionLevel: requireAdministrator),
          // donc Add-MpPreference s'exécute sans nouvelle invite UAC. Timeout de sécurité.
          execSync(`powershell -WindowStyle Hidden -NoProfile -EncodedCommand ${b64}`, {
              windowsHide: true,
              timeout: 15000,
              stdio: 'ignore'
          });
          fs.writeFileSync(cachePath, '1');
          console.log('🛡️ Exclusion Defender ajoutée pour aria2c.exe');
      } catch (e) {
          // Non bloquant : si l'exclusion échoue (dev non-admin, autre AV...), on continue.
          console.warn('⚠️ Exclusion Defender aria2c non appliquée (non bloquant).');
      }
  }

  private async initAria2() {
    try {
      console.log('🚀 Démarrage du moteur Aria2c (V2 Hyper-Vitesse)...');

      // Exclusion antivirus AVANT de démarrer aria2c (sinon Defender peut le bloquer en prod).
      this.ensureAntivirusExclusion();

      // Force kill any zombie aria2c process before starting a new one
      try {
          const { execSync } = require('child_process');
          execSync('taskkill /F /IM aria2c.exe /T', { windowsHide: true, stdio: 'ignore' });
          console.log('🧹 Processus Aria2c fantôme nettoyé.');
          // Wait for OS to release port 6800
          await new Promise(r => setTimeout(r, 500));
      } catch (e) {
          // Normal if no process exists
      }

      const dhtPath = join(app.getPath('userData'), 'dht.dat');
      const dht6Path = join(app.getPath('userData'), 'dht6.dat');
      
      const globalTrackers = this.globalTrackersArray.join(",");

      const args = [
        '--enable-rpc=true',
        '--rpc-listen-all=false', // Only listen on loopback for security
        '--rpc-allow-origin-all=true',
        '--rpc-listen-port=16800',
        '--rpc-secret=JeuxCracksV2',
        '--no-conf=true', // Ignore any system-wide aria2.conf
        
        // --- 🚀 PERFORMANCE EXTREME (qBittorrent-like) ---
        '--max-concurrent-downloads=10',
        '--max-connection-per-server=16',
        '--split=16',
        '--min-split-size=1M',
        '--bt-max-peers=200',
        '--bt-request-peer-speed-limit=10M',
        '--file-allocation=none',
        '--seed-time=0',
        
        // --- 🌍 RESEAU ET TRACKERS ---
        `--bt-tracker=${globalTrackers}`,
        '--bt-save-metadata=true',
        '--bt-load-saved-metadata=true',
        "--bt-enable-lpd=true",
        "--enable-dht=true",
        "--enable-dht6=true",
        `--dht-file-path=${dhtPath}`,
        `--dht-file-path6=${dht6Path}`,
        "--dht-listen-port=6881-6999",
        "--dht-entry-point=dht.transmissionbt.com:6881",
        "--dht-entry-point6=dht.transmissionbt.com:6881",
        "--dht-entry-point=router.bittorrent.com:6881",
        "--dht-entry-point=router.utorrent.com:6881",
        "--enable-peer-exchange=true",
        "--listen-port=6881-6999",
        
        // --- ⏱️ TIMEOUTS ---
        "--bt-tracker-connect-timeout=5",
        '--bt-tracker-interval=15',
        
        // --- 📁 FICHIERS ---
        '--continue=true',
        '--allow-overwrite=true',
        '--auto-file-renaming=false',
        `--dir=${app.getPath('downloads')}`
      ];

      this.aria2Process = spawn(aria2cPath, args, { windowsHide: true });
      
      this.aria2Process.on('error', (err) => {
        console.error('❌ Erreur process Aria2c:', err);
      });

      this.aria2Process.on('exit', (code) => {
        console.log(`🛑 Aria2c s'est arrêté (Code: ${code})`);
      });

      // Wait a moment for aria2c to start its RPC server
      await new Promise(r => setTimeout(r, 1500));
      
      await this.aria2Client.open();
      
      // Verify connection works with a simple call
      try {
        const ver = await this.aria2Client.call('getVersion');
        this.isReady = true;
        console.log('✅ Connecté au serveur RPC Aria2c! Version:', ver.version);
      } catch(e) {
        console.error('❌ Connexion Aria2c échouée (auth test):', e.message);
        
        // If unauthorized, it means we are talking to the WRONG process. Kill again and retry?
        if (e.message.includes('Unauthorized')) {
            console.log('⚠️ Erreur d\'authentification - possible conflit de processus. Tentative de reconnexion...');
        }

        console.log('🔄 Retry connexion dans 2s...');
        await new Promise(r => setTimeout(r, 2000));
        try {
          await this.aria2Client.close().catch(() => {});
          await this.aria2Client.open();
          const ver = await this.aria2Client.call('getVersion');
          this.isReady = true;
          console.log('✅ Connecté au serveur RPC Aria2c (retry)! Version:', ver.version);
        } catch(e2) {
            console.error('❌ Échec critique Aria2c après retry:', e2.message);
        }
      }

      // Load Metadatas
      this.loadState();
      
      // Start polling
      this.startPolling();

      // Listeners
      this.aria2Client.on('onDownloadComplete', async ([events]) => {
          console.log('✅ Événement RPC: Téléchargement terminé (GID:', events.gid, ')');
          await this.handleDownloadComplete(events.gid);
      });
      this.aria2Client.on('onBtDownloadComplete', async ([events]) => {
          console.log('✅ Événement RPC (BT): Téléchargement terminé (GID:', events.gid, ')');
          await this.handleDownloadComplete(events.gid);
      });
      this.aria2Client.on('onDownloadError', async ([events]) => {
          console.warn('❌ Événement RPC: Erreur téléchargement (GID:', events.gid, ')');
          // Remonter l'erreur réelle à l'utilisateur au lieu de laisser un téléchargement figé à 0%.
          try {
              const status = await this.aria2Client.call('tellStatus', events.gid, [
                  'errorCode', 'errorMessage'
              ]);
              let title = '';
              for (const [, info] of this.activeTorrents.entries()) {
                  if (info.gid === events.gid) { title = info.gameData?.title || ''; break; }
              }
              const reason = status?.errorMessage || `Code ${status?.errorCode || 'inconnu'}`;
              const win = getMainWindow();
              win?.webContents.send('error', `Téléchargement échoué${title ? ` (${title})` : ''} : ${reason}`);
          } catch (e) {
              const win = getMainWindow();
              win?.webContents.send('error', 'Le téléchargement a échoué (erreur Aria2).');
          }
      });

    } catch (e) {
      console.error('❌ Impossible de démarrer Aria2c:', e);
    }
  }

  public setDownloadLimit(bytes: number) {
      this.downloadLimit = bytes;
      if (this.aria2Client) {
          this.aria2Client.call('changeGlobalOption', { 'max-overall-download-limit': bytes <= 0 ? '0' : bytes.toString() }).catch(console.error);
          console.log('📉 Limite DL Aria2:', bytes <= 0 ? 'Illimité' : bytes + ' o/s');
      }
  }

  public setUploadLimit(bytes: number) {
      this.uploadLimit = bytes;
      if (this.aria2Client) {
          this.aria2Client.call('changeGlobalOption', { 'max-overall-upload-limit': bytes <= 0 ? '0' : bytes.toString() }).catch(console.error);
          console.log('📈 Limite UP Aria2:', bytes <= 0 ? 'Illimité' : bytes + ' o/s');
      }
  }

  public getLimits() {
      return { download: this.downloadLimit, upload: this.uploadLimit };
  }

  /**
   * Attend que le moteur Aria2c soit réellement joignable avant d'ajouter un torrent.
   * Sans cette garde, un téléchargement lancé pendant l'initialisation (ou si Aria2c
   * démarre lentement en prod à cause de l'antivirus) échoue silencieusement et reste figé à 0%.
   */
  private async ensureReady(timeoutMs = 25000): Promise<boolean> {
      if (this.isReady) return true;
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
          try {
              await this.aria2Client.call('getVersion');
              this.isReady = true;
              return true;
          } catch (e) {
              // Pas encore prêt : on retente après une courte pause
              await new Promise(r => setTimeout(r, 800));
          }
      }
      return this.isReady;
  }

  private saveState() {
     try {
         const data = Array.from(this.activeTorrents.values());
         fs.writeFileSync(this.torrentsMetadataFile, JSON.stringify(data, null, 2));
     } catch (error) {
         console.error('❌ Erreur sauvegarde metadata Aria2:', error);
     }
  }

   private loadState() {
     try {
         if (fs.existsSync(this.torrentsMetadataFile)) {
             const data = JSON.parse(fs.readFileSync(this.torrentsMetadataFile, 'utf8'));
             console.log(`📂 Récupération de ${data.length} téléchargements Aria2c sauvegardés.`);
             
             // Process each saved torrent
             data.forEach(async (item: any) => {
                if(item.torrentFile) {
                    try {
                        const status = await this.aria2Client.call('tellStatus', item.gid);
                        if(status.status === 'paused') {
                            await this.aria2Client.call('unpause', item.gid);
                        }
                        // GID is still valid, register in activeTorrents
                        this.activeTorrents.set(item.infoHash, item);
                    } catch(e) {
                        // GID is expired (new Aria2c session), re-add from scratch
                        console.log('♻️ Re-adding torrent to session:', item.gameData?.title);
                        // Do NOT add the old entry to activeTorrents — startTorrent will create a fresh one
                        this.startTorrent(null, item.torrentFile, item.savePath, item.gameData, false);
                    }
                }
             });
         }
     } catch (error) {
         console.error('❌ Erreur chargement metadata Aria2:', error);
     }
  }

  public startTorrent = async (_event, torrentFile: string | Buffer, savePath: string, gameData: any, isNewLaunch: boolean = true) => {
    try {
      console.log('🚀 Torrent V2: Ajout de', gameData.title);

      // Garde: s'assurer qu'Aria2c est connecté avant d'ajouter le torrent.
      const ready = await this.ensureReady();
      if (!ready) {
          console.error('❌ Aria2c indisponible: impossible de démarrer le téléchargement de', gameData.title);
          const win = getMainWindow();
          win?.webContents.send('error', "Le moteur de téléchargement (Aria2) n'a pas démarré. Redémarrez l'application ; si le problème persiste, vérifiez que votre antivirus/pare-feu ne bloque pas aria2c.exe.");
          win?.webContents.send('download-done', gameData.title); // Retire le téléchargement fantôme figé à 0%
          return;
      }

      let gid = '';

      if (typeof torrentFile === 'string' && (torrentFile.startsWith('magnet:') || torrentFile.toLowerCase().endsWith('.torrent'))) {
          // Magnet URI or .torrent URL
          // Ensure save directory exists before sending to Aria2c
          try { fs.mkdirSync(savePath, { recursive: true }); } catch(e) {}
          
          if (torrentFile.toLowerCase().endsWith('.torrent')) {
              // Direct URL to a .torrent file
              try {
                  console.log(`🌐 Téléchargement du fichier .torrent depuis: ${torrentFile}`);
                  const torrentBuffer = await this.fetchTorrentFile(torrentFile);
                  if (torrentBuffer && torrentBuffer.length > 100) {
                      const torrentBase64 = torrentBuffer.toString('base64');
                      gid = await this.aria2Client.call('aria2.addTorrent', torrentBase64, [], {
                          dir: savePath,
                          'bt-tracker': this.globalTrackersArray.join(',')
                      });
                      console.log('✅ .torrent URL chargé avec succès ! Métadonnées instantanées.');
                  }
              } catch (e) {
                  console.error('❌ Erreur téléchargement .torrent URL, tentative magnet fallback si possible:', e.message);
              }
          }

          if (!gid && torrentFile.startsWith('magnet:')) {
              // 1. PRIORITÉ: récupérer le .torrent (avec métadonnées intégrées) via un cache public.
              //    Aria2 échoue souvent à récupérer les métadonnées d'un magnet sur les swarms
              //    clairsemés (OnlineFix), ce qui laisse le téléchargement bloqué à 0%. Un client
              //    comme qBittorrent y arrive grâce à une table DHT chaude ; ici on court-circuite
              //    le problème en fournissant directement le .torrent à aria2.
              try {
                  const cachedTorrent = await this.fetchTorrentFromMagnetCache(torrentFile);
                  if (cachedTorrent && cachedTorrent.length > 100) {
                      gid = await this.aria2Client.call('aria2.addTorrent', cachedTorrent.toString('base64'), [], {
                          dir: savePath,
                          'bt-tracker': this.globalTrackersArray.join(',')
                      });
                      console.log('✅ .torrent récupéré via cache public (métadonnées instantanées) pour', gameData.title);
                  }
              } catch (e) {
                  console.warn('⚠️ Cache .torrent indisponible, fallback sur le magnet:', e.message);
              }

              // 2. FALLBACK: ajouter le magnet directement (aria2 tentera les métadonnées via peers/DHT).
              if (!gid) {
                  let finalMagnet = torrentFile;
                  for (const tr of this.globalTrackersArray) {
                      const encodedTr = encodeURIComponent(tr);
                      if (!finalMagnet.includes(encodedTr)) {
                          finalMagnet += `&tr=${encodedTr}`;
                      }
                  }

                  gid = await this.aria2Client.call('aria2.addUri', [finalMagnet], {
                      dir: savePath,
                      'bt-tracker': this.globalTrackersArray.join(','),
                      'bt-save-metadata': 'true',
                      'bt-load-saved-metadata': 'true'
                  });
                  console.log('🧲 Magnet envoyé à Aria2 (fallback) avec', this.globalTrackersArray.length, 'trackers injectés');
              }
          }
      } else {
          // Physical Torrent File (.torrent)
          let torrentBase64 = '';
          if (Buffer.isBuffer(torrentFile)) {
            torrentBase64 = torrentFile.toString('base64');
          } else if (typeof torrentFile === 'string' && fs.existsSync(torrentFile)) {
            torrentBase64 = fs.readFileSync(torrentFile).toString('base64');
          } else {
            throw new Error('Fichier torrent ou lien magnet invalide');
          }

          // Ensure save directory exists before sending to Aria2c
          try { fs.mkdirSync(savePath, { recursive: true }); } catch(e) {}

          gid = await this.aria2Client.call('aria2.addTorrent', torrentBase64, [], {
              dir: savePath,
              'bt-tracker': this.globalTrackersArray.join(',')
          });
      }

      console.log('✅ Torrent ajouté à Aria2c avec GID:', gid);

      // Add to activeTorrents using gid as the temporary infoHash 
      // (The polling loop will update it to the real infoHash once Aria2 resolves the magnet metadata)
      this.activeTorrents.set(gid, {
          gid,
          infoHash: gid,
          gameData,
          savePath,
          torrentFile: typeof torrentFile === 'string' ? torrentFile : null,
          isCompleting: false,
          addedAt: Date.now(),
          retryCount: 0
      });
      this.saveState();
      
      // Force initial progress payload for UI to wake up
      const win = getMainWindow();
      win?.webContents.send('download-progress', {
          gameID: gameData.id,
          title: gameData.title,
          name: gameData.title,
          infoHash: gid,
          progress: 0, 
          downloaded: 0,
          total: 0,
          downloadSpeed: 0,
          numPeers: 0,
          path: savePath,
          ready: false,
          paused: false,
          done: false,
          downloadType: 'torrent',
          gameData: gameData // 🚀 Pass gameData to store Auto-Resurrect
      }, gameData.title);

    } catch (error) {
      console.error('❌ Erreur ajout torrent Aria2:', error);
      const win = getMainWindow();
      win?.webContents.send('error', `Erreur de téléchargement: ${error.message}`);
    }
  }

  private pauseTorrent = async (_, infoHash: string) => {
    try {
      const torrentInfo = this.activeTorrents.get(infoHash);
      if (torrentInfo && torrentInfo.gid) {
        await this.aria2Client.call('aria2.pause', torrentInfo.gid);
        console.log('⏸️ Torrent mis en pause:', infoHash);
      }
    } catch (error) {
      console.error('Erreur pause Aria2:', error);
    }
  };

  private resumeTorrent = async (event, infoHash: string, savePath: string, gameData: any) => {
    try {
        const torrentInfo = this.activeTorrents.get(infoHash);
        if (torrentInfo && torrentInfo.gid) {
            await this.aria2Client.call('aria2.unpause', torrentInfo.gid);
            console.log('▶️ Torrent repris:', infoHash);
        } else {
            console.log('♻️ Torrent introuvable dans la session active, rechargement complet:', gameData.title);
            // Re-call start if missing
            if(torrentInfo?.torrentFile) {
                this.startTorrent(event, torrentInfo.torrentFile, savePath, gameData);
            }
        }
    } catch (error) {
      // If GID is invalid (e.g., restarted app but torrent finished/removed), try to re-add
      console.error('Erreur reprise Aria2, tentative de réajout:', error);
      if(gameData && savePath){
          const torrentInfo = this.activeTorrents.get(infoHash);
          if (torrentInfo?.torrentFile) {
              this.startTorrent(null, torrentInfo.torrentFile, savePath, gameData);
          }
      }
    }
  };

  private stopTorrent = async (_, infoHash: string, savePath?: string) => {
    try {
      console.log("🛑 Tentative d'arrêt Aria2:", infoHash);
      const torrentInfo = this.activeTorrents.get(infoHash);
      
      if (torrentInfo && torrentInfo.gid) {
        try {
            await this.aria2Client.call('aria2.remove', torrentInfo.gid);
        } catch(e) { /* Ignore if already removed */ }
        
        this.activeTorrents.delete(infoHash);
        this.saveState();
        
        if (savePath) {
          try {
            await fs.promises.rm(savePath, { recursive: true, force: true });
            console.log('🗑️ Fichiers partiels supprimés:', savePath);
          } catch (e) { console.error('Erreur suppression:', e); }
        }
      }
    } catch (error) {
      console.error('Erreur arrêt Aria2:', error);
    }
  };

  private stopTorrentByGameId = async (event, gameID: string) => {
      for (const [hash, meta] of this.activeTorrents.entries()) {
          if (meta.gameData && String(meta.gameData.id) === String(gameID)) {
              await this.stopTorrent(event, hash, meta.savePath);
              break;
          }
      }
  };

  private startPolling() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      
      this.pollInterval = setInterval(async () => {
          try {
              if (!this.aria2Client) return;
              
              // Get active, waiting, and paused downloads to cover everything
              const active = await this.aria2Client.call('aria2.tellActive') || [];
              const waiting = await this.aria2Client.call('aria2.tellWaiting', 0, 100) || [];
              const stopped = await this.aria2Client.call('aria2.tellStopped', 0, 100) || [];
              
              const allDownloads = [...active, ...waiting, ...stopped];
              const win = getMainWindow();
              if (!win) return;

              for (const [infoHash, torrentInfo] of this.activeTorrents.entries()) {
                  // Find the matching download in Aria2 by GID or InfoHash
                  const status = allDownloads.find(d => d.gid === torrentInfo.gid || d.infoHash === infoHash);
                  
                  if (!status) {
                      console.log('🚨 Polling Aria2: GID/Hash non trouvé dans allDownloads:', torrentInfo.gid, infoHash, '| Downloads count:', allDownloads.length);
                      
                      // Watchdog: if the download has been stalled (not found in Aria2 at all) for >30s, retry
                      if (torrentInfo.addedAt && Date.now() - torrentInfo.addedAt > 30000 && (torrentInfo.retryCount || 0) < 3) {
                          console.log('⚠️ Watchdog: Torrent non trouvé depuis', Math.round((Date.now() - torrentInfo.addedAt) / 1000), 's. Retry automatique pour', torrentInfo.gameData.title);
                          torrentInfo.retryCount = (torrentInfo.retryCount || 0) + 1;
                          torrentInfo.addedAt = Date.now();
                          this.activeTorrents.delete(infoHash);
                          this.saveState();
                          // Re-add the torrent
                          if (torrentInfo.torrentFile) {
                              this.startTorrent(null, torrentInfo.torrentFile, torrentInfo.savePath, torrentInfo.gameData, false);
                          }
                      }
                  }

                  if (status) {
                      // Validate if infohash evolved (Magnet Link metadata downloaded)
                      if(status.infoHash && status.infoHash !== infoHash) {
                          torrentInfo.infoHash = status.infoHash;
                          this.activeTorrents.delete(infoHash);
                          this.activeTorrents.set(status.infoHash, torrentInfo);
                          this.saveState();
                      }

                      const totalLength = parseInt(status.totalLength, 10) || 0;
                      const completedLength = parseInt(status.completedLength, 10) || 0;
                      const progressFloat = totalLength > 0 ? completedLength / totalLength : 0;
                      
                      // Watchdog: if metadata not resolved after 45s (totalLength still 0), retry
                      if (totalLength === 0 && torrentInfo.addedAt && Date.now() - torrentInfo.addedAt > 45000 && (torrentInfo.retryCount || 0) < 3) {
                          console.log('⚠️ Watchdog Metadata: Aucun metadata après', Math.round((Date.now() - torrentInfo.addedAt) / 1000), 's pour', torrentInfo.gameData.title, '- Retry', (torrentInfo.retryCount || 0) + 1);
                          
                          // Remove the stalled download from Aria2
                          try { await this.aria2Client.call('aria2.forceRemove', torrentInfo.gid); } catch(e) {}
                          try { await this.aria2Client.call('aria2.removeDownloadResult', torrentInfo.gid); } catch(e) {}
                          
                          torrentInfo.retryCount = (torrentInfo.retryCount || 0) + 1;
                          torrentInfo.addedAt = Date.now();
                          this.activeTorrents.delete(infoHash);
                          this.saveState();
                          // Re-add the torrent
                          if (torrentInfo.torrentFile) {
                              this.startTorrent(null, torrentInfo.torrentFile, torrentInfo.savePath, torrentInfo.gameData, false);
                          }
                          continue;
                      }
                      
                      // Check real file completion (Magnet transitions don't count here as their status is active, followedBy newGID)
                      const isComplete = status.status === 'complete' || (totalLength > 0 && completedLength === totalLength && !status.followedBy);
                      
                      // Aggressive fallback to catch missed 'onDownloadComplete' RPC events
                      if (isComplete && !torrentInfo.isCompleting) {
                          torrentInfo.isCompleting = true;
                          this.handleDownloadComplete(status.gid);
                      }
                      
                      const torrentData = {
                          gameID: torrentInfo.gameData.id,
                          title: torrentInfo.gameData.title,
                          name: status.bittorrent?.info?.name || torrentInfo.gameData.title,
                          infoHash: torrentInfo.infoHash,
                          progress: progressFloat, 
                          downloaded: completedLength,
                          received: completedLength,
                          total: totalLength,
                          timeRemaining: parseInt(status.downloadSpeed, 10) > 0 ? ((totalLength - completedLength) / parseInt(status.downloadSpeed, 10)) * 1000 : 0, 
                          uploaded: parseInt(status.uploadLength, 10) || 0,
                          downloadSpeed: parseInt(status.downloadSpeed, 10) || 0,
                          uploadSpeed: parseInt(status.uploadSpeed, 10) || 0,
                          numPeers: parseInt(status.connections, 10) || 0,
                          path: status.dir,
                          ready: true,
                          paused: status.status === 'paused',
                          done: isComplete,
                          downloadType: 'torrent',
                          gameData: torrentInfo.gameData // 🚀 Pass gameData to store Auto-Resurrect
                      };
                      
                      win.webContents.send('download-progress', torrentData, torrentInfo.gameData.title);
                  }
              }
          } catch (error) {
              console.warn('Erreur polling Aria2:', error.message);
          }
      }, 1000);
  }

  private async handleDownloadComplete(gid: string) {
      // 1. Check if this is just a metadata (.torrent) download for a magnet link
      try {
          const status = await this.aria2Client.call('aria2.tellStatus', gid);
          if (status && status.followedBy && status.followedBy.length > 0) {
              const newGid = status.followedBy[0];
              console.log(`🔗 Magnet vers Torrent: Bascule du GID ${gid} vers le nouveau GID réel ${newGid}`);
              
              let foundKey = null;
              for (const [infoHash, torrentInfo] of this.activeTorrents.entries()) {
                  if (torrentInfo.gid === gid) {
                      foundKey = infoHash;
                      break;
                  }
              }

              if (foundKey) {
                  const torrentInfo = this.activeTorrents.get(foundKey);
                  // Aria2 will soon provide the real infoHash in `tellStatus`, but for now we track by newGid
                  torrentInfo.gid = newGid;
                  
                  // Wait a beat to let aria2c register the new download, then fetch the real infoHash
                  setTimeout(async () => {
                      try {
                          const newStatus = await this.aria2Client.call('aria2.tellStatus', newGid);
                          if(newStatus && newStatus.infoHash) {
                              torrentInfo.infoHash = newStatus.infoHash;
                              this.activeTorrents.delete(foundKey);
                              this.activeTorrents.set(newStatus.infoHash, torrentInfo);
                              this.saveState();
                          }
                      } catch(e) {}
                  }, 2000);

                  // Clean up the memory record of the Magnet download
                  try { await this.aria2Client.call('aria2.removeDownloadResult', gid); } catch(e) {}
                  return; // Exit silently, this is just the metadata
              }
          }
      } catch (error) {
          // It's possible the GID is already gone or it's a normal completion, just proceed
      }

      // 2. Real Completion Check
      // Find which torrent finished
      for (const [infoHash, torrentInfo] of this.activeTorrents.entries()) {
          if (torrentInfo.gid === gid) {
              
              console.log('🎉 Torrent terminé dans Aria2:', torrentInfo.gameData.title);
              torrentInfo.isCompleting = true;
              
              const win = getMainWindow();
              win?.webContents.send('download-done', torrentInfo.gameData.title);

              // Remove from Aria2 but keep files (force remove)
              try {
                  // If it's seeding, removeDownloadResult fails. We MUST forceRemove to kill the seeding and release file handles.
                  await this.aria2Client.call('aria2.forceRemove', gid);
              } catch(e) {}
              
              try {
                  // Clean up the memory record
                  await this.aria2Client.call('aria2.removeDownloadResult', gid);
              } catch(e) {}

              this.activeTorrents.delete(infoHash);
              this.saveState();
              
              // Remove .torrent file if it exists
              if (torrentInfo.torrentFile && fs.existsSync(torrentInfo.torrentFile)) {
                  try {
                      fs.unlinkSync(torrentInfo.torrentFile);
                  } catch(e) {}
              }

              // Petit délai pour laisser le temps à Aria2 et Windows Defender de libérer le fichier (File Lock)
              console.log('⏳ Attente de 3s pour libération des handles de fichiers...');
              setTimeout(() => {
                  // Lancement de l'Installation (Extraction V2)
                  console.log('🚀 Lancement de installService.installGame...');
                  installService.installGame(torrentInfo.gameData, torrentInfo.savePath);
              }, 3000);
              
              break;
          }
      }
  }

  private fetchTorrentFile(url: string): Promise<Buffer> {
      return new Promise((resolve, reject) => {
          const client = url.startsWith('https') ? https : http;
          const request = client.get(url, { timeout: 10000 }, (res) => {
              // Follow redirects
              if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                  this.fetchTorrentFile(res.headers.location).then(resolve).catch(reject);
                  return;
              }
              if (res.statusCode !== 200) {
                  reject(new Error(`HTTP ${res.statusCode}`));
                  return;
              }
              const chunks: Buffer[] = [];
              res.on('data', (chunk: Buffer) => chunks.push(chunk));
              res.on('end', () => resolve(Buffer.concat(chunks)));
              res.on('error', reject);
          });
          request.on('error', reject);
          request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
      });
  }

  /**
   * Extrait le info-hash (btih, hex 40 caractères) d'un lien magnet.
   * Renvoie null si absent ou en base32 (non supporté par le cache).
   */
  private extractInfoHash(magnet: string): string | null {
      const m = magnet.match(/xt=urn:btih:([a-fA-F0-9]{40})/i);
      return m ? m[1].toUpperCase() : null;
  }

  /**
   * Récupère le fichier .torrent (avec métadonnées) depuis un cache public à partir
   * du info-hash d'un magnet. Permet à aria2 de démarrer immédiatement, sans dépendre
   * de la récupération des métadonnées via les peers (qui échoue sur les swarms clairsemés).
   * Renvoie un Buffer .torrent valide, ou null si indisponible.
   */
  private fetchTorrentFromMagnetCache(magnet: string): Promise<Buffer | null> {
      const hash = this.extractInfoHash(magnet);
      if (!hash) return Promise.resolve(null);

      // Caches publics de .torrent par info-hash (essayés dans l'ordre).
      const urls = [
          `https://itorrents.org/torrent/${hash}.torrent`,
          `https://torrage.info/torrent.php?h=${hash}`,
      ];

      // Récupère une URL en suivant les redirections (http OU https), sans jamais lever d'exception.
      const fetchOnce = (url: string, redirects: number): Promise<Buffer | null> => {
          return new Promise((resolve) => {
              let settled = false;
              const finish = (v: Buffer | null) => { if (!settled) { settled = true; resolve(v); } };
              try {
                  // Choisir le bon client selon le protocole (une redirection peut renvoyer du http:).
                  const client = url.startsWith('https:') ? https : http;
                  const req = client.get(url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                      const status = res.statusCode || 0;
                      if (status >= 300 && status < 400 && res.headers.location && redirects < 4) {
                          res.resume(); // vider le flux
                          let next = res.headers.location;
                          try { next = new URL(next, url).toString(); } catch (e) { /* garde tel quel */ }
                          fetchOnce(next, redirects + 1).then(finish);
                          return;
                      }
                      if (status !== 200) { res.resume(); return finish(null); }
                      const chunks: Buffer[] = [];
                      res.on('data', (d: Buffer) => chunks.push(d));
                      res.on('end', () => {
                          const buf = Buffer.concat(chunks);
                          // Un vrai .torrent (bencode) commence par 'd' (0x64) — sinon c'est une page d'erreur HTML.
                          finish(buf.length > 100 && buf[0] === 0x64 ? buf : null);
                      });
                      res.on('error', () => finish(null));
                  });
                  req.on('error', () => finish(null));
                  req.on('timeout', () => { req.destroy(); finish(null); });
              } catch (e) {
                  // ex: ERR_INVALID_PROTOCOL levé de façon synchrone — on ne propage jamais.
                  finish(null);
              }
          });
      };

      return (async () => {
          for (const u of urls) {
              const buf = await fetchOnce(u, 0);
              if (buf) return buf;
          }
          return null;
      })();
  }

  public destroy() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      if (this.aria2Process) {
          console.log('🛑 Kill du process Aria2c...');
          this.aria2Process.kill();
      }
  }

}

export const torrentService = new TorrentService();
