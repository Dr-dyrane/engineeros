/* EngineerOS · Reusable UI components, pure functions returning SafeHtml.
   Every surface here obeys the system: no borders, elevation + tint only.
   All fragments are built with html`` so interpolations escape by default. */

import { icon, html, raw } from '../core/dom.js';
import { store, save } from '../core/state.js';
import { registerAction } from '../core/actions.js';

/* Dismissing a tip persists a flag and removes the notice in place. */
registerAction('dismiss-tip', (key, el) => {
  store.s.flags['tip.' + key] = true; save();
  const n = el && el.closest('.notice'); if (n) n.remove();
});

/* A one-time coaching notice. Renders until dismissed, then never again
   (flag persisted in store.s.flags). Keeps recurring screens quiet.
   `body` is trusted template content (may contain markup). */
export function tip(key, body, tone = 'accent', cls = '') {
  if (store.s.flags['tip.' + key]) return '';
  return html`<div class="notice notice-${tone} notice-tip ${cls}"><span class="nt-body">${raw(body)}</span>
    <button class="notice-x" data-action="dismiss-tip" data-value="${key}" aria-label="Dismiss">${icon('x')}</button></div>`;
}

export function pageHeader(eyebrow, title, sub = '') {
  return html`<header class="mb-4">
    <div class="eyebrow">${eyebrow}</div>
    <h1 class="t-display balance" style="margin-top:6px">${title}</h1>
    ${sub ? html`<p class="t-body text-2 mt-3 balance">${sub}</p>` : ''}
  </header>`;
}

export function chip(name, cls = '') { return html`<div class="chip ${cls}">${icon(name)}</div>`; }

export function badge(text, tone = 'accent', iconName = '') {
  return html`<span class="badge badge-${tone}">${iconName ? icon(iconName) : ''}${text}</span>`;
}

export function meter(val, tone = '') {
  return html`<div class="meter ${tone}"><i style="width:${Math.max(0, Math.min(100, val))}%"></i></div>`;
}

export function statTile(n, label) {
  return html`<div class="stat"><div class="n">${raw(n)}</div><div class="l">${label}</div></div>`;
}

export function readyTile(name, val, tone = '') {
  return html`<div class="ready">
    <div class="rt"><span class="name">${name}</span><span class="v">${val === 0 ? 'Start' : val + '%'}</span></div>
    ${meter(val, tone)}
  </div>`;
}

/* Encouraging label for a 0-100 strength score, friendlier than a bare number. */
export function strengthLabel(score) {
  return score >= 80 ? 'Interview-ready' : score >= 55 ? 'Coming together' : score >= 30 ? 'Good start' : 'Just getting started';
}

/* Progress ring (SVG). size in px; stroke scales with it. */
export function ring(pct, size = 124) {
  const stroke = 10, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return html`<div class="ring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/>
      </linearGradient></defs>
      <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/>
      <circle class="bar" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"
        style="stroke-dasharray:${c}; stroke-dashoffset:${off}"/>
    </svg>
    <div class="ring-label"><div class="pct">${pct}%</div><div class="cap">complete</div></div>
  </div>`;
}

export function emptyState(iconName, text) {
  return html`<div class="empty">${chip(iconName, 'chip-accent')}<p class="t-callout mt-2">${text}</p></div>`;
}

export function primaryButton(label, action, value = '', cls = 'btn-primary', iconName = '') {
  return html`<button class="btn ${cls}" data-action="${action}"${value ? html` data-value="${value}"` : ''}>${iconName ? icon(iconName) : ''}${label}</button>`;
}

/* A tappable row used by lists. leading is a fragment (chip), trailing defaults to chevron. */
export function listRow({ leading = '', t1, t2 = '', action = '', value = '', from = '', muted = false, trailing = null }) {
  const attrs = action ? html` data-action="${action}" data-value="${value}"${from ? html` data-from="${from}"` : ''}` : '';
  return html`<div class="list-row ${action ? 'tap' : ''} ${muted ? 'is-muted' : ''}"${attrs}>
    ${raw(leading)}
    <div class="lt"><div class="t1">${t1}</div>${t2 ? html`<div class="t2">${t2}</div>` : ''}</div>
    <span class="chev">${trailing != null ? raw(trailing) : icon('chevron-right')}</span>
  </div>`;
}
