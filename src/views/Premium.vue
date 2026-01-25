<template>
  <div class="min-h-screen bg-neutral-900">
    <!-- Header Hero simple -->
    <div class="relative overflow-hidden rounded-lg">
      <div class="absolute inset-0 bg-gradient-to-br from-neutral-800/50 to-neutral-900/50"></div>
      
      <div class="relative px-6 py-16 sm:px-12 sm:py-24">
        <div class="mx-auto max-w-4xl text-center">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
            Devenez <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Premium</span>
          </h1>
          <p class="text-xl leading-8 text-neutral-300 mb-4">
            Débloquez tout le potentiel de JeuxCracks avec nos offres premium
          </p>
          <p class="text-lg text-neutral-400">
            Accès illimité, téléchargements prioritaires, support prioritaire et bien plus encore
          </p>
        </div>
      </div>
    </div>

    <!-- Toggle Prix Mensuel/Annuel -->
    <div class="px-6 sm:px-12">
      <div class="mx-auto max-w-4xl text-center mb-8">
        <div class="inline-flex bg-neutral-800 rounded-lg p-1">
          <button 
            @click="isAnnual = false"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              !isAnnual ? 'bg-yellow-500 text-black' : 'text-neutral-300 hover:text-white'
            ]"
          >
            Mensuel
          </button>
          <button 
            @click="isAnnual = true"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              isAnnual ? 'bg-yellow-500 text-black' : 'text-neutral-300 hover:text-white'
            ]"
          >
            Annuel <span class="text-xs">(-20%)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pricing Cards simples -->
    <div class="px-6 py-8 sm:px-12">
      <div class="mx-auto max-w-6xl">
        <div class="grid gap-8 lg:grid-cols-3">
          
          <!-- Plan Gratuit -->
          <div class="relative rounded-xl bg-neutral-800 p-8 border border-neutral-700">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-semibold text-white mb-4">Gratuit</h3>
              <div class="flex items-baseline justify-center gap-2 mb-2">
                <span class="text-4xl font-bold tracking-tight text-neutral-400">0€</span>
                <span class="text-lg text-neutral-400">{{ isAnnual ? '/an' : '/mois' }}</span>
              </div>
              <p class="text-sm text-neutral-400">Parfait pour commencer</p>
            </div>
            
            <ul class="space-y-4 mb-8">
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Accès au catalogue complet</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">3 jeux maximum dans la bibliothèque</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">5 MB/s en téléchargement</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-neutral-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-500">Sauvegarde cloud</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-neutral-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-500">Support prioritaire</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-neutral-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-500">Thèmes et personnalisation</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-neutral-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-500">Badges exclusifs</span>
              </li>
            </ul>
            
            <div class="mt-auto">
              <button class="w-full rounded-lg bg-neutral-700 hover:bg-neutral-600 px-6 py-3 text-lg font-semibold text-white transition-colors duration-200">
                Plan actuel
              </button>
            </div>
          </div>

          <!-- Plan Premium Basic - 2,99€ -->
          <div class="relative rounded-xl bg-neutral-800 p-8 border border-neutral-700 hover:border-yellow-500/50 transition-all duration-300 flex flex-col">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-semibold text-white mb-4">Premium Basic</h3>
              <div class="flex items-baseline justify-center gap-2 mb-2">
                <span class="text-4xl font-bold tracking-tight text-yellow-400">{{ isAnnual ? '29,99€' : '2,99€' }}</span>
                <span class="text-lg text-neutral-400">{{ isAnnual ? '/an' : '/mois' }}</span>
              </div>
              <p class="text-sm text-neutral-400">Le choix le plus populaire</p>
            </div>
            
            <ul class="space-y-4 mb-8 flex-1">
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Téléchargements prioritaires</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">15 jeux dans la bibliothèque</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">25 MB/s en téléchargement</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Pas de publicités</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Accès aux nouveautés</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Notifications de sorties</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Thèmes et personnalisation</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Badges exclusifs</span>
              </li>
            </ul>
            
            <div class="mt-auto">
              <button class="w-full rounded-lg bg-yellow-500 hover:bg-yellow-400 px-6 py-3 text-lg font-semibold text-black transition-colors duration-200">
                Choisir Premium Basic
              </button>
            </div>
          </div>

          <!-- Plan Premium Pro - 4,99€ -->
          <div class="relative rounded-xl bg-neutral-800 p-8 border-2 border-red-500/50 hover:border-red-400/50 transition-all duration-300 flex flex-col">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                RECOMMANDÉ
              </span>
            </div>
            
            <div class="text-center mb-8">
              <h3 class="text-2xl font-semibold text-white mb-4">Premium Pro</h3>
              <div class="flex items-baseline justify-center gap-2 mb-2">
                <span class="text-4xl font-bold tracking-tight text-red-400">{{ isAnnual ? '49,99€' : '4,99€' }}</span>
                <span class="text-lg text-neutral-400">{{ isAnnual ? '/an' : '/mois' }}</span>
              </div>
              <p class="text-sm text-neutral-400">Pour les utilisateurs avancés</p>
            </div>
            
            <ul class="space-y-4 mb-8 flex-1">
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Tout du plan Basic</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Jeux illimités dans la bibliothèque</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Téléchargements illimités</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Support VIP 24/7</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Accès aux bêta-tests</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Contenu exclusif</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Sauvegarde cloud*</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Thèmes et personnalisation avancés</span>
              </li>
              <li class="flex items-start">
                <svg class="h-5 w-5 flex-shrink-0 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-3 text-sm text-neutral-300">Badges exclusifs et rares</span>
              </li>
            </ul>
            
            <div class="mt-auto">
              <button class="w-full rounded-lg bg-red-500 hover:bg-red-400 px-6 py-3 text-lg font-semibold text-white transition-colors duration-200">
                Choisir Premium Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Note sur la sauvegarde cloud -->
    <div class="px-6 py-4 sm:px-12">
      <div class="mx-auto max-w-4xl">
        <p class="text-sm text-neutral-400 text-center">
          * Sauvegarde cloud disponible uniquement pour les jeux compatibles
        </p>
      </div>
    </div>

    <!-- Section de garantie simple -->
    <!-- <div class="px-6 py-12 sm:px-12">
      <div class="mx-auto max-w-2xl">
        <div class="bg-neutral-800 rounded-xl p-8 border border-green-500/20">
          <div class="text-center">
            <h3 class="text-xl font-semibold text-white mb-4">Garantie 30 jours</h3>
            <p class="text-neutral-300">Si vous n'êtes pas satisfait de votre abonnement Premium, nous vous remboursons intégralement dans les 30 jours.</p>
          </div>
        </div>
      </div>
    </div> -->

    <!-- FAQ Section -->
    <div class="px-6 py-16 sm:px-12">
      <div class="mx-auto max-w-3xl">
        <h2 class="text-2xl font-bold text-white text-center mb-8">Questions fréquentes</h2>
        
        <div class="space-y-4">
          <div class="rounded-lg bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Comment fonctionne l'abonnement ?</h3>
            <p class="text-neutral-300">Votre abonnement est renouvelé automatiquement chaque mois. Vous pouvez annuler à tout moment depuis votre compte.</p>
          </div>
          
          <div class="rounded-lg bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Puis-je changer de plan ?</h3>
            <p class="text-neutral-300">Oui, vous pouvez changer de plan à tout moment. Le changement prendra effet au prochain cycle de facturation.</p>
          </div>
          
          <div class="rounded-lg bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Y a-t-il un engagement ?</h3>
            <p class="text-neutral-300">Non, tous nos abonnements sont sans engagement. Vous pouvez annuler à tout moment sans frais supplémentaires.</p>
          </div>
          
          <div class="rounded-lg bg-neutral-800 p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Quels moyens de paiement acceptez-vous ?</h3>
            <p class="text-neutral-300">Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal et les cryptomonnaies.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section finale simple -->
    <div class="px-6 py-16 sm:px-12">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="text-2xl font-bold text-white mb-4">Prêt à rejoindre la communauté Premium ?</h2>
        <p class="text-lg text-neutral-300 mb-8">Rejoignez des milliers d'utilisateurs qui profitent déjà de nos fonctionnalités premium</p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button class="rounded-lg bg-yellow-500 hover:bg-yellow-400 px-8 py-4 text-lg font-semibold text-black transition-colors duration-200">
            Commencer maintenant
          </button>
          <button class="rounded-lg border border-neutral-600 px-8 py-4 text-lg font-semibold text-white hover:bg-neutral-800 transition-colors duration-200">
            Voir tous les plans
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isAnnual = ref(false);

// Logique pour la gestion des abonnements
console.log('Page Premium chargée avec succès');
</script> 