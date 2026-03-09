<template>
  <div class="min-h-full bg-[#050505] text-zinc-300 selection:bg-indigo-500/30">
    
    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Article Content -->
    <div v-else-if="article" class="relative pb-24">
        
        <!-- Hero Header -->
        <header class="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
            <img :src="article.image" class="w-full h-full object-cover opacity-40 scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
            
            <!-- Breadcrumbs / Back -->
            <div class="absolute top-8 left-8 md:left-16 xl:left-24 z-20">
                <button 
                    @click="router.back()" 
                    class="group flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
                >
                    <ArrowLeftIcon class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span class="text-xs font-black uppercase tracking-widest text-white">Retour</span>
                </button>
            </div>

            <!-- Title Overlay -->
            <div class="absolute bottom-12 left-8 md:left-16 xl:left-24 z-20 max-w-4xl space-y-4">
                <div class="flex items-center gap-3">
                    <span 
                        class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border"
                        :class="[
                            article.accent_color === 'indigo' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : '',
                            article.accent_color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : '',
                            article.accent_color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : '',
                            !['indigo', 'amber', 'emerald'].includes(article.accent_color) ? 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400' : ''
                        ]"
                    >
                        {{ article.category }}
                    </span>
                    <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{{ formatDate(article.date) }}</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none animate-reveal-text">
                    {{ article.title }}
                </h1>
            </div>
        </header>

        <!-- Main Body -->
        <main class="max-w-4xl mx-auto px-8 md:px-0 py-16 space-y-12">
            <!-- Summary / Intro -->
            <p class="text-xl md:text-2xl font-medium text-zinc-300 leading-relaxed border-l-4 border-indigo-500 pl-8 italic">
                {{ article.description }}
            </p>

            <!-- Rendered Content -->
            <div class="prose prose-invert prose-indigo max-w-none prose-h2:text-white prose-h2:font-black prose-h2:uppercase prose-h2:tracking-tighter prose-h2:text-3xl prose-h2:mb-6 prose-p:text-zinc-400 prose-p:leading-loose prose-li:text-zinc-400 prose-strong:text-white prose-strong:font-bold">
                <div v-html="renderedContent"></div>
            </div>

            <!-- Footer CTA -->
            <div class="pt-16 border-t border-white/5 flex flex-col items-center gap-8 text-center text-zinc-500">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-px bg-zinc-800"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.4em]">Communauté</span>
                    <div class="w-12 h-px bg-zinc-800"></div>
                </div>
                <p class="text-sm max-w-md">Une question sur cette mise à jour ? Rejoignez notre Discord officiel pour en discuter avec l'équipe et les autres membres !</p>
                <a href="https://discord.jeuxcracks.fr" target="_blank" class="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-indigo-600/20">
                    Rejoindre le Discord
                </a>
            </div>
        </main>
    </div>

    <!-- 404 State -->
    <div v-else class="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <h2 class="text-4xl font-black text-white uppercase italic tracking-tighter">Article introuvable</h2>
        <p class="text-zinc-500">Désolé, cette actualité semble avoir disparu dans le néant numérique.</p>
        <router-link to="/" class="px-6 py-3 bg-zinc-900 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-xl">Retour à l'accueil</router-link>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import newsData from '../data/news.json';
import DOMPurify from 'dompurify';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const article = ref<any>(null);

function formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
}

// Simple Markdown-ish to HTML converter for the patch notes
function parseContent(content: string) {
    if (!content) return '';
    
    let html = content;
    
    // Tables
    const tableRegex = /^\|(.+)\|$\n^\|([-| :]+)\|$\n((?:^\|(.+)\|$\n?)+)/gm;
    html = html.replace(tableRegex, (match, header, divider, body) => {
        const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th class="border-b border-white/10 px-4 py-3 text-left font-black uppercase text-xs text-white">${h.trim()}</th>`).join('');
        const rows = body.trim().split('\n').map((row: string) => {
            const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="border-b border-white/5 px-4 py-3 text-sm text-zinc-400">${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<div class="overflow-x-auto my-8 border border-white/5 rounded-2xl bg-white/[0.02]"><table class="w-full border-collapse"><thead><tr class="bg-white/5">${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    });

    // Headers (## Title)
    html = html.replace(/^## (.*$)/gim, '<h2 class="mt-12 mb-6 font-black text-white uppercase tracking-tighter text-3xl">$1</h2>');
    
    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    
    // Italic (*text*)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Lists (* item)
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 mb-2 flex items-start gap-3 text-zinc-400"><span class="text-indigo-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span><span>$1</span></li>');
    
    // Paragraphs (double newlines)
    html = html.split('\n\n').map(p => {
        if (p.startsWith('<h') || p.startsWith('<li') || p.startsWith('<div') || p.startsWith('<table')) return p;
        return `<p class="mb-6 leading-loose text-zinc-400">${p}</p>`;
    }).join('\n');

    return DOMPurify.sanitize(html);
}

const renderedContent = computed(() => {
    return parseContent(article.value?.full_content || '');
});

onMounted(() => {
    loading.value = true;
    try {
        const id = Number(route.params.id);
        article.value = newsData.find(n => n.id === id);
    } catch (e) {
        console.error('Failed to load news article', e);
    } finally {
        setTimeout(() => {
            loading.value = false;
        }, 300); // Small delay for effect
    }
});
</script>

<style scoped>
@keyframes revealText {
    0% { clip-path: inset(0 100% 0 0); opacity: 0; transform: translateX(-20px); }
    100% { clip-path: inset(0 0 0 0); opacity: 1; transform: translateX(0); }
}
.animate-reveal-text {
    animation: revealText 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
}

/* Custom spacing for the prose */
:deep(h2) {
    margin-top: 3rem;
    margin-bottom: 1.5rem;
}
:deep(p) {
    margin-bottom: 1.5rem;
}
:deep(li) {
    margin-bottom: 0.5rem;
}
</style>
