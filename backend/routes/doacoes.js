const express = require('express');
const multer = require('multer');
const path = require('path');
const { db } = require('../db');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Cadastro de doações
router.post('/', upload.single('imagem'), (req, res) => {
  const { categoria, estado, alimenticio, descricao } = req.body;
  const imagem = req.file ? req.file.filename : null;

  db.run(`INSERT INTO doacoes (imagem, categoria, estado, alimenticio, descricao) VALUES (?, ?, ?, ?, ?)`, [imagem, categoria, estado, alimenticio, descricao], function(err) {
    if (err) {
      return res.status(400).json({ message: 'Erro ao cadastrar doação' });
    }
    res.status(201).json({ message: 'Doação cadastrada com sucesso' });
  });
});

// Listar doações
router.get('/', (req, res) => {
  db.all(`SELECT * FROM doacoes`, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ message: 'Erro ao listar doações' });
    }
    res.json(rows);
  });
});

module.exports = router;
