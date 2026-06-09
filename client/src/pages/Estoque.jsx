import { useEffect, useMemo, useState } from 'react'
import ModalCategoria from '../components/ModalCategoria'
import ModalProduto from '../components/ModalProduto'
import api from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
})

function calcularMargem(produto) {
  if (!produto.preco_custo) {
    return produto.preco_venda > 0 ? 100 : 0
  }

  return ((produto.preco_venda - produto.preco_custo) / produto.preco_custo) * 100
}

function Estoque() {
  const [alertas, setAlertas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [erro, setErro] = useState('')
  const [filtros, setFiltros] = useState({ categoria_id: '', nome: '' })
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)

  async function carregarDados() {
    try {
      setErro('')
      const [produtosRes, alertasRes, categoriasRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/produtos/alertas'),
        api.get('/categorias'),
      ])

      setProdutos(produtosRes.data)
      setAlertas(alertasRes.data)
      setCategorias(categoriasRes.data)
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível carregar o estoque.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const produtosFiltrados = useMemo(() => {
    const nome = filtros.nome.trim().toLowerCase()
    const categoriaId = filtros.categoria_id ? Number(filtros.categoria_id) : null

    return produtos.filter((produto) => {
      const correspondeNome = !nome || produto.nome.toLowerCase().includes(nome)
      const correspondeCategoria = !categoriaId || produto.categoria_id === categoriaId
      return correspondeNome && correspondeCategoria
    })
  }, [filtros, produtos])

  function handleFiltroChange(event) {
    const { name, value } = event.target
    setFiltros((atual) => ({ ...atual, [name]: value }))
  }

  function abrirNovoProduto() {
    setProdutoSelecionado(null)
    setModalAberto(true)
  }

  function abrirEdicaoProduto(produto) {
    setProdutoSelecionado(produto)
    setModalAberto(true)
  }

  async function salvarProduto(payload) {
    if (produtoSelecionado) {
      await api.put(`/produtos/${produtoSelecionado.id}`, payload)
    } else {
      await api.post('/produtos', payload)
    }

    setModalAberto(false)
    setProdutoSelecionado(null)
    await carregarDados()
  }

  async function salvarCategoria(payload) {
    await api.post('/categorias', payload)
    setModalCategoriaAberto(false)
    await carregarDados()
  }

  async function excluirProduto(produto) {
    const confirmar = window.confirm(`Excluir "${produto.nome}" do estoque?`)
    if (!confirmar) {
      return
    }

    try {
      await api.delete(`/produtos/${produto.id}`)
      await carregarDados()
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível excluir o produto.')
    }
  }

  return (
    <section className="page-view">
      <header className="page-header">
        <div>
          <span>Estoque</span>
          <h1>Produtos cadastrados</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={() => setModalCategoriaAberto(true)} type="button">
            Nova Categoria
          </button>
          <button className="primary-button" onClick={abrirNovoProduto} type="button">
            Novo Produto
          </button>
        </div>
      </header>

      {alertas.length > 0 ? (
        <div className="stock-alert">
          <strong>{alertas.length} produto(s) abaixo do estoque mínimo.</strong>
          <span>{alertas.map((produto) => produto.nome).join(', ')}</span>
        </div>
      ) : null}

      <div className="toolbar">
        <label className="field">
          <span>Buscar por nome</span>
          <input
            name="nome"
            onChange={handleFiltroChange}
            placeholder="Ex.: Skol, Coca-Cola"
            type="search"
            value={filtros.nome}
          />
        </label>

        <label className="field">
          <span>Categoria</span>
          <select name="categoria_id" onChange={handleFiltroChange} value={filtros.categoria_id}>
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro ? <p className="form-error">{erro}</p> : null}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Qtd</th>
              <th>Preço Custo</th>
              <th>Preço Venda</th>
              <th>Margem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={8}>Carregando estoque...</td>
              </tr>
            ) : produtosFiltrados.length > 0 ? (
              produtosFiltrados.map((produto) => (
                <tr key={produto.id}>
                  <td>#{produto.id}</td>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria_nome || 'Sem categoria'}</td>
                  <td>{produto.quantidade}</td>
                  <td>{moeda.format(produto.preco_custo)}</td>
                  <td>{moeda.format(produto.preco_venda)}</td>
                  <td>{calcularMargem(produto).toFixed(1)}%</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => abrirEdicaoProduto(produto)} type="button">
                        Editar
                      </button>
                      <button onClick={() => excluirProduto(produto)} type="button">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>Nenhum produto encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto ? (
        <ModalProduto
          categorias={categorias}
          onClose={() => setModalAberto(false)}
          onSave={salvarProduto}
          produto={produtoSelecionado}
        />
      ) : null}

      {modalCategoriaAberto ? (
        <ModalCategoria onClose={() => setModalCategoriaAberto(false)} onSave={salvarCategoria} />
      ) : null}
    </section>
  )
}

export default Estoque
