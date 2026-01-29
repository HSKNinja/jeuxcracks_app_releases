<template>
  <div class="h-full bg-[#050505] text-white selection:bg-indigo-500/30 font-sans custom-scrollbar overflow-y-auto relative" ref="scrollContainer">
    
    <!-- Loading / Error States -->
    <div v-if="loading || !game" class="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div class="flex flex-col items-center gap-8">
          <div class="relative w-20 h-20">
              <div class="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
              <div class="absolute inset-2 border-t-2 border-purple-500 rounded-full animate-spin animation-delay-200"></div>
          </div>
      </div>
    </div>
    
    <div v-else-if="error" class="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div class="text-center max-w-lg mx-auto p-12">
        <h2 class="text-2xl font-black text-white mb-4 uppercase tracking-widest text-red-500">Erreur</h2>
        <p class="text-zinc-500 text-lg font-mono mb-8">{{ error }}</p>
        <button @click="router.back()" class="px-8 py-3 bg-zinc-800 text-white font-bold uppercase hover:bg-zinc-700 transition-colors rounded-lg">Retour</button>
      </div>
    </div>
    
    <!-- MAIN CONTENT -->
    <div v-else class="relative pb-32">
        
        <!-- STICKY HEADER -->
        <div class="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between transition-all duration-300">
             <div class="flex items-center gap-4">
                 <button @click="router.back()" class="p-2 rounded-full hover:bg-white/10 transition-colors group">
                     <ArrowLeftIcon class="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                 </button>
                 <span class="text-xs font-bold uppercase tracking-widest text-zinc-500 hidden md:block">Retour</span>
             </div>
             
             <div class="flex items-center gap-4">
                 <h2 class="text-sm font-bold text-white truncate max-w-xs hidden lg:block">{{ game?.title }}</h2>
                 <button 
                    class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded transition-all shadow-lg"
                    @click="handleInstallClick()"
                 >
                    {{ getActionButtonText() }}
                 </button>
             </div>
        </div>

        <!-- HERO SECTION (Video Background behind Title) -->
        <div class="relative w-full h-[85vh] overflow-hidden group">
            
            <!-- Video/Image Background -->
            <div class="absolute inset-0 bg-black select-none pointer-events-none">
                <video 
                    v-if="game?.video" 
                    :src="game?.video" 
                    :poster="game?.header"
                    class="w-full h-full object-cover opacity-60"
                    autoplay loop muted playsinline
                ></video>
                <img 
                    v-else 
                    :src="game?.header" 
                    class="w-full h-full object-cover opacity-50 scale-105 animate-slow-zoom"
                />
                
                <!-- Gradient Vignettes -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80"></div>
            </div>

            <!-- Content Overlay -->
            <div class="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-20">
                <div class="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
                    
                    <!-- Title & Main Info (Left) -->
                    <div class="lg:col-span-8 space-y-8 animate-slide-up">
                        
                        <!-- Badges -->
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-white/10 backdrop-blur border border-white/20 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                {{ getSourceName(game?.source) }}
                            </span>
                            <span v-if="game?.isOnline" class="px-3 py-1 bg-green-500/20 backdrop-blur border border-green-500/30 rounded text-[10px] font-bold uppercase tracking-widest text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                                Online
                            </span>
                        </div>

                        <!-- Huge Title -->
                        <h1 class="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tighter uppercase drop-shadow-2xl opacity-95">
                            {{ game?.title }}
                        </h1>

                        <!-- Action Bar -->
                        <div class="flex flex-wrap items-center gap-6 pt-6">
                            <button 
                                class="flex items-center gap-4 px-8 py-5 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                                @click="handleInstallClick()"
                            >
                                <PlayIcon v-if="isGameInstalled || installStore.isFinished(game?.id)" class="w-6 h-6" />
                                <ArrowDownTrayIcon v-else class="w-6 h-6" />
                                <span>{{ getActionButtonText() }}</span>
                            </button>

                            <button 
                                @click="toggleFavorite()"
                                class="p-5 rounded-xl border border-white/20 hover:bg-white/10 transition-all group/favbtn"
                            >
                                <HeartIcon :class="['w-6 h-6 transition-colors', isFavorite ? 'text-red-500 fill-red-500' : 'text-zinc-300 group-hover/favbtn:text-red-500']" />
                            </button>
                        </div>
                        
                        <!-- Download Progress (If Active) -->
                        <div v-if="downloadStore.isDownloadExist(game?.id)" class="max-w-md bg-black/60 backdrop-blur border border-white/10 p-4 rounded-xl mt-4">
                            <div class="flex justify-between items-center text-xs font-bold uppercase text-zinc-400 mb-2">
                                <span class="text-indigo-400 animate-pulse">Téléchargement...</span>
                                <span>{{ Math.round(downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game?.title)].data.progress * 100) }}%</span>
                            </div>
                            <div class="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                 <div class="h-full bg-indigo-500 transition-all duration-300" :style="{ width: (downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game?.title)]?.data?.progress * 100) + '%' }"></div>
                            </div>
                        </div>

                    </div>

                    <!-- Side Info (Right) -->
                    <div class="lg:col-span-4 hidden lg:block text-right space-y-4 text-zinc-400 font-medium">
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Développeur</span>
                            <span class="text-white">{{ game?.informations?.developer || 'N/A' }}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Date de sortie</span>
                            <span class="text-white">{{ game?.informations?.release || 'N/A' }}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Genre</span>
                            <span class="text-white">{{ game?.categories?.slice(0,2).join(', ') || 'N/A' }}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- DETAILS & SPECS SECTION -->
        <div class="max-w-[1600px] mx-auto px-6 md:px-12 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            <!-- Description -->
            <div class="lg:col-span-2 space-y-8">
                <h3 class="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter">
                    <DocumentTextIcon class="w-8 h-8 text-indigo-500" />
                    À propos du jeu
                </h3>
                <div class="prose prose-invert prose-lg max-w-none text-zinc-400 font-light leading-relaxed p-8 rounded-3xl bg-zinc-900/30 border border-white/5">
                    <div v-html="game?.description || game?.descriptionShort"></div>
                </div>
            </div>

            <!-- Configuration (Redesigned) -->
            <div class="space-y-8">
                <h3 class="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter">
                    <CpuChipIcon class="w-8 h-8 text-indigo-500" />
                    Configuration
                </h3>
                
                <div class="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                    
                    <!-- Min -->
                    <div class="p-6 border-b border-white/5">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-2 h-2 rounded-full bg-zinc-600"></div>
                            <h4 class="text-sm font-black text-zinc-300 uppercase tracking-widest">Minimal</h4>
                        </div>
                        <div class="text-xs text-zinc-400 font-mono leading-relaxed opacity-80" v-html="configurationSystemMinimal || 'Standard Requirements'"></div>
                    </div>

                    <!-- Rec -->
                    <div class="p-6 bg-white/[0.02]">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_currentColor]"></div>
                            <h4 class="text-sm font-black text-white uppercase tracking-widest">Recommandée</h4>
                        </div>
                        <div class="text-xs text-zinc-300 font-mono leading-relaxed" v-html="configurationSystemRecommended || 'High Requirements'"></div>
                    </div>

                </div>
                
                <!-- Quick Specs Grid (Visual Decoration) -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center gap-2 text-center group hover:border-indigo-500/30 transition-colors">
                        <span class="text-[10px] font-bold uppercase text-zinc-600">Stockage</span>
                        <span class="text-zinc-300 font-bold">{{ typeof game?.size === 'number' ? prettyBites(game?.size || 0) : game?.size || 'N/A' }}</span>
                    </div>
                    <div class="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center gap-2 text-center group hover:border-indigo-500/30 transition-colors">
                        <span class="text-[10px] font-bold uppercase text-zinc-600">Mémoire</span>
                        <span class="text-zinc-300 font-bold">8 GB+</span>
                    </div>
                </div>

            </div>

        </div>

    </div>

    <!-- MODAL: DOWNLOAD PATH SELECTION (CENTERED FIXED) -->
    <vue-final-modal
      v-model="showInstallModal"
      class="flex justify-center items-center"
      content-class="relative w-full max-w-lg mx-4 p-8 bg-[#0f0f0f] border border-zinc-800 rounded-2xl shadow-2xl animate-fade-in-up"
      :click-to-close="true"
      :esc-to-close="true"
      overlay-class="bg-black/60 backdrop-blur-sm"
    >
        <h3 class="text-2xl font-black text-white uppercase tracking-tighter mb-2">Installation</h3>
        <p class="text-zinc-500 text-sm mb-8 font-medium">Sélectionnez le dossier d'installation pour <span class="text-white">{{ game?.title }}</span>.</p>
        
        <div class="space-y-6">
            <!-- Libraries List -->
            <div class="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                 <div 
                    v-for="lib in libraries" 
                    :key="lib.id"
                    @click="selectedLibraryId = lib.id"
                    class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all"
                    :class="selectedLibraryId === lib.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-black border-zinc-800 hover:bg-zinc-900'"
                 >
                    <div class="flex items-center gap-3">
                         <FolderOpenIcon class="w-5 h-5" :class="selectedLibraryId === lib.id ? 'text-indigo-400' : 'text-zinc-600'" />
                         <div>
                             <div class="text-sm font-bold" :class="selectedLibraryId === lib.id ? 'text-white' : 'text-zinc-300'">{{ lib.label }}</div>
                             <div class="text-[10px] text-zinc-500 font-mono">{{ lib.path }}</div>
                         </div>
                    </div>
                    <div v-if="selectedLibraryId === lib.id" class="w-4 h-4 rounded-full bg-indigo-500 border-2 border-black"></div>
                 </div>
                 
                 <!-- Add New -->
                 <button @click="addLibrary" class="w-full py-3 text-xs font-bold text-zinc-500 hover:text-white border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors">
                     + Ajouter une bibliothèque
                 </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <button 
                    class="py-4 rounded-xl border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-xs hover:bg-zinc-900 hover:text-white transition-colors"
                    @click="showInstallModal = false"
                >
                    Annuler
                </button>
                <button 
                    class="py-4 bg-white text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-indigo-500 hover:text-white hover:shadow-lg transition-all"
                    @click="confirmInstall()"
                >
                    Installer
                </button>
            </div>
        </div>
    </vue-final-modal>
    
    <!-- MODAL: CONFIRM CANCEL -->
    <ModalConfirm :modal-id="modalId" title="Annulation" @confirm="stopDownload()">
      <p class="text-zinc-300 font-medium">Voulez-vous vraiment arrêter le téléchargement ?</p>
    </ModalConfirm>

    <!-- MODAL: MANAGE INSTALLED -->
    <ModalConfirm
      v-if="isGameInstalled || installStore.installs[installStore.getIndexInstallByTitle(game?.title)]?.finished"
      :modal-id="modalSettings"
      title="Gestion"
      @confirm="vfm.close(modalSettings)"
    >
       <div class="space-y-3 pt-4">
            <button class="w-full py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-zinc-200" @click="openGameEmplacement()">
                Ouvrir dossier local
            </button>
            <button class="w-full py-4 bg-red-600 text-white font-black uppercase tracking-wider hover:bg-red-700" @click="deleteGame()">
                Désinstaller
            </button>
       </div>
    </ModalConfirm>

  </div>
</template>

<script setup lang="ts">
import ModalConfirm from '../../components/ModalConfirm.vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVfm, VueFinalModal } from 'vue-final-modal';
import { useFetch } from '../../utils/useFetch';
import { 
    EyeIcon, CalendarIcon, HeartIcon, ArrowDownTrayIcon, PlayIcon, 
    FolderOpenIcon, CpuChipIcon, ArrowLeftIcon, DocumentTextIcon 
} from '@heroicons/vue/24/solid';
import { useMainStore } from '../../store';
import { useNotification } from '@kyvg/vue3-notification';
import { useDownloadStore } from '../../store/download';
import { useInstallStore } from '../../store/install';
import { JeuxCracksAPI } from '../../services/api';

const store = useMainStore();
const { notify } = useNotification();
const downloadStore = useDownloadStore();
const installStore = useInstallStore();
const vfm = useVfm();
const modalId = Symbol('modalId');
const modalSettings = Symbol('modalSettings');

// State
const loading = ref(true);
const game = ref<any>(null);
const error = ref<string | undefined>('');
const isFavorite = ref(false);
const isLoadingFavorite = ref(false);
const downloadType = ref<string>('');
const configurationSystemMinimal = ref<string | null>(null);
const configurationSystemRecommended = ref<string | null>(null);
const installed = ref<{ id: string; title: string; path: string; executable?: string } | null>(null);
const isGameInstalled = ref(false);
const destPath = ref<string>('');

// Popup State
const showInstallModal = ref(false);
const libraries = ref<any[]>([]);
const selectedLibraryId = ref<string>('');

// --- IPC LISTENERS ---
window.electronAPI?.invoke('get-save-path').then((path: string) => {
  destPath.value = path;
});
window.electronAPI?.on('download-pending', () => {});

const route = useRoute();
const router = useRouter();

watch(() => route.params.id, (id) => { fetchData(id); }, { immediate: true });

onMounted(async () => {
  await fetchData(route.params.id);
  await checkFavoriteStatus();
  updateInstallationStatus();
});

// --- ACTIONS ---

function getActionButtonText() {
    if (downloadStore.isDownloadExist(game.value?.id) && !downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game.value?.title)]?.paused) {
        return 'En cours...';
    }
    if (downloadStore.isDownloadExist(game.value?.id) && downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game.value?.title)]?.paused) {
        return 'Reprendre';
    }
    if (isGameInstalled.value || installStore.isFinished(game.value?.id)) {
        return 'Jouer';
    }
    return 'Installer';
}

function handleInstallClick() {
    // If already installed, play/manage
    if (isGameInstalled.value || installStore.isFinished(game.value?.id)) {
        beforeDownload(); // Triggers play logic
        return;
    }
    
    // If download exists (paused or running), resume/manage
    if (downloadStore.isDownloadExist(game.value?.id)) {
        beforeDownload(); // Triggers pause/resume logic
        return;
    }
    
    // NEW INSTALL -> SHOW POPUP
    fetchLibraries();
    showInstallModal.value = true;
}

function confirmInstall() {
    const lib = libraries.value.find(l => l.id === selectedLibraryId.value);
    if (!lib) {
        notify({ type: 'error', text: 'Veuillez sélectionner une bibliothèque' });
        return;
    }
    
    // Construct Path: Library + GameTitle (Sanitized)
    const sanitizedTitle = game.value?.title?.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
    // Using forward slashes for consistency
    destPath.value = (lib.path + '/' + sanitizedTitle).replace(/\\/g, '/');
    
    showInstallModal.value = false;
    startDownload();
}

async function fetchLibraries() {
    if (window.electronAPI) {
        libraries.value = await window.electronAPI.invoke('get-libraries');
        // Select default if no selection
        if (!selectedLibraryId.value) {
            const def = libraries.value.find(l => l.isDefault) || libraries.value[0];
            if (def) selectedLibraryId.value = def.id;
        }
    }
}

async function addLibrary() {
     try {
        if (window.electronAPI) {
            const path = await window.electronAPI.invoke('open-dialog', { properties: ['openDirectory'] });
            if (path) {
                const updated = await window.electronAPI.invoke('add-library', path);
                if (updated) {
                    libraries.value = updated;
                    // Auto select the new one (it's the last one usually, or find by path)
                    const newLib = updated.find((l:any) => l.path === path);
                    if (newLib) selectedLibraryId.value = newLib.id;
                }
            }
        }
    } catch (e) { console.error(e); }
}

// ... existing logic ...
async function checkFavoriteStatus() {
  if (!game.value?.id) return;
  // Use store source of truth
  isFavorite.value = store.favorites.some(fid => String(fid) === String(game.value.id));
}

async function toggleFavorite() {
  if (!game.value?.id || isLoadingFavorite.value) return;
  if (!store.isAuthenticated) {
    notify({ type: 'error', title: 'Erreur', text: 'Connectez-vous pour ajouter des favoris' });
    return;
  }
  isLoadingFavorite.value = true;
  try {
    const success = await store.toggleFavorite(game.value.id);
    if (success) {
         isFavorite.value = !isFavorite.value;
         notify({ type: 'success', title: 'Favoris', text: isFavorite.value ? 'Ajouté aux favoris' : 'Retiré des favoris' });
    }
  } catch (error) {
    console.error(error);
    notify({ type: 'error', title: 'Erreur', text: 'Action impossible' });
  } finally {
    isLoadingFavorite.value = false;
  }
}

async function startDownload() {
  let URL = game.value?.download.torrent ? game.value?.download.torrent : game.value?.download.direct;
  if (!URL) {
    notify({ type: 'error', title: 'Erreur', text: 'Lien introuvable' });
    return;
  }
  if (URL.startsWith('/')) URL = 'https://api.jeuxcracks.fr' + URL;
  
  let source = '';
  if (Array.isArray(game.value?.source) && game.value?.source.length > 0) source = game.value.source;
  else if (typeof game.value?.source === 'string') source = game.value.source;
  
  const gameData = {
    id: game.value?.id,
    title: game.value?.title,
    source: JSON.parse(JSON.stringify(source)),
    informations: { credit: game.value?.informations?.credit },
  };
  
  downloadType.value = game.value?.download.torrent ? 'torrent' : 'direct';
  window.electronAPI?.send('download', URL, destPath.value, downloadType.value, gameData);
  
  const downloadData = {
    gameID: gameData.id,
    title: gameData.title,
    path: destPath.value,
    downloadType: downloadType.value,
    paused: false,
    data: null,
  };
  downloadStore.addDownload(downloadData);
  downloadStore.addGameData(gameData.id, game.value);
}

async function stopDownload() {
  vfm.close(modalId);
  const index = downloadStore.getIndexDownloadByTitle(game.value?.title);
  if (index !== -1 && downloadStore.downloads[index]?.data?.infoHash) {
      window.electronAPI?.send('stop-torrent', downloadStore.downloads[index].data.infoHash, downloadStore.downloads[index].path + '/' + downloadStore.downloads[index].title);
      downloadStore.removeDownloadByTitle(game.value?.title);
  }
}

async function deleteGame() {
  if (downloadStore.isDownloadExist(game.value?.id)) stopDownload();
  
  if (installStore.isInstallExist(game.value?.id)) {
      if (installStore.isFinished(game.value?.id)) window.electronAPI?.send('remove-game', game.value?.id);
      installStore.removeInstallById(game.value?.id);
      // Wait, delete-game expects path... ensure we have it
      const path = installed.value?.path || (destPath.value + '/' + game.value?.title);
      window.electronAPI?.send('delete-game', path);
  }
  vfm.close(modalSettings);
}

// Removed dialogPath as it is replaced by addLibrary
// async function dialogPath() { ... }

// Rewritten primarily for Resume/Play logic, Start logic is handled by Main Button -> Popup -> startDownload
async function beforeDownload() {
  const index = downloadStore.getIndexDownloadByTitle(game.value?.title);
  
  // Logic for Pause/Resume/Play
  if (downloadStore.isDownloadExist(game.value?.id)) {
      if (!downloadStore.downloads[index]?.paused) {
          // Pause
           if (downloadStore.downloads[index]?.downloadType === 'torrent') {
              downloadStore.togglePause(game.value?.title);
              if (downloadStore.downloads[index]?.data?.infoHash) window.electronAPI?.send('pause-torrent', downloadStore.downloads[index].data.infoHash);
           }
      } else {
          // Resume
          downloadStore.togglePause(game.value?.title);
          if (downloadStore.downloads[index]?.data?.infoHash) {
              window.electronAPI?.send('resume-torrent', downloadStore.downloads[index].data.infoHash, downloadStore.downloads[index].path + '/' + downloadStore.downloads[index].title, JSON.parse(JSON.stringify(game.value)));
          }
      }
  } else if (isGameInstalled.value || installStore.isFinished(game.value?.id)) {
      // PLAY
      const syncSuccess = await store.forceLibrarySync();
      if (syncSuccess) window.electronAPI?.send('launch-game', game.value?.id);
      else notify({ type: 'error', title: 'Erreur', text: 'Sync error' });
  } 
  // Note: New Install logic is extracted to handleInstallClick -> popup -> startDownload
}

async function openGameEmplacement() {
  const path = installStore.isFinished(game.value?.id) 
    ? installStore.installs.find((i) => i.id === game.value?.id)?.path 
    : destPath.value;
  window.electronAPI?.send('open-game-emplacement', path);
}

async function updateInstallationStatus() {
  if (game.value?.id) isGameInstalled.value = await isInstalled(game.value.id);
}

async function fetchData(id: string | string[]) {
  try {
      const response: any = await useFetch(`/Cracks/api/game/?format=json&id=${id}`);
      if (response.code) {
        error.value = response.message;
        notify({ type: 'error', title: 'Erreur', text: response.message });
      } else {
        // Map response correctly based on API structure
        const data = response.games && response.games.length > 0 ? response.games[0] : response.informations ? response : response;
        
        if (!data || !data.id) throw new Error('Données de jeu invalides');

        // Requirements Parsing
        if (data.requirements?.minimum) configurationSystemMinimal.value = parseHTML(data.requirements.minimum);
        if (data.requirements?.recommended) configurationSystemRecommended.value = parseHTML(data.requirements.recommended);
        
        // Smart Size Extraction
        let detectedSize = data.size || data.informations?.size || 0;
        if (!detectedSize && data.requirements) {
            const extract = (text: string) => {
                if (!text) return null;
                // Matches "Storage: 5 GB" or "Espace disque : 50 Go" etc
                const match = text.match(/(?:Storage|Disque|Espace|Space|Hard Drive)[^0-9]*(\d+(?:[.,]\d+)?\s*(?:GB|MB|TB|Go|Mo|To))/i);
                return match ? match[1] : null; // Returns string like "5 GB"
            };
            detectedSize = extract(configurationSystemMinimal.value) || extract(configurationSystemRecommended.value) || 0;
        }

        // Safety check for critical fields
        game.value = {
            id: data.id,
            title: data.informations?.title || data.title || '',
            header: data.urls?.header_image || data.header || '',
            video: data.urls?.trailer || data.video || '',
            description: data.descriptions?.full_description || data.description || '',
            descriptionShort: data.descriptions?.short_description || '',
            views: data.views || 0,
            isOnline: data.status?.is_online || false,
            source: data.source || '',
            steam_id: data.steam_id || '',
            download: {
                torrent: data.urls?.torrent || null,
                direct: data.urls?.direct || null
            },
            informations: {
                developer: data.informations?.developer || 'N/A',
                publisher: data.informations?.publisher || 'N/A',
                release: data.status?.release_date || 'N/A'
            },
            categories: data.categories || [],
            size: detectedSize
        };
        
        await updateInstallationStatus();
      }
  } catch (err: any) {
      console.error("Fetch Data Error:", err);
      // ...
  } finally {
      loading.value = false;
  }
}

function parseHTML(html: string) {
  return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

async function isInstalled(id: string) {
  try {
    const isInstalledBool = await window.electronAPI?.invoke('is-game-installed', id);
    if (isInstalledBool) {
        // If installed, try to get info
        const info = await window.electronAPI?.invoke('get-game-install-info', id);
        if (info) {
             installed.value = {
                 id: info.id,
                 title: info.title,
                 path: info.installPath,
                 executable: info.exePath
             };
        }
        return true;
    }
    installed.value = null;
    return false;
  } catch (e) { 
      installed.value = null;
      return false; 
  }
}

function prettyBites(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function prettyMilliseconds(ms: number) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  return `${Math.floor(hour / 24)}d ${hour % 24}h ${min % 60}m ${sec % 60}s`;
}

function formatNumber(num: number) {
    return new Intl.NumberFormat('fr-FR', { notation: "compact", compactDisplay: "short" }).format(num);
}

function getSourceName(source: any): string {
    if (Array.isArray(source) && source.length > 0) return source[0].name || 'N/A';
    return 'N/A';
}

function handleImageError(event: Event) {
  (event.target as HTMLImageElement).src = '/assets/placeholder-cover.jpg';
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
}

.animate-slow-zoom {
    animation: slow-zoom 20s infinite alternate;
}
@keyframes slow-zoom {
    from { transform: scale(1.05); }
    to { transform: scale(1.15); }
}

.animate-slide-up {
    animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slide-up {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
