import { supabase, getCurrentUser } from '../config/supabase.js';
import { confirmModal, successModal, errorModal, warningModal, infoModal } from '../components/modal.js';

// Re-exportar os modais
export { confirmModal, successModal, errorModal, warningModal, infoModal };

// ============================================
// FUNÇÃO: Mostrar Loader
// ============================================
export function showLoader(container) {
    if (container) {
        container.innerHTML = `
            <div class="page-loader">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
        `;
    }
}

// ============================================
// FUNÇÃO: Fechar Modal (GLOBAL)
// ============================================
window.closeModal = function() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// ============================================
// FUNÇÃO: Logout (CORRIGIDA)
// ============================================
// ============================================
// FUNÇÃO: Logout (COM setTimeout)
// ============================================
export function setupLogout() {
    console.log('🔧 Configurando logout...');
    
    const checkButton = setInterval(() => {
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            clearInterval(checkButton);
            console.log('✅ Botão logout encontrado!');
            
            const newBtn = btnLogout.cloneNode(true);
            btnLogout.parentNode.replaceChild(newBtn, btnLogout);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🔄 Clique no logout detectado!');
                
                confirmModal({
                    title: 'Sair do Sistema',
                    message: 'Tem certeza que deseja sair?',
                    confirmText: 'Sair',
                    cancelText: 'Cancelar',
                    confirmColor: '#EF4444',
                    onConfirm: async () => {
                        try {
                            console.log('🔄 Realizando logout...');
                            await supabase.auth.signOut();
                            console.log('✅ Logout realizado!');
                            
                            // Fechar modal atual
                            window.closeModal();
                            
                            // Mostrar mensagem de sucesso e redirecionar automaticamente
                            successModal({
                                title: 'Até logo! 👋',
                                message: 'Você saiu do sistema com sucesso. Redirecionando...',
                                confirmText: 'OK',
                                onConfirm: () => {
                                    window.closeModal();
                                    // Redirecionar após fechar o modal
                                    setTimeout(() => {
                                        window.location.href = '/login.html';
                                    }, 200);
                                }
                            });
                            
                            // 🔥 FALLBACK: Redirecionar automaticamente após 3 segundos mesmo se não clicar em OK
                            setTimeout(() => {
                                // Verificar se ainda está na página
                                if (document.body) {
                                    window.location.href = '/login.html';
                                }
                            }, 3000);
                            
                        } catch (error) {
                            console.error('❌ Erro ao sair:', error);
                            window.closeModal();
                            errorModal({
                                title: 'Erro ao Sair',
                                message: error.message || 'Ocorreu um erro ao tentar sair.',
                                confirmText: 'OK',
                                onConfirm: () => {
                                    window.closeModal();
                                }
                            });
                        }
                    },
                    onCancel: () => {
                        console.log('❌ Logout cancelado pelo usuário');
                        window.closeModal();
                    }
                });
            });
        }
    }, 100);
    
    setTimeout(() => clearInterval(checkButton), 5000);
}

// ============================================
// FUNÇÃO: Atualizar Avatar do Usuário
// ============================================
export async function updateUserAvatar() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data: profile } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', user.id)
            .single();
        
        const nome = profile?.nome || user.email?.split('@')[0] || 'Usuário';
        
        const userNameMenu = document.getElementById('userNameMenu');
        const userAvatarMenu = document.getElementById('userAvatarMenu');
        const userAvatarHeader = document.getElementById('userAvatarHeader');
        
        if (userNameMenu) userNameMenu.textContent = nome;
        
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff`;
        if (userAvatarMenu) userAvatarMenu.src = avatarUrl;
        if (userAvatarHeader) userAvatarHeader.src = avatarUrl;
        
        return nome;
    } catch (error) {
        console.error('Erro ao atualizar avatar:', error);
    }
}

// ============================================
// FUNÇÃO: Gerar Link do WhatsApp
// ============================================
export function gerarLinkWhatsApp(telefone, mensagem = '') {
    if (!telefone) return null;
    
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
// FUNÇÃO: Abrir WhatsApp
// ============================================
export function abrirWhatsApp(telefone, mensagem = '') {
    const link = gerarLinkWhatsApp(telefone, mensagem);
    if (link) {
        window.open(link, '_blank');
    } else {
        alert('Número de telefone inválido ou não disponível.');
    }
}