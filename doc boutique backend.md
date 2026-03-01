# 🛒 Backend Boutique — Spécification Technique

## Vue d'ensemble

Système de boutique pour vendre des items cosmétiques (cadres avatar, bannières, effets pseudo, thèmes) via **Stripe Checkout** (paiement unique). Les items sont stockés en base, le paiement est géré par Stripe, et le débloquage se fait via webhook.

---

## Architecture

```
User clique "Acheter"
    → Frontend POST /api/shop/checkout/
    → Backend crée Stripe Checkout Session
    → Redirect vers page Stripe
    → User paie
    → Stripe envoie webhook checkout.session.completed
    → Backend débloque l'item dans UserInventory
    → Frontend refresh l'inventaire
```

---

## 1. Modèles Django

### App : `shop`

```python
# shop/models.py

from django.db import models
from django.conf import settings


class ShopItem(models.Model):
    """Item cosmétique vendable dans la boutique."""

    TYPE_CHOICES = (
        ('avatar_frame', 'Cadre Avatar'),
        ('banner', 'Bannière'),
        ('pseudo_effect', 'Effet Pseudo'),
        ('global_theme', 'Thème Global'),
    )

    RARITY_CHOICES = (
        ('common', 'Commun'),
        ('rare', 'Rare'),
        ('epic', 'Épique'),
        ('legendary', 'Légendaire'),
        ('mythic', 'Mythique'),
    )

    slug = models.SlugField(unique=True, max_length=100)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')

    # Prix
    price_cents = models.PositiveIntegerField(help_text="Prix en centimes (299 = 2,99€)")
    stripe_price_id = models.CharField(max_length=100, blank=True,
        help_text="ID du Price Stripe (price_xxx)")

    # Rendu
    css_class = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    is_css_only = models.BooleanField(default=True)

    # Gestion
    is_active = models.BooleanField(default=True)
    is_new = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['type', 'rarity', 'name']

    def __str__(self):
        return f"[{self.type}] {self.name} ({self.price_cents/100:.2f}€)"

    @property
    def price_display(self):
        return f"{self.price_cents / 100:.2f}€"


class UserInventory(models.Model):
    """Item possédé par un utilisateur."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='inventory',
                             on_delete=models.CASCADE)
    item = models.ForeignKey(ShopItem, related_name='owners', on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'item')
        ordering = ['-purchased_at']

    def __str__(self):
        return f"{self.user} owns {self.item.name}"


class UserEquipment(models.Model):
    """Items actuellement équipés par l'utilisateur."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='equipment',
                                on_delete=models.CASCADE)
    avatar_frame = models.ForeignKey(ShopItem, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+')
    banner = models.ForeignKey(ShopItem, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+')
    pseudo_effect = models.ForeignKey(ShopItem, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+')
    global_theme = models.ForeignKey(ShopItem, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+')

    def __str__(self):
        return f"Equipment de {self.user}"


class ShopTransaction(models.Model):
    """Log de chaque transaction Stripe pour traçabilité."""

    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('completed', 'Complété'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='shop_transactions',
                             on_delete=models.CASCADE)
    item = models.ForeignKey(ShopItem, on_delete=models.CASCADE)
    stripe_session_id = models.CharField(max_length=255, unique=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True)
    amount_cents = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} → {self.item.name} ({self.status})"
```

---

## 2. Serializers

```python
# shop/serializers.py

from rest_framework import serializers
from .models import ShopItem, UserInventory, UserEquipment


class ShopItemSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    owned = serializers.SerializerMethodField()

    class Meta:
        model = ShopItem
        fields = [
            'slug', 'name', 'description', 'type', 'rarity',
            'price', 'price_cents', 'css_class', 'image_url',
            'is_css_only', 'is_new'
        ]

    def get_price(self, obj):
        return obj.price_display

    def get_owned(self, obj):
        user = self.context.get('request')
        if user and user.user.is_authenticated:
            return UserInventory.objects.filter(
                user=user.user, item=obj
            ).exists()
        return False


class UserInventorySerializer(serializers.ModelSerializer):
    item = ShopItemSerializer(read_only=True)

    class Meta:
        model = UserInventory
        fields = ['item', 'purchased_at']


class UserEquipmentSerializer(serializers.ModelSerializer):
    avatar_frame = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    banner = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    pseudo_effect = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    global_theme = serializers.SlugRelatedField(slug_field='slug', read_only=True)

    class Meta:
        model = UserEquipment
        fields = ['avatar_frame', 'banner', 'pseudo_effect', 'global_theme']
```

---

## 3. API Endpoints

### Base URL : `/api/shop/`

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `GET` | `/items/` | ❌ | Liste tous les items actifs |
| `GET` | `/items/<slug>/` | ❌ | Détail d'un item |
| `GET` | `/inventory/` | ✅ | Inventaire du user connecté |
| `GET` | `/equipment/` | ✅ | Items actuellement équipés |
| `POST` | `/equip/` | ✅ | Équiper un item possédé |
| `POST` | `/unequip/` | ✅ | Retirer un item |
| `POST` | `/checkout/` | ✅ | Créer une session Stripe |
| `POST` | `/webhook/` | ❌* | Webhook Stripe |

*Le webhook n'a pas d'auth JWT mais vérifie la signature Stripe.

---

## 4. Vues

```python
# shop/views.py

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import ShopItem, UserInventory, UserEquipment, ShopTransaction
from .serializers import ShopItemSerializer, UserInventorySerializer, UserEquipmentSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY


# ─── Liste des items ───

@api_view(['GET'])
@permission_classes([AllowAny])
def item_list(request):
    """Retourne tous les items actifs de la boutique."""
    items = ShopItem.objects.filter(is_active=True)
    serializer = ShopItemSerializer(items, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def item_detail(request, slug):
    """Détail d'un item."""
    try:
        item = ShopItem.objects.get(slug=slug, is_active=True)
    except ShopItem.DoesNotExist:
        return Response({'error': 'Item introuvable'}, status=404)
    serializer = ShopItemSerializer(item, context={'request': request})
    return Response(serializer.data)


# ─── Inventaire & Équipement ───

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_inventory(request):
    """Retourne l'inventaire du user connecté."""
    inventory = UserInventory.objects.filter(user=request.user).select_related('item')
    serializer = UserInventorySerializer(inventory, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_equipment(request):
    """Retourne l'équipement actuel du user."""
    equip, _ = UserEquipment.objects.get_or_create(user=request.user)
    serializer = UserEquipmentSerializer(equip)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def equip_item(request):
    """Équiper un item possédé. Body: { "slug": "frame_neon_blue" }"""
    slug = request.data.get('slug')
    if not slug:
        return Response({'error': 'slug requis'}, status=400)

    # Vérifier possession
    try:
        inv = UserInventory.objects.get(user=request.user, item__slug=slug)
    except UserInventory.DoesNotExist:
        return Response({'error': 'Item non possédé'}, status=403)

    item = inv.item
    equip, _ = UserEquipment.objects.get_or_create(user=request.user)

    if item.type == 'avatar_frame':
        equip.avatar_frame = item
    elif item.type == 'banner':
        equip.banner = item
    elif item.type == 'pseudo_effect':
        equip.pseudo_effect = item
    elif item.type == 'global_theme':
        equip.global_theme = item

    equip.save()
    return Response({'status': 'equipped', 'type': item.type, 'slug': slug})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unequip_item(request):
    """Retirer un item. Body: { "type": "avatar_frame" }"""
    item_type = request.data.get('type')
    valid_types = ['avatar_frame', 'banner', 'pseudo_effect']
    if item_type not in valid_types:
        return Response({'error': f'Type invalide. Valide: {valid_types}'}, status=400)

    equip, _ = UserEquipment.objects.get_or_create(user=request.user)
    setattr(equip, item_type, None)
    equip.save()
    return Response({'status': 'unequipped', 'type': item_type})


# ─── Checkout Stripe ───

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout(request):
    """Créer une session Stripe Checkout. Body: { "slug": "frame_neon_blue" }"""
    slug = request.data.get('slug')
    if not slug:
        return Response({'error': 'slug requis'}, status=400)

    try:
        item = ShopItem.objects.get(slug=slug, is_active=True)
    except ShopItem.DoesNotExist:
        return Response({'error': 'Item introuvable'}, status=404)

    # Vérifier si déjà possédé
    if UserInventory.objects.filter(user=request.user, item=item).exists():
        return Response({'error': 'Item déjà possédé'}, status=400)

    # Vérifier que le prix Stripe existe
    if not item.stripe_price_id:
        return Response({'error': 'Item non disponible à la vente'}, status=400)

    # Créer la session Stripe
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price': item.stripe_price_id,
            'quantity': 1,
        }],
        mode='payment',
        success_url=settings.SHOP_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url=settings.SHOP_CANCEL_URL,
        client_reference_id=str(request.user.id),
        metadata={
            'item_slug': item.slug,
            'user_id': str(request.user.id),
        }
    )

    # Logger la transaction
    ShopTransaction.objects.create(
        user=request.user,
        item=item,
        stripe_session_id=session.id,
        amount_cents=item.price_cents,
        status='pending'
    )

    return Response({'checkout_url': session.url, 'session_id': session.id})


# ─── Webhook Stripe ───

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_shop_webhook(request):
    """Webhook appelé par Stripe après paiement."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_SHOP_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        _handle_successful_payment(session)

    return HttpResponse(status=200)


def _handle_successful_payment(session):
    """Traite un paiement réussi : débloque l'item."""
    user_id = session.get('client_reference_id')
    item_slug = session.get('metadata', {}).get('item_slug')

    if not user_id or not item_slug:
        return

    try:
        item = ShopItem.objects.get(slug=item_slug)
    except ShopItem.DoesNotExist:
        return

    # Débloquer l'item (idempotent)
    UserInventory.objects.get_or_create(user_id=user_id, item=item)

    # Mettre à jour la transaction
    ShopTransaction.objects.filter(
        stripe_session_id=session['id']
    ).update(
        status='completed',
        stripe_payment_intent=session.get('payment_intent', ''),
        completed_at=timezone.now()
    )
```

---

## 5. URLs

```python
# shop/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Catalogue public
    path('items/', views.item_list, name='shop-items'),
    path('items/<slug:slug>/', views.item_detail, name='shop-item-detail'),

    # User (auth requise)
    path('inventory/', views.user_inventory, name='shop-inventory'),
    path('equipment/', views.user_equipment, name='shop-equipment'),
    path('equip/', views.equip_item, name='shop-equip'),
    path('unequip/', views.unequip_item, name='shop-unequip'),

    # Stripe
    path('checkout/', views.create_checkout, name='shop-checkout'),
    path('webhook/', views.stripe_shop_webhook, name='shop-webhook'),
]

# Dans urls.py principal :
# path('api/shop/', include('shop.urls')),
```


---

## 7. Admin Django

```python
# shop/admin.py

from django.contrib import admin
from .models import ShopItem, UserInventory, UserEquipment, ShopTransaction


@admin.register(ShopItem)
class ShopItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'rarity', 'price_display', 'is_active', 'is_new']
    list_filter = ['type', 'rarity', 'is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(UserInventory)
class UserInventoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'item', 'purchased_at']
    list_filter = ['item__type']
    search_fields = ['user__email', 'item__name']


@admin.register(ShopTransaction)
class ShopTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'item', 'amount_cents', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['user__email', 'stripe_session_id']
    readonly_fields = ['stripe_session_id', 'stripe_payment_intent']
```

---

## 8. Créer les produits Stripe

### Via Dashboard Stripe :
1. Aller sur **Products** → **Add Product**
2. Pour chaque item :
   - **Name** : `Cadre Néon Pulse`
   - **Price** : `2.99 EUR` → **One time**
3. Copier le **Price ID** (`price_1Nxxxx...`) dans le champ `stripe_price_id` de l'item en DB

### Via API (optionnel) :
```python
product = stripe.Product.create(name="Cadre Néon Pulse")
price = stripe.Price.create(
    product=product.id,
    unit_amount=299,
    currency='eur',
)
# Stocker price.id dans ShopItem.stripe_price_id
```

---

## 9. Commande de setup webhook

```bash
# En dev, pour tester les webhooks localement :
stripe listen --forward-to localhost:8000/api/shop/webhook/

# Le secret affiché (whsec_xxx) → mettre dans STRIPE_SHOP_WEBHOOK_SECRET
```

---

## 10. Points de sécurité

| Règle | Détail |
|-------|--------|
| **Jamais côté client** | Le débloquage se fait UNIQUEMENT via webhook, jamais depuis le frontend |
| **Signature webhook** | Toujours vérifier `stripe.Webhook.construct_event` |
| **Idempotence** | `get_or_create` empêche les doublons si le webhook arrive 2+ fois |
| **CSRF exempt** | Le webhook doit être `@csrf_exempt` (Stripe ne peut pas envoyer de token CSRF) |
| **HTTPS obligatoire** | Le webhook doit être en HTTPS en production |
| **Pas de prix frontend** | Le prix est dans Stripe et en DB, jamais envoyé par le client |

---

## 11. Réponses API — Exemples

### GET /api/shop/items/
```json
[
    {
        "slug": "frame_neon_blue",
        "name": "Néon Pulse",
        "description": "Un anneau néon bleu qui pulse.",
        "type": "avatar_frame",
        "rarity": "common",
        "price": "2.99€",
        "price_cents": 299,
        "css_class": "frame-neon-blue",
        "image_url": "",
        "is_css_only": true,
        "is_new": false,
        "owned": false
    }
]
```

### POST /api/shop/checkout/
```json
// Request
{ "slug": "frame_neon_blue" }

// Response 200
{ "checkout_url": "https://checkout.stripe.com/c/pay/cs_xxx", "session_id": "cs_xxx" }

// Response 400 (déjà possédé)
{ "error": "Item déjà possédé" }
```

### GET /api/shop/inventory/
```json
[
    {
        "item": {
            "slug": "frame_neon_blue",
            "name": "Néon Pulse",
            "type": "avatar_frame",
            "rarity": "common",
            "css_class": "frame-neon-blue"
        },
        "purchased_at": "2026-03-01T05:30:00Z"
    }
]
```

### GET /api/shop/equipment/
```json
{
    "avatar_frame": "frame_neon_blue",
    "banner": null,
    "pseudo_effect": null,
    "global_theme": "theme_default"
}
```

### POST /api/shop/equip/
```json
// Request
{ "slug": "frame_neon_blue" }

// Response
{ "status": "equipped", "type": "avatar_frame", "slug": "frame_neon_blue" }
```
