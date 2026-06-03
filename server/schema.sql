-- Configurações gerais (PIN, preferências)
CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Produtos do estoque
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria TEXT,
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
