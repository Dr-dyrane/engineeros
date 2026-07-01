/* EngineerOS · POST /api/send-reminders
   The daily fan-out. Upstash QStash calls this once a day on a schedule and
   signs every request, so we verify QStash's signature and reject anything else.
   We load every stored subscription and push a gentle nudge to each, pruning any
   the browser has expired. */

import { Redis } from '@upstash/redis';
import { Receiver } from '@upstash/qstash';
import webpush from 'web-push';

// Read the raw body ourselves so the signature check sees exactly what QStash signed.
export const config = { api: { bodyParser: false } };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
const KEY = 'engineeros:push:subs';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  // Only QStash can trigger a send: verify its signature over the request body.
  const signature = req.headers['upstash-signature'];
  if (!signature) return res.status(401).json({ error: 'missing signature' });
  let body = '';
  try { body = await rawBody(req); } catch (_) { body = ''; }
  try {
    const valid = await receiver.verify({ signature, body });
    if (!valid) return res.status(401).json({ error: 'bad signature' });
  } catch (e) {
    return res.status(401).json({ error: 'bad signature' });
  }

  webpush.setVapidDetails(
    'mailto:halodyrane@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const all = (await redis.hgetall(KEY)) || {};
  const payload = JSON.stringify({
    title: 'EngineerOS',
    body: 'One small win today keeps your streak alive.',
    url: '/',
  });

  let sent = 0, pruned = 0;
  await Promise.all(Object.entries(all).map(async ([endpoint, raw]) => {
    let sub;
    try { sub = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { sub = raw; }
    if (!sub || !sub.endpoint) return;
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err) {
      const code = err && err.statusCode;
      if (code === 404 || code === 410) { await redis.hdel(KEY, endpoint); pruned++; }
    }
  }));

  return res.status(200).json({ ok: true, sent, pruned });
}
