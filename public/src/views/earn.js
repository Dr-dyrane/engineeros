/* EngineerOS · Earn while you learn, honest, near-term ways to make money. */

import { EARN } from '../data/earn.js';
import { qs, icon, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader } from '../ui/components.js';
import { userProfile } from '../core/context.js';
import { earnPicks } from '../core/coach.js';

registerView('earn', () => {
  const groups = EARN.map(g => {
    const items = g.items.map(it => html`
      <a class="card tap" href="${it.url}" target="_blank" rel="noopener">
        <div class="row between">
          <div class="ri-t">${it.name}
            ${it.ng ? html`<span class="badge badge-green">${icon('star')} Nigeria</span>` : ''}
            ${it.free ? html`<span class="badge badge-accent">Free to join</span>` : ''}</div>
          <span class="ri-open">${icon('external-link')}</span>
        </div>
        <div class="t-foot text-2 mt-2">${it.desc}</div>
        <div class="t-foot text-3 mt-2"><b style="color:var(--text-2)">Start:</b> ${it.start}</div>
        ${it.pay && it.pay.trim() ? html`<div class="mt-2"><span class="pill">${icon('wallet')} ${it.pay}</span></div>` : ''}
      </a>`);
    return html`<section style="margin-top:var(--s-5)">
      <h3 class="section-label" style="margin-bottom:4px">${g.group}</h3>
      ${g.note ? html`<p class="t-foot text-3" style="margin:0 2px 12px">${g.note}</p>` : ''}
      <div class="auto-grid">${items}</div>
    </section>`;
  });

  qs('#view-earn').innerHTML = html`<div class="stagger">
    ${pageHeader('Money', 'Earn while you learn', 'Real ways to earn as your skills grow, and every gig becomes proof for employers.')}
    <div class="notice notice-accent">${icon('wand-sparkles')} <b>For you.</b> ${earnPicks(userProfile())}</div>
    <div class="notice notice-amber" style="margin-top:var(--s-3)">${icon('shield-alert')} <b>Never pay to get a job or a gig.</b> Real work pays <i>you</i>. If someone asks for money first, walk away.</div>
    ${groups}
    <p class="t-foot text-3 center" style="margin-top:var(--s-6)">Start with one. A little every week adds up.</p>
  </div>`;
});
