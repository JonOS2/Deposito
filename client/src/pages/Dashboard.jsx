import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
})

const periodos = [
  { label: 'Hoje', value: 'dia' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mês', value: 'mes' },
]

function Dashboard() {
  const [categorias, setCategorias] = useState([])
  const [dadosLinha, setDadosLinha] = useState([])
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState('mes')
  const [resumo, setResumo] = useState({ gasto: 0, lucro: 0, saldo: 0 })

  useEffect(() => {
    let ativo = true

    async function carregarDashboard() {
      try {
        setErro('')
        const [resumoRes, linhaRes, categoriasRes] = await Promise.all([
          api.get('/dashboard/resumo', { params: { periodo } }),
          api.get('/dashboard/grafico', { params: { periodo } }),
          api.get('/dashboard/categorias'),
        ])

        if (ativo) {
          setResumo(resumoRes.data)
          setDadosLinha(linhaRes.data)
          setCategorias(categoriasRes.data)
        }
      } catch (error) {
        if (ativo) {
          setErro(error.response?.data?.error || 'Não foi possível carregar o dashboard.')
        }
      }
    }

    carregarDashboard()

    return () => {
      ativo = false
    }
  }, [periodo])

  return (
    <section className="page-view">
      <header className="page-header">
        <div>
          <span>Dashboard</span>
          <h1>Resumo financeiro</h1>
        </div>

        <div className="segmented-control" aria-label="Período">
          {periodos.map((item) => (
            <button
              className={periodo === item.value ? 'active' : ''}
              key={item.value}
              onClick={() => setPeriodo(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {erro ? <p className="form-error">{erro}</p> : null}

      <div className="summary-grid">
        <article className="summary-card expense">
          <span>Total Gasto</span>
          <strong>{moeda.format(resumo.gasto)}</strong>
        </article>
        <article className="summary-card income">
          <span>Total Lucro</span>
          <strong>{moeda.format(resumo.lucro)}</strong>
        </article>
        <article className={`summary-card ${resumo.saldo < 0 ? 'expense' : 'income'}`}>
          <span>Saldo do Período</span>
          <strong>{moeda.format(resumo.saldo)}</strong>
        </article>
      </div>

      <div className="charts-grid">
        <section className="chart-card">
          <header>
            <h2>Lucro vs Gasto</h2>
          </header>
          <div className="chart-area">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value) => moeda.format(value)} />
                <Legend />
                <Line dataKey="lucro" name="Lucro" stroke="#0f766e" strokeWidth={2} />
                <Line dataKey="gasto" name="Gasto" stroke="#b42318" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="chart-card">
          <header>
            <h2>Por categoria</h2>
          </header>
          <div className="chart-area">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={categorias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip formatter={(value) => moeda.format(value)} />
                <Legend />
                <Bar dataKey="lucro" fill="#0f766e" name="Lucro" />
                <Bar dataKey="gasto" fill="#b42318" name="Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </section>
  )
}

export default Dashboard
