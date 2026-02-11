# 🎮 Spécification Backend - Catalogue de Jeux

## Vue d'ensemble
Base de données et API REST pour le catalogue de jeux JeuxCracks.

---

## 📊 Modèle de données `Game`

### Champs principaux

| Champ | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer (PK) | ✅ | Identifiant unique |
| `steam_id` | String | ❌ | ID Steam (pour métadonnées) |
| `title` | String(255) | ✅ | Titre du jeu |
| `slug` | String(255) | ✅ | URL-friendly (auto-généré) |
| `description` | Text | ❌ | Description complète (HTML/Markdown) |
| `description_short` | String(500) | ❌ | Accroche courte |

### Médias

| Champ | Type | Description |
|-------|------|-------------|
| `header` | ImageField | Image principale (460x215 recommandé) |
| `background` | ImageField | Image de fond (1920x1080) |
| `video` | URLField | Lien vidéo MP4/WebM |
| `screenshots` | JSON Array | Liste d'URLs d'images |

### Catégorisation

| Champ | Type | Description |
|-------|------|-------------|
| `categories` | ManyToMany → Category | Genres (Action, RPG, etc.) |
| `tags` | ManyToMany → Tag | Tags libres |
| `developer` | String(255) | Nom du développeur |
| `publisher` | String(255) | Nom de l'éditeur |

### Téléchargement

| Champ | Type | Description |
|-------|------|-------------|
| `download_torrent` | URLField | Lien magnet/torrent |
| `download_direct` | URLField | Lien DDL |
| `size` | BigInteger | Taille en octets |
| `version` | String(50) | Version du crack/jeu |
| `is_online` | Boolean | Support multijoueur cracké |

### Configuration requise

```json
{
  "requirements": {
    "minimum": {
      "os": "Windows 10",
      "processor": "Intel i5",
      "memory": "8 GB RAM",
      "graphics": "GTX 1060",
      "storage": "50 GB"
    },
    "recommended": {
      "os": "Windows 11",
      "processor": "Intel i7",
      "memory": "16 GB RAM",
      "graphics": "RTX 3060",
      "storage": "50 GB SSD"
    }
  }
}
```

### Statistiques

| Champ | Type | Description |
|-------|------|-------------|
| `views` | Integer | Nombre de vues |
| `likes` | Integer | Nombre de likes |
| `favorites_count` | Integer | Nombre de favoris |
| `downloads_count` | Integer | Nombre de téléchargements |

### Dates

| Champ | Type | Description |
|-------|------|-------------|
| `release_date` | Date | Date de sortie originale |
| `published_at` | DateTime | Date d'ajout au catalogue |
| `updated_at` | DateTime | Dernière mise à jour |

### Source/Crédit

```json
{
  "source": [
    { "name": "DODI", "url": "https://..." },
    { "name": "FitGirl", "url": "https://..." }
  ]
}
```

---

## 📁 Modèle `Category`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | ID |
| `name` | String(100) | Nom (Action, RPG, FPS...) |
| `slug` | String(100) | URL-friendly |
| `icon` | String(50) | Emoji ou icône |

---

## 🏷️ Modèle `Tag`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Integer (PK) | ID |
| `name` | String(100) | Nom du tag |

---

## 🌐 Endpoints API

### Liste des jeux

```
GET /api/app/games/
```

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Recherche textuelle |
| `category` | string | Filtrer par catégorie slug |
| `tags` | string | Tags séparés par virgule |
| `sort` | string | `newest`, `popular`, `views`, `downloads` |
| `page` | int | Pagination |
| `limit` | int | Items par page (défaut: 20, max: 100) |

**Réponse:**
```json
{
  "count": 1500,
  "next": "/api/app/games/?page=2",
  "previous": null,
  "results": [
    {
      "id": 248,
      "title": "Elden Ring",
      "slug": "elden-ring",
      "header": "https://api.jeuxcracks.fr/media/games/elden-ring.jpg",
      "categories": ["RPG", "Action"],
      "is_online": false,
      "size": 53687091200,
      "views": 15420
    }
  ]
}
```

---

### Détail d'un jeu

```
GET /api/app/games/{id}/
GET /api/app/games/by-slug/{slug}/
```

**Réponse complète** avec tous les champs.

---

### Jeux populaires / Récents

```
GET /api/app/games/popular/     # Top 10 par views
GET /api/app/games/recent/      # 10 derniers ajouts
GET /api/app/games/trending/    # Trending (calcul basé sur vues récentes)
```

---

### Catégories

```
GET /api/app/categories/
```

---

### Actions utilisateur

```
POST /api/app/games/{id}/like/
DELETE /api/app/games/{id}/like/

POST /api/app/games/{id}/favorite/
DELETE /api/app/games/{id}/favorite/

POST /api/app/games/{id}/view/   # Incrémenter vues (1 par user/24h)
```

---

## 🔍 Recherche avancée

```
GET /api/app/games/search/?q=elden+ring&category=rpg&min_size=0&max_size=100gb
```

Utiliser **Elasticsearch** ou **PostgreSQL Full-Text Search** pour la recherche.

---

## 📥 Téléchargement

```
GET /api/app/games/{id}/download/
```

**Réponse:**
```json
{
  "torrent": "magnet:?xt=urn:btih:...",
  "direct": "https://cdn.jeuxcracks.fr/files/...",
  "mirrors": [
    { "name": "Mirror 1", "url": "..." },
    { "name": "Mirror 2", "url": "..." }
  ]
}
```

> ⚠️ Accessible uniquement aux utilisateurs authentifiés.

---

## 🔒 Permissions

| Endpoint | Auth | Notes |
|----------|------|-------|
| Liste/Détail | ❌ | Public |
| Like/Favorite | ✅ | User authentifié |
| Download links | ✅ | User authentifié |
| Create/Update/Delete | ✅ | Admin only |

---

## 📊 Modèle Django (exemple)

```python
class Game(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    steam_id = models.CharField(max_length=20, blank=True, null=True)
    
    description = models.TextField(blank=True)
    description_short = models.CharField(max_length=500, blank=True)
    
    header = models.ImageField(upload_to='games/headers/')
    background = models.ImageField(upload_to='games/backgrounds/', blank=True)
    video = models.URLField(blank=True)
    screenshots = models.JSONField(default=list)
    
    categories = models.ManyToManyField('Category', related_name='games')
    tags = models.ManyToManyField('Tag', related_name='games', blank=True)
    
    developer = models.CharField(max_length=255, blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    
    download_torrent = models.URLField(blank=True)
    download_direct = models.URLField(blank=True)
    size = models.BigIntegerField(default=0)
    version = models.CharField(max_length=50, blank=True)
    is_online = models.BooleanField(default=False)
    
    requirements = models.JSONField(default=dict)
    source = models.JSONField(default=list)
    
    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    favorites_count = models.PositiveIntegerField(default=0)
    downloads_count = models.PositiveIntegerField(default=0)
    
    release_date = models.DateField(null=True, blank=True)
    published_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_published = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-published_at']
```

---

## 🎯 Priorités d'implémentation

1. **Phase 1** - CRUD basique + liste/détail
2. **Phase 2** - Recherche + filtres + pagination
3. **Phase 3** - Likes/Favoris/Vues
4. **Phase 4** - Téléchargements sécurisés
5. **Phase 5** - Recherche avancée (Elasticsearch)
