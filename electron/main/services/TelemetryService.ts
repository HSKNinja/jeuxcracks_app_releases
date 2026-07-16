import si from 'systeminformation';
import { machineId } from 'node-machine-id';
import { app } from 'electron';
import { getMainWindow } from '..';

const API_URL = 'https://api.jeuxcracks.fr/api/telemetry';

export class TelemetryService {
    private static instance: TelemetryService;
    private sessionUuid: string = '';
    private startTime: number = Date.now();
    
    private authToken: string | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    public startupSent: boolean = false;
    private startupInFlight: boolean = false; // garde anti-envois concurrents (évite les doublons 400)

    static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * COLLECTE DES INFOS — chaque appel est wrappé individuellement
     * pour qu'un échec partiel n'empêche pas l'envoi
     */
    async gatherHardwareInfo() {
        // 1. Hardware ID — fallback to random UUID
        let hwid = 'unknown';
        try {
            hwid = await machineId();
        } catch (e) {
            console.warn('⚠️ Telemetry: machineId failed, using fallback');
            hwid = `fallback-${this.generateUUID()}`;
        }

        // 2. CPU
        let cpuInfo = { brand: 'Unknown', physicalCores: 0, cores: 0, speedMax: 0 };
        try {
            cpuInfo = await si.cpu();
        } catch (e) {
            console.warn('⚠️ Telemetry: CPU info failed');
        }

        // 3. GPU
        let gpuName = 'Unknown GPU', gpuVram = 0, gpuDriver = 'unknown';
        try {
            const graphics = await si.graphics();
            const mainGpu = graphics.controllers?.find(g => g.model && !g.model.toLowerCase().includes('basic')) 
                         || graphics.controllers?.[0];
            if (mainGpu) {
                gpuName = mainGpu.model || 'Unknown GPU';
                gpuVram = mainGpu.vram || 0;
                gpuDriver = mainGpu.driverVersion || 'unknown';
            }
        } catch (e) {
            console.warn('⚠️ Telemetry: GPU info failed');
        }

        // 4. RAM
        let totalRamMb = 0;
        try {
            const mem = await si.mem();
            totalRamMb = Math.round(mem.total / 1024 / 1024);
        } catch (e) {
            console.warn('⚠️ Telemetry: Memory info failed');
        }

        // 5. OS
        let osHostname = 'unknown', osDistro = 'Unknown OS', osRelease = '', osArch = 'x64';
        try {
            const osInfo = await si.osInfo();
            osHostname = osInfo.hostname;
            osDistro = osInfo.distro;
            osRelease = osInfo.release;
            osArch = osInfo.arch;
        } catch (e) {
            console.warn('⚠️ Telemetry: OS info failed');
        }

        // 6. Disk
        let diskTotalGb = 0, diskType = 'SSD';
        try {
            const disks = await si.diskLayout();
            if (disks?.[0]) {
                diskTotalGb = Math.round(disks[0].size / 1024 / 1024 / 1024);
                diskType = disks[0].type || 'SSD';
            }
        } catch (e) {
            console.warn('⚠️ Telemetry: Disk info failed');
        }

        return {
            session_uuid: this.sessionUuid,
            app_version: app.getVersion(),
            startup_time_ms: Date.now() - this.startTime,
            device: {
                hwid,
                hostname: osHostname,
                os_name: osDistro,
                os_version: osRelease,
                os_arch: osArch,
                cpu: {
                    name: cpuInfo.brand,
                    cores: cpuInfo.physicalCores,
                    threads: cpuInfo.cores,
                    clock_speed: cpuInfo.speedMax * 1000
                },
                gpu: { name: gpuName, vram: gpuVram, driver: gpuDriver },
                ram: { total_mb: totalRamMb },
                disk: { total_gb: diskTotalGb, type: diskType }
            }
        };
    }

    /**
     * ENVOI AU DÉMARRAGE — avec retry sur 401 (token expiré)
     */
    async sendStartup(token: string, retryCount = 0) {
        // Éviter double-envoi si déjà fait dans cette session
        if (this.startupSent) return;

        // Garde anti-concurrence : le garde startupSent ci-dessus ne suffit pas car il n'est
        // mis à true qu'APRÈS le fetch. Sans ce verrou, plusieurs appels partent avant que le
        // 1er réponde → tous sauf un échouent en 400 (session_uuid déjà pris). Les retries
        // internes (retryCount>0) ne sont volontairement PAS bloqués.
        if (retryCount === 0) {
            if (this.startupInFlight) return;
            this.startupInFlight = true;
        }

        this.authToken = token;
        if (!this.sessionUuid) this.sessionUuid = this.generateUUID();

        try {
            console.log('📊 Gathering hardware info...');
            const payload = await this.gatherHardwareInfo();
            
            console.log(`🚀 Sending Telemetry Startup to ${API_URL}...`);
            
            const response = await fetch(`${API_URL}/startup/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401 && retryCount < 2) {
                // Token expired — wait and retry (renderer will refresh token)
                console.warn('⚠️ Telemetry 401 — waiting for token refresh, retry', retryCount + 1);
                await new Promise(r => setTimeout(r, 3000));
                if (this.authToken && this.authToken !== token) {
                    return this.sendStartup(this.authToken, retryCount + 1);
                }
                return;
            }

            if (!response.ok) {
                const text = await response.text();
                // 400 "session_uuid déjà existante" = la session A DÉJÀ été créée (course entre
                // appels, ou relance rapide). Ce n'est pas une vraie erreur : on considère le
                // démarrage comme suivi, on démarre le heartbeat, et on NE pollue PAS les logs.
                if (response.status === 400 && text.includes('session_uuid')) {
                    this.startupSent = true;
                    this.startHeartbeat();
                } else {
                    console.warn(`⚠️ Telemetry endpoint returned ${response.status}:`, text.substring(0, 200));
                }
            } else {
                const data = await response.json();
                console.log('✅ Telemetry sent successfully:', data);
                this.startupSent = true;
                this.startHeartbeat();
            }
        } catch (error) {
            console.error('❌ Telemetry Error:', error);
            // Retry once after 5s on network error
            if (retryCount < 1) {
                setTimeout(() => this.sendStartup(this.authToken || token, retryCount + 1), 5000);
            }
        } finally {
            // Libère le verrou de l'envoi initial (le garde startupSent bloque déjà les suivants en cas de succès).
            if (retryCount === 0) this.startupInFlight = false;
        }
    }

    /**
     * Heartbeat (every 1 min)
     */
    private startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        
        console.log('Heartbeat started (every 1min)');
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 60 * 1000); 
    }

    /**
     * UPDATE TOKEN (Called via IPC from Renderer on refresh)
     */
    updateToken(newToken: string) {
        this.authToken = newToken;
    }

    async sendHeartbeat() {
        if (!this.authToken || !this.sessionUuid) return;
        
        const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        
        try {
             const res = await fetch(`${API_URL}/heartbeat/`, {
                 method: 'POST',
                 headers: { 
                     'Authorization': `Bearer ${this.authToken}`,
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify({
                     session_uuid: this.sessionUuid,
                     duration_session: durationSeconds
                 })
            });
            // If 401, token may have expired — demander au renderer de rafraîchir immédiatement.
            if (res.status === 401) {
                console.warn('⚠️ Heartbeat 401 — demande de refresh du token au renderer');
                getMainWindow()?.webContents.send('token-expired');
            }
        } catch(e) { /* ignore silent fail */ }
    }

    /**
     * ENVOI À LA FERMETURE (SHUTDOWN)
     */
    async sendShutdown() {
        if (!this.sessionUuid || !this.authToken) {
            console.warn('⚠️ Cannot send shutdown telemetry: No session/token.');
            return;
        }

        const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            console.log(`🛑 Sending Shutdown Telemetry (Duration: ${durationSeconds}s)...`);
            await fetch(`${API_URL}/shutdown/`, {
                 method: 'POST',
                 headers: { 
                     'Authorization': `Bearer ${this.authToken}`,
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify({
                     session_uuid: this.sessionUuid,
                     closed_cleanly: true,
                     duration_session: durationSeconds
                 })
            });
            console.log('✅ Shutdown telemetry sent.');
        } catch (e) {
            console.error('❌ Failed to send shutdown telemetry', e);
        }
    }
}
