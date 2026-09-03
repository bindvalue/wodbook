import { mascaraTelefone, removerMascaraTelefone, validarTelefone } from './mascara.js';

// ============================================
// COMPONENTE: Calendário para Agendamento
// ============================================

let modalAtivo = null;
let estado = {
    centroId: null,
    centroNome: '',
    mesAtual: 0,
    anoAtual: 0,
    dataSelecionada: null,
    horarioSelecionado: null,
    filtroDescricao: '',
    agendamentoPendente: null
};

// Cores da marca
const CORES = {
    primary: '#F4742B',
    primaryDark: '#E0601A',
    primaryLight: '#FF8F4A',
    primaryBg: '#FEF3E8',
    secondary: '#4B4B4D',
    secondaryDark: '#333333',
    secondaryLight: '#6B6B6D',
    white: '#FFFFFF',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827'
    }
};

// Adicione esta função no início do arquivo, após as importações
function adicionarEstilosScroll() {
    // Verificar se o estilo já foi adicionado
    if (document.getElementById('calendarScrollStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'calendarScrollStyles';
    style.textContent = `
        /* 🔥 GARANTIR QUE O SCROLL FUNCIONE APENAS NA LISTA DE HORÁRIOS */
        #modalAgendamento .modal-content,
        #modalAgendamento > div {
            overflow: hidden !important;
        }
        
        #horariosList {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
        }
        
        #horariosList::-webkit-scrollbar {
            width: 4px;
        }
        
        #horariosList::-webkit-scrollbar-track {
            background: #F3F4F6;
            border-radius: 4px;
        }
        
        #horariosList::-webkit-scrollbar-thumb {
            background: #D1D5DB;
            border-radius: 4px;
        }
        
        #horariosList::-webkit-scrollbar-thumb:hover {
            background: #9CA3AF;
        }
        
        /* Mobile - scrollbar mais grossa para touch */
        @media (max-width: 640px) {
            #horariosList::-webkit-scrollbar {
                width: 6px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Chame esta função dentro de renderCalendar, antes de criar o modal
adicionarEstilosScroll();

// ============================================
// FUNÇÃO: Renderizar Calendário (LIBERADO PARA ABRIR)
// ============================================
export function renderCalendar(centroId, centroNome) {

    // 🔥 TRAVA DE SEGURANÇA REMOVIDA - O Dashboard já verifica se o usuário preencheu.
    // 🔥 LIMPA A VARIÁVEL APÓS ABRIR (Para que não fique presa na memória)
    window.agendamentoAposFormulario = null;

    // Limpar modal existente
    if (modalAtivo) {
        modalAtivo.remove();
        modalAtivo = null;
    }

    const hoje = new Date();
    estado.centroId = centroId;
    estado.centroNome = centroNome;
    estado.mesAtual = hoje.getMonth();
    estado.anoAtual = hoje.getFullYear();
    estado.dataSelecionada = null;
    estado.horarioSelecionado = null;
    estado.filtroDescricao = '';
    estado.agendamentoPendente = null;

    const modal = document.createElement('div');
    modal.id = 'modalAgendamento';
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 fade-in';
    modal.style.overflow = 'hidden'; // 🔥 IMPEDIR SCROLL DO MODAL
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[98vh] sm:max-h-[95vh]" 
             style="border-top: 4px solid ${CORES.primary}; display: flex; flex-direction: column; overflow: hidden;">
            
            <!-- Header -->
            <div class="flex justify-between items-center p-3 sm:p-4 pb-2" style="flex-shrink: 0;">
                <div class="min-w-0 flex-1">
                    <h2 class="text-sm sm:text-xl font-bold truncate" style="color: ${CORES.secondary};">
                        <i class="fas fa-calendar-plus" style="color: ${CORES.primary};"></i> 
                        <span class="hidden sm:inline">Agendar - </span>
                        <span id="centroNomeModal" class="text-xs sm:text-base">${centroNome}</span>
                    </h2>
                    <p class="text-[10px] sm:text-xs" style="color: ${CORES.secondaryLight};">Selecione uma data e horário</p>
                </div>
                <button onclick="window.fecharModalAgendamento()" class="text-xl sm:text-2xl transition hover:scale-110 flex-shrink-0 ml-2" 
                        style="color: ${CORES.gray[400]};">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Navegação do Mês -->
            <div class="flex justify-between items-center px-3 sm:px-4 py-1" style="flex-shrink: 0;">
                <button onclick="window.mudarMes(-1)" 
                        class="px-2 sm:px-3 py-1 rounded-lg transition hover:scale-105 text-xs sm:text-sm"
                        style="background: ${CORES.gray[100]}; color: ${CORES.secondary};">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="tituloMes" class="text-sm sm:text-base font-semibold" style="color: ${CORES.secondary};">
                    ${getNomeMes(estado.mesAtual)} ${estado.anoAtual}
                </h3>
                <button onclick="window.mudarMes(1)" 
                        class="px-2 sm:px-3 py-1 rounded-lg transition hover:scale-105 text-xs sm:text-sm"
                        style="background: ${CORES.gray[100]}; color: ${CORES.secondary};">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <!-- Dias da Semana -->
            <div class="grid grid-cols-7 gap-0.5 px-2 sm:px-4 py-0.5" style="flex-shrink: 0;">
                ${['D','S','T','Q','Q','S','S'].map(dia => `
                    <div class="text-center text-[9px] sm:text-[10px] font-semibold py-0.5 uppercase tracking-wider" 
                         style="color: ${CORES.secondaryLight};">
                        ${dia}
                    </div>
                `).join('')}
            </div>
            
            <!-- Grid de Dias -->
            <div id="diasGrid" class="grid grid-cols-7 gap-0.5 px-2 sm:px-4 py-1" style="flex-shrink: 0;"></div>
            
            <!-- Filtro por tipo de aula -->
            <div class="px-3 sm:px-4 py-2 bg-gray-50 border-t border-b border-gray-100" style="flex-shrink: 0;">
                <div class="flex flex-wrap items-center gap-1 sm:gap-2">
                    <label class="text-[10px] sm:text-xs font-medium text-gray-700 flex items-center gap-0.5">
                        <i class="fas fa-filter text-[#F4742B] text-[10px] sm:text-xs"></i>
                        <span class="hidden xs:inline">Filtrar:</span>
                    </label>
                    <select id="filtroTipoAula" 
                            class="flex-1 min-w-[80px] px-2 py-1 text-[10px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white"
                            onchange="window.aplicarFiltroAula()">
                        <option value="">Todos</option>
                        <option value="Team WOD">Team WOD</option>
                        <option value="Open Box">Open Box</option>
                        <option value="Aula da manhã">Manhã</option>
                        <option value="Aula da tarde">Tarde</option>
                        <option value="Aula da noite">Noite</option>
                        <option value="Aula regular">Regular</option>
                    </select>
                    <button onclick="window.limparFiltroAula()" 
                            class="px-2 py-1 text-[10px] sm:text-sm text-gray-500 hover:text-[#F4742B] transition">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <!-- 🔥 Horários Disponíveis - COM SCROLL APENAS AQUI -->
            <div class="px-3 sm:px-4 py-2 flex-1 min-h-0" 
                 style="flex-shrink: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 80px; position: relative;">
                <div class="flex items-center justify-between mb-1.5 flex-shrink-0">
                    <h4 class="font-semibold flex items-center gap-1 text-xs sm:text-sm" style="color: ${CORES.secondary};">
                        <i class="fas fa-clock" style="color: ${CORES.primary};"></i> 
                        <span>Horários Disponíveis</span>
                        <span id="contagemHorarios" class="text-[10px] font-normal text-gray-400 ml-1"></span>
                    </h4>
                    <span class="text-[9px] sm:text-[10px] text-gray-400 flex-shrink-0">
                        <i class="fas fa-chevron-down"></i> Role
                    </span>
                </div>
                <!-- 🔥 LISTA DE HORÁRIOS COM SCROLL APENAS AQUI -->
                <div id="horariosList" 
                     class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 flex-1 overflow-y-auto" 
                     style="max-height: 200px; min-height: 100px; align-content: start; padding: 4px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;">
                    <div class="col-span-full text-center py-6 text-xs" style="color: ${CORES.gray[500]};">
                        <i class="fas fa-calendar-day mr-1" style="color: ${CORES.primary};"></i>
                        Selecione uma data
                    </div>
                </div>
            </div>
            
            <!-- Botões -->
            <div class="flex gap-2 p-3 sm:p-4 pt-2 border-t border-gray-100" style="flex-shrink: 0; background: white;">
                <button onclick="window.fecharModalAgendamento()" 
                        class="flex-1 px-3 py-2.5 rounded-xl font-semibold transition text-xs sm:text-sm"
                        style="border: 2px solid ${CORES.gray[200]}; color: ${CORES.secondary}; background: transparent;">
                    Cancelar
                </button>
                <button id="btnConfirmarAgendamento" 
                        onclick="window.confirmarAgendamento()" 
                        class="flex-1 px-3 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                        style="background: ${CORES.primary}; color: white;"
                        disabled>
                    <i class="fas fa-check mr-1"></i>Confirmar
                </button>
            </div>
            
            <!-- Mensagem de Status -->
            <div id="mensagemAgendamento" class="mx-3 sm:mx-4 mb-2 hidden"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modalAtivo = modal;
    
    renderizarDias();
    modal.style.display = 'flex';
    
    // 🔥 IMPEDIR QUE O SCROLL DO MODAL AFETE A PÁGINA
    modal.addEventListener('touchmove', function(e) {
        // Se o alvo do toque não for a lista de horários, permite o scroll
        const target = e.target;
        const horariosList = document.getElementById('horariosList');
        
        // Se o toque não for dentro da lista de horários, não faz nada
        if (!horariosList || !horariosList.contains(target)) {
            // Permite o scroll normal do modal
            return;
        }
        
        // Se for dentro da lista, verifica se chegou ao fim
        const isAtTop = horariosList.scrollTop === 0;
        const isAtBottom = horariosList.scrollTop + horariosList.clientHeight >= horariosList.scrollHeight;
        
        // Se chegou ao topo ou fim, impede o scroll da página
        if (isAtTop || isAtBottom) {
            e.preventDefault();
        }
    }, { passive: false });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            window.fecharModalAgendamento();
        }
    });
    
    return modal;
}

// ============================================
// FUNÇÃO: Renderizar Dias
// ============================================
function renderizarDias() {
    const grid = document.getElementById('diasGrid');
    if (!grid) return;
    
    const primeiroDia = new Date(estado.anoAtual, estado.mesAtual, 1);
    const ultimoDia = new Date(estado.anoAtual, estado.mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    let html = '';
    
    for (let i = 0; i < diaSemanaInicio; i++) {
        html += `<div class="h-8 sm:h-9"></div>`;
    }
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = new Date(estado.anoAtual, estado.mesAtual, dia);
        const dataStr = data.toISOString().split('T')[0];
        const isPast = data < new Date(hojeStr);
        const isSelected = estado.dataSelecionada === dataStr;
        const isToday = dataStr === hojeStr;
        
        let classes = 'h-8 sm:h-9 text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium';
        
        // Remover completamente o "style" inline e usar apenas classes CSS
        if (isPast) {
            classes += ' bg-gray-100 text-gray-400 cursor-not-allowed';
        } else if (isSelected) {
            // 🔥 ESTILO DE SELEÇÃO CORRETO (com !important para forçar)
            classes += ' text-white bg-[#F4742B] border-2 border-[#F4742B] scale-105 shadow-md font-bold';
            // Adiciona uma classe customizada para garantir que o estilo aplique
            classes += ' dia-selecionado';
        } else if (isToday) {
            classes += ' border-2 border-[#F4742B] text-[#F4742B] font-bold';
        } else {
            classes += ' bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105 cursor-pointer';
        }
        
        html += `
            <button 
                onclick="window.selecionarData('${dataStr}')"
                class="${classes}"
                ${isPast ? 'disabled' : ''}
            >
                ${dia}
            </button>
        `;
    }
    
    grid.innerHTML = html;
    
    const titulo = document.getElementById('tituloMes');
    if (titulo) {
        titulo.textContent = `${getNomeMes(estado.mesAtual)} ${estado.anoAtual}`;
    }
}

// ============================================
// FUNÇÃO: Carregar Horários (CORRIGIDA - COM DESCRIÇÃO MAIS VISÍVEL)
// ============================================
async function carregarHorarios() {
    const container = document.getElementById('horariosList');
    if (!container) return;
    
    if (!estado.dataSelecionada) {
        container.innerHTML = `
            <div class="col-span-full text-center py-6 text-xs" style="color: ${CORES.gray[500]};">
                <i class="fas fa-calendar-day mr-1" style="color: ${CORES.primary};"></i>
                Selecione uma data
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="col-span-full text-center py-6 text-xs" style="color: ${CORES.primary};">
            <i class="fas fa-spinner fa-spin mr-1"></i> Carregando horários...
        </div>
    `;
    
    try {
        const { supabase } = await import('../config/supabase.js');
        
        const partes = estado.dataSelecionada.split('-');
        const ano = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[2]);
        const dataObj = new Date(ano, mes, dia);
        const diaSemana = dataObj.getDay();
        
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        const isHoje = estado.dataSelecionada === hojeStr;
        const horaAtual = hoje.getHours();
        const minutoAtual = hoje.getMinutes();
        
        const { data, error } = await supabase
            .from('horarios')
            .select(`
                *,
                centros (nome)
            `)
            .eq('centro_id', estado.centroId)
            .eq('dia_semana', diaSemana)
            .eq('ativo', true)
            .order('hora_inicio', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-6 text-xs" style="color: ${CORES.gray[500]};">
                    <i class="fas fa-info-circle mr-1" style="color: ${CORES.primary};"></i> 
                    Nenhum horário disponível
                </div>
            `;
            return;
        }
        
        const horariosComVagas = await Promise.all(data.map(async (horario) => {
            const { count, error: countError } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('horario_id', horario.id)
                .eq('data_agendamento', estado.dataSelecionada)
                .eq('status', 'confirmado');
            
            if (countError) throw countError;
            
            const vagasDisponiveis = horario.vagas - (count || 0);
            
            let horarioPassado = false;
            if (isHoje) {
                const [horaInicio, minutoInicio] = horario.hora_inicio.split(':').map(Number);
                if (horaInicio < horaAtual || (horaInicio === horaAtual && minutoInicio <= minutoAtual)) {
                    horarioPassado = true;
                }
            }
            
            return {
                ...horario,
                vagasDisponiveis: vagasDisponiveis,
                temVaga: vagasDisponiveis > 0 && !horarioPassado,
                horarioPassado: horarioPassado
            };
        }));
        
        horariosComVagas.sort((a, b) => {
            if (a.hora_inicio < b.hora_inicio) return -1;
            if (a.hora_inicio > b.hora_inicio) return 1;
            return 0;
        });
        
        // 🔥 RENDERIZAR OS BOTÕES COM DESCRIÇÃO MAIS VISÍVEL
        container.innerHTML = horariosComVagas.map(horario => {
            const isPassado = horario.horarioPassado;
            const descricao = horario.descricao || '';
            const temVaga = horario.temVaga;
            const isClickable = !isPassado && temVaga;
            
            let bgColor = '#FFFFFF';
            let textColor = '#4B4B4D';
            let borderColor = '#E5E7EB';
            let statusText = '';
            let statusColor = '#6B7280';
            let descColor = '#F4742B';
            let descFontWeight = '500';
            
            if (isPassado) {
                bgColor = '#F9FAFB';
                textColor = '#9CA3AF';
                borderColor = '#D1D5DB';
                statusText = '🔒 Encerrado';
                statusColor = '#9CA3AF';
                descColor = '#9CA3AF';
                descFontWeight = '400';
            } else if (temVaga) {
                bgColor = '#FFFFFF';
                textColor = '#4B4B4D';
                borderColor = '#E5E7EB';
                statusText = `${horario.vagasDisponiveis} vaga${horario.vagasDisponiveis > 1 ? 's' : ''}`;
                statusColor = '#6B7280';
                descColor = '#F4742B';
                descFontWeight = '600';
            } else {
                bgColor = '#F9FAFB';
                textColor = '#9CA3AF';
                borderColor = '#E5E7EB';
                statusText = 'Esgotado';
                statusColor = '#EF4444';
                descColor = '#9CA3AF';
                descFontWeight = '400';
            }
            
            return `
                <button 
                    data-horario-id="${horario.id}"
                    onclick="${isClickable ? `window.selecionarHorario('${horario.id}', '${horario.hora_inicio}', '${horario.hora_fim}')` : ''}"
                    class="p-2 rounded-xl border-2 transition-all duration-200 text-center ${isClickable ? 'cursor-pointer hover:border-[#F4742B] hover:bg-[#FEF3E8] active:scale-95' : 'cursor-not-allowed'}"
                    style="border-color: ${borderColor}; background: ${bgColor}; min-height: 60px; display: flex; flex-direction: column; justify-content: center;"
                    ${isClickable ? '' : 'disabled'}
                >
                    <div class="text-xs sm:text-sm font-bold" style="color: ${textColor};">
                        ${horario.hora_inicio.substring(0, 5)}
                    </div>
                    <div class="text-[9px] sm:text-[10px] font-medium" style="color: ${statusColor};">
                        ${statusText}
                    </div>
                    ${descricao ? `
                        <div class="text-[8px] sm:text-[10px] font-semibold truncate max-w-[100px] sm:max-w-[120px] mx-auto mt-1" 
                             style="color: ${descColor}; font-weight: ${descFontWeight};"
                             title="${descricao}">
                            ${descricao.length > 15 ? descricao.substring(0, 15) + '...' : descricao}
                        </div>
                    ` : ''}
                </button>
            `;
        }).join('');
        
        // 🔥 APÓS RENDERIZAR, APLICAR AS CORES DE SELEÇÃO
        setTimeout(() => {
            atualizarCoresDosBotoes();
        }, 50);
        
        if (estado.filtroDescricao) {
            window.aplicarFiltroAula();
        }
        
        const contagem = document.getElementById('contagemHorarios');
        if (contagem) {
            const total = horariosComVagas.length;
            contagem.textContent = `(${total})`;
        }
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-6 text-xs" style="color: ${CORES.danger};">
                <i class="fas fa-exclamation-circle mr-1"></i> Erro ao carregar
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Selecionar Data (GLOBAL)
// ============================================
window.selecionarData = function(dataStr) {
       
    if (estado.dataSelecionada === dataStr) {
        estado.dataSelecionada = null;
        estado.horarioSelecionado = null;
        estado.agendamentoPendente = null;
        
        const btn = document.getElementById('btnConfirmarAgendamento');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
        
        renderizarDias();
        carregarHorarios();
        return;
    }
    
    estado.dataSelecionada = dataStr;
    estado.horarioSelecionado = null;
    estado.agendamentoPendente = null;
    
    const btn = document.getElementById('btnConfirmarAgendamento');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    }
    
    renderizarDias();
    carregarHorarios();
};

// ============================================
// FUNÇÃO: Mudar Mês (GLOBAL)
// ============================================
window.mudarMes = function(delta) {
    estado.mesAtual += delta;
    if (estado.mesAtual < 0) {
        estado.mesAtual = 11;
        estado.anoAtual--;
    } else if (estado.mesAtual > 11) {
        estado.mesAtual = 0;
        estado.anoAtual++;
    }
    
    estado.dataSelecionada = null;
    estado.horarioSelecionado = null;
    estado.agendamentoPendente = null;
    
    const btn = document.getElementById('btnConfirmarAgendamento');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    }
    
    renderizarDias();
    carregarHorarios();
};


// ============================================
// FUNÇÃO: Selecionar Horário (GLOBAL - CORRIGIDA)
// ============================================
window.selecionarHorario = function(horarioId, horaInicio, horaFim) {
       
    // Se clicou no mesmo horário, desmarcar
    if (estado.horarioSelecionado && estado.horarioSelecionado.id === horarioId) {
        estado.horarioSelecionado = null;
        estado.agendamentoPendente = null;
        
        const btn = document.getElementById('btnConfirmarAgendamento');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
        
        // 🔥 ATUALIZAR VISUAL
        atualizarCoresDosBotoes();
        return;
    }
    
    // Selecionar novo horário
    estado.horarioSelecionado = { id: horarioId, inicio: horaInicio, fim: horaFim };
    
    estado.agendamentoPendente = {
        centroId: estado.centroId,
        centroNome: estado.centroNome,
        horarioId: horarioId,
        dataAgendamento: estado.dataSelecionada,
        horarioInicio: horaInicio,
        horarioFim: horaFim
    };
    
    const btn = document.getElementById('btnConfirmarAgendamento');
    if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.background = CORES.primary;
    }
    
    // 🔥 ATUALIZAR VISUAL
    atualizarCoresDosBotoes();
};

// ============================================
// FUNÇÃO: Atualizar Cores dos Botões (NOVA - DIRETA)
// ============================================
// ============================================
// FUNÇÃO: Atualizar Cores dos Botões (CORRIGIDA)
// ============================================
function atualizarCoresDosBotoes() {
    const botoes = document.querySelectorAll('#horariosList button[data-horario-id]');
    const horarioSelecionadoId = estado.horarioSelecionado?.id;
    
    
    botoes.forEach(btn => {
        const id = btn.dataset.horarioId;
        const isSelected = id === horarioSelecionadoId;
        const isDisabled = btn.disabled;
        
        if (isSelected) {
            // 🔥 FORÇAR O ESTILO DIRETAMENTE NO ELEMENTO
            btn.style.setProperty('background', '#F4742B', 'important');
            btn.style.setProperty('background-color', '#F4742B', 'important');
            btn.style.setProperty('border-color', '#F4742B', 'important');
            btn.style.setProperty('color', '#FFFFFF', 'important');
            
            // Mudar todos os textos dentro do botão para branco
            const allTexts = btn.querySelectorAll('div, span');
            allTexts.forEach(el => {
                el.style.setProperty('color', '#FFFFFF', 'important');
            });
            
        } else if (!isDisabled) {
                        
            // Resetar para o padrão
            btn.style.setProperty('background', '#FFFFFF', 'important');
            btn.style.setProperty('background-color', '#FFFFFF', 'important');
            btn.style.setProperty('border-color', '#E5E7EB', 'important');
            btn.style.setProperty('color', '#4B4B4D', 'important');
            
            // Restaurar cores dos textos
            const allTexts = btn.querySelectorAll('div, span');
            allTexts.forEach(el => {
                el.style.removeProperty('color');
            });
        }
    });
}

// ============================================
// FUNÇÃO: Fechar Modal Agendamento (GLOBAL)
// ============================================
window.fecharModalAgendamento = function() {
    if (modalAtivo) {
        modalAtivo.remove();
        modalAtivo = null;
    }
    estado.agendamentoPendente = null;
};

// ============================================
// FUNÇÃO: Fechar Modal de Telefone (GLOBAL)
// ============================================
window.fecharModalTelefone = function() {
    const modal = document.getElementById('modalTelefone');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// ============================================
// FUNÇÃO: Confirmar Agendamento (GLOBAL - CORRIGIDA PARA NÃO CHAMAR FORMULÁRIO)
// ============================================
window.confirmarAgendamento = async function() {
    
    if (!estado.dataSelecionada || !estado.horarioSelecionado) {
        alert('Selecione uma data e horário');
        return;
    }
    
    const btn = document.getElementById('btnConfirmarAgendamento');
    const mensagem = document.getElementById('mensagemAgendamento');
    
    try {
        const { supabase, getCurrentUser } = await import('../config/supabase.js');
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        
        // 🔥 FORMULÁRIO JÁ FOI VERIFICADO NA DASHBOARD, AGORA SÓ PROCESSA O AGENDAMENTO
        
        await processarAgendamento(user.id, btn, mensagem);
        
    } catch (error) {
        console.error('❌ Erro ao processar agendamento:', error);
        alert('Erro ao verificar seus dados. Tente novamente.');
    }
};

// ============================================
// FUNÇÃO: Processar Agendamento
// ============================================
async function processarAgendamento(userId, btn, mensagem) {
       
    const pendente = estado.agendamentoPendente;
    const horarioId = pendente?.horarioId || estado.horarioSelecionado?.id;
    const dataAgendamento = pendente?.dataAgendamento || estado.dataSelecionada;
    
    if (!horarioId || !dataAgendamento) {
        alert('Dados do agendamento não encontrados. Tente novamente.');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Confirmando...';
    btn.style.opacity = '0.7';
    
    mensagem.className = 'mt-2 p-2 rounded-lg text-xs sm:text-sm';
    mensagem.style.background = CORES.primaryBg;
    mensagem.style.color = CORES.primary;
    mensagem.textContent = '⏳ Processando...';
    mensagem.classList.remove('hidden');
    
    try {
        const { supabase } = await import('../config/supabase.js');
        
        // 🔥 VERIFICAÇÃO CORRETA: Buscar TODOS os registros, não apenas confirmados
        const { data: existing, error: checkError } = await supabase
            .from('agendamentos')
            .select('id, status')
            .eq('usuario_id', userId)
            .eq('horario_id', horarioId)
            .eq('data_agendamento', dataAgendamento);
        
        if (checkError) throw checkError;
        
        // 🔥 TRATAMENTO DE DUPLICIDADE:
        // Se já existe um registro CONFIRMADO, avisa.
        // Se existe um registro CANCELADO, atualiza o status para CONFIRMADO (evita o erro de constraint).
        if (existing && existing.length > 0) {
            const agendamentoExistente = existing.find(a => a.status === 'confirmado');
            
            if (agendamentoExistente) {
                throw new Error('Você já está agendado neste horário. Para trocar, cancele o agendamento atual primeiro.');
            }
            
            // Se não tem confirmado, mas tem cancelado, vamos "reativar" esse registro
            const agendamentoCancelado = existing.find(a => a.status === 'cancelado');
            if (agendamentoCancelado) {
                const { error: updateError } = await supabase
                    .from('agendamentos')
                    .update({ status: 'confirmado' })
                    .eq('id', agendamentoCancelado.id);
                
                if (updateError) throw updateError;
                
                estado.agendamentoPendente = null;
                
                mensagem.className = 'mt-2 p-2 rounded-lg text-xs sm:text-sm';
                mensagem.style.background = '#D1FAE5';
                mensagem.style.color = '#065F46';
                mensagem.innerHTML = `
                    <i class="fas fa-check-circle mr-1"></i> 
                    ✅ Agendamento confirmado para ${new Date(dataAgendamento).toLocaleDateString('pt-BR')} 
                    ${estado.horarioSelecionado?.inicio?.substring(0, 5) || pendente?.horarioInicio?.substring(0, 5) || '--'}h
                `;
                
                btn.innerHTML = '<i class="fas fa-check mr-1"></i>Confirmado!';
                btn.style.background = CORES.success;
                
                setTimeout(() => {
                    window.fecharModalAgendamento();
                    window.location.reload();
                }, 3000);
                
                return;
            }
        }
        
        // Se não encontrou nada (nem confirmado, nem cancelado), insere um novo
        const { data: horario, error: horarioError } = await supabase
            .from('horarios')
            .select('vagas')
            .eq('id', horarioId)
            .single();
        
        if (horarioError) throw horarioError;
        
        if (horario.vagas <= 0) {
            throw new Error('Não há vagas disponíveis para este horário');
        }
        
        const { error } = await supabase
            .from('agendamentos')
            .insert({
                usuario_id: userId,
                horario_id: horarioId,
                data_agendamento: dataAgendamento,
                status: 'confirmado'
            });
        
        if (error) throw error;
        
        await supabase
            .from('horarios')
            .update({ vagas: horario.vagas - 1 })
            .eq('id', horarioId);
                        
        estado.agendamentoPendente = null;
        
        mensagem.className = 'mt-2 p-2 rounded-lg text-xs sm:text-sm';
        mensagem.style.background = '#D1FAE5';
        mensagem.style.color = '#065F46';
        mensagem.innerHTML = `
            <i class="fas fa-check-circle mr-1"></i> 
            ✅ Agendado para ${new Date(dataAgendamento).toLocaleDateString('pt-BR')} 
            ${estado.horarioSelecionado?.inicio?.substring(0, 5) || pendente?.horarioInicio?.substring(0, 5) || '--'}h
        `;
        
        btn.innerHTML = '<i class="fas fa-check mr-1"></i>Confirmado!';
        btn.style.background = CORES.success;
        
        setTimeout(() => {
            window.fecharModalAgendamento();
            window.location.reload();
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao agendar:', error);
        mensagem.className = 'mt-2 p-2 rounded-lg text-xs sm:text-sm';
        mensagem.style.background = '#FEE2E2';
        mensagem.style.color = '#991B1B';
        mensagem.innerHTML = `
            <i class="fas fa-exclamation-circle mr-1"></i> 
            ${error.message || 'Erro ao fazer agendamento.'}
        `;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-1"></i>Confirmar';
        btn.style.opacity = '1';
        btn.style.background = CORES.primary;
    }
}
// ============================================
// FUNÇÃO AUXILIAR: Nome do Mês
// ============================================
function getNomeMes(mes) {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mes];
}

// ============================================
// FUNÇÃO: Aplicar Filtro por Tipo de Aula
// ============================================
window.aplicarFiltroAula = function() {
    const filtro = document.getElementById('filtroTipoAula')?.value || '';
    estado.filtroDescricao = filtro;
    
    const botoes = document.querySelectorAll('#horariosList button[data-horario-id]');
    let visiveis = 0;
    
    botoes.forEach(btn => {
        if (!filtro) {
            btn.style.display = '';
            visiveis++;
            return;
        }
        
        // Pegar a descrição do botão (elemento com a classe descricao)
        const descricaoEl = btn.querySelector('.text-[7px]');
        const descricao = descricaoEl?.textContent || '';
        
        if (descricao.toLowerCase().includes(filtro.toLowerCase())) {
            btn.style.display = '';
            visiveis++;
        } else {
            btn.style.display = 'none';
        }
    });
    
    const contagem = document.getElementById('contagemHorarios');
    if (contagem) {
        const total = botoes.length;
        contagem.textContent = filtro ? `(${visiveis}/${total})` : `(${total})`;
    }
};

// ============================================
// FUNÇÃO: Limpar Filtro de Aula
// ============================================
window.limparFiltroAula = function() {
    const select = document.getElementById('filtroTipoAula');
    if (select) {
        select.value = '';
    }
    estado.filtroDescricao = '';
    window.aplicarFiltroAula();
};

// ============================================
// FUNÇÃO: Processar Agendamento Pendente (Exportada)
// ============================================
export async function processarAgendamentoPendente() {
        
    if (!estado.agendamentoPendente) {
        
        return;
    }
    
    const pendente = estado.agendamentoPendente;
    const btn = document.getElementById('btnConfirmarAgendamento');
    const mensagem = document.getElementById('mensagemAgendamento');
    
    if (!modalAtivo) {
       
        return;
    }
    
    try {
        const { getCurrentUser } = await import('../config/supabase.js');
        const user = await getCurrentUser();
        if (!user) {
            console.error('❌ Usuário não autenticado.');
            return;
        }
        
        await processarAgendamento(user.id, btn, mensagem);
        
    } catch (error) {
        console.error('❌ Erro ao processar agendamento pendente:', error);
    }
}