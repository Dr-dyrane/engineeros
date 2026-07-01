/* EngineerOS · Studio engine, the machinery shared by the three Build
   Studios (resume / portfolio / linkedin). Each studio keeps its own model
   shape, scoring, preview and exports; everything mechanical lives here:

   - dotted-path live editing ("exp.0.b.1") with debounced save
   - last-focused-field tracking + tap-to-insert (verb picker)
   - form field helpers bound to the studio's data attribute
   - edit/preview panel toggle + toolbar
   - <details> cards whose open state survives re-renders
   - confirm-before-delete helpers */

// @ts-check
import { store, save } from '../core/state.js';
import { qs, qsa, icon, html, raw, esc } from '../core/dom.js';
import { copyText, toast } from '../core/feedback.js';
import { meter, strengthLabel } from './components.js';
import { ACTION_VERBS } from '../data/resume-assets.js';

/* The coach panel body every studio renders: strength header + review items.
   @param {number} score @param {string} noun @param {{items:{sev:string,where:string,fix:string}[]}} review @param {string} okMsg */
export function coachPanel(score, noun, review, okMsg) {
  const tone = score >= 70 ? 'green' : score >= 40 ? 'amber' : '';
  const dot = (sev) => sev === 'high' ? 'var(--red)' : sev === 'med' ? 'var(--amber)' : 'var(--text-3)';
  const items = review.items.length
    ? review.items.slice(0, 10).map(it => html`<div class="rs-tip"><span style="color:${raw(dot(it.sev))};font-weight:700">•</span><span><b>${it.where}.</b> ${it.fix}</span></div>`)
    : html`<div class="rs-tip ok"><span style="color:var(--green);font-weight:700">✓</span><span>${okMsg}</span></div>`;
  return html`<div class="row between"><div><div class="t-title2">${strengthLabel(score)}</div>
      <div class="t-foot text-3">${score} of 100 · ${noun}</div></div><div style="width:120px">${meter(score, tone)}</div></div>
    <div class="mt-3">${items}</div>`;
}

/* Build a dynamic attribute (name from a trusted constant, value escaped). */
/** @param {string} name @param {string} value */
const attrKV = (name, value) => raw(name + '="' + esc(value) + '"');

/**
 * @param {object} cfg
 * @param {'resume'|'portfolio'|'linkedin'} cfg.key   builder key (= view name)
 * @param {string} cfg.attr                            data attribute stem, e.g. 'rs' -> data-rs
 * @param {Record<string,string>} [cfg.arrays]         path stem -> model array name
 * @param {() => void} [cfg.refresh]                   focus-preserving live refresh
 */
export function createStudio({ key, attr, arrays = {}, refresh = () => {} }) {
  const sel = '#view-' + key;
  const model = () => store.s.builders[key];

  /* ---- dotted-path editing ---------------------------------------------- */
  /** @param {any} m @param {string} path @param {any} value */
  function setPath(m, path, value) {
    const s = path.split('.');
    if (s.length === 1) { m[s[0]] = value; return; }
    const arr = m[arrays[s[0]]]; if (!arr || !arr[+s[1]]) return;
    if (s[2] === 'b') arr[+s[1]].bullets[+s[3]] = value;
    else arr[+s[1]][s[2]] = value;
  }
  /** @param {string} path @param {any} value */
  const input = (path, value) => { setPath(model(), path, value); save(); refresh(); };

  /* ---- last-focused editable field, so tap-to-insert lands right --------- */
  /** @type {HTMLInputElement|HTMLTextAreaElement|null} */
  let lastField = null;
  document.addEventListener('focusin', (e) => {
    const t = /** @type {Element|null} */ (e.target);
    const f = t && t.closest && t.closest(sel + ' [data-' + attr + ']');
    if (f && (f.tagName === 'TEXTAREA' || f.tagName === 'INPUT')) lastField = /** @type {HTMLInputElement|HTMLTextAreaElement} */ (f);
  });
  /** @param {string} text */
  function insertText(text) {
    if (!lastField) { copyText(text); return; }
    const el = lastField, s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + text + ' ' + el.value.slice(e);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
    const pos = s + text.length + 1;
    try { el.focus(); el.setSelectionRange(pos, pos); } catch (_) {}
    toast('Added “' + text + '”', false);
  }

  /* ---- form helpers ------------------------------------------------------ */
  const da = 'data-' + attr;
  const inp = (path, val, ph, type = 'text') => html`<input class="input" ${attrKV(da, path)} type="${type}" placeholder="${ph}" aria-label="${ph}" value="${val || ''}" />`;
  const ta = (path, val, ph, rows = 0) => html`<textarea class="textarea" ${attrKV(da, path)} placeholder="${ph}" aria-label="${ph}"${rows ? html` style="min-height:${rows * 24}px"` : ''}>${val || ''}</textarea>`;
  const delBtn = (action, value) => html`<button class="rs-iconbtn" data-action="${action}" data-value="${value}" aria-label="Remove">${icon('trash-2')}</button>`;
  const addBtn = (action, value, label) => html`<button class="btn btn-ghost btn-sm" data-action="${action}" data-value="${value}">${icon('plus')} ${label}</button>`;
  const groupHead = (label, action, addLabel) => html`<div class="rs-group-h"><h3 class="section-label">${label}</h3>${addBtn(action, '', addLabel)}</div>`;
  const entryHead = (label, delAction, delValue) => html`<div class="rs-entry-head"><span class="t">${label}</span>${delBtn(delAction, delValue)}</div>`;

  /* ---- edit/preview panels + toolbar ------------------------------------- */
  function setPanel(p) {
    const s = qs(sel + ' .studio'); if (s) s.dataset.panel = p;
    qsa(sel + ' [data-' + attr + '-panel-btn]').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-' + attr + '-panel-btn') === p));
  }
  const toolbar = (actions) => html`<div class="studio-toolbar">
      <div class="segmented studio-toggle">
        <button data-action="${attr}-panel" data-value="edit" ${attrKV(da + '-panel-btn', 'edit')} class="is-on">Edit</button>
        <button data-action="${attr}-panel" data-value="preview" ${attrKV(da + '-panel-btn', 'preview')}>Preview</button>
      </div>
      <div class="tb-actions">${actions}</div>
    </div>`;

  /* ---- <details> cards that keep their open state across re-renders ------ */
  /** @type {Record<string, boolean>} */
  const open = {};
  /** @param {string} k @param {unknown} summary @param {unknown} body */
  const keep = (k, summary, body) => html`<details class="card" data-keep="${k}"${open[k] ? raw(' open') : ''}>${summary}${body}</details>`;
  /** @param {string} iconName @param {string} label @param {string} sumId */
  const sumRow = (iconName, label, sumId) => html`<summary class="sum-row">${icon(iconName)} ${label} <span class="sum-val" id="${sumId}"></span>${icon('chevron-down', 'chev-d')}</summary>`;
  function wire() {
    qsa(sel + ' details[data-keep]').forEach(el => {
      const d = /** @type {HTMLDetailsElement} */ (el);
      d.addEventListener('toggle', () => { open[d.dataset.keep || ''] = d.open; });
    });
  }

  /* ---- misc -------------------------------------------------------------- */
  const ask = (msg = 'Remove this entry? This can’t be undone.') => (typeof confirm === 'undefined') || confirm(msg);
  const filled = (o) => !!o && Object.keys(o).some(k => k === 'bullets' ? o.bullets.some(b => b && b.trim()) : String(o[k] || '').trim());
  const verbPicker = (action, title, sub) => html`<details class="card" style="margin-top:10px"><summary class="fw-semibold" style="cursor:pointer">${icon('wand-sparkles')} ${title}</summary>
      <p class="t-foot text-3 mt-2">${sub}</p>
      ${ACTION_VERBS.map(g => html`<div class="rs-verb-group">${g.group}</div><div class="rs-verbs">${g.verbs.map(v => html`<button class="rs-verb" data-action="${action}" data-value="${v}">${v}</button>`)}</div>`)}
    </details>`;

  return { sel, model, input, insertText, inp, ta, delBtn, addBtn, groupHead, entryHead,
           setPanel, toolbar, keep, sumRow, wire, ask, filled, verbPicker };
}
