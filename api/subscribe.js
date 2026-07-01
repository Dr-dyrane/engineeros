/* EngineerOS · /api/subscribe
   POST   { subscription }  -> store a browser push subscription
   DELETE { endpoint }      -> forget one (used when reminders are turned off)

   The only thing stored is the anonymous push subscription (an endpoint URL plus
   public keys). No name, no progress, no personal data. Progress stays on the
   device. */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
const KEY = 'engineeros:push:subs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const body = req.body || {};
    const sub = body.subscription || body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'missing subscription' });
    await redis.hset(KEY, { [sub.endpoint]: JSON.stringify(sub) });
    return res.status(201).json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const endpoint = (req.body && req.body.endpoint) || (req.query && req.query.endpoint);
    if (endpoint) await redis.hdel(KEY, endpoint);
    return res.status(200).json({ ok: true });
  }
  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'method not allowed' });
}
