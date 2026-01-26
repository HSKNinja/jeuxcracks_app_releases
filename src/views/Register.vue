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

    <!-- Register Card -->
    <div class="w-full max-w-md card p-8 space-y-6 animate-fade-in relative overflow-hidden" style="-webkit-app-region: no-drag">
         
         <!-- Background decoration -->
         <div class="absolute top-0 left-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

         <!-- Header -->
         <div class="text-center space-y-2 relative z-10">
             <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-2xl mx-auto shadow-lg mb-4">
                 J
             </div>
             <h1 class="text-2xl font-bold text-white tracking-tight">Créer un compte</h1>
             <p class="text-zinc-500 text-sm">Rejoignez la communauté JeuxCracks.</p>
         </div>

         <!-- Form -->
         <form @submit.prevent="handleRegister" class="space-y-4 relative z-10">
             <div class="space-y-1">
                 <label class="text-xs font-bold text-zinc-400 uppercase tracking-wide">Pseudo</label>
                 <input v-model="form.pseudo" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="Votre pseudo" required />
             </div>

             <div class="space-y-1">
                 <label class="text-xs font-bold text-zinc-400 uppercase tracking-wide">Email</label>
                 <input v-model="form.email" type="email" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="votre@email.com" required />
             </div>
             
             <div class="space-y-1">
                 <label class="text-xs font-bold text-zinc-400 uppercase tracking-wide">Mot de passe</label>
                 <input v-model="form.password" type="password" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="••••••••" required />
             </div>

             <div class="space-y-1">
                 <label class="text-xs font-bold text-zinc-400 uppercase tracking-wide">Confirmer le mot de passe</label>
                 <input v-model="form.confirmPassword" type="password" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" :class="{'border-red-500': passwordMismatch}" placeholder="••••••••" required />
                 <p v-if="passwordMismatch" class="text-red-500 text-xs">Les mots de passe ne correspondent pas.</p>
             </div>

             <div v-if="error" class="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center break-words">
                 {{ error }}
             </div>

             <button type="submit" :disabled="loading || passwordMismatch" class="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                 <span v-if="loading" class="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></span>
                 <span>{{ loading ? 'Inscription en cours...' : 'S\'inscrire' }}</span>
             </button>
         </form>

         <!-- Footer -->
         <div class="text-center text-xs text-zinc-600 relative z-10">
             Déjà un compte ? <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">Se connecter</router-link>
         </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '../store';
import { JeuxCracksAPI } from '../services/api';
import { useNotification } from '@kyvg/vue3-notification';
import { MinusIcon, XMarkIcon, Square2StackIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const store = useMainStore();
const { notify } = useNotification();

const form = ref({ 
    pseudo: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
});
const loading = ref(false);
const error = ref('');

const passwordMismatch = computed(() => {
    return form.value.password && form.value.confirmPassword && form.value.password !== form.value.confirmPassword;
});

const minimize = () => { window.electronAPI?.minimize(); };
const maximize = () => { window.electronAPI?.maximize(); };
const close = () => { window.electronAPI?.close(); };

const handleRegister = async () => {
    if (passwordMismatch.value) return;

    loading.value = true;
    error.value = '';
    
    try {
        console.log('Attempting register with:', form.value.email);
        
        // Call the API service
        const { user, tokens } = await JeuxCracksAPI.register(
            form.value.email,
            form.value.password,
            form.value.pseudo
        );

        if (tokens && tokens.access) {
            store.setTokens(tokens);
            // We already get 'user' from register (which calls login internally)
            // But let's ensure we save it
            store.login({ user, tokens });
            router.push('/');
        } else {
             throw new Error('Inscription réussie mais pas de token reçu.');
        }

    } catch (e: any) {
        console.error('Register error:', e);
        let msg = 'Une erreur est survenue lors de l\'inscription.';

        if (e.detail) {
             msg = typeof e.detail === 'object' ? JSON.stringify(e.detail) : e.detail;
        } else if (e.data) {
             // Handle Validation Errors like { email: ["Mandatory"], ... }
             const errors = [];
             for (const [key, val] of Object.entries(e.data)) {
                 if (Array.isArray(val)) {
                     errors.push(`${key}: ${val.join(' ')}`);
                 } else {
                     errors.push(`${key}: ${val}`);
                 }
             }
             msg = errors.length > 0 ? errors.join('\n') : JSON.stringify(e.data);
        } else if (e.message) {
             msg = e.message;
        }

        notify({ type: 'error', title: 'Erreur d\'inscription', text: msg });
        error.value = msg;
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
