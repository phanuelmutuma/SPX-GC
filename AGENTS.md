# AGENTS.md

## Cursor Cloud specific instructions

SPX Graphics Controller (`spx-gc`) is a single Node.js/Express + Socket.io monolith (no database, no monorepo). Content (projects, rundowns, config) is stored as JSON files under `DATAROOT/`; there are no external services required to run and test the product end to end. Node.js >= 18 is required (see `engines` in `package.json`).

### Running the app (dev)
- The server runs on `http://localhost:5656`. On first boot it auto-generates `config.json`, `LOG/`, and needed folders.
- `npm start` (`node server.js`) runs the server directly and works as-is.
- The committed `npm run dev` script is `nodemon server.js -i DATAROOT/* -i ASSETS/* -i config.json -i DATAROOT_VIDEO/*`. Those `-i` glob args are meant to be nodemon ignore patterns, but because `DATAROOT/` and `ASSETS/` contain subdirectories the shell expands the globs and passes directory paths to `server.js` as its config-file argument, which crashes with `EISDIR ... reading config.json`. To get hot reload, quote the globs so nodemon (not the shell) expands them:

  `npx nodemon server.js -i 'DATAROOT/*' -i 'ASSETS/*' -i 'config.json' -i 'DATAROOT_VIDEO/*'`

  The `nodemon` ignore patterns exist so runtime edits to project/rundown/asset JSON (which happen constantly while operating the UI) do NOT restart the server. Playing graphics in the UI writes to files under `DATAROOT/` (e.g. `DATAROOT/MyFirstProject/data/*.json`); revert those runtime changes before committing.

### Core workflow / hello-world
Open `http://localhost:5656` → PROJECTS → open `MyFirstProject` → open `MyFirstRundown` (direct URL `http://localhost:5656/gc/MyFirstProject/MyFirstRundown`). Select a rundown item and click the green PLAY button to take a graphic on air (preview renders it and PLAY toggles to red STOP); the "+" button adds template items. A JSON API is available, e.g. `GET /api/v1/version`.

### Lint / test / build
- There is no linter configured (no ESLint/Prettier config) and no automated test suite — the `test` script is a placeholder that exits 1. Do not expect `npm test` or a lint command to pass.
- `npm run build:*` (macOS/Windows/Linux) packages desktop binaries via `@yao-pkg/pkg`; this is only for producing distributables and is not needed for development.
