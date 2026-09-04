// ============================================
// COMPONENTE: Formulário de Consentimento
// ============================================

import { supabase, getCurrentUser } from '../config/supabase.js';
import { mascaraTelefone, validarTelefone } from './mascara.js';
import { warningModal, successModal } from './modal.js';

/**
 * Verifica se o usuário já preencheu o formulário de consentimento
 */
export async function usuarioPreencheuFormulario(userId) {
    try {
        const { data, error } = await supabase.rpc('usuario_formulario_preenchido', {
            p_usuario_id: userId
        });
        
        if (error) throw error;
        return data || false;
    } catch (error) {
        console.error('❌ Erro ao verificar formulário:', error);
        return false;
    }
}

/**
 * Busca o formulário do usuário
 */
export async function buscarFormularioUsuario(userId) {
    try {
        const { data, error } = await supabase.rpc('buscar_formulario_usuario', {
            p_usuario_id: userId
        });
        
        if (error) throw error;
        return data || null;
    } catch (error) {
        console.error('❌ Erro ao buscar formulário:', error);
        return null;
    }
}

/**
 * Função global para mostrar/esconder o campo de plataforma
 */
window.togglePlataformaInput = function(valor) {
    const container = document.getElementById('containerPlataforma');
    if (container) {
        container.style.display = valor === 'sim' ? 'block' : 'none';
    }
};

/**
 * Renderiza o modal do formulário de consentimento (LAYOUT OTIMIZADO)
 */
export function renderizarFormularioConsentimento() {
    // Verificar se já existe um modal
    const modalExistente = document.getElementById('modalConsentimento');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'modalConsentimento';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '16px';
    overlay.style.zIndex = '10001';
    
    // 🔥 LAYOUT OTIMIZADO: Cabeçalho compacto, campos menores e mais alinhados
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 640px; width: 100%; max-height: 90vh; overflow: hidden; position: relative; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column;">
            
            <!-- 🔥 HEADER COMPACTO E FIXO -->
            <div style="flex-shrink: 0; padding: 16px 20px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; background: white; border-radius: 20px 20px 0 0;">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-[#FEF3E8] flex items-center justify-center">
                        <i class="fas fa-file-signature text-[#F4742B] text-sm"></i>
                    </div>
                    <div>
                        <h2 class="text-sm font-bold text-[#4B4B4D]">Questionário de Prontidão</h2>
                        <p class="text-[10px] text-gray-400">Preencha para liberar seus agendamentos</p>
                    </div>
                </div>
                <button onclick="window.fecharModalConsentimento()" 
                        class="w-8 h-8 rounded-full hover:bg-gray-100 transition flex items-center justify-center">
                    <i class="fas fa-times text-gray-400"></i>
                </button>
            </div>
            
            <!-- 🔥 BODY COM SCROLL -->
            <form id="formConsentimento" class="space-y-3" style="overflow-y: auto; overflow-x: hidden; flex: 1; padding: 20px; scrollbar-width: thin;">
                <input type="hidden" id="formUsuarioId">
                
                <!-- 🔥 TERMO DE RESPONSABILIDADE (MAIS COMPACTO) -->
                <div class="bg-[#FEF3E8] rounded-xl p-4 border-2 border-[#FED7AA] relative">
                    <!-- Ícone de atenção no topo -->
                    <div class="absolute -top-3 left-4 bg-[#F4742B] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <i class="fas fa-exclamation-triangle text-[8px]"></i>
                        Leia com atenção
                    </div>
                    
                    <h3 class="text-sm font-bold text-[#9A3412] flex items-center gap-2 mb-2 mt-1">
                        <i class="fas fa-shield-alt"></i>
                        Termo de Responsabilidade
                    </h3>
                    
                    <!-- 🔥 TEXTO SEM SCROLL INTERNO - TOTALMENTE LEGÍVEL -->
                    <div class="text-[12px] leading-relaxed text-[#4B4B4D] bg-white rounded-lg p-3 border border-[#FED7AA]">
                        <p>
                            Declaro, para todos os fins de direito, que estou em plenas condições de saúde para a prática de atividades físicas, assumindo total responsabilidade por minha participação. Reconheço que é de minha exclusiva responsabilidade buscar avaliação e acompanhamento médico prévio e regular, bem como informar imediatamente à empresa sobre qualquer alteração em meu estado de saúde ou desconforto que possa surgir durante a prática das atividades. Por meio deste, isento a empresa de toda e qualquer responsabilidade por eventuais problemas de saúde, lesões ou agravos decorrentes da minha participação nas atividades físicas.
                        </p>
                    </div>
                    
                    <div class="flex items-center gap-2 mt-3">
                        <input type="checkbox" id="termoAceito" class="w-4 h-4 text-[#F4742B] focus:ring-[#F4742B] border-gray-300 rounded">
                        <label for="termoAceito" class="text-[11px] font-semibold text-[#9A3412]">Li e aceito o Termo de Responsabilidade *</label>
                    </div>
                </div>
                
                <!-- 🔥 DADOS PESSOAIS (GRID 3 COLUNAS) -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="sm:col-span-2">
                        <label class="block text-[10px] font-medium text-gray-600 mb-1">Nome Completo *</label>
                        <input type="text" id="formNome" 
                               class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white"
                               placeholder="Seu nome" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-medium text-gray-600 mb-1">Idade *</label>
                        <input type="number" id="formIdade" 
                               class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white"
                               placeholder="Idade" min="10" max="120" required>
                    </div>
                </div>
                
                <div>
                    <label class="block text-[10px] font-medium text-gray-600 mb-1">Telefone de Contato *</label>
                    <input type="tel" id="formTelefone" 
                           class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white"
                           placeholder="(XX) XXXXX-XXXX" maxlength="15" required>
                    <p class="text-[9px] text-gray-400 mt-0.5">Exemplo: (11) 99999-9999</p>
                </div>
                
                <!-- 🔥 PLATAFORMA PASS (COMPACTO) -->
                <div class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <label class="block text-[10px] font-medium text-gray-600 mb-2">Você utiliza alguma plataforma de acesso (Gympass, TotalPass, etc.)? *</label>
                    <div class="flex gap-2">
                        <label class="flex-1 flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded-lg border border-gray-200 hover:border-[#F4742B] transition">
                            <input type="radio" name="usa_plataforma" value="sim" class="w-3.5 h-3.5 text-[#F4742B] focus:ring-[#F4742B]" onchange="togglePlataformaInput(this.value)">
                            <span class="text-[11px] text-gray-700">Sim, utilizo</span>
                        </label>
                        <label class="flex-1 flex items-center gap-1.5 cursor-pointer bg-white p-2 rounded-lg border border-gray-200 hover:border-[#F4742B] transition">
                            <input type="radio" name="usa_plataforma" value="nao" class="w-3.5 h-3.5 text-[#F4742B] focus:ring-[#F4742B]" onchange="togglePlataformaInput(this.value)" checked>
                            <span class="text-[11px] text-gray-700">Não utilizo</span>
                        </label>
                    </div>
                    
                    <!-- Input que aparece se o aluno usar plataforma -->
                    <div id="containerPlataforma" style="display: none; margin-top: 8px;">
                        <label class="block text-[10px] font-medium text-gray-600 mb-1">Qual plataforma você utiliza? *</label>
                        <select id="formPlataforma" class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F4742B] focus:border-transparent outline-none transition bg-gray-50 hover:bg-white focus:bg-white">
                            <option value="">Selecione a plataforma</option>
                            <option value="Gympass">Gympass</option>
                            <option value="TotalPass">TotalPass</option>
                            <option value="Wellhub">Wellhub</option>
                            <option value="Sesc">Sesc</option>
                            <option value="Outra">Outra</option>
                        </select>
                    </div>
                </div>
                
                <!-- 🔥 PERGUNTAS (GRID 1 COLUNA MAIS LIMPO) -->
                <div class="space-y-2">
                    <h3 class="text-xs font-semibold text-[#4B4B4D] flex items-center gap-1">
                        <i class="fas fa-question-circle text-[#F4742B] text-[10px]"></i>
                        Questionário de Saúde
                    </h3>
                    
                    ${[
                        { id: 'problema_cardiaco', label: 'Alguma vez seu médico disse que você possui algum problema cardíaco e recomendou que você só praticasse atividade física sob prescrição médica?' },
                        { id: 'dor_torax_atividade', label: 'Você sente dor no tórax quando pratica uma atividade física?' },
                        { id: 'dor_torax_repouso', label: 'No último mês você sentiu dor torácica quando não estava praticando atividade física?' },
                        { id: 'perda_equilibrio', label: 'Você perdeu o equilíbrio em virtude de tonturas ou perdeu a consciência quando estava praticando atividade física?' },
                        { id: 'problema_osseo_articular', label: 'Você tem algum problema ósseo ou articular que poderia ser agravado com a prática de atividades físicas?' },
                        { id: 'medicamento_pressao', label: 'Seu médico já recomendou o uso de medicamentos para controle da sua pressão arterial ou condição cardiovascular?' },
                        { id: 'outra_razao_impeditiva', label: 'Você tem conhecimento de alguma outra razão física que o impeça de participar de atividades físicas?' }
                    ].map((pergunta, index) => `
                        <div class="bg-gray-50/70 rounded-lg p-2.5 border border-gray-100">
                            <div class="flex items-start gap-1.5">
                                <span class="text-[10px] font-medium text-[#F4742B] mt-0.5">${index + 1}.</span>
                                <span class="text-[11px] text-gray-700 flex-1">${pergunta.label}</span>
                            </div>
                            <div class="flex gap-4 mt-1 ml-4">
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="pergunta_${pergunta.id}" value="true" class="w-3 h-3 text-red-500 focus:ring-red-500">
                                    <span class="text-[10px] text-gray-600">SIM</span>
                                </label>
                                <label class="flex items-center gap-1 cursor-pointer">
                                    <input type="radio" name="pergunta_${pergunta.id}" value="false" checked class="w-3 h-3 text-green-500 focus:ring-green-500">
                                    <span class="text-[10px] text-gray-600">NÃO</span>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 🔥 BOTÕES (FIXOS NA PARTE INFERIOR) -->
                <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4 pb-2" style="flex-shrink: 0; border-top: 1px solid #F3F4F6;">
                    <!-- Botão Cancelar (Secundário - Discreto) -->
                    <button type="button" onclick="window.fecharModalConsentimento()"
                            class="w-full sm:flex-1 h-12 px-4 rounded-2xl text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition active:scale-[0.98]">
                        Cancelar
                    </button>
                    
                    <!-- Botão Enviar (Principal - Cor de Destaque) -->
                    <button type="submit"
                            class="w-full sm:flex-1 h-12 px-4 rounded-2xl text-sm font-bold text-white bg-[#F4742B] hover:bg-[#E0601A] transition shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-check text-xs"></i>
                        Enviar Formulário
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(overlay);
    overlay.classList.add('active');
    
    // Adicionar máscara de telefone
    const telefoneInput = document.getElementById('formTelefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            mascaraTelefone(this);
        });
    }
    
    // Evento de submit
    document.getElementById('formConsentimento').addEventListener('submit', async function(e) {
        e.preventDefault();
        await window.salvarFormularioConsentimento();
    });
    
    return overlay;
}

/**
 * Salva o formulário de consentimento
 */
window.salvarFormularioConsentimento = async function() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            alert('Usuário não autenticado.');
            return;
        }
        
        // Coletar dados
        const nome = document.getElementById('formNome').value.trim();
        const idade = parseInt(document.getElementById('formIdade').value);
        const telefone = document.getElementById('formTelefone').value.trim();
        const termoAceito = document.getElementById('termoAceito').checked;
        
        // 🔥 COLETAR DADOS DA PLATAFORMA
        const usaPlataforma = document.querySelector('input[name="usa_plataforma"]:checked')?.value;
        const nomePlataforma = document.getElementById('formPlataforma').value;
        
        // Validações
        if (!nome || !idade || !telefone) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        
        if (idade < 10 || idade > 120) {
            alert('Idade inválida. Informe uma idade entre 10 e 120 anos.');
            return;
        }
        
        if (!validarTelefone(telefone)) {
            alert('Telefone inválido. Use o formato (XX) XXXXX-XXXX');
            return;
        }
        
        if (!termoAceito) {
            alert('Você precisa aceitar o Termo de Responsabilidade para continuar.');
            return;
        }

        // 🔥 VALIDAR PLATAFORMA
        if (usaPlataforma === 'sim' && !nomePlataforma) {
            alert('Por favor, selecione qual plataforma de acesso você utiliza.');
            return;
        }
        
        // Coletar respostas das perguntas
        const perguntas = [
            'problema_cardiaco',
            'dor_torax_atividade',
            'dor_torax_repouso',
            'perda_equilibrio',
            'problema_osseo_articular',
            'medicamento_pressao',
            'outra_razao_impeditiva'
        ];
        
        const respostas = {};
        perguntas.forEach(id => {
            const radio = document.querySelector(`input[name="pergunta_${id}"]:checked`);
            respostas[id] = radio ? radio.value === 'true' : false;
        });
        
        // Verificar se alguma resposta é SIM (risco)
        const temRisco = perguntas.some(id => respostas[id] === true);
        const status = temRisco ? 'rejeitado' : 'aprovado';
        
        // Salvar no banco (🔥 PERSISTINDO DADOS NA TABELA FORMULÁRIO)
        const { data, error } = await supabase
            .from('formulario_consentimento')
            .insert({
                usuario_id: user.id,
                nome_completo: nome,
                idade: idade,
                telefone: telefone,
                termo_aceito: termoAceito,
                
                // 🔥 NOVOS CAMPOS PERSISTENTES
                usa_plataforma: usaPlataforma === 'sim' ? true : false,
                nome_plataforma: usaPlataforma === 'sim' ? nomePlataforma : null,

                // Perguntas de saúde
                problema_cardiaco: respostas.problema_cardiaco,
                dor_torax_atividade: respostas.dor_torax_atividade,
                dor_torax_repouso: respostas.dor_torax_repouso,
                perda_equilibrio: respostas.perda_equilibrio,
                problema_osseo_articular: respostas.problema_osseo_articular,
                medicamento_pressao: respostas.medicamento_pressao,
                outra_razao_impeditiva: respostas.outra_razao_impeditiva,
                status: status
            });
        
        if (error) throw error;
        
        // Fechar modal
        window.fecharModalConsentimento();
        
        // 🔥 Atualizar flag na tabela usuarios (PERSISTINDO DADOS NO PERFIL PARA CONSULTAS RÁPIDAS)
        await supabase
            .from('usuarios')
            .update({ 
                formulario_preenchido: true,
                usa_plataforma: usaPlataforma === 'sim' ? true : false,
                nome_plataforma: usaPlataforma === 'sim' ? nomePlataforma : null
            })
            .eq('id', user.id);
        
        // 🔥 CORREÇÃO: Mostrar modal personalizado com base no risco
        if (temRisco) {
            // Modal de aviso - com o modal do sistema
            warningModal({
                title: '📋 Avaliação Necessária',
                message: `
                    <div style="text-align: left; font-size: 14px; line-height: 1.6; color: #4B4B4D;">
                        <p style="margin-bottom: 12px;">
                            <strong>Olá, ${nome}!</strong> 👋
                        </p>
                        <p style="margin-bottom: 12px;">
                            Identificamos algumas condições que merecem atenção especial antes da prática de atividades físicas.
                        </p>
                        <p style="margin-bottom: 12px; background: #FEF3E8; padding: 12px; border-radius: 10px; border-left: 4px solid #F4742B;">
                            <strong>📌 O que acontece agora?</strong><br>
                            Um de nossos profissionais de educação física irá analisar seu questionário e entrar em contato para uma avaliação mais detalhada.
                        </p>
                        <p style="margin-bottom: 8px;">
                            <strong>✅ Enquanto isso, você pode:</strong>
                        </p>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="padding: 4px 0; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #F4742B;">•</span> 
                                Explorar os centros de treinamento disponíveis
                            </li>
                            <li style="padding: 4px 0; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #F4742B;">•</span> 
                                Conhecer nossa estrutura e horários
                            </li>
                            <li style="padding: 4px 0; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #F4742B;">•</span> 
                                Aguardar o contato da nossa equipe
                            </li>
                        </ul>
                        <p style="margin-top: 12px; font-size: 13px; color: #6B7280;">
                            💚 Sua segurança é nossa prioridade. Estamos aqui para ajudar!
                        </p>
                    </div>
                `,
                confirmText: 'Entendi, aguardarei contato',
                onConfirm: () => {
                    window.closeModal();
                    
                    // 🔥 NÃO LIMPAR A VARIÁVEL AQUI!
                    if (window.agendamentoAposFormulario) {
                        const { centroId, centroNome } = window.agendamentoAposFormulario;
                        import('./calendar.js').then(({ renderCalendar }) => {
                            renderCalendar(centroId, centroNome);
                        });
                    }
                }
            });
        } else {
            // Modal de sucesso - formulário aprovado
            successModal({
                title: '✅ Formulário Aprovado!',
                message: `
                    <div style="text-align: left; font-size: 14px; line-height: 1.6; color: #4B4B4D;">
                        <p style="margin-bottom: 12px;">
                            <strong>Parabéns, ${nome}!</strong> 🎉
                        </p>
                        <p style="margin-bottom: 12px;">
                            Seu Questionário de Prontidão foi aprovado. Você já pode realizar agendamentos em qualquer uma de nossas unidades.
                        </p>
                        <p style="background: #F0FDF4; padding: 12px; border-radius: 10px; border-left: 4px solid #10B981;">
                            <strong>💪 Pronto para começar?</strong><br>
                            Escolha um centro de treinamento e agende sua primeira aula!
                        </p>
                    </div>
                `,
                confirmText: 'Começar Agora',
                onConfirm: () => {
                    window.closeModal();
                    
                    // 🔥 CORREÇÃO: Passa os dados para o calendário ANTES de abrir
                    if (window.agendamentoAposFormulario) {
                        const { centroId, centroNome } = window.agendamentoAposFormulario;
                        
                        // Importa o calendário e abre imediatamente
                        import('./calendar.js').then(({ renderCalendar }) => {
                            // 🔥 NÃO LIMPAR A VARIÁVEL AQUI! O calendário vai ler e limpar sozinho.
                            renderCalendar(centroId, centroNome);
                        });
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar formulário:', error);
        alert('Erro ao salvar formulário. Tente novamente.');
    }
};

/**
 * Fechar modal de consentimento
 */
window.fecharModalConsentimento = function() {
    const modal = document.getElementById('modalConsentimento');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

/**
 * Verificar se o usuário precisa preencher o formulário
 * Retorna true se precisar preencher, false se já preencheu
 */
export async function verificarFormularioPendente() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;
        
        // 🔥 VERIFICAÇÃO CORRETA: Conta os registros na tabela de consentimento
        const { count, error } = await supabase
            .from('formulario_consentimento')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', user.id);
        
        if (error) throw error;
        
        // Se count for 0, precisa preencher
        return count === 0;
        
    } catch (error) {
        console.error('❌ Erro ao verificar formulário pendente:', error);
        return true; // Em caso de erro, bloqueia e obriga a preencher
    }
}