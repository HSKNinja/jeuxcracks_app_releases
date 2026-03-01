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
                        <div class="flex items-center justify-between">
                             <div>
                                <div class="font-medium text-zinc-200">Démarrer réduit</div>
                                <div class="text-xs text-zinc-500">Lancer l'application directement dans la zone de notification</div>
                             </div>
                             <Switch v-model="settings.startMinimized" @update:modelValue="updateSetting('startMinimized', $event)" />
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Notifications</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Fin de téléchargement</div>
                                <div class="text-xs text-zinc-500">Être notifié quand un jeu a fini de se télécharger</div>
                            </div>
                            <Switch v-model="settings.notifications" @update:modelValue="updateSetting('notifications', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Mises à jour disponibles</div>
                                <div class="text-xs text-zinc-500">Être notifié quand une mise à jour du launcher est disponible</div>
                            </div>
                            <Switch v-model="settings.notifyUpdates" @update:modelValue="updateSetting('notifyUpdates', $event)" />
                        </div>
                    </div>
                </div>

                <!-- Langue -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium text-zinc-200">Langue de l'interface</div>
                            <div class="text-xs text-zinc-500">Choisir la langue d'affichage du launcher</div>
                        </div>
                        <select v-model="settings.language" @change="updateSetting('language', settings.language)"
                                class="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer">
                            <option value="fr">🇫🇷 Français</option>
                            <option value="en">🇬🇧 English</option>
                        </select>
                    </div>
                </div>

                <!-- App Info -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">À propos</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                            <div class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Version</div>
                            <div class="text-sm font-bold text-white">{{ appVersion }}</div>
                        </div>
                        <div class="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                            <div class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Plateforme</div>
                            <div class="text-sm font-bold text-white">Windows x64</div>
                        </div>
                        <div class="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                            <div class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Electron</div>
                            <div class="text-sm font-bold text-white">{{ electronVersion }}</div>
                        </div>
                        <div class="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                            <div class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Données</div>
                            <div class="text-sm font-bold text-white truncate cursor-pointer hover:text-indigo-400 transition-colors" @click="openDataFolder" title="Cliquer pour ouvrir">%AppData%</div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <button @click="checkForUpdate" class="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors">Rechercher des mises à jour</button>
                    </div>
                </div>

                <!-- Changelog -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Journal des mises à jour</h3>
                    <div v-if="changelogLoading" class="py-8 text-center">
                        <div class="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <div class="text-xs text-zinc-500">Chargement depuis GitHub...</div>
                    </div>
                    <div v-else-if="changelog.length === 0" class="py-6 text-center text-zinc-500 text-sm">Aucune mise à jour trouvée</div>
                    <div v-else class="space-y-0">
                        <div v-for="(entry, i) in changelog" :key="i" class="relative pl-6 py-2" :class="i < changelog.length - 1 ? 'border-l border-white/5 ml-1.5' : 'ml-1.5'">
                            <div class="absolute -left-[5px] top-3 w-3 h-3 rounded-full border-2" 
                                 :class="i === 0 ? 'bg-indigo-500 border-indigo-400' : 'bg-zinc-800 border-zinc-600'"></div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm font-black text-white">{{ entry.tag }}</span>
                                <span class="text-[10px] text-zinc-500">{{ entry.date }}</span>
                                <span v-if="i === 0" class="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">Dernière</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LIBRARY TAB -->
            <div v-if="currentTab === 'library'" class="space-y-6 animate-fade-in">
                <LibraryManager />

                <!-- Disk Usage -->
                <div v-if="diskStats.length > 0" class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-1">Saturation des Disques</h3>
                    <p class="text-zinc-500 text-xs mb-4">Utilisation globale de chaque disque contenant une bibliothèque.</p>
                    
                    <div class="space-y-3">
                        <div v-for="disk in diskStats" :key="disk.drive" class="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-bold text-zinc-300">Disque {{ disk.drive }}</span>
                                <span class="text-xs font-bold text-zinc-500">{{ disk.usedFormatted }} / {{ disk.totalFormatted }}</span>
                            </div>
                            <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500"
                                     :class="disk.percent > 85 ? 'bg-red-500' : disk.percent > 60 ? 'bg-amber-500' : 'bg-indigo-500'"
                                     :style="{ width: disk.percent + '%' }"></div>
                            </div>
                            <div class="flex justify-between mt-1">
                                <span class="text-[10px] text-zinc-600">{{ disk.percent }}% utilisé</span>
                                <span class="text-[10px] text-zinc-600">{{ disk.freeFormatted }} libres</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Auto-Scan & Verification -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Scan & Vérification</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Scanner au démarrage</div>
                                <div class="text-xs text-zinc-500">Détecte automatiquement les nouveaux jeux dans vos bibliothèques</div>
                            </div>
                            <Switch v-model="settings.autoScan" @update:modelValue="updateSetting('autoScan', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Vérifier l'intégrité des fichiers</div>
                                <div class="text-xs text-zinc-500">Vérifie que tous les fichiers de jeux sont complets et intacts</div>
                            </div>
                            <button @click="verifyIntegrity" 
                                    :disabled="verifying"
                                    class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                                <span v-if="verifying" class="flex items-center gap-2">
                                    <div class="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                                    Vérification...
                                </span>
                                <span v-else>Vérifier</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Cache & Temp Files -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Cache & Fichiers Temporaires</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                            <div>
                                <div class="font-medium text-zinc-200">Fichiers temporaires</div>
                                <div class="text-xs text-zinc-500">Torrents partiels, fichiers d'installation temporaires</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-zinc-400">{{ tempSizeFormatted }}</span>
                                <button @click="openTempFolder" 
                                        class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">
                                    Voir
                                </button>
                                <button @click="clearTempFiles" 
                                        :disabled="clearing"
                                        class="px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/20 hover:border-transparent disabled:opacity-50">
                                    {{ clearing ? 'Nettoyage...' : 'Nettoyer' }}
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                            <div>
                                <div class="font-medium text-zinc-200">Cache des images</div>
                                <div class="text-xs text-zinc-500">Couvertures et miniatures des jeux mises en cache localement</div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm font-bold text-zinc-400">{{ imageCacheSizeFormatted }}</span>
                                <button @click="clearImageCache" 
                                        :disabled="clearingCache"
                                        class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                                    {{ clearingCache ? 'Nettoyage...' : 'Vider le cache' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DOWNLOADS TAB -->
            <div v-if="currentTab === 'downloads'" class="space-y-6 animate-fade-in">
                
                <!-- Bandwidth Limits -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-1">Limites de Bande Passante</h3>
                    <p class="text-zinc-500 text-xs mb-6">Définissez une limite pour ne pas saturer votre connexion. 0 = Illimité.</p>

                    <div class="grid gap-6 md:grid-cols-2">
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-zinc-400 uppercase">Téléchargement (Mo/s)</label>
                            <input 
                                v-model.number="downloadLimitMB" 
                                type="number" min="0" step="0.1"
                                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="0 (Illimité)"
                                @change="saveDownloadLimit"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-zinc-400 uppercase">Envoi / Seed (Mo/s)</label>
                            <input 
                                v-model.number="uploadLimitMB" 
                                type="number" min="0" step="0.1"
                                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="0 (Illimité)"
                                @change="saveUploadLimit"
                            />
                        </div>
                    </div>
                </div>

                <!-- Download Behavior -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Comportement</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Téléchargements simultanés</div>
                                <div class="text-xs text-zinc-500">Nombre maximum de jeux téléchargés en même temps</div>
                            </div>
                            <select v-model.number="dlSettings.maxConcurrent" @change="saveDlSetting('maxConcurrent', dlSettings.maxConcurrent)"
                                    class="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer">
                                <option :value="1">1</option>
                                <option :value="2">2</option>
                                <option :value="3">3</option>
                                <option :value="5">5</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Pause auto en jeu</div>
                                <div class="text-xs text-zinc-500">Mettre en pause les téléchargements quand un jeu est lancé</div>
                            </div>
                            <Switch v-model="dlSettings.pauseOnPlay" @update:modelValue="saveDlSetting('pauseOnPlay', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Extraction automatique</div>
                                <div class="text-xs text-zinc-500">Extraire automatiquement les archives (.rar, .zip) après téléchargement</div>
                            </div>
                            <Switch v-model="dlSettings.autoExtract" @update:modelValue="saveDlSetting('autoExtract', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Supprimer les archives</div>
                                <div class="text-xs text-zinc-500">Supprimer les fichiers .rar/.zip après extraction réussie</div>
                            </div>
                            <Switch v-model="dlSettings.deleteArchives" @update:modelValue="saveDlSetting('deleteArchives', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Vérifier après téléchargement</div>
                                <div class="text-xs text-zinc-500">Vérifier l'intégrité des fichiers une fois le téléchargement terminé</div>
                            </div>
                            <Switch v-model="dlSettings.verifyAfterDl" @update:modelValue="saveDlSetting('verifyAfterDl', $event)" />
                        </div>
                    </div>
                </div>

                <!-- Seeding -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Partage (Seeding)</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Partager après téléchargement</div>
                                <div class="text-xs text-zinc-500">Continuer à partager le fichier pour aider les autres utilisateurs</div>
                            </div>
                            <Switch v-model="dlSettings.seedAfterDl" @update:modelValue="saveDlSetting('seedAfterDl', $event)" />
                        </div>
                        <div v-if="dlSettings.seedAfterDl" class="grid gap-6 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-zinc-400 uppercase">Ratio max de seed</label>
                                <input 
                                    v-model.number="dlSettings.seedRatio" 
                                    type="number" min="0" step="0.1" max="10"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="2.0"
                                    @change="saveDlSetting('seedRatio', dlSettings.seedRatio)"
                                />
                                <div class="text-[10px] text-zinc-600">Arrêter le seed quand le ratio est atteint. 0 = Illimité.</div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-zinc-400 uppercase">Durée max de seed (heures)</label>
                                <input 
                                    v-model.number="dlSettings.seedTime" 
                                    type="number" min="0" step="1"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="24"
                                    @change="saveDlSetting('seedTime', dlSettings.seedTime)"
                                />
                                <div class="text-[10px] text-zinc-600">Arrêter le seed après cette durée. 0 = Illimité.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Scheduled Downloads -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Planification</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Limiter aux heures creuses</div>
                                <div class="text-xs text-zinc-500">Télécharger uniquement pendant une plage horaire définie</div>
                            </div>
                            <Switch v-model="dlSettings.scheduleEnabled" @update:modelValue="saveDlSetting('scheduleEnabled', $event)" />
                        </div>
                        <div v-if="dlSettings.scheduleEnabled" class="grid gap-6 md:grid-cols-2">
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-zinc-400 uppercase">Début</label>
                                <input 
                                    v-model="dlSettings.scheduleStart" 
                                    type="time"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    @change="saveDlSetting('scheduleStart', dlSettings.scheduleStart)"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-zinc-400 uppercase">Fin</label>
                                <input 
                                    v-model="dlSettings.scheduleEnd" 
                                    type="time"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    @change="saveDlSetting('scheduleEnd', dlSettings.scheduleEnd)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- P2P Advanced -->
                <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-6">
                    <div class="flex items-center justify-between mb-4 cursor-pointer" @click="showP2P = !showP2P">
                        <h3 class="text-lg font-bold text-white">Peer-to-Peer (Avancé)</h3>
                        <div class="text-zinc-500 text-sm transition-transform" :class="showP2P ? 'rotate-180' : ''">▼</div>
                    </div>
                    <div v-if="showP2P" class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">DHT (Distributed Hash Table)</div>
                                <div class="text-xs text-zinc-500">Trouver des pairs sans tracker centralisé</div>
                            </div>
                            <Switch v-model="dlSettings.dht" @update:modelValue="saveDlSetting('dht', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">PEX (Peer Exchange)</div>
                                <div class="text-xs text-zinc-500">Échanger les listes de pairs entre clients</div>
                            </div>
                            <Switch v-model="dlSettings.pex" @update:modelValue="saveDlSetting('pex', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">Chiffrement des connexions</div>
                                <div class="text-xs text-zinc-500">Chiffrer le trafic pour éviter le throttling par le FAI</div>
                            </div>
                            <Switch v-model="dlSettings.encryption" @update:modelValue="saveDlSetting('encryption', $event)" />
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-zinc-200">UTP (µTP)</div>
                                <div class="text-xs text-zinc-500">Protocole de transport optimisé pour réduire la congestion</div>
                            </div>
                            <Switch v-model="dlSettings.utp" @update:modelValue="saveDlSetting('utp', $event)" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-zinc-400 uppercase">Connexions max par torrent</label>
                            <input 
                                v-model.number="dlSettings.maxConns" 
                                type="number" min="1" max="500" step="1"
                                class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="55"
                                @change="saveDlSetting('maxConns', dlSettings.maxConns)"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-zinc-400 uppercase">Port d'écoute</label>
                            <div class="flex items-center gap-3">
                                <input 
                                    v-model.number="dlSettings.port" 
                                    type="number" min="1024" max="65535"
                                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="6881"
                                    @change="saveDlSetting('port', dlSettings.port)"
                                />
                                <button @click="randomizePort" class="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0">
                                    Aléatoire
                                </button>
                            </div>
                            <div class="text-[10px] text-zinc-600">Port utilisé pour les connexions entrantes (redirection nécessaire si derrière un NAT).</div>
                        </div>
                    </div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import LibraryManager from '../components/system/LibraryManager.vue';
import Switch from '../components/ui/Switch.vue';

const tabs = [
    { id: 'general', label: 'Général' },
    { id: 'library', label: 'Bibliothèques' },
    { id: 'downloads', label: 'Téléchargements' },
    { id: 'account', label: 'Compte' }
];
const currentTab = ref('general');
const appVersion = ref('1.0.32');
const electronVersion = ref('');

const settings = reactive({
    autoLaunch: false,
    minimizeToTray: true,
    startMinimized: false,
    notifications: true,
    notifyUpdates: true,
    autoScan: true,
    language: 'fr',
});

const changelog = ref<any[]>([]);
const changelogLoading = ref(false);

const loadChangelog = async () => {
    changelogLoading.value = true;
    try {
        const res = await fetch('https://api.github.com/repos/Wasmata/jeuxcracks_app_releases/releases?per_page=30');
        if (res.ok) {
            const releases = await res.json();
            changelog.value = releases.map((r: any) => ({
                tag: r.tag_name,
                name: r.name || r.tag_name,
                date: new Date(r.published_at || r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                body: (r.body || '').replace(/\r\n/g, '\n').trim(),
            }));
        }
    } catch { /* silent */ }
    changelogLoading.value = false;
};

const openDataFolder = () => {
    if (window.electronAPI) {
        window.electronAPI.invoke('open-data-folder');
    }
};

const downloadLimitMB = ref(0);
const uploadLimitMB = ref(0);

// Download settings
const dlSettings = reactive({
    maxConcurrent: 1,
    pauseOnPlay: true,
    autoExtract: false,
    deleteArchives: false,
    verifyAfterDl: false,
    seedAfterDl: true,
    seedRatio: 2.0,
    seedTime: 24,
    scheduleEnabled: false,
    scheduleStart: '02:00',
    scheduleEnd: '08:00',
    dht: true,
    pex: true,
    encryption: true,
    utp: true,
    maxConns: 55,
    port: 6881,
});
const showP2P = ref(false);

const saveDlSetting = (key: string, value: any) => {
    if (window.electronAPI) {
        window.electronAPI.send('update-setting', `dl_${key}`, value);
    }
};

const randomizePort = () => {
    dlSettings.port = Math.floor(Math.random() * (65535 - 10000)) + 10000;
    saveDlSetting('port', dlSettings.port);
};

// Library tab state
const libraryStats = ref<any[]>([]);
const diskStats = ref<any[]>([]);
const verifying = ref(false);
const clearing = ref(false);
const clearingCache = ref(false);
const tempSize = ref(0);
const imageCacheSize = ref(0);

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const tempSizeFormatted = computed(() => formatBytes(tempSize.value));
const imageCacheSizeFormatted = computed(() => formatBytes(imageCacheSize.value));

const updateSetting = (key: string, value: boolean) => {

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

// Library tab actions
const loadLibraryStats = async () => {
    if (!window.electronAPI) return;
    try {
        const stats = await window.electronAPI.invoke('get-library-stats');
        if (stats) {
            libraryStats.value = stats.folders || [];
            diskStats.value = stats.disks || [];
        }
    } catch {
        try {
            const libs = await window.electronAPI.invoke('get-libraries');
            if (libs) {
                libraryStats.value = libs.map((l: any) => ({
                    label: l.label,
                    path: l.path,
                    folderSize: '—',
                }));
            }
        } catch { /* silent */ }
    }
};

const loadCacheSizes = async () => {
    if (!window.electronAPI) return;
    try {
        const sizes = await window.electronAPI.invoke('get-cache-sizes');
        if (sizes) {
            tempSize.value = sizes.temp || 0;
            imageCacheSize.value = sizes.imageCache || 0;
        }
    } catch { /* silent */ }
};

const verifyIntegrity = async () => {
    verifying.value = true;
    try {
        if (window.electronAPI) {
            await window.electronAPI.invoke('verify-library-integrity');
        }
    } catch { /* silent */ }
    // Simulate minimum visible duration
    setTimeout(() => { verifying.value = false; }, 2000);
};

const openTempFolder = () => {
    if (window.electronAPI) {
        window.electronAPI.invoke('open-temp-folder');
    }
};

const clearTempFiles = async () => {
    clearing.value = true;
    try {
        if (window.electronAPI) {
            await window.electronAPI.invoke('clear-temp-files');
            tempSize.value = 0;
        }
    } catch { /* silent */ }
    setTimeout(() => { clearing.value = false; }, 1000);
};

const clearImageCache = async () => {
    clearingCache.value = true;
    try {
        if (window.electronAPI) {
            await window.electronAPI.invoke('clear-image-cache');
            imageCacheSize.value = 0;
        }
    } catch { /* silent */ }
    setTimeout(() => { clearingCache.value = false; }, 1000);
};

// Load library stats when switching to library tab
watch(currentTab, (tab) => {
    if (tab === 'library') {
        loadLibraryStats();
        loadCacheSizes();
    }
    if (tab === 'general' && changelog.value.length === 0) {
        loadChangelog();
    }
});

onMounted(async () => {
     if (window.electronAPI) {
        const currentSettings = await window.electronAPI.invoke('get-settings');
        if (currentSettings) {
            Object.assign(settings, currentSettings);
            // Load download settings (dl_ prefixed)
            const dlKeys = Object.keys(dlSettings) as (keyof typeof dlSettings)[];
            for (const key of dlKeys) {
                const storeKey = `dl_${key}`;
                if (currentSettings[storeKey] !== undefined) {
                    (dlSettings as any)[key] = currentSettings[storeKey];
                }
            }
        }
        
        const limits = await window.electronAPI.invoke('get-download-limits');
        if (limits) {
            downloadLimitMB.value = parseFloat((limits.download / 1024 / 1024).toFixed(1));
            uploadLimitMB.value = parseFloat((limits.upload / 1024 / 1024).toFixed(1));
        }

        const ver = await window.electronAPI.invoke('get-app-version');
        if(ver) appVersion.value = ver;

        const eVer = await window.electronAPI.invoke('get-electron-version');
        if(eVer) electronVersion.value = eVer;
    }
    loadChangelog();
});
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
