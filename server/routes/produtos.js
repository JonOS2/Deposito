const express = require('express');
const db = require('../database');

const router = express.Router();

const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return { value: fallback };
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return { error: true };
  }
  return { value: parsed };
};

router.get('/', (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos ORDER BY nome').all();
  return res.json(produtos);
});

router.get('/alertas', (req, res) => {
  const produtos = db
    .prepare('SELECT * FROM produtos WHERE quantidade < estoque_minimo ORDER BY nome')
    .all();
  return res.json(produtos);
});

router.post('/', (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const { value: precoCusto, error: custoErr } = parseNumber(req.body?.preco_custo, 0);
  const { value: precoVenda, error: vendaErr } = parseNumber(req.body?.preco_venda, 0);
  const { value: quantidade, error: qtdErr } = parseNumber(req.body?.quantidade, 0);
  const { value: estoqueMinimo, error: minErr } = parseNumber(req.body?.estoque_minimo, 5);

  if (custoErr || vendaErr || qtdErr || minErr) {
    return res.status(400).json({ error: 'Valores numéricos inválidos' });
  }

  const categoria = req.body?.categoria ? String(req.body.categoria).trim() : null;
  const unidade = req.body?.unidade ? String(req.body.unidade).trim() : 'un';

  const result = db
    .prepare(
      'INSERT INTO produtos (nome, categoria, preco_custo, preco_venda, quantidade, estoque_minimo, unidade) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(nome, categoria, precoCusto, precoVenda, quantidade, estoqueMinimo, unidade);

  return res.status(201).json({
    id: result.lastInsertRowid,
    nome,
    categoria,
    preco_custo: precoCusto,
    preco_venda: precoVenda,
    quantidade,
    estoque_minimo: estoqueMinimo,
    unidade,
  });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  if (!produto) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  const nome = req.body?.nome !== undefined ? String(req.body.nome).trim() : produto.nome;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const { value: precoCusto, error: custoErr } = parseNumber(req.body?.preco_custo, produto.preco_custo);
  const { value: precoVenda, error: vendaErr } = parseNumber(req.body?.preco_venda, produto.preco_venda);
  const { value: quantidade, error: qtdErr } = parseNumber(req.body?.quantidade, produto.quantidade);
  const { value: estoqueMinimo, error: minErr } = parseNumber(
    req.body?.estoque_minimo,
    produto.estoque_minimo
  );

  if (custoErr || vendaErr || qtdErr || minErr) {
    return res.status(400).json({ error: 'Valores numéricos inválidos' });
  }

  const categoria =
    req.body?.categoria !== undefined ? String(req.body.categoria || '').trim() : produto.categoria;
  const unidade = req.body?.unidade !== undefined ? String(req.body.unidade || '').trim() : produto.unidade;

  db.prepare(
    'UPDATE produtos SET nome = ?, categoria = ?, preco_custo = ?, preco_venda = ?, quantidade = ?, estoque_minimo = ?, unidade = ? WHERE id = ?'
  ).run(nome, categoria || null, precoCusto, precoVenda, quantidade, estoqueMinimo, unidade || null, id);

  const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  return res.json(atualizado);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const result = db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  return res.status(204).send();
});

module.exports = router;
