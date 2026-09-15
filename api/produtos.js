const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

module.exports = async function handler(req, res) {

    // =========================
    // GET - BUSCAR PRODUTOS
    // =========================

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


    // =========================
    // POST - CADASTRAR PRODUTO
    // =========================

    if (req.method === 'POST') {

        const { nome, preco, quantidade } = req.body;

        const p = parseFloat(preco);
        const q = parseInt(quantidade);

        // Validação
        if (
            !nome ||
            isNaN(p) ||
            isNaN(q) ||
            p <= 0 ||
            q <= 0
        ) {

            return res.status(400).json({
                error: 'Dados inválidos enviados para o servidor.'
            });
        }


        const { data, error } = await supabase
            .from('produtos')
            .insert([
                {
                    nome: nome,
                    preco: p,
                    quantidade: q
                }
            ])
            .select()
            .single();


        if (error) {

            console.error(error);

            return res.status(500).json({
                error: 'Erro ao salvar produto.'
            });
        }


        return res.status(201).json(data);
    }


    // =========================
    // DELETE - EXCLUIR PRODUTO
    // =========================

    if (req.method === 'DELETE') {

        const nome = req.query.nome;


        // Excluir um produto pelo nome
        if (nome) {

            const { data, error } = await supabase
                .from('produtos')
                .delete()
                .eq('nome', nome)
                .select();


            if (error) {

                console.error(error);

                return res.status(500).json({
                    error: 'Erro ao excluir produto.'
                });
            }


            if (!data || data.length === 0) {

                return res.status(404).json({
                    error: 'Produto não encontrado.'
                });
            }


            return res.status(204).send();
        }


        // Excluir todos os produtos
        const { error } = await supabase
            .from('produtos')
            .delete()
            .not('id', 'is', null);


        if (error) {

            console.error(error);

            return res.status(500).json({
                error: 'Erro ao limpar a tabela.'
            });
        }


        return res.status(204).send();
    }


    // =========================
    // MÉTODO NÃO PERMITIDO
    // =========================

    return res.status(405).json({
        error: 'Método não permitido.'
    });
};  