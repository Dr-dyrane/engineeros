/* EngineerOS · LinkedIn Studio
   Craft the text blocks LinkedIn actually asks for, headline, About, featured
   projects, skills, and a first post, with live character counters, examples,
   post templates, a profile preview, and per-section copy.
   Mechanics (paths, panels, form fields) come from the studio engine. */

import { save } from '../core/state.js';
import { qs, icon, refreshIcons, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { registerActions, registerInput } from '../core/actions.js';
import { copyText, download, toast } from '../core/feedback.js';
import { pageHeader, tip } from '../ui/components.js';
import { createStudio, coachPanel } from '../ui/studio.js';
import { emptyFeat } from '../core/models.js';
import { reviewLinkedin, draftHeadline, draftLinkedinAbout, draftPost } from '../core/coach.js';

const LIMITS = { headline: 220, about: 2600, post: 3000 };

const POST_TEMPLATES = [
  { label: 'Built something', text: 'This week I built [what].\n\nThe problem: [what needed solving].\nWhat I did: [your approach].\nThe result: [outcome with a number].\n\nNext, I want to [next step].\n\nIf you have built something similar, what would you add?' },
  { label: 'Learned something', text: 'I used to think [old belief].\n\nThis week, while [doing what], it clicked: [new insight].\n\nThe thing that helped most was [one concrete tip].\n\nIf you are starting out in [field], you can do this too.\n\nWhat helped it click for you?' },
  { label: 'Shared a project', text: 'New project: [name].\n\n[One line on what it does.]\nProblem, approach, and result: [the short version].\nBuilt with [tools]. Repo or demo: [link].\n\nFeedback is welcome. What would you improve?' },
];

const st = createStudio({
  key: 'linkedin', attr: 'li',
  arrays: { feat: 'featured' },
  refresh: () => refreshDynamic(),
});
const L = st.model;

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
  return Math.round(Object.values(checks).filter(Boolean).length / 5 * 100);
}
const scoreHTML = (l) => coachPanel(scoreData(l), 'profile strength', reviewLinkedin(l),
  'Looking great. Copy each block into LinkedIn.');

/* ---------- preview ------------------------------------------------------- */
function previewHTML(l) {
  const feat = (l.featured || []).filter(f => f.title || f.blurb);
  return html`<div class="li-pv-banner"></div>
    <div class="li-pv-name">${l.name || 'Your Name'}</div>
    ${l.role ? html`<div class="li-pv-role">${l.role}</div>` : ''}
    <div class="li-pv-headline">${l.headline ? l.headline : html`<span class="li-pv-empty">your headline appears here</span>`}</div>
    <div class="li-pv-h">About</div>
    <div class="li-pv-about">${l.about ? l.about : html`<span class="li-pv-empty">your About section appears here</span>`}</div>
    ${feat.length ? html`<div class="li-pv-h">Featured</div><div class="li-pv-feat">${feat.map(f => html`<span class="li-pv-chip">${f.title || f.blurb.slice(0, 24)}</span>`)}</div>` : ''}
    ${l.skills && l.skills.trim() ? html`<div class="li-pv-h">Skills</div><div class="li-pv-about">${l.skills}</div>` : ''}`;
}

/* ---------- export -------------------------------------------------------- */
function markdown(l) {
  const L2 = ['# LinkedIn: ' + (l.name || 'Your Name')];
  if (l.headline) L2.push('', '## Headline', '', l.headline);
  if (l.about) L2.push('', '## About', '', l.about);
  const feat = (l.featured || []).filter(f => f.title || f.blurb);
  if (feat.length) { L2.push('', '## Featured'); feat.forEach(f => L2.push('- **' + (f.title || 'Project') + '**' + (f.link ? ', ' + f.link : '') + (f.blurb ? ': ' + f.blurb : ''))); }
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
  const ss = qs('#li-score-sum'); if (ss) ss.textContent = scoreData(l) + '/100';
  ['headline', 'about', 'post'].forEach(f => {
    const el = qs('#li-c-' + f); if (el) { const m = countMeta(f, l[f]); el.className = m.cls; el.textContent = m.text; }
  });
}

/* ---------- form helpers -------------------------------------------------- */
const { inp, ta } = st;
const copyBtn = key => html`<button class="btn btn-ghost btn-sm" data-action="li-copy" data-value="${key}">${icon('copy')} Copy</button>`;
const counter = (field, val) => html`<div class="${countMeta(field, val).cls}" id="li-c-${field}">${countMeta(field, val).text}</div>`;

function featEntry(f, i) {
  return html`<div class="rs-entry">${st.entryHead('FEATURED ' + (i + 1), 'li-del-feat', i)}
    <div class="rs-two">${inp(`feat.${i}.title`, f.title, 'Title')}${inp(`feat.${i}.link`, f.link, 'Link')}</div>
    <div class="mt-2">${ta(`feat.${i}.blurb`, f.blurb, 'One line on what it is / the result', 2)}</div></div>`;
}

/* ---------- render -------------------------------------------------------- */
function renderLinkedIn() {
  const l = L();
  qs('#view-linkedin').innerHTML = html`<div class="stagger">
    ${pageHeader('Build Studio', 'LinkedIn Studio')}

    ${st.toolbar(html`
      <button class="btn btn-primary btn-sm" data-action="li-copy" data-value="all">${icon('copy')} Copy all</button>
      <button class="btn btn-ghost btn-sm" data-action="li-export-md">${icon('download')} .md</button>`)}

    ${tip('linkedin-intro', 'Write each block here, then <b>Copy</b> it into LinkedIn.', 'accent', 'mb-4')}

    <div class="studio" data-panel="edit">
      <div class="studio-edit">
        <div class="card">
          <h3 class="section-label" style="margin-top:0">For the preview</h3>
          <div class="rs-two">${inp('name', l.name, 'Your name')}${inp('role', l.role, 'Current role / status')}</div>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">Headline</h3><div class="row-tight" style="gap:6px"><button class="btn btn-ghost btn-sm" data-action="li-draft-headline">${icon('wand-sparkles')} Draft</button>${copyBtn('headline')}</div></div>
          ${ta('headline', l.headline, 'Mechanical Engineer, AI & Robotics | Python · CAD · Arduino', 2)}
          ${counter('headline', l.headline)}
          <p class="hint">Formula: who you are, where you’re heading | your strongest skills.</p>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">About</h3><div class="row-tight" style="gap:6px"><button class="btn btn-ghost btn-sm" data-action="li-draft-about">${icon('wand-sparkles')} Draft</button>${copyBtn('about')}</div></div>
          ${ta('about', l.about, 'Start with one strong line (a hook). Then what you do and build, your skills, and what you’re looking for. End with how to reach you.', 6)}
          ${counter('about', l.about)}
        </div>

        <div class="rs-group">
          <div class="rs-group-h"><h3 class="section-label">Featured projects</h3>
            <button class="btn btn-ghost btn-sm" data-action="li-add-feat">${icon('plus')} Add</button></div>
          ${(l.featured || []).map(featEntry)}
        </div>

        <div class="card">
          <h3 class="section-label" style="margin-top:0">Skills</h3>
          ${inp('skills', l.skills, 'SolidWorks, Python, Robotics, ROS, Technical Writing…')}
          <p class="hint">LinkedIn allows up to 50, strongest first.</p>
        </div>

        <div class="card">
          <div class="row between"><h3 class="section-label" style="margin-top:0">First post</h3><div class="row-tight" style="gap:6px"><button class="btn btn-ghost btn-sm" data-action="li-draft-post">${icon('wand-sparkles')} Draft</button>${copyBtn('post')}</div></div>
          <div class="li-templates">${POST_TEMPLATES.map((t, i) => html`<button class="rs-verb" data-action="li-template" data-value="${i}">${t.label}</button>`)}</div>
          ${ta('post', l.post, 'Share something you built or learned this week. Keep it human. End with a question.', 6)}
          ${counter('post', l.post)}
          <p class="hint">Sweet spot ≈ 1,300 characters. Tap a template to start.</p>
        </div>

        ${st.keep('coach', st.sumRow('sparkles', 'Coach', 'li-score-sum'), html`<div id="li-score" class="mt-3"></div>`)}
      </div>

      <div class="studio-preview">
        <div class="li-preview" id="li-preview"></div>
        <p class="t-foot text-3 center mt-3 no-print">A rough preview of how your profile reads.</p>
      </div>
    </div>
  </div>`;
  st.wire();
  refreshDynamic();
  refreshIcons(qs('#view-linkedin'));
}
registerView('linkedin', renderLinkedIn);

/* ---------- actions ------------------------------------------------------- */
registerInput('data-li', st.input);
registerActions('li-', (action, value) => {
  const l = L();
  const reRender = () => { save(); renderLinkedIn(); };
  const replace = () => st.ask('Replace your current draft?');
  switch (action) {
    case 'li-panel': st.setPanel(value); break;
    case 'li-draft-headline': { if (l.headline && l.headline.trim() && !replace()) break; l.headline = draftHeadline(l); reRender(); toast('Headline drafted. Now make it yours.', false); break; }
    case 'li-draft-about': { if (l.about && l.about.trim() && !replace()) break; l.about = draftLinkedinAbout(l); reRender(); toast('About drafted. Now make it yours.', false); break; }
    case 'li-draft-post': { if (l.post && l.post.trim() && !replace()) break; l.post = draftPost(); reRender(); toast('Post drafted. Now make it yours.', false); break; }
    case 'li-add-feat': l.featured.push(emptyFeat()); reRender(); break;
    case 'li-del-feat': { const f = l.featured[+value]; if ((f.title || f.blurb) && !st.ask('Remove this featured item?')) break; l.featured.splice(+value, 1); if (!l.featured.length) l.featured.push(emptyFeat()); reRender(); break; }
    case 'li-template': { if (l.post && l.post.trim() && !replace()) break; l.post = POST_TEMPLATES[+value].text; reRender(); break; }
    case 'li-copy': copyText(sectionText(l, value)); break;
    case 'li-export-md': download(`${(l.name || 'linkedin').toLowerCase().replace(/\s+/g, '-')}-linkedin.md`, markdown(l)); toast('Markdown downloaded'); break;
  }
});
