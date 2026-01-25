<template>
  <div class="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
    
    <!-- Profile Hero Section -->
    <div class="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 shadow-2xl">
      <!-- Background Ambient Glow -->
      <div class="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        <!-- Profile Picture -->
        <div class="relative group cursor-pointer" @click="triggerFileInput">
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden" 
            accept="image/*" 
            @change="handleImageUpload"
          />
          <div class="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <div class="w-full h-full rounded-full bg-[#0a0a0a] overflow-hidden relative group-hover:ring-2 ring-white/20 transition-all">
              <img v-if="user?.profile_picture" :src="resolveAvatar(user.profile_picture)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div v-else class="w-full h-full flex items-center justify-center bg-zinc-900 overflow-hidden">
                <img src="/logo.webp" alt="JeuxCracks" class="w-full h-full object-cover opacity-90" />
              </div>
              
              <!-- Upload Overlay -->
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon class="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <div v-if="user?.is_vip" class="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/10 flex items-center gap-1">
            <SparklesIcon class="w-3 h-3" />
            PREMIUM
          </div>
          <div v-else-if="user?.is_staff || user?.is_superuser" class="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/10 flex items-center gap-1">
            <ShieldCheckIcon class="w-3 h-3" />
            STAFF
          </div>
        </div>
        
        <!-- User Info -->
        <div class="flex-1 text-center md:text-left space-y-2">
          <h1 class="text-4xl font-bold text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
            {{ user?.pseudo || 'Utilisateur' }}
            <span v-if="user?.is_staff || user?.is_superuser" class="text-xs px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-bold tracking-wide uppercase">Staff</span>
            <span v-else class="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-400 font-normal tracking-wide uppercase">Member</span>
            
            <!-- Temporary Groups -->
            <span v-for="group in user?.temporary_groups" :key="group" class="text-xs px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold tracking-wide uppercase">
              {{ group }}
            </span>
          </h1>
          <p class="text-zinc-500 flex items-center justify-center md:justify-start gap-2">
            <CalendarIcon class="w-4 h-4" />
            Membre depuis {{ formatDate(user?.date_joined) }}
          </p>
          
          <div class="pt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <button @click="isEditing = true" class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-sm font-medium text-zinc-300 transition-all">
              Éditer le profil
            </button>
            <button @click="isSuggestionOpen = true" class="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-sm font-medium text-indigo-400 transition-all">
              Faire une suggestion
            </button>
            <button @click="logout" class="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-sm font-medium text-red-400 transition-all flex items-center gap-2 group">
              <ArrowRightOnRectangleIcon class="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              Déconnexion
            </button>
          </div>
        </div>

        <!-- Activity Summary (Visual only for now) -->
        <div class="hidden xl:flex items-center gap-8 bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
           <div class="text-center">
             <div class="text-2xl font-bold text-white">{{ libraryCount }}</div>
             <div class="text-xs text-zinc-500 uppercase tracking-wider font-medium">Jeux</div>
           </div>
           <div class="w-px h-8 bg-white/10"></div>
           <div class="text-center">
             <div class="text-2xl font-bold text-white">{{ favoritesCount }}</div>
             <div class="text-xs text-zinc-500 uppercase tracking-wider font-medium">Favoris</div>
           </div>
           <div class="w-px h-8 bg-white/10"></div>
           <div class="text-center">
             <div class="text-2xl font-bold text-emerald-400">En ligne</div>
             <div class="text-xs text-zinc-500 uppercase tracking-wider font-medium">Status</div>
           </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="group relative overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/5 p-6 hover:border-indigo-500/30 transition-all duration-500">
             <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div class="relative z-10">
                <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-500">
                    <ComputerDesktopIcon class="w-6 h-6" />
                </div>
                <div class="text-4xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{{ libraryCount }}</div>
                <div class="text-sm font-medium text-zinc-500 uppercase tracking-wide">Jeux Installés</div>
             </div>
        </div>
        
        <div class="group relative overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/5 p-6 hover:border-purple-500/30 transition-all duration-500">
             <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div class="relative z-10">
                <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-500">
                    <ClockIcon class="w-6 h-6" />
                </div>
                <div class="text-4xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">128h</div>
                <div class="text-sm font-medium text-zinc-500 uppercase tracking-wide">Temps de jeu</div>
             </div>
        </div>
        
        <div class="group relative overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/5 p-6 hover:border-amber-500/30 transition-all duration-500">
             <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div class="relative z-10">
                <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-500">
                    <HeartIcon class="w-6 h-6" />
                </div>
                <div class="text-4xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{{ favoritesCount }}</div>
                <div class="text-sm font-medium text-zinc-500 uppercase tracking-wide">Jeux Favoris</div>
             </div>
        </div>
    </div>

    <!-- Settings Section -->
    <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Cog6ToothIcon class="w-6 h-6 text-zinc-500" />
            Paramètres
        </h2>
        
        <div class="grid grid-cols-1 gap-4">
            <!-- Install Folder -->
            <div class="group bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-white/10 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center flex-shrink-0">
                        <FolderOpenIcon class="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-400 transition-colors">Dossier d'installation</h4>
                        <p class="text-sm text-zinc-500 font-mono mt-0.5">{{ installPath }}</p>
                    </div>
                </div>
                <button @click="chooseInstallFolder" class="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
                    Modifier
                </button>
            </div>
            
            <!-- Notifications -->
            <div class="group bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-white/10 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center flex-shrink-0">
                        <BellIcon class="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-400 transition-colors">Notifications</h4>
                        <p class="text-sm text-zinc-500 mt-0.5">Recevoir des alertes pour les téléchargements terminés</p>
                    </div>
                </div>
                <!-- Custom Toggle Switch -->
                <button 
                  @click="notificationsEnabled = !notificationsEnabled"
                  class="w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none"
                  :class="notificationsEnabled ? 'bg-indigo-600' : 'bg-zinc-700'"
                >
                    <div 
                      class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm"
                      :class="notificationsEnabled ? 'translate-x-6' : 'translate-x-0'"
                    ></div>
                </button>
            </div>

            <!-- Auto-Update -->
            <div class="group bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:border-white/10 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center flex-shrink-0">
                        <ArrowPathIcon class="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-400 transition-colors">Mises à jour automatiques</h4>
                        <p class="text-sm text-zinc-500 mt-0.5">Mettre à jour les jeux automatiquement au lancement</p>
                    </div>
                </div>
                <!-- Custom Toggle Switch -->
                <button 
                  @click="autoUpdateEnabled = !autoUpdateEnabled"
                  class="w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none"
                  :class="autoUpdateEnabled ? 'bg-indigo-600' : 'bg-zinc-700'"
                >
                    <div 
                      class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm"
                      :class="autoUpdateEnabled ? 'translate-x-6' : 'translate-x-0'"
                    ></div>
                </button>
            </div>

            <!-- Delete Account -->
            <div class="group bg-red-950/10 border border-red-500/10 rounded-2xl p-6 flex items-center justify-between hover:border-red-500/30 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-red-950/30 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <TrashIcon class="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h4 class="font-medium text-red-400">Supprimer le compte</h4>
                        <p class="text-sm text-red-300/50 mt-0.5">Cette action est irréversible</p>
                    </div>
                </div>
                <button @click="deleteAccount" class="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/10">
                    Supprimer
                </button>
            </div>
        </div>
    </div>
    
    <!-- Edit Profile Modal -->
    <div v-if="isEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="isEditing = false">
      <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        <!-- Glow effects -->
        <div class="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <h3 class="text-2xl font-bold text-white mb-6">Modifier le profil</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Pseudo</label>
            <input 
              v-model="editForm.pseudo"
              type="text" 
              class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Votre nouveau pseudo"
            />
          </div>
          
          <div class="pt-4 flex items-center gap-3">
            <button @click="isEditing = false" class="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors">
              Annuler
            </button>
            <button @click="saveProfile" class="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Modal -->
    <div v-if="isSuggestionOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="isSuggestionOpen = false">
      <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        <!-- Glow effects -->
        <div class="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <h3 class="text-2xl font-bold text-white mb-6">Faire une suggestion</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Titre</label>
            <input 
              v-model="suggestionForm.title"
              type="text" 
              class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Titre de votre suggestion"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea 
              v-model="suggestionForm.content"
              rows="4"
              class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Décrivez votre suggestion en détail..."
            ></textarea>
          </div>
          
          <div class="pt-4 flex items-center gap-3">
            <button @click="isSuggestionOpen = false" class="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors">
              Annuler
            </button>
            <button @click="submitSuggestion" class="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useMainStore } from '../store';
import { useRouter } from 'vue-router';
import { 
    SparklesIcon, 
    ArrowRightOnRectangleIcon, 
    CalendarIcon,
    ComputerDesktopIcon,
    ClockIcon,
    HeartIcon,
    Cog6ToothIcon,
    FolderOpenIcon,
    BellIcon,
    ArrowPathIcon,
    TrashIcon,
    ShieldCheckIcon
} from '@heroicons/vue/24/solid';
import { API_CONFIG } from '../config/api';

const store = useMainStore();
const router = useRouter();

const user = computed(() => store.user);
const libraryCount = computed(() => store.library.length);
const favoritesCount = computed(() => store.favorites.length);

const resolveAvatar = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_CONFIG.BASE_URL}${path}`;
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return new Date().getFullYear();
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const notificationsEnabled = ref(true);
const autoUpdateEnabled = ref(false);
const installPath = ref('C:/Games/JeuxCracks');
const fileInput = ref<HTMLInputElement | null>(null);

// Modal State
const isEditing = ref(false);
const editForm = ref({
  pseudo: ''
});

const isSuggestionOpen = ref(false);
const suggestionForm = ref({
  title: '',
  content: ''
});

// Initialize form when user data is available
import { watch } from 'vue';
watch(user, (newUser) => {
  if (newUser?.pseudo) {
    editForm.value.pseudo = newUser.pseudo;
  }
}, { immediate: true });

onMounted(async () => {
    await store.fetchFavorites();
});

const logout = () => {
    store.logout();
    router.push('/login');
};

const deleteAccount = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
        const success = await store.deleteAccount();
        if (success) {
            router.push('/login');
        }
    }
};

const saveProfile = async () => {
    if (!editForm.value.pseudo) return;
    
    const success = await store.updateProfile({ pseudo: editForm.value.pseudo });
    if (success) {
        isEditing.value = false;
    }
};

const submitSuggestion = async () => {
    if (!suggestionForm.value.title || !suggestionForm.value.content) return;
    
    const success = await store.submitSuggestion(suggestionForm.value.title, suggestionForm.value.content);
    if (success) {
        isSuggestionOpen.value = false;
        suggestionForm.value.title = '';
        suggestionForm.value.content = '';
        alert('Merci pour votre suggestion !');
    }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    } else {
                        reject(new Error('Canvas is empty'));
                    }
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    try {
        const file = target.files[0];
        const compressedFile = await compressImage(file);
        await store.uploadProfilePicture(compressedFile);
    } catch (error) {
        console.error('Image upload failed:', error);
    }
  }
};

const chooseInstallFolder = async () => {
    try {
        const path = await (window as any).electronAPI.invoke('open-dialog', {
            properties: ['openDirectory']
        });
        if (path) {
            installPath.value = path;
        }
    } catch (error) {
        console.error('Failed to open folder dialog:', error);
    }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.2);
}
</style>
