/* Dyrane Academy · /api/discovery
   Store for Business Discovery assessments. Unlike /api/sync (zero-knowledge),
   these records are intentionally readable by Dyrane Academy, and the client is
   told so on the welcome screen. Trust model per record mirrors sync: the
   64-hex id is a client-side random secret, so possession of the id (the
   "continue code") is what grants access to that one record.

   POST { id, record }             -> upsert record + index (open: the assessment saves as the owner types)
   GET  ?id=<64-hex>               -> that record only (continue on another device)
   GET  ?key=<admin>&list=1        -> summaries of every record, newest first (admin)
   GET  ?key=<admin>&id=<64-hex>   -> one full record (admin)
   DELETE ?key=<admin>&id=<64-hex> -> remove a record (admin)

   Admin key: set DISCOVERY_ADMIN_KEY in Vercel env. If unset, admin routes are disabled. */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const PREFIX = 'discovery:client:';
const INDEX = 'discovery:index';
const MAX_RECORD = 300 * 1024; // 300 KB per assessment, plenty for text answers
const LIST_MAX = 200;

const isId = (s) => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);

/* Constant-time-ish admin key check (avoid early-exit string compare). */
function isAdmin(key) {
  const secret = process.env.DISCOVERY_ADMIN_KEY;
  if (!secret || typeof key !== 'string' || !key.length) return false;
  if (key.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= key.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

/* Keep only fields we expect; never trust arbitrary shapes into storage. */
function sanitize(record) {
  if (!record || typeof record !== 'object') return null;
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');
  const out = {
    version: Number(record.version) || 1,
    name: str(record.name, 120),
    business: str(record.business, 160),
    industry: str(record.industry, 120),
    pct: Math.max(0, Math.min(100, Number(record.pct) || 0)),
    completed: !!record.completed,
    started: Number(record.started) || Date.now(),
    updated: Number(record.updated) || Date.now(),
    answers: record.answers && typeof record.answers === 'object' && !Array.isArray(record.answers) ? record.answers : {},
  };
  return out;
}

const summary = (id, r) => ({
  id, name: r.name || '', business: r.business || '', industry: r.industry || '',
  pct: r.pct || 0, completed: !!r.completed, started: r.started || 0, updated: r.updated || 0,
});

export default async function handler(req, res) {
  const q = req.query || {};

  if (req.method === 'GET') {
    /* Admin list / detail */
    if (q.key !== undefined) {
      if (!isAdmin(q.key)) return res.status(401).json({ error: 'unauthorized' });
      if (q.list) {
        const ids = (await redis.zrange(INDEX, 0, LIST_MAX - 1, { rev: true })) || [];
        if (!ids.length) return res.status(200).json({ clients: [] });
        const raw = await redis.mget(...ids.map((id) => PREFIX + id));
        const clients = [];
        ids.forEach((id, i) => {
          const rec = raw && raw[i];
          if (!rec) return;
          const r = typeof rec === 'string' ? JSON.parse(rec) : rec;
          clients.push(summary(id, r));
        });
        return res.status(200).json({ clients });
      }
      if (isId(q.id)) {
        const rec = await redis.get(PREFIX + q.id);
        if (!rec) return res.status(404).json({ error: 'not found' });
        const r = typeof rec === 'string' ? JSON.parse(rec) : rec;
        return res.status(200).json({ id: q.id, record: r });
      }
      return res.status(400).json({ error: 'bad request' });
    }

    /* Owner fetch by continue code */
    if (!isId(q.id)) return res.status(400).json({ error: 'bad id' });
    const rec = await redis.get(PREFIX + q.id);
    if (!rec) return res.status(200).json({ found: false });
    const r = typeof rec === 'string' ? JSON.parse(rec) : rec;
    return res.status(200).json({ found: true, record: r });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = req.body || {};
    if (!isId(body.id)) return res.status(400).json({ error: 'bad id' });
    const record = sanitize(body.record);
    if (!record) return res.status(400).json({ error: 'bad record' });
    const payload = JSON.stringify(record);
    if (payload.length > MAX_RECORD) return res.status(413).json({ error: 'record too large' });
    await redis.set(PREFIX + body.id, payload);
    await redis.zadd(INDEX, { score: record.updated, member: body.id });
    return res.status(200).json({ ok: true, updated: record.updated });
  }

  if (req.method === 'DELETE') {
    if (!isAdmin(q.key)) return res.status(401).json({ error: 'unauthorized' });
    if (!isId(q.id)) return res.status(400).json({ error: 'bad id' });
    await redis.del(PREFIX + q.id);
    await redis.zrem(INDEX, q.id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'method not allowed' });
}
