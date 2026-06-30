/* EngineerOS · Context layer
   Distils the local state into a compact profile that the deterministic agents
   share. Nothing leaves the device. Agents read this plus a task-specific slice. */

import { store, completedCount, liveStreak, resumeReady, linkedinReady, portfolioReady, githubReady } from './state.js';

const splitSkills = s => (s || '').split(',').map(x => x.trim()).filter(Boolean);

export function userProfile() {
  const s = store.s;
  const r = s.builders.resume || {}, l = s.builders.linkedin || {}, p = s.builders.portfolio || {};
  const skills = [...new Set([
    ...(r.skills || []).flatMap(x => splitSkills(x.items)),
    ...(p.skills || []).flatMap(x => splitSkills(x.items)),
    ...splitSkills(l.skills),
  ])].slice(0, 10);
  return {
    name: (s.user.name || '').split(/\s+/)[0] || '',
    headline: (r.title || l.headline || '').trim(),
    skills,
    readiness: { resume: resumeReady(), portfolio: portfolioReady(), linkedin: linkedinReady(), github: githubReady() },
    completed: completedCount(),
    streak: liveStreak(),
  };
}

/* The lowest-readiness area, the honest "what to work on next" signal. */
export function weakestArea() {
  const p = userProfile().readiness;
  return Object.entries(p).sort((a, b) => a[1] - b[1])[0]; // [name, pct]
}
