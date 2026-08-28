import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal } from './shared.js';
import { loadPage } from './router.js';

// ============================================
// FUNÇÃO: Carregar Conteúdo de Alunos
// ============================================
export async function loadAlunosContent() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    return `
        <!-- Estatísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total de Alunos</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="totalAlunos">0</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-users text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Google Auth</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="totalGoogleAuth">0</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fab fa-google text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Ativos</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="alunosAtivos">0</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Com Agendamentos</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="alunosComAgendamentos">0</p>
                    </div>
                    <div class="bg-purple-100 p-3 rounded-full">
                        <i class="fas fa-calendar-check text-purple-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-search text-[#F4742B] mr-1"></i> Buscar
                    </label>
                    <input type="text" id="buscarAluno" 
                           placeholder="Nome, telefone ou CPF..."
                           class="w-full h-10 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-filter text-[#F4742B] mr-1"></i> Status
                    </label>
                    <select id="filtroStatusAluno" 
                            class="w-full h-10 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                        <option value="">Todos</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-shield-alt text-[#F4742B] mr-1"></i> Autenticação
                    </label>
                    <select id="filtroAuth" 
                            class="w-full h-10 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                        <option value="">Todos</option>
                        <option value="email">Email/Senha</option>
                        <option value="google">Google</option>
                    </select>
                </div>
                
                <div class="flex items-end gap-2">
                    <button onclick="window.aplicarFiltrosAlunos()" 
                            class="flex-1 h-10 px-4 bg-[#F4742B] text-white text-sm font-medium rounded-lg hover:bg-[#E0601A] transition flex items-center justify-center gap-2">
                        <i class="fas fa-search text-xs"></i> Filtrar
                    </button>
                    <button onclick="window.exportarAlunosPDF()" 
                            class="h-10 px-4 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                        <i class="fas fa-file-pdf text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div id="alunosList" class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-spinner fa-spin text-4xl mb-3 block text-[#F4742B]"></i>
                Carregando alunos...
            </div>
        </div>
    `;
}

// ============================================
// FUNÇÃO: Aplicar Filtros e Carregar Alunos
// ============================================
window.aplicarFiltrosAlunos = async function() {
    const container = document.getElementById('alunosList');
    const busca = document.getElementById('buscarAluno')?.value?.toLowerCase() || '';
    const status = document.getElementById('filtroStatusAluno')?.value || '';
    const authType = document.getElementById('filtroAuth')?.value || '';
    
    container.innerHTML = `
        <div class="text-center text-gray-500 py-12">
            <i class="fas fa-spinner fa-spin text-4xl mb-3 block text-[#F4742B]"></i>
            Carregando alunos...
        </div>
    `;
    
    try {
        let query = supabase
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });
        
        const { data: usuarios, error } = await query;
        
        if (error) throw error;
        
        const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('usuario_id')
            .eq('status', 'confirmado');
        
        const agendamentosPorUsuario = {};
        agendamentos?.forEach(ag => {
            agendamentosPorUsuario[ag.usuario_id] = (agendamentosPorUsuario[ag.usuario_id] || 0) + 1;
        });
        
        const usuariosComAuth = usuarios?.map(u => ({
            ...u,
            authProvider: u.email?.includes('@gmail.com') ? 'google' : 'email',
            temAgendamentos: (agendamentosPorUsuario[u.id] || 0) > 0,
            totalAgendamentos: agendamentosPorUsuario[u.id] || 0
        })) || [];
        
        let filtered = usuariosComAuth;
        
        if (busca) {
            filtered = filtered.filter(u => 
                u.nome?.toLowerCase().includes(busca) ||
                u.telefone?.includes(busca) ||
                u.cpf?.includes(busca) ||
                u.email?.toLowerCase().includes(busca)
            );
        }
        
        if (status === 'ativo') {
            filtered = filtered.filter(u => u.ativo !== false);
        } else if (status === 'inativo') {
            filtered = filtered.filter(u => u.ativo === false);
        }
        
        if (authType === 'google') {
            filtered = filtered.filter(u => u.authProvider === 'google');
        } else if (authType === 'email') {
            filtered = filtered.filter(u => u.authProvider === 'email');
        }
        
        const totalAlunos = usuarios?.length || 0;
        const totalGoogle = usuariosComAuth.filter(u => u.authProvider === 'google').length;
        const ativos = usuariosComAuth.filter(u => u.ativo !== false).length;
        const comAgendamentos = usuariosComAuth.filter(u => u.temAgendamentos).length;
        
        document.getElementById('totalAlunos').textContent = totalAlunos;
        document.getElementById('totalGoogleAuth').textContent = totalGoogle;
        document.getElementById('alunosAtivos').textContent = ativos;
        document.getElementById('alunosComAgendamentos').textContent = comAgendamentos;
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="fas fa-user-plus text-4xl mb-3 block text-gray-300"></i>
                    <p class="text-lg font-medium">Nenhum aluno encontrado</p>
                    <p class="text-sm mt-1">Os alunos aparecerão aqui quando se cadastrarem</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <span class="font-semibold text-[#4B4B4D]">${filtered.length}</span>
                    <span class="text-gray-500"> alunos encontrados</span>
                </div>
            </div>
            <div class="divide-y divide-gray-100">
        `;
        
        filtered.forEach(aluno => {
            const authIcon = aluno.authProvider === 'google' 
                ? '<i class="fab fa-google text-blue-500"></i>' 
                : '<i class="fas fa-envelope text-gray-400"></i>';
            
            const authLabel = aluno.authProvider === 'google' 
                ? 'Google' 
                : 'Email';
            
            const statusBadge = aluno.ativo !== false
                ? '<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Ativo</span>'
                : '<span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Inativo</span>';
            
            const agendamentoBadge = aluno.totalAgendamentos > 0
                ? `<span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">${aluno.totalAgendamentos} agendamentos</span>`
                : '<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Sem agendamentos</span>';
            
            html += `
                <div class="p-4 hover:bg-gray-50/50 transition">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-[#FEF3E8] flex items-center justify-center text-[#F4742B] font-bold text-lg">
                                ${aluno.nome?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <p class="font-semibold text-gray-800">${aluno.nome || 'Sem nome'}</p>
                                    ${statusBadge}
                                </div>
                                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span><i class="fas fa-envelope mr-1"></i> ${aluno.email || 'N/E'}</span>
                                    ${aluno.telefone ? `<span><i class="fas fa-phone mr-1"></i> ${aluno.telefone}</span>` : ''}
                                    ${aluno.cpf ? `<span><i class="fas fa-id-card mr-1"></i> ${aluno.cpf}</span>` : ''}
                                    <span class="flex items-center gap-1">
                                        ${authIcon} ${authLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                            ${agendamentoBadge}
                            <button onclick="window.verAgendamentosAluno('${aluno.id}')" 
                                    class="text-xs px-3 py-1.5 border border-[#F4742B] text-[#F4742B] rounded-lg hover:bg-[#F4742B] hover:text-white transition">
                                <i class="fas fa-calendar-check mr-1"></i> Ver
                            </button>
                            ${aluno.telefone ? `
                                <button onclick="window.abrirWhatsAppAluno('${aluno.telefone}', '${aluno.nome || 'Aluno'}')" 
                                        class="text-xs px-3 py-1.5 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition">
                                    <i class="fab fa-whatsapp mr-1"></i> WhatsApp
                                </button>
                            ` : `
                                <span class="text-xs px-3 py-1.5 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed">
                                    <i class="fab fa-whatsapp mr-1"></i> Sem WhatsApp
                                </span>
                            `}
                            <button onclick="window.toggleStatusAluno('${aluno.id}', ${aluno.ativo !== false})" 
                                    class="text-xs px-3 py-1.5 border ${aluno.ativo !== false ? 'border-red-500 text-red-500 hover:bg-red-500' : 'border-green-500 text-green-500 hover:bg-green-500'} rounded-lg hover:text-white transition">
                                <i class="fas ${aluno.ativo !== false ? 'fa-pause' : 'fa-play'} mr-1"></i>
                                ${aluno.ativo !== false ? 'Desativar' : 'Ativar'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        container.innerHTML = `
            <div class="text-center text-red-500 py-12">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar alunos. Tente novamente.
            </div>
        `;
    }
};

// ============================================
// FUNÇÃO: Ver Agendamentos do Aluno
// ============================================
window.verAgendamentosAluno = async function(alunoId) {
    try {
        const { data: aluno, error: alunoError } = await supabase
            .from('usuarios')
            .select('nome, email, telefone')
            .eq('id', alunoId)
            .single();
        
        if (alunoError) throw alunoError;
        
        const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select(`
                *,
                horarios (
                    *,
                    centros (*)
                )
            `)
            .eq('usuario_id', alunoId)
            .order('data_agendamento', { ascending: false });
        
        if (agendamentosError) throw agendamentosError;
        
        criarModalAgendamentos(aluno, agendamentos);
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos do aluno:', error);
        errorModal({
            title: 'Erro ao Carregar',
            message: 'Não foi possível carregar os agendamentos do aluno.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Criar Modal de Agendamentos
// ============================================
function criarModalAgendamentos(aluno, agendamentos) {
    const modalExistente = document.getElementById('modalAgendamentosAluno');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'modalAgendamentosAluno';
    overlay.className = 'modal-overlay active';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    
    let conteudoAgendamentos = '';
    
    if (!agendamentos || agendamentos.length === 0) {
        conteudoAgendamentos = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-calendar-plus text-4xl mb-3 block text-gray-300"></i>
                <p>Este aluno ainda não possui agendamentos.</p>
            </div>
        `;
    } else {
        conteudoAgendamentos = agendamentos.map(ag => {
            const statusColors = {
                'confirmado': 'bg-green-100 text-green-700',
                'cancelado': 'bg-red-100 text-red-700',
                'concluido': 'bg-gray-100 text-gray-700'
            };
            
            const statusLabels = {
                'confirmado': '✅ Confirmado',
                'cancelado': '❌ Cancelado',
                'concluido': '📌 Concluído'
            };
            
            const centroNome = ag.horarios?.centros?.nome || 'Centro não identificado';
            const bairro = ag.horarios?.centros?.bairro || '';
            
            const dataObj = new Date(ag.data_agendamento + 'T00:00:00');
            const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            
            const diaSemana = diasSemana[dataObj.getDay()];
            const dia = String(dataObj.getDate()).padStart(2, '0');
            const mes = meses[dataObj.getMonth()];
            const ano = dataObj.getFullYear();
            
            const dataFormatada = `${diaSemana}, ${dia} de ${mes} de ${ano}`;
            
            const horaInicio = ag.horarios?.hora_inicio?.substring(0,5) || '--';
            const horaFim = ag.horarios?.hora_fim?.substring(0,5) || '--';
            
            return `
                <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition border border-gray-100">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-semibold text-gray-800">${centroNome}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full ${statusColors[ag.status] || 'bg-gray-100 text-gray-700'}">
                                    ${statusLabels[ag.status] || ag.status}
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                <span>
                                    <i class="far fa-calendar mr-1"></i> ${dataFormatada}
                                </span>
                                <span>
                                    <i class="far fa-clock mr-1"></i> ${horaInicio} - ${horaFim}
                                </span>
                                ${bairro ? `<span><i class="fas fa-map-pin mr-1"></i> ${bairro}</span>` : ''}
                            </div>
                        </div>
                        ${ag.status === 'confirmado' ? `
                            <button onclick="window.cancelarAgendamentoAluno('${ag.id}')" 
                                    class="text-xs px-3 py-1 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition whitespace-nowrap">
                                <i class="fas fa-times mr-1"></i> Cancelar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    const nomeAluno = aluno?.nome || 'Aluno';
    const emailAluno = aluno?.email || 'N/E';
    const telefoneAluno = aluno?.telefone || '';
    const cpfAluno = aluno?.cpf || '';
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="fecharModalAgendamentosAluno()" 
                    style="position: sticky; top: 0; float: right; background: none; border: none; font-size: 24px; color: #9CA3AF; cursor: pointer; padding: 8px; z-index: 10;">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                    <h3 class="text-xl font-bold text-[#4B4B4D] flex items-center gap-2">
                        <i class="fas fa-user text-[#F4742B]"></i> 
                        ${nomeAluno}
                    </h3>
                    <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                        <span><i class="fas fa-envelope mr-1"></i> ${emailAluno}</span>
                        ${telefoneAluno ? `<span><i class="fas fa-phone mr-1"></i> ${telefoneAluno}</span>` : ''}
                        ${cpfAluno ? `<span><i class="fas fa-id-card mr-1"></i> ${cpfAluno}</span>` : ''}
                    </div>
                </div>
                <span class="text-sm font-medium px-3 py-1 rounded-full bg-[#FEF3E8] text-[#F4742B] whitespace-nowrap">
                    <i class="fas fa-calendar-check mr-1"></i> ${agendamentos?.length || 0} agendamentos
                </span>
            </div>
            
            <div class="space-y-3" style="max-height: 50vh; overflow-y: auto; padding-right: 4px;">
                ${conteudoAgendamentos}
            </div>
            
            <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <button onclick="fecharModalAgendamentosAluno()" 
                        class="px-6 py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModalAgendamentosAluno();
        }
    });
    
    const handleEsc = function(e) {
        if (e.key === 'Escape') {
            fecharModalAgendamentosAluno();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// ============================================
// FUNÇÃO: Fechar Modal de Agendamentos do Aluno
// ============================================
window.fecharModalAgendamentosAluno = function() {
    const modal = document.getElementById('modalAgendamentosAluno');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// ============================================
// FUNÇÃO: Cancelar Agendamento (Aluno)
// ============================================
window.cancelarAgendamentoAluno = function(id) {
    confirmModal({
        title: 'Cancelar Agendamento',
        message: 'Tem certeza que deseja cancelar este agendamento?',
        confirmText: 'Cancelar',
        cancelText: 'Voltar',
        confirmColor: '#EF4444',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('agendamentos')
                    .update({ status: 'cancelado' })
                    .eq('id', id);
                
                if (error) throw error;
                
                successModal({
                    title: 'Agendamento Cancelado!',
                    message: 'O agendamento foi cancelado com sucesso.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        fecharModalAgendamentosAluno();
                        setTimeout(() => {
                            window.aplicarFiltrosAlunos();
                        }, 300);
                    }
                });
            } catch (error) {
                console.error('Erro ao cancelar:', error);
                errorModal({
                    title: 'Erro ao Cancelar',
                    message: error.message || 'Ocorreu um erro ao cancelar o agendamento.',
                    confirmText: 'OK',
                    onConfirm: () => window.closeModal()
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Toggle Status do Aluno
// ============================================
window.toggleStatusAluno = async function(id, ativo) {
    const acao = ativo ? 'desativar' : 'ativar';
    
    confirmModal({
        title: `${ativo ? 'Desativar' : 'Ativar'} Aluno`,
        message: `Tem certeza que deseja ${acao} este aluno?`,
        confirmText: ativo ? 'Desativar' : 'Ativar',
        cancelText: 'Cancelar',
        confirmColor: ativo ? '#EF4444' : '#10B981',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('usuarios')
                    .update({ ativo: !ativo })
                    .eq('id', id);
                
                if (error) throw error;
                
                successModal({
                    title: 'Status Alterado!',
                    message: `Aluno ${ativo ? 'desativado' : 'ativado'} com sucesso.`,
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.aplicarFiltrosAlunos();
                    }
                });
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                errorModal({
                    title: 'Erro ao Alterar Status',
                    message: error.message || 'Ocorreu um erro ao alterar o status do aluno.',
                    confirmText: 'OK'
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Cancelar Agendamento (Admin)
// ============================================
window.cancelarAgendamentoAdmin = function(id) {
    confirmModal({
        title: 'Cancelar Agendamento',
        message: 'Tem certeza que deseja cancelar este agendamento?',
        confirmText: 'Cancelar',
        cancelText: 'Voltar',
        confirmColor: '#EF4444',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('agendamentos')
                    .update({ status: 'cancelado' })
                    .eq('id', id);
                
                if (error) throw error;
                
                successModal({
                    title: 'Agendamento Cancelado!',
                    message: 'O agendamento foi cancelado com sucesso.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        window.aplicarFiltrosAlunos();
                    }
                });
            } catch (error) {
                console.error('Erro ao cancelar:', error);
                errorModal({
                    title: 'Erro ao Cancelar',
                    message: error.message || 'Ocorreu um erro ao cancelar o agendamento.',
                    confirmText: 'OK',
                    onConfirm: () => window.closeModal()
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Exportar Alunos para PDF
// ============================================
window.exportarAlunosPDF = async function() {
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });
        
        if (error) throw error;
        
        if (!usuarios || usuarios.length === 0) {
            infoModal({
                title: 'Nenhum Aluno',
                message: 'Não há alunos para exportar.',
                confirmText: 'OK'
            });
            return;
        }
        
        const { default: jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
        
        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        doc.setFontSize(18);
        doc.setTextColor('#F4742B');
        doc.text('CrossFit - Lista de Alunos', 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor('#4B4B4D');
        doc.text(`Total: ${usuarios.length} alunos`, 14, 30);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 37);
        
        doc.setFontSize(10);
        doc.text('='.repeat(70), 14, 45);
        
        let y = 55;
        usuarios.forEach((aluno, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
                doc.setFontSize(10);
                doc.text('='.repeat(70), 14, 28);
                y = 38;
            }
            
            const status = aluno.ativo !== false ? '✅ Ativo' : '❌ Inativo';
            
            doc.text(`${index + 1}. ${aluno.nome || 'N/I'}`, 14, y);
            doc.text(`   Email: ${aluno.email || 'N/I'}`, 14, y + 6);
            doc.text(`   Telefone: ${aluno.telefone || 'N/I'}`, 14, y + 12);
            doc.text(`   CPF: ${aluno.cpf || 'N/I'}`, 14, y + 18);
            doc.text(`   Status: ${status}`, 14, y + 24);
            doc.text('-'.repeat(50), 14, y + 30);
            
            y += 36;
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor('#9CA3AF');
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }
        
        doc.save(`alunos_${new Date().toISOString().split('T')[0]}.pdf`);
        
        successModal({
            title: 'PDF Exportado!',
            message: `O arquivo PDF foi gerado com ${usuarios.length} alunos.`,
            confirmText: 'OK'
        });
        
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        errorModal({
            title: 'Erro ao Exportar',
            message: error.message || 'Ocorreu um erro ao gerar o PDF. Tente novamente.',
            confirmText: 'OK'
        });
    }
};

// ============================================
// FUNÇÃO: Abrir WhatsApp do Aluno
// ============================================
window.abrirWhatsAppAluno = function(telefone, nome) {
    if (!telefone || telefone === 'N/I') {
        infoModal({
            title: 'Telefone não disponível',
            message: 'Este aluno não possui telefone cadastrado.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
        infoModal({
            title: 'Telefone inválido',
            message: 'O número de telefone cadastrado é inválido.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    const link = `https://wa.me/55${telefoneLimpo}?text=Olá ${nome}!%20Sou%20da%20Striking%20CT.%20Gostaria%20de%20falar%20com%20você.`;
    window.open(link, '_blank');
};

// ============================================
// EVENTOS
// ============================================
export function setupAlunosEvents() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target && (target.id === 'buscarAluno' || 
                target.id === 'filtroStatusAluno' || 
                target.id === 'filtroAuth')) {
                if (typeof window.aplicarFiltrosAlunos === 'function') {
                    window.aplicarFiltrosAlunos();
                }
            }
        }
    });
}