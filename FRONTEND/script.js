class Produto {
    #preco;
    #quantidade;


    constructor(nome, preco, quantidade) {
        if (!nome || preco <= 0 || quantidade <= 0) {
            throw new Error("Dados inválidos para o produto");
        }
        this.nome = nome;

        this.#preco = parseFloat(preco);
        this.#quantidade = parseInt(quantidade);
    }
    get preco() {
        return this.#preco;
    }
    get quantidade() {
        return this.#quantidade;
    }

    valorTotal() {
        return this.#preco * this.#quantidade;
    }

    //Método toJSON
    toJSON() {
        return {
            nome: this.nome,
            preco: this.#preco,
            quantidade: this.#quantidade
        };
    }
}

// const produtos = [];
// MUDANÇA DE ARQUITETURA - CLIENTE-SERVIDOR

// CRIAR UMA CONSTANTE COM ENDEREÇO DE API (RODANDO NO SERVIDOR)
const API_URL = '/api/produtos';

// REQUISIÇÃO POST - enviar dados para o servidor
// funcão deve serasync pois o envio, resposta trafegame pela mesma rede
// usar await até que o servidor responda 


document.getElementById("produto-form").addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const quantidade = document.getElementById('quantidade').value;

    try {
        const novoProduto = new Produto(nome, preco, quantidade);

        // produtos.push(novoProduto);

        // DISPARO NA REDE: envia o produto convertido em texto JSON para o Express

        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoProduto.toJSON())
        });

        if (!resposta.ok) {
            throw new Error('Erro ao salvar o produto no servidor backend');
        }

        renderizarTabela();
        e.target.reset();


    } catch (erro) {
        alert(erro.message);
    }
}); //PAREI AQUI

// REQUISAÇÃO GET (buscar um servidor e desenhar tela)
// O coração da proposta ocorre aqui

async function renderizarTabela() {

    try {

        // buscar dados
        const resposta = await fetch(API_URL);
        const dadosBrutosDoServidor = await resposta.json();

        const tabela = document.querySelector('#tabela-produtos tbody');
        tabela.innerHTML = '';
        let totalAcumulado = 0;

        // 2 passado por cada item retornando pelo BACKEND 
        dadosBrutosDoServidor.forEach((dados) => {
            const produto = new Produto(dados.nome, dados.preco, dados.quantidade);
            totalAcumulado += produto.valorTotal();
            // desenha a linha na tabela utilizando os dados do objeto reconstruindo 
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${produto.nome}</td>
                <td>R$ ${produto.preco.toFixed(2)}</td>
                <td>${produto.quantidade}</td>
                <td>R$ ${produto.valorTotal().toFixed(2)}</td>
                <td><button onclick="excluirProduto('${produto.nome}')"> Excluir </button></td>
            `;
            tabela.appendChild(row);
        });

        // 3 atualiza o elemento de texto com o acumulado total
        document.getElementById('total-estoque').textContent = `Total em estoque: R$ ${totalAcumulado.toFixed(2)}`;
    } catch (erro) {
        console.error("Erro ao buscar dados no servidor:", erro);
    }
};

// REQUISIÇÃO PARA DELETE (apagar os dados em lote)
document.getElementById('limpar-tabela').addEventListener('click', async function () {
    if (confirm("Deseja mesmo limpar mesmo toda a tabela no servidor?")) {
        try {
            // envia uma ordem de remoção para a API
            await fetch(API_URL, { method: 'DELETE' });

            // atualiza a tabela
            renderizarTabela();
        } catch (erro) {
            console.error("Erro ao limpar dados no servidor:", erro);
        }
    }
});

async function excluirProduto(nome) {
    try {
        const resposta = await fetch(
            `${API_URL}?nome=${encodeURIComponent(nome)}`,
            {
                method: 'DELETE'
            }
        );

        if (!resposta.ok) {
            throw new Error("Erro ao excluir produto.");
        }

        renderizarTabela();

    } catch (erro) {
        console.error(erro);
    }
}

// INICIALIAZAÇÃO AUTOMÁTICA 
// assim que o usuário abre o navegador, o app busca
// se ja há dados salvods de sessões anteriores lá no BACKEND
renderizarTabela();


