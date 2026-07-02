/* EngineerOS · Home. One intent: today's mission.
   The hero carries the screen's only filled CTA; every other destination is a
   quiet row. Stats and readiness live in Progress, where reflection belongs. */

import { store, todaysMission, totalMissions, completedCount, overallPct,
         liveStreak, firstName, todayStr, yesterdayStr } from '../core/state.js';
import { qs, icon, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { chip, listRow } from '../ui/components.js';
import { userProfile } from '../core/context.js';
import { homeNudge } from '../core/coach.js';

registerView('home', () => {
  const tm = todaysMission();
  const total = totalMissions(), done = completedCount();
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const streak = liveStreak();

  // One voice above the hero: the streak stakes when they exist, else the coach.
  let banner = '';
  if (done > 0 && tm) {
    const last = store.s.streak.last;
    if (last === yesterdayStr()) banner = html`<div class="notice notice-amber">${icon('flame')} <b>${streak}-day streak.</b> Finish today’s mission to keep it alive.</div>`;
    else if (last !== todayStr()) banner = html`<div class="notice notice-accent">${icon('sparkles')} <b>Welcome back.</b> One mission today restarts your streak.</div>`;
  }
  if (!banner) banner = html`<div class="notice notice-accent">${homeNudge(userProfile())}</div>`;

  let hero;
  if (tm) {
    hero = html`
      <div class="card tap" data-action="open-mission" data-value="${tm.m.id}" data-from="home"
           style="background:linear-gradient(180deg, color-mix(in srgb,var(--amber) 14%,transparent), var(--surface-1))">
        <div class="row between mb-4">
          <span class="badge badge-amber">${icon('sparkles')} Today’s mission</span>
          <span class="pill">${tm.m.time}</span>
        </div>
        <div class="t-foot fw-bold" style="color:var(--amber); letter-spacing:.03em; text-transform:uppercase">${tm.j.title}</div>
        <h2 class="t-title1" style="margin:4px 0 8px">${tm.m.title}</h2>
        <p class="t-callout text-2">${tm.m.why.split('. ')[0]}.</p>
        <button class="btn btn-amber mt-4" data-action="open-mission" data-value="${tm.m.id}" data-from="home">Start today’s win ${icon('arrow-right')}</button>
      </div>`;
  } else if (total > 0) {
    hero = html`
      <div class="card center" style="background:linear-gradient(180deg, color-mix(in srgb,var(--green) 15%,transparent), var(--surface-1))">
        <div class="chip chip-green" style="margin:0 auto 12px; width:54px; height:54px">${icon('check')}</div>
        <h2 class="t-title1">Every mission complete.</h2>
        <p class="t-callout text-2 mt-2">You built a real body of work. Revisit anything, or polish your portfolio.</p>
        <button class="btn btn-primary mt-4" data-action="nav" data-value="build">Open Build Studio</button>
      </div>`;
  } else {
    hero = html`<div class="empty"><div class="chip chip-accent">${icon('sparkles')}</div><p>Your missions are loading.</p></div>`;
  }

  qs('#view-home').innerHTML = html`
    <div class="stagger">
      <header style="margin:2px 2px 14px">
        <div class="eyebrow">${greet}</div>
        <h1 class="t-display" style="margin-top:6px">${firstName()}.</h1>
      </header>
      ${banner}
      ${hero}
      <div class="list" style="margin-top:var(--s-6)">
        ${listRow({ leading: chip('wallet', 'chip-green'), t1: 'Earn while you learn', t2: 'Gigs, AI tasks, paid internships', action: 'nav', value: 'earn' })}
        ${listRow({ leading: chip('rocket', 'chip-accent'), t1: 'Career Launchpad', t2: 'Applications and interview prep', action: 'nav', value: 'launchpad' })}
        ${listRow({ leading: chip('compass', 'chip-accent'), t1: 'Your progress', t2: overallPct() + '% complete · ' + done + ' missions · ' + streak + '-day streak', action: 'open-progress' })}
      </div>
    </div>`;
});
