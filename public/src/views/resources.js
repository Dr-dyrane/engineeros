/* EngineerOS · Resources, with live search and Nigeria / Free filters. */

import { RESOURCES } from '../data/resources.js';
import { qs, icon, refreshIcons, html } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { registerAction, registerInput } from '../core/actions.js';
import { pageHeader } from '../ui/components.js';

let q = '', filter = 'all';

function matches(it) {
  if (filter === 'ng' && !it.ng) return false;
  if (filter === 'free' && !it.free) return false;
  if (q && !(it.name + ' ' + it.desc).toLowerCase().includes(q)) return false;
  return true;
}
function resultsHTML() {
  let any = false;
  const out = RESOURCES.map(g => {
    const items = g.items.filter(matches);
    if (!items.length) return '';
    any = true;
    const lis = items.map(it => html`
      <a class="res-item" href="${it.url}" target="_blank" rel="noopener">
        <div class="grow"><div class="ri-t">${it.name}
          ${it.ng ? html`<span class="badge badge-green">${icon('star')} Nigeria</span>` : ''}
          ${it.free ? html`<span class="badge badge-accent">Free</span>` : ''}</div>
          <div class="ri-d">${it.desc}</div></div>
        <span class="ri-open">${icon('external-link')}</span></a>`);
    return html`<h3 class="section-label mt-5">${g.group}</h3><div class="auto-grid">${lis}</div>`;
  });
  return any ? html`${out}` : html`<div class="empty" style="padding-top:48px">
    <div class="chip chip-accent" style="margin:0 auto 14px;width:56px;height:56px">${icon('search-x')}</div>
    <p class="t-callout">Nothing matches that. Try another word, or clear the filters.</p></div>`;
}
function paint() { const el = qs('#res-results'); if (el) { el.innerHTML = resultsHTML(); refreshIcons(el); } }
const fchip = (val, label) => html`<button class="filter-chip ${filter === val ? 'is-on' : ''}" data-action="res-filter" data-value="${val}">${label}</button>`;

export function resourceSearch(value) { q = (value || '').trim().toLowerCase(); paint(); }
export function resourceFilter(value) {
  filter = value;
  document.querySelectorAll('#view-resources [data-action="res-filter"]').forEach(b => b.classList.toggle('is-on', b.dataset.value === value));
  paint();
}
registerAction('res-filter', resourceFilter);
registerInput('data-res-search', (p, value) => resourceSearch(value));

registerView('resources', () => {
  qs('#view-resources').innerHTML = html`<div class="stagger">
    ${pageHeader('Curated', 'Resources', 'Global picks, plus a few made for Nigeria.')}
    <input class="input" data-res-search placeholder="Search resources" value="${q}" aria-label="Search resources" />
    <div class="row-tight mt-3" style="gap:8px; flex-wrap:wrap">${fchip('all', 'All')}${fchip('ng', 'Nigeria')}${fchip('free', 'Free')}</div>
    <div id="res-results" class="mt-2"></div>
    <p class="t-foot text-3 center mt-5">Links open in a new tab. If one moves, search its name.</p>
  </div>`;
  paint();
});
