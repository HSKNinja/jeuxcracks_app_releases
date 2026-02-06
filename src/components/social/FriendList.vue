<template>
  <div class="fixed right-0 top-16 bottom-0 w-72 bg-[#111] border-l border-white/5 flex flex-col z-40 transform transition-transform duration-300 ease-in-out"
       :class="socialStore.isPanelOpen ? 'translate-x-0' : 'translate-x-full'">
    
    <!-- Header -->
    <div class="p-4 border-b border-white/5 flex items-center justify-between">
      <h3 class="font-bold text-sm text-gray-200">Amis</h3>
      <div class="flex gap-2">
         <button @click="showAddFriendModal = true" class="p-1 hover:bg-white/10 rounded" title="Ajouter un ami">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
         </button>
         <button @click="showBlockedModal = true" class="p-1 hover:bg-white/10 rounded" title="Utilisateurs bloqués">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
         </button>
         <button @click="socialStore.togglePanel()" class="p-1 hover:bg-white/10 rounded">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
         </button>
      </div>
    </div>

    <!-- Requests -->
    <div v-if="socialStore.requests.length > 0" class="p-3 border-b border-white/5 bg-indigo-500/10">
        <h4 class="text-[10px] uppercase font-bold text-indigo-400 mb-2">Demandes - {{ socialStore.requests.length }}</h4>
        <div v-for="req in socialStore.requests" :key="req.id" class="flex items-center justify-between mb-2 last:mb-0">
            <div class="flex items-center gap-2 overflow-hidden">
                <img :src="req.friend?.avatar || '/assets/avatar_placeholder.png'" class="w-6 h-6 rounded-full bg-zinc-800">
                <span class="text-xs truncate text-white">{{ req.friend?.pseudo }}</span>
            </div>
            <div class="flex gap-1">
                <button @click="socialStore.respondToRequest(req.id, 'ACCEPT')" class="text-green-400 hover:bg-green-400/20 p-1 rounded">✓</button>
                <button @click="socialStore.respondToRequest(req.id, 'REJECT')" class="text-red-400 hover:bg-red-400/20 p-1 rounded">✕</button>
            </div>
        </div>
    </div>

    <!-- Friends List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        
        <!-- Online -->
        <div v-if="online.length > 0">
            <h4 class="px-2 text-[10px] uppercase font-bold text-zinc-500 mb-2">En Ligne - {{ online.length }}</h4>
            <div v-for="friend in online" :key="friend.id" 
                 class="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors relative">
                
                <div class="relative" @click="socialStore.openChat(friend.id)">
                    <img :src="friend.avatar || '/assets/avatar_placeholder.png'" class="w-8 h-8 rounded-full bg-zinc-800 object-cover">
                    <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111]"
                         :class="{
                            'bg-green-500': friend.status === 'ONLINE',
                            'bg-yellow-500': friend.status === 'IDLE',
                            'bg-purple-500 animate-pulse': friend.status === 'IN_GAME'
                         }"></div>
                </div>
                
                <div class="flex-1 min-w-0" @click="socialStore.openChat(friend.id)">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-medium text-gray-200 truncate group-hover:text-white">{{ friend.pseudo }}</span>
                        <span v-if="friend.unread_count" class="bg-red-500 text-white text-[9px] px-1.5 rounded-full font-bold">{{ friend.unread_count }}</span>
                    </div>
                    <p v-if="friend.status === 'IN_GAME'" class="text-[10px] text-purple-400 truncate">Joue à {{ friend.game_title }}</p>
                    <p v-else class="text-[10px] text-zinc-500 truncate">{{ friend.status }}</p>
                </div>

                <!-- Context Menu Trigger -->
                <button @click.stop="toggleFriendMenu(friend.id)" 
                        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity">
                    <svg class="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                </button>

                <!-- Dropdown Menu -->
                <div v-if="openMenuId === friend.id" 
                     class="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 py-1 text-xs">
                    <button @click="removeFriend(friend)" class="w-full text-left px-3 py-2 hover:bg-white/5 text-zinc-300 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
                        Supprimer
                    </button>
                    <button @click="blockFriend(friend)" class="w-full text-left px-3 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        Bloquer
                    </button>
                </div>
            </div>
        </div>

        <!-- Offline -->
        <div v-if="offline.length > 0">
             <h4 class="px-2 text-[10px] uppercase font-bold text-zinc-600 mb-2 mt-4">Hors Ligne - {{ offline.length }}</h4>
             <div v-for="friend in offline" :key="friend.id" 
                  class="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity relative">
                <img :src="friend.avatar || '/assets/avatar_placeholder.png'" class="w-8 h-8 rounded-full bg-zinc-800 grayscale" @click="socialStore.openChat(friend.id)">
                <span class="text-xs text-zinc-400 flex-1" @click="socialStore.openChat(friend.id)">{{ friend.pseudo }}</span>
                
                <!-- Context Menu Trigger -->
                <button @click.stop="toggleFriendMenu(friend.id)" 
                        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity">
                    <svg class="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                </button>

                <!-- Dropdown Menu -->
                <div v-if="openMenuId === friend.id" 
                     class="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 py-1 text-xs">
                    <button @click="removeFriend(friend)" class="w-full text-left px-3 py-2 hover:bg-white/5 text-zinc-300 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
                        Supprimer
                    </button>
                    <button @click="blockFriend(friend)" class="w-full text-left px-3 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        Bloquer
                    </button>
                </div>
             </div>
        </div>

        <!-- Empty State -->
        <div v-if="online.length === 0 && offline.length === 0" class="flex flex-col items-center justify-center h-full text-center px-4">
            <svg class="w-12 h-12 text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <p class="text-zinc-500 text-xs">Aucun ami pour le moment</p>
            <button @click="showAddFriendModal = true" class="mt-2 text-indigo-400 text-xs hover:underline">Ajouter un ami</button>
        </div>
    </div>

    <!-- Add Friend Modal -->
    <div v-if="showAddFriendModal" class="absolute inset-0 bg-black/95 z-50 flex flex-col p-4">
        <div class="flex justify-between mb-4">
            <h3 class="font-bold text-white">Ajouter un ami</h3>
            <button @click="showAddFriendModal = false" class="text-zinc-400 hover:text-white">✕</button>
        </div>
        <input v-model="searchQuery" type="text" placeholder="Pseudo..." class="bg-zinc-800 border-none rounded p-2 text-sm text-white mb-2 focus:ring-1 focus:ring-indigo-500">
        <button @click="sendRequest" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded transition-colors" :disabled="loading">
            {{ loading ? 'Envoi...' : 'Envoyer la demande' }}
        </button>
        <p v-if="feedback" class="text-xs mt-2" :class="feedbackType === 'error' ? 'text-red-400' : 'text-green-400'">{{ feedback }}</p>
    </div>

    <!-- Blocked Users Modal -->
    <div v-if="showBlockedModal" class="absolute inset-0 bg-black/95 z-50 flex flex-col p-4">
        <div class="flex justify-between mb-4">
            <h3 class="font-bold text-white">Utilisateurs bloqués</h3>
            <button @click="showBlockedModal = false" class="text-zinc-400 hover:text-white">✕</button>
        </div>

        <div v-if="socialStore.blockedUsers.length === 0" class="text-center text-zinc-500 text-xs mt-8">
            <p>Aucun utilisateur bloqué</p>
        </div>

        <div v-else class="space-y-2">
            <div v-for="user in socialStore.blockedUsers" :key="user.id" class="flex items-center justify-between p-2 bg-zinc-900 rounded">
                <span class="text-xs text-white">{{ user.pseudo }}</span>
                <button @click="unblockUser(user)" class="text-xs text-indigo-400 hover:underline">Débloquer</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSocialStore } from '../../store/social';

const socialStore = useSocialStore();
const showAddFriendModal = ref(false);
const showBlockedModal = ref(false);
const searchQuery = ref('');
const loading = ref(false);
const feedback = ref('');
const feedbackType = ref('');
const openMenuId = ref<number | null>(null);

const online = computed(() => socialStore.onlineFriends);
const offline = computed(() => socialStore.offlineFriends);

// Close dropdown when clicking outside
function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-friend-menu]')) {
        openMenuId.value = null;
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    socialStore.fetchBlockedUsers(); // Load blocked users
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

function toggleFriendMenu(friendId: number) {
    openMenuId.value = openMenuId.value === friendId ? null : friendId;
}

async function sendRequest() {
    if (!searchQuery.value) return;
    loading.value = true;
    feedback.value = '';
    
    try {
        await socialStore.sendFriendRequest(searchQuery.value);
        feedback.value = 'Demande envoyée !';
        feedbackType.value = 'success';
        searchQuery.value = '';
        setTimeout(() => showAddFriendModal.value = false, 1500);
    } catch (e) {
        feedback.value = "Utilisateur introuvable ou erreur.";
        feedbackType.value = 'error';
    } finally {
        loading.value = false;
    }
}

async function removeFriend(friend: any) {
    openMenuId.value = null;
    if (confirm(`Supprimer ${friend.pseudo} de ta liste d'amis ?`)) {
        await socialStore.removeFriend(friend.friendship_id);
    }
}

async function blockFriend(friend: any) {
    openMenuId.value = null;
    if (confirm(`Bloquer ${friend.pseudo} ? Tu ne recevras plus ses messages.`)) {
        await socialStore.blockUser(friend.id);
    }
}

async function unblockUser(user: any) {
    await socialStore.unblockUser(user.friendship_id);
}
</script>
