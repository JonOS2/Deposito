import { useAuth } from '../context/AuthContext'

const itens = [
  { id: 'estoque', label: 'Estoque' },
  { id: 'movimentacoes', label: 'Movimentações' },
  { id: 'dashboard', label: 'Dashboard' },
]

function Sidebar({ activeView, onChangeView }) {
  const { sair } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-mark">DB</span>
        <div>
          <strong>Depósito</strong>
          <span>Bebidas</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {itens.map((item) => (
          <button
            className={activeView === item.id ? 'active' : ''}
            key={item.id}
            onClick={() => onChangeView(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={sair} type="button">
        Sair
      </button>
    </aside>
  )
}

export default Sidebar
