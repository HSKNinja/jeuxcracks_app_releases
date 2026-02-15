import si from 'systeminformation';
import { machineId } from 'node-machine-id';
import { app } from 'electron';

// URL de ton API Backend
// Note: À remplacer par la vraie URL de prod ou via .env
const API_URL = 'https://api.jeuxcracks.fr/api/telemetry';

export class TelemetryService {
    private static instance: TelemetryService;
    private sessionUuid: string = '';
    private startTime: number = Date.now();
    
    private authToken: string | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    // Singleton
    static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    /**
     * Génère un UUID v4 simple pour la session
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * COLLECTE TOTALE DES INFOS
     */
    async gatherHardwareInfo() {
        try {
            // 1. Hardware ID Unique
            const hwid = await machineId();

            // 2. CPU
            const cpu = await si.cpu();
            
            // 3. GPU (Graphics)
            const graphics = await si.graphics();
            const mainGpu = graphics.controllers.find(g => !g.name.toLowerCase().includes('intel')) || graphics.controllers[0];

            // 4. Memory/OS
            const mem = await si.mem();
            const os = await si.osInfo();

            // 5. Disk (Physical) - Better for Hardware Ops
            const disks = await si.diskLayout();
            const mainDisk = disks[0]; // Primary physical disk

            return {
                session_uuid: this.sessionUuid,
                app_version: app.getVersion(),
                startup_time_ms: Date.now() - this.startTime, // Temps depuis le lancement de l'instance JS
                device: {
                    hwid: hwid,
                    hostname: os.hostname,
                    os_name: os.distro,      // ex: "Windows 10 Pro"
                    os_version: os.release,  // ex: "10.0.19045"
                    os_arch: os.arch,        // ex: "x64"
                    cpu: {
                        name: cpu.brand,     // ex: "Core i9-9900K"
                        cores: cpu.physicalCores,
                        threads: cpu.cores,
                        clock_speed: cpu.speedMax * 1000 // Convertir GHz -> MHz si besoin
                    },
                    gpu: {
                        name: mainGpu?.model || 'Unknown GPU',
                        vram: mainGpu?.vram || 0, // En MB normalement
                        driver: mainGpu?.driverVersion || 'unknown'
                    },
                    ram: {
                        total_mb: Math.round(mem.total / 1024 / 1024)
                    },
                    disk: {
                        total_gb: Math.round((mainDisk?.size || 0) / 1024 / 1024 / 1024),
                        type: mainDisk?.type || 'SSD' // Souvent 'SSD' ou 'HD'
                    }
                }
            };
        } catch (e) {
            console.error('Failed to gather hardware info', e);
            throw e;
        }
    }

    /**
     * ENVOI AU DÉMARRAGE (STARTUP)
     */
    async sendStartup(token: string) {
        this.authToken = token;
        this.sessionUuid = this.generateUUID();
        
        try {
            console.log('📊 Gathering hardware info...');
            const payload = await this.gatherHardwareInfo();
            
            console.log(`🚀 Sending Telemetry Startup to ${API_URL}...`);
            
            // Utilisation de fetch natif (Node 18+)
            const response = await fetch(`${API_URL}/startup/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Log but don't crash
                const text = await response.text();
                console.warn(`⚠️ Telemetry endpoint returned ${response.status}:`, text.substring(0, 200));
            } else {
                const data = await response.json();
                console.log('✅ Telemetry sent successfully:', data);
                
                // Start Heartbeat only if startup succeeded
                this.startHeartbeat();
            }
        } catch (error) {
            console.error('❌ Telemetry Error (Check your API URL/Network):', error);
        }
    }

    /**
     * Start Heartbeat (every 5 minutes)
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
        // console.log('🔄 Telemetry: Token updated internally');
    }

    async sendHeartbeat() {
        if (!this.authToken || !this.sessionUuid) return;
        
        const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        
        try {
             await fetch(`${API_URL}/heartbeat/`, {
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
            // console.log('💓 Telemetry Heartbeat sent, duration:', durationSeconds);
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
            const payload = {
                session_uuid: this.sessionUuid,
                closed_cleanly: true,
                duration_session: durationSeconds
            };
            
            // Note: On shutdown, we need to be fast. 
            // Often fetch might be cancelled if the process exits too fast.
            // But we await it in before-quit handler.
            await fetch(`${API_URL}/shutdown/`, {
                 method: 'POST',
                 headers: { 
                     'Authorization': `Bearer ${this.authToken}`,
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(payload)
            });
            console.log('✅ Shutdown telemetry sent.');
        } catch (e) {
            console.error('❌ Failed to send shutdown telemetry', e);
        }
    }
}
