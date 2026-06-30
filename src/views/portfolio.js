/* EngineerOS · Portfolio Studio
   Guided case studies (Problem → Approach → Result), a live printable one-pager,
   a strength score, action-verb coaching, and Print→PDF / hostable HTML / Markdown export. */

import { store, save } from '../core/state.js';
import { qs, qsa, esc, icon, refreshIcons } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { download, copyText, toast } from '../core/feedback.js';
import { meter, pageHeader } from '../ui/components.js';
import { ACTION_VERBS } from '../data/resume-assets.js';

const emptyProj = () => ({ title: '', role: '', tech: '', link: '', problem: '', approach: '', result: '' });

/* ---------- model + migration -------------------------------------------- */
function P() { const b = store.s.builders; b.portfolio = b.portfolio || {}; migrate(b.portfolio); return b.portfolio; }
function migrate(p) {
  if (p._v === 2) return;
  const o = Object.assign({}, p);
  const str = v => (typeof v === 'string' && v.trim()) ? v.trim() : '';
  p.name = o.name || ''; p.title = o.title || ''; p.tagline = o.tagline || '';
  p.about = o.about || ''; p.email = o.email || ''; p.linkedin = o.linkedin || ''; p.github = o.github || ''; p.website = o.website || '';
  p.tools = o.tools || ''; p.education = Array.isArray(o.education) ? '' : str(o.education);
  if (Array.isArray(o.projects)) p.projects = o.projects;
  else {
    const arr = [];
    if (str(o.project)) arr.push(Object.assign(emptyProj(), { title: 'Final-Year Project', approach: str(o.project) }));
    if (str(o.projects)) arr.push(Object.assign(emptyProj(), { title: 'Other Projects', approach: str(o.projects) }));
    p.projects = arr;
  }
  p.skills = Array.isArray(o.skills) ? o.skills : (str(o.skills) ? [{ group: 'Skills', items: str(o.skills) }] : []);
  p.certifications = Array.isArray(o.certifications) ? o.certifications : (str(o.certs) ? [{ name: str(o.certs), issuer: '', year: '' }] : []);
  if (!p.projects.length) p.projects.push(emptyProj());
  if (!p.skills.length) p.skills.push({ group: '', items: '' });
  p._v = 2;
}

const ARR = { proj: 'projects', skill: 'skills', cert: 'certifications' };
function setPath(p, path, value) {
  const s = path.split('.');
  if (s.length === 1) { p[s[0]] = value; return; }
  const arr = p[ARR[s[0]]]; if (!arr || !arr[+s[1]]) return;
  arr[+s[1]][s[2]] = value;
}
export function portfolioInput(path, value) { setPath(P(), path, value); save(); refreshDynamic(); }

let lastField = null;
document.addEventListener('focusin', e => {
  const f = e.target.closest && e.target.closest('#view-portfolio [data-pf]');
  if (f && (f.tagName === 'TEXTAREA' || f.tagName === 'INPUT')) lastField = f;
});

/* ---------- score --------------------------------------------------------- */
function scoreData(p) {
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  const complete = projs.filter(x => x.title && x.problem && x.approach && x.result);
  const quantified = projs.some(x => /\d/.test(x.result || ''));
  const hasAbout = !!(p.about && p.about.trim().length > 20);
  const hasContact = !!(p.email || p.linkedin || p.github || p.website);
  const hasSkills = (p.skills || []).some(s => s.items && s.items.trim());
  let score = (hasAbout ? 16 : 0) + (hasContact ? 14 : 0) + (complete.length ? 24 : 0)
    + (complete.length >= 2 ? 14 : 0) + (quantified ? 16 : 0) + (hasSkills ? 16 : 0);
  score = Math.min(100, score);
  const tips = [];
  if (!hasAbout) tips.push(['miss', 'Write a short About — who you are and what you build']);
  if (!complete.length) tips.push(['miss', 'Finish one case study: Problem, Approach and Result']);
  if (complete.length && !quantified) tips.push(['miss', 'Put a number in at least one Result (%, time, cost…)']);
  if (complete.length < 2) tips.push(['miss', 'Aim for 2–3 strong case studies']);
  if (!hasContact) tips.push(['miss', 'Add a way to reach you (email or links)']);
  if (!hasSkills) tips.push(['miss', 'List your skills']);
  if (!tips.length) tips.push(['ok', 'Strong portfolio — export the one-pager and host it']);
  return { score, tips };
}
function scoreHTML(p) {
  const { score, tips } = scoreData(p);
  const tone = score >= 70 ? 'green' : score >= 40 ? 'amber' : '';
  return `<div class="row between"><div><div class="rs-score-n">${score}<span style="font-size:15px">/100</span></div>
      <div class="t-foot text-3">Portfolio strength</div></div><div style="width:120px">${meter(score, tone)}</div></div>
    <div class="mt-3">${tips.map(([k, t]) => `<div class="rs-tip ${k === 'ok' ? 'ok' : ''}">
      <span style="color:${k === 'ok' ? 'var(--green)' : 'var(--amber)'};font-weight:700">${k === 'ok' ? '✓' : '→'}</span>
      <span>${esc(t)}</span></div>`).join('')}</div>`;
}

/* ---------- one-pager ----------------------------------------------------- */
function paperHTML(p) {
  const contact = [p.email, p.linkedin, p.github, p.website].filter(Boolean);
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  const sk = (p.skills || []).filter(s => s.items && s.items.trim());
  const ce = (p.certifications || []).filter(c => c.name && c.name.trim());
  let h = `<div class="pf-name">${esc(p.name || 'Your Name')}</div>`;
  if (p.title) h += `<div class="pf-title">${esc(p.title)}</div>`;
  if (p.tagline) h += `<div class="pf-tagline">${esc(p.tagline)}</div>`;
  h += `<div class="pf-contact">${contact.length ? contact.map(c => `<span>${esc(c)}</span>`).join('') : '<span class="pf-empty">add your contact links</span>'}</div>`;
  if (p.about && p.about.trim()) h += `<div class="pf-h">About</div><div>${esc(p.about)}</div>`;
  if (projs.length) h += `<div class="pf-h">Selected Projects</div>` + projs.map(x => `
    <div class="pf-proj"><div class="pf-proj-h"><span class="pf-proj-t">${esc(x.title || 'Project')}</span><span class="pf-proj-meta">${esc([x.role, x.tech].filter(Boolean).join(' · '))}</span></div>
      ${x.problem ? `<div class="pf-cs"><b>Problem:</b> ${esc(x.problem)}</div>` : ''}
      ${x.approach ? `<div class="pf-cs"><b>Approach:</b> ${esc(x.approach)}</div>` : ''}
      ${x.result ? `<div class="pf-cs pf-result"><b>Result:</b> ${esc(x.result)}</div>` : ''}
      ${x.link ? `<div class="pf-cs"><a href="${esc(x.link)}">${esc(x.link)}</a></div>` : ''}
    </div>`).join('');
  if (sk.length || p.tools) h += `<div class="pf-h">Skills & Tools</div>` + sk.map(s => `<div class="pf-skline">${s.group ? `<b>${esc(s.group)}:</b> ` : ''}${esc(s.items)}</div>`).join('') + (p.tools ? `<div class="pf-skline"><b>Tools:</b> ${esc(p.tools)}</div>` : '');
  if (p.education && p.education.trim()) h += `<div class="pf-h">Education</div><div>${esc(p.education)}</div>`;
  if (ce.length) h += `<div class="pf-h">Certifications</div>` + ce.map(c => `<div class="pf-skline">${esc(c.name)}${c.issuer ? ` — ${esc(c.issuer)}` : ''}${c.year ? ` (${esc(c.year)})` : ''}</div>`).join('');
  return h;
}

/* ---------- exports ------------------------------------------------------- */
function markdown(p) {
  const L = []; L.push('# ' + (p.name || 'Your Name')); if (p.title) L.push('**' + p.title + '**'); if (p.tagline) L.push('_' + p.tagline + '_');
  const c = [p.email, p.linkedin, p.github, p.website].filter(Boolean); if (c.length) L.push(c.join(' · '));
  if (p.about && p.about.trim()) L.push('', '## About', '', p.about.trim());
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  if (projs.length) { L.push('', '## Selected Projects'); projs.forEach(x => { L.push('', '### ' + (x.title || 'Project') + ([x.role, x.tech].filter(Boolean).length ? '  — ' + [x.role, x.tech].filter(Boolean).join(' · ') : '')); if (x.problem) L.push('- **Problem:** ' + x.problem); if (x.approach) L.push('- **Approach:** ' + x.approach); if (x.result) L.push('- **Result:** ' + x.result); if (x.link) L.push('- ' + x.link); }); }
  const sk = (p.skills || []).filter(s => s.items && s.items.trim());
  if (sk.length || p.tools) { L.push('', '## Skills & Tools'); sk.forEach(s => L.push('- ' + (s.group ? '**' + s.group + ':** ' : '') + s.items.trim())); if (p.tools) L.push('- **Tools:** ' + p.tools); }
  if (p.education && p.education.trim()) L.push('', '## Education', '', p.education.trim());
  const ce = (p.certifications || []).filter(c => c.name && c.name.trim());
  if (ce.length) { L.push('', '## Certifications'); ce.forEach(c => L.push('- ' + c.name + (c.issuer ? ' — ' + c.issuer : '') + (c.year ? ' (' + c.year + ')' : ''))); }
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
<title>${esc(p.name || 'Portfolio')} — Portfolio</title><style>${css}</style></head>
<body><div class="wrap"><div class="paper">${paperHTML(p)}</div></div></body></html>`;
}
const fname = ext => `${(P().name || 'portfolio').toLowerCase().replace(/\s+/g, '-')}-portfolio.${ext}`;

/* ---------- live refresh -------------------------------------------------- */
function refreshDynamic() {
  const p = P();
  const pp = qs('#pf-paper'); if (pp) pp.innerHTML = paperHTML(p);
  const s = qs('#pf-score'); if (s) s.innerHTML = scoreHTML(p);
}

/* ---------- form helpers -------------------------------------------------- */
const inp = (path, val, ph) => `<input class="input" data-pf="${path}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" value="${esc(val || '')}" />`;
const ta = (path, val, ph) => `<textarea class="textarea" data-pf="${path}" placeholder="${esc(ph)}" aria-label="${esc(ph)}">${esc(val || '')}</textarea>`;
const delBtn = (action, value) => `<button class="rs-iconbtn" data-action="${action}" data-value="${value}" aria-label="Remove">${icon('trash-2')}</button>`;
const addBtn = (action, value, label) => `<button class="btn btn-ghost btn-sm" data-action="${action}" data-value="${value}">${icon('plus')} ${esc(label)}</button>`;

function projEntry(x, i) {
  return `<div class="rs-entry">
    <div class="rs-entry-head"><span class="t">PROJECT ${i + 1}</span>${delBtn('pf-del-proj', i)}</div>
    <div class="rs-two">${inp(`proj.${i}.title`, x.title, 'Project title')}${inp(`proj.${i}.role`, x.role, 'Your role')}</div>
    <div class="rs-two mt-2">${inp(`proj.${i}.tech`, x.tech, 'Tech / tools used')}${inp(`proj.${i}.link`, x.link, 'Link (GitHub / demo)')}</div>
    <div class="mt-2">${ta(`proj.${i}.problem`, x.problem, 'Problem — what needed solving?')}</div>
    <div class="mt-2">${ta(`proj.${i}.approach`, x.approach, 'Approach — what you designed / built / tested')}</div>
    <div class="mt-2">${ta(`proj.${i}.result`, x.result, 'Result — the outcome, with a number if you can')}</div>
  </div>`;
}
function skillEntry(s, i) {
  return `<div class="rs-entry"><div class="rs-entry-head"><span class="t">SKILL GROUP ${i + 1}</span>${delBtn('pf-del-skill', i)}</div>
    <div class="rs-two">${inp(`skill.${i}.group`, s.group, 'Group (e.g. Engineering)')}${inp(`skill.${i}.items`, s.items, 'SolidWorks, Python, Arduino…')}</div></div>`;
}
function certEntry(c, i) {
  return `<div class="rs-entry"><div class="rs-entry-head"><span class="t">CERTIFICATION ${i + 1}</span>${delBtn('pf-del-cert', i)}</div>
    <div class="rs-two">${inp(`cert.${i}.name`, c.name, 'Name')}${inp(`cert.${i}.issuer`, c.issuer, 'Issuer')}</div>
    <div class="mt-2" style="max-width:140px">${inp(`cert.${i}.year`, c.year, 'Year')}</div></div>`;
}
function verbHelper() {
  return `<details class="card" style="margin-top:10px"><summary class="fw-semibold" style="cursor:pointer">${icon('wand-sparkles')} Strong verbs for your Approach / Result</summary>
    <p class="t-foot text-3 mt-2">Tap one — it drops into the field you last tapped.</p>
    ${ACTION_VERBS.map(g => `<div class="rs-verb-group">${g.group}</div><div class="rs-verbs">${g.verbs.map(v => `<button class="rs-verb" data-action="pf-verb" data-value="${v}">${v}</button>`).join('')}</div>`).join('')}
  </details>`;
}

/* ---------- render -------------------------------------------------------- */
function renderPortfolio() {
  const p = P();
  const groupHead = (label, action, addLabel) => `<div class="rs-group-h"><h3 class="section-label">${label}</h3>${addBtn(action, '', addLabel)}</div>`;
  qs('#view-portfolio').innerHTML = `<div class="stagger">
    ${pageHeader('Build Studio', 'Portfolio Studio')}

    <div class="studio-toolbar">
      <div class="segmented studio-toggle">
        <button data-action="pf-panel" data-value="edit" data-pf-panel-btn="edit" class="is-on">Edit</button>
        <button data-action="pf-panel" data-value="preview" data-pf-panel-btn="preview">Preview</button>
      </div>
      <div class="tb-actions">
        <button class="btn btn-primary btn-sm" data-action="pf-print">${icon('printer')} Save PDF</button>
        <button class="btn btn-ghost btn-sm" data-action="pf-export-html">${icon('globe')} .html</button>
        <button class="btn btn-ghost btn-sm" data-action="pf-export-md">${icon('download')} .md</button>
      </div>
    </div>

    <div class="notice notice-accent mb-4">Each project is a <b>case study</b>: Problem → Approach → Result. A number in the Result is what makes employers believe you.</div>

    <div class="studio" data-panel="edit">
      <div class="studio-edit">
        <div class="card">
          <h3 class="section-label" style="margin-top:0">Header</h3>
          ${inp('name', p.name, 'Full name')}
          <div class="rs-two mt-2">${inp('title', p.title, 'Title (Mechanical → AI & Robotics)')}${inp('tagline', p.tagline, 'One-line tagline')}</div>
        </div>
        <div class="card"><h3 class="section-label" style="margin-top:0">About</h3>
          ${ta('about', p.about, 'A short paragraph: who you are, what you build, where you’re heading.')}</div>
        <div class="card"><h3 class="section-label" style="margin-top:0">Contact</h3>
          <div class="rs-two">${inp('email', p.email, 'Email')}${inp('website', p.website, 'Website (optional)')}</div>
          <div class="rs-two mt-2">${inp('linkedin', p.linkedin, 'LinkedIn URL')}${inp('github', p.github, 'GitHub URL')}</div>
        </div>

        <div class="rs-group">
          ${groupHead('Projects (case studies)', 'pf-add-proj', 'Add')}
          ${(p.projects || []).map(projEntry).join('')}
          ${verbHelper()}
        </div>

        <div class="rs-group">
          ${groupHead('Skills', 'pf-add-skill', 'Add group')}
          ${(p.skills || []).map(skillEntry).join('')}
          <div class="card" style="margin-top:8px"><h3 class="section-label" style="margin-top:0">Tools & software</h3>${inp('tools', p.tools, 'SolidWorks, Fusion 360, Arduino, Python…')}</div>
        </div>

        <div class="card"><h3 class="section-label" style="margin-top:0">Education</h3>${ta('education', p.education, 'Degree, school, year, one highlight.')}</div>

        <div class="rs-group">
          ${groupHead('Certifications', 'pf-add-cert', 'Add')}
          ${(p.certifications || []).map(certEntry).join('')}
        </div>

        <div class="card"><h3 class="section-label" style="margin-top:0">Strength</h3><div id="pf-score"></div></div>
      </div>

      <div class="studio-preview">
        <div class="pf-paper" id="pf-paper"></div>
        <p class="t-foot text-3 center mt-3 no-print">“.html” exports a single self-contained file you can host (GitHub Pages, Netlify). “Save PDF” → choose <b>Save as PDF</b>.</p>
      </div>
    </div>
  </div>`;
  refreshDynamic();
  refreshIcons(qs('#view-portfolio'));
}
registerView('portfolio', renderPortfolio);

/* ---------- actions ------------------------------------------------------- */
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
function setPanel(panel) {
  const s = qs('#view-portfolio .studio'); if (s) s.dataset.panel = panel;
  qsa('#view-portfolio [data-pf-panel-btn]').forEach(b => b.classList.toggle('is-on', b.dataset.pfPanelBtn === panel));
}
export function portfolioAction(action, value) {
  const p = P();
  const reRender = () => { save(); renderPortfolio(); };
  const ask = () => (typeof confirm === 'undefined') || confirm('Remove this entry? This can’t be undone.');
  const filled = o => o && Object.keys(o).some(k => String(o[k] || '').trim());
  switch (action) {
    case 'pf-panel': setPanel(value); break;
    case 'pf-add-proj': p.projects.push(emptyProj()); reRender(); break;
    case 'pf-del-proj': { if (filled(p.projects[+value]) && !ask()) break; p.projects.splice(+value, 1); if (!p.projects.length) p.projects.push(emptyProj()); reRender(); break; }
    case 'pf-add-skill': p.skills.push({ group: '', items: '' }); reRender(); break;
    case 'pf-del-skill': { if (filled(p.skills[+value]) && !ask()) break; p.skills.splice(+value, 1); reRender(); break; }
    case 'pf-add-cert': p.certifications.push({ name: '', issuer: '', year: '' }); reRender(); break;
    case 'pf-del-cert': { if (filled(p.certifications[+value]) && !ask()) break; p.certifications.splice(+value, 1); reRender(); break; }
    case 'pf-verb': insertVerb(value); break;
    case 'pf-print': try { window.print(); } catch (_) {} break;
    case 'pf-export-html': download(fname('html'), htmlDoc(p), 'text/html;charset=utf-8'); toast('Portfolio HTML downloaded'); break;
    case 'pf-export-md': download(fname('md'), markdown(p)); toast('Markdown downloaded'); break;
    case 'pf-copy': copyText(markdown(p)); break;
  }
}
