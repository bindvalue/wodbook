import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, warningModal, infoModal } from '../components/modal.js';
import { loadPage } from './router.js';

// ============================================
// CONSTANTES
// ============================================
const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

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
            <div class="text-center text-red-500 py-12">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Centro não encontrado.
            </div>
        `;
    }
    
    // Buscar horários do centro
    const { data: horarios, error } = await supabase
        .from('horarios')
        .select('*')
        .eq('centro_id', centroId)
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });
    
    if (error) {
        console.error('Erro ao carregar horários:', error);
        return `
            <div class="text-center text-red-500 py-12">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar horários.
            </div>
        `;
    }
    
    // Agrupar horários por dia
    const horariosPorDia = {};
    diasSemana.forEach((_, index) => {
        horariosPorDia[index] = horarios?.filter(h => h.dia_semana === index) || [];
    });
    
    return `
        <!-- Modal de Horário -->
        <div id="modalHorario" class="modal-overlay" onclick="window.fecharModalHorario(event)">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-[#4B4B4D]">
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
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                            ${diasSemana.map((dia, index) => `
                                <option value="${index}">${dia}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-clock text-[#F4742B] mr-1"></i> Hora Início *
                            </label>
                            <input type="time" id="hora_inicio" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <i class="fas fa-clock text-[#F4742B] mr-1"></i> Hora Fim *
                            </label>
                            <input type="time" id="hora_fim" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-users text-[#F4742B] mr-1"></i> Vagas
                        </label>
                        <input type="number" id="vagas" value="20" min="1" max="50"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                    </div>
                    
                    <!-- ✅ CAMPO DESCRIÇÃO - EDITÁVEL -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-info-circle text-[#F4742B] mr-1"></i> Descrição (opcional)
                        </label>
                        <input type="text" id="descricao" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
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
                                class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-lg font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                            <i class="fas fa-save mr-2"></i>
                            <span id="btnSubmitHorarioText">Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Cabeçalho -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold text-[#4B4B4D]">
                    <i class="fas fa-clock text-[#F4742B]"></i>
                    Horários - ${centroNome}
                </h2>
                <p class="text-gray-500 text-sm">Configure os horários de atendimento para cada dia da semana</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.voltarParaCentros()" 
                        class="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
                    <i class="fas fa-arrow-left mr-2"></i> Voltar
                </button>
                <button onclick="window.adicionarHorario('${centroId}')" 
                        class="px-4 py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition flex items-center gap-2">
                    <i class="fas fa-plus"></i> Adicionar Horário
                </button>
            </div>
        </div>
        
        <!-- Grid de Dias -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${diasSemana.map((dia, index) => `
                <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover">
                    <div class="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 class="font-bold text-gray-800">${dia}</h3>
                        <span class="text-sm text-gray-500">${horariosPorDia[index]?.length || 0} horários</span>
                    </div>
                    <div class="p-4 space-y-2 max-h-80 overflow-y-auto">
                        ${horariosPorDia[index]?.length === 0 ? `
                            <div class="text-center text-gray-400 text-sm py-4">
                                <i class="fas fa-clock mb-2 block"></i>
                                Nenhum horário cadastrado
                            </div>
                        ` : horariosPorDia[index].map(horario => `
                            <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition group border border-gray-100">
                                <div class="flex flex-col">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="font-medium text-gray-800">
                                                ${horario.hora_inicio.substring(0, 5)} - ${horario.hora_fim.substring(0, 5)}
                                            </div>
                                            <div class="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
                                                <span>
                                                    <i class="fas fa-users mr-1"></i> ${horario.vagas} vagas
                                                </span>
                                                ${!horario.ativo ? '<span class="text-red-500 text-xs font-medium">(Inativo)</span>' : ''}
                                            </div>
                                            ${horario.descricao ? `
                                                <div class="text-xs text-[#F4742B] mt-1 flex items-center gap-1 bg-[#FEF3E8] px-2 py-0.5 rounded-full inline-flex">
                                                    <i class="fas fa-info-circle"></i> ${horario.descricao}
                                                </div>
                                            ` : `
                                                <div class="text-xs text-gray-400 mt-1 italic">
                                                    Sem descrição
                                                </div>
                                            `}
                                        </div>
                                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition ml-2 flex-shrink-0">
                                            <button onclick="window.editarHorario('${horario.id}')" 
                                                    class="p-1.5 text-gray-400 hover:text-[#F4742B] transition rounded-lg hover:bg-[#FEF3E8]" title="Editar">
                                                <i class="fas fa-edit text-sm"></i>
                                            </button>
                                            <button onclick="window.toggleHorarioStatus('${horario.id}', ${horario.ativo})" 
                                                    class="p-1.5 ${horario.ativo ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'} transition rounded-lg hover:bg-[#FEF3E8]" title="${horario.ativo ? 'Desativar' : 'Ativar'}">
                                                <i class="fas ${horario.ativo ? 'fa-toggle-on' : 'fa-toggle-off'} text-sm"></i>
                                            </button>
                                            <button onclick="window.excluirHorario('${horario.id}')" 
                                                    class="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50" title="Excluir">
                                                <i class="fas fa-trash text-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// FUNÇÕES GLOBAIS (window.*)
// ============================================

// Voltar para centros
window.voltarParaCentros = function() {
    if (window.loadPage) {
        window.loadPage('centros');
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
        document.getElementById('horario_ativo').checked = data.ativo;
        document.getElementById('horarioCentroId').value = data.centro_id;
        document.getElementById('descricao').value = data.descricao || '';
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Erro ao carregar horário:', error);
        errorModal({
            title: 'Erro ao Carregar',
            message: 'Não foi possível carregar os dados do horário.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// Toggle status do horário
window.toggleHorarioStatus = async function(id, ativo) {
    const acao = ativo ? 'desativar' : 'ativar';
    
    confirmModal({
        title: `${ativo ? 'Desativar' : 'Ativar'} Horário`,
        message: `Tem certeza que deseja ${acao} este horário?`,
        confirmText: ativo ? 'Desativar' : 'Ativar',
        cancelText: 'Cancelar',
        confirmColor: ativo ? '#EF4444' : '#10B981',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('horarios')
                    .update({ ativo: !ativo })
                    .eq('id', id);
                
                if (error) throw error;
                
                const centroId = document.getElementById('horarioCentroId')?.value;
                const { data: centro } = await supabase
                    .from('centros')
                    .select('nome')
                    .eq('id', centroId)
                    .single();
                
                successModal({
                    title: 'Status Alterado!',
                    message: `Horário ${ativo ? 'desativado' : 'ativado'} com sucesso.`,
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        if (window.loadPage) {
                            window.loadPage('horarios', { centroId, centroNome: centro?.nome || 'Centro' });
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                errorModal({
                    title: 'Erro ao Alterar Status',
                    message: error.message || 'Ocorreu um erro ao alterar o status do horário.',
                    confirmText: 'OK',
                    onConfirm: () => window.closeModal()
                });
            }
        }
    });
};

// Excluir horário
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
                
                const centroId = document.getElementById('horarioCentroId')?.value;
                const { data: centro } = await supabase
                    .from('centros')
                    .select('nome')
                    .eq('id', centroId)
                    .single();
                
                successModal({
                    title: 'Horário Excluído!',
                    message: 'O horário foi excluído com sucesso.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        if (window.loadPage) {
                            window.loadPage('horarios', { centroId, centroNome: centro?.nome || 'Centro' });
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao excluir horário:', error);
                errorModal({
                    title: 'Erro ao Excluir',
                    message: error.message || 'Ocorreu um erro ao excluir o horário.',
                    confirmText: 'OK',
                    onConfirm: () => window.closeModal()
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Salvar Horário (COM DESCRIÇÃO)
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
    
    console.log('📝 Salvando horário:', { id, centroId, dia_semana, hora_inicio, hora_fim, vagas, ativo, descricao });
    
    if (!hora_inicio || !hora_fim) {
        warningModal({
            title: 'Campos Obrigatórios',
            message: 'Preencha os horários de início e fim.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
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
        
        const { data: centro } = await supabase
            .from('centros')
            .select('nome')
            .eq('id', centroId)
            .single();
        
        successModal({
            title: id ? 'Horário Atualizado!' : 'Horário Cadastrado!',
            message: id ? 'O horário foi atualizado com sucesso.' : 'O horário foi cadastrado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
                if (window.loadPage) {
                    window.loadPage('horarios', { centroId, centroNome: centro?.nome || 'Centro' });
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao salvar horário:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar o horário.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
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