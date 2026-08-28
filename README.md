# 🏋️ WODBOOK

> **AGENDE. TREINE. SUPERE.**

Sistema completo de gerenciamento de agendamentos para academias de CrossFit e treinamento funcional.

![WODBOOK](src/img/logo_wodbook.png)

---

## 📋 Sobre o Projeto

WODBOOK é uma plataforma de agendamento desenvolvida para academias e centros de treinamento que possuem múltiplas unidades e horários variados. O sistema permite que alunos realizem agendamentos de forma rápida e intuitiva, enquanto administradores gerenciam centros, horários e alunos com facilidade.

### 🎯 Público-alvo

- Academias de CrossFit
- Centros de treinamento funcional
- Boxes de CrossFit com múltiplas unidades

### ✨ Funcionalidades Principais

| Módulo | Funcionalidades |
|--------|-----------------|
| **🔐 Autenticação** | Login com email/senha e Google OAuth |
| **🏢 Centros** | Cadastro, edição, ativação/desativação com imagens |
| **🕐 Horários** | Grade completa por dia da semana com descrições (Team WOD, Open Box) |
| **📅 Agendamentos** | Calendário interativo com filtro por tipo de aula |
| **👥 Alunos** | Lista completa com contagem de agendamentos e WhatsApp |
| **🔔 Notificações** | Dropdown com badge de notificações não lidas |
| **⚙️ Configurações** | Perfil do admin e configurações do sistema |
| **📄 Relatórios** | Exportação de agendamentos para PDF |
| **💬 WhatsApp** | Link direto para contato com alunos |

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5 + CSS3 + TailwindCSS** - Interface responsiva e moderna
- **JavaScript (ES Modules)** - SPA sem frameworks
- **Font Awesome** - Ícones
- **Google Fonts** - Tipografia

### Backend & Serviços
- **Supabase** - Autenticação, banco de dados e storage
- **N8N** - Automação de workflows
- **Evolution API** - Integração com WhatsApp

### Bibliotecas
- **jsPDF** + **jspdf-autotable** - Exportação de PDF
- **Font Awesome** - Ícones

---

## 🗄️ Estrutura do Banco de Dados

```sql
-- Principais tabelas
usuarios          -- Dados dos usuários
centros          -- Unidades de treinamento
horarios         -- Grade de horários por dia
agendamentos     -- Agendamentos realizados
configuracoes    -- Configurações do sistema