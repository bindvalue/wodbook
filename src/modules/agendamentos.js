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
    
    // Buscar centros ativos
    const { data: centros, error: centrosError } = await supabase
        .from('centros')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });
    
    if (centrosError) {
        console.error('Erro ao carregar centros:', centrosError);
    }
    
    // Data atual
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    
    return `
        <!-- Estatísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total Agendamentos</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="totalAgendamentos">0</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-calendar-check text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Hoje</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="agendamentosHoje">0</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-calendar-day text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Confirmados</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="agendamentosConfirmados">0</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Cancelados</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="agendamentosCancelados">0</p>
                    </div>
                    <div class="bg-red-100 p-3 rounded-full">
                        <i class="fas fa-times-circle text-red-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros - PADRONIZADOS -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <!-- Unidade -->
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-dumbbell text-[#F4742B] mr-1"></i> Unidade
                    </label>
                    <select id="filtroCentro" 
                            class="w-full h-10 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                        <option value="">Todas as unidades</option>
                        ${centros?.map(c => `
                            <option value="${c.id}">${c.nome}</option>
                        `).join('') || ''}
                    </select>
                </div>
                
                <!-- Data -->
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-calendar text-[#F4742B] mr-1"></i> Data
                    </label>
                    <input type="date" id="filtroData" value="${dataAtual}"
                           class="w-full h-10 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                </div>
                
                <!-- Status -->
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                        <i class="fas fa-filter text-[#F4742B] mr-1"></i> Status
                    </label>
                    <select id="filtroStatus" 
                            class="w-full h-10 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                        <option value="">Todos</option>
                        <option value="confirmado">Confirmados</option>
                        <option value="cancelado">Cancelados</option>
                        <option value="concluido">Concluídos</option>
                    </select>
                </div>
                
                <!-- Ações -->
                <div class="flex items-end gap-2">
                    <button onclick="window.aplicarFiltros()" 
                            class="flex-1 h-10 px-4 bg-[#F4742B] text-white text-sm font-medium rounded-lg hover:bg-[#E0601A] transition flex items-center justify-center gap-2">
                        <i class="fas fa-search text-xs"></i> Filtrar
                    </button>
                    <button onclick="window.exportarPDF()" 
                            class="h-10 px-4 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                        <i class="fas fa-file-pdf text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Agendamentos -->
        <div id="agendamentosList" class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-spinner fa-spin text-4xl mb-3 block text-[#F4742B]"></i>
                Carregando agendamentos...
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
            confirmText: 'OK'
        });
        return;
    }
    
    container.innerHTML = `
        <div class="text-center text-gray-500 py-12">
            <i class="fas fa-spinner fa-spin text-4xl mb-3 block text-[#F4742B]"></i>
            Carregando agendamentos...
        </div>
    `;
    
    try {
        let query = supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (nome, telefone, cpf),
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
        
        // Atualizar estatísticas
        await atualizarEstatisticas(data);
        
        if (!agendamentos || agendamentos.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <i class="fas fa-calendar-plus text-4xl mb-3 block text-gray-300"></i>
                    <p class="text-lg font-medium">Nenhum agendamento encontrado</p>
                    <p class="text-sm mt-1">Para a data ${new Date(data).toLocaleDateString('pt-BR')}</p>
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
            <div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <span class="font-semibold text-[#4B4B4D]">${agendamentos.length}</span>
                    <span class="text-gray-500"> agendamentos encontrados</span>
                </div>
                <span class="text-sm text-gray-500">
                    ${new Date(data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
            </div>
            <div class="divide-y divide-gray-100">
        `;
        
        Object.keys(agendamentosPorCentro).forEach(centroNome => {
            const items = agendamentosPorCentro[centroNome];
            
            html += `
                <div class="p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-[#4B4B4D] flex items-center gap-2">
                            <i class="fas fa-dumbbell text-[#F4742B]"></i>
                            ${centroNome}
                        </h3>
                        <span class="text-sm text-gray-500">
                            ${items.length} agendamentos
                        </span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            `;
            
            items.forEach(ag => {
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
                
                html += `
                    <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-semibold text-gray-800 text-sm">
                                    ${ag.usuarios?.nome || 'Usuário não identificado'}
                                </p>
                                <p class="text-xs text-gray-500">
                                    <i class="far fa-clock mr-1"></i> 
                                    ${ag.horarios?.hora_inicio?.substring(0,5) || '--'} - ${ag.horarios?.hora_fim?.substring(0,5) || '--'}
                                </p>
                                ${ag.usuarios?.telefone ? `
                                    <p class="text-xs text-gray-400">
                                        <i class="fas fa-phone mr-1"></i> ${ag.usuarios.telefone}
                                    </p>
                                ` : ''}
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full ${statusColors[ag.status] || 'bg-gray-100 text-gray-700'}">
                                ${statusLabels[ag.status] || ag.status}
                            </span>
                        </div>
                        ${ag.status === 'confirmado' ? `
                            <div class="flex gap-2 mt-2">
                                <button onclick="window.cancelarAgendamentoAdmin('${ag.id}')" 
                                        class="text-xs text-red-500 hover:text-red-700 transition">
                                    <i class="fas fa-times mr-1"></i> Cancelar
                                </button>
                                <button onclick="window.concluirAgendamento('${ag.id}')" 
                                        class="text-xs text-green-500 hover:text-green-700 transition">
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
            <div class="text-center text-red-500 py-12">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar agendamentos. Tente novamente.
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
                
                successModal({
                    title: 'Agendamento Cancelado!',
                    message: 'O agendamento foi cancelado com sucesso.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.aplicarFiltros();
                    }
                });
            } catch (error) {
                console.error('Erro ao cancelar:', error);
                errorModal({
                    title: 'Erro ao Cancelar',
                    message: error.message || 'Ocorreu um erro ao cancelar o agendamento.',
                    confirmText: 'OK'
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
                
                successModal({
                    title: 'Agendamento Concluído!',
                    message: 'O agendamento foi marcado como concluído.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.aplicarFiltros();
                    }
                });
            } catch (error) {
                console.error('Erro ao concluir:', error);
                errorModal({
                    title: 'Erro ao Concluir',
                    message: error.message || 'Ocorreu um erro ao concluir o agendamento.',
                    confirmText: 'OK'
                });
            }
        }
    });
};

// ============================================
// FUNÇÃO: Exportar para PDF (CORRIGIDA)
// ============================================
window.exportarPDF = async function() {
    const data = document.getElementById('filtroData')?.value || '';
    const centroId = document.getElementById('filtroCentro')?.value || '';
    
    if (!data) {
        infoModal({
            title: 'Selecione uma Data',
            message: 'Por favor, selecione uma data para exportar.',
            confirmText: 'OK'
        });
        return;
    }
    
    try {
        // Buscar agendamentos
        let query = supabase
            .from('agendamentos')
            .select(`
                *,
                usuarios (nome, telefone, cpf),
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
                confirmText: 'OK'
            });
            return;
        }
        
        // Verificar se as bibliotecas estão carregadas
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            // Tentar carregar via CDN novamente
            await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
            
            // Aguardar um pouco para garantir o carregamento
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
        
        // Título
        doc.setFontSize(18);
        doc.setTextColor('#F4742B');
        doc.text('CrossFit - Agendamentos', 14, 20);
        
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
        
        // Preparar dados para a tabela
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
        
        // Usar autoTable (disponível globalmente)
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
            // Fallback: tabela manual se autoTable não estiver disponível
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
        
        // Rodapé
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

// Função auxiliar para carregar scripts
function carregarScript(src) {
    return new Promise((resolve, reject) => {
        // Verificar se o script já existe
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
    // Aplicar filtros ao pressionar Enter
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
    
    // Carregar automaticamente ao mudar a data
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'filtroData') {
            if (typeof window.aplicarFiltros === 'function') {
                window.aplicarFiltros();
            }
        }
    });
}