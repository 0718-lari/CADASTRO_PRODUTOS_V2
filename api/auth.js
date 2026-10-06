const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function handler(req, res) {

    const acao = req.query.acao;

    // ==========================================
    // CADASTRO
    // POST /api/auth?acao=registro
    // ==========================================

    if (req.method === 'POST' && acao === 'registro') {

        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                error: 'Nome, email e senha são obrigatórios.'
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                error: 'A senha deve possuir pelo menos 6 caracteres.'
            });
        }

        const { data: usuarioExistente, error: erroBusca } =
            await supabase
                .from('usuarios')
                .select('id')
                .eq('email', email)
                .maybeSingle();

        if (erroBusca) {
            console.error(erroBusca);

            return res.status(500).json({
                error: 'Erro ao verificar usuário.'
            });
        }

        if (usuarioExistente) {
            return res.status(409).json({
                error: 'Este email já está cadastrado.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert([
                {
                    nome: nome,
                    email: email,
                    senha: senhaHash,
                    perfil: 'cliente'
                }
            ])
            .select('id, nome, email, perfil')
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: 'Erro ao cadastrar usuário.'
            });
        }

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso.',
            usuario: data
        });
    }


    // ==========================================
    // LOGIN
    // POST /api/auth?acao=login
    // ==========================================

    if (req.method === 'POST' && acao === 'login') {

        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios.'
            });
        }

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

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                error: 'Email ou senha incorretos.'
            });
        }

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
    }


    // ==========================================
    // ROTA NÃO ENCONTRADA
    // ==========================================

    return res.status(404).json({
        error: 'Ação não encontrada.'
    });
};