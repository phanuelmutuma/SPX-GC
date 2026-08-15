# AGENTS.md

## Cursor Cloud specific instructions

SPX Graphics Controller (`spx-gc`) is a single Node.js/Express + Socket.io monolith (no database, no monorepo). Content (projects, rundowns, config) is stored as JSON files under `DATAROOT/`; there are no external services required to run and test the product end to end. Node.js >= 18 is required (see `engines` in `package.json`).

### Running the app (dev)
- The server runs on `http://localhost:5656`. On first boot it auto-generates `config.json`, `LOG/`, and needed folders.
- `npm start` (`node server.js`) runs the server directly and works as-is.
- `npm run dev` uses `nodemon.json` so hot reload watches server/UI code only. Runtime writes under `DATAROOT/`, `ASSETS/`, `LOG/`, and `config.json` are ignored and will not restart the server (playing graphics constantly writes rundown JSON). Do not pass unquoted `DATAROOT/*` ignore globs on the command line: the shell expands them and `server.js` treats those directories as a config path (`EISDIR`).

### Core workflow / hello-world
Open `http://localhost:5656` → PROJECTS → open `MyFirstProject` → open `MyFirstRundown` (direct URL `http://localhost:5656/gc/MyFirstProject/MyFirstRundown`). Select a rundown item and click the green PLAY button to take a graphic on air (preview renders it and PLAY toggles to red STOP); the "+" button adds template items. A JSON API is available, e.g. `GET /api/v1/version`.

### Lint / test / build
- There is no linter configured (no ESLint/Prettier config) and no automated test suite — the `test` script is a placeholder that exits 1. Do not expect `npm test` or a lint command to pass.
- `npm run build:*` (macOS/Windows/Linux) packages desktop binaries via `@yao-pkg/pkg`; this is only for producing distributables and is not needed for development.
