const fs = require('fs');
const path = require('path');
const db = require('./database');

const pad = (value) => String(value).padStart(2, '0');

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const listBackups = (backupDir) => {
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  return fs
    .readdirSync(backupDir)
    .filter((file) => /^backup_\d{4}-\d{2}-\d{2}\.db$/.test(file))
    .sort();
};

const runBackup = () => {
  const today = getToday();
  const ultimo = db.prepare('SELECT valor FROM config WHERE chave = ?').get('ultimo_backup');

  if (ultimo?.valor === today) {
    return { skipped: true };
  }

  const dbPath = db.dbPath;
  const backupDir = process.env.BACKUP_PATH || path.join(path.dirname(dbPath), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = path.join(backupDir, `backup_${today}.db`);
  fs.copyFileSync(dbPath, backupFile);

  const backups = listBackups(backupDir);
  if (backups.length > 7) {
    const toRemove = backups.slice(0, backups.length - 7);
    toRemove.forEach((file) => {
      fs.unlinkSync(path.join(backupDir, file));
    });
  }

  db.prepare(
    'INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor'
  ).run('ultimo_backup', today);

  return { skipped: false, file: backupFile };
};

module.exports = { runBackup };
