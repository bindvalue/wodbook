import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal, warningModal } from './shared.js';
import { loadPage } from './router.js';

// ============================================
// FUNÇÃO: Buscar Configurações
// ============================================
async function buscarConfiguracoes() {
    try {
        const { data, error } = await supabase
            .from('configuracoes')
            .select('*');
        
        if (error) throw error;
        
        const configs = {};
        data?.forEach(item => {
            configs[item.chave] = item.valor;
        });
        
        return configs;
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return {};
    }
}

// ============================================
// FUNÇÃO: Salvar Configuração
// ============================================
async function salvarConfiguracao(chave, valor) {
    try {
        const { error } = await supabase
            .from('configuracoes')
            .upsert({
                chave: chave,
                valor: String(valor),
                updated_at: new Date().toISOString()
            }, { onConflict: 'chave' });
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`Erro ao salvar ${chave}:`, error);
        return false;
    }
}

// ============================================
// FUNÇÃO: Carregar Conteúdo de Configurações
// ============================================
export async function loadConfiguracoesContent() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    // Buscar perfil do usuário
    const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();
    
    // 🔥 VERIFICAR SE É ADMIN
    const isAdmin = profile?.role === 'admin';
    
    // Buscar configurações do banco (apenas se for admin)
    const configs = isAdmin ? await buscarConfiguracoes() : {};
    
    // Buscar centros (apenas se for admin)
    const { data: centros } = isAdmin ? await supabase
        .from('centros')
        .select('id, nome, horario_funcionamento, vagas_padrao')
        .order('nome', { ascending: true }) : { data: [] };
    
    // ============================================
    // MONTAR HTML - COM PERMISSÕES
    // ============================================
    
    let html = `
        <!-- Cabeçalho -->
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-[#4B4B4D] flex items-center gap-2">
                <i class="fas fa-cog text-[#F4742B]"></i>
                Configurações
            </h2>
            <p class="text-gray-500 text-sm">Gerencie as configurações do sistema</p>
            ${!isAdmin ? `
                <div class="mt-2 text-xs text-gray-400 flex items-center gap-2">
                    <i class="fas fa-info-circle"></i>
                    Você está visualizando as configurações do seu perfil.
                </div>
            ` : ''}
        </div>
        
        <!-- Grid de Configurações -->
        <div class="grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-6">
            
            <!-- ==========================================
            PERFIL - VISÍVEL PARA TODOS
            ========================================== -->
            <div class="bg-white rounded-2xl shadow-sm p-6 card-hover ${!isAdmin ? 'max-w-md mx-auto' : ''}">
                <h3 class="text-lg font-bold text-[#4B4B4D] flex items-center gap-2 mb-4">
                    <i class="fas fa-user-circle text-[#F4742B]"></i>
                    Meu Perfil
                </h3>
                
                <div class="flex items-center gap-4 mb-4">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nome || 'Usuário')}&background=F4742B&color=fff&size=80" 
                         alt="Avatar" class="w-20 h-20 rounded-full border-2 border-[#F4742B]">
                    <div>
                        <p class="font-semibold text-gray-800">${profile?.nome || 'Usuário'}</p>
                        <p class="text-sm text-gray-500">${user.email}</p>
                        <span class="text-xs px-2 py-0.5 rounded-full ${isAdmin ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
                            ${isAdmin ? 'Administrador' : 'Usuário'}
                        </span>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <input type="text" id="configNome" value="${profile?.nome || ''}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value="${user.email}" disabled
                               class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed">
                    </div>
                    <button onclick="window.salvarPerfil()" 
                            class="w-full py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition flex items-center justify-center gap-2">
                        <i class="fas fa-save"></i> Salvar Perfil
                    </button>
                    <button onclick="window.alterarSenha()" 
                            class="w-full py-2 border-2 border-[#F4742B] text-[#F4742B] rounded-lg hover:bg-[#F4742B] hover:text-white transition flex items-center justify-center gap-2">
                        <i class="fas fa-key"></i> Alterar Senha
                    </button>
                </div>
            </div>
    `;
    
    // ==========================================
    // ADMIN: CONFIGURAÇÕES ADICIONAIS
    // ==========================================
    if (isAdmin) {
        html += `
            <!-- Configurações do Sistema -->
            <div class="bg-white rounded-2xl shadow-sm p-6 card-hover">
                <h3 class="text-lg font-bold text-[#4B4B4D] flex items-center gap-2 mb-4">
                    <i class="fas fa-sliders-h text-[#F4742B]"></i>
                    Configurações do Sistema
                </h3>
                
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-building text-[#F4742B] mr-1"></i> Nome da Academia
                        </label>
                        <input type="text" id="configNomeAcademia" 
                               value="${configs?.nome_academia || 'WODBOOK'}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                        <p class="text-xs text-gray-400 mt-1">Nome que aparecerá no cabeçalho do sistema</p>
                    </div>
                    
                    <button onclick="window.salvarConfiguracoes()" 
                            class="w-full py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition flex items-center justify-center gap-2">
                        <i class="fas fa-save"></i> Salvar Configurações
                    </button>
                </div>
            </div>
            
            <!-- Horários e Vagas das Unidades -->
            <div class="bg-white rounded-2xl shadow-sm p-6 card-hover lg:col-span-2">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-[#4B4B4D] flex items-center gap-2">
                            <i class="fas fa-clock text-[#F4742B]"></i>
                            Horários e Vagas por Unidade
                        </h3>
                        <p class="text-sm text-gray-500">Configure os horários e vagas específicos para cada unidade</p>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ${centros?.length || 0} unidades
                    </span>
                </div>
                
                <div class="space-y-3">
                    ${centros?.map(centro => {
                        const horarioInicio = centro.horario_funcionamento?.split(' - ')[0] || '06:00';
                        const horarioFim = centro.horario_funcionamento?.split(' - ')[1] || '22:00';
                        const vagas = centro.vagas_padrao || 10;
                        
                        return `
                            <div class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-100">
                                <div class="flex items-center justify-between mb-3">
                                    <div>
                                        <p class="font-semibold text-gray-800">${centro.nome}</p>
                                        <p class="text-xs text-gray-400">ID: ${centro.id.substring(0, 8)}</p>
                                    </div>
                                    <span class="text-xs px-2 py-0.5 rounded-full bg-[#FEF3E8] text-[#F4742B]">
                                        <i class="fas fa-users mr-1"></i> ${vagas} vagas
                                    </span>
                                </div>
                                
                                <div class="flex flex-wrap items-center gap-3">
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs text-gray-500">Início:</span>
                                        <input type="time" id="horario_${centro.id}_inicio" 
                                               value="${horarioInicio}"
                                               class="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition text-sm">
                                    </div>
                                    
                                    <span class="text-gray-400">às</span>
                                    
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs text-gray-500">Fim:</span>
                                        <input type="time" id="horario_${centro.id}_fim" 
                                               value="${horarioFim}"
                                               class="w-28 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition text-sm">
                                    </div>
                                    
                                    <span class="text-gray-300">|</span>
                                    
                                    <div class="flex items-center gap-1">
                                        <span class="text-xs text-gray-500">
                                            <i class="fas fa-users"></i> Vagas:
                                        </span>
                                        <input type="number" id="vagas_${centro.id}" 
                                               value="${vagas}" 
                                               min="1" max="50"
                                               class="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition text-sm text-center">
                                    </div>
                                    
                                    <button onclick="window.salvarConfigUnidade('${centro.id}')" 
                                            class="px-4 py-1.5 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition text-sm flex items-center gap-1.5 ml-auto">
                                        <i class="fas fa-save text-xs"></i> Salvar
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('') || '<p class="text-gray-500 text-sm">Nenhuma unidade cadastrada.</p>'}
                </div>
            </div>
            
            <!-- Notificações -->
            <div class="bg-white rounded-2xl shadow-sm p-6 card-hover">
                <h3 class="text-lg font-bold text-[#4B4B4D] flex items-center gap-2 mb-4">
                    <i class="fas fa-bell text-[#F4742B]"></i>
                    Notificações
                </h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-800">Notificações por Email</p>
                            <p class="text-sm text-gray-500">Receber alertas sobre agendamentos</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="configNotifEmail" ${configs?.notificacoes_email === 'true' ? 'checked' : ''} class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#F4742B] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F4742B]"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-800">Notificações por WhatsApp</p>
                            <p class="text-sm text-gray-500">Receber alertas via WhatsApp</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="configNotifWhatsApp" ${configs?.notificacoes_whatsapp === 'true' ? 'checked' : ''} class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#F4742B] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F4742B]"></div>
                        </label>
                    </div>
                    
                    <button onclick="window.salvarNotificacoes()" 
                            class="w-full py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition flex items-center justify-center gap-2">
                        <i class="fas fa-save"></i> Salvar Preferências
                    </button>
                </div>
            </div>
            
            <!-- Integrações -->
            <div class="bg-white rounded-2xl shadow-sm p-6 card-hover">
                <h3 class="text-lg font-bold text-[#4B4B4D] flex items-center gap-2 mb-4">
                    <i class="fas fa-plug text-[#F4742B]"></i>
                    Integrações
                </h3>
                
                <div class="space-y-4">
                    <div class="p-4 border border-gray-200 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-800 flex items-center gap-2">
                                    <i class="fab fa-whatsapp text-green-500"></i>
                                    WhatsApp (Evolution API)
                                </p>
                                <p class="text-sm text-gray-500">Conecte seu WhatsApp para enviar notificações</p>
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Desconectado</span>
                        </div>
                        <button onclick="window.configurarWhatsApp()" 
                                class="mt-3 w-full py-2 border-2 border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition flex items-center justify-center gap-2">
                            <i class="fas fa-plug"></i> Configurar WhatsApp
                        </button>
                    </div>
                    
                    <div class="p-4 border border-gray-200 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="font-medium text-gray-800 flex items-center gap-2">
                                    <i class="fas fa-robot text-[#F4742B]"></i>
                                    N8N Automation
                                </p>
                                <p class="text-sm text-gray-500">Automatize fluxos de trabalho com N8N</p>
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Desconectado</span>
                        </div>
                        <button onclick="window.configurarN8N()" 
                                class="mt-3 w-full py-2 border-2 border-[#F4742B] text-[#F4742B] rounded-lg hover:bg-[#F4742B] hover:text-white transition flex items-center justify-center gap-2">
                            <i class="fas fa-plug"></i> Configurar N8N
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Ações de Sistema (Admin) -->
            <div class="mt-6 bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
                <div class="flex flex-col sm:flex-row gap-4">
                    <button onclick="window.limparCache()" 
                            class="flex-1 py-3 border-2 border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-white transition flex items-center justify-center gap-2">
                        <i class="fas fa-broom"></i> Limpar Cache
                    </button>
                    <button onclick="window.exportarDados()" 
                            class="flex-1 py-3 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition flex items-center justify-center gap-2">
                        <i class="fas fa-download"></i> Exportar Dados
                    </button>
                    <button onclick="window.sairSistema()" 
                            class="flex-1 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2">
                        <i class="fas fa-sign-out-alt"></i> Sair do Sistema
                    </button>
                </div>
            </div>
        `;
    }
    
    html += `</div>`; // Fecha o grid
    
    return html;
}

// ============================================
// FUNÇÃO: Salvar Configurações da Unidade (Admin)
// ============================================
window.salvarConfigUnidade = async function(centroId) {
    const inicio = document.getElementById(`horario_${centroId}_inicio`)?.value;
    const fim = document.getElementById(`horario_${centroId}_fim`)?.value;
    const vagas = parseInt(document.getElementById(`vagas_${centroId}`)?.value) || 10;
    
    if (!inicio || !fim) {
        warningModal({
            title: 'Campos Obrigatórios',
            message: 'Por favor, preencha os horários de início e fim.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    if (vagas < 1 || vagas > 50) {
        warningModal({
            title: 'Vagas Inválidas',
            message: 'O número de vagas deve ser entre 1 e 50.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    const horarioFuncionamento = `${inicio} - ${fim}`;
    
    try {
        const btn = document.querySelector(`#vagas_${centroId}`)?.closest('.p-4')?.querySelector('button');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Salvando...';
        }
        
        const { error } = await supabase
            .from('centros')
            .update({
                horario_funcionamento: horarioFuncionamento,
                vagas_padrao: vagas
            })
            .eq('id', centroId);
        
        if (error) throw error;
        
        successModal({
            title: 'Configuração Salva!',
            message: `As configurações da unidade foram atualizadas:<br><br>🕐 ${horarioFuncionamento}<br>👥 ${vagas} vagas`,
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
                loadPage('configuracoes');
            }
        });
    } catch (error) {
        console.error('Erro ao salvar configurações da unidade:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar as configurações da unidade.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    } finally {
        const btn = document.querySelector(`#vagas_${centroId}`)?.closest('.p-4')?.querySelector('button');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save text-xs"></i> Salvar';
        }
    }
};

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO (TODOS)
// ============================================

// Salvar Perfil - TODOS
window.salvarPerfil = async function() {
    const nome = document.getElementById('configNome')?.value?.trim();
    if (!nome) {
        warningModal({
            title: 'Campo Obrigatório',
            message: 'Por favor, informe seu nome.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { error } = await supabase
            .from('usuarios')
            .update({ nome })
            .eq('id', user.id);
        
        if (error) throw error;
        
        successModal({
            title: 'Perfil Atualizado!',
            message: 'Seu perfil foi atualizado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
                loadPage('configuracoes');
            }
        });
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar o perfil.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Alterar Senha (Dentro do Sistema)
// ============================================
window.alterarSenha = function() {
    // Criar modal personalizado para alterar senha
    const modalContent = `
        <div style="max-width: 450px; width: 100%;">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-[#FEF3E8] rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-key text-[#F4742B] text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-[#4B4B4D]">Alterar Senha</h3>
                <p class="text-sm text-gray-500 mt-1">Digite sua senha atual e a nova senha</p>
            </div>
            
            <form id="formAlterarSenha" class="space-y-4">
                <!-- Senha Atual -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-lock text-[#F4742B] mr-2"></i>Senha Atual *
                    </label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="senhaAtual" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition pr-10"
                            placeholder="Digite sua senha atual"
                            required
                        >
                        <button 
                            type="button" 
                            onclick="toggleSenhaVisivel('senhaAtual', this)"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F4742B] transition"
                        >
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Nova Senha -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-lock text-[#F4742B] mr-2"></i>Nova Senha *
                    </label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="novaSenha" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition pr-10"
                            placeholder="Mínimo 6 caracteres"
                            required
                            minlength="6"
                        >
                        <button 
                            type="button" 
                            onclick="toggleSenhaVisivel('novaSenha', this)"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F4742B] transition"
                        >
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div id="novaSenhaStrength" class="h-1 rounded-full mt-2 transition-all duration-300" style="width: 0%; background: #E5E7EB;"></div>
                    <p id="novaSenhaHint" class="text-xs text-gray-400 mt-1">Digite uma senha forte</p>
                </div>
                
                <!-- Confirmar Nova Senha -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-check-circle text-[#F4742B] mr-2"></i>Confirmar Nova Senha *
                    </label>
                    <div class="relative">
                        <input 
                            type="password" 
                            id="confirmarNovaSenha" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition pr-10"
                            placeholder="Digite a nova senha novamente"
                            required
                        >
                        <button 
                            type="button" 
                            onclick="toggleSenhaVisivel('confirmarNovaSenha', this)"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F4742B] transition"
                        >
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="window.fecharModalAlterarSenha()"
                            class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-lg font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                        <i class="fas fa-save mr-2"></i> Alterar Senha
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.id = 'modalAlterarSenha';
    overlay.className = 'modal-overlay active';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.zIndex = '10000';
    
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="window.fecharModalAlterarSenha()" 
                    style="position: sticky; top: 0; float: right; background: none; border: none; font-size: 24px; color: #9CA3AF; cursor: pointer; padding: 8px; z-index: 10;">
                <i class="fas fa-times"></i>
            </button>
            ${modalContent}
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Fechar ao clicar fora
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            window.fecharModalAlterarSenha();
        }
    });
    
    // Fechar com ESC
    const handleEsc = function(e) {
        if (e.key === 'Escape') {
            window.fecharModalAlterarSenha();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Adicionar evento de submit
    document.getElementById('formAlterarSenha').addEventListener('submit', async function(e) {
        e.preventDefault();
        await window.confirmarAlterarSenha();
    });
    
    // Adicionar validação de senha em tempo real
    const novaSenhaInput = document.getElementById('novaSenha');
    novaSenhaInput.addEventListener('input', function() {
        const senha = this.value;
        const strengthBar = document.getElementById('novaSenhaStrength');
        const hint = document.getElementById('novaSenhaHint');
        let forca = 0;
        
        if (senha.length >= 6) forca++;
        if (senha.length >= 10) forca++;
        if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) forca++;
        if (/\d/.test(senha)) forca++;
        if (/[^a-zA-Z0-9]/.test(senha)) forca++;
        
        if (senha.length === 0) {
            strengthBar.style.width = '0%';
            strengthBar.style.background = '#E5E7EB';
            hint.textContent = 'Digite uma senha forte';
            hint.style.color = '#9CA3AF';
            return;
        }
        
        if (forca <= 2) {
            strengthBar.style.width = '25%';
            strengthBar.style.background = '#EF4444';
            hint.textContent = 'Senha fraca';
            hint.style.color = '#EF4444';
        } else if (forca <= 4) {
            strengthBar.style.width = '50%';
            strengthBar.style.background = '#F59E0B';
            hint.textContent = 'Senha média';
            hint.style.color = '#F59E0B';
        } else {
            strengthBar.style.width = '100%';
            strengthBar.style.background = '#10B981';
            hint.textContent = 'Senha forte!';
            hint.style.color = '#10B981';
        }
    });
};

// ============================================
// FUNÇÃO: Toggle Senha Visível
// ============================================
window.toggleSenhaVisivel = function(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    button.querySelector('i').classList.toggle('fa-eye');
    button.querySelector('i').classList.toggle('fa-eye-slash');
};

// ============================================
// FUNÇÃO: Fechar Modal Alterar Senha
// ============================================
window.fecharModalAlterarSenha = function() {
    const modal = document.getElementById('modalAlterarSenha');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// ============================================
// FUNÇÃO: Confirmar Alterar Senha
// ============================================
window.confirmarAlterarSenha = async function() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;
    
    // Validações
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
        warningModal({
            title: 'Campos Obrigatórios',
            message: 'Preencha todos os campos para alterar sua senha.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    if (novaSenha.length < 6) {
        warningModal({
            title: 'Senha Fraca',
            message: 'A nova senha deve ter pelo menos 6 caracteres.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    if (novaSenha !== confirmarNovaSenha) {
        warningModal({
            title: 'Senhas não coincidem',
            message: 'A nova senha e a confirmação não são iguais.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    // Verificar se a senha atual está correta
    try {
        const { supabase } = await import('../config/supabase.js');
        const user = await getCurrentUser();
        
        if (!user) {
            errorModal({
                title: 'Erro',
                message: 'Usuário não autenticado.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        // Verificar a senha atual (tentando fazer login com a senha atual)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: senhaAtual
        });
        
        if (signInError) {
            warningModal({
                title: 'Senha Atual Incorreta',
                message: 'A senha atual informada está incorreta. Tente novamente.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        // Atualizar a senha
        const { error: updateError } = await supabase.auth.updateUser({
            password: novaSenha
        });
        
        if (updateError) throw updateError;
        
        // Fechar modal
        window.fecharModalAlterarSenha();
        
        // Mostrar sucesso
        successModal({
            title: 'Senha Alterada! 🔐',
            message: 'Sua senha foi alterada com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
            }
        });
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        errorModal({
            title: 'Erro ao Alterar Senha',
            message: error.message || 'Ocorreu um erro ao alterar sua senha. Tente novamente.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÕES ADMIN (SÓ ADMIN)
// ============================================

// Salvar Configurações do Sistema - ADMIN
window.salvarConfiguracoes = async function() {
    const nomeAcademia = document.getElementById('configNomeAcademia')?.value?.trim() || '';
    
    if (!nomeAcademia) {
        warningModal({
            title: 'Campo Obrigatório',
            message: 'Por favor, informe o nome da academia.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    try {
        const btn = document.querySelector('#configNomeAcademia')?.closest('.space-y-3')?.querySelector('button');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        }
        
        await salvarConfiguracao('nome_academia', nomeAcademia);
        
        successModal({
            title: 'Configurações Salvas!',
            message: `O nome da academia foi atualizado para:<br><br>🏫 ${nomeAcademia}`,
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
                loadPage('configuracoes');
            }
        });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar as configurações.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    } finally {
        const btn = document.querySelector('#configNomeAcademia')?.closest('.space-y-3')?.querySelector('button');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save mr-2"></i> Salvar Configurações';
        }
    }
};

// Salvar Notificações - ADMIN
window.salvarNotificacoes = async function() {
    const notifEmail = document.getElementById('configNotifEmail')?.checked || false;
    const notifWhatsApp = document.getElementById('configNotifWhatsApp')?.checked || false;
    
    try {
        await Promise.all([
            salvarConfiguracao('notificacoes_email', notifEmail),
            salvarConfiguracao('notificacoes_whatsapp', notifWhatsApp)
        ]);
        
        successModal({
            title: 'Preferências Salvas!',
            message: 'As preferências de notificação foram salvas com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
                loadPage('configuracoes');
            }
        });
    } catch (error) {
        console.error('Erro ao salvar notificações:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar as preferências.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// Configurar WhatsApp - ADMIN
window.configurarWhatsApp = function() {
    infoModal({
        title: 'Configurar WhatsApp',
        message: 'Em breve você poderá conectar seu WhatsApp via Evolution API para enviar notificações automáticas.',
        confirmText: 'OK',
        onConfirm: () => window.closeModal()
    });
};

// Configurar N8N - ADMIN
window.configurarN8N = function() {
    infoModal({
        title: 'Configurar N8N',
        message: 'Em breve você poderá conectar seu N8N para automatizar fluxos de trabalho.',
        confirmText: 'OK',
        onConfirm: () => window.closeModal()
    });
};

// Limpar Cache - ADMIN
window.limparCache = function() {
    confirmModal({
        title: 'Limpar Cache',
        message: 'Tem certeza que deseja limpar o cache do sistema? Isso pode ajudar a resolver problemas de carregamento.',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        confirmColor: '#F59E0B',
        onConfirm: () => {
            localStorage.clear();
            window.closeModal();
            successModal({
                title: 'Cache Limpo!',
                message: 'O cache foi limpo com sucesso. A página será recarregada.',
                confirmText: 'OK',
                onConfirm: () => {
                    window.closeModal();
                    window.location.reload();
                }
            });
        }
    });
};

// Exportar Dados - ADMIN
window.exportarDados = function() {
    infoModal({
        title: 'Exportar Dados',
        message: 'Funcionalidade de exportação de dados será implementada em breve.',
        confirmText: 'OK',
        onConfirm: () => window.closeModal()
    });
};

// Sair do Sistema - TODOS
window.sairSistema = function() {
    document.getElementById('btnLogout')?.click();
};

// ============================================
// EVENTOS
// ============================================
export function setupConfiguracoesEvents() {
    // Nenhum evento específico necessário por enquanto
}