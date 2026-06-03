const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const produtosRoutes = require('./routes/produtos');
const movimentacoesRoutes = require('./routes/movimentacoes');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/produtos', produtosRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const preferredPort = Number(process.env.PORT) || 3333;
const candidatePorts = Array.from(new Set([preferredPort, 3334, 3335]));

const startServer = (index = 0) => {
  const port = candidatePorts[index];
  const server = app.listen(port, () => {
    console.log(`Servidor Express rodando na porta ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && index < candidatePorts.length - 1) {
      console.warn(`Porta ${port} ocupada, tentando ${candidatePorts[index + 1]}...`);
      startServer(index + 1);
      return;
    }

    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  });
};

startServer();
