# EngineerOS — Experience Review & Improvement Plan

**v1.0 audit · Dyrane Academy.** An honest pass over what we shipped, measured against the
Apple/Google-grade bar we set. Grouped by impact ÷ effort so we fix the highest-leverage
things first.

---

## Audit snapshot — promises vs. reality

These are confirmed in the current code, not guesses:

- **Squircles are a promise, not a fact.** `.squircle` (true continuous-curve mask) is defined
  in `components.css` but **used nowhere** — every corner is a plain `border-radius`.
- **Tailwind is dead weight.** The CDN loads on every visit, but the app uses **zero** Tailwind
  utility classes (our own CSS system covers everything). We pay the download for nothing.
- **Lucide is unpinned** (`lucide@latest`) — a CDN change can silently break every icon.
- **No app identity.** No favicon, no `apple-touch-icon`, no Open Graph / Twitter image, no PWA
  manifest. The browser tab is blank, sharing `launch.dyrane.tech` shows nothing, and it can't be
  installed to a phone home screen.
- **No URL routing.** Views are in-memory only. A refresh always resets to Welcome/Home, the phone
  back-gesture **exits the app** instead of going back a view, and you can't link to a mission.
- **Zero image assets** — no logo artwork, no illustrations, no per-resource icons. The product that
  preaches "show your visuals" shows none of its own.

None of this is broken — it works and it's live. It's the gap between *working* and *Apple-grade*.

---

## Tier 1 — Foundation & credibility  *(high impact · low effort — do first)*

1. **App identity kit.** Favicon set + `apple-touch-icon` + maskable PWA icon + Open Graph/Twitter
   share image + `manifest.webmanifest`. *Why:* real tab identity, rich link previews, "Add to Home
   Screen." This is what makes it feel like a product, not a draft.
2. **URL routing (hash-based, buildless-friendly).** `#/home`, `#/journey/3`, `#/mission/j5m2`.
   *Why:* refresh-safe, the phone/browser **Back** works, missions become shareable links, history is real.
3. **Honor our own design system — apply `.squircle`.** Chips, the logo mark, avatars, badges →
   true continuous corners (shadow-safe spots). Make the documented system real.
4. **Resolve Tailwind.** Recommendation: **remove it** — our token CSS is complete, so this is pure
   speed + simplicity. (Alternative: actually adopt it. Pick one; don't ship both half-used.)
5. **Pin Lucide** to a fixed version. Stability over surprise.
6. **Per-view `document.title` + focus management.** Update the title on navigation and move focus to
   the new view's heading. *Why:* history readability + screen-reader announcement on route change.

## Tier 2 — Experience polish  *(high impact · medium effort)*

1. **Real brand mark + welcome visual.** A proper EngineerOS logo and a hero with depth/material,
   not a single stock icon on a gradient.
2. **Close the mission ⇄ builder loop.** Missions say "open the Resume Builder" — add the actual
   inline button that takes you there (and back). Right now it's a manual instruction.
3. **Builders 2.0.** Live Markdown preview, character counters (e.g. LinkedIn headline 220),
   gentle "looks empty / looks good" cues, per-section copy.
4. **Resources 2.0.** Search box, a **Nigeria-only** filter, and a favicon per link so the list
   reads like a curated shelf, not raw URLs.
5. **Directional, spatial motion.** Forward = push-in, Back = pop-out (not the same fade both ways);
   subtle shared-element feel on cards. Makes navigation legible.
6. **Earned completion moments + richer empty states.** A satisfying "win → next mission" hand-off,
   and empty states with personality instead of one line.
7. **Progress depth.** A streak calendar/heatmap, milestone badges, and a clear "what's next."

## Tier 3 — Depth & retention  *(medium/high effort)*

1. **True offline PWA** (service worker + manifest). Installable, loads on a weak connection —
   genuinely valuable for the Nigerian context the product targets.
2. **Backup safety.** Proactive "export your progress" nudge (localStorage can be wiped); later,
   optional cloud sync so a cleared browser doesn't erase months of work.
3. **Streak system.** Weekly goals, gentle nudges, a one-day "repair" so a single miss doesn't
   nuke momentum.
4. **Search / command palette.** Jump to any mission, builder, or resource instantly.
5. **Portfolio & Resume print/PDF view.** Turn the builder content into something presentable, not
   just Markdown.

---

## Placeholders to replace (the "lots of placeholders" list)

| Placeholder | Replace with |
|---|---|
| Lucide `compass` icon as the logo | A real EngineerOS brand mark |
| Text-only welcome | Hero with brand + depth |
| `lucide@latest` | Pinned version |
| Tailwind CDN (unused) | Removed (or actually used) |
| `.squircle` defined, unused | Applied to chips/logo/avatars |
| No favicon / OG / icons | Full identity kit |
| Raw URL list in Resources | Search + filter + per-site icons |
| In-memory routing | Hash routes + deep links |
| Builder field examples (e.g. "Adaeze Okafor") | *Keep* — these are input hints, intentional |

---

## Recommended sequence

**Tier 1 first** — a focused pass of high-leverage, low-risk fixes that close the credibility gap and
make the foundation honest. Then **Tier 2** polish to reach the premium feel, and **Tier 3** as the
product matures into something people rely on daily.

> The bar: every screen should make a beginner think *"I can do this today,"* and make an employer
> think *"this person ships."*

---

## Update — post-Resume-Studio re-audit (independent review)

### Shipped since v1.0
- **Tier 1 foundation**: app identity kit (favicon, app icons, OG share image, PWA manifest), hash routing (refresh-safe, real Back, deep links, per-view titles + focus), `.squircle` applied, Tailwind removed, Lucide pinned.
- **Resume Studio**: structured entries, live ATS-safe paper preview, strength score, ATS keyword match, action-verb + XYZ coaching, Print→PDF + text/markdown export, auto-migration of old data.
- **Audit quick-fixes**: fixed an undefined `--green-soft` token (matched ATS chips had no background); `aria-label`s on all Resume fields; streak dates now **local** (was UTC — wrong day in WAT); theme quick-toggle now syncs the Settings segmented control; icon buttons raised to **44px** + `backdrop-filter` fallback + slightly higher glass opacity; **missions now deep-link to their builder** (real "Open the Resume/Portfolio/LinkedIn builder" buttons); **confirm before deleting** a non-empty resume entry; Inter font loads **non-blocking**.

### Still open — prioritized

**High**
- **Portfolio Studio + LinkedIn Studio** — level them up to the Resume bar. Today they're plain-textarea builders next to a premium Studio: the single biggest consistency gap. *(L)*
- **Service worker** — manifest/icons exist but nothing caches, so the "installable / works offline" promise is unfulfilled (matters most for the low-connectivity target audience). *(M)*

**Medium**
- Resources **search + Nigeria-only / Free filters** (the badges/flags already exist to power it). *(M)*
- **Error boundary** around view renders so a bad state never white-screens. *(M)*
- Clearer **mobile "Save as PDF"** guidance (the marquee export is weakest on phones). *(M)*

**Low**
- `refreshIcons(root)` re-scans the whole document (ignores its root arg). *(S)*
- Guard journey/overall % math against an empty journey (latent). *(S)*
- Decide whether the **Weekly Review should extend the streak** (currently it does). *(S)*
- Directional push/pop **page transitions**; richer empty states + completion moments. *(M)*
- **Progress depth**: streak calendar/heatmap, milestone badges. *(M)*
- Proactive **backup nudge** (localStorage can be wiped). *(S)*

---

## Update — builders complete · responsive · offline

- **Portfolio Studio** shipped — guided case studies (Problem → Approach → Result), live one-pager preview, strength score, and Print→PDF / **hostable HTML** / Markdown export.
- **LinkedIn Studio** shipped — character counters, examples, post templates, profile preview, per-section copy, Markdown export. **All three builders now match the same bar — the consistency gap is closed.**
- **Responsive layout system** shipped — adaptive containers (reading / grid / wide) from mobile to large screens; card grids flow into columns; Studios get real split-screen room; Home is a 2-column dashboard on desktop. The 720px cap is gone.
- **Service worker** shipped — app shell + every module + icons precached; navigations network-first, same-origin stale-while-revalidate, CDN cache-first. EngineerOS is now a **true installable PWA that loads offline / on weak connections**.

**Still open:** Resources search + Nigeria/Free filters; error boundary around renders; backup-reminder nudge; directional page transitions; progress depth (streak heatmap); decide whether the Weekly Review should extend the streak; remove now-dead builder code in `build.js`/`main.js`.

---

## Update — completion pass

The actionable backlog is now cleared:

- **Resources search + filters** shipped. A live search box plus All / Nigeria / Free chips, with a friendly empty state when nothing matches.
- **Error boundary** shipped. View renders are wrapped, so a thrown render shows a calm "Something hiccuped, go home" card instead of a blank screen.
- **Backup nudge** shipped. After five completed missions, a one-time, gentle toast suggests exporting a backup from Settings.
- **Dead-code cleanup** done. The old textarea `builderView` and `exportBuilder` are gone from `build.js`, with their dead handlers removed from `main.js`. The Build hub copy now says "Studio".
- **Robustness.** Journey and progress percentages are guarded against an empty journey.

**Optional polish left (nice-to-have, not needed):** directional push/pop page transitions, a streak calendar or milestone badges on Progress, and scoping `refreshIcons` to its root. The Weekly Review intentionally still counts toward the streak (it is a weekly action, so it cannot inflate a daily streak).
