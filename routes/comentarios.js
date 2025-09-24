const express = require('express');
const { executeQuery, executeInsert } = require('../config/database');
const { requireAuth } = require('./auth');

const router = express.Router();

// Rota para listar comentários de um equipamento
router.get('/equipamento/:equipamentoId', requireAuth, async (req, res) => {
    try {
        const { equipamentoId } = req.params;

        const query = `
            SELECT 
                c.id, 
                c.texto, 
                c.data_inclusao, 
                u.login as usuario_login,
                p.nome_perfil as usuario_perfil
            FROM comentarios c 
            JOIN usuarios u ON c.usuario_id = u.id 
            JOIN perfis p ON u.perfil_id = p.id 
            WHERE c.equipamento_id = ? 
            ORDER BY c.data_inclusao DESC
        `;
        
        const comentarios = await executeQuery(query, [equipamentoId]);
        
        res.json(comentarios);

    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar comentários' 
        });
    }
});

// Rota para adicionar novo comentário
router.post('/', requireAuth, async (req, res) => {
    try {
        const { texto, equipamento_id } = req.body;
        const usuario_id = req.session.userId;

        // Validar dados obrigatórios
        if (!texto || !equipamento_id) {
            return res.status(400).json({ 
                error: 'Texto do comentário e ID do equipamento são obrigatórios' 
            });
        }

        if (texto.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Comentário não pode estar vazio' 
            });
        }

        // Verificar se o equipamento existe
        const checkQuery = 'SELECT id FROM equipamentos WHERE id = ?';
        const equipamento = await executeQuery(checkQuery, [equipamento_id]);
        
        if (equipamento.length === 0) {
            return res.status(404).json({ 
                error: 'Equipamento não encontrado' 
            });
        }

        const query = `
            INSERT INTO comentarios (texto, data_inclusao, usuario_id, equipamento_id) 
            VALUES (?, CURDATE(), ?, ?)
        `;
        
        const comentarioId = await executeInsert(query, [
            texto.trim(), 
            usuario_id, 
            equipamento_id
        ]);

        res.status(201).json({
            success: true,
            id: comentarioId,
            message: 'Comentário adicionado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        res.status(500).json({ 
            error: 'Erro ao adicionar comentário' 
        });
    }
});

// Rota para buscar um comentário específico
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                c.id, 
                c.texto, 
                c.data_inclusao, 
                c.usuario_id,
                c.equipamento_id,
                u.login as usuario_login,
                p.nome_perfil as usuario_perfil
            FROM comentarios c 
            JOIN usuarios u ON c.usuario_id = u.id 
            JOIN perfis p ON u.perfil_id = p.id 
            WHERE c.id = ?
        `;
        
        const comentarios = await executeQuery(query, [id]);
        
        if (comentarios.length === 0) {
            return res.status(404).json({ 
                error: 'Comentário não encontrado' 
            });
        }
        
        res.json(comentarios[0]);

    } catch (error) {
        console.error('Erro ao buscar comentário:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar comentário' 
        });
    }
});

// Rota para atualizar comentário (apenas o próprio usuário ou administrador)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { texto } = req.body;
        const userId = req.session.userId;
        const userPerfil = req.session.userPerfil;

        if (!texto || texto.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Texto do comentário é obrigatório' 
            });
        }

        // Verificar se o comentário existe e se o usuário tem permissão
        const checkQuery = 'SELECT usuario_id FROM comentarios WHERE id = ?';
        const comentario = await executeQuery(checkQuery, [id]);
        
        if (comentario.length === 0) {
            return res.status(404).json({ 
                error: 'Comentário não encontrado' 
            });
        }

        // Verificar permissão (próprio usuário ou administrador)
        if (comentario[0].usuario_id !== userId && userPerfil !== 'administrador') {
            return res.status(403).json({ 
                error: 'Sem permissão para editar este comentário' 
            });
        }

        const query = 'UPDATE comentarios SET texto = ? WHERE id = ?';
        await executeQuery(query, [texto.trim(), id]);

        res.json({
            success: true,
            message: 'Comentário atualizado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar comentário:', error);
        res.status(500).json({ 
            error: 'Erro ao atualizar comentário' 
        });
    }
});

// Rota para excluir comentário (apenas o próprio usuário ou administrador)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const userPerfil = req.session.userPerfil;

        // Verificar se o comentário existe e se o usuário tem permissão
        const checkQuery = 'SELECT usuario_id FROM comentarios WHERE id = ?';
        const comentario = await executeQuery(checkQuery, [id]);
        
        if (comentario.length === 0) {
            return res.status(404).json({ 
                error: 'Comentário não encontrado' 
            });
        }

        // Verificar permissão (próprio usuário ou administrador)
        if (comentario[0].usuario_id !== userId && userPerfil !== 'administrador') {
            return res.status(403).json({ 
                error: 'Sem permissão para excluir este comentário' 
            });
        }

        await executeQuery('DELETE FROM comentarios WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Comentário excluído com sucesso'
        });

    } catch (error) {
        console.error('Erro ao excluir comentário:', error);
        res.status(500).json({ 
            error: 'Erro ao excluir comentário' 
        });
    }
});

module.exports = router;

