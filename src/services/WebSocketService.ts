import { useSocialStore } from '@/store/social';
import { useMainStore } from '@/store/index';

const WS_URL = 'wss://api.jeuxcracks.fr/ws/gateway/';

export class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private token: string | null = null;
    private isUserInitiatedDisconnect = false;

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    connect(token?: string | null) {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
        
        // Use provided token OR fetch from store
        if (!token) {
            const mainStore = useMainStore();
            token = mainStore.tokens?.access;
        }

        if (!token) {
            console.warn('⚠️ Cannot connect to WS: No token available');
            return;
        }
        
        this.token = token;
        this.isUserInitiatedDisconnect = false;
        
        console.log('🔌 Connecting to WebSocket Gateway...');
        const fullUrl = `${WS_URL}?token=${token}`;
        console.log('🔗 WS URL:', fullUrl.replace(token, 'REDACTED_TOKEN'));
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
            console.log('✅ WebSocket Connected');
            const socialStore = useSocialStore();
            socialStore.handleWsConnect();
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                this.handleEvent(payload);
            } catch (e) { console.error('WS JSON parse error:', e); }
        };

        this.ws.onclose = () => {
            console.log('🔌 WebSocket Disconnected');
            useSocialStore().handleWsDisconnect();
            this.stopHeartbeat();
            
            if (!this.isUserInitiatedDisconnect) {
                // Auto reconnect in 5s with FRESH token from store
                if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = setTimeout(() => {
                    console.log('🔄 Reconnecting WS with fresh token...');
                    this.connect(); // No arg = fetch from store
                }, 5000);
            }
        };

        this.ws.onerror = (e) => {
            // console.error('WebSocket Error:', e);
        };
    }

    disconnect() {
        this.isUserInitiatedDisconnect = true;
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send:', data);
        }
    }

    private handleEvent(payload: any) {
        const store = useSocialStore();
        
        switch (payload.type) {
            case 'FRIEND_REQUEST':
                store.handleFriendRequest(payload);
                break;
            case 'PRESENCE_UPDATE':
                store.handlePresenceUpdate(payload);
                break;
            case 'CHAT_MESSAGE':
                store.handleChatMessage(payload);
                break;
            case 'MESSAGE_SENT':
                store.handleMessageSent(payload);
                break;
            default: 
                // console.log('Unknown WS event:', payload);
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        // Send heartbeat immediately then every 30s
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
    }

    private sendHeartbeat() {
        this.send({
            type: 'HEARTBEAT',
            status: 'ONLINE' // Could be dynamic if we track focus or game state
        });
    }
}
