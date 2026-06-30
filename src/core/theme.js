/* EngineerOS · Theme — system / light / dark with manual override */

import { store, save } from './state.js';
import { qs, refreshIcons } from './dom.js';
import { toast } from './feedback.js';

function isDarkNow() {
  const t = store.s.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme() {
  const root = document.documentElement;
  if (store.s.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', store.s.theme);
  // The quick-toggle icon previews the *current* mode (sun in light, moon in dark).
  const el = qs('#themeIcon');
  if (el) { el.setAttribute('data-lucide', isDarkNow() ? 'moon' : 'sun'); refreshIcons(qs('#topbar')); }
}

export function setTheme(t) {
  store.s.theme = t; applyTheme(); save();
  document.querySelectorAll('[data-theme-set]').forEach(b =>
    b.classList.toggle('is-on', b.dataset.themeSet === t));
}

export function cycleTheme() {
  store.s.theme = store.s.theme === 'light' ? 'dark' : store.s.theme === 'dark' ? 'system' : 'light';
  applyTheme(); save();
  toast('Theme: ' + store.s.theme, false);
}

export function watchSystemTheme() {
  if (typeof matchMedia === 'undefined') return;
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.s.theme === 'system') applyTheme();
  });
}
