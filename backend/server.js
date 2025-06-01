const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('./db'); // Assuming you have a db module for connection

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Cadastrar doações
router.post('/', upload.single('imagem'), async (req, res) => {
    const { categoria, estado, alimenticio, descricao } = req.body;
    const imagem = req.file ? req.file.filename : null;

    try {
        await db.run(
            `INSERT INTO doacoes (imagem, categoria, estado, alimenticio, descricao) VALUES (?, ?, ?, ?, ?)`,
            [imagem, categoria, estado, alimenticio, descricao]
        );
        res.status(201).json({ message: 'Doação cadastrada com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Erro ao cadastrar doação' });
    }
});

// Listar doações
router.get('/', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM doacoes');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Erro ao listar doações' });
    }
});

module.exports = router;
