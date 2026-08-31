import { mascaraTelefone, removerMascaraTelefone, validarTelefone } from './mascara.js';
import { usuarioPreencheuFormulario, renderizarFormularioConsentimento } from './consentimento.js';

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

// ============================================
// FUNÇÃO: Renderizar Calendário
// ============================================
export function renderCalendar(centroId, centroNome) {
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
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[98vh] sm:max-h-[95vh] overflow-hidden" 
             style="border-top: 4px solid ${CORES.primary}; display: flex; flex-direction: column;">
            
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
            
            <!-- Horários Disponíveis -->
            <div class="px-3 sm:px-4 py-2 flex-1 min-h-0" style="flex-shrink: 1; overflow: hidden; display: flex; flex-direction: column;">
                <div class="flex items-center justify-between mb-1 flex-shrink-0">
                    <h4 class="font-semibold flex items-center gap-1 text-xs sm:text-sm" style="color: ${CORES.secondary};">
                        <i class="fas fa-clock" style="color: ${CORES.primary};"></i> 
                        <span>Horários</span>
                        <span id="contagemHorarios" class="text-[10px] font-normal text-gray-400 ml-1"></span>
                    </h4>
                </div>
                <div id="horariosList" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 flex-1 overflow-y-auto" 
                     style="max-height: 180px; min-height: 80px; align-content: start;">
                    <div class="col-span-full text-center py-4 text-xs" style="color: ${CORES.gray[500]};">
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
        
        let estilo = '';
        let classes = 'h-8 sm:h-9 text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium';
        
        if (isPast) {
            classes += ' bg-gray-100 text-gray-400 cursor-not-allowed';
        } else if (isSelected) {
            classes += ' text-white scale-105 shadow-md font-bold';
            estilo = `background: ${CORES.primary};`;
        } else if (isToday) {
            classes += ' border-2 font-bold';
            estilo = `border-color: ${CORES.primary}; color: ${CORES.primary};`;
        } else {
            classes += ' hover:scale-105 cursor-pointer';
            estilo = `background: ${CORES.gray[50]}; color: ${CORES.secondary};`;
        }
        
        html += `
            <button 
                onclick="window.selecionarData('${dataStr}')"
                class="${classes}"
                style="${estilo}"
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
// FUNÇÃO: Carregar Horários
// ============================================
// ============================================
// FUNÇÃO: Carregar Horários (CORRIGIDA)
// ============================================
async function carregarHorarios() {
    const container = document.getElementById('horariosList');
    if (!container) return;
    
    if (!estado.dataSelecionada) {
        container.innerHTML = `
            <div class="col-span-full text-center py-4 text-xs" style="color: ${CORES.gray[500]};">
                <i class="fas fa-calendar-day mr-1" style="color: ${CORES.primary};"></i>
                Selecione uma data
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="col-span-full text-center py-4 text-xs" style="color: ${CORES.primary};">
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
                <div class="col-span-full text-center py-4 text-xs" style="color: ${CORES.gray[500]};">
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
        
        // 🔥 RENDERIZAR OS BOTÕES
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
            
            if (isPassado) {
                bgColor = '#F9FAFB';
                textColor = '#9CA3AF';
                borderColor = '#D1D5DB';
                statusText = '🔒 Encerrado';
                statusColor = '#9CA3AF';
                descColor = '#9CA3AF';
            } else if (temVaga) {
                bgColor = '#FFFFFF';
                textColor = '#4B4B4D';
                borderColor = '#E5E7EB';
                statusText = `${horario.vagasDisponiveis} vaga${horario.vagasDisponiveis > 1 ? 's' : ''}`;
                statusColor = '#6B7280';
                descColor = '#F4742B';
            } else {
                bgColor = '#F9FAFB';
                textColor = '#9CA3AF';
                borderColor = '#E5E7EB';
                statusText = 'Esgotado';
                statusColor = '#EF4444';
                descColor = '#9CA3AF';
            }
            
            return `
                <button 
                    data-horario-id="${horario.id}"
                    onclick="${isClickable ? `window.selecionarHorario('${horario.id}', '${horario.hora_inicio}', '${horario.hora_fim}')` : ''}"
                    class="p-2 rounded-xl border-2 transition-all duration-200 text-center ${isClickable ? 'cursor-pointer hover:border-[#F4742B] hover:bg-[#FEF3E8] active:scale-95' : 'cursor-not-allowed'}"
                    style="border-color: ${borderColor}; background: ${bgColor};"
                    ${isClickable ? '' : 'disabled'}
                >
                    <div class="text-xs sm:text-sm font-bold" style="color: ${textColor};">
                        ${horario.hora_inicio.substring(0, 5)}
                    </div>
                    <div class="text-[8px] sm:text-[10px] font-medium" style="color: ${statusColor};">
                        ${statusText}
                    </div>
                    ${descricao && !isPassado ? `
                        <div class="text-[7px] sm:text-[9px] font-medium truncate max-w-[80px] sm:max-w-[100px] mx-auto mt-0.5" 
                             style="color: ${descColor};"
                             title="${descricao}">
                            ${descricao.length > 10 ? descricao.substring(0, 10) + '...' : descricao}
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
            <div class="col-span-full text-center py-4 text-xs" style="color: ${CORES.danger};">
                <i class="fas fa-exclamation-circle mr-1"></i> Erro ao carregar
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Selecionar Data (GLOBAL)
// ============================================
window.selecionarData = function(dataStr) {
    console.log('📅 Data selecionada:', dataStr);
    
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
    console.log('🕐 Clique no horário:', horarioId);
    console.log('📌 Estado atual:', estado.horarioSelecionado);
    
    // Se clicou no mesmo horário, desmarcar
    if (estado.horarioSelecionado && estado.horarioSelecionado.id === horarioId) {
        console.log('🔄 Desmarcando horário');
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
    console.log('✅ Selecionando horário:', horarioId);
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
    
    console.log('🎨 Atualizando cores. Selecionado ID:', horarioSelecionadoId);
    console.log('📊 Total de botões:', botoes.length);
    
    botoes.forEach(btn => {
        const id = btn.dataset.horarioId;
        const isSelected = id === horarioSelecionadoId;
        const isDisabled = btn.disabled;
        
        if (isSelected) {
            console.log('🟧 Aplicando estilo LARANJA para:', id);
            
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
            console.log('⬜ Resetando estilo para:', id);
            
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
// FUNÇÃO: Confirmar Agendamento (GLOBAL)
// ============================================
window.confirmarAgendamento = async function() {
    console.log('🔍 Confirmar agendamento chamado!');
    console.log('📅 Data selecionada:', estado.dataSelecionada);
    console.log('🕐 Horário selecionado:', estado.horarioSelecionado);
    
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
        
        const preencheu = await usuarioPreencheuFormulario(user.id);
        
        if (!preencheu) {
            console.log('📋 Usuário precisa preencher o formulário de consentimento');
            
            const { data: agendamentos, error: agendamentosError } = await supabase
                .from('agendamentos')
                .select('id')
                .eq('usuario_id', user.id)
                .eq('status', 'confirmado')
                .limit(1);
            
            if (agendamentosError) throw agendamentosError;
            
            if (agendamentos && agendamentos.length > 0) {
                console.log('✅ Usuário tem agendamentos antigos, marcando como preenchido');
                await supabase
                    .from('usuarios')
                    .update({ formulario_preenchido: true })
                    .eq('id', user.id);
                
                await processarAgendamento(user.id, btn, mensagem);
                return;
            } else {
                estado.agendamentoPendente = {
                    centroId: estado.centroId,
                    centroNome: estado.centroNome,
                    horarioId: estado.horarioSelecionado.id,
                    dataAgendamento: estado.dataSelecionada,
                    horarioInicio: estado.horarioSelecionado.inicio,
                    horarioFim: estado.horarioSelecionado.fim
                };
                
                console.log('📦 Agendamento pendente salvo:', estado.agendamentoPendente);
                
                mensagem.className = 'mt-2 p-2 rounded-lg text-xs sm:text-sm';
                mensagem.style.background = '#FEF3E8';
                mensagem.style.color = '#F4742B';
                mensagem.innerHTML = `
                    <i class="fas fa-info-circle mr-1"></i> 
                    ⚠️ Preencha o <strong>Questionário de Prontidão</strong> acima.
                `;
                mensagem.classList.remove('hidden');
                
                renderizarFormularioConsentimento();
                return;
            }
        }
        
        console.log('✅ Usuário já preencheu o formulário');
        await processarAgendamento(user.id, btn, mensagem);
        
    } catch (error) {
        console.error('❌ Erro ao verificar formulário:', error);
        alert('Erro ao verificar seus dados. Tente novamente.');
    }
};

// ============================================
// FUNÇÃO: Processar Agendamento
// ============================================
async function processarAgendamento(userId, btn, mensagem) {
    console.log('🔄 Processando agendamento...');
    
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
        
        const { data: existing, error: checkError } = await supabase
            .from('agendamentos')
            .select('*')
            .eq('usuario_id', userId)
            .eq('horario_id', horarioId)
            .eq('data_agendamento', dataAgendamento)
            .eq('status', 'confirmado');
        
        if (checkError) throw checkError;
        
        if (existing && existing.length > 0) {
            throw new Error('Você já tem um agendamento para este horário');
        }
        
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
        
        console.log('✅ Agendamento confirmado!');
        
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
    console.log('🔄 Processando agendamento pendente...');
    console.log('📦 Dados pendentes:', estado.agendamentoPendente);
    
    if (!estado.agendamentoPendente) {
        console.log('ℹ️ Nenhum agendamento pendente encontrado.');
        return;
    }
    
    const pendente = estado.agendamentoPendente;
    const btn = document.getElementById('btnConfirmarAgendamento');
    const mensagem = document.getElementById('mensagemAgendamento');
    
    if (!modalAtivo) {
        console.log('ℹ️ Modal do calendário não está aberto.');
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