import { loadDashboardContent } from './dashboard.js';
import { loadCentrosContent, setupCentrosEvents } from './centros.js';
import { loadHorariosContent, setupHorariosEvents } from './horarios.js';
import { loadAgendamentosContent } from './agendamentos.js';
import { loadAlunosContent, setupAlunosEvents } from './alunos.js';
import { loadConfiguracoesContent, setupConfiguracoesEvents } from './configuracoes.js';
import { showLoader } from './shared.js';

// ============================================
// ELEMENTOS GLOBAIS
// ============================================
let pageContent = null;
let pageTitle = null;
let pageSubtitle = null;
let navItems = [];

// ============================================
// INICIALIZAR ROTEADOR
// ============================================
export function initRouter(elements) {
    console.log('🔄 Inicializando router com elementos:', !!elements);
    
    pageContent = elements.pageContent;
    pageTitle = elements.pageTitle;
    pageSubtitle = elements.pageSubtitle;
    
    console.log('📦 pageContent após atribuição:', !!pageContent);
    console.log('📦 pageTitle após atribuição:', !!pageTitle);
    console.log('📦 pageSubtitle após atribuição:', !!pageSubtitle);
    
    navItems = document.querySelectorAll('.nav-item');
    console.log('📋 Itens do menu encontrados:', navItems.length);
    
    // Configurar eventos
    setupCentrosEvents();
    setupHorariosEvents();
    setupAlunosEvents();
    setupConfiguracoesEvents();
}

// ============================================
// FUNÇÃO: Carregar Página (SPA)
// ============================================
export async function loadPage(page, params = null) {
    console.log('🔄 Carregando página:', page);
    
    // Atualizar menu
    if (navItems && navItems.length > 0) {
        navItems.forEach(item => {
            item.classList.remove('active');
            const icon = item.querySelector('i');
            if (icon) icon.style.color = '';
            item.classList.add('text-white/70', 'hover:text-white');
        });
        
        const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.classList.remove('text-white/70', 'hover:text-white');
            const icon = activeItem.querySelector('i');
            if (icon) icon.style.color = '#F4742B';
        }
    }
    
    // Títulos
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Bem-vindo de volta ao seu treino' },
        'centros': { title: 'Gerenciar Centros', subtitle: 'Cadastre e gerencie os centros de treinamento' },
        'horarios': { title: 'Gerenciar Horários', subtitle: 'Configure os horários de atendimento' },
        'alunos': { title: 'Alunos', subtitle: 'Gerencie seus alunos' },
        'agendamentos': { title: 'Agendamentos', subtitle: 'Visualize todos os agendamentos' },
        'configuracoes': { title: 'Configurações', subtitle: 'Configure o sistema' }
    };
    
    if (titles[page]) {
        if (pageTitle) {
            pageTitle.textContent = titles[page].title;
        } else {
            console.warn('⚠️ pageTitle é null, tentando buscar novamente...');
            pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = titles[page].title;
            }
        }
        
        if (pageSubtitle) {
            pageSubtitle.textContent = titles[page].subtitle;
        } else {
            console.warn('⚠️ pageSubtitle é null, tentando buscar novamente...');
            pageSubtitle = document.getElementById('pageSubtitle');
            if (pageSubtitle) {
                pageSubtitle.textContent = titles[page].subtitle;
            }
        }
    }
    
    // Mostrar loader
    if (pageContent) {
        showLoader(pageContent);
    } else {
        console.warn('⚠️ pageContent é null, tentando buscar novamente...');
        pageContent = document.getElementById('pageContent');
        if (pageContent) {
            showLoader(pageContent);
        }
    }
    
    // Carregar conteúdo
    try {
        let content = '';
        
        // ✅ SWITCH CORRIGIDO - SEM DUPLICAÇÕES
        switch(page) {
            case 'dashboard':
                content = await loadDashboardContent();
                break;
            case 'centros':
                content = await loadCentrosContent();
                break;
            case 'horarios':
                content = await loadHorariosContent(params);
                break;
            case 'agendamentos':
                content = await loadAgendamentosContent();
                break;
            case 'alunos':
                content = await loadAlunosContent();
                break;
            case 'configuracoes':
                content = await loadConfiguracoesContent();
                break;
            default:
                content = `<div class="text-center py-12"><h3 class="text-xl font-bold text-[#4B4B4D]">Página em construção</h3><p class="text-gray-500 mt-2">${page}</p></div>`;
        }
        
        if (pageContent) {
            pageContent.innerHTML = content;
            pageContent.classList.remove('fade-in');
            void pageContent.offsetWidth;
            pageContent.classList.add('fade-in');
            console.log('✅ Conteúdo carregado:', page);
            
            // Aplicar filtros automáticos
            if (page === 'agendamentos' && typeof window.aplicarFiltros === 'function') {
                setTimeout(() => window.aplicarFiltros(), 300);
            }
            if (page === 'alunos' && typeof window.aplicarFiltrosAlunos === 'function') {
                setTimeout(() => window.aplicarFiltrosAlunos(), 300);
            }
        } else {
            console.error('❌ pageContent ainda é null!');
        }
        
    } catch (error) {
        console.error('Erro ao carregar página:', error);
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="text-center text-red-500 py-12">
                    <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                    Erro ao carregar página. Tente novamente.
                    <p class="text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }
}

window.loadPage = loadPage;