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
                startup_time_ms: Date.now() - this.startTime,
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
            }
        } catch (error) {
            console.error('❌ Telemetry Error (Check your API URL/Network):', error);
            // Ne pas bloquer l'app
        }
    }

    /**
     * ENVOI À LA FERMETURE (SHUTDOWN)
     */
    async sendShutdown(token: string) {
        if (!this.sessionUuid) return;

        try {
            const payload = {
                session_uuid: this.sessionUuid,
                closed_cleanly: true
            };
            
            await fetch(`${API_URL}/shutdown/`, {
                 method: 'POST',
                 headers: { 
                     'Authorization': `Bearer ${token}`,
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error('❌ Failed to send shutdown telemetry');
        }
    }
}
