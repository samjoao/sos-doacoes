// server.js

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import db from 'db.js';

import doacoes from './routes/doacoes.js';
import authRoutes from './routes/auth.js';
m,n 
const app = express();
const PORT = 5500;

// Caminho correto do __dirname no ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const db = new sqlite3.Database(path.join(__dirname, 'sosdoacoes.db'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ Servindo os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/auth', authRoutes);
app.use('/doacoes', doacoes);

app._router.stack.forEach((middleware) => {
  if (middleware.route) { // rotas diretas
    console.log('Rota registrada:', middleware.route.path);
  } else if (middleware.name === 'router') { // rotas em routers
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log('Rota registrada:', handler.route.path);
      }
    });
  }
});


// Página inicial (fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

