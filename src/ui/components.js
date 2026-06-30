/* EngineerOS · Reusable UI components, pure functions returning HTML strings.
   Every surface here obeys the system: no borders, elevation + tint only. */

import { esc, icon } from '../core/dom.js';

export function pageHeader(eyebrow, title, sub = '') {
  return `<header class="mb-4">
    <div class="eyebrow">${esc(eyebrow)}</div>
    <h1 class="t-display balance" style="margin-top:6px">${title}</h1>
    ${sub ? `<p class="t-body text-2 mt-3 balance">${esc(sub)}</p>` : ''}
  </header>`;
}

export function chip(name, cls = '') { return `<div class="chip ${cls}">${icon(name)}</div>`; }

export function badge(text, tone = 'accent', iconName = '') {
  return `<span class="badge badge-${tone}">${iconName ? icon(iconName) : ''}${esc(text)}</span>`;
}

export function meter(val, tone = '') {
  return `<div class="meter ${tone}"><i style="width:${Math.max(0, Math.min(100, val))}%"></i></div>`;
}

export function statTile(n, label) {
  return `<div class="stat"><div class="n">${n}</div><div class="l">${esc(label)}</div></div>`;
}

export function readyTile(name, val, tone = '') {
  return `<div class="ready">
    <div class="rt"><span class="name">${esc(name)}</span><span class="v">${val === 0 ? 'Start' : val + '%'}</span></div>
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
  return `<div class="ring" style="width:${size}px;height:${size}px">
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
  return `<div class="empty">${chip(iconName, 'chip-accent')}<p class="t-callout mt-2">${esc(text)}</p></div>`;
}

export function primaryButton(label, action, value = '', cls = 'btn-primary', iconName = '') {
  return `<button class="btn ${cls}" data-action="${action}"${value ? ` data-value="${esc(value)}"` : ''}>${iconName ? icon(iconName) : ''}${esc(label)}</button>`;
}

/* A tappable row used by lists. leading is HTML (chip), trailing defaults to chevron. */
export function listRow({ leading = '', t1, t2 = '', action = '', value = '', from = '', muted = false, trailing = null }) {
  const attrs = action ? ` data-action="${action}" data-value="${esc(value)}"${from ? ` data-from="${from}"` : ''}` : '';
  return `<div class="list-row ${action ? 'tap' : ''} ${muted ? 'is-muted' : ''}"${attrs}>
    ${leading}
    <div class="lt"><div class="t1">${esc(t1)}</div>${t2 ? `<div class="t2">${esc(t2)}</div>` : ''}</div>
    <span class="chev">${trailing != null ? trailing : icon('chevron-right')}</span>
  </div>`;
}
