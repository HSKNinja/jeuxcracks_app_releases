## 📬 C. Inbox (Notifications)

#### 1. Récupérer les notifications non lues
*   **GET** `/inbox/unread/`
*   **Description** : Récupère les notifications non lues (pastille rouge).
*   **Réponse (200 OK)** :
    ```json
    {
        "count": 3,
        "notifications": [
            {
                "id": 42,
                "title": "Mise à jour disponible",
                "message": "Le jeu X a été mis à jour !",
                "link": "game://248",
                "type": "UPDATE",
                "is_read": false,
                "created_at": "2026-02-08T12:00:00Z"
            }
        ]
    }
    ```

#### 2. Récupérer toutes les notifications
*   **GET** `/inbox/all/`
*   **Description** : Récupère les 50 dernières notifications (lues et non lues).

#### 3. Marquer comme lu
*   **POST** `/inbox/mark-read/`
*   **Body** : `{ "notification_ids": [42, 43] }` (optionnel, si vide marque toutes)
*   **Réponse** : `{ "status": "2 notifications marked as read" }`

#### 4. Supprimer une notification
*   **DELETE** `/inbox/{id}/delete/`
*   **Réponse** : `{ "status": "Notification deleted" }`

#### 5. Créer une notification (Admin)
*   **POST** `/inbox/create_notification/`
*   **Body** :
    ```json
    {
        "user_id": 123,
        "title": "Mise à jour disponible",
        "message": "Le jeu X a été mis à jour !",
        "link": "game://248",
        "type": "UPDATE"
    }
    ```
*   **Réponse (201)** : Objet notification créé.

#### 6. Broadcast à tous les utilisateurs (Admin)
*   **POST** `/inbox/broadcast/`
*   **Body** : `{ "title": "...", "message": "...", "link": "...", "type": "PROMO" }`
*   **Réponse** : `{ "status": "1500 notifications sent" }`

**Types de notifications** : `UPDATE`, `PROMO`, `SYSTEM`, `SOCIAL`