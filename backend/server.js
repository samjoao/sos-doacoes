// server.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import session from 'express-session';

import doacoes from './routes/doacoes.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = 5500;

// Caminho correto do __dirname no ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
    origin: 'http://localhost:5500', // Permita o frontend acessar
    credentials: true // Importante para enviar cookies de sessão
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração da sessão
app.use(session({
    secret: 'sua_chave_secreta_muito_segura', // Use uma string longa e aleatória em produção
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // 'secure: true' em produção (HTTPS)
}));

// Servindo os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/auth', authRoutes);
app.use('/doacoes', doacoes);

// Página inicial (fallback)
/*app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});*/

// Listar rotas registradas (debug)
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);

    // Mova a listagem de rotas para dentro do callback do listen
    if (app._router && app._router.stack) {
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
    }
});
