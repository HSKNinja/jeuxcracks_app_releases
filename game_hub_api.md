# Game Hub API — Documentation complète

> **Base URL** : `https://api.jeuxcracks.fr/api/engine/`  
> **Auth** : JWT Bearer Token (`Authorization: Bearer <token>`)  
> **Format** : JSON

---

## Table des matières

| # | Endpoint | Méthode | Auth | Description |
|---|----------|---------|------|-------------|
| 1 | `/health/` | GET | ❌ | Health check (Django + Engine) |
| 2 | `/stats/` | GET | ❌ | Statistiques globales |
| 3 | `/games/` | GET | ❌ | Liste paginée des jeux |
| 4 | `/games/<slug>/` | GET | ❌ | Détail complet d'un jeu (auto-vue) |
| 5 | `/games/<slug>/versions/` | GET | ❌ | Toutes les versions d'un jeu |
| 6 | `/games/<slug>/download/` | GET | ✅ | Dernière version + liens |
| 7 | `/games/<slug>/like/` | POST | ✅ | Liker un jeu |
| 8 | `/games/<slug>/unlike/` | POST | ✅ | Retirer le like |
| 9 | `/games/<slug>/favorite/` | POST | ✅ | Ajouter aux favoris |
| 10 | `/games/<slug>/unfavorite/` | POST | ✅ | Retirer des favoris |
| 11 | `/games/<slug>/view/` | POST | ❌ | Enregistrer une vue manuellement |
| 12 | `/games/<slug>/report/` | POST | ✅ | Signaler un jeu |
| 13 | `/games/liked/` | GET | ✅ | Jeux likés par l'utilisateur |
| 14 | `/games/favorites/` | GET | ✅ | Favoris de l'utilisateur |
| 15 | `/search/` | GET | ❌ | Recherche de jeux |
| 16 | `/reports/reasons/` | GET | ❌ | Raisons de signalement |

---

## 1. Health Check

```
GET /api/engine/health/
```

Vérifie que Django et le JC-Engine Rust sont en ligne.

**Réponse** `200 OK`
```json
{
  "django": "ok",
  "engine": {
    "status": "ok",
    "service": "jc-engine",
    "version": "0.1.0"
  }
}
```

Si le JC-Engine est down :
```json
{
  "django": "ok",
  "engine": "unreachable"
}
```

---

## 2. Statistiques globales

```
GET /api/engine/stats/
```

Retourne les stats du JC-Engine et les compteurs sociaux Django.

**Réponse** `200 OK`
```json
{
  "engine": {
    "total_games": 1744,
    "total_versions": 2144,
    "total_links": 2144,
    "enriched_games": 195,
    "sources": ["onlinefix"]
  },
  "social": {
    "total_likes": 42,
    "total_views": 1580,
    "total_reports": 3
  }
}
```

---

## 3. Liste des jeux

```
GET /api/engine/games/
GET /api/engine/games/?page=2&per_page=20
GET /api/engine/games/?sort=downloads_count
```

Liste paginée de tous les jeux (JC-Engine) enrichie avec les données sociales Django.

**Paramètres query**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | int | 1 | Numéro de page |
| `per_page` | int | 50 | Résultats par page (max: 200) |
| `sort` | string | *(aucun)* | Tri par popularité. Options: `views`, `likes`, `favorites_count`, `downloads_count` |

**Réponse** `200 OK`
```json
{
  "results": [
    {
      "id": 187,
      "slug": "satisfactory",
      "display_name": "Satisfactory",
      "steam_app_id": 526870,
      "latest_version": "Build 17072025",
      "version_count": 9,
      "total_size": "12.6 GB",
      "last_updated": "2026-03-03 05:31:23",
      "views": 15,
      "likes": 3,
      "downloads_count": 5,
      "favorites_count": 1,
      "is_liked": false,
      "is_favorited": false
    }
  ],
  "meta": {
    "total": 1744,
    "page": 1,
    "per_page": 50
  }
}
```

| Champ | Source | Description |
|-------|--------|-------------|
| `id` | Engine | ID interne JC-Engine |
| `slug` | Engine | Identifiant unique (peut contenir des espaces) |
| `display_name` | Engine | Nom d'affichage |
| `steam_app_id` | Engine | ID Steam (`null` si pas enrichi) |
| `latest_version` | Engine | Version la plus récente |
| `version_count` | Engine | Nombre de versions disponibles |
| `total_size` | Engine | Taille de la dernière version |
| `last_updated` | Engine | Date de dernière mise à jour |
| `views` | Django | Nombre de vues |
| `likes` | Django | Nombre de likes |
| `favorites_count` | Django | Nombre de favoris |
| `is_liked` | Django | `true` si l'utilisateur connecté a liké |
| `is_favorited` | Django | `true` si l'utilisateur connecté a mis en favori |

> **Note** : `is_liked` et `is_favorited` sont `false` pour les utilisateurs non authentifiés.

---

## 4. Détail d'un jeu

```
GET /api/engine/games/<slug>/
```

Retourne le détail complet : données JC-Engine (versions, liens, métadonnées Steam) + données sociales Django (likes, vues, favoris).

**Incrémente automatiquement les vues** (1 par user/IP par 24h).

**Exemple** : `GET /api/engine/games/satisfactory/`

**Réponse** `200 OK`
```json
{
  "id": 187,
  "slug": "satisfactory",
  "display_name": "Satisfactory",
  "steam_app_id": 526870,
  "versions": [
    {
      "id": 201,
      "version_raw": "Build 17072025",
      "file_size": "12.6 GB",
      "file_size_bytes": 13528018944,
      "upload_date": "2025-07-17",
      "is_latest": true,
      "source": "onlinefix",
      "download_links": [
        {
          "uri": "magnet:?xt=urn:btih:...",
          "link_type": "magnet"
        }
      ]
    }
  ],
  "metadata": {
    "steam_app_id": 526870,
    "description": "<p>Satisfactory is a first-person open-world...</p>",
    "short_description": "Satisfactory is a first-person...",
    "header_image": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/526870/header.jpg",
    "screenshots": [
      "https://shared.akamai.steamstatic.com/..."
    ],
    "trailers": [],
    "developers": ["Coffee Stain Studios"],
    "publishers": ["Coffee Stain Publishing"],
    "release_date": "10 Sep, 2024",
    "genres": ["Adventure", "Indie", "Simulation", "Strategy"],
    "tags": ["Multi-player", "Co-op", "Steam Cloud"]
  },
  "views": 16,
  "likes": 3,
  "favorites_count": 1,
  "downloads_count": 5,
  "is_liked": false,
  "is_favorited": false
}
```

**Erreur** `404 Not Found`
```json
{"error": "Game not found"}
```

> **Note** : `metadata` vaut `null` si le jeu n'a pas été enrichi via Steam.  
> **Note** : Les slugs peuvent contenir des espaces. Dans l'URL, utiliser `%20` : `/api/engine/games/core%20keeper/`

---

## 5. Toutes les versions d'un jeu

```
GET /api/engine/games/<slug>/versions/
```

Historique complet des versions triées par date (la plus récente en premier).

**Exemple** : `GET /api/engine/games/peak/versions/`

**Réponse** `200 OK`
```json
[
  {
    "id": 211,
    "version_raw": "1.33.a",
    "file_size": "1.4 GB",
    "file_size_bytes": 1503238553,
    "upload_date": "2025-10-07T15:06:02.000Z",
    "is_latest": true,
    "source": "onlinefix",
    "download_links": [
      {
        "uri": "magnet:?xt=urn:btih:3ca058d7...",
        "link_type": "magnet"
      }
    ]
  },
  {
    "id": 267,
    "version_raw": "1.27.a",
    "file_size": "1.5 GB",
    "file_size_bytes": 1610612736,
    "upload_date": "2025-08-28T11:49:33.000Z",
    "is_latest": false,
    "source": "onlinefix",
    "download_links": [...]
  }
]
```

---

## 6. Téléchargement (Auth obligatoire)

```
GET /api/engine/games/<slug>/download/
Authorization: Bearer <token>
```

Retourne la **dernière version** avec ses liens de téléchargement.  
Incrémente automatiquement le compteur de téléchargements.

**Réponse** `200 OK`
```json
{
  "id": 201,
  "version_raw": "Build 17072025",
  "file_size": "12.6 GB",
  "file_size_bytes": 13528018944,
  "upload_date": "2025-07-17",
  "is_latest": true,
  "source": "onlinefix",
  "download_links": [
    {
      "uri": "magnet:?xt=urn:btih:...",
      "link_type": "magnet"
    }
  ]
}
```

**Erreur** `401 Unauthorized`
```json
{"detail": "Authentication credentials were not provided."}
```

---

## 7. Liker un jeu

```
POST /api/engine/games/<slug>/like/
Authorization: Bearer <token>
```

**Réponse** `201 Created` (premier like)
```json
{"status": "liked"}
```

**Réponse** `200 OK` (déjà liké)
```json
{"status": "already liked"}
```

---

## 8. Retirer le like

```
POST /api/engine/games/<slug>/unlike/
Authorization: Bearer <token>
```

**Réponse** `200 OK`
```json
{"status": "unliked"}
```

Si pas liké :
```json
{"status": "not liked"}
```

---

## 9. Ajouter aux favoris

```
POST /api/engine/games/<slug>/favorite/
Authorization: Bearer <token>
```

**Réponse** `201 Created`
```json
{"status": "favorited"}
```

**Réponse** `200 OK` (déjà en favori)
```json
{"status": "already favorited"}
```

---

## 10. Retirer des favoris

```
POST /api/engine/games/<slug>/unfavorite/
Authorization: Bearer <token>
```

**Réponse** `200 OK`
```json
{"status": "unfavorited"}
```

Si pas en favori :
```json
{"status": "not favorited"}
```

---

## 11. Enregistrer une vue manuellement

```
POST /api/engine/games/<slug>/view/
```

Enregistre une vue (max 1 par user/IP par 24h).

> **Note** : Les vues sont aussi comptées automatiquement sur le endpoint de détail (#4). Cet endpoint est disponible si le frontend veut gérer les vues séparément.

**Réponse** `200 OK`
```json
{"status": "view_counted"}
```

Si déjà vu aujourd'hui :
```json
{"status": "already_viewed_today"}
```

---

## 12. Signaler un jeu

```
POST /api/engine/games/<slug>/report/
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**
```json
{
  "reason": 1,
  "comment": "Le lien magnet ne fonctionne plus"
}
```

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `reason` | int | ✅ | ID de la raison (voir endpoint #16) |
| `comment` | string | ❌ | Commentaire libre |

**Réponse** `201 Created`
```json
{"status": "reported"}
```

**Erreur** `400 Bad Request` (déjà signalé pour cette raison)
```json
{"error": "Vous avez déjà signalé ce jeu pour cette raison."}
```

---

## 13. Jeux likés par l'utilisateur

```
GET /api/engine/games/liked/
Authorization: Bearer <token>
```

Retourne tous les jeux likés par l'utilisateur connecté, enrichis avec les données du JC-Engine.

**Réponse** `200 OK`
```json
{
  "results": [
    {
      "id": 187,
      "slug": "satisfactory",
      "display_name": "Satisfactory",
      "steam_app_id": 526870,
      "versions": [...],
      "metadata": {...},
      "views": 16,
      "likes": 3,
      "favorites_count": 1,
      "downloads_count": 5,
      "is_liked": true,
      "is_favorited": false
    }
  ]
}
```

---

## 14. Favoris de l'utilisateur

```
GET /api/engine/games/favorites/
Authorization: Bearer <token>
```

Même format que l'endpoint #13 mais pour les favoris.

**Réponse** `200 OK`
```json
{
  "results": [...]
}
```

---

## 15. Recherche de jeux

```
GET /api/engine/search/?q=simulator
GET /api/engine/search/?q=peak&limit=5
```

Recherche dans le JC-Engine et enrichit les résultats avec les données sociales Django.

**Paramètres query**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `q` | string | *(requis)* | Terme de recherche |
| `limit` | int | 20 | Nombre max de résultats (max: 100) |

**Réponse** `200 OK`
```json
{
  "results": [
    {
      "id": 312,
      "slug": "supermarket-simulator",
      "display_name": "Supermarket Simulator",
      "steam_app_id": 2670630,
      "latest_version": "Build 0.1.5",
      "version_count": 3,
      "total_size": "2.1 GB",
      "last_updated": "2026-03-01 12:00:00",
      "views": 8,
      "likes": 2,
      "favorites_count": 0,
      "is_liked": false,
      "is_favorited": false
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 20
  }
}
```

**Erreur** `400 Bad Request` (paramètre manquant)
```json
{"error": "Query parameter \"q\" is required."}
```

---

## 16. Raisons de signalement

```
GET /api/engine/reports/reasons/
```

Liste toutes les raisons prédéfinies de signalement.

**Réponse** `200 OK`
```json
[
  {"id": 1, "reason": "Lien mort"},
  {"id": 2, "reason": "Virus / Malware"},
  {"id": 3, "reason": "Faux jeu / Mauvais contenu"},
  {"id": 4, "reason": "Contenu inapproprié"},
  {"id": 5, "reason": "Autre"}
]
```

> **Note** : Les raisons doivent être créées dans l'admin Django (`/admin/game_hub/reportreason/`).

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| `200` | Succès |
| `201` | Créé (like, favorite, report) |
| `400` | Requête invalide (paramètre manquant, déjà signalé) |
| `401` | Non authentifié (token manquant ou expiré) |
| `404` | Jeu non trouvé (slug inexistant dans le JC-Engine) |

---

## Types de données

### VersionDetail

| Champ | Type | Description |
|-------|------|-------------|
| `id` | int | ID interne JC-Engine |
| `version_raw` | string | Version (ex: `"1.33.a"`, `"Build 17072025"`) |
| `file_size` | string | Taille lisible (ex: `"12.6 GB"`) |
| `file_size_bytes` | int | Taille en octets |
| `upload_date` | string | Date d'upload |
| `is_latest` | bool | `true` si version la plus récente |
| `source` | string | Source (ex: `"onlinefix"`) |
| `download_links` | DownloadLink[] | Liens de téléchargement |

### DownloadLink

| Champ | Type | Description |
|-------|------|-------------|
| `uri` | string | URL ou lien magnet |
| `link_type` | string | `"magnet"` ou `"direct"` |

### SteamMetadata

| Champ | Type | Description |
|-------|------|-------------|
| `steam_app_id` | int | ID Steam |
| `description` | string \| null | Description complète (HTML) |
| `short_description` | string \| null | Description courte |
| `header_image` | string \| null | URL de l'image principale |
| `screenshots` | string[] | URLs des captures d'écran |
| `trailers` | string[] | URLs des vidéos |
| `developers` | string[] | Studios de développement |
| `publishers` | string[] | Éditeurs |
| `release_date` | string \| null | Date de sortie |
| `genres` | string[] | Genres (Action, RPG...) |
| `tags` | string[] | Tags Steam (Multi-player, Co-op...) |

---

## Architecture

```
Frontend/Electron
     │
     ▼
Django (game_hub)         /api/engine/*
     │         │
     │         ▼
     │    JC-Engine (Rust :3333)     ← versions, liens, métadonnées Steam
     │         │
     │    Redis Cache (DB 1)        ← cache 60s-600s selon l'endpoint
     │
     ▼
PostgreSQL                          ← likes, vues, favoris, signalements
```

**Comportement dégradé** : si le JC-Engine est inaccessible, les endpoints retournent `404` pour le détail ou une liste vide pour la liste/recherche. Les données sociales Django restent toujours disponibles.

**Cache** : les données du JC-Engine sont mises en cache dans Redis avec ces TTL :

| Endpoint Engine | TTL |
|----------------|-----|
| `/api/engine/stats` | 60s |
| `/api/engine/games` (liste) | 120s |
| `/api/engine/games/:slug` (détail) | 300s |
| `/api/engine/games/:slug/latest` | 300s |
| `/api/engine/games/:slug/versions` | 300s |
| `/api/engine/games/:slug/metadata` | 600s |
| `/api/engine/search` | 60s |
