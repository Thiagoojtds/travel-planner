// Banco de dados local simples (arquivo JSON) exposto como API REST dentro do servidor do Vite.
// Zero dependências. Grava em ./data/db.json com escrita atômica e backups automáticos.
// Quando o backend/banco em nuvem estiver pronto, basta trocar este plugin por um proxy
// para a API real mantendo os mesmos endpoints (GET /api/db, PUT /api/db/:colecao).
import fs from 'node:fs';
import path from 'node:path';

const COLLECTIONS = ['truck', 'freights', 'expenses', 'maintenances', 'checklists', 'fixedExpenses'];
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const BACKUP_INTERVAL_MS = 10 * 60 * 1000;
const MAX_BACKUPS = 40;

export default function dbPlugin(options = {}) {
  const dataDir = path.resolve(options.dataDir || 'data');
  const dbFile = path.join(dataDir, 'db.json');
  const backupDir = path.join(dataDir, 'backups');
  let lastBackupAt = 0;

  const readDb = () => {
    try {
      return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return {};
      // Arquivo corrompido: nunca sobrescrever silenciosamente
      throw new Error('db.json inválido: ' + err.message);
    }
  };

  const backupIfNeeded = () => {
    if (!fs.existsSync(dbFile)) return;
    const now = Date.now();
    if (now - lastBackupAt < BACKUP_INTERVAL_MS) return;
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(dbFile, path.join(backupDir, `db-${stamp}.json`));
    lastBackupAt = now;
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith('db-')).sort();
    files.slice(0, Math.max(0, files.length - MAX_BACKUPS)).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
  };

  const writeDb = db => {
    fs.mkdirSync(dataDir, { recursive: true });
    backupIfNeeded();
    const tmp = dbFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmp, dbFile);
  };

  const send = (res, status, payload) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(payload));
  };

  const readBody = req =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          reject(new Error('Payload muito grande'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });

  const handler = async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/db' && !url.pathname.startsWith('/api/db/')) return next();

    try {
      if (req.method === 'GET' && url.pathname === '/api/db') {
        return send(res, 200, { data: readDb() });
      }

      if (req.method === 'PUT' && url.pathname.startsWith('/api/db/')) {
        const name = decodeURIComponent(url.pathname.slice('/api/db/'.length));
        if (!COLLECTIONS.includes(name)) return send(res, 404, { error: 'Coleção desconhecida: ' + name });
        const value = JSON.parse(await readBody(req));
        const db = readDb();
        db[name] = value;
        db._updatedAt = new Date().toISOString();
        writeDb(db);
        return send(res, 200, { ok: true });
      }

      return send(res, 405, { error: 'Método não permitido' });
    } catch (err) {
      console.error('[db]', err);
      return send(res, 500, { error: String(err.message || err) });
    }
  };

  return {
    name: 'local-json-db',
    configureServer(server) {
      server.middlewares.use(handler);
      console.log(`[db] Banco local em ${dbFile}`);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}
