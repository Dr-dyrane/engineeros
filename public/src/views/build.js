/* EngineerOS · Build Studio hub.
   The three builders are their own modules: resume.js, portfolio.js, linkedin.js. */

import { resumeReady, portfolioReady, linkedinReady } from '../core/state.js';
import { qs, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader, meter } from '../ui/components.js';

registerView('build', () => {
  const tiles = [
    ['resume', 'Resume Studio', 'A clean, ATS-friendly resume you can export.', 'amber', resumeReady(), 'file-text'],
    ['portfolio', 'Portfolio Studio', 'Your projects and story, ready to publish.', 'green', portfolioReady(), 'layout-grid'],
    ['linkedin', 'LinkedIn Studio', 'Headline, About, and a first post that lands.', '', linkedinReady(), 'user-round'],
  ].map(([v, t, d, tone, val, ic]) => `
    <div class="card tap" data-action="nav" data-value="${v}">
      <div class="row">
        <div class="chip ${tone ? 'chip-' + tone : 'chip-accent'}">${icon(ic)}</div>
        <div class="grow"><div class="t-headline">${t}</div><div class="t-foot text-3 mt-1">${d}</div></div>
        <span class="chev text-3">${icon('chevron-right')}</span>
      </div>
      <div class="mt-3">${meter(val, tone)}</div>
    </div>`).join('');

  qs('#view-build').innerHTML = `<div class="stagger">
    ${pageHeader('Build Studio', 'Turn work into evidence.', 'Fill a little at a time. Everything exports.')}
    <div class="auto-grid">${tiles}</div>
  </div>`;
});
