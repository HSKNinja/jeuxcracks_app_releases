<template>
  <div class="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
    
    <!-- Header with Breadcrumb or Title -->
    <div>
      <h1 class="text-3xl font-bold text-white tracking-tight">Mon Compte</h1>
      <p class="text-zinc-500 text-sm">Gérez votre profil et vos préférences.</p>
    </div>

    <!-- Bento Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- LARGE CARD: Profile Info (Span 2 cols) -->
        <div class="md:col-span-2 relative overflow-hidden rounded-3xl bg-[#0f0f0f] border border-white/5 p-8 flex flex-col justify-between group">
             <!-- Ambient Background -->
             <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
             
             <div class="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
                 <!-- Avatar -->
                 <div class="relative group/avatar cursor-pointer" @click="triggerFileInput">
                     <div class="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/10">
                        <div class="w-full h-full rounded-full bg-black overflow-hidden relative">
                            <img v-if="user?.profile_picture" :src="resolveAvatar(user.profile_picture)" class="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
                            <div v-else class="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-bold text-2xl">
                                {{ user?.pseudo?.charAt(0).toUpperCase() || 'U' }}
                            </div>
                            
                            <!-- Edit Overlay -->
                            <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <CameraIcon class="w-6 h-6 text-white" />
                            </div>
                        </div>
                     </div>
                     <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleImageUpload" />
                     
                     <!-- Premium Badge -->
                     <div v-if="user?.is_vip" class="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20">
                        PREMIUM
                     </div>
                 </div>

                 <!-- Info -->
                 <div class="text-center md:text-left space-y-2 flex-1">
                     <div class="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                        <h2 class="text-3xl font-bold text-white">{{ user?.pseudo }}</h2>
                        <!-- Rôles -->
                        <div class="flex items-center gap-2 flex-wrap">
                            <span v-if="user?.is_staff || user?.is_superuser" class="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold tracking-wide">STAFF</span>
                            <span v-else class="px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold tracking-wide">MEMBRE</span>
                            
                            <!-- Temporary Groups Badges -->
                            <template v-if="user?.temporary_group_name">
                                <span v-for="group in (Array.isArray(user.temporary_group_name) ? user.temporary_group_name : [user.temporary_group_name])" :key="group" class="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide uppercase shadow-sm">
                                  {{ group }}
                                </span>
                            </template>
                        </div>
                     </div>
                     
                     <div class="flex items-center justify-center md:justify-start gap-4 text-sm text-zinc-500">
                         <span class="flex items-center gap-1.5">
                             <EnvelopeIcon class="w-4 h-4" />
                             {{ user?.email }}
                         </span>
                         <span class="flex items-center gap-1.5">
                             <CalendarIcon class="w-4 h-4" />
                             Membre depuis {{ formatDate(user?.date_joined) }}
                         </span>
                     </div>
                 </div>

                 <!-- Actions -->
                 <div class="flex flex-col gap-2">
                     <button @click="isEditing = true" class="px-4 py-2 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors">
                         Modifier
                     </button>
                     <button @click="logout" class="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 font-medium text-sm hover:text-white hover:bg-zinc-800 transition-colors">
                         Déconnexion
                     </button>
                 </div>
             </div>
        </div>

        <!-- STATS CARD: Library -->
        <div class="relative overflow-hidden rounded-3xl bg-[#0f0f0f] border border-white/5 p-6 flex flex-col justify-center items-center group cursor-default hover:border-indigo-500/30 transition-colors">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform duration-500">
                <ComputerDesktopIcon class="w-6 h-6" />
            </div>
            <div class="text-4xl font-bold text-white mb-1">{{ libraryCount }}</div>
            <div class="text-xs font-medium text-zinc-500 uppercase tracking-widest">Jeux Installés</div>
        </div>

        <!-- STATS CARD: Favorites -->
        <div class="relative overflow-hidden rounded-3xl bg-[#0f0f0f] border border-white/5 p-6 flex flex-col justify-center items-center group cursor-default hover:border-pink-500/30 transition-colors">
             <div class="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-2 group-hover:scale-110 transition-transform duration-500">
                <HeartIcon class="w-6 h-6" />
            </div>
            <div class="text-4xl font-bold text-white mb-1">{{ favoritesCount }}</div>
            <div class="text-xs font-medium text-zinc-500 uppercase tracking-widest">Favoris</div>
        </div>

        <!-- ACTION CARD: Suggestion -->
        <div class="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/5 p-6 flex items-center justify-between group hover:border-indigo-500/40 transition-colors">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <ChatBubbleLeftRightIcon class="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 class="font-bold text-lg text-white">Une idée pour améliorer l'app ?</h3>
                    <p class="text-indigo-200/60 text-sm">Vos retours sont essentiels pour le développement.</p>
                </div>
            </div>
            <button @click="isSuggestionOpen = true" class="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                Suggérer
            </button>
        </div>

    </div>

    <!-- SETTINGS LIST -->
    <div>
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Cog6ToothIcon class="w-5 h-5 text-zinc-500" />
            Paramètres Généraux
        </h3>
        
        <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
            
            <!-- Install Path -->
            <div class="p-4 md:p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div class="flex items-center gap-4">
                    <FolderOpenIcon class="w-6 h-6 text-zinc-600" />
                    <div>
                        <div class="font-medium text-zinc-200">Dossier d'installation</div>
                        <div class="text-xs text-zinc-500 font-mono mt-0.5">{{ installPath }}</div>
                    </div>
                </div>
                <button @click="chooseInstallFolder" class="px-3 py-1.5 text-xs font-bold bg-zinc-900 text-zinc-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors">
                    Changer
                </button>
            </div>

            <!-- Notifications -->
            <div class="p-4 md:p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div class="flex items-center gap-4">
                    <BellIcon class="w-6 h-6 text-zinc-600" />
                    <div>
                        <div class="font-medium text-zinc-200">Notifications</div>
                        <div class="text-xs text-zinc-500">Être notifié à la fin d'un téléchargement</div>
                    </div>
                </div>
                <button 
                  @click="notificationsEnabled = !notificationsEnabled"
                  class="w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none"
                  :class="notificationsEnabled ? 'bg-indigo-600' : 'bg-zinc-700'"
                >
                    <div 
                      class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm"
                      :class="notificationsEnabled ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                </button>
            </div>

            <!-- Delete Account -->
            <div class="p-4 md:p-6 flex items-center justify-between hover:bg-red-500/[0.02] transition-colors group">
                <div class="flex items-center gap-4">
                    <TrashIcon class="w-6 h-6 text-red-900/50 group-hover:text-red-500 transition-colors" />
                    <div>
                        <div class="font-medium text-red-400">Zone de danger</div>
                        <div class="text-xs text-red-400/50">Supprimer définitivement votre compte</div>
                    </div>
                </div>
                <button @click="deleteAccount" class="px-3 py-1.5 text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                    Supprimer
                </button>
            </div>

        </div>
    </div>

    <!-- MODALS -->
    
    <!-- Edit Profile Modal -->
    <div v-if="isEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="isEditing = false">
      <div class="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fade-in-up">
        <h3 class="text-xl font-bold text-white mb-6 text-center">Modifier le profil</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Pseudo</label>
            <input 
              v-model="editForm.pseudo"
              type="text" 
              class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Votre nouveau pseudo"
            />
          </div>
          
          <div class="flex items-center gap-3 pt-2">
            <button @click="isEditing = false" class="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-colors">
              Annuler
            </button>
            <button @click="saveProfile" class="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors">
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Modal -->
    <div v-if="isSuggestionOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="isSuggestionOpen = false">
      <div class="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white">Nouvelle Suggestion</h3>
            <button @click="isSuggestionOpen = false" class="p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                <XMarkIcon class="w-5 h-5" />
            </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Sujet</label>
            <input 
              v-model="suggestionForm.title"
              type="text" 
              class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ex: Ajouter un mode sombre..."
            />
          </div>
          
          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Description</label>
            <textarea 
              v-model="suggestionForm.content"
              rows="4"
              class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Expliquez votre idée..."
            ></textarea>
          </div>
          
          <button @click="submitSuggestion" class="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 mt-2">
              Envoyer la suggestion
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" @click.self="isDeleteModalOpen = false">
      <div class="bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        <div class="flex flex-col items-center text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <TrashIcon class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Supprimer le compte ?</h3>
            <p class="text-zinc-400 text-xs">Cette action est <span class="text-red-500 font-bold">irréversible</span>. Toutes vos données seront effacées.</p>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-500 uppercase mb-2">Confirmez en écrivant "SUPPRIMER"</label>
            <input 
              v-model="deleteConfirmationText"
              type="text" 
              class="w-full bg-zinc-900 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 font-bold focus:outline-none focus:border-red-500 transition-colors placeholder-zinc-700"
              placeholder="SUPPRIMER"
            />
          </div>
          
          <div class="flex items-center gap-3 pt-2">
            <button @click="isDeleteModalOpen = false" class="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-sm transition-colors">
              Annuler
            </button>
            <button 
                @click="confirmDeleteAccount" 
                :disabled="deleteConfirmationText !== 'SUPPRIMER'"
                class="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
                :class="deleteConfirmationText === 'SUPPRIMER' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useMainStore } from '../store';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '../config/api';
// Components unused
// import Switch from '../components/ui/Switch.vue'; 

// Icons
import { 
    CameraIcon, 
    PencilIcon,
    EnvelopeIcon,
    CalendarIcon,
    ComputerDesktopIcon,
    HeartIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    FolderOpenIcon,
    BellIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/vue/24/solid';

const store = useMainStore();
const router = useRouter();
const user = computed(() => store.user);
const libraryCount = computed(() => store.library.length);
const favoritesCount = computed(() => store.favorites.length);

// State
const notificationsEnabled = ref(true);
const installPath = ref('C:/Games/JeuxCracks');
const isEditing = ref(false);
const isSuggestionOpen = ref(false);
const fileInput = ref<HTMLInputElement|null>(null);

const editForm = ref({ pseudo: '' });
const suggestionForm = ref({ title: '', content: '' });

// Methods
const resolveAvatar = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_CONFIG.BASE_URL}${path}`;
};
const formatDate = (date: string | undefined) => date ? new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '2024';

const isDeleteModalOpen = ref(false);
const deleteConfirmationText = ref('');

// Watchers
watch(user, (newUser) => { if(newUser?.pseudo) editForm.value.pseudo = newUser.pseudo; }, { immediate: true });
watch(isDeleteModalOpen, (isOpen) => { if(!isOpen) deleteConfirmationText.value = ''; });

onMounted(async () => { await store.fetchFavorites(); });

// Actions
import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();

const logout = () => { store.logout(); router.push('/login'); };
const deleteAccount = () => { isDeleteModalOpen.value = true; };
const confirmDeleteAccount = async () => {
    if (deleteConfirmationText.value !== 'SUPPRIMER') return;
    if(await store.deleteAccount()) {
         notify({ type: 'success', title: 'Compte supprimé', text: 'Nous sommes tristes de vous voir partir.' });
         router.push('/login');
    } else {
        notify({ type: 'error', title: 'Erreur', text: 'Impossible de supprimer le compte. Contactez le support.' });
    }
};

const saveProfile = async () => { if(await store.updateProfile({ pseudo: editForm.value.pseudo })) { isEditing.value = false; notify({ type: 'success', title: 'Profil mis à jour' }); } };
const submitSuggestion = async () => { 
    if(await store.submitSuggestion(suggestionForm.value.title, suggestionForm.value.content)) { 
        isSuggestionOpen.value = false; 
        suggestionForm.value = {title:'', content:''}; 
        notify({ type: 'success', title: 'Merci !', text: 'Votre suggestion a bien été reçue.' }); 
    } 
};

const triggerFileInput = () => fileInput.value?.click();
const handleImageUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if(file) await store.uploadProfilePicture(file); 
};
const chooseInstallFolder = async () => {
     try {
        if (window.electronAPI) {
            const path = await window.electronAPI.invoke('open-dialog', { properties: ['openDirectory'] });
            if (path) installPath.value = path;
        }
    } catch (e) { console.error(e); }
};

</script>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
