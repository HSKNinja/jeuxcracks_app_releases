import { defineStore } from 'pinia';
import { WebSocketService } from '@/services/WebSocketService';
import { useMainStore } from './index';
import { useNotificationStore } from './notifications';

// Types
interface Friend {
  id: number;
  friendship_id: number; // ID of the Friendship relation (for remove/block)
  pseudo: string;
  avatar?: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME' | 'IDLE';
  game_title?: string;
  unread_count?: number;
}

interface FriendRequest {
  id: number; // Friendship ID (for responding)
  friend: {
    id: number;
    pseudo: string;
    avatar?: string;
  };
  created_at: string;
}

interface ChatMessage {
  id?: number;
  sender_id: number;
  content: string;
  timestamp: string;
  is_me?: boolean;
}

const API_SOCIAL_URL = 'https://api.jeuxcracks.fr/api/social';
const API_BASE_URL = 'https://api.jeuxcracks.fr';

// Helper to build full avatar URL
function getAvatarUrl(profilePicture?: string): string | undefined {
    if (!profilePicture) return undefined;
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${API_BASE_URL}${profilePicture}`;
}

export const useSocialStore = defineStore('social', {
  state: () => ({
    friends: [] as Friend[],
    requests: [] as FriendRequest[],
    blockedUsers: [] as { id: number; pseudo: string; friendship_id: number }[],
    chatHistory: {} as Record<number, ChatMessage[]>,
    isConnected: false,
    activeChatId: null as number | null,
    isPanelOpen: false,
  }),

  getters: {
    onlineFriends: (state) => state.friends.filter(f => f.status !== 'OFFLINE'),
    offlineFriends: (state) => state.friends.filter(f => f.status === 'OFFLINE'),
    totalUnread: (state) => {
        return state.friends.reduce((acc, f) => acc + (f.unread_count || 0), 0);
    },
    totalNotifications: (state) => {
        const unreadMessages = state.friends.reduce((acc, f) => acc + (f.unread_count || 0), 0);
        return unreadMessages + state.requests.length;
    },
    getActiveChatMessages: (state) => {
        if (!state.activeChatId) return [];
        return state.chatHistory[state.activeChatId] || [];
    }
  },

  actions: {
    // --- Initialization ---
    async initialize() {
      const mainStore = useMainStore();
      if (!mainStore.isAuthenticated || !mainStore.tokens?.access) return;


      
      // 1. Connect WS
      WebSocketService.getInstance().connect(mainStore.tokens.access);

      // 2. Fetch Initial Data
      await this.fetchFriends();
      await this.fetchRequests();
      await this.fetchUnreadCounts(); // Sync unread counts from server
    },

    disconnect() {
      WebSocketService.getInstance().disconnect();
      this.isConnected = false;
      this.friends = [];
      this.requests = [];
      this.chatHistory = {};
    },

    // --- API Calls ---
    async fetchFriends() {
      const mainStore = useMainStore();
      try {
        const res = await fetch(`${API_SOCIAL_URL}/friends/friends/`, {
            headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Data format: [{ id: 12, friend: {...}, status: 'ACCEPTED' }]
            // Transform to local Friend format
            this.friends = data.map((item: any) => ({
                id: item.friend.id,
                friendship_id: item.id, // Store the relationship ID for API calls
                pseudo: item.friend.pseudo,
                avatar: getAvatarUrl(item.friend.profile_picture),
                status: 'OFFLINE', // Default, update via presence/ws
                unread_count: 0
            }));
        }
      } catch (e) {
        console.error('❌ Failed to fetch friends:', e);
      }
    },

    async fetchRequests() {
      const mainStore = useMainStore();
      try {
        const res = await fetch(`${API_SOCIAL_URL}/friends/requests/`, { // New Endpoint
            headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Transform to include full avatar URL
            this.requests = data.map((item: any) => ({
                id: item.id,
                friend: {
                    id: item.friend.id,
                    pseudo: item.friend.pseudo,
                    avatar: getAvatarUrl(item.friend.profile_picture)
                },
                created_at: item.created_at
            }));
        }
      } catch (e) { console.error('Failed to fetch requests', e); }
    },

    async respondToRequest(requestId: number, action: 'ACCEPT' | 'REJECT') {
        const mainStore = useMainStore();
        try {
            await fetch(`${API_SOCIAL_URL}/friends/${requestId}/respond/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${mainStore.tokens?.access}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ action })
            });
            // Opimistic UI update
            this.requests = this.requests.filter(r => r.id !== requestId);
            if (action === 'ACCEPT') await this.fetchFriends(); // Refresh friends
        } catch (e) { console.error(e); }
    },

    async sendFriendRequest(username: string) {
        const mainStore = useMainStore();
        const res = await fetch(`${API_SOCIAL_URL}/friends/request/`, {
            method: 'POST',
            headers: { 
                    'Authorization': `Bearer ${mainStore.tokens?.access}`,
                    'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ username })
        });
        if (!res.ok) throw new Error('User not found or error');
    },

    async fetchChatHistory(friendId: number) {
        const mainStore = useMainStore();
        if (this.chatHistory[friendId]?.length > 0) return; // Already loaded

        try {
            const res = await fetch(`${API_SOCIAL_URL}/chat/${friendId}/history/?limit=50`, {
                headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
            });
            if (res.ok) {
                const msgs = await res.json();
                this.chatHistory[friendId] = msgs.reverse(); // Serveur envoie souvent du plus récent au plus vieux
            }
        } catch(e) { console.error(e); }
    },

    // --- Blocked Users ---
    async fetchBlockedUsers() {
        const mainStore = useMainStore();
        try {
            const res = await fetch(`${API_SOCIAL_URL}/friends/blocked/`, {
                headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                this.blockedUsers = data.map((item: any) => ({
                    id: item.friend.id,
                    pseudo: item.friend.pseudo,
                    friendship_id: item.id
                }));
            }
        } catch (e) { console.error('Failed to fetch blocked users', e); }
    },

    async removeFriend(friendshipId: number) {
        const mainStore = useMainStore();
        try {
            const res = await fetch(`${API_SOCIAL_URL}/friends/${friendshipId}/remove/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
            });
            if (res.ok) {
                // Remove from local list
                this.friends = this.friends.filter(f => f.id !== friendshipId);
                await this.fetchFriends(); // Refresh to be sure
            }
        } catch (e) { console.error('Failed to remove friend', e); }
    },

    async blockUser(userId: number) {
        const mainStore = useMainStore();
        try {
            const res = await fetch(`${API_SOCIAL_URL}/friends/block/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${mainStore.tokens?.access}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) {
                // Remove from friends, add to blocked
                this.friends = this.friends.filter(f => f.id !== userId);
                await this.fetchBlockedUsers();
            }
        } catch (e) { console.error('Failed to block user', e); }
    },

    async unblockUser(friendshipId: number) {
        const mainStore = useMainStore();
        try {
            const res = await fetch(`${API_SOCIAL_URL}/friends/${friendshipId}/unblock/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
            });
            if (res.ok) {
                this.blockedUsers = this.blockedUsers.filter(b => b.friendship_id !== friendshipId);
            }
        } catch (e) { console.error('Failed to unblock user', e); }
    },

    // --- Chat Read Status ---
    async markAsRead(friendId: number) {
        const mainStore = useMainStore();
        try {
            await fetch(`${API_SOCIAL_URL}/chat/${friendId}/mark_read/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
            });
            // Reset local unread count
            const friend = this.friends.find(f => f.id === friendId);
            if (friend) friend.unread_count = 0;
        } catch (e) { console.error('Failed to mark as read', e); }
    },

    async fetchUnreadCounts() {
        const mainStore = useMainStore();
        try {
            const res = await fetch(`${API_SOCIAL_URL}/chat/unread/`, {
                headers: { 'Authorization': `Bearer ${mainStore.tokens?.access}` }
            });
            if (res.ok) {
                const data = await res.json();
                // data: { total_unread: N, by_sender: [{ sender_id, sender__pseudo, count }] }
                data.by_sender.forEach((item: any) => {
                    const friend = this.friends.find(f => f.id === item.sender_id);
                    if (friend) friend.unread_count = item.count;
                });
            }
        } catch (e) { console.error('Failed to fetch unread counts', e); }
    },

    // --- WebSocket Events Handlers ---
    
    handleWsConnect() {
        this.isConnected = true;
    },
    
    handleWsDisconnect() {
        this.isConnected = false;
    },

    handlePresenceUpdate(payload: any) {
        // payload: { user_id: 5, status: 'IN_GAME', game_title: 'Minecraft' }
        const friend = this.friends.find(f => f.id === payload.user_id);
        if (friend) {
            friend.status = payload.status;
            friend.game_title = payload.game_title;
        }
    },

    handleChatMessage(payload: any) {
        // payload: { sender_id: 12, content: 'Salut', timestamp: ... }
        const friendId = payload.sender_id;
        
        // Init buffer
        if (!this.chatHistory[friendId]) this.chatHistory[friendId] = [];

        this.chatHistory[friendId].push({
            sender_id: friendId,
            content: payload.content,
            timestamp: payload.timestamp,
            is_me: false
        });

        // Increment unread if chat not open
        if (this.activeChatId !== friendId) {
            const friend = this.friends.find(f => f.id === friendId);
            if (friend) friend.unread_count = (friend.unread_count || 0) + 1;
            
            // TODO: Play sound?
        }
    },

    handleFriendRequest(payload: any) {
        // payload: { from: { id, pseudo... } }
        // Add to requests list if not exists
       // Note: payload might need mapping to match FriendRequest interface format
       // Assuming the WS payload roughly matches or we re-fetch
       this.fetchRequests(); // Safer to just refetch
    },

    handleMessageSent(payload: any) {
        // payload: { content: "...", temp_id: "..." }
        // For now, we trust the optimistic update. 
        // We could use this to mark the message as "sent" (check mark).

    },

    // --- Client Actions ---
    sendMessage(content: string) {
        if (!this.activeChatId) return;
        const mainStore = useMainStore();
        const myId = mainStore.user?.id; // Assuming user.id is number, need to check store types

        // Send via WS
        WebSocketService.getInstance().send({
            type: 'SEND_MESSAGE',
            to: this.activeChatId,
            content: content
        });

        // Optimistic append
        if (!this.chatHistory[this.activeChatId]) this.chatHistory[this.activeChatId] = [];
        this.chatHistory[this.activeChatId].push({
            sender_id: myId || 0,
            content: content,
            timestamp: new Date().toISOString(),
            is_me: true
        });
    },

    openChat(friendId: number) {
        this.activeChatId = friendId;
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) friend.unread_count = 0;
        this.fetchChatHistory(friendId);
        this.markAsRead(friendId); // Sync with server
    },

    togglePanel() {
        const notificationStore = useNotificationStore();
        if (!this.isPanelOpen) {
            notificationStore.closePanel();
        }
        this.isPanelOpen = !this.isPanelOpen;
    },

    closePanel() {
        this.isPanelOpen = false;
    }
  }
});
