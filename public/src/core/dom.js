/* EngineerOS · DOM + icon helpers */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Escape user/content strings before injecting as HTML. */
export function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* Render a Lucide icon inline. */
export function icon(name, cls = '') {
  return `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''}></i>`;
}

/* (Re)hydrate all <i data-lucide> placeholders after a render. Guarded so the
   app still works (logic + tests) even if the CDN script hasn't loaded. */
export function refreshIcons(root) {
  try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(root ? { nameAttr: 'data-lucide' } : undefined); } catch (e) {}
}

/* Trigger reduced-motion-aware behaviour. */
export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
