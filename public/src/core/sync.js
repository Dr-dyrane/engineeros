/* EngineerOS · Encrypted cross-device sync (zero-knowledge).
   The user gets a secret sync code. From it we derive an AES-GCM key on-device
   (PBKDF2) and an opaque id (a hash of the code). We upload only ciphertext,
   stored under the id, so the server can never read progress, reflections, or
   builder content. Another device with the same code pulls and MERGES, so
   nothing already started is ever lost.

   The sync code lives in its own localStorage key and is NEVER part of the
   uploaded blob. */

import { store, saveNow, deepDefaults } from './state.js';

const CFG_KEY = 'engineeros.sync';
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford-ish, no I L O U

/* ---- small encoders ------------------------------------------------------ */
function b64(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
function ub64(str) { const bin = atob(str); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function hex(bytes) { return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''); }
function normalize(code) { return String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); }

/* ---- code + id ----------------------------------------------------------- */
export function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));   // 80 bits
  let bits = 0, val = 0, out = '';
  for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += ALPHA[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += ALPHA[(val << (5 - bits)) & 31];
  return out.match(/.{1,4}/g).join('-');                      // XXXX-XXXX-XXXX-XXXX
}
export async function makeId(code) {
  const data = new TextEncoder().encode('engineeros:sync:' + normalize(code));
  const h = await crypto.subtle.digest('SHA-256', data);
  return hex(new Uint8Array(h));
}

/* ---- crypto -------------------------------------------------------------- */
async function deriveKey(code, saltBytes) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalize(code)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 200000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptBlob(code, saltBytes, obj) {
  const key = await deriveKey(code, saltBytes);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return b64(iv) + '.' + b64(new Uint8Array(ct));
}
export async function decryptBlob(code, saltBytes, blob) {
  const [ivPart, ctPart] = String(blob).split('.');
  const key = await deriveKey(code, saltBytes);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(ivPart) }, key, ub64(ctPart));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ---- merge (additive-safe: progress is never lost) ----------------------- */
function longer(a, b) { a = a || ''; b = b || ''; return a.length >= b.length ? a : b; }
function maxDate(a, b) { return (a || '') > (b || '') ? (a || '') : (b || ''); }
function filled(o) {
  return !!o && Object.keys(o).some(k => { const v = o[k]; return v && (typeof v === 'string' ? v.trim() : (Array.isArray(v) ? v.length : true)); });
}
function pickBuilder(l, r, newerR) {
  const lf = filled(l), rf = filled(r);
  if (lf && !rf) return l;
  if (rf && !lf) return r;
  return newerR ? (r || l || {}) : (l || r || {});
}
function mergeMissionData(l, r) {
  const out = {};
  for (const id of new Set([...Object.keys(l || {}), ...Object.keys(r || {})])) {
    const a = l[id], b = r[id];
    if (a && !b) { out[id] = a; continue; }
    if (b && !a) { out[id] = b; continue; }
    const checks = {};
    for (const k of new Set([...Object.keys(a.checks || {}), ...Object.keys(b.checks || {})])) {
      checks[k] = !!(a.checks && a.checks[k]) || !!(b.checks && b.checks[k]);
    }
    out[id] = { checks, reflection: longer(a.reflection, b.reflection), notes: longer(a.notes, b.notes) };
  }
  return out;
}
function dedupeReviews(list) {
  const seen = new Set(), out = [];
  for (const r of list) { const k = JSON.stringify(r); if (!seen.has(k)) { seen.add(k); out.push(r); } }
  return out;
}
export function mergeState(local, remote) {
  const L = local || {}, R = remote || {};
  if (!remote || typeof remote !== 'object') return L;
  const newerR = (R.updated || 0) > (L.updated || 0);
  const out = Object.assign({}, L);

  out.onboarded = !!L.onboarded || !!R.onboarded;
  const ln = L.user && L.user.name, rn = R.user && R.user.name;
  out.user = { name: (ln && rn) ? (newerR ? rn : ln) : (ln || rn || '') };
  out.theme = newerR ? (R.theme || L.theme) : (L.theme || R.theme);
  out.freeNav = newerR ? !!R.freeNav : !!L.freeNav;

  out.completed = {};
  for (const k of new Set([...Object.keys(L.completed || {}), ...Object.keys(R.completed || {})])) {
    if ((L.completed && L.completed[k]) || (R.completed && R.completed[k])) out.completed[k] = true;
  }
  out.missionData = mergeMissionData(L.missionData || {}, R.missionData || {});
  out.reviews = dedupeReviews([...(L.reviews || []), ...(R.reviews || [])]);
  out.streak = {
    count: Math.max((L.streak && L.streak.count) || 0, (R.streak && R.streak.count) || 0),
    best: Math.max((L.streak && L.streak.best) || 0, (R.streak && R.streak.best) || 0),
    last: maxDate(L.streak && L.streak.last, R.streak && R.streak.last),
  };
  const lb = L.builders || {}, rb = R.builders || {};
  out.builders = {
    resume: pickBuilder(lb.resume, rb.resume, newerR),
    portfolio: pickBuilder(lb.portfolio, rb.portfolio, newerR),
    linkedin: pickBuilder(lb.linkedin, rb.linkedin, newerR),
  };
  out.flags = Object.assign({}, L.flags || {}, R.flags || {});
  for (const k of Object.keys(out.flags)) {
    const lv = (L.flags || {})[k], rv = (R.flags || {})[k];
    if (typeof lv === 'boolean' || typeof rv === 'boolean') out.flags[k] = !!lv || !!rv;
  }
  out.updated = Math.max(L.updated || 0, R.updated || 0);
  return out;
}

/* ---- local sync config (never uploaded) ---------------------------------- */
function readCfg() { try { return JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { return null; } }
function writeCfg(cfg) { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} }
export function syncOn() { const c = readCfg(); return !!(c && c.code); }
export function syncCode() { const c = readCfg(); return c ? c.code : ''; }
export function syncStatus() { const c = readCfg(); return { on: !!(c && c.code), code: c ? c.code : '', last: c ? (c.last || 0) : 0 }; }
export function disableSync() { try { localStorage.removeItem(CFG_KEY); } catch (e) {} }

/* ---- push / pull --------------------------------------------------------- */
export async function pushNow() {
  const cfg = readCfg(); if (!cfg || !cfg.code) return false;
  try {
    const id = await makeId(cfg.code);
    const blob = await encryptBlob(cfg.code, ub64(cfg.salt), store.s);
    const res = await fetch('/api/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, salt: cfg.salt, blob, updated: store.s.updated || Date.now() }),
    });
    if (res.ok) { cfg.last = Date.now(); writeCfg(cfg); return true; }
  } catch (e) {}
  return false;
}
export async function pullNow() {
  const cfg = readCfg(); if (!cfg || !cfg.code) return false;
  try {
    const id = await makeId(cfg.code);
    const r = await fetch('/api/sync?id=' + id).then(x => x.json());
    if (!r || !r.found) return false;
    const salt = r.salt || cfg.salt;
    const remote = await decryptBlob(cfg.code, ub64(salt), r.blob);
    store.s = deepDefaults(mergeState(store.s, remote));
    saveNow();
    cfg.salt = salt; cfg.last = Date.now(); writeCfg(cfg);
    return true;
  } catch (e) { return false; }
}

/* Debounced background push after local changes. */
let pushTimer = null;
export function scheduleSync() {
  if (!syncOn()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => { pushNow(); }, 4000);
}

/* ---- lifecycle ----------------------------------------------------------- */
/* Turn sync on for the first time: mint a code, seed the cloud slot. */
export async function enableSync() {
  const code = makeCode();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  writeCfg({ code, salt: b64(salt), last: 0 });
  await pushNow();
  return code;
}
/* Link this device to an existing code: pull + merge, or seed if brand new. */
export async function linkDevice(inputCode) {
  const code = String(inputCode || '').trim();
  if (normalize(code).length < 8) return { ok: false, reason: 'short' };
  try {
    const id = await makeId(code);
    const r = await fetch('/api/sync?id=' + id).then(x => x.json()).catch(() => null);
    if (r && r.found) {
      let remote;
      try { remote = await decryptBlob(code, ub64(r.salt), r.blob); }
      catch (e) { return { ok: false, reason: 'wrong-code' }; }
      writeCfg({ code, salt: r.salt, last: Date.now() });
      store.s = deepDefaults(mergeState(store.s, remote));
      saveNow();
      await pushNow();
      return { ok: true, merged: true };
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    writeCfg({ code, salt: b64(salt), last: 0 });
    await pushNow();
    return { ok: true, merged: false };
  } catch (e) { return { ok: false, reason: 'network' }; }
}
