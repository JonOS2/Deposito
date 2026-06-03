const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');

const router = express.Router();

const loadPinHash = () => {
  return db.prepare('SELECT valor FROM config WHERE chave = ?').get('pin_hash');
};

router.post('/verificar', async (req, res, next) => {
  try {
    const pin = String(req.body?.pin || '').trim();
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN inválido' });
    }

    const row = loadPinHash();
    if (!row) {
      return res.status(404).json({ error: 'PIN não definido' });
    }

    const valido = await bcrypt.compare(pin, row.valor);
    if (!valido) {
      return res.status(401).json({ error: 'PIN incorreto' });
    }

    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/definir', async (req, res, next) => {
  try {
    const pin = String(req.body?.pin || '').trim();
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN inválido' });
    }

    const existente = loadPinHash();
    if (existente) {
      return res.status(409).json({ error: 'PIN já definido' });
    }

    const hash = await bcrypt.hash(pin, 10);
    db.prepare('INSERT INTO config (chave, valor) VALUES (?, ?)').run('pin_hash', hash);

    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
