# Copilot instructions

## Build, test, lint commands
- Dev (Electron + server + client): `npm run dev`
- Dev server only: `npm run dev:server`
- Dev client only (Vite): `npm run dev:client`
- Build client: `npm run build:client`
- Build app (client + electron-builder): `npm run build`
- Start Electron app: `npm start`
- Tests: not defined in repo/spec.
- Lint: not defined in repo/spec.

## High-level architecture
- Electron main process (`electron/main.js`) starts the local Express server (`server/index.js`, default port 3333) before creating the browser window. In dev it loads Vite on port 5173; in prod it loads the built React bundle via `loadFile`.
- The Express API is the local backend for the desktop app, with routes split by domain in `server/routes/` (`auth`, `produtos`, `movimentacoes`, `dashboard`).
- Data is stored in SQLite; `server/database.js` opens the DB and initializes `server/schema.sql`. `server/backup.js` performs daily backups into the app data directory.
- The React UI lives under `client/src/` and talks to the backend through Axios (`client/src/services/api.js`), with auth state handled via `client/src/context/AuthContext.jsx`.

## Key conventions
- Use `better-sqlite3` (sync) for SQLite access; do not switch to async `sqlite3`.
- API runs on port 3333; if occupied, try 3334 then 3335. The client Axios base URL must match.
- Store dates as `TEXT` using `datetime('now','localtime')`; store money as `REAL`.
- PIN auth: bcrypt hash stored in `config` with key `pin_hash`; no JWT/cookies and no persistent sessions.
- Backups run once per day at app start, saved to `app.getPath('userData')/backups` as `backup_YYYY-MM-DD.db`, keeping the last 7.
- Electron Builder target is `nsis`, and the packaged app must bundle the Node/Express server (no external Node dependency).
