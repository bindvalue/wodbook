// ============================================
// COMPONENTE: Rodapé
// ============================================

export function renderFooter() {
    const anoAtual = new Date().getFullYear();
    
    return `
        <footer class="bg-gradient-to-r from-[#4B4B4D] to-[#333333] text-white mt-6 py-2.5 px-6">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <div class="text-xs text-gray-400 flex items-center gap-2">
                    <i class="fas fa-copyright text-[10px]"></i>
                    ${anoAtual} CrossFit Agendamentos
                </div>
                <div class="text-xs text-gray-400 flex flex-wrap items-center justify-center gap-2">
                    <span class="text-gray-500">Desenvolvido por</span>
                    <a href="https://bindvalue.dev" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="text-[#F4742B] hover:text-[#FF8F4A] font-medium transition hover:underline">
                        Luiz Fernando Corsini
                    </a>
                    <span class="text-gray-600">|</span>
                    <a href="https://bindvalue.dev" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="text-gray-500 hover:text-white transition text-[10px]">
                        BindValue.dev
                    </a>
                </div>
            </div>
        </footer>
    `;
}

// ============================================
// FUNÇÃO: Inicializar Rodapé
// ============================================
export function initFooter() {
    const footerContainer = document.getElementById('footerContainer');
    if (footerContainer) {
        footerContainer.innerHTML = renderFooter();
        
    } else {
        console.warn('⚠️ footerContainer não encontrado');
    }
}