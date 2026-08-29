import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal } from './shared.js';

// ============================================
// FUNÇÃO: Gerar Link do WhatsApp
// ============================================
function gerarLinkWhatsApp(telefone, mensagem = '') {
    if (!telefone || telefone === 'Não informado') return null;
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) return null;
    
    let numeroWhatsApp = telefoneLimpo;
    if (!numeroWhatsApp.startsWith('55')) {
        numeroWhatsApp = '55' + numeroWhatsApp;
    }
    
    const mensagemCodificada = encodeURIComponent(mensagem);
    return `https://wa.me/${numeroWhatsApp}${mensagemCodificada ? `?text=${mensagemCodificada}` : ''}`;
}

// ============================================
// ESTADO GLOBAL DAS NOTIFICAÇÕES
// ============================================
let notificacoesCache = [];
let notificacoesLidas = JSON.parse(localStorage.getItem('notificacoesLidas') || '[]');

// ============================================
// FUNÇÃO: Buscar Nome da Empresa
// ============================================
async function buscarNomeEmpresa() {
    try {
        const { data, error } = await supabase
            .from('configuracoes')
            .select('valor')
            .eq('chave', 'nome_academia')
            .single();
        
        if (error) {
            console.warn('⚠️ Erro ao buscar nome da empresa:', error);
            return 'CrossFit Agendamentos';
        }
        
        return data?.valor || 'CrossFit Agendamentos';
    } catch (error) {
        console.warn('⚠️ Erro ao buscar nome da empresa:', error);
        return 'CrossFit Agendamentos';
    }
}

// ============================================
// FUNÇÃO: Buscar Notificações (SEM CPF)
// ============================================
async function buscarNotificacoes(limit = 10) {
    try {
        const user = await getCurrentUser();
        if (!user) return [];
        
        const hoje = new Date().toISOString().split('T')[0];
        
        // 🔥 Buscar agendamentos - REMOVIDO CPF
        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (id, nome, telefone, email),
                horarios (
                    id,
                    hora_inicio,
                    hora_fim,
                    vagas,
                    ativo,
                    centros (
                        id,
                        nome,
                        bairro,
                        endereco,
                        telefone
                    )
                )
            `)
            .in('status', ['confirmado', 'pendente'])
            .gte('data_agendamento', hoje)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        // 🔥 FILTRAR: Apenas agendamentos com horários ativos
        const notificacoesFiltradas = data?.filter(ag => {
            return ag.horarios && ag.horarios.ativo === true;
        }) || [];
        
        notificacoesCache = notificacoesFiltradas.map(ag => ({
            id: ag.id,
            tipo: 'agendamento',
            mensagem: `${ag.usuarios?.nome || 'Aluno'} agendou para ${formatarData(ag.data_agendamento)} às ${ag.horarios?.hora_inicio?.substring(0,5)}`,
            data: ag.data_agendamento,
            hora: ag.horarios?.hora_inicio,
            centro: ag.horarios?.centros?.nome,
            status: ag.status,
            lida: notificacoesLidas.includes(ag.id),
            dadosCompletos: ag
        })) || [];
        
        console.log(`📢 ${notificacoesCache.length} notificações encontradas`);
        
        return notificacoesCache;
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
    }
}

// ============================================
// FUNÇÃO AUXILIAR: Formatar Data
// ============================================
function formatarData(dataStr) {
    if (!dataStr) return '';
    
    const data = new Date(dataStr + 'T00:00:00');
    
    const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    return `${dias[data.getDay()]}, ${String(data.getDate()).padStart(2, '0')} de ${meses[data.getMonth()]} de ${data.getFullYear()}`;
}

// ============================================
// FUNÇÃO: Marcar Notificação como Lida
// ============================================
function marcarComoLida(id) {
    if (!notificacoesLidas.includes(id)) {
        notificacoesLidas.push(id);
        localStorage.setItem('notificacoesLidas', JSON.stringify(notificacoesLidas));
    }
    
    notificacoesCache = notificacoesCache.map(n => {
        if (n.id === id) {
            n.lida = true;
        }
        return n;
    });
    
    atualizarBadge();
}

// ============================================
// FUNÇÃO: Marcar Todas como Lidas
// ============================================
window.marcarTodasNotificacoesLidas = function() {
    const naoLidas = notificacoesCache.filter(n => !n.lida);
    
    if (naoLidas.length === 0) {
        infoModal({
            title: 'Todas lidas!',
            message: 'Você já visualizou todas as notificações.',
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
            }
        });
        return;
    }
    
    confirmModal({
        title: 'Marcar todas como lidas',
        message: `Tem certeza que deseja marcar todas as ${naoLidas.length} notificações como lidas?`,
        confirmText: 'Sim, marcar todas',
        cancelText: 'Cancelar',
        confirmColor: '#F4742B',
        onConfirm: () => {
            window.closeModal();
            
            naoLidas.forEach(n => {
                if (!notificacoesLidas.includes(n.id)) {
                    notificacoesLidas.push(n.id);
                }
            });
            localStorage.setItem('notificacoesLidas', JSON.stringify(notificacoesLidas));
            
            notificacoesCache = notificacoesCache.map(n => {
                n.lida = true;
                return n;
            });
            
            atualizarBadge();
            renderizarNotificacoes();
            
            successModal({
                title: 'Todas marcadas como lidas!',
                message: `${naoLidas.length} notificações foram marcadas como lidas.`,
                confirmText: 'OK',
                onConfirm: () => {
                    window.closeModal();
                }
            });
        },
        onCancel: () => {
            window.closeModal();
        }
    });
};

// ============================================
// FUNÇÃO: Atualizar Badge
// ============================================
function atualizarBadge() {
    const badge = document.getElementById('badgeNotificacoes');
    if (badge) {
        const naoLidas = notificacoesCache.filter(n => !n.lida).length;
        badge.textContent = naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
}

// ============================================
// FUNÇÃO: Renderizar Dropdown
// ============================================
export async function renderizarNotificacoes() {
    const notificacoes = await buscarNotificacoes(10);
    const container = document.getElementById('notificacoesList');
    const badge = document.getElementById('badgeNotificacoes');
    
    const naoLidas = notificacoes.filter(n => !n.lida).length;
    if (badge) {
        badge.textContent = naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    if (!container) return;
    
    if (notificacoes.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                <i class="fas fa-bell-slash text-3xl block mb-2 text-gray-300"></i>
                <p class="text-sm">Nenhuma notificação</p>
                <p class="text-xs text-gray-400">Novas notificações aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    const naoLidasCount = notificacoes.filter(n => !n.lida).length;
    
    container.innerHTML = `
        <div class="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50">
            <span class="text-xs text-gray-500">
                ${naoLidasCount > 0 ? `${naoLidasCount} não lidas` : 'Todas lidas'}
            </span>
            ${naoLidasCount > 0 ? `
                <button onclick="window.marcarTodasNotificacoesLidas()" 
                        class="text-xs text-[#F4742B] hover:text-[#E0601A] font-medium">
                    <i class="fas fa-check-double mr-1"></i> Marcar todas como lidas
                </button>
            ` : ''}
        </div>
        <div class="max-h-96 overflow-y-auto">
            ${notificacoes.map(notif => `
                <div class="px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0 cursor-pointer ${!notif.lida ? 'bg-[#FFF8F3]' : ''}" 
                     onclick="window.verNotificacao('${notif.id}')">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-full ${!notif.lida ? 'bg-[#F4742B]' : 'bg-[#FEF3E8]'} flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-calendar-check text-white text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-800 font-medium truncate">${notif.mensagem}</p>
                            <div class="flex items-center gap-2 mt-1">
                                ${notif.centro ? `<span class="text-xs text-gray-400"><i class="fas fa-location-dot mr-1"></i> ${notif.centro}</span>` : ''}
                                <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">${notif.status}</span>
                                ${!notif.lida ? `<span class="text-xs px-2 py-0.5 rounded-full bg-[#F4742B] text-white">Nova</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="p-2 border-t border-gray-100">
            <button onclick="window.verTodasNotificacoes()" 
                    class="w-full text-center text-sm text-[#F4742B] hover:text-[#E0601A] font-medium py-1">
                Ver todas as notificações
            </button>
        </div>
    `;
}

// ============================================
// FUNÇÕES GLOBAIS (window.*)
// ============================================
window.toggleDropdownNotificacoes = function() {
    const dropdown = document.getElementById('notificacoesDropdown');
    if (dropdown) {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        } else {
            dropdown.classList.add('show');
            renderizarNotificacoes();
        }
    }
};

window.fecharDropdownNotificacoes = function() {
    const dropdown = document.getElementById('notificacoesDropdown');
    if (dropdown) dropdown.classList.remove('show');
};

// ============================================
// FUNÇÃO: Ver Notificação (Detalhes Completos - SEM CPF)
// ============================================
window.verNotificacao = async function(id) {
    try {
        marcarComoLida(id);

        const nomeEmpresa = await buscarNomeEmpresa();
        
        const { data: agendamento, error } = await supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (id, nome, telefone, email),
                horarios (
                    id,
                    hora_inicio,
                    hora_fim,
                    vagas,
                    centros (
                        id,
                        nome,
                        bairro,
                        endereco,
                        telefone
                    )
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        if (!agendamento) {
            errorModal({
                title: 'Notificação não encontrada',
                message: 'Este agendamento pode ter sido removido ou cancelado.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        window.fecharDropdownNotificacoes();
        
        const nomeAluno = agendamento.usuarios?.nome || 'Aluno não identificado';
        const telefone = agendamento.usuarios?.telefone || 'Não informado';
        const centroNome = agendamento.horarios?.centros?.nome || 'Centro não identificado';
        const centroEndereco = agendamento.horarios?.centros?.endereco || 'Endereço não informado';
        const centroBairro = agendamento.horarios?.centros?.bairro || '';
        const centroTelefone = agendamento.horarios?.centros?.telefone || 'Não informado';
        
        const dataFormatada = formatarData(agendamento.data_agendamento);
        
        const horaInicio = agendamento.horarios?.hora_inicio?.substring(0, 5) || '--';
        const horaFim = agendamento.horarios?.hora_fim?.substring(0, 5) || '--';
        
        const statusLabels = {
            'confirmado': '✅ Confirmado',
            'cancelado': '❌ Cancelado',
            'concluido': '📌 Concluído',
            'pendente': '⏳ Pendente'
        };
        
        const statusColors = {
            'confirmado': 'bg-green-100 text-green-700',
            'cancelado': 'bg-red-100 text-red-700',
            'concluido': 'bg-gray-100 text-gray-700',
            'pendente': 'bg-yellow-100 text-yellow-700'
        };
        
        // Link do WhatsApp
        const linkWhatsApp = telefone && telefone !== 'Não informado' 
            ? gerarLinkWhatsApp(telefone, `Olá ${nomeAluno}! Sou da ${nomeEmpresa}. Gostaria de falar sobre seu agendamento do dia ${dataFormatada}.`)
            : null;
        
        const modalContent = `
            <div style="max-width: 500px; width: 100%;">
                <!-- Cabeçalho -->
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-[#FEF3E8] flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-calendar-check text-[#F4742B] text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-[#4B4B4D]">Detalhes do Agendamento</h3>
                            <span class="text-xs px-2 py-0.5 rounded-full ${statusColors[agendamento.status] || 'bg-gray-100 text-gray-700'}">
                                ${statusLabels[agendamento.status] || agendamento.status}
                            </span>
                        </div>
                    </div>
                    <button onclick="window.fecharDetalhesAgendamento()" 
                            class="text-gray-400 hover:text-gray-600 text-2xl transition">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Informações do Aluno -->
                <div class="bg-gray-50 rounded-lg p-4 mb-3">
                    <h4 class="text-sm font-semibold text-[#4B4B4D] mb-2 flex items-center gap-2">
                        <i class="fas fa-user text-[#F4742B]"></i> Aluno
                    </h4>
                    <div class="space-y-1 text-sm">
                        <p><span class="text-gray-500">Nome:</span> <span class="font-medium">${nomeAluno}</span></p>
                        <p><span class="text-gray-500">Telefone:</span> ${telefone}</p>
                        ${linkWhatsApp ? `
                            <div class="mt-2 pt-2 border-t border-gray-200">
                                <a href="${linkWhatsApp}" 
                                   target="_blank" 
                                   class="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium hover:underline transition">
                                    <i class="fab fa-whatsapp text-lg"></i>
                                    Falar com o aluno no WhatsApp
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Informações da Unidade -->
                <div class="bg-gray-50 rounded-lg p-4 mb-3">
                    <h4 class="text-sm font-semibold text-[#4B4B4D] mb-2 flex items-center gap-2">
                        <i class="fas fa-dumbbell text-[#F4742B]"></i> Unidade
                    </h4>
                    <div class="space-y-1 text-sm">
                        <p><span class="text-gray-500">Nome:</span> <span class="font-medium">${centroNome}</span></p>
                        <p><span class="text-gray-500">Endereço:</span> ${centroEndereco} ${centroBairro ? `- ${centroBairro}` : ''}</p>
                        <p><span class="text-gray-500">Telefone:</span> ${centroTelefone}</p>
                    </div>
                </div>
                
                <!-- Informações do Horário -->
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 class="text-sm font-semibold text-[#4B4B4D] mb-2 flex items-center gap-2">
                        <i class="fas fa-clock text-[#F4742B]"></i> Horário
                    </h4>
                    <div class="space-y-1 text-sm">
                        <p><span class="text-gray-500">Data:</span> ${dataFormatada}</p>
                        <p><span class="text-gray-500">Horário:</span> ${horaInicio} - ${horaFim}</p>
                        <p><span class="text-gray-500">Vagas:</span> ${agendamento.horarios?.vagas || 10}</p>
                    </div>
                </div>
                
                <!-- Ações -->
                <div class="flex gap-2">
                    ${agendamento.status === 'confirmado' ? `
                        <button onclick="window.cancelarAgendamentoNotificacao('${agendamento.id}')" 
                                class="flex-1 px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition">
                            <i class="fas fa-times mr-1"></i> Cancelar
                        </button>
                    ` : ''}
                    <button onclick="window.fecharDetalhesAgendamento()" 
                            class="${agendamento.status === 'confirmado' ? 'flex-1' : 'w-full'} px-4 py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition">
                        <i class="fas fa-check mr-1"></i> Fechar
                    </button>
                </div>
            </div>
        `;
        
        const modalExistente = document.getElementById('modalDetalhesAgendamento');
        if (modalExistente) modalExistente.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';
        overlay.id = 'modalDetalhesAgendamento';
        
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 550px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
                ${modalContent}
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                overlay.remove();
            }
        });
        
        const handleEsc = function(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes do agendamento:', error);
        errorModal({
            title: 'Erro ao Carregar',
            message: error.message || 'Não foi possível carregar os detalhes do agendamento.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Cancelar Agendamento pela Notificação
// ============================================
window.cancelarAgendamentoNotificacao = function(id) {
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
                
                window.fecharDetalhesAgendamento();
                notificacoesCache = notificacoesCache.filter(n => n.id !== id);
                atualizarBadge();
                
                successModal({
                    title: 'Agendamento Cancelado!',
                    message: 'O agendamento foi cancelado com sucesso.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        setTimeout(() => {
                            if (document.getElementById('notificacoesDropdown')?.classList.contains('show')) {
                                renderizarNotificacoes();
                            }
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
// FUNÇÃO: Ver Todas as Notificações
// ============================================
window.verTodasNotificacoes = function() {
    if (window.loadPage) window.loadPage('agendamentos');
    window.fecharDropdownNotificacoes();
};

// ============================================
// FUNÇÃO: Fechar Detalhes do Agendamento
// ============================================
window.fecharDetalhesAgendamento = function() {
    const modal = document.getElementById('modalDetalhesAgendamento');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// ============================================
// FUNÇÃO: Inicializar Notificações
// ============================================
export function initNotificacoes() {
    buscarNotificacoes().then(notificacoes => {
        const badge = document.getElementById('badgeNotificacoes');
        if (badge) {
            const naoLidas = notificacoes.filter(n => !n.lida).length;
            badge.textContent = naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    });
    
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificacoesDropdown');
        const btn = document.getElementById('btnNotificacoes');
        if (dropdown && btn) {
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        }
    });
}