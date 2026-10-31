const express = require('express'), Database = require('better-sqlite3'), { customAlphabet } = require('nanoid');
const crypto = require('crypto'), path = require('path'), fs = require('fs');

// ---- Config (semua dari environment, lihat .env.example) ----
const { PORT = 3000, ORG_NAME = 'Inspektorat Pengawas Daerah' } = process.env;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
const CATS = ['pungli', 'bansos', 'pelayanan', 'fasilitas'];
const CODE_RE = /^AMAN-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// ---- Database ----
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const db = new Database(path.join(__dirname, 'data', 'amanlapor.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS reports (code TEXT PRIMARY KEY, category TEXT, location TEXT, incident_date TEXT, description TEXT,
  attachments TEXT DEFAULT '[]', status INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, sender TEXT, name TEXT, body TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS ix_messages_code ON messages(code);`);
for (const [t, c] of [['reports', 'updated_at'], ['reports', 'attachments'], ['messages', 'name']]) // migrasi DB versi lama
  if (!db.prepare(`PRAGMA table_info(${t})`).all().some(x => x.name === c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} TEXT`);

const genCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', 4);
const getReport = code => {
  const r = db.prepare('SELECT * FROM reports WHERE code=?').get(code);
  if (!r) return null;
  try { r.attachments = JSON.parse(r.attachments || '[]'); } catch { r.attachments = []; }
  if (!Array.isArray(r.attachments)) r.attachments = [];
  return r;
};
const getThread = code => db.prepare('SELECT sender,name,body,created_at FROM messages WHERE code=? ORDER BY id').all(code);
const addMsg = (code, sender, name, body) => db.prepare('INSERT INTO messages (code,sender,name,body) VALUES (?,?,?,?)').run(code, sender, name, body);
const txt = (v, max) => String(v ?? '').trim().slice(0, max);
const normDate = v => {
  const s = txt(v, 30);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
};

// ---- Middleware keamanan ----
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; frame-ancestors 'none'",
  });
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const hits = new Map(); // rate limit sederhana per IP + nama rute
const limit = (name, max, ms) => (req, res, next) => {
  const k = `${name}:${req.ip}`, now = Date.now(), h = (hits.get(k) || []).filter(t => now - t < ms);
  if (h.length >= max) return res.status(429).json({ error: 'Terlalu banyak permintaan, coba lagi nanti.' });
  hits.set(k, [...h, now]); next();
};
setInterval(() => hits.clear(), 3600e3).unref();

app.param('code', (req, res, next, v) => {
  req.code = v.toUpperCase();
  CODE_RE.test(req.code) ? next() : res.status(404).json({ error: 'Kode tidak ditemukan.' });
});

// ---- API publik (warga) ----
app.post('/api/reports', limit('create', 10, 3600e3), (req, res) => {
  const b = req.body || {}, category = txt(b.category, 20), description = txt(b.description, 2000);
  if (!CATS.includes(category) || !description) return res.status(400).json({ error: 'Kategori dan kronologi wajib diisi.' });
  let code;
  do code = `AMAN-${genCode()}-${genCode()}`; while (getReport(code));

  const rawAttachments = Array.isArray(b.attachments) ? b.attachments.slice(0, 10) : [];
  const savedAttachments = [];
  rawAttachments.forEach((att, idx) => {
    if (!att || typeof att.data !== 'string') return;
    const match = att.data.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return;
    const mime = txt(match[1], 100);
    const buf = Buffer.from(match[2], 'base64');
    if (!buf.length || buf.length > 15 * 1024 * 1024) return;
    const origName = txt(att.name || `bukti-${idx + 1}`, 120);
    const safeBase = origName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${code}-${idx + 1}-${Date.now()}-${safeBase}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buf);
    savedAttachments.push({
      name: origName,
      type: mime,
      size: buf.length,
      url: `/uploads/${fileName}`
    });
  });

  db.prepare('INSERT INTO reports (code,category,location,incident_date,description,attachments) VALUES (?,?,?,?,?,?)')
    .run(code, category, txt(b.location, 200), normDate(b.incident_date), description, JSON.stringify(savedAttachments));
  addMsg(code, 'system', null, 'Laporan diterima dan sedang menunggu verifikasi petugas.');
  res.json({ code });
});

app.get('/api/reports/:code', limit('lookup', 30, 60e3), (req, res) => {
  const r = getReport(req.code);
  r ? res.json({ ...r, org: ORG_NAME, messages: getThread(r.code) }) : res.status(404).json({ error: 'Kode tidak ditemukan.' });
});

app.post('/api/reports/:code/messages', limit('chat', 20, 60e3), (req, res) => {
  const body = txt(req.body?.body, 1000);
  if (!getReport(req.code)) return res.status(404).json({ error: 'Kode tidak ditemukan.' });
  if (!body) return res.status(400).json({ error: 'Pesan kosong.' });
  addMsg(req.code, 'citizen', null, body); res.json({ ok: true });
});

// ---- API admin (petugas): login -> token sesi 8 jam ----
const sessions = new Map();
const hash = s => crypto.createHash('sha256').update(String(s)).digest();
const auth = (req, res, next) => {
  const s = sessions.get((req.get('authorization') || '').slice(7));
  if (!s || s.exp < Date.now()) return res.status(401).json({ error: 'Sesi berakhir, silakan masuk lagi.' });
  req.officer = s.name; next();
};

app.post('/api/admin/login', limit('login', 5, 60e3), (req, res) => {
  const { name, password } = req.body || {};
  if (!crypto.timingSafeEqual(hash(password), hash(ADMIN_PASSWORD))) return res.status(401).json({ error: 'Kata sandi salah.' });
  const token = crypto.randomBytes(24).toString('base64url');
  sessions.set(token, { name: txt(name, 50) || 'Petugas', exp: Date.now() + 8 * 3600e3 });
  res.json({ token, name: sessions.get(token).name, org: ORG_NAME });
});

app.use('/api/admin', auth);

app.get('/api/admin/reports', (req, res) => {
  const { status, category, q } = req.query, w = [], p = [];
  if (/^[0-3]$/.test(status)) { w.push('status=?'); p.push(+status); }
  if (CATS.includes(category)) { w.push('category=?'); p.push(category); }
  if (q) { w.push('(code LIKE ? OR location LIKE ? OR description LIKE ?)'); p.push(...Array(3).fill(`%${txt(q, 50)}%`)); }
  const reports = db.prepare(`SELECT code,category,location,status,created_at FROM reports ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 200`).all(...p);
  const byStatus = [0, 1, 2, 3].map(s => db.prepare('SELECT COUNT(*) n FROM reports WHERE status=?').get(s).n);
  res.json({ reports, stats: { total: byStatus.reduce((a, b) => a + b, 0), byStatus,
    today: db.prepare("SELECT COUNT(*) n FROM reports WHERE date(created_at)=date('now')").get().n } });
});

app.get('/api/admin/reports/:code', (req, res) => {
  const r = getReport(req.code);
  r ? res.json({ ...r, messages: getThread(r.code) }) : res.status(404).json({ error: 'Kode tidak ditemukan.' });
});

app.post('/api/admin/reports/:code/status', (req, res) => {
  const status = Number(req.body?.status);
  if (![0, 1, 2, 3].includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });
  const r = db.prepare('UPDATE reports SET status=?, updated_at=CURRENT_TIMESTAMP WHERE code=?').run(status, req.code);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Kode tidak ditemukan.' });
});

app.post('/api/admin/reports/:code/messages', (req, res) => {
  const body = txt(req.body?.body, 1000);
  if (!getReport(req.code)) return res.status(404).json({ error: 'Kode tidak ditemukan.' });
  if (!body) return res.status(400).json({ error: 'Pesan kosong.' });
  addMsg(req.code, 'officer', req.officer, body); res.json({ ok: true });
});

app.use((err, _req, res, _next) => res.status(err.status || 500).json({ error: 'Permintaan tidak valid.' }));

app.listen(PORT, () => {
  console.log(`AmanLapor berjalan di http://localhost:${PORT}  |  Dashboard: /admin.html`);
  if (!process.env.ADMIN_PASSWORD) console.log(`ADMIN_PASSWORD tidak di-set. Sandi sementara: ${ADMIN_PASSWORD}`);
});
