<template>
  <div class="h-full w-full bg-[#09090b] relative overflow-hidden flex flex-col">
    
    <!-- Window Controls & Drag Region (Buttons provided by Native Overlay) -->
    <div class="flex-shrink-0 h-[60px] w-full z-[9999]" style="-webkit-app-region: drag"></div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-4">
        
        <!-- Register Card -->
        <div class="w-full max-w-sm md:max-w-[420px] card p-5 space-y-4 animate-fade-in relative overflow-hidden" style="-webkit-app-region: no-drag">
             
             <!-- Background decoration -->
             <div class="absolute top-0 left-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

             <!-- Header (Ultra Compact) -->
             <div class="text-center space-y-1 relative z-10">
                 <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold text-lg mx-auto shadow-lg mb-2">
                     J
                 </div>
                 <h1 class="text-lg font-bold text-white tracking-tight">Créer un compte</h1>
             </div>

             <!-- Form -->
             <form @submit.prevent="handleRegister" class="space-y-3 relative z-10">
                 <div class="space-y-0.5">
                     <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Pseudo</label>
                     <input v-model="form.pseudo" type="text" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="Votre pseudo" required />
                 </div>

                 <div class="space-y-0.5">
                     <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Email</label>
                     <input v-model="form.email" type="email" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="votre@email.com" required />
                 </div>
                 
                 <!-- Grid for Passwords -->
                 <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-0.5">
                        <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Mot de passe</label>
                        <input v-model="form.password" type="password" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" placeholder="••••••••" required />
                    </div>

                    <div class="space-y-0.5">
                        <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Confirmer</label>
                        <input v-model="form.confirmPassword" type="password" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" :class="{'border-red-500': passwordMismatch}" placeholder="••••••••" required />
                    </div>
                 </div>
                 
                 <p v-if="passwordMismatch" class="text-red-500 text-[10px] text-center -mt-1">Les mots de passe ne correspondent pas.</p>

                 <div v-if="error" class="p-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs text-center break-words">
                     {{ error }}
                 </div>

                 <button type="submit" :disabled="loading || passwordMismatch" class="w-full py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-1">
                     <span v-if="loading" class="w-3 h-3 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin"></span>
                     <span>{{ loading ? '...' : 'S\'inscrire' }}</span>
                 </button>
             </form>

             <!-- Footer -->
             <div class="text-center text-[10px] text-zinc-600 relative z-10">
                 Déjà un compte ? <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">Se connecter</router-link>
             </div>

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
