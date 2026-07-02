/* Business Discovery · jsdom smoke test (same harness style as dom.test.mjs).
   Walks the real flow: welcome, start, intro, required questions, option
   cards auto-advance, chips, resume state, then the #admin review view with
   a stubbed API. Also sanity-checks the schema itself. */
import { JSDOM } from 'jsdom';
import { pathToFileURL, fileURLToPath } from 'url';
import fs from 'fs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = fs.existsSync(ROOT + '/public/discover.html') ? ROOT + '/public' : ROOT;
const html = fs.readFileSync(BASE + '/discover.html', 'utf8');
const errors = [];
process.on('uncaughtException', e => errors.push('UNCAUGHT: ' + (e && (e.stack || e.message))));
process.on('unhandledRejection', e => errors.push('REJECT: ' + (e && (e.stack || e.message))));

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://localhost/discover' });
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
try { globalThis.localStorage = window.localStorage; } catch (e) {}
globalThis.matchMedia = window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {}; globalThis.confirm = () => true; window.confirm = () => true;
window.addEventListener('error', e => errors.push('onerror: ' + (e.error && e.error.stack || e.message)));

/* ---- stub API ------------------------------------------------------------- */
const posts = [];
const RECORD = { version: 1, name: 'Bola', business: 'Bola Tiles', industry: 'Retail & trading', pct: 40, completed: false, started: 1, updated: 2, answers: { 'owner-name': 'Bola', 'business-name': 'Bola Tiles', 'frustration': 'Chasing debts' } };
globalThis.fetch = window.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (o, status = 200) => ({ ok: status < 400, status, json: async () => o });
  if (opts.method === 'POST') { posts.push(JSON.parse(opts.body)); return json({ ok: true }); }
  if (u.includes('key=')) {
    if (!u.includes('key=sesame')) return json({ error: 'unauthorized' }, 401);
    if (u.includes('list=1')) return json({ clients: [{ id: 'a'.repeat(64), name: 'Bola', business: 'Bola Tiles', industry: 'Retail & trading', pct: 40, completed: false, updated: 2 }] });
    return json({ id: 'a'.repeat(64), record: RECORD });
  }
  return json({ found: false });
};

const click = el => { if (!el) { errors.push('missing click target'); return; } el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const view = () => document.querySelector('#view-disc');
const A = (c, m) => { if (!c) errors.push('FAIL: ' + m); };
const type = (sel, text) => { const el = document.querySelector(sel); if (!el) { errors.push('missing input ' + sel); return; } el.value = text; el.dispatchEvent(new window.Event('input', { bubbles: true })); };

/* ---- schema sanity ---------------------------------------------------------- */
const { MODULES, ALL_QUESTIONS, TOTAL_QUESTIONS } = await import(pathToFileURL(BASE + '/src/discovery/schema.js').href);
A(MODULES.length === 8, 'eight modules');
A(TOTAL_QUESTIONS >= 40, 'enough questions (' + TOTAL_QUESTIONS + ')');
const ids = new Set(); const TYPES = new Set(['short', 'long', 'single', 'multi', 'scale', 'yesno']);
for (const q of ALL_QUESTIONS) {
  A(!ids.has(q.id), 'duplicate id ' + q.id); ids.add(q.id);
  A(TYPES.has(q.type), 'bad type on ' + q.id);
  if (q.type === 'single' || q.type === 'multi') A(Array.isArray(q.options) && q.options.length >= 2, 'options missing on ' + q.id);
}
A(ALL_QUESTIONS.filter(q => q.required).every(q => q.type === 'short'), 'only short questions are required');

/* ---- assessment flow ---------------------------------------------------------- */
await import(pathToFileURL(BASE + '/src/discovery/app.js').href);
await wait(30);

A(view().textContent.includes('Business Discovery'), 'welcome renders');
A(view().textContent.includes('Dyrane Academy'), 'consent copy names Dyrane Academy');
click(view().querySelector('[data-action="start"]')); await wait(20);
A(view().textContent.includes('Part 1 of 8'), 'module 1 intro');
click(view().querySelector('[data-action="next"]')); await wait(20);
A(view().textContent.includes('your name'), 'first question is the name');
A(document.querySelector('#q-next').disabled, 'Continue disabled until required answer');
type('#q-in', 'Bola'); await wait(500);
A(!document.querySelector('#q-next').disabled, 'Continue enables after typing');
click(document.querySelector('#q-next')); await wait(20);
type('#q-in', 'Bola Tiles & More'); await wait(500);
click(document.querySelector('#q-next')); await wait(20);
A(view().textContent.includes('kind of business'), 'industry question');
click(view().querySelector('.opt-card')); await wait(450);            // auto-advance
A(view().textContent.includes('How long have you been'), 'single select auto-advanced');
const st1 = JSON.parse(window.localStorage.getItem('discovery.v1'));
A(st1.answers['owner-name'] === 'Bola', 'answer autosaved locally');
A(st1.answers['industry'] === 'Retail & trading', 'card answer stored as its label');
A(/^[a-f0-9]{64}$/.test(st1.id), 'record id is a 64-hex continue code');
await wait(1600);                                                      // debounce, then server push
A(posts.length > 0, 'assessment pushed to /api/discovery');
const last = posts[posts.length - 1];
A(last.id === st1.id && last.record.name === 'Bola' && last.record.business === 'Bola Tiles & More', 'server record carries identity');
A(last.record.pct > 0, 'server record carries progress');

/* back nav + multi chips */
click(view().querySelector('[data-action="back"]')); await wait(20);
A(view().textContent.includes('kind of business'), 'back returns to previous question');
/* jump through remaining module-1 questions via skip/next to reach chips in module 2 */
for (let i = 0; i < 12 && !view().querySelector('.filter-chip'); i++) { click(document.querySelector('#q-next') || view().querySelector('[data-action="next"]')); await wait(30); }
if (view().querySelector('.filter-chip')) {
  const chip = view().querySelectorAll('.filter-chip')[0];
  click(chip); await wait(20);
  A(chip.classList.contains('is-on'), 'chip toggles on');
  const st2 = JSON.parse(window.localStorage.getItem('discovery.v1'));
  const multiId = Object.keys(st2.answers).find(k => Array.isArray(st2.answers[k]));
  A(multiId && st2.answers[multiId].length === 1, 'multi answer stored as array');
}

/* ---- admin view ------------------------------------------------------------------ */
window.location.hash = '#admin'; await wait(30);
A(view().textContent.includes('Reviewer access'), 'admin asks for key');
type('#adm-key', 'wrong');
click(view().querySelector('[data-action="admin-login"]')); await wait(30);
A(view().textContent.includes('Wrong key'), 'wrong key rejected');
type('#adm-key', 'sesame');
click(view().querySelector('[data-action="admin-login"]')); await wait(30);
A(view().textContent.includes('Discovery submissions'), 'admin list renders');
A(view().textContent.includes('Bola Tiles'), 'client row shows business');
click(view().querySelector('[data-action="admin-open"]')); await wait(30);
A(view().textContent.includes('Chasing debts'), 'detail shows an answer');
A(view().textContent.includes('What frustrates you most'), 'detail shows the question text');
A(view().textContent.includes('Not answered yet'), 'untouched modules are marked');

/* ---- verdict ---------------------------------------------------------------------- */
if (errors.length) { console.error('\n✗ discovery.test failed\n' + errors.map(e => '  ' + e).join('\n')); process.exit(1); }
console.log('✓ discovery.test: schema valid, assessment flow, autosave + server push, admin review all pass');
process.exit(0);
