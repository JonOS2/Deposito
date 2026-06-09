import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { definirPin, pinDefinido, verificarPin } = useAuth()
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const titulo = pinDefinido ? 'Acesso ao depósito' : 'Defina seu PIN'
  const subtitulo = pinDefinido
    ? 'Digite o PIN de 4 dígitos para continuar.'
    : 'Crie um PIN de 4 dígitos para proteger o sistema.'

  function handlePinChange(event) {
    const apenasNumeros = event.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(apenasNumeros)
    setErro('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!/^\d{4}$/.test(pin)) {
      setErro('Informe um PIN com 4 dígitos.')
      return
    }

    try {
      setEnviando(true)
      setErro('')

      if (pinDefinido) {
        await verificarPin(pin)
      } else {
        await definirPin(pin)
      }
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível validar o PIN.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-mark">DB</span>
          <div>
            <strong>Depósito de Bebidas</strong>
            <span>Controle local de estoque</span>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-copy">
            <h1 id="login-title">{titulo}</h1>
            <p>{subtitulo}</p>
          </div>

          <label className="field">
            <span>PIN</span>
            <input
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              maxLength={4}
              onChange={handlePinChange}
              pattern="\d{4}"
              placeholder="0000"
              type="password"
              value={pin}
            />
          </label>

          {erro ? <p className="form-error">{erro}</p> : null}

          <button className="primary-button" disabled={enviando} type="submit">
            {enviando ? 'Aguarde...' : pinDefinido ? 'Entrar' : 'Salvar PIN'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
