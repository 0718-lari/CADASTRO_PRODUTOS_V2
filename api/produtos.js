jsconst { createClient } = require('@supabase/supabase-js');

const {
    verificarToken,
    verificarAdmin
} = require('./authMiddleware');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function handler(req, res) {

    // ==========================================
    // GET - LISTAR PRODUTOS
    // Público: não precisa de login
    // ==========================================

    if (req.method === 'GET') {

        const { data, error } = await supabase
            .from('produtos')
            .select('id, nome, preco, quantidade')
            .order('id', { ascending: true });

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: 'Erro ao buscar produtos.'
            });
        }

        return res.status(200).json(data);
    }


    // ==========================================
    // POST - CADASTRAR PRODUTO
    // Precisa estar logado
    // ==========================================

    if (req.method === 'POST') {

        const usuario = verificarToken(req, res);

        if (!usuario) {
            return;
        }

        const { nome, preco, quantidade } = req.body;

        if (
            !nome ||
            preco === undefined ||
            quantidade === undefined
        ) {
            return res.status(400).json({
                error: 'Nome, preço e quantidade são obrigatórios.'
            });
        }

        const { data, error } = await supabase
            .from('produtos')
            .insert([
                {
                    nome: nome,
                    preco: preco,
                    quantidade: quantidade
                }
            ])
            .select('id, nome, preco, quantidade')
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: 'Erro ao cadastrar produto.'
            });
        }

        return res.status(201).json(data);
    }


    // ==========================================
    // PUT - ALTERAR PRODUTO
    // Somente ADMIN
    // ==========================================

    if (req.method === 'PUT') {

        const usuario = verificarToken(req, res);

        if (!usuario) {
            return;
        }

        // Somente administradores podem editar
        if (!verificarAdmin(usuario, res)) {
            return;
        }

        const id = req.query.id;

        if (!id) {
            return res.status(400).json({
                error: 'ID do produto não informado.'
            });
        }

        const { nome, preco, quantidade } = req.body;

        const { data, error } = await supabase
            .from('produtos')
            .update({
                nome: nome,
                preco: preco,
                quantidade: quantidade
            })
            .eq('id', id)
            .select('id, nome, preco, quantidade')
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: 'Erro ao atualizar produto.'
            });
        }

        return res.status(200).json(data);
    }


    // ==========================================
    // DELETE - EXCLUIR PRODUTO
    // Somente ADMIN
    // ==========================================

    if (req.method === 'DELETE') {

        const usuario = verificarToken(req, res);

        if (!usuario) {
            return;
        }

        if (!verificarAdmin(usuario, res)) {
            return;
        }

        const id = req.query.id;

        // DELETE /api/produtos?id=5
        if (id) {

            const { error } = await supabase
                .from('produtos')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error);

                return res.status(500).json({
                    error: 'Erro ao excluir produto.'
                });
            }

            return res.status(200).json({
                message: 'Produto excluído com sucesso.'
            });
        }


        // DELETE /api/produtos
        // Excluir todos

        const { error } = await supabase
            .from('produtos')
            .delete()
            .not('id', 'is', null);

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: 'Erro ao excluir produtos.'
            });
        }

        return res.status(200).json({
            message: 'Todos os produtos foram excluídos.'
        });
    }


    // ==========================================
    // MÉTODO NÃO PERMITIDO
    // ==========================================

    return res.status(405).json({
        error: 'Método não permitido.'
    });
};