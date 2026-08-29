import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, infoModal, warningModal } from './shared.js';
import { loadPage } from './router.js';
import { mascaraTelefone, removerMascaraTelefone, validarTelefone } from '../components/mascara.js';

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
// FUNÇÃO: Atualizar Menu e Header
// ============================================
async function atualizarInterfaceUsuario(nome) {
    const userNameMenu = document.getElementById('userNameMenu');
    const userAvatarMenu = document.getElementById('userAvatarMenu');
    
    if (userNameMenu) {
        userNameMenu.textContent = nome;
    }
    
    if (userAvatarMenu) {
        userAvatarMenu.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff&size=40`;
    }
    
    const userAvatarHeader = document.getElementById('userAvatarHeader');
    if (userAvatarHeader) {
        userAvatarHeader.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff&size=40`;
    }
    
    localStorage.setItem('userName', nome);
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
    
    const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();
    
    const isAdmin = profile?.role === 'admin';
    const configs = isAdmin ? await buscarConfiguracoes() : {};
    const { data: centros } = isAdmin ? await supabase
        .from('centros')
        .select('id, nome, horario_funcionamento, vagas_padrao')
        .order('nome', { ascending: true }) : { data: [] };
    
    // 🔥 FORMATAR TELEFONE PARA EXIBIÇÃO
    let telefoneExibicao = profile?.telefone || '';
    if (telefoneExibicao) {
        const numeros = telefoneExibicao.replace(/\D/g, '');
        if (numeros.length >= 10 && numeros.length <= 11) {
            const tempInput = document.createElement('input');
            tempInput.value = numeros;
            mascaraTelefone(tempInput);
            telefoneExibicao = tempInput.value;
        }
    }
    
    let html = `
        <!-- Cabeçalho -->
        <div class="mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                    <i class="fas fa-cog text-[#F4742B] text-lg"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-[#4B4B4D]">Configurações</h2>
                    <p class="text-xs text-gray-400">Gerencie suas preferências e dados</p>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-2' : ''} gap-4 md:gap-6">
            
            <!-- PERFIL - VISÍVEL PARA TODOS -->
            <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 card-hover ${!isAdmin ? 'max-w-md mx-auto' : ''}">
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-user-circle text-[#F4742B] text-lg"></i>
                    </div>
                    <h3 class="text-base font-semibold text-[#4B4B4D]">Meu Perfil</h3>
                </div>
                
                <div class="flex items-center gap-4 mb-5">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nome || 'Usuário')}&background=F4742B&color=fff&size=80" 
                         alt="Avatar" class="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#F4742B]">
                    <div class="min-w-0">
                        <p class="font-semibold text-gray-800 text-sm md:text-base truncate">${profile?.nome || 'Usuário'}</p>
                        <p class="text-xs text-gray-400 truncate">${user.email}</p>
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isAdmin ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
                            ${isAdmin ? 'Administrador' : 'Usuário'}
                        </span>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                            <i class="fas fa-user text-[#F4742B] mr-1"></i> Nome
                        </label>
                        <input type="text" id="configNome" value="${profile?.nome || ''}"
                               class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                            <i class="fas fa-phone text-[#F4742B] mr-1"></i> Telefone
                        </label>
                        <input type="tel" id="configTelefone" 
                               value="${telefoneExibicao}"
                               placeholder="(11) 99999-9999"
                               maxlength="15"
                               class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                        <p class="text-[10px] text-gray-400 mt-1">Exemplo: (11) 99999-9999</p>
                    </div>
                    
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                            <i class="fas fa-envelope text-[#F4742B] mr-1"></i> Email
                        </label>
                        <input type="email" value="${user.email}" disabled
                               class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed">
                    </div>
                    
                    <div class="flex flex-col gap-2 pt-1">
                        <button onclick="window.salvarPerfil()" 
                                class="w-full h-10 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center justify-center gap-2">
                            <i class="fas fa-save text-xs"></i> Salvar Perfil
                        </button>
                        <button onclick="window.alterarSenha()" 
                                class="w-full h-10 border-2 border-[#F4742B] text-[#F4742B] text-sm font-medium rounded-xl hover:bg-[#F4742B] hover:text-white transition active:scale-[0.98] flex items-center justify-center gap-2">
                            <i class="fas fa-key text-xs"></i> Alterar Senha
                        </button>
                    </div>
                </div>
            </div>
    `;
    
    if (isAdmin) {
        html += `
            <!-- Configurações do Sistema -->
            <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 card-hover">
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-sliders-h text-[#F4742B] text-lg"></i>
                    </div>
                    <h3 class="text-base font-semibold text-[#4B4B4D]">Sistema</h3>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                            <i class="fas fa-building text-[#F4742B] mr-1"></i> Nome da Academia
                        </label>
                        <input type="text" id="configNomeAcademia" 
                               value="${configs?.nome_academia || 'WODBOOK'}"
                               class="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                        <p class="text-[10px] text-gray-400 mt-1">Nome que aparecerá no cabeçalho</p>
                    </div>
                    
                    <button onclick="window.salvarConfiguracoes()" 
                            class="w-full h-10 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-save text-xs"></i> Salvar Configurações
                    </button>
                </div>
            </div>
            
            <!-- Horários e Vagas -->
            <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 card-hover lg:col-span-2">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                            <i class="fas fa-clock text-[#F4742B] text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-semibold text-[#4B4B4D]">Horários e Vagas</h3>
                            <p class="text-xs text-gray-400">Configure cada unidade</p>
                        </div>
                    </div>
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                        ${centros?.length || 0} unidades
                    </span>
                </div>
                
                <div class="space-y-3">
                    ${centros?.map(centro => {
                        const horarioInicio = centro.horario_funcionamento?.split(' - ')[0] || '06:00';
                        const horarioFim = centro.horario_funcionamento?.split(' - ')[1] || '22:00';
                        const vagas = centro.vagas_padrao || 10;
                        
                        return `
                            <div class="p-3 md:p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition border border-gray-100/50">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div>
                                        <p class="font-medium text-gray-800 text-sm">${centro.nome}</p>
                                        <p class="text-[10px] text-gray-400">ID: ${centro.id.substring(0, 8)}</p>
                                    </div>
                                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FEF3E8] text-[#F4742B] whitespace-nowrap">
                                        <i class="fas fa-users mr-1"></i> ${vagas} vagas
                                    </span>
                                </div>
                                
                                <div class="flex flex-wrap items-center gap-2">
                                    <div class="flex items-center gap-1">
                                        <span class="text-[10px] text-gray-400">Início:</span>
                                        <input type="time" id="horario_${centro.id}_inicio" 
                                               value="${horarioInicio}"
                                               class="w-24 h-8 px-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                                    </div>
                                    
                                    <span class="text-xs text-gray-300">às</span>
                                    
                                    <div class="flex items-center gap-1">
                                        <span class="text-[10px] text-gray-400">Fim:</span>
                                        <input type="time" id="horario_${centro.id}_fim" 
                                               value="${horarioFim}"
                                               class="w-24 h-8 px-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                                    </div>
                                    
                                    <span class="text-gray-300">|</span>
                                    
                                    <div class="flex items-center gap-1">
                                        <span class="text-[10px] text-gray-400">
                                            <i class="fas fa-users"></i>
                                        </span>
                                        <input type="number" id="vagas_${centro.id}" 
                                               value="${vagas}" 
                                               min="1" max="50"
                                               class="w-14 h-8 px-1 text-xs text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                                    </div>
                                    
                                    <button onclick="window.salvarConfigUnidade('${centro.id}')" 
                                            class="h-8 px-3 bg-[#F4742B] text-white text-xs font-medium rounded-lg hover:bg-[#E0601A] transition flex items-center gap-1 ml-auto">
                                        <i class="fas fa-save text-[10px]"></i> Salvar
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('') || `
                        <div class="text-center text-gray-400 py-6 text-sm">
                            <i class="fas fa-building text-2xl block mb-2 text-gray-300"></i>
                            Nenhuma unidade cadastrada
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Notificações -->
            <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 card-hover">
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-bell text-[#F4742B] text-lg"></i>
                    </div>
                    <h3 class="text-base font-semibold text-[#4B4B4D]">Notificações</h3>
                </div>
                
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Email</p>
                            <p class="text-[10px] text-gray-400">Alertas sobre agendamentos</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="configNotifEmail" ${configs?.notificacoes_email === 'true' ? 'checked' : ''} class="sr-only peer">
                            <div class="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#F4742B] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F4742B]"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                        <div>
                            <p class="text-sm font-medium text-gray-700">WhatsApp</p>
                            <p class="text-[10px] text-gray-400">Alertas via WhatsApp</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="configNotifWhatsApp" ${configs?.notificacoes_whatsapp === 'true' ? 'checked' : ''} class="sr-only peer">
                            <div class="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#F4742B] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F4742B]"></div>
                        </label>
                    </div>
                    
                    <button onclick="window.salvarNotificacoes()" 
                            class="w-full h-10 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-save text-xs"></i> Salvar Preferências
                    </button>
                </div>
            </div>
            
            <!-- Integrações -->
            <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 card-hover">
                <div class="flex items-center gap-3 mb-5">
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-plug text-[#F4742B] text-lg"></i>
                    </div>
                    <h3 class="text-base font-semibold text-[#4B4B4D]">Integrações</h3>
                </div>
                
                <div class="space-y-3">
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <i class="fab fa-whatsapp text-green-500"></i>
                                    WhatsApp
                                </p>
                                <p class="text-[10px] text-gray-400">Evolution API</p>
                            </div>
                            <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Desconectado</span>
                        </div>
                        <button onclick="window.configurarWhatsApp()" 
                                class="mt-2 w-full h-8 border-2 border-green-500 text-green-500 text-xs font-medium rounded-lg hover:bg-green-500 hover:text-white transition flex items-center justify-center gap-1">
                            <i class="fas fa-plug text-[10px]"></i> Configurar
                        </button>
                    </div>
                    
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <i class="fas fa-robot text-[#F4742B]"></i>
                                    N8N Automation
                                </p>
                                <p class="text-[10px] text-gray-400">Automatize fluxos</p>
                            </div>
                            <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Desconectado</span>
                        </div>
                        <button onclick="window.configurarN8N()" 
                                class="mt-2 w-full h-8 border-2 border-[#F4742B] text-[#F4742B] text-xs font-medium rounded-lg hover:bg-[#F4742B] hover:text-white transition flex items-center justify-center gap-1">
                            <i class="fas fa-plug text-[10px]"></i> Configurar
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Ações de Sistema -->
            <div class="bg-white rounded-2xl shadow-sm p-5 md:p-6 card-hover lg:col-span-2">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-tools text-[#F4742B] text-lg"></i>
                    </div>
                    <h3 class="text-base font-semibold text-[#4B4B4D]">Ferramentas</h3>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button onclick="window.limparCache()" 
                            class="h-10 border-2 border-yellow-500 text-yellow-500 text-sm font-medium rounded-xl hover:bg-yellow-500 hover:text-white transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-broom text-xs"></i> Limpar Cache
                    </button>
                    <button onclick="window.exportarDados()" 
                            class="h-10 border-2 border-blue-500 text-blue-500 text-sm font-medium rounded-xl hover:bg-blue-500 hover:text-white transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-download text-xs"></i> Exportar
                    </button>
                    <button onclick="window.sairSistema()" 
                            class="h-10 border-2 border-red-500 text-red-500 text-sm font-medium rounded-xl hover:bg-red-500 hover:text-white transition active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-sign-out-alt text-xs"></i> Sair
                    </button>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    // 🔥 APLICAR MÁSCARA DE TELEFONE APÓS RENDERIZAR
    setTimeout(() => {
        const telefoneInput = document.getElementById('configTelefone');
        if (telefoneInput) {
            // Aplicar máscara no valor carregado
            if (telefoneInput.value) {
                mascaraTelefone(telefoneInput);
            }
            
            // Evento de input
            telefoneInput.addEventListener('input', function() {
                mascaraTelefone(this);
                this.classList.remove('border-red-500');
                this.classList.add('border-gray-300');
            });
            
            // Validação ao perder foco
            telefoneInput.addEventListener('blur', function() {
                if (this.value && !validarTelefone(this.value)) {
                    this.classList.add('border-red-500');
                    this.classList.remove('border-gray-300');
                } else {
                    this.classList.remove('border-red-500');
                    this.classList.add('border-gray-300');
                }
            });
            
            // Remover erro ao focar
            telefoneInput.addEventListener('focus', function() {
                this.classList.remove('border-red-500');
                this.classList.add('border-gray-300');
            });
        }
    }, 300);
    
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
            message: 'Preencha os horários de início e fim.',
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
            message: `Atualizado:<br><br>🕐 ${horarioFuncionamento}<br>👥 ${vagas} vagas`,
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
            message: error.message || 'Ocorreu um erro ao salvar.',
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

window.salvarPerfil = async function() {
    const nome = document.getElementById('configNome')?.value?.trim();
    const telefone = document.getElementById('configTelefone')?.value?.trim();
    
    if (!nome) {
        warningModal({
            title: 'Campo Obrigatório',
            message: 'Informe seu nome.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    if (telefone && !validarTelefone(telefone)) {
        warningModal({
            title: 'Telefone Inválido',
            message: 'Informe um telefone válido. Ex: (11) 99999-9999',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        document.getElementById('configTelefone')?.focus();
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const dadosAtualizar = { nome };
        if (telefone) {
            dadosAtualizar.telefone = telefone;
        } else {
            dadosAtualizar.telefone = null;
        }
        
        const { error } = await supabase
            .from('usuarios')
            .update(dadosAtualizar)
            .eq('id', user.id);
        
        if (error) throw error;
        
        await atualizarInterfaceUsuario(nome);
        
        successModal({
            title: 'Perfil Atualizado! ✅',
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
            message: error.message || 'Ocorreu um erro ao salvar.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Alterar Senha
// ============================================
window.alterarSenha = function() {
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
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-lock text-[#F4742B] mr-2"></i>Senha Atual *
                    </label>
                    <div class="relative">
                        <input type="password" id="senhaAtual" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition pr-10"
                               placeholder="Digite sua senha atual" required>
                        <button type="button" onclick="window.toggleSenhaVisivel('senhaAtual', this)"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F4742B] transition">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-lock text-[#F4742B] mr-2"></i>Nova Senha *
                    </label>
                    <div class="relative">
                        <input type="password" id="novaSenha" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition pr-10"
                               placeholder="Mínimo 6 caracteres" required minlength="6">
                        <button type="button" onclick="window.toggleSenhaVisivel('novaSenha', this)"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F4742B] transition">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <div id="novaSenhaStrength" class="h-1 rounded-full mt-2 transition-all duration-300" style="width: 0%; background: #E5E7EB;"></div>
                    <p id="novaSenhaHint" class="text-xs text-gray-400 mt-1">Digite uma senha forte</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        <i class="fas fa-check-circle text-[#F4742B] mr-2"></i>Confirmar Nova Senha *
                    </label>
                    <div class="relative">
                        <input type="password" id="confirmarNovaSenha" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition pr-10"
                               placeholder="Digite a nova senha novamente" required>
                        <button type="button" onclick="window.toggleSenhaVisivel('confirmarNovaSenha', this)"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F4742B] transition">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="window.fecharModalAlterarSenha()"
                            class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-xl font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                        <i class="fas fa-save mr-2"></i> Alterar Senha
                    </button>
                </div>
            </form>
        </div>
    `;
    
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
    
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            window.fecharModalAlterarSenha();
        }
    });
    
    const handleEsc = function(e) {
        if (e.key === 'Escape') {
            window.fecharModalAlterarSenha();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    document.getElementById('formAlterarSenha').addEventListener('submit', async function(e) {
        e.preventDefault();
        await window.confirmarAlterarSenha();
    });
    
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

window.toggleSenhaVisivel = function(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    button.querySelector('i').classList.toggle('fa-eye');
    button.querySelector('i').classList.toggle('fa-eye-slash');
};

window.fecharModalAlterarSenha = function() {
    const modal = document.getElementById('modalAlterarSenha');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

window.confirmarAlterarSenha = async function() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;
    
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
        warningModal({
            title: 'Campos Obrigatórios',
            message: 'Preencha todos os campos.',
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
    
    try {
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
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: senhaAtual
        });
        
        if (signInError) {
            warningModal({
                title: 'Senha Atual Incorreta',
                message: 'A senha atual está incorreta. Tente novamente.',
                confirmText: 'OK',
                onConfirm: () => window.closeModal()
            });
            return;
        }
        
        const { error: updateError } = await supabase.auth.updateUser({
            password: novaSenha
        });
        
        if (updateError) throw updateError;
        
        window.fecharModalAlterarSenha();
        
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
            message: error.message || 'Ocorreu um erro ao alterar sua senha.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÕES ADMIN (SÓ ADMIN)
// ============================================

window.salvarConfiguracoes = async function() {
    const nomeAcademia = document.getElementById('configNomeAcademia')?.value?.trim() || '';
    
    if (!nomeAcademia) {
        warningModal({
            title: 'Campo Obrigatório',
            message: 'Informe o nome da academia.',
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
            message: `Nome atualizado para:<br><br>🏫 ${nomeAcademia}`,
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
            message: error.message || 'Ocorreu um erro ao salvar.',
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
            message: 'As preferências foram salvas com sucesso.',
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
            message: error.message || 'Ocorreu um erro ao salvar.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

window.configurarWhatsApp = function() {
    infoModal({
        title: 'Configurar WhatsApp',
        message: 'Em breve você poderá conectar seu WhatsApp via Evolution API.',
        confirmText: 'OK',
        onConfirm: () => window.closeModal()
    });
};

window.configurarN8N = function() {
    infoModal({
        title: 'Configurar N8N',
        message: 'Em breve você poderá conectar seu N8N.',
        confirmText: 'OK',
        onConfirm: () => window.closeModal()
    });
};

window.limparCache = function() {
    confirmModal({
        title: 'Limpar Cache',
        message: 'Tem certeza? Isso pode ajudar a resolver problemas.',
        confirmText: 'Limpar',
        cancelText: 'Cancelar',
        confirmColor: '#F59E0B',
        onConfirm: () => {
            localStorage.clear();
            window.closeModal();
            successModal({
                title: 'Cache Limpo!',
                message: 'O cache foi limpo. A página será recarregada.',
                confirmText: 'OK',
                onConfirm: () => {
                    window.closeModal();
                    window.location.reload();
                }
            });
        }
    });
};

window.exportarDados = function() {
    infoModal({
        title: 'Exportar Dados',
        message: 'Funcionalidade em breve.',
        confirmText: 'OK',
        onConfirm: () => window.closeModal()
    });
};

window.sairSistema = function() {
    document.getElementById('btnLogout')?.click();
};

// ============================================
// EVENTOS
// ============================================
export function setupConfiguracoesEvents() {
    setTimeout(() => {
        const telefoneInput = document.getElementById('configTelefone');
        if (telefoneInput) {
            if (telefoneInput.value) {
                mascaraTelefone(telefoneInput);
            }
            
            telefoneInput.addEventListener('input', function() {
                mascaraTelefone(this);
                this.classList.remove('border-red-500');
                this.classList.add('border-gray-300');
            });
            
            telefoneInput.addEventListener('blur', function() {
                if (this.value && !validarTelefone(this.value)) {
                    this.classList.add('border-red-500');
                    this.classList.remove('border-gray-300');
                } else {
                    this.classList.remove('border-red-500');
                    this.classList.add('border-gray-300');
                }
            });
            
            telefoneInput.addEventListener('focus', function() {
                this.classList.remove('border-red-500');
                this.classList.add('border-gray-300');
            });
        }
    }, 500);
}