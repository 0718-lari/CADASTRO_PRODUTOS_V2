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

    toJSON() {
        return {
            nome: this.nome,
            preco: this.#preco,
            quantidade: this.#quantidade
        };
    }
}


// ==========================================
// CONFIGURAÇÕES
// ==========================================

const API_URL = '/api/produtos';
const AUTH_URL = '/api/auth';


// ==========================================
// ELEMENTOS DAS TELAS
// ==========================================

const telaLogin = document.getElementById('tela-login');
const telaCadastro = document.getElementById('tela-cadastro');
const telaProdutos = document.getElementById('tela-produtos');

const loginForm = document.getElementById('login-form');
const cadastroForm = document.getElementById('cadastro-form');

const mostrarCadastro = document.getElementById('mostrar-cadastro');
const voltarLogin = document.getElementById('voltar-login');


// ==========================================
// MOSTRAR LOGIN
// ==========================================

function mostrarTelaLogin() {
    telaLogin.classList.remove('escondido');
    telaCadastro.classList.add('escondido');
    telaProdutos.classList.add('escondido');
}


// ==========================================
// MOSTRAR CADASTRO
// ==========================================

mostrarCadastro.addEventListener('click', function () {
    telaLogin.classList.add('escondido');
    telaCadastro.classList.remove('escondido');
    telaProdutos.classList.add('escondido');
});

voltarLogin.addEventListener('click', function () {
    mostrarTelaLogin();
});


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    try {
        const resposta = await fetch(`${AUTH_URL}?acao=login`, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                email: email,
                senha: senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.error || 'Erro ao realizar login.'
            );
        }

        // Guarda o JWT no navegador
        localStorage.setItem('token', dados.token);

        // Guarda os dados do usuário
        localStorage.setItem(
            'usuario',
            JSON.stringify(dados.usuario)
        );

        loginForm.reset();

        mostrarTelaProdutos(dados.usuario);

    } catch (erro) {
        alert(erro.message);
    }
});


// ==========================================
// CADASTRO DE USUÁRIO
// ==========================================

cadastroForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome =
        document.getElementById('cadastro-nome').value;

    const email =
        document.getElementById('cadastro-email').value;

    const senha =
        document.getElementById('cadastro-senha').value;

    try {
        const resposta = await fetch(
            `${AUTH_URL}?acao=registro`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    nome: nome,
                    email: email,
                    senha: senha
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.error || 'Erro ao cadastrar usuário.'
            );
        }

        alert('Usuário cadastrado com sucesso!');

        cadastroForm.reset();

        mostrarTelaLogin();

    } catch (erro) {
        alert(erro.message);
    }
});


// ==========================================
// MOSTRAR TELA DE PRODUTOS
// ==========================================

function mostrarTelaProdutos(usuario) {

    telaLogin.classList.add('escondido');
    telaCadastro.classList.add('escondido');
    telaProdutos.classList.remove('escondido');

    document.getElementById('nome-usuario').textContent =
        `Olá, ${usuario.nome}!`;

    document.getElementById('perfil-usuario').textContent =
        `Perfil: ${usuario.perfil}`;


    // ==========================================
    // CONTROLE DO BOTÃO LIMPAR TABELA
    // ==========================================

    const botaoLimpar =
        document.getElementById('limpar-tabela');

    if (usuario.perfil === 'admin') {
        botaoLimpar.style.display = 'block';
    } else {
        botaoLimpar.style.display = 'none';
    }


    renderizarTabela();
}


// ==========================================
// VERIFICAR SE JÁ ESTÁ LOGADO
// ==========================================

function verificarLogin() {

    const token =
        localStorage.getItem('token');

    const usuarioSalvo =
        localStorage.getItem('usuario');

    if (token && usuarioSalvo) {

        try {

            const usuario =
                JSON.parse(usuarioSalvo);

            mostrarTelaProdutos(usuario);

        } catch (erro) {

            localStorage.removeItem('token');
            localStorage.removeItem('usuario');

            mostrarTelaLogin();
        }

    } else {

        mostrarTelaLogin();
    }
}


// ==========================================
// BOTÃO SAIR
// ==========================================

document.getElementById('botao-sair').addEventListener(
    'click',
    function () {

        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        mostrarTelaLogin();
    }
);


// ==========================================
// PRODUTO - CADASTRAR
// ==========================================

document.getElementById('produto-form').addEventListener(
    'submit',
    async function (e) {

        e.preventDefault();

        const nome =
            document.getElementById('nome').value;

        const preco =
            document.getElementById('preco').value;

        const quantidade =
            document.getElementById('quantidade').value;

        const token =
            localStorage.getItem('token');


        if (!token) {

            alert('Você precisa estar logado.');

            mostrarTelaLogin();

            return;
        }


        try {

            const novoProduto =
                new Produto(
                    nome,
                    preco,
                    quantidade
                );


            const resposta =
                await fetch(API_URL, {

                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body: JSON.stringify(
                        novoProduto.toJSON()
                    )
                });


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.error ||
                    'Erro ao salvar o produto.'
                );
            }


            alert(
                'Produto cadastrado com sucesso!'
            );


            e.target.reset();

            renderizarTabela();


        } catch (erro) {

            alert(erro.message);
        }
    }
);


// ==========================================
// PRODUTOS - LISTAR
// ==========================================

async function renderizarTabela() {

    try {

        const resposta =
            await fetch(API_URL);


        if (!resposta.ok) {

            throw new Error(
                'Erro ao buscar produtos.'
            );
        }


        const dadosBrutosDoServidor =
            await resposta.json();


        const tabela =
            document.querySelector(
                '#tabela-produtos tbody'
            );


        tabela.innerHTML = '';


        let totalAcumulado = 0;


        // Pega o usuário logado
        const usuarioSalvo =
            localStorage.getItem('usuario');


        let usuario = null;


        if (usuarioSalvo) {

            usuario =
                JSON.parse(usuarioSalvo);
        }


        dadosBrutosDoServidor.forEach(function (dados) {

            const produto =
                new Produto(
                    dados.nome,
                    dados.preco,
                    dados.quantidade
                );


            totalAcumulado +=
                produto.valorTotal();


            const row =
                document.createElement('tr');


            // ==========================================
            // BOTÃO EXCLUIR SOMENTE PARA ADMIN
            // ==========================================

            let botoesAdmin = '';


            if (
                usuario &&
                usuario.perfil === 'admin'
            ) {

                botoesAdmin = `
                    <button
                     onclick="editarProduto(
                        ${dados.id},
                        '${dados.nome.replace(/'/g, "\\'")}',
                        ${dados.preco},
                        ${dados.quantidade}
                        )" > Editar </button>  
                    <button
                        onclick="excluirProduto(${dados.id})"
                    > Excluir </button>
                `;
            }


            row.innerHTML = `

                <td>
                    ${produto.nome}
                </td>

                <td>
                    R$ ${produto.preco.toFixed(2)}
                </td>

                <td>
                    ${produto.quantidade}
                </td>

                <td>
                    R$ ${produto.valorTotal().toFixed(2)}
                </td>

                <td>
                    ${botoesAdmin}
                </td>

            `;


            tabela.appendChild(row);
        });


        document.getElementById(
            'total-estoque'
        ).textContent =
            `Total em estoque: R$ ${totalAcumulado.toFixed(2)}`;


    } catch (erro) {

        console.error(
            'Erro ao buscar dados no servidor:',
            erro
        );
    }
}


// ==========================================
// EXCLUIR UM PRODUTO
// ==========================================

async function excluirProduto(id) {

    const token =
        localStorage.getItem('token');


    if (!token) {

        alert(
            'Você precisa estar logado.'
        );

        mostrarTelaLogin();

        return;
    }


    // Verifica se é admin
    const usuarioSalvo =
        localStorage.getItem('usuario');


    if (!usuarioSalvo) {

        alert(
            'Usuário não encontrado.'
        );

        return;
    }


    const usuario =
        JSON.parse(usuarioSalvo);


    if (usuario.perfil !== 'admin') {

        alert(
            'Apenas administradores podem excluir produtos.'
        );

        return;
    }


    if (!confirm(
        'Deseja realmente excluir este produto?'
    )) {

        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}?id=${id}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.error ||
                'Erro ao excluir produto.'
            );
        }


        alert(
            'Produto excluído com sucesso!'
        );


        renderizarTabela();


    } catch (erro) {

        alert(erro.message);
    }
}

// ==========================================
// EDITAR UM PRODUTO
// ==========================================

async function editarProduto(id, nomeAtual, precoAtual, quantidadeAtual) {

    const token = localStorage.getItem('token');

    if (!token) {
        alert('Você precisa estar logado.');
        mostrarTelaLogin();
        return;
    }

    const usuarioSalvo = localStorage.getItem('usuario');

    if (!usuarioSalvo) {
        alert('Usuário não encontrado.');
        return;
    }

    const usuario = JSON.parse(usuarioSalvo);

    if (usuario.perfil !== 'admin') {
        alert('Apenas administradores podem editar produtos.');
        return;
    }

    const novoNome = prompt(
        'Digite o novo nome do produto:',
        nomeAtual
    );

    if (novoNome === null) {
        return;
    }

    const novoPreco = prompt(
        'Digite o novo preço:',
        precoAtual
    );

    if (novoPreco === null) {
        return;
    }

    const novaQuantidade = prompt(
        'Digite a nova quantidade:',
        quantidadeAtual
    );

    if (novaQuantidade === null) {
        return;
    }

    if (!novoNome || novoPreco <= 0 || novaQuantidade <= 0) {
        alert('Digite valores válidos.');
        return;
    }

    try {

        const resposta = await fetch(
            `${API_URL}?id=${id}`,
            {
                method: 'PUT',

                headers: {
                    'Content-Type': 'application/json',

                    'Authorization':
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    nome: novoNome,
                    preco: parseFloat(novoPreco),
                    quantidade: parseInt(novaQuantidade)
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.error ||
                'Erro ao editar produto.'
            );
        }

        alert('Produto atualizado com sucesso!');

        renderizarTabela();

    } catch (erro) {

        alert(erro.message);
    }
}

// ==========================================
// LIMPAR TODOS OS PRODUTOS
// ==========================================

document.getElementById(
    'limpar-tabela'
).addEventListener(
    'click',
    async function () {

        const token =
            localStorage.getItem('token');


        if (!token) {

            alert(
                'Você precisa estar logado.'
            );

            mostrarTelaLogin();

            return;
        }


        // Verifica se é admin
        const usuarioSalvo =
            localStorage.getItem('usuario');


        if (!usuarioSalvo) {

            alert(
                'Usuário não encontrado.'
            );

            return;
        }


        const usuario =
            JSON.parse(usuarioSalvo);


        if (usuario.perfil !== 'admin') {

            alert(
                'Apenas administradores podem limpar a tabela.'
            );

            return;
        }


        if (!confirm(
            'Deseja realmente limpar toda a tabela?'
        )) {

            return;
        }


        try {

            const resposta =
                await fetch(
                    API_URL,
                    {
                        method: 'DELETE',

                        headers: {
                            'Authorization':
                                `Bearer ${token}`
                        }
                    }
                );


            const dados =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.error ||
                    'Erro ao limpar a tabela.'
                );
            }


            alert(
                'Todos os produtos foram excluídos!'
            );


            renderizarTabela();


        } catch (erro) {

            alert(erro.message);
        }
    }
);


// ==========================================
// INICIALIZAÇÃO
// ==========================================

verificarLogin();