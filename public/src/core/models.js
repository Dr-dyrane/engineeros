// @ts-check
/* EngineerOS · Builder models + migrations.
   One place owns the shape of builders.{resume,portfolio,linkedin}.
   Migrations run at state load/import/sync-merge time (see state.js), so
   views can assume the current (v2) shape and never migrate lazily. */

/**
 * @typedef {{role:string, org:string, place:string, start:string, end:string, current:boolean, bullets:string[]}} ExpEntry
 * @typedef {{name:string, tech:string, link:string, bullets:string[]}} ProjEntry
 * @typedef {{degree:string, school:string, place:string, start:string, end:string, detail:string}} EduEntry
 * @typedef {{group:string, items:string}} SkillGroup
 * @typedef {{name:string, issuer:string, year:string}} Cert
 * @typedef {{title:string, link:string, blurb:string}} FeatEntry
 * @typedef {{title:string, role:string, tech:string, link:string, problem:string, approach:string, result:string}} CaseStudy
 * @typedef {{_v:number, name:string, title:string, email:string, phone:string, location:string, linkedin:string, github:string, portfolio:string, summary:string, experience:ExpEntry[], projects:ProjEntry[], education:EduEntry[], skills:SkillGroup[], certifications:Cert[], targetJD:string}} ResumeModel
 * @typedef {{_v:number, name:string, title:string, tagline:string, about:string, email:string, linkedin:string, github:string, website:string, tools:string, education:string, projects:CaseStudy[], skills:SkillGroup[], certifications:Cert[]}} PortfolioModel
 * @typedef {{_v:number, name:string, role:string, headline:string, about:string, skills:string, post:string, featured:FeatEntry[]}} LinkedinModel
 */

/* ---- empty-entry factories ------------------------------------------------ */
/** @returns {ExpEntry} */
export const emptyExp = () => ({ role:'', org:'', place:'', start:'', end:'', current:false, bullets:[''] });
/** @returns {ProjEntry} */
export const emptyProj = () => ({ name:'', tech:'', link:'', bullets:[''] });
/** @returns {EduEntry} */
export const emptyEdu = () => ({ degree:'', school:'', place:'', start:'', end:'', detail:'' });
/** @returns {FeatEntry} */
export const emptyFeat = () => ({ title: '', link: '', blurb: '' });
/** @returns {CaseStudy} */
export const emptyCaseStudy = () => ({ title: '', role: '', tech: '', link: '', problem: '', approach: '', result: '' });

/** @param {unknown} v @returns {string} */
const str = v => (typeof v === 'string' && v.trim()) ? v.trim() : '';

/* ---- per-builder migrations (idempotent, guarded by _v) ------------------- */
/** @param {any} r @returns {ResumeModel} */
export function migrateResume(r) {
  if (r._v === 2) return r;
  const o = Object.assign({}, r);
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
  return r;
}

/** @param {any} p @returns {PortfolioModel} */
export function migratePortfolio(p) {
  if (p._v === 2) return p;
  const o = Object.assign({}, p);
  p.name = o.name || ''; p.title = o.title || ''; p.tagline = o.tagline || '';
  p.about = o.about || ''; p.email = o.email || ''; p.linkedin = o.linkedin || ''; p.github = o.github || ''; p.website = o.website || '';
  p.tools = o.tools || ''; p.education = Array.isArray(o.education) ? '' : str(o.education);
  if (Array.isArray(o.projects)) p.projects = o.projects;
  else {
    const arr = [];
    if (str(o.project)) arr.push(Object.assign(emptyCaseStudy(), { title: 'Final-Year Project', approach: str(o.project) }));
    if (str(o.projects)) arr.push(Object.assign(emptyCaseStudy(), { title: 'Other Projects', approach: str(o.projects) }));
    p.projects = arr;
  }
  p.skills = Array.isArray(o.skills) ? o.skills : (str(o.skills) ? [{ group: 'Skills', items: str(o.skills) }] : []);
  p.certifications = Array.isArray(o.certifications) ? o.certifications : (str(o.certs) ? [{ name: str(o.certs), issuer: '', year: '' }] : []);
  if (!p.projects.length) p.projects.push(emptyCaseStudy());
  if (!p.skills.length) p.skills.push({ group: '', items: '' });
  p._v = 2;
  return p;
}

/** @param {any} l @returns {LinkedinModel} */
export function migrateLinkedin(l) {
  if (l._v === 2) return l;
  const o = Object.assign({}, l);
  l.name = o.name || ''; l.role = o.role || '';
  l.headline = o.headline || ''; l.about = o.about || ''; l.skills = o.skills || ''; l.post = o.post || '';
  l.featured = Array.isArray(o.featured) ? o.featured : (str(o.featured) ? [Object.assign(emptyFeat(), { blurb: str(o.featured) })] : []);
  if (!l.featured.length) l.featured.push(emptyFeat());
  l._v = 2;
  return l;
}

/* Apply every builder migration to a full state object. */
/** @param {any} s */
export function migrateBuilders(s) {
  s.builders = s.builders || {};
  migrateResume(s.builders.resume = s.builders.resume || {});
  migratePortfolio(s.builders.portfolio = s.builders.portfolio || {});
  migrateLinkedin(s.builders.linkedin = s.builders.linkedin || {});
  return s;
}
