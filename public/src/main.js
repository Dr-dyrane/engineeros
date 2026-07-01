/* EngineerOS · main, wiring + init
   Imports register all views (side effects), then sets up global event
   delegation and boots the app. */

import { store, save, saveNow, touchStreak, md, findMission, todaysMission, firstName,
         replaceState, resetState, completedCount, journeyComplete, onStateChange } from './core/state.js';
import { go, back, initRouter, currentView, getParam } from './core/router.js';
import { applyTheme, setTheme, cycleTheme, watchSystemTheme } from './core/theme.js';
import { toast, celebrate, download, notify, haptic, enableNotifications, disableNotifications, copyText } from './core/feedback.js';
import { subscribePush, unsubscribePush } from './core/push.js';
import { syncPushContext } from './core/push-context.js';
import { enableSync, linkDevice, disableSync, pullNow, scheduleSync, syncCode, syncOn } from './core/sync.js';
import { initHelpers, refreshHelpers, snoozeNudge, hideUpdate, triggerInstall, applyUpdate, stampVersion, markExported } from './core/helpers.js';
import { qs, refreshIcons } from './core/dom.js';

import './views/onboarding.js';
import './views/home.js';
import './views/journeys.js';
import { checkPct, onReflect } from './views/mission.js';
import './views/build.js';
import './views/progress.js';
import { saveReview } from './views/review.js';
import { resourceSearch, resourceFilter } from './views/resources.js';
import './views/earn.js';
import { renderSettings, toggleCodeReveal } from './views/settings.js';
import { resumeInput, resumeAction } from './views/resume.js';
import { portfolioInput, portfolioAction } from './views/portfolio.js';
import { linkedinInput, linkedinAction } from './views/linkedin.js';
import { launchpadInput, launchpadAns, launchpadAction } from './views/launchpad.js';

let missionFrom = 'journey';

/* ---- Mission completion -------------------------------------------------- */
function completeMission(id) {
  const found = findMission(id);
  if (!store.s.completed[id]) {
    store.s.completed[id] = true;
    touchStreak(); saveNow(); celebrate(); haptic([10, 40, 16]);
    const streak = store.s.streak.count;
    if (found && journeyComplete(found.ji)) notify('Journey complete', 'You finished ' + found.j.title + '. That is real, visible progress.');
    else if ([3, 7, 14, 30].indexOf(streak) !== -1) notify(streak + '-day streak', 'You showed up again. This is how a career gets built.');
    else toast('Today’s win saved');
    syncPushContext();   // refresh the on-device reminder summary
    refreshHelpers();    // finishing missions can unlock a gentle nudge
  }
  setTimeout(() => {
    const tm = todaysMission();
    if (!tm) return go('home');
    if (missionFrom === 'home') go('home');
    else go('journey', found ? found.ji : 0);
  }, 950);
}

function exportJSON() { download('engineeros-progress.json', JSON.stringify(store.s, null, 2), 'application/json'); toast('Backup downloaded'); markExported(); refreshHelpers(); }

/* In-app helper cards: perform the offered action, then re-evaluate. */
function doHelper(id) {
  switch (id) {
    case 'whatsnew': stampVersion(); refreshHelpers(); break;
    case 'install': triggerInstall(); break;
    case 'reminders':
      enableNotifications().then(async (ok) => {
        if (ok) { try { await subscribePush(); syncPushContext(); } catch (e) {} }
        refreshHelpers();
        if (currentView === 'settings') { renderSettings(); refreshIcons(qs('#view-settings')); }
      });
      break;
    case 'sync':
      enableSync().then(() => {
        refreshHelpers(); toast('Sync on. Your code is in Settings.');
        if (currentView === 'settings') { renderSettings(); refreshIcons(qs('#view-settings')); }
      });
      break;
    case 'backup': exportJSON(); break;
    default: refreshHelpers();
  }
}
function openMail(subject, body) {
  window.location.href = 'mailto:halodyrane@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body + '\n\n');
}
function resetAll() {
  if (confirm('Reset everything? This clears all progress, reflections and builders on this device. Export a backup first if unsure.')) {
    resetState(); applyTheme(); go('welcome', null, { replace: true }); toast('Fresh start', false);
  }
}

/* ---- Event delegation ---------------------------------------------------- */
document.addEventListener('click', (e) => {
  const themeBtn = e.target.closest('[data-theme-set]');
  if (themeBtn) { setTheme(themeBtn.dataset.themeSet); return; }
  const t = e.target.closest('[data-action]'); if (!t) return;
  const a = t.dataset.action, v = t.dataset.value;
  if (a && a.indexOf('rs-') === 0) { resumeAction(a, v); return; }   // Resume Studio actions
  if (a && a.indexOf('pf-') === 0) { portfolioAction(a, v); return; } // Portfolio Studio actions
  if (a && a.indexOf('li-') === 0) { linkedinAction(a, v); return; } // LinkedIn Studio actions
  if (a && a.indexOf('la-') === 0) { launchpadAction(a, v); return; } // Launchpad actions
  switch (a) {
    case 'to-setup': go('setup'); break;
    case 'finish-setup': {
      const n = qs('#nameInput'); store.s.user.name = (n && n.value.trim()) || '';
      store.s.onboarded = true; stampVersion(); touchStreak(); saveNow(); go('home', null, { replace: true }); toast('Welcome aboard, ' + firstName());
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
    case 'res-filter': resourceFilter(v); break;
    case 'save-review': saveReview(); break;
    case 'export-json': exportJSON(); break;
    case 'import-json': qs('#importFile').click(); break;
    case 'reset': resetAll(); break;
    case 'toggle-freenav':
      store.s.freeNav = !store.s.freeNav; save(); renderSettings(); refreshIcons(qs('#view-settings'));
      toast(store.s.freeNav ? 'All unlocked' : 'Guided mode', false); break;
    case 'toggle-notify':
      if (store.s.flags.notify) { disableNotifications(); unsubscribePush(); renderSettings(); refreshIcons(qs('#view-settings')); refreshHelpers(); }
      else { enableNotifications().then(async (ok) => { if (ok) { try { await subscribePush(); syncPushContext(); } catch (e) {} } renderSettings(); refreshIcons(qs('#view-settings')); refreshHelpers(); }); }
      break;
    case 'send-feedback': openMail('EngineerOS feedback', 'What is working, what is not, and anything you wish it did:'); break;
    case 'suggest-feature': openMail('EngineerOS idea', 'I would love it if EngineerOS could:'); break;
    case 'sync-enable':
      enableSync().then(() => { renderSettings(); refreshIcons(qs('#view-settings')); refreshHelpers(); toast('Sync on. Save your code.'); });
      break;
    case 'sync-link': {
      const inp = qs('#sync-code-input'); const code = inp ? inp.value : '';
      linkDevice(code).then((res) => {
        renderSettings(); refreshIcons(qs('#view-settings'));
        if (res.ok && res.merged) { applyTheme(); toast('Linked. Your progress is synced.'); }
        else if (res.ok) toast('Linked this device.');
        else if (res.reason === 'wrong-code') toast('That code did not match any saved data', false);
        else if (res.reason === 'short') toast('That code looks too short', false);
        else toast('Could not reach sync. Check your connection.', false);
      });
      break;
    }
    case 'sync-off':
      if (confirm('Turn off sync on this device? Your local data stays. The synced copy remains until overwritten.')) {
        disableSync(); renderSettings(); refreshIcons(qs('#view-settings')); refreshHelpers(); toast('Sync off on this device', false);
      }
      break;
    case 'sync-reveal': toggleCodeReveal(); renderSettings(); refreshIcons(qs('#view-settings')); break;
    case 'sync-copy': copyText(syncCode()); break;
    case 'dismiss-tip': { store.s.flags['tip.' + v] = true; save(); const n = t.closest('.notice'); if (n) n.remove(); break; }
    case 'helper-do': doHelper(v); break;
    case 'helper-skip': snoozeNudge(v); break;
    case 'helper-refresh': applyUpdate(); break;
    case 'helper-hide-update': hideUpdate(); break;
  }
});

document.addEventListener('change', (e) => {
  const rsc = e.target.closest('[data-rs-check]'); if (rsc) { resumeInput(rsc.dataset.rsCheck, e.target.checked); return; }
  const c = e.target.closest('[data-check]');
  if (c) {
    const [id, i] = c.dataset.check.split(':');
    const d = md(id); d.checks[i] = c.checked; save(); haptic(c.checked ? 10 : 6);
    const fm = findMission(id), bar = qs('#checkbar');
    if (fm && bar) bar.style.width = checkPct(fm.m, d) + '%';
  }
});

document.addEventListener('input', (e) => {
  const rs = e.target.closest('[data-rs]'); if (rs) { resumeInput(rs.dataset.rs, e.target.value); return; }
  const pf = e.target.closest('[data-pf]'); if (pf) { portfolioInput(pf.dataset.pf, e.target.value); return; }
  const li = e.target.closest('[data-li]'); if (li) { linkedinInput(li.dataset.li, e.target.value); return; }
  const laf = e.target.closest('[data-la-field]'); if (laf) { launchpadInput(laf.dataset.laField, e.target.value); return; }
  const lan = e.target.closest('[data-la-ans]'); if (lan) { launchpadAns(lan.dataset.laAns, e.target.value); return; }
  const r = e.target.closest('[data-reflect]'); if (r) { md(r.dataset.reflect).reflection = r.value; save(); onReflect(r.value); return; }
  const n = e.target.closest('[data-notes]'); if (n) { md(n.dataset.notes).notes = n.value; save(); return; }
  const rsch = e.target.closest('[data-res-search]'); if (rsch) { resourceSearch(rsch.value); return; }
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

/* On load, pull the latest synced state and merge it in, then refresh the view. */
function pullOnLoad() {
  if (!syncOn()) return;
  pullNow().then((changed) => {
    if (changed) { applyTheme(); syncPushContext(); go(currentView, getParam(), { replace: true }); }
  });
}

/* ---- Boot ---------------------------------------------------------------- */
function init() {
  applyTheme();
  watchSystemTheme();
  refreshIcons();
  onStateChange(scheduleSync);   // push local changes to the cloud (debounced) when sync is on
  initRouter();   // reads the URL hash, refresh-safe, deep-linkable, real Back
  syncPushContext();   // stash today's summary for the reminder composer
  initHelpers();       // PWA update/install prompts + gentle feature nudges
  pullOnLoad();
}
init();
