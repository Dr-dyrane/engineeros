/* EngineerOS · Resume Studio
   Structured editor + live, ATS-safe single-page preview, strength score,
   ATS keyword match, action-verb coaching, and Print→PDF / text / markdown export. */

import { store, save } from '../core/state.js';
import { qs, qsa, esc, icon, refreshIcons } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { download, copyText, toast } from '../core/feedback.js';
import { meter, pageHeader } from '../ui/components.js';
import { ACTION_VERBS, VERB_SET, XYZ, STOPWORDS, SKILL_HINTS } from '../data/resume-assets.js';

/* ---------- model + one-time migration from the old flat shape ----------- */
const emptyExp = () => ({ role:'', org:'', place:'', start:'', end:'', current:false, bullets:[''] });
const emptyProj = () => ({ name:'', tech:'', link:'', bullets:[''] });
const emptyEdu = () => ({ degree:'', school:'', place:'', start:'', end:'', detail:'' });

function R() { const b = store.s.builders; b.resume = b.resume || {}; migrate(b.resume); return b.resume; }
function migrate(r) {
  if (r._v === 2) return;
  const o = Object.assign({}, r);
  const str = v => (typeof v === 'string' && v.trim()) ? v.trim() : '';
  r.name = o.name || ''; r.title = o.title || ''; r.email = o.email || ''; r.phone = o.phone || '';
  r.location = o.location || ''; r.linkedin = o.linkedin || ''; r.github = o.github || ''; r.portfolio = o.portfolio || '';
  r.summary = o.summary || '';
  r.experience = Array.isArray(o.experience) ? o.experience : (str(o.experience) ? [Object.assign(emptyExp(), { bullets: [str(o.experience)] })] : []);
  r.projects = Array.isArray(o.projects) ? o.projects : (str(o.projects) ? [Object.assign(emptyProj(), { bullets: [str(o.projects)] })] : []);
  r.education = Array.isArray(o.education) ? o.education : (str(o.education) ? [Object.assign(emptyEdu(), { degree: str(o.education) })] : []);
  r.skills = Array.isArray(o.skills) ? o.skills : (str(o.skills) ? [{ group: 'Skills', items: str(o.skills) }] : []);
  r.certifications = Array.isArray(o.certifications) ? o.certifications : (str(o.certifications) ? [{ name: str(o.certifications), issuer: '', year: '' }] : []);
  r.targetJD = o.targetJD || '';
  if (!r.experience.length) r.experience.push(emptyExp());
  if (!r.skills.length) r.skills.push({ group: '', items: '' });
  r._v = 2;
}

/* ---------- path set (for live editing) ---------------------------------- */
const ARR = { exp: 'experience', proj: 'projects', edu: 'education', skill: 'skills', cert: 'certifications' };
function setPath(r, path, value) {
  const s = path.split('.');
  if (s.length === 1) { r[s[0]] = value; return; }
  const arr = r[ARR[s[0]]]; if (!arr || !arr[+s[1]]) return;
  if (s[2] === 'b') arr[+s[1]].bullets[+s[3]] = value;
  else arr[+s[1]][s[2]] = value;
}
export function resumeInput(path, value) { setPath(R(), path, value); save(); refreshDynamic(); }

/* last-focused editable field, so a tapped verb lands in the right bullet */
let lastField = null;
document.addEventListener('focusin', e => {
  const f = e.target.closest && e.target.closest('#view-resume [data-rs]');
  if (f && (f.tagName === 'TEXTAREA' || f.tagName === 'INPUT')) lastField = f;
});

/* ---------- scoring ------------------------------------------------------- */
function allBullets(r) {
  const b = [];
  (r.experience || []).forEach(e => (e.bullets || []).forEach(x => b.push(x)));
  (r.projects || []).forEach(p => (p.bullets || []).forEach(x => b.push(x)));
  return b.filter(x => x && x.trim());
}
function firstWord(s) { return (s.trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, ''); }
function scoreData(r) {
  const bullets = allBullets(r);
  const hasContact = !!(r.name && r.email);
  const hasSummary = !!(r.summary && r.summary.trim().length > 20);
  const hasExp = (r.experience || []).some(e => e.bullets.some(b => b && b.trim())) || (r.projects || []).some(p => p.bullets.some(b => b && b.trim()));
  const hasEdu = (r.education || []).some(e => e.degree && e.degree.trim());
  const hasSkills = (r.skills || []).some(s => s.items && s.items.trim());
  const quant = bullets.filter(b => /\d/.test(b)).length;
  const qRatio = bullets.length ? quant / bullets.length : 0;
  const verbN = bullets.filter(b => VERB_SET.has(firstWord(b))).length;
  const vRatio = bullets.length ? verbN / bullets.length : 0;
  let score = (hasContact ? 15 : 0) + (hasSummary ? 12 : 0) + (hasExp ? 18 : 0) + (hasEdu ? 10 : 0) + (hasSkills ? 10 : 0)
    + Math.round(qRatio * 20) + Math.round(vRatio * 15);
  score = Math.min(100, score);
  const tips = [];
  if (!hasContact) tips.push(['miss', 'Add your name and email']);
  if (!hasSummary) tips.push(['miss', 'Write a 2–3 line summary up top']);
  if (!hasExp) tips.push(['miss', 'Add at least one experience or project with bullet points']);
  if (bullets.length && qRatio < 0.5) tips.push(['miss', `Add a number or metric to ${bullets.length - quant} more bullet${bullets.length - quant === 1 ? '' : 's'}`]);
  if (bullets.length && vRatio < 0.7) { const n = bullets.length - verbN; tips.push(['miss', `Start ${n} bullet${n === 1 ? '' : 's'} with a strong action verb`]); }
  if (!hasSkills) tips.push(['miss', 'List your skills and tools']);
  if (!hasEdu) tips.push(['miss', 'Add your education']);
  if (!tips.length) tips.push(['ok', 'Strong resume — now tailor it to each job with the ATS check below']);
  return { score, tips };
}
function scoreHTML(r) {
  const { score, tips } = scoreData(r);
  const tone = score >= 70 ? 'green' : score >= 40 ? 'amber' : '';
  return `<div class="row between"><div><div class="rs-score-n">${score}<span style="font-size:15px">/100</span></div>
      <div class="t-foot text-3">Resume strength</div></div><div style="width:120px">${meter(score, tone)}</div></div>
    <div class="mt-3">${tips.map(([k, t]) => `<div class="rs-tip ${k === 'ok' ? 'ok' : ''}">
      <span style="color:${k === 'ok' ? 'var(--green)' : 'var(--amber)'};font-weight:700">${k === 'ok' ? '✓' : '→'}</span>
      <span>${esc(t)}</span></div>`).join('')}</div>`;
}

/* ---------- ATS keyword match -------------------------------------------- */
function tokenize(t) { return (t.toLowerCase().match(/[a-z][a-z+#.]*[a-z+#]|[a-z]/g) || []); }
function atsData(r) {
  const jd = (r.targetJD || '').trim(); if (!jd) return null;
  const low = jd.toLowerCase();
  const set = new Set();
  SKILL_HINTS.forEach(h => { if (low.includes(h)) set.add(h); });
  const freq = {};
  tokenize(jd).forEach(w => { if (w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w)) freq[w] = (freq[w] || 0) + 1; });
  Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 24).forEach(w => set.add(w));
  const kws = [...set];
  const txt = plain(r).toLowerCase();
  const hit = kws.filter(k => txt.includes(k)), miss = kws.filter(k => !txt.includes(k));
  return { pct: kws.length ? Math.round(hit.length / kws.length * 100) : 0, hit, miss };
}
function atsHTML(r) {
  const a = atsData(r);
  if (!a) return `<p class="t-foot text-3">Paste a job description above and I’ll show how well your resume matches its keywords — and which to add (honestly).</p>`;
  const tone = a.pct >= 70 ? 'green' : a.pct >= 40 ? 'amber' : '';
  return `<div class="row between mb-2"><div class="fw-semibold">Keyword match</div><div class="fw-bold">${a.pct}%</div></div>
    ${meter(a.pct, tone)}
    ${a.miss.length ? `<div class="t-foot text-3 mt-3 mb-1">Missing — add the ones that genuinely apply:</div>
      <div class="rs-kws">${a.miss.slice(0, 18).map(k => `<span class="rs-kw miss">${esc(k)}</span>`).join('')}</div>` : ''}
    ${a.hit.length ? `<div class="t-foot text-3 mt-3 mb-1">Matched:</div>
      <div class="rs-kws">${a.hit.slice(0, 18).map(k => `<span class="rs-kw hit">${esc(k)}</span>`).join('')}</div>` : ''}`;
}

/* ---------- the resume "paper" ------------------------------------------- */
function dates(a, b, cur) { return [a, cur ? 'Present' : b].filter(Boolean).join(' – '); }
function bl(arr) { const i = (arr || []).filter(b => b && b.trim()); return i.length ? `<ul class="rp-ul">${i.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''; }
function paperHTML(r) {
  const contact = [r.email, r.phone, r.location, r.linkedin, r.github, r.portfolio].filter(Boolean);
  const exp = (r.experience || []).filter(e => e.role || e.org || e.bullets.some(b => b && b.trim()));
  const proj = (r.projects || []).filter(p => p.name || p.bullets.some(b => b && b.trim()));
  const edu = (r.education || []).filter(e => e.degree || e.school);
  const sk = (r.skills || []).filter(s => s.items && s.items.trim());
  const ce = (r.certifications || []).filter(c => c.name && c.name.trim());
  let h = `<div class="rp-name">${esc(r.name || 'Your Name')}</div>`;
  if (r.title) h += `<div class="rp-title">${esc(r.title)}</div>`;
  h += `<div class="rp-contact">${contact.length ? contact.map(c => `<span>${esc(c)}</span>`).join('') : '<span class="rp-empty">add your contact details</span>'}</div>`;
  if (r.summary && r.summary.trim()) h += `<div class="rp-section"><div class="rp-h">Summary</div><div class="rp-summary">${esc(r.summary)}</div></div>`;
  if (exp.length) h += `<div class="rp-section"><div class="rp-h">Experience</div>${exp.map(e => `
    <div class="rp-item"><div class="rp-row">
      <span><span class="rp-role">${esc(e.role || 'Role')}</span>${e.org ? ` — <span class="rp-org">${esc(e.org)}</span>` : ''}</span>
      <span class="rp-meta">${esc([e.place, dates(e.start, e.end, e.current)].filter(Boolean).join(' · '))}</span>
    </div>${bl(e.bullets)}</div>`).join('')}</div>`;
  if (proj.length) h += `<div class="rp-section"><div class="rp-h">Projects</div>${proj.map(p => `
    <div class="rp-item"><div class="rp-row">
      <span class="rp-role">${esc(p.name || 'Project')}${p.tech ? ` <span class="rp-meta">— ${esc(p.tech)}</span>` : ''}</span>
      ${p.link ? `<span class="rp-meta">${esc(p.link)}</span>` : ''}
    </div>${bl(p.bullets)}</div>`).join('')}</div>`;
  if (edu.length) h += `<div class="rp-section"><div class="rp-h">Education</div>${edu.map(e => `
    <div class="rp-item"><div class="rp-row">
      <span><span class="rp-role">${esc(e.degree || 'Degree')}</span>${e.school ? ` — <span class="rp-org">${esc(e.school)}</span>` : ''}</span>
      <span class="rp-meta">${esc([e.place, dates(e.start, e.end)].filter(Boolean).join(' · '))}</span>
    </div>${e.detail ? `<div>${esc(e.detail)}</div>` : ''}</div>`).join('')}</div>`;
  if (sk.length) h += `<div class="rp-section"><div class="rp-h">Skills</div>${sk.map(s => `<div class="rp-skline">${s.group ? `<b>${esc(s.group)}:</b> ` : ''}${esc(s.items)}</div>`).join('')}</div>`;
  if (ce.length) h += `<div class="rp-section"><div class="rp-h">Certifications</div>${ce.map(c => `<div class="rp-skline">${esc(c.name)}${c.issuer ? ` — ${esc(c.issuer)}` : ''}${c.year ? ` (${esc(c.year)})` : ''}</div>`).join('')}</div>`;
  return h;
}

/* ---------- exports ------------------------------------------------------- */
function plain(r) {
  const L = []; L.push(r.name || 'Your Name'); if (r.title) L.push(r.title);
  const c = [r.email, r.phone, r.location, r.linkedin, r.github, r.portfolio].filter(Boolean); if (c.length) L.push(c.join(' | '));
  if (r.summary && r.summary.trim()) { L.push('', 'SUMMARY', r.summary.trim()); }
  const sec = (t, items) => { if (items.length) { L.push('', t.toUpperCase()); items.forEach(x => L.push(x)); } };
  sec('Experience', (r.experience || []).filter(e => e.role || e.org || e.bullets.some(b => b && b.trim())).flatMap(e => {
    const head = [[e.role, e.org].filter(Boolean).join(' — '), [e.place, dates(e.start, e.end, e.current)].filter(Boolean).join(' · ')].filter(Boolean).join('  |  ');
    return [head, ...e.bullets.filter(b => b && b.trim()).map(b => '  • ' + b.trim())];
  }));
  sec('Projects', (r.projects || []).filter(p => p.name || p.bullets.some(b => b && b.trim())).flatMap(p => {
    const head = [p.name, p.tech, p.link].filter(Boolean).join(' — ');
    return [head, ...p.bullets.filter(b => b && b.trim()).map(b => '  • ' + b.trim())];
  }));
  sec('Education', (r.education || []).filter(e => e.degree || e.school).map(e => [[e.degree, e.school].filter(Boolean).join(' — '), [e.place, dates(e.start, e.end)].filter(Boolean).join(' · ')].filter(Boolean).join('  |  ')));
  sec('Skills', (r.skills || []).filter(s => s.items && s.items.trim()).map(s => (s.group ? s.group + ': ' : '') + s.items.trim()));
  sec('Certifications', (r.certifications || []).filter(c => c.name && c.name.trim()).map(c => c.name + (c.issuer ? ' — ' + c.issuer : '') + (c.year ? ' (' + c.year + ')' : '')));
  return L.join('\n') + '\n';
}
function markdown(r) {
  const L = []; L.push('# ' + (r.name || 'Your Name')); if (r.title) L.push('**' + r.title + '**');
  const c = [r.email, r.phone, r.location, r.linkedin, r.github, r.portfolio].filter(Boolean); if (c.length) L.push(c.join(' · '));
  if (r.summary && r.summary.trim()) L.push('', '## Summary', '', r.summary.trim());
  const exp = (r.experience || []).filter(e => e.role || e.org || e.bullets.some(b => b && b.trim()));
  if (exp.length) { L.push('', '## Experience'); exp.forEach(e => { L.push('', `**${[e.role, e.org].filter(Boolean).join(' — ')}** — ${[e.place, dates(e.start, e.end, e.current)].filter(Boolean).join(' · ')}`); e.bullets.filter(b => b && b.trim()).forEach(b => L.push('- ' + b.trim())); }); }
  const pr = (r.projects || []).filter(p => p.name || p.bullets.some(b => b && b.trim()));
  if (pr.length) { L.push('', '## Projects'); pr.forEach(p => { L.push('', `**${[p.name, p.tech].filter(Boolean).join(' — ')}**${p.link ? ' · ' + p.link : ''}`); p.bullets.filter(b => b && b.trim()).forEach(b => L.push('- ' + b.trim())); }); }
  const ed = (r.education || []).filter(e => e.degree || e.school);
  if (ed.length) { L.push('', '## Education'); ed.forEach(e => L.push('', `**${[e.degree, e.school].filter(Boolean).join(' — ')}** — ${[e.place, dates(e.start, e.end)].filter(Boolean).join(' · ')}`, e.detail || '')); }
  const sk = (r.skills || []).filter(s => s.items && s.items.trim());
  if (sk.length) { L.push('', '## Skills'); sk.forEach(s => L.push('- ' + (s.group ? '**' + s.group + ':** ' : '') + s.items.trim())); }
  const ce = (r.certifications || []).filter(c => c.name && c.name.trim());
  if (ce.length) { L.push('', '## Certifications'); ce.forEach(c => L.push('- ' + c.name + (c.issuer ? ' — ' + c.issuer : '') + (c.year ? ' (' + c.year + ')' : ''))); }
  return L.join('\n') + '\n';
}
const fname = ext => `${(R().name || 'resume').toLowerCase().replace(/\s+/g, '-')}-resume.${ext}`;

/* ---------- live (focus-preserving) refresh ------------------------------ */
function refreshDynamic() {
  const r = R();
  const p = qs('#rs-paper'); if (p) p.innerHTML = paperHTML(r);
  const s = qs('#rs-score'); if (s) s.innerHTML = scoreHTML(r);
  const a = qs('#rs-ats-result'); if (a) a.innerHTML = atsHTML(r);
}

/* ---------- form rendering helpers --------------------------------------- */
const inp = (path, val, ph, type = 'text') => `<input class="input" data-rs="${path}" type="${type}" placeholder="${esc(ph)}" value="${esc(val || '')}" />`;
const ta = (path, val, ph) => `<textarea class="textarea" data-rs="${path}" placeholder="${esc(ph)}">${esc(val || '')}</textarea>`;
function delBtn(action, value) { return `<button class="rs-iconbtn" data-action="${action}" data-value="${value}" aria-label="Remove">${icon('trash-2')}</button>`; }
function addBtn(action, value, label) { return `<button class="btn btn-ghost btn-sm" data-action="${action}" data-value="${value}">${icon('plus')} ${esc(label)}</button>`; }

function expEntry(e, i) {
  return `<div class="rs-entry">
    <div class="rs-entry-head"><span class="t">EXPERIENCE ${i + 1}</span>${delBtn('rs-del-exp', i)}</div>
    <div class="rs-two">${inp(`exp.${i}.role`, e.role, 'Role / title')}${inp(`exp.${i}.org`, e.org, 'Organisation')}</div>
    <div class="rs-two mt-2">${inp(`exp.${i}.start`, e.start, 'Start (e.g. 2024)')}${inp(`exp.${i}.end`, e.end, 'End (e.g. 2025)')}</div>
    <div class="rs-two mt-2">${inp(`exp.${i}.place`, e.place, 'Location (optional)')}
      <label class="row-tight" style="padding-left:4px"><input type="checkbox" data-rs-check="exp.${i}.current" ${e.current ? 'checked' : ''}/> <span class="t-foot">Current</span></label></div>
    <div class="mt-2">${(e.bullets || []).map((b, j) => `<div class="rs-bullet">${ta(`exp.${i}.b.${j}`, b, XYZ.formula)}${delBtn('rs-del-expb', i + '.' + j)}</div>`).join('')}</div>
    <div class="mt-2">${addBtn('rs-add-expb', i, 'Add bullet')}</div>
  </div>`;
}
function projEntry(p, i) {
  return `<div class="rs-entry">
    <div class="rs-entry-head"><span class="t">PROJECT ${i + 1}</span>${delBtn('rs-del-proj', i)}</div>
    <div class="rs-two">${inp(`proj.${i}.name`, p.name, 'Project name')}${inp(`proj.${i}.tech`, p.tech, 'Tech / tools')}</div>
    <div class="mt-2">${inp(`proj.${i}.link`, p.link, 'Link (GitHub / demo)')}</div>
    <div class="mt-2">${(p.bullets || []).map((b, j) => `<div class="rs-bullet">${ta(`proj.${i}.b.${j}`, b, 'What it does + the result')}${delBtn('rs-del-projb', i + '.' + j)}</div>`).join('')}</div>
    <div class="mt-2">${addBtn('rs-add-projb', i, 'Add bullet')}</div>
  </div>`;
}
function eduEntry(e, i) {
  return `<div class="rs-entry">
    <div class="rs-entry-head"><span class="t">EDUCATION ${i + 1}</span>${delBtn('rs-del-edu', i)}</div>
    <div class="rs-two">${inp(`edu.${i}.degree`, e.degree, 'Degree')}${inp(`edu.${i}.school`, e.school, 'School')}</div>
    <div class="rs-two mt-2">${inp(`edu.${i}.start`, e.start, 'Start')}${inp(`edu.${i}.end`, e.end, 'End / expected')}</div>
    <div class="mt-2">${inp(`edu.${i}.detail`, e.detail, 'Highlight (optional: GPA, award, project)')}</div>
  </div>`;
}
function skillEntry(s, i) {
  return `<div class="rs-entry"><div class="rs-entry-head"><span class="t">SKILL GROUP ${i + 1}</span>${delBtn('rs-del-skill', i)}</div>
    <div class="rs-two">${inp(`skill.${i}.group`, s.group, 'Group (e.g. Engineering)')}${inp(`skill.${i}.items`, s.items, 'SolidWorks, Python, Arduino…')}</div></div>`;
}
function certEntry(c, i) {
  return `<div class="rs-entry"><div class="rs-entry-head"><span class="t">CERTIFICATION ${i + 1}</span>${delBtn('rs-del-cert', i)}</div>
    <div class="rs-two">${inp(`cert.${i}.name`, c.name, 'Name')}${inp(`cert.${i}.issuer`, c.issuer, 'Issuer')}</div>
    <div class="mt-2" style="max-width:140px">${inp(`cert.${i}.year`, c.year, 'Year')}</div></div>`;
}
function verbHelper() {
  return `<details class="card" style="margin-top:10px"><summary class="fw-semibold" style="cursor:pointer">${icon('wand-sparkles')} Need a strong opener? Tap a verb</summary>
    <p class="t-foot text-3 mt-2">It drops into the bullet you last tapped. ${esc(XYZ.formula)}</p>
    ${ACTION_VERBS.map(g => `<div class="rs-verb-group">${g.group}</div><div class="rs-verbs">${g.verbs.map(v => `<button class="rs-verb" data-action="rs-verb" data-value="${v}">${v}</button>`).join('')}</div>`).join('')}
  </details>`;
}

/* ---------- main render --------------------------------------------------- */
function renderResume() {
  const r = R();
  const groupHead = (label, action, addLabel) => `<div class="rs-group-h"><h3 class="section-label">${label}</h3>${addBtn(action, '', addLabel)}</div>`;

  qs('#view-resume').innerHTML = `<div class="stagger">
    ${pageHeader('Build Studio', 'Resume Studio')}

    <div class="studio-toolbar">
      <div class="segmented studio-toggle">
        <button data-action="rs-panel" data-value="edit" data-rs-panel-btn="edit" class="is-on">Edit</button>
        <button data-action="rs-panel" data-value="preview" data-rs-panel-btn="preview">Preview</button>
      </div>
      <div class="tb-actions">
        <button class="btn btn-primary btn-sm" data-action="rs-print">${icon('printer')} Save PDF</button>
        <button class="btn btn-ghost btn-sm" data-action="rs-export-txt">${icon('file-text')} .txt</button>
        <button class="btn btn-ghost btn-sm" data-action="rs-export-md">${icon('download')} .md</button>
      </div>
    </div>

    <div class="studio" data-panel="edit">
      <div class="studio-edit">
        <div class="card">
          <h3 class="section-label" style="margin-top:0">Contact</h3>
          <div class="rs-two">${inp('name', r.name, 'Full name')}${inp('title', r.title, 'Headline (Mechanical → AI & Robotics)')}</div>
          <div class="rs-two mt-2">${inp('email', r.email, 'Email', 'email')}${inp('phone', r.phone, 'Phone', 'tel')}</div>
          <div class="mt-2">${inp('location', r.location, 'Location (Lagos, Nigeria)')}</div>
          <div class="rs-two mt-2">${inp('linkedin', r.linkedin, 'LinkedIn URL')}${inp('github', r.github, 'GitHub URL')}</div>
          <div class="mt-2">${inp('portfolio', r.portfolio, 'Portfolio URL (optional)')}</div>
        </div>

        <div class="card">
          <h3 class="section-label" style="margin-top:0">Summary</h3>
          ${ta('summary', r.summary, 'Two or three lines: who you are, your strengths, where you’re heading.')}
        </div>

        <div class="rs-group">
          ${groupHead('Experience', 'rs-add-exp', 'Add')}
          ${(r.experience || []).map(expEntry).join('')}
          ${verbHelper()}
        </div>

        <div class="rs-group">
          ${groupHead('Projects', 'rs-add-proj', 'Add')}
          ${(r.projects || []).map(projEntry).join('')}
        </div>

        <div class="rs-group">
          ${groupHead('Education', 'rs-add-edu', 'Add')}
          ${(r.education || []).map(eduEntry).join('')}
        </div>

        <div class="rs-group">
          ${groupHead('Skills', 'rs-add-skill', 'Add group')}
          ${(r.skills || []).map(skillEntry).join('')}
        </div>

        <div class="rs-group">
          ${groupHead('Certifications', 'rs-add-cert', 'Add')}
          ${(r.certifications || []).map(certEntry).join('')}
        </div>

        <div class="card"><h3 class="section-label" style="margin-top:0">Strength</h3><div id="rs-score"></div></div>

        <div class="card">
          <h3 class="section-label" style="margin-top:0">ATS keyword match</h3>
          <p class="t-foot text-3 mb-2">Paste the job description you’re targeting.</p>
          ${ta('targetJD', r.targetJD, 'Paste a job post here…')}
          <div id="rs-ats-result" class="mt-3"></div>
        </div>
      </div>

      <div class="studio-preview">
        <div class="resume-paper" id="rs-paper"></div>
        <p class="t-foot text-3 center mt-3 no-print">“Save PDF” opens your browser’s print dialog — choose <b>Save as PDF</b>. Single-column, ATS-safe.</p>
      </div>
    </div>
  </div>`;
  refreshDynamic();
  refreshIcons(qs('#view-resume'));
}
registerView('resume', renderResume);

/* ---------- verb insert + actions ---------------------------------------- */
function insertVerb(verb) {
  if (lastField) {
    const el = lastField, s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
    el.value = el.value.slice(0, s) + verb + ' ' + el.value.slice(e);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
    const pos = s + verb.length + 1;
    try { el.focus(); el.setSelectionRange(pos, pos); } catch (_) {}
    toast('Added “' + verb + '”', false);
  } else { copyText(verb); }
}
function setPanel(p) {
  const s = qs('#view-resume .studio'); if (s) s.dataset.panel = p;
  qsa('#view-resume [data-rs-panel-btn]').forEach(b => b.classList.toggle('is-on', b.dataset.rsPanelBtn === p));
}
export function resumeAction(action, value) {
  const r = R();
  const reRender = () => { save(); renderResume(); };
  switch (action) {
    case 'rs-panel': setPanel(value); break;
    case 'rs-add-exp': r.experience.push(emptyExp()); reRender(); break;
    case 'rs-del-exp': r.experience.splice(+value, 1); if (!r.experience.length) r.experience.push(emptyExp()); reRender(); break;
    case 'rs-add-expb': r.experience[+value].bullets.push(''); reRender(); break;
    case 'rs-del-expb': { const [i, j] = value.split('.').map(Number); r.experience[i].bullets.splice(j, 1); if (!r.experience[i].bullets.length) r.experience[i].bullets.push(''); reRender(); break; }
    case 'rs-add-proj': r.projects.push(emptyProj()); reRender(); break;
    case 'rs-del-proj': r.projects.splice(+value, 1); reRender(); break;
    case 'rs-add-projb': r.projects[+value].bullets.push(''); reRender(); break;
    case 'rs-del-projb': { const [i, j] = value.split('.').map(Number); r.projects[i].bullets.splice(j, 1); if (!r.projects[i].bullets.length) r.projects[i].bullets.push(''); reRender(); break; }
    case 'rs-add-edu': r.education.push(emptyEdu()); reRender(); break;
    case 'rs-del-edu': r.education.splice(+value, 1); reRender(); break;
    case 'rs-add-skill': r.skills.push({ group: '', items: '' }); reRender(); break;
    case 'rs-del-skill': r.skills.splice(+value, 1); reRender(); break;
    case 'rs-add-cert': r.certifications.push({ name: '', issuer: '', year: '' }); reRender(); break;
    case 'rs-del-cert': r.certifications.splice(+value, 1); reRender(); break;
    case 'rs-verb': insertVerb(value); break;
    case 'rs-print': try { window.print(); } catch (_) {} break;
    case 'rs-export-md': download(fname('md'), markdown(r)); toast('Markdown downloaded'); break;
    case 'rs-export-txt': download(fname('txt'), plain(r), 'text/plain;charset=utf-8'); toast('Text downloaded'); break;
    case 'rs-copy': copyText(plain(r)); break;
  }
}
