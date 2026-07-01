# EngineerOS — Design System

**Version 1.0 · Dyrane Academy**
The reference every screen and element is built against. Apple-HIG inspired, encoded
as CSS tokens in `styles/`. If a value isn't here, it shouldn't be in the code.

---

## 1. Principles (the design laws)

1. **Zero borders.** No element declares a `border`. Surfaces are separated only by
   **elevation** — background tint, translucent material, blur, and shadow. In dark mode,
   raised surfaces get *lighter* (not outlined).
2. **Continuous-curve squircles.** Generous, consistent radii; true superellipse masks for
   flat decorative shapes (see §7).
3. **Defer to content.** Chrome is quiet glass; color and motion are spent on the one thing
   that matters on each screen.
4. **One focused view at a time.** No long scroll between sections — the router shows a single
   view and animates it in (progressive disclosure).
5. **Everything responds.** Hover-to-animate, touch-to-animate, spring on press. Motion is
   purposeful and always honors `prefers-reduced-motion`.

---

## 2. Color & surfaces

Semantic, adaptive (light / dark / system). Never hard-code hex in components — use the token.

| Token | Role |
|---|---|
| `--bg` | App canvas (behind everything) |
| `--surface-1` | Raised card / list row |
| `--surface-2` / `--surface-3` | Sheet / popover (higher elevation) |
| `--surface-sunken` | Inset wells — inputs, tracks, segmented |
| `--fill` / `--fill-strong` / `--fill-press` | Quiet fills (chips, ghost buttons, states) |
| `--text` / `--text-2` / `--text-3` | Primary / secondary / tertiary text |
| `--accent` `#0a84ff` | Primary action, links, selection |
| `--amber` `#ff9f0a` | The "today" / active mission |
| `--green` | Success, completion |
| `--red` | Destructive only |
| `--material` / `--material-strong` | Translucent glass for bars (blur `22px`, saturate `180%`) |

**Elevation = separation.** Use the shadow ladder, never a line:

| Token | Use |
|---|---|
| `--shadow-1` | Resting cards, list rows, tiles |
| `--shadow-2` | Hover / floating bars |
| `--shadow-3` | Toast, popovers, the logo mark |
| `--glow-accent` / `--glow-amber` / `--glow-green` | Filled buttons (colored ambient glow) |
| `--ring` | Focus ring (a `box-shadow`, **not** a border) |

---

## 3. Typography

System font first (`-apple-system` → real SF on Apple devices), **Inter** as the cross-platform
fallback. Use the scale classes, not raw sizes.

| Class | Size / weight | Use |
|---|---|---|
| `.t-display` | clamp 30–40px / 760 | Page titles |
| `.t-title1` | 27 / 680 | Card & mission titles |
| `.t-title2` | 22 / 680 | Sub-titles |
| `.t-headline` | 17 / 600 | Row titles, emphasis |
| `.t-body` | 16 / 400 | Body copy |
| `.t-callout` | 15 | Secondary body |
| `.t-foot` | 13 | Captions, hints |
| `.t-caption` | 11.5 | Eyebrows, badges |
| `.eyebrow` | 11.5 / 680 uppercase accent | Section kicker above a title |

Helpers: `.text-2` `.text-3` (de-emphasis), `.fw-medium/semibold/bold/heavy`, `.center`,
`.balance` (balanced wrapping for headings).

---

## 4. Spacing, radius, layout

- **Spacing** is an 8-pt grid: `--s-1`(4) `--s-2`(8) `--s-3`(12) `--s-4`(16) `--s-5`(20)
  `--s-6`(24) `--s-7`(32) … Utilities: `.mt-1…6`, `.mb-2…4`, `.stack` (vertical rhythm).
- **Radius** (squircle scale): `--r-xs`(10) `--r-sm`(14) `--r-md`(18) `--r-lg`(24)
  `--r-card`(26) `--r-sheet`(34) `--r-chip`(16) `--r-field`(14) `--r-pill`. Cards use `--r-card`.
- **Layout**: content max-width `--maxw` 720px, centered. `--topbar-h` 54, `--tabbar-h` 66
  (both respect safe-area insets). Helpers: `.row` `.col` `.between` `.grow` `.grid-2` `.grid-3`.

---

## 5. Motion

| Token | Curve | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(.4,0,.2,1)` | Color / opacity / general |
| `--ease-emphasized` | `cubic-bezier(.22,1,.36,1)` | View & element entrances (spring settle) |
| `--ease-springy` | `cubic-bezier(.34,1.56,.64,1)` | Toggles, check pops (gentle overshoot) |
| `--dur-1…4` | 130 / 220 / 340 / 520 ms | Press → page transition |

Patterns: `.view.is-entering` (view fades/slides in), `.stagger > *` (children cascade in),
`.reveal` (on-demand disclosure). **All disabled under `prefers-reduced-motion`** — opacity only.

---

## 6. Components

Each is a class in `styles/components.css`. States are built in.

- **Surfaces** — `.card`, `.card-tight`, `.sheet`, `.well`. Add `.tap` for a tappable card
  (hover lift + press scale). `.material` = glass layer for bars.
- **Buttons** — `.btn` + variant `.btn-primary` / `.btn-amber` / `.btn-success` / `.btn-ghost` /
  `.btn-quiet`; size `.btn-sm`; `.btn-row` to group. All spring on `:active`; hover only under
  `@media (hover:hover)` so touch devices don't get stuck states. `.iconbtn` for round icon buttons.
- **Chips** — `.chip` (+`.chip-sm`) with tint `.chip-accent/amber/green`, `.chip-muted` for locked.
- **Pills & badges** — `.pill`; `.badge` + `.badge-accent/amber/green`.
- **Lists** — `.list` (a column with gaps) of `.list-row` mini-surfaces. **Rows separate by space
  + soft fill, never lines.** Add `.tap`; `.is-muted` for locked rows.
- **Fields** — `.input`, `.textarea` (sunken wells; focus = ring, not border), `.field` + `<label>`,
  `.hint`. `.segmented` (sliding selector), `.switch`/`.knob` (toggle, springs).
- **Data viz** — `.meter > i` (animated bar; `.amber`/`.green`), `.ring` (SVG progress, gradient
  `#ringGrad`), `.stat`, `.ready` (readiness tile).
- **Checklist** — `.check` with custom `.box` that fills green and pops the check on `:checked`.
- **Chrome** — `#topbar` (glass, shadow appears on scroll via `.is-scrolled`), `.tabbar-pill`
  + `.tab` (`.is-active` lights accent), `#toast`, `#celebrate` + `.confetti`.
- **Numbered steps** — `.steps` (leading number chips, no lines).

---

## 7. Squircles — the honest rule

True iOS squircles (superellipse corners) can't cast a matching shadow in CSS cross-browser, and
shadow *is* how we separate surfaces. So:

- **Elevated surfaces** (cards, rows, buttons, sheets) use a **generous, consistent `border-radius`**
  — shadow-friendly and reads Apple-soft.
- **Flat decorative elements** (icon chips, avatars, image masks, the logo) may use the
  **`.squircle`** utility — a true superellipse via `mask-image` (`--squircle`) — where no shadow
  is needed. That's where the continuous curve reads most clearly.

This keeps the zero-border + elevation model intact while still delivering the squircle aesthetic.

---

## 8. Accessibility

- **Focus**: visible `--ring` on `:focus-visible` (keyboard only) — a ring, not a border.
- **Targets**: interactive elements ≥ 44px effective (buttons 52, icon buttons 40 + padding, tabs 60 min-width).
- **Motion**: full `prefers-reduced-motion` contract — no transforms, opacity only.
- **Contrast**: text tokens meet AA on their surfaces; on glass, badge text darkens in light mode
  and uses `--text` in dark.
- **Semantics**: real `<button>`, `<label>`-wrapped inputs, `aria-label` on icon-only controls,
  `role="status"` live region for the toast.

---

## 9. Theming

`light` / `dark` / `system`. Manual choice sets `data-theme` on `<html>`; `system` removes it and
follows `prefers-color-scheme`. A no-flash bootstrap in `index.html` applies the saved theme before
first paint. Every color is a token, so theming is automatic — components never reference a raw color.

---

## 10. How to extend

1. Need a new value? Add a **token** first (`styles/tokens.css`) — never inline a hex/px in a component.
2. Build the element from existing component classes; only add to `components.css` if it's truly new.
3. Obey the laws: no borders, elevation for separation, tokenized motion, hover + touch + focus states.
4. New screen? Add `src/views/<name>.js`, `registerView('<name>', render)`, navigate with `go('<name>')`.

> Learn. Build. Document. Share. Reflect. Repeat.
> © Dyrane Academy · EngineerOS — *One mission at a time.*
