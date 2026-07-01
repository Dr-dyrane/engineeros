# EngineerOS · Push notifications setup

The code for real, close-the-app daily reminders is all in the repo. It stays dormant and harmless until the environment variables below are set. Everything here fits the free tiers.

## First, the thing that trips everyone up

Your local `.env` file is for local development only. It is gitignored (good, keep it that way) and it never reaches Vercel. Production functions read their config from **Vercel > Project > Settings > Environment Variables**. So every variable below has to be added there too, not just in `.env`.

## What runs where

- **Vercel** hosts the static app plus three functions: `api/push-key.js`, `api/subscribe.js`, `api/send-reminders.js`.
- **Upstash Redis** stores the anonymous push subscriptions. This is a *different product* from QStash. You have QStash already; you still need a Redis database.
- **Upstash QStash** calls `send-reminders` once a day and signs the request. The function verifies that signature, so only QStash can trigger a send. No shared secret needed.

## The variables

| Name | Where it comes from | You have it? |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` | not yet |
| `VAPID_PRIVATE_KEY` | same command | not yet |
| `UPSTASH_REDIS_REST_URL` | Upstash **Redis** database | not yet |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash **Redis** database | not yet |
| `QSTASH_CURRENT_SIGNING_KEY` | QStash (already in your `.env`) | yes |
| `QSTASH_NEXT_SIGNING_KEY` | QStash (already in your `.env`) | yes |

`QSTASH_URL` and `QSTASH_TOKEN` are only used to publish or schedule messages (the console does this for you), so the function itself does not need them.

## Steps

1. **VAPID keys.** Run `npx web-push generate-vapid-keys`, copy the public and private keys.
2. **Upstash Redis.** In the Vercel dashboard: **Storage > Marketplace > Upstash > Redis**, create a database, connect it to this project. Vercel injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for you. (If yours land as `KV_REST_API_URL` / `KV_REST_API_TOKEN`, the functions already fall back to those names.)
3. **Set the variables in Vercel.** Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` for Production. (Redis two were added in step 2.)
4. **Deploy.** Push to GitHub. Vercel runs `npm install` for the functions and deploys. The static app is unchanged.
5. **Schedule the daily send** in the Upstash Console > **QStash > Schedules > Create**:
   - Destination: `https://launch.dyrane.tech/api/send-reminders`
   - Method: `POST`
   - Cron: `0 7 * * *` (7:00 UTC, or any once-a-day time; QStash also supports a timezone)
   - No custom headers. QStash signs the request itself; the function verifies it.

## Test it

1. In the app: **Settings > Daily reminder**, switch on, allow notifications. On iPhone this only works after Add to Home Screen (iOS 16.4+).
2. Ask QStash to deliver one signed request right now (this exercises the real signature path). Use your EU publish URL and QStash token:

```bash
curl -X POST \
  "https://qstash-eu-central-1.upstash.io/v2/publish/https://launch.dyrane.tech/api/send-reminders" \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN"
```

QStash forwards a signed POST to the function, which should reply `{"ok":true,"sent":1,...}` and the notification lands. After that the schedule runs on its own each day.

## Notes

- Turning the toggle off in Settings unsubscribes the device and deletes its token from Redis.
- Expired subscriptions are pruned automatically on each send.
- A leaked function URL is useless without a valid QStash signature, so the endpoint cannot be abused.
