/* EngineerOS · Build Studio — hub + Resume / Portfolio / LinkedIn builders */

import { store, resumeReady, portfolioReady, linkedinReady } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { download, copyText, toast } from '../core/feedback.js';
import { pageHeader, meter } from '../ui/components.js';

/* ---- Hub ----------------------------------------------------------------- */
registerView('build', () => {
  const tiles = [
    ['resume', 'Resume Builder', 'A clean, ATS-friendly draft you can export.', 'amber', resumeReady(), 'file-text'],
    ['portfolio', 'Portfolio Builder', 'Your projects and story, ready to publish.', 'green', portfolioReady(), 'layout-grid'],
    ['linkedin', 'LinkedIn Builder', 'Headline, About and a first post that lands.', '', linkedinReady(), 'user-round'],
  ].map(([v, t, d, tone, val, ic]) => `
    <div class="card tap" data-action="nav" data-value="${v}">
      <div class="row">
        <div class="chip ${tone ? 'chip-' + tone : 'chip-accent'}">${icon(ic)}</div>
        <div class="grow"><div class="t-headline">${t}</div><div class="t-foot text-3 mt-1">${d}</div></div>
        <span class="chev text-3">${icon('chevron-right')}</span>
      </div>
      <div class="mt-3">${meter(val, tone)}</div>
    </div>`).join('');

  qs('#view-build').innerHTML = `<div class="stagger">
    ${pageHeader('Build Studio', 'Turn work into evidence.', 'Fill a little at a time. Everything exports when you’re ready.')}
    <div class="auto-grid">${tiles}</div>
  </div>`;
});

/* ---- Generic builder form ------------------------------------------------ */
function builderView(rootId, key, title, fields, exportAction, intro) {
  const b = store.s.builders[key] || (store.s.builders[key] = {});
  const html = fields.map(f => {
    const val = esc(b[f.k] || '');
    if (f.type === 'area') return `<div class="field"><label>${f.l}</label>
      <textarea class="textarea" data-builder="${key}:${f.k}" placeholder="${esc(f.p || '')}" ${f.rows ? `style="min-height:${f.rows * 24}px"` : ''}>${val}</textarea>
      ${f.h ? `<div class="hint">${f.h}</div>` : ''}</div>`;
    return `<div class="field"><label>${f.l}</label>
      <input class="input" data-builder="${key}:${f.k}" placeholder="${esc(f.p || '')}" value="${val}"
        ${f.type === 'email' ? 'type="email"' : f.type === 'tel' ? 'type="tel"' : ''} />
      ${f.h ? `<div class="hint">${f.h}</div>` : ''}</div>`;
  }).join('');

  qs('#' + rootId).innerHTML = `<div class="stagger">
    ${pageHeader('Build Studio', title)}
    ${intro ? `<div class="notice notice-accent mb-4">${intro}</div>` : ''}
    <div class="card">${html}</div>
    <div class="btn-row mt-4">
      <button class="btn btn-primary" data-action="${exportAction}">${icon('download')} Export Markdown</button>
      <button class="btn btn-ghost btn-sm" data-action="${exportAction}-copy">${icon('copy')} Copy</button>
    </div>
    <p class="t-foot text-3 center mt-3">Saved automatically on this device as you type.</p>
  </div>`;
}

/* Resume now has its own dedicated module — src/views/resume.js (Resume Studio). */

/* Portfolio now has its own dedicated module — src/views/portfolio.js (Portfolio Studio). */

/* LinkedIn now has its own dedicated module — src/views/linkedin.js (LinkedIn Studio). */

/* ---- Export logic (called by the central action handler) ----------------- */
function sec(L, title, val) { if (val && String(val).trim()) L.push(`## ${title}\n\n${String(val).trim()}`); }
function buildExport(key) {
  const b = store.s.builders[key] || {}; const L = []; const name = b.name || store.s.user.name || '';
  if (key === 'resume') {
    L.push(`# ${b.name || 'Your Name'}`);
    const contact = [b.email, b.phone, b.location].filter(Boolean).join(' · ');
    if (contact) L.push(contact);
    sec(L, 'Summary', b.summary); sec(L, 'Education', b.education); sec(L, 'Skills', b.skills);
    sec(L, 'Projects', b.projects); sec(L, 'Experience', b.experience); sec(L, 'Certifications', b.certifications);
  } else if (key === 'portfolio') {
    L.push(`# Portfolio — ${name || 'Your Name'}`);
    sec(L, 'About', b.about); sec(L, 'Education', b.education); sec(L, 'Final-Year Project', b.project);
    sec(L, 'Skills', b.skills); sec(L, 'Tools & Software', b.tools); sec(L, 'Projects', b.projects);
    sec(L, 'Certifications', b.certs); sec(L, 'Contact', b.contact);
  } else {
    L.push(`# LinkedIn — ${name || 'Your Name'}`);
    sec(L, 'Headline', b.headline); sec(L, 'About', b.about); sec(L, 'Education', b.education);
    sec(L, 'Skills', b.skills); sec(L, 'Featured Projects', b.featured); sec(L, 'First Post Draft', b.post);
  }
  return L.join('\n\n') + '\n';
}
export function exportBuilder(key, copy) {
  const text = buildExport(key);
  if (copy) { copyText(text); }
  else { download(`${key}-${(store.s.user.name || 'engineeros').toLowerCase().replace(/\s+/g, '-')}.md`, text); toast('Markdown downloaded'); }
}
