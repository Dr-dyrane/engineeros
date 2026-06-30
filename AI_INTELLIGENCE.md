# EngineerOS — In-App Intelligence Audit and Context Plan

Where agent intelligence fits, what context each agent needs, and how to wire it
into a calm, beginner-safe, privacy-respecting product. This is a design map, not a
build. Implementation order is at the end.

---

## Principles (how AI is allowed to show up here)

1. **On-demand, never in your face.** The user invites help with a tap. Nothing
   auto-pops or interrupts the daily loop.
2. **Assist, never replace the voice.** The AI sharpens what the user wrote. It does
   not speak for them. Every output is editable and clearly theirs.
3. **Honesty first.** It never invents experience, projects, or metrics on a resume or
   profile. It only helps phrase what is real, and it asks the user for the real number.
   This matches the curriculum's own "Catch AI Mistakes" mission.
4. **Privacy by default.** All data lives on the device. An AI call is explicit, opt-in,
   and sends the smallest useful slice, never the whole profile.
5. **Beginner-safe.** Short, plain answers. One suggestion at a time. Always a reason.
6. **Degrades gracefully.** AI is an enhancement. With no key, no network, or offline,
   every core feature still works exactly as it does today.

---

## The audit: where intelligence fits, page by page

For each surface: the element, the capability, the context it reads, and what it returns.

### Home / Today
- **Daily focus coach** (on the "Today" card). Looks at what is lagging and suggests the
  highest-leverage next move. *Context:* completed missions, readiness scores, streak,
  today's mission, last 1–2 reflections. *Returns:* one sentence of why this is today's win.
- **Encouragement line.** A short, honest nudge tied to real progress (not generic hype).
  *Context:* streak, recent completions. *Returns:* one line.

### Journey / Journey detail
- **Adaptive path hint.** "Given your goal, do Journey 4 before Journey 5." *Context:*
  stated career direction, completion, readiness gaps. *Returns:* a recommended next step.

### Mission (the core loop) — high value
- **Reflection coach.** After the user writes a reflection, offer one thoughtful follow-up
  or affirmation, turning a text box into a two-line conversation. *Context:* the mission
  (why/today), this reflection, the last few reflections. *Returns:* one short reply.
- **"Stuck? Ask."** An inline assistant scoped to *this* mission only. *Context:* the
  mission's why + steps + checklist + the user's question. *Returns:* a focused answer with
  a verify reminder when it states a fact.
- **Tailored example.** Generate one worked example in the user's field (mechanical
  engineering moving to AI/robotics). *Context:* mission task + field. *Returns:* a concrete example.

### Resume Studio — highest value, tightest context
- **Bullet rewriter.** Turn a weak bullet into the XYZ shape with a metric prompt.
  *Context:* the bullet, the role, the field, the action-verb list. *Returns:* 1–2 rewrites,
  plus a question if a number is missing. Never fabricates the number.
- **Summary drafter.** Draft the professional summary from the real entries and target role.
  *Context:* experience + projects + skills + target job description. *Returns:* a 2–3 line draft.
- **Quantify helper.** Suggest *what kind* of metric could apply, so the user fills the real one.
- **ATS gap suggestions.** For each missing keyword, suggest where it could honestly go.
  *Context:* resume text + pasted job description + the missing-keyword list. *Returns:* honest placements.
- **Tailor to a job.** Re-emphasize the resume for a pasted posting (reorder, surface
  relevant bullets), without inventing anything. *Context:* resume + job description.

### Portfolio Studio
- **Case-study drafter.** From rough notes, structure Problem, Approach, Result, and prompt
  for a metric. *Context:* project title + rough notes + skills. *Returns:* a structured draft.
- **Result sharpener.** Suggest a metric type for the Result line.
- **About drafter.** From their projects and direction. *Context:* projects + direction.

### LinkedIn Studio
- **Headline / About / Post drafter, in their voice.** Turn "I built X" into a full post.
  *Context:* the thing built or learned + their tone (sampled from existing text) + length target.
  *Returns:* a draft inside the character limits, ending with a question.

### Progress
- **Weekly insight.** "Strongest: projects. Gap: LinkedIn. One thing this week: write your
  headline." *Context:* readiness + completion + streak. *Returns:* one strength, one gap, one action.

### Weekly Review
- **Review synthesizer.** Read the five answers plus the week's completed missions and return
  a short, encouraging synthesis and a single next-week focus. *Context:* this week's review
  answers + the week's activity. *Returns:* 2–3 sentences + one focus.
- **Pattern spotting** across past reviews over time (what keeps confusing them).

### Resources / Earn
- **Personalized picks and a plan.** "Given your CAD skills, start with Fiverr gigs. Here is
  a first-week plan." *Context:* field, skills, completed missions, time available. *Returns:*
  ranked picks + a concrete first step.

### Global: "Ask EngineerOS"
- A single assistant (a quiet button in the top bar) scoped to the user's whole journey:
  "what should I do next," "review my resume," "is my LinkedIn ready." *Context:* the compact
  user profile (below) plus whatever surface they are on. The connective tissue across all of the above.

---

## Context architecture (the part that makes it work)

### 1. The user model already exists
EngineerOS state (in `localStorage`) is a ready-made profile: `user.name`, `completed`
missions, `missionData` (reflections and notes), `builders.resume` / `.portfolio` /
`.linkedin` (structured), `streak`, `reviews`, plus derived `readiness` scores, current
journey, and today's mission. Nothing new needs to be collected to start.

### 2. A context layer (proposed `src/core/context.js`)
- `userProfile()` returns a compact, prompt-ready summary, a few hundred tokens at most:
  name, field and direction, what they have built (one line each), strengths and gaps from
  readiness, current focus. This is the shared context every agent receives.
- `contextFor(task, args)` returns the *task-specific* slice and nothing else. For the bullet
  rewriter that is `{ field, role, bullet, targetJD }`. For the daily coach it is
  `{ readiness, streak, todaysMission, recentReflections }`.
- Rule: agents get `userProfile()` plus one `contextFor(task)` slice. Never the raw blob.

### 3. A rolling profile memory
Maintain a small, updatable summary (field, goal, strengths, gaps, voice sample) that is
refined as the user progresses and is prepended to prompts. This is cheap long-term memory,
separate from the raw data, and keeps every prompt lean and consistent.

### 4. Token discipline
Send slices, not history. Summarize the past (last 3 reflections, not all 60). Cap inputs.
Stream outputs so the calm UI stays responsive.

### 5. Privacy and consent
Local data leaves the device only on an explicit AI action. Show a one-time, plain
explanation the first time. Send the minimum. Offer a global "AI off" switch in Settings.

---

## How to actually call AI from a buildless static app

The app is static and offline-capable. Three ways to add intelligence:

- **A. Serverless proxy (recommended to start).** A tiny Vercel function (`/api/agent`)
  holds the API key and talks to Claude. The browser calls your own endpoint. Pros: key is
  safe, you control prompts and caps, you can offer a free allowance to beginners. Cons: you
  pay per use, so add strict rate limits and a daily cap per device.
- **B. Bring your own key (BYOK).** The user pastes a Claude or OpenAI key into Settings,
  stored locally, and the browser calls the API directly. Pros: zero cost to you, no backend.
  Cons: most beginners have no key, and the key sits in the browser.
- **C. Hybrid.** A small free allowance through your proxy, with BYOK for heavy users. Best
  long-term balance of reach and cost.

The app keeps working with no key set: AI buttons simply stay hidden or show "add a key in
Settings." Core features never depend on AI.

---

## Guardrails

- **No fabrication.** The resume and portfolio agents may never invent a role, a project, or
  a number. They prompt the user for the real one.
- **Keep the voice.** Drafts are seeded from the user's own words and are always editable.
- **Verify reminders.** When an agent states a fact, it adds a short "check this" line, the
  same habit the curriculum teaches.
- **Caps and failure.** Rate-limit per device, handle timeouts quietly, and never block the UI.
- **Offline.** AI degrades to hidden. The service worker and the rest of the app are untouched.

---

## Phased rollout

- **Phase 1 — Resume Studio intelligence.** Bullet rewriter and summary drafter. Tightest
  context, clearest value, and it produces the deliverable that gets a job. Ship the context
  layer (`userProfile` + `contextFor`) and the proxy here.
- **Phase 2 — Portfolio and LinkedIn drafters + the mission reflection coach.** Reuse the
  same context layer and proxy.
- **Phase 3 — "Ask EngineerOS" + proactive Home and Progress insights.** The connective
  assistant and the gentle weekly nudges, once the context layer has proven itself.

---

## The one decision that unblocks building

Pick the **delivery model** (proxy with your key, BYOK, or hybrid) and the **first surface**
(recommended: the Resume Studio bullet rewriter). Everything else reuses the same context
layer and guardrails.
