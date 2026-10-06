const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

// =========================
// FUNÇÃO PRINCIPAL
// =========================

module.exports = async function handler(req, res) {

    // =========================
    // POST - REGISTRAR USUÁRIO
    // =========================

    if (req.method === 'POST' && req.url.startsWith('/api/auth/registro')) {

        const { nome, email, senha } = req.body;

        // Validação
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

        // Verificar se o email já existe
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

        // =========================
        // CRIPTOGRAFAR SENHA
        // =========================

        const senhaHash = await bcrypt.hash(senha, 10);

        // =========================
        // SALVAR USUÁRIO
        // =========================

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

    // =========================
    // POST - LOGIN
    // =========================

    if (req.method === 'POST' && req.url.startsWith('/api/auth/login')) {

        const { email, senha } = req.body;

        // Validação
        if (!email || !senha) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios.'
            });
        }

        // Buscar usuário pelo email
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

        // =========================
        // COMPARAR SENHA
        // =========================

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                error: 'Email ou senha incorretos.'
            });
        }

        // =========================
        // GERAR JWT
        // =========================

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

        // =========================
        // RETORNAR TOKEN
        // =========================

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

    // =========================
    // MÉTODO NÃO PERMITIDO
    // =========================

    return res.status(405).json({
        error: 'Método não permitido.'
    });
};