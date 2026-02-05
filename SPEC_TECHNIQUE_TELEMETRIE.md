# Spécification Technique : Backend Télémétrie & Multi-Device 📊

Ce document est la référence technique pour implémenter le module de Télémétrie "Robuste". Il est conçu pour gérer des utilisateurs possédant plusieurs PC, et des PC partagés par plusieurs utilisateurs.

---

## 1. Philosophie & Architecture "Multi-PC" 🌍

Pour être robuste, nous devons séparer la machine de l'utilisateur.
*   **Device (Machine)** : Un ordinateur physique unique. Identifié par un `hwid` (Hardware ID).
*   **User (Compte)** : L'utilisateur connecté.
*   **Session** : Une période où un **User** utilise un **Device**.

**Règle d'Or :** Un User peut avoir plusieurs Devices. Un Device peut avoir plusieurs Users (ex: PC familial).

---

## 2. Modèles de Données (Django Models) 💾

Voici les champs EXACTS dont tu as besoin pour une télémétrie complète.

### A. Modèle `Device` (L'ordinateur)
Ce modèle est unique par machine physique.

```python
class Device(models.Model):
    # ID unique généré par le launcher (SHA-256 de Motherboard Serial + CPU ID)
    hwid = models.CharField(max_length=64, unique=True, db_index=True)
    
    # Informations Statiques (qui changent rarement)
    hostname = models.CharField(max_length=255) # Nom du PC (ex: "DESKTOP-5A2B")
    os_name = models.CharField(max_length=50)   # ex: "Windows 10 Pro"
    os_version = models.CharField(max_length=50) # ex: "10.0.19045"
    os_arch = models.CharField(max_length=10)    # ex: "x64"
    
    # CPU
    cpu_name = models.CharField(max_length=255)  # ex: "Intel Core i7-10700K"
    cpu_cores = models.IntegerField()            # Physiques
    cpu_threads = models.IntegerField()          # Logiques
    cpu_clock_speed = models.IntegerField(help_text="En MHz")
    
    # GPU (Carte Graphique Principale)
    gpu_name = models.CharField(max_length=255)  # ex: "NVIDIA GeForce RTX 3080"
    gpu_vram_mb = models.IntegerField()          # ex: 10240
    gpu_driver_version = models.CharField(max_length=50) # ex: "536.23"
    
    # Mémoire & Stockage
    ram_total_mb = models.IntegerField()         # ex: 32768
    disk_total_gb = models.IntegerField()        # Total espace disque système
    disk_type = models.CharField(max_length=10)  # "SSD" ou "HDD" (si détectable)
    
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.hostname} ({self.hwid[:8]})"
```

### B. Modèle `LauncherSession` (L'activité)
Enregistre chaque lancement. C'est ici qu'on lie User et Device.

```python
class LauncherSession(models.Model):
    # Lien User <-> Device
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='sessions')
    
    # Identifiant unique de session généré par le launcher (UUID4)
    session_uuid = models.UUIDField(unique=True, db_index=True)
    
    app_version = models.CharField(max_length=20)   # Version du Launcher (ex: "2.1.0")
    
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    
    # Indicateur de fermeture propre
    closed_cleanly = models.BooleanField(default=False)
    
    # Métriques de démarrage
    startup_time_ms = models.IntegerField(help_text="Temps pour charger l'app")
    
    # IP (pour géo-localisation approximative côté serveur si besoin)
    ip_address = models.GenericIPAddressField(null=True)
```

### C. Modèle `PerformanceReport` (Les FPS en jeu) (Optionnel v2)
Pour la partie "Benchmark".

```python
class PerformanceReport(models.Model):
    session = models.ForeignKey(LauncherSession, on_delete=models.CASCADE)
    game_id = models.CharField(max_length=50)
    
    avg_fps = models.FloatField()
    min_fps = models.FloatField()
    max_fps = models.FloatField()
    
    resolution_w = models.IntegerField()
    resolution_h = models.IntegerField()
    fullscreen = models.BooleanField()
    
    recorded_at = models.DateTimeField(auto_now_add=True)
```

---

## 3. Endpoints API & Payload JSON 📡

Voici exactement ce que le Launcher va envoyer. Prépare tes Serializers Django pour accepter ça.

### Endpoint: `POST /api/telemetry/startup/`

**Header:** `Authorization: Bearer <token>`

**Body JSON reçu (Exemple complet) :**
```json
{
  "session_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "app_version": "3.0.0",
  "startup_time_ms": 1450,
  "device": {
    "hwid": "a1b2c3d4e5f6...", // HASH UNIQUE OBLIGATOIRE
    "hostname": "GAMING-PC-ALEX",
    "os_name": "Windows 11 Home",
    "os_version": "10.0.22621",
    "os_arch": "x64",
    "cpu": {
      "name": "AMD Ryzen 7 5800X",
      "cores": 8,
      "threads": 16,
      "clock_speed": 3800
    },
    "gpu": {
      "name": "NVIDIA GeForce RTX 4070",
      "vram": 12288,
      "driver": "531.18"
    },
    "ram": {
      "total_mb": 32690
    },
    "disk": {
      "total_gb": 1024,
      "type": "SSD"
    }
  }
}
```

**Logique Backend (Pseudo-code Python/Django) :**
1.  Récupérer le `user` depuis le Token.
2.  Chercher si un `Device` existe avec ce `hwid`.
    *   **Si OUI** : Mettre à jour `last_seen` et les infos (au cas où il a changé de GPU).
    *   **Si NON** : Créer un nouveau `Device`.
3.  Créer une `LauncherSession` liée au `user` et au `device`.
4.  Renvoyer `201 Created` avec `{ "status": "tracked" }`.

### Endpoint: `POST /api/telemetry/shutdown/`

Appelé quand l'app se ferme.

**Body JSON :**
```json
{
  "session_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "closed_cleanly": true
}
```

**Logique Backend :**
1.  Trouver la `LauncherSession` via `session_uuid`.
2.  Mettre `ended_at` = `now()`.
3.  Calculer `duration_seconds` = `ended_at` - `started_at`.
4.  Sauvegarder.

### Endpoint: `POST /api/telemetry/heartbeat/` (Bonus)

Appelé toutes les 5 minutes pour dire "Je suis vivant". Met à jour `ended_at` en temps réel (comme ça si le PC crash, tu sais quand ça s'est arrêté).

---

## 4. Génération du HWID (Côté Client - Info pour toi) 🔐

Pour que ce soit robuste, le HWID ne doit **jamais changer** tant que c'est le même PC, même si l'user réinstalle Windows ou change de disque dur.

**La méthode recommandée :**
*   On combine : `UUID Carte Mère` + `UUID Processeur`.
*   On hash le tout (SHA-256).
*   Ça donne une clé unique et stable.

Si l'utilisateur a 2 PC (un portable et un fixe) :
1.  Il se connecte sur le Fixe -> HWID A -> Création Device A -> Session User/Device A.
2.  Il se connecte sur le Portable -> HWID B -> Création Device B -> Session User/Device B.

Côté Admin, tu pourras voir : **"L'utilisateur Upsilon utilise 2 machines : Device A (RTX 3080) et Device B (Inte Iris Xe)."**

C'est le niveau de détail maximal et le plus propre possible pour une architecture scalable ! 🚀
