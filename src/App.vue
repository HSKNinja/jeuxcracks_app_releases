<template>
  <ProLayout />
  
  <!-- Global Modals -->
  <ModalsContainer />
  
  <!-- Social Overlay -->
  <FriendList v-if="store.isAuthenticated" />
  <ChatWindow v-if="store.isAuthenticated" />
  
  <!-- Notification Panel -->
  <NotificationPanel v-if="store.isAuthenticated" />
  
  <ModalConfirm :modal-id="modalChooseEXE" title="Lancement du Jeu" @confirm="vfm.close(modalChooseEXE)" button="Annuler">
    <div class="space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
             <div class="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] animate-pulse-slow">
                 <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
             </div>
             <div>
                 <h3 class="text-xs font-black text-white uppercase tracking-[0.2em]">Sélection de l'Exécutable</h3>
                 <p class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-1">Plusieurs fichiers détectés</p>
             </div>
        </div>

        <!-- Scrollable List -->
        <div class="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar px-1">
            <div 
                v-for="(exe, index) in executables" 
                :key="index"
                @click="chooseEXE(exe)"
                class="group flex items-center justify-between p-3 rounded-xl border border-transparent transition-all duration-300 cursor-pointer animate-slide-up"
                :class="isRecommended(exe) 
                    ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'"
                :style="{ animationDelay: `${index * 50}ms` }"
            >   
                <div class="flex items-center gap-3 min-w-0">
                    <!-- Icon -->
                    <div class="w-8 h-8 rounded bg-black/50 flex items-center justify-center flex-shrink-0" :class="isRecommended(exe) ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'">
                         <svg v-if="isRecommended(exe)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                         <span v-else class="text-[9px] font-mono font-bold">EXE</span>
                    </div>

                    <!-- Text -->
                    <div class="flex flex-col min-w-0">
                        <span class="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{{ exe.split(/[\\/]/).pop() }}</span>
                        <span class="text-[9px] text-zinc-500 font-mono truncate max-w-[200px]">{{ exe }}</span>
                    </div>
                </div>

                <!-- Right Action/Badge -->
                <div v-if="isRecommended(exe)" class="px-2 py-1 bg-indigo-500 text-white text-[9px] font-bold rounded uppercase tracking-wider flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    Recommandé
                </div>
                <div v-else class="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
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
import { useSocialStore } from './store/social'; // Init Social Store
const socialStore = useSocialStore();
import { useNotificationStore } from './store/notifications'; // Init Notification Store
const notificationStore = useNotificationStore();
import { useVfm } from 'vue-final-modal';
import ModalConfirm from './components/ModalConfirm.vue';
import ProLayout from './layouts/ProLayout.vue';
import UpdateNotification from './components/system/UpdateNotification.vue';
import FriendList from './components/social/FriendList.vue';
import ChatWindow from './components/social/ChatWindow.vue';
import NotificationPanel from './components/notifications/NotificationPanel.vue';

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
    
    // Add notification to notification panel
    notificationStore.addLocalNotification({
      title: 'Jeu prêt à jouer ! 🎮',
      message: `${game.title || 'Le jeu'} est installé et prêt à être lancé.`,
      type: 'SYSTEM',
      link: `game://${game.id}`
    });
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

         try { 
            await store.fetchUser(); 
            userId = store.user?.id; 
         } catch (e) { console.error(e); }
    }
    userId = userId || 'anonymous';

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
    try {
        await store.fetchUser();
    } catch (e) {
        console.error('❌ Failed to refresh user profile:', e);
    }
  }

  // Trigger Telemetry Startup if already logged in
  if (store.isAuthenticated && store.tokens) {

      window.electronAPI?.send('auth-success', store.tokens.access);
      
      // Init Social System
      await socialStore.initialize();
      
      // Init Notification System
      await notificationStore.initialize();
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
