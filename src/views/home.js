/* EngineerOS · Home dashboard */

import { store, todaysMission, totalMissions, completedCount, overallPct,
         liveStreak, resumeReady, linkedinReady, portfolioReady, githubReady, firstName,
         todayStr, yesterdayStr } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { statTile, readyTile } from '../ui/components.js';
import { userProfile } from '../core/context.js';
import { homeNudge } from '../core/coach.js';

registerView('home', () => {
  const tm = todaysMission();
  const total = totalMissions(), done = completedCount();
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const streak = liveStreak();

  // A calm streak nudge: only once there is something to protect, and a mission left to do.
  let streakBanner = '';
  if (done > 0 && tm) {
    const last = store.s.streak.last;
    if (last === yesterdayStr()) streakBanner = `<div class="notice notice-amber">${icon('flame')} <b>${streak}-day streak.</b> Finish today’s mission to keep it alive.</div>`;
    else if (last !== todayStr()) streakBanner = `<div class="notice notice-accent">${icon('sparkles')} <b>Welcome back.</b> One mission today restarts your streak.</div>`;
  }

  let todayCard;
  if (tm) {
    todayCard = `
      <div class="card tap" data-action="open-mission" data-value="${tm.m.id}" data-from="home"
           style="background:linear-gradient(180deg, color-mix(in srgb,var(--amber) 14%,transparent), var(--surface-1))">
        <div class="row between mb-4">
          <span class="badge badge-amber">${icon('sparkles')} Today’s mission</span>
          <span class="pill">${esc(tm.m.time)}</span>
        </div>
        <div class="t-foot fw-bold" style="color:var(--amber); letter-spacing:.03em; text-transform:uppercase">${esc(tm.j.title)}</div>
        <h2 class="t-title1" style="margin:4px 0 8px">${esc(tm.m.title)}</h2>
        <p class="t-callout text-2">${esc(tm.m.why.split('. ')[0])}.</p>
        <button class="btn btn-amber mt-4" data-action="open-mission" data-value="${tm.m.id}" data-from="home">Start today’s win ${icon('arrow-right')}</button>
      </div>`;
  } else if (total > 0) {
    todayCard = `
      <div class="card center" style="background:linear-gradient(180deg, color-mix(in srgb,var(--green) 15%,transparent), var(--surface-1))">
        <div class="chip chip-green" style="margin:0 auto 12px; width:54px; height:54px">${icon('check')}</div>
        <h2 class="t-title1">Every mission complete.</h2>
        <p class="t-callout text-2 mt-2">You built a real body of work. Revisit anything, or polish your portfolio.</p>
        <button class="btn btn-primary mt-4" data-action="nav" data-value="build">Open Build Studio</button>
      </div>`;
  } else {
    todayCard = `<div class="empty">${'<div class="chip chip-accent">'+icon('sparkles')+'</div>'}<p>Your missions are loading.</p></div>`;
  }

  qs('#view-home').innerHTML = `
    <div class="stagger">
      <header style="margin:2px 2px 14px">
        <div class="eyebrow">${esc(greet)}</div>
        <h1 class="t-display" style="margin-top:6px">${esc(firstName())}.</h1>
      </header>
      ${streakBanner}
      <div class="home-grid">
        <div class="stack">
          ${todayCard}
          <div class="card tap" data-action="nav" data-value="earn"
               style="background:linear-gradient(180deg, color-mix(in srgb,var(--green) 14%, transparent), var(--surface-1))">
            <div class="row">
              <div class="chip chip-green">${icon('wallet')}</div>
              <div class="grow"><div class="t-headline">Earn while you learn</div>
                <div class="t-foot text-2 mt-1">Real ways to make money as your skills grow: freelance gigs, AI tasks, and paid internships.</div></div>
              <span class="chev text-3">${icon('chevron-right')}</span>
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="grid-3">
            ${statTile(overallPct() + '<span style="font-size:15px">%</span>', 'Progress')}
            ${statTile(done, 'Missions done')}
            ${statTile(streak + (streak > 0 ? ' 🔥' : ''), 'Day streak')}
          </div>
          <div class="notice notice-accent">${esc(homeNudge(userProfile()))}</div>
          <div>
            <h3 class="section-label" style="margin-top:2px">Your readiness</h3>
            <div class="grid-2">
              ${readyTile('Resume', resumeReady(), 'amber')}
              ${readyTile('LinkedIn', linkedinReady(), '')}
              ${readyTile('Portfolio', portfolioReady(), 'green')}
              ${readyTile('GitHub', githubReady(), '')}
            </div>
          </div>
          <div class="card tap" data-action="open-progress">
            <div class="row between">
              <div><div class="fw-semibold">See your full progress</div><div class="t-foot text-3">Journeys, streak and milestones</div></div>
              <span class="chev text-3">${icon('chevron-right')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
});
