// Importar do config (subindo: services -> src -> config)
import { supabase } from '../config/supabase.js';

const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const password = document.getElementById('password').value;
    
    if (!nome || !email || !password) {
        showError('Preencha todos os campos obrigatórios');
        return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        const btn = document.getElementById('btnRegister');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando conta...';
        
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nome, telefone, cpf }
            }
        });
        
        if (error) throw error;
        
        showSuccess('✅ Conta criada com sucesso! Faça login.');
        registerForm.reset();
        
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 3000);
        
    } catch (error) {
        showError(error.message || 'Erro ao criar conta.');
    } finally {
        const btn = document.getElementById('btnRegister');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Criar Conta';
    }
});