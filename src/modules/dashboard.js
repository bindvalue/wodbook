import { supabase, getCurrentUser, getUserProfile } from '../config/supabase.js';

// ============================================
// FUNÇÃO: Abrir Mapa (Google Maps)
// ============================================
function abrirMapa(endereco) {
    if (!endereco) {
        alert('Endereço não disponível para este centro.');
        return;
    }
    
    const enderecoCodificado = encodeURIComponent(endereco);
    const url = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;
    window.open(url, '_blank');
}

// ============================================
// FUNÇÃO: Carregar Conteúdo do Dashboard
// ============================================
export async function loadDashboardContent() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    const profile = await getUserProfile(user.id);
    const nome = profile?.nome || user.email?.split('@')[0] || 'Usuário';
    const isAdmin = profile?.role === 'admin';
    
    const userAvatarMenu = document.getElementById('userAvatarMenu');
    const userAvatarHeader = document.getElementById('userAvatarHeader');
    const userName = document.getElementById('userNameMenu');
    
    if (userAvatarMenu) {
        userAvatarMenu.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff`;
    }
    if (userAvatarHeader) {
        userAvatarHeader.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff`;
    }
    if (userName) userName.textContent = nome;
    
    const { data: centros } = await supabase
        .from('centros')
        .select('*')
        .eq('ativo', true)
        .limit(6);
    
    const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select(`
            *,
            horarios (
                id,
                hora_inicio,
                hora_fim,
                centros (
                    id,
                    nome,
                    bairro
                )
            )
        `)
        .eq('usuario_id', user.id)
        .eq('status', 'confirmado')
        .order('data_agendamento', { ascending: true });
    
    const total = agendamentos?.length || 0;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const agendamentosFuturos = agendamentos?.filter(ag => {
        const dataAg = new Date(ag.data_agendamento + 'T00:00:00');
        return dataAg >= hoje;
    }) || [];
    
    const agendamentosPassados = agendamentos?.filter(ag => {
        const dataAg = new Date(ag.data_agendamento + 'T00:00:00');
        return dataAg < hoje;
    }) || [];
    
    const totalFuturos = agendamentosFuturos.length;
    const totalPassados = agendamentosPassados.length;
    
    function formatarData(dataStr) {
        const data = new Date(dataStr + 'T00:00:00');
        const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return `${dias[data.getDay()]}, ${String(data.getDate()).padStart(2, '0')} ${meses[data.getMonth()]}`;
    }
    
    function isHoje(dataStr) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const data = new Date(dataStr + 'T00:00:00');
        return data.getTime() === hoje.getTime();
    }
    
    return `
        <!-- Hero Section -->
        <div class="relative rounded-2xl overflow-hidden mb-6">
            <div class="bg-gradient-to-br from-[#F4742B] via-[#E0601A] to-[#4B4B4D] p-6 md:p-8 text-white">
                <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
                <div class="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p class="text-white/70 text-xs font-medium uppercase tracking-wider">Bem-vindo de volta</p>
                        <h2 class="text-2xl md:text-3xl font-bold mt-1">Olá, ${nome} <span class="text-[#FEF3E8]">👋</span></h2>
                        <p class="text-white/70 text-sm mt-1">Pronto para mais um treino?</p>
                    </div>
                    <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span class="text-sm font-medium">${totalFuturos} aulas agendadas</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Próximas</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${totalFuturos}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-calendar-check text-[#F4742B] text-sm"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${total}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <i class="fas fa-check-circle text-purple-500 text-sm"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Unidades</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${centros?.length || 0}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <i class="fas fa-dumbbell text-blue-500 text-sm"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Concluídos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${totalPassados}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <i class="fas fa-flag-checkered text-green-500 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Centros -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-semibold text-[#4B4B4D] flex items-center gap-2">
                    <i class="fas fa-dumbbell text-[#F4742B]"></i> Centros de Treinamento
                </h3>
                <a href="#" onclick="window.loadPage('centros'); return false;" class="text-xs text-[#F4742B] hover:text-[#E0601A] font-medium transition flex items-center gap-1">
                    Ver todos <i class="fas fa-arrow-right text-[10px]"></i>
                </a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                ${centros?.map(centro => {
                    const imagemUrl = centro.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200&font-size=0.35`;
                    const enderecoCompleto = centro.endereco || '';
                    const bairro = centro.bairro || '';
                    return `
                        <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100/50 group transition-all duration-300 hover:shadow-md">
                            <div class="relative h-40 overflow-hidden bg-[#FEF3E8]">
                                <img src="${imagemUrl}" alt="${centro.nome}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200&font-size=0.35'">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                                <div class="absolute bottom-3 left-3">
                                    <h4 class="text-white font-semibold text-sm drop-shadow-lg">${centro.nome}</h4>
                                    <p class="text-white/70 text-xs drop-shadow-lg">${bairro || ''}</p>
                                </div>
                            </div>
                            <div class="p-4">
                                ${enderecoCompleto ? `
                                    <div class="flex items-start gap-2 text-xs text-gray-500 mb-2">
                                        <i class="fas fa-location-dot text-[#F4742B] mt-0.5 text-[10px]"></i>
                                        <span class="line-clamp-2">${enderecoCompleto}</span>
                                    </div>
                                ` : ''}
                                <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                    <span class="flex items-center gap-1"><i class="far fa-clock text-[10px]"></i> ${centro.horario_funcionamento || '06:00 - 22:00'}</span>
                                    <span>•</span>
                                    <span class="flex items-center gap-1"><i class="fas fa-users text-[10px]"></i> ${centro.vagas_padrao || 10}</span>
                                </div>
                                <div class="flex gap-2">
                                    <button data-acao="agendar" data-centro-id="${centro.id}" data-centro-nome="${centro.nome}" 
                                            class="flex-1 bg-[#F4742B] text-white text-sm font-medium py-2 rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center justify-center gap-2">
                                        <i class="fas fa-calendar-plus text-xs"></i> Agendar
                                    </button>
                                    ${enderecoCompleto ? `
                                        <button onclick="window.abrirMapa('${enderecoCompleto.replace(/'/g, "\\'")}')" class="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition active:scale-[0.98] flex items-center justify-center" title="Abrir no mapa">
                                            <i class="fas fa-map-pin text-sm"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') || `<div class="col-span-full text-center text-gray-400 py-8"><i class="fas fa-building text-3xl block mb-2 text-gray-300"></i><p class="text-sm">Nenhum centro disponível no momento</p></div>`}
            </div>
        </div>
        
        <!-- Meus Agendamentos -->
        <div>
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-semibold text-[#4B4B4D] flex items-center gap-2">
                    <i class="fas fa-clock text-[#F4742B]"></i> Meus Agendamentos
                </h3>
                <div class="flex items-center gap-2 text-xs text-gray-400">
                    <span>${totalFuturos} futuros</span>
                    <span>•</span>
                    <span>${totalPassados} concluídos</span>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                ${agendamentos?.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-12 px-4">
                        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3"><i class="fas fa-calendar-plus text-2xl text-gray-300"></i></div>
                        <p class="text-gray-500 text-sm font-medium">Nenhum agendamento</p>
                        <p class="text-gray-400 text-xs mt-1">Agende sua primeira aula em um dos centros acima</p>
                    </div>
                ` : `
                    <div class="flex border-b border-gray-100 bg-gray-50/50 px-2">
                        <button onclick="window.filtrarAgendamentos('todos')" class="px-3 py-2 text-xs font-medium text-[#F4742B] border-b-2 border-[#F4742B] transition" id="tabTodos">Todos (${total})</button>
                        <button onclick="window.filtrarAgendamentos('futuros')" class="px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition border-b-2 border-transparent" id="tabFuturos">Futuros (${totalFuturos})</button>
                        <button onclick="window.filtrarAgendamentos('passados')" class="px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition border-b-2 border-transparent" id="tabPassados">Concluídos (${totalPassados})</button>
                    </div>
                    <div id="listaAgendamentos" class="divide-y divide-gray-100">
                        ${agendamentos.map(ag => {
                            const centroNome = ag.horarios?.centros?.nome || 'Centro não identificado';
                            const centroBairro = ag.horarios?.centros?.bairro || '';
                            const dataFormatada = formatarData(ag.data_agendamento);
                            const horaInicio = ag.horarios?.hora_inicio?.substring(0,5) || '--';
                            const horaFim = ag.horarios?.hora_fim?.substring(0,5) || '--';
                            const futuro = new Date(ag.data_agendamento + 'T00:00:00') >= hoje;
                            const hojeAgendamento = isHoje(ag.data_agendamento);
                            let statusLabel = futuro ? (hojeAgendamento ? '🔥 Hoje' : '📅 Futuro') : '✅ Concluído';
                            let statusColor = futuro ? (hojeAgendamento ? 'bg-[#FEF3E8] text-[#F4742B]' : 'bg-green-50 text-green-700') : 'bg-gray-100 text-gray-500';
                            return `
                                <div class="py-3 px-4 hover:bg-gray-50/50 transition agendamento-item" data-status="${futuro ? 'futuros' : 'passados'}">
                                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <p class="font-medium text-gray-800 text-sm truncate">${centroNome}</p>
                                                <span class="text-[10px] px-2 py-0.5 rounded-full ${statusColor}">${statusLabel}</span>
                                            </div>
                                            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                                                <span class="flex items-center gap-1"><i class="far fa-calendar text-[10px]"></i> ${dataFormatada}</span>
                                                <span class="flex items-center gap-1"><i class="far fa-clock text-[10px]"></i> ${horaInicio} - ${horaFim}</span>
                                                ${centroBairro ? `<span class="flex items-center gap-1"><i class="fas fa-map-pin text-[10px]"></i> ${centroBairro}</span>` : ''}
                                            </div>
                                        </div>
                                        ${futuro ? `<button onclick="window.cancelarAgendamento('${ag.id}')" class="text-xs px-3 py-1 border border-red-300 text-red-400 hover:text-red-600 hover:border-red-500 rounded-lg hover:bg-red-50 transition flex-shrink-0"><i class="fas fa-times text-[10px] mr-1"></i> Cancelar</button>` : `<span class="text-xs px-3 py-1 bg-gray-100 text-gray-400 rounded-lg flex-shrink-0"><i class="fas fa-check text-[10px] mr-1"></i> Concluído</span>`}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

// ============================================
// 🔥🔥🔥 FUNÇÕES GLOBAIS (DEFINIDAS FORA DO LOAD) 🔥🔥🔥
// ============================================

window.abrirMapa = function(endereco) {
    if (!endereco || endereco === '') {
        alert('Endereço não disponível para este centro.');
        return;
    }
    const enderecoCodificado = encodeURIComponent(endereco);
    const url = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;
    window.open(url, '_blank');
};

window.abrirAgendamento = async function(centroId, centroNome) {
    try {
        const { supabase, getCurrentUser } = await import('../config/supabase.js');
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const { renderizarFormularioConsentimento } = await import('./consentimento.js');
        const { renderCalendar } = await import('./calendar.js');

        // 🔥 VERIFICAÇÃO CORRETA: Conta quantas vezes o usuário preencheu o formulário
        const { count, error: errCount } = await supabase
            .from('formulario_consentimento')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', user.id);

        if (errCount) {
            console.error('❌ Erro ao contar formulários:', errCount);
            window.agendamentoAposFormulario = { centroId, centroNome };
            renderizarFormularioConsentimento();
            return;
        }

        // Se o count for 0, o usuário NUNCA preencheu. Abre o formulário!
        if (count === 0) {
            window.agendamentoAposFormulario = { centroId, centroNome };
            renderizarFormularioConsentimento();
        } else {
            window.agendamentoAposFormulario = { centroId, centroNome };
            renderCalendar(centroId, centroNome);
        }

    } catch (error) {
        console.error('❌ Erro crítico ao abrir agendamento:', error);
        alert('Erro ao tentar abrir agendamento. Verifique o console.');
    }
};

// 🔥🔥🔥 EVENT DELEGATION: GARANTE QUE OS BOTÕES FUNCIONEM MESMO COM O ROUTER (NÃO DEPENDE DO ONCLICK)
document.addEventListener('click', async function(e) {
    const btn = e.target.closest('button[data-acao="agendar"]');
    
    if (btn) {
        e.preventDefault();
        e.stopPropagation(); // 🔥 IMPEDE QUE O CALENDÁRIO ABRA
        const centroId = btn.dataset.centroId;
        const centroNome = btn.dataset.centroNome;
                        
        // Chama a função que abre o formulário
        if (typeof window.abrirAgendamento === 'function') {
            await window.abrirAgendamento(centroId, centroNome);
        } else {
            console.error('❌ Função não encontrada!');
        }
    }
});

// ============================================
// FUNÇÕES DE FILTRO E CANCELAMENTO
// ============================================
window.filtrarAgendamentos = function(filtro) {
    document.querySelectorAll('#tabTodos, #tabFuturos, #tabPassados').forEach(tab => {
        if (tab) {
            tab.classList.remove('text-[#F4742B]', 'border-[#F4742B]');
            tab.classList.add('text-gray-400', 'border-transparent');
        }
    });
    
    const tabMap = { 'todos': 'tabTodos', 'futuros': 'tabFuturos', 'passados': 'tabPassados' };
    const tabAtiva = document.getElementById(tabMap[filtro]);
    if (tabAtiva) {
        tabAtiva.classList.remove('text-gray-400', 'border-transparent');
        tabAtiva.classList.add('text-[#F4742B]', 'border-[#F4742B]');
    }
    
    document.querySelectorAll('.agendamento-item').forEach(item => {
        if (filtro === 'todos') {
            item.style.display = '';
        } else {
            item.style.display = item.dataset.status === filtro ? '' : 'none';
        }
    });
};

window.cancelarAgendamento = async function(agendamentoId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    try {
        const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .eq('id', agendamentoId);
        
        if (error) throw error;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
                <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-check text-green-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-[#4B4B4D]">Agendamento Cancelado!</h3>
                <p class="text-sm text-gray-500 mt-1">Seu agendamento foi cancelado com sucesso.</p>
                <button onclick="this.closest('.fixed').remove(); window.location.reload();" class="mt-4 px-6 py-2 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
                window.location.reload();
            }
        });
        
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        alert('❌ Erro ao cancelar agendamento. Tente novamente.');
    }
    
};