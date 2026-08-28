// Importar do config
import { supabase, getCurrentUser, getUserProfile } from '../config/supabase.js';
import { renderCalendar } from '../components/calendar.js';

// ============================================
// ELEMENTOS DO DOM
// ============================================
const userName = document.getElementById('userName');
const userNameMenu = document.getElementById('userNameMenu');
const userAvatarHeader = document.getElementById('userAvatarHeader');
const userAvatarMenu = document.getElementById('userAvatarMenu');
const centrosList = document.getElementById('centrosList');
const proximasAulas = document.getElementById('proximasAulas');
const totalAulas = document.getElementById('totalAulas');
const totalCentros = document.getElementById('totalCentros');
const totalAgendamentos = document.getElementById('totalAgendamentos');
const meusAgendamentos = document.getElementById('meusAgendamentos');
const badgeAgendamentos = document.getElementById('badgeAgendamentos');
const btnLogout = document.getElementById('btnLogout');

// ============================================
// FUNÇÕES: Menu Hamburguer
// ============================================
let sidebarOpen = false;
let sidebarCollapsed = false;

// Toggle para mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Toggle para desktop (collapse)
window.toggleSidebarDesktop = function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const btnCollapse = document.getElementById('btnCollapse');
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.style.transform = 'translateX(-100%)';
        mainContent.classList.add('main-content-expanded');
        btnCollapse.classList.add('rotated');
        btnCollapse.innerHTML = '<i class="fas fa-chevron-right text-xl"></i>';
    } else {
        sidebar.style.transform = 'translateX(0)';
        mainContent.classList.remove('main-content-expanded');
        btnCollapse.classList.remove('rotated');
        btnCollapse.innerHTML = '<i class="fas fa-chevron-left text-xl"></i>';
    }
};

// Fechar menu ao clicar em link (mobile)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                window.toggleSidebar();
            }
        });
    });
});

// ============================================
// FUNÇÃO: Abrir Modal de Agendamento
// ============================================
window.abrirAgendamento = function(centroId, centroNome) {
    renderCalendar(centroId, centroNome);
};

// ============================================
// FUNÇÃO: Logout
// ============================================
async function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        await supabase.auth.signOut();
        window.location.href = '../../index.html';
    }
}

btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

// ============================================
// FUNÇÃO: Carregar Centros
// ============================================
async function loadCentros() {
    try {
        const { data, error } = await supabase
            .from('centros')
            .select('*')
            .eq('ativo', true);
        
        if (error) throw error;
        
        totalCentros.textContent = data.length;
        
        if (data.length === 0) {
            centrosList.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-8">
                    <i class="fas fa-dumbbell text-4xl mb-3 block text-[#F4742B]"></i>
                    Nenhum centro disponível no momento.
                </div>
            `;
            return;
        }
        
        // Mapeamento de imagens para cada centro (use URLs reais ou placeholders)
        const imagensCentros = {
            'CrossFit Centro': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
            'CrossFit Zona Sul': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=250&fit=crop',
            'CrossFit Zona Leste': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop'
        };
        
        // Ícones representativos para cada centro (fallback)
        const icones = ['🏋️', '💪', '🏃'];
        
        centrosList.innerHTML = data.map((centro, index) => {
            const imagem = imagensCentros[centro.nome] || `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop&random=${index}`;
            
            return `
                <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100 group">
                    <!-- Imagem do Centro -->
                    <div class="relative h-48 overflow-hidden bg-[#FEF3E8]">
                        <img 
                            src="${imagem}" 
                            alt="${centro.nome}"
                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200&font-size=0.5'"
                        >
                        <!-- Badge sobre a imagem -->
                        <div class="absolute top-3 right-3 bg-[#F4742B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            <i class="fas fa-star mr-1"></i> Destaque
                        </div>
                        <!-- Overlay com ícone -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <!-- Nome do centro sobre a imagem (mobile) -->
                        <div class="absolute bottom-3 left-3 md:hidden">
                            <span class="text-white font-bold text-lg drop-shadow-lg">${centro.nome}</span>
                        </div>
                    </div>
                    
                    <!-- Conteúdo do Card -->
                    <div class="p-5">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h3 class="font-bold text-lg text-[#4B4B4D] group-hover:text-[#F4742B] transition">
                                    ${centro.nome}
                                </h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-xs bg-[#FEF3E8] text-[#F4742B] px-2 py-0.5 rounded-full font-medium">
                                        ${centro.bairro}
                                    </span>
                                </div>
                            </div>
                            <span class="text-2xl">${icones[index % icones.length]}</span>
                        </div>
                        
                        <p class="text-gray-500 text-sm mb-1">
                            <i class="fas fa-map-pin text-[#F4742B] mr-1"></i> ${centro.endereco}
                        </p>
                        
                        <!-- Horário de Funcionamento (exemplo) -->
                        <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span><i class="far fa-clock mr-1"></i> 06:00 - 22:00</span>
                            <span>•</span>
                            <span><i class="fas fa-dumbbell mr-1"></i> 10 vagas</span>
                        </div>
                        
                        <!-- Botão Agendar com nova cor -->
                        <button 
                            onclick="abrirAgendamento('${centro.id}', '${centro.nome}')"
                            class="mt-4 w-full bg-[#F4742B] text-white py-2.5 rounded-lg font-semibold 
                                   hover:bg-[#E0601A] transition-all duration-300 
                                   transform hover:scale-[1.02] active:scale-[0.98]
                                   shadow-sm hover:shadow-md hover:shadow-[#F4742B]/25
                                   flex items-center justify-center gap-2"
                        >
                            <i class="fas fa-calendar-plus"></i>
                            Agendar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar centros:', error);
        centrosList.innerHTML = `
            <div class="col-span-full text-center text-red-500 py-8">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar centros. Tente novamente.
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Carregar Meus Agendamentos
// ============================================
async function loadMeusAgendamentos(userId) {
    try {
        const hoje = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                *,
                horarios (
                    *,
                    centros (*)
                )
            `)
            .eq('usuario_id', userId)
            .eq('status', 'confirmado')
            .gte('data_agendamento', hoje)
            .order('data_agendamento', { ascending: true })
            .limit(5);
        
        if (error) throw error;
        
        const total = data?.length || 0;
        totalAgendamentos.textContent = `${total} agendamentos`;
        
        // Atualizar badge
        if (badgeAgendamentos) {
            badgeAgendamentos.textContent = total;
            badgeAgendamentos.style.display = total > 0 ? 'flex' : 'none';
        }
        
        proximasAulas.textContent = total;
        totalAulas.textContent = total;
        
        if (!data || data.length === 0) {
            meusAgendamentos.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-calendar-plus text-4xl mb-3 block"></i>
                    <p class="text-lg font-medium">Nenhum agendamento futuro</p>
                    <p class="text-sm mt-1">Agende sua primeira aula em um dos centros acima!</p>
                </div>
            `;
            return;
        }
        
        meusAgendamentos.innerHTML = `
            <div class="divide-y divide-gray-100">
                ${data.map(ag => `
                    <div class="py-4 first:pt-0 last:pb-0 hover:bg-gray-50/50 transition px-4 -mx-4 rounded-lg">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                                <p class="font-semibold text-gray-800">
                                    ${ag.horarios?.centros?.nome || 'Centro não encontrado'}
                                </p>
                                <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                                    <span>
                                        <i class="far fa-calendar mr-1"></i> 
                                        ${new Date(ag.data_agendamento).toLocaleDateString('pt-BR', { 
                                            weekday: 'short', 
                                            day: '2-digit', 
                                            month: 'short', 
                                            year: 'numeric' 
                                        })}
                                    </span>
                                    <span class="hidden sm:inline">•</span>
                                    <span>
                                        <i class="far fa-clock mr-1"></i>
                                        ${ag.horarios?.hora_inicio || '--'} - ${ag.horarios?.hora_fim || '--'}
                                    </span>
                                    <span class="hidden sm:inline">•</span>
                                    <span class="text-gray-400 text-xs">
                                        <i class="fas fa-map-pin mr-1"></i> ${ag.horarios?.centros?.bairro || ''}
                                    </span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 w-full md:w-auto">
                                <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 whitespace-nowrap">
                                    ✅ Confirmado
                                </span>
                                <button 
                                    onclick="cancelarAgendamento('${ag.id}')" 
                                    class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                                    title="Cancelar agendamento"
                                >
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        meusAgendamentos.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar seus agendamentos.
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Cancelar Agendamento
// ============================================
window.cancelarAgendamento = async function(agendamentoId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .eq('id', agendamentoId);
        
        if (error) throw error;
        
        alert('✅ Agendamento cancelado com sucesso!');
        window.location.reload();
        
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        alert('❌ Erro ao cancelar agendamento. Tente novamente.');
    }
};

// ============================================
// FUNÇÃO: Inicializar Dashboard
// ============================================
async function initDashboard() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = '../../index.html';
            return;
        }
        
        const profile = await getUserProfile(user.id);
        
        const nome = profile?.nome || user.email?.split('@')[0] || 'Usuário';
        
        // Atualizar todos os lugares com o nome
        userName.textContent = nome;
        userNameMenu.textContent = nome;
        
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=667eea&color=fff`;
        userAvatarHeader.src = avatarUrl;
        userAvatarMenu.src = avatarUrl;
        
        await Promise.all([
            loadCentros(),
            loadMeusAgendamentos(user.id)
        ]);
        
        console.log('✅ Dashboard carregado!');
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', initDashboard);