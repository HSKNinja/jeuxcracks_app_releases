// Configuration de l'API Django JeuxCracks
export const API_CONFIG = {
  // URL de base directe
  BASE_URL: 'https://api.jeuxcracks.fr',
  
  // Endpoints Django
  ENDPOINTS: {
    // Authentification Django REST Framework
    AUTH: {
      LOGIN: '/auth/api/login/',
      REGISTER: '/auth/api/create_user/',
      TOKEN: '/auth/api/token/',
      REFRESH: '/auth/api/token/refresh/',
      VERIFY: '/auth/api/token/verify/',
      USER_ME: '/auth/api/user/me',
      USER_FAV: '/auth/api/user/me/fav',
      USER_PICTURE: '/auth/api/user/me/picture',
      USER_SUGGESTIONS: '/auth/api/user/me/sug',
      USER_CHANGE: '/auth/api/user/me/change',
      USER_DELETE: '/auth/api/user/me/delete',
    },
    
    // Jeux (Cracks)
    GAMES: {
      LIST: '/Cracks/api/liste_jeux/',
      DETAIL: '/Cracks/api/game/',
      TOGGLE_FAVORITE: '/Cracks/api/toggle_favorite/',
      TOGGLE_LIKE: '/Cracks/api/toggle_like/',
      REPORT: '/Cracks/api/report/',
      VIEWS: '/Cracks/api/views/',
    },
    
    // MultiLinks
    MULTILINKS: {
      LIST: '/api/liste_multilinks/',
      CREATE: '/api/multilinks/create/',
      DETAIL: '/api/multilinks/',
    }
  },
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Codes de statut Django
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
  }
};

// Types pour les réponses Django
export interface DjangoResponse<T = any> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  code?: number;
  message?: string;
}

// Types pour l'authentification Django
export interface DjangoAuthTokens {
  access: string;
  refresh: string;
}

export interface DjangoUser {
  id: number;
  email: string;
  pseudo?: string;
  name?: string;
  // Ajoutez d'autres champs selon votre modèle Django
} 