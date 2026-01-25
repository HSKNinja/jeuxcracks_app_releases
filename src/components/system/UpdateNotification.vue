<template>
  <transition name="slide-up">
    <div v-if="visible" class="fixed bottom-6 right-6 z-50 animate-bounce-in">
        
        <div class="relative overflow-hidden bg-[#0a0a0a] border border-zinc-800 rounded-xl shadow-2xl w-80">
            <!-- Progress Bar Background if downloading -->
            <div v-if="status === 'downloading'" class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" :style="{ width: progress + '%' }"></div>

            <div class="p-4 flex items-start gap-4">
                
                <!-- Icon -->
                <div class="relative shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                     :class="status === 'ready' ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-500'">
                    <CloudArrowDownIcon v-if="status === 'downloading' || status === 'available'" class="w-6 h-6 animate-pulse" />
                    <SparklesIcon v-else-if="status === 'ready'" class="w-6 h-6" />
                    <ArrowPathIcon v-else class="w-6 h-6 animate-spin" />
                </div>

                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white mb-1">
                        {{ title }}
                    </h4>
                    <p class="text-xs text-zinc-400 font-medium leading-relaxed">
                        {{ message }}
                    </p>

                    <!-- Actions -->
                    <div v-if="status === 'ready'" class="mt-3 flex gap-2">
                        <button 
                            @click="restartAndInstall" 
                            class="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold uppercase tracking-wide rounded-md transition-colors"
                        >
                            Redémarrer
                        </button>
                        <button 
                            @click="close" 
                            class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wide rounded-md transition-colors"
                        >
                            Plus tard
                        </button>
                    </div>
                </div>

                <!-- Close Button -->
                <button @click="close" class="text-zinc-500 hover:text-white transition-colors">
                    <XMarkIcon class="w-4 h-4" />
                </button>
            </div>
        </div>

    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CloudArrowDownIcon, SparklesIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
    status: 'checking' | 'available' | 'downloading' | 'ready' | null;
    progress?: number;
}>();

const emit = defineEmits(['close', 'restart']);

const visible = computed(() => props.status !== null);

const title = computed(() => {
    switch(props.status) {
        case 'available': return 'Mise à jour disponible';
        case 'downloading': return 'Téléchargement...';
        case 'ready': return 'Mise à jour prête';
        default: return 'Mise à jour';
    }
});

const message = computed(() => {
    switch(props.status) {
        case 'available': return 'Une nouvelle version est disponible. Le téléchargement va commencer.';
        case 'downloading': return 'La mise à jour est en cours de téléchargement en arrière-plan.';
        case 'ready': return 'Pour appliquer la mise à jour, l\'application doit redémarrer.';
        default: return '';
    }
});

const close = () => {
    emit('close');
};

const restartAndInstall = () => {
    emit('restart');
};
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
