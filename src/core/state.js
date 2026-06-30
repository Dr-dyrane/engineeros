/* EngineerOS · State + persistence + selectors
   One module owns the state. `store.s` is the live state object; reassigning it
   (on import/reset) propagates everywhere because the wrapper object is shared. */

import { JOURNEYS, GH_MILESTONES } from '../data/journeys.js';

const KEY = 'engineeros.v1';

export function defaultState() {
  return {
    version: 1, onboarded: false,
    user: { name: '' },
    theme: 'system',          // system | light | dark
    freeNav: false,           // unlock everything
    completed: {},            // missionId -> true
    missionData: {},          // missionId -> { checks:{i:true}, reflection, notes }
    streak: { count: 0, best: 0, last: '' },
    builders: { portfolio: {}, resume: {}, linkedin: {} },
    reviews: []               // [{date, done, learned, confused, built, next}]
  };
}

export function deepDefaults(p) {
  const d = defaultState();
  const s = Object.assign(d, p || {});
  s.user = Object.assign(d.user, (p && p.user) || {});
  s.streak = Object.assign(d.streak, (p && p.streak) || {});
  s.builders = Object.assign({ portfolio: {}, resume: {}, linkedin: {} }, (p && p.builders) || {});
  s.completed = (p && p.completed) || {};
  s.missionData = (p && p.missionData) || {};
  s.reviews = (p && p.reviews) || [];
  return s;
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return deepDefaults(JSON.parse(raw)); } catch (e) {}
  return defaultState();
}

export const store = { s: load() };

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 120);
}
export function saveNow() {
  try { localStorage.setItem(KEY, JSON.stringify(store.s)); } catch (e) {}
}
export function replaceState(next) { store.s = deepDefaults(next); saveNow(); }
export function resetState() { const theme = store.s.theme; store.s = defaultState(); store.s.theme = theme; saveNow(); }

/* ---- small helpers ------------------------------------------------------- */
function localYMD(d = new Date()) { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
export const todayStr = () => localYMD();                                  // local date, not UTC
export function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return localYMD(d); }
export function firstName() { return (store.s.user.name || 'there').trim().split(/\s+/)[0] || 'there'; }

export function flat() {
  const out = [];
  JOURNEYS.forEach((j, ji) => j.missions.forEach((m, mi) => out.push({ j, ji, m, mi })));
  return out;
}
export function totalMissions() { return flat().length; }
export function completedCount() { return Object.keys(store.s.completed).filter(k => store.s.completed[k]).length; }
export function md(id) { return store.s.missionData[id] || (store.s.missionData[id] = { checks: {}, reflection: '', notes: '' }); }
export function findMission(id) { return flat().find(x => x.m.id === id) || null; }

/* ---- progressive unlock -------------------------------------------------- */
export function journeyComplete(ji) { const j = JOURNEYS[ji]; return !!j && j.missions.every(m => store.s.completed[m.id]); }
export function isJourneyUnlocked(ji) { return store.s.freeNav || ji === 0 || journeyComplete(ji - 1); }
export function isMissionUnlocked(ji, mi) {
  if (store.s.freeNav) return true;
  if (!isJourneyUnlocked(ji)) return false;
  if (mi === 0) return true;
  return !!store.s.completed[JOURNEYS[ji].missions[mi - 1].id];
}
export function todaysMission() {
  for (const x of flat()) if (isMissionUnlocked(x.ji, x.mi) && !store.s.completed[x.m.id]) return x;
  return null;
}

/* ---- streak -------------------------------------------------------------- */
export function liveStreak() {
  const t = todayStr(), y = yesterdayStr();
  if (store.s.streak.last === t || store.s.streak.last === y) return store.s.streak.count;
  return 0;
}
export function touchStreak() {
  const t = todayStr();
  if (store.s.streak.last === t) return;
  store.s.streak.count = store.s.streak.last === yesterdayStr() ? store.s.streak.count + 1 : 1;
  store.s.streak.last = t;
  if (store.s.streak.count > store.s.streak.best) store.s.streak.best = store.s.streak.count;
}

/* ---- readiness ----------------------------------------------------------- */
const RESUME_KEYS = ['name','email','phone','location','summary','education','skills','projects','experience','certifications'];
const LI_KEYS = ['headline','about','education','skills','featured','post'];
const PF_KEYS = ['about','education','project','skills','tools','projects','certs','contact'];
function pctFilled(obj, keys) {
  if (!obj) return 0;
  let n = 0; keys.forEach(k => { if (obj[k] && String(obj[k]).trim().length > 2) n++; });
  return Math.round(n / keys.length * 100);
}
export function resumeReady() {
  const r = store.s.builders.resume; if (!r) return 0;
  const has = v => v && String(v).trim().length > 1;
  const bulleted = a => Array.isArray(a) && a.some(e => (e.bullets || []).some(b => b && b.trim()));
  const checks = [
    has(r.name), has(r.email), has(r.summary),
    bulleted(r.experience) || bulleted(r.projects),
    Array.isArray(r.education) ? r.education.some(e => has(e.degree) || has(e.school)) : has(r.education),
    Array.isArray(r.skills) ? r.skills.some(s => has(s.items)) : has(r.skills),
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}
export function linkedinReady() { return pctFilled(store.s.builders.linkedin, LI_KEYS); }
export function portfolioReady() {
  const p = store.s.builders.portfolio; if (!p) return 0;
  const has = v => v && String(v).trim().length > 1;
  const csAny = Array.isArray(p.projects) ? p.projects.some(x => x.title || x.approach || x.result) : (has(p.project) || has(p.projects));
  const checks = [
    has(p.about),
    has(p.email) || has(p.linkedin) || has(p.github) || has(p.website) || has(p.contact),
    csAny,
    Array.isArray(p.skills) ? p.skills.some(s => has(s.items)) : has(p.skills),
    has(p.education),
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}
export function githubReady() { const n = GH_MILESTONES.filter(id => store.s.completed[id]).length; return Math.round(n / GH_MILESTONES.length * 100); }
export function overallPct() { const t = totalMissions(); return t ? Math.round(completedCount() / t * 100) : 0; }
export function journeysDone() { return JOURNEYS.filter((j, ji) => journeyComplete(ji)).length; }
