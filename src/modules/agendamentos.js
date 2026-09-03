import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal } from './shared.js';
import { loadPage } from './router.js';

// ============================================
// FUNÇÃO: Carregar Conteúdo de Agendamentos
// ============================================
export async function loadAgendamentosContent() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    const { data: centros, error: centrosError } = await supabase
        .from('centros')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });
    
    if (centrosError) {
        console.error('Erro ao carregar centros:', centrosError);
    }
    
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    
    return `
        <!-- Estatísticas - Design Apple -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalAgendamentos">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-calendar-check text-[#F4742B] text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Hoje</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="agendamentosHoje">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <i class="fas fa-calendar-day text-green-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Confirmados</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="agendamentosConfirmados">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <i class="fas fa-check-circle text-blue-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Cancelados</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="agendamentosCancelados">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <i class="fas fa-times-circle text-red-500 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros - Design Limpo -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <select id="filtroCentro" 
                            class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                        <option value="">Todas as unidades</option>
                        ${centros?.map(c => `
                            <option value="${c.id}">${c.nome}</option>
                        `).join('') || ''}
                    </select>
                </div>
                
                <div>
                    <input type="date" id="filtroData" value="${dataAtual}"
                           class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                </div>
                
                <div>
                    <select id="filtroStatus" 
                            class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                        <option value="">Todos os status</option>
                        <option value="confirmado">Confirmados</option>
                        <option value="cancelado">Cancelados</option>
                        <option value="concluido">Concluídos</option>
                    </select>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="window.aplicarFiltros()" 
                            class="flex-1 h-10 px-4 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-search text-xs"></i>
                        <span class="hidden sm:inline">Filtrar</span>
                    </button>
                    <button onclick="window.exportarPDF()" 
                            class="h-10 px-4 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-file-pdf text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Agendamentos -->
        <div id="agendamentosList" class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="flex items-center justify-center py-16">
                <div class="text-center">
                    <div class="w-12 h-12 border-4 border-[#F4742B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p class="text-gray-400 text-sm">Carregando agendamentos...</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// FUNÇÃO: Aplicar Filtros e Carregar Agendamentos
// ============================================
window.aplicarFiltros = async function() {
    const container = document.getElementById('agendamentosList');
    const centroId = document.getElementById('filtroCentro')?.value || '';
    const data = document.getElementById('filtroData')?.value || '';
    const status = document.getElementById('filtroStatus')?.value || '';
    
    if (!data) {
        infoModal({
            title: 'Selecione uma Data',
            message: 'Por favor, selecione uma data para visualizar os agendamentos.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    container.innerHTML = `
        <div class="flex items-center justify-center py-16">
            <div class="text-center">
                <div class="w-12 h-12 border-4 border-[#F4742B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-400 text-sm">Carregando...</p>
            </div>
        </div>
    `;
    
    try {
        let query = supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (id, nome, telefone, email, usa_plataforma, nome_plataforma),
                horarios (
                    *,
                    centros (*)
                )
            `)
            .eq('data_agendamento', data);
        
        if (centroId) {
            query = query.eq('horarios.centro_id', centroId);
        }
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data: agendamentos, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        await atualizarEstatisticas(data);
        
        if (!agendamentos || agendamentos.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 px-4">
                    <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <i class="fas fa-calendar-plus text-3xl text-gray-300"></i>
                    </div>
                    <p class="text-lg font-medium text-gray-600">Nenhum agendamento</p>
                    <p class="text-sm text-gray-400 mt-1">Para ${new Date(data).toLocaleDateString('pt-BR')}</p>
                </div>
            `;
            return;
        }
        
        // Agrupar por centro
        const agendamentosPorCentro = {};
        agendamentos.forEach(ag => {
            const centroNome = ag.horarios?.centros?.nome || 'Sem centro';
            if (!agendamentosPorCentro[centroNome]) {
                agendamentosPorCentro[centroNome] = [];
            }
            agendamentosPorCentro[centroNome].push(ag);
        });
        
        let html = `
            <div class="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <span class="font-semibold text-[#4B4B4D]">${agendamentos.length}</span>
                    <span class="text-gray-500 text-sm"> agendamentos</span>
                </div>
                <span class="text-xs text-gray-400">${new Date(data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
            </div>
            <div class="divide-y divide-gray-100">
        `;
        
        Object.keys(agendamentosPorCentro).forEach(centroNome => {
            const items = agendamentosPorCentro[centroNome];
            
            html += `
                <div class="p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold text-[#4B4B4D] flex items-center gap-2">
                            <i class="fas fa-dumbbell text-[#F4742B] text-sm"></i>
                            ${centroNome}
                        </h3>
                        <span class="text-xs text-gray-400">${items.length} agendamentos</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            `;
            
            items.forEach(ag => {
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
                
                const horaInicio = ag.horarios?.hora_inicio?.substring(0,5) || '--';
                const horaFim = ag.horarios?.hora_fim?.substring(0,5) || '--';
                
                // 🔥 DADOS DA PLATAFORMA
                const temPlataforma = ag.usuarios?.usa_plataforma === true;
                const nomePlataforma = ag.usuarios?.nome_plataforma || '';
                
                html += `
                    <div class="bg-gray-50/80 rounded-xl p-3 hover:bg-gray-100 transition border border-gray-100/50">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <p class="font-medium text-gray-800 text-sm truncate">
                                        ${ag.usuarios?.nome || 'Usuário não identificado'}
                                    </p>
                                    
                                    <!-- 🔥 BADGE DA PLATAFORMA PASS -->
                                    ${temPlataforma ? `
                                        <span class="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#FEF3E8] text-[#F4742B] border border-[#FED7AA]" title="Utiliza plataforma ${nomePlataforma}">
                                            <i class="fas fa-id-card text-[8px]"></i>
                                            ${nomePlataforma}
                                        </span>
                                    ` : `
                                        <span class="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400" title="Não utiliza plataforma">
                                            <i class="fas fa-user text-[8px]"></i>
                                            Sem Pass
                                        </span>
                                    `}
                                </div>
                                
                                <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span class="flex items-center gap-1">
                                        <i class="far fa-clock text-[10px]"></i>
                                        ${horaInicio} - ${horaFim}
                                    </span>
                                    
                                    <!-- 🔥 LINK PARA WHATSAPP -->
                                    ${ag.usuarios?.telefone ? `
                                        <a href="https://wa.me/55${ag.usuarios.telefone.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(ag.usuarios.nome || 'Aluno')}!%20Sou%20da%20WODBOOK." 
                                           target="_blank"
                                           class="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 px-1.5 py-0.5 rounded-lg transition"
                                           title="Chamar no WhatsApp">
                                            <i class="fab fa-whatsapp text-[10px]"></i>
                                            ${ag.usuarios.telefone}
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full ${statusColors[ag.status] || 'bg-gray-100 text-gray-600'} whitespace-nowrap flex-shrink-0">
                                ${statusIcons[ag.status] || ''} ${statusLabels[ag.status] || ag.status}
                            </span>
                        </div>
                        ${ag.status === 'confirmado' ? `
                            <div class="flex gap-2 mt-2 pt-2 border-t border-gray-200/50">
                                <button onclick="window.cancelarAgendamentoAdmin('${ag.id}')" 
                                        class="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition">
                                    <i class="fas fa-times mr-1"></i> Cancelar
                                </button>
                                <button onclick="window.concluirAgendamento('${ag.id}')" 
                                        class="text-xs text-green-500 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded-lg transition">
                                    <i class="fas fa-check mr-1"></i> Concluir
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4">
                <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-circle text-3xl text-red-400"></i>
                </div>
                <p class="text-lg font-medium text-gray-600">Erro ao carregar</p>
                <p class="text-sm text-gray-400 mt-1">Tente novamente mais tarde</p>
                <button onclick="window.aplicarFiltros()" 
                        class="mt-4 px-6 py-2 bg-[#F4742B] text-white text-sm rounded-xl hover:bg-[#E0601A] transition">
                    Tentar novamente
                </button>
            </div>
        `;
    }
};

// ============================================
// FUNÇÃO: Atualizar Estatísticas
// ============================================
async function atualizarEstatisticas(data) {
    try {
        const { count: total } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true });
        
        const totalEl = document.getElementById('totalAgendamentos');
        if (totalEl) totalEl.textContent = total || 0;
        
        const { count: hoje } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('data_agendamento', data);
        
        const hojeEl = document.getElementById('agendamentosHoje');
        if (hojeEl) hojeEl.textContent = hoje || 0;
        
        const { count: confirmados } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmado');
        
        const confirmadosEl = document.getElementById('agendamentosConfirmados');
        if (confirmadosEl) confirmadosEl.textContent = confirmados || 0;
        
        const { count: cancelados } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'cancelado');
        
        const canceladosEl = document.getElementById('agendamentosCancelados');
        if (canceladosEl) canceladosEl.textContent = cancelados || 0;
        
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

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
                
                window.closeModal();
                
                successModal({
                    title: 'Agendamento Cancelado!',
                    message: 'O agendamento foi cancelado com sucesso.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        window.aplicarFiltros();
                    }
                });
                
                setTimeout(() => {
                    const modal = document.getElementById('customModal');
                    if (modal && modal.classList.contains('active')) {
                        window.closeModal();
                        window.aplicarFiltros();
                    }
                }, 3000);
                
            } catch (error) {
                console.error('Erro ao cancelar:', error);
                window.closeModal();
                errorModal({
                    title: 'Erro ao Cancelar',
                    message: error.message || 'Ocorreu um erro ao cancelar o agendamento.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                    }
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Concluir Agendamento
// ============================================
window.concluirAgendamento = function(id) {
    confirmModal({
        title: 'Concluir Agendamento',
        message: 'Marcar este agendamento como concluído?',
        confirmText: 'Concluir',
        cancelText: 'Voltar',
        confirmColor: '#10B981',
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('agendamentos')
                    .update({ status: 'concluido' })
                    .eq('id', id);
                
                if (error) throw error;
                
                window.closeModal();
                
                successModal({
                    title: 'Agendamento Concluído!',
                    message: 'O agendamento foi marcado como concluído.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        window.aplicarFiltros();
                    }
                });
                
                setTimeout(() => {
                    const modal = document.getElementById('customModal');
                    if (modal && modal.classList.contains('active')) {
                        window.closeModal();
                        window.aplicarFiltros();
                    }
                }, 3000);
                
            } catch (error) {
                console.error('Erro ao concluir:', error);
                window.closeModal();
                errorModal({
                    title: 'Erro ao Concluir',
                    message: error.message || 'Ocorreu um erro ao concluir o agendamento.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                    }
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Exportar para PDF
// ============================================
window.exportarPDF = async function() {
    const data = document.getElementById('filtroData')?.value || '';
    const centroId = document.getElementById('filtroCentro')?.value || '';
    
    if (!data) {
        infoModal({
            title: 'Selecione uma Data',
            message: 'Por favor, selecione uma data para exportar.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    try {
        let query = supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (id, nome, telefone, email, usa_plataforma, nome_plataforma),
                horarios (
                    *,
                    centros (*)
                )
            `)
            .eq('data_agendamento', data);
        
        if (centroId) {
            query = query.eq('horarios.centro_id', centroId);
        }
        
        const { data: agendamentos, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!agendamentos || agendamentos.length === 0) {
            infoModal({
                title: 'Nenhum Agendamento',
                message: 'Não há agendamentos para exportar nesta data.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        const dataFormatada = new Date(data).toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        
        doc.setFontSize(18);
        doc.setTextColor('#F4742B');
        doc.text('WODBOOK - Agendamentos', 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor('#4B4B4D');
        doc.text(`Data: ${dataFormatada}`, 14, 30);
        
        if (centroId) {
            const centro = await supabase
                .from('centros')
                .select('nome')
                .eq('id', centroId)
                .single();
            
            if (centro.data) {
                doc.text(`Unidade: ${centro.data.nome}`, 14, 37);
            }
        }
        
        const tableData = agendamentos.map(ag => [
            ag.usuarios?.nome || 'N/I',
            ag.usuarios?.telefone || 'N/I',
            ag.horarios?.hora_inicio?.substring(0,5) || '--',
            ag.horarios?.hora_fim?.substring(0,5) || '--',
            ag.horarios?.centros?.nome || 'N/I',
            ag.status === 'confirmado' ? '✅ Confirmado' : 
            ag.status === 'cancelado' ? '❌ Cancelado' : 
            '📌 Concluído'
        ]);
        
        if (typeof autoTable !== 'undefined') {
            autoTable(doc, {
                head: [['Aluno', 'Telefone', 'Início', 'Fim', 'Unidade', 'Status']],
                body: tableData,
                startY: 45,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    valign: 'middle',
                    halign: 'left'
                },
                headStyles: {
                    fillColor: '#F4742B',
                    textColor: '#FFFFFF',
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: '#FEF3E8'
                },
                tableWidth: 'auto',
                margin: { left: 14, right: 14 }
            });
        } else {
            doc.setFontSize(10);
            doc.text('Dados dos agendamentos:', 14, 50);
            
            let y = 60;
            tableData.forEach((row, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${row[0]} - ${row[1]} - ${row[2]}h - ${row[4]}`, 14, y);
                y += 8;
            });
        }
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor('#9CA3AF');
            doc.text(
                `Gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${pageCount}`,
                14,
                doc.internal.pageSize.height - 10
            );
        }
        
        doc.save(`agendamentos_${data}.pdf`);
        
        successModal({
            title: 'PDF Exportado!',
            message: 'O arquivo PDF foi gerado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        errorModal({
            title: 'Erro ao Exportar',
            message: error.message || 'Ocorreu um erro ao gerar o PDF. Tente novamente.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Carregar Script
// ============================================
function carregarScript(src) {
    return new Promise((resolve, reject) => {
        const scripts = document.querySelectorAll(`script[src="${src}"]`);
        if (scripts.length > 0) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => {
            console.log(`✅ Script carregado: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`❌ Erro ao carregar script: ${src}`);
            reject(new Error(`Erro ao carregar script: ${src}`));
        };
        document.head.appendChild(script);
    });
}

// ============================================
// EVENTOS
// ============================================
export function setupAgendamentosEvents() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target && (target.id === 'filtroData' || 
                target.id === 'filtroCentro' || 
                target.id === 'filtroStatus')) {
                if (typeof window.aplicarFiltros === 'function') {
                    window.aplicarFiltros();
                }
            }
        }
    });
    
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'filtroData') {
            if (typeof window.aplicarFiltros === 'function') {
                window.aplicarFiltros();
            }
        }
    });
}