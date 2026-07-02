// @ts-check
/* Dyrane Academy · Business Discovery · the assessment engine.
   Renders any schema shaped like schema.js one screen at a time: welcome,
   module intro, questions, next module, complete. Autosaves locally on
   every answer and quietly syncs to /api/discovery so Dyrane Academy can
   review even a half-finished assessment. The record id doubles as the
   owner's "continue code" for picking up on another device.

   Also owns the reviewer view at /discover#admin (key-gated: list, detail,
   print / export). Deliberately imports only core/dom.js so this page never
   touches EngineerOS state. */

import { MODULES, SCHEMA_VERSION, progressPct } from './schema.js';
import { qs, qsa, html, raw, icon, refreshIcons, prefersReducedMotion } from '../core/dom.js';

/* =========================================================================
   State + persistence
   ========================================================================= */

const KEY = 'discovery.v1';
const ADMIN_KEY = 'discovery.adminKey';
const OTHER = 'Something else…';

function newId() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function defaultState() {
  return {
    version: SCHEMA_VERSION, id: newId(),
    started: 0, updated: 0, completed: false,
    answers: {},                    // questionId -> string | string[] | number
    cursor: { k: 'welcome', m: 0, q: 0 },
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object' && raw.id) return { ...defaultState(), ...raw };
  } catch (e) {}
  return defaultState();
}

let S = load();

function saveLocal() {
  S.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  whisper('Saved');
  pushSoon();
}

/* =========================================================================
   Server sync (readable by Dyrane Academy, the welcome screen says so)
   ========================================================================= */

function serverRecord() {
  return {
    version: S.version,
    name: String(S.answers['owner-name'] || ''),
    business: String(S.answers['business-name'] || ''),
    industry: String(S.answers['industry'] || ''),
    pct: progressPct(S.answers),
    completed: S.completed,
    started: S.started, updated: S.updated,
    answers: S.answers,
  };
}

let pushTimer = null;
function pushSoon() { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1500); }
async function pushNow() {
  if (!S.started) return;                       // nothing to send before they begin
  clearTimeout(pushTimer);
  try {
    await fetch('/api/discovery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: S.id, record: serverRecord() }),
    });
  } catch (e) { /* offline is fine, local copy is the source of truth */ }
}
/* Last-chance flush when the tab hides or closes. */
window.addEventListener('pagehide', () => {
  if (!S.started || !navigator.sendBeacon) return;
  try {
    const blob = new Blob([JSON.stringify({ id: S.id, record: serverRecord() })], { type: 'application/json' });
    navigator.sendBeacon('/api/discovery', blob);
  } catch (e) {}
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pushNow(); });

/* =========================================================================
   Tiny local feedback (same #toast / #celebrate elements + CSS as the app)
   ========================================================================= */

let toastTimer = null;
function toast(msg, ok = true) {
  const el = qs('#toast'); if (!el) return;
  el.innerHTML = String(html`${ok ? raw('<i data-lucide="check"></i>') : ''}<span>${msg}</span>`);
  refreshIcons(el);
  el.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-shown'), 2200);
}
function celebrate() {
  const el = qs('#celebrate'); if (!el) return;
  el.innerHTML = '<div class="celebrate-mark"><i data-lucide="check"></i></div>';
  if (!prefersReducedMotion()) {
    const colors = ['#0a84ff', '#34c759', '#ff9f0a', '#00b4d8', '#ff453a'];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      c.style.left = (50 + (Math.random() * 60 - 30)) + '%';
      c.style.top = '42%';
      c.style.animation = `fall ${0.9 + Math.random() * 0.8}s var(--ease-emphasized) ${Math.random() * 0.2}s forwards`;
      el.appendChild(c);
    }
  }
  refreshIcons(el);
  el.classList.add('is-shown');
  setTimeout(() => { el.classList.remove('is-shown'); el.innerHTML = ''; }, 1300);
}
let whisperTimer = null;
function whisper(text) {
  const el = qs('#disc-saved'); if (!el) return;
  el.textContent = text + ' ✓';
  el.classList.add('is-shown');
  clearTimeout(whisperTimer);
  whisperTimer = setTimeout(() => el.classList.remove('is-shown'), 1600);
}

/* =========================================================================
   Navigation model
   ========================================================================= */

const mod = (m) => MODULES[m];
const q = (m, i) => MODULES[m].questions[i];

function goNext() {
  const c = S.cursor;
  if (c.k === 'welcome') S.cursor = { k: 'intro', m: 0, q: 0 };
  else if (c.k === 'intro') S.cursor = { k: 'q', m: c.m, q: 0 };
  else if (c.k === 'q') {
    if (c.q + 1 < mod(c.m).questions.length) S.cursor = { k: 'q', m: c.m, q: c.q + 1 };
    else if (c.m + 1 < MODULES.length) S.cursor = { k: 'intro', m: c.m + 1, q: 0 };
    else { S.completed = true; celebrate(); S.cursor = { k: 'complete', m: 0, q: 0 }; }
  }
  saveLocal(); pushNow(); render();
}

function goBack() {
  const c = S.cursor;
  if (c.k === 'intro') S.cursor = c.m === 0 ? { k: 'welcome', m: 0, q: 0 } : { k: 'q', m: c.m - 1, q: mod(c.m - 1).questions.length - 1 };
  else if (c.k === 'q') S.cursor = c.q === 0 ? { k: 'intro', m: c.m, q: 0 } : { k: 'q', m: c.m, q: c.q - 1 };
  else if (c.k === 'complete') S.cursor = { k: 'q', m: MODULES.length - 1, q: mod(MODULES.length - 1).questions.length - 1 };
  saveLocal(); render();
}

/** Where to resume: the first question without an answer (or intro of an untouched module). */
function resumeCursor() {
  for (let m = 0; m < MODULES.length; m++) {
    const qs2 = MODULES[m].questions;
    const touched = qs2.some((x) => answered(x.id));
    for (let i = 0; i < qs2.length; i++) {
      if (!answered(qs2[i].id)) return touched ? { k: 'q', m, q: i } : { k: 'intro', m, q: 0 };
    }
  }
  return { k: 'complete', m: 0, q: 0 };
}

function answered(qid) {
  const v = S.answers[qid];
  if (v == null) return false;
  return Array.isArray(v) ? v.length > 0 : String(v).trim() !== '';
}

/* =========================================================================
   Answer helpers
   ========================================================================= */

function setAnswer(qid, value) { S.answers[qid] = value; saveLocal(); }

/** The stored "custom" entry of a multi answer (anything not among the options). */
function customEntry(question, arr) {
  return (arr || []).find((v) => !question.options.includes(v)) || '';
}

/* =========================================================================
   Rendering
   ========================================================================= */

const view = () => qs('#view-disc');

function updateChrome() {
  const pct = progressPct(S.answers);
  const bar = qs('#disc-progress i');
  if (bar) bar.style.width = pct + '%';
  const label = qs('#disc-pct');
  if (label) label.textContent = S.cursor.k === 'welcome' ? '' : pct + '%';
}

function focusHeading() {
  const h = qs('#view-disc h1, #view-disc h2');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  window.scrollTo(0, 0);
}

function render() {
  if (window.location.hash === '#admin') { renderAdmin(); return; }
  const c = S.cursor;
  if (c.k === 'welcome') renderWelcome();
  else if (c.k === 'intro') renderIntro(c.m);
  else if (c.k === 'q') renderQuestion(c.m, c.q);
  else renderComplete();
  updateChrome();
  refreshIcons();
  focusHeading();
}

/* ---- welcome -------------------------------------------------------------- */

function renderWelcome() {
  const hasDraft = S.started && !S.completed;
  const pct = progressPct(S.answers);
  view().innerHTML = String(html`<div class="disc-hero stagger">
    <div class="chip chip-accent squircle">${icon('compass')}</div>
    <p class="eyebrow">Dyrane Academy</p>
    <h1 class="t-display q-title">Business Discovery</h1>
    ${hasDraft ? html`
      <p class="t-body text-2 mt-4 balance">Welcome back${S.answers['owner-name'] ? html`, ${String(S.answers['owner-name']).split(' ')[0]}` : ''}. You’re ${pct}% through.</p>
      <div class="disc-meta">
        <button class="btn btn-primary" data-action="resume">${icon('arrow-right')} Continue</button>
      </div>
      <div class="disc-meta">
        <button class="btn btn-ghost btn-sm" data-action="restart">Start over</button>
      </div>` : html`
      <p class="t-body text-2 mt-4 balance">Tell us how your business works. We’ll find the opportunities.</p>
      <p class="t-callout text-3 mt-2 balance">About 25 minutes. Saves as you go.</p>
      <div class="disc-meta">
        <button class="btn btn-primary" data-action="start">${icon('arrow-right')} Start</button>
      </div>
      <div class="disc-meta">
        <button class="btn btn-ghost btn-sm" data-action="show-code-entry">Have a code?</button>
      </div>
      <div id="code-entry" class="mt-4" style="display:none">
        <div class="field"><input class="input" id="code-input" placeholder="Paste your code" autocomplete="off" spellcheck="false" /></div>
        <button class="btn btn-quiet btn-sm" data-action="enter-code">Continue</button>
      </div>`}
    <p class="t-caption text-3 mt-6 balance">Answers go only to Dyrane Academy.</p>
  </div>`);
}

/* ---- module intro ----------------------------------------------------------- */

function renderIntro(m) {
  const M = mod(m);
  const done = M.questions.filter((x) => answered(x.id)).length;
  view().innerHTML = String(html`<div class="disc-hero stagger">
    <div class="chip chip-accent squircle">${icon(M.icon)}</div>
    <p class="eyebrow">Part ${m + 1} of ${MODULES.length} · ${M.name}</p>
    <h1 class="t-title1 q-title">${M.intro.title}</h1>
    <p class="t-body text-2 mt-3 balance">${M.intro.body}</p>
    <div class="disc-meta">
      ${badge(`~${M.intro.minutes} min`, 'accent')}
      ${done ? badge(`${done} of ${M.questions.length} answered`, 'green') : ''}
    </div>
    <div class="disc-meta">
      <button class="btn btn-primary" data-action="next">${icon('arrow-right')} ${done ? 'Continue' : 'Begin'}</button>
    </div>
    <div class="disc-meta">
      <button class="btn btn-ghost btn-sm" data-action="back">Back</button>
      <button class="btn btn-ghost btn-sm" data-action="copy-code">${icon('copy')} Copy code</button>
    </div>
  </div>`);
}

function badge(text, tone = 'accent') { return html`<span class="badge badge-${tone}">${text}</span>`; }

/* ---- one question per screen -------------------------------------------------- */

function renderQuestion(m, i) {
  const M = mod(m), Q = q(m, i);
  const canSkip = !Q.required;
  view().innerHTML = String(html`<div class="q-screen stagger">
    <div class="q-kicker">
      <span class="chip chip-muted chip-sm squircle">${icon(M.icon)}</span>
      <span class="t-caption text-3 fw-semibold">${M.name} · ${i + 1} of ${M.questions.length}</span>
    </div>
    <h1 class="t-title1 q-title">${Q.title}</h1>
    ${Q.help ? html`<p class="t-callout q-help">${Q.help}</p>` : ''}
    <div class="q-body" id="q-body"></div>
    <div class="disc-foot">
      <button class="btn btn-ghost" data-action="back">${icon('chevron-left')} Back</button>
      <span class="grow"></span>
      ${canSkip && !answered(Q.id) ? html`<button class="btn btn-ghost disc-skip" data-action="next">Skip</button>` : ''}
      <button class="btn btn-primary" id="q-next" data-action="next" ${Q.required && !answered(Q.id) ? 'disabled' : ''}>Continue ${icon('arrow-right')}</button>
    </div>
  </div>`);
  renderControl(Q, qs('#q-body'));
}

/** Render the input control for a question into `box` and wire its events. */
function renderControl(Q, box) {
  if (!box) return;
  const val = S.answers[Q.id];

  if (Q.type === 'short' || Q.type === 'long') {
    box.innerHTML = String(Q.type === 'short'
      ? html`<div class="field"><input class="input" id="q-in" placeholder="${Q.placeholder || ''}" value="${val || ''}" autocomplete="off" /></div>`
      : html`<div class="field"><textarea class="textarea" id="q-in" placeholder="${Q.placeholder || ''}">${val || ''}</textarea></div>`);
    const el = /** @type {HTMLInputElement} */ (qs('#q-in'));
    let t = null;
    el.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { setAnswer(Q.id, el.value.trim()); syncNextButton(Q); }, 400);
    });
    el.addEventListener('keydown', (e) => {
      const commit = Q.type === 'short' ? e.key === 'Enter' : e.key === 'Enter' && (e.metaKey || e.ctrlKey);
      if (commit) { e.preventDefault(); setAnswer(Q.id, el.value.trim()); goNext(); }
    });
    if (!prefersReducedMotion()) el.focus({ preventScroll: true });
    return;
  }

  if (Q.type === 'single' || Q.type === 'yesno') {
    const opts = Q.type === 'yesno' ? ['Yes', 'No'] : Q.options.slice();
    const isCustom = val && !opts.includes(val);
    const otherOn = Q.other && (isCustom || val === OTHER);
    box.innerHTML = String(html`<div class="opt-grid ${Q.type === 'yesno' ? 'yesno' : ''}">
      ${opts.map((o) => html`<button class="opt-card pressable ${val === o ? 'is-on' : ''}" data-opt="${o}">
        <span class="opt-dot">${icon('check')}</span><span>${o}</span></button>`)}
      ${Q.other ? html`<button class="opt-card pressable ${otherOn ? 'is-on' : ''}" data-opt="${OTHER}">
        <span class="opt-dot">${icon('check')}</span><span>${OTHER}</span></button>` : ''}
    </div>
    ${Q.other ? html`<div class="opt-other" id="q-other" style="display:${otherOn ? 'block' : 'none'}">
      <input class="input" id="q-other-in" placeholder="A few words" value="${isCustom ? val : ''}" /></div>` : ''}`);

    qsa('[data-opt]', box).forEach((b) => b.addEventListener('click', () => {
      const o = b.getAttribute('data-opt');
      if (o === OTHER) {
        qsa('.opt-card', box).forEach((x) => x.classList.remove('is-on'));
        b.classList.add('is-on');
        const wrap = qs('#q-other'); if (wrap) wrap.style.display = 'block';
        const inEl = /** @type {HTMLInputElement} */ (qs('#q-other-in'));
        setAnswer(Q.id, inEl.value.trim() || OTHER);
        inEl.focus();
        syncNextButton(Q);
        return;
      }
      setAnswer(Q.id, o);
      qsa('.opt-card', box).forEach((x) => x.classList.toggle('is-on', x === b));
      const wrap = qs('#q-other'); if (wrap) wrap.style.display = 'none';
      syncNextButton(Q);
      setTimeout(goNext, prefersReducedMotion() ? 0 : 320);   // one tap moves you on
    }));
    const otherIn = /** @type {HTMLInputElement} */ (qs('#q-other-in'));
    if (otherIn) {
      let t = null;
      otherIn.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => setAnswer(Q.id, otherIn.value.trim() || OTHER), 400); });
      otherIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); setAnswer(Q.id, otherIn.value.trim() || OTHER); goNext(); } });
    }
    return;
  }

  if (Q.type === 'multi') {
    const arr = Array.isArray(val) ? val.slice() : [];
    const custom = customEntry(Q, arr);
    box.innerHTML = String(html`<div class="chips-wrap">
      ${Q.options.map((o) => html`<button class="filter-chip ${arr.includes(o) ? 'is-on' : ''}" data-opt="${o}">${o}</button>`)}
      ${Q.other ? html`<button class="filter-chip ${custom ? 'is-on' : ''}" data-opt="${OTHER}">${OTHER}</button>` : ''}
    </div>
    ${Q.other ? html`<div class="opt-other" id="q-other" style="display:${custom ? 'block' : 'none'}">
      <input class="input" id="q-other-in" placeholder="A few words" value="${custom}" /></div>` : ''}`);

    const current = () => (Array.isArray(S.answers[Q.id]) ? S.answers[Q.id].slice() : []);
    qsa('[data-opt]', box).forEach((b) => b.addEventListener('click', () => {
      const o = b.getAttribute('data-opt');
      if (o === OTHER) {
        const wrap = qs('#q-other'), inEl = /** @type {HTMLInputElement} */ (qs('#q-other-in'));
        const on = b.classList.toggle('is-on');
        if (wrap) wrap.style.display = on ? 'block' : 'none';
        if (!on) { setAnswer(Q.id, current().filter((v) => Q.options.includes(v))); }
        else if (inEl) { inEl.focus(); }
        syncNextButton(Q);
        return;
      }
      const now = current();
      const idx = now.indexOf(o);
      if (idx >= 0) now.splice(idx, 1); else now.push(o);
      b.classList.toggle('is-on', idx < 0);
      setAnswer(Q.id, now);
      syncNextButton(Q);
    }));
    const otherIn = /** @type {HTMLInputElement} */ (qs('#q-other-in'));
    if (otherIn) {
      let t = null;
      otherIn.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const kept = current().filter((v) => Q.options.includes(v));
          const text = otherIn.value.trim();
          setAnswer(Q.id, text ? kept.concat([text]) : kept);
        }, 400);
      });
    }
    return;
  }

  if (Q.type === 'scale') {
    const n = Number(val) || 0;
    box.innerHTML = String(html`<div class="segmented" role="radiogroup" aria-label="${Q.title}">
      ${[1, 2, 3, 4, 5].map((k) => html`<button role="radio" aria-checked="${n === k}" class="${n === k ? 'is-on' : ''}" data-opt="${k}">${k}</button>`)}
    </div>
    <div class="scale-labels"><span class="t-caption">${Q.low || ''}</span><span class="t-caption">${Q.high || ''}</span></div>`);
    qsa('[data-opt]', box).forEach((b) => b.addEventListener('click', () => {
      setAnswer(Q.id, Number(b.getAttribute('data-opt')));
      qsa('button', box).forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', String(x === b)); });
      syncNextButton(Q);
      setTimeout(goNext, prefersReducedMotion() ? 0 : 320);
    }));
  }
}

function syncNextButton(Q) {
  const btn = /** @type {HTMLButtonElement} */ (qs('#q-next'));
  if (btn && Q.required) btn.disabled = !answered(Q.id);
}

/* ---- complete -------------------------------------------------------------------- */

function renderComplete() {
  if (!S.completed) { S.completed = true; saveLocal(); pushNow(); }   // resumed straight into "done"
  view().innerHTML = String(html`<div class="disc-hero stagger">
    <div class="chip chip-green squircle">${icon('check')}</div>
    <p class="eyebrow">Business Discovery</p>
    <h1 class="t-display q-title">That’s everything.</h1>
    <p class="t-body text-2 mt-4 balance">We’ll study your answers and prepare your report. Dyrane Academy will be in touch.</p>
    <div class="disc-meta">
      <button class="btn btn-primary" data-action="back">${icon('pen-line')} Review answers</button>
    </div>
    <div class="mt-6">
      <p class="t-caption text-3 mb-2">Your code:</p>
      <div class="disc-code">${S.id}</div>
      <div class="disc-meta"><button class="btn btn-ghost btn-sm" data-action="copy-code">${icon('copy')} Copy code</button></div>
    </div>
  </div>`);
}

/* =========================================================================
   Admin · /discover#admin (key-gated review for Dyrane)
   ========================================================================= */

const A = { clients: null, open: null };
const adminKey = () => localStorage.getItem(ADMIN_KEY) || '';

async function adminFetch(params) {
  const r = await fetch('/api/discovery?key=' + encodeURIComponent(adminKey()) + '&' + params);
  if (r.status === 401) throw new Error('unauthorized');
  if (!r.ok) throw new Error('failed');
  return r.json();
}

function renderAdmin() {
  const pctEl = qs('#disc-pct'); if (pctEl) pctEl.textContent = '';
  const bar = qs('#disc-progress i'); if (bar) bar.style.width = '0%';
  if (!adminKey()) { renderAdminLogin(); refreshIcons(); return; }
  if (A.open) { renderAdminDetail(); return; }
  renderAdminList();
}

function renderAdminLogin(err = '') {
  view().innerHTML = String(html`<div class="disc-hero stagger">
    <div class="chip chip-amber squircle">${icon('lock')}</div>
    <h1 class="t-title1 q-title">Reviewer access</h1>
    ${err ? html`<p class="t-callout mt-2" style="color:var(--red)">${err}</p>` : ''}
    <div class="field mt-4" style="max-width:340px;margin-inline:auto">
      <input class="input" id="adm-key" type="password" placeholder="Admin key" autocomplete="off" />
    </div>
    <div class="disc-meta"><button class="btn btn-primary" data-action="admin-login">Unlock</button></div>
  </div>`);
  const el = qs('#adm-key');
  if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdminLogin(); });
}

async function doAdminLogin() {
  const el = /** @type {HTMLInputElement} */ (qs('#adm-key'));
  const key = el ? el.value.trim() : '';
  if (!key) return;
  localStorage.setItem(ADMIN_KEY, key);
  try { await loadClients(); renderAdmin(); refreshIcons(); }
  catch (e) { localStorage.removeItem(ADMIN_KEY); renderAdminLogin('Wrong key.'); refreshIcons(); }
}

async function loadClients() { A.clients = (await adminFetch('list=1')).clients || []; }

const fmtDate = (t) => (t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-');

function renderAdminList() {
  const rows = (A.clients || []).map((c) => html`
    <div class="list-row adm-row pressable" data-action="admin-open" data-id="${c.id}">
      <div class="col grow" style="gap:2px">
        <span class="fw-semibold">${c.business || '(no business name yet)'}</span>
        <span class="t-caption text-3">${c.name || 'Unnamed'}${c.industry ? html` · ${c.industry}` : ''} · updated ${fmtDate(c.updated)}</span>
      </div>
      ${badge(c.completed ? 'Complete' : c.pct + '%', c.completed ? 'green' : 'accent')}
      ${icon('chevron-right')}
    </div>`);
  view().innerHTML = String(html`<div class="stagger">
    <div class="between mb-4" style="display:flex;align-items:center;gap:12px">
      <div><p class="eyebrow">Reviewer</p><h1 class="t-title1">Discovery submissions</h1></div>
      <span class="grow"></span>
      <button class="iconbtn" data-action="admin-refresh" aria-label="Refresh">${icon('refresh-cw')}</button>
      <button class="btn btn-ghost btn-sm" data-action="admin-logout">Lock</button>
    </div>
    ${A.clients === null ? html`<div class="card"><p class="t-callout text-2">Loading…</p></div>`
      : rows.length ? html`<div class="card card-tight list">${rows}</div>`
      : html`<div class="card"><p class="t-callout text-2">No submissions yet. Share <strong>/discover</strong> to begin.</p></div>`}
  </div>`);
}

async function openClient(id) {
  try {
    A.open = await adminFetch('id=' + id);
    renderAdmin(); refreshIcons(); focusHeading();
  } catch (e) { toast('Couldn’t load it', false); }
}

function renderAdminDetail() {
  const { id, record: r } = A.open;
  const modules = MODULES.map((M) => {
    const items = M.questions
      .map((Q) => ({ Q, v: r.answers ? r.answers[Q.id] : null }))
      .filter(({ v }) => v != null && (Array.isArray(v) ? v.length : String(v).trim() !== ''));
    if (!items.length) return html`<div class="card"><h3 class="t-headline">${M.name}</h3><p class="t-callout text-3 mt-1">Not answered yet.</p></div>`;
    return html`<div class="card">
      <div class="between" style="display:flex;align-items:baseline;gap:10px">
        <h3 class="t-headline">${M.name}</h3><span class="grow"></span>
        <span class="t-caption text-3">${items.length} of ${M.questions.length} answered</span>
      </div>
      ${items.map(({ Q, v }) => html`<div class="adm-qa">
        <p class="t-caption q">${Q.title}</p>
        <p class="t-callout a">${Array.isArray(v) ? v.join(' · ') : Q.type === 'scale' ? html`${v} / 5 <span class="text-3">(${Q.low} to ${Q.high})</span>` : String(v)}</p>
      </div>`)}
    </div>`;
  });
  view().innerHTML = String(html`<div class="stagger">
    <div style="display:flex;align-items:center;gap:12px" class="mb-4">
      <button class="iconbtn" data-action="admin-back" aria-label="Back to list">${icon('chevron-left')}</button>
      <div class="col" style="gap:2px">
        <h1 class="t-title1">${r.business || '(no business name yet)'}</h1>
        <span class="t-caption text-3">${r.name || 'Unnamed'}${r.industry ? html` · ${r.industry}` : ''} · started ${fmtDate(r.started)} · updated ${fmtDate(r.updated)}</span>
      </div>
      <span class="grow"></span>
      ${badge(r.completed ? 'Complete' : (r.pct || 0) + '%', r.completed ? 'green' : 'accent')}
    </div>
    <div class="btn-row mb-4" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-quiet btn-sm" data-action="admin-print">${icon('printer')} Print</button>
      <button class="btn btn-quiet btn-sm" data-action="admin-export">${icon('download')} Export JSON</button>
      <button class="btn btn-ghost btn-sm" data-action="admin-delete" style="color:var(--red)">Delete</button>
    </div>
    ${modules}
  </div>`);
}

function exportOpen() {
  const { id, record } = A.open;
  const blob = new Blob([JSON.stringify({ id, exported: new Date().toISOString(), record }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `discovery-${(record.business || 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function deleteOpen() {
  const { id, record } = A.open;
  if (!confirm(`Delete “${record.business || 'this client'}”? This cannot be undone.`)) return;
  try {
    await fetch('/api/discovery?key=' + encodeURIComponent(adminKey()) + '&id=' + id, { method: 'DELETE' });
    A.open = null; await loadClients(); renderAdmin(); refreshIcons();
    toast('Deleted');
  } catch (e) { toast('Delete failed', false); }
}

/* =========================================================================
   Actions (one delegated listener, EngineerOS-style)
   ========================================================================= */

document.addEventListener('click', (e) => {
  const src = /** @type {any} */ (e.target);
  const t = /** @type {HTMLElement|null} */ (src && src.closest ? src.closest('[data-action]') : null);
  if (!t) return;
  const act = t.getAttribute('data-action');

  if (act === 'start') { S.started = Date.now(); S.cursor = { k: 'intro', m: 0, q: 0 }; saveLocal(); pushNow(); render(); }
  else if (act === 'resume') { S.cursor = resumeCursor(); saveLocal(); render(); }
  else if (act === 'restart') {
    if (confirm('Start over? This clears your answers on this device.')) {
      S = defaultState(); saveLocal(); render();
    }
  }
  else if (act === 'next') goNext();
  else if (act === 'back') goBack();
  else if (act === 'show-code-entry') { const el = qs('#code-entry'); if (el) { el.style.display = 'block'; const i = qs('#code-input'); if (i) i.focus(); } }
  else if (act === 'enter-code') adoptCode();
  else if (act === 'copy-code') {
    navigator.clipboard && navigator.clipboard.writeText(S.id).then(() => toast('Code copied')).catch(() => toast('Copy failed. Long-press the code instead.', false));
  }
  else if (act === 'admin-login') doAdminLogin();
  else if (act === 'admin-logout') { localStorage.removeItem(ADMIN_KEY); A.clients = null; A.open = null; renderAdmin(); refreshIcons(); }
  else if (act === 'admin-refresh') { loadClients().then(() => { renderAdmin(); refreshIcons(); }).catch(() => toast('Refresh failed', false)); }
  else if (act === 'admin-open') openClient(t.getAttribute('data-id'));
  else if (act === 'admin-back') { A.open = null; renderAdmin(); refreshIcons(); }
  else if (act === 'admin-print') window.print();
  else if (act === 'admin-export') exportOpen();
  else if (act === 'admin-delete') deleteOpen();
});

async function adoptCode() {
  const el = /** @type {HTMLInputElement} */ (qs('#code-input'));
  const code = el ? el.value.trim().toLowerCase() : '';
  if (!/^[a-f0-9]{64}$/.test(code)) { toast('That code doesn’t look right', false); return; }
  try {
    const r = await (await fetch('/api/discovery?id=' + code)).json();
    if (!r.found) { toast('Nothing saved under that code', false); return; }
    S = { ...defaultState(), id: code, started: r.record.started || Date.now(), completed: !!r.record.completed, answers: r.record.answers || {} };
    S.cursor = resumeCursor();
    saveLocal(); render();
    toast('Welcome back');
  } catch (e) { toast('Can’t reach the server. Try again.', false); }
}

/* =========================================================================
   Boot
   ========================================================================= */

window.addEventListener('hashchange', () => { A.open = null; render(); });

/* Resume politely: completed assessments land on the complete screen; drafts
   land on welcome (which offers Continue); admin hash goes straight to review. */
if (window.location.hash !== '#admin' && S.completed) S.cursor = { k: 'complete', m: 0, q: 0 };
else if (window.location.hash !== '#admin') S.cursor = { k: 'welcome', m: 0, q: 0 };

render();
if (window.location.hash === '#admin' && adminKey()) loadClients().then(() => { renderAdmin(); refreshIcons(); }).catch(() => {});
