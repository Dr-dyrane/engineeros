/* EngineerOS · Earn while you learn, honest, near-term ways to make money. */

import { EARN } from '../data/earn.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader } from '../ui/components.js';

registerView('earn', () => {
  const groups = EARN.map(g => {
    const items = g.items.map(it => `
      <a class="card tap" href="${esc(it.url)}" target="_blank" rel="noopener">
        <div class="row between">
          <div class="ri-t">${esc(it.name)}
            ${it.ng ? `<span class="badge badge-green">${icon('star')} Nigeria</span>` : ''}
            ${it.free ? `<span class="badge badge-accent">Free to join</span>` : ''}</div>
          <span class="ri-open">${icon('external-link')}</span>
        </div>
        <div class="t-foot text-2 mt-2">${esc(it.desc)}</div>
        <div class="t-foot text-3 mt-2"><b style="color:var(--text-2)">Start:</b> ${esc(it.start)}</div>
        ${it.pay && it.pay.trim() ? `<div class="mt-2"><span class="pill">${icon('wallet')} ${esc(it.pay)}</span></div>` : ''}
      </a>`).join('');
    return `<section style="margin-top:var(--s-5)">
      <h3 class="section-label" style="margin-bottom:4px">${esc(g.group)}</h3>
      ${g.note ? `<p class="t-foot text-3" style="margin:0 2px 12px">${esc(g.note)}</p>` : ''}
      <div class="auto-grid">${items}</div>
    </section>`;
  }).join('');

  qs('#view-earn').innerHTML = `<div class="stagger">
    ${pageHeader('Money', 'Earn while you learn', 'Real ways to earn as you build your skills. The early money is modest, but it is real. It grows with you, and every gig becomes proof for employers.')}
    <div class="notice notice-amber">${icon('shield-alert')} <b>Never pay to get a job or a gig.</b> Real work pays <i>you</i>. If someone asks you to pay first, or it sounds too good to be true, walk away.</div>
    ${groups}
    <p class="t-foot text-3 center" style="margin-top:var(--s-6)">Start with one. Consistency beats intensity. A little every week adds up.</p>
  </div>`;
});
