<template>
  <div class="min-h-full p-4 md:p-8 xl:p-12 pb-24 relative overflow-hidden flex flex-col items-center">
    
    <!-- Background Effects -->
    <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="loading" class="flex-1 flex items-center justify-center relative z-10">
        <div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>

    <template v-else>

    <!-- ACTIVE SUBSCRIPTION BANNER -->
    <div v-if="subscription && subscription.status !== 'none'" class="w-full max-w-7xl mx-auto mb-8 relative z-10">
        <div class="rounded-2xl border p-6"
             :class="subscription.plan?.plan_type === 'pro' 
                ? 'bg-amber-500/5 border-amber-500/20' 
                : 'bg-indigo-500/5 border-indigo-500/20'">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                         :class="subscription.plan?.plan_type === 'pro' ? 'bg-amber-500/10' : 'bg-indigo-500/10'">
                        <SparklesIcon class="w-6 h-6" :class="subscription.plan?.plan_type === 'pro' ? 'text-amber-400' : 'text-indigo-400'" />
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white flex items-center gap-2">
                            {{ subscription.plan?.name }}
                            <span v-if="subscription.cancel_at_period_end" class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Annulation prévue</span>
                            <span v-else-if="subscription.status === 'past_due'" class="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Paiement en retard</span>
                            <span v-else class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Actif</span>
                        </h3>
                        <p class="text-sm text-zinc-400">
                            Prochain renouvellement : <span class="text-white font-medium">{{ formatDate(subscription.current_period_end) }}</span>
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button v-if="subscription.cancel_at_period_end" 
                            @click="reactivate" 
                            :disabled="actionLoading"
                            class="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50">
                        Réactiver
                    </button>
                    <button v-else 
                            @click="showCancelModal = true"
                            :disabled="actionLoading"
                            class="px-5 py-2.5 bg-zinc-800 hover:bg-red-600/80 text-zinc-400 hover:text-white font-bold rounded-xl text-sm transition-all border border-white/5 disabled:opacity-50">
                        Annuler l'abonnement
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- HERO SECTION -->
    <div class="relative z-10 text-center space-y-4 max-w-4xl mx-auto mb-10 md:mb-16">
      <h1 class="text-4xl md:text-6xl font-black text-white tracking-tight">
        Passez au niveau <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600">Supérieur</span>
      </h1>
      <p class="text-lg text-zinc-400 max-w-2xl mx-auto">
        Choisissez le plan qui correspond à vos besoins. Annulable à tout moment.
      </p>

      <!-- Billing Toggle -->
      <div class="flex items-center justify-center mt-6 bg-zinc-900 rounded-xl p-1 border border-white/5">
        <button v-for="bp in billingOptions" :key="bp.id"
                @click="billingPeriod = bp.id"
                class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
                :class="billingPeriod === bp.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'">
            {{ bp.label }}
            <span v-if="bp.badge" class="text-emerald-400 text-[10px] ml-1">{{ bp.badge }}</span>
        </button>
      </div>
    </div>

    <!-- PRICING GRIDS -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto relative z-10 w-full">
        
        <!-- PLAN 1: GRATUIT -->
        <div class="relative p-8 rounded-3xl bg-[#0a0a0a] border border-zinc-800 flex flex-col transition-transform duration-300 hover:-translate-y-2">
            <h3 class="text-xl font-bold text-zinc-400 mb-2">Gratuit</h3>
            <div class="flex items-baseline gap-1 mb-6">
                <span class="text-4xl font-black text-white">0€</span>
                <span class="text-sm text-zinc-500">/mois</span>
            </div>
            
            <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-zinc-600 shrink-0" />
                    Accès au catalogue
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-zinc-600 shrink-0" />
                    3 jeux dans la bibliothèque
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-zinc-600 shrink-0" />
                    Vitesse 5 MB/s
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-500">
                    <XMarkIcon class="w-5 h-5 text-zinc-700 shrink-0" />
                    Sauvegarde Cloud
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-500">
                    <XMarkIcon class="w-5 h-5 text-zinc-700 shrink-0" />
                    Support Prioritaire
                </li>
            </ul>

            <button v-if="!subscription || subscription.status === 'none'" 
                    class="w-full py-3 rounded-xl bg-zinc-800 text-zinc-500 font-bold text-sm border border-zinc-700 cursor-default">
                Plan Actuel
            </button>
            <button v-else 
                    @click="handleDowngrade(null)"
                    class="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 transition-colors">
                Passer au Gratuit
            </button>
        </div>

        <!-- PLAN 2: BASIC (POPULAIRE) -->
        <div class="relative p-8 rounded-3xl bg-[#0f0f0f] border border-indigo-500/50 flex flex-col transform md:-translate-y-4 shadow-2xl shadow-indigo-900/10">
            <!-- Badge -->
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                Populaire
            </div>

            <h3 class="text-xl font-bold text-indigo-400 mb-2">Premium Basic</h3>
            <div class="flex items-baseline gap-1 mb-6">
                <span class="text-5xl font-black text-white">{{ prices.basic[billingPeriod] }}€</span>
                <span class="text-sm text-zinc-500">{{ periodLabel }}</span>
            </div>
            
            <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-start gap-3 text-sm text-white font-medium">
                    <CheckCircleIcon class="w-5 h-5 text-indigo-500 shrink-0" />
                    Tout du plan Gratuit
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-white shrink-0" />
                    15 jeux dans la bibliothèque
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-white shrink-0" />
                    Vitesse 25 MB/s
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-white shrink-0" />
                    Pas de publicités
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-white shrink-0" />
                    Accès aux nouveautés
                </li>
            </ul>

            <button @click="handlePlanAction('basic')" 
                    :disabled="actionLoading"
                    class="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50"
                    :class="getButtonClass('basic')">
                {{ getButtonLabel('basic') }}
            </button>
        </div>

        <!-- PLAN 3: PRO -->
        <div class="relative p-8 rounded-3xl bg-[#0a0a0a] border border-amber-500/30 flex flex-col transition-transform duration-300 hover:-translate-y-2 group">
            <h3 class="text-xl font-bold text-amber-500 mb-2 group-hover:text-amber-400 transition-colors">Premium Pro</h3>
            <div class="flex items-baseline gap-1 mb-6">
                <span class="text-4xl font-black text-white">{{ prices.pro[billingPeriod] }}€</span>
                <span class="text-sm text-zinc-500">{{ periodLabel }}</span>
            </div>
            
            <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-start gap-3 text-sm text-white font-medium">
                    <CheckCircleIcon class="w-5 h-5 text-amber-500 shrink-0" />
                    Tout du plan Basic
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-amber-500 shrink-0" />
                    Bibliothèque <span class="text-white font-bold">Illimitée</span>
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-amber-500 shrink-0" />
                    Vitesse <span class="text-white font-bold">Illimitée</span>
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-amber-500 shrink-0" />
                    Support VIP 24/7
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-amber-500 shrink-0" />
                    Sauvegarde Cloud
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-amber-500 shrink-0" />
                    Contenu Exclusif
                </li>
            </ul>

            <button @click="handlePlanAction('pro')" 
                    :disabled="actionLoading"
                    class="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50"
                    :class="getButtonClass('pro')">
                {{ getButtonLabel('pro') }}
            </button>
        </div>

    </div>
    <!-- End Grid -->

    <!-- ===== MONTHLY GOAL + DONATIONS ===== -->
    <div class="w-full max-w-7xl mx-auto mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- LEFT: FUNDING GOAL (3 cols) -->
        <div class="lg:col-span-3">
            <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 relative overflow-hidden h-full">
                <!-- Background Glow -->
                <div class="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <h3 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <BanknotesIcon class="w-6 h-6 text-green-400" />
                    Objectif du Mois
                </h3>
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-xs font-bold px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                        {{ monthStartDate }} → {{ monthEndDate }}
                    </span>
                </div>
                <p class="text-zinc-400 text-sm mb-6">
                    L'argent des abonnements et des dons sert à payer les serveurs et les nouveaux cracks.
                    <span class="text-white font-bold">Tout est réinvesti.</span>
                </p>

                <!-- Progress Bar -->
                <div class="mb-2 flex justify-between text-sm font-bold">
                    <span class="text-white">{{ revenue.total?.toFixed(2) || '0.00' }}€ récoltés</span>
                    <span class="text-zinc-500">Objectif: {{ monthlyGoal.toFixed(2) }}€</span>
                </div>
                <div class="h-4 bg-zinc-800 rounded-full overflow-hidden relative mb-4">
                    <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000" 
                         :style="{ width: revenueProgress + '%' }">
                        <div class="absolute inset-0 bg-white/20 animate-pulse-fast"></div>
                    </div>
                </div>

                <!-- Stats breakdown -->
                <div class="grid grid-cols-2 gap-4 mt-6">
                    <div class="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                        <div class="text-xs text-zinc-500 font-bold uppercase mb-1">Abonnements</div>
                        <div class="text-xl font-black text-white">{{ revenue.subscriptions_total?.toFixed(2) || '0.00' }}€</div>
                        <div class="text-xs text-zinc-500">{{ revenue.subscriptions_count || 0 }} abonnés</div>
                    </div>
                    <div class="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                        <div class="text-xs text-zinc-500 font-bold uppercase mb-1">Dons</div>
                        <div class="text-xl font-black text-white">{{ revenue.donations_total?.toFixed(2) || '0.00' }}€</div>
                        <div class="text-xs text-zinc-500">{{ revenue.donations_count || 0 }} donateurs</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT: DONATION FORM (2 cols) -->
        <div class="lg:col-span-2">
            <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 h-full flex flex-col">
                <h3 class="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <HeartIcon class="w-5 h-5 text-pink-400" />
                    Faire un don
                </h3>
                <p class="text-xs text-zinc-500 mb-6">Soutenez le projet sans engagement. Minimum 1€.</p>

                <!-- Quick amounts -->
                <div class="grid grid-cols-4 gap-2 mb-4">
                    <button v-for="amt in [2, 5, 10, 20]" :key="amt"
                            @click="donationAmount = amt"
                            class="py-2 rounded-xl text-sm font-bold transition-all border"
                            :class="donationAmount === amt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20'">
                        {{ amt }}€
                    </button>
                </div>

                <!-- Custom amount -->
                <div class="relative mb-4">
                    <input v-model.number="donationAmount" 
                           type="number" 
                           min="1" step="1"
                           placeholder="Montant (€)"
                           class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors pr-10" />
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">€</span>
                </div>

                <!-- Message -->
                <textarea v-model="donationMessage" 
                          placeholder="Un petit message ? (optionnel)"
                          maxlength="500"
                          rows="2"
                          class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none mb-4"></textarea>

                <!-- Submit -->
                <button @click="submitDonation" 
                        :disabled="!donationAmount || donationAmount < 1 || actionLoading"
                        class="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-pink-500/10 disabled:opacity-40 disabled:cursor-not-allowed mt-auto">
                    <span v-if="actionLoading" class="flex items-center justify-center gap-2">
                        <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Redirection...
                    </span>
                    <span v-else>Donner {{ donationAmount || 0 }}€ ❤️</span>
                </button>
            </div>
        </div>

    </div>

    <!-- ===== DONATIONS HISTORY ===== -->
    <div v-if="donations.length > 0" class="w-full max-w-7xl mx-auto mt-12 relative z-10">
        <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8">
            <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <GiftIcon class="w-5 h-5 text-pink-400" />
                Derniers dons de la communauté
            </h3>
            <div class="space-y-3">
                <div v-for="d in donations.slice(0, 10)" :key="d.id"
                     class="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                            <HeartIcon class="w-4 h-4 text-pink-400" />
                        </div>
                        <div>
                            <span class="text-white font-bold text-sm">{{ d.username || 'Anonyme' }}</span>
                            <p v-if="d.message" class="text-xs text-zinc-500 mt-0.5 max-w-md truncate">« {{ d.message }} »</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-white font-bold text-sm">{{ d.amount_formatted }}</div>
                        <div class="text-xs text-zinc-600">{{ formatDate(d.created_at) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== INVOICES HISTORY ===== -->
    <div v-if="invoices.length > 0" class="w-full max-w-7xl mx-auto mt-12 relative z-10">
        <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8">
            <button @click="showInvoices = !showInvoices" class="w-full flex items-center justify-between">
                <h3 class="text-xl font-bold text-white flex items-center gap-2">
                    <DocumentTextIcon class="w-5 h-5 text-zinc-400" />
                    Mes factures
                </h3>
                <ChevronDownIcon class="w-5 h-5 text-zinc-500 transition-transform" :class="showInvoices ? 'rotate-180' : ''" />
            </button>
            <div v-if="showInvoices" class="mt-6 space-y-2">
                <div v-for="inv in invoices" :key="inv.id"
                     class="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                    <div>
                        <span class="text-white font-medium text-sm">{{ inv.amount_formatted }}</span>
                        <span class="text-xs text-zinc-500 ml-3">{{ formatDate(inv.created_at) }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs px-2 py-0.5 rounded-full font-bold"
                              :class="inv.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'">
                            {{ inv.status === 'paid' ? 'Payée' : inv.status }}
                        </span>
                        <a v-if="inv.invoice_url" :href="inv.invoice_url" target="_blank"
                           class="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors">
                            PDF ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    </template>

    <!-- CANCEL MODAL -->
    <Teleport to="body">
        <div v-if="showCancelModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" @click.self="showCancelModal = false">
            <div class="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
                <h3 class="text-xl font-bold text-white mb-2">Annuler l'abonnement ?</h3>
                <p class="text-sm text-zinc-400 mb-6">
                    Votre abonnement restera actif jusqu'à la fin de la période en cours 
                    (<span class="text-white font-medium">{{ formatDate(subscription?.current_period_end) }}</span>).
                </p>
                
                <label class="flex items-center gap-3 text-sm text-zinc-300 mb-6 cursor-pointer select-none">
                    <input type="checkbox" v-model="cancelImmediately" class="accent-red-500 w-4 h-4" />
                    Annuler immédiatement (pas de remboursement)
                </label>

                <div class="flex gap-3">
                    <button @click="showCancelModal = false"
                            class="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm border border-white/5 hover:bg-zinc-700 transition-colors">
                        Garder
                    </button>
                    <button @click="cancelSubscription"
                            :disabled="actionLoading"
                            class="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all disabled:opacity-50">
                        {{ actionLoading ? 'En cours...' : 'Confirmer' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CheckIcon, CheckCircleIcon, XMarkIcon, BanknotesIcon, SparklesIcon, HeartIcon, GiftIcon, ChevronDownIcon, DocumentTextIcon } from '@heroicons/vue/24/solid';
import { JeuxCracksAPI } from '../services/api';
import { useNotification } from '@kyvg/vue3-notification';

const { notify } = useNotification();

// --- State ---
const loading = ref(true);
const actionLoading = ref(false);
const billingPeriod = ref<'monthly' | 'quarterly' | 'yearly'>('monthly');

const billingOptions = [
    { id: 'monthly' as const, label: 'Mensuel' },
    { id: 'quarterly' as const, label: 'Trimestriel', badge: '-5%' },
    { id: 'yearly' as const, label: 'Annuel', badge: '-7%' },
];

const prices: Record<string, Record<string, string>> = {
    basic: { monthly: '2,99', quarterly: '8,50', yearly: '33,50' },
    pro:   { monthly: '4,99', quarterly: '13,50', yearly: '58,50' },
};

const periodLabel = computed(() => {
    const labels: Record<string, string> = { monthly: '/mois', quarterly: '/trimestre', yearly: '/an' };
    return labels[billingPeriod.value];
});

// API Data
const plans = ref<any[]>([]);
const subscription = ref<any>(null);
const revenue = ref<any>({});
const donations = ref<any[]>([]);
const invoices = ref<any[]>([]);

// Donation form
const donationAmount = ref<number>(5);
const donationMessage = ref('');

// UI State
const showCancelModal = ref(false);
const cancelImmediately = ref(false);
const showInvoices = ref(false);

// Monthly goal (configurable)
const monthlyGoal = ref(150);

// --- Computed ---
const revenueProgress = computed(() => {
    if (!revenue.value.total || !monthlyGoal.value) return 0;
    return Math.min(100, (revenue.value.total / monthlyGoal.value) * 100);
});

const monthStartDate = computed(() => {
    const m = revenue.value.month; // e.g. "2026-02"
    if (m) {
        const [y, mo] = m.split('-').map(Number);
        return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
});

const monthEndDate = computed(() => {
    const m = revenue.value.month;
    if (m) {
        const [y, mo] = m.split('-').map(Number);
        return new Date(y, mo, 0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
});

// --- Helpers ---
const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getPlanByType = (type: string) => {
    return plans.value.find(p => p.plan_type === type && p.billing_period === billingPeriod.value);
};

const currentPlanType = computed(() => subscription.value?.plan?.plan_type || null);
const isSubscribed = computed(() => subscription.value && subscription.value.status !== 'none' && subscription.value.is_active_subscription);

const getButtonLabel = (planType: string) => {
    if (!isSubscribed.value) return planType === 'basic' ? 'Choisir Basic' : 'Devenir PRO';
    if (currentPlanType.value === planType) return 'Plan Actuel';
    
    const rank: Record<string, number> = { basic: 1, pro: 2 };
    const currentRank = rank[currentPlanType.value || ''] || 0;
    const targetRank = rank[planType] || 0;
    
    return targetRank > currentRank ? 'Upgrader' : 'Downgrader';
};

const getButtonClass = (planType: string) => {
    if (isSubscribed.value && currentPlanType.value === planType) {
        return 'bg-zinc-800 text-zinc-500 cursor-default border border-zinc-700';
    }
    if (planType === 'pro') {
        return 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-amber-500/20';
    }
    return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20';
};

// --- Actions ---
const openCheckout = async (checkoutUrl: string) => {
    // In Electron, open in external browser
    if (window.electronAPI) {
        window.electronAPI.send('open-external', checkoutUrl);
    } else {
        window.open(checkoutUrl, '_blank');
    }
};

const handlePlanAction = async (planType: string) => {
    if (isSubscribed.value && currentPlanType.value === planType) return; // Already on this plan
    
    const plan = getPlanByType(planType);
    if (!plan) {
        notify({ type: 'error', title: 'Plan introuvable', text: 'Ce plan n\'est pas disponible pour cette période.' });
        return;
    }

    actionLoading.value = true;
    try {
        if (!isSubscribed.value) {
            // New subscription → Checkout
            const { checkout_url } = await JeuxCracksAPI.checkout(plan.stripe_price_id);
            openCheckout(checkout_url);
            notify({ type: 'success', title: 'Redirection Stripe', text: 'Finalisez le paiement dans votre navigateur.' });
        } else {
            const rank: Record<string, number> = { basic: 1, pro: 2 };
            const currentRank = rank[currentPlanType.value || ''] || 0;
            const targetRank = rank[planType] || 0;

            if (targetRank > currentRank) {
                await JeuxCracksAPI.upgradeSubscription(plan.stripe_price_id);
                notify({ type: 'success', title: 'Upgrade réussi !', text: 'Votre plan a été mis à jour (proratisé).' });
            } else {
                await JeuxCracksAPI.downgradeSubscription(plan.stripe_price_id);
                notify({ type: 'success', title: 'Downgrade planifié', text: 'Le changement sera appliqué en fin de période.' });
            }
            await refreshSubscription();
        }
    } catch (err: any) {
        notify({ type: 'error', title: 'Erreur', text: err.message || 'Une erreur est survenue.' });
    } finally {
        actionLoading.value = false;
    }
};

const handleDowngrade = async (_: any) => {
    // Cancel subscription (downgrade to free = cancel)
    showCancelModal.value = true;
};

const cancelSubscription = async () => {
    actionLoading.value = true;
    try {
        await JeuxCracksAPI.cancelSubscription(cancelImmediately.value);
        notify({ type: 'success', title: 'Abonnement annulé', text: cancelImmediately.value ? 'Annulation immédiate.' : 'Votre abonnement reste actif jusqu\'à la fin de la période.' });
        showCancelModal.value = false;
        await refreshSubscription();
    } catch (err: any) {
        notify({ type: 'error', title: 'Erreur', text: err.message || 'Impossible d\'annuler.' });
    } finally {
        actionLoading.value = false;
    }
};

const reactivate = async () => {
    actionLoading.value = true;
    try {
        await JeuxCracksAPI.reactivateSubscription();
        notify({ type: 'success', title: 'Réactivé !', text: 'Votre abonnement ne sera plus annulé.' });
        await refreshSubscription();
    } catch (err: any) {
        notify({ type: 'error', title: 'Erreur', text: err.message || 'Impossible de réactiver.' });
    } finally {
        actionLoading.value = false;
    }
};

const submitDonation = async () => {
    if (!donationAmount.value || donationAmount.value < 1) return;
    actionLoading.value = true;
    try {
        const cents = Math.round(donationAmount.value * 100);
        const { checkout_url } = await JeuxCracksAPI.donate(cents, donationMessage.value || undefined);
        openCheckout(checkout_url);
        notify({ type: 'success', title: 'Merci ! ❤️', text: 'Finalisez votre don dans le navigateur.' });
        donationMessage.value = '';
    } catch (err: any) {
        notify({ type: 'error', title: 'Erreur', text: err.message || 'Impossible de créer le don.' });
    } finally {
        actionLoading.value = false;
    }
};

const refreshSubscription = async () => {
    try {
        subscription.value = await JeuxCracksAPI.getSubscriptionStatus();
    } catch { /* silent */ }
};

// --- Init ---
onMounted(async () => {
    try {
        const [plansRes, statusRes, revenueRes, donationsRes, invoicesRes] = await Promise.allSettled([
            JeuxCracksAPI.getPlans(),
            JeuxCracksAPI.getSubscriptionStatus(),
            JeuxCracksAPI.getMonthlyRevenue(),
            JeuxCracksAPI.getDonations(),
            JeuxCracksAPI.getInvoices(),
        ]);

        if (plansRes.status === 'fulfilled') plans.value = plansRes.value;
        if (statusRes.status === 'fulfilled') subscription.value = statusRes.value;
        if (revenueRes.status === 'fulfilled') revenue.value = revenueRes.value;
        if (donationsRes.status === 'fulfilled') donations.value = donationsRes.value;
        if (invoicesRes.status === 'fulfilled') invoices.value = invoicesRes.value;
    } catch (err) {
        console.error('❌ Premium page init error:', err);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.animate-pulse-slow {
    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.animate-pulse-fast {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>