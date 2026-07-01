/* EngineerOS · In-app helpers: PWA lifecycle + gentle feature discovery.
   All in-app (never push): you cannot push someone to enable push, and the
   update/install moments happen while the app is open. One thing at a time,
   dismissable, frequency-capped, and silent during onboarding. */

import { store, saveNow, completedCount } from './state.js';
import { syncOn } from './sync.js';
import { notificationsSupported, notificationsOn } from './feedback.js';
import { qs, esc, icon, refreshIcons } from './dom.js';

/* Bump this and list the highlights when shipping user-facing features. */
export const APP_VERSION = '1.1';
const WHATS_NEW = [
  'Sync across devices with an encrypted code',
  'Optional daily reminders that name today’s mission',
  'A built-in coach on every screen',
];

const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;   // 3 days
const sessionDismissed = new Set();
let deferredPrompt = null;
let waitingWorker = null;
let updateHidden = false;

/* ---- flag helpers -------------------------------------------------------- */
function fl() { return store.s.flags || (store.s.flags = {}); }
function isMuted(id) { return !!(fl().helperMute && fl().helperMute[id]); }
function isSnoozed(id) { const s = fl().helperSnooze && fl().helperSnooze[id]; return !!s && Date.now() < s; }
export function stampVersion() { fl().seenVersion = APP_VERSION; saveNow(); }
export function markExported() { fl().everExported = true; saveNow(); }

/* ---- environment --------------------------------------------------------- */
function isIOS() {
  const ua = (navigator.userAgent || '');
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  catch (e) { return false; }
}
function canInstall() {
  if (isStandalone() || fl().installed) return false;
  return !!deferredPrompt || isIOS();
}

/* ---- which card to show (priority order) --------------------------------- */
function whatsNewApplicable() {
  const seen = fl().seenVersion;
  if (seen === APP_VERSION) return false;
  if (seen === undefined) return completedCount() >= 1;   // existing users, once
  return true;                                            // seen an older version
}
function pickCard() {
  if (!store.s.onboarded) return null;
  if (whatsNewApplicable()) return { id: 'whatsnew', icon: 'sparkles', chip: 'chip-amber', title: 'What’s new', body: WHATS_NEW.join('  ·  '), cta: 'Got it', skip: null };

  const done = completedCount();
  const cands = [];
  if (canInstall()) {
    cands.push(deferredPrompt
      ? { id: 'install', icon: 'download', title: 'Install EngineerOS', body: 'Add it to your home screen for one-tap access and a full-screen, offline app.', cta: 'Install' }
      : { id: 'install', icon: 'share', title: 'Install EngineerOS', body: 'In Safari, tap the Share button, then Add to Home Screen.', cta: null, skip: 'Got it' });
  }
  if (notificationsSupported() && !notificationsOn() && done >= 1)
    cands.push({ id: 'reminders', icon: 'bell', title: 'Turn on daily reminders', body: 'A gentle nudge each day so you keep your streak, even when the app is closed.', cta: 'Turn on' });
  if (!syncOn() && done >= 3)
    cands.push({ id: 'sync', icon: 'refresh-cw', title: 'Sync across devices', body: 'Carry your progress to another device with an encrypted code. We cannot read it.', cta: 'Turn on' });
  if (done >= 5 && !fl().everExported)
    cands.push({ id: 'backup', icon: 'download', title: 'Back up your progress', body: 'Save a JSON copy in case you clear your browser or switch devices.', cta: 'Export' });

  for (const c of cands) if (!isMuted(c.id) && !isSnoozed(c.id) && !sessionDismissed.has(c.id)) return c;
  return null;
}

/* ---- render -------------------------------------------------------------- */
function cardHTML(n) {
  const primary = n.cta ? `<button class="btn btn-primary btn-sm" data-action="helper-do" data-value="${n.id}">${esc(n.cta)}</button>` : '';
  const skip = n.skip === null ? '' : `<button class="btn btn-ghost btn-sm" data-action="helper-skip" data-value="${n.id}">${esc(n.skip || 'Not now')}</button>`;
  return `<div class="card">
    <div class="row" style="gap:12px; align-items:flex-start">
      <div class="chip ${n.chip || 'chip-accent'}">${icon(n.icon || 'sparkles')}</div>
      <div class="grow">
        <div class="fw-semibold">${esc(n.title)}</div>
        <div class="t-foot text-2 mt-1">${esc(n.body)}</div>
        <div class="row-tight mt-3" style="gap:8px">${primary}${skip}</div>
      </div>
      <button class="iconbtn is-quiet" data-action="helper-skip" data-value="${n.id}" aria-label="Dismiss" style="margin:-4px -4px 0 0">${icon('x')}</button>
    </div>
  </div>`;
}
export function refreshHelpers() {
  const bar = qs('#eos-update'), slot = qs('#eos-helper');
  if (!bar || !slot) return;

  const showUpdate = !!waitingWorker && !updateHidden && store.s.onboarded;
  bar.innerHTML = showUpdate ? `
    <span class="chip chip-accent chip-sm">${icon('arrow-down-to-line')}</span>
    <span class="t-foot fw-semibold">Update ready</span>
    <button class="btn btn-primary btn-sm" data-action="helper-refresh">Refresh</button>
    <button class="iconbtn is-quiet" data-action="helper-hide-update" aria-label="Dismiss">${icon('x')}</button>` : '';
  bar.classList.toggle('show', showUpdate);

  const card = pickCard();
  slot.innerHTML = card ? cardHTML(card) : '';
  slot.classList.toggle('show', !!card);

  if (showUpdate || card) refreshIcons(bar.parentNode || document.body);
}

/* ---- actions (called from main) ------------------------------------------ */
export function snoozeNudge(id) {
  if (id === 'whatsnew') { stampVersion(); sessionDismissed.add(id); refreshHelpers(); return; }
  const f = fl();
  f.helperSnooze = f.helperSnooze || {}; f.helperCount = f.helperCount || {}; f.helperMute = f.helperMute || {};
  f.helperCount[id] = (f.helperCount[id] || 0) + 1;
  f.helperSnooze[id] = Date.now() + SNOOZE_MS;
  if (f.helperCount[id] >= 2) f.helperMute[id] = true;   // respect a repeated "not now"
  saveNow();
  sessionDismissed.add(id);
  refreshHelpers();
}
export function hideUpdate() { updateHidden = true; refreshHelpers(); }
export async function triggerInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null;
  }
  refreshHelpers();
}
export function applyUpdate() {
  const w = waitingWorker;
  if (!w) { try { location.reload(); } catch (e) {} return; }
  try { w.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { try { location.reload(); } catch (_) {} }
}

/* ---- wiring -------------------------------------------------------------- */
function wireServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return; reloading = true; try { location.reload(); } catch (e) {}
  });
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;
    if (reg.waiting && navigator.serviceWorker.controller) { waitingWorker = reg.waiting; refreshHelpers(); }
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing; if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) { waitingWorker = reg.waiting || nw; refreshHelpers(); }
      });
    });
  }).catch(() => {});
}
function wireInstall() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; refreshHelpers(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; fl().installed = true; saveNow(); refreshHelpers(); });
}
function maybeOfflineReady() {
  try {
    if (store.s.onboarded && !fl().offlineReadyShown && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      fl().offlineReadyShown = true; saveNow();
      const toastEl = qs('#toast');
      if (toastEl) setTimeout(() => import('./feedback.js').then(m => m.toast('Ready to use offline', false)).catch(() => {}), 1400);
    }
  } catch (e) {}
}

function injectStyles() {
  if (qs('#eos-helper-css')) return;
  const css = `
  #eos-update{position:fixed;left:50%;top:calc(var(--topbar-h,54px) + env(safe-area-inset-top) + 8px);transform:translateX(-50%) translateY(-8px);z-index:60;opacity:0;pointer-events:none;transition:opacity .3s var(--ease-emphasized,ease),transform .3s var(--ease-emphasized,ease);display:flex;align-items:center;gap:10px;padding:7px 8px 7px 12px;border-radius:var(--r-pill,999px);background:var(--surface-1);box-shadow:var(--shadow-2,0 8px 30px rgba(0,0,0,.18));max-width:calc(100vw - 24px)}
  #eos-update.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
  #eos-helper{position:fixed;left:50%;bottom:calc(var(--tabbar-h,64px) + 26px);transform:translateX(-50%) translateY(14px);z-index:55;opacity:0;pointer-events:none;transition:opacity .34s var(--ease-emphasized,ease),transform .34s var(--ease-emphasized,ease);width:min(440px,calc(100vw - 28px))}
  #eos-helper.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
  #eos-update .btn-sm,#eos-helper .btn-sm{padding:6px 12px}
  @media print{#eos-update,#eos-helper{display:none!important}}`;
  const el = document.createElement('style');
  el.id = 'eos-helper-css'; el.textContent = css;
  document.head.appendChild(el);
}
function injectDom() {
  if (!qs('#eos-update')) { const b = document.createElement('div'); b.id = 'eos-update'; document.body.appendChild(b); }
  if (!qs('#eos-helper')) { const h = document.createElement('div'); h.id = 'eos-helper'; document.body.appendChild(h); }
}

export function initHelpers() {
  if (typeof document === 'undefined') return;
  injectStyles();
  injectDom();
  wireServiceWorker();
  wireInstall();
  window.addEventListener('hashchange', () => refreshHelpers());
  refreshHelpers();
  maybeOfflineReady();
}
