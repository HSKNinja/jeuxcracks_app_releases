# Backend Architecture: JeuxCracks Cloud & Telemetry (V2)

Ce document détaille une architecture backend **massive** pour transformer le launcher en une plateforme sociale et connectée complète ("Steam-like").

---

## 1. Cloud Sync & Sauvegardes de Jeux (Drive) ☁️
**Objectif :** Ne plus jamais perdre une sauvegarde, même en changeant de PC.

### A. Modèles
**`GameSaveFile`**
```python
class GameSaveFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_id = models.CharField(max_length=50) 
    file_name = models.CharField(max_length=255) # "save1.dat"
    file_content = models.FileField(upload_to='saves/') # Le fichier réel
    checksum = models.CharField(max_length=64) # Pour vérifier les conflits
    last_modified = models.DateTimeField()
```

### B. Endpoints
*   `POST /api/cloud/saves/{game_id}/upload` : Upload un fichier de sauvegarde (Zip ou fichier brut).
*   `GET /api/cloud/saves/{game_id}/latest` : Télécharge la dernière sauvegarde disponible.
*   `GET /api/cloud/saves/storage` : Affiche l'espace disque utilisé par l'utilisateur (Quota).

---

## 2. Social & Friends System 👥
**Objectif :** Voir ce que font les amis, rejoindre leurs parties, chater.

### A. Modèles
**`Friendship`**
```python
class Friendship(models.Model):
    user_from = models.ForeignKey(User)
    user_to = models.ForeignKey(User)
    status = models.CharField(choices=['PENDING', 'ACCEPTED', 'BLOCKED'])
    created_at = models.DateTimeField(auto_now_add=True)
```

**`UserStatus`** (Redis recommandé pour la rapidité, mais SQL possible)
```python
class UserStatus(models.Model):
    user = models.OneToOneField(User)
    is_online = models.BooleanField(default=False)
    current_activity = models.CharField(max_length=255) # "Joue à Elden Ring"
    last_ping = models.DateTimeField()
```

### B. Endpoints
*   `GET /api/social/friends` : Liste des amis avec leur statut (En ligne / Jeu).
*   `POST /api/social/friends/request` : Envoyer une demande d'ami.
*   `POST /api/social/presence/ping` : Le launcher appelle ça toutes les 30s. "Je suis là et je joue à X".
*   `GET /api/social/activity-feed` : "Upsilon a lancé GTA V il y a 5 min".

---

## 3. Remote Control & Assistant (Web to App) 📱
**Objectif :** Lancer un téléchargement sur ton PC depuis ton téléphone (site web).

### A. Modèles
**`RemoteCommand`**
```python
class RemoteCommand(models.Model):
    target_machine = models.ForeignKey(UserMachine) # Ton PC spécifique
    command = models.CharField(max_length=50) # "INSTALL_GAME", "SHUTDOWN", "LAUNCH_GAME"
    payload = models.JSONField() # { "game_id": 3271 }
    status = models.CharField(default='PENDING') # PENDING -> EXECUTED
```

### B. Endpoints
*   `GET /api/remote/queue` : Le Launcher appelle ça toutes les 1 min. "Ai-je des ordres ?"
*   `POST /api/remote/execute` : Le Launcher dit "C'est bon, j'ai lancé l'installation".

---

## 4. Community & Content Workshop 🎨
**Objectif :** Partager des thèmes, des avis et voter pour les prochains cracks.

### A. Modèles
**`GameReview`**
```python
class GameReview(models.Model):
    user = models.ForeignKey(User)
    game_id = models.CharField(max_length=50)
    rating = models.IntegerField(min=1, max=5)
    content = models.TextField()
    works_on_linux = models.BooleanField() # Utile pour le Steam Deck !
```

**`ThemeUpload`**
```python
class ThemeUpload(models.Model):
    creator = models.ForeignKey(User)
    name = models.CharField(max_length=100)
    css_content = models.TextField()
    downloads_count = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
```

### B. Endpoints
*   `POST /api/community/reviews/add` : Poster un avis après avoir joué > 2h.
*   `GET /api/community/themes/browse` : Télécharger des thèmes créés par d'autres.
*   `POST /api/community/requests/vote` : Voter pour le prochain jeu à cracker.

---

## 5. Télémétrie Avancée & Hardware (Assistant Complet) 📊
**Objectif :** Créer une base de données hardware mondiale de tes utilisateurs.

### A. Endpoints
*   `POST /api/telemetry/hardware` : Envoi complet (CPU, GPU, RAM, Disques, Résolution écran, Version Drivers).
    *   *Utilité :* Tu pourras dire sur le site "Ce jeu tournera-t-il sur mon PC ?" en comparant avec sa config stockée.
*   `POST /api/telemetry/performance` : Envoi des FPS moyens après une session de jeu.
*   `POST /api/telemetry/network` : Rapport de vitesse de téléchargement moyen (pour diagnostiquer tes serveurs).

---

## 6. Système de Notifications & Inbox 🔔
**Objectif :** Communiquer directement avec les utilisateurs dans le launcher.

### A. Modèles
**`UserNotification`**
```python
class UserNotification(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255) # Deep link vers un jeu ou une page
    is_read = models.BooleanField(default=False)
    type = models.CharField(choices=['UPDATE', 'PROMO', 'SYSTEM'])
```

### B. Endpoints
*   `GET /api/inbox/unread` : Récupère les notifs (pastille rouge).
*   `POST /api/inbox/mark-read` : Marquer comme lu.

---

## 7. Cloud Profile & Progression (Cosmetics & Account Data) ✨
**Objectif :** Synchroniser l'identité visuelle de l'utilisateur, son niveau (XP) et ses déblocages.

### A. Modèles

**`UserLevel`** (Gamification)
```python
class UserLevel(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    xp_points = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    title = models.CharField(max_length=100) # "Novice", "Crack Expert"
    next_level_xp = models.IntegerField(default=1000)
```

**`CosmeticItem`**
```python
class CosmeticItem(models.Model):
    id = models.CharField(max_length=50, primary_key=True) # "neon_blue_theme", "avatar_frame_gold"
    type = models.CharField(choices=['THEME', 'AVATAR_FRAME', 'BADGE', 'BACKGROUND'])
    name = models.CharField(max_length=100)
    preview_url = models.URLField()
    is_premium = models.BooleanField(default=False)
    unlock_condition = models.CharField(max_length=255) # "Reach Level 10" or "Play 100h"
```

**`UserCosmeticLibrary`**
```python
class UserCosmeticLibrary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    item = models.ForeignKey(CosmeticItem, on_delete=models.CASCADE)
    acquired_at = models.DateTimeField(auto_now_add=True)
    is_equipped = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'item')
```

### B. Endpoints

*   `GET /api/profile/me/full` : Récupère TOUT le profil (XP, Badges, Items équipés, Stats globales) en un appel.
*   `POST /api/profile/cosmetics/equip/{item_id}` : Équipe un cadre ou un thème. Cette info est sauvegardée et répliquée sur tous les PC.
*   `GET /api/profile/shop` : Magasin de cosmétiques (virtuel ou réel).
*   `POST /api/progression/grant-xp` : (Interne/Admin) Donner de l'XP après une réussite (ex: après avoir uploadé une save).

---

## 8. Mods & Workshop (User Generated Content) 🛠️
**Objectif :** Permettre aux utilisateurs d'uploader et de gérer des mods pour les jeux supportés.

### A. Modèles
**`GameMod`**
```python
class GameMod(models.Model):
    game_id = models.CharField(max_length=50)
    title = models.CharField(max_length=100)
    description = models.TextField()
    file_url = models.URLField()
    version = models.CharField(max_length=20)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    downloads = models.IntegerField(default=0)
    is_approved = models.BooleanField(default=False) # Sécurité
```

**`UserLoadOrder`**
```python
class UserLoadOrder(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_id = models.CharField(max_length=50)
    # Liste ordonnée des IDs de mods actifs
    mod_list = models.JSONField(default=list) 
```

### B. Endpoints
*   `GET /api/workshop/{game_id}/list` : Liste les mods dispos.
*   `POST /api/workshop/upload` : Uploader un nouveau mod.
*   `POST /api/workshop/loadorder/sync` : Sauvegarder l'ordre des mods (Cloud Sync pour mods !).

---

## 9. Contrôle Parental & Bien-être Numérique 🛡️
**Objectif :** Limiter le temps de jeu ou l'accès à certains contenus pour les enfants.

### A. Modèles
**`ParentalControlConfig`**
```python
class ParentalControlConfig(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    pin_code = models.CharField(max_length=4) # Hashed
    max_playtime_minutes = models.IntegerField(null=True) # Par jour
    restricted_hours_start = models.TimeField(null=True) # ex: 22:00
    restricted_hours_end = models.TimeField(null=True) # ex: 08:00
    block_mature_content = models.BooleanField(default=False)
```

### B. Endpoints
*   `POST /api/security/parental/lock` : Activer le verrouillage.
*   `POST /api/security/parental/unlock` : Déverrouiller temporairement avec PIN.
*   `GET /api/security/parental/status` : "Reste 15 minutes de jeu aujourd'hui".

---

## 10. Hardware Benchmarks (Crowdsourcing) 📈
**Objectif :** Créer une base de données de performance réelle. "Avec ma GTX 1660, combien de FPS sur Cyberpunk ?"

### A. Modèles
**`BenchmarkResult`**
```python
class BenchmarkResult(models.Model):
    game_id = models.CharField(max_length=50)
    gpu_model = models.CharField(max_length=255)
    cpu_model = models.CharField(max_length=255)
    ram_gb = models.IntegerField()
    resolution = models.CharField(max_length=20) # "1920x1080"
    settings_preset = models.CharField(max_length=20) # "ULTRA", "LOW"
    avg_fps = models.FloatField()
    min_1_percent_fps = models.FloatField()
```

### B. Endpoints
*   `POST /api/telemetry/benchmark/submit` : Le launcher envoie les résultats après une session.
*   `GET /api/analyze/performance/{game_id}` : Retourne la moyenne des FPS pour ce game en fonction du GPU de l'user.

---

## 12. Innovation Lab (Features Inédites / "Crazy") 🧪
**Objectif :** Des fonctionnalités uniques qui n'existent nulle part ailleurs (même pas sur Steam).

### 1. Save Timeline ("Git for Saves") ⏳
**Concept :** Ne plus jamais écraser une sauvegarde. Le backend stocke chaque sauvegarde comme un "commit".
*   **Feature :** Afficher un ARBRE visuel des choix (ex: "Branche 'Méchant'", "Branche 'Gentil'").
*   **Endpoint :** `GET /api/time-machine/{game_id}/tree`
*   **Utilité :** Revenir instantanément 4h en arrière dans Cyberpunk pour faire un autre choix.

### 2. AI Game Copilot (RAG) 🤖
**Concept :** Un assistant IA qui connait le contexte de ta sauvegarde.
*   **Technique :** Le launcher envoie le fichier de save + le nom du jeu. Le backend parse la save (JSON/XML) et la nourrit à un LLM avec le Wiki du jeu.
*   **Endpoint :** `POST /api/ai/ask` -> User: "Où est la clé du boss ?" -> AI: "Selon ta save, tu l'as ratée dans le coffre du niveau 2".
*   **Utilité :** Plus besoin d'Alt-Tab pour aller sur un Wiki.

### 3. Meta-Factions (Guerre de Territoire Globale) ⚔️
**Concept :** Une surcouche stratégique "Meta-Jeu" pour tous les utilisateurs.
*   **Fonctionnement :**
    *   Les joueurs rejoignent des factions (ex: "Pirates", "Ninjas", "Robots").
    *   La carte du monde (virtuelle) est divisée en zones.
    *   Chaque heure de jeu sur n'importe quel jeu contribue à "attaquer" ou "défendre" une zone.
*   **Endpoint :** `GET /api/meta/map/status` (Affiche la carte en temps réel).
*   **Utilité :** Donne un but communautaire même en jouant à des jeux solo.

### 4. Ghost Racing (Async Multiplayer) 👻
**Concept :** Affronter les "fantômes" de ses amis sur des jeux solo.
*   **Technique :** Le backend enregistre la télémétrie seconde par seconde (Position X/Y/Z ou Score/Temps).
*   **Feature :** En lançant le jeu, le launcher injecte un overlay qui montre "Pseudo de l'ami : +500 points d'avance" ou une barre de progression comparative en direct.
*   **Endpoint :** `GET /api/ghosts/{game_id}/compare`.

### 5. Predictive Storage AI (Nettoyage Intelligent) 🧠
**Concept :** L'IA gère ton disque dur à ta place.
*   **Fonctionnement :** "Tu n'as pas lancé *Call of Duty* depuis 21 jours. Tu joues toujours à *Hades* le mardi. Je supprime CoD pour pré-télécharger la mise à jour de Hades ?"
*   **Endpoint :** `POST /api/storage/optimize` (Le backend renvoie un plan de nettoyage suggéré).

---

## 13. Résumé Technique pour l'Intégration (V4 God Mode)

### Authentification
Tout passe par JWT (`Access Token` dans le Header Authorization). Le Launcher gère le refresh automatique.

### Format des échanges
- **GET** : Récupération de données (JSON).
- **POST** : Envoi de données ou Actions (JSON ou Multipart pour les fichiers).

### Exemple de Flux "Innovation"
1.  **Meta-War :** Launcher démarre -> Affiche "Ta faction perd du terrain ! Joue pour défendre !"
2.  **AI Predict :** "Je télécharge la MAJ de *Elden Ring* car tu y joueras ce soir selon mes calculs."
3.  **Time Machine :** User : "Je veux rejouer le boss mais j'ai sauvegardé après." -> Clic sur l'arbre -> `POST /api/time-machine/revert`.
4.  **Co-Pilot :** En jeu (Overlay) : "Comment je bats ce boss ?" -> L'IA scanne la save et répond.

Avec ça, tu as une plateforme qui dépasse la simple bibliothèque de jeux. C'est un **Compagnon Intelligent de Gaming** complet. 🚀
