<template>
  <div class="h-full bg-[#050505] text-white selection:bg-indigo-500/30 font-sans custom-scrollbar overflow-y-auto relative" ref="scrollContainer">
    
    <!-- Loading / Error States -->
    <div v-if="loading || !game" class="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div class="flex flex-col items-center gap-8">
          <div class="relative w-20 h-20">
              <div class="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
              <div class="absolute inset-2 border-t-2 border-purple-500 rounded-full animate-spin animation-delay-200"></div>
          </div>
      </div>
    </div>
    
    <div v-else-if="error" class="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div class="text-center max-w-lg mx-auto p-12">
        <h2 class="text-2xl font-black text-white mb-4 uppercase tracking-widest text-red-500">Erreur</h2>
        <p class="text-zinc-500 text-lg font-mono mb-8">{{ error }}</p>
        <button @click="router.back()" class="px-8 py-3 bg-zinc-800 text-white font-bold uppercase hover:bg-zinc-700 transition-colors rounded-lg">Retour</button>
      </div>
    </div>
    
    <!-- MAIN CONTENT -->
    <div v-else class="relative pb-32">
        
        <!-- STICKY HEADER -->
        <div class="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between transition-all duration-300">
             <div class="flex items-center gap-4">
                 <button @click="router.back()" class="p-2 rounded-full hover:bg-white/10 transition-colors group">
                     <ArrowLeftIcon class="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                 </button>
                 <span class="text-xs font-bold uppercase tracking-widest text-zinc-500 hidden md:block">Retour</span>
             </div>
             
             <div class="flex items-center gap-4">
                 <h2 class="text-sm font-bold text-white truncate max-w-xs hidden lg:block">{{ game?.title }}</h2>
                 <button 
                    class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded transition-all shadow-lg"
                    @click="handleInstallClick()"
                 >
                    {{ getActionButtonText() }}
                 </button>
             </div>
        </div>

        <!-- HERO SECTION (Video Background behind Title) -->
        <div class="relative w-full h-[85vh] overflow-hidden group">
            
            <!-- Background Image (Replaces Video) -->
            <div class="absolute inset-0 select-none pointer-events-none">
                <img 
                    :src="game?.background || game?.header" 
                    class="w-full h-full object-cover animate-pan-zoom"
                />
                
                <!-- Gradient Vignettes -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60"></div>
            </div>

            <!-- Content Overlay -->
            <div class="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-20">
                <div class="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
                    
                    <!-- Title & Main Info (Left) -->
                    <div class="lg:col-span-8 space-y-8 animate-slide-up">
                        
                        <!-- Badges -->
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-white/10 backdrop-blur border border-white/20 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                {{ getSourceName(game?.source) }}
                            </span>
                            <span v-if="game?.isOnline" class="px-3 py-1 bg-green-500/20 backdrop-blur border border-green-500/30 rounded text-[10px] font-bold uppercase tracking-widest text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                                Online
                            </span>
                        </div>

                        <!-- Title (Responsive) -->
                        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-none tracking-tight uppercase drop-shadow-2xl line-clamp-2">
                            {{ game?.title }}
                        </h1>

                        <!-- Action Bar -->
                        <div class="flex flex-wrap items-center gap-6 pt-6">
                            <button 
                                class="flex items-center gap-4 px-8 py-5 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                                @click="handleInstallClick()"
                            >
                                <PlayIcon v-if="isGameInstalled || installStore.isFinished(game?.id)" class="w-6 h-6" />
                                <ArrowDownTrayIcon v-else class="w-6 h-6" />
                                <span>{{ getActionButtonText() }}</span>
                            </button>

                            <!-- Like Button -->
                            <button 
                                @click="toggleLike()"
                                class="p-5 rounded-xl border border-white/20 hover:bg-white/10 transition-all group/likebtn relative overflow-hidden"
                                :title="game?.is_liked ? 'Je n\'aime plus' : 'J\'aime'"
                            >
                                <HeartIcon :class="['w-6 h-6 transition-transform duration-300', game?.is_liked ? 'text-red-500 fill-red-500 scale-110' : 'text-zinc-300 group-hover/likebtn:text-red-500 group-hover/likebtn:scale-110']" />
                            </button>

                            <!-- Favorite Button -->
                            <button 
                                @click="toggleFavorite()"
                                class="p-5 rounded-xl border border-white/20 hover:bg-white/10 transition-all group/favbtn relative overflow-hidden"
                                :title="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                            >
                                <StarIcon :class="['w-6 h-6 transition-transform duration-300', isFavorite ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-zinc-300 group-hover/favbtn:text-yellow-500 group-hover/favbtn:scale-110']" />
                            </button>
                            
                            <!-- Report Button -->
                            <button 
                                @click="showReportModal = true"
                                class="p-5 rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all group/warnbtn ml-auto lg:ml-0"
                                title="Signaler un problème avec ce jeu"
                            >
                                <ExclamationTriangleIcon class="w-6 h-6 text-zinc-500 group-hover/warnbtn:text-red-500 transition-colors" />
                            </button>
                        </div>
                        
                        <!-- Download Progress (If Active) -->
                        <div v-if="downloadStore.isDownloadExist(game?.id)" class="max-w-md bg-black/60 backdrop-blur border border-white/10 p-4 rounded-xl mt-4">
                            <div class="flex justify-between items-center text-xs font-bold uppercase text-zinc-400 mb-2">
                                <span class="text-indigo-400 animate-pulse">Téléchargement...</span>
                                <span>{{ Math.round((downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game?.title)]?.data?.progress || 0) * 100) }}%</span>
                            </div>
                            <div class="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                 <div class="h-full bg-indigo-500 transition-all duration-300" :style="{ width: ((downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game?.title)]?.data?.progress || 0) * 100) + '%' }"></div>
                            </div>
                        </div>

                    </div>

                    <!-- Side Info (Right) -->
                    <div class="lg:col-span-4 hidden lg:block text-right space-y-4 text-zinc-400 font-medium">
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Développeur</span>
                            <span class="text-white">{{ game?.developer || 'N/A' }}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Éditeur</span>
                            <span class="text-white">{{ game?.publisher || 'N/A' }}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Date de sortie</span>
                            <span class="text-white">{{ game?.release_date || 'N/A' }}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-xs font-bold uppercase text-zinc-600">Genre</span>
                            <span class="text-white">{{ typeof game?.categories?.[0] === 'string' ? game?.categories?.slice(0,3).join(', ') : game?.categories?.slice(0,3).map(c => c.name || c).join(', ') || 'N/A' }}</span>
                        </div>
                        
                        <!-- Stats -->
                        <div v-if="stats" class="pt-4 border-t border-zinc-800 w-full flex flex-col items-end gap-4 animate-fade-in">
                            <div class="flex flex-col items-end">
                                <span class="text-xs font-bold uppercase text-zinc-600">Temps de jeu</span>
                                <span class="text-xl font-black text-white">{{ prettyMilliseconds(stats.totalTimePlayedMs) }}</span>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="text-xs font-bold uppercase text-zinc-600">Lancements</span>
                                <span class="text-white font-mono">{{ stats.totalLaunches }}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- SCREENSHOTS GALLERY -->
        <div v-if="game?.screenshots?.length > 0" class="max-w-[1600px] mx-auto px-6 md:px-12 pt-16">
            <h3 class="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter mb-6">
                <PhotoIcon class="w-8 h-8 text-indigo-500" />
                Captures d'écran
            </h3>
            <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                <div 
                    v-for="(screenshot, index) in game.screenshots" 
                    :key="index"
                    class="flex-shrink-0 snap-start cursor-pointer group"
                    @click="openScreenshot(screenshot)"
                >
                    <img 
                        :src="screenshot" 
                        :alt="`Screenshot ${index + 1}`"
                        class="h-48 md:h-64 w-auto rounded-xl border border-white/10 object-cover transition-all group-hover:border-indigo-500/50 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                        loading="lazy"
                    />
                </div>
            </div>
        </div>

        <!-- DETAILS & SPECS SECTION -->
        <div class="max-w-[1600px] mx-auto px-6 md:px-12 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
            
            <!-- Description -->
            <div class="lg:col-span-2 space-y-8">
                <h3 class="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter">
                    <DocumentTextIcon class="w-8 h-8 text-indigo-500" />
                    À propos du jeu
                </h3>
                <div class="prose prose-invert prose-lg max-w-none text-zinc-400 font-light leading-relaxed p-8 rounded-3xl bg-zinc-900/30 border border-white/5">
                    <div v-html="DOMPurify.sanitize(game?.description || '')"></div>
                </div>
            </div>

            <!-- Configuration (Redesigned) -->
            <div class="space-y-8">
                <h3 class="flex items-center gap-3 text-2xl font-black text-white uppercase tracking-tighter">
                    <CpuChipIcon class="w-8 h-8 text-indigo-500" />
                    Configuration
                </h3>
                
                <div class="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                    
                    <!-- Min -->
                    <div class="p-6 border-b border-white/5">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-2 h-2 rounded-full bg-zinc-600"></div>
                            <h4 class="text-sm font-black text-zinc-300 uppercase tracking-widest">Minimal</h4>
                        </div>
                        <div class="text-xs text-zinc-400 font-mono leading-relaxed opacity-80" v-html="DOMPurify.sanitize(configurationSystemMinimal || 'Standard Requirements')"></div>
                    </div>

                    <!-- Rec -->
                    <div class="p-6 bg-white/[0.02]">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <h4 class="text-sm font-black text-white uppercase tracking-widest">Recommandée</h4>
                        </div>
                        <div class="text-xs text-zinc-300 font-mono leading-relaxed" v-html="DOMPurify.sanitize(configurationSystemRecommended || 'High Requirements')"></div>
                    </div>

                </div>
                
                <!-- Quick Specs Grid (Visual Decoration) -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center gap-2 text-center group hover:border-indigo-500/30 transition-colors">
                        <span class="text-[10px] font-bold uppercase text-zinc-600">Stockage</span>
                        <span class="text-zinc-300 font-bold">{{ typeof game?.size === 'number' ? prettyBites(game?.size || 0) : game?.size || 'N/A' }}</span>
                    </div>
                    <div class="p-4 rounded-xl bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center gap-2 text-center group hover:border-indigo-500/30 transition-colors">
                        <span class="text-[10px] font-bold uppercase text-zinc-600">Mémoire</span>
                        <span class="text-zinc-300 font-bold">8 GB+</span>
                    </div>
                </div>

                <!-- Support CTA -->
                <div class="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-xl bg-amber-500/20">
                            <HeartIcon class="w-6 h-6 text-amber-500" />
                        </div>
                        <h4 class="text-lg font-black text-white uppercase tracking-tighter">Soutenir le projet</h4>
                    </div>
                    <p class="text-sm text-zinc-400 leading-relaxed">
                        Si vous appréciez JeuxCracks, aidez-nous à rester en ligne en faisant un don ou en passant Premium. Chaque contribution compte !
                    </p>
                    <div class="flex flex-col gap-2">
                        <router-link to="/premium" class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs text-center rounded-xl transition-all shadow-lg shadow-amber-500/20">
                            Devenir Premium
                        </router-link>
                        <router-link to="/support" class="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] text-center rounded-xl transition-all border border-white/10">
                            Faire un don
                        </router-link>
                    </div>
                </div>

            </div>

        </div>

    </div>

    <!-- MODAL: DOWNLOAD PATH SELECTION (CENTERED FIXED) -->
    <vue-final-modal
      v-model="showInstallModal"
      class="flex justify-center items-center"
      content-class="relative w-full max-w-lg mx-4 p-8 bg-[#0f0f0f] border border-zinc-800 rounded-2xl shadow-2xl animate-fade-in-up"
      :click-to-close="true"
      :esc-to-close="true"
      overlay-class="bg-black/60 backdrop-blur-sm"
    >
        <h3 class="text-2xl font-black text-white uppercase tracking-tighter mb-2">Installation</h3>
        <p class="text-zinc-500 text-sm mb-8 font-medium">Sélectionnez le dossier d'installation pour <span class="text-white">{{ game?.title }}</span>.</p>
        
        <div class="space-y-6">
            <!-- Libraries List -->
            <div class="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                 <div 
                    v-for="lib in libraries" 
                    :key="lib.id"
                    @click="selectedLibraryId = lib.id"
                    class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all"
                    :class="selectedLibraryId === lib.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-black border-zinc-800 hover:bg-zinc-900'"
                 >
                    <div class="flex items-center gap-3">
                         <FolderOpenIcon class="w-5 h-5" :class="selectedLibraryId === lib.id ? 'text-indigo-400' : 'text-zinc-600'" />
                         <div>
                             <div class="text-sm font-bold" :class="selectedLibraryId === lib.id ? 'text-white' : 'text-zinc-300'">{{ lib.label }}</div>
                             <div class="text-[10px] text-zinc-500 font-mono">{{ lib.path }}</div>
                         </div>
                    </div>
                    <div v-if="selectedLibraryId === lib.id" class="w-4 h-4 rounded-full bg-indigo-500 border-2 border-black"></div>
                 </div>
                 
                 <!-- Add New -->
                 <button @click="addLibrary" class="w-full py-3 text-xs font-bold text-zinc-500 hover:text-white border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl transition-colors">
                     + Ajouter une bibliothèque
                 </button>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <button 
                    class="py-4 rounded-xl border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-xs hover:bg-zinc-900 hover:text-white transition-colors"
                    @click="showInstallModal = false"
                >
                    Annuler
                </button>
                <button 
                    class="py-4 bg-white text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-indigo-500 hover:text-white hover:shadow-lg transition-all"
                    @click="confirmInstall()"
                >
                    Installer
                </button>
            </div>
        </div>
    </vue-final-modal>

    <!-- MODAL: VERSION SELECTION -->
    <vue-final-modal
      v-model="showVersionModal"
      class="flex justify-center items-center"
      :content-class="['flex flex-col p-8 bg-[#0a0a0a] rounded-2xl border border-white/10 max-w-xl w-full mx-4 shadow-2xl relative overflow-hidden']"
      overlay-class="bg-black/80 backdrop-blur-sm fixed inset-0 z-50 flex justify-center items-center"
      :lock-scroll="true"
    >
        <div class="relative z-10">
            <h2 class="text-2xl font-black text-white uppercase tracking-tighter mb-2">Sélectionner une version</h2>
            <p class="text-zinc-500 mb-6 font-medium">Choisissez la version du jeu à télécharger. La plus récente est recommandée.</p>
            
            <div v-if="loadingVersions" class="py-8 text-center">
                 <div class="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div v-else-if="versions.length === 0" class="py-8 text-center text-zinc-500 font-bold">
                Aucune version disponible pour le moment.
            </div>

            <div v-else class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <button 
                    v-for="ver in versions" 
                    :key="ver.id"
                    @click="selectVersion(ver)"
                    class="w-full p-4 rounded-xl border transition-all text-left group relative overflow-hidden"
                    :class="ver.is_latest ? 'bg-indigo-500/10 border-indigo-500/50 hover:bg-indigo-500/20' : 'bg-zinc-900 border-white/5 hover:border-white/20'"
                >
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-black text-white uppercase tracking-wider">{{ ver.version_raw || ver.version || 'Version Inconnue' }}</span>
                        <span v-if="ver.is_latest" class="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-bold uppercase rounded shadow">Recommandé</span>
                    </div>
                    <div class="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase">
                        <span :class="{'text-indigo-300': ver.is_latest}">{{ ver.source }}</span>
                        <span v-if="ver.file_size || ver.size" class="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span v-if="ver.file_size || ver.size">{{ ver.file_size || ver.size }}</span>
                        <!-- Online Indicator -->
                         <span v-if="ver.is_online" class="ml-auto flex items-center gap-1 text-green-400">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </button>
            </div>

            <div class="mt-8 flex justify-end">
                <button @click="showVersionModal = false" class="px-6 py-3 text-zinc-400 font-bold uppercase hover:text-white transition-colors">Annuler</button>
            </div>
        </div>
    </vue-final-modal>
    
    <!-- MODAL: CONFIRM CANCEL -->
    <ModalConfirm :modal-id="modalId" title="Annulation" @confirm="stopDownload()">
      <p class="text-zinc-300 font-medium">Voulez-vous vraiment arrêter le téléchargement ?</p>
    </ModalConfirm>

    <!-- MODAL: MANAGE INSTALLED -->
    <ModalConfirm
      :modal-id="modalSettings"
      title="Gestion"
      @confirm="vfm.close(modalSettings)"
    >
       <div class="space-y-3 pt-4">
            <button class="w-full py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-zinc-200" @click="openGameEmplacement()">
                Ouvrir dossier local
            </button>
            <button class="w-full py-4 bg-red-600 text-white font-black uppercase tracking-wider hover:bg-red-700" @click="deleteGame()">
                Désinstaller
            </button>
       </div>
    </ModalConfirm>
    
    <!-- MODAL: REPORT GAME -->
    <vue-final-modal
      v-model="showReportModal"
      class="flex justify-center items-center"
      content-class="relative w-full max-w-lg mx-4 p-8 bg-[#0f0f0f] border border-zinc-800 rounded-2xl shadow-2xl animate-fade-in-up"
      :click-to-close="true"
      :esc-to-close="true"
      overlay-class="bg-black/60 backdrop-blur-sm"
    >
        <div class="flex items-center gap-3 mb-4">
            <div class="p-3 bg-red-500/20 rounded-full">
                <ExclamationTriangleIcon class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-xl font-black text-white uppercase tracking-tighter">Signaler ce jeu</h3>
        </div>
        
        <p class="text-zinc-400 text-sm mb-6">Quel est le problème rencontré avec <span class="text-white font-bold">{{ game?.title }}</span> ?</p>
        
        <div class="space-y-4">
            <select v-model="reportReason" class="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                <option value="" disabled>Sélectionnez une raison...</option>
                <option value="broken_link">Lien mort / Fichier introuvable</option>
                <option value="malware">Fichier corrompu / Alerte antivirus</option>
                <option value="fake">Faux jeu / Mauvais fichiers</option>
                <option value="other">Autre (précisez ci-dessous)</option>
            </select>
            
            <textarea 
                v-model="reportDetails" 
                rows="4" 
                placeholder="Détails supplémentaires (facultatif)..."
                class="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors resize-none placeholder-zinc-600"
            ></textarea>

            <button 
                @click="submitReport"
                :disabled="isReporting || !reportReason"
                class="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all mt-4"
            >
                {{ isReporting ? 'Envoi...' : 'Envoyer le signalement' }}
            </button>
        </div>
    </vue-final-modal>

    <!-- Windows Defender Consent Modal -->
    <div v-if="showDefenderConsent" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

  </div>
</template>

<script setup lang="ts">
import ModalConfirm from '../../components/ModalConfirm.vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DOMPurify from 'dompurify';
import { useVfm, VueFinalModal } from 'vue-final-modal';
import { useFetch } from '../../utils/useFetch';
import { 
    EyeIcon, CalendarIcon, HeartIcon, StarIcon, ArrowDownTrayIcon, PlayIcon, 
    FolderOpenIcon, CpuChipIcon, ArrowLeftIcon, DocumentTextIcon, PhotoIcon,
    ExclamationTriangleIcon, ShieldExclamationIcon
} from '@heroicons/vue/24/solid';
import { useMainStore } from '../../store';
import { useNotification } from '@kyvg/vue3-notification';
import { useDownloadStore } from '../../store/download';
import { useInstallStore } from '../../store/install';
import { JeuxCracksAPI } from '../../services/api';

const store = useMainStore();
const { notify } = useNotification();
const downloadStore = useDownloadStore();
const installStore = useInstallStore();
const vfm = useVfm();
const showInstallModal = ref(false);
const showVersionModal = ref(false);
const loadingVersions = ref(false);
const versions = ref<any[]>([]);
const selectedVersion = ref<any>(null);
const modalId = Symbol('modalId');
const modalSettings = Symbol('modalSettings');

const showReportModal = ref(false);
const showDefenderConsent = ref(false);
const pendingLibraryPath = ref('');
const reportReason = ref('');
const reportDetails = ref('');
const isReporting = ref(false);

// State
const loading = ref(true);
const game = ref<any>(null);
const error = ref<string | undefined>('');
const isFavorite = ref(false);
const isLoadingFavorite = ref(false);
const downloadType = ref<string>('');
const configurationSystemMinimal = ref<string | null>(null);
const configurationSystemRecommended = ref<string | null>(null);
const installed = ref<{ id: string; title: string; path: string; executable?: string } | null>(null);
const isGameInstalled = ref(false);
const destPath = ref<string>('');
const stats = ref<{ totalLaunches: number; totalTimePlayedMs: number; lastPlayedDate: string | null } | null>(null);



// Popup State
const libraries = ref<any[]>([]);
const selectedLibraryId = ref<string>('');

// --- IPC LISTENERS ---
window.electronAPI?.invoke('get-save-path').then((path: string) => {
  destPath.value = path;
});
window.electronAPI?.on('download-pending', () => {});

const route = useRoute();
const router = useRouter();

watch(() => route.params.id, (id) => { fetchData(id); }, { immediate: true });

onMounted(async () => {
  await fetchData(route.params.id);
  await checkFavoriteStatus();
  updateInstallationStatus();
  registerView(); // Register view (no login required)
});

// --- ACTIONS ---

function getActionButtonText() {
    if (downloadStore.isDownloadExist(game.value?.id) && !downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game.value?.title)]?.paused) {
        return 'En cours...';
    }
    if (downloadStore.isDownloadExist(game.value?.id) && downloadStore.downloads[downloadStore.getIndexDownloadByTitle(game.value?.title)]?.paused) {
        return 'Reprendre';
    }
    if (isGameInstalled.value || installStore.isFinished(game.value?.id)) {
        return 'Jouer';
    }
    return 'Installer';
}

function handleInstallClick() {
    // If already installed, play/manage
    if (isGameInstalled.value || installStore.isFinished(game.value?.id)) {
        beforeDownload(); // Triggers play logic
        return;
    }
    
    // If download exists (paused or running), resume/manage
    if (downloadStore.isDownloadExist(game.value?.id)) {
        beforeDownload(); // Triggers pause/resume logic
        return;
    }
    
    // NEW INSTALL -> SHOW POPUP
    fetchLibraries();
    showInstallModal.value = true;
}

async function confirmInstall() {
    const lib = libraries.value.find(l => l.id === selectedLibraryId.value);
    if (!lib) {
        notify({ type: 'error', text: 'Veuillez sélectionner une bibliothèque' });
        return;
    }
    
    // Construct Path: Library + GameTitle (Sanitized)
    const sanitizedTitle = game.value?.title?.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
    // Using forward slashes for consistency
    destPath.value = (lib.path + '/' + sanitizedTitle).replace(/\\/g, '/');
    
    showInstallModal.value = false;
    await fetchVersionsAndShowModal();
}

async function fetchLibraries() {
    if (window.electronAPI) {
        libraries.value = await window.electronAPI.invoke('get-libraries');
        // Select default if no selection
        if (!selectedLibraryId.value) {
            const def = libraries.value.find(l => l.isDefault) || libraries.value[0];
            if (def) selectedLibraryId.value = def.id;
        }
    }
}

async function addLibrary() {
     try {
        if (window.electronAPI) {
            const path = await window.electronAPI.invoke('open-dialog', { properties: ['openDirectory'] });
            if (path) {
                pendingLibraryPath.value = path;
                showDefenderConsent.value = true;
            }
        }
    } catch (e) { console.error(e); }
}

async function confirmAddLibrary() {
    try {
        if (window.electronAPI && pendingLibraryPath.value) {
            const updated = await window.electronAPI.invoke('add-library', pendingLibraryPath.value);
            
            // Check if directory is empty or suitable (optional check)
            const files = await window.electronAPI.invoke('get-files', pendingLibraryPath.value);
            if (files && files.length > 0) {
                 // Warn user but proceed
            }
            destPath.value = pendingLibraryPath.value;
            showInstallModal.value = false;
            
            // Fetch versions and show selection
            await fetchVersionsAndShowModal();
        }
    } catch (e) { console.error(e); }
    showDefenderConsent.value = false;
    pendingLibraryPath.value = '';
}

function cancelLibraryAdd() {
    showDefenderConsent.value = false;
    pendingLibraryPath.value = '';
}

async function fetchVersionsAndShowModal() {
    loadingVersions.value = true;
    showVersionModal.value = true;
    versions.value = [];
    
    try {
        if (!game.value?.id) return;
        
        let allVersions: any[] = game.value.versions || [];

        // Process versions: détection EXHAUSTIVE des liens de téléchargement.
        // L'API peut renvoyer le lien sous plusieurs formes selon la version du backend :
        //   - champs du modèle : download_torrent / download_direct (cas le plus courant)
        //   - tableau download_links au format {uri, link_type} OU {url, type}
        // On ratissait trop étroit avant (seulement download_links + link_type='magnet'),
        // d'où des "Aucune version" alors que le magnet EXISTE côté admin.
        const linkUri = (l:any) => String(l?.uri || l?.url || '');
        const linkType = (l:any) => String(l?.link_type || l?.type || '').toLowerCase();
        const isMagnetLink = (l:any) => linkUri(l).startsWith('magnet:') || /magnet|torrent/.test(linkType(l));
        const isDirectLink = (l:any) => /^https?:\/\//i.test(linkUri(l)) && !isMagnetLink(l);
        const firstString = (arr:any[], test:(s:string)=>boolean) =>
            (arr.find((s:any) => typeof s === 'string' && test(s)) as string) || '';

        // Détecte le lien d'une version depuis toutes les formes possibles (champs modèle + download_links).
        const detectVersion = (v:any) => {
            const links: any[] = v.download_links || [];
            const magnet =
                firstString([v.download_torrent, v.download_magnet, v.torrent, v.magnet], s => s.startsWith('magnet:')) ||
                linkUri(links.find(isMagnetLink));
            const direct =
                firstString([v.download_direct, v.direct], s => /^https?:\/\//i.test(s)) ||
                linkUri(links.find(isDirectLink));
            const chosen = magnet || direct;
            return {
                ...v,
                magnet_url: magnet || undefined,
                download_url: chosen || undefined,
                download_kind: magnet ? 'torrent' : (direct ? 'direct' : null),
                has_magnet: !!magnet,
                has_download: !!chosen,
            };
        };

        let mapped = allVersions.map(detectVersion).filter(v => v.has_download);

        // FALLBACK CLÉ : l'API met les liens de téléchargement dans l'endpoint /download/
        // (dernière version + liens), PAS dans les versions du détail. Si le détail n'a aucun
        // lien, on récupère la dernière version avec son magnet via /download/.
        if (mapped.length === 0 && game.value?.slug) {
            try {
                const dl: any = await useFetch(`/api/engine/games/${game.value.slug}/download/`, 'GET');
                if (dl && (dl.id || dl.download_links || dl.download_torrent || dl.torrent)) {
                    const d = detectVersion(dl);
                    if (d.has_download) mapped = [d];
                    else console.warn('⚠️ /download/ ne contient pas de lien exploitable:', JSON.stringify(dl, null, 2));
                }
            } catch (e) {
                console.warn('⚠️ Récupération /download/ échouée:', e);
            }
        }

        versions.value = mapped;

        // Sort/Flag Latest
        // If API doesn't flag, assume first is latest or sort by ID desc/Date
        if (versions.value.length > 0) {
             // Simple logic: Mark first as latest if none marked
             if (!versions.value.some(v => v.is_latest)) {
                 versions.value[0].is_latest = true;
             }
        }

    } catch (e) {
        console.error("Failed to process download links", e);
        notify({ type: 'error', title: 'Erreur', text: 'Impossible de lire les liens de téléchargement.' });
        showVersionModal.value = false;
    } finally {
        loadingVersions.value = false;
    }
}

async function selectVersion(version: any) {
    selectedVersion.value = version;
    showVersionModal.value = false;
    startDownload(version);
}

// ... existing logic ...



// Start download with specific version
async function startDownload(version: any) {
  // Accepte un magnet OU un lien direct (download_url), plus seulement le magnet.
  const dlUrl = version?.download_url || version?.magnet_url;
  if (!version || !dlUrl) {
      notify({ type: 'error', title: 'Erreur', text: 'Aucun lien de téléchargement valide.' });
      return;
  }
  
  // NB : le compteur de téléchargement est déjà incrémenté par l'appel à /download/
  // fait au moment d'ouvrir le sélecteur de version (évite un double comptage).

  let URL = dlUrl;
  if (URL.startsWith('/')) URL = 'https://api.jeuxcracks.fr' + URL;
  
  // Use source from selected version if available, otherwise fallback
  let source = version.source || 'Unknown';
  if (!source && Array.isArray(game.value?.source) && game.value?.source.length > 0) source = game.value.source[0];
  else if (!source && typeof game.value?.source === 'string') source = game.value.source;
  
  const gameData = {
    id: game.value?.id,
    title: game.value?.title,
    source: source,
    version: version.version_raw || version.version, // Add Version
    informations: { credit: game.value?.developer },
  };
  
  // Type réel du téléchargement : torrent (magnet) OU direct (lien HTTP), selon la version.
  downloadType.value = version.download_kind || (URL.startsWith('magnet:') ? 'torrent' : 'direct');
  window.electronAPI?.send('download', URL, destPath.value, downloadType.value, gameData);
  
  const downloadData = {
    gameID: gameData.id,
    title: gameData.title,
    path: destPath.value,
    downloadType: downloadType.value,
    paused: false,
    data: null,
    // Add version/source to download store too if needed
    version: version.version,
    source: source
  };
  downloadStore.addDownload(downloadData);
  // Also pass version/source to gameData store
  downloadStore.addGameData(gameData.id, { ...game.value, version: version.version, source: source });
  
  notify({ type: 'success', title: 'Téléchargement', text: `Démarrage de ${version.version}` });
}

async function stopDownload() {
  vfm.close(modalId);
  const index = downloadStore.getIndexDownloadByTitle(game.value?.title);
  if (index !== -1 && downloadStore.downloads[index]?.data?.infoHash) {
      window.electronAPI?.send('stop-torrent', downloadStore.downloads[index].data.infoHash, downloadStore.downloads[index].path + '/' + downloadStore.downloads[index].title);
      downloadStore.removeDownloadByTitle(game.value?.title);
  }
}

async function deleteGame() {
  if (downloadStore.isDownloadExist(game.value?.id)) stopDownload();
  
  if (installStore.isInstallExist(game.value?.id)) {
      if (installStore.isFinished(game.value?.id)) window.electronAPI?.send('remove-game', game.value?.id);
      installStore.removeInstallById(game.value?.id);
  }
  vfm.close(modalSettings);
}

// Removed dialogPath as it is replaced by addLibrary
// async function dialogPath() { ... }

// Rewritten primarily for Resume/Play logic, Start logic is handled by Main Button -> Popup -> startDownload
async function beforeDownload() {
  const index = downloadStore.getIndexDownloadByTitle(game.value?.title);
  
  // Logic for Pause/Resume/Play
  if (downloadStore.isDownloadExist(game.value?.id)) {
      if (!downloadStore.downloads[index]?.paused) {
          // Pause
           if (downloadStore.downloads[index]?.downloadType === 'torrent') {
              downloadStore.togglePause(game.value?.title);
              if (downloadStore.downloads[index]?.data?.infoHash) window.electronAPI?.send('pause-torrent', downloadStore.downloads[index].data.infoHash);
           }
      } else {
          // Resume
          downloadStore.togglePause(game.value?.title);
          if (downloadStore.downloads[index]?.data?.infoHash) {
              window.electronAPI?.send('resume-torrent', downloadStore.downloads[index].data.infoHash, downloadStore.downloads[index].path + '/' + downloadStore.downloads[index].title, JSON.parse(JSON.stringify(game.value)));
          }
      }
  } else if (isGameInstalled.value || installStore.isFinished(game.value?.id)) {
      // PLAY
      const syncSuccess = await store.forceLibrarySync();
      if (syncSuccess) {
          let userId = store.user?.id;
          if (!userId && store.tokens) {
              try { await store.fetchUser(); userId = store.user?.id; } catch (e) { console.error(e); }
          }
          userId = userId || 'anonymous';
          window.electronAPI?.send('launch-game', game.value?.id, userId);
      }
      else notify({ type: 'error', title: 'Erreur', text: 'Sync error' });
  } 
  // Note: New Install logic is extracted to handleInstallClick -> popup -> startDownload
}

async function openGameEmplacement() {
  const path = installStore.isFinished(game.value?.id) 
    ? installStore.installs.find((i) => i.id === game.value?.id)?.path 
    : destPath.value;
  window.electronAPI?.send('open-game-emplacement', path);
}

async function updateInstallationStatus() {
  if (game.value?.id) isGameInstalled.value = await isInstalled(game.value.id);
}

async function fetchData(id: string | string[]) {
  try {
      const response: any = await useFetch(`/api/engine/games/${id}/`);
      if (response.detail) {
        error.value = response.detail;
        notify({ type: 'error', title: 'Erreur', text: response.detail });
      } else {
        const data = response;
        if (!data || !data.id) throw new Error('Données de jeu invalides');

        // Requirements Parsing (Fallback if API supports it later, otherwise null)
        configurationSystemMinimal.value = data.metadata?.pc_requirements?.minimum || "Données non disponibles";
        configurationSystemRecommended.value = data.metadata?.pc_requirements?.recommended || "Données non disponibles";
        
        let headerImg = data.metadata?.header_image;
        if (!headerImg && data.steam_app_id) {
            headerImg = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${data.steam_app_id}/header.jpg`;
        }
        
        // Get size from versions
        let detectedSize = data.total_size || 0;
        if (data.versions && data.versions.length > 0) {
          detectedSize = detectedSize || data.versions[0].file_size_bytes || data.versions[0].file_size || 0;
        }

        // Map to game.value
        game.value = {
            id: data.id,
            steam_app_id: data.steam_app_id,
            title: data.display_name || data.title || '',
            slug: data.slug || '',
            header: headerImg || '/assets/placeholder.webp',
            background: headerImg || '/assets/placeholder.webp',
            video: data.metadata?.trailers?.[0] || '',
            description: data.metadata?.description || data.description || 'Aucune description disponible.',
            descriptionShort: data.metadata?.short_description || '',
            screenshots: data.metadata?.screenshots || [],
            categories: data.metadata?.genres || data.categories || [],
            tags: data.metadata?.tags || data.tags || [],
            developer: data.metadata?.developers?.[0] || 'N/A',
            publisher: data.metadata?.publishers?.[0] || 'N/A',
            release_date: data.metadata?.release_date || 'N/A',
            views: data.views || 0,
            likes: data.likes || 0,
            favorites_count: data.favorites_count || 0,
            downloads_count: data.downloads_count || 0,
            is_liked: data.is_liked || false,
            is_favorited: data.is_favorited || false,
            isOnline: data.metadata?.tags?.includes('Multi-player') || data.metadata?.tags?.includes('Co-op') || false,
            source: data.versions?.[0]?.source || data.source || [],
            versions: data.versions || [],
            size: detectedSize,
            updated_at: data.last_updated || '',
        };
        
        isFavorite.value = data.is_favorited || false;
        
        await updateInstallationStatus();
        
        // Fetch Stats if logged in
        if (store.user?.id) {
            try {
                stats.value = await window.electronAPI?.invoke('get-game-stats', { userId: store.user.id, gameId: data.id });
            } catch (e) {
                console.error('Failed to fetch stats', e);
            }
        }
      }
  } catch (err: any) {
      console.error("Fetch Data Error:", err);
      // ...
  } finally {
      loading.value = false;
  }
}

function parseHTML(html: string) {
  return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

async function isInstalled(id: string) {
  try {
    const isInstalledBool = await window.electronAPI?.invoke('is-game-installed', id);
    if (isInstalledBool) {
        // If installed, try to get info
        const info = await window.electronAPI?.invoke('get-game-install-info', id);
        if (info) {
             installed.value = {
                 id: info.id,
                 title: info.title,
                 path: info.installPath,
                 executable: info.exePath
             };
        }
        return true;
    }
    installed.value = null;
    return false;
  } catch (e) { 
      installed.value = null;
      return false; 
  }
}

// Open screenshot in new window for full view
function openScreenshot(url: string) {
    window.open(url, '_blank');
}

function prettyBites(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function prettyMilliseconds(ms: number) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  return `${Math.floor(hour / 24)}d ${hour % 24}h ${min % 60}m ${sec % 60}s`;
}

function formatNumber(num: number) {
    return new Intl.NumberFormat('fr-FR', { notation: "compact", compactDisplay: "short" }).format(num);
}

function getSourceName(source: any): string {
    if (Array.isArray(source) && source.length > 0) {
      // New format: array of strings like ['onlinefix', 'steamrip']
      if (typeof source[0] === 'string') return source[0].toUpperCase();
      // Old format fallback: array of objects
      return source[0].name || source[0] || 'N/A';
    }
    if (typeof source === 'string') return source.toUpperCase();
    return 'N/A';
}

function handleImageError(event: Event) {
  (event.target as HTMLImageElement).src = '/assets/placeholder-cover.jpg';
}

// --- LIKE / FAVORITE / VIEW / REPORT API CALLS ---

// The new API handles interactions via /api/engine/games/<slug>/favorite/ and /like/
async function toggleFavorite() {
    if (!store.user?.id) {
        notify({ type: 'warn', title: 'Connexion requise', text: 'Connectez-vous pour ajouter aux favoris.' });
        return;
    }
    if (!game.value?.slug || isLoadingFavorite.value) return;
    
    isLoadingFavorite.value = true;
    try {
        if (isFavorite.value) {
            await useFetch(`/api/engine/games/${game.value.slug}/unfavorite/`, 'POST');
            isFavorite.value = false;
            notify({ type: 'success', text: 'Retiré des favoris' });
        } else {
            await useFetch(`/api/engine/games/${game.value.slug}/favorite/`, 'POST');
            isFavorite.value = true;
            notify({ type: 'success', text: 'Ajouté aux favoris' });
        }
        await store.fetchFavorites();
    } catch (err) {
        console.error('toggleFavorite error:', err);
        notify({ type: 'error', text: 'Erreur lors de la mise à jour des favoris' });
    } finally {
        isLoadingFavorite.value = false;
    }
}

async function toggleLike() {
    if (!store.user?.id) {
        notify({ type: 'warn', title: 'Connexion requise', text: 'Connectez-vous pour liker.' });
        return;
    }
    if (!game.value?.slug) return;
    
    try {
        if (game.value.is_liked) {
            await useFetch(`/api/engine/games/${game.value.slug}/unlike/`, 'POST');
            game.value.is_liked = false;
            game.value.likes = Math.max(0, (game.value.likes || 1) - 1);
            notify({ type: 'success', text: 'Like retiré' });
        } else {
            await useFetch(`/api/engine/games/${game.value.slug}/like/`, 'POST');
            game.value.is_liked = true;
            game.value.likes = (game.value.likes || 0) + 1;
            notify({ type: 'success', text: 'Jeu liké !' });
        }
    } catch (err) {
        console.error('toggleLike error:', err);
        notify({ type: 'error', text: 'Erreur lors du like' });
    }
}

async function checkFavoriteStatus() {
    // Already fetched from API response in fetchData
    if (game.value?.is_favorited !== undefined) {
        isFavorite.value = game.value.is_favorited;
    }
}

async function registerView() {
    // Prevent double view registration logic if needed
    if (!game.value?.slug) return;
    try {
        await useFetch(`/api/engine/games/${game.value.slug}/view/`, 'POST');
    } catch (err) {
        console.error('registerView error:', err);
    }
}

async function submitReport() {
    if (!store.user?.id) {
        notify({ type: 'warn', title: 'Connexion requise', text: 'Connectez-vous pour signaler un jeu.' });
        return;
    }
    if (!game.value?.slug || !reportReason.value) return;

    isReporting.value = true;
    try {
        await useFetch(`/api/engine/games/${game.value.slug}/report/`, 'POST', {
            reason: reportReason.value,
            details: reportDetails.value
        });
        
        notify({ type: 'success', title: 'Signalement envoyé', text: 'Merci pour votre retour.' });
        showReportModal.value = false;
        reportReason.value = '';
        reportDetails.value = '';
    } catch (err) {
        console.error('Report error:', err);
        notify({ type: 'error', title: 'Erreur', text: 'Impossible d\'envoyer le signalement.' });
    } finally {
        isReporting.value = false;
    }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #3f3f46;
}

.animate-slow-zoom {
    animation: slow-zoom 20s infinite alternate;
}
@keyframes slow-zoom {
    from { transform: scale(1.05); }
    to { transform: scale(1.15); }
}

.animate-slide-up {
    animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slide-up {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
</style>
