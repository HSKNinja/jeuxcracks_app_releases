<template>
  <div class="h-full overflow-y-auto custom-scrollbar">
    <div class="p-6 md:p-10 xl:p-16 space-y-8 max-w-6xl mx-auto w-full">
    
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-medium text-white tracking-tight">Profil</h1>
      <p class="text-zinc-500 text-sm mt-1">Gérez vos informations et préférences.</p>
    </div>

    <!-- Main Profile Card -->
    <div class="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/5 shadow-2xl transition-all duration-300">
      
      <!-- Banner -->
      <div v-if="themeStore.getEquippedBanner" class="absolute top-0 left-0 w-full h-32 md:h-40 z-0 overflow-hidden">
          <div v-if="themeStore.getEquippedBanner.is_css_only" class="absolute inset-0 opacity-40" :class="themeStore.getEquippedBanner.css_class"></div>
          <img v-else :src="themeStore.getEquippedBanner.image_url" class="w-full h-full object-cover opacity-50 blur-[2px] brightness-50" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none"></div>
      </div>
      <div v-else class="absolute top-0 left-0 w-full h-32 md:h-40 z-0 bg-gradient-to-b from-zinc-800/10 to-[#0a0a0a] pointer-events-none"></div>

      <div class="relative z-10 p-6 md:p-10 mt-16 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 border-b border-white/5 pb-8">
        
        <!-- Avatar Section -->
        <div class="relative group cursor-pointer flex-shrink-0" @click="triggerFileInput">
            <div class="relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
              
              <!-- Mask -->
              <div class="w-full h-full rounded-full bg-[#111] overflow-hidden relative z-10 border border-white/10 shadow-xl">
                  <img v-if="user?.profile_picture" :src="resolveAvatar(user.profile_picture)" class="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400 font-medium text-3xl">
                      {{ user?.pseudo?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CameraIcon class="w-6 h-6 text-white" />
                  </div>
              </div>

              <!-- Frames -->
              <img v-if="themeStore.getEquippedFrame && !themeStore.getEquippedFrame.is_css_only" 
                    :src="themeStore.getEquippedFrame.image_url" 
                    class="absolute -inset-[22%] w-[144%] h-[144%] max-w-none object-contain pointer-events-none z-20" />
              <div v-if="themeStore.getEquippedFrame && themeStore.getEquippedFrame.is_css_only"
                    class="pointer-events-none z-20"
                    :class="themeStore.getEquippedFrame.css_class">
              </div>
            </div>
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleImageUpload" />
            
            <!-- VIP Badge -->
            <div v-if="user?.is_vip" class="absolute -bottom-2 -right-2 z-30 bg-gradient-to-r from-amber-200 to-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-amber-500/20">
              PREMIUM
            </div>
        </div>

        <!-- Info Section -->
        <div class="flex-1 text-center md:text-left space-y-4 md:mt-4">
          
          <div class="space-y-1.5">
            <h2 class="text-3xl font-medium text-white tracking-tight" 
                :class="themeStore.getEquippedPseudoEffect ? themeStore.getEquippedPseudoEffect.css_class : ''">
                {{ user?.pseudo }}
            </h2>
            
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span v-if="user?.is_staff || user?.is_superuser" class="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium tracking-widest uppercase">
                  Staff
                </span>
                <span v-else class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-medium tracking-widest uppercase">
                  Membre
                </span>
                
                <template v-if="user?.temporary_group_name">
                    <span v-for="group in (Array.isArray(user.temporary_group_name) ? user.temporary_group_name : [user.temporary_group_name])" :key="group" 
                          class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-medium tracking-widest uppercase">
                      {{ group }}
                    </span>
                </template>
            </div>
          </div>
            
          <div class="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-6 text-sm text-zinc-500 font-medium">
              <span class="flex items-center gap-2">
                  <EnvelopeIcon class="w-4 h-4 text-zinc-600" />
                  {{ user?.email }}
              </span>
              <span class="hidden md:inline text-zinc-800">|</span>
              <span class="flex items-center gap-2">
                  <CalendarIcon class="w-4 h-4 text-zinc-600" />
                  Depuis {{ formatDate(user?.date_joined) }}
              </span>
          </div>
        </div>

        <!-- Desktop Actions -->
        <div class="hidden md:flex flex-col gap-2 mt-4">
            <button @click="isEditing = true" class="px-5 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-colors">
                Éditer le profil
            </button>
            <button @click="logout" class="px-5 py-2 rounded-lg bg-[#111] border border-white/5 text-zinc-400 font-medium text-sm hover:text-white hover:bg-zinc-800 transition-colors">
                Se déconnecter
            </button>
        </div>

      </div>
      
      <!-- Mobile Actions -->
      <div class="md:hidden flex divide-x divide-white/5 bg-[#050505]/50">
          <button @click="isEditing = true" class="flex-1 py-4 text-white font-medium text-sm hover:bg-white/5 transition-colors">
              Éditer le profil
          </button>
          <button @click="logout" class="flex-1 py-4 text-zinc-500 font-medium text-sm hover:bg-white/5 transition-colors text-center">
              Déconnexion
          </button>
      </div>
    </div>

    <!-- Main Content Layout (2 Columns) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        <!-- Left Column: Stats & Setup -->
        <div class="lg:col-span-1 space-y-6 md:space-y-8">
            
            <!-- Quick Stats -->
            <div class="space-y-4">
                <h3 class="text-sm font-medium text-zinc-500 uppercase tracking-widest px-1">Aperçu</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col group hover:border-white/10 transition-colors">
                        <ComputerDesktopIcon class="w-5 h-5 text-zinc-500 mb-3 group-hover:text-zinc-300 transition-colors" />
                        <div class="text-2xl font-medium text-white tracking-tight mb-0.5">{{ libraryCount }}</div>
                        <div class="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Jeux</div>
                    </div>

                    <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col group hover:border-white/10 transition-colors">
                        <ClockIcon class="w-5 h-5 text-zinc-500 mb-3 group-hover:text-zinc-300 transition-colors" />
                        <div class="text-xl font-medium text-white tracking-tight mb-0.5 truncate" :title="prettyMilliseconds(totalStats.totalTimePlayedMs)">
                          {{ prettyMilliseconds(totalStats.totalTimePlayedMs) }}
                        </div>
                        <div class="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Temps de jeu total</div>
                    </div>
                </div>
            </div>

            <!-- Settings List -->
            <div class="space-y-4">
                <h3 class="text-sm font-medium text-zinc-500 uppercase tracking-widest px-1">Paramètres</h3>
                <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                    
                    <button @click="isDmcaOpen = true" class="w-full text-left p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors focus:outline-none">
                        <div class="flex items-center gap-4">
                            <div class="w-9 h-9 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/5">
                              <ScaleIcon class="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <div class="font-medium text-white text-sm">Mentions Légales</div>
                                <div class="text-xs text-zinc-500">Conformité DMCA</div>
                            </div>
                        </div>
                        <ChevronRightIcon class="w-4 h-4 text-zinc-600" />
                    </button>

                    <button @click="deleteAccount" class="w-full text-left p-4 md:p-5 flex items-center justify-between hover:bg-red-500/[0.02] transition-colors group focus:outline-none">
                        <div class="flex items-center gap-4">
                            <div class="w-9 h-9 rounded-full bg-red-500/5 flex items-center justify-center border border-red-500/10 group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-colors">
                              <TrashIcon class="w-4 h-4 text-red-500/70 group-hover:text-red-500 transition-colors" />
                            </div>
                            <div>
                                <div class="font-medium text-red-400 text-sm group-hover:text-red-500 transition-colors">Supprimer la compte</div>
                                <div class="text-xs text-red-400/50 group-hover:text-red-400/80 transition-colors">Action définitive</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

        </div>

        <!-- Right Column: Activity & Security -->
        <div class="lg:col-span-2 space-y-6 md:space-y-8">
            
            <!-- Security & Links -->
            <div class="space-y-4">
                <h3 class="text-sm font-medium text-zinc-500 uppercase tracking-widest px-1">Sécurité & Connexions</h3>
                <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                    <div class="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div class="flex items-start gap-4">
                            <div class="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                                <KeyIcon class="w-5 h-5" />
                            </div>
                            <div>
                                <h4 class="text-base font-medium text-white">Mot de passe</h4>
                                <p class="text-sm text-zinc-500 mt-1 max-w-sm">Mettez à jour votre mot de passe pour sécuriser votre compte. Il est recommandé de le changer régulièrement.</p>
                            </div>
                        </div>
                        <button @click="isPasswordModalOpen = true" class="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors shrink-0 whitespace-nowrap">
                            Modifier le mot de passe
                        </button>
                    </div>

                    <div class="w-full h-px bg-white/5 my-6"></div>

                    <div class="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div class="flex items-start gap-4">
                            <div class="w-10 h-10 rounded-full bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/20 text-[#5865F2] shrink-0 mt-0.5 overflow-hidden">
                                <img v-if="discordLinked && discordAvatar" :src="discordAvatar" class="w-full h-full object-cover" alt="avatar" />
                                <svg v-else class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                            </div>
                            <div>
                                <h4 class="text-base font-medium text-white flex items-center gap-2">
                                    Discord
                                    <span v-if="discordLinked" class="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Lié</span>
                                </h4>
                                <p v-if="discordLinked" class="text-sm text-zinc-400 mt-1">Connecté en tant que <span class="text-white font-medium">@{{ discordUsername }}</span></p>
                                <p v-else class="text-sm text-zinc-500 mt-1 max-w-sm">Liez votre compte Discord pour trouver vos amis jouant sur JeuxCracks et récupérer automatiquement votre avatar.</p>
                            </div>
                        </div>
                        <button v-if="!discordLinked" @click="connectDiscord" :disabled="discordConnecting" class="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors shrink-0 whitespace-nowrap disabled:opacity-60 flex items-center gap-2">
                            <span v-if="discordConnecting" class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            {{ discordConnecting ? 'En attente...' : 'Connecter' }}
                        </button>
                        <span v-else class="px-5 py-2.5 text-green-400 text-sm font-medium shrink-0 whitespace-nowrap flex items-center gap-1.5">✓ Compte lié</span>
                    </div>
                </div>
            </div>

            <!-- Activity / Interaction Board -->
            <div class="space-y-4">
               <div class="flex items-center justify-between px-1">
                   <h3 class="text-sm font-medium text-zinc-500 uppercase tracking-widest">Activité & Support</h3>
               </div>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <!-- Suggestions -->
                   <button @click="isSuggestionOpen = true" class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col group hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-300 text-left items-start relative overflow-hidden">
                       <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors"></div>
                       <ChatBubbleLeftRightIcon class="w-6 h-6 text-indigo-400 mb-4" />
                       <div class="text-lg font-medium text-white tracking-tight mb-1 relative z-10">Boîte à idées</div>
                       <div class="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors relative z-10">Signalez un bug, proposez une amélioration ou un jeu à ajouter au catalogue.</div>
                   </button>

                   <!-- Downloads Log -->
                   <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col group text-left relative overflow-hidden opacity-50 select-none">
                       <ArrowDownTrayIcon class="w-6 h-6 text-zinc-500 mb-4" />
                       <div class="text-lg font-medium text-white tracking-tight mb-1 flex items-center gap-2">Historique <span class="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">WIP</span></div>
                       <div class="text-sm text-zinc-500">Retrouvez la liste de vos derniers téléchargements et installations.</div>
                   </div>
               </div>
            </div>

        </div>
    </div>

    <!-- MODALS -->
    
    <!-- Edit Profile Modal -->
    <div v-if="isEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="isEditing = false">
      <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fade-in-up">
        <h3 class="text-lg font-medium text-white mb-6">Éditer le profil</h3>
        
        <div class="space-y-5">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2">Pseudo</label>
            <input 
              v-model="editForm.pseudo"
              type="text" 
              class="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
              placeholder="Nouveau pseudo"
            />
          </div>
          
          <div class="flex items-center gap-3 pt-2">
            <button @click="isEditing = false" class="flex-1 px-4 py-2.5 rounded-lg bg-[#111] border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-sm transition-colors">
              Annuler
            </button>
            <button @click="saveProfile" class="flex-1 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-medium text-sm transition-colors">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Modal -->
    <div v-if="isSuggestionOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="isSuggestionOpen = false">
      <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-medium text-white">Boîte à idées</h3>
            <button @click="isSuggestionOpen = false" class="p-1 rounded text-zinc-500 hover:text-white transition-colors">
                <XMarkIcon class="w-5 h-5" />
            </button>
        </div>
        
        <form @submit.prevent="submitSuggestion" class="space-y-5">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2">Sujet</label>
            <input 
              v-model="suggestionForm.title"
              type="text" 
              required
              class="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Mon idée de fonctionnalité..."
            />
          </div>
          
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2">Détails</label>
            <textarea 
              v-model="suggestionForm.content"
              rows="4"
              required
              class="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Donnez-nous quelques détails..."
            ></textarea>
          </div>
          
          <button type="submit" :disabled="isSubmittingSuggestion" class="w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-colors mt-2" :class="isSubmittingSuggestion ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-white hover:bg-zinc-200 text-black'">
              {{ isSubmittingSuggestion ? 'Envoi...' : 'Envoyer à l\'équipe' }}
          </button>
        </form>
      </div>
    </div>

    <!-- DMCA Modal -->
    <div v-if="isDmcaOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="isDmcaOpen = false">
      <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden animate-fade-in-up max-h-[80vh] flex flex-col">
        
        <div class="flex items-center justify-between mb-6 flex-shrink-0">
            <h3 class="text-lg font-medium text-white">Politique DMCA</h3>
            <button @click="isDmcaOpen = false" class="p-1 rounded text-zinc-500 hover:text-white transition-colors">
                <XMarkIcon class="w-5 h-5" />
            </button>
        </div>
        
        <div class="overflow-y-auto custom-scrollbar pr-2 text-sm text-zinc-400 leading-relaxed text-justify space-y-4 font-medium">
            <h4 class="text-white text-sm">POLITIQUE DE CONFORMITÉ (DMCA)</h4>
            
            <p>
                JeuxCracks s'engage à respecter scrupuleusement les dispositions de la Digital Millennium Copyright Act. Nous accordons une importance primordiale à toutes les réclamations relatives à des infractions aux droits d'auteur.
            </p>
            <p>
                Si vous estimez qu'un logiciel ou un jeu vidéo protégé par des droits d'auteur est distribué sans autorisation, nous vous prions de bien vouloir nous adresser une notification contenant :
            </p>
            <ul class="list-disc pl-5 space-y-1 text-zinc-500">
                <li>Adresse physique complète</li>
                <li>Numéro de téléphone</li>
                <li>Adresse courriel valide</li>
                <li>Lien(s) concerné(s)</li>
            </ul>
            <p>
                Contact : <span class="text-indigo-400 select-all">upsilon@jeuxcracks.fr</span>
            </p>
            <p>
                Nous examinerons chaque notification sérieusement avec suppression du contenu sous 72 heures si avéré.
            </p>
            <div class="mt-4 p-4 rounded-lg bg-[#111] border border-white/5 text-xs text-zinc-500">
                L'équipe ne soutient pas le piratage actif. Les éléments disponibles sont soumis par des pairs. Si une œuvre vous plaît et que vous en avez les moyens, soutenez toujours leurs créateurs originaux en l'achetant légalement.
            </div>
        </div>
        
        <div class="mt-6 pt-6 border-t border-white/5 flex justify-end flex-shrink-0">
            <button @click="isDmcaOpen = false" class="px-5 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-zinc-200 transition-colors">
                Fermer
            </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" @click.self="isDeleteModalOpen = false">
      <div class="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        <div class="flex flex-col items-center text-center mb-6">
            <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                <TrashIcon class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-medium text-white mb-1">Supprimer le compte ?</h3>
            <p class="text-zinc-500 text-sm">Ceci est <span class="text-red-400 font-medium">irréversible</span>.</p>
        </div>
        
        <div class="space-y-5">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2 uppercase">Tapez "SUPPRIMER"</label>
            <input 
              v-model="deleteConfirmationText"
              type="text" 
              class="w-full bg-[#111] border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm focus:outline-none focus:border-red-500/50 transition-colors placeholder-zinc-700"
              placeholder="SUPPRIMER"
            />
          </div>
          
          <div class="flex items-center gap-3 pt-2">
            <button @click="isDeleteModalOpen = false" class="flex-1 px-4 py-2.5 rounded-lg bg-[#111] border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-sm transition-colors">
              Annuler
            </button>
            <button 
                @click="confirmDeleteAccount" 
                :disabled="deleteConfirmationText !== 'SUPPRIMER'"
                class="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
                :class="deleteConfirmationText === 'SUPPRIMER' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#111] text-zinc-600 cursor-not-allowed border border-white/5'"
            >
              Exécuter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <div v-if="isPasswordModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="isPasswordModalOpen = false">
      <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        <div class="flex flex-col mb-6">
            <h3 class="text-lg font-medium text-white mb-1">Modifier le mot de passe</h3>
            <p class="text-zinc-500 text-sm">Assurez-vous d'utiliser un mot de passe sécurisé.</p>
        </div>
        
        <form @submit.prevent="submitChangePassword" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2">Ancien mot de passe</label>
            <input 
              v-model="passwordForm.old_password"
              type="password" 
              required
              class="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2">Nouveau mot de passe</label>
            <input 
              v-model="passwordForm.new_password"
              type="password" 
              required
              class="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-2">Confirmer le nouveau mot de passe</label>
            <input 
              v-model="passwordForm.confirm_password"
              type="password" 
              required
              class="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div class="flex items-center gap-3 pt-4">
            <button type="button" @click="isPasswordModalOpen = false" class="flex-1 px-4 py-2.5 rounded-lg bg-[#111] border border-white/10 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-sm transition-colors">
              Annuler
            </button>
            <button 
                type="submit"
                :disabled="isSubmittingPassword"
                class="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all"
                :class="isSubmittingPassword ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-white hover:bg-zinc-200 text-black'"
            >
              {{ isSubmittingPassword ? 'Traitement...' : 'Valider' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useMainStore } from '../store';
import { useThemeStore } from '../store/theme';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '../config/api';

// Icons
import { 
    CameraIcon, 
    PencilIcon,
    EnvelopeIcon,
    CalendarIcon,
    ComputerDesktopIcon,
    HeartIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon,
    TrashIcon,
    XMarkIcon,
    ScaleIcon,
    ClockIcon,
    ChevronRightIcon,
    KeyIcon,
    ArrowDownTrayIcon
} from '@heroicons/vue/24/outline';

const store = useMainStore();
const router = useRouter();
const themeStore = useThemeStore();
const user = computed(() => store.user);
const libraryCount = computed(() => store.library.length);
const favoritesCount = computed(() => store.favorites.length);

// State
const isEditing = ref(false);
const isSuggestionOpen = ref(false);
const isSubmittingSuggestion = ref(false);
const isPasswordModalOpen = ref(false);
const isSubmittingPassword = ref(false);
const fileInput = ref<HTMLInputElement|null>(null);
const totalStats = ref({ totalLaunches: 0, totalTimePlayedMs: 0 });

const editForm = ref({ pseudo: '' });
const suggestionForm = ref({ title: '', content: '' });
const passwordForm = ref({ old_password: '', new_password: '', confirm_password: '' });

// Methods
const resolveAvatar = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_CONFIG.BASE_URL}${path}`;
};
const formatDate = (date: string | undefined) => date ? new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '2024';

const isDeleteModalOpen = ref(false);
const isDmcaOpen = ref(false);
const deleteConfirmationText = ref('');

// Watchers
watch(user, (newUser) => { if (newUser?.pseudo) editForm.value.pseudo = newUser.pseudo; }, { immediate: true });
watch(isDeleteModalOpen, (isOpen) => { if (!isOpen) deleteConfirmationText.value = ''; });
watch(isPasswordModalOpen, (isOpen) => { 
    if (!isOpen) {
        passwordForm.value = { old_password: '', new_password: '', confirm_password: '' }; 
        isSubmittingPassword.value = false;
    }
});

// Actions
import { useNotification } from '@kyvg/vue3-notification';
const { notify } = useNotification();

// --- Liaison Discord ---
const discordConnecting = ref(false);
let discordPoll: ReturnType<typeof setInterval> | null = null;

// Détection tolérante : selon le backend, les champs Discord peuvent avoir des noms/formes variés.
const discordData = computed(() => {
    const u: any = store.user || {};
    const id = u.discord_id || u.discordId || u.discord_user_id || u.discord?.id || null;
    const username =
        u.discord_username || u.discord_tag || u.discord_name ||
        u.discord?.username || u.discord?.global_name || '';
    let avatar =
        u.discord_avatar || u.discord_avatar_url || u.discord_avatar_hash ||
        u.discord?.avatar_url || u.discord?.avatar || '';
    // Si l'avatar n'est qu'un hash (pas une URL), on reconstruit l'URL du CDN Discord.
    if (avatar && !String(avatar).startsWith('http') && id) {
        avatar = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
    }
    return { id, username, avatar };
});

const discordLinked = computed(() => !!discordData.value.id);
const discordUsername = computed(() => discordData.value.username);
const discordAvatar = computed(() => discordData.value.avatar);

const connectDiscord = () => {
    const token = store.tokens?.access;
    if (!token) {
        notify({ type: 'error', title: 'Erreur', text: 'Reconnecte-toi puis réessaie.' });
        return;
    }
    // Ouvre le flux OAuth Discord (géré côté backend) dans le navigateur.
    if (window.electronAPI) {
        window.electronAPI.send('open-external', `${API_CONFIG.BASE_URL}/auth/discord/login/?token=${encodeURIComponent(token)}`);
    }
    notify({ type: 'info', title: 'Discord', text: 'Autorise l\'accès dans ton navigateur, puis reviens ici.' });

    // Poll le profil pour détecter la liaison (le backend écrit discord_id sur le compte).
    discordConnecting.value = true;
    let elapsed = 0;
    if (discordPoll) clearInterval(discordPoll);
    discordPoll = setInterval(async () => {
        elapsed += 3;
        try { await store.fetchUser(); } catch (e) { /* ignore */ }
        if (discordLinked.value) {
            if (discordPoll) clearInterval(discordPoll);
            discordPoll = null;
            discordConnecting.value = false;
            notify({ type: 'success', title: 'Discord lié', text: `Connecté en tant que @${discordUsername.value}` });
        } else if (elapsed >= 120) {
            // Abandon après 2 min sans liaison détectée.
            if (discordPoll) clearInterval(discordPoll);
            discordPoll = null;
            discordConnecting.value = false;
        }
    }, 3000);
};

onUnmounted(() => {
    if (discordPoll) clearInterval(discordPoll);
});

const logout = () => { store.logout(); router.push('/login'); };
const deleteAccount = () => { isDeleteModalOpen.value = true; };
const confirmDeleteAccount = async () => {
    if (deleteConfirmationText.value !== 'SUPPRIMER') return;
    if (await store.deleteAccount()) {
         notify({ type: 'success', title: 'Compte supprimé', text: 'Nous sommes tristes de vous voir partir.' });
         router.push('/login');
    } else {
        notify({ type: 'error', title: 'Erreur', text: 'Impossible de supprimer le compte.' });
    }
};

const saveProfile = async () => { 
    if (await store.updateProfile({ pseudo: editForm.value.pseudo })) { 
        isEditing.value = false; 
        notify({ type: 'success', title: 'Profil mis à jour' }); 
    } 
};
const submitSuggestion = async () => { 
    if (!suggestionForm.value.title.trim() || !suggestionForm.value.content.trim()) {
        notify({ type: 'error', title: 'Erreur', text: 'Veuillez remplir tous les champs.' });
        return;
    }

    isSubmittingSuggestion.value = true;
    const result = await store.submitSuggestion(suggestionForm.value.title, suggestionForm.value.content);
    isSubmittingSuggestion.value = false;
    
    if (result.success) { 
        isSuggestionOpen.value = false; 
        suggestionForm.value = {title:'', content:''}; 
        notify({ type: 'success', title: 'Succès', text: result.message }); 
    } else {
        notify({ type: 'error', title: 'Erreur', text: result.message });
    }
};

const submitChangePassword = async () => {
    if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
        notify({ type: 'error', title: 'Erreur', text: 'Les nouveaux mots de passe ne correspondent pas.' });
        return;
    }
    
    if (passwordForm.value.new_password.length < 8) {
        notify({ type: 'error', title: 'Erreur', text: 'Le mot de passe doit contenir au moins 8 caractères.' });
        return;
    }

    isSubmittingPassword.value = true;
    const result = await store.changePassword({ 
        old_password: passwordForm.value.old_password, 
        new_password: passwordForm.value.new_password 
    });
    isSubmittingPassword.value = false;

    if (result.success) {
        notify({ type: 'success', title: 'Succès', text: result.message });
        isPasswordModalOpen.value = false;
    } else {
        notify({ type: 'error', title: 'Erreur', text: result.message });
    }
};

const triggerFileInput = () => fileInput.value?.click();
const handleImageUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) await store.uploadProfilePicture(file); 
};


const fetchTotalStats = async () => {
    const userId = store.user?.id || 'anonymous';
    if (window.electronAPI) {
        try {
            totalStats.value = await window.electronAPI.invoke('get-total-user-stats', userId);
        } catch (e) { console.error(e); }
    }
};

function prettyMilliseconds(ms: number) {
  if (!ms) return '0 h';
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  
  if (hour > 0) return `${hour}h ${min % 60}m`;
  return `${min} min`;
}

onMounted(async () => { 
    await store.fetchFavorites();
    await fetchTotalStats();
});
</script>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeInUp { 
    from { opacity: 0; transform: translateY(10px) scale(0.98); } 
    to { opacity: 1; transform: translateY(0) scale(1); } 
}
</style>
