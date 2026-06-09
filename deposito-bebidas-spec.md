# 📦 Depósito de Bebidas — Especificação do Projeto

## Visão Geral

Sistema desktop de gerenciamento de estoque para um depósito de bebidas de pequeno porte (uso doméstico/residencial). Roda localmente no PC do cliente, empacotado como `.exe` via Electron. Sem necessidade de internet.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Desktop wrapper | Electron |
| Frontend | React 18 + Vite |
| Estilização | Tailwind CSS |
| Gráficos | Recharts |
| Backend local | Node.js + Express |
| Banco de dados | SQLite (via `better-sqlite3`) |
| HTTP client | Axios |
| Empacotamento | Electron Builder |

---

## Estrutura de Pastas

```
deposito-bebidas/
├── electron/
│   ├── main.js              # Processo principal: janela, inicia servidor Express
│   └── preload.js           # Bridge segura (contextBridge)
│
├── server/
│   ├── index.js             # Entry point Express (porta 3333)
│   ├── database.js          # Conexão SQLite + inicialização do schema
│   ├── backup.js            # Lógica de backup automático
│   ├── routes/
│   │   ├── auth.js          # Validação do PIN
│   │   ├── categorias.js    # CRUD de categorias
│   │   ├── produtos.js      # CRUD de produtos
│   │   ├── movimentacoes.js # Entradas e saídas de estoque
│   │   └── dashboard.js     # Queries agregadas para gráficos
│   └── schema.sql           # Definição das tabelas
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Tela de PIN
│   │   │   ├── Estoque.jsx        # Listagem e cadastro de produtos
│   │   │   ├── Movimentacoes.jsx  # Registrar entrada/saída
│   │   │   └── Dashboard.jsx      # Gráficos e resumos financeiros
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TabelaProdutos.jsx
│   │   │   ├── ModalProduto.jsx   # Criar/editar produto
│   │   │   ├── ModalMovimentacao.jsx
│   │   │   ├── CardResumo.jsx     # Cards: lucro, gasto, saldo
│   │   │   ├── GraficoLinha.jsx   # Recharts — lucro/gasto ao longo do tempo
│   │   │   ├── GraficoBarra.jsx   # Recharts — comparativo por categoria
│   │   │   └── AlertaEstoque.jsx  # Banner produtos abaixo do mínimo
│   │   ├── services/
│   │   │   └── api.js             # Axios base URL http://localhost:3333
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Estado de autenticação do PIN
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── package.json             # Raiz — scripts Electron + build
├── .env                     # PORT=3333, DB_PATH, BACKUP_PATH
└── deposito-bebidas-spec.md # Este arquivo
```

---

## Banco de Dados — Schema

```sql
-- Configurações gerais (PIN, preferências)
CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

-- Produtos do estoque
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  preco_custo REAL NOT NULL DEFAULT 0,
  preco_venda REAL NOT NULL DEFAULT 0,
  quantidade INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 5,
  unidade TEXT DEFAULT 'un',
  criado_em TEXT DEFAULT (datetime('now','localtime'))
);

-- Movimentações de entrada e saída
CREATE TABLE IF NOT EXISTS movimentacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada','saida')),
  quantidade INTEGER NOT NULL,
  valor_unitario REAL NOT NULL,
  data TEXT DEFAULT (datetime('now','localtime')),
  observacao TEXT
);
```

---

## Rotas da API (Express)

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/verificar` | Valida PIN. Body: `{ pin: "1234" }` |
| POST | `/auth/definir` | Define PIN inicial. Body: `{ pin: "1234" }` |

### Categorias
| Método | Rota | Descrição |
|---|---|---|
| GET | `/categorias` | Lista todas as categorias |
| POST | `/categorias` | Cadastra nova categoria |
| PUT | `/categorias/:id` | Edita categoria |
| DELETE | `/categorias/:id` | Remove categoria (só se não houver produtos vinculados) |

### Produtos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/produtos` | Lista todos os produtos |
| GET | `/produtos/alertas` | Produtos abaixo do estoque mínimo |
| POST | `/produtos` | Cadastra novo produto |
| PUT | `/produtos/:id` | Edita produto |
| DELETE | `/produtos/:id` | Remove produto |

### Movimentações
| Método | Rota | Descrição |
|---|---|---|
| GET | `/movimentacoes` | Lista movimentações (query: `?produto_id&tipo&de&ate`) |
| POST | `/movimentacoes` | Registra entrada ou saída |

### Dashboard
| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/resumo` | Total lucro, gasto e saldo. Query: `?periodo=dia\|semana\|mes` |
| GET | `/dashboard/grafico` | Dados agrupados por data para o gráfico de linha. Query: `?periodo=dia\|semana\|mes` |
| GET | `/dashboard/categorias` | Gasto/lucro por categoria (para gráfico de barras) |

---

## Telas

### 1. Login (PIN)
- Campo numérico de 4 dígitos com input mascarado
- Se for o primeiro acesso, pede para definir o PIN
- Após validação, redireciona para Estoque

### 2. Estoque
- Tabela com: Nome, Categoria, Qtd, Preço Custo, Preço Venda, Margem (%)
- Botões: Novo Produto, Editar, Excluir
- Banner de alerta no topo se houver produtos abaixo do mínimo
- Filtro por nome e categoria

### 3. Movimentações
- Formulário: seleciona produto, tipo (entrada/saída), quantidade, valor unitário, observação
- Tabela histórico com filtros por tipo, produto e período (de/até)

### 4. Dashboard
- **Cards de resumo**: Total Gasto, Total Lucro, Saldo do Período
- **Filtro de período**: Hoje / Esta Semana / Este Mês
- **Gráfico de linha**: Lucro vs Gasto ao longo do período selecionado
- **Gráfico de barras**: Movimentação por categoria
- Todos os dados vêm das rotas `/dashboard/*`

---

## Autenticação — PIN

- PIN de 4 dígitos numéricos armazenado como hash `bcrypt` na tabela `config`
- Chave: `pin_hash`
- No primeiro boot, sistema detecta que não há PIN definido e exibe tela de cadastro
- Sem sessão persistente — PIN solicitado apenas ao abrir o app
- Sem JWT, sem cookie — o Electron controla o ciclo de vida da janela

---

## Backup Automático

- Executado automaticamente **uma vez por dia** ao abrir o app (verifica data do último backup)
- Copia o arquivo `.db` para uma pasta `backups/` dentro do diretório de dados do app (`app.getPath('userData')`)
- Nome do arquivo: `backup_YYYY-MM-DD.db`
- Mantém os últimos **7 backups** (deleta os mais antigos automaticamente)
- Chave de controle na tabela `config`: `ultimo_backup`

---

## Electron — Comportamento

- `main.js` inicia o servidor Express em background antes de abrir a janela
- Janela: `800x600`, `resizable: true`, `frame: true`
- Ao fechar a janela, o processo Express é encerrado junto
- Em desenvolvimento: React roda na porta `5173` (Vite), Electron aponta para ela
- Em produção: Electron serve o build estático do React via `loadFile`

---

## Scripts (package.json raiz)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\" \"electron .\"",
    "dev:server": "node server/index.js",
    "dev:client": "vite client/",
    "build:client": "vite build client/",
    "build": "npm run build:client && electron-builder",
    "start": "electron ."
  }
}
```

---

## Dependências Principais

### Raiz (Electron)
```
electron
electron-builder
concurrently
```

### Server
```
express
better-sqlite3
bcrypt
cors
dotenv
```

### Client
```
react
react-dom
react-router-dom
axios
recharts
tailwindcss
```

---

## Ordem de Implementação Sugerida

1. Setup do projeto (pastas, package.json, Vite, Tailwind)
2. `schema.sql` + `database.js` (SQLite inicializado no boot)
3. Rotas de produtos e movimentações
4. Rotas de dashboard (queries agregadas)
5. Rota de auth (PIN + bcrypt)
6. Backup automático
7. React: estrutura de rotas + Sidebar
8. Tela de Login (PIN)
9. Tela de Estoque
10. Tela de Movimentações
11. Tela de Dashboard (gráficos)
12. Electron: `main.js` + `preload.js` integrando tudo
13. Build `.exe` com Electron Builder

---

## Observações para o Agente

- Sempre usar `better-sqlite3` (síncrono), não `sqlite3` assíncrono
- O Express deve rodar na porta `3333`; se ocupada, tentar `3334`, `3335`
- O React usa `axios` com `baseURL: 'http://localhost:3333'`
- Datas devem ser armazenadas como `TEXT` no SQLite no formato `datetime('now','localtime')`
- Todos os valores monetários como `REAL` no SQLite
- O build do Electron deve incluir o servidor Node embutido (não depende de Node instalado no PC do cliente)
- Usar `electron-builder` com target `nsis` para gerar instalador `.exe` Windows