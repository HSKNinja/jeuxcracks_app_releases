import { useMainStore } from '../store';
import { API_CONFIG, DjangoResponse } from '../config/api';

// Queue to hold requests while token is refreshing
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void; }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export interface Fetch extends DjangoResponse {
  page?: number;
  totalPages?: number;
  totalResults?: number;
  limit?: number;
}

export function useFetch(url: string, method?: string, body?: any, customHeaders?: Record<string, string>): Promise<any> {
    const store = useMainStore();
    const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS, ...customHeaders };

    // Attach Token
    const tokens = store.getTokens;
    if (tokens?.access) {
        // Simple check for auth endpoints vs public ones if needed
        headers.Authorization = `Bearer ${tokens.access}`;
    }
    
    // Upload Special Case
    if (body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const doRequest = async (token?: string): Promise<any> => {
        if (token) {
             headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
                method: method || 'GET',
                body: body instanceof FormData ? body : JSON.stringify(body),
                headers,
            });

            if (response.ok) {
                const text = await response.text();
                // Handle 204 No Content
                if (!text) return {}; 
                const result = JSON.parse(text);
                
                // --- Formatting Hack for Compatibility ---
                if (result.games && !result.results) {
                    result.results = result.games.map((game: any) => ({
                        id: game.id,
                        steam_id: game.steam_id,
                        title: game.informations?.title || '',
                        descriptionShort: game.descriptions?.short_description || '',
                        header: game.urls?.header_image || '',
                        video: game.urls?.trailer || '',
                        categories: game.categories || [],
                        views: game.views || 0,
                        like: game.status?.like || 0,
                        favorite: game.status?.favorite || 0,
                        isOnline: game.status?.is_online || false,
                        releaseDate: game.status?.release_date || '',
                        publishedDate: game.status?.published_date || '',
                        lastModified: game.status?.last_modified || '',
                        download: { torrent: game.urls?.torrent || null, direct: game.urls?.direct || null },
                        requirements: game.requirements || {},
                        monetization: game.monetization || {},
                        source: game.source || ''
                    }));
                }
                if (result.pagination) {
                    result.page = result.pagination.current_page;
                    result.totalPages = result.pagination.total_pages;
                    result.totalResults = result.pagination.total_results;
                }
                // ------------------------------------------

                return result;
            }

            // --- Error Handling ---
            
            // 401 Unauthorized -> Refresh Token Flow
            if (response.status === 401) {
                // If it was already a refresh attempt or we have no refresh token, fail.
                if (url.includes(API_CONFIG.ENDPOINTS.AUTH.REFRESH) || !tokens?.refresh) {
                    store.logout();
                    throw { status: 401, message: 'Session expirée' };
                }

                if (isRefreshing) {
                    // Queue this request
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((newToken) => {
                         return doRequest(newToken as string);
                    });
                }

                isRefreshing = true;

                try {
                    console.log('🔄 Rafraîchissement du token...');
                    const refreshResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh: tokens.refresh }),
                    });

                    if (refreshResponse.ok) {
                        const newTokens = await refreshResponse.json();
                        store.setTokens(newTokens);
                        console.log('✅ Token rafraîchi.');
                        processQueue(null, newTokens.access);
                        isRefreshing = false;
                        return doRequest(newTokens.access);
                    } else {
                        throw new Error('Refresh failed');
                    }
                } catch (refreshErr) {
                    isRefreshing = false;
                    store.logout();
                    processQueue(refreshErr, null);
                    throw refreshErr;
                }
            }

            // Other Errors
            const errData = await response.json().catch(() => ({}));
            const errorObj: any = new Error(`HTTP ${response.status}`);
            errorObj.data = errData;
            errorObj.status = response.status;
            errorObj.detail = errData.detail || errData.message || JSON.stringify(errData);
            throw errorObj;

        } catch (error: any) {
            throw error;
        }
    };

    return doRequest();
}
