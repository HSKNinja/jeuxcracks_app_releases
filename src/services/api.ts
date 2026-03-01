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
    const user = await this.getUserProfile(tokens.access);
    
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
  static async getUserProfile(token?: string): Promise<DjangoUser> {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_ME, 'GET', null, headers);
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

  // ===== SUBSCRIPTIONS & DONATIONS =====

  /** Lister les plans disponibles (public) */
  static async getPlans(): Promise<any[]> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.PLANS);
  }

  /** Créer une session Stripe Checkout pour un abonnement */
  static async checkout(priceId: string): Promise<{ checkout_url: string; session_id: string }> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CHECKOUT, 'POST', { price_id: priceId });
  }

  /** État de l'abonnement de l'utilisateur */
  static async getSubscriptionStatus(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.STATUS);
  }

  /** Annuler l'abonnement */
  static async cancelSubscription(immediately = false): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CANCEL, 'POST', { immediately });
  }

  /** Réactiver un abonnement marqué pour annulation */
  static async reactivateSubscription(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.REACTIVATE, 'POST');
  }

  /** Upgrade de plan (proratisé) */
  static async upgradeSubscription(priceId: string): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.UPGRADE, 'POST', { price_id: priceId });
  }

  /** Downgrade de plan (fin de période) */
  static async downgradeSubscription(priceId: string): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.DOWNGRADE, 'POST', { price_id: priceId });
  }

  /** Changer la période de facturation (mensuel ↔ annuel) */
  static async changeBilling(priceId: string): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CHANGE_BILLING, 'POST', { price_id: priceId });
  }

  /** Historique des factures */
  static async getInvoices(): Promise<any[]> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.INVOICES);
  }

  /** Faire un don libre (montant en centimes, min 100 = 1€) */
  static async donate(amount: number, message?: string): Promise<{ checkout_url: string; session_id: string }> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.DONATE, 'POST', { amount, message });
  }

  /** Historique des dons */
  static async getDonations(): Promise<any[]> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.DONATIONS);
  }

  /** Revenus du mois (public) */
  static async getMonthlyRevenue(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.REVENUE_MONTHLY);
  }

  // ==================== BOUTIQUE (SHOP) ====================

  /** Liste des items de la boutique */
  static async getShopItems(): Promise<any[]> {
    return useFetch(API_CONFIG.ENDPOINTS.SHOP.ITEMS);
  }

  /** Inventaire de l'utilisateur */
  static async getInventory(): Promise<any[]> {
    return useFetch(API_CONFIG.ENDPOINTS.SHOP.INVENTORY);
  }

  /** Équipement actuel */
  static async getEquipment(): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SHOP.EQUIPMENT);
  }

  /** Équiper un item possédé */
  static async shopEquipItem(slug: string): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SHOP.EQUIP, 'POST', { slug });
  }

  /** Retirer un item */
  static async shopUnequipItem(type: string): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SHOP.UNEQUIP, 'POST', { type });
  }

  /** Acheter un item (crée une session Stripe Checkout) */
  static async shopBuyItem(slug: string): Promise<{ checkout_url: string; session_id: string }> {
    return useFetch(API_CONFIG.ENDPOINTS.SHOP.CHECKOUT, 'POST', { slug });
  }

  // ==================== SUPPORT (TICKETS) ====================

  /** Lister mes tickets */
  static async getTickets(status?: string, q?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const qs = params.toString();
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.TICKETS}${qs ? '?' + qs : ''}`);
  }

  /** Créer un ticket */
  static async createTicket(data: { subject: string; category: string; priority: string; description: string }): Promise<any> {
    return useFetch(API_CONFIG.ENDPOINTS.SUPPORT.CREATE, 'POST', data);
  }

  /** Détail d'un ticket avec messages */
  static async getTicketDetail(id: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.TICKETS}${id}/`);
  }

  /** Répondre à un ticket (user) */
  static async replyTicket(id: number, content: string): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.TICKETS}${id}/reply/`, 'POST', { content });
  }

  /** Fermer un ticket */
  static async closeTicket(id: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.TICKETS}${id}/close/`, 'POST');
  }

  /** Rouvrir un ticket */
  static async reopenTicket(id: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.TICKETS}${id}/reopen/`, 'POST');
  }

  // ==================== SUPPORT STAFF ====================

  /** [Staff] Lister tous les tickets */
  static async getStaffTickets(filters?: { status?: string; category?: string; priority?: string; q?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.q) params.set('q', filters.q);
    const qs = params.toString();
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.STAFF_TICKETS}${qs ? '?' + qs : ''}`);
  }

  /** [Staff] Détail d'un ticket */
  static async getStaffTicketDetail(id: number): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.STAFF_TICKETS}${id}/`);
  }

  /** [Staff] Répondre en tant que staff (is_staff=true) */
  static async staffReply(id: number, content: string): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.STAFF_TICKETS}${id}/reply/`, 'POST', { content });
  }

  /** [Staff] Changer le statut d'un ticket */
  static async staffChangeStatus(id: number, status: string): Promise<any> {
    return useFetch(`${API_CONFIG.ENDPOINTS.SUPPORT.STAFF_TICKETS}${id}/status/`, 'POST', { status });
  }
} 