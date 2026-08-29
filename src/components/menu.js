// ============================================
// COMPONENTE: Menu Lateral (Estilizado e Moderno)
// ============================================

import { supabase } from '../config/supabase.js';

export function renderMenu(activePage = 'dashboard') {
    // 🔥 Verificar se o usuário é admin (via localStorage)
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    // Definir ícones com cores
    const icons = {
        dashboard: { icon: 'fa-home', color: '#F4742B' },
        centros: { icon: 'fa-dumbbell', color: '#F4742B' },
        alunos: { icon: 'fa-users', color: '#4B4B4D' },
        agendamentos: { icon: 'fa-calendar-check', color: '#4B4B4D' },
        configuracoes: { icon: 'fa-cog', color: '#4B4B4D' },
        logout: { icon: 'fa-sign-out-alt', color: '#EF4444' }
    };
    
    const menuHTML = `
        <aside id="sidebar" class="sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}">
           <!-- Logo com efeito - DUAS VERSÕES -->
            <div class="flex items-center justify-center p-5 border-b border-white/5 relative group">
                <div class="flex items-center justify-center w-full">
                    <div class="relative">
                        <!-- Logo completa (quando expandido) -->
                        <img src="src/img/logo_wodbook.png" 
                            alt="WODBOOK" 
                            class="logo-completa w-auto h-16 object-contain flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                            onerror="this.src='https://ui-avatars.com/api/?name=WODBOOK&background=F4742B&color=fff&size=48'">
                        
                        <!-- Logo ícone (quando colapsado) -->
                        <img src="src/img/favicon.png" 
                            alt="WOD" 
                            class="logo-icone w-12 h-12 object-contain flex-shrink-0 transition-all duration-300 group-hover:scale-105 hidden"
                            onerror="this.src='https://ui-avatars.com/api/?name=W&background=F4742B&color=fff&size=40'">
                        
                        <div class="absolute -inset-1 bg-[#F4742B]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                </div>
                <button onclick="window.toggleSidebarMobile()" class="md:hidden text-white/60 hover:text-white transition absolute right-4 top-1/2 -translate-y-1/2">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- Menu com efeitos modernos -->
            <nav class="p-3 space-y-1" id="mainNav">
                <!-- 📊 Dashboard -->
                <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${activePage === 'dashboard' ? 'active' : 'text-white/70 hover:text-white'}" data-page="dashboard" title="Dashboard">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center ${activePage === 'dashboard' ? 'bg-[#F4742B]/20 text-[#F4742B]' : 'bg-white/5 text-white/60 group-hover:bg-white/10'}" style="transition: all 0.3s ease;">
                        <i class="fas fa-home text-sm"></i>
                    </div>
                    <span class="font-medium">Dashboard</span>
                </a>
                
                <!-- 🏢 Centros - SÓ ADMIN -->
                ${isAdmin ? `
                    <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${activePage === 'centros' ? 'active' : 'text-white/70 hover:text-white'}" data-page="centros" title="Centros">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center ${activePage === 'centros' ? 'bg-[#F4742B]/20 text-[#F4742B]' : 'bg-white/5 text-white/60 group-hover:bg-white/10'}" style="transition: all 0.3s ease;">
                            <i class="fas fa-dumbbell text-sm"></i>
                        </div>
                        <span class="font-medium">Centros</span>
                        ${activePage === 'centros' ? `<span class="ml-auto w-1.5 h-1.5 bg-[#F4742B] rounded-full"></span>` : ''}
                    </a>
                ` : ''}
                
                <!-- 👥 Alunos - SÓ ADMIN -->
                ${isAdmin ? `
                    <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${activePage === 'alunos' ? 'active' : 'text-white/70 hover:text-white'}" data-page="alunos" title="Alunos">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center ${activePage === 'alunos' ? 'bg-[#F4742B]/20 text-[#F4742B]' : 'bg-white/5 text-white/60 group-hover:bg-white/10'}" style="transition: all 0.3s ease;">
                            <i class="fas fa-users text-sm"></i>
                        </div>
                        <span class="font-medium">Alunos</span>
                        ${activePage === 'alunos' ? `<span class="ml-auto w-1.5 h-1.5 bg-[#F4742B] rounded-full"></span>` : ''}
                    </a>
                ` : ''}
                
                <!-- 📅 Agendamentos - SÓ ADMIN (SEM BADGE) -->
                ${isAdmin ? `
                    <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${activePage === 'agendamentos' ? 'active' : 'text-white/70 hover:text-white'}" data-page="agendamentos" title="Agendamentos">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center ${activePage === 'agendamentos' ? 'bg-[#F4742B]/20 text-[#F4742B]' : 'bg-white/5 text-white/60 group-hover:bg-white/10'}" style="transition: all 0.3s ease;">
                            <i class="fas fa-calendar-check text-sm"></i>
                        </div>
                        <span class="font-medium">Agendamentos</span>
                        ${activePage === 'agendamentos' ? `<span class="ml-auto w-1.5 h-1.5 bg-[#F4742B] rounded-full"></span>` : ''}
                    </a>
                ` : ''}
                
                <!-- Separador com gradiente -->
                <div class="relative my-4">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-white/5"></div>
                    </div>
                    <div class="relative flex justify-center">
                        <span class="px-2 text-[10px] text-white/20 bg-[#4B4B4D]">—</span>
                    </div>
                </div>
                
                <!-- ⚙️ Configurações - TODOS VEEM -->
                <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${activePage === 'configuracoes' ? 'active' : 'text-white/70 hover:text-white'}" data-page="configuracoes" title="Configurações">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center ${activePage === 'configuracoes' ? 'bg-[#F4742B]/20 text-[#F4742B]' : 'bg-white/5 text-white/60 group-hover:bg-white/10'}" style="transition: all 0.3s ease;">
                        <i class="fas fa-cog text-sm"></i>
                    </div>
                    <span class="font-medium">Configurações</span>
                    ${activePage === 'configuracoes' ? `<span class="ml-auto w-1.5 h-1.5 bg-[#F4742B] rounded-full"></span>` : ''}
                </a>
                
                <!-- 🚪 Sair - TODOS VEEM -->
                <a href="#" id="btnLogout" class="nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 group">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-all duration-300">
                        <i class="fas fa-sign-out-alt text-sm"></i>
                    </div>
                    <span class="font-medium">Sair</span>
                </a>
            </nav>
            
            <!-- Footer com usuário -->
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                <div class="flex items-center gap-3 group cursor-pointer">
                    <div class="relative">
                        <img id="userAvatarMenu" src="https://ui-avatars.com/api/?name=Usuário&background=F4742B&color=fff&size=40" 
                             alt="Avatar" class="w-10 h-10 rounded-full border-2 border-[#F4742B]/50 group-hover:border-[#F4742B] transition-all duration-300">
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
    `;
    
    return menuHTML;
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
// FUNÇÃO: Atualizar Perfil do Usuário (BUSCANDO DA TABELA PUBLIC)
// ============================================
export async function updateUserMenu(user) {
    const userNameMenu = document.getElementById('userNameMenu');
    const userAvatarMenu = document.getElementById('userAvatarMenu');
    const userRoleMenu = document.getElementById('userRoleMenu');
    
    if (!user) return;
    
    try {
        // 🔥 SELECT DIRETO (agora funciona sem RLS)
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