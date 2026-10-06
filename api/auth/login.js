const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Método não permitido.'
        });
    }

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            error: 'Email e senha são obrigatórios.'
        });
    }

    // Busca o usuário pelo email
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, senha, perfil')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error(error);

        return res.status(500).json({
            error: 'Erro ao buscar usuário.'
        });
    }

    if (!usuario) {
        return res.status(401).json({
            error: 'Email ou senha incorretos.'
        });
    }

    // Compara a senha digitada com o hash salvo
    const senhaValida = await bcrypt.compare(
        senha,
        usuario.senha
    );

    if (!senhaValida) {
        return res.status(401).json({
            error: 'Email ou senha incorretos.'
        });
    }

    // Cria o token JWT
    const token = jwt.sign(
        {
            id: usuario.id,
            perfil: usuario.perfil
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '2h'
        }
    );

    return res.status(200).json({
        message: 'Login realizado com sucesso.',
        token: token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
        }
    });
};