const jwt = require('jsonwebtoken');

function verificarToken(req, res) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        res.status(401).json({
            error: 'Token não informado.'
        });
        return null;
    }

    const partes = authorization.split(' ');

    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        res.status(401).json({
            error: 'Formato do token inválido.'
        });
        return null;
    }

    const token = partes[1];

    try {
        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        return usuario;

    } catch (error) {
        res.status(401).json({
            error: 'Token inválido ou expirado.'
        });
        return null;
    }
}

function verificarAdmin(usuario, res) {
    if (!usuario) {
        res.status(401).json({
            error: 'Usuário não autenticado.'
        });
        return false;
    }

    if (usuario.perfil !== 'admin') {
        res.status(403).json({
            error: 'Acesso permitido somente para administradores.'
        });
        return false;
    }

    return true;
}

module.exports = {
    verificarToken,
    verificarAdmin
};