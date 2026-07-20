<template>
  <div class="h-full w-full bg-[#09090b] relative overflow-hidden flex flex-col">
    
    <!-- Window Controls & Drag Region (Buttons provided by Native Overlay) -->
    <div class="flex-shrink-0 h-[60px] w-full z-[9999]" style="-webkit-app-region: drag"></div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-4 relative">

        <!-- Halo décoratif -->
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_35%,rgba(99,102,241,0.13),transparent_70%)]"></div>

        <!-- Register Card -->
        <div class="w-full max-w-sm md:max-w-[440px] relative z-10 rounded-2xl border border-white/10 bg-[#0c0c11]/90 backdrop-blur-xl p-8 space-y-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] animate-fade-in overflow-hidden" style="-webkit-app-region: no-drag">

             <!-- Glow interne -->
             <div class="absolute -top-24 -left-24 w-56 h-56 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

             <!-- Header -->
             <div class="text-center space-y-2 relative z-10">
                 <img src="/logo.webp" alt="JeuxCracks" class="w-16 h-16 mx-auto object-contain drop-shadow-[0_0_22px_rgba(99,102,241,0.4)]" />
                 <h1 class="text-2xl font-black tracking-tighter uppercase bg-gradient-to-r from-white to-indigo-300/70 bg-clip-text text-transparent pt-1">Créer un compte</h1>
                 <p class="text-zinc-500 text-xs">Rejoignez JeuxCracks en quelques secondes.</p>
             </div>

             <!-- Form -->
             <form @submit.prevent="handleRegister" class="space-y-4 relative z-10">
                 <div class="space-y-1.5">
                     <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pseudo</label>
                     <input v-model="form.pseudo" type="text" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-black/60 transition-all outline-none" placeholder="Votre pseudo" required />
                 </div>

                 <div class="space-y-1.5">
                     <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</label>
                     <input v-model="form.email" type="email" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-black/60 transition-all outline-none" placeholder="votre@email.com" required />
                 </div>

                 <!-- Mots de passe -->
                 <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mot de passe</label>
                        <input v-model="form.password" type="password" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-black/60 transition-all outline-none" placeholder="••••••••" required />
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Confirmer</label>
                        <input v-model="form.confirmPassword" type="password" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-black/60 transition-all outline-none" :class="{'!border-red-500/60': passwordMismatch}" placeholder="••••••••" required />
                    </div>
                 </div>

                 <p v-if="passwordMismatch" class="text-red-400 text-[10px] text-center -mt-1">Les mots de passe ne correspondent pas.</p>

                 <div v-if="error" class="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center break-words">
                     {{ error }}
                 </div>

                 <button type="submit" :disabled="loading || passwordMismatch" class="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:shadow-[0_12px_30px_-8px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                     <span v-if="loading" class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                     <span>{{ loading ? 'Création…' : 'S\'inscrire' }}</span>
                 </button>
             </form>

             <!-- Footer -->
             <div class="text-center text-xs text-zinc-600 relative z-10">
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

    // Clear any existing session to prevent "Session Expired" error (401)
    // caused by sending invalid/stale tokens with the register request.
    store.logout();

    loading.value = true;
    error.value = '';
    
    try {

        
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
