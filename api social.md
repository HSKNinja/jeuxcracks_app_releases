# Documentation API Social (V2)

## 📌 Vue d'ensemble

Le nouveau module Social (V2) utilise une architecture hybride :
1.  **REST API** : Pour les actions "froides" et persistantes (Lister les amis, Envoyer une demande, Historique de chat).
2.  **WebSockets (WS)** : Pour le temps réel (Notifications, Chat en direct, Présence/Statut).

**Base URL HTTP** : `https://api.jeuxcracks.fr/api/social/`
**Base URL WebSocket** : `wss://api.jeuxcracks.fr/ws/gateway/`

---

## 🏗️ 1. API REST (Gestion Amis & Historique)

**Authentification** : Toutes les requêtes doivent inclure le header `Authorization: Bearer <access_token>`.

### A. Gestion des Amis

#### 1. Lister les amis acceptés
*   **GET** `/friends/friends/`
*   **Description** : Récupère la liste de tous les amis avec qui la relation est `ACCEPTED`.
*   **Réponse (200 OK)** :
    ```json
    [
        {
            "id": 42,
            "friend": { "id": 101, "pseudo": "Gamer123" },
            "status": "ACCEPTED",
            "created_at": "2023-11-01T12:00:00Z"
        }
    ]
    ```

#### 2. Lister les demandes (Reçues et Envoyées)
*   **GET** `/friends/requests/`
*   **Description** : Récupère les demandes en attente (`PENDING`).

#### 3. Lister les utilisateurs bloqués
*   **GET** `/friends/blocked/`
*   **Description** : Récupère la liste des utilisateurs bloqués par l'utilisateur actuel.

#### 4. Envoyer une demande d'ami
*   **POST** `/friends/request/`
*   **Body** : `{ "username": "TargetUserPseudo" }`
*   **Réponses** :
    *   `201 Created` : Demande envoyée.
    *   `400 Bad Request` : Utilisateur introuvable, déjà ami, ou demande déjà existante.

#### 5. Répondre à une demande
*   **POST** `/friends/{friendship_id}/respond/`
*   **Body** : `{ "action": "ACCEPT" }` ou `{ "action": "REJECT" }`

#### 6. Supprimer un ami
*   **DELETE** `/friends/{friendship_id}/remove/`
*   **Description** : Supprime la relation d'amitié. Les deux parties peuvent supprimer.
*   **Réponses** :
    *   `200 OK` : `{ "status": "Friend removed" }`
    *   `404 Not Found` : Relation introuvable.

#### 7. Bloquer un utilisateur
*   **POST** `/friends/block/`
*   **Body** : `{ "user_id": 123 }`
*   **Description** : Bloque un utilisateur. Si une relation existe, elle passe à `BLOCKED`.
*   **Réponses** :
    *   `200 OK` : `{ "status": "User blocked" }`

#### 8. Débloquer un utilisateur
*   **POST** `/friends/{friendship_id}/unblock/`
*   **Description** : Supprime le blocage. Seul le bloqueur peut débloquer.
*   **Réponses** :
    *   `200 OK` : `{ "status": "User unblocked" }`

---

### B. Messagerie (Chat)

#### 1. Récupérer l'historique de chat
*   **GET** `/chat/{friend_user_id}/history/`
*   **Query Params** :
    *   `limit` (default: 50) : Nombre de messages.
    *   `offset` (default: 0) : Pagination.
*   **Réponse (200 OK)** :
    ```json
    [
        {
            "id": 999,
            "sender": { "id": 1, "pseudo": "Moi" },
            "receiver": { "id": 2, "pseudo": "Lui" },
            "content": "Salut !",
            "timestamp": "2023-11-01T12:05:00Z",
            "is_read": true
        }
    ]
    ```

#### 2. Marquer les messages comme lus
*   **POST** `/chat/{friend_user_id}/mark_read/`
*   **Description** : Marque tous les messages non lus de cet ami comme lus.
*   **Réponse (200 OK)** : `{ "status": "5 messages marked as read" }`


#### 3. Obtenir le nombre de messages non lus
*   **GET** `/chat/unread/`
*   **Description** : Récupère le nombre total de messages non lus et le détail par expéditeur.
*   **Réponse (200 OK)** :
    ```json
    {
        "total_unread": 12,
        "by_sender": [
            { "sender_id": 101, "sender__pseudo": "Gamer123", "count": 8 },
            { "sender_id": 55, "sender__pseudo": "NouveauPote", "count": 4 }
        ]
    }
    ```


---

## ⚡ 2. WebSockets (Temps Réel)

### 🔌 Connexion
*   **URL** : `wss://api.jeuxcracks.fr/ws/gateway/?token=<access_token>`
*   **Auth** : Le token JWT **doit** être passé en query paramètre `token`.
*   **Comportement** :
    *   Si token valide : Connexion acceptée, statut mis à `ONLINE`.
    *   Si token invalide : Connexion fermée (Code 4001).

---

### 📤 Client -> Serveur (Commandes)

#### 1. HEARTBEAT (Ping de présence)
```json
{
    "type": "HEARTBEAT",
    "status": "ONLINE",      // Options: "ONLINE", "IDLE", "IN_GAME"
    "game_title": "Fortnite" // Optionnel, seulement si IN_GAME
}
```

#### 2. SEND_MESSAGE (Envoyer un message privé)
```json
{
    "type": "SEND_MESSAGE",
    "to": 101,              // ID de l'utilisateur destinataire
    "content": "Tu viens jouer ?"
}
```

---

### 📥 Serveur -> Client (Événements)

#### 1. PRESENCE_UPDATE
```json
{
    "type": "PRESENCE_UPDATE",
    "user_id": 101,
    "status": "IN_GAME",
    "game_title": "Fortnite"
}
```

#### 2. CHAT_MESSAGE
```json
{
    "type": "CHAT_MESSAGE",
    "sender_id": 101,
    "pseudo": "Gamer123",
    "content": "Tu viens jouer ?",
    "timestamp": "2023-11-01T12:10:00Z"
}
```

#### 3. MESSAGE_SENT (Confirmation)
```json
{
    "type": "MESSAGE_SENT",
    "content": "Tu viens jouer ?"
}
```

#### 4. FRIEND_REQUEST
```json
{
    "type": "FRIEND_REQUEST",
    "from": { "id": 55, "pseudo": "NouveauPote" }
}
```

---

## 🛠️ Codes d'erreur WebSocket

*   **4001** : Authentification échouée (Token invalide ou expiré).
