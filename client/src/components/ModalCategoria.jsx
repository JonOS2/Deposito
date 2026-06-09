import { useState } from 'react'

function ModalCategoria({ onClose, onSave }) {
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!nome.trim()) {
      setErro('Informe o nome da categoria.')
      return
    }

    try {
      setErro('')
      setSalvando(true)
      await onSave({ nome: nome.trim() })
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível salvar a categoria.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal modal-small" aria-labelledby="modal-categoria-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <span>Categoria</span>
            <h2 id="modal-categoria-title">Nova categoria</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Fechar">
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input autoFocus name="nome" onChange={(event) => setNome(event.target.value)} value={nome} />
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

export default ModalCategoria
