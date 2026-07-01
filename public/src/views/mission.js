/* EngineerOS · Mission view, why / today / checklist / reflection / complete */

import { findMission, md, store } from '../core/state.js';
import { qs, icon, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { reflectionReply } from '../core/coach.js';

export function checkPct(m, data) {
  const n = m.checklist.length; if (!n) return 0;
  let c = 0; for (let i = 0; i < n; i++) if (data.checks[i]) c++;
  return Math.round(c / n * 100);
}

registerView('mission', (id) => {
  const found = findMission(id);
  const root = qs('#view-mission');
  if (!found) { root.innerHTML = '<div class="empty">Mission not found.</div>'; return; }
  const { j, ji, m, mi } = found;
  const data = md(m.id);
  const isDone = !!store.s.completed[m.id];

  const checks = m.checklist.map((c, i) => html`
    <label class="check">
      <input type="checkbox" data-check="${m.id}:${i}" ${data.checks[i] ? 'checked' : ''} />
      <span class="box">${icon('check')}</span>
      <span class="ctext">${c}</span>
    </label>`);
  const today = m.today.map(t => html`<li>${t}</li>`);
  const linkBtn = m.link
    ? html`<a class="btn btn-ghost mt-2" href="${m.link.url}" target="_blank" rel="noopener">${m.link.label} ${icon('external-link')}</a>`
    : '';
  // Missions that reference an in-app builder get a real button to jump there.
  const goto = ({ j1m6: ['resume', 'Resume Studio'], j8m1: ['resume', 'Resume Studio'],
    j3m4: ['portfolio', 'Portfolio Studio'], j3m6: ['portfolio', 'Portfolio Studio'],
    j8m2: ['linkedin', 'LinkedIn Studio'] })[m.id];
  const gotoBtn = goto ? html`<button class="btn btn-ghost mt-2" data-action="nav" data-value="${goto[0]}">${icon('arrow-right')} Open the ${goto[1]}</button>` : '';

  root.innerHTML = html`
    <div class="stagger">
      <header style="margin:2px 2px 14px">
        <div class="t-caption fw-bold text-3" style="letter-spacing:.04em">JOURNEY ${ji + 1} · ${String(j.title).toUpperCase()} · MISSION ${mi + 1}</div>
        <h1 class="t-display" style="font-size:28px; margin-top:8px">${m.title}</h1>
        <div class="row-tight mt-3"><span class="pill">${m.time}</span>${isDone ? badgeDone() : ''}</div>
      </header>

      <div class="card">
        <h3 class="section-label" style="margin-top:0">Why this matters</h3>
        <p class="t-body">${m.why}</p>
      </div>

      <div class="card">
        <h3 class="section-label" style="margin-top:0">Today’s mission</h3>
        <ol class="steps">${today}</ol>
        ${linkBtn}${gotoBtn}
      </div>

      <div class="card">
        <h3 class="section-label" style="margin-top:0">Done checklist</h3>
        <div>${checks}</div>
        <div class="mt-3"><div class="meter green"><i id="checkbar" style="width:${checkPct(m, data)}%"></i></div></div>
      </div>

      <div class="card">
        <h3 class="section-label" style="margin-top:0">Reflection</h3>
        <p class="t-foot text-3 mb-2">${m.reflection}</p>
        <textarea class="textarea" data-reflect="${m.id}" placeholder="Write a sentence or two…">${data.reflection}</textarea>
        <div id="mission-coach"></div>
        <details class="mt-3"><summary class="t-foot text-3" style="cursor:pointer">+ Private notes</summary>
          <textarea class="textarea mt-2" data-notes="${m.id}" placeholder="Anything you want to remember…">${data.notes}</textarea>
        </details>
      </div>

      <div class="mt-2">
        <button class="btn ${isDone ? 'btn-ghost' : 'btn-primary'}" data-action="${isDone ? 'reopen-mission' : 'complete-mission'}" data-value="${m.id}">
          ${isDone ? 'Mark as not done' : 'Mark complete'}
        </button>
        <p class="t-foot text-3 center mt-3">Done beats perfect. You can improve it later.</p>
      </div>
    </div>`;
  onReflect(data.reflection);
});

function badgeDone() { return html`<span class="badge badge-green">${icon('check')} Done</span>`; }

/* Reflection coach: a calm, templated reply that appears as the user writes. */
export function onReflect(value) {
  const el = qs('#mission-coach'); if (!el) return;
  const reply = reflectionReply(value);
  el.innerHTML = reply ? html`<div class="notice notice-accent mt-2" style="font-size:13.5px">${reply}</div>` : '';
}
