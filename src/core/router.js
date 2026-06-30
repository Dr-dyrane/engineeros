/* EngineerOS · Router — focused single-view navigation with a back stack.
   Views register a render fn; only one view is visible and it animates in. */

import { qs, qsa, refreshIcons } from './dom.js';

const TOP = new Set(['home', 'journeys', 'build', 'review', 'resources']);
const ONBOARD = new Set(['welcome', 'setup']);
/* Which tab lights up for a given (possibly nested) view. */
const TAB_OF = { journey: 'journeys', mission: 'journeys', progress: 'home',
  portfolio: 'build', resume: 'build', linkedin: 'build' };

const registry = {};
let stack = [];
export let currentView = 'welcome';
let curParam = null;

export function registerView(name, fn) { registry[name] = fn; }
export function getParam() { return curParam; }

export function go(view, param = null) {
  if (TOP.has(view) || ONBOARD.has(view)) stack = [];
  else if (currentView && currentView !== view) stack.push({ view: currentView, param: curParam });
  curParam = param; currentView = view;
  activate(view);
}

export function back() {
  const prev = stack.pop();
  if (prev) { curParam = prev.param; currentView = prev.view; activate(prev.view); }
  else go('home');
}

function activate(view) {
  const el = qs('#view-' + view);
  if (!el) return;
  if (registry[view]) registry[view](curParam);
  qsa('.view').forEach(v => v.classList.remove('is-active', 'is-entering'));
  el.classList.add('is-active');
  void el.offsetWidth;             // reflow → restart entrance animation
  el.classList.add('is-entering');
  refreshIcons(el);
  try { window.scrollTo(0, 0); } catch (e) {}
  qs('#topbar') && qs('#topbar').classList.remove('is-scrolled');
  updateChrome();
}

export function updateChrome() {
  const onboarding = ONBOARD.has(currentView);
  const app = qs('#app'); if (app) app.classList.toggle('is-onboarding', onboarding);
  const back = qs('#backBtn'); if (back) back.style.display = (!onboarding && stack.length) ? 'grid' : 'none';
  const activeTab = TAB_OF[currentView] || currentView;
  qsa('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.value === activeTab));
}
