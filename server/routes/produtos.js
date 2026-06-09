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

const parseOptionalId = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: true };
  }

  return { value: parsed };
};

const produtoSelect = `
  SELECT
    p.*,
    c.nome AS categoria_nome
  FROM produtos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
`;

const categoriaExiste = (categoriaId) => {
  if (categoriaId === null) {
    return true;
  }

  return Boolean(db.prepare('SELECT id FROM categorias WHERE id = ?').get(categoriaId));
};

router.get('/', (req, res) => {
  const produtos = db.prepare(`${produtoSelect} ORDER BY p.nome`).all();
  return res.json(produtos);
});

router.get('/alertas', (req, res) => {
  const produtos = db
    .prepare(`${produtoSelect} WHERE p.quantidade < p.estoque_minimo ORDER BY p.nome`)
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

  const { value: categoriaId, error: categoriaErr } = parseOptionalId(req.body?.categoria_id);
  if (categoriaErr) {
    return res.status(400).json({ error: 'categoria_id inválido' });
  }

  if (!categoriaExiste(categoriaId)) {
    return res.status(404).json({ error: 'Categoria não encontrada' });
  }

  const unidade = req.body?.unidade ? String(req.body.unidade).trim() : 'un';

  const result = db
    .prepare(
      'INSERT INTO produtos (nome, categoria_id, preco_custo, preco_venda, quantidade, estoque_minimo, unidade) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(nome, categoriaId, precoCusto, precoVenda, quantidade, estoqueMinimo, unidade);

  const produto = db.prepare(`${produtoSelect} WHERE p.id = ?`).get(result.lastInsertRowid);

  return res.status(201).json(produto);
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

  const { value: categoriaId, error: categoriaErr } = parseOptionalId(
    req.body?.categoria_id !== undefined ? req.body.categoria_id : produto.categoria_id
  );
  if (categoriaErr) {
    return res.status(400).json({ error: 'categoria_id inválido' });
  }

  if (!categoriaExiste(categoriaId)) {
    return res.status(404).json({ error: 'Categoria não encontrada' });
  }

  const unidade = req.body?.unidade !== undefined ? String(req.body.unidade || '').trim() : produto.unidade;

  db.prepare(
    'UPDATE produtos SET nome = ?, categoria_id = ?, preco_custo = ?, preco_venda = ?, quantidade = ?, estoque_minimo = ?, unidade = ? WHERE id = ?'
  ).run(nome, categoriaId, precoCusto, precoVenda, quantidade, estoqueMinimo, unidade || null, id);

  const atualizado = db.prepare(`${produtoSelect} WHERE p.id = ?`).get(id);
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
