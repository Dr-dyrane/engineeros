/* EngineerOS · GET /api/push-key
   Returns the public VAPID key so the browser can subscribe to push.
   The public key is safe to expose; the private key never leaves the server. */

export default function handler(req, res) {
  // No caching: the app fetches this at opt-in time and must always see the live key.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || '' });
}
