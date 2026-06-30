/* EngineerOS · Resources */

import { RESOURCES } from '../data/resources.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader } from '../ui/components.js';

registerView('resources', () => {
  const groups = RESOURCES.map(g => {
    const items = g.items.map(it => `
      <a class="res-item" href="${esc(it.url)}" target="_blank" rel="noopener">
        <div class="grow">
          <div class="ri-t">${esc(it.name)}
            ${it.ng ? `<span class="badge badge-green">${icon('star')} Nigeria</span>` : ''}
            ${it.free ? `<span class="badge badge-accent">Free</span>` : ''}</div>
          <div class="ri-d">${esc(it.desc)}</div>
        </div>
        <span class="ri-open">${icon('external-link')}</span>
      </a>`).join('');
    return `<h3 class="section-label mt-5">${esc(g.group)}</h3><div class="list">${items}</div>`;
  }).join('');

  qs('#view-resources').innerHTML = `<div class="stagger">
    ${pageHeader('Curated', 'Resources', 'Real tools and platforms — global picks plus a few made for Nigeria. Always verify what AI tells you.')}
    ${groups}
    <p class="t-foot text-3 center mt-5">Links open in a new tab. Some sites change — if one moves, search its name.</p>
  </div>`;
});
