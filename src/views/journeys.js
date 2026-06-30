/* EngineerOS · Journeys list + journey detail */

import { JOURNEYS } from '../data/journeys.js';
import { store, isJourneyUnlocked, isMissionUnlocked, journeyComplete } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader, meter, badge } from '../ui/components.js';

registerView('journeys', () => {
  const cards = JOURNEYS.map((j, ji) => {
    const unlocked = isJourneyUnlocked(ji);
    const done = j.missions.filter(m => store.s.completed[m.id]).length;
    const tot = j.missions.length, isDone = done === tot, pct = Math.round(done / tot * 100);
    const chipCls = isDone ? 'chip-green' : unlocked ? 'chip-accent' : 'chip-muted';
    const ic = isDone ? 'check' : unlocked ? j.icon : 'lock';
    const right = isDone ? badge('Complete', 'green', 'check')
      : unlocked ? `<span class="t-foot text-3">${done}/${tot}</span>`
      : `<span class="t-foot text-3 row-tight">${icon('lock')} Locked</span>`;
    return `<div class="card tap" data-action="open-journey" data-value="${ji}" style="${unlocked ? '' : 'opacity:.62'}">
      <div class="row">
        <div class="chip ${chipCls}">${icon(ic)}</div>
        <div class="grow">
          <div class="row between">
            <div class="t-caption fw-bold text-3" style="letter-spacing:.05em">JOURNEY ${ji + 1}</div>
            ${right}
          </div>
          <div class="t-headline" style="margin:2px 0 3px">${esc(j.title)}</div>
          <div class="t-foot text-2">${esc(j.tagline)}</div>
          ${unlocked ? `<div class="mt-3">${meter(pct, isDone ? 'green' : '')}</div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  qs('#view-journeys').innerHTML = `<div class="stagger">
    ${pageHeader('The path', 'Journeys', 'Eight journeys, one at a time. Finish a journey to open the next.')}
    ${cards}
  </div>`;
});

registerView('journey', (ji) => {
  ji = ji == null ? 0 : ji;
  const j = JOURNEYS[ji];
  const root = qs('#view-journey');
  if (!j) { root.innerHTML = '<div class="empty">Not found.</div>'; return; }
  const done = j.missions.filter(m => store.s.completed[m.id]).length;
  const rows = j.missions.map((m, mi) => {
    const unlocked = isMissionUnlocked(ji, mi), isDone = !!store.s.completed[m.id];
    const cls = isDone ? 'chip-green' : unlocked ? 'chip-accent' : 'chip-muted';
    const lead = isDone ? icon('check') : unlocked ? `<span class="fw-heavy">${mi + 1}</span>` : icon('lock');
    return `<div class="list-row ${unlocked ? 'tap' : 'is-muted'}"
      ${unlocked ? `data-action="open-mission" data-value="${m.id}" data-from="journey"` : ''}>
      <div class="chip chip-sm ${cls}">${lead}</div>
      <div class="lt"><div class="t1">${esc(m.title)}</div>
        <div class="t2">${isDone ? 'Complete · ' : ''}${esc(m.time)}${!unlocked ? ' · Locked' : ''}</div></div>
      <span class="chev">${icon(unlocked ? 'chevron-right' : 'lock')}</span>
    </div>`;
  }).join('');

  root.innerHTML = `<div class="stagger">
    <header class="row" style="margin:2px 2px 16px">
      <div class="chip chip-accent" style="width:54px;height:54px">${icon(j.icon)}</div>
      <div><div class="eyebrow">Journey ${ji + 1} · ${done}/${j.missions.length}</div>
        <h1 class="t-title1" style="margin-top:4px">${esc(j.title)}</h1></div>
    </header>
    <div class="notice notice-accent mb-4"><strong>Goal.</strong> ${esc(j.goal)}</div>
    <div class="list">${rows}</div>
  </div>`;
});
