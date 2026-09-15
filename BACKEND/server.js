const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Conexão com o banco SQLite
const db = new sqlite3.Database('./produtos.db', (erro) => {
    if (erro) {
        console.error('Erro ao conectar ao banco de dados:', erro.message);
    } else {
        console.log('Banco de dados SQLite conectado.');
    }
});

// Criação da tabela
db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL
    )
`, (erro) => {
    if (erro) {
        console.error('Erro ao criar a tabela:', erro.message);
    } else {
        console.log('Tabela produtos pronta.');
    }
});

// ROTA GET: busca todos os produtos no banco
app.get('/produtos', (req, res) => {
    const sql = 'SELECT id, nome, preco, quantidade FROM produtos';

    db.all(sql, [], (erro, produtos) => {
        if (erro) {
            console.error('Erro ao buscar produtos:', erro.message);
            return res.status(500).json({ error: 'Erro ao buscar produtos.' });
        }

        res.status(200).json(produtos);
    });
});

// ROTA POST: recebe e salva um produto no banco
app.post('/produtos', (req, res) => {
    const { nome, preco, quantidade } = req.body;

    const p = parseFloat(preco);
    const q = parseInt(quantidade);

    // Validação no servidor
    if (!nome || isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
        return res.status(400).json({
            error: 'Dados inválidos enviados para o servidor'
        });
    }

    const sql = `
        INSERT INTO produtos (nome, preco, quantidade)
        VALUES (?, ?, ?)
    `;

    db.run(sql, [nome, p, q], function (erro) {
        if (erro) {
            console.error('Erro ao inserir produto:', erro.message);
            return res.status(500).json({
                error: 'Erro ao salvar produto no banco de dados.'
            });
        }

        const novoItem = {
            id: this.lastID,
            nome: nome,
            preco: p,
            quantidade: q
        };

        res.status(201).json(novoItem);
    });
});

// ROTA DELETE: apaga todos os produtos
app.delete('/produtos', (req, res) => {
    const sql = 'DELETE FROM produtos';

    db.run(sql, [], (erro) => {
        if (erro) {
            console.error('Erro ao limpar produtos:', erro.message);
            return res.status(500).json({
                error: 'Erro ao limpar a tabela.'
            });
        }

        res.status(204).send();
    });
});

// ROTA DELETE: apaga um produto pelo nome
app.delete('/produtos/:nome', (req, res) => {
    const nome = req.params.nome;

    const sql = 'DELETE FROM produtos WHERE nome = ?';

    db.run(sql, [nome], function (erro) {
        if (erro) {
            console.error('Erro ao excluir produto:', erro.message);
            return res.status(500).json({
                error: 'Erro ao excluir produto.'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                error: 'Produto não encontrado.'
            });
        }

        res.status(204).send();
    });
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
