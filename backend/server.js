import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import doacoes from './routes/doacoes.js'; // Importando o roteador de doações

// Para obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5500; 

// Configuração do banco de dados
const db = new sqlite3.Database(path.join(__dirname, 'sosdoacoes.db'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Middleware para analisar o corpo das requisições
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Usando o roteador de doações
app.use('/doacoes', doacoes); // Usando o roteador diretamente

// Rota de cadastro
app.post('/auth/cadastro', (req, res) => {
    const { nome, email, senha } = req.body; // Supondo que você esteja recebendo esses campos

    // Simulação de sucesso
    if (nome && email && senha) {
        return res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } else {
        return res.status(400).json({ message: 'Dados inválidos!' });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
