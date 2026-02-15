import { defineStore } from 'pinia';
import { useMainStore } from './index';
import { useSocialStore } from './social';

const API_BASE_URL = 'https://api.jeuxcracks.fr';
const API_INBOX_URL = `${API_BASE_URL}/api/social/inbox`;

export interface Notification {
  id: number;
  title: string;
  message: string;
  link?: string;
  type: 'UPDATE' | 'PROMO' | 'SYSTEM' | 'SOCIAL';
  is_read: boolean;
  created_at: string;
}

const LOCAL_NOTIFS_KEY = 'jeuxcracks_local_notifications';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    localNotifications: [] as Notification[], // Local notifications stored separately
    unreadCount: 0,
    isPanelOpen: false,
    isLoading: false,
  }),

  getters: {
    // Combine server and local notifications for display
    allNotifications: (state) => [...state.localNotifications, ...state.notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    unreadNotifications(): Notification[] { return this.allNotifications.filter((n: Notification) => !n.is_read); },
    readNotifications(): Notification[] { return this.allNotifications.filter((n: Notification) => n.is_read); },
  },

  actions: {
    async initialize() {
      this.loadLocalNotifications(); // Load local notifications first
      await this.fetchUnread();
    },

    // Load local notifications from localStorage
    loadLocalNotifications() {
      try {
        const stored = localStorage.getItem(LOCAL_NOTIFS_KEY);
        if (stored) {
          this.localNotifications = JSON.parse(stored);
        }
      } catch (e) { console.error('Failed to load local notifications', e); }
    },

    // Save local notifications to localStorage
    saveLocalNotifications() {
      try {
        localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(this.localNotifications));
      } catch (e) { console.error('Failed to save local notifications', e); }
    },

    async fetchUnread() {
      const mainStore = useMainStore();
      if (!mainStore.tokens?.access) return;

      try {
        const res = await fetch(`${API_INBOX_URL}/unread/`, {
          headers: { 'Authorization': `Bearer ${mainStore.tokens.access}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.unreadCount = data.count;
          // Merge with existing, prioritizing unread
          const existingIds = new Set(this.notifications.map(n => n.id));
          const newNotifs = data.notifications.filter((n: Notification) => !existingIds.has(n.id));
          this.notifications = [...newNotifs, ...this.notifications];
        }
      } catch (e) { console.error('Failed to fetch unread notifications', e); }
    },

    async fetchAll() {
      const mainStore = useMainStore();
      if (!mainStore.tokens?.access) return;

      this.isLoading = true;
      try {
        const res = await fetch(`${API_INBOX_URL}/all/`, {
          headers: { 'Authorization': `Bearer ${mainStore.tokens.access}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.notifications = data.notifications || data;
          this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        }
      } catch (e) { console.error('Failed to fetch all notifications', e); }
      finally { this.isLoading = false; }
    },

    async markAsRead(notificationIds?: number[]) {
      const mainStore = useMainStore();
      if (!mainStore.tokens?.access) return;

      try {
        const res = await fetch(`${API_INBOX_URL}/mark-read/`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${mainStore.tokens.access}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notification_ids: notificationIds || [] })
        });
        if (res.ok) {
          // Update local state
          if (notificationIds && notificationIds.length > 0) {
            notificationIds.forEach(id => {
              const notif = this.notifications.find(n => n.id === id);
              if (notif) notif.is_read = true;
            });
          } else {
            // Mark all as read
            this.notifications.forEach(n => n.is_read = true);
          }
          this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        }
      } catch (e) { console.error('Failed to mark notifications as read', e); }
    },

    async deleteNotification(id: number) {
      const mainStore = useMainStore();
      if (!mainStore.tokens?.access) return;

      try {
        const res = await fetch(`${API_INBOX_URL}/${id}/delete/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${mainStore.tokens.access}` }
        });
        if (res.ok) {
          const wasUnread = this.notifications.find(n => n.id === id)?.is_read === false;
          this.notifications = this.notifications.filter(n => n.id !== id);
          if (wasUnread) this.unreadCount--;
        }
      } catch (e) { console.error('Failed to delete notification', e); }
    },

    togglePanel() {
      const socialStore = useSocialStore();
      if (!this.isPanelOpen) {
        socialStore.closePanel();
      }
      this.isPanelOpen = !this.isPanelOpen;
      if (this.isPanelOpen) {
        this.fetchAll(); // Load all when opening panel
      }
    },

    closePanel() {
      this.isPanelOpen = false;
    },

    // Add a local notification (persisted to localStorage)
    addLocalNotification(data: { title: string; message: string; type: 'UPDATE' | 'PROMO' | 'SYSTEM' | 'SOCIAL'; link?: string }) {
      const localNotif: Notification = {
        id: -Date.now(), // Negative ID to differentiate from server notifications
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        is_read: false,
        created_at: new Date().toISOString()
      };
      this.localNotifications.unshift(localNotif);
      this.saveLocalNotifications();
      // Recalculate unread count (includes both local and server notifs)
      this.unreadCount = this.allNotifications.filter(n => !n.is_read).length;
    },

    // Handle notification link navigation
    handleNotificationClick(notification: Notification) {
      if (!notification.is_read) {
        // Only call API for server notifications (positive IDs)
        if (notification.id > 0) {
          this.markAsRead([notification.id]);
        } else {
          // Mark local notification as read and persist
          const localNotif = this.localNotifications.find(n => n.id === notification.id);
          if (localNotif) {
            localNotif.is_read = true;
            this.saveLocalNotifications();
          }
          this.unreadCount = Math.max(0, this.allNotifications.filter(n => !n.is_read).length);
        }
      }
      
      // Handle different link types
      if (notification.link) {
        if (notification.link.startsWith('game://')) {
          const gameId = notification.link.replace('game://', '');
          window.location.href = `/catalogue/game/${gameId}`;
        } else if (notification.link.startsWith('http')) {
          window.open(notification.link, '_blank');
        } else {
          window.location.href = notification.link;
        }
      }
      
      this.closePanel();
    }
  }
});
