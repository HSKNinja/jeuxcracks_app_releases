<template>
  <div class="h-full w-full bg-[#09090b] relative overflow-hidden flex flex-col">
    
    <!-- Window Controls & Drag Region (Buttons provided by Native Overlay) -->
    <div class="flex-shrink-0 h-[60px] w-full z-[9999]" style="-webkit-app-region: drag"></div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-4">

        <!-- Login Card -->
        <div class="w-full max-w-sm md:max-w-[400px] card p-6 space-y-4 animate-fade-in relative overflow-hidden" style="-webkit-app-region: no-drag">
             
             <!-- Background decoration -->
             <div class="absolute top-0 right-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

             <!-- Header -->
             <div class="text-center space-y-1 relative z-10">
                 <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-bold text-xl mx-auto shadow-lg mb-3">
                     J
                 </div>
                 <h1 class="text-xl font-bold text-white tracking-tight">Bienvenue</h1>
                 <p class="text-zinc-500 text-xs">Connectez-vous pour accéder à votre bibliothèque.</p>
             </div>

             <!-- Form -->
             <form @submit.prevent="handleLogin" class="space-y-3 relative z-10">
                 <div class="space-y-1">
                     <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email ou Pseudo</label>
                     <input v-model="form.username" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="Entrez votre identifiant" required />
                 </div>
                 
                 <div class="space-y-1">
                     <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Mot de passe</label>
                     <input v-model="form.password" type="password" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="••••••••" required />
                 </div>

                 <div v-if="error" class="p-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs text-center break-words">
                     {{ error }}
                 </div>

                 <button type="submit" :disabled="loading" class="w-full py-2.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                     <span v-if="loading" class="w-3 h-3 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></span>
                     <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
                 </button>
             </form>

             <!-- Footer -->
             <div class="text-center text-xs text-zinc-600 relative z-10">
                 Pas encore de compte ? <router-link to="/register" class="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">Créer un compte</router-link>
             </div>

        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '../store';
import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();
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
        let msg = 'Une erreur est survenue lors de la connexion.';
        
        // Prioritize detailed messages from the server
        if (e.detail) {
             msg = e.detail;
        } else if (e.data && e.data.detail) {
             msg = e.data.detail;
        } else if (e.data && e.data.message) {
             msg = e.data.message;
        } else if (e.message && e.message.includes('401')) {
             msg = 'Identifiants incorrects.';
        } else if (e.message && e.message.includes('HTTP')) {
             msg = `Erreur de connexion (${e.message})`;
        }
        
        notify({ type: 'error', title: 'Erreur de connexion', text: msg });
        error.value = msg; // Keep inline for accessibility/visibility
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
