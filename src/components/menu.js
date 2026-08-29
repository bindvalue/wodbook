// ============================================
// COMPONENTE: Menu Lateral (Apple Design)
// ============================================

import { supabase } from '../config/supabase.js';

export function renderMenu(activePage = 'dashboard') {
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    // Itens do menu
    const menuItems = [
        { id: 'dashboard', icon: 'fa-house', label: 'Dashboard', adminOnly: false },
        { id: 'centros', icon: 'fa-dumbbell', label: 'Centros', adminOnly: true },
        { id: 'alunos', icon: 'fa-users', label: 'Alunos', adminOnly: true },
        { id: 'agendamentos', icon: 'fa-calendar-check', label: 'Agendamentos', adminOnly: true },
        { id: 'configuracoes', icon: 'fa-gear', label: 'Configurações', adminOnly: false },
    ];
    
    const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);
    
    return `
        <!-- Desktop Sidebar -->
        <aside id="sidebar" class="sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}">
            <!-- Logo -->
            <div class="flex items-center justify-center p-5 border-b border-white/5 relative group">
                <div class="flex items-center justify-center w-full">
                    <div class="relative">
                        <img src="src/img/logo_wodbook.png" 
                             alt="WODBOOK" 
                             class="logo-completa w-auto h-14 object-contain flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                             onerror="this.src='https://ui-avatars.com/api/?name=WODBOOK&background=F4742B&color=fff&size=48'">
                        
                        <img src="src/img/favicon.png" 
                             alt="WOD" 
                             class="logo-icone w-10 h-10 object-contain flex-shrink-0 transition-all duration-300 group-hover:scale-105 hidden"
                             onerror="this.src='https://ui-avatars.com/api/?name=W&background=F4742B&color=fff&size=40'">
                        
                        <div class="absolute -inset-1 bg-[#F4742B]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                </div>
            </div>
            
            <!-- Menu Desktop -->
            <nav class="p-3 space-y-1" id="mainNav">
                ${filteredItems.map(item => `
                    <a href="#" 
                       class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${activePage === item.id ? 'active' : 'text-white/70 hover:text-white'}" 
                       data-page="${item.id}" 
                       title="${item.label}">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center ${activePage === item.id ? 'bg-[#F4742B]/20 text-[#F4742B]' : 'bg-white/5 text-white/60 group-hover:bg-white/10'}" 
                             style="transition: all 0.3s ease;">
                            <i class="fas ${item.icon} text-sm"></i>
                        </div>
                        <span class="font-medium text-sm">${item.label}</span>
                        ${activePage === item.id ? `<span class="ml-auto w-1.5 h-1.5 bg-[#F4742B] rounded-full"></span>` : ''}
                    </a>
                `).join('')}
                
                <!-- Separador -->
                <div class="relative my-4">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-white/5"></div>
                    </div>
                    <div class="relative flex justify-center">
                        <span class="px-2 text-[10px] text-white/20 bg-[#4B4B4D]">—</span>
                    </div>
                </div>
                
                <!-- Sair -->
                <a href="#" id="btnLogout" 
                   class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 group">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-all duration-300">
                        <i class="fas fa-arrow-right-from-bracket text-sm"></i>
                    </div>
                    <span class="font-medium text-sm">Sair</span>
                </a>
            </nav>
            
            <!-- Footer com usuário -->
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                <div class="flex items-center gap-3 group cursor-pointer">
                    <div class="relative">
                        <img id="userAvatarMenu" 
                             src="https://ui-avatars.com/api/?name=Usuário&background=F4742B&color=fff&size=40" 
                             alt="Avatar" 
                             class="w-10 h-10 rounded-full border-2 border-[#F4742B]/50 group-hover:border-[#F4742B] transition-all duration-300">
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#4B4B4D] rounded-full"></div>
                    </div>
                    <div class="user-info flex-1 min-w-0">
                        <p id="userNameMenu" class="text-sm font-medium text-white truncate">Carregando...</p>
                        <div class="flex items-center gap-1.5">
                            <span id="userRoleMenu" class="text-[10px] text-white/40">${isAdmin ? 'Administrador' : 'Aluno'}</span>
                            ${isAdmin ? `
                                <span class="w-1.5 h-1.5 bg-[#F4742B] rounded-full"></span>
                                <span class="text-[10px] text-[#F4742B] font-medium">●</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
        
        <!-- 🔥 MOBILE BOTTOM NAV - Instagram Style -->
        <nav id="mobileBottomNav" class="mobile-bottom-nav">
            <div class="mobile-bottom-nav-inner">
                ${filteredItems.map(item => `
                    <a href="#" 
                       class="mobile-nav-item ${activePage === item.id ? 'active' : ''}" 
                       data-page="${item.id}" 
                       title="${item.label}">
                        <i class="fas ${item.icon} text-xl"></i>
                        <span class="mobile-nav-label">${item.label}</span>
                        ${activePage === item.id ? `<span class="mobile-nav-indicator"></span>` : ''}
                    </a>
                `).join('')}
                
                <a href="#" id="btnLogoutMobile" 
                   class="mobile-nav-item text-red-400/60 hover:text-red-400" 
                   title="Sair">
                    <i class="fas fa-arrow-right-from-bracket text-xl"></i>
                    <span class="mobile-nav-label">Sair</span>
                </a>
            </div>
        </nav>
        
        <!-- 🔥 Mobile Overlay (para fechar sidebar) -->
        <div id="sidebarOverlay" class="sidebar-overlay" onclick="window.toggleSidebarMobile()"></div>
    `;
}

// ============================================
// FUNÇÃO: Inicializar Menu Mobile
// ============================================
export function initMenuMobile() {
    let sidebarOpen = false;
    
    window.toggleSidebarMobile = function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (!sidebar || !overlay) return;
        
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
    
    // Configurar navegação mobile
    setupMobileNavigation();
}

// ============================================
// FUNÇÃO: Navegação Mobile
// ============================================
function setupMobileNavigation() {
    const mobileItems = document.querySelectorAll('.mobile-nav-item[data-page]');
    const mobileLogout = document.getElementById('btnLogoutMobile');
    
    mobileItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            
            if (page && window.loadPage) {
                // Atualizar ativos
                document.querySelectorAll('.mobile-nav-item').forEach(el => {
                    el.classList.remove('active');
                    const indicator = el.querySelector('.mobile-nav-indicator');
                    if (indicator) indicator.remove();
                });
                
                this.classList.add('active');
                
                // Adicionar indicador
                const existingIndicator = this.querySelector('.mobile-nav-indicator');
                if (!existingIndicator) {
                    const indicator = document.createElement('span');
                    indicator.className = 'mobile-nav-indicator';
                    this.appendChild(indicator);
                }
                
                // Carregar página
                window.loadPage(page);
                
                // Fechar sidebar se estiver aberto
                if (window.innerWidth <= 768 && window.toggleSidebarMobile) {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar && sidebar.classList.contains('mobile-open')) {
                        window.toggleSidebarMobile();
                    }
                }
            }
        });
    });
    
    // Logout mobile
    if (mobileLogout) {
        mobileLogout.addEventListener('click', function(e) {
            e.preventDefault();
            const logoutBtn = document.getElementById('btnLogout');
            if (logoutBtn) logoutBtn.click();
        });
    }
}

// ============================================
// FUNÇÃO: Inicializar Collapse Desktop
// ============================================
export function initCollapseDesktop() {
    const checkButton = setInterval(() => {
        const btnCollapse = document.getElementById('btnCollapse');
        if (btnCollapse) {
            clearInterval(checkButton);
            
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            
            setTimeout(() => {
                if (isCollapsed) {
                    aplicarCollapse(true);
                    btnCollapse.innerHTML = '<i class="fas fa-chevron-right text-xl"></i>';
                    btnCollapse.classList.add('rotated');
                }
            }, 50);
            
            const newBtn = btnCollapse.cloneNode(true);
            btnCollapse.parentNode.replaceChild(newBtn, btnCollapse);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const currentState = localStorage.getItem('sidebarCollapsed') === 'true';
                const newState = !currentState;
                
                aplicarCollapse(newState);
                localStorage.setItem('sidebarCollapsed', newState);
                
                if (newState) {
                    this.innerHTML = '<i class="fas fa-chevron-right text-xl"></i>';
                    this.classList.add('rotated');
                } else {
                    this.innerHTML = '<i class="fas fa-chevron-left text-xl"></i>';
                    this.classList.remove('rotated');
                }
            });
        }
    }, 100);
}

function aplicarCollapse(collapsed) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const footer = document.getElementById('footerContainer');
    
    if (!sidebar || !mainContent) return;
    
    if (collapsed) {
        sidebar.classList.add('sidebar-collapsed');
        mainContent.classList.add('main-content-expanded');
        if (footer) footer.style.marginLeft = '70px';
    } else {
        sidebar.classList.remove('sidebar-collapsed');
        mainContent.classList.remove('main-content-expanded');
        if (footer) footer.style.marginLeft = '';
    }
}

// ============================================
// FUNÇÃO: Atualizar Perfil do Usuário
// ============================================
export async function updateUserMenu(user) {
    const userNameMenu = document.getElementById('userNameMenu');
    const userAvatarMenu = document.getElementById('userAvatarMenu');
    const userRoleMenu = document.getElementById('userRoleMenu');
    
    if (!user) return;
    
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('nome, role')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('❌ Erro ao buscar perfil:', error);
            const fallbackNome = user.email?.split('@')[0] || 'Usuário';
            if (userNameMenu) userNameMenu.textContent = fallbackNome;
            return;
        }
        
        const nome = data?.nome || user.email?.split('@')[0] || 'Usuário';
        const role = data?.role || 'user';
        
        if (userNameMenu) userNameMenu.textContent = nome;
        if (userAvatarMenu) {
            userAvatarMenu.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff&size=40`;
        }
        if (userRoleMenu) {
            userRoleMenu.textContent = role === 'admin' ? 'Administrador' : 'Aluno';
        }
        
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', nome);
        
        console.log('✅ Menu atualizado com:', { nome, role });
    } catch (error) {
        console.error('❌ Erro ao atualizar menu:', error);
    }
}