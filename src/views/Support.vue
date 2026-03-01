<template>
  <div class="h-full flex">

    <!-- ========== LEFT PANEL: TICKET LIST ========== -->
    <div class="w-[320px] xl:w-[360px] h-full flex flex-col border-r border-white/5 bg-[#070707] shrink-0">
      
      <!-- Header -->
      <div class="p-4 border-b border-white/5">
        <!-- Title Row -->
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-base font-bold text-white flex items-center gap-2">
            <LifebuoyIcon class="w-4 h-4" :class="isStaff ? 'text-orange-400' : 'text-emerald-400'" />
            <span>{{ isStaff ? 'Support Staff' : 'Support' }}</span>
            <span v-if="isStaff" class="text-[8px] font-black px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 uppercase tracking-wider">Staff</span>
          </h1>
          <div class="flex items-center gap-2">
            <!-- Debug toggle: only for upsilon (id:2) -->
            <button 
              v-if="canToggleMode"
              @click="debugForceUser = !debugForceUser"
              class="px-2 py-1 rounded text-[9px] font-bold transition-all border"
              :class="debugForceUser 
                ? 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400' 
                : 'bg-orange-500/15 border-orange-500/20 text-orange-400'"
            >
              {{ debugForceUser ? '👤 User' : '⚙ Staff' }}
            </button>
            <button 
              v-if="!isStaff"
              @click="createNewTicket"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              Nouveau
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative mb-3">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input 
            v-model="searchQuery"
            type="text" 
            :placeholder="isStaff ? 'Rechercher ticket, user...' : 'Rechercher...'"
            class="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <XMarkIcon class="w-2.5 h-2.5 text-zinc-400" />
          </button>
        </div>

        <!-- Status Pills -->
        <div class="flex items-center gap-1 mb-2">
          <button 
            v-for="f in statusFilters" :key="f.id"
            @click="activeFilter = f.id"
            class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5"
            :class="activeFilter === f.id 
              ? 'bg-white/10 text-white shadow-sm' 
              : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]'"
          >
            <span>{{ f.label }}</span>
            <span 
              v-if="f.count > 0" 
              class="min-w-[16px] h-4 flex items-center justify-center text-[9px] font-black rounded-full px-1"
              :class="activeFilter === f.id ? 'bg-white/15 text-white' : 'bg-zinc-800/80 text-zinc-500'"
            >{{ f.count }}</span>
          </button>
        </div>

        <!-- Staff: Category Filter Dropdown -->
        <div v-if="isStaff" class="flex items-center gap-2 mt-1">
          <span class="text-[9px] text-zinc-600 font-bold uppercase tracking-wider shrink-0">Cat.</span>
          <select 
            :value="activeCategoryFilter || ''" 
            @change="activeCategoryFilter = ($event.target as HTMLSelectElement).value || null"
            class="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-zinc-400 focus:outline-none focus:border-orange-500/30 appearance-none cursor-pointer transition-colors"
          >
            <option value="" class="bg-zinc-900 text-zinc-400">Toutes catégories</option>
            <option v-for="cat in categoryFilters" :key="cat.id" :value="cat.id" class="bg-zinc-900 text-zinc-300">{{ cat.label }}</option>
          </select>
        </div>

        <!-- Active Filters Bar + Reset -->
        <div v-if="hasActiveFilters" class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div class="flex items-center gap-1.5">
            <span class="text-[9px] text-zinc-700 font-bold uppercase tracking-wider">Filtres actifs</span>
            <span v-if="activeFilter !== 'all'" class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-bold">{{ statusFilters.find(f => f.id === activeFilter)?.label }}</span>
            <span v-if="activeCategoryFilter" class="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold">{{ categories.find(c => c.id === activeCategoryFilter)?.label }}</span>
            <span v-if="searchQuery" class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-bold">"{{ searchQuery }}"</span>
          </div>
          <button 
            @click="resetFilters" 
            class="text-[9px] font-bold text-zinc-600 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Ticket List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div v-if="filteredTickets.length === 0" class="p-8 text-center">
          <div class="text-2xl mb-2 opacity-40">📭</div>
          <p class="text-[11px] text-zinc-700 font-medium">Aucun ticket</p>
        </div>

        <div 
          v-for="t in filteredTickets" :key="t.id"
          @click="selectTicket(t.id)"
          class="relative px-4 py-3.5 cursor-pointer transition-all border-b border-white/[0.03]"
          :class="selectedTicketId === t.id 
            ? 'bg-white/[0.04] border-l-2 border-l-emerald-500 pl-3.5' 
            : 'hover:bg-white/[0.02] border-l-2 border-l-transparent pl-3.5'"
        >
          <!-- Row 1: Status dot + Subject + Time -->
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <div class="w-2 h-2 rounded-full shrink-0" :class="getStatusDot(t.status)"></div>
              <span class="text-[13px] font-bold text-white truncate leading-tight">{{ t.subject }}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span v-if="t.unread" class="w-2 h-2 rounded-full" :class="isStaff ? 'bg-orange-500' : 'bg-emerald-500'"></span>
              <span class="text-[10px] text-zinc-600 font-medium">{{ t.timeAgo }}</span>
            </div>
          </div>

          <!-- Row 2: User + Badges (Staff) -->
          <div v-if="isStaff" class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
              <span class="text-[9px] font-black text-orange-400">{{ (t.userPseudo || '?').charAt(0).toUpperCase() }}</span>
            </div>
            <span class="text-[11px] font-bold text-orange-400/80">@{{ t.userPseudo || '?' }}</span>
            <span class="text-zinc-800">·</span>
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-500">{{ t.categoryLabel }}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md" :class="getPriorityBadge(t.priority)">{{ t.priority }}</span>
            </div>
          </div>

          <!-- Row 3: Last message preview -->
          <p class="text-[11px] text-zinc-600 truncate leading-snug" :class="isStaff ? '' : 'mt-0.5'">{{ t.lastMessage }}</p>
        </div>
      </div>

      <!-- Staff Stats Footer -->
      <div v-if="isStaff" class="p-3 border-t border-white/5 bg-black/20">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <div class="text-white font-black text-sm">{{ stats.open }}</div>
            <div class="text-[9px] text-zinc-600 font-bold">Ouverts</div>
          </div>
          <div>
            <div class="text-white font-black text-sm">{{ stats.waiting }}</div>
            <div class="text-[9px] text-zinc-600 font-bold">En attente</div>
          </div>
          <div>
            <div class="text-white font-black text-sm">{{ stats.today }}</div>
            <div class="text-[9px] text-zinc-600 font-bold">Aujourd'hui</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== RIGHT PANEL: TICKET VIEW ========== -->
    <div class="flex-1 h-full flex flex-col bg-[#050505]">

      <!-- No ticket selected -->
      <div v-if="!selectedTicket" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center">
            <ChatBubbleLeftRightIcon class="w-7 h-7 text-zinc-800" />
          </div>
          <p class="text-sm font-bold text-zinc-600">{{ isStaff ? 'Sélectionnez un ticket à traiter' : 'Sélectionnez un ticket' }}</p>
          <p class="text-[11px] text-zinc-800 mt-1">{{ isStaff ? `${stats.open + stats.waiting} tickets en attente` : 'ou créez-en un nouveau' }}</p>
          <button v-if="!isStaff" @click="createNewTicket" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5">
            <PlusIcon class="w-3.5 h-3.5" />
            Nouveau ticket
          </button>
        </div>
      </div>

      <!-- ---- VIEW TICKET ---- -->
      <template v-if="selectedTicket">
        <!-- Ticket Header -->
        <div class="p-5 border-b border-white/5">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" :class="getStatusBadge(selectedTicket.status)">
                  {{ getStatusLabel(selectedTicket.status) }}
                </span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" :class="getPriorityBadge(selectedTicket.priority)">
                  {{ selectedTicket.priority }}
                </span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-zinc-900 text-zinc-500">
                  {{ selectedTicket.categoryLabel }}
                </span>
                <span class="text-[9px] text-zinc-700">#{{ selectedTicket.id.slice(-6) }}</span>
              </div>
              <h2 class="text-sm font-bold text-white truncate">{{ selectedTicket.subject }}</h2>
              <div class="flex items-center gap-2 mt-0.5">
                <p class="text-[10px] text-zinc-600">{{ selectedTicket.createdAt }}</p>
                <span v-if="isStaff && selectedTicket.userPseudo" class="text-[10px] font-bold text-orange-400/80">
                  par @{{ selectedTicket.userPseudo }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <!-- Staff: quick status change -->
              <template v-if="isStaff">
                <button 
                  v-if="selectedTicket.status !== 'closed'"
                  @click="changeStatus(selectedTicket.id, 'closed')"
                  class="px-2.5 py-1 rounded text-[10px] font-bold text-zinc-600 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  v-if="selectedTicket.status === 'closed'"
                  @click="changeStatus(selectedTicket.id, 'open')"
                  class="px-2.5 py-1 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                >
                  Rouvrir
                </button>
              </template>
              <!-- User -->
              <template v-else>
                <button 
                  v-if="selectedTicket.status !== 'closed'"
                  @click="closeTicket(selectedTicket.id)"
                  class="px-2.5 py-1 rounded text-[10px] font-bold text-zinc-600 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                >
                  Fermer
                </button>
                <button 
                  v-if="selectedTicket.status === 'closed'"
                  @click="reopenTicket(selectedTicket.id)"
                  class="px-2.5 py-1 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                >
                  Rouvrir
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Messages Thread -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <div 
            v-for="msg in selectedTicket.messages" :key="msg.id"
            class="flex gap-3"
            :class="isStaff ? (msg.isStaff ? 'flex-row-reverse' : '') : (msg.isStaff ? '' : 'flex-row-reverse')"
          >
            <!-- Avatar -->
            <div 
              class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              :class="msg.isStaff ? 'bg-orange-600/20 text-orange-400' : 'bg-indigo-600/20 text-indigo-400'"
            >
              {{ msg.isStaff ? 'JC' : (isStaff ? 'U' : 'Moi') }}
            </div>
            <!-- Bubble -->
            <div 
              class="max-w-[70%] rounded-2xl px-4 py-2.5"
              :class="getBubbleClass(msg.isStaff)"
            >
              <p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{{ msg.content }}</p>
              <div class="text-[9px] mt-1.5" :class="msg.isStaff ? 'text-orange-400/30' : 'text-indigo-400/30'">
                {{ msg.time }}
              </div>
            </div>
          </div>

          <!-- Closed notice -->
          <div v-if="selectedTicket.status === 'closed'" class="text-center py-3">
            <span class="text-[10px] text-zinc-700 font-bold bg-zinc-900/50 px-3 py-1 rounded-full">Ce ticket est fermé</span>
          </div>
        </div>

        <!-- Reply Input -->
        <div v-if="selectedTicket.status !== 'closed'" class="p-4 border-t border-white/5">
          <!-- Staff reply indicator -->
          <div v-if="isStaff" class="flex items-center gap-1.5 mb-2">
            <div class="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
            <span class="text-[9px] font-bold text-orange-400/60 uppercase tracking-wider">Réponse Staff</span>
          </div>
          <div class="flex gap-2">
            <input 
              v-model="replyMessage"
              @keydown.enter="sendReply"
              type="text" 
              :placeholder="isStaff ? 'Répondre en tant que staff...' : 'Répondre...'"
              class="flex-1 bg-white/[0.03] border rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
              :class="isStaff ? 'border-orange-500/20 focus:border-orange-500/40' : 'border-white/5 focus:border-emerald-500/30'"
            />
            <button 
              @click="sendReply"
              :disabled="!replyMessage.trim()"
              class="px-4 py-2.5 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-white"
              :class="isStaff ? 'bg-orange-600 hover:bg-orange-500' : 'bg-emerald-600 hover:bg-emerald-500'"
            >
              <PaperAirplaneIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </template>

    </div>

    <!-- ========== NEW TICKET MODAL (user only) ========== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isCreating" class="fixed inset-0 z-[9999] flex items-center justify-center" @click.self="isCreating = false">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div class="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-600/15 flex items-center justify-center">
                  <PencilSquareIcon class="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-white">Nouveau ticket</h2>
                  <p class="text-[10px] text-zinc-600">Décrivez votre problème</p>
                </div>
              </div>
              <button @click="isCreating = false" class="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                <XMarkIcon class="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
            <div class="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div>
                <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Catégorie</label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button 
                    v-for="cat in categories" :key="cat.id"
                    @click="newTicket.category = cat.id"
                    class="py-2.5 rounded-xl text-center transition-all border"
                    :class="newTicket.category === cat.id 
                      ? 'bg-emerald-600/15 border-emerald-500/30 shadow-sm' 
                      : 'bg-white/[0.02] border-white/[0.04] hover:border-white/10'"
                  >
                    <div class="text-base mb-0.5">{{ cat.icon }}</div>
                    <div class="text-[10px] font-bold" :class="newTicket.category === cat.id ? 'text-emerald-400' : 'text-zinc-600'">{{ cat.label }}</div>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Sujet</label>
                <input v-model="newTicket.subject" type="text" placeholder="Ex: Téléchargement bloqué"
                  class="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                <textarea v-model="newTicket.description" rows="4" placeholder="Détaillez votre problème..."
                  class="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all resize-none leading-relaxed"></textarea>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Priorité</label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button 
                    v-for="p in priorityOptions" :key="p.id"
                    @click="newTicket.priority = p.id"
                    class="py-2 rounded-xl text-[11px] font-bold transition-all border text-center"
                    :class="newTicket.priority === p.id ? p.activeClass : 'bg-white/[0.02] border-white/[0.04] text-zinc-600 hover:border-white/10'"
                  >
                    {{ p.dot }} {{ p.label }}
                  </button>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-white/5 flex items-center gap-2">
              <button @click="isCreating = false" class="flex-1 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 font-bold text-xs transition-colors border border-white/5">
                Annuler
              </button>
              <button @click="submitNewTicket" :disabled="!newTicket.subject.trim() || !newTicket.category"
                class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <PaperAirplaneIcon class="w-3 h-3" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { 
  MagnifyingGlassIcon, PlusIcon, XMarkIcon,
  PencilSquareIcon, PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon, ChevronDownIcon 
} from '@heroicons/vue/24/solid';
import { LifebuoyIcon } from '@heroicons/vue/24/outline';
import { useNotification } from '@kyvg/vue3-notification';
import { useMainStore } from '../store';
import { JeuxCracksAPI } from '../services/api';

const { notify } = useNotification();
const store = useMainStore();

// ---- Staff Detection ----
const debugForceUser = ref(false);
const canToggleMode = computed(() => {
    const u = store.user as any;
    return u && (u.id === 2 || u.email === 'upsilon@jeuxcracks.fr');
});
const isStaff = computed(() => {
    if (canToggleMode.value && debugForceUser.value) return false;
    return !!(store.user as any)?.is_staff;
});

// ---- State ----
const searchQuery = ref('');
const activeFilter = ref('all');
const activeCategoryFilter = ref<string | null>(null);
const selectedTicketId = ref<string | null>(null);
const isCreating = ref(false);
const replyMessage = ref('');
const loading = ref(false);

// ---- Types ----
interface Message {
    id: string;
    content: string;
    time: string;
    isStaff: boolean;
}

interface Ticket {
    id: string;
    subject: string;
    category: string;
    categoryLabel: string;
    priority: string;
    status: 'open' | 'replied' | 'waiting' | 'closed';
    createdAt: string;
    timeAgo: string;
    lastMessage: string;
    unread: boolean;
    userPseudo?: string;
    messages: Message[];
}

// ---- Categories ----
const categories = [
    { id: 'download', label: 'Téléchargement', icon: '📥' },
    { id: 'account', label: 'Compte', icon: '👤' },
    { id: 'premium', label: 'Premium', icon: '⭐' },
    { id: 'bug', label: 'Bug', icon: '🐛' },
    { id: 'suggestion', label: 'Suggestion', icon: '💡' },
    { id: 'other', label: 'Autre', icon: '📎' },
];

const categoryLabels: Record<string, string> = {
    download: 'Téléchargement', account: 'Compte', premium: 'Premium',
    bug: 'Bug', suggestion: 'Suggestion', other: 'Autre',
};

const categoryFilters = categories;

const priorityOptions = [
    { id: 'basse', label: 'Basse', dot: '🟢', activeClass: 'bg-green-600/20 border-green-500/20 text-green-400' },
    { id: 'moyenne', label: 'Moyenne', dot: '🟡', activeClass: 'bg-amber-600/20 border-amber-500/20 text-amber-400' },
    { id: 'haute', label: 'Haute', dot: '🔴', activeClass: 'bg-red-600/20 border-red-500/20 text-red-400' },
];

// ---- Data ----
const tickets = ref<Ticket[]>([]);

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
}

function mapApiTicket(raw: any): Ticket {
    return {
        id: String(raw.id),
        subject: raw.subject,
        category: raw.category,
        categoryLabel: categoryLabels[raw.category] || raw.category,
        priority: raw.priority,
        status: raw.status,
        createdAt: formatDate(raw.created_at),
        timeAgo: timeAgo(raw.updated_at),
        lastMessage: raw.last_message || '',
        unread: raw.unread || false,
        userPseudo: raw.user_pseudo || undefined,
        messages: (raw.messages || []).map((m: any) => ({
            id: String(m.id),
            content: m.content,
            time: formatTime(m.created_at),
            isStaff: m.is_staff,
        })),
    };
}

// ---- Load ----
async function loadTickets() {
    loading.value = true;
    try {
        const data = isStaff.value
            ? await JeuxCracksAPI.getStaffTickets()
            : await JeuxCracksAPI.getTickets();
        tickets.value = (data || []).map(mapApiTicket);
    } catch (e) {
        console.error('Erreur chargement tickets:', e);
    } finally {
        loading.value = false;
    }
}

async function loadTicketDetail(id: string) {
    try {
        const data = isStaff.value
            ? await JeuxCracksAPI.getStaffTicketDetail(Number(id))
            : await JeuxCracksAPI.getTicketDetail(Number(id));
        const mapped = mapApiTicket(data);
        const idx = tickets.value.findIndex(t => t.id === id);
        if (idx >= 0) {
            const existing = tickets.value[idx];
            // Only update messages + status, keep user info intact
            existing.messages = mapped.messages;
            existing.status = mapped.status;
            existing.lastMessage = mapped.lastMessage || existing.lastMessage;
            existing.timeAgo = mapped.timeAgo || existing.timeAgo;
            existing.unread = false;
        }
    } catch (e) {
        console.error('Erreur chargement détail:', e);
    }
}

onMounted(loadTickets);

// ---- Stats (Staff) ----
const stats = computed(() => ({
    open: tickets.value.filter(t => t.status === 'open').length,
    waiting: tickets.value.filter(t => t.status === 'waiting').length,
    today: tickets.value.filter(t => t.timeAgo.includes('h') || t.timeAgo.includes('m') || t.timeAgo === "À l'instant").length,
}));

// ---- Filters ----
const statusFilters = computed(() => [
    { id: 'all', label: 'Tous', count: tickets.value.length },
    { id: 'open', label: 'Ouverts', count: tickets.value.filter(t => t.status === 'open' || t.status === 'waiting').length },
    { id: 'replied', label: 'Répondus', count: tickets.value.filter(t => t.status === 'replied').length },
    { id: 'closed', label: 'Fermés', count: tickets.value.filter(t => t.status === 'closed').length },
]);

const hasActiveFilters = computed(() => activeFilter.value !== 'all' || activeCategoryFilter.value || searchQuery.value.trim());

function resetFilters() {
    activeFilter.value = 'all';
    activeCategoryFilter.value = null;
    searchQuery.value = '';
}

const filteredTickets = computed(() => {
    let list = tickets.value;
    if (activeFilter.value === 'open') list = list.filter(t => t.status === 'open' || t.status === 'waiting');
    else if (activeFilter.value === 'replied') list = list.filter(t => t.status === 'replied');
    else if (activeFilter.value === 'closed') list = list.filter(t => t.status === 'closed');
    
    if (activeCategoryFilter.value) {
        list = list.filter(t => t.category === activeCategoryFilter.value);
    }

    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(t => 
            t.subject.toLowerCase().includes(q) || 
            t.lastMessage.toLowerCase().includes(q) ||
            (t.userPseudo && t.userPseudo.toLowerCase().includes(q))
        );
    }
    return list;
});

const selectedTicket = computed(() => tickets.value.find(t => t.id === selectedTicketId.value) || null);

// ---- Actions ----
async function selectTicket(id: string) {
    selectedTicketId.value = id;
    isCreating.value = false;
    await loadTicketDetail(id);
    const t = tickets.value.find(t => t.id === id);
    if (t) t.unread = false;
}

function createNewTicket() {
    isCreating.value = true;
    selectedTicketId.value = null;
}

const newTicket = ref({ category: '', subject: '', description: '', priority: 'moyenne' });

async function submitNewTicket() {
    try {
        const data = await JeuxCracksAPI.createTicket({
            subject: newTicket.value.subject,
            category: newTicket.value.category,
            priority: newTicket.value.priority,
            description: newTicket.value.description || newTicket.value.subject,
        });
        const mapped = mapApiTicket(data);
        tickets.value.unshift(mapped);
        selectedTicketId.value = mapped.id;
        isCreating.value = false;
        newTicket.value = { category: '', subject: '', description: '', priority: 'moyenne' };
        notify({ type: 'success', title: 'Ticket créé', text: 'Nous vous répondrons rapidement.' });
    } catch (e) {
        notify({ type: 'error', title: 'Erreur', text: 'Impossible de créer le ticket.' });
    }
}

async function sendReply() {
    if (!replyMessage.value.trim() || !selectedTicket.value) return;
    const ticketNumId = Number(selectedTicket.value.id);
    const content = replyMessage.value;
    replyMessage.value = '';

    try {
        if (isStaff.value) {
            await JeuxCracksAPI.staffReply(ticketNumId, content);
        } else {
            await JeuxCracksAPI.replyTicket(ticketNumId, content);
        }
        await loadTicketDetail(selectedTicket.value.id);
    } catch (e) {
        notify({ type: 'error', title: 'Erreur', text: 'Impossible d\'envoyer la réponse.' });
        replyMessage.value = content; // restore on error
    }
}

async function changeStatus(id: string, newStatus: string) {
    try {
        if (isStaff.value) {
            await JeuxCracksAPI.staffChangeStatus(Number(id), newStatus);
        } else if (newStatus === 'closed') {
            await (JeuxCracksAPI as any).closeTicket(Number(id));
        } else {
            await (JeuxCracksAPI as any).reopenTicket(Number(id));
        }
        const t = tickets.value.find(t => t.id === id);
        if (t) t.status = newStatus as Ticket['status'];
        notify({ type: 'info', title: `Ticket ${newStatus === 'closed' ? 'fermé' : 'rouvert'}` });
    } catch (e) {
        notify({ type: 'error', title: 'Erreur', text: 'Impossible de changer le statut.' });
    }
}

function closeTicket(id: string) { changeStatus(id, 'closed'); }
function reopenTicket(id: string) { changeStatus(id, 'open'); }

// ---- Helpers ----
function getStatusDot(status: string) {
    const map: Record<string, string> = { open: 'bg-blue-500', replied: 'bg-emerald-500', waiting: 'bg-amber-500', closed: 'bg-zinc-700' };
    return map[status] || 'bg-zinc-700';
}

function getStatusBadge(status: string) {
    const map: Record<string, string> = { 
        open: 'bg-blue-500/15 text-blue-400', 
        replied: 'bg-emerald-500/15 text-emerald-400', 
        waiting: 'bg-amber-500/15 text-amber-400', 
        closed: 'bg-zinc-800 text-zinc-500' 
    };
    return map[status] || 'bg-zinc-800 text-zinc-500';
}

function getStatusLabel(status: string) {
    const map: Record<string, string> = { open: 'Ouvert', replied: 'Répondu', waiting: 'En attente', closed: 'Fermé' };
    return map[status] || status;
}

function getPriorityBadge(priority: string) {
    const map: Record<string, string> = { 
        basse: 'bg-green-500/15 text-green-500', 
        moyenne: 'bg-amber-500/15 text-amber-500', 
        haute: 'bg-red-500/15 text-red-500' 
    };
    return map[priority] || 'bg-zinc-800 text-zinc-500';
}

function getPriorityDot(priority: string) {
    const map: Record<string, string> = { 
        basse: 'bg-green-500/15 text-green-500', 
        moyenne: 'bg-amber-500/15 text-amber-500', 
        haute: 'bg-red-500/15 text-red-500' 
    };
    return map[priority] || '';
}

function getBubbleClass(isMsgStaff: boolean) {
    if (isStaff.value) {
        return isMsgStaff 
            ? 'bg-orange-600/10 border border-orange-500/10 rounded-tr-sm' 
            : 'bg-zinc-900/60 border border-white/5 rounded-tl-sm';
    }
    return isMsgStaff 
        ? 'bg-zinc-900/60 border border-white/5 rounded-tl-sm' 
        : 'bg-indigo-600/10 border border-indigo-500/10 rounded-tr-sm';
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #18181b;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #27272a;
}

/* Modal transitions */
.modal-enter-active {
    transition: all 0.2s ease-out;
}
.modal-leave-active {
    transition: all 0.15s ease-in;
}
.modal-enter-from {
    opacity: 0;
}
.modal-enter-from > div:last-child {
    transform: scale(0.95) translateY(10px);
}
.modal-leave-to {
    opacity: 0;
}
.modal-leave-to > div:last-child {
    transform: scale(0.97);
}
</style>
