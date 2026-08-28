import { supabase, getCurrentUser, getUserProfile } from '../config/supabase.js';

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
    
    // Atualizar avatar no menu
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
    
    // Buscar centros
    const { data: centros } = await supabase
        .from('centros')
        .select('*')
        .eq('ativo', true)
        .limit(6);
    
    // 🔥 BUSCAR AGENDAMENTOS COM MAIS DETALHES
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
    
    // 🔥 FILTRAR APENAS AGENDAMENTOS FUTUROS (a partir de hoje)
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
    
    // 🔥 FORMATAR DATA CORRETAMENTE
    function formatarData(dataStr) {
        const data = new Date(dataStr + 'T00:00:00');
        const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return `${dias[data.getDay()]}, ${String(data.getDate()).padStart(2, '0')} de ${meses[data.getMonth()]} de ${data.getFullYear()}`;
    }
    
    return `
        <!-- Banner Hero -->
        <div class="gradient-hero rounded-2xl p-6 md:p-8 mb-6 text-white relative overflow-hidden" 
             style="background: linear-gradient(135deg, #F4742B 0%, #E0601A 50%, #4B4B4D 100%);">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
            
            <div class="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl md:text-3xl font-extrabold">
                        <i class="fas fa-wave-square mr-2"></i> 
                        Olá, <span id="userName">${nome}</span>! 👋
                    </h2>
                    <p class="text-white/80 mt-1">Pronto para mais um treino? 💪</p>
                </div>
                <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                    <i class="fas fa-fire text-[#F4742B]"></i>
                    <span class="font-semibold">${agendamentosFuturos.length} aulas agendadas</span>
                </div>
            </div>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Próximas Aulas</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]">${totalFuturos}</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-calendar-check text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total de Aulas</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]">${total}</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-check-circle text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Centros Disponíveis</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]">${centros?.length || 0}</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-location-dot text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Centros -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-[#4B4B4D]">
                    <i class="fas fa-dumbbell text-[#F4742B]"></i> Centros de Treinamento
                </h3>
                <a href="#" onclick="window.loadPage('centros'); return false;" class="text-[#F4742B] hover:text-[#E0601A] text-sm font-medium transition">
                    Ver todos <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>
            <div id="centrosList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                ${centros?.map(centro => {
                    const imagemUrl = centro.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=300&font-size=0.4`;
                    return `
                        <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100 group">
                            <div class="relative h-48 overflow-hidden bg-[#FEF3E8]">
                                <img src="${imagemUrl}" 
                                     alt="${centro.nome}" 
                                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                     loading="lazy"
                                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=300&font-size=0.4'">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div class="absolute bottom-3 left-3">
                                    <h3 class="text-white font-bold text-lg drop-shadow-lg">${centro.nome}</h3>
                                    <p class="text-white/80 text-sm drop-shadow-lg">${centro.bairro}</p>
                                </div>
                            </div>
                            <div class="p-5">
                                <p class="text-gray-500 text-sm">
                                    <i class="fas fa-map-pin text-[#F4742B] mr-1"></i> ${centro.endereco}
                                </p>
                                <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                    <span><i class="far fa-clock mr-1"></i> ${centro.horario_funcionamento || '06:00 - 22:00'}</span>
                                    <span>•</span>
                                    <span><i class="fas fa-users mr-1"></i> ${centro.vagas_padrao || 10} vagas</span>
                                </div>
                                <button onclick="window.abrirAgendamento('${centro.id}', '${centro.nome}')" 
                                        class="mt-4 w-full bg-[#F4742B] text-white py-2.5 rounded-lg font-semibold hover:bg-[#E0601A] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md hover:shadow-[#F4742B]/25 flex items-center justify-center gap-2">
                                    <i class="fas fa-calendar-plus"></i> Agendar
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Agendamentos - VERSÃO MELHORADA -->
        <div>
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-[#4B4B4D]">
                    <i class="fas fa-clock text-[#F4742B]"></i> Meus Agendamentos
                </h3>
                <div class="flex items-center gap-3 text-sm">
                    <span class="text-gray-500">${totalFuturos} futuros</span>
                    <span class="text-gray-300">|</span>
                    <span class="text-gray-500">${totalPassados} concluídos</span>
                </div>
            </div>
            <div id="meusAgendamentos" class="bg-white rounded-2xl shadow-sm overflow-hidden">
                ${agendamentos?.length === 0 ? `
                    <div class="text-center text-gray-500 py-12">
                        <i class="fas fa-calendar-plus text-4xl mb-3 block text-[#F4742B]"></i>
                        <p class="text-lg font-medium">Nenhum agendamento encontrado</p>
                        <p class="text-sm mt-1">Agende sua primeira aula em um dos centros acima!</p>
                    </div>
                ` : `
                    <!-- Abas de filtro -->
                    <div class="flex border-b border-gray-200 bg-gray-50/50">
                        <button onclick="filtrarAgendamentos('todos')" 
                                class="px-4 py-2 text-sm font-medium text-[#F4742B] border-b-2 border-[#F4742B] transition" id="tabTodos">
                            Todos (${total})
                        </button>
                        <button onclick="filtrarAgendamentos('futuros')" 
                                class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" id="tabFuturos">
                            Futuros (${totalFuturos})
                        </button>
                        <button onclick="filtrarAgendamentos('passados')" 
                                class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition border-b-2 border-transparent" id="tabPassados">
                            Concluídos (${totalPassados})
                        </button>
                    </div>
                    
                    <!-- Lista de agendamentos -->
                    <div id="listaAgendamentos" class="divide-y divide-gray-100">
                        ${agendamentos.map(ag => {
                            const centroNome = ag.horarios?.centros?.nome || 'Centro não identificado';
                            const centroBairro = ag.horarios?.centros?.bairro || '';
                            const dataFormatada = formatarData(ag.data_agendamento);
                            const horaInicio = ag.horarios?.hora_inicio?.substring(0,5) || '--';
                            const horaFim = ag.horarios?.hora_fim?.substring(0,5) || '--';
                            const isFuturo = new Date(ag.data_agendamento + 'T00:00:00') >= hoje;
                            
                            return `
                                <div class="py-4 px-4 hover:bg-gray-50/50 transition agendamento-item" data-status="${isFuturo ? 'futuros' : 'passados'}">
                                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-2">
                                                <p class="font-semibold text-gray-800">${centroNome}</p>
                                                <span class="text-xs px-2 py-0.5 rounded-full ${isFuturo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                                                    ${isFuturo ? '📅 Futuro' : '✅ Concluído'}
                                                </span>
                                            </div>
                                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                                <span>
                                                    <i class="far fa-calendar mr-1"></i> ${dataFormatada}
                                                </span>
                                                <span>
                                                    <i class="far fa-clock mr-1"></i> ${horaInicio} - ${horaFim}
                                                </span>
                                                ${centroBairro ? `
                                                    <span>
                                                        <i class="fas fa-map-pin mr-1"></i> ${centroBairro}
                                                    </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            ${isFuturo ? `
                                                <button onclick="window.cancelarAgendamento('${ag.id}')" 
                                                        class="text-xs px-3 py-1 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition">
                                                    <i class="fas fa-times mr-1"></i> Cancelar
                                                </button>
                                            ` : `
                                                <span class="text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-lg">
                                                    <i class="fas fa-check mr-1"></i> Concluído
                                                </span>
                                            `}
                                        </div>
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
// FUNÇÃO: Filtrar Agendamentos (GLOBAL)
// ============================================
window.filtrarAgendamentos = function(filtro) {
    // Atualizar abas
    document.querySelectorAll('#tabTodos, #tabFuturos, #tabPassados').forEach(tab => {
        tab.classList.remove('text-[#F4742B]', 'border-[#F4742B]');
        tab.classList.add('text-gray-500', 'border-transparent');
    });
    
    const tabMap = {
        'todos': 'tabTodos',
        'futuros': 'tabFuturos',
        'passados': 'tabPassados'
    };
    
    const tabAtiva = document.getElementById(tabMap[filtro]);
    if (tabAtiva) {
        tabAtiva.classList.remove('text-gray-500', 'border-transparent');
        tabAtiva.classList.add('text-[#F4742B]', 'border-[#F4742B]');
    }
    
    // Filtrar itens
    document.querySelectorAll('.agendamento-item').forEach(item => {
        if (filtro === 'todos') {
            item.style.display = '';
        } else {
            item.style.display = item.dataset.status === filtro ? '' : 'none';
        }
    });
};

// ============================================
// FUNÇÃO: Cancelar Agendamento (GLOBAL)
// ============================================
window.cancelarAgendamento = async function(agendamentoId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
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