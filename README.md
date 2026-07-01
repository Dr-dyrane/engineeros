# EngineerOS — by Dyrane Academy

**One day. One mission. One visible win.**

A calm, self-guided career accelerator that helps a newly graduated engineer become
visible, skilled, and employable, one small daily win at a time. Built for a Mechanical
Engineer in Nigeria growing into an AI-enabled Robotics Engineer, but the system works
for any technical graduate.

Live: [launch.dyrane.tech](https://launch.dyrane.tech)

> Learn. Build. Document. Share. Reflect. Repeat.

---

## What it is

EngineerOS is a buildless, modular single-page web app, plain ES modules and a CSS
design system, with no bundler and no build step for the app itself. It feels less like
an online course and more like an Apple-style setup assistant for a career. Everything
you do produces a visible artifact: a resume, a portfolio, a GitHub project, a LinkedIn
presence. Optional serverless functions (in `api/`) power daily push reminders; the app
runs fully without them.

### Eight journeys, sixty-one missions

1. **Become Discoverable** — email, career folder, photo, LinkedIn, GitHub, first resume
2. **Tell Your Story** — intro, final-year project, skills, bio, direction, pitch
3. **Build Your Portfolio** — case studies, visuals, contact, a publish plan
4. **Learn AI as a Tool** — ChatGPT, Claude, Perplexity, NotebookLM, verification
5. **Learn Python Slowly** — practical engineering scripting, not abstract coding
6. **Think in Projects** — one repeatable framework from idea to published repo
7. **Robotics Foundations** — electronics, Arduino, sensors, motors (free simulators)
8. **Career Launch** — ATS resume, networking, job tracker, internships, interviews

Each mission is small (15 to 90 minutes) and follows the same shape: **Why it matters,
Today's mission, Done checklist, Reflection, Mark complete.**

## Features

- **Progressive disclosure** — views render one at a time; the next step unlocks when the current one is done. A *Free navigation* switch unlocks everything.
- **Build Studio** — three full Studios with live preview: **Resume** (structured entries, ATS keyword match, action-verb and stat coaching, strength score, Print to PDF / text / Markdown), **Portfolio** (guided case studies, printable one-pager, hostable HTML export), and **LinkedIn** (character counters, post templates, profile preview, per-section copy).
- **A built-in coach** — a deterministic, on-device guide (no AI service, nothing leaves the page) reviews your resume, portfolio, and LinkedIn against concrete rules, drafts starters only from details you actually entered, and nudges your weakest area on every screen.
- **Daily reminders (optional)** — opt in and a push notification names your real next mission and streak. It is composed on your device by the service worker, so the server only sends a trigger and never learns your progress. See [docs/PUSH_SETUP.md](docs/PUSH_SETUP.md).
- **Progress** — overall ring, day streak, per-journey bars, readiness meters.
- **Weekly Review** — a five-question Sunday ritual, saved locally.
- **Resources** — real, curated links with Nigeria-specific picks.
- **Installable PWA** — works offline and on weak connections via a service worker; add it to your phone's home screen.
- **Light / Dark / System themes**, smooth Apple-HIG motion, reduced-motion support.
- **Your data stays on your device** (browser `localStorage`). Export or import a JSON backup anytime.
- **Cross-device sync (optional, end-to-end encrypted)** — turn it on for a secret sync code that encrypts your state on-device (PBKDF2 + AES-GCM). The server stores only ciphertext under an anonymous id, so it cannot read your progress or notes. Enter the code on another device and everything merges in, nothing already started is lost. Reuses the same Upstash Redis, no extra service.

## Design system

Apple-HIG inspired, encoded as tokens in `styles/` (see [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)):

- **Zero borders.** Surfaces are separated only by elevation, background tint, translucent material, blur, and shadow. No element declares a `border`.
- **Continuous-curve squircles**, an 8-pt spacing grid, a HIG-style type scale, semantic adaptive colors, and purposeful spring motion.
- **Micro-interactions** everywhere: hover-to-animate, touch-to-animate, focused one-view-at-a-time navigation.

## Project structure

```
api/                    · Vercel serverless functions (web push, mounted at /api)
   push-key.js          ·   serves the public VAPID key
   subscribe.js         ·   stores / removes a push subscription (Upstash Redis)
   send-reminders.js    ·   daily fan-out, verifies the QStash signature
public/                 · the static site, served at the domain root
   index.html           ·   shell, CDN + token wiring, SW registration
   sw.js                ·   service worker: offline app shell + push handling
   manifest.webmanifest ·   PWA manifest
   favicon* · icon-* · og.png · badge-96.png   ·   app icons and share image
   styles/              ·   tokens · base · components · studio · animations · print
   src/
      main.js           ·   event wiring + boot
      core/             ·   state · router · theme · dom · feedback · coach · context · push · push-context
      data/             ·   journeys (61 missions) · resources · earn · resume-assets
      ui/components.js   ·   reusable render helpers
      views/            ·   one module per screen (Studios, progress, earn, settings, ...)
tests/dom.test.mjs      · jsdom harness (npm test)
docs/                   · design system, push setup, build notes
vercel.json             · outputDirectory: public, security headers
```

## Run locally

The app is buildless and lives under `public/`. ES modules need to be served over http
(opening the file directly with `file://` will not load the modules), so serve that folder
with any static server:

```bash
cd public
python3 -m http.server 8000
# then visit http://localhost:8000
```

Run the test suite (a jsdom DOM + logic harness, 61 missions and every flow):

```bash
npm install   # dev only, pulls in jsdom
npm test
```

## Push notifications

The reminder backend is optional and free-tier. It uses Vercel serverless functions,
Upstash Redis (subscription store), and Upstash QStash (the daily signed trigger). The
step-by-step setup, including the environment variables and a template in
[.env.example](.env.example), is in [docs/PUSH_SETUP.md](docs/PUSH_SETUP.md).

## Deploy (Vercel → launch.dyrane.tech)

The app is static; the `api/` functions deploy alongside it.

1. Push this repo to GitHub.
2. In **Vercel > Add New > Project**, import the repo.
3. Framework preset: **Other**. No build command. Output directory is `public` (set in `vercel.json`). Vercel runs `npm install` for the `api/` functions automatically.
4. Deploy, then add `launch.dyrane.tech` under **Project > Settings > Domains**.
5. For reminders, set the environment variables from [docs/PUSH_SETUP.md](docs/PUSH_SETUP.md).

## Privacy

No accounts, no tracking. All progress, reflections, and builder content live only in
your browser on your device. Two things can optionally leave it, both privacy-preserving:
an anonymous push subscription token if you enable reminders, and an end-to-end encrypted
copy of your state if you enable cross-device sync. In the sync case the server only ever
holds ciphertext under an anonymous id and cannot read your data; lose the sync code and
that copy is unrecoverable by design. Everything else stays local.

## License

[MIT](LICENSE). Copyright (c) 2026 Dyrane Academy.

---

© Dyrane Academy · EngineerOS · *One mission at a time.*
