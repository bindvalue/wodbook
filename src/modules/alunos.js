// ============================================
// ARQUIVO: modules/alunos.js
// GERENCICIAMENTO DE ALUNOS (ADMIN)
// ============================================

import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal } from './shared.js';
import { loadPage } from './router.js';

// ============================================
// VARIÁVEIS GLOBAIS PARA ARMAZENAR DADOS DO FORMULÁRIO
// ============================================
let _formularioData = null;
let _alunoData = null;

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
// FUNÇÃO: Buscar Formulário do Aluno
// ============================================
async function buscarFormularioAluno(alunoId) {
    try {
        const { data, error } = await supabase
            .from('formulario_consentimento')
            .select('*')
            .eq('usuario_id', alunoId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao buscar formulário:', error);
        return null;
    }
}

// ============================================
// FUNÇÃO: Visualizar Formulário do Aluno (Modal)
// ============================================
// ============================================
// FUNÇÃO: Visualizar Formulário do Aluno (Modal)
// ============================================
window.visualizarFormularioAluno = async function(alunoId) {
    try {
        // Buscar dados do aluno
        const { data: aluno, error: alunoError } = await supabase
            .from('usuarios')
            .select('nome, email, telefone')
            .eq('id', alunoId)
            .single();
        
        if (alunoError) throw alunoError;
        
        // Buscar formulário do aluno
        const formulario = await buscarFormularioAluno(alunoId);
        
        if (!formulario) {
            infoModal({
                title: 'Formulário não encontrado',
                message: `O aluno ${aluno?.nome || 'não identificado'} ainda não preencheu o Questionário de Prontidão.`,
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        // Armazenar dados para impressão
        _formularioData = formulario;
        _alunoData = aluno;
        
        // Criar modal
        const modalExistente = document.getElementById('modalFormularioAluno');
        if (modalExistente) modalExistente.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'modalFormularioAluno';
        overlay.className = 'modal-overlay active';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '20px';
        overlay.style.zIndex = '9999';
        
        // Mapear respostas
        const respostasMap = {
            problema_cardiaco: formulario.problema_cardiaco ? '✅ SIM' : '❌ NÃO',
            dor_torax_atividade: formulario.dor_torax_atividade ? '✅ SIM' : '❌ NÃO',
            dor_torax_repouso: formulario.dor_torax_repouso ? '✅ SIM' : '❌ NÃO',
            perda_equilibrio: formulario.perda_equilibrio ? '✅ SIM' : '❌ NÃO',
            problema_osseo_articular: formulario.problema_osseo_articular ? '✅ SIM' : '❌ NÃO',
            medicamento_pressao: formulario.medicamento_pressao ? '✅ SIM' : '❌ NÃO',
            outra_razao_impeditiva: formulario.outra_razao_impeditiva ? '✅ SIM' : '❌ NÃO'
        };
        
        const statusMap = {
            'aprovado': '✅ Aprovado',
            'rejeitado': '⚠️ Rejeitado - Requer avaliação',
            'pendente': '⏳ Pendente'
        };
        
        const statusColor = {
            'aprovado': 'text-green-600 bg-green-50',
            'rejeitado': 'text-red-600 bg-red-50',
            'pendente': 'text-yellow-600 bg-yellow-50'
        };
        
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 560px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; position: relative; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden;">
                <!-- HEADER - Fixo -->
                <div style="flex-shrink: 0; padding: 28px 28px 0 28px;">
                    <div class="flex items-center justify-between mb-5">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-file-signature text-[#F4742B] text-sm"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-[#4B4B4D] truncate">Questionário de Prontidão</h3>
                                <p class="text-xs text-gray-400 truncate">${aluno?.nome || 'Aluno não identificado'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <button onclick="window.imprimirFormularioAluno()" 
                                    class="w-8 h-8 rounded-full hover:bg-gray-100 transition flex items-center justify-center" 
                                    title="Imprimir formulário">
                                <i class="fas fa-print text-gray-400 hover:text-[#F4742B]"></i>
                            </button>
                            <button onclick="window.fecharModalFormularioAluno()" 
                                    class="w-8 h-8 rounded-full hover:bg-gray-100 transition flex items-center justify-center">
                                <i class="fas fa-times text-gray-400"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- BODY - Scrollável -->
                <div id="formularioPrintContent" style="flex: 1; overflow-y: auto; padding: 0 28px 20px 28px; scroll-behavior: smooth;">
                    <!-- Scrollbar personalizada -->
                    <style>
                        #formularioPrintContent::-webkit-scrollbar {
                            width: 4px;
                        }
                        #formularioPrintContent::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        #formularioPrintContent::-webkit-scrollbar-thumb {
                            background: #D1D5DB;
                            border-radius: 10px;
                        }
                        #formularioPrintContent::-webkit-scrollbar-thumb:hover {
                            background: #9CA3AF;
                        }
                    </style>
                    
                    <!-- Status -->
                    <div class="flex items-center gap-3 p-3 rounded-xl ${statusColor[formulario.status] || 'bg-gray-50'}">
                        <span class="text-sm font-medium">Status:</span>
                        <span class="text-sm font-semibold">${statusMap[formulario.status] || formulario.status}</span>
                        <span class="text-xs text-gray-400 ml-auto">${new Date(formulario.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <!-- Dados Pessoais -->
                    <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-4">
                        <h4 class="text-xs font-semibold text-[#4B4B4D] uppercase tracking-wider mb-2">📋 Dados Pessoais</h4>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span class="text-gray-400">Nome:</span>
                                <p class="font-medium text-gray-800">${formulario.nome_completo}</p>
                            </div>
                            <div>
                                <span class="text-gray-400">Idade:</span>
                                <p class="font-medium text-gray-800">${formulario.idade} anos</p>
                            </div>
                            <div class="col-span-2">
                                <span class="text-gray-400">Telefone:</span>
                                <p class="font-medium text-gray-800">${formulario.telefone}</p>
                            </div>
                            <div class="col-span-2">
                                <span class="text-gray-400">Email:</span>
                                <p class="font-medium text-gray-800">${aluno?.email || 'N/E'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Respostas -->
                    <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-4">
                        <h4 class="text-xs font-semibold text-[#4B4B4D] uppercase tracking-wider mb-2">📋 Respostas</h4>
                        <div class="space-y-1.5 text-sm">
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Problema cardíaco</span>
                                <span class="font-medium ${respostasMap.problema_cardiaco.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.problema_cardiaco}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Dor no tórax (atividade)</span>
                                <span class="font-medium ${respostasMap.dor_torax_atividade.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.dor_torax_atividade}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Dor no tórax (repouso)</span>
                                <span class="font-medium ${respostasMap.dor_torax_repouso.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.dor_torax_repouso}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Perda de equilíbrio</span>
                                <span class="font-medium ${respostasMap.perda_equilibrio.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.perda_equilibrio}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Problema ósseo/articular</span>
                                <span class="font-medium ${respostasMap.problema_osseo_articular.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.problema_osseo_articular}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Medicamento pressão</span>
                                <span class="font-medium ${respostasMap.medicamento_pressao.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.medicamento_pressao}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                <span class="text-gray-600">Outra razão impeditiva</span>
                                <span class="font-medium ${respostasMap.outra_razao_impeditiva.includes('SIM') ? 'text-red-500' : 'text-green-500'}">${respostasMap.outra_razao_impeditiva}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Termo aceito -->
                    <div class="flex items-center gap-2 text-sm text-gray-500 mt-4">
                        <i class="fas ${formulario.termo_aceito ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}"></i>
                        <span>Termo de Responsabilidade ${formulario.termo_aceito ? 'aceito' : 'não aceito'}</span>
                    </div>
                    
                    <!-- Data de preenchimento -->
                    <div class="text-xs text-gray-400 text-right mt-2">
                        Preenchido em: ${new Date(formulario.created_at).toLocaleString('pt-BR')}
                    </div>
                </div>
                
                <!-- FOOTER - Fixo -->
                <div style="flex-shrink: 0; padding: 16px 28px 28px 28px; border-top: 1px solid #F3F4F6; background: white;">
                    <div class="flex justify-end gap-2 flex-wrap">
                        ${formulario.status === 'rejeitado' ? `
                            <button onclick="window.atualizarStatusFormulario('${alunoId}', 'aprovado')" 
                                    class="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition active:scale-[0.98]">
                                <i class="fas fa-check mr-1"></i> Aprovar
                            </button>
                        ` : ''}
                        ${formulario.status === 'aprovado' ? `
                            <button onclick="window.atualizarStatusFormulario('${alunoId}', 'rejeitado')" 
                                    class="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition active:scale-[0.98]">
                                <i class="fas fa-times mr-1"></i> Rejeitar
                            </button>
                        ` : ''}
                        <button onclick="window.imprimirFormularioAluno()" 
                                class="px-4 py-2 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center gap-2">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                        <button onclick="window.fecharModalFormularioAluno()" 
                                class="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-300 transition active:scale-[0.98]">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', function(e) {
            if (e.target === this) window.fecharModalFormularioAluno();
        });
        
        const handleEsc = function(e) {
            if (e.key === 'Escape') {
                window.fecharModalFormularioAluno();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
    } catch (error) {
        console.error('❌ Erro ao carregar formulário:', error);
        errorModal({
            title: 'Erro ao Carregar',
            message: 'Não foi possível carregar o formulário do aluno.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Imprimir Formulário do Aluno
// ============================================
// ============================================
// FUNÇÃO: Imprimir Formulário do Aluno
// ============================================
window.imprimirFormularioAluno = function() {
    try {
        const formulario = _formularioData;
        const aluno = _alunoData;
        
        if (!formulario) {
            alert('Dados do formulário não encontrados. Por favor, recarregue o modal.');
            return;
        }
        
        // Mapear respostas
        const respostasMap = {
            problema_cardiaco: formulario.problema_cardiaco ? '✅ SIM' : '❌ NÃO',
            dor_torax_atividade: formulario.dor_torax_atividade ? '✅ SIM' : '❌ NÃO',
            dor_torax_repouso: formulario.dor_torax_repouso ? '✅ SIM' : '❌ NÃO',
            perda_equilibrio: formulario.perda_equilibrio ? '✅ SIM' : '❌ NÃO',
            problema_osseo_articular: formulario.problema_osseo_articular ? '✅ SIM' : '❌ NÃO',
            medicamento_pressao: formulario.medicamento_pressao ? '✅ SIM' : '❌ NÃO',
            outra_razao_impeditiva: formulario.outra_razao_impeditiva ? '✅ SIM' : '❌ NÃO'
        };
        
        const statusMap = {
            'aprovado': '✅ Aprovado',
            'rejeitado': '⚠️ Rejeitado - Requer avaliação',
            'pendente': '⏳ Pendente'
        };
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Por favor, permita pop-ups para imprimir o formulário.');
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Questionário de Prontidão - ${formulario.nome_completo || 'Aluno'}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        padding: 30px;
                        background: white;
                        color: #1F2937;
                        line-height: 1.5;
                        font-size: 12px;
                    }
                    .print-container { max-width: 700px; margin: 0 auto; }
                    
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #F4742B;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .header h1 { font-size: 20px; color: #F4742B; font-weight: 700; }
                    .header p { color: #6B7280; font-size: 12px; margin-top: 2px; }
                    
                    .section {
                        margin-bottom: 16px;
                        border: 1px solid #E5E7EB;
                        border-radius: 6px;
                        padding: 12px 14px;
                        page-break-inside: avoid;
                    }
                    .section-title {
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #F4742B;
                        margin-bottom: 8px;
                        padding-bottom: 6px;
                        border-bottom: 2px solid #FEF3E8;
                    }
                    
                    .status-badge {
                        display: inline-block;
                        padding: 3px 10px;
                        border-radius: 16px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    .status-aprovado { background: #D1FAE5; color: #065F46; }
                    .status-rejeitado { background: #FEE2E2; color: #991B1B; }
                    .status-pendente { background: #FEF3C7; color: #92400E; }
                    
                    /* 🔥 NOVO - Layout compacto em linha */
                    .info-row {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: baseline;
                        gap: 4px 16px;
                        padding: 2px 0;
                    }
                    .info-row .label {
                        font-size: 11px;
                        color: #6B7280;
                        font-weight: 500;
                        min-width: 70px;
                    }
                    .info-row .value {
                        font-size: 13px;
                        font-weight: 500;
                        color: #1F2937;
                    }
                    .info-row .value-full {
                        font-size: 13px;
                        font-weight: 500;
                        color: #1F2937;
                        flex: 1;
                    }
                    
                    /* Grid compacto para respostas */
                    .answer-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2px 20px;
                    }
                    .answer-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 3px 0;
                        border-bottom: 1px solid #F3F4F6;
                    }
                    .answer-item .label { font-size: 11px; color: #4B4B4D; }
                    .answer-item .value { font-size: 12px; font-weight: 600; }
                    .answer-sim { color: #DC2626; }
                    .answer-nao { color: #16A34A; }
                    
                    .termo-status {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                    }
                    .termo-aceito { color: #16A34A; }
                    .termo-nao-aceito { color: #DC2626; }
                    
                    .footer {
                        text-align: center;
                        font-size: 10px;
                        color: #9CA3AF;
                        margin-top: 20px;
                        padding-top: 12px;
                        border-top: 1px solid #E5E7EB;
                    }
                    
                    .whatsapp-link {
                        text-align: center;
                        margin-top: 8px;
                        padding: 6px;
                        background: #F0FDF4;
                        border-radius: 6px;
                        border: 1px solid #D1FAE5;
                    }
                    .whatsapp-link a {
                        color: #16A34A;
                        text-decoration: none;
                        font-weight: 500;
                        font-size: 12px;
                    }
                    
                    .status-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 4px;
                    }
                    
                    @media print {
                        body { padding: 15px; }
                        .section { border-color: #E5E7EB !important; }
                        .no-print { display: none !important; }
                    }
                    @media (max-width: 500px) {
                        body { padding: 12px; }
                        .answer-grid { grid-template-columns: 1fr; }
                        .info-row { flex-direction: column; gap: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <!-- Header -->
                    <div class="header">
                        <h1>📋 Questionário de Prontidão</h1>
                        <p>WODBOOK - Avaliação de Saúde para Prática de Atividades Físicas</p>
                    </div>
                    
                    <!-- Status -->
                    <div class="section">
                        <div class="section-title">Status da Avaliação</div>
                        <div class="status-row">
                            <span class="status-badge ${formulario.status === 'aprovado' ? 'status-aprovado' : formulario.status === 'rejeitado' ? 'status-rejeitado' : 'status-pendente'}">
                                ${statusMap[formulario.status] || formulario.status}
                            </span>
                            <span style="font-size: 11px; color: #6B7280;">
                                Preenchido em: ${new Date(formulario.created_at).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Dados Pessoais - Layout compacto em linha -->
                    <div class="section">
                        <div class="section-title">📋 Dados Pessoais</div>
                        <div class="info-row">
                            <span class="label">Nome:</span>
                            <span class="value-full">${formulario.nome_completo}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Idade:</span>
                            <span class="value">${formulario.idade} anos</span>
                            <span class="label" style="margin-left: 8px;">Telefone:</span>
                            <span class="value">${formulario.telefone}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <span class="value-full">${aluno?.email || 'N/E'}</span>
                        </div>
                    </div>
                    
                    <!-- Respostas - Grid 2 colunas -->
                    <div class="section">
                        <div class="section-title">📋 Respostas do Questionário</div>
                        <div class="answer-grid">
                            ${Object.entries(respostasMap).map(([key, value]) => {
                                const labels = {
                                    problema_cardiaco: 'Problema cardíaco',
                                    dor_torax_atividade: 'Dor tórax (atividade)',
                                    dor_torax_repouso: 'Dor tórax (repouso)',
                                    perda_equilibrio: 'Perda de equilíbrio',
                                    problema_osseo_articular: 'Problema ósseo/articular',
                                    medicamento_pressao: 'Medicamento p/ pressão',
                                    outra_razao_impeditiva: 'Outra razão impeditiva'
                                };
                                const isSim = value.includes('SIM');
                                return `
                                    <div class="answer-item">
                                        <span class="label">${labels[key] || key}</span>
                                        <span class="value ${isSim ? 'answer-sim' : 'answer-nao'}">${value}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Termo -->
                    <div class="section">
                        <div class="section-title">📋 Termo de Responsabilidade</div>
                        <div class="termo-status ${formulario.termo_aceito ? 'termo-aceito' : 'termo-nao-aceito'}">
                            <i class="fas ${formulario.termo_aceito ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            Termo de Responsabilidade ${formulario.termo_aceito ? 'aceito' : 'não aceito'}
                        </div>
                    </div>
                    
                    <!-- WhatsApp -->
                    ${formulario.telefone ? `
                        <div class="whatsapp-link">
                            <i class="fab fa-whatsapp" style="color: #16A34A;"></i>
                            <a href="https://wa.me/55${formulario.telefone.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(formulario.nome_completo || 'Aluno')}!%20Sou%20da%20WODBOOK." target="_blank">
                                Entrar em contato via WhatsApp
                            </a>
                        </div>
                    ` : ''}
                    
                    <div class="footer">
                        <p>Documento gerado automaticamente pelo WODBOOK em ${new Date().toLocaleString('pt-BR')}</p>
                        <p style="margin-top: 2px; color: #D1D5DB; font-size: 9px;">Este documento é de uso interno e deve ser mantido em sigilo.</p>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 16px; padding: 10px; background: #FEF3E8; border-radius: 6px; border: 1px solid #FED7AA;">
                    <p style="font-size: 12px; color: #92400E;">
                        <i class="fas fa-info-circle"></i> 
                        Para imprimir, utilize o comando <strong>Ctrl+P</strong> ou <strong>Cmd+P</strong>
                    </p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        };
        
    } catch (error) {
        console.error('❌ Erro ao imprimir formulário:', error);
        alert('Erro ao imprimir o formulário: ' + error.message);
    }
};

// ============================================
// FUNÇÃO: Atualizar Status do Formulário
// ============================================
window.atualizarStatusFormulario = async function(alunoId, novoStatus) {
    const acao = novoStatus === 'aprovado' ? 'aprovar' : 'rejeitar';
    const acaoTexto = novoStatus === 'aprovado' ? 'Aprovar' : 'Rejeitar';
    
    confirmModal({
        title: `${acaoTexto} Formulário`,
        message: `Tem certeza que deseja ${acao} este formulário?`,
        confirmText: acaoTexto,
        cancelText: 'Cancelar',
        confirmColor: novoStatus === 'aprovado' ? '#10B981' : '#EF4444',
        onConfirm: async () => {
            try {
                window.closeModal();
                
                const { data: formulario, error: buscaError } = await supabase
                    .from('formulario_consentimento')
                    .select('id')
                    .eq('usuario_id', alunoId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (buscaError) throw buscaError;
                
                const { error } = await supabase
                    .from('formulario_consentimento')
                    .update({ status: novoStatus })
                    .eq('id', formulario.id);
                
                if (error) throw error;
                
                successModal({
                    title: `Formulário ${novoStatus === 'aprovado' ? 'Aprovado' : 'Rejeitado'}!`,
                    message: `O formulário foi ${novoStatus === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso.`,
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                        window.fecharModalFormularioAluno();
                        setTimeout(() => window.aplicarFiltrosAlunos(), 300);
                    }
                });
                
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
                window.closeModal();
                errorModal({
                    title: 'Erro ao Atualizar',
                    message: error.message || 'Ocorreu um erro ao atualizar o status do formulário.',
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
// FUNÇÃO: Fechar Modal de Formulário
// ============================================
window.fecharModalFormularioAluno = function() {
    const modal = document.getElementById('modalFormularioAluno');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            _formularioData = null;
            _alunoData = null;
        }, 300);
    }
};

// ============================================
// FUNÇÃO: Abrir Formulário do Aluno (Wrapper)
// ============================================
window.abrirFormularioAluno = function(alunoId) {
    window.visualizarFormularioAluno(alunoId);
};

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
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Ativos</p>
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
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Agendamentos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalAgendamentos">0</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <i class="fas fa-calendar-check text-purple-500 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                
                <div>
                    <select id="filtroFormulario" 
                            class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                        <option value="">Status Formulário</option>
                        <option value="aprovado">✅ Aprovado</option>
                        <option value="rejeitado">⚠️ Rejeitado</option>
                        <option value="pendente">⏳ Pendente</option>
                        <option value="nao_preenchido">❌ Não preenchido</option>
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
                    <button onclick="window.exportarFormulariosCSV()" 
                            class="h-10 px-4 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-file-csv text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Alunos -->
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
    const filtroFormulario = document.getElementById('filtroFormulario')?.value || '';
    
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
            .from('usuarios')
            .select('*')
            .order('nome', { ascending: true });
        
        const { data: usuarios, error } = await query;
        if (error) throw error;
        
        // Buscar contagem de agendamentos por usuário
        const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select('usuario_id, status');
        
        if (agendamentosError) {
            console.warn('⚠️ Erro ao buscar agendamentos:', agendamentosError);
        }
        
        // Contar agendamentos por usuário
        const contagemAgendamentos = {};
        agendamentos?.forEach(ag => {
            if (!contagemAgendamentos[ag.usuario_id]) {
                contagemAgendamentos[ag.usuario_id] = 0;
            }
            contagemAgendamentos[ag.usuario_id]++;
        });
        
        // Buscar formulários de consentimento
        const { data: formularios, error: formulariosError } = await supabase
            .from('formulario_consentimento')
            .select('usuario_id, status, created_at');
        
        if (formulariosError) {
            console.warn('⚠️ Erro ao buscar formulários:', formulariosError);
        }
        
        // Mapear formulários por usuário (pegar o mais recente)
        const formulariosMap = {};
        formularios?.forEach(f => {
            if (!formulariosMap[f.usuario_id] || f.created_at > formulariosMap[f.usuario_id].created_at) {
                formulariosMap[f.usuario_id] = f;
            }
        });
        
        const usuariosComDados = usuarios?.map(u => ({
            ...u,
            authProvider: u.email?.includes('@gmail.com') ? 'google' : 'email',
            totalAgendamentos: contagemAgendamentos[u.id] || 0,
            temAgendamentos: (contagemAgendamentos[u.id] || 0) > 0,
            formulario: formulariosMap[u.id] || null,
            temFormulario: !!formulariosMap[u.id],
            formularioStatus: formulariosMap[u.id]?.status || 'nao_preenchido',
            usaPlataforma: u.usa_plataforma === true,
            nomePlataforma: u.nome_plataforma || ''
        })) || [];
        
        let filtered = usuariosComDados;
        
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
        
        if (filtroFormulario) {
            filtered = filtered.filter(u => u.formularioStatus === filtroFormulario);
        }
        
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
            const temFormulario = aluno.temFormulario;
            
            // Status do formulário
            let formularioStatus = 'Não preenchido';
            let formularioColor = 'bg-gray-100 text-gray-500';
            
            if (temFormulario) {
                if (aluno.formulario.status === 'aprovado') {
                    formularioStatus = '✅ Aprovado';
                    formularioColor = 'bg-green-50 text-green-600';
                } else if (aluno.formulario.status === 'rejeitado') {
                    formularioStatus = '⚠️ Rejeitado';
                    formularioColor = 'bg-red-50 text-red-600';
                } else {
                    formularioStatus = '⏳ Pendente';
                    formularioColor = 'bg-yellow-50 text-yellow-600';
                }
            }
            
            html += `
                <div class="px-4 py-4 hover:bg-gray-50/50 transition duration-150">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <!-- Avatar e Nome -->
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
                                    
                                    <!-- 🔥 NOVO: Badge da Plataforma Pass -->
                                    ${aluno.usaPlataforma ? `
                                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3E8] text-[#F4742B] border border-[#FED7AA]" title="Utiliza plataforma ${aluno.nomePlataforma || 'Pass'}">
                                            <i class="fas fa-id-card text-[9px]"></i>
                                            ${aluno.nomePlataforma || 'Pass'}
                                        </span>
                                    ` : `
                                        <span class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400" title="Não utiliza plataforma Pass">
                                            <i class="fas fa-user text-[9px]"></i>
                                            Sem Pass
                                        </span>
                                    `}
                                    
                                    ${temAgendamentos ? `
                                        <span class="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                            ${aluno.totalAgendamentos} agendamentos
                                        </span>
                                    ` : ''}
                                    <span class="text-xs px-2 py-0.5 rounded-full ${formularioColor}">
                                        ${formularioStatus}
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
                            ${temAgendamentos ? `
                                <button onclick="window.verAgendamentosAluno('${aluno.id}')" 
                                        class="px-3 py-1.5 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition flex items-center gap-1">
                                    <i class="fas fa-calendar-check"></i>
                                    Ver agendamentos
                                </button>
                            ` : `
                                <span class="px-3 py-1.5 text-xs bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed flex items-center gap-1">
                                    <i class="fas fa-calendar-check"></i>
                                    Sem agendamentos
                                </span>
                            `}
                            
                            <!-- 🔥 BOTÃO VISUALIZAR FORMULÁRIO -->
                            <button onclick="window.abrirFormularioAluno('${aluno.id}')" 
                                    class="px-3 py-1.5 text-xs ${temFormulario ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-400'} rounded-lg transition flex items-center gap-1">
                                <i class="fas ${temFormulario ? 'fa-file-signature' : 'fa-file'}"></i>
                                ${temFormulario ? 'Ver formulário' : 'Sem formulário'}
                            </button>
                            
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
// FUNÇÃO: Ver Agendamentos do Aluno (Modal)
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
            const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
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
                <button onclick="window.fecharModalAgendamentosAluno()" 
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
                <button onclick="window.fecharModalAgendamentosAluno()" 
                        class="px-5 py-2 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98]">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === this) window.fecharModalAgendamentosAluno();
    });
    
    const handleEsc = function(e) {
        if (e.key === 'Escape') {
            window.fecharModalAgendamentosAluno();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// ============================================
// FUNÇÃO: Fechar Modal de Agendamentos
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
                        window.fecharModalAgendamentosAluno();
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
// FUNÇÃO: Exportar Formulários para CSV
// ============================================
window.exportarFormulariosCSV = async function() {
    try {
        const { data: formularios, error } = await supabase
            .from('formulario_consentimento')
            .select(`
                *,
                usuarios (nome, email)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!formularios || formularios.length === 0) {
            infoModal({
                title: 'Nenhum Formulário',
                message: 'Não há formulários para exportar.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        const headers = [
            'Nome Completo',
            'Idade',
            'Telefone',
            'Problema Cardíaco',
            'Dor Tórax (Atividade)',
            'Dor Tórax (Repouso)',
            'Perda de Equilíbrio',
            'Problema Ósseo/Articular',
            'Medicamento Pressão',
            'Outra Razão Impeditiva',
            'Status',
            'Termo Aceito',
            'Data do Preenchimento'
        ];
        
        const rows = formularios.map(f => [
            f.nome_completo || 'N/I',
            f.idade || 'N/I',
            f.telefone || 'N/I',
            f.problema_cardiaco ? 'SIM' : 'NÃO',
            f.dor_torax_atividade ? 'SIM' : 'NÃO',
            f.dor_torax_repouso ? 'SIM' : 'NÃO',
            f.perda_equilibrio ? 'SIM' : 'NÃO',
            f.problema_osseo_articular ? 'SIM' : 'NÃO',
            f.medicamento_pressao ? 'SIM' : 'NÃO',
            f.outra_razao_impeditiva ? 'SIM' : 'NÃO',
            f.status || 'N/I',
            f.termo_aceito ? 'ACEITO' : 'NÃO ACEITO',
            f.created_at ? new Date(f.created_at).toLocaleString('pt-BR') : 'N/I'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `formularios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        
        successModal({
            title: 'CSV Exportado!',
            message: `Arquivo gerado com ${formularios.length} formulários.`,
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        errorModal({
            title: 'Erro ao Exportar',
            message: error.message || 'Ocorreu um erro ao gerar o CSV.',
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
                target.id === 'filtroAuth' ||
                target.id === 'filtroFormulario')) {
                window.aplicarFiltrosAlunos();
            }
        }
    });
}