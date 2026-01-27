import { createWebHistory, createRouter } from "vue-router";
import Home from "../views/Home.vue";
import Catalog from "../views/catalog/index.vue";
import Game from "../views/catalog/game.vue";
import Contact from "../views/Contact.vue";
import Favorites from "../views/Favorites.vue";
import Library from "../views/Library.vue";
import Settings from "../views/Settings.vue";
import Downloads from "../views/Downloads.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Account from "../views/Account.vue";
import Premium from "../views/Premium.vue";
import DMCA from "../views/DMCA.vue";
import { useMainStore } from '../store'

import ThemeShop from "../views/ThemeShop.vue";

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home,
        meta: { requiresAuth: true }
    },
    {
        path: "/catalogue",
        name: "Catalogue",
        component: Catalog,
        meta: { requiresAuth: true }
    },
    {
        path: "/shop",
        name: "Magasin",
        component: ThemeShop,
        meta: { requiresAuth: true }
    },
    {
        path: "/catalogue/:id",
        name: "Game",
        component: Game,
        meta: { requiresAuth: true }
    },
    {
        path: "/contact",
        name: "Contact",
        component: Contact,
    },
    {
        path: "/favorites",
        name: "Favories",
        component: Favorites,
        meta: { requiresAuth: true }
    },
    {
        path: "/library",
        name: "Bibliothèque",
        component: Library,
        meta: { requiresAuth: true }
    },
    {
        path: "/settings",
        name: "Paramètres",
        component: Settings,
        meta: { requiresAuth: true }
    },
    {
        path: "/downloads",
        name: "Téléchargements",
        component: Downloads,
        meta: { requiresAuth: true }
    },
    {
        path: "/login",
        name: "Login",
        component: Login,
        meta: { requiresGuest: true }
    },
    {
        path: "/register",
        name: "Register",
        component: Register,
        meta: { requiresGuest: true }
    },
    {
        path: "/account",
        name: "Account",
        component: Account,
        meta: { requiresAuth: true }
    },
    {
        path: "/premium",
        name: "Premium",
        component: Premium,
        meta: { requiresAuth: true, title: "Devenir Premium" }
    },
    {
        path: "/dmca",
        name: "DMCA",
        component: DMCA,
        meta: { requiresAuth: true, title: "Politique DMCA" }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const store = useMainStore()
    const isAuthenticated = store.isAuthenticated

    // Pages qui nécessitent une authentification
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' })
        return
    }

    // Pages réservées aux invités (non connectés)
    if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'Home' })
        return
    }

    // Refresh user data periodically or on navigation to critical pages
    if (isAuthenticated) {
        // We catch errors to avoid blocking navigation if API fails
        store.fetchUser().catch(e => console.error('Bg user fetch error', e))
    }

    next()
})

export default router;