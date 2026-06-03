const express = require('express');
const db = require('../database');

const router = express.Router();

const periodoFiltro = (periodo) => {
  if (!periodo) {
    return { clause: '', params: [] };
  }

  if (periodo === 'dia') {
    return { clause: "WHERE date(data) = date('now','localtime')", params: [] };
  }

  if (periodo === 'semana') {
    return { clause: "WHERE date(data) >= date('now','localtime','-6 day')", params: [] };
  }

  if (periodo === 'mes') {
    return { clause: "WHERE date(data) >= date('now','localtime','start of month')", params: [] };
  }

  return null;
};

router.get('/resumo', (req, res) => {
  const filtro = periodoFiltro(req.query.periodo);
  if (!filtro) {
    return res.status(400).json({ error: 'periodo inválido' });
  }

  const resumo = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN quantidade * valor_unitario END), 0) AS gasto,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN quantidade * valor_unitario END), 0) AS lucro
       FROM movimentacoes
       ${filtro.clause}`
    )
    .get(...filtro.params);

  const saldo = resumo.lucro - resumo.gasto;
  return res.json({ gasto: resumo.gasto, lucro: resumo.lucro, saldo });
});

router.get('/grafico', (req, res) => {
  const filtro = periodoFiltro(req.query.periodo);
  if (!filtro) {
    return res.status(400).json({ error: 'periodo inválido' });
  }

  const dados = db
    .prepare(
      `SELECT
        date(data) AS data,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN quantidade * valor_unitario END), 0) AS gasto,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN quantidade * valor_unitario END), 0) AS lucro
       FROM movimentacoes
       ${filtro.clause}
       GROUP BY date(data)
       ORDER BY date(data)`
    )
    .all(...filtro.params);

  return res.json(dados);
});

router.get('/categorias', (req, res) => {
  const dados = db
    .prepare(
      `SELECT
        COALESCE(p.categoria, 'Sem categoria') AS categoria,
        COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade * m.valor_unitario END), 0) AS gasto,
        COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade * m.valor_unitario END), 0) AS lucro
       FROM movimentacoes m
       JOIN produtos p ON p.id = m.produto_id
       GROUP BY COALESCE(p.categoria, 'Sem categoria')
       ORDER BY categoria`
    )
    .all();

  return res.json(dados);
});

module.exports = router;
