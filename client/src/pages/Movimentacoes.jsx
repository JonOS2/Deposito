import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
})

const formInicial = {
  observacao: '',
  produto_id: '',
  produto_busca: '',
  quantidade: 1,
  tipo: 'entrada',
  valor_unitario: 0,
}

const tipoLabels = {
  entrada: 'Entrada / Compra',
  saida: 'Saída / Venda',
}

function Movimentacoes() {
  const [categorias, setCategorias] = useState([])
  const [erro, setErro] = useState('')
  const [filtros, setFiltros] = useState({ categoria_id: '', produto_id: '', tipo: '' })
  const [form, setForm] = useState(formInicial)
  const [movimentacoes, setMovimentacoes] = useState([])
  const [produtos, setProdutos] = useState([])
  const [salvando, setSalvando] = useState(false)

  async function carregarDados() {
    try {
      setErro('')
      const [produtosRes, movimentacoesRes, categoriasRes] = await Promise.all([
        api.get('/produtos'),
        api.get('/movimentacoes'),
        api.get('/categorias'),
      ])
      setProdutos(produtosRes.data)
      setMovimentacoes(movimentacoesRes.data)
      setCategorias(categoriasRes.data)
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível carregar as movimentações.')
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const movimentacoesFiltradas = useMemo(() => {
    const produtoId = filtros.produto_id ? Number(filtros.produto_id) : null
    const categoriaId = filtros.categoria_id ? Number(filtros.categoria_id) : null

    return movimentacoes.filter((movimentacao) => {
      const correspondeCategoria = !categoriaId || movimentacao.categoria_id === categoriaId
      const correspondeProduto = !produtoId || movimentacao.produto_id === produtoId
      const correspondeTipo = !filtros.tipo || movimentacao.tipo === filtros.tipo
      return correspondeCategoria && correspondeProduto && correspondeTipo
    })
  }, [filtros, movimentacoes])

  function handleFormChange(event) {
    const { name, value } = event.target

    if (name === 'produto_busca') {
      const produto = encontrarProduto(value)
      setForm((atual) => ({
        ...atual,
        produto_busca: value,
        produto_id: produto?.id || '',
        valor_unitario: produto ? valorUnitarioPadrao(produto, atual.tipo) : atual.valor_unitario,
      }))
      setErro('')
      return
    }

    if (name === 'tipo') {
      const produto = produtos.find((item) => item.id === Number(form.produto_id))
      setForm((atual) => ({
        ...atual,
        tipo: value,
        valor_unitario: produto ? valorUnitarioPadrao(produto, value) : atual.valor_unitario,
      }))
      setErro('')
      return
    }

    setForm((atual) => ({ ...atual, [name]: value }))
    setErro('')
  }

  function handleFiltroChange(event) {
    const { name, value } = event.target
    setFiltros((atual) => ({ ...atual, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.produto_id) {
      setErro('Selecione um produto.')
      return
    }

    const payload = {
      observacao: form.observacao.trim() || null,
      produto_id: Number(form.produto_id),
      quantidade: Number(form.quantidade),
      tipo: form.tipo,
      valor_unitario: Number(form.valor_unitario),
    }

    try {
      setSalvando(true)
      setErro('')
      await api.post('/movimentacoes', payload)
      setForm(formInicial)
      await carregarDados()
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível registrar a movimentação.')
    } finally {
      setSalvando(false)
    }
  }

  function encontrarProduto(busca) {
    const texto = busca.trim().toLowerCase()
    if (!texto) {
      return null
    }

    const idMatch = texto.match(/^#?(\d+)/)
    if (idMatch) {
      const porId = produtos.find((produto) => produto.id === Number(idMatch[1]))
      if (porId) {
        return porId
      }
    }

    return produtos.find((produto) => produto.nome.toLowerCase() === texto) || null
  }

  function valorUnitarioPadrao(produto, tipo) {
    return tipo === 'entrada' ? produto.preco_custo : produto.preco_venda
  }

  return (
    <section className="page-view">
      <header className="page-header">
        <div>
          <span>Movimentações</span>
          <h1>Entradas e saídas</h1>
        </div>
      </header>

      <form className="panel-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Produto</span>
          <input
            list="produtos-lista"
            name="produto_busca"
            onChange={handleFormChange}
            placeholder="Digite nome ou ID"
            required
            value={form.produto_busca}
          />
          <datalist id="produtos-lista">
            {produtos.map((produto) => (
              <option key={produto.id} value={`#${produto.id} - ${produto.nome}`} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Tipo</span>
          <div className="type-toggle">
            <button
              className={form.tipo === 'entrada' ? 'active expense' : ''}
              name="tipo"
              onClick={handleFormChange}
              type="button"
              value="entrada"
            >
              Compra
            </button>
            <button
              className={form.tipo === 'saida' ? 'active income' : ''}
              name="tipo"
              onClick={handleFormChange}
              type="button"
              value="saida"
            >
              Venda
            </button>
          </div>
        </label>

        <label className="field">
          <span>Quantidade</span>
          <input min="1" name="quantidade" onChange={handleFormChange} step="1" type="number" value={form.quantidade} />
        </label>

        <label className="field">
          <span>Valor unitário</span>
          <div className="money-field">
            <span>R$</span>
            <input min="0" name="valor_unitario" onChange={handleFormChange} step="0.01" type="number" value={form.valor_unitario} />
          </div>
        </label>

        <label className="field panel-form-wide">
          <span>Observação</span>
          <input name="observacao" onChange={handleFormChange} value={form.observacao} />
        </label>

        <button className="primary-button" disabled={salvando} type="submit">
          {salvando ? 'Registrando...' : 'Registrar'}
        </button>
      </form>

      {erro ? <p className="form-error">{erro}</p> : null}

      <div className="toolbar">
        <label className="field">
          <span>Filtrar por produto</span>
          <select name="produto_id" onChange={handleFiltroChange} value={filtros.produto_id}>
            <option value="">Todos</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                #{produto.id} - {produto.nome}
              </option>
            ))}
          </select>
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

        <label className="field">
          <span>Tipo</span>
          <select name="tipo" onChange={handleFiltroChange} value={filtros.tipo}>
            <option value="">Todos</option>
            <option value="entrada">Entrada / Compra</option>
            <option value="saida">Saída / Venda</option>
          </select>
        </label>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>ID</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Valor unitário</th>
              <th>Total</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoesFiltradas.length > 0 ? (
              movimentacoesFiltradas.map((movimentacao) => (
                <tr key={movimentacao.id}>
                  <td>{movimentacao.data}</td>
                  <td>#{movimentacao.produto_id}</td>
                  <td>{movimentacao.produto_nome}</td>
                  <td>
                    <span className={`status-pill ${movimentacao.tipo === 'entrada' ? 'expense' : 'income'}`}>
                      {tipoLabels[movimentacao.tipo]}
                    </span>
                  </td>
                  <td>{movimentacao.quantidade}</td>
                  <td>{moeda.format(movimentacao.valor_unitario)}</td>
                  <td className={movimentacao.tipo === 'entrada' ? 'money-expense' : 'money-income'}>
                    {moeda.format(movimentacao.quantidade * movimentacao.valor_unitario)}
                  </td>
                  <td>{movimentacao.observacao || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8}>Nenhuma movimentação encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Movimentacoes
