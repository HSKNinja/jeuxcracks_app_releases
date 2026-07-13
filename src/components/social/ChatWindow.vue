<template>
  <div v-if="socialStore.activeChatId"
       :class="isMinimized ? 'h-10' : 'h-96'"
       class="fixed right-80 bottom-0 w-80 bg-[#151515] border border-white/10 rounded-t-xl shadow-2xl flex flex-col z-50 overflow-hidden transform transition-all duration-300">

    <!-- Title Bar -->
    <div class="h-10 bg-[#222] flex items-center justify-between px-3 border-b border-white/5 flex-shrink-0">
        <div class="flex items-center gap-2 cursor-pointer flex-1 min-w-0" @click="isMinimized = !isMinimized" :title="isMinimized ? 'Agrandir' : 'Réduire'">
            <div class="w-2 h-2 rounded-full flex-shrink-0"
                 :class="activeFriend?.status === 'ONLINE' ? 'bg-green-500' : 'bg-zinc-500'"></div>
            <span class="text-xs font-bold text-white truncate">{{ activeFriend?.pseudo || 'Chat' }}</span>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Menu Dropdown -->
            <div class="relative">
                <button @click.stop="showMenu = !showMenu" class="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                </button>

                <div v-if="showMenu" class="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 py-1 text-xs">
                    <button @click="removeFriend" class="w-full text-left px-3 py-2 hover:bg-white/5 text-zinc-300 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
                        Supprimer
                    </button>
                    <button @click="blockFriend" class="w-full text-left px-3 py-2 hover:bg-red-500/20 text-red-400 flex items-center gap-2">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                        Bloquer
                    </button>
                </div>
            </div>

            <!-- Réduire / Agrandir -->
            <button @click.stop="isMinimized = !isMinimized" class="text-zinc-500 hover:text-white p-1" :title="isMinimized ? 'Agrandir' : 'Réduire'">
                <!-- Chevron haut quand réduit (pour agrandir) -->
                <svg v-if="isMinimized" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
                <!-- Trait (minus) quand agrandi (pour réduire) -->
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"/></svg>
            </button>

            <button @click.stop="socialStore.closeChat()" class="text-zinc-500 hover:text-white p-1" title="Fermer">✕</button>
        </div>
    </div>

    <!-- Messages -->
    <div v-show="!isMinimized" class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col-reverse">
        <div v-for="(msg, i) in messages" :key="i" 
             class="max-w-[85%] p-2 rounded-lg text-xs break-words relative group"
             :class="msg.is_me ? 'self-end bg-indigo-600 text-white rounded-br-none' : 'self-start bg-zinc-800 text-zinc-200 rounded-bl-none'">
             
             <p>{{ msg.content }}</p>
             <span class="text-[9px] opacity-0 group-hover:opacity-50 absolute -bottom-4 min-w-[50px]"
                   :class="msg.is_me ? 'right-0 text-right' : 'left-0'">
                {{ formatTime(msg.timestamp) }}
             </span>
        </div>
        
        <!-- Empty Chat State -->
        <div v-if="messages.length === 0" class="flex-1 flex items-center justify-center text-zinc-600 text-xs">
            Aucun message. Dis bonjour ! 👋
        </div>
    </div>

    <!-- Input -->
    <div v-show="!isMinimized" class="p-2 bg-[#222] border-t border-white/5">
        <form @submit.prevent="sendMessage" class="flex gap-2">
            <input v-model="inputDetails" 
                   type="text" 
                   class="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                   placeholder="Envoyer un message..."
            >
            <button type="submit" class="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors" :disabled="!inputDetails.trim()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
        </form>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useSocialStore } from '../../store/social';

const socialStore = useSocialStore();
const inputDetails = ref('');
const showMenu = ref(false);
const isMinimized = ref(false);

// À chaque ouverture d'une conversation, on repart en mode agrandi.
watch(() => socialStore.activeChatId, () => { isMinimized.value = false; });

const activeFriend = computed(() => {
    return socialStore.friends.find(f => f.id === socialStore.activeChatId);
});

const messages = computed(() => {
    // Reverse because we use flex-col-reverse for stick-to-bottom behavior
    return [...socialStore.getActiveChatMessages].reverse();
});

// Close menu when clicking outside
function handleClickOutside(e: MouseEvent) {
    showMenu.value = false;
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

function sendMessage() {
    if (!inputDetails.value.trim()) return;
    socialStore.sendMessage(inputDetails.value);
    inputDetails.value = '';
}

function formatTime(iso: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function removeFriend() {
    showMenu.value = false;
    if (activeFriend.value && confirm(`Supprimer ${activeFriend.value.pseudo} de ta liste d'amis ?`)) {
        await socialStore.removeFriend(activeFriend.value.friendship_id);
        socialStore.closeChat();
    }
}

async function blockFriend() {
    showMenu.value = false;
    if (activeFriend.value && confirm(`Bloquer ${activeFriend.value.pseudo} ? Tu ne recevras plus ses messages.`)) {
        await socialStore.blockUser(activeFriend.value.id);
        socialStore.closeChat();
    }
}
</script>
