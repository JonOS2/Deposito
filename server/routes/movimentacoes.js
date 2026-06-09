const express = require('express');
const db = require('../database');

const router = express.Router();

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const movimentacaoSelect = `
  SELECT
    m.*,
    p.nome AS produto_nome,
    p.categoria_id,
    c.nome AS categoria_nome
  FROM movimentacoes m
  JOIN produtos p ON p.id = m.produto_id
  LEFT JOIN categorias c ON c.id = p.categoria_id
`;

router.get('/', (req, res) => {
  const clauses = [];
  const params = [];

  if (req.query.produto_id !== undefined) {
    const produtoId = parseNumber(req.query.produto_id);
    if (produtoId === null) {
      return res.status(400).json({ error: 'produto_id inválido' });
    }
    clauses.push('produto_id = ?');
    params.push(produtoId);
  }

  if (req.query.tipo) {
    const tipo = String(req.query.tipo).trim();
    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo inválido' });
    }
    clauses.push('tipo = ?');
    params.push(tipo);
  }

  if (req.query.de) {
    clauses.push('data >= ?');
    params.push(req.query.de);
  }

  if (req.query.ate) {
    clauses.push('data <= ?');
    params.push(req.query.ate);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const movimentacoes = db
    .prepare(`${movimentacaoSelect} ${where} ORDER BY m.data DESC`)
    .all(...params);

  return res.json(movimentacoes);
});

router.post('/', (req, res) => {
  const produtoId = parseNumber(req.body?.produto_id);
  if (produtoId === null) {
    return res.status(400).json({ error: 'produto_id inválido' });
  }

  const tipo = String(req.body?.tipo || '').trim();
  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo inválido' });
  }

  const quantidade = parseNumber(req.body?.quantidade);
  if (quantidade === null || quantidade <= 0) {
    return res.status(400).json({ error: 'quantidade inválida' });
  }

  const valorUnitario = parseNumber(req.body?.valor_unitario);
  if (valorUnitario === null || valorUnitario < 0) {
    return res.status(400).json({ error: 'valor_unitario inválido' });
  }

  const produto = db.prepare('SELECT quantidade FROM produtos WHERE id = ?').get(produtoId);
  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  if (tipo === 'saida' && produto.quantidade < quantidade) {
    return res.status(400).json({ error: 'Estoque insuficiente' });
  }

  const data = req.body?.data ? String(req.body.data).trim() : null;
  const observacao = req.body?.observacao ? String(req.body.observacao).trim() : null;
  const delta = tipo === 'entrada' ? quantidade : -quantidade;

  const insertMov = db.prepare(
    'INSERT INTO movimentacoes (produto_id, tipo, quantidade, valor_unitario, data, observacao) VALUES (?, ?, ?, ?, COALESCE(?, datetime(\'now\',\'localtime\')), ?)'
  );
  const updateProduto = db.prepare('UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?');

  const transaction = db.transaction(() => {
    updateProduto.run(delta, produtoId);
    return insertMov.run(produtoId, tipo, quantidade, valorUnitario, data, observacao);
  });

  const result = transaction();
  const movimentacao = db.prepare(`${movimentacaoSelect} WHERE m.id = ?`).get(result.lastInsertRowid);

  return res.status(201).json(movimentacao);
});

module.exports = router;
