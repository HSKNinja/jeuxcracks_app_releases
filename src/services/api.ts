import { useFetch } from '../utils/useFetch';
import { API_CONFIG, DjangoResponse, DjangoAuthTokens, DjangoUser } from '../config/api';

// Service API pour Django JeuxCracks
export class JeuxCracksAPI {
  
  // ===== AUTHENTIFICATION =====
  
  /**
   * Connexion utilisateur avec tokens JWT
   */
  static async login(email: string, password: string): Promise<{ user: DjangoUser; tokens: DjangoAuthTokens }> {
    // D'abord obtenir les tokens
    const tokens = await useFetch(API_CONFIG.ENDPOINTS.AUTH.TOKEN, 'POST', { email, password });
    
    // Ensuite obtenir les infos utilisateur
    const user = await this.getUserProfile();
    
    return { user, tokens };
  }
  
  /**
   * Inscription utilisateur
   */
  static async register(email: string, password: string, pseudo: string): Promise<{ user: DjangoUser; tokens: DjangoAuthTokens }> {
    // Créer l'utilisateur
    const userData = await useFetch(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', { 
      email, 
      password, 
      pseudo 
    });
    
    // Se connecter automatiquement après inscription
    return this.login(email, password);
  }
  
  /**
   * Obtenir les tokens JWT
   */
  static async getTokens(email: string, password: string): Promise<DjangoAuthTokens> {
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.TOKEN, 'POST', { email, password });
  }
  
  /**
   * Rafraîchir un token
   */
  static async refreshToken(refreshToken: string): Promise<DjangoAuthTokens> {
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.REFRESH, 'POST', { refresh: refreshToken });
  }
  
  /**
   * Vérifier un token
   */
  static async verifyToken(token: string): Promise<boolean> {
    const result = await useFetch(API_CONFIG.ENDPOINTS.AUTH.VERIFY, 'POST', { token });
    return result.code !== API_CONFIG.STATUS_CODES.UNAUTHORIZED;
  }
  
  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  static async getUserProfile(): Promise<DjangoUser> {
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_ME);
  }
  
  /**
   * Obtenir les favoris de l'utilisateur
   */
  static async getUserFavorites(): Promise<{ favorite_game_ids: number[] }> {
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_FAV);
  }
  
  /**
   * Modifier le profil utilisateur
   */
  static async updateUserProfile(data: Partial<DjangoUser>): Promise<DjangoUser> {
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_CHANGE, 'PUT', data);
  }
  
  /**
   * Supprimer le compte utilisateur
   */
  static async deleteUserAccount(): Promise<void> {
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_DELETE, 'DELETE');
  }
  
  /**
   * Uploader une photo de profil
   */
  static async uploadProfilePicture(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('picture', file);
    
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_PICTURE, 'POST', formData, {
      'Content-Type': 'multipart/form-data'
    });
  }
  
  // ===== JEUX (CRACKS) =====
  
  /**
   * Obtenir la liste des jeux avec filtres
   */
  static async getGames(params: {
    page?: number;
    limit?: number;
    title?: string;
    category?: string;
    views?: boolean;
    online?: boolean;
  } = {}): Promise<DjangoResponse> {
    const queryParams = new URLSearchParams();
    
    // Ajouter format=json et app=true par défaut
    queryParams.append('format', 'json');
    queryParams.append('app', 'true');
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.title) queryParams.append('title', params.title);
    if (params.category) queryParams.append('category', params.category);
    if (params.views !== undefined) queryParams.append('views', params.views.toString());
    if (params.online !== undefined) queryParams.append('online', params.online.toString());
    
    const queryString = queryParams.toString();
    const url = `${API_CONFIG.ENDPOINTS.GAMES.LIST}?${queryString}`;
    
    return useFetch(url);
  }
  
  /**
   * Obtenir les détails d'un jeu
   */
  static async getGame(id: string | number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.DETAIL}${id}/`);
  }
  
  /**
   * Ajouter un jeu aux favoris
   */
  static async addFavorite(gameId: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.FAVORITE}${gameId}/favorite/`, 'POST');
  }
  
  /**
   * Retirer un jeu des favoris
   */
  static async removeFavorite(gameId: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.UNFAVORITE}${gameId}/unfavorite/`, 'POST');
  }
  
  /**
   * Liker un jeu
   */
  static async likeGame(gameId: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.LIKE}${gameId}/like/`, 'POST');
  }
  
  /**
   * Unliker un jeu
   */
  static async unlikeGame(gameId: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.UNLIKE}${gameId}/unlike/`, 'POST');
  }
  
  /**
   * Incrémenter les vues d'un jeu
   */
  static async incrementViews(gameId: string | number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.VIEW}${gameId}/view/`, 'POST');
  }
  
  /**
   * Obtenir les jeux favoris
   */
  static async getFavorites(): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.FAVORITE}favorites/`);
  }

  /**
   * Obtenir les jeux likés
   */
  static async getLikedGames(): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.LIKE}liked/`);
  }

  /**
   * Obtenir les liens de téléchargement
   */
  static async getDownloadLinks(gameId: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.GAMES.DOWNLOAD}${gameId}/download/`);
  }
  
  /**
   * Obtenir les jeux populaires
   */
  static async getPopularGames(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.GAMES.POPULAR);
  }
  
  /**
   * Obtenir les jeux récents
   */
  static async getRecentGames(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.GAMES.RECENT);
  }
  
  /**
   * Obtenir les catégories
   */
  static async getCategories(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.GAMES.CATEGORIES);
  }
  
  // ===== MULTILINKS =====
  
  /**
   * Obtenir la liste des MultiLinks
   */
  static async getMultiLinks(): Promise<any[]> {
    return useFetch(API_CONFIG.ENDPOINTS.MULTILINKS.LIST);
  }
  
  /**
   * Créer un nouveau MultiLink
   */
  static async createMultiLink(data: any): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.MULTILINKS.CREATE, 'POST', data);
  }
  
  /**
   * Obtenir les détails d'un MultiLink
   */
  static async getMultiLink(slug: string): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.MULTILINKS.DETAIL}${slug}/`);
  }
} 