/* EngineerOS · main — wiring + init
   Imports register all views (side effects), then sets up global event
   delegation and boots the app. */

import { store, save, saveNow, touchStreak, md, findMission, todaysMission, firstName,
         replaceState, resetState } from './core/state.js';
import { go, back } from './core/router.js';
import { applyTheme, setTheme, cycleTheme, watchSystemTheme } from './core/theme.js';
import { toast, celebrate, download } from './core/feedback.js';
import { qs, refreshIcons } from './core/dom.js';

import './views/onboarding.js';
import './views/home.js';
import './views/journeys.js';
import { checkPct } from './views/mission.js';
import { exportBuilder } from './views/build.js';
import './views/progress.js';
import { saveReview } from './views/review.js';
import './views/resources.js';
import { renderSettings } from './views/settings.js';

let missionFrom = 'journey';

/* ---- Mission completion -------------------------------------------------- */
function completeMission(id) {
  if (!store.s.completed[id]) {
    store.s.completed[id] = true;
    touchStreak(); saveNow(); celebrate(); toast('Today’s win saved');
  }
  const found = findMission(id);
  setTimeout(() => {
    const tm = todaysMission();
    if (!tm) return go('home');
    if (missionFrom === 'home') go('home');
    else go('journey', found ? found.ji : 0);
  }, 950);
}

function exportJSON() { download('engineeros-progress.json', JSON.stringify(store.s, null, 2), 'application/json'); toast('Backup downloaded'); }
function resetAll() {
  if (confirm('Reset everything? This clears all progress, reflections and builders on this device. Export a backup first if unsure.')) {
    resetState(); applyTheme(); go('welcome'); toast('Fresh start', false);
  }
}

/* ---- Event delegation ---------------------------------------------------- */
document.addEventListener('click', (e) => {
  const themeBtn = e.target.closest('[data-theme-set]');
  if (themeBtn) { setTheme(themeBtn.dataset.themeSet); return; }
  const t = e.target.closest('[data-action]'); if (!t) return;
  const a = t.dataset.action, v = t.dataset.value;
  switch (a) {
    case 'to-setup': go('setup'); break;
    case 'finish-setup': {
      const n = qs('#nameInput'); store.s.user.name = (n && n.value.trim()) || '';
      store.s.onboarded = true; touchStreak(); saveNow(); go('home'); toast('Welcome aboard, ' + firstName());
      break;
    }
    case 'nav': go(v); break;
    case 'open-journey': go('journey', parseInt(v, 10)); break;
    case 'open-mission': missionFrom = t.dataset.from || 'journey'; go('mission', v); break;
    case 'open-progress': go('progress'); break;
    case 'open-settings': go('settings'); break;
    case 'back': back(); break;
    case 'toggle-theme': cycleTheme(); break;
    case 'complete-mission': completeMission(v); break;
    case 'reopen-mission': delete store.s.completed[v]; saveNow(); go('mission', v); toast('Reopened', false); break;
    case 'export-resume': exportBuilder('resume', false); break;
    case 'export-resume-copy': exportBuilder('resume', true); break;
    case 'export-portfolio': exportBuilder('portfolio', false); break;
    case 'export-portfolio-copy': exportBuilder('portfolio', true); break;
    case 'export-linkedin': exportBuilder('linkedin', false); break;
    case 'export-linkedin-copy': exportBuilder('linkedin', true); break;
    case 'save-review': saveReview(); break;
    case 'export-json': exportJSON(); break;
    case 'import-json': qs('#importFile').click(); break;
    case 'reset': resetAll(); break;
    case 'toggle-freenav':
      store.s.freeNav = !store.s.freeNav; save(); renderSettings(); refreshIcons(qs('#view-settings'));
      toast(store.s.freeNav ? 'All unlocked' : 'Guided mode', false); break;
  }
});

document.addEventListener('change', (e) => {
  const c = e.target.closest('[data-check]');
  if (c) {
    const [id, i] = c.dataset.check.split(':');
    const d = md(id); d.checks[i] = c.checked; save();
    const fm = findMission(id), bar = qs('#checkbar');
    if (fm && bar) bar.style.width = checkPct(fm.m, d) + '%';
  }
});

document.addEventListener('input', (e) => {
  const r = e.target.closest('[data-reflect]'); if (r) { md(r.dataset.reflect).reflection = r.value; save(); return; }
  const n = e.target.closest('[data-notes]'); if (n) { md(n.dataset.notes).notes = n.value; save(); return; }
  const b = e.target.closest('[data-builder]'); if (b) {
    const [k, key] = b.dataset.builder.split(':');
    (store.s.builders[k] = store.s.builders[k] || {})[key] = b.value; save(); return;
  }
  const sn = e.target.closest('#set-name'); if (sn) { store.s.user.name = sn.value; save(); }
});

window.addEventListener('scroll', () => {
  const tb = qs('#topbar'); if (tb) tb.classList.toggle('is-scrolled', window.scrollY > 6);
}, { passive: true });

const importFile = qs('#importFile');
if (importFile) importFile.addEventListener('change', (e) => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => { try { replaceState(JSON.parse(rd.result)); applyTheme(); go('home'); toast('Progress imported'); }
    catch (err) { toast('Could not read that file', false); } };
  rd.readAsText(f); e.target.value = '';
});

/* Hydrate icons once the Lucide CDN script has loaded. */
window.addEventListener('load', () => refreshIcons());

/* ---- Boot ---------------------------------------------------------------- */
function init() {
  applyTheme();
  watchSystemTheme();
  refreshIcons();
  if (store.s.onboarded) go('home'); else go('welcome');
}
init();
