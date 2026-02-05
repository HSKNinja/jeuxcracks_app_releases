# Implémentation Client : Télémétrie & Hardware (Electron) 💻

Ce document détaille comment modifier le Launcher (Electron/Node.js) pour collecter les informations hardware et les envoyer au backend.

---

## 1. Pré-requis (Dépendances) 📦

Le Launcher a besoin de nouvelles librairies pour lire les infos système.

**Commande à exécuter :**
```bash
npm install systeminformation node-machine-id
npm install --save-dev @types/systeminformation
```

*   `systeminformation`: Standard pour récupérer CPU, GPU, RAM, OS...
*   `node-machine-id`: Génère un ID unique stable (basé sur l'OS) qui survit aux redémarrages (pour le `hwid`).

---

## 2. Service de Télémétrie (`src/services/TelemetryService.ts`) 🛠️

Créer ce fichier pour gérer la logique de collecte.

```typescript
import si from 'systeminformation';
import { machineId } from 'node-machine-id';
import { app } from 'electron';
import axios from 'axios'; // Ou ton équivalent 'useFetch/net'

// URL de ton API Backend
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
        // 1. Hardware ID Unique
        const hwid = await machineId();

        // 2. CPU
        const cpu = await si.cpu();
        
        // 3. GPU (Graphics)
        const graphics = await si.graphics();
        const mainGpu = graphics.controllers.find(g => !g.name.toLowerCase().includes('intel')) || graphics.controllers[0];

        // 4. Memory/OS/Disk
        const mem = await si.mem();
        const os = await si.osInfo();
        const disk = await si.fsSize();
        const mainDisk = disk.find(d => d.mount === 'C:') || disk[0]; // Disque principal

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
                    name: mainGpu.model,
                    vram: mainGpu.vram, // En MB normalement
                    driver: mainGpu.driverVersion || 'unknown'
                },
                ram: {
                    total_mb: Math.round(mem.total / 1024 / 1024)
                },
                disk: {
                    total_gb: Math.round((mainDisk?.size || 0) / 1024 / 1024 / 1024),
                    type: 'Unknown' // Difficile à détecter fiable nodejs pur, souvent 'SSD' par défaut
                }
            }
        };
    }

    /**
     * ENVOI AU DÉMARRAGE (STARTUP)
     */
    async sendStartup(token: string) {
        this.sessionUuid = this.generateUUID();
        
        try {
            console.log('📊 Gathering hardware info...');
            const payload = await this.gatherHardwareInfo();
            
            console.log('🚀 Sending Telemetry Startup...', payload);
            await axios.post(`${API_URL}/startup/`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Telemetry sent successfully.');
        } catch (error) {
            console.error('❌ Telemetry Error:', error);
            // Ne pas bloquer l'app si la télémétrie échoue
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
            
            // Note: sendBeacon n'existe pas en Node.js, il faut un fetch rapide
            // Possiblement utiliser 'electron-fetch' ou garder la fenêtre ouverte 100ms de plus
            await axios.post(`${API_URL}/shutdown/`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('❌ Failed to send shutdown telemetry');
        }
    }
}
```

---

## 3. Intégration dans le Main Process (`electron/main/index.ts`) 🔌

Il faut brancher le service pour qu'il se lance au démarrage, **après** que l'utilisateur soit authentifié (pour avoir le Token).

L'idéal est d'écouter un événement IPC venant du Frontend quand le login est réussi.

**Dans `electron/main/index.ts` :**

```typescript
import { ipcMain } from 'electron';
import { TelemetryService } from '../services/TelemetryService';

// ... code existant ...

// Écouter l'événement "Login Success" envoyé depuis le Vue.js
ipcMain.on('auth-success', async (event, token) => {
    console.log('👤 User logged in, starting Telemetry...');
    
    // Lancer la télémétrie en arrière-plan
    TelemetryService.getInstance().sendStartup(token);
});

// Écouter la fermeture de l'app
app.on('before-quit', async () => {
    // Tenter d'envoyer le shutdown (attention aux délais async)
    // Note: C'est complexe en Electron pur d'attendre une promesse ici sans bloquer
    // Pour une V1, on peut ignorer le Shutdown ou le faire en "Heartbeat"
});
```

**Côté Frontend (`Login.vue` ou `App.vue`) :**

Une fois que l'utilisateur est connecté et que tu as le token :
```typescript
// Dans ton composant Vue, après login réussi :
window.electronAPI.send('auth-success', token.access);
```

---

## 4. Points d'Attention ⚠️

1.  **Permission UAC (Admin) :** `systeminformation` a parfois besoin des droits Admin pour lire la température CPU ou le nom exact du GPU sur certains Windows. Comme ton launcher demande déjà "Admin" (`requestedExecutionLevel": "requireAdministrator"` dans package.json), ça devrait passer crème !
2.  **Latence :** `gatherHardwareInfo()` peut prendre 1 à 2 secondes (lecture disque/WMI). **Ne jamais l'attendre (await) avant d'afficher la fenêtre principale**. Fais-le toujours en "fire and forget" en arrière-plan.
3.  **Confidentialité :** Tu collectes beaucoup de données. Assure-toi que ta Politique de Confidentialité (GDPR) mentionne que tu collectes "Les spécifications techniques du matériel à des fins de diagnostic et de statistique".

Bon dev ! 🚀
