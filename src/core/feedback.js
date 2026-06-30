/* EngineerOS · Feedback, toast + subtle celebration */

import { qs, esc, refreshIcons, prefersReducedMotion } from './dom.js';

let toastTimer = null;
export function toast(msg, withCheck = true) {
  const el = qs('#toast'); if (!el) return;
  el.innerHTML = (withCheck ? '<i data-lucide="check"></i>' : '') + `<span>${esc(msg)}</span>`;
  refreshIcons(el);
  el.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-shown'), 2200);
}

export function celebrate() {
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

/* Download + clipboard utilities (used by builders / data export). */
export function download(filename, text, type = 'text/markdown;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); return; }
  catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    toast('Copied to clipboard');
  } catch (e) { toast('Copy failed', false); }
}
