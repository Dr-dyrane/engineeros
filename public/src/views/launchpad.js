/* EngineerOS · Career Launchpad, the last mile: track the search, prep the interview. */

import { store, save, saveNow } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader, statTile, emptyState } from '../ui/components.js';
import { download, toast } from '../core/feedback.js';
import { INTERVIEW, INTERVIEW_QS } from '../data/interview.js';
import { launchpadInsight, starDraft } from '../core/coach.js';

const STATUS = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interviewing' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Closed' },
];
let panel = 'apps';

function appList() { return store.s.applications; }
function findApp(id) { return appList().find(a => a.id === id); }
function uid() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function answers() { return store.s.interview.answers; }
function isAnswered(id) {
  const a = answers()[id]; if (!a) return false;
  const t = (v) => !!(v && String(v).trim());
  return t(a.text) || t(a.s) || t(a.t) || t(a.a) || t(a.r);
}
function portfolioProjects() { const p = store.s.builders.portfolio || {}; return Array.isArray(p.projects) ? p.projects : []; }

/* ---- render -------------------------------------------------------------- */
export function renderLaunchpad() {
  const root = qs('#view-launchpad'); if (!root) return;
  root.innerHTML = `<div class="stagger">
    ${pageHeader('Career Launchpad', 'Run your search, land the interview.')}
    <div class="segmented" style="margin-bottom:var(--s-4)">
      <button data-action="la-panel" data-value="apps" class="${panel === 'apps' ? 'is-on' : ''}">Applications</button>
      <button data-action="la-panel" data-value="interview" class="${panel === 'interview' ? 'is-on' : ''}">Interview prep</button>
    </div>
    ${panel === 'apps' ? appsHTML() : interviewHTML()}
  </div>`;
}
registerView('launchpad', renderLaunchpad);

function appsHTML() {
  const list = appList();
  const stats = `<div class="grid-3">
    ${statTile(list.length, 'Tracked')}
    ${statTile(list.filter(a => a.status === 'applied' || a.status === 'interview').length, 'In play')}
    ${statTile(list.filter(a => a.status === 'interview').length, 'Interviews')}
  </div>`;
  const insight = `<div class="notice notice-accent mt-4">${icon('compass')} ${esc(launchpadInsight(list))}</div>`;
  const add = `<div class="mt-4"><button class="btn btn-primary" data-action="la-add">${icon('plus')} Add application</button></div>`;
  const groups = STATUS.map(s => {
    const items = list.filter(a => a.status === s.id);
    if (!items.length) return '';
    return `<section style="margin-top:var(--s-5)">
      <h3 class="section-label" style="margin-bottom:6px">${esc(s.label)} · ${items.length}</h3>
      <div class="list">${items.map(appCard).join('')}</div>
    </section>`;
  }).join('');
  const empty = list.length ? '' : `<div class="mt-4">${emptyState('briefcase', 'No applications yet. Add the first role you are eyeing, even a stretch one.')}</div>`;
  return `${stats}${insight}${add}${groups}${empty}`;
}

function appCard(a) {
  const chips = STATUS.map(s => `<button class="filter-chip ${a.status === s.id ? 'is-on' : ''}" data-action="la-status" data-value="${a.id}:${s.id}">${esc(s.label)}</button>`).join('');
  return `<div class="card" data-app="${a.id}">
    <input class="input" data-la-field="${a.id}:company" value="${esc(a.company || '')}" placeholder="Company" style="font-weight:600" />
    <input class="input mt-2" data-la-field="${a.id}:role" value="${esc(a.role || '')}" placeholder="Role" />
    <div class="row-tight mt-3" style="flex-wrap:wrap; gap:6px">${chips}</div>
    <div class="grid-2 mt-3">
      <div class="field" style="margin-bottom:0"><label>Next action</label><input class="input" data-la-field="${a.id}:next" value="${esc(a.next || '')}" placeholder="e.g. Follow up" /></div>
      <div class="field" style="margin-bottom:0"><label>By</label><input class="input" type="date" data-la-field="${a.id}:nextDate" value="${esc(a.nextDate || '')}" /></div>
    </div>
    <div class="field mt-3" style="margin-bottom:0"><label>Link</label><input class="input" data-la-field="${a.id}:link" value="${esc(a.link || '')}" placeholder="Job posting URL" /></div>
    <details class="mt-3"><summary class="t-foot text-3" style="cursor:pointer">+ Notes</summary>
      <textarea class="textarea mt-2" data-la-field="${a.id}:notes" placeholder="Contact, salary, what to prep...">${esc(a.notes || '')}</textarea></details>
    <div class="row between mt-3">
      ${a.link ? `<a class="btn btn-ghost btn-sm" href="${esc(a.link)}" target="_blank" rel="noopener">${icon('external-link')} Open</a>` : '<span></span>'}
      <button class="btn btn-ghost btn-sm" data-action="la-del" data-value="${a.id}" style="color:var(--red)">${icon('trash-2')} Remove</button>
    </div>
  </div>`;
}

function interviewHTML() {
  const answered = INTERVIEW_QS.filter(q => isAnswered(q.id)).length;
  const projects = portfolioProjects();
  const groups = INTERVIEW.map(g => `
    <section style="margin-top:var(--s-5)">
      <h3 class="section-label" style="margin-bottom:6px">${esc(g.group)}</h3>
      <div class="stack">${g.items.map(q => questionCard(q, projects)).join('')}</div>
    </section>`).join('');
  return `<div class="notice notice-accent">${icon('mic')} ${answered} of ${INTERVIEW_QS.length} answered · practice out loud, not just in your head.</div>
    <div class="mt-3"><button class="btn btn-ghost" data-action="la-export">${icon('download')} Export prep sheet</button></div>
    ${groups}`;
}

function questionCard(q, projects) {
  const a = answers()[q.id] || {};
  const open = isAnswered(q.id);
  const body = q.star ? starFields(q, a, projects)
    : `<textarea class="textarea mt-2" data-la-ans="${q.id}:text" placeholder="Your answer, in your own words...">${esc(a.text || '')}</textarea>`;
  return `<details class="card" ${open ? 'open' : ''}>
    <summary style="cursor:pointer; list-style:none">
      <div class="row between"><div class="fw-semibold grow">${esc(q.q)}</div>
        <span class="chev text-3">${isAnswered(q.id) ? icon('check') : icon('chevron-down')}</span></div>
    </summary>
    <p class="t-foot text-2 mt-2">${esc(q.hint)}</p>
    ${body}
  </details>`;
}
function starFields(q, a, projects) {
  const draft = projects.length
    ? `<div class="row-tight mt-2" style="flex-wrap:wrap; gap:6px; align-items:center">
        <span class="t-foot text-3">Draft from:</span>
        ${projects.map((p, i) => `<button class="filter-chip" data-action="la-draft" data-value="${q.id}:${i}">${esc(p.title || ('Project ' + (i + 1)))}</button>`).join('')}</div>`
    : '';
  const f = (k, label, ph) => `<div class="field mt-2" style="margin-bottom:0"><label>${label}</label><textarea class="textarea" data-la-ans="${q.id}:${k}" placeholder="${esc(ph)}">${esc(a[k] || '')}</textarea></div>`;
  return `${draft}
    ${f('s', 'Situation', 'Where and when, briefly')}
    ${f('t', 'Task', 'What you needed to do')}
    ${f('a', 'Action', 'What YOU did, step by step')}
    ${f('r', 'Result', 'How it turned out. A number if you can')}`;
}

/* ---- inputs (live save, no re-render so focus is kept) -------------------- */
export function launchpadInput(key, value) {
  const [id, field] = key.split(':');
  const a = findApp(id); if (!a) return;
  a[field] = value; a.updated = Date.now(); save();
}
export function launchpadAns(key, value) {
  const [qid, field] = key.split(':');
  const ans = answers();
  ans[qid] = ans[qid] || {};
  ans[qid][field] = value; save();
}

/* ---- actions ------------------------------------------------------------- */
export function launchpadAction(action, value) {
  switch (action) {
    case 'la-panel': panel = value; renderLaunchpad(); refresh(); break;
    case 'la-add': {
      appList().unshift({ id: uid(), company: '', role: '', status: 'saved', next: '', nextDate: '', link: '', notes: '', created: Date.now(), updated: Date.now() });
      saveNow(); renderLaunchpad(); refresh();
      const first = qs('#view-launchpad [data-la-field$=":company"]'); if (first) first.focus();
      break;
    }
    case 'la-status': { const [id, st] = value.split(':'); const a = findApp(id); if (a) { a.status = st; a.updated = Date.now(); saveNow(); renderLaunchpad(); refresh(); } break; }
    case 'la-del': {
      if (confirm('Remove this application from your tracker?')) {
        store.s.applications = appList().filter(a => a.id !== value); saveNow(); renderLaunchpad(); refresh();
      }
      break;
    }
    case 'la-draft': {
      const [qid, idx] = value.split(':');
      const p = portfolioProjects()[parseInt(idx, 10)];
      const d = starDraft(p); if (!d) return;
      const ans = answers(); ans[qid] = ans[qid] || {};
      ['s', 't', 'a', 'r'].forEach(k => { if (!(ans[qid][k] && ans[qid][k].trim()) && d[k]) ans[qid][k] = d[k]; });
      saveNow(); renderLaunchpad(); refresh();
      toast('Drafted from ' + (p.title || 'your project') + '. Make it yours.');
      break;
    }
    case 'la-export': exportInterview(); break;
  }
}

function refresh() { try { window.lucide && window.lucide.createIcons(); } catch (e) {} }

function exportInterview() {
  let md = '# Interview prep\n\nEngineerOS by Dyrane Academy\n\n';
  let wrote = false;
  for (const g of INTERVIEW) {
    if (!g.items.some(q => isAnswered(q.id))) continue;
    md += '## ' + g.group + '\n\n';
    for (const q of g.items) {
      if (!isAnswered(q.id)) continue;
      wrote = true;
      const a = answers()[q.id] || {};
      md += '### ' + q.q + '\n\n';
      if (q.star) {
        if (a.s) md += '**Situation.** ' + a.s + '\n\n';
        if (a.t) md += '**Task.** ' + a.t + '\n\n';
        if (a.a) md += '**Action.** ' + a.a + '\n\n';
        if (a.r) md += '**Result.** ' + a.r + '\n\n';
      } else if (a.text) { md += a.text + '\n\n'; }
    }
  }
  if (!wrote) { toast('Answer a question first', false); return; }
  download('interview-prep.md', md);
  toast('Prep sheet downloaded');
}
