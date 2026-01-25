<template>
  <div class="h-screen w-screen flex bg-gradient-to-br from-[#050505] to-[#151515] text-white font-sans overflow-hidden selection:bg-indigo-500/30">
    
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

const route = useRoute();
const isAuthPage = computed(() => route.path === '/login');
</script>
