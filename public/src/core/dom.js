// @ts-check
/* EngineerOS · DOM + icon helpers */

/** @param {string} sel @param {Document|Element} [root] @returns {HTMLElement|null} */
export const qs = (sel, root = document) => /** @type {HTMLElement|null} */ (root.querySelector(sel));
/** @param {string} sel @param {Document|Element} [root] @returns {HTMLElement[]} */
export const qsa = (sel, root = document) => /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll(sel)));

/* ---- HTML templating: escaped by default ---------------------------------
   html`...` escapes every interpolated value unless it is already SafeHtml.
   Fragments compose: html`` returns SafeHtml, arrays auto-join (so no more
   .join('')), and null/undefined/false render as ''. raw() is the explicit
   opt-out for trusted markup built outside a tagged template.
   esc() also returns SafeHtml, so legacy `${esc(x)}` never double-escapes. */
export class SafeHtml { /** @param {string} s */ constructor(s) { this.s = s; } toString() { return this.s; } }
/** Mark trusted markup as safe to interpolate. @param {unknown} s @returns {SafeHtml} */
export const raw = (s) => s instanceof SafeHtml ? s : new SafeHtml(String(s));
/** @param {unknown} s @returns {string} */
const escStr = (s) => String(s).replace(/[&<>"']/g, c => (({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c] || c));

/* Escape a user/content string; returns SafeHtml so it can nest in html``. */
/** @param {unknown} [s] @returns {SafeHtml} */
export function esc(s = '') { return new SafeHtml(escStr(s)); }

/** @param {unknown} v @returns {string} */
function flatten(v) {
  if (v == null || v === false) return '';
  if (v instanceof SafeHtml) return v.s;
  if (Array.isArray(v)) return v.map(flatten).join('');
  return escStr(v);
}
/** Escape-by-default template tag. @param {TemplateStringsArray} strings @param {...unknown} vals @returns {SafeHtml} */
export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += flatten(vals[i]) + strings[i + 1];
  return new SafeHtml(out);
}

/* Render a Lucide icon inline. */
/** @param {string} name @param {string} [cls] @returns {SafeHtml} */
export function icon(name, cls = '') {
  return new SafeHtml(`<i data-lucide="${escStr(name)}"${cls ? ` class="${escStr(cls)}"` : ''}></i>`);
}

/* (Re)hydrate all <i data-lucide> placeholders after a render. Guarded so the
   app still works (logic + tests) even if the CDN script hasn't loaded. */
/** @param {Element|null} [root] */
export function refreshIcons(root) {
  const lucide = /** @type {any} */ (window).lucide;
  try { if (lucide && lucide.createIcons) lucide.createIcons(root ? { nameAttr: 'data-lucide' } : undefined); } catch (e) {}
}

/* Trigger reduced-motion-aware behaviour. */
export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
