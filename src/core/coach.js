/* EngineerOS · Coach (deterministic agents)
   No LLM. Rules + templates over the user's real data. Comprehensive scenario
   coverage so there is always something specific and honest to say.
   It never invents experience or numbers. It only points at what is real. */

import { VERB_SET } from '../data/resume-assets.js';

const WEAK_PHRASES = ['responsible for', 'worked on', 'helped with', 'helped to', 'duties included',
  'tasked with', 'involved in', 'assisted with', 'in charge of', 'participated in'];
const firstWord = s => (s.trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');

/* ---- Resume review -------------------------------------------------------- */
/* Returns { items:[{sev, where, fix}], stats }. sev: high | med | low. */
export function reviewResume(r) {
  const items = [];
  const add = (sev, where, fix) => items.push({ sev, where, fix });

  if (!r.name || !r.name.trim()) add('high', 'Contact', 'Add your full name at the top.');
  if (!r.email || !r.email.trim()) add('high', 'Contact', 'Add a professional email so people can reach you.');
  if (!r.title || !r.title.trim()) add('low', 'Contact', 'Add a one-line headline, like "Mechanical Engineer moving into AI and Robotics".');
  if (!r.linkedin && !r.github) add('low', 'Contact', 'Add a LinkedIn or GitHub link. It shows you are real and findable.');

  if (!r.summary || r.summary.trim().length < 25) add('med', 'Summary', 'Write two or three lines: who you are, your strengths, where you are heading. Tap "Draft a starter" to begin.');
  else if (r.summary.trim().length > 360) add('low', 'Summary', 'Trim the summary to two or three tight lines.');

  const blocks = [
    ...(r.experience || []).map((e, i) => ({ label: e.role || ('Experience ' + (i + 1)), bullets: e.bullets || [] })),
    ...(r.projects || []).map((p, i) => ({ label: p.name || ('Project ' + (i + 1)), bullets: p.bullets || [] })),
  ];
  let bulletCount = 0, quantified = 0, verbStart = 0;
  blocks.forEach(b => {
    b.bullets.forEach((t, j) => {
      if (!t || !t.trim()) return;
      bulletCount++;
      const text = t.trim(), low = text.toLowerCase(), fw = firstWord(text);
      const hasNum = /\d/.test(text), startsVerb = VERB_SET.has(fw);
      if (startsVerb) verbStart++;
      if (hasNum) quantified++;
      const where = `${b.label}, bullet ${j + 1}`;
      const weak = WEAK_PHRASES.find(w => low.includes(w));
      if (weak) add('med', where, `Replace "${weak}" with a strong verb that shows what you actually did.`);
      else if (!startsVerb) add('med', where, `Start with an action verb, like Built, Designed, Reduced, or Led, instead of "${fw || 'this'}".`);
      if (!hasNum) add('high', where, 'Add a number. How much, how many, how fast, or what percent?');
      if (text.length > 200) add('low', where, 'Trim to one line. Keep the result, cut the rest.');
    });
  });
  if (bulletCount === 0) add('high', 'Experience', 'Add one experience or project with a bullet that says what you did and the result.');

  const hasSkills = (r.skills || []).some(s => s.items && s.items.trim());
  if (!hasSkills) add('med', 'Skills', 'List your tools and skills, strongest first.');
  const hasEdu = (r.education || []).some(e => (e.degree && e.degree.trim()) || (e.school && e.school.trim()));
  if (!hasEdu) add('med', 'Education', 'Add your degree, school, and year.');

  const order = { high: 0, med: 1, low: 2 };
  items.sort((a, b) => order[a.sev] - order[b.sev]);
  return { items, stats: { bulletCount, quantified, verbStart } };
}

/* A first-draft summary, built only from what the user already entered. A starter to edit. */
export function draftSummary(r) {
  const role = (r.title && r.title.trim()) || 'Engineering graduate';
  const skills = (r.skills || []).flatMap(s => (s.items || '').split(',')).map(x => x.trim()).filter(Boolean);
  const skline = skills.length ? `, with hands-on skills in ${skills.slice(0, 3).join(', ')}` : '';
  const proj = (r.projects || []).find(p => p.title && p.title.trim());
  const exp = (r.experience || []).find(e => e.role && e.role.trim());
  let evidence = '';
  if (proj) evidence = ` Recently built ${proj.title.trim()}${proj.tech ? ` using ${proj.tech.trim()}` : ''}.`;
  else if (exp) evidence = ` Experience as ${exp.role.trim()}${exp.org ? ` at ${exp.org.trim()}` : ''}.`;
  const aim = ' Looking for a role where I can keep building, documenting, and learning.';
  return `${role}${skline}.${evidence}${aim}`.replace(/\s+/g, ' ').trim();
}

/* ---- Portfolio ------------------------------------------------------------ */
export function reviewPortfolio(p) {
  const items = []; const add = (sev, where, fix) => items.push({ sev, where, fix });
  if (!p.about || p.about.trim().length < 25) add('med', 'About', 'Write a short About: who you are and what you build. Tap "Draft a starter".');
  if (!p.email && !p.linkedin && !p.github && !p.website) add('high', 'Contact', 'Add a way to reach you: an email or a link.');
  const projs = (p.projects || []).filter(x => x.title || x.problem || x.approach || x.result);
  if (!projs.length) add('high', 'Projects', 'Add your first case study.');
  projs.forEach((x, i) => {
    const label = x.title || ('Project ' + (i + 1));
    if (!x.title) add('low', label, 'Give this project a clear title.');
    if (!x.problem) add('med', label, 'Add the Problem: what needed solving?');
    if (!x.approach) add('med', label, 'Add the Approach: what you designed, built, or tested.');
    if (!x.result) add('high', label, 'Add the Result: the outcome.');
    else if (!/\d/.test(x.result)) add('high', label, 'Put a number in the Result. That is what makes employers believe you.');
  });
  if (projs.length === 1) add('low', 'Projects', 'Aim for two or three strong case studies.');
  if (!(p.skills || []).some(s => s.items && s.items.trim())) add('med', 'Skills', 'List your skills.');
  const order = { high: 0, med: 1, low: 2 }; items.sort((a, b) => order[a.sev] - order[b.sev]);
  return { items };
}
export function draftAbout(p) {
  const name = (p.name || '').split(/\s+/)[0] || '';
  const title = (p.title || 'engineer').trim().toLowerCase();
  const skills = (p.skills || []).flatMap(s => (s.items || '').split(',')).map(x => x.trim()).filter(Boolean);
  const proj = (p.projects || []).find(x => x.title && x.title.trim());
  const skline = skills.length ? ` I work with ${skills.slice(0, 3).join(', ')}.` : '';
  const projline = proj ? ` Recently I built ${proj.title.trim()}${proj.tech ? ` using ${proj.tech.trim()}` : ''}.` : '';
  return `I am ${name ? name + ', ' : ''}a ${title}.${skline}${projline} I learn by building, and I document everything I make.`.replace(/\s+/g, ' ').trim();
}

/* ---- LinkedIn ------------------------------------------------------------- */
export function reviewLinkedin(l) {
  const items = []; const add = (sev, where, fix) => items.push({ sev, where, fix });
  const hl = (l.headline || '').trim();
  if (!hl) add('high', 'Headline', 'Write a headline: your role, where you are heading, and key skills. Tap "Draft".');
  else if (hl.length < 40) add('low', 'Headline', 'Make the headline fuller. Add where you are heading and a skill or two.');
  else if (hl.length > 220) add('med', 'Headline', 'Trim the headline to 220 characters.');
  const ab = (l.about || '').trim();
  if (!ab) add('high', 'About', 'Write an About: a hook, what you do, and a clear next step. Tap "Draft".');
  else if (ab.length < 150) add('med', 'About', 'Make the About a few sentences longer. Add a hook and a call to action.');
  if (!(l.featured || []).some(f => f.title || f.blurb)) add('med', 'Featured', 'Feature at least one project.');
  const skn = (l.skills || '').split(',').map(x => x.trim()).filter(Boolean).length;
  if (skn < 5) add('med', 'Skills', `Add ${Math.max(0, 5 - skn)} more skills. LinkedIn allows up to 50.`);
  if (!l.post || !l.post.trim()) add('low', 'First post', 'Draft a first post. Share something you built or learned. Tap "Draft".');
  const order = { high: 0, med: 1, low: 2 }; items.sort((a, b) => order[a.sev] - order[b.sev]);
  return { items };
}
export function draftHeadline(l) {
  const role = (l.role || 'Mechanical Engineer').trim();
  const skills = (l.skills || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 3);
  const skpart = skills.length ? ` | ${skills.join(' · ')}` : '';
  return `${role}, moving into AI and Robotics${skpart}`.slice(0, 220);
}
export function draftLinkedinAbout(l) {
  const name = (l.name || '').split(/\s+/)[0] || '';
  const skills = (l.skills || '').split(',').map(x => x.trim()).filter(Boolean);
  const skline = skills.length ? ` I work with ${skills.slice(0, 4).join(', ')}.` : '';
  return `I am ${name ? name + ', ' : ''}an engineer who learns by building.${skline}\n\nI am growing toward AI and robotics, one project at a time, and I document what I make so others can learn from it.\n\nIf you are building something interesting, or hiring, I would love to connect.`;
}
export function draftPost() {
  return `This week I worked on [what].\n\nThe problem: [what needed solving].\nWhat I did: [your approach].\nThe result: [outcome with a number].\n\nNext, I want to [next step].\n\nWhat would you add?`;
}

/* ---- Home / Progress / Reflection / Review / Earn ------------------------- */
const READY_LABELS = { resume: 'resume', portfolio: 'portfolio', linkedin: 'LinkedIn profile', github: 'GitHub' };
const READY_ACTIONS = {
  resume: 'open the Resume Studio and add one bullet with a number',
  portfolio: 'open the Portfolio Studio and finish one case study',
  linkedin: 'open the LinkedIn Studio and write your headline',
  github: 'create a GitHub account and publish one project',
};
function weakest(readiness) {
  return ['resume', 'portfolio', 'linkedin', 'github'].reduce((w, k) => readiness[k] < readiness[w] ? k : w, 'resume');
}
export function homeNudge(profile) {
  const r = profile.readiness, w = weakest(r);
  if (r[w] >= 80) return 'You are in great shape across the board. Keep your streak going.';
  return `Your biggest gap right now is your ${READY_LABELS[w]}. The fastest win: ${READY_ACTIONS[w]}.`;
}
export function progressInsight(profile) {
  const r = profile.readiness;
  if (profile.completed === 0) return { strength: 'You are just getting started.', gap: '', action: 'Do today’s mission. One small win.' };
  const strong = ['resume', 'portfolio', 'linkedin', 'github'].reduce((s, k) => r[k] > r[s] ? k : s, 'resume');
  const w = weakest(r);
  const L = { resume: 'Resume', portfolio: 'Portfolio', linkedin: 'LinkedIn', github: 'GitHub' };
  return { strength: `Strongest: your ${L[strong]}.`, gap: `Biggest gap: your ${L[w]}.`, action: `This week, ${READY_ACTIONS[w]}.` };
}
export function reflectionReply(text) {
  const t = (text || '').trim(); if (t.length < 12) return '';
  const low = t.toLowerCase(), words = t.split(/\s+/).length;
  if (/confus|stuck|hard|difficult|don.?t (get|understand)|struggl|lost/.test(low))
    return 'It is okay to find this hard. Note exactly where you got stuck, and that becomes tomorrow’s first small step.';
  if (/proud|great|easy|enjoy|love|fun|good|excit|happy/.test(low))
    return 'Good. Hold on to that feeling. Momentum like this is what carries you through the harder days.';
  if (words < 6) return 'A start. Try one more sentence: what was the hardest part, or what surprised you?';
  return 'Well captured. Writing it down is how today’s work becomes something you can talk about in an interview.';
}
export function weekSummary(profile) {
  const c = profile.completed, s = profile.streak;
  if (c === 0) return 'A fresh page. Pick one mission and make this week count.';
  return `So far you have finished ${c} mission${c === 1 ? '' : 's'}, and you are on a ${s}-day streak. That is real progress. Keep it gentle and steady.`;
}
export function earnPicks(profile) {
  const sk = profile.skills.map(s => s.toLowerCase());
  const hasCAD = sk.some(x => /cad|solidworks|fusion|autocad|3d|model|inventor|catia/.test(x));
  const hasCode = sk.some(x => /python|code|javascript|programming|matlab|script/.test(x));
  if (hasCAD) return 'You listed CAD skills, so the fastest path for you is freelance CAD and 3D modelling on Fiverr or Upwork. Turn a Journey 6 project into a sample, and create one gig this week.';
  if (hasCode) return 'You listed coding skills, so try AI-training tasks on Outlier or DataAnnotation, plus small Python gigs on Upwork.';
  return 'A good first step: AI-training tasks like Remotasks or DataAnnotation. They need no portfolio, just a laptop and consistency. As your skills grow, add freelance gigs.';
}

