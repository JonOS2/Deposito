import { useEffect, useState } from 'react'

const estadoInicial = {
  categoria_id: '',
  estoque_minimo: 5,
  nome: '',
  preco_custo: 0,
  preco_venda: 0,
  quantidade: 0,
  unidade: 'un',
}

function ModalProduto({ categorias, onClose, onSave, produto }) {
  const [form, setForm] = useState(estadoInicial)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (produto) {
      setForm({
        categoria_id: produto.categoria_id || '',
        estoque_minimo: produto.estoque_minimo,
        nome: produto.nome,
        preco_custo: produto.preco_custo,
        preco_venda: produto.preco_venda,
        quantidade: produto.quantidade,
        unidade: produto.unidade || 'un',
      })
      return
    }

    setForm(estadoInicial)
  }, [produto])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((atual) => ({ ...atual, [name]: value }))
    setErro('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.nome.trim()) {
      setErro('Informe o nome do produto.')
      return
    }

    const payload = {
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      estoque_minimo: Number(form.estoque_minimo),
      nome: form.nome.trim(),
      preco_custo: Number(form.preco_custo),
      preco_venda: Number(form.preco_venda),
      quantidade: Number(form.quantidade),
      unidade: form.unidade.trim() || 'un',
    }

    try {
      setSalvando(true)
      await onSave(payload)
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível salvar o produto.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" aria-labelledby="modal-produto-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <span>Produto</span>
            <h2 id="modal-produto-title">{produto ? 'Editar produto' : 'Novo produto'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Fechar">
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input name="nome" onChange={handleChange} required value={form.nome} />
          </label>

          <label className="field">
            <span>Categoria</span>
            <select name="categoria_id" onChange={handleChange} value={form.categoria_id}>
              <option value="">Sem categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Preço custo</span>
              <div className="money-field">
                <span>R$</span>
                <input min="0" name="preco_custo" onChange={handleChange} step="0.01" type="number" value={form.preco_custo} />
              </div>
            </label>

            <label className="field">
              <span>Preço venda</span>
              <div className="money-field">
                <span>R$</span>
                <input min="0" name="preco_venda" onChange={handleChange} step="0.01" type="number" value={form.preco_venda} />
              </div>
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Quantidade</span>
              <input min="0" name="quantidade" onChange={handleChange} step="1" type="number" value={form.quantidade} />
            </label>

            <label className="field">
              <span>Estoque mínimo</span>
              <input min="0" name="estoque_minimo" onChange={handleChange} step="1" type="number" value={form.estoque_minimo} />
            </label>
          </div>

          <label className="field">
            <span>Unidade</span>
            <input name="unidade" onChange={handleChange} value={form.unidade} />
          </label>

          {erro ? <p className="form-error">{erro}</p> : null}

          <footer className="modal-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={salvando} type="submit">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ModalProduto
