<template>
  <div class="fixed right-0 top-16 bottom-0 w-80 bg-[#111] border-l border-white/5 flex flex-col z-50 transform transition-transform duration-300 ease-in-out"
       :class="notificationStore.isPanelOpen ? 'translate-x-0' : 'translate-x-full'">
    
    <!-- Header -->
    <div class="p-4 border-b border-white/5 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="font-bold text-sm text-gray-200">Notifications</h3>
        <span v-if="notificationStore.unreadCount > 0" 
              class="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {{ notificationStore.unreadCount }}
        </span>
      </div>
      <div class="flex gap-2">
        <button v-if="notificationStore.unreadCount > 0" 
                @click="notificationStore.markAsRead()" 
                class="text-xs text-indigo-400 hover:underline">
          Tout marquer lu
        </button>
        <button @click="notificationStore.closePanel()" class="p-1 hover:bg-white/10 rounded">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="notificationStore.isLoading" class="flex-1 flex items-center justify-center">
      <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Notifications List -->
    <div v-else class="flex-1 overflow-y-auto custom-scrollbar">
      
      <!-- Empty State -->
      <div v-if="notificationStore.notifications.length === 0" 
           class="flex flex-col items-center justify-center h-full text-center px-4">
        <svg class="w-12 h-12 text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <p class="text-zinc-500 text-xs">Aucune notification</p>
      </div>

      <!-- Notification Items -->
      <div v-else class="divide-y divide-white/5">
        <div v-for="notif in notificationStore.notifications" :key="notif.id"
             @click="notificationStore.handleNotificationClick(notif)"
             class="p-3 hover:bg-white/5 cursor-pointer transition-colors relative group"
             :class="{ 'bg-indigo-500/5': !notif.is_read }">
          
          <!-- Unread Indicator -->
          <div v-if="!notif.is_read" 
               class="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full"></div>
          
          <!-- Content -->
          <div class="pl-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <!-- Type Icon -->
                  <span class="text-xs" :class="getTypeColor(notif.type)">
                    {{ getTypeIcon(notif.type) }}
                  </span>
                  <span class="text-xs font-semibold text-white truncate">{{ notif.title }}</span>
                </div>
                <p class="text-[11px] text-zinc-400 line-clamp-2">{{ notif.message }}</p>
                <p class="text-[10px] text-zinc-600 mt-1">{{ formatTime(notif.created_at) }}</p>
              </div>
              
              <!-- Delete Button -->
              <button @click.stop="notificationStore.deleteNotification(notif.id)"
                      class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../../store/notifications';

const notificationStore = useNotificationStore();

function getTypeIcon(type: string): string {
  switch (type) {
    case 'UPDATE': return '🔄';
    case 'PROMO': return '🎁';
    case 'SYSTEM': return '⚙️';
    case 'SOCIAL': return '👥';
    default: return '📬';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'UPDATE': return 'text-blue-400';
    case 'PROMO': return 'text-yellow-400';
    case 'SYSTEM': return 'text-zinc-400';
    case 'SOCIAL': return 'text-purple-400';
    default: return 'text-zinc-400';
  }
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}
</script>
