<template>
  <div class="h-screen w-screen flex text-white font-sans overflow-hidden selection:bg-indigo-500/30 transition-all duration-1000 ease-in-out bg-cover bg-center" :class="themeClass">
    
    <!-- Sidebar (Standard Fixed Left) -->
    <ProSidebar v-if="!isAuthPage" />

    <!-- Main Content Wrapper -->
    <div class="flex-1 flex flex-col min-w-0 relative">
      
      <!-- Top Header -->
      <ProHeader v-if="!isAuthPage" />

      <!-- Offline Banner -->
      <div v-if="mainStore.isOfflineMode && !isAuthPage" class="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs font-bold text-center py-1.5 flex items-center justify-center gap-2 backdrop-blur-sm sticky top-0 z-40">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 011.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
          MODE HORS LIGNE - Accès limité à la bibliothèque locale
      </div>

      <!-- Scrollable Area -->
      <main class="flex-1 overflow-y-auto custom-scrollbar">
         <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
         </router-view>
      </main>
      
    </div>
    
    <ModalsContainer />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ProSidebar from '../components/navigation/ProSidebar.vue';
import ProHeader from '../components/navigation/ProHeader.vue';
import { ModalsContainer } from 'vue-final-modal';
import { useThemeStore } from '../store/theme';
import { useMainStore } from '../store';

const route = useRoute();
const themeStore = useThemeStore();
const mainStore = useMainStore();

const isAuthPage = computed(() => {
    const p = route.path.toLowerCase();
    // Broad check for login/register to prevent layout duplication
    return p.includes('/login') || p.includes('/register') || route.name === 'Login' || route.name === 'Register';
});

const themeClass = computed(() => {
    const defaultTheme = 'bg-gradient-to-br from-[#050505] to-[#151515]';
    // Use the getter 'items' implicitly available on store instance
    const theme = themeStore.items.find((i: any) => i.id === themeStore.equipped.global_theme);
    return theme?.cssClass || defaultTheme;
});
</script>
