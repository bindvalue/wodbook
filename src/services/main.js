// Importar do config (subindo um nível: services -> src -> config)
import { supabase } from '../config/supabase.js';

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const btnGoogle = document.getElementById('btnGoogle');
const linkRegister = document.getElementById('linkRegister');

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => errorMessage.classList.add('hidden'), 5000);
}

async function handleLogin(email, password) {
    try {
        const btn = document.getElementById('btnLogin');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Entrando...';
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Email ou senha inválidos.');
            }
            throw error;
        }
        
        // Redirecionar para dashboard (na pasta pages)
        window.location.href = 'src/pages/dashboard.html';
        
    } catch (error) {
        showError(error.message || 'Erro ao fazer login.');
        const btn = document.getElementById('btnLogin');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Entrar';
    }
}

async function handleGoogleLogin() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/src/pages/dashboard.html'
            }
        });
        if (error) throw error;
    } catch (error) {
        showError('Erro ao fazer login com Google.');
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        showError('Preencha todos os campos');
        return;
    }
    await handleLogin(email, password);
});

btnGoogle.addEventListener('click', handleGoogleLogin);

linkRegister.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'src/pages/register.html';
});

console.log('🏋️ CrossFit App iniciado!');
console.log('📁 main.js está em src/services/');