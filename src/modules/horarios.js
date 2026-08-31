import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, warningModal, infoModal } from '../components/modal.js';
import { loadPage } from './router.js';

// ============================================
// CONSTANTES
// ============================================
const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const diasSemanaAbreviados = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ============================================
// FUNÇÃO AUXILIAR: Fechar Modal Forçado
// ============================================
function fecharModalForcado() {
    // Tenta fechar pelo window.closeModal
    if (typeof window.closeModal === 'function') {
        window.closeModal();
    }
    
    // Remove manualmente qualquer modal
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 100);
    }
    
    // Remove qualquer overlay de modal
    document.querySelectorAll('.modal-overlay').forEach(el => {
        if (el.id === 'customModal' || el.classList.contains('modal-overlay')) {
            el.classList.remove('active');
            setTimeout(() => {
                if (el.parentNode) {
                    el.remove();
                }
            }, 100);
        }
    });
}

// ============================================
// FUNÇÃO: Carregar Conteúdo de Horários
// ============================================
export async function loadHorariosContent(params) {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    const { centroId, centroNome } = params || {};
    
    if (!centroId) {
        return `
            <div class="flex flex-col items-center justify-center py-16 px-4">
                <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-circle text-3xl text-red-400"></i>
                </div>
                <p class="text-lg font-medium text-gray-600">Centro não encontrado</p>
                <p class="text-sm text-gray-400 mt-1">Selecione um centro para gerenciar os horários</p>
                <button onclick="window.voltarParaCentros()" 
                        class="mt-4 px-6 py-2 bg-[#F4742B] text-white text-sm rounded-xl hover:bg-[#E0601A] transition">
                    Voltar para Centros
                </button>
            </div>
        `;
    }
    
    const { data: horarios, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('centro_id', centroId)
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });
    
    if (error) {
        console.error('Erro ao carregar horários:', error);
        return `
            <div class="flex flex-col items-center justify-center py-16 px-4">
                <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-circle text-3xl text-red-400"></i>
                </div>
                <p class="text-lg font-medium text-gray-600">Erro ao carregar</p>
                <p class="text-sm text-gray-400 mt-1">Tente novamente mais tarde</p>
                <button onclick="window.recarregarHorarios()" 
                        class="mt-4 px-6 py-2 bg-[#F4742B] text-white text-sm rounded-xl hover:bg-[#E0601A] transition">
                    Tentar novamente
                </button>
            </div>
        `;
    }
    
    const horariosPorDia = {};
    diasSemana.forEach((_, index) => {
        horariosPorDia[index] = horarios?.filter(h => h.dia_semana === index) || [];
    });
    
    const totalHorarios = horarios?.length || 0;
    const totalAtivos = horarios?.filter(h => h.ativo !== false).length || 0;
    
    if (centroNome) {
        localStorage.setItem('horarios_centroNome', centroNome);
        localStorage.setItem('horarios_centroId', centroId);
    }
    
    const nomeExibicao = centroNome || localStorage.getItem('horarios_centroNome') || 'Centro';
    
    return `
        <!-- Modal de Horário -->
        <div id="modalHorario" class="modal-overlay" onclick="window.fecharModalHorario(event)">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-[#4B4B4D]">
                        <i class="fas fa-clock text-[#F4742B]"></i>
                        <span id="modalHorarioTitle">Novo Horário</span>
                    </h3>
                    <button onclick="window.fecharModalHorario()" class="text-gray-400 hover:text-gray-600 text-2xl transition">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="formHorario" class="space-y-4">
                    <input type="hidden" id="horarioId">
                    <input type="hidden" id="horarioCentroId" value="${centroId}">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-calendar-day text-[#F4742B] mr-1"></i> Dia da Semana *
                        </label>
                        <select id="dia_semana" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                            ${diasSemana.map((dia, index) => `
                                <option value="${index}">${dia}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-clock text-[#F4742B] mr-1"></i> Início *
                            </label>
                            <input type="time" id="hora_inicio" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-clock text-[#F4742B] mr-1"></i> Fim *
                            </label>
                            <input type="time" id="hora_fim" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-users text-[#F4742B] mr-1"></i> Vagas
                        </label>
                        <input type="number" id="vagas" value="20" min="1" max="50"
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-info-circle text-[#F4742B] mr-1"></i> Descrição
                        </label>
                        <input type="text" id="descricao" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white"
                               placeholder="Ex: Team WOD, Open Box, Aula da manhã...">
                        <p class="text-xs text-gray-400 mt-1">Descreva o tipo de aula (opcional)</p>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <input type="checkbox" id="horario_ativo" checked
                               class="w-4 h-4 text-[#F4742B] focus:ring-[#F4742B] border-gray-300 rounded">
                        <label for="horario_ativo" class="text-sm font-medium text-gray-700">Horário ativo</label>
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onclick="window.fecharModalHorario()"
                                class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-xl font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                            <i class="fas fa-save mr-2"></i>
                            <span id="btnSubmitHorarioText">Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Cabeçalho -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <div class="flex items-center gap-2">
                    <button onclick="window.voltarParaCentros()" 
                            class="text-gray-400 hover:text-[#F4742B] transition">
                        <i class="fas fa-arrow-left text-lg"></i>
                    </button>
                    <h2 class="text-2xl font-bold text-[#4B4B4D]">
                        <i class="fas fa-clock text-[#F4742B]"></i>
                        ${nomeExibicao}
                    </h2>
                </div>
                <p class="text-gray-500 text-sm mt-0.5">Configure os horários de atendimento da unidade</p>
            </div>
            <button onclick="window.adicionarHorario('${centroId}')" 
                    class="px-4 py-2 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center gap-2">
                <i class="fas fa-plus text-xs"></i>
                Adicionar Horário
            </button>
        </div>
        
        <!-- Estatísticas -->
        <div class="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <div class="bg-white rounded-2xl p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${totalHorarios}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-clock text-[#F4742B] text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Ativos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${totalAtivos}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <i class="fas fa-check-circle text-green-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Dias</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1">${diasSemana.length}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <i class="fas fa-calendar-day text-purple-500 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Grid de Dias -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${diasSemana.map((dia, index) => {
                const horariosDia = horariosPorDia[index] || [];
                const temHorarios = horariosDia.length > 0;
                const ativosDia = horariosDia.filter(h => h.ativo !== false).length;
                
                return `
                    <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100/50 transition-all duration-300 hover:shadow-md">
                        <div class="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <h3 class="font-semibold text-[#4B4B4D] text-sm">${dia}</h3>
                                <span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${temHorarios ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}">
                                    ${temHorarios ? `${ativosDia}/${horariosDia.length}` : '0'}
                                </span>
                            </div>
                            ${temHorarios ? `
                                <span class="text-[10px] text-gray-400">${ativosDia} ativos</span>
                            ` : ''}
                        </div>
                        <div class="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                            ${!temHorarios ? `
                                <div class="flex flex-col items-center justify-center py-6 text-center">
                                    <i class="fas fa-clock text-gray-200 text-2xl mb-2"></i>
                                    <p class="text-xs text-gray-400">Nenhum horário</p>
                                    <button onclick="window.adicionarHorarioDia('${centroId}', ${index})" 
                                            class="mt-2 text-xs text-[#F4742B] hover:text-[#E0601A] transition font-medium">
                                        + Adicionar
                                    </button>
                                </div>
                            ` : horariosDia.map(horario => {
                                const isActive = horario.ativo !== false;
                                const descricao = horario.descricao || '';
                                
                                return `
                                    <div class="bg-gray-50/80 rounded-xl p-3 hover:bg-gray-100 transition group border border-gray-100/50">
                                        <div class="flex items-start justify-between gap-2">
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <span class="font-medium text-gray-800 text-sm">
                                                        ${horario.hora_inicio.substring(0, 5)} - ${horario.hora_fim.substring(0, 5)}
                                                    </span>
                                                    <span class="text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}">
                                                        ${isActive ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </div>
                                                <div class="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                                    <span class="flex items-center gap-1">
                                                        <i class="fas fa-users text-[10px]"></i>
                                                        ${horario.vagas} vagas
                                                    </span>
                                                </div>
                                                ${descricao ? `
                                                    <div class="mt-1 text-[10px] text-[#F4742B] bg-[#FEF3E8] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <i class="fas fa-tag text-[9px]"></i>
                                                        ${descricao}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                                <button onclick="window.editarHorario('${horario.id}')" 
                                                        class="p-1.5 text-gray-400 hover:text-[#F4742B] transition rounded-lg hover:bg-[#FEF3E8]" title="Editar">
                                                    <i class="fas fa-edit text-xs"></i>
                                                </button>
                                                <button onclick="window.toggleHorarioStatus('${horario.id}', ${isActive})" 
                                                        class="p-1.5 ${isActive ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'} transition rounded-lg hover:bg-[#FEF3E8]" title="${isActive ? 'Desativar' : 'Ativar'}">
                                                    <i class="fas ${isActive ? 'fa-toggle-on' : 'fa-toggle-off'} text-sm"></i>
                                                </button>
                                                <button onclick="window.excluirHorario('${horario.id}')" 
                                                        class="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50" title="Excluir">
                                                    <i class="fas fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================
// FUNÇÕES GLOBAIS (window.*)
// ============================================

// Voltar para centros
window.voltarParaCentros = function() {
    localStorage.removeItem('horarios_centroNome');
    localStorage.removeItem('horarios_centroId');
    
    if (window.loadPage) {
        window.loadPage('centros');
    }
};

// Recarregar horários
window.recarregarHorarios = function() {
    const centroId = document.getElementById('horarioCentroId')?.value || localStorage.getItem('horarios_centroId');
    const centroNome = localStorage.getItem('horarios_centroNome') || 'Centro';
    
    if (centroId && window.loadPage) {
        window.loadPage('horarios', { centroId, centroNome });
    }
};

// Adicionar horário
window.adicionarHorario = function(centroId) {
    const modal = document.getElementById('modalHorario');
    if (!modal) return;
    
    document.getElementById('modalHorarioTitle').textContent = 'Novo Horário';
    document.getElementById('btnSubmitHorarioText').textContent = 'Cadastrar';
    document.getElementById('horarioId').value = '';
    document.getElementById('formHorario').reset();
    document.getElementById('horario_ativo').checked = true;
    document.getElementById('vagas').value = 20;
    document.getElementById('descricao').value = '';
    document.getElementById('horarioCentroId').value = centroId;
    
    modal.classList.add('active');
};

// Adicionar horário em um dia específico
window.adicionarHorarioDia = function(centroId, diaSemana) {
    window.adicionarHorario(centroId);
    setTimeout(() => {
        const select = document.getElementById('dia_semana');
        if (select) select.value = diaSemana;
    }, 100);
};

// Fechar modal de horário
window.fecharModalHorario = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modalHorario');
    if (modal) modal.classList.remove('active');
};

// Editar horário
window.editarHorario = async function(id) {
    try {
        const { data, error } = await supabase
            .from('horarios')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const modal = document.getElementById('modalHorario');
        if (!modal) return;
        
        document.getElementById('modalHorarioTitle').textContent = 'Editar Horário';
        document.getElementById('btnSubmitHorarioText').textContent = 'Atualizar';
        document.getElementById('horarioId').value = data.id;
        
        document.getElementById('dia_semana').value = data.dia_semana;
        document.getElementById('hora_inicio').value = data.hora_inicio;
        document.getElementById('hora_fim').value = data.hora_fim;
        document.getElementById('vagas').value = data.vagas || 20;
        document.getElementById('horario_ativo').checked = data.ativo !== false;
        document.getElementById('horarioCentroId').value = data.centro_id;
        document.getElementById('descricao').value = data.descricao || '';
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Erro ao carregar horário:', error);
        errorModal({
            title: 'Erro ao Carregar',
            message: 'Não foi possível carregar os dados do horário.',
            confirmText: 'OK',
            onConfirm: () => {
                fecharModalForcado();
            }
        });
    }
};

// ============================================
// Toggle status do horário - VERSÃO SIMPLIFICADA
// ============================================
window.toggleHorarioStatus = async function(id, ativo) {
    const acao = ativo ? 'desativar' : 'ativar';
    const acaoTexto = ativo ? 'Desativar' : 'Ativar';
    
    confirmModal({
        title: `${acaoTexto} Horário`,
        message: `Tem certeza que deseja ${acao} este horário?`,
        confirmText: acaoTexto,
        cancelText: 'Cancelar',
        confirmColor: ativo ? '#EF4444' : '#10B981',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('horarios')
                    .update({ ativo: !ativo })
                    .eq('id', id);
                
                if (error) throw error;
                
                // 🔥 Recarrega diretamente
                window.recarregarHorarios();
                
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                errorModal({
                    title: 'Erro ao Alterar Status',
                    message: error.message || 'Ocorreu um erro ao alterar o status do horário.',
                    confirmText: 'OK'
                });
            }
        }
    });
};

// ============================================
// Excluir horário - VERSÃO SIMPLIFICADA
// ============================================
window.excluirHorario = function(id) {
    confirmModal({
        title: 'Excluir Horário',
        message: 'Tem certeza que deseja excluir este horário?<br><br><strong>ATENÇÃO:</strong> Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        confirmColor: '#EF4444',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('horarios')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
                
                // 🔥 Recarrega diretamente
                window.recarregarHorarios();
                
            } catch (error) {
                console.error('Erro ao excluir horário:', error);
                errorModal({
                    title: 'Erro ao Excluir',
                    message: error.message || 'Ocorreu um erro ao excluir o horário.',
                    confirmText: 'OK'
                });
            }
        }
    });
};

// ============================================
// Salvar Horário - VERSÃO SIMPLIFICADA
// ============================================
window.salvarHorario = async function() {
    const id = document.getElementById('horarioId').value;
    const centroId = document.getElementById('horarioCentroId').value;
    const dia_semana = parseInt(document.getElementById('dia_semana').value);
    const hora_inicio = document.getElementById('hora_inicio').value;
    const hora_fim = document.getElementById('hora_fim').value;
    const vagas = parseInt(document.getElementById('vagas').value) || 20;
    const ativo = document.getElementById('horario_ativo').checked;
    const descricao = document.getElementById('descricao').value.trim();
    
    if (!hora_inicio || !hora_fim) {
        warningModal({
            title: 'Campos Obrigatórios',
            message: 'Preencha os horários de início e fim.',
            confirmText: 'OK'
        });
        return;
    }
    
    const btn = document.querySelector('#formHorario button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    
    try {
        const dados = { 
            centro_id: centroId, 
            dia_semana, 
            hora_inicio, 
            hora_fim, 
            vagas, 
            ativo,
            descricao: descricao || null
        };
        
        let result;
        if (id) {
            result = await supabase
                .from('horarios')
                .update(dados)
                .eq('id', id);
        } else {
            result = await supabase
                .from('horarios')
                .insert([dados]);
        }
        
        if (result.error) throw result.error;
        
        window.fecharModalHorario();
        
        // 🔥 Recarrega diretamente
        window.recarregarHorarios();
        
    } catch (error) {
        console.error('Erro ao salvar horário:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar o horário.',
            confirmText: 'OK'
        });
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save mr-2"></i>${id ? 'Atualizar' : 'Cadastrar'}`;
    }
};

// ============================================
// EVENTOS
// ============================================
export function setupHorariosEvents() {
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'formHorario') {
            e.preventDefault();
            window.salvarHorario();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.fecharModalHorario();
        }
    });
}