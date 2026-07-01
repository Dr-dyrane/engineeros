/* EngineerOS · /api/sync
   Encrypted, zero-knowledge sync store. The browser encrypts the whole app
   state on-device with a key derived from the user's secret sync code, and we
   only ever store the resulting ciphertext under an opaque id (a hash of the
   code). We cannot read it, and without the code the blob is useless.

   GET  ?id=<64-hex>            -> { found, salt, blob, updated }
   POST { id, salt, blob, updated } -> stores it (last write wins per slot) */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
const PREFIX = 'engineeros:sync:';
const MAX_BLOB = 1024 * 1024;                 // 1 MB ciphertext cap
const isId = (s) => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const id = req.query && req.query.id;
    if (!isId(id)) return res.status(400).json({ error: 'bad id' });
    const rec = await redis.get(PREFIX + id);
    if (!rec) return res.status(200).json({ found: false });
    const r = typeof rec === 'string' ? JSON.parse(rec) : rec;
    return res.status(200).json({ found: true, salt: r.salt, blob: r.blob, updated: r.updated || 0 });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = req.body || {};
    const { id, salt, blob } = body;
    if (!isId(id)) return res.status(400).json({ error: 'bad id' });
    if (!salt || typeof salt !== 'string' || !blob || typeof blob !== 'string') {
      return res.status(400).json({ error: 'missing salt or blob' });
    }
    if (blob.length > MAX_BLOB) return res.status(413).json({ error: 'blob too large' });
    await redis.set(PREFIX + id, { salt, blob, updated: Number(body.updated) || Date.now() });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT');
  return res.status(405).json({ error: 'method not allowed' });
}
