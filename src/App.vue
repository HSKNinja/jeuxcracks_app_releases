<template>
  <ProLayout />
  
  <!-- Global Modals -->
  <ModalsContainer />
  
  <ModalConfirm :modal-id="modalChooseEXE" title="Lancement du Jeu" @confirm="vfm.close(modalChooseEXE)" button="Annuler">
    <div class="space-y-8">
        
        <!-- Hero Status -->
        <div class="relative overflow-hidden rounded-2xl bg-black/40 border border-white/5 p-6 flex flex-col items-center text-center group">
            <!-- Background Glow -->
            <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div class="relative z-10 w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[1px] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <div class="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
            
            <h3 class="relative z-10 text-lg font-bold text-white mb-1 tracking-tight">Fichier manquant</h3>
            <p class="relative z-10 text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Nous avons détecté plusieurs exécutables. Sélectionnez celui qui lance le jeu pour continuer.
            </p>
        </div>

        <!-- Scrollable List -->
        <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar px-1">
            <div 
                v-for="(exe, index) in executables" 
                :key="index"
                @click="chooseEXE(exe)"
                class="group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-0.5"
                :class="isRecommended(exe) 
                    ? 'bg-indigo-900/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] order-first' 
                    : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800 hover:border-indigo-500/50'"
                :style="{ animationDelay: `${index * 50}ms` }"
            >   
                <!-- Selection Indicator Bar -->
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <!-- Icon -->
                <div class="relative w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                    :class="isRecommended(exe) ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5 border border-white/5 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30'"
                >
                    <span class="text-[10px] font-black transition-colors"
                        :class="isRecommended(exe) ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-indigo-300'"
                    >EXE</span>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 flex flex-col">
                    <div class="flex items-center gap-2">
                        <h4 class="text-xs font-bold truncate transition-colors tracking-wide"
                            :class="isRecommended(exe) ? 'text-white' : 'text-zinc-200 group-hover:text-white'"
                        >
                            {{ exe.split(/[\\/]/).pop() }}
                        </h4>
                        <span v-if="isRecommended(exe)" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500 text-white shadow-sm shimmer-effect">
                            RECOMMANDÉ
                        </span>
                    </div>
                    <span class="text-[10px] truncate transition-colors font-mono mt-0.5"
                        :class="isRecommended(exe) ? 'text-indigo-200/70' : 'text-zinc-600 group-hover:text-zinc-400'"
                    >
                        {{ exe }}
                    </span>
                </div>

                <!-- Action -->
                <div class="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all">
                    <svg class="w-4 h-4 text-zinc-600 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        </div>
    </div>
  </ModalConfirm>

  <ModalConfirm :modal-id="modalLogout" title="Confirmation de déconnexion">
    <div class="text-center">
      <div class="mb-6">
        <div class="relative inline-block mb-4">
          <div class="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-xl"></div>
          <svg class="relative w-16 h-16 mx-auto text-red-500 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Êtes-vous sûr de vouloir vous déconnecter ?</h3>
        <p class="text-neutral-400 text-sm leading-relaxed">
          Vous allez être déconnecté de votre compte. Toutes vos données locales seront conservées.
        </p>
      </div>
      <div class="flex gap-3 justify-center">
        <button 
          @click="vfm.close(modalLogout)"
          class="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-xl transition-all duration-300"
        >
          Annuler
        </button>
        <button 
          @click="confirmLogout"
          class="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-300"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  </ModalConfirm>

  <!-- Auto-Update Notification -->
  <UpdateNotification 
    :status="updateStatus" 
    :progress="updateProgress"
    @close="updateStatus = null"
    @restart="restartApp"
  />
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
provide('API_URL', 'https://nodejc.chouette.cc/v1');

import { useRouter } from 'vue-router';
const router = useRouter();
import { ModalsContainer } from 'vue-final-modal';
import 'vue-final-modal/style.css';
import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();
import { useMainStore } from './store';
const store = useMainStore();
import { useDownloadStore } from './store/download';
const downloadStore = useDownloadStore();
import { useInstallStore } from './store/install';
const installStore = useInstallStore();
import { useVfm } from 'vue-final-modal';
import ModalConfirm from './components/ModalConfirm.vue';
import ProLayout from './layouts/ProLayout.vue';
import UpdateNotification from './components/system/UpdateNotification.vue';

// Déclaration globale pour TypeScript
declare global {
  interface Window {
    electronAPI?: {
      on: (...args: any[]) => void;
      send: (...args: any[]) => void;
      invoke: (...args: any[]) => Promise<any>;
    }
  }
}

const updateStatus = ref<'checking' | 'available' | 'downloading' | 'ready' | null>(null);
const updateProgress = ref(0);


const vfm = useVfm();
const modalChooseEXE = Symbol('modalChooseEXE');
const executables = ref<string[]>([]);
const gameIDExe = ref<string>('');
const gamePathEXE = ref<string>('');
const modalLogout = Symbol('modalLogout');

const gameTitleEXE = ref<string>('');

const isRecommended = (exeName: string): boolean => {
    if (!gameTitleEXE.value) return false;
    const cleanName = exeName.split(/[\\/]/).pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const cleanTitle = gameTitleEXE.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check if title is contained in exe name (e.g. "Lethal Company" -> "LethalCompany.exe")
    if (cleanName.includes(cleanTitle)) return true;
    
    // Check for common main exe names if specific title fails
    if (['game.exe', 'launcher.exe', 'start.exe'].includes(exeName.toLowerCase())) return false; // Usually not the main one if specific name exists, but context dependent.
    
    return false;
};

// IPC Handlers
if (window.electronAPI) {
  // Navigation/Window events are handled in TopBar/ModernLayout, or here if generic
  // Download/Install events
  window.electronAPI.on('download-progress', (e: any, download: any, title: any) => {
    // console.log('📊 download-progress reçu:', download, title);
    if (download && title) {
      downloadStore.updateDownload(download, title);
    }
  });
  window.electronAPI.on('download-done', (e: any, title: any) => {
    downloadStore.removeDownloadByTitle(title);
  });
  window.electronAPI.on('install-start', (e: any, newInstall: any) => {
    if (newInstall.game && newInstall.game.header) {
      const getImageUrl = (imagePath: string | undefined): string => {
        if (!imagePath) return '/assets/placeholder.webp';
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `https://api.jeuxcracks.fr${imagePath}`;
        return '/assets/placeholder.webp';
      };
      newInstall.game.header = getImageUrl(newInstall.game.header);
    }
    installStore.addInstall(newInstall);
  });
  window.electronAPI.on('install-failed', (e: any, id: any) => {
    notify({ type: 'error', title: 'Installation', text: "L'installation a échoué" });
    installStore.removeInstallById(id);
  });
  window.electronAPI.on('install-done', async (e: any, game: any) => {
    notify({ type: 'success', title: 'Installation', text: "L'installation est terminée" });
    installStore.setFinished(game.id);
    store.addLibrary(game);
    await store.syncLibraryFromFile();
  });
  window.electronAPI.on('install-progress', (e: any, status: any) => {
    if (status && status.gameID) {
        installStore.updateProgress(status.gameID, status.progress, status.message);
    }
  });
  window.electronAPI.on('error', (e: any, err: any) => {
    notify({ type: 'error', title: 'Erreur', text: err });
  });

  window.electronAPI.on('find-many-exe', (e: any, exes: any, gameID: any, gamePath: any, title: any) => {
    executables.value = exes;
    gameIDExe.value = gameID;
    gamePathEXE.value = gamePath;
    gameTitleEXE.value = title || '';
    vfm.open(modalChooseEXE);
  });
  window.electronAPI.on('game-removed', (e: any, gameID: any) => {
    store.removeLibrary(gameID);
    installStore.removeInstallById(gameID);
    downloadStore.removeDownloadByTitle(gameID);
  });
  window.electronAPI.on('game-launched', (e: any) => {
    notify({ type: 'success', title: 'Jeu lancé', text: 'Le jeu se lance en arrière-plan' });
  });
  window.electronAPI.on('game-closed', (e: any) => {
    notify({ type: 'info', title: 'Jeu fermé', text: 'Le jeu a été fermé' });
  });

  // Auto-Update Events
  window.electronAPI.on('checking-for-update', () => {
    updateStatus.value = 'checking';
  });

  window.electronAPI.on('update-not-available', () => {
    // Si aucune maj n'est dispo, on attend 2 sec pour que l'user voie "Recherche..." puis on ferme
    setTimeout(() => {
        updateStatus.value = null;
    }, 2000);
  });

  window.electronAPI.on('update-error', (_e, msg) => {
    console.error('Update check failed:', msg);
    // On affiche l'erreur brièvement ou on masque le loader
    setTimeout(() => {
        updateStatus.value = null;
    }, 2000);
  });

  window.electronAPI.on('update-available', () => {
    updateStatus.value = 'available';
    // Mock downloading state after a short delay for UX
    setTimeout(() => {
        updateStatus.value = 'downloading';
        // Simulate progress if actual progress isn't sent
        updateProgress.value = 10; 
    }, 2000);
  });
  window.electronAPI.on('update-downloaded', () => {
    updateStatus.value = 'ready';
    updateProgress.value = 100;
  });
}

function restartApp() {
  window.electronAPI?.send('restart-app');
}

async function chooseEXE(exe: string) {
  window.electronAPI?.send('set-exe-file', gameIDExe.value, exe);
  vfm.close(modalChooseEXE);
  notify({ type: 'success', title: 'Fichier sélectionné', text: `"${exe}" a été choisi comme exécutable principal` });
  
  setTimeout(async () => {
    let userId = store.user?.id;
    if (!userId && store.tokens) {
         console.log('🔄 Recovery: Fetching user before launch in chooseEXE...');
         try { 
            await store.fetchUser(); 
            userId = store.user?.id; 
         } catch (e) { console.error(e); }
    }
    userId = userId || 'anonymous';
    console.log('🚀 Lancement avec User:', userId);
    window.electronAPI?.send('launch-game', gameIDExe.value, userId);
  }, 500);
}

function confirmLogout() {
  vfm.close(modalLogout);
  store.logout();
  router.push('/login');
}

onMounted(async () => {
  // Trigger update check with delay to ensure UI is ready
  setTimeout(() => {
     window.electronAPI?.send('check-for-update');
  }, 1000);

  await initializeLibrary();
  
  // Verify User ID presence
  if (store.isAuthenticated && !store.user?.id) {
    console.log('🔄 User ID missing in store, refetching user profile...');
    try {
        await store.fetchUser();
        console.log('✅ User profile refreshed:', store.user);
    } catch (e) {
        console.error('❌ Failed to refresh user profile:', e);
    }
  }

  // Trigger Telemetry Startup if already logged in
  if (store.isAuthenticated && store.tokens) {
      console.log('📡 Auto-Triggering Telemetry startup (App Mount)...');
      window.electronAPI?.send('auth-success', store.tokens.access);
  }
  
  if (!store.isAuthenticated && router.currentRoute.value.path !== '/login') {
    router.replace('/login');
  }
  if (store.isAuthenticated && router.currentRoute.value.path === '/login') {
    router.replace('/');
  }
  // Auto redirect check
  const protectedRoutes = ['/', '/account', '/downloads', '/favorites', '/library', '/catalogue', '/premium'];
  if (store.isAuthenticated && !protectedRoutes.includes(router.currentRoute.value.path) && router.currentRoute.value.path !== '/login') {
      // Allow other routes? Logic was "if path IS NOT in whitelist, go to home?"
      // Original logic: if path != '/' AND ... AND ... => go to '/'
      // Meaning "if authenticated and on a protected page that is NOT one of these???"
      // Actually original logic was: "if authenticated AND path is not one of [list] -> replace /"
      // Using array includes for cleaner code
      if (!protectedRoutes.includes(router.currentRoute.value.path) && !router.currentRoute.value.path.startsWith('/catalogue/')) {
          router.replace('/');
      }
  }
});

async function initializeLibrary() {
  await store.syncLibraryFromFile();
}
</script>

<style>
/* Global scrollbar styles could go here if not in main.css */
</style>
