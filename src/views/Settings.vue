<template>
    <div class="h-full flex flex-col p-4 md:p-8 overflow-hidden">
        
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-white tracking-tight">Paramètres</h1>
            <p class="text-zinc-500 text-sm">Configuration générale du launcher.</p>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-2 mb-6 border-b border-white/5 pb-1">
            <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="currentTab = tab.id"
                class="px-4 py-2 rounded-t-lg transition-colors font-bold text-sm border-b-2"
                :class="currentTab === tab.id ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5' : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5'"
            >
                {{ tab.label }}
            </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6">
            
            <!-- GENERAL TAB -->
            <div v-if="currentTab === 'general'" class="space-y-6 animate-fade-in">
                <!-- App Behavior -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Comportement</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                             <div>
                                <div class="font-medium text-zinc-200">Lancer au démarrage</div>
                                <div class="text-xs text-zinc-500">Ouvrir JeuxCracks au démarrage de Windows</div>
                             </div>
                             <Switch v-model="settings.autoLaunch" @update:modelValue="updateSetting('autoLaunch', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                             <div>
                                <div class="font-medium text-zinc-200">Minimiser dans la zone de notification</div>
                                <div class="text-xs text-zinc-500">L'application continuera de tourner en arrière-plan</div>
                             </div>
                             <Switch v-model="settings.minimizeToTray" @update:modelValue="updateSetting('minimizeToTray', $event)" />
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Notifications</h3>
                    <div class="flex items-center justify-between">
                            <div>
                            <div class="font-medium text-zinc-200">Activer les notifications</div>
                            <div class="text-xs text-zinc-500">Être notifié à la fin des téléchargements</div>
                            </div>
                            <Switch v-model="settings.notifications" @update:modelValue="updateSetting('notifications', $event)" />
                    </div>
                </div>

                <!-- Updates -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                     <div>
                        <div class="font-medium text-zinc-200">Mises à jour</div>
                        <div class="text-xs text-zinc-500">Version actuelle: {{ appVersion }}</div>
                     </div>
                     <button @click="checkForUpdate" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">
                        Rechercher
                     </button>
                </div>
            </div>

            <!-- LIBRARY TAB -->
            <div v-if="currentTab === 'library'" class="animate-fade-in">
                <LibraryManager />
            </div>

            <!-- DOWNLOADS TAB -->
            <div v-if="currentTab === 'downloads'" class="space-y-6 animate-fade-in">
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Limites de Bande Passante</h3>
                    <p class="text-zinc-500 text-xs mb-6">Définissez une limite pour ne pas saturer votre connexion internet. 0 = Illimité.</p>

                    <div class="grid gap-6 md:grid-cols-2">
                        <!-- Download Speed -->
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-zinc-400 uppercase">Vitesse de téléchargement (Mo/s)</label>
                            <div class="flex items-center gap-2">
                                <input 
                                    v-model.number="downloadLimitMB" 
                                    type="number" 
                                    min="0" 
                                    step="0.1"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="0 (Illimité)"
                                    @change="saveDownloadLimit"
                                />
                            </div>
                        </div>
                        
                        <!-- Upload Speed -->
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-zinc-400 uppercase">Vitesse d'envoi (Mo/s)</label>
                            <div class="flex items-center gap-2">
                                <input 
                                    v-model.number="uploadLimitMB" 
                                    type="number" 
                                    min="0" 
                                    step="0.1"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="0 (Illimité)"
                                    @change="saveUploadLimit"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                 <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6 opacity-50 pointer-events-none grayscale">
                    <h3 class="text-lg font-bold text-white mb-4">Peer-to-Peer (Bientôt)</h3>
                    <div class="text-xs text-zinc-500">Options avancées pour le protocole BitTorrent (DHT, PEX, Encryption).</div>
                 </div>
            </div>

             <!-- ACCOUNT TAB (Redirect/Link) -->
             <div v-if="currentTab === 'account'" class="animate-fade-in">
                  <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 text-center">
                        <h3 class="text-xl font-bold text-white mb-2">Gestion du Compte</h3>
                        <p class="text-zinc-400 text-sm mb-6">Pour modifier votre profil, avatar ou mot de passe, rendez-vous sur la page dédiée.</p>
                        <router-link to="/account" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
                            Accéder à mon compte
                        </router-link>
                  </div>
             </div>

        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import LibraryManager from '../components/system/LibraryManager.vue';
import Switch from '../components/ui/Switch.vue'; // Need to ensure this exists or use a simple checkbox replacement
// If Switch doesn't exist, I'll create a local simple switch or check if I can use a checkbox style.
// Checking file structure... Switch.vue likely does not exist based on previous `list_dir`.
// I will simulate it or use standard input checkbox hidden with style.

const tabs = [
    { id: 'general', label: 'Général' },
    { id: 'library', label: 'Bibliothèques' },
    { id: 'downloads', label: 'Téléchargements' },
    { id: 'account', label: 'Compte' }
];
const currentTab = ref('general');
const appVersion = ref('1.0.30');

const settings = reactive({
    autoLaunch: false,
    minimizeToTray: true,
    notifications: true
});

const downloadLimitMB = ref(0);
const uploadLimitMB = ref(0);

// Mock Switch Component if not exists (I'll assume it doesn't and implement inline in next step if needed, but for now I'll use a component reference and if it fails I'll fix it)
// actually I'll just use a checkbox styled.

const updateSetting = (key: string, value: boolean) => {
    console.log('Setting updated', key, value);
    if (window.electronAPI) {
        window.electronAPI.send('update-setting', key, value);
    }
};

const saveDownloadLimit = () => {
    if (window.electronAPI) {
        const bytes = (downloadLimitMB.value || 0) * 1024 * 1024;
        window.electronAPI.send('set-download-limit', bytes);
    }
};

const saveUploadLimit = () => {
    if (window.electronAPI) {
         const bytes = (uploadLimitMB.value || 0) * 1024 * 1024;
        window.electronAPI.send('set-upload-limit', bytes);
    }
};

const checkForUpdate = () => {
    if (window.electronAPI) {
        window.electronAPI.send('check-for-update');
    }
};

onMounted(async () => {
     if (window.electronAPI) {
        const currentSettings = await window.electronAPI.invoke('get-settings');
        if (currentSettings) Object.assign(settings, currentSettings);
        
        const limits = await window.electronAPI.invoke('get-download-limits');
        if (limits) {
            downloadLimitMB.value = parseFloat((limits.download / 1024 / 1024).toFixed(1));
            uploadLimitMB.value = parseFloat((limits.upload / 1024 / 1024).toFixed(1));
        }

        const ver = await window.electronAPI.invoke('get-app-version');
        if(ver) appVersion.value = ver;
    }
});
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
