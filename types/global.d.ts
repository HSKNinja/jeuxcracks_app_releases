// Types globaux pour l'application JeuxCracks

// Interface utilisateur
interface User {
  id: number;
  email: string;
  pseudo: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  temporary_group_name?: string;
  profile_picture?: string;
}

// Interface pour les tokens JWT
interface AuthTokens {
  access: string;
  refresh: string;
}

// Interface pour les jeux
  interface Game {
    id: string;
  steam_id?: string;
    title: string;
  descriptionShort?: string;
  description?: string;
    header?: string;
    video?: string;
  categories?: string[];
  views?: number;
  like?: number;
  favorite?: number;
  isOnline?: boolean;
  releaseDate?: string;
  publishedDate?: string;
  lastModified?: string;
  download?: {
    torrent?: string | null;
    direct?: string | null;
    };
  requirements?: {
    minimum?: any;
    recommended?: any;
  };
  monetization?: any;
  source?: any[] | string;
  informations?: {
    credit?: string;
    [key: string]: any;
  };
}

// Interface pour les jeux installés
  interface GameInstalled {
    id: string;
    title: string;
    path: string;
    executable?: string;
  }

// Interface pour les favoris
interface Favorite {
  id: string;
  title: string;
  descriptionShort?: string;
  header?: string;
}

// Interface pour les réponses API
interface ApiResponse<T = any> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  code?: number;
  message?: string;
  games?: T[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_results: number;
  };
}

// Interface pour les paramètres de recherche
interface SearchParams {
  page?: number;
  limit?: number;
  title?: string;
  category?: string;
  views?: boolean;
  online?: boolean;
}

// Interface pour les formulaires
interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  password: string;
  pseudo: string;
}

interface ProfileForm {
  pseudo?: string;
  email?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EditorInterface {
  verifyStructure(path: string): boolean;
  installGame(path: string, gameData: Game): Promise<void>;
}
