// ============================================
// ADMIN - GERENCIAMENTO DE CENTROS
// ============================================

import { supabase, getCurrentUser } from '../../config/supabase.js';

// ============================================
// IMPORTAR COMPONENTE DE MENU
// ============================================
import { renderMenu, initMenuMobile, initLogout, updateUserMenu } from '../../components/menu.js';

// ============================================
// RENDERIZAR MENU
// ============================================
document.getElementById('sidebarContainer').innerHTML = renderMenu('centros');
initMenuMobile();
initLogout();

// ============================================
// ELEMENTOS DO DOM
// ============================================
const centrosList = document.getElementById('centrosList');
const totalCentrosEl = document.getElementById('totalCentros');
const totalHorariosEl = document.getElementById('totalHorarios');
const totalVagasEl = document.getElementById('totalVagas');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const btnLogout = document.getElementById('btnLogout');

// Modal
const modal = document.getElementById('modalCentro');
const formCentro = document.getElementById('formCentro');
const modalTitle = document.getElementById('modalTitle');
const btnSubmitText = document.getElementById('btnSubmitText');
const centroId = document.getElementById('centroId');

// ============================================
// FUNÇÕES: Menu Hamburguer
// ============================================
let sidebarOpen = false;

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Fechar menu ao clicar em link (mobile)
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            window.toggleSidebar();
        }
    });
});

// ============================================
// FUNÇÃO: Logout
// ============================================
async function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        await supabase.auth.signOut();
        window.location.href = '../../../index.html';
    }
}

btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

// ============================================
// FUNÇÃO: Carregar Centros
// ============================================
async function loadCentros() {
    try {
        const search = searchInput.value.toLowerCase();
        const status = filterStatus.value;
        
        let query = supabase
            .from('centros')
            .select('*')
            .order('nome', { ascending: true });
        
        // Filtrar por status
        if (status === 'ativo') {
            query = query.eq('ativo', true);
        } else if (status === 'inativo') {
            query = query.eq('ativo', false);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Filtrar por busca (cliente-side)
        let filteredData = data;
        if (search) {
            filteredData = data.filter(c => 
                c.nome.toLowerCase().includes(search) ||
                c.bairro.toLowerCase().includes(search) ||
                c.endereco.toLowerCase().includes(search)
            );
        }
        
        // Atualizar estatísticas
        totalCentrosEl.textContent = data.length;
        
        // Buscar horários para estatísticas
        const { data: horarios, error: horariosError } = await supabase
            .from('horarios')
            .select('*');
        
        if (!horariosError && horarios) {
            totalHorariosEl.textContent = horarios.length;
            
            // Calcular total de vagas
            let totalVagas = 0;
            horarios.forEach(h => {
                totalVagas += h.vagas || 0;
            });
            totalVagasEl.textContent = totalVagas;
        }
        
        if (filteredData.length === 0) {
            centrosList.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-12">
                    <i class="fas fa-dumbbell text-6xl mb-4 block text-gray-300"></i>
                    <p class="text-lg font-medium">Nenhum centro encontrado</p>
                    <p class="text-sm mt-1">Clique em "Novo Centro" para cadastrar</p>
                </div>
            `;
            return;
        }
        
        // Renderizar cards
        centrosList.innerHTML = filteredData.map(centro => `
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden card-hover">
                <div class="relative h-48 bg-[#FEF3E8]">
                    <img 
                        src="${centro.imagem || `https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200`}" 
                        alt="${centro.nome}"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(centro.nome)}&background=F4742B&color=fff&size=200'"
                    >
                    <div class="absolute top-3 right-3 flex gap-2">
                        <span class="px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                            centro.ativo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }">
                            ${centro.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                        </span>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div class="absolute bottom-3 left-3">
                        <h3 class="text-white font-bold text-lg drop-shadow-lg">${centro.nome}</h3>
                        <p class="text-white/80 text-sm drop-shadow-lg">${centro.bairro}</p>
                    </div>
                </div>
                
                <div class="p-5">
                    <div class="space-y-2 text-sm">
                        <p class="text-gray-600">
                            <i class="fas fa-location-dot text-[#F4742B] w-5"></i>
                            ${centro.endereco}
                        </p>
                        ${centro.telefone ? `
                            <p class="text-gray-600">
                                <i class="fas fa-phone text-[#F4742B] w-5"></i>
                                ${centro.telefone}
                            </p>
                        ` : ''}
                        <p class="text-gray-600">
                            <i class="fas fa-clock text-[#F4742B] w-5"></i>
                            ${centro.horario_funcionamento || '06:00 - 22:00'}
                        </p>
                    </div>
                    
                    <div class="flex gap-2 mt-4">
                        <button onclick="editarCentro('${centro.id}')" 
                                class="flex-1 px-4 py-2 border-2 border-[#F4742B] text-[#F4742B] rounded-lg font-medium hover:bg-[#F4742B] hover:text-white transition">
                            <i class="fas fa-edit mr-1"></i> Editar
                        </button>
                        <button onclick="gerenciarHorarios('${centro.id}')" 
                                class="flex-1 px-4 py-2 bg-[#F4742B] text-white rounded-lg font-medium hover:bg-[#E0601A] transition">
                            <i class="fas fa-clock mr-1"></i> Horários
                        </button>
                        <button onclick="toggleCentroStatus('${centro.id}', ${centro.ativo})" 
                                class="px-4 py-2 border-2 ${centro.ativo ? 'border-red-500 text-red-500 hover:bg-red-500' : 'border-green-500 text-green-500 hover:bg-green-500'} rounded-lg font-medium hover:text-white transition">
                            <i class="fas ${centro.ativo ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar centros:', error);
        centrosList.innerHTML = `
            <div class="col-span-full text-center text-red-500 py-8">
                <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
                Erro ao carregar centros. Tente novamente.
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Recarregar Centros
// ============================================
window.recarregarCentros = function() {
    loadCentros();
};

// ============================================
// FUNÇÃO: Abrir Modal de Cadastro
// ============================================
window.abrirModalCadastro = function() {
    modalTitle.textContent = 'Novo Centro';
    btnSubmitText.textContent = 'Cadastrar';
    centroId.value = '';
    formCentro.reset();
    document.getElementById('ativo').checked = true;
    document.getElementById('vagas').value = 10;
    document.getElementById('hora_inicio').value = '06:00';
    document.getElementById('hora_fim').value = '22:00';
    modal.classList.add('active');
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
        
        modalTitle.textContent = 'Editar Centro';
        btnSubmitText.textContent = 'Atualizar';
        centroId.value = data.id;
        document.getElementById('nome').value = data.nome;
        document.getElementById('bairro').value = data.bairro;
        document.getElementById('endereco').value = data.endereco;
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('imagem').value = data.imagem || '';
        document.getElementById('ativo').checked = data.ativo;
        document.getElementById('vagas').value = data.vagas_padrao || 10;
        
        // Extrair horários do campo horario_funcionamento
        if (data.horario_funcionamento) {
            const horarios = data.horario_funcionamento.split(' - ');
            if (horarios.length === 2) {
                document.getElementById('hora_inicio').value = horarios[0];
                document.getElementById('hora_fim').value = horarios[1];
            }
        }
        
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Erro ao carregar centro:', error);
        alert('Erro ao carregar dados do centro.');
    }
};

// ============================================
// FUNÇÃO: Fechar Modal
// ============================================
window.fecharModal = function(event) {
    if (event && event.target !== event.currentTarget) return;
    modal.classList.remove('active');
};

// ============================================
// FUNÇÃO: Toggle Status do Centro
// ============================================
window.toggleCentroStatus = async function(id, ativo) {
    const novoStatus = !ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';
    
    if (!confirm(`Tem certeza que deseja ${acao} este centro?`)) return;
    
    try {
        const { error } = await supabase
            .from('centros')
            .update({ ativo: novoStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadCentros();
        
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        alert('Erro ao alterar status do centro.');
    }
};

// ============================================
// FUNÇÃO: Gerenciar Horários
// ============================================
window.gerenciarHorarios = function(centroId) {
    // TODO: Implementar página de gerenciamento de horários
    alert('Funcionalidade em desenvolvimento!\nEm breve você poderá gerenciar os horários deste centro.');
};

// ============================================
// EVENTO: Formulário de Centro
// ============================================
formCentro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = centroId.value;
    const nome = document.getElementById('nome').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const endereco = document.getElementById('endereco').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const imagem = document.getElementById('imagem').value.trim();
    const ativo = document.getElementById('ativo').checked;
    const vagas = parseInt(document.getElementById('vagas').value) || 10;
    const horaInicio = document.getElementById('hora_inicio').value;
    const horaFim = document.getElementById('hora_fim').value;
    const horarioFuncionamento = `${horaInicio} - ${horaFim}`;
    
    if (!nome || !bairro || !endereco) {
        alert('Preencha os campos obrigatórios: Nome, Bairro e Endereço.');
        return;
    }
    
    try {
        const btn = formCentro.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
        
        const dados = {
            nome,
            bairro,
            endereco,
            telefone: telefone || null,
            imagem: imagem || null,
            ativo,
            horario_funcionamento: horarioFuncionamento,
            vagas_padrao: vagas
        };
        
        let result;
        
        if (id) {
            // Atualizar
            result = await supabase
                .from('centros')
                .update(dados)
                .eq('id', id);
        } else {
            // Criar
            result = await supabase
                .from('centros')
                .insert([dados]);
        }
        
        if (result.error) throw result.error;
        
        alert(id ? '✅ Centro atualizado com sucesso!' : '✅ Centro criado com sucesso!');
        fecharModal();
        await loadCentros();
        
    } catch (error) {
        console.error('Erro ao salvar centro:', error);
        alert('Erro ao salvar centro. Tente novamente.');
    } finally {
        const btn = formCentro.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-save mr-2"></i>${id ? 'Atualizar' : 'Cadastrar'}`;
    }
});

// ============================================
// EVENTOS: Filtros e Busca
// ============================================
searchInput.addEventListener('input', loadCentros);
filterStatus.addEventListener('change', loadCentros);

// ============================================
// FUNÇÃO: Inicializar
// ============================================
async function init() {
    // Verificar autenticação
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '../../../index.html';
        return;
    }
    
    // Carregar centros
    await loadCentros();
    
    console.log('✅ Página de Centros carregada!');
}

// Inicializar
document.addEventListener('DOMContentLoaded', init);

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModal();
    }
});