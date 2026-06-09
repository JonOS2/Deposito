import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(false)
  const [pinDefinido, setPinDefinido] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    async function carregarStatus() {
      try {
        const { data } = await api.get('/auth/status')
        if (ativo) {
          setPinDefinido(Boolean(data.pin_definido))
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    carregarStatus()

    return () => {
      ativo = false
    }
  }, [])

  async function definirPin(pin) {
    await api.post('/auth/definir', { pin })
    setPinDefinido(true)
    setAutenticado(true)
  }

  async function verificarPin(pin) {
    await api.post('/auth/verificar', { pin })
    setAutenticado(true)
  }

  function sair() {
    setAutenticado(false)
  }

  const value = useMemo(
    () => ({
      autenticado,
      carregando,
      pinDefinido,
      definirPin,
      sair,
      verificarPin,
    }),
    [autenticado, carregando, pinDefinido]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
