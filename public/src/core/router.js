/* EngineerOS · Router, hash-routed, focused single-view navigation.

   Model:
   • The URL hash is the source of truth (refresh-safe, deep-linkable, shareable).
   • go() renders immediately and writes history with pushState (no double render).
   • The OS / browser Back button traverses history via popstate.
   • The in-app chevron is *hierarchical* Back, it goes up to the logical parent.
   • Each route change sets document.title and moves focus to the heading (a11y). */

import { store } from './state.js';
import { qs, qsa, refreshIcons, prefersReducedMotion } from './dom.js';

const registry = {};
export let currentView = 'welcome';
let curParam = null;

const TOP = new Set(['home', 'journeys', 'build', 'review', 'resources']);
const ONBOARD = new Set(['welcome', 'setup']);
const PARENT = { journey: 'journeys', mission: 'journeys', progress: 'home',
  resume: 'build', portfolio: 'build', linkedin: 'build', settings: 'home', launchpad: 'home' };
const TAB_OF = { journey: 'journeys', mission: 'journeys', progress: 'home',
  resume: 'build', portfolio: 'build', linkedin: 'build' };
const TITLES = { welcome: 'Welcome', setup: 'Setup', home: 'Today', journeys: 'Journeys',
  journey: 'Journey', mission: 'Mission', progress: 'Progress', build: 'Build Studio',
  resume: 'Resume Builder', portfolio: 'Portfolio Builder', linkedin: 'LinkedIn Builder',
  review: 'Weekly Review', resources: 'Resources', earn: 'Earn', launchpad: 'Career Launchpad', settings: 'Settings' };

export function registerView(name, fn) { registry[name] = fn; }
export function getParam() { return curParam; }

/* ---- route <-> view mapping --------------------------------------------- */
function routeFor(view, param) {
  if (view === 'home') return '/';
  if (view === 'journey') return '/journey/' + param;
  if (view === 'mission') return '/mission/' + param;
  if (view === 'resume' || view === 'portfolio' || view === 'linkedin') return '/build/' + view;
  return '/' + view;
}
function parseHash() {
  const parts = (window.location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return { view: 'home', param: null };
  const a = parts[0];
  if (a === 'journey') return { view: 'journey', param: parseInt(parts[1], 10) || 0 };
  if (a === 'mission') return { view: 'mission', param: parts[1] || null };
  if (a === 'build') {
    const sub = parts[1];
    return ['resume', 'portfolio', 'linkedin'].includes(sub) ? { view: sub, param: null } : { view: 'build', param: null };
  }
  const known = ['home', 'journeys', 'progress', 'review', 'resources', 'earn', 'launchpad', 'settings', 'welcome', 'setup', 'build'];
  return { view: known.includes(a) ? a : 'home', param: null };
}
/* Gate onboarding so a deep link can't skip it (and vice-versa). */
function allowed(view) {
  if (!store.s.onboarded && !ONBOARD.has(view)) return 'welcome';
  if (store.s.onboarded && ONBOARD.has(view)) return 'home';
  return view;
}

/* ---- render (no history side-effects) ----------------------------------- */
function render(view, param) {
  view = allowed(view);
  if (view === 'home') param = null;
  const el = qs('#view-' + view);
  if (!el) return;
  currentView = view; curParam = param;
  try { if (registry[view]) registry[view](param); }
  catch (err) {
    try { console.error('EngineerOS render error:', err); } catch (_) {}
    el.innerHTML = `<div class="empty" style="padding-top:64px">
      <div class="chip chip-accent" style="margin:0 auto 14px;width:56px;height:56px"><i data-lucide="triangle-alert"></i></div>
      <p class="t-callout">Something hiccuped on this screen.</p>
      <button class="btn btn-ghost btn-sm" data-action="nav" data-value="home" style="margin-top:14px">Go home</button></div>`;
  }
  qsa('.view').forEach(v => v.classList.remove('is-active', 'is-entering'));
  el.classList.add('is-active');
  void el.offsetWidth;
  el.classList.add('is-entering');
  refreshIcons(el);
  try { window.scrollTo(0, 0); } catch (e) {}
  const tb = qs('#topbar'); if (tb) tb.classList.remove('is-scrolled');
  const dk = qs('#tabbar'); if (dk) dk.classList.remove('is-mini');
  document.title = (TITLES[view] || 'EngineerOS') + ' · EngineerOS';
  const h = el.querySelector('h1');
  if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { try { h.focus(); } catch (_) {} } }
  updateChrome();
}

/* ---- view transitions -----------------------------------------------------
   Native-feeling navigation: the browser crossfades between DOM states while
   fixed chrome (topbar and dock, each with a view-transition-name) stays put.
   Falls back to an instant swap on first render, reduced motion, or browsers
   without the View Transitions API. */
let booted = false;
function withTransition(fn) {
  if (booted && document.startViewTransition && !prefersReducedMotion()) document.startViewTransition(fn);
  else fn();
}

/* ---- public navigation -------------------------------------------------- */
export function go(view, param = null, opts = {}) {
  view = allowed(view);
  if (view === 'home') param = null;
  const v = view, p = param;
  withTransition(() => render(v, p));
  const url = '#' + routeFor(v, p);
  try {
    if (opts.replace || window.location.hash === url) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  } catch (e) { try { window.location.hash = routeFor(v, p); } catch (_) {} }
}

/* In-app chevron: go up to the logical parent. */
export function back() { go(PARENT[currentView] || 'home'); }

export function updateChrome() {
  const onboarding = ONBOARD.has(currentView);
  const app = qs('#app'); if (app) app.classList.toggle('is-onboarding', onboarding);
  const backBtn = qs('#backBtn');
  if (backBtn) backBtn.style.display = (!onboarding && !TOP.has(currentView)) ? 'grid' : 'none';
  const tab = TAB_OF[currentView] || currentView;
  qsa('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.value === tab));
}

/* ---- boot --------------------------------------------------------------- */
function onHistoryNav() { const { view, param } = parseHash(); withTransition(() => render(view, param)); }
export function initRouter() {
  const { view, param } = parseHash();
  render(view, param);
  booted = true;   // transitions apply only after the first paint
  try { window.history.replaceState(null, '', '#' + routeFor(currentView, curParam)); } catch (e) {}
  window.addEventListener('popstate', onHistoryNav);
  window.addEventListener('hashchange', onHistoryNav);
}
