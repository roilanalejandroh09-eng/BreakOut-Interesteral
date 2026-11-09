// ProdutoManager - JavaScript para interatividade básica

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formProduto');
  const tabela = document.getElementById('tabelaProdutos').querySelector('tbody');
  const busca = document.getElementById('busca');
  const filtroCategoria = document.getElementById('filtroCategoria');
  const ordenar = document.getElementById('ordenar');

  let produtos = [
    { id: 1, nome: 'Notebook Gamer RTX 4060', categoria: 'eletronicos', preco: 4299.00, descricao: 'Notebook alto desempenho para jogos' },
    { id: 2, nome: 'Sofá 3 Lugares Retrátil', categoria: 'moveis', preco: 1899.00, descricao: 'Sofá confortável com assentos retráteis' },
    { id: 3, nome: 'Camiseta Básica Branca', categoria: 'roupas', preco: 49.90, descricao: '100% algodão, tamanho M' },
    { id: 4, nome: 'Clean Code - Robert Martin', categoria: 'livros', preco: 89.90, descricao: 'Guia de boas práticas de programação' },
    { id: 5, nome: 'Smartphone 128GB', categoria: 'eletronicos', preco: 2199.00, descricao: 'Tela 6.5", 8GB RAM, câmera 64MP' }
  ];

  let proximoId = 6;

  function formatarPreco(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
  }

  function getCategoriaLabel(valor) {
    const labels = {
      eletronicos: 'Eletrônicos',
      moveis: 'Móveis',
      roupas: 'Roupas',
      livros: 'Livros'
    };
    return labels[valor] || valor;
  }

  function renderizarTabela(lista) {
    tabela.innerHTML = '';
    lista.forEach(produto => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${produto.id}</td>
        <td>${produto.nome}</td>
        <td>${getCategoriaLabel(produto.categoria)}</td>
        <td>${formatarPreco(produto.preco)}</td>
        <td>${produto.descricao}</td>
        <td>
          <button class="btn-ver" title="Ver detalhes" data-id="${produto.id}">👁</button>
          <button class="btn-editar" title="Editar" data-id="${produto.id}">✏️</button>
          <button class="btn-excluir" title="Excluir" data-id="${produto.id}">🗑️</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
    adicionarEventosBotoes();
  }

  function adicionarEventosBotoes() {
    document.querySelectorAll('.btn-ver').forEach(btn => {
      btn.onclick = () => verDetalhes(Number(btn.dataset.id));
    });
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.onclick = () => editarProduto(Number(btn.dataset.id));
    });
    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.onclick = () => excluirProduto(Number(btn.dataset.id));
    });
  }

  function verDetalhes(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
      alert(`📦 Detalhes do Produto\n\nID: ${produto.id}\nNome: ${produto.nome}\nCategoria: ${getCategoriaLabel(produto.categoria)}\nPreço: ${formatarPreco(produto.preco)}\nDescrição: ${produto.descricao}`);
    }
  }

  function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
      document.getElementById('nome').value = produto.nome;
      document.getElementById('categoria').value = produto.categoria;
      document.getElementById('preco').value = produto.preco;
      document.getElementById('descricao').value = produto.descricao;
      document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
      form.dataset.editando = id;
      form.querySelector('button[type="submit"]').textContent = 'Atualizar Produto';
    }
  }

  function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      produtos = produtos.filter(p => p.id !== id);
      aplicarFiltros();
    }
  }

  function aplicarFiltros() {
    let lista = [...produtos];

    const termo = busca.value.toLowerCase();
    if (termo) {
      lista = lista.filter(p => p.nome.toLowerCase().includes(termo));
    }

    const cat = filtroCategoria.value;
    if (cat) {
      lista = lista.filter(p => p.categoria === cat);
    }

    const ord = ordenar.value;
    switch (ord) {
      case 'nome-asc': lista.sort((a, b) => a.nome.localeCompare(b.nome)); break;
      case 'nome-desc': lista.sort((a, b) => b.nome.localeCompare(a.nome)); break;
      case 'preco-asc': lista.sort((a, b) => a.preco - b.preco); break;
      case 'preco-desc': lista.sort((a, b) => b.preco - a.preco); break;
    }

    renderizarTabela(lista);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const categoria = document.getElementById('categoria').value;
    const preco = parseFloat(document.getElementById('preco').value);
    const descricao = document.getElementById('descricao').value.trim();

    if (!nome || !categoria || isNaN(preco)) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const editandoId = Number(form.dataset.editando);
    
    if (editandoId) {
      const idx = produtos.findIndex(p => p.id === editandoId);
      if (idx !== -1) {
        produtos[idx] = { ...produtos[idx], nome, categoria, preco, descricao };
      }
      delete form.dataset.editando;
      form.querySelector('button[type="submit"]').textContent = 'Salvar Produto';
      alert('Produto atualizado com sucesso!');
    } else {
      const novo = { id: proximoId++, nome, categoria, preco, descricao };
      produtos.push(novo);
      alert('Produto cadastrado com sucesso!');
    }

    form.reset();
    aplicarFiltros();
  });

  busca.addEventListener('input', aplicarFiltros);
  filtroCategoria.addEventListener('change', aplicarFiltros);
  ordenar.addEventListener('change', aplicarFiltros);

  renderizarTabela(produtos);
});