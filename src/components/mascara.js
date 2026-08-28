// ============================================
// MÁSCARA DE TELEFONE
// ============================================

/**
 * Aplica máscara de telefone no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * @param {HTMLInputElement} input - Elemento input
 */
export function mascaraTelefone(input) {
    // Remove tudo que não é número
    let valor = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos) ou 10 dígitos (DDD + 8 dígitos)
    if (valor.length > 11) {
        valor = valor.slice(0, 11);
    }
    
    // Aplica a máscara
    if (valor.length === 0) {
        input.value = '';
        return;
    }
    
    // Formata o número
    let formatado = '';
    
    // Primeiro: adiciona o DDD entre parênteses
    if (valor.length <= 2) {
        formatado = `(${valor}`;
    } else {
        formatado = `(${valor.substring(0, 2)}) `;
        
        if (valor.length <= 7) {
            // Telefone com 8 dígitos (sem o 9)
            formatado += valor.substring(2);
        } else if (valor.length <= 10) {
            // Telefone com 8 dígitos: (XX) XXXX-XXXX
            formatado += `${valor.substring(2, 6)}-${valor.substring(6)}`;
        } else {
            // Telefone com 9 dígitos: (XX) XXXXX-XXXX
            formatado += `${valor.substring(2, 7)}-${valor.substring(7)}`;
        }
    }
    
    input.value = formatado;
}

/**
 * Remove a máscara e retorna apenas os números
 * @param {string} valor - Valor com máscara
 * @returns {string} Apenas números
 */
export function removerMascaraTelefone(valor) {
    return valor.replace(/\D/g, '');
}

/**
 * Valida se o telefone é válido (tem pelo menos 10 dígitos)
 * @param {string} valor - Valor com máscara
 * @returns {boolean} True se for válido
 */
export function validarTelefone(valor) {
    const numeros = removerMascaraTelefone(valor);
    return numeros.length >= 10 && numeros.length <= 11;
}