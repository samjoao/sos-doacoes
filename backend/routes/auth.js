const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { db } = require('../db');

// Registro de usuário
router.post('/cadastro', (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  const hashedPassword = bcrypt.hashSync(senha, 10);
  
  db.run(`INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, [nome, email, hashedPassword, tipo], function(err) {
    if (err) {
      return res.status(400).json({ message: 'Erro ao cadastrar usuário' });
    }
    res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
  });
});

// Login de usuário
router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  
  db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(senha, user.senha)) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    res.json({ user });
  });
});

module.exports = router;
