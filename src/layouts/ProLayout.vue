<template>
  <div class="h-screen w-screen flex text-white font-sans overflow-hidden selection:bg-indigo-500/30 transition-all duration-1000 ease-in-out bg-cover bg-center" :class="themeClass">
    
    <!-- Sidebar (Standard Fixed Left) -->
    <ProSidebar v-if="!isAuthPage" />

    <!-- Main Content Wrapper -->
    <div class="flex-1 flex flex-col min-w-0 relative">
      
      <!-- Top Header -->
      <ProHeader v-if="!isAuthPage" />

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
import { useRoute } from 'vue-router';
import ProSidebar from '../components/navigation/ProSidebar.vue';
import ProHeader from '../components/navigation/ProHeader.vue';
import { ModalsContainer } from 'vue-final-modal';
import { useThemeStore } from '../store/theme';

const route = useRoute();
const themeStore = useThemeStore();

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path));

const themeClass = computed(() => {
    const defaultTheme = 'bg-gradient-to-br from-[#050505] to-[#151515]';
    // Use the getter 'items' implicitly available on store instance
    const theme = themeStore.items.find((i: any) => i.id === themeStore.equipped.global_theme);
    return theme?.cssClass || defaultTheme;
});
</script>
