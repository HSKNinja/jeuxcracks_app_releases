<template>
  <div class="min-h-full p-4 md:p-8 xl:p-12 pb-24 relative overflow-hidden flex flex-col items-center">
    
    <!-- Background Effects -->
    <div class="absolute inset-0 z-0 pointer-events-none">
        <div class="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
    </div>

    <!-- HERO SECTION -->
    <div class="relative z-10 text-center space-y-4 max-w-4xl mx-auto mb-10 md:mb-16">
      <h1 class="text-4xl md:text-6xl font-black text-white tracking-tight">
        Passez au niveau <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600">Supérieur</span>
      </h1>
      <p class="text-lg text-zinc-400 max-w-2xl mx-auto">
        Choisissez le plan qui correspond à vos besoins. Annulable à tout moment.
      </p>
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
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-zinc-600 shrink-0" />
                    Pas de pubs
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-zinc-600 shrink-0" />
                    Sauvegarde Cloud
                </li>
                <li class="flex items-start gap-3 text-sm text-zinc-300">
                    <CheckIcon class="w-5 h-5 text-zinc-600 shrink-0" />
                    Support Prioritaire
                </li>
            </ul>

            <button class="w-full py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm border border-zinc-700 cursor-default">
                Plan Actuel
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
                <span class="text-5xl font-black text-white">2.99€</span>
                <span class="text-sm text-zinc-500">/mois</span>
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

            <button class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20">
                Choisir Basic
            </button>
        </div>

        <!-- PLAN 3: PRO -->
        <div class="relative p-8 rounded-3xl bg-[#0a0a0a] border border-amber-500/30 flex flex-col transition-transform duration-300 hover:-translate-y-2 group">
            <h3 class="text-xl font-bold text-amber-500 mb-2 group-hover:text-amber-400 transition-colors">Premium Pro</h3>
            <div class="flex items-baseline gap-1 mb-6">
                <span class="text-4xl font-black text-white">4.99€</span>
                <span class="text-sm text-zinc-500">/mois</span>
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

            <button class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm transition-all shadow-lg shadow-amber-500/20">
                Devenir PRO
            </button>
        </div>

    </div>
    <!-- End Grid -->

    <!-- FUNDING GOAL SECTION -->
    <div class="w-full max-w-3xl mx-auto mt-20 relative z-10">
        <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <!-- Background Glow -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <h3 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <BanknotesIcon class="w-6 h-6 text-green-400" />
                Objectif du Mois
            </h3>
            <p class="text-zinc-400 text-sm mb-6">
                L'argent des abonnements et des dons sert à payer les serveurs et les nouveaux cracks.
                <span class="text-white font-bold">Tout est réinvesti.</span>
            </p>

            <!-- Progress Bar -->
            <div class="mb-2 flex justify-between text-sm font-bold">
                <span class="text-white">45.00€ récoltés</span>
                <span class="text-zinc-500">Objectif: 150.00€</span>
            </div>
            <div class="h-4 bg-zinc-800 rounded-full overflow-hidden relative mb-8">
                <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000" style="width: 30%">
                    <div class="absolute inset-0 bg-white/20 animate-pulse-fast"></div>
                </div>
            </div>

            <!-- Donation CTA -->
            <div class="flex flex-col md:flex-row items-center gap-4 bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                <div class="flex-1">
                    <h4 class="font-bold text-white">Faire un don libre</h4>
                    <p class="text-xs text-zinc-500">Soutenez le projet sans abonnement.</p>
                </div>
                <a href="https://ko-fi.com" target="_blank" class="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors text-sm border border-white/10">
                    Faire un don
                </a>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { CheckIcon, CheckCircleIcon, BanknotesIcon } from '@heroicons/vue/24/solid';
</script>

<style scoped>
.animate-pulse-slow {
    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>