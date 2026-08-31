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
// FUNÇÃO: Verificar se usuário é admin
// ============================================
export async function isAdmin() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        return data?.role === 'admin';
    } catch (error) {
        console.error('Erro ao verificar admin:', error);
        return false;
    }
}

// ============================================
// FUNÇÃO: Verificar se usuário está logado e é admin
// ============================================
export async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return false;
    }
    
    const admin = await isAdmin();
    if (!admin) {
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

// ============================================
// FUNÇÃO: Atualizar dados do usuário no localStorage
// ============================================
export async function updateUserData() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            return null;
        }
        
        const { data, error } = await supabase
            .from('usuarios')
            .select('role, nome')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.warn('⚠️ Erro ao buscar role:', error.message);
            localStorage.setItem('userRole', 'user');
            localStorage.setItem('userName', user.email?.split('@')[0] || 'Usuário');
            return { role: 'user', nome: user.email?.split('@')[0] || 'Usuário' };
        }
        
        if (data) {
            localStorage.setItem('userRole', data.role || 'user');
            localStorage.setItem('userName', data.nome || 'Usuário');
            console.log('✅ Dados do usuário salvos:', { role: data.role, nome: data.nome });
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erro ao atualizar dados do usuário:', error);
        localStorage.setItem('userRole', 'user');
        return { role: 'user', nome: 'Usuário' };
    }
}

// ============================================
// FUNÇÃO: Obter role do usuário (do localStorage)
// ============================================
export function getUserRole() {
    return localStorage.getItem('userRole') || 'user';
}

// ============================================
// FUNÇÃO: Logout (COM ANIMAÇÃO DE REDIRECIONAMENTO)
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
                            
                            // Limpar localStorage
                            localStorage.removeItem('userRole');
                            localStorage.removeItem('userName');
                            
                            window.closeModal();
                            
                            // Mostrar animação de logout
                            mostrarAnimacaoLogout();
                            
                            setTimeout(() => {
                                window.location.href = '/login.html';
                            }, 2500);
                            
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
// FUNÇÃO: Mostrar Animação de Logout
// ============================================
function mostrarAnimacaoLogout() {
    const animacaoExistente = document.getElementById('logoutAnimation');
    if (animacaoExistente) {
        animacaoExistente.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'logoutAnimation';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(75, 75, 77, 0.92);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="text-align: center; max-width: 400px; padding: 40px;">
            <div style="width: 80px; height: 80px; margin: 0 auto 24px;">
                <img src="src/img/logo_wodbook.png" 
                     alt="WODBOOK" 
                     style="width: 100%; height: 100%; object-fit: contain; animation: pulse 1.5s ease-in-out infinite;">
            </div>
            <h2 style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: white; margin-bottom: 8px;">
                Até logo! 👋
            </h2>
            <p style="font-family: 'Inter', sans-serif; font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 24px;">
                Você saiu do sistema com sucesso.
            </p>
            <div style="width: 100%; max-width: 300px; margin: 0 auto; background: rgba(255,255,255,0.15); border-radius: 8px; overflow: hidden; height: 4px;">
                <div id="logoutProgress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #F4742B, #FF8F4A); border-radius: 8px; transition: width 0.1s linear;"></div>
            </div>
            <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 12px;">
                Redirecionando...
            </p>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(overlay);
    
    const progressBar = document.getElementById('logoutProgress');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }, 30);
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