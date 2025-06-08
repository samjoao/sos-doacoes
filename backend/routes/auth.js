import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Importe o jsonwebtoken
import db from '../db.js';

const router = Router();

// Chave secreta para assinar o JWT.
// É CRUCIAL que esta chave seja a mesma usada em authMiddleware.js
// Em produção, use uma variável de ambiente (process.env.JWT_SECRET)
const secretKey = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

// Rota de Login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    db.get('SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Erro no banco de dados:', err);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const isMatch = await bcrypt.compare(senha, user.senha);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        
        }

        // --- GERAÇÃO DO JWT ---
        // Payload do JWT: informações do usuário que serão incluídas no token
        const payload = {
            id: user.id,
            email: user.email,
            tipo: user.tipo,
            nome: user.nome // Adicione o nome também, se for útil no frontend
        };

        // Assina o token com a chave secreta e define um tempo de expiração
        const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token expira em 1 hora

        console.log(`Usuário ${user.email} (${user.tipo}) logado com sucesso. Token gerado.`);
        res.status(200).json({ 
            message: 'Login bem-sucedido!',
            token: token, // Envia o token para o frontend
            user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo } // Opcional: envia também dados do usuário
        });
    });
});

// Rota de Cadastro
router.post('/cadastro', (req, res) => {
    const { nome, email, senha, tipo } = req.body;
    // Validação básica do tipo
    if (!['pessoa', 'ong'].includes(tipo)) {
        return res.status(400).json({ message: 'Tipo de usuário inválido. Deve ser "pessoa" ou "ong".' });
    }

    const hashedPassword = bcrypt.hashSync(senha, 10);

    db.run(
        `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`,
        [nome, email, hashedPassword, tipo],
        function(err) {
            if (err) {
                // Erro 19 é geralmente UNIQUE constraint (email já existe)
                if (err.errno === 19) {
                    return res.status(409).json({ message: 'Email já cadastrado.' });
                }
                console.error('Erro ao cadastrar usuário no banco de dados:', err.message);
                return res.status(500).json({ message: 'Erro interno do servidor ao cadastrar usuário.' });
            }
            res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
        }
    );
});


import { authenticateToken } from '../middleware/authMiddleware.js'; // Importe aqui também
router.get('/check-auth', authenticateToken, (req, res) => {
    // Se o middleware authenticateToken passou, req.user está preenchido
    if (req.user) {
        return res.json({
            loggedIn: true,
            userId: req.user.id,
            userType: req.user.tipo,
            userName: req.user.nome
        });
    } else {
        // Isso não deveria acontecer se authenticateToken funcionou
        return res.json({ loggedIn: false });
    }
});


// Rota de Logout (agora só informa o frontend para remover o token)
router.post('/logout', (req, res) => {
    // Com JWT, o logout é feito no frontend, removendo o token.
    // O backend não precisa "destruir" a sessão.
    res.json({ message: 'Logout processado no backend. O token deve ser removido no frontend.' });
});

export default router;