# Documentation API Télémétrie

## Vue d'ensemble
L'API de télémétrie permet de suivre l'activité des utilisateurs sur le launcher, d'inventorier le matériel (Devices) et de monitorer les performances.

**Base URL** : `/api/telemetry/`

---

## 1. Démarrage de Session (Startup)
Enregistre une nouvelle session et met à jour les informations du Device.

- **Endpoint** : `POST /startup/`
- **Auth** : Requiert un token Bearer valide.

### Body (JSON)
```json
{
  "session_uuid": "UUID4 (généré par le client)",
  "app_version": "1.0.0",
  "startup_time_ms": 1200,
  "device": {
    "hwid": "HASH_UNIQUE",
    "hostname": "PC-GAMER",
    "os_name": "Windows 11",
    "os_version": "10.0.x",
    "os_arch": "x64",
    "cpu": {
      "name": "Intel Core i7",
      "cores": 8,
      "threads": 16,
      "clock_speed": 3600
    },
    "gpu": {
      "name": "NVIDIA RTX 3070",
      "vram": 8192,
      "driver": "536.00"
    },
    "ram": { "total_mb": 16384 },
    "disk": { "total_gb": 1024, "type": "SSD" }
  }
}
```

### Réponses
- `201 Created` : `{"status": "tracked"}` - Succès.
- `400 Bad Request` : Données invalides (ex: HWID manquant).

---

## 2. Arrêt de Session (Shutdown)
Signale la fermeture du launcher.

- **Endpoint** : `POST /shutdown/`
- **Auth** : Requiert un token Bearer valide.

### Body (JSON)
```json
{
  "session_uuid": "UUID-DE-LA-SESSION",
  "closed_cleanly": true
}
```

### Réponses
- `200 OK` : `{"status": "session closed"}`
- `404 Not Found` : Session introuvable ou n'appartient pas à l'utilisateur.

---

## 3. Heartbeat
Envoyé périodiquement (ex: toutes les 5min) pour confirmer que le launcher est actif. Met à jour la durée de la session.

- **Endpoint** : `POST /heartbeat/`
- **Auth** : Requiert un token Bearer valide.

### Body (JSON)
```json
{
  "session_uuid": "UUID-DE-LA-SESSION"
}
```

### Réponses
- `200 OK` : `{"status": "alive"}`
- `404 Not Found` : Session introuvable.
