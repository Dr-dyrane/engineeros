/* EngineerOS · Feedback, toast + subtle celebration + haptics + notifications */

import { qs, esc, refreshIcons, prefersReducedMotion } from './dom.js';
import { store, saveNow } from './state.js';

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

/* ---- Haptics ------------------------------------------------------------- */
/* A light tap on devices that support it (Android Chrome). iOS Safari has no
   vibration API, so this is a quiet no-op there. */
export function haptic(pattern = 12) {
  try { if (!prefersReducedMotion() && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

/* ---- Notifications ------------------------------------------------------- */
/* Honest scope: while the app is open we can always nudge in-app. Real system
   notifications fire only after the person opts in and the browser grants
   permission. Reminders when the app is fully closed need a push server, which
   this free, no-account app does not run, so notifications are reserved for
   wins and gentle daily prompts where the platform allows them. */
export function notificationsSupported() { return typeof window !== 'undefined' && 'Notification' in window; }
export function notificationsOn() {
  try { return !!(store.s.flags && store.s.flags.notify) && notificationsSupported() && Notification.permission === 'granted'; }
  catch (e) { return false; }
}
export function notify(title, body) {
  toast(title);                       // always show the in-app version
  try {
    if (notificationsOn()) new Notification(title, { body: body || '', icon: '/icon-192.png', badge: '/favicon-32.png', tag: 'engineeros' });
  } catch (e) {}
}
export async function enableNotifications() {
  if (!notificationsSupported()) { toast('Notifications are not available here', false); return false; }
  try {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') { store.s.flags.notify = true; saveNow(); registerDailyReminder(); toast('Reminders are on'); return true; }
    store.s.flags.notify = false; saveNow(); toast('Reminders stay off for now', false); return false;
  } catch (e) { return false; }
}
export function disableNotifications() { store.s.flags.notify = false; saveNow(); toast('Reminders are off', false); }

/* Best-effort daily reminder via Periodic Background Sync (Chrome with the app
   installed). Everywhere else this is a quiet no-op and the in-app streak nudge
   does the job instead. */
async function registerDailyReminder() {
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.ready;
    if (reg && 'periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') await reg.periodicSync.register('daily-nudge', { minInterval: 24 * 60 * 60 * 1000 });
    }
  } catch (e) {}
}
