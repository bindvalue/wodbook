// ============================================
// COMPONENTE: Menu Lateral (Versão Simplificada - SEM CONDICIONAIS)
// ============================================

export function renderMenu(activePage = 'dashboard') {
    const isAdmin = true;
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    const menuHTML = `
        <aside id="sidebar" class="sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}">
            <!-- Logo -->
             <div class="flex items-center justify-center p-4 border-b border-white/10">
                <div class="flex items-center justify-center w-full">
                    <img src="src/img/logo_wodbook.png" 
                         alt="WODBOOK" 
                         class="w-20 h-20 object-contain flex-shrink-0"
                         onerror="this.src='https://ui-avatars.com/api/?name=WODBOOK&background=F4742B&color=fff&size=48'">
                </div>
                <button onclick="window.toggleSidebarMobile()" class="md:hidden text-white/60 hover:text-white transition absolute right-4">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
                <button onclick="window.toggleSidebarMobile()" class="md:hidden text-white/60 hover:text-white transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- Menu -->
            <nav class="p-3 space-y-1" id="mainNav">
                <!-- Dashboard -->
                <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition ${activePage === 'dashboard' ? 'active' : 'text-white/70 hover:text-white'}" data-page="dashboard" title="Dashboard">
                    <i class="fas fa-home text-lg w-5 ${activePage === 'dashboard' ? 'text-[#F4742B]' : ''} flex-shrink-0"></i>
                    <span>Dashboard</span>
                </a>
                
                <!-- Centros (Admin) -->
                ${isAdmin ? `
                    <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition ${activePage === 'centros' ? 'active' : 'text-white/70 hover:text-white'}" data-page="centros" title="Centros">
                        <i class="fas fa-dumbbell text-lg w-5 ${activePage === 'centros' ? 'text-[#F4742B]' : ''} flex-shrink-0"></i>
                        <span>Centros</span>
                    </a>
                ` : ''}
                
                <!-- Alunos -->
                <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition text-white/70 hover:text-white" data-page="alunos" title="Alunos">
                    <i class="fas fa-users text-lg w-5 flex-shrink-0"></i>
                    <span>Alunos</span>
                </a>
                
                <!-- Agendamentos -->
                <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition text-white/70 hover:text-white" data-page="agendamentos" title="Agendamentos">
                    <i class="fas fa-calendar-check text-lg w-5 flex-shrink-0"></i>
                    <span>Agendamentos</span>
                    <span class="ml-auto bg-[#F4742B] text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                </a>
                
                <!-- Separador -->
                <div class="border-t border-white/10 my-3"></div>
                
                <!-- Configurações -->
                <a href="#" class="nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition text-white/70 hover:text-white" data-page="configuracoes" title="Configurações">
                    <i class="fas fa-cog text-lg w-5 flex-shrink-0"></i>
                    <span>Configurações</span>
                </a>
                
                <!-- Sair -->
                <a href="#" id="btnLogout" class="nav-item flex items-center gap-3 px-3 py-3 rounded-lg transition text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <i class="fas fa-sign-out-alt text-lg w-5 flex-shrink-0"></i>
                    <span>Sair</span>
                </a>
            </nav>
            
            <!-- Footer com usuário -->
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/10">
                <div class="flex items-center gap-3">
                    <img id="userAvatarMenu" src="https://ui-avatars.com/api/?name=Usuário&background=F4742B&color=fff" 
                         alt="Avatar" class="w-10 h-10 rounded-full border-2 border-[#F4742B] flex-shrink-0">
                    <div class="user-info">
                        <p id="userNameMenu" class="text-sm font-medium text-white">Carregando...</p>
                        <p class="text-xs text-white/50">${isAdmin ? 'Administrador' : 'Aluno'}</p>
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
            
            // Remover listeners antigos para evitar duplicação
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
    
    if (!sidebar || !mainContent) return;
    
    if (collapsed) {
        sidebar.classList.add('sidebar-collapsed');
        mainContent.classList.add('main-content-expanded');
    } else {
        sidebar.classList.remove('sidebar-collapsed');
        mainContent.classList.remove('main-content-expanded');
    }
}

// ============================================
// FUNÇÃO: Atualizar Perfil do Usuário
// ============================================
export function updateUserMenu(user) {
    const userNameMenu = document.getElementById('userNameMenu');
    const userAvatarMenu = document.getElementById('userAvatarMenu');
    
    if (userNameMenu) {
        const nome = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário';
        userNameMenu.textContent = nome;
    }
    
    if (userAvatarMenu) {
        const nome = user?.user_metadata?.nome || 'Usuário';
        userAvatarMenu.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=F4742B&color=fff`;
    }
}