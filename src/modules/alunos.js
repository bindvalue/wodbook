import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal } from './shared.js';
import { loadPage } from './router.js';

// ============================================
// FUNÇÃO: Verificar se é Admin
// ============================================
async function verificarAdmin() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.warn('⚠️ Erro ao verificar admin:', error);
            return false;
        }
        
        return data?.role === 'admin';
    } catch (error) {
        console.warn('⚠️ Erro ao verificar admin:', error);
        return false;
    }
}

// ============================================
// FUNÇÃO: Carregar Conteúdo de Alunos
// ============================================
export async function loadAlunosContent() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    const isAdmin = await verificarAdmin();
    
    if (!isAdmin) {
        if (window.loadPage) {
            window.loadPage('dashboard');
            return;
        }
    }
    
    return `
        <!-- Estatísticas -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Alunos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalAlunos">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-users text-[#F4742B] text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Agendamentos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalAgendamentos">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <i class="fas fa-calendar-check text-purple-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Alunos Ativos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="alunosAtivos">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <i class="fas fa-check-circle text-green-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Google Auth</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalGoogleAuth">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <i class="fab fa-google text-blue-500 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input type="text" id="buscarAluno" 
                           placeholder="Buscar aluno..."
                           class="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                </div>
                
                <div>
                    <select id="filtroStatusAluno" 
                            class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                        <option value="">Todos os status</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                </div>
                
                <div>
                    <select id="filtroAuth" 
                            class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                        <option value="">Todos os tipos</option>
                        <option value="email">Email/Senha</option>
                        <option value="google">Google</option>
                    </select>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="window.aplicarFiltrosAlunos()" 
                            class="flex-1 h-10 px-4 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-search text-xs"></i>
                        <span class="hidden sm:inline">Filtrar</span>
                    </button>
                    <button onclick="window.exportarAlunosPDF()" 
                            class="h-10 px-4 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-file-pdf text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Alunos com Agendamentos -->
        <div id="alunosList" class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="flex items-center justify-center py-16">
                <div class="text-center">
                    <div class="w-12 h-12 border-4 border-[#F4742B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p class="text-gray-400 text-sm">Carregando alunos...</p>
                </div>
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
        <div class="flex items-center justify-center py-16">
            <div class="text-center">
                <div class="w-12 h-12 border-4 border-[#F4742B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-400 text-sm">Carregando...</p>
            </div>
        </div>
    `;
    
    try {
        // Buscar todos os usuários
        let query = supabase
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });
        
        const { data: usuarios, error } = await query;
        if (error) throw error;
        
        // 🔥 Buscar TODOS os agendamentos com dados completos
        const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (id, nome, telefone, email),
                horarios (
                    *,
                    centros (*)
                )
            `)
            .order('data_agendamento', { ascending: false });
        
        if (agendamentosError) {
            console.warn('⚠️ Erro ao buscar agendamentos:', agendamentosError);
        }
        
        // Agrupar agendamentos por usuário
        const agendamentosPorUsuario = {};
        agendamentos?.forEach(ag => {
            if (!agendamentosPorUsuario[ag.usuario_id]) {
                agendamentosPorUsuario[ag.usuario_id] = [];
            }
            agendamentosPorUsuario[ag.usuario_id].push(ag);
        });
        
        // Processar usuários com seus agendamentos
        const usuariosComDados = usuarios?.map(u => ({
            ...u,
            authProvider: u.email?.includes('@gmail.com') ? 'google' : 'email',
            agendamentos: agendamentosPorUsuario[u.id] || [],
            totalAgendamentos: agendamentosPorUsuario[u.id]?.length || 0
        })) || [];
        
        let filtered = usuariosComDados;
        
        // Aplicar filtros
        if (busca) {
            filtered = filtered.filter(u => 
                u.nome?.toLowerCase().includes(busca) ||
                u.telefone?.includes(busca) ||
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
        
        // Estatísticas
        const totalAlunos = usuarios?.length || 0;
        const totalGoogle = usuariosComDados.filter(u => u.authProvider === 'google').length;
        const ativos = usuariosComDados.filter(u => u.ativo !== false).length;
        const totalAgendamentos = agendamentos?.length || 0;
        
        document.getElementById('totalAlunos').textContent = totalAlunos;
        document.getElementById('totalGoogleAuth').textContent = totalGoogle;
        document.getElementById('alunosAtivos').textContent = ativos;
        document.getElementById('totalAgendamentos').textContent = totalAgendamentos;
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 px-4">
                    <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <i class="fas fa-user-plus text-3xl text-gray-300"></i>
                    </div>
                    <p class="text-lg font-medium text-gray-600">Nenhum aluno encontrado</p>
                    <p class="text-sm text-gray-400 mt-1">Os alunos aparecerão aqui quando se cadastrarem</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <span class="font-semibold text-[#4B4B4D]">${filtered.length}</span>
                    <span class="text-gray-500 text-sm"> alunos</span>
                    <span class="text-gray-400 text-sm ml-2">| ${totalAgendamentos} agendamentos</span>
                </div>
                <span class="text-xs text-gray-400">${filtered.length} resultados</span>
            </div>
            <div class="divide-y divide-gray-100">
        `;
        
        filtered.forEach(aluno => {
            const initial = aluno.nome?.charAt(0).toUpperCase() || '?';
            const authIcon = aluno.authProvider === 'google' 
                ? '<i class="fab fa-google text-blue-500 text-xs"></i>' 
                : '<i class="fas fa-envelope text-gray-400 text-xs"></i>';
            
            const isActive = aluno.ativo !== false;
            const temAgendamentos = aluno.totalAgendamentos > 0;
            const agendamentosAluno = aluno.agendamentos || [];
            
            html += `
                <div class="px-4 py-4 hover:bg-gray-50/50 transition duration-150">
                    <div class="flex flex-col gap-3">
                        <!-- Cabeçalho do Aluno -->
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div class="flex items-center gap-3 flex-1 min-w-0">
                                <div class="relative flex-shrink-0">
                                    <div class="w-12 h-12 rounded-full bg-[#FEF3E8] flex items-center justify-center text-[#F4742B] font-semibold text-lg">
                                        ${initial}
                                    </div>
                                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white"></div>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <p class="font-semibold text-gray-800 truncate">${aluno.nome || 'Sem nome'}</p>
                                        <span class="text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}">
                                            ${isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                            ${aluno.totalAgendamentos} agendamentos
                                        </span>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                                        <span class="flex items-center gap-1">
                                            <i class="fas fa-envelope text-[10px]"></i>
                                            ${aluno.email || 'N/E'}
                                        </span>
                                        ${aluno.telefone ? `
                                            <span class="flex items-center gap-1">
                                                <i class="fas fa-phone text-[10px]"></i>
                                                ${aluno.telefone}
                                            </span>
                                        ` : ''}
                                        <span class="flex items-center gap-1">
                                            ${authIcon}
                                            ${aluno.authProvider === 'google' ? 'Google' : 'Email'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Ações -->
                            <div class="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                                ${aluno.telefone ? `
                                    <button onclick="window.abrirWhatsAppAluno('${aluno.telefone}', '${aluno.nome || 'Aluno'}')" 
                                            class="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition">
                                        <i class="fab fa-whatsapp text-sm"></i>
                                    </button>
                                ` : `
                                    <span class="p-1.5 text-gray-300 cursor-not-allowed">
                                        <i class="fab fa-whatsapp text-sm"></i>
                                    </span>
                                `}
                                <button onclick="window.toggleStatusAluno('${aluno.id}', ${isActive})" 
                                        class="p-1.5 ${isActive ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'} rounded-lg transition">
                                    <i class="fas ${isActive ? 'fa-pause' : 'fa-play'} text-sm"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 🔥 LISTA DE AGENDAMENTOS DO ALUNO -->
                        ${temAgendamentos ? `
                            <div class="ml-15 pl-15 border-l-2 border-purple-200 pl-4 mt-1">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                    ${agendamentosAluno.slice(0, 4).map(ag => {
                                        const statusColors = {
                                            'confirmado': 'bg-green-50 text-green-700',
                                            'cancelado': 'bg-red-50 text-red-700',
                                            'concluido': 'bg-gray-100 text-gray-600'
                                        };
                                        const statusLabels = {
                                            'confirmado': 'Confirmado',
                                            'cancelado': 'Cancelado',
                                            'concluido': 'Concluído'
                                        };
                                        const statusIcons = {
                                            'confirmado': '✅',
                                            'cancelado': '❌',
                                            'concluido': '📌'
                                        };
                                        const centroNome = ag.horarios?.centros?.nome || 'Sem centro';
                                        const dataObj = new Date(ag.data_agendamento + 'T00:00:00');
                                        const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
                                        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                                        const dataFormatada = `${diasSemana[dataObj.getDay()]}, ${String(dataObj.getDate()).padStart(2, '0')} ${meses[dataObj.getMonth()]}`;
                                        const horaInicio = ag.horarios?.hora_inicio?.substring(0,5) || '--';
                                        const horaFim = ag.horarios?.hora_fim?.substring(0,5) || '--';
                                        
                                        return `
                                            <div class="bg-gray-50/80 rounded-lg p-2 hover:bg-gray-100 transition border border-gray-100/50 text-xs">
                                                <div class="flex items-center justify-between gap-1">
                                                    <div class="flex-1 min-w-0">
                                                        <div class="flex items-center gap-1.5 flex-wrap">
                                                            <span class="font-medium text-gray-700 truncate">${centroNome}</span>
                                                            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[ag.status] || 'bg-gray-100 text-gray-600'}">
                                                                ${statusIcons[ag.status] || ''} ${statusLabels[ag.status] || ag.status}
                                                            </span>
                                                        </div>
                                                        <div class="flex items-center gap-2 text-gray-400 mt-0.5">
                                                            <span class="flex items-center gap-0.5">
                                                                <i class="far fa-calendar text-[9px]"></i>
                                                                ${dataFormatada}
                                                            </span>
                                                            <span class="flex items-center gap-0.5">
                                                                <i class="far fa-clock text-[9px]"></i>
                                                                ${horaInicio} - ${horaFim}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    ${ag.status === 'confirmado' ? `
                                                        <button onclick="window.cancelarAgendamentoAluno('${ag.id}')" 
                                                                class="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition flex-shrink-0">
                                                            <i class="fas fa-times text-[10px]"></i>
                                                        </button>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                    ${agendamentosAluno.length > 4 ? `
                                        <div class="text-xs text-purple-500 font-medium flex items-center justify-center p-1">
                                            + ${agendamentosAluno.length - 4} mais agendamentos
                                        </div>
                                    ` : ''}
                                </div>
                                ${agendamentosAluno.length > 4 ? `
                                    <button onclick="window.verAgendamentosAluno('${aluno.id}')" 
                                            class="mt-1 text-xs text-[#F4742B] hover:text-[#E0601A] font-medium transition">
                                        <i class="fas fa-eye mr-1"></i> Ver todos (${agendamentosAluno.length})
                                    </button>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="ml-15 pl-15 border-l-2 border-gray-200 pl-4 mt-1">
                                <span class="text-xs text-gray-400">Sem agendamentos</span>
                            </div>
                        `}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4">
                <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-circle text-3xl text-red-400"></i>
                </div>
                <p class="text-lg font-medium text-gray-600">Erro ao carregar</p>
                <p class="text-sm text-gray-400 mt-1">Tente novamente mais tarde</p>
                <button onclick="window.aplicarFiltrosAlunos()" 
                        class="mt-4 px-6 py-2 bg-[#F4742B] text-white text-sm rounded-xl hover:bg-[#E0601A] transition">
                    Tentar novamente
                </button>
            </div>
        `;
    }
};

// ============================================
// FUNÇÃO: Ver Agendamentos do Aluno (Modal Completo)
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
    if (modalExistente) modalExistente.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'modalAgendamentosAluno';
    overlay.className = 'modal-overlay active';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '16px';
    overlay.style.zIndex = '9999';
    
    let conteudoAgendamentos = '';
    
    if (!agendamentos || agendamentos.length === 0) {
        conteudoAgendamentos = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <i class="fas fa-calendar-plus text-2xl text-gray-300"></i>
                </div>
                <p class="text-gray-500 text-sm">Nenhum agendamento encontrado</p>
                <p class="text-gray-400 text-xs mt-1">Este aluno ainda não possui agendamentos</p>
            </div>
        `;
    } else {
        const statusColors = {
            'confirmado': 'bg-green-50 text-green-700',
            'cancelado': 'bg-red-50 text-red-700',
            'concluido': 'bg-gray-100 text-gray-600'
        };
        
        const statusLabels = {
            'confirmado': 'Confirmado',
            'cancelado': 'Cancelado',
            'concluido': 'Concluído'
        };
        
        const statusIcons = {
            'confirmado': '✅',
            'cancelado': '❌',
            'concluido': '📌'
        };
        
        conteudoAgendamentos = agendamentos.map(ag => {
            const centroNome = ag.horarios?.centros?.nome || 'Centro não identificado';
            const dataObj = new Date(ag.data_agendamento + 'T00:00:00');
            const diasSemana = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            
            const dataFormatada = `${diasSemana[dataObj.getDay()]}, ${String(dataObj.getDate()).padStart(2, '0')} ${meses[dataObj.getMonth()]}`;
            
            const horaInicio = ag.horarios?.hora_inicio?.substring(0,5) || '--';
            const horaFim = ag.horarios?.hora_fim?.substring(0,5) || '--';
            
            return `
                <div class="bg-gray-50/80 rounded-xl p-3 hover:bg-gray-100 transition border border-gray-100/50">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-medium text-gray-800 text-sm">${centroNome}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full ${statusColors[ag.status] || 'bg-gray-100 text-gray-600'}">
                                    ${statusIcons[ag.status] || ''} ${statusLabels[ag.status] || ag.status}
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                <span class="flex items-center gap-1">
                                    <i class="far fa-calendar text-[10px]"></i>
                                    ${dataFormatada}
                                </span>
                                <span class="flex items-center gap-1">
                                    <i class="far fa-clock text-[10px]"></i>
                                    ${horaInicio} - ${horaFim}
                                </span>
                            </div>
                        </div>
                        ${ag.status === 'confirmado' ? `
                            <button onclick="window.cancelarAgendamentoAluno('${ag.id}')" 
                                    class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                                <i class="fas fa-times text-sm"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
            <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-user text-[#F4742B] text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 class="text-lg font-semibold text-[#4B4B4D] truncate">${aluno?.nome || 'Aluno'}</h3>
                        <p class="text-xs text-gray-400 truncate">${aluno?.email || 'N/E'}</p>
                    </div>
                </div>
                <button onclick="fecharModalAgendamentosAluno()" 
                        class="w-8 h-8 rounded-full hover:bg-gray-100 transition flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-times text-gray-400"></i>
                </button>
            </div>
            
            <div class="flex items-center gap-2 mb-4">
                <span class="text-xs font-medium px-3 py-1 rounded-full bg-[#FEF3E8] text-[#F4742B]">
                    <i class="fas fa-calendar-check mr-1"></i>
                    ${agendamentos?.length || 0} agendamentos
                </span>
                ${aluno?.telefone ? `
                    <button onclick="window.abrirWhatsAppAluno('${aluno.telefone}', '${aluno.nome || 'Aluno'}')" 
                            class="text-xs font-medium px-3 py-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition">
                        <i class="fab fa-whatsapp mr-1"></i>
                        WhatsApp
                    </button>
                ` : ''}
            </div>
            
            <div class="space-y-2" style="max-height: 45vh; overflow-y: auto; padding-right: 4px;">
                ${conteudoAgendamentos}
            </div>
            
            <div class="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                <button onclick="fecharModalAgendamentosAluno()" 
                        class="px-5 py-2 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98]">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === this) fecharModalAgendamentosAluno();
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
        setTimeout(() => modal.remove(), 300);
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
                window.closeModal();
                
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
                        setTimeout(() => window.aplicarFiltrosAlunos(), 300);
                    }
                });
            } catch (error) {
                console.error('Erro ao cancelar:', error);
                window.closeModal();
                errorModal({
                    title: 'Erro ao Cancelar',
                    message: error.message || 'Ocorreu um erro ao cancelar o agendamento.',
                    confirmText: 'OK',
                    onConfirm: () => window.closeModal()
                });
            }
        },
        onCancel: () => {
            window.closeModal();
        }
    });
};

// ============================================
// FUNÇÃO: Toggle Status do Aluno
// ============================================
window.toggleStatusAluno = async function(id, ativo) {
    const acao = ativo ? 'desativar' : 'ativar';
    const acaoTexto = ativo ? 'Desativar' : 'Ativar';
    
    confirmModal({
        title: `${acaoTexto} Aluno`,
        message: `Tem certeza que deseja ${acao} este aluno?`,
        confirmText: acaoTexto,
        cancelText: 'Cancelar',
        confirmColor: ativo ? '#EF4444' : '#10B981',
        onConfirm: async () => {
            try {
                window.closeModal();
                
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
                        window.closeModal();
                        window.aplicarFiltrosAlunos();
                    }
                });
                
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                window.closeModal();
                errorModal({
                    title: 'Erro ao Alterar Status',
                    message: error.message || 'Ocorreu um erro ao alterar o status do aluno.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                    }
                });
            }
        },
        onCancel: () => {
            window.closeModal();
        }
    });
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
    
    const link = `https://wa.me/55${telefoneLimpo}?text=Olá ${encodeURIComponent(nome || 'Aluno')}!%20Sou%20da%20WODBOOK.%20Gostaria%20de%20falar%20com%20você.`;
    window.open(link, '_blank');
};

// ============================================
// FUNÇÃO: Exportar Alunos para PDF
// ============================================
window.exportarAlunosPDF = async function() {
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('nome, email, telefone, role')
            .order('nome', { ascending: true });
        
        if (error) throw error;
        
        if (!usuarios || usuarios.length === 0) {
            infoModal({
                title: 'Nenhum Aluno',
                message: 'Não há alunos para exportar.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        const { default: jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
        
        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        doc.setFontSize(20);
        doc.setTextColor('#F4742B');
        doc.text('WODBOOK - Alunos', 14, 25);
        
        doc.setFontSize(11);
        doc.setTextColor('#4B4B4D');
        doc.text(`Total: ${usuarios.length} alunos`, 14, 35);
        doc.text(`Gerado: ${new Date().toLocaleString('pt-BR')}`, 14, 42);
        
        let y = 55;
        usuarios.forEach((aluno, index) => {
            if (y > 270) {
                doc.addPage();
                y = 25;
            }
            
            doc.setFontSize(10);
            doc.setTextColor('#1F2937');
            doc.text(`${index + 1}. ${aluno.nome || 'N/I'}`, 14, y);
            
            doc.setFontSize(9);
            doc.setTextColor('#6B7280');
            doc.text(`   Email: ${aluno.email || 'N/I'}`, 14, y + 5);
            doc.text(`   Telefone: ${aluno.telefone || 'N/I'}`, 14, y + 10);
            doc.text(`   Status: ${aluno.role === 'admin' ? 'Admin' : 'Aluno'}`, 14, y + 15);
            
            y += 24;
        });
        
        doc.save(`alunos_${new Date().toISOString().split('T')[0]}.pdf`);
        
        successModal({
            title: 'PDF Exportado!',
            message: `Arquivo gerado com ${usuarios.length} alunos.`,
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        errorModal({
            title: 'Erro ao Exportar',
            message: error.message || 'Ocorreu um erro ao gerar o PDF.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
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
                window.aplicarFiltrosAlunos();
            }
        }
    });
}