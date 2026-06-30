/* EngineerOS · Settings */

import { store } from '../core/state.js';
import { qs, esc, icon } from '../core/dom.js';
import { registerView } from '../core/router.js';
import { pageHeader } from '../ui/components.js';

export function renderSettings() {
  qs('#view-settings').innerHTML = `<div class="stagger">
    ${pageHeader('Settings', 'Your system')}

    <div class="card">
      <div class="field"><label>Your name</label>
        <input class="input" id="set-name" value="${esc(store.s.user.name)}" placeholder="Your name" /></div>
      <div class="field" style="margin-bottom:0"><label>Appearance</label>
        <div class="segmented" id="set-theme">
          <button data-theme-set="system" class="${store.s.theme==='system'?'is-on':''}">System</button>
          <button data-theme-set="light" class="${store.s.theme==='light'?'is-on':''}">Light</button>
          <button data-theme-set="dark" class="${store.s.theme==='dark'?'is-on':''}">Dark</button>
        </div></div>
    </div>

    <div class="card">
      <div class="row between">
        <div class="grow"><div class="fw-semibold">Free navigation</div>
          <div class="t-foot text-3">Unlock every journey and mission now, instead of one step at a time.</div></div>
        <button class="switch ${store.s.freeNav ? 'is-on' : ''}" data-action="toggle-freenav" aria-label="Toggle free navigation">
          <span class="knob"></span>
        </button>
      </div>
    </div>

    <h3 class="section-label mt-5">Your data</h3>
    <div class="card">
      <button class="btn btn-ghost" data-action="export-json">${icon('download')} Export progress (JSON)</button>
      <button class="btn btn-ghost mt-3" data-action="import-json">${icon('upload')} Import progress (JSON)</button>
      <button class="btn btn-ghost mt-3" data-action="reset" style="color:var(--red)">${icon('trash-2')} Reset everything</button>
      <p class="t-foot text-3 mt-3">Everything lives only on this device. Export a backup before switching phones or browsers.</p>
    </div>

    <p class="t-foot text-3 center mt-5">EngineerOS v1.0 · Dyrane Academy<br>One mission at a time.</p>
  </div>`;
}
registerView('settings', renderSettings);
