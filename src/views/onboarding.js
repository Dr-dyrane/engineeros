/* EngineerOS · Onboarding views — welcome + setup */

import { store } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';

registerView('welcome', () => {
  qs('#view-welcome').innerHTML = `
    <div class="hero stagger">
      <div class="logo-mark">${icon('compass')}</div>
      <div>
        <div class="eyebrow">Dyrane Academy</div>
        <h1 class="t-display" style="margin-top:8px">Welcome to<br>EngineerOS.</h1>
      </div>
      <p class="t-title2 text-2 fw-medium balance" style="max-width:24ch">A calm, self-guided career system for becoming visible, skilled, and employable.</p>
      <div class="card">
        <div class="row">
          ${'<div class="chip chip-accent">' + icon('sparkles') + '</div>'}
          <div><div class="fw-semibold">One mission at a time</div><div class="t-foot text-3">One day. One mission. One visible win.</div></div>
        </div>
      </div>
      <div>
        <button class="btn btn-primary" data-action="to-setup">Let’s begin ${icon('arrow-right')}</button>
        <p class="t-foot text-3 center mt-3">No account. No pressure. Everything saves on this device.</p>
      </div>
    </div>`;
});

registerView('setup', () => {
  qs('#view-setup').innerHTML = `
    <div class="hero stagger">
      <div>
        <div class="eyebrow">Setup</div>
        <h1 class="t-display" style="margin-top:8px">What should we<br>call you?</h1>
        <p class="t-title2 text-2 fw-medium mt-3">Just a first name is perfect.</p>
      </div>
      <div class="field">
        <input class="input" id="nameInput" placeholder="Your name" autocomplete="given-name"
          value="${esc(store.s.user.name)}" style="font-size:19px; padding:16px" />
      </div>
      <div class="field">
        <label>Appearance</label>
        <div class="segmented" id="setupTheme">
          <button data-theme-set="system" class="${store.s.theme==='system'?'is-on':''}">System</button>
          <button data-theme-set="light" class="${store.s.theme==='light'?'is-on':''}">Light</button>
          <button data-theme-set="dark" class="${store.s.theme==='dark'?'is-on':''}">Dark</button>
        </div>
      </div>
      <button class="btn btn-primary" data-action="finish-setup">Start my journey ${icon('arrow-right')}</button>
    </div>`;
  setTimeout(() => { const n = qs('#nameInput'); if (n) n.focus(); }, 120);
});
