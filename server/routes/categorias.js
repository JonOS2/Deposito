const express = require('express');
const db = require('../database');

const router = express.Router();

const parseId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

router.get('/', (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias ORDER BY nome').all();
  return res.json(categorias);
});

router.post('/', (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    const result = db.prepare('INSERT INTO categorias (nome) VALUES (?)').run(nome);
    const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(categoria);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Categoria já cadastrada' });
    }

    throw error;
  }
});

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const nome = String(req.body?.nome || '').trim();
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  try {
    const result = db.prepare('UPDATE categorias SET nome = ? WHERE id = ?').run(nome, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id);
    return res.json(categoria);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Categoria já cadastrada' });
    }

    throw error;
  }
});

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id);
  if (!categoria) {
    return res.status(404).json({ error: 'Categoria não encontrada' });
  }

  const vinculados = db.prepare('SELECT COUNT(*) AS total FROM produtos WHERE categoria_id = ?').get(id);
  if (vinculados.total > 0) {
    return res.status(409).json({ error: 'Categoria possui produtos vinculados' });
  }

  db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
  return res.status(204).send();
});

module.exports = router;
