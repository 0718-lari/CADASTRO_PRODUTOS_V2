const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

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

    // Verifica se o email já existe
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

    // Cria o hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Salva o usuário
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
};