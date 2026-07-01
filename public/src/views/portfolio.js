/* EngineerOS · Portfolio Studio
   Guided case studies (Problem, Approach, Result), a live printable one-pager,
   a strength score, action-verb coaching, and Print to PDF / hostable HTML / Markdown export.
   Mechanics (paths, panels, form fields, verb insert) come from the studio engine. */

import { save } from '../core/state.js';
import { qs, esc, icon, refreshIcons, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { registerActions, registerInput } from '../core/actions.js';
import { download, copyText, toast } from '../core/feedback.js';
import { pageHeader, tip } from '../ui/components.js';
import { createStudio, coachPanel } from '../ui/studio.js';
import { emptyCaseStudy } from '../core/models.js';
import { reviewPortfolio, draftAbout } from '../core/coach.js';

const st = createStudio({
  key: 'portfolio', attr: 'pf',
  arrays: { proj: 'projects', skill: 'skills', cert: 'certifications' },
  refresh: () => refreshDynamic(),
});
const P = st.model;

/* ---------- score --------------------------------------------------------- */
function scoreData(p) {
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  const complete = projs.filter(x => x.title && x.problem && x.approach && x.result);
  const quantified = projs.some(x => /\d/.test(x.result || ''));
  const hasAbout = !!(p.about && p.about.trim().length > 20);
  const hasContact = !!(p.email || p.linkedin || p.github || p.website);
  const hasSkills = (p.skills || []).some(s => s.items && s.items.trim());
  const score = (hasAbout ? 16 : 0) + (hasContact ? 14 : 0) + (complete.length ? 24 : 0)
    + (complete.length >= 2 ? 14 : 0) + (quantified ? 16 : 0) + (hasSkills ? 16 : 0);
  return Math.min(100, score);
}
const scoreHTML = (p) => coachPanel(scoreData(p), 'portfolio strength', reviewPortfolio(p),
  'Strong portfolio. Export the one-pager and host it.');

/* ---------- one-pager ----------------------------------------------------- */
function paperHTML(p) {
  const contact = [p.email, p.linkedin, p.github, p.website].filter(Boolean);
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  const sk = (p.skills || []).filter(s => s.items && s.items.trim());
  const ce = (p.certifications || []).filter(c => c.name && c.name.trim());
  return html`<div class="pf-name">${p.name || 'Your Name'}</div>
    ${p.title ? html`<div class="pf-title">${p.title}</div>` : ''}
    ${p.tagline ? html`<div class="pf-tagline">${p.tagline}</div>` : ''}
    <div class="pf-contact">${contact.length ? contact.map(c => html`<span>${c}</span>`) : html`<span class="pf-empty">add your contact links</span>`}</div>
    ${p.about && p.about.trim() ? html`<div class="pf-h">About</div><div>${p.about}</div>` : ''}
    ${projs.length ? html`<div class="pf-h">Selected Projects</div>${projs.map(x => html`
      <div class="pf-proj"><div class="pf-proj-h"><span class="pf-proj-t">${x.title || 'Project'}</span><span class="pf-proj-meta">${[x.role, x.tech].filter(Boolean).join(' · ')}</span></div>
        ${x.problem ? html`<div class="pf-cs"><b>Problem:</b> ${x.problem}</div>` : ''}
        ${x.approach ? html`<div class="pf-cs"><b>Approach:</b> ${x.approach}</div>` : ''}
        ${x.result ? html`<div class="pf-cs pf-result"><b>Result:</b> ${x.result}</div>` : ''}
        ${x.link ? html`<div class="pf-cs"><a href="${x.link}">${x.link}</a></div>` : ''}
      </div>`)}` : ''}
    ${sk.length || p.tools ? html`<div class="pf-h">Skills & Tools</div>${sk.map(s => html`<div class="pf-skline">${s.group ? html`<b>${s.group}:</b> ` : ''}${s.items}</div>`)}${p.tools ? html`<div class="pf-skline"><b>Tools:</b> ${p.tools}</div>` : ''}` : ''}
    ${p.education && p.education.trim() ? html`<div class="pf-h">Education</div><div>${p.education}</div>` : ''}
    ${ce.length ? html`<div class="pf-h">Certifications</div>${ce.map(c => html`<div class="pf-skline">${c.name}${c.issuer ? ', ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}</div>`)}` : ''}`;
}

/* ---------- exports ------------------------------------------------------- */
function markdown(p) {
  const L = []; L.push('# ' + (p.name || 'Your Name')); if (p.title) L.push('**' + p.title + '**'); if (p.tagline) L.push('_' + p.tagline + '_');
  const c = [p.email, p.linkedin, p.github, p.website].filter(Boolean); if (c.length) L.push(c.join(' · '));
  if (p.about && p.about.trim()) L.push('', '## About', '', p.about.trim());
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  if (projs.length) { L.push('', '## Selected Projects'); projs.forEach(x => { L.push('', '### ' + (x.title || 'Project') + ([x.role, x.tech].filter(Boolean).length ? '  ·  ' + [x.role, x.tech].filter(Boolean).join(' · ') : '')); if (x.problem) L.push('- **Problem:** ' + x.problem); if (x.approach) L.push('- **Approach:** ' + x.approach); if (x.result) L.push('- **Result:** ' + x.result); if (x.link) L.push('- ' + x.link); }); }
  const sk = (p.skills || []).filter(s => s.items && s.items.trim());
  if (sk.length || p.tools) { L.push('', '## Skills & Tools'); sk.forEach(s => L.push('- ' + (s.group ? '**' + s.group + ':** ' : '') + s.items.trim())); if (p.tools) L.push('- **Tools:** ' + p.tools); }
  if (p.education && p.education.trim()) L.push('', '## Education', '', p.education.trim());
  const ce = (p.certifications || []).filter(c => c.name && c.name.trim());
  if (ce.length) { L.push('', '## Certifications'); ce.forEach(c => L.push('- ' + c.name + (c.issuer ? ', ' + c.issuer : '') + (c.year ? ' (' + c.year + ')' : ''))); }
  return L.join('\n') + '\n';
}
function htmlDoc(p) {
  const css = `*{box-sizing:border-box}body{margin:0;background:#eef0f4;font-family:Inter,-apple-system,Arial,sans-serif;color:#15171a;line-height:1.5}
.wrap{max-width:780px;margin:0 auto;padding:32px 16px}
.paper{background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(17,24,39,.10);padding:42px 46px}
.pf-name{font-size:30px;font-weight:800;letter-spacing:-.02em}.pf-title{font-size:15px;font-weight:600;color:#0a6ae0;margin-top:3px}
.pf-tagline{font-size:15px;color:#3a3f46;margin-top:7px}.pf-contact{font-size:12px;color:#50555c;margin-top:9px;display:flex;flex-wrap:wrap;gap:4px 14px}
.pf-h{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;border-bottom:1.5px solid #e2e5ea;padding-bottom:4px;margin:20px 0 9px}
.pf-proj{margin-bottom:14px}.pf-proj-h{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.pf-proj-t{font-weight:700;font-size:15px}
.pf-proj-meta{font-size:11.5px;color:#5a5f66}.pf-cs{margin-top:3px;font-size:13.5px}.pf-cs b{color:#0b0c0e}.pf-result b{color:#0a6ae0}
.pf-skline{margin:2px 0}.pf-skline b{color:#0b0c0e}a{color:#0a6ae0;text-decoration:none}
@media print{body{background:#fff}.wrap{padding:0}.paper{box-shadow:none;border-radius:0;padding:0}}`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(p.name || 'Portfolio')} · Portfolio</title><style>${css}</style></head>
<body><div class="wrap"><div class="paper">${paperHTML(p)}</div></div></body></html>`;
}
const fname = ext => `${(P().name || 'portfolio').toLowerCase().replace(/\s+/g, '-')}-portfolio.${ext}`;

/* ---------- live refresh -------------------------------------------------- */
function refreshDynamic() {
  const p = P();
  const pp = qs('#pf-paper'); if (pp) pp.innerHTML = paperHTML(p);
  const s = qs('#pf-score'); if (s) s.innerHTML = scoreHTML(p);
  const ss = qs('#pf-score-sum'); if (ss) ss.textContent = scoreData(p) + '/100';
}

/* ---------- entry blocks --------------------------------------------------- */
const { inp, ta, groupHead, entryHead } = st;

function projEntry(x, i) {
  return html`<div class="rs-entry">
    ${entryHead('PROJECT ' + (i + 1), 'pf-del-proj', i)}
    <div class="rs-two">${inp(`proj.${i}.title`, x.title, 'Project title')}${inp(`proj.${i}.role`, x.role, 'Your role')}</div>
    <div class="rs-two mt-2">${inp(`proj.${i}.tech`, x.tech, 'Tech / tools used')}${inp(`proj.${i}.link`, x.link, 'Link (GitHub / demo)')}</div>
    <div class="mt-2">${ta(`proj.${i}.problem`, x.problem, 'Problem: what needed solving?')}</div>
    <div class="mt-2">${ta(`proj.${i}.approach`, x.approach, 'Approach: what you designed, built, or tested')}</div>
    <div class="mt-2">${ta(`proj.${i}.result`, x.result, 'Result: the outcome, with a number if you can')}</div>
  </div>`;
}
function skillEntry(s, i) {
  return html`<div class="rs-entry">${entryHead('SKILL GROUP ' + (i + 1), 'pf-del-skill', i)}
    <div class="rs-two">${inp(`skill.${i}.group`, s.group, 'Group (e.g. Engineering)')}${inp(`skill.${i}.items`, s.items, 'SolidWorks, Python, Arduino…')}</div></div>`;
}
function certEntry(c, i) {
  return html`<div class="rs-entry">${entryHead('CERTIFICATION ' + (i + 1), 'pf-del-cert', i)}
    <div class="rs-two">${inp(`cert.${i}.name`, c.name, 'Name')}${inp(`cert.${i}.issuer`, c.issuer, 'Issuer')}</div>
    <div class="mt-2" style="max-width:140px">${inp(`cert.${i}.year`, c.year, 'Year')}</div></div>`;
}

/* ---------- render -------------------------------------------------------- */
function renderPortfolio() {
  const p = P();
  qs('#view-portfolio').innerHTML = html`<div class="stagger">
    ${pageHeader('Build Studio', 'Portfolio Studio')}

    ${st.toolbar(html`
      <button class="btn btn-primary btn-sm" data-action="pf-print">${icon('printer')} Save PDF</button>
      <button class="btn btn-ghost btn-sm" data-action="pf-export-html">${icon('globe')} .html</button>
      <button class="btn btn-ghost btn-sm" data-action="pf-export-md">${icon('download')} .md</button>`)}

    ${tip('portfolio-intro', 'Each project is a <b>case study</b>: Problem, Approach, Result, with a number in the Result.', 'accent', 'mb-4')}

    <div class="studio" data-panel="edit">
      <div class="studio-edit">
        <div class="card">
          <h3 class="section-label" style="margin-top:0">Header</h3>
          ${inp('name', p.name, 'Full name')}
          <div class="rs-two mt-2">${inp('title', p.title, 'Title (Mechanical, AI & Robotics)')}${inp('tagline', p.tagline, 'One-line tagline')}</div>
        </div>
        <div class="card"><div class="row between"><h3 class="section-label" style="margin-top:0">About</h3>
          <button class="btn btn-ghost btn-sm" data-action="pf-draft-about">${icon('wand-sparkles')} Draft a starter</button></div>
          ${ta('about', p.about, 'A short paragraph: who you are, what you build, where you’re heading.')}</div>
        <div class="card"><h3 class="section-label" style="margin-top:0">Contact</h3>
          <div class="rs-two">${inp('email', p.email, 'Email')}${inp('website', p.website, 'Website (optional)')}</div>
          <div class="rs-two mt-2">${inp('linkedin', p.linkedin, 'LinkedIn URL')}${inp('github', p.github, 'GitHub URL')}</div>
        </div>

        <div class="rs-group">
          ${groupHead('Projects (case studies)', 'pf-add-proj', 'Add')}
          ${(p.projects || []).map(projEntry)}
          ${st.verbPicker('pf-verb', 'Strong verbs for your Approach / Result', 'Tap one and it drops into the field you last tapped.')}
        </div>

        <div class="rs-group">
          ${groupHead('Skills', 'pf-add-skill', 'Add group')}
          ${(p.skills || []).map(skillEntry)}
          <div class="card" style="margin-top:8px"><h3 class="section-label" style="margin-top:0">Tools & software</h3>${inp('tools', p.tools, 'SolidWorks, Fusion 360, Arduino, Python…')}</div>
        </div>

        <div class="card"><h3 class="section-label" style="margin-top:0">Education</h3>${ta('education', p.education, 'Degree, school, year, one highlight.')}</div>

        <div class="rs-group">
          ${groupHead('Certifications', 'pf-add-cert', 'Add')}
          ${(p.certifications || []).map(certEntry)}
        </div>

        ${st.keep('coach', st.sumRow('sparkles', 'Coach', 'pf-score-sum'), html`<div id="pf-score" class="mt-3"></div>`)}
      </div>

      <div class="studio-preview">
        <div class="pf-paper" id="pf-paper"></div>
        <p class="t-foot text-3 center mt-3 no-print">“.html” is a single file you can host (GitHub Pages, Netlify). “Save PDF”, then choose <b>Save as PDF</b>.</p>
      </div>
    </div>
  </div>`;
  st.wire();
  refreshDynamic();
  refreshIcons(qs('#view-portfolio'));
}
registerView('portfolio', renderPortfolio);

/* ---------- actions ------------------------------------------------------- */
registerInput('data-pf', st.input);
registerActions('pf-', (action, value) => {
  const p = P();
  const reRender = () => { save(); renderPortfolio(); };
  switch (action) {
    case 'pf-panel': st.setPanel(value); break;
    case 'pf-draft-about': {
      if (p.about && p.about.trim() && !st.ask('Replace your About with a fresh starter draft?')) break;
      p.about = draftAbout(p); reRender(); toast('Starter drafted. Now make it yours.', false); break;
    }
    case 'pf-add-proj': p.projects.push(emptyCaseStudy()); reRender(); break;
    case 'pf-del-proj': { if (st.filled(p.projects[+value]) && !st.ask()) break; p.projects.splice(+value, 1); if (!p.projects.length) p.projects.push(emptyCaseStudy()); reRender(); break; }
    case 'pf-add-skill': p.skills.push({ group: '', items: '' }); reRender(); break;
    case 'pf-del-skill': { if (st.filled(p.skills[+value]) && !st.ask()) break; p.skills.splice(+value, 1); reRender(); break; }
    case 'pf-add-cert': p.certifications.push({ name: '', issuer: '', year: '' }); reRender(); break;
    case 'pf-del-cert': { if (st.filled(p.certifications[+value]) && !st.ask()) break; p.certifications.splice(+value, 1); reRender(); break; }
    case 'pf-verb': st.insertText(value); break;
    case 'pf-print': try { window.print(); } catch (_) {} break;
    case 'pf-export-html': download(fname('html'), htmlDoc(P()), 'text/html;charset=utf-8'); toast('Portfolio HTML downloaded'); break;
    case 'pf-export-md': download(fname('md'), markdown(P())); toast('Markdown downloaded'); break;
    case 'pf-copy': copyText(markdown(P())); break;
  }
});
