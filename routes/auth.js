const express = require('express');
const { executeQuery } = require('../config/database');

const router = express.Router();

// Rota para login
router.post('/login', async (req, res) => {
    try {
        const { senha } = req.body;

        // Validar entrada
        if (!senha || senha.length !== 6) {
            return res.status(400).json({ 
                error: 'Senha deve ter exatamente 6 dígitos' 
            });
        }

        // Buscar usuário pela senha
        const query = `
            SELECT u.id, u.login, u.senha, p.nome_perfil 
            FROM usuarios u 
            JOIN perfis p ON u.perfil_id = p.id 
            WHERE u.senha = ?
        `;
        
        const users = await executeQuery(query, [senha]);

        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Senha inválida' 
            });
        }

        const user = users[0];

        // Salvar dados do usuário na sessão
        req.session.userId = user.id;
        req.session.userLogin = user.login;
        req.session.userPerfil = user.nome_perfil;

        res.json({
            success: true,
            user: {
                id: user.id,
                login: user.login,
                perfil: user.nome_perfil
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Rota para logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                error: 'Erro ao fazer logout' 
            });
        }
        res.json({ success: true });
    });
});

// Rota para verificar se o usuário está autenticado
router.get('/check', (req, res) => {
    if (req.session.userId) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.userId,
                login: req.session.userLogin,
                perfil: req.session.userPerfil
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            error: 'Usuário não autenticado' 
        });
    }
    next();
};

// Middleware para verificar se é administrador
const requireAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ 
            error: 'Usuário não autenticado' 
        });
    }
    if (req.session.userPerfil !== 'administrador') {
        return res.status(403).json({ 
            error: 'Acesso negado. Apenas administradores.' 
        });
    }
    next();
};

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;

