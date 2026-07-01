/* EngineerOS · Resume Studio
   Structured editor + live, ATS-safe single-page preview, strength score,
   ATS keyword match, action-verb coaching, and Print to PDF / text / markdown export.
   Mechanics (paths, panels, form fields, verb insert) come from the studio engine. */

import { save } from '../core/state.js';
import { qs, icon, refreshIcons, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { registerActions, registerInput, registerChange } from '../core/actions.js';
import { download, copyText, toast } from '../core/feedback.js';
import { meter, pageHeader, tip } from '../ui/components.js';
import { createStudio, coachPanel } from '../ui/studio.js';
import { emptyExp, emptyProj, emptyEdu } from '../core/models.js';
import { VERB_SET, XYZ, STOPWORDS, SKILL_HINTS } from '../data/resume-assets.js';
import { reviewResume, draftSummary } from '../core/coach.js';

const st = createStudio({
  key: 'resume', attr: 'rs',
  arrays: { exp: 'experience', proj: 'projects', edu: 'education', skill: 'skills', cert: 'certifications' },
  refresh: () => refreshDynamic(),
});
const R = st.model;

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
  return Math.min(100, score);
}
const scoreHTML = (r) => coachPanel(scoreData(r), 'resume strength', reviewResume(r),
  'Looking strong. Now tailor it to each job using the ATS check below.');

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
  if (!a) return html`<p class="t-foot text-3">Paste a job description to see your keyword match.</p>`;
  const tone = a.pct >= 70 ? 'green' : a.pct >= 40 ? 'amber' : '';
  return html`<div class="row between mb-2"><div class="fw-semibold">Keyword match</div><div class="fw-bold">${a.pct}%</div></div>
    ${meter(a.pct, tone)}
    ${a.miss.length ? html`<div class="t-foot text-3 mt-3 mb-1">Missing keywords. Add the ones that genuinely apply:</div>
      <div class="rs-kws">${a.miss.slice(0, 18).map(k => html`<span class="rs-kw miss">${k}</span>`)}</div>` : ''}
    ${a.hit.length ? html`<div class="t-foot text-3 mt-3 mb-1">Matched:</div>
      <div class="rs-kws">${a.hit.slice(0, 18).map(k => html`<span class="rs-kw hit">${k}</span>`)}</div>` : ''}`;
}

/* ---------- the resume "paper" ------------------------------------------- */
function dates(a, b, cur) { return [a, cur ? 'Present' : b].filter(Boolean).join(' to '); }
function bl(arr) { const i = (arr || []).filter(b => b && b.trim()); return i.length ? html`<ul class="rp-ul">${i.map(b => html`<li>${b}</li>`)}</ul>` : ''; }
function paperHTML(r) {
  const contact = [r.email, r.phone, r.location, r.linkedin, r.github, r.portfolio].filter(Boolean);
  const exp = (r.experience || []).filter(e => e.role || e.org || e.bullets.some(b => b && b.trim()));
  const proj = (r.projects || []).filter(p => p.name || p.bullets.some(b => b && b.trim()));
  const edu = (r.education || []).filter(e => e.degree || e.school);
  const sk = (r.skills || []).filter(s => s.items && s.items.trim());
  const ce = (r.certifications || []).filter(c => c.name && c.name.trim());
  return html`<div class="rp-name">${r.name || 'Your Name'}</div>
    ${r.title ? html`<div class="rp-title">${r.title}</div>` : ''}
    <div class="rp-contact">${contact.length ? contact.map(c => html`<span>${c}</span>`) : html`<span class="rp-empty">add your contact details</span>`}</div>
    ${r.summary && r.summary.trim() ? html`<div class="rp-section"><div class="rp-h">Summary</div><div class="rp-summary">${r.summary}</div></div>` : ''}
    ${exp.length ? html`<div class="rp-section"><div class="rp-h">Experience</div>${exp.map(e => html`
      <div class="rp-item"><div class="rp-row">
        <span><span class="rp-role">${e.role || 'Role'}</span>${e.org ? html`, <span class="rp-org">${e.org}</span>` : ''}</span>
        <span class="rp-meta">${[e.place, dates(e.start, e.end, e.current)].filter(Boolean).join(' · ')}</span>
      </div>${bl(e.bullets)}</div>`)}</div>` : ''}
    ${proj.length ? html`<div class="rp-section"><div class="rp-h">Projects</div>${proj.map(p => html`
      <div class="rp-item"><div class="rp-row">
        <span class="rp-role">${p.name || 'Project'}${p.tech ? html` <span class="rp-meta">· ${p.tech}</span>` : ''}</span>
        ${p.link ? html`<span class="rp-meta">${p.link}</span>` : ''}
      </div>${bl(p.bullets)}</div>`)}</div>` : ''}
    ${edu.length ? html`<div class="rp-section"><div class="rp-h">Education</div>${edu.map(e => html`
      <div class="rp-item"><div class="rp-row">
        <span><span class="rp-role">${e.degree || 'Degree'}</span>${e.school ? html`, <span class="rp-org">${e.school}</span>` : ''}</span>
        <span class="rp-meta">${[e.place, dates(e.start, e.end)].filter(Boolean).join(' · ')}</span>
      </div>${e.detail ? html`<div>${e.detail}</div>` : ''}</div>`)}</div>` : ''}
    ${sk.length ? html`<div class="rp-section"><div class="rp-h">Skills</div>${sk.map(s => html`<div class="rp-skline">${s.group ? html`<b>${s.group}:</b> ` : ''}${s.items}</div>`)}</div>` : ''}
    ${ce.length ? html`<div class="rp-section"><div class="rp-h">Certifications</div>${ce.map(c => html`<div class="rp-skline">${c.name}${c.issuer ? ', ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}</div>`)}</div>` : ''}`;
}

/* ---------- exports ------------------------------------------------------- */
function plain(r) {
  const L = []; L.push(r.name || 'Your Name'); if (r.title) L.push(r.title);
  const c = [r.email, r.phone, r.location, r.linkedin, r.github, r.portfolio].filter(Boolean); if (c.length) L.push(c.join(' | '));
  if (r.summary && r.summary.trim()) { L.push('', 'SUMMARY', r.summary.trim()); }
  const sec = (t, items) => { if (items.length) { L.push('', t.toUpperCase()); items.forEach(x => L.push(x)); } };
  sec('Experience', (r.experience || []).filter(e => e.role || e.org || e.bullets.some(b => b && b.trim())).flatMap(e => {
    const head = [[e.role, e.org].filter(Boolean).join(', '), [e.place, dates(e.start, e.end, e.current)].filter(Boolean).join(' · ')].filter(Boolean).join('  |  ');
    return [head, ...e.bullets.filter(b => b && b.trim()).map(b => '  • ' + b.trim())];
  }));
  sec('Projects', (r.projects || []).filter(p => p.name || p.bullets.some(b => b && b.trim())).flatMap(p => {
    const head = [p.name, p.tech, p.link].filter(Boolean).join(', ');
    return [head, ...p.bullets.filter(b => b && b.trim()).map(b => '  • ' + b.trim())];
  }));
  sec('Education', (r.education || []).filter(e => e.degree || e.school).map(e => [[e.degree, e.school].filter(Boolean).join(', '), [e.place, dates(e.start, e.end)].filter(Boolean).join(' · ')].filter(Boolean).join('  |  ')));
  sec('Skills', (r.skills || []).filter(s => s.items && s.items.trim()).map(s => (s.group ? s.group + ': ' : '') + s.items.trim()));
  sec('Certifications', (r.certifications || []).filter(c => c.name && c.name.trim()).map(c => c.name + (c.issuer ? ', ' + c.issuer : '') + (c.year ? ' (' + c.year + ')' : '')));
  return L.join('\n') + '\n';
}
function markdown(r) {
  const L = []; L.push('# ' + (r.name || 'Your Name')); if (r.title) L.push('**' + r.title + '**');
  const c = [r.email, r.phone, r.location, r.linkedin, r.github, r.portfolio].filter(Boolean); if (c.length) L.push(c.join(' · '));
  if (r.summary && r.summary.trim()) L.push('', '## Summary', '', r.summary.trim());
  const exp = (r.experience || []).filter(e => e.role || e.org || e.bullets.some(b => b && b.trim()));
  if (exp.length) { L.push('', '## Experience'); exp.forEach(e => { L.push('', `**${[e.role, e.org].filter(Boolean).join(', ')}** · ${[e.place, dates(e.start, e.end, e.current)].filter(Boolean).join(' · ')}`); e.bullets.filter(b => b && b.trim()).forEach(b => L.push('- ' + b.trim())); }); }
  const pr = (r.projects || []).filter(p => p.name || p.bullets.some(b => b && b.trim()));
  if (pr.length) { L.push('', '## Projects'); pr.forEach(p => { L.push('', `**${[p.name, p.tech].filter(Boolean).join(', ')}**${p.link ? ' · ' + p.link : ''}`); p.bullets.filter(b => b && b.trim()).forEach(b => L.push('- ' + b.trim())); }); }
  const ed = (r.education || []).filter(e => e.degree || e.school);
  if (ed.length) { L.push('', '## Education'); ed.forEach(e => L.push('', `**${[e.degree, e.school].filter(Boolean).join(', ')}** · ${[e.place, dates(e.start, e.end)].filter(Boolean).join(' · ')}`, e.detail || '')); }
  const sk = (r.skills || []).filter(s => s.items && s.items.trim());
  if (sk.length) { L.push('', '## Skills'); sk.forEach(s => L.push('- ' + (s.group ? '**' + s.group + ':** ' : '') + s.items.trim())); }
  const ce = (r.certifications || []).filter(c => c.name && c.name.trim());
  if (ce.length) { L.push('', '## Certifications'); ce.forEach(c => L.push('- ' + c.name + (c.issuer ? ', ' + c.issuer : '') + (c.year ? ' (' + c.year + ')' : ''))); }
  return L.join('\n') + '\n';
}
const fname = ext => `${(R().name || 'resume').toLowerCase().replace(/\s+/g, '-')}-resume.${ext}`;

/* ---------- live (focus-preserving) refresh ------------------------------ */
function refreshDynamic() {
  const r = R();
  const p = qs('#rs-paper'); if (p) p.innerHTML = paperHTML(r);
  const s = qs('#rs-score'); if (s) s.innerHTML = scoreHTML(r);
  const a = qs('#rs-ats-result'); if (a) a.innerHTML = atsHTML(r);
  const ss = qs('#rs-score-sum'); if (ss) ss.textContent = scoreData(r) + '/100';
  const ad = atsData(r), as = qs('#rs-ats-sum'); if (as) as.textContent = ad ? ad.pct + '% match' : '';
}

/* ---------- entry blocks -------------------------------------------------- */
const { inp, ta, addBtn, groupHead, entryHead } = st;

function expEntry(e, i) {
  return html`<div class="rs-entry">
    ${entryHead('EXPERIENCE ' + (i + 1), 'rs-del-exp', i)}
    <div class="rs-two">${inp(`exp.${i}.role`, e.role, 'Role / title')}${inp(`exp.${i}.org`, e.org, 'Organisation')}</div>
    <div class="rs-two mt-2">${inp(`exp.${i}.start`, e.start, 'Start (e.g. 2024)')}${inp(`exp.${i}.end`, e.end, 'End (e.g. 2025)')}</div>
    <div class="rs-two mt-2">${inp(`exp.${i}.place`, e.place, 'Location (optional)')}
      <label class="row-tight" style="padding-left:4px"><input type="checkbox" data-rs-check="exp.${i}.current" ${e.current ? 'checked' : ''}/> <span class="t-foot">Current</span></label></div>
    <div class="mt-2">${(e.bullets || []).map((b, j) => html`<div class="rs-bullet">${ta(`exp.${i}.b.${j}`, b, XYZ.formula)}${st.delBtn('rs-del-expb', i + '.' + j)}</div>`)}</div>
    <div class="mt-2">${addBtn('rs-add-expb', i, 'Add bullet')}</div>
  </div>`;
}
function projEntry(p, i) {
  return html`<div class="rs-entry">
    ${entryHead('PROJECT ' + (i + 1), 'rs-del-proj', i)}
    <div class="rs-two">${inp(`proj.${i}.name`, p.name, 'Project name')}${inp(`proj.${i}.tech`, p.tech, 'Tech / tools')}</div>
    <div class="mt-2">${inp(`proj.${i}.link`, p.link, 'Link (GitHub / demo)')}</div>
    <div class="mt-2">${(p.bullets || []).map((b, j) => html`<div class="rs-bullet">${ta(`proj.${i}.b.${j}`, b, 'What it does + the result')}${st.delBtn('rs-del-projb', i + '.' + j)}</div>`)}</div>
    <div class="mt-2">${addBtn('rs-add-projb', i, 'Add bullet')}</div>
  </div>`;
}
function eduEntry(e, i) {
  return html`<div class="rs-entry">
    ${entryHead('EDUCATION ' + (i + 1), 'rs-del-edu', i)}
    <div class="rs-two">${inp(`edu.${i}.degree`, e.degree, 'Degree')}${inp(`edu.${i}.school`, e.school, 'School')}</div>
    <div class="rs-two mt-2">${inp(`edu.${i}.start`, e.start, 'Start')}${inp(`edu.${i}.end`, e.end, 'End / expected')}</div>
    <div class="mt-2">${inp(`edu.${i}.detail`, e.detail, 'Highlight (optional: GPA, award, project)')}</div>
  </div>`;
}
function skillEntry(s, i) {
  return html`<div class="rs-entry">${entryHead('SKILL GROUP ' + (i + 1), 'rs-del-skill', i)}
    <div class="rs-two">${inp(`skill.${i}.group`, s.group, 'Group (e.g. Engineering)')}${inp(`skill.${i}.items`, s.items, 'SolidWorks, Python, Arduino…')}</div></div>`;
}
function certEntry(c, i) {
  return html`<div class="rs-entry">${entryHead('CERTIFICATION ' + (i + 1), 'rs-del-cert', i)}
    <div class="rs-two">${inp(`cert.${i}.name`, c.name, 'Name')}${inp(`cert.${i}.issuer`, c.issuer, 'Issuer')}</div>
    <div class="mt-2" style="max-width:140px">${inp(`cert.${i}.year`, c.year, 'Year')}</div></div>`;
}

/* ---------- main render --------------------------------------------------- */
function renderResume() {
  const r = R();
  qs('#view-resume').innerHTML = html`<div class="stagger">
    ${pageHeader('Build Studio', 'Resume Studio')}
    ${tip('resume-intro', 'Start small. Your name and one real thing you did is enough for today.', 'accent', 'mb-4')}

    ${st.toolbar(html`
      <button class="btn btn-primary btn-sm" data-action="rs-print">${icon('printer')} Save PDF</button>
      <button class="btn btn-ghost btn-sm" data-action="rs-export-txt">${icon('file-text')} .txt</button>
      <button class="btn btn-ghost btn-sm" data-action="rs-export-md">${icon('download')} .md</button>`)}

    <div class="studio" data-panel="edit">
      <div class="studio-edit">
        <div class="card">
          <h3 class="section-label" style="margin-top:0">Contact</h3>
          <div class="rs-two">${inp('name', r.name, 'Full name')}${inp('title', r.title, 'Headline (Mechanical, AI & Robotics)')}</div>
          <div class="rs-two mt-2">${inp('email', r.email, 'Email', 'email')}${inp('phone', r.phone, 'Phone', 'tel')}</div>
          <div class="mt-2">${inp('location', r.location, 'Location (Lagos, Nigeria)')}</div>
          <div class="rs-two mt-2">${inp('linkedin', r.linkedin, 'LinkedIn URL')}${inp('github', r.github, 'GitHub URL')}</div>
          <div class="mt-2">${inp('portfolio', r.portfolio, 'Portfolio URL (optional)')}</div>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">Summary</h3>
            <button class="btn btn-ghost btn-sm" data-action="rs-draft-summary">${icon('wand-sparkles')} Draft a starter</button></div>
          ${ta('summary', r.summary, 'Two or three lines: who you are, your strengths, where you’re heading.')}
        </div>

        <div class="rs-group">
          ${groupHead('Experience', 'rs-add-exp', 'Add')}
          ${(r.experience || []).map(expEntry)}
          ${st.verbPicker('rs-verb', 'Need a strong opener? Tap a verb', html`It drops into the bullet you last tapped. ${XYZ.formula}`)}
        </div>

        <div class="rs-group">
          ${groupHead('Projects', 'rs-add-proj', 'Add')}
          ${(r.projects || []).map(projEntry)}
        </div>

        <div class="rs-group">
          ${groupHead('Education', 'rs-add-edu', 'Add')}
          ${(r.education || []).map(eduEntry)}
        </div>

        <div class="rs-group">
          ${groupHead('Skills', 'rs-add-skill', 'Add group')}
          ${(r.skills || []).map(skillEntry)}
        </div>

        <div class="rs-group">
          ${groupHead('Certifications', 'rs-add-cert', 'Add')}
          ${(r.certifications || []).map(certEntry)}
        </div>

        ${st.keep('coach', st.sumRow('sparkles', 'Coach', 'rs-score-sum'), html`<div id="rs-score" class="mt-3"></div>`)}

        ${st.keep('ats', st.sumRow('target', 'ATS keyword match', 'rs-ats-sum'), html`
          <div class="mt-3">${ta('targetJD', r.targetJD, 'Paste the job description you’re targeting…')}</div>
          <div id="rs-ats-result" class="mt-3"></div>`)}
      </div>

      <div class="studio-preview">
        <div class="resume-paper" id="rs-paper"></div>
        <p class="t-foot text-3 center mt-3 no-print">“Save PDF”, then pick <b>Save as PDF</b> in the print dialog. Single column, ATS-ready.</p>
      </div>
    </div>
  </div>`;
  st.wire();
  refreshDynamic();
  refreshIcons(qs('#view-resume'));
}
registerView('resume', renderResume);

/* ---------- actions ------------------------------------------------------- */
registerInput('data-rs', st.input);
registerChange('data-rs-check', st.input);
registerActions('rs-', (action, value) => {
  const r = R();
  const reRender = () => { save(); renderResume(); };
  switch (action) {
    case 'rs-panel': st.setPanel(value); break;
    case 'rs-draft-summary': {
      if (r.summary && r.summary.trim() && !st.ask('Replace your summary with a fresh starter draft?')) break;
      r.summary = draftSummary(r); reRender(); toast('Starter drafted. Now make it yours.', false); break;
    }
    case 'rs-add-exp': r.experience.push(emptyExp()); reRender(); break;
    case 'rs-del-exp': { if (st.filled(r.experience[+value]) && !st.ask()) break; r.experience.splice(+value, 1); if (!r.experience.length) r.experience.push(emptyExp()); reRender(); break; }
    case 'rs-add-expb': r.experience[+value].bullets.push(''); reRender(); break;
    case 'rs-del-expb': { const [i, j] = value.split('.').map(Number); r.experience[i].bullets.splice(j, 1); if (!r.experience[i].bullets.length) r.experience[i].bullets.push(''); reRender(); break; }
    case 'rs-add-proj': r.projects.push(emptyProj()); reRender(); break;
    case 'rs-del-proj': { if (st.filled(r.projects[+value]) && !st.ask()) break; r.projects.splice(+value, 1); reRender(); break; }
    case 'rs-add-projb': r.projects[+value].bullets.push(''); reRender(); break;
    case 'rs-del-projb': { const [i, j] = value.split('.').map(Number); r.projects[i].bullets.splice(j, 1); if (!r.projects[i].bullets.length) r.projects[i].bullets.push(''); reRender(); break; }
    case 'rs-add-edu': r.education.push(emptyEdu()); reRender(); break;
    case 'rs-del-edu': { if (st.filled(r.education[+value]) && !st.ask()) break; r.education.splice(+value, 1); reRender(); break; }
    case 'rs-add-skill': r.skills.push({ group: '', items: '' }); reRender(); break;
    case 'rs-del-skill': { if (st.filled(r.skills[+value]) && !st.ask()) break; r.skills.splice(+value, 1); reRender(); break; }
    case 'rs-add-cert': r.certifications.push({ name: '', issuer: '', year: '' }); reRender(); break;
    case 'rs-del-cert': { if (st.filled(r.certifications[+value]) && !st.ask()) break; r.certifications.splice(+value, 1); reRender(); break; }
    case 'rs-verb': st.insertText(value); break;
    case 'rs-print': try { window.print(); } catch (_) {} break;
    case 'rs-export-md': download(fname('md'), markdown(R())); toast('Markdown downloaded'); break;
    case 'rs-export-txt': download(fname('txt'), plain(R()), 'text/plain;charset=utf-8'); toast('Text downloaded'); break;
    case 'rs-copy': copyText(plain(R())); break;
  }
});
