const formulario = document.querySelector("#formulario");
const campoNome = document.querySelector("#nome");
const campoEstado = document.querySelector("#estado");
const campoCidade = document.querySelector("#cidade");
const filtro = document.querySelector("#filtro");
const botao = document.querySelector("#botao-inscrever");
const totalCidades = document.querySelector("#total-cidades");
const mensagem = document.querySelector("#mensagem");
const resumo = document.querySelector("#resumo");

const urlBase = "https://servicodados.ibge.gov.br/api/v1/localidades";

let cidades = [];
let consultaAtual = 0;

async function buscarDados(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Não foi possível consultar a API do IBGE.");
    }

    return response.json();
}

function criarOpcao(texto, valor) {
    const opcao = document.createElement("option");
    opcao.textContent = texto;
    opcao.value = valor;
    return opcao;
}

function mostrarErro(texto) {
    mensagem.textContent = texto;
    mensagem.classList.add("erro");
}

async function carregarEstados() {
    try {
        const estados = await buscarDados(
            `${urlBase}/estados?orderBy=nome`
        );

        campoEstado.replaceChildren(
            criarOpcao("Selecione um estado", "")
        );

        estados.forEach(function (estado) {
            const opcao = criarOpcao(estado.nome, estado.sigla);
            campoEstado.appendChild(opcao);
        });

        campoEstado.disabled = false;
    } catch (erro) {
        campoEstado.replaceChildren(
            criarOpcao("Estados indisponíveis", "")
        );

        mostrarErro(
            "Erro ao carregar os estados. Atualize a página para tentar novamente."
        );
    }
}

async function carregarCidades() {
    const numeroConsulta = ++consultaAtual;
    const uf = campoEstado.value;

    cidades = [];
    filtro.value = "";
    filtro.disabled = true;
    campoCidade.disabled = true;
    botao.disabled = true;
    totalCidades.textContent = "";
    mensagem.textContent = "";
    mensagem.classList.remove("erro");
    resumo.hidden = true;

    campoCidade.replaceChildren(
        criarOpcao("Escolha um estado primeiro", "")
    );

    if (!uf) {
        return;
    }

    campoCidade.replaceChildren(
        criarOpcao("Carregando...", "")
    );

    try {
        const dados = await buscarDados(
            `${urlBase}/estados/${uf}/municipios?orderBy=nome`
        );

        if (numeroConsulta !== consultaAtual) {
            return;
        }

        cidades = dados;

        const nomeEstado = campoEstado.selectedOptions[0].textContent;
        totalCidades.textContent =
            `${nomeEstado} tem ${cidades.length} cidades.`;

        filtro.disabled = cidades.length === 0;
        preencherCidades(cidades);
    } catch (erro) {
        if (numeroConsulta !== consultaAtual) {
            return;
        }

        campoCidade.replaceChildren(
            criarOpcao("Cidades indisponíveis", "")
        );

        mostrarErro(
            "Erro ao carregar as cidades. Selecione o estado novamente para tentar."
        );
    }
}

function preencherCidades(lista) {
    const texto = lista.length > 0
        ? "Selecione uma cidade"
        : "Nenhuma cidade encontrada";

    campoCidade.replaceChildren(criarOpcao(texto, ""));

    lista.forEach(function (cidade) {
        const opcao = criarOpcao(cidade.nome, cidade.nome);
        campoCidade.appendChild(opcao);
    });

    campoCidade.disabled = lista.length === 0;
    botao.disabled = true;
}

function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

campoEstado.addEventListener("change", carregarCidades);

filtro.addEventListener("input", function () {
    const busca = normalizarTexto(filtro.value);

    const cidadesFiltradas = cidades.filter(function (cidade) {
        return normalizarTexto(cidade.nome).includes(busca);
    });

    preencherCidades(cidadesFiltradas);
});

campoCidade.addEventListener("change", function () {
    botao.disabled = campoCidade.value === "";
});

formulario.addEventListener("input", function () {
    resumo.hidden = true;
});

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const cidade = campoCidade.value;
    const uf = campoEstado.value;

    if (!nome) {
        mostrarErro("Digite seu nome.");
        campoNome.focus();
        return;
    }

    if (campoCidade.disabled || !cidade || !uf) {
        mostrarErro("Selecione um estado e uma cidade.");
        return;
    }

    mensagem.textContent = "";
    mensagem.classList.remove("erro");

    resumo.textContent =
        `${nome}, de ${cidade}/${uf}, inscrito com sucesso`;

    resumo.hidden = false;
});

carregarEstados();