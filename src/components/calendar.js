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
    // 🔥 NOVO: Guardar dados do agendamento pendente
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
    estado.agendamentoPendente = null; // 🔥 Resetar agendamento pendente

    const modal = document.createElement('div');
    modal.id = 'modalAgendamento';
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden p-6"
             style="border-top: 4px solid ${CORES.primary}; display: flex; flex-direction: column;">
            
            <!-- Header -->
            <div class="flex justify-between items-center mb-4" style="flex-shrink: 0;">
                <div>
                    <h2 class="text-xl font-bold" style="color: ${CORES.secondary};">
                        <i class="fas fa-calendar-plus" style="color: ${CORES.primary};"></i> 
                        Agendar - <span id="centroNomeModal">${centroNome}</span>
                    </h2>
                    <p class="text-xs" style="color: ${CORES.secondaryLight};">Selecione uma data e horário</p>
                </div>
                <button onclick="window.fecharModalAgendamento()" class="text-2xl transition hover:scale-110" 
                        style="color: ${CORES.gray[400]};">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Navegação do Mês -->
            <div class="flex justify-between items-center mb-3" style="flex-shrink: 0;">
                <button onclick="window.mudarMes(-1)" 
                        class="px-3 py-1.5 rounded-lg transition hover:scale-105 text-sm"
                        style="background: ${CORES.gray[100]}; color: ${CORES.secondary};">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="tituloMes" class="text-base font-semibold" style="color: ${CORES.secondary};">
                    ${getNomeMes(estado.mesAtual)} ${estado.anoAtual}
                </h3>
                <button onclick="window.mudarMes(1)" 
                        class="px-3 py-1.5 rounded-lg transition hover:scale-105 text-sm"
                        style="background: ${CORES.gray[100]}; color: ${CORES.secondary};">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <!-- Dias da Semana -->
            <div class="grid grid-cols-7 gap-1 mb-1" style="flex-shrink: 0;">
                ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(dia => `
                    <div class="text-center text-[10px] font-semibold py-1 uppercase tracking-wider" 
                         style="color: ${CORES.secondaryLight};">
                        ${dia}
                    </div>
                `).join('')}
            </div>
            
            <!-- Grid de Dias -->
            <div id="diasGrid" class="grid grid-cols-7 gap-1 mb-4" style="flex-shrink: 0;"></div>
            
            <!-- Filtro por tipo de aula -->
            <div class="mb-4 p-3 bg-gray-50 rounded-lg" style="flex-shrink: 0;">
                <div class="flex flex-wrap items-center gap-2">
                    <label class="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <i class="fas fa-filter text-[#F4742B]"></i> Filtrar por tipo:
                    </label>
                    <select id="filtroTipoAula" 
                            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white"
                            onchange="window.aplicarFiltroAula()">
                        <option value="">Todos</option>
                        <option value="Team WOD">Team WOD</option>
                        <option value="Open Box">Open Box</option>
                        <option value="Aula da manhã">Aula da manhã</option>
                        <option value="Aula da tarde">Aula da tarde</option>
                        <option value="Aula da noite">Aula da noite</option>
                        <option value="Aula regular">Aula regular</option>
                    </select>
                    <button onclick="window.limparFiltroAula()" 
                            class="px-3 py-1.5 text-sm text-gray-500 hover:text-[#F4742B] transition">
                        <i class="fas fa-times"></i> Limpar
                    </button>
                </div>
            </div>
            
            <!-- Horários Disponíveis -->
            <div class="mb-4" style="flex-shrink: 0;">
                <h4 class="font-semibold mb-2 flex items-center gap-2 text-sm" style="color: ${CORES.secondary};">
                    <i class="fas fa-clock" style="color: ${CORES.primary};"></i> 
                    Horários Disponíveis
                    <span id="contagemHorarios" class="text-xs font-normal text-gray-400 ml-auto"></span>
                </h4>
                <div id="horariosList" class="grid grid-cols-3 md:grid-cols-4 gap-1.5">
                    <div class="col-span-full text-center py-3 text-sm" style="color: ${CORES.gray[500]};">
                        Selecione uma data para ver os horários
                    </div>
                </div>
            </div>
            
            <!-- Botões -->
            <div class="flex gap-3 mt-4 pt-4 border-t border-gray-100" style="flex-shrink: 0;">
                <button onclick="window.fecharModalAgendamento()" 
                        class="flex-1 px-4 py-2 rounded-lg font-semibold transition hover:scale-[1.02] text-sm"
                        style="border: 2px solid ${CORES.gray[200]}; color: ${CORES.secondary}; background: transparent;">
                    Cancelar
                </button>
                <button id="btnConfirmarAgendamento" 
                        onclick="window.confirmarAgendamento()" 
                        class="flex-1 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        style="background: ${CORES.primary}; color: white;"
                        disabled>
                    <i class="fas fa-check mr-1"></i>Confirmar Agendamento
                </button>
            </div>
            
            <!-- Mensagem de Status -->
            <div id="mensagemAgendamento" class="mt-3 hidden"></div>
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
// FUNÇÃO: Renderizar Dias do Calendário
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
        html += `<div class="h-9"></div>`;
    }
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const data = new Date(estado.anoAtual, estado.mesAtual, dia);
        const dataStr = data.toISOString().split('T')[0];
        const isPast = data < new Date(hojeStr);
        const isSelected = estado.dataSelecionada === dataStr;
        const isToday = dataStr === hojeStr;
        
        let estilo = '';
        let classes = '';
        
        if (isPast) {
            classes = 'bg-gray-100 text-gray-400 cursor-not-allowed';
        } else if (isSelected) {
            classes = 'text-white scale-105 shadow-md';
            estilo = `background: ${CORES.primary};`;
        } else if (isToday) {
            classes = 'border-2 font-bold';
            estilo = `border-color: ${CORES.primary}; color: ${CORES.primary};`;
        } else {
            classes = 'hover:scale-105 cursor-pointer';
            estilo = `background: ${CORES.gray[50]}; color: ${CORES.secondary};`;
        }
        
        html += `
            <button 
                onclick="window.selecionarData('${dataStr}')"
                class="h-9 text-sm rounded-lg transition-all duration-200 ${classes}"
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
        
        const horariosList = document.getElementById('horariosList');
        if (horariosList) {
            horariosList.innerHTML = `
                <div class="col-span-full text-center py-3 text-sm" style="color: ${CORES.gray[500]};">
                    Selecione uma data para ver os horários
                </div>
            `;
        }
        
        renderizarDias();
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
    
    const horariosList = document.getElementById('horariosList');
    if (horariosList) {
        horariosList.innerHTML = `
            <div class="col-span-full text-center py-3 text-sm" style="color: ${CORES.gray[500]};">
                Selecione uma data para ver os horários
            </div>
        `;
    }
    
    renderizarDias();
};

// ============================================
// FUNÇÃO: Carregar Horários
// ============================================
async function carregarHorarios() {
    const container = document.getElementById('horariosList');
    if (!container) return;
    
    if (!estado.dataSelecionada) {
        container.innerHTML = `
            <div class="col-span-full text-center py-3 text-sm" style="color: ${CORES.gray[500]};">
                Selecione uma data para ver os horários
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="col-span-full text-center py-3" style="color: ${CORES.primary};">
            <i class="fas fa-spinner fa-spin mr-2"></i> Carregando horários...
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
                <div class="col-span-full text-center py-3 text-sm" style="color: ${CORES.gray[500]};">
                    <i class="fas fa-info-circle mr-1" style="color: ${CORES.primary};"></i> 
                    Nenhum horário disponível para esta data
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
        
        container.innerHTML = horariosComVagas.map(horario => {
            const isPassado = horario.horarioPassado;
            const descricao = horario.descricao || '';
            
            return `
                <button 
                    data-horario-id="${horario.id}"
                    onclick="${!isPassado && horario.temVaga ? `window.selecionarHorario('${horario.id}', '${horario.hora_inicio}', '${horario.hora_fim}')` : ''}"
                    class="p-2 rounded-lg border-2 transition-all duration-200 text-sm relative group ${!isPassado && horario.temVaga ? 'hover:border-[#F4742B] hover:bg-[#FEF3E8] cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed'}"
                    style="border-color: ${isPassado ? CORES.gray[300] : (horario.temVaga ? CORES.gray[200] : CORES.gray[200])};"
                    ${!isPassado && horario.temVaga ? '' : 'disabled'}
                >
                    <div class="text-xs font-semibold" style="color: ${isPassado ? CORES.gray[400] : (horario.temVaga ? CORES.secondary : CORES.gray[400])};">
                        ${horario.hora_inicio.substring(0, 5)} - ${horario.hora_fim.substring(0, 5)}
                        ${isPassado ? ' 🔒' : ''}
                    </div>
                    ${descricao ? `
                        <div class="descricao-horario text-[10px] text-[#F4742B] mt-0.5 font-medium truncate max-w-[120px] mx-auto" title="${descricao}">
                            <i class="fas fa-info-circle mr-0.5"></i> ${descricao.length > 20 ? descricao.substring(0, 20) + '...' : descricao}
                        </div>
                    ` : ''}
                    <div class="text-[10px]" style="color: ${isPassado ? CORES.gray[400] : (horario.temVaga ? CORES.success : CORES.danger)}; margin-top: ${descricao ? '2px' : '0'};">
                        ${isPassado ? '⏰ Horário encerrado' : (horario.temVaga ? `${horario.vagasDisponiveis} vagas` : 'Esgotado')}
                    </div>
                    
                    ${descricao && !isPassado ? `
                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#4B4B4D] text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[200px] max-w-[280px]">
                            <div class="text-center">
                                <div class="font-semibold text-[#F4742B] text-[11px]">${horario.hora_inicio.substring(0, 5)} - ${horario.hora_fim.substring(0, 5)}</div>
                                <div class="text-white text-[11px] mt-0.5 break-words">${descricao}</div>
                                <div class="text-gray-300 text-[10px] mt-1">${horario.vagasDisponiveis} vagas disponíveis</div>
                            </div>
                            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-[#4B4B4D] rotate-45"></div>
                        </div>
                    ` : ''}
                </button>
            `;
        }).join('');
        
        // Se já havia um horário selecionado, reaplicar a seleção
        if (estado.horarioSelecionado) {
            document.querySelectorAll('#horariosList button[data-horario-id]').forEach(btn => {
                if (btn.dataset.horarioId === estado.horarioSelecionado.id) {
                    btn.classList.add('selecionado');
                    btn.style.borderColor = CORES.primary;
                    btn.style.background = CORES.primaryBg;
                    btn.style.transform = 'scale(1.05)';
                    btn.style.boxShadow = '0 0 0 3px rgba(244, 116, 43, 0.15)';
                }
            });
        }
        
        if (estado.filtroDescricao) {
            window.aplicarFiltroAula();
        }
        
    } catch (error) {
        console.error('Erro ao carregar horários:', error);
        container.innerHTML = `
            <div class="col-span-full text-center py-3 text-sm" style="color: ${CORES.danger};">
                <i class="fas fa-exclamation-circle mr-1"></i> Erro ao carregar horários
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Selecionar Horário (GLOBAL)
// ============================================
window.selecionarHorario = function(horarioId, horaInicio, horaFim) {
    console.log('🕐 Horário selecionado:', horarioId, horaInicio, horaFim);
    
    // Se clicou no mesmo horário, desmarcar
    if (estado.horarioSelecionado && estado.horarioSelecionado.id === horarioId) {
        estado.horarioSelecionado = null;
        estado.agendamentoPendente = null;
        
        const btn = document.getElementById('btnConfirmarAgendamento');
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
        
        // Remover classe de seleção de todos os botões
        document.querySelectorAll('#horariosList button[data-horario-id]').forEach(btn => {
            btn.classList.remove('selecionado');
            btn.style.borderColor = CORES.gray[200];
            btn.style.background = 'transparent';
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        });
        return;
    }
    
    // Selecionar novo horário
    estado.horarioSelecionado = { id: horarioId, inicio: horaInicio, fim: horaFim };
    
    // 🔥 Guardar dados do agendamento pendente
    estado.agendamentoPendente = {
        centroId: estado.centroId,
        centroNome: estado.centroNome,
        horarioId: horarioId,
        dataAgendamento: estado.dataSelecionada
    };
    
    const btn = document.getElementById('btnConfirmarAgendamento');
    if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.background = CORES.primary;
    }
    
    // Aplicar classe de seleção
    document.querySelectorAll('#horariosList button[data-horario-id]').forEach(btn => {
        // Resetar todos
        btn.classList.remove('selecionado');
        btn.style.borderColor = CORES.gray[200];
        btn.style.background = 'transparent';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
        
        // Destacar o selecionado
        if (btn.dataset.horarioId === horarioId) {
            btn.classList.add('selecionado');
            btn.style.borderColor = CORES.primary;
            btn.style.background = CORES.primaryBg;
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 0 0 3px rgba(244, 116, 43, 0.15)';
        }
    });
};

// ============================================
// FUNÇÃO: Fechar Modal Agendamento (GLOBAL)
// ============================================
window.fecharModalAgendamento = function() {
    if (modalAtivo) {
        modalAtivo.remove();
        modalAtivo = null;
    }
    // 🔥 Limpar agendamento pendente ao fechar modal
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
// FUNÇÃO: Confirmar Agendamento (GLOBAL - CORRIGIDA)
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
        
        // 🔥 VERIFICAR FORMULÁRIO DE CONSENTIMENTO
        const preencheu = await usuarioPreencheuFormulario(user.id);
        
        if (!preencheu) {
            console.log('📋 Usuário precisa preencher o formulário de consentimento');
            
            // Verificar se já tem agendamentos (para não bloquear usuários antigos)
            const { data: agendamentos, error: agendamentosError } = await supabase
                .from('agendamentos')
                .select('id')
                .eq('usuario_id', user.id)
                .eq('status', 'confirmado')
                .limit(1);
            
            if (agendamentosError) throw agendamentosError;
            
            // Se tem agendamentos, marcar como preenchido e continuar
            if (agendamentos && agendamentos.length > 0) {
                console.log('✅ Usuário tem agendamentos antigos, marcando como preenchido');
                await supabase
                    .from('usuarios')
                    .update({ formulario_preenchido: true })
                    .eq('id', user.id);
                
                // 🔥 CONTINUAR COM O AGENDAMENTO
                await processarAgendamento(user.id, btn, mensagem);
                return;
            } else {
                // 🔥 GUARDAR DADOS DO AGENDAMENTO PENDENTE
                estado.agendamentoPendente = {
                    centroId: estado.centroId,
                    centroNome: estado.centroNome,
                    horarioId: estado.horarioSelecionado.id,
                    dataAgendamento: estado.dataSelecionada,
                    horarioInicio: estado.horarioSelecionado.inicio,
                    horarioFim: estado.horarioSelecionado.fim
                };
                
                console.log('📦 Agendamento pendente salvo:', estado.agendamentoPendente);
                
                // Mostrar mensagem antes do formulário
                mensagem.className = 'mt-3 p-2 rounded-lg text-sm';
                mensagem.style.background = '#FEF3E8';
                mensagem.style.color = '#F4742B';
                mensagem.innerHTML = `
                    <i class="fas fa-info-circle mr-1"></i> 
                    ⚠️ Antes de agendar, preencha o <strong>Questionário de Prontidão</strong> que apareceu acima.
                    <br><span style="font-size: 11px; color: #6B7280;">Seus dados de agendamento serão mantidos.</span>
                `;
                mensagem.classList.remove('hidden');
                
                // Renderizar formulário
                renderizarFormularioConsentimento();
                return;
            }
        }
        
        console.log('✅ Usuário já preencheu o formulário');
        
        // 🔥 CONTINUAR COM O AGENDAMENTO
        await processarAgendamento(user.id, btn, mensagem);
        
    } catch (error) {
        console.error('❌ Erro ao verificar formulário:', error);
        alert('Erro ao verificar seus dados. Tente novamente.');
    }
};

// ============================================
// FUNÇÃO: Processar Agendamento (Separada - CORRIGIDA)
// ============================================
async function processarAgendamento(userId, btn, mensagem) {
    console.log('🔄 Processando agendamento...');
    console.log('📦 Agendamento pendente:', estado.agendamentoPendente);
    
    // 🔥 Verificar se temos dados pendentes
    const pendente = estado.agendamentoPendente;
    const horarioId = pendente?.horarioId || estado.horarioSelecionado?.id;
    const dataAgendamento = pendente?.dataAgendamento || estado.dataSelecionada;
    const centroId = pendente?.centroId || estado.centroId;
    
    if (!horarioId || !dataAgendamento) {
        alert('Dados do agendamento não encontrados. Tente novamente.');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Confirmando...';
    btn.style.opacity = '0.7';
    
    mensagem.className = 'mt-3 p-2 rounded-lg text-sm';
    mensagem.style.background = CORES.primaryBg;
    mensagem.style.color = CORES.primary;
    mensagem.textContent = '⏳ Processando seu agendamento...';
    mensagem.classList.remove('hidden');
    
    try {
        const { supabase } = await import('../config/supabase.js');
        
        // Verificar se já tem agendamento
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
        
        // Verificar vagas
        const { data: horario, error: horarioError } = await supabase
            .from('horarios')
            .select('vagas')
            .eq('id', horarioId)
            .single();
        
        if (horarioError) throw horarioError;
        
        if (horario.vagas <= 0) {
            throw new Error('Não há vagas disponíveis para este horário');
        }
        
        // Criar agendamento
        const { error } = await supabase
            .from('agendamentos')
            .insert({
                usuario_id: userId,
                horario_id: horarioId,
                data_agendamento: dataAgendamento,
                status: 'confirmado'
            });
        
        if (error) throw error;
        
        // Atualizar vagas
        await supabase
            .from('horarios')
            .update({ vagas: horario.vagas - 1 })
            .eq('id', horarioId);
        
        console.log('✅ Agendamento confirmado!');
        
        // 🔥 Limpar agendamento pendente
        estado.agendamentoPendente = null;
        
        mensagem.className = 'mt-3 p-2 rounded-lg text-sm';
        mensagem.style.background = '#D1FAE5';
        mensagem.style.color = '#065F46';
        mensagem.innerHTML = `
            <i class="fas fa-check-circle mr-1"></i> 
            ✅ Agendamento confirmado para dia ${new Date(dataAgendamento).toLocaleDateString('pt-BR')} 
            das ${estado.horarioSelecionado?.inicio?.substring(0, 5) || pendente?.horarioInicio?.substring(0, 5) || '--'} 
            às ${estado.horarioSelecionado?.fim?.substring(0, 5) || pendente?.horarioFim?.substring(0, 5) || '--'}!
        `;
        
        btn.innerHTML = '<i class="fas fa-check mr-1"></i>Confirmado!';
        btn.style.background = CORES.success;
        
        setTimeout(() => {
            window.fecharModalAgendamento();
            window.location.reload();
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao agendar:', error);
        mensagem.className = 'mt-3 p-2 rounded-lg text-sm';
        mensagem.style.background = '#FEE2E2';
        mensagem.style.color = '#991B1B';
        mensagem.innerHTML = `
            <i class="fas fa-exclamation-circle mr-1"></i> 
            ${error.message || 'Erro ao fazer agendamento. Tente novamente.'}
        `;
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-1"></i>Confirmar Agendamento';
        btn.style.opacity = '1';
        btn.style.background = CORES.primary;
    }
}

// ============================================
// FUNÇÃO: Mostrar Modal de Telefone (Separada)
// ============================================
async function mostrarModalTelefone(profile, user) {
    const { supabase } = await import('../config/supabase.js');
    
    const telefoneModal = document.createElement('div');
    telefoneModal.id = 'modalTelefone';
    telefoneModal.className = 'modal-overlay active';
    telefoneModal.style.display = 'flex';
    telefoneModal.style.alignItems = 'center';
    telefoneModal.style.justifyContent = 'center';
    telefoneModal.style.padding = '20px';
    telefoneModal.style.zIndex = '10001';
    
    telefoneModal.innerHTML = `
        <div class="modal-content" style="max-width: 450px; width: 100%; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.25);">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-[#FEF3E8] rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-phone text-[#F4742B] text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-[#4B4B4D]">Confirme seu contato</h3>
                <p class="text-sm text-gray-500 mt-1">Informe seu número de telefone para confirmar o agendamento</p>
            </div>
            
            <form id="formTelefone" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-user mr-2 text-[#F4742B]"></i> Nome
                    </label>
                    <input type="text" id="inputNome" 
                           value="${profile?.nome || ''}"
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-phone mr-2 text-[#F4742B]"></i> Telefone *
                    </label>
                    <input type="tel" id="inputTelefone" 
                           placeholder="(11) 99999-9999"
                           maxlength="15"
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                           required>
                    <p class="text-xs text-gray-400 mt-1">Exemplo: (11) 99999-9999</p>
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="window.fecharModalTelefone()"
                            class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit" id="btnConfirmarTelefone"
                            class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-lg font-semibold hover:bg-[#E0601A] transition">
                        <i class="fas fa-check mr-2"></i> Confirmar
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(telefoneModal);
    
    const inputTelefone = document.getElementById('inputTelefone');
    if (inputTelefone) {
        inputTelefone.addEventListener('input', function() {
            mascaraTelefone(this);
        });
    }
    
    telefoneModal.addEventListener('click', function(e) {
        if (e.target === this) {
            window.fecharModalTelefone();
        }
    });
    
    document.getElementById('formTelefone').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const telefone = document.getElementById('inputTelefone').value.trim();
        const nome = document.getElementById('inputNome').value.trim();
        
        if (!telefone || !validarTelefone(telefone)) {
            alert('Por favor, informe um número de telefone válido (DDD + 8 ou 9 dígitos).');
            document.getElementById('inputTelefone').focus();
            return;
        }
        
        try {
            const btnConfirmar = document.getElementById('btnConfirmarTelefone');
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
            
            const { error } = await supabase
                .from('usuarios')
                .upsert({
                    id: user.id,
                    nome: nome || profile?.nome || user.email?.split('@')[0],
                    telefone: telefone,
                    email: user.email,
                    role: 'user'
                }, { onConflict: 'id' });
            
            if (error) throw error;
            
            console.log('✅ Telefone salvo com sucesso!');
            
            window.fecharModalTelefone();
            
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
        } catch (error) {
            console.error('Erro ao salvar telefone:', error);
            alert('Erro ao salvar telefone. Tente novamente.');
            
            const btnConfirmar = document.getElementById('btnConfirmarTelefone');
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="fas fa-check mr-2"></i> Confirmar';
        }
    });
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
        
        const descricao = btn.querySelector('.descricao-horario')?.textContent || '';
        if (descricao.toLowerCase().includes(filtro.toLowerCase())) {
            btn.style.display = '';
            visiveis++;
        } else {
            btn.style.display = 'none';
        }
    });
    
    const contagem = document.getElementById('contagemHorarios');
    if (contagem) {
        contagem.textContent = filtro ? `(${visiveis} filtrados)` : '';
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
    
    // Verificar se há agendamento pendente
    if (!estado.agendamentoPendente) {
        console.log('ℹ️ Nenhum agendamento pendente encontrado.');
        return;
    }
    
    const pendente = estado.agendamentoPendente;
    const btn = document.getElementById('btnConfirmarAgendamento');
    const mensagem = document.getElementById('mensagemAgendamento');
    
    // Se o modal do calendário não estiver aberto, não faz nada
    if (!modalAtivo) {
        console.log('ℹ️ Modal do calendário não está aberto.');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('❌ Usuário não autenticado.');
            return;
        }
        
        // Processar agendamento com os dados pendentes
        await processarAgendamento(user.id, btn, mensagem);
        
    } catch (error) {
        console.error('❌ Erro ao processar agendamento pendente:', error);
    }
}