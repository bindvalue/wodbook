import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, warningModal, infoModal } from '../components/modal.js';
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
// FUNÇÃO: Carregar Conteúdo de Centros
// ============================================
// ============================================
// FUNÇÃO: Carregar Conteúdo de Centros
// ============================================
export async function loadCentrosContent() {
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
    
    // Buscar centros
    const { data: centros, error } = await supabase
        .from('centros')
        .select('*')
        .order('nome', { ascending: true });
    
    if (error) {
        console.error('Erro ao carregar centros:', error);
        return `
            <div class="flex flex-col items-center justify-center py-16 px-4">
                <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-circle text-3xl text-red-400"></i>
                </div>
                <p class="text-lg font-medium text-gray-600">Erro ao carregar</p>
                <p class="text-sm text-gray-400 mt-1">Tente novamente mais tarde</p>
                <button onclick="window.recarregarCentros()" 
                        class="mt-4 px-6 py-2 bg-[#F4742B] text-white text-sm rounded-xl hover:bg-[#E0601A] transition">
                    Tentar novamente
                </button>
            </div>
        `;
    }
    
    // 🔥 CORREÇÃO: Buscar apenas horários ATIVOS de centros ATIVOS
    const { data: horarios } = await supabase
        .from('horarios')
        .select('*, centros!inner(ativo)')
        .eq('ativo', true)
        .eq('centros.ativo', true);
    
    // Calcular estatísticas corretas
    let totalVagas = 0;
    const totalHorariosAtivos = horarios?.length || 0;
    horarios?.forEach(h => {
        totalVagas += h.vagas || 0;
    });
    
    // Centros ativos
    const centrosAtivos = centros?.filter(c => c.ativo !== false) || [];
    const totalCentrosAtivos = centrosAtivos.length;
    
    // 🔥 Buscar horários por centro para exibir no card
    const { data: horariosPorCentro } = await supabase
        .from('horarios')
        .select('centro_id, vagas')
        .eq('ativo', true);
    
    // Agrupar horários por centro
    const horariosPorCentroMap = {};
    const vagasPorCentroMap = {};
    horariosPorCentro?.forEach(h => {
        if (!horariosPorCentroMap[h.centro_id]) {
            horariosPorCentroMap[h.centro_id] = 0;
            vagasPorCentroMap[h.centro_id] = 0;
        }
        horariosPorCentroMap[h.centro_id]++;
        vagasPorCentroMap[h.centro_id] += h.vagas || 0;
    });
    
    return `
        <!-- Modal de Cadastro/Edição -->
        <div id="modalCentro" class="modal-overlay" onclick="window.fecharModalCentro(event)">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-[#4B4B4D]">
                        <i class="fas fa-dumbbell text-[#F4742B]"></i>
                        <span id="modalCentroTitle">Novo Centro</span>
                    </h3>
                    <button onclick="window.fecharModalCentro()" class="text-gray-400 hover:text-gray-600 text-2xl transition">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="formCentro" class="space-y-4">
                    <input type="hidden" id="centroId">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-building text-[#F4742B] mr-1"></i> Nome do Centro *
                        </label>
                        <input type="text" id="nome" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: CrossFit Centro">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-map-pin text-[#F4742B] mr-1"></i> Bairro *
                        </label>
                        <input type="text" id="bairro" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: Centro">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-location-dot text-[#F4742B] mr-1"></i> Endereço Completo *
                        </label>
                        <input type="text" id="endereco" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-phone text-[#F4742B] mr-1"></i> Telefone
                        </label>
                        <input type="tel" id="telefone"
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="(11) 99999-9999">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-image text-[#F4742B] mr-1"></i> URL da Imagem
                        </label>
                        <input type="url" id="imagem"
                               class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="https://exemplo.com/imagem.jpg">
                        <p class="text-xs text-gray-400 mt-1">Deixe em branco para usar o ícone do nome</p>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <input type="checkbox" id="ativo" checked
                               class="w-4 h-4 text-[#F4742B] focus:ring-[#F4742B] border-gray-300 rounded">
                        <label for="ativo" class="text-sm font-medium text-gray-700">Centro ativo</label>
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onclick="window.fecharModalCentro()"
                                class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-xl font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                            <i class="fas fa-save mr-2"></i>
                            <span id="btnSubmitText">Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Estatísticas - Apple Style (CORRIGIDAS) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalCentrosAdmin">${centros?.length || 0}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-dumbbell text-[#F4742B] text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Ativos</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="centrosAtivosAdmin">${totalCentrosAtivos}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <i class="fas fa-check-circle text-green-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Horários</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalHorariosAdmin">${totalHorariosAtivos}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <i class="fas fa-clock text-purple-500 text-sm"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">Vagas</p>
                        <p class="text-2xl font-bold text-[#4B4B4D] mt-1" id="totalVagasAdmin">${totalVagas}</p>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <i class="fas fa-users text-blue-500 text-sm"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Barra de busca e ações -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="flex flex-col md:flex-row gap-3">
                <div class="flex-1 relative">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input type="text" id="searchInputCentros" 
                           placeholder="Buscar centros..."
                           class="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                </div>
                <div class="flex gap-2 flex-wrap">
                    <select id="filterStatusCentros" 
                            class="h-10 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white appearance-none">
                        <option value="todos">Todos</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                    <button onclick="window.recarregarCentros()" 
                            class="h-10 w-10 bg-gray-50 text-gray-500 rounded-xl hover:bg-[#FEF3E8] hover:text-[#F4742B] transition flex items-center justify-center">
                        <i class="fas fa-sync-alt text-sm"></i>
                    </button>
                    <button onclick="window.abrirModalCadastro()" 
                            class="h-10 px-4 bg-[#F4742B] text-white text-sm font-medium rounded-xl hover:bg-[#E0601A] transition active:scale-[0.98] flex items-center gap-2">
                        <i class="fas fa-plus text-xs"></i>
                        <span class="hidden sm:inline">Novo Centro</span>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Centros -->
        <div id="centrosListAdmin" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${renderCentrosCards(centros, horariosPorCentroMap, vagasPorCentroMap)}
        </div>
    `;
}

// ============================================
// RENDER: Cards de Centros (Apple Design com estatísticas por centro)
// ============================================
function renderCentrosCards(centros, horariosMap, vagasMap) {
    if (!centros || centros.length === 0) {
        return `
            <div class="col-span-full flex flex-col items-center justify-center py-16 px-4">
                <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <i class="fas fa-dumbbell text-3xl text-gray-300"></i>
                </div>
                <p class="text-lg font-medium text-gray-600">Nenhum centro cadastrado</p>
                <p class="text-sm text-gray-400 mt-1">Clique em "Novo Centro" para começar</p>
            </div>
        `;
    }
    
    return centros.map(centro => {
        const isActive = centro.ativo !== false;
        const imagemUrl = centro.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200&font-size=0.35`;
        
        // 🔥 Estatísticas do centro (apenas horários ativos)
        const totalHorariosCentro = horariosMap?.[centro.id] || 0;
        const totalVagasCentro = vagasMap?.[centro.id] || 0;
        
        return `
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100/50 transition-all duration-300 hover:shadow-md group" data-centro-id="${centro.id}">
                <div class="relative h-40 overflow-hidden bg-[#FEF3E8]">
                    <img src="${imagemUrl}" 
                         alt="${centro.nome}" 
                         class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                         loading="lazy"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200&font-size=0.35'">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    
                    <div class="absolute top-3 right-3">
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}">
                            ${isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    
                    <div class="absolute bottom-3 left-3 right-3">
                        <h3 class="text-white font-semibold text-sm drop-shadow-lg truncate">${centro.nome}</h3>
                        <p class="text-white/70 text-xs drop-shadow-lg flex items-center gap-1">
                            <i class="fas fa-map-pin text-[10px]"></i> ${centro.bairro || ''}
                        </p>
                    </div>
                </div>
                
                <div class="p-4">
                    <div class="flex items-start gap-2 text-xs text-gray-500 mb-2">
                        <i class="fas fa-location-dot text-[#F4742B] mt-0.5 text-[10px]"></i>
                        <span class="line-clamp-2">${centro.endereco || 'Endereço não informado'}</span>
                    </div>
                    
                    ${centro.telefone ? `
                        <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <i class="fas fa-phone text-[#F4742B] text-[10px]"></i>
                            <span>${centro.telefone}</span>
                        </div>
                    ` : ''}
                    
                    <!-- 🔥 Estatísticas do centro -->
                    <div class="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                        <span class="flex items-center gap-1">
                            <i class="far fa-clock text-[#F4742B]"></i>
                            ${centro.horario_funcionamento || '06:00 - 22:00'}
                        </span>
                        ${totalHorariosCentro > 0 ? `
                            <span class="flex items-center gap-1">
                                <i class="fas fa-clock text-[#F4742B]"></i>
                                ${totalHorariosCentro}h
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-users text-[#F4742B]"></i>
                                ${totalVagasCentro}
                            </span>
                        ` : `
                            <span class="text-gray-300">Sem horários</span>
                        `}
                    </div>
                    
                    <div class="flex gap-1.5">
                        <button onclick="window.editarCentro('${centro.id}')" 
                                class="flex-1 px-2 py-1.5 text-xs border border-[#F4742B] text-[#F4742B] rounded-lg hover:bg-[#F4742B] hover:text-white transition flex items-center justify-center gap-1">
                            <i class="fas fa-edit text-[10px]"></i> Editar
                        </button>
                        <button onclick="window.gerenciarHorarios('${centro.id}', '${centro.nome}')" 
                                class="flex-1 px-2 py-1.5 text-xs bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition flex items-center justify-center gap-1">
                            <i class="fas fa-clock text-[10px]"></i> Horários
                        </button>
                        <button onclick="window.toggleCentroStatus('${centro.id}', ${isActive})" 
                                class="px-2 py-1.5 text-xs border rounded-lg transition flex items-center justify-center gap-1
                                ${isActive ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white' : 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white'}">
                            <i class="fas ${isActive ? 'fa-pause' : 'fa-play'} text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// FUNÇÕES GLOBAIS (window.*)
// ============================================

// Abrir modal de cadastro
window.abrirModalCadastro = function() {
    const modal = document.getElementById('modalCentro');
    if (!modal) return;
    
    document.getElementById('modalCentroTitle').textContent = 'Novo Centro';
    document.getElementById('btnSubmitText').textContent = 'Cadastrar';
    document.getElementById('centroId').value = '';
    document.getElementById('formCentro').reset();
    document.getElementById('ativo').checked = true;
    document.getElementById('imagem').value = '';
    
    modal.classList.add('active');
};

// Fechar modal de centro
window.fecharModalCentro = function(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modalCentro');
    if (modal) modal.classList.remove('active');
};

// ============================================
// FUNÇÃO: Editar Centro
// ============================================
window.editarCentro = async function(id) {
    try {
        const { data, error } = await supabase
            .from('centros')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const modal = document.getElementById('modalCentro');
        if (!modal) return;
        
        document.getElementById('modalCentroTitle').textContent = 'Editar Centro';
        document.getElementById('btnSubmitText').textContent = 'Atualizar';
        document.getElementById('centroId').value = data.id;
        
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('endereco').value = data.endereco || '';
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('imagem').value = data.imagem || '';
        document.getElementById('ativo').checked = data.ativo !== false;
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('❌ Erro ao carregar centro:', error);
        errorModal({
            title: 'Erro ao Carregar',
            message: 'Não foi possível carregar os dados do centro.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    }
};

// ============================================
// FUNÇÃO: Toggle Status do Centro
// ============================================
window.toggleCentroStatus = async function(id, ativo) {
    const acaoTexto = ativo ? 'Pausar' : 'Ativar';
    
    confirmModal({
        title: `${acaoTexto} Centro`,
        message: ativo 
            ? `Tem certeza que deseja pausar este centro?<br><br>O centro não aparecerá para novos agendamentos.`
            : `Tem certeza que deseja ativar este centro?<br><br>O centro voltará a aparecer para novos agendamentos.`,
        confirmText: acaoTexto,
        cancelText: 'Cancelar',
        confirmColor: ativo ? '#EF4444' : '#10B981',
        onConfirm: async () => {
            try {
                window.closeModal();
                
                const { error } = await supabase
                    .from('centros')
                    .update({ ativo: !ativo })
                    .eq('id', id);
                
                if (error) throw error;
                
                setTimeout(() => {
                    successModal({
                        title: `Centro ${ativo ? 'Pausado' : 'Ativado'}!`,
                        message: ativo 
                            ? 'O centro foi pausado com sucesso.'
                            : 'O centro foi ativado com sucesso.',
                        confirmText: 'OK',
                        onConfirm: () => {
                            window.closeModal();
                            window.recarregarCentros();
                        }
                    });
                }, 300);
                
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                errorModal({
                    title: 'Erro ao Alterar Status',
                    message: error.message || 'Ocorreu um erro ao alterar o status do centro.',
                    confirmText: 'OK',
                    onConfirm: () => {
                        window.closeModal();
                    }
                });
            }
        }
    });
};

// Recarregar centros
window.recarregarCentros = function() {
    if (window.loadPage) {
        window.loadPage('centros');
    }
};

// Gerenciar horários
window.gerenciarHorarios = function(centroId, centroNome) {
    if (window.loadPage) {
        window.loadPage('horarios', { centroId, centroNome });
    }
};

// ============================================
// FUNÇÃO: Salvar Centro
// ============================================
async function salvarCentro() {
    const id = document.getElementById('centroId').value;
    const nome = document.getElementById('nome').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const imagem = document.getElementById('imagem').value.trim();
    const ativo = document.getElementById('ativo').checked;
    
    if (!nome || !bairro || !endereco) {
        warningModal({
            title: 'Campos Obrigatórios',
            message: 'Preencha: Nome, Bairro e Endereço.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
        return;
    }
    
    const btn = document.querySelector('#formCentro button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    
    try {
        const dados = {
            nome,
            bairro,
            endereco,
            telefone: telefone || null,
            imagem: imagem || null,
            ativo
        };
        
        let result;
        if (id) {
            result = await supabase
                .from('centros')
                .update(dados)
                .eq('id', id);
        } else {
            result = await supabase
                .from('centros')
                .insert([dados]);
        }
        
        if (result.error) throw result.error;
        
        window.fecharModalCentro();
        
        successModal({
            title: id ? 'Centro Atualizado!' : 'Centro Cadastrado!',
            message: id ? 'O centro foi atualizado com sucesso.' : 'O centro foi cadastrado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
                window.closeModal();
                window.recarregarCentros();
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao salvar centro:', error);
        errorModal({
            title: 'Erro ao Salvar',
            message: error.message || 'Ocorreu um erro ao salvar o centro.',
            confirmText: 'OK',
            onConfirm: () => window.closeModal()
        });
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save mr-2"></i>${id ? 'Atualizar' : 'Cadastrar'}`;
    }
}

// ============================================
// FUNÇÃO: Filtrar Centros
// ============================================
function filtrarCentros() {
    const search = document.getElementById('searchInputCentros')?.value?.toLowerCase() || '';
    const status = document.getElementById('filterStatusCentros')?.value || 'todos';
    
    const cards = document.querySelectorAll('#centrosListAdmin .card-hover');
    
    cards.forEach(card => {
        const nome = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const bairro = card.querySelector('.text-white\\/70')?.textContent?.toLowerCase() || '';
        const endereco = card.querySelector('.text-gray-500')?.textContent?.toLowerCase() || '';
        const isAtivo = card.querySelector('.bg-green-500') !== null;
        
        let matchesSearch = nome.includes(search) || bairro.includes(search) || endereco.includes(search);
        let matchesStatus = true;
        
        if (status === 'ativo') matchesStatus = isAtivo;
        if (status === 'inativo') matchesStatus = !isAtivo;
        
        card.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
}

// ============================================
// EVENTOS
// ============================================
export function setupCentrosEvents() {
    // Formulário de centro
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'formCentro') {
            e.preventDefault();
            salvarCentro();
        }
    });
    
    // Filtros
    document.addEventListener('input', function(e) {
        if (e.target.id === 'searchInputCentros') {
            filtrarCentros();
        }
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.id === 'filterStatusCentros') {
            filtrarCentros();
        }
    });
    
    // ESC para fechar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.fecharModalCentro();
        }
    });
}