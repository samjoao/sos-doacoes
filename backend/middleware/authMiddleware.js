// backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'sua_chave_secreta_fallback';

// Middleware para autenticar o token JWT
export const authenticateToken = (req, res, next) => {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            // Se o token for inválido ou expirado
            return res.status(403).json({ message: 'Token de autenticação inválido ou expirado.' });
        }
        // Se o token for válido, o payload decodificado (user.id, user.tipo, etc.)
        // é anexado ao objeto de requisição para uso posterior
        req.user = user;
        next(); // Continua para a próxima função middleware ou rota
    });
};

// Middleware para autorizar apenas ONGs
export const authorizeOng = (req, res, next) => {
    if (req.user && req.user.tipo === 'ong') {
        next(); // O usuário é uma ONG, permite acesso
    } else {
        return res.status(403).json({ message: 'Acesso não autorizado. Apenas ONGs podem realizar esta ação.' });
    }
};

