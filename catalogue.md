# Catalogue API Documentation

Base URL: `/api/app/`

---

## 🎮 Games

### List Games
```http
GET /api/app/games/
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in title |
| `category` | string | Filter by category slug |
| `ordering` | string | Sort by: `views`, `-views`, `likes`, `-likes`, `published_at`, `-published_at` |
| `limit` | int | Items per page (default: 20, max: 100) |
| `page` | int | Page number |

**Response:**
```json
{
  "count": 2169,
  "next": "/api/app/games/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Hytale",
      "slug": "hytale",
      "header": "/media/games/headers/hytale.jpg",
      "categories": ["Action", "RPG"],
      "views": 1234,
      "likes": 56,
      "is_liked": false,
      "is_favorited": false,
      "versions_count": 7,
      "latest_version": {
        "source": "onlinefix",
        "version": "Build 28012026",
        "size": "1.6 GB",
        "is_online": true
      },
      "published_at": "2026-01-29T20:00:00Z"
    }
  ]
}
```

---

### Get Game Details
```http
GET /api/app/games/{id}/
```

**Response:**
```json
{
  "id": 1,
  "steam_id": "1234567",
  "title": "Hytale",
  "slug": "hytale",
  "description": "Full HTML description...",
  "description_short": "Short description",
  "header": "/media/games/headers/hytale.jpg",
  "background": "/media/games/backgrounds/hytale.jpg",
  "video": "https://youtube.com/watch?v=...",
  "screenshots": ["url1", "url2"],
  "categories": [{"id": 1, "name": "Action", "slug": "action", "icon": "🎮"}],
  "tags": [{"id": 1, "name": "Multiplayer"}],
  "developer": "Hypixel Studios",
  "publisher": "Riot Games",
  "requirements": {
    "minimum": {"os": "Windows 10", "cpu": "i5", "ram": "8GB"},
    "recommended": {"os": "Windows 11", "cpu": "i7", "ram": "16GB"}
  },
  "source": ["onlinefix", "steamrip"],
  "views": 1234,
  "likes": 56,
  "favorites_count": 23,
  "downloads_count": 789,
  "release_date": "2026-01-15",
  "published_at": "2026-01-29T20:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z",
  "is_liked": false,
  "is_favorited": false,
  "versions": [
    {
      "id": 1,
      "source": "onlinefix",
      "version": "Build 28012026",
      "size": 1717986918,
      "size_formatted": "1.6 GB",
      "size_raw": "1.6 GB",
      "is_online": true,
      "download_links": [
        {"type": "magnet", "url": "magnet:?xt=urn:btih:..."}
      ],
      "created_at": "2026-01-29T20:09:19Z"
    }
  ]
}
```

---

### Get Game by Slug
```http
GET /api/app/games/by-slug/{slug}/
```

---

### Popular Games
```http
GET /api/app/games/popular/
```
Returns top 10 games by views.

---

### Recent Games
```http
GET /api/app/games/recent/
```
Returns 10 most recently added games.

---

### Trending Games
```http
GET /api/app/games/trending/
```
Returns games with most views in last 7 days.

---

## ❤️ User Actions (Auth Required)

### Like Game
```http
POST /api/app/games/{id}/like/
```
**Auth:** Bearer token required

**Response:** `201 Created`
```json
{"status": "liked"}
```

---

### Unlike Game
```http
POST /api/app/games/{id}/unlike/
```
**Auth:** Bearer token required

**Response:** `200 OK`
```json
{"status": "unliked"}
```

---

### Add to Favorites
```http
POST /api/app/games/{id}/favorite/
```
**Auth:** Bearer token required

**Response:** `201 Created`
```json
{"status": "favorited"}
```

---

### Remove from Favorites
```http
POST /api/app/games/{id}/unfavorite/
```
**Auth:** Bearer token required

**Response:** `200 OK`
```json
{"status": "unfavorited"}
```

---

### Register View
```http
POST /api/app/games/{id}/view/
```
Increments view count (max 1 per user per 24h).

**Response:** `200 OK`
```json
{"status": "view_counted"}
```

---

### Get Download Links
```http
GET /api/app/games/{id}/download/
```
**Auth:** Bearer token required

**Response:**
```json
{
  "id": 1,
  "title": "Hytale",
  "versions": [
    {
      "id": 1,
      "source": "onlinefix",
      "version": "Build 28012026",
      "download_links": [
        {"type": "magnet", "url": "magnet:?xt=urn:btih:..."},
        {"type": "direct", "url": "https://..."}
      ]
    }
  ]
}
```

---

## 📁 Categories

### List Categories
```http
GET /api/app/categories/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Action",
    "slug": "action",
    "icon": "🎮",
    "games_count": 523
  }
]
```

---

## 🔐 Admin Endpoints (Staff Only)

### Create Game
```http
POST /api/app/games/
```
**Auth:** Admin token required

**Body:** All Game model fields

---

### Update Game
```http
PUT /api/app/games/{id}/
PATCH /api/app/games/{id}/
```
**Auth:** Admin token required

---

### Delete Game
```http
DELETE /api/app/games/{id}/
```
**Auth:** Admin token required

---

## Error Responses

| Code | Description |
|------|-------------|
| `400` | Bad Request |
| `401` | Unauthorized (auth required) |
| `403` | Forbidden (admin only) |
| `404` | Game not found |

```json
{"detail": "Not found."}
```
