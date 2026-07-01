/* EngineerOS · GET /api/push-key
   Returns the public VAPID key so the browser can subscribe to push.
   The public key is safe to expose; the private key never leaves the server. */

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || '' });
}
