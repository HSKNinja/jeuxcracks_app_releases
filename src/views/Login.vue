<template>
  <div class="h-full w-full bg-[#09090b] flex items-center justify-center p-4">
    
    <!-- Window Controls & Drag Region -->
    <div class="absolute top-0 left-0 w-full h-12 flex justify-end items-center px-4 z-[9999]" style="-webkit-app-region: drag">
        <div class="flex gap-2" style="-webkit-app-region: no-drag">
             <button @click="minimize" class="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
                <MinusIcon class="w-5 h-5" />
             </button>
             <button @click="maximize" class="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
                <Square2StackIcon class="w-4 h-4" />
             </button>
             <button @click="close" class="p-2 text-zinc-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer">
                <XMarkIcon class="w-5 h-5" />
             </button>
        </div>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-md card p-8 space-y-8 animate-fade-in relative overflow-hidden" style="-webkit-app-region: no-drag">
         
         <!-- Background decoration -->
         <div class="absolute top-0 right-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

         <!-- Header -->
         <div class="text-center space-y-2 relative z-10">
             <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-2xl mx-auto shadow-lg mb-4">
                 J
             </div>
             <h1 class="text-2xl font-bold text-white tracking-tight">Bienvenue</h1>
             <p class="text-zinc-500 text-sm">Connectez-vous pour accéder à votre bibliothèque.</p>
         </div>

         <!-- Form -->
         <form @submit.prevent="handleLogin" class="space-y-4 relative z-10">
             <div class="space-y-1">
                 <label class="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email ou Pseudo</label>
                 <input v-model="form.username" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="Entrez votre identifiant" required />
             </div>
             
             <div class="space-y-1">
                 <label class="text-xs font-bold text-zinc-400 uppercase tracking-wide">Mot de passe</label>
                 <input v-model="form.password" type="password" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="••••••••" required />
             </div>

             <div v-if="error" class="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center break-words">
                 {{ error }}
             </div>

             <button type="submit" :disabled="loading" class="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                 <span v-if="loading" class="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></span>
                 <span>{{ loading ? 'Connexion en cours...' : 'Se connecter' }}</span>
             </button>
         </form>

         <!-- Footer -->
         <div class="text-center text-xs text-zinc-600 relative z-10">
             Pas encore de compte ? <router-link to="/register" class="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">Créer un compte</router-link>
         </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '../store';
import { useFetch } from '../utils/useFetch';
import { API_CONFIG } from '../config/api';
import { MinusIcon, XMarkIcon, Square2StackIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const store = useMainStore();

const form = ref({ username: '', password: '' });
const loading = ref(false);
const error = ref('');

const minimize = () => { console.log('min'); window.electronAPI?.minimize(); };
const maximize = () => { console.log('max'); window.electronAPI?.maximize(); };
const close = () => { console.log('close'); window.electronAPI?.close(); };

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    
    // Clear old tokens strictly before attempting
    store.logout();

    try {
        console.log('Attempting login with:', form.value.username);
        // 1. Get Tokens (Using TOKEN endpoint instead of LOGIN)
        // This is usually safer for JWT authentication
        // Fix: Server expects 'email', not 'username'
        const tokens = await useFetch(API_CONFIG.ENDPOINTS.AUTH.TOKEN, 'POST', {
            email: form.value.username,
            password: form.value.password
        });
        
        console.log('Tokens received:', tokens);

        if (tokens && tokens.access) {
            store.setTokens(tokens);
            
            // 2. Get User Profile
            const user = await useFetch(API_CONFIG.ENDPOINTS.AUTH.USER_ME);
            console.log('User received:', user);
            
            // 3. Save to Store
            store.login({ user, tokens });
            
            router.push('/');
        } else {
            console.error('No access token in response:', tokens);
            throw new Error(tokens.detail || JSON.stringify(tokens) || 'Réponse invalide du serveur');
        }

    } catch (e: any) {
        console.error('Login error:', e);
        // Prioritize detailed messages from the server
        if (e.detail) {
             error.value = e.detail;
        } else if (e.data && e.data.detail) {
             error.value = e.data.detail;
        } else if (e.data && e.data.message) {
             error.value = e.data.message;
        } else if (e.message && e.message.includes('HTTP')) {
             // Fallback to generic HTTP error if no specific detail
             error.value = `Erreur de connexion (${e.message})`;
        } else {
             error.value = e.message || JSON.stringify(e);
        }
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
