import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

// Para obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const doacoesRouter = import('./backend/routes/doacoes.js'); // Ajuste o caminho conforme necessário

const app = express();
const PORT = 5500; 

// Configuração do banco de dados
const db = new sqlite3.Database(path.join(__dirname, 'backend/sosdoacoes.db'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Middleware para analisar o corpo das requisições
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Configuração do multer para upload de arquivos
const upload = multer({ dest: 'uploads/' });

// Usando o roteador de doações
doacoesRouter.then(router => {
    app.use('/doacoes', router.default);
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
