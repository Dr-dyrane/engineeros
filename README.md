# EngineerOS — by Dyrane Academy

**One mission at a time.**

A calm, self-guided career accelerator that helps a newly graduated engineer become
visible, skilled, and employable — one small daily win at a time. Built for a
Mechanical Engineer in Nigeria growing into an AI-enabled Robotics Engineer, but the
system works for any technical graduate.

> Learn. Build. Document. Share. Reflect. Repeat.

---

## What it is

EngineerOS is a buildless, modular single-page web app — plain ES modules and a
CSS design system, no bundler, no backend, no build step. It feels less like an
online course and more like an Apple-style setup assistant for a career. Everything
you do produces a visible artifact: a resume, a portfolio, a GitHub project, a
LinkedIn presence.

### Eight journeys, sixty-one missions

1. **Become Discoverable** — email, career folder, photo, LinkedIn, GitHub, first resume
2. **Tell Your Story** — intro, final-year project, skills, bio, direction, pitch
3. **Build Your Portfolio** — case studies, visuals, contact, a publish plan
4. **Learn AI as a Tool** — ChatGPT, Claude, Perplexity, NotebookLM, verification
5. **Learn Python Slowly** — practical engineering scripting, not abstract coding
6. **Think in Projects** — one repeatable framework from idea to published repo
7. **Robotics Foundations** — electronics, Arduino, sensors, motors (free simulators)
8. **Career Launch** — ATS resume, networking, job tracker, internships, interviews

Each mission is small (15–90 minutes) and follows the same shape: **Why it matters →
Today's mission → Done checklist → Reflection → Mark complete.**

## Features

- **Progressive disclosure** — views render one at a time; the next step unlocks when the current one is done. A *Free navigation* switch unlocks everything.
- **Build Studio** — Resume, Portfolio, and LinkedIn builders that export to Markdown.
- **Progress** — overall ring, day streak, per-journey bars, readiness meters.
- **Weekly Review** — a five-question Sunday ritual, saved locally.
- **Resources** — real, curated links with Nigeria-specific picks.
- **Light / Dark / System themes**, smooth Apple-HIG motion, reduced-motion support.
- **Your data stays on your device** (browser `localStorage`). Export / import a JSON backup anytime.

## Design system

Apple-HIG inspired, encoded as tokens in `styles/`:

- **Zero borders.** Surfaces are separated only by elevation — background tint,
  translucent material, blur and shadow. No element declares a `border`.
- **Continuous-curve squircles**, an 8-pt spacing grid, a HIG-style type scale,
  semantic adaptive colors, and purposeful spring motion (with reduced-motion support).
- **Micro-interactions** everywhere: hover-to-animate, touch-to-animate, focused
  one-view-at-a-time navigation.

## Tech

Vanilla HTML + CSS + JavaScript (ES modules). No build step. CDN-loaded
**Tailwind**, **Lucide** icons, and **Inter** (with the system font / SF first).

```
index.html            · shell, CDN wiring, Tailwind→token config
styles/               · tokens · base · components · animations
src/data/             · journeys (61 missions) · resources
src/core/             · state · router · theme · feedback · dom
src/ui/components.js   · reusable render helpers
src/views/            · one module per screen
src/main.js           · event wiring + boot
```

## Run locally

ES modules need to be served over http (opening the file directly with `file://`
won't load the modules). Use any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (Vercel → launch.dyrane.tech)

This repo is a static site — no build command, no output directory.

1. Push this repo to GitHub (see below).
2. In **Vercel → Add New → Project**, import the GitHub repo.
3. Framework preset: **Other**. Build command: *none*. Output directory: *(leave as root)*.
4. Deploy.
5. **Project → Settings → Domains → Add** `launch.dyrane.tech`. Since `dyrane.tech` is
   already on this Vercel account, Vercel adds the `CNAME` for the `launch` subdomain
   automatically.

## Privacy

No accounts, no tracking, no servers. All progress, reflections, and builder content
live only in your browser on your device.

---

© Dyrane Academy · EngineerOS v1.0 — *One mission at a time.*
