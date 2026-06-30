/* EngineerOS · LinkedIn Studio
   Craft the text blocks LinkedIn actually asks for — headline, About, featured
   projects, skills, and a first post — with live character counters, examples,
   post templates, a profile preview, and per-section copy. */

import { store, save } from '../core/state.js';
import { qs, qsa, esc, icon, refreshIcons } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { copyText, download, toast } from '../core/feedback.js';
import { pageHeader } from '../ui/components.js';

const LIMITS = { headline: 220, about: 2600, post: 3000 };
const emptyFeat = () => ({ title: '', link: '', blurb: '' });

const POST_TEMPLATES = [
  { label: 'Built something', text: 'This week I built [what].\n\n• Problem: [what needed solving]\n• Approach: [what you did]\n• Result: [outcome with a number]\n\nNext I want to [next step].\n\nIf you’ve done something similar, what would you add? 👇' },
  { label: 'Learned something', text: 'I used to think [old belief].\n\nThis week, while [doing what], it clicked: [new insight].\n\nThe thing that helped most: [one concrete tip].\n\nIf you’re starting out in [field], you’ve got this.\n\nWhat helped it click for you?' },
  { label: 'Shared a project', text: 'New project: [name] 🚀\n\n[One line on what it does.]\nProblem → Approach → Result: [...]\nBuilt with [tools]. Repo/demo: [link]\n\nFeedback welcome — what would you improve?' },
];

/* ---------- model + migration -------------------------------------------- */
function L() { const b = store.s.builders; b.linkedin = b.linkedin || {}; migrate(b.linkedin); return b.linkedin; }
function migrate(l) {
  if (l._v === 2) return;
  const o = Object.assign({}, l);
  const str = v => (typeof v === 'string' && v.trim()) ? v.trim() : '';
  l.name = o.name || ''; l.role = o.role || '';
  l.headline = o.headline || ''; l.about = o.about || ''; l.skills = o.skills || ''; l.post = o.post || '';
  l.featured = Array.isArray(o.featured) ? o.featured : (str(o.featured) ? [Object.assign(emptyFeat(), { blurb: str(o.featured) })] : []);
  if (!l.featured.length) l.featured.push(emptyFeat());
  l._v = 2;
}

const ARR = { feat: 'featured' };
function setPath(l, path, value) {
  const s = path.split('.');
  if (s.length === 1) { l[s[0]] = value; return; }
  const arr = l[ARR[s[0]]]; if (!arr || !arr[+s[1]]) return;
  arr[+s[1]][s[2]] = value;
}
export function linkedinInput(path, value) { setPath(L(), path, value); save(); refreshDynamic(); }

/* ---------- counters ------------------------------------------------------ */
function countMeta(field, val) {
  const n = (val || '').length, max = LIMITS[field];
  const over = n > max;
  const good = field === 'post' ? (n >= 200 && n <= 1300) : field === 'headline' ? (n >= 40 && n <= max) : (n >= 150 && n <= max);
  return { text: `${n}${max ? ' / ' + max : ''}`, cls: 'li-count ' + (over ? 'over' : good ? 'good' : '') };
}

/* ---------- strength ------------------------------------------------------ */
function scoreData(l) {
  const skillsN = (l.skills || '').split(',').map(s => s.trim()).filter(Boolean).length;
  const feat = (l.featured || []).filter(f => f.title || f.blurb);
  const checks = {
    headline: !!(l.headline && l.headline.trim().length >= 40 && l.headline.length <= LIMITS.headline),
    about: !!(l.about && l.about.trim().length >= 150),
    featured: feat.length >= 1,
    skills: skillsN >= 5,
    post: !!(l.post && l.post.trim().length >= 100),
  };
  const score = Math.round(Object.values(checks).filter(Boolean).length / 5 * 100);
  const tips = [];
  if (!checks.headline) tips.push(['miss', 'Write a headline (40–220 chars): Role → where you’re heading | key skills']);
  if (!checks.about) tips.push(['miss', 'Write an About of at least a few sentences — hook, what you do, a CTA']);
  if (!checks.featured) tips.push(['miss', 'Feature at least one project']);
  if (!checks.skills) tips.push(['miss', `Add ${Math.max(0, 5 - skillsN)} more skills (LinkedIn allows up to 50)`]);
  if (!checks.post) tips.push(['miss', 'Draft a first post — share something you built or learned']);
  if (!tips.length) tips.push(['ok', 'Profile is in great shape — copy each block into LinkedIn']);
  return { score, tips };
}
function scoreHTML(l) {
  const { score, tips } = scoreData(l);
  const tone = score >= 70 ? 'green' : score >= 40 ? 'amber' : '';
  return `<div class="row between"><div><div class="rs-score-n">${score}<span style="font-size:15px">/100</span></div>
      <div class="t-foot text-3">Profile strength</div></div><div style="width:120px"><div class="meter ${tone}"><i style="width:${score}%"></i></div></div></div>
    <div class="mt-3">${tips.map(([k, t]) => `<div class="rs-tip ${k === 'ok' ? 'ok' : ''}">
      <span style="color:${k === 'ok' ? 'var(--green)' : 'var(--amber)'};font-weight:700">${k === 'ok' ? '✓' : '→'}</span>
      <span>${esc(t)}</span></div>`).join('')}</div>`;
}

/* ---------- preview ------------------------------------------------------- */
function previewHTML(l) {
  const feat = (l.featured || []).filter(f => f.title || f.blurb);
  return `<div class="li-pv-banner"></div>
    <div class="li-pv-name">${esc(l.name || 'Your Name')}</div>
    ${l.role ? `<div class="li-pv-role">${esc(l.role)}</div>` : ''}
    <div class="li-pv-headline">${l.headline ? esc(l.headline) : '<span class="li-pv-empty">your headline appears here</span>'}</div>
    <div class="li-pv-h">About</div>
    <div class="li-pv-about">${l.about ? esc(l.about) : '<span class="li-pv-empty">your About section appears here</span>'}</div>
    ${feat.length ? `<div class="li-pv-h">Featured</div><div class="li-pv-feat">${feat.map(f => `<span class="li-pv-chip">${esc(f.title || f.blurb.slice(0, 24))}</span>`).join('')}</div>` : ''}
    ${l.skills && l.skills.trim() ? `<div class="li-pv-h">Skills</div><div class="li-pv-about">${esc(l.skills)}</div>` : ''}`;
}

/* ---------- export -------------------------------------------------------- */
function markdown(l) {
  const L2 = ['# LinkedIn — ' + (l.name || 'Your Name')];
  if (l.headline) L2.push('', '## Headline', '', l.headline);
  if (l.about) L2.push('', '## About', '', l.about);
  const feat = (l.featured || []).filter(f => f.title || f.blurb);
  if (feat.length) { L2.push('', '## Featured'); feat.forEach(f => L2.push('- **' + (f.title || 'Project') + '**' + (f.link ? ' — ' + f.link : '') + (f.blurb ? ': ' + f.blurb : ''))); }
  if (l.skills) L2.push('', '## Skills', '', l.skills);
  if (l.post) L2.push('', '## First Post', '', l.post);
  return L2.join('\n') + '\n';
}
function sectionText(l, key) {
  if (key === 'all') return markdown(l);
  if (key === 'featured') return (l.featured || []).filter(f => f.title || f.blurb).map(f => (f.title ? f.title + (f.link ? ' (' + f.link + ')' : '') + ': ' : '') + (f.blurb || '')).join('\n');
  return l[key] || '';
}

/* ---------- live refresh -------------------------------------------------- */
function refreshDynamic() {
  const l = L();
  const pv = qs('#li-preview'); if (pv) pv.innerHTML = previewHTML(l);
  const sc = qs('#li-score'); if (sc) sc.innerHTML = scoreHTML(l);
  ['headline', 'about', 'post'].forEach(f => {
    const el = qs('#li-c-' + f); if (el) { const m = countMeta(f, l[f]); el.className = m.cls; el.textContent = m.text; }
  });
}

/* ---------- form helpers -------------------------------------------------- */
const inp = (path, val, ph) => `<input class="input" data-li="${path}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" value="${esc(val || '')}" />`;
const ta = (path, val, ph, rows) => `<textarea class="textarea" data-li="${path}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" ${rows ? `style="min-height:${rows * 24}px"` : ''}>${esc(val || '')}</textarea>`;
const copyBtn = key => `<button class="btn btn-ghost btn-sm" data-action="li-copy" data-value="${key}">${icon('copy')} Copy</button>`;
const counter = (field, val) => `<div class="${countMeta(field, val).cls}" id="li-c-${field}">${countMeta(field, val).text}</div>`;

function featEntry(f, i) {
  return `<div class="rs-entry"><div class="rs-entry-head"><span class="t">FEATURED ${i + 1}</span>
      <button class="rs-iconbtn" data-action="li-del-feat" data-value="${i}" aria-label="Remove">${icon('trash-2')}</button></div>
    <div class="rs-two">${inp(`feat.${i}.title`, f.title, 'Title')}${inp(`feat.${i}.link`, f.link, 'Link')}</div>
    <div class="mt-2">${ta(`feat.${i}.blurb`, f.blurb, 'One line on what it is / the result', 2)}</div></div>`;
}

/* ---------- render -------------------------------------------------------- */
function renderLinkedIn() {
  const l = L();
  qs('#view-linkedin').innerHTML = `<div class="stagger">
    ${pageHeader('Build Studio', 'LinkedIn Studio')}

    <div class="studio-toolbar">
      <div class="segmented studio-toggle">
        <button data-action="li-panel" data-value="edit" data-li-panel-btn="edit" class="is-on">Edit</button>
        <button data-action="li-panel" data-value="preview" data-li-panel-btn="preview">Preview</button>
      </div>
      <div class="tb-actions">
        <button class="btn btn-primary btn-sm" data-action="li-copy" data-value="all">${icon('copy')} Copy all</button>
        <button class="btn btn-ghost btn-sm" data-action="li-export-md">${icon('download')} .md</button>
      </div>
    </div>

    <div class="notice notice-accent mb-4">LinkedIn is filled block by block. Write each one here, then <b>Copy</b> and paste it in. Small, real updates beat a perfect profile you never publish.</div>

    <div class="studio" data-panel="edit">
      <div class="studio-edit">
        <div class="card">
          <h3 class="section-label" style="margin-top:0">For the preview</h3>
          <div class="rs-two">${inp('name', l.name, 'Your name')}${inp('role', l.role, 'Current role / status')}</div>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">Headline</h3>${copyBtn('headline')}</div>
          ${ta('headline', l.headline, 'Mechanical Engineer → AI & Robotics | Python · CAD · Arduino', 2)}
          ${counter('headline', l.headline)}
          <p class="hint">Formula: who you are → where you’re heading | your strongest skills.</p>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">About</h3>${copyBtn('about')}</div>
          ${ta('about', l.about, 'Start with one strong line (a hook). Then what you do and build, your skills, and what you’re looking for. End with how to reach you.', 6)}
          ${counter('about', l.about)}
          <p class="hint">Hook → what you do → skills → a clear call to action.</p>
        </div>

        <div class="rs-group">
          <div class="rs-group-h"><h3 class="section-label">Featured projects</h3>
            <button class="btn btn-ghost btn-sm" data-action="li-add-feat">${icon('plus')} Add</button></div>
          ${(l.featured || []).map(featEntry).join('')}
        </div>

        <div class="card">
          <h3 class="section-label" style="margin-top:0">Skills</h3>
          ${inp('skills', l.skills, 'SolidWorks, Python, Robotics, ROS, Technical Writing…')}
          <p class="hint">Comma-separated. LinkedIn allows up to 50 — list your strongest first.</p>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">First post</h3>${copyBtn('post')}</div>
          <div class="li-templates">${POST_TEMPLATES.map((t, i) => `<button class="rs-verb" data-action="li-template" data-value="${i}">${esc(t.label)}</button>`).join('')}</div>
          ${ta('post', l.post, 'Share something you built or learned this week. Keep it human. End with a question.', 6)}
          ${counter('post', l.post)}
          <p class="hint">Sweet spot ≈ 1,300 characters. Tap a template to start.</p>
        </div>

        <div class="card"><h3 class="section-label" style="margin-top:0">Strength</h3><div id="li-score"></div></div>
      </div>

      <div class="studio-preview">
        <div class="li-preview" id="li-preview"></div>
        <p class="t-foot text-3 center mt-3 no-print">A rough preview of how your profile reads. Copy each block into LinkedIn when it feels right.</p>
      </div>
    </div>
  </div>`;
  refreshDynamic();
  refreshIcons(qs('#view-linkedin'));
}
registerView('linkedin', renderLinkedIn);

/* ---------- actions ------------------------------------------------------- */
function setPanel(panel) {
  const s = qs('#view-linkedin .studio'); if (s) s.dataset.panel = panel;
  qsa('#view-linkedin [data-li-panel-btn]').forEach(b => b.classList.toggle('is-on', b.dataset.liPanelBtn === panel));
}
export function linkedinAction(action, value) {
  const l = L();
  const reRender = () => { save(); renderLinkedIn(); };
  const ask = () => (typeof confirm === 'undefined') || confirm('Replace your current draft?');
  switch (action) {
    case 'li-panel': setPanel(value); break;
    case 'li-add-feat': l.featured.push(emptyFeat()); reRender(); break;
    case 'li-del-feat': { const f = l.featured[+value]; if ((f.title || f.blurb) && !((typeof confirm === 'undefined') || confirm('Remove this featured item?'))) break; l.featured.splice(+value, 1); if (!l.featured.length) l.featured.push(emptyFeat()); reRender(); break; }
    case 'li-template': { if (l.post && l.post.trim() && !ask()) break; l.post = POST_TEMPLATES[+value].text; reRender(); break; }
    case 'li-copy': copyText(sectionText(l, value)); break;
    case 'li-export-md': download(`${(l.name || 'linkedin').toLowerCase().replace(/\s+/g, '-')}-linkedin.md`, markdown(l)); toast('Markdown downloaded'); break;
  }
}
