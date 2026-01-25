import { ref } from 'vue';
import { useMainStore } from '../store';
import { API_CONFIG, DjangoResponse, DjangoAuthTokens } from '../config/api';

export interface Fetch extends DjangoResponse {
  page?: number;
  totalPages?: number;
  totalResults?: number;
  limit?: number;
}

export function useFetch(url: string, method?: string, body?: any, customHeaders?: Record<string, string>): Promise<any> {
  const store = useMainStore();
  const baseUrl = API_CONFIG.BASE_URL;
  let tokens = store.getTokens;

  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
    
    // Ajouter les headers personnalisés si fournis
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }
    
    // Ajouter le header Authorization pour les requêtes authentifiées
    if (tokens && tokens.access) {
      // Endpoints qui nécessitent une authentification
      const protectedEndpoints = [
        '/auth/',
        '/user/',
        '/Cracks/api/toggle_favorite/',
        '/Cracks/api/toggle_like/',
        '/Cracks/api/report/',
        '/Cracks/api/views/'
      ];
      
      const needsAuth = protectedEndpoints.some(endpoint => url.includes(endpoint));
      
      if (needsAuth) {
        headers.Authorization = `Bearer ${tokens.access}`;
        console.log('🔐 Token envoyé pour:', url, 'Token:', tokens.access.substring(0, 20) + '...');
      }
    }

    // Pour les FormData, ne pas définir Content-Type (laissé au navigateur)
    if (body instanceof FormData) {
      delete headers['Content-Type'];
    }

    fetch(`${baseUrl}${url}`, {
      method: method || 'GET',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            // Si 401 et pas de tokens, c'est normal (utilisateur non connecté)
            if (!tokens) {
              return res.json().then(result => resolve(result));
            }
            // Si 401 avec tokens, essayer de rafraîchir
            console.log('🔄 Token expiré, tentative de rafraîchissement...');
            return handleTokenRefresh(url, method, body, customHeaders, resolve, reject);
          }
          
          // Try to parse error body
          return res.json().then(errData => {
              const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
              // Attach details if available
              (error as any).detail = errData.detail || errData.message || JSON.stringify(errData);
              (error as any).data = errData;
              reject(error);
          }).catch(() => {
              // If body is not JSON
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((result) => {
        // Adapter la structure de l'API Django
        if (result.games && !result.results) {
          // Transformer les données pour correspondre à la structure attendue
          result.results = result.games.map((game: any) => ({
            id: game.id,
            steam_id: game.steam_id,
            title: game.informations?.title || '',
            descriptionShort: game.descriptions?.short_description || '',
            description: game.descriptions?.full_description || '',
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
            download: {
              torrent: game.urls?.torrent || null,
              direct: game.urls?.direct || null
            },
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
        
          resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function handleTokenRefresh(
  url: string, 
  method: string | undefined, 
  body: any, 
  customHeaders: Record<string, string> | undefined,
  resolve: (value: any) => void,
  reject: (reason?: any) => void
) {
  const store = useMainStore();
  const tokens = store.getTokens;
  
  if (!tokens || !tokens.refresh) {
    console.log('❌ Pas de refresh token, déconnexion...');
    store.logout();
    reject(new Error('Token expiré et pas de refresh token'));
    return;
  }

  try {
    console.log('🔄 Rafraîchissement du token...');
    const newTokens = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify({
        refresh: tokens.refresh,
      }),
    }).then(res => res.json());

    if (newTokens.access) {
      console.log('✅ Token rafraîchi avec succès');
      store.setTokens(newTokens);
      
      // Réessayer la requête originale avec le nouveau token
      const result = await useFetch(url, method, body, customHeaders);
      resolve(result);
    } else {
      console.log('❌ Échec du rafraîchissement, déconnexion...');
      store.logout();
      reject(new Error('Impossible de rafraîchir le token'));
    }
  } catch (error) {
    console.log('❌ Erreur lors du rafraîchissement:', error);
    store.logout();
    reject(error);
  }
}
