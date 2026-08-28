import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, warningModal, infoModal } from '../components/modal.js';
import { loadPage } from './router.js';

// ============================================
// FUNÇÃO: Carregar Conteúdo de Centros
// ============================================
export async function loadCentrosContent() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    // Buscar centros
    const { data: centros, error } = await supabase
        .from('centros')
        .select('*')
        .order('nome', { ascending: true });
    
    if (error) {
        console.error('Erro ao carregar centros:', error);
        return `
            <div class="text-center text-red-500 py-12">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar centros. Tente novamente.
            </div>
        `;
    }
    
    // Buscar horários para estatísticas
    const { data: horarios } = await supabase.from('horarios').select('*');
    let totalVagas = 0;
    horarios?.forEach(h => { totalVagas += h.vagas || 0; });
    
    return `
        <!-- Modal de Cadastro/Edição -->
        <div id="modalCentro" class="modal-overlay" onclick="window.fecharModalCentro(event)">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-[#4B4B4D]">
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
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: CrossFit Centro">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-map-pin text-[#F4742B] mr-1"></i> Bairro *
                        </label>
                        <input type="text" id="bairro" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: Centro">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-location-dot text-[#F4742B] mr-1"></i> Endereço Completo *
                        </label>
                        <input type="text" id="endereco" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-phone text-[#F4742B] mr-1"></i> Telefone
                        </label>
                        <input type="tel" id="telefone"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="(11) 99999-9999">
                    </div>
                    
                    <!-- ✅ CAMPO DE IMAGEM - ADICIONADO -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-image text-[#F4742B] mr-1"></i> URL da Imagem
                        </label>
                        <input type="url" id="imagem"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
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
                                class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-lg font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                            <i class="fas fa-save mr-2"></i>
                            <span id="btnSubmitText">Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Estatísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total de Centros</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="totalCentrosAdmin">${centros?.length || 0}</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-dumbbell text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Total de Horários</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="totalHorariosAdmin">${horarios?.length || 0}</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-clock text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm card-hover">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">Vagas Totais</p>
                        <p class="text-3xl font-bold text-[#4B4B4D]" id="totalVagasAdmin">${totalVagas}</p>
                    </div>
                    <div class="bg-[#FEF3E8] p-3 rounded-full">
                        <i class="fas fa-users text-[#F4742B] text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Barra de busca e ações -->
        <div class="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" id="searchInputCentros" 
                               placeholder="Buscar centros por nome, bairro ou endereço..."
                               class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition">
                    </div>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <select id="filterStatusCentros" class="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-white">
                        <option value="todos">Todos os centros</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                    <button onclick="window.recarregarCentros()" class="px-4 py-2 bg-[#FEF3E8] text-[#F4742B] rounded-lg hover:bg-[#F4742B] hover:text-white transition">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="window.abrirModalCadastro()" class="px-4 py-2 bg-[#F4742B] text-white rounded-lg hover:bg-[#E0601A] transition flex items-center gap-2">
                        <i class="fas fa-plus"></i>
                        <span class="hidden sm:inline">Novo Centro</span>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de Centros - USANDO A FUNÇÃO renderCentrosCards -->
        <div id="centrosListAdmin" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            ${renderCentrosCards(centros)}
        </div>
    `;
}

// ============================================
// RENDER: Modal de Centro
// ============================================
function renderModalCentro() {
    return `
        <div id="modalCentro" class="modal-overlay" onclick="window.fecharModalCentro(event)">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-[#4B4B4D]">
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
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: CrossFit Centro">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-map-pin text-[#F4742B] mr-1"></i> Bairro *
                        </label>
                        <input type="text" id="bairro" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: Centro">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-location-dot text-[#F4742B] mr-1"></i> Endereço Completo *
                        </label>
                        <input type="text" id="endereco" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            <i class="fas fa-phone text-[#F4742B] mr-1"></i> Telefone
                        </label>
                        <input type="tel" id="telefone"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition"
                               placeholder="(11) 99999-9999">
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <input type="checkbox" id="ativo" checked
                               class="w-4 h-4 text-[#F4742B] focus:ring-[#F4742B] border-gray-300 rounded">
                        <label for="ativo" class="text-sm font-medium text-gray-700">Centro ativo</label>
                    </div>
                    
                    <div class="flex gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onclick="window.fecharModalCentro()"
                                class="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit"
                                class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-lg font-semibold hover:bg-[#E0601A] transition hover:shadow-lg">
                            <i class="fas fa-save mr-2"></i>
                            <span id="btnSubmitText">Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// ============================================
// RENDER: Cards de Centros (REFINADO)
// ============================================
function renderCentrosCards(centros) {
    if (centros?.length === 0) {
        return `
            <div class="col-span-full text-center text-gray-500 py-12">
                <i class="fas fa-dumbbell text-6xl mb-4 block text-gray-300"></i>
                <p class="text-lg font-medium">Nenhum centro encontrado</p>
                <p class="text-sm mt-1">Clique em "Novo Centro" para cadastrar</p>
            </div>
        `;
    }
    
    return centros.map(centro => `
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100 transition-all duration-300 hover:shadow-xl group" data-centro-id="${centro.id}">
            <!-- Imagem com overlay -->
            <div class="relative h-48 bg-gradient-to-br from-[#FEF3E8] to-[#FFF0E0] overflow-hidden">
                <img src="${centro.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=300&font-size=0.4`}" 
                     alt="${centro.nome}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     loading="lazy"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=300&font-size=0.4'">
                
                <!-- Badge de status -->
                <div class="absolute top-3 right-3 flex gap-2">
                    <span class="px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 
                        ${centro.ativo 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'}">
                        <span class="w-1.5 h-1.5 rounded-full ${centro.ativo ? 'bg-white animate-pulse' : 'bg-gray-300'}"></span>
                        ${centro.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
                
                <!-- Gradiente e título -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div class="absolute bottom-3 left-3 right-3">
                    <h3 class="text-white font-bold text-lg drop-shadow-lg truncate">${centro.nome}</h3>
                    <p class="text-white/80 text-sm drop-shadow-lg flex items-center gap-1">
                        <i class="fas fa-map-pin text-xs"></i> ${centro.bairro}
                    </p>
                </div>
            </div>
            
            <!-- Conteúdo do card -->
            <div class="p-4">
                <!-- Endereço -->
                <div class="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <i class="fas fa-location-dot text-[#F4742B] mt-0.5"></i>
                    <span class="line-clamp-2">${centro.endereco}</span>
                </div>
                
                <!-- Telefone (se existir) -->
                ${centro.telefone ? `
                    <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <i class="fas fa-phone text-[#F4742B]"></i>
                        <span>${centro.telefone}</span>
                    </div>
                ` : ''}
                
                <!-- Horário de funcionamento -->
                <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <i class="fas fa-clock text-[#F4742B]"></i>
                    <span>${centro.horario_funcionamento || '06:00 - 22:00'}</span>
                </div>
                
                <!-- Informações adicionais -->
                <div class="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span class="flex items-center gap-1">
                        <i class="fas fa-calendar-check text-[#F4742B]"></i>
                        ${centro.vagas_padrao || 10} vagas
                    </span>
                    <span class="flex items-center gap-1">
                        <i class="fas fa-clock text-[#F4742B]"></i>
                        ${centro.horario_funcionamento ? 'Funcionando' : 'Horário flexível'}
                    </span>
                </div>
                
                <!-- Botões de ação -->
                <div class="flex gap-2">
                    <button onclick="window.editarCentro('${centro.id}')" 
                            class="flex-1 px-3 py-2 border-2 border-[#F4742B] text-[#F4742B] rounded-lg font-medium text-sm hover:bg-[#F4742B] hover:text-white transition-all duration-200 hover:shadow-md flex items-center justify-center gap-1.5">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="window.gerenciarHorarios('${centro.id}', '${centro.nome}')" 
                            class="flex-1 px-3 py-2 bg-[#F4742B] text-white rounded-lg font-medium text-sm hover:bg-[#E0601A] transition-all duration-200 hover:shadow-md flex items-center justify-center gap-1.5">
                        <i class="fas fa-clock"></i> Horários
                    </button>
                    <button onclick="window.toggleCentroStatus('${centro.id}', ${centro.ativo})" 
                            class="px-3 py-2 border-2 rounded-lg font-medium text-sm transition-all duration-200 hover:shadow-md flex items-center justify-center gap-1.5
                            ${centro.ativo 
                                ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white' 
                                : 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white'}">
                        <i class="fas ${centro.ativo ? 'fa-pause' : 'fa-play'}"></i>
                        ${centro.ativo ? 'Pausar' : 'Ativar'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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
        
        console.log('📦 Dados do centro para editar:', data); // Debug
        
        const modal = document.getElementById('modalCentro');
        if (!modal) return;
        
        document.getElementById('modalCentroTitle').textContent = 'Editar Centro';
        document.getElementById('btnSubmitText').textContent = 'Atualizar';
        document.getElementById('centroId').value = data.id;
        
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('endereco').value = data.endereco || '';
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('imagem').value = data.imagem || ''; // ← ADICIONADO
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
// FUNÇÃO: Toggle Status do Centro (REFINADO)
// ============================================
window.toggleCentroStatus = async function(id, ativo) {
    const acao = ativo ? 'pausar' : 'ativar';
    const acaoTexto = ativo ? 'Pausar' : 'Ativar';
    const cor = ativo ? '#EF4444' : '#10B981';
    
    confirmModal({
        title: `${acaoTexto} Centro`,
        message: ativo 
            ? `Tem certeza que deseja pausar este centro?<br><br><strong>ATENÇÃO:</strong> Ao pausar, o centro não aparecerá para novos agendamentos, mas os agendamentos existentes serão mantidos.`
            : `Tem certeza que deseja ativar este centro?<br><br>O centro voltará a aparecer para novos agendamentos.`,
        confirmText: acaoTexto,
        cancelText: 'Cancelar',
        confirmColor: cor,
        onConfirm: async () => {
            try {
                // Fechar o modal de confirmação primeiro
                window.closeModal();
                
                const { error } = await supabase
                    .from('centros')
                    .update({ ativo: !ativo })
                    .eq('id', id);
                
                if (error) throw error;
                
                // Mostrar modal de sucesso com um pequeno delay
                setTimeout(() => {
                    successModal({
                        title: `Centro ${ativo ? 'Pausado' : 'Ativado'}!`,
                        message: ativo 
                            ? 'O centro foi pausado com sucesso. Ele não aparecerá para novos agendamentos.'
                            : 'O centro foi ativado com sucesso. Ele já está disponível para novos agendamentos.',
                        confirmText: 'OK',
                        onConfirm: () => {
                            // Fechar o modal de sucesso e recarregar
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

// ============================================
// FUNÇÃO: Excluir Centro (DESABILITADA)
// ============================================
window.excluirCentro = function(id, nome) {
    infoModal({
        title: 'Exclusão não disponível',
        message: 'Os centros não podem ser excluídos. Utilize a opção "Pausar" para desativar o centro temporariamente.',
        confirmText: 'OK'
    });
};

// Recarregar centros
window.recarregarCentros = function() {
    // Recarregar usando o router
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

// ============================================
// FUNÇÃO: Salvar Centro
// ============================================
// ============================================
// FUNÇÃO: Salvar Centro (Criar/Atualizar)
// ============================================
async function salvarCentro() {
    const id = document.getElementById('centroId').value;
    const nome = document.getElementById('nome').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const imagem = document.getElementById('imagem').value.trim(); // ← ADICIONADO
    const ativo = document.getElementById('ativo').checked;
    
    console.log('📝 Salvando centro:', { id, nome, bairro, endereco, telefone, imagem, ativo }); // Debug
    
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
            imagem: imagem || null, // ← ADICIONADO
            ativo
        };
        
        console.log('📦 Dados para salvar:', dados); // Debug
        
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
        const bairro = card.querySelector('.text-sm')?.textContent?.toLowerCase() || '';
        const endereco = card.querySelector('.text-gray-600')?.textContent?.toLowerCase() || '';
        const isAtivo = card.querySelector('.bg-green-500') !== null;
        
        let matchesSearch = nome.includes(search) || bairro.includes(search) || endereco.includes(search);
        let matchesStatus = true;
        
        if (status === 'ativo') matchesStatus = isAtivo;
        if (status === 'inativo') matchesStatus = !isAtivo;
        
        card.style.display = (matchesSearch && matchesStatus) ? 'block' : 'none';
    });
}