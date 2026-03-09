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

    <!-- Windows Defender Consent Modal -->
    <div v-if="showDefenderConsent" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="cancelLibraryAdd"></div>
        <div class="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5 animate-fade-in-up">
            <div class="flex items-center gap-3 text-amber-500">
                <ShieldExclamationIcon class="w-8 h-8" />
                <h3 class="text-xl font-black uppercase tracking-tight text-white">Autorisation Windows Defender</h3>
            </div>
            
            <p class="text-sm text-zinc-400">
                Pour éviter que Windows Defender ne supprime par erreur des fichiers de vos jeux dans ce dossier, nous devons l'ajouter aux exclusions de l'antivirus.
            </p>

            <div class="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-zinc-500 break-all select-all">
                Add-MpPreference -ExclusionPath "{{ pendingLibraryPath }}"
            </div>

            <p class="text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                Une fenêtre d'autorisation administrateur (UAC) va s'ouvrir après avoir cliqué sur "Accepter". Si vous refusez, le dossier ne sera pas ajouté.
            </p>

            <div class="flex items-center justify-end gap-3 mt-2">
                <button 
                    @click="cancelLibraryAdd" 
                    class="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-colors uppercase tracking-wider"
                >
                    Refuser
                </button>
                <button 
                    @click="confirmAddLibrary" 
                    class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors uppercase tracking-wider flex items-center gap-2"
                >
                    Accepter
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { FolderOpenIcon, StarIcon, TrashIcon, PencilIcon, ShieldExclamationIcon } from '@heroicons/vue/24/solid';

const libraries = ref<any[]>([]);
const renamingId = ref<string | null>(null);
const renameValue = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

// Modal state
const showDefenderConsent = ref(false);
const pendingLibraryPath = ref('');

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
                pendingLibraryPath.value = path;
                showDefenderConsent.value = true;
            }
        }
    } catch (e) { console.error(e); }
};

const confirmAddLibrary = async () => {
    try {
        if (window.electronAPI && pendingLibraryPath.value) {
            const updated = await window.electronAPI.invoke('add-library', pendingLibraryPath.value);
            if (updated) libraries.value = updated;
        }
    } catch (e) { console.error(e); }
    showDefenderConsent.value = false;
    pendingLibraryPath.value = '';
};

const cancelLibraryAdd = () => {
    showDefenderConsent.value = false;
    pendingLibraryPath.value = '';
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
