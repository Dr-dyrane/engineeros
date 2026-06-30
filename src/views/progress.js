/* EngineerOS · Progress */

import { JOURNEYS } from '../data/journeys.js';
import { store, totalMissions, completedCount, overallPct, liveStreak, journeyComplete, journeysDone } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { ring, statTile, meter, pageHeader } from '../ui/components.js';

registerView('progress', () => {
  const total = totalMissions(), done = completedCount();
  const jlist = JOURNEYS.map((j, ji) => {
    const d = j.missions.filter(m => store.s.completed[m.id]).length, t = j.missions.length;
    const p = t ? Math.round(d / t * 100) : 0, full = t > 0 && d === t;
    return `<div class="list-row">
      <div class="chip chip-sm ${full ? 'chip-green' : d > 0 ? 'chip-accent' : ''}">${icon(full ? 'check' : j.icon)}</div>
      <div class="lt"><div class="t1" style="font-size:15px">${esc(j.title)}</div>
        <div class="mt-2">${meter(p, full ? 'green' : '')}</div></div>
      <div class="t-foot fw-bold">${d}/${t}</div>
    </div>`;
  }).join('');

  qs('#view-progress').innerHTML = `<div class="stagger">
    ${pageHeader('Your progress', 'Look how far you’ve come.')}
    <div class="card center"><div style="display:grid;place-items:center;padding:6px 0">${ring(overallPct(), 132)}</div>
      <div class="t-foot text-3">${done} of ${total} missions</div></div>
    <div class="grid-3 mt-4">
      ${statTile(liveStreak(), 'Current streak')}
      ${statTile(store.s.streak.best || 0, 'Best streak')}
      ${statTile(journeysDone(), 'Journeys done')}
    </div>
    <h3 class="section-label mt-6">By journey</h3>
    <div class="list">${jlist}</div>
  </div>`;
});
