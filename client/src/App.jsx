import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import { useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Estoque from './pages/Estoque'
import Login from './pages/Login'
import Movimentacoes from './pages/Movimentacoes'

const titulos = {
  estoque: {
    titulo: 'Estoque',
    descricao: 'Cadastro, edição e consulta dos produtos.',
  },
  movimentacoes: {
    titulo: 'Movimentações',
    descricao: 'Registro de entradas, saídas e histórico do estoque.',
  },
  dashboard: {
    titulo: 'Dashboard',
    descricao: 'Resumo financeiro e gráficos do período.',
  },
}

function App() {
  const { autenticado, carregando } = useAuth()
  const [activeView, setActiveView] = useState('estoque')

  if (carregando) {
    return (
      <main className="loading-page">
        <p>Carregando sistema...</p>
      </main>
    )
  }

  if (!autenticado) {
    return <Login />
  }

  const view = titulos[activeView]
  const conteudo = {
    estoque: <Estoque />,
    movimentacoes: <Movimentacoes />,
    dashboard: <Dashboard />,
  }[activeView]

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onChangeView={setActiveView} />
      <main className="main-content">{conteudo}</main>
    </div>
  )
}

export default App
