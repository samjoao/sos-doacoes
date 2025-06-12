import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Ajuste o caminho se necessário

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsPath = path.join(__dirname, '../../uploads');
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- ROTA PARA CADASTRAR DOAÇÃO (POST /doacoes) ---

router.post('/', authenticateToken, upload.single('imagem'), (req, res) => {
    console.log('Backend: Rota de cadastro de doação POST chamada.');
    console.log('Backend: req.body:', req.body);
    console.log('Backend: req.file:', req.file);
  
    const { categoria, estado, alimenticio, descricao, descricaoPersonalizada } = req.body;
    const imagem = req.file ? req.file.filename : null;
    const userId = req.user.id; // Pega o ID do usuário logado (Pessoa ou ONG) do token
    const userTipo = req.user.tipo; // Pega o tipo do usuário logado

    let categoriaFinal = categoria;
    if (categoria === 'outro' && descricaoPersonalizada) {
        categoriaFinal = descricaoPersonalizada;
    }

    if (!imagem || !categoriaFinal || !estado || !alimenticio || !descricao) {
        console.error('Backend: Campos obrigatórios faltando.');
        return res.status(400).json({ message: 'Todos os campos são obrigatórios (imagem, categoria, estado, alimentício, descrição).' });
    }


    // Inserção da doação no banco de dados, incluindo o id_ong (ID do usuário criador)
    db.run(
        `INSERT INTO doacoes (imagem, categoria, estado, alimenticio, descricao, id_ong) VALUES (?, ?, ?, ?, ?, ?)`,
        [imagem, categoriaFinal, estado, alimenticio, descricao, userId], // Adicionado userId
        function (err) {
            if (err) {
                console.error('Backend: Erro ao inserir doação no banco de dados:', err.message);
                if (err.errno === 19 && err.message.includes('UNIQUE constraint failed: doacoes.descricao')) {
                    return res.status(409).json({ message: 'Descrição de doação já existe. Por favor, use uma descrição única.' });
                }
                return res.status(500).json({ message: 'Erro interno do servidor ao cadastrar doação', error: err.message });
            }
            console.log('Backend: Doação cadastrada com sucesso. ID:', this.lastID);
            res.status(201).json({ message: 'Doação cadastrada com sucesso', id: this.lastID });
        }
    );
});

// --- ROTA PARA LISTAR DOAÇÕES (GET /doacoes) ---
router.get('/', (req, res) => {
    db.all(`SELECT id, imagem, categoria, estado, alimenticio, descricao, id_ong, reservado_por AS id_ong_reservou FROM doacoes`, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar doações:', err.message);
            return res.status(500).json({ message: 'Erro interno do servidor ao buscar doações.' });
        }
        const doacoesFormatadas = rows.map(row => ({
            ...row,
            imagem: row.imagem
        }));
        res.json(doacoesFormatadas);
    });
});

// ROTA PARA RESERVAR UMA DOAÇÃO (PUT /doacoes/:id/reservar)
// Apenas ONGs podem reservar doações.
router.put('/:id/reservar', authenticateToken, (req, res) => {
    const doacaoId = req.params.id;
    const userId = req.user.id;
    const userTipo = req.user.tipo;

    // Esta validação foi mantida, pois faz sentido que apenas ONGs reservem.
    if (userTipo !== 'ong') {
        return res.status(403).json({ message: 'Apenas ONGs podem reservar doações.' });
    }

    db.get(`SELECT id_ong, reservado_por FROM doacoes WHERE id = ?`, [doacaoId], (err, doacao) => {
        if (err) {
            console.error('Erro ao buscar doação para reserva:', err.message);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
        if (!doacao) {
            return res.status(404).json({ message: 'Doação não encontrada.' });
        }
        if (doacao.id_ong === userId) {
            return res.status(400).json({ message: 'Você não pode reservar a sua própria doação.' });
        }
        if (doacao.reservado_por) {
            return res.status(409).json({ message: 'Esta doação já foi reservada.' });
        }

        db.run(
            `UPDATE doacoes SET reservado_por = ? WHERE id = ?`,
            [userId, doacaoId],
            function (err) {
                if (err) {
                    console.error('Erro ao reservar doação:', err.message);
                    return res.status(500).json({ message: 'Erro ao reservar doação.' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Doação não encontrada ou não foi possível reservar.' });
                }
                res.status(200).json({ message: 'Doação reservada com sucesso!' });
            }
        );
    });
});

// --- ROTA PARA CANCELAR RESERVA (PUT /doacoes/:id/cancelar-reserva) ---
router.put('/:id/cancelar-reserva', authenticateToken, (req, res) => {
    const doacaoId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(doacaoId)) {
        return res.status(400).json({ message: 'ID da doação inválido.' });
    }

    db.run(
        `UPDATE doacoes SET reservado_por = NULL WHERE id = ? AND reservado_por = ?`,
        [doacaoId, userId],
        function (err) {
            if (err) {
                console.error('Erro ao cancelar reserva:', err.message);
                return res.status(500).json({ message: 'Erro ao cancelar reserva.', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Reserva não encontrada ou você não tem permissão para cancelar (talvez não foi você quem reservou?).' });
            }
            res.status(200).json({ message: 'Reserva cancelada com sucesso!' });
        }
    );
});

// --- ROTA PARA REMOVER DOAÇÃO (DELETE /doacoes/:id) ---
router.delete('/:id', authenticateToken, (req, res) => {
    const doacaoId = parseInt(req.params.id);
    const userId = req.user.id;

    if (isNaN(doacaoId)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    db.get(`SELECT id_ong FROM doacoes WHERE id = ?`, [doacaoId], (err, row) => {
        if (err) {
            console.error('Erro ao buscar doação para remoção:', err.message);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Doação não encontrada.' });
        }
        if (row.id_ong !== userId) {
            return res.status(403).json({ message: 'Você não tem permissão para remover esta doação.' });
        }

        db.run(`DELETE FROM doacoes WHERE id = ?`, [doacaoId], function (err) {
            if (err) {
                console.error('Erro ao remover doação:', err.message);
                return res.status(500).json({ message: 'Erro ao remover doação', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Doação não encontrada ou não foi removida.' });
            }
            res.status(200).json({ message: 'Doação removida com sucesso' });
        });
    });
});

export default router;