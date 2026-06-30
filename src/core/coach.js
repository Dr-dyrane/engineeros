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
