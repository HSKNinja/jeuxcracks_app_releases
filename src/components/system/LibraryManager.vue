<template>
    <div class="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden">
        <div class="p-4 md:p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <FolderOpenIcon class="w-6 h-6 text-indigo-500" />
                    <div>
                        <div class="font-medium text-zinc-200">Bibliothèques de Jeux</div>
                        <div class="text-xs text-zinc-500">Gérez vos emplacements d'installation</div>
                    </div>
                </div>
                <button @click="addLibrary" class="px-3 py-1.5 text-xs font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                    + Ajouter
                </button>
            </div>

            <!-- Library List -->
            <div class="space-y-2 mt-2">
                <div v-for="lib in libraries" :key="lib.id" class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-white/5 group relative">
                        <!-- Default Badge -->
                        <div v-if="lib.isDefault" class="absolute -top-2 -right-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                            Défaut
                        </div>

                    <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-zinc-500 text-xs">
                            {{ lib.path.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <!-- Rename mode -->
                            <div v-if="renamingId === lib.id" class="flex items-center gap-2">
                                <input 
                                    ref="renameInput"
                                    v-model="renameValue"
                                    @keydown.enter="confirmRename(lib.id)"
                                    @keydown.escape="cancelRename"
                                    @blur="confirmRename(lib.id)"
                                    class="text-sm font-bold text-white bg-zinc-800 border border-indigo-500/50 rounded-lg px-2 py-1 w-full focus:outline-none focus:border-indigo-500"
                                    autofocus
                                />
                            </div>
                            <!-- Normal display -->
                            <div v-else @dblclick="startRename(lib)" class="cursor-pointer" title="Double-cliquez pour renommer">
                                <div class="text-sm font-bold text-zinc-300 truncate">{{ lib.label }}</div>
                            </div>
                            <div class="text-xs text-zinc-500 font-mono truncate" :title="lib.path">{{ lib.path }}</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-1 shrink-0 ml-2">
                        <button @click="startRename(lib)" class="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300 transition-colors" title="Renommer">
                            <PencilIcon class="w-4 h-4" />
                        </button>
                        <button v-if="!lib.isDefault" @click="setAsDefault(lib.id)" class="p-1.5 rounded-lg hover:bg-indigo-500/20 text-zinc-600 hover:text-indigo-400 transition-colors" title="Définir par défaut">
                            <StarIcon class="w-4 h-4" />
                        </button>
                        <button v-if="!lib.isDefault" @click="removeLibrary(lib.id)" class="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-500 transition-colors" title="Retirer">
                            <TrashIcon class="w-4 h-4" />
                        </button>
                            <div v-else class="p-1.5 text-indigo-500">
                            <StarIcon class="w-4 h-4 fill-current" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { FolderOpenIcon, StarIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/solid';

const libraries = ref<any[]>([]);
const renamingId = ref<string | null>(null);
const renameValue = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

const fetchLibraries = async () => {
    if (window.electronAPI) {
        libraries.value = await window.electronAPI.invoke('get-libraries');
    }
};

const addLibrary = async () => {
     try {
        if (window.electronAPI) {
            const path = await window.electronAPI.invoke('open-dialog', { properties: ['openDirectory'] });
            if (path) {
                const updated = await window.electronAPI.invoke('add-library', path);
                if (updated) libraries.value = updated;
            }
        }
    } catch (e) { console.error(e); }
};

const removeLibrary = async (id: string) => {
    if (window.electronAPI) {
        const updated = await window.electronAPI.invoke('remove-library', id);
        if (updated) libraries.value = updated;
    }
};

const setAsDefault = async (id: string) => {
    if (window.electronAPI) {
        const updated = await window.electronAPI.invoke('set-default-library', id);
        if (updated) libraries.value = updated;
    }
};

const startRename = (lib: any) => {
    renamingId.value = lib.id;
    renameValue.value = lib.label;
    nextTick(() => {
        const input = document.querySelector('input[autofocus]') as HTMLInputElement;
        if (input) { input.focus(); input.select(); }
    });
};

const confirmRename = async (id: string) => {
    if (!renamingId.value) return;
    const trimmed = renameValue.value.trim();
    if (trimmed && window.electronAPI) {
        const updated = await window.electronAPI.invoke('rename-library', id, trimmed);
        if (updated) libraries.value = updated;
    }
    renamingId.value = null;
};

const cancelRename = () => {
    renamingId.value = null;
};

onMounted(() => {
    fetchLibraries();
});
</script>
