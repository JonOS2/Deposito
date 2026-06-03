const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  } else {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    window.loadURL(devUrl);
  }
};

const ensureEnv = () => {
  if (!process.env.PORT) {
    process.env.PORT = '3333';
  }

  const userData = app.getPath('userData');
  if (!process.env.DB_PATH) {
    process.env.DB_PATH = path.join(userData, 'deposito.db');
  }

  if (!process.env.BACKUP_PATH) {
    process.env.BACKUP_PATH = path.join(userData, 'backups');
  }
};

const startBackend = () => {
  require(path.join(__dirname, '..', 'server', 'index.js'));
  const { runBackup } = require(path.join(__dirname, '..', 'server', 'backup.js'));
  runBackup();
};

app.whenReady().then(() => {
  ensureEnv();
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
