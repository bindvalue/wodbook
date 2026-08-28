// ============================================
// COMPONENTE: Modal Reutilizável
// ============================================

export function showModal({
    type = 'confirm',
    title = 'Atenção',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm = null,
    onCancel = null,
    icon = null,
    confirmColor = '#F4742B'
} = {}) {
    
    const safeTitle = title || 'Atenção';
    const safeMessage = message || 'Deseja continuar?';
    const safeConfirmText = confirmText || 'Confirmar';
    const safeCancelText = cancelText || '';
    
    const icons = {
        confirm: 'fa-question-circle',
        alert: 'fa-info-circle',
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const iconColors = {
        confirm: '#F4742B',
        alert: '#3B82F6',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B'
    };
    
    const iconClass = icon || icons[type] || icons.confirm;
    const iconColor = iconColors[type] || iconColors.confirm;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'customModal';
    
    overlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-icon" style="color: ${iconColor};">
                    <i class="fas ${iconClass}"></i>
                </div>
                <button class="modal-close" onclick="window.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <h3 class="modal-title">${safeTitle}</h3>
                <p class="modal-message">${safeMessage}</p>
            </div>
            
            <div class="modal-footer">
                ${type !== 'alert' && safeCancelText ? `
                    <button class="modal-btn modal-btn-cancel" onclick="window.closeModal()">
                        ${safeCancelText}
                    </button>
                ` : ''}
                <button class="modal-btn modal-btn-confirm" 
                        style="background: ${confirmColor};"
                        id="modalConfirmBtn">
                    ${safeConfirmText}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
    
    const confirmBtn = document.getElementById('modalConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            window.closeModal();
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
        });
    }
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            window.closeModal();
            if (onCancel && typeof onCancel === 'function') {
                onCancel();
            }
        }
    });
    
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            window.closeModal();
            if (onCancel && typeof onCancel === 'function') {
                onCancel();
            }
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// ============================================
// FUNÇÃO: Fechar Modal (Global)
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
// MODAIS DE ATALHO
// ============================================

export function confirmModal({
    title = 'Confirmar',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm = null,
    onCancel = null
} = {}) {
    return showModal({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        onConfirm,
        onCancel,
        confirmColor: '#F4742B'
    });
}

export function successModal({
    title = 'Sucesso!',
    message = 'Operação realizada com sucesso.',
    confirmText = 'OK',
    onConfirm = null
} = {}) {
    return showModal({
        type: 'success',
        title: title || 'Sucesso!',
        message: message || 'Operação realizada com sucesso.',
        confirmText: confirmText || 'OK',
        cancelText: null,
        onConfirm,
        confirmColor: '#10B981'
    });
}

export function errorModal({
    title = 'Erro!',
    message = 'Ocorreu um erro ao realizar a operação.',
    confirmText = 'OK',
    onConfirm = null
} = {}) {
    return showModal({
        type: 'error',
        title: title || 'Erro!',
        message: message || 'Ocorreu um erro ao realizar a operação.',
        confirmText: confirmText || 'OK',
        cancelText: null,
        onConfirm,
        confirmColor: '#EF4444'
    });
}

export function warningModal({
    title = 'Atenção!',
    message = 'Verifique as informações antes de continuar.',
    confirmText = 'OK',
    onConfirm = null
} = {}) {
    return showModal({
        type: 'warning',
        title: title || 'Atenção!',
        message: message || 'Verifique as informações antes de continuar.',
        confirmText: confirmText || 'OK',
        cancelText: null,
        onConfirm,
        confirmColor: '#F59E0B'
    });
}

export function infoModal({
    title = 'Informação',
    message = 'Confira os detalhes abaixo.',
    confirmText = 'OK',
    onConfirm = null
} = {}) {
    return showModal({
        type: 'alert',
        title: title || 'Informação',
        message: message || 'Confira os detalhes abaixo.',
        confirmText: confirmText || 'OK',
        cancelText: null,
        onConfirm,
        confirmColor: '#3B82F6'
    });
}